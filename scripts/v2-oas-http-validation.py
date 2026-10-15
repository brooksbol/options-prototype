#!/usr/bin/env python3
"""Exercise Step 1 against the existing integratedUpdateFixture only.
Usage: python scripts/v2-oas-http-validation.py READY_JSON OUTPUT_JSON
The fixture owns a disposable DB and loopback synthetic providers; no Downloads writes.
"""
import json
import re
import sqlite3
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import HTTPRedirectHandler, Request, build_opener

from v2_oas import Contracts


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def main():
    ready, output = map(Path, sys.argv[1:])
    config = json.loads(ready.read_text())
    if config.get('fixture') != 'integrated-update-v1' or not re.fullmatch(r'http://127\.0\.0\.1:[0-9]+', config['base']):
        raise ValueError('Only the explicit loopback integrated-update-v1 fixture is supported')
    contracts = Contracts()
    opener = build_opener(NoRedirect())
    samples = []
    correlation = '11111111-1111-4111-8111-111111111111'

    def call(method, actual_path, contract_path, status=200, body=None, extra=None, authenticated=True, media=None):
        headers = {'X-Request-Id': correlation}
        if authenticated:
            headers['Authorization'] = 'Bearer ' + config['token']
        headers.update(extra or {})
        request = Request(config['base'] + actual_path, data=body, headers=headers, method=method)
        try:
            reply = opener.open(request, timeout=15)
        except HTTPError as error:
            reply = error
        with reply:
            if reply.status != status:
                raise ValueError(f'{method} {contract_path}: expected HTTP {status}, got {reply.status}')
            response_headers = dict(reply.headers.items())
            raw = reply.read()
        payload = raw.decode('utf-8') if media == 'text/csv' else json.loads(raw)
        contracts.validate_response(method, contract_path, status, payload, response_headers, media)
        samples.append(dict(method=method, path=contract_path, status=status,
                            headers=response_headers, payload=payload))
        return payload

    accounts = call('GET', '/v2/accounts', '/v2/accounts')['accounts']
    fidelity = next(a['id'] for a in accounts if a['alias'] == 'pts')
    tastytrade = next(a['id'] for a in accounts if a['alias'] == 'tt1')
    upload = '/v2/artifacts?accountId=' + fidelity
    source = next(f for f in config['sourceFiles'] if f['name'].startswith('History_'))
    csv = source['content'].encode('utf-8')
    complete_headers = {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="' + source['name'] + '"',
                        'X-Brokerage-File-Type': 'ACTIVITY'}
    # #41: OAS-only old request, each individual missing header, malformed filename/type.
    for omitted in [('Content-Disposition', 'X-Brokerage-File-Type'), ('Content-Disposition',), ('X-Brokerage-File-Type',)]:
        headers = {k: v for k, v in complete_headers.items() if k not in omitted}
        call('POST', upload, '/v2/artifacts', 422, csv, headers)
    for key, value in [('Content-Disposition', 'attachment'), ('Content-Disposition', 'attachment; filename="../unsafe.csv"'),
                       ('X-Brokerage-File-Type', 'API_POSITIONS'), ('X-Brokerage-File-Type', 'API_TRANSACTIONS')]:
        headers = dict(complete_headers); headers[key] = value
        call('POST', upload, '/v2/artifacts', 422, csv, headers)
    result = call('POST', upload, '/v2/artifacts', body=csv, extra=complete_headers)
    if result['status'] != 'ACCEPTED':
        raise ValueError('Synthetic CSV should be admitted')
    artifact_path = '/v2/artifacts/' + result['artifactId']
    call('GET', artifact_path, '/v2/artifacts/{artifactId}')
    inventory = call('GET', '/v2/artifacts?accountId=' + fidelity, '/v2/artifacts')
    if len(inventory['artifacts']) != 1:
        raise ValueError('Rejected upload headers must not retain any source')
    content = call('GET', artifact_path + '/content', '/v2/artifacts/{artifactId}/content', media='text/csv')
    if content.encode('utf-8') != csv:
        raise ValueError('Original source bytes changed')
    call('POST', artifact_path + '/imports', '/v2/artifacts/{artifactId}/imports')
    for account in [fidelity, tastytrade]:
        path = '/v2/accounts/' + account + '/transactions'
        history = call('GET', path, '/v2/accounts/{accountId}/transactions')
        call('GET', path + '/' + history['transactions'][0]['transactionId'],
             '/v2/accounts/{accountId}/transactions/{transactionId}')
        call('GET', path, '/v2/accounts/{accountId}/transactions', 401, authenticated=False)
        call('GET', path + '?limit=1', '/v2/accounts/{accountId}/transactions', 422)
    # #40: obtain real JSON metadata from this disposable fixture, not a mocked DTO.
    acquisition = call('POST', '/v2/position-acquisitions?accountId=' + tastytrade,
                       '/v2/position-acquisitions')
    if acquisition['status'] != 'ACCEPTED':
        raise ValueError('Synthetic holdings should be admitted')
    user = call('GET', '/v2/me', '/v2/me')['user']
    database = ready.resolve().parent / 'fixture.sqlite3'
    with sqlite3.connect(database.as_uri() + '?mode=rw', uri=True) as db:
        if db.execute('SELECT bootstrap_subject FROM v2_user WHERE user_id=?', (user['id'],)).fetchone() != ('integrated-fixture',):
            raise ValueError('Disposable fixture identity required before test-only grant setup')
        old = db.execute('SELECT artifacts_read FROM v2_user_account WHERE user_id=? AND account_id=?',
                         (user['id'], tastytrade)).fetchone()
        if old is None:
            raise ValueError('Expected existing fixture Account grant row')
        db.execute('UPDATE v2_user_account SET artifacts_read=1 WHERE user_id=? AND account_id=?',
                   (user['id'], tastytrade))
    try:
        inventory = call('GET', '/v2/artifacts?accountId=' + tastytrade, '/v2/artifacts')
        types = set()
        for value in inventory['artifacts']:
            if value['contentType'] != 'application/json':
                raise ValueError('Backend-acquired sources must retain JSON media type')
            types.update(attempt['fileType'] for attempt in value['imports'])
            call('GET', '/v2/artifacts/' + value['artifactId'], '/v2/artifacts/{artifactId}')
        if not {'API_POSITIONS', 'API_TRANSACTIONS'}.issubset(types):
            raise ValueError('Both accepted JSON source types must be exercised')
        transaction_source = next(value for value in inventory['artifacts']
                                  if value['imports'][0]['fileType'] == 'API_TRANSACTIONS')
        call('GET', '/v2/artifacts/' + transaction_source['artifactId'] + '/content',
             '/v2/artifacts/{artifactId}/content', 403)
    finally:
        with sqlite3.connect(database.as_uri() + '?mode=rw', uri=True) as db:
            db.execute('UPDATE v2_user_account SET artifacts_read=? WHERE user_id=? AND account_id=?',
                       (old[0], user['id'], tastytrade))
    selection_path = '/v2/market-evidence-subjects'
    call('GET', selection_path, selection_path)
    call('GET', selection_path, selection_path, extra={'X-Request-Id': ' ' + correlation + ' '})
    call('GET', selection_path, selection_path, extra={'X-Request-Id': ''})
    call('GET', selection_path, selection_path, 422, extra={'X-Request-Id': 'invalid'})
    call('GET', selection_path, selection_path, 401, authenticated=False)
    call('GET', selection_path, selection_path, 403, extra={'Authorization': 'Bearer read-only'})
    call('POST', '/v2/quotes', '/v2/quotes', 415, b'{}', {'Content-Type': 'text/plain'})
    call('POST', '/v2/quotes', '/v2/quotes', 422, b'{"subjects":[]}', {'Content-Type': 'application/json'})
    output.write_text(json.dumps(samples, indent=2) + '\n')
    print(f'PASS: {len(samples)} actual synthetic HTTP specimens, JSON metadata, upload retention, history, correlation and headers')


if __name__ == '__main__':
    main()
