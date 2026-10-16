#!/usr/bin/env python3
"""Read-only agent reconstruction, example/coverage checks and publication-boundary checks.
This emits verification evidence, never an alternate agent contract or API invocation.
"""
import json
import re
import shlex
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from jsonschema import Draft202012Validator, FormatChecker

TOOL = Path(__file__).resolve().parent
ROOT = TOOL.parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from v2_oas import (COMMON, Contracts, implemented_v2_operations, normalized_route,
                    without_documentation)
from build import ALLOWLIST, SECURITY_PROSE


def main():
    output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else TOOL / 'dist'
    contracts = Contracts(); contracts.validate_structure()
    operations = contracts.operations()
    assert implemented_v2_operations() == {(m, normalized_route(p)) for m, p in operations}
    report = []; examples = 0
    for name, current in contracts.documents.items():
        raw = subprocess.check_output(['git', 'show', '450106a:docs/contracts/' + name], cwd=ROOT, text=True)
        import yaml
        baseline = json.loads(raw) if name.endswith('.json') else yaml.safe_load(raw)
        assert without_documentation(baseline) == without_documentation(current), 'Wire contract changed: ' + name
    for (method, path), (op, item, name) in operations.items():
        assert op['operationId'] and op['tags'] and op['summary'] != op['operationId']
        assert op['security'] == [{'bearerAuth': []}]
        target = op['externalDocs']['url'].split('/blob/main/', 1)[1]
        assert (ROOT / target).is_file() and (ROOT / target).stat().st_size > 0
        params = item.get('parameters', []) + op.get('parameters', [])
        for parameter in params:
            if 'example' in parameter:
                contracts.validator(parameter['schema'], name).validate(parameter['example'])
        for content in op.get('requestBody', {}).get('content', {}).values():
            assert 'example' in content
            contracts.validator(content['schema'], name).validate(content['example']); examples += 1
        responses = {}
        for status in op['responses']:
            response, owner = contracts.response(method, path, status)
            responses[status] = dict(headers=response.get('headers', {}), content=response.get('content', {}))
            for media, content in response.get('content', {}).items():
                assert content.get('examples'), (method, path, status, media)
                for example in content['examples'].values():
                    contracts.validator(content['schema'], owner).validate(example['value']); examples += 1
                    if media == 'application/problem+json':
                        assert example['value']['status'] == int(status)
        code = op['x-codeSamples'][0]['source']
        assert 'https://api.example.invalid/v2/' in code and 'Authorization' not in code
        # Parse templates as data; never execute cURL or contact an API.
        words = shlex.split(code.replace('\\\n', ''))
        assert words[words.index('--request') + 1] == method
        uri = urlparse(next(word for word in words if word.startswith('https://')))
        values = {('query', key): value[0] for key, value in parse_qs(uri.query).items()}
        for expected, actual in zip(path.split('/'), uri.path.split('/')):
            if expected.startswith('{'): values[('path', expected[1:-1])] = actual
            else: assert expected == actual
        request_headers = {}
        for index, word in enumerate(words):
            if word == '--header':
                key, value = words[index + 1].split(':', 1)
                request_headers[key] = value.strip(); values[('header', key)] = value.strip()
        contracts.validate_parameters(method, path, values)
        if '--data-raw' in words:
            media = request_headers['Content-Type']; data = words[words.index('--data-raw') + 1]
            if media == 'application/json': data = json.loads(data)
            contracts.validator(op['requestBody']['content'][media]['schema'], name).validate(data)
        report.append(dict(method=method, path=path, operationId=op['operationId'],
                           source='docs/contracts/' + name, parameters=params,
                           requestBody=op.get('requestBody'), responses=responses,
                           security=op['security'], requiredGrants=op.get('x-required-grants', []),
                           domainContract=target, semantics=op['description']))
    identifiers = [op['operationId'] for op in report]
    assert len(identifiers) == len(set(identifiers))
    by_id = {op['operationId']: op for op in report}
    assert 'never acquire' in by_id['listHeldDirectQuotes']['semantics']
    assert 'not fulfillment' in by_id['acquireDirectQuotes']['semantics']
    assert 'Lifetime coverage remains UNKNOWN' in by_id['readAccountTransactions']['semantics']
    assert 'collection-wide single-instant snapshot' in by_id['listHeldDirectQuotes']['semantics']
    entry = (ROOT / 'docs/api-v2/README.md').read_text()
    assert 'does not authorize an agent to invoke' in entry
    assert 'explicit grants' in entry and 'Administrator' in entry
    internal = json.loads((output / 'private/bundled-internal.json').read_text())
    public = json.loads((output / 'private/public-projection.json').read_text())
    assert without_documentation(internal['components']['schemas']) == without_documentation(public['components']['schemas'])
    assert internal['info']['version'] == public['info']['version']
    assert internal['components']['securitySchemes'] and 'securitySchemes' not in public['components']
    assert set(internal['paths']) == set(public['paths'])
    def resolved(value):
        while '$ref' in value:
            reference = value['$ref']; assert reference.startswith('#/')
            value = internal
            for key in reference[2:].split('/'):
                value = value[key.replace('~1', '/').replace('~0', '~')]
        return value
    for item in internal['paths'].values():
        for method, op in item.items():
            if method not in {'get', 'post'}: continue
            for response in op['responses'].values():
                for content in resolved(response).get('content', {}).values():
                    validator = Draft202012Validator(dict(content['schema'], components=internal['components']),
                                                      format_checker=FormatChecker())
                    for example in content['examples'].values(): validator.validate(example['value'])
    # Regressions from Kiro's accepted black-box findings: public filtering must
    # preserve provenance/policy/format meaning, not just the wire constraints.
    provenance = public['components']['schemas']['QuoteProvenance']['properties']['authorityEpoch']
    assert 'opaque' in provenance['description'].lower() and 'fencing identifier' in provenance['description']
    assert 'not a timestamp' in provenance['description']
    quote = public['paths']['/v2/quotes']['post']['description']
    assert 'FORCE bypasses reuse, not provider-contact restrictions' in quote
    assert 'CONTACT_NOT_PERMITTED means policy prevented contact' in quote
    assert 'UPSTREAM_UNAVAILABLE means the upstream source is unavailable' in quote
    upload = public['paths']['/v2/artifacts']['post']['description']
    for meaning in ('POSITIONS', 'ACTIVITY', 'BALANCES', 'OPTION_SUMMARY',
                    'Account number; Account name; Investment type',
                    'Run Date; Action; Symbol; Amount ($)', 'Balance; Day change',
                    'Symbol; Strategy; Expiration & Strike; Quantity',
                    'Date downloaded MMM-dd-yyyy', 'History_for_Account_',
                    'Balances_for_Account_', 'Option Summary {broker-account}',
                    '422 before source retention', 'HTTP 200 with status REJECTED',
                    'prior admitted evidence remains intact'):
        assert meaning in upload, meaning
    public_ids = []
    for path, item in public['paths'].items():
        for method, op in item.items():
            if method not in {'get', 'post'}: continue
            public_ids.append(op['operationId'])
            assert 'security' not in op and 'x-required-grants' not in op
            original = internal['paths'][path][method]
            expected = {k: v for k, v in original.items() if k not in {'security', 'x-required-grants'}}
            assert without_documentation(expected) == without_documentation(op)
    assert sorted(public_ids) == sorted(identifiers)
    def descriptions(value):
        if isinstance(value, list):
            for item in value: descriptions(item)
        elif isinstance(value, dict):
            for key, item in value.items():
                if key == 'description' and isinstance(item, str):
                    assert not SECURITY_PROSE.search(item), item
                descriptions(item)
    # The public introduction discusses HTTP errors without execution instructions.
    overview = public['info']['description']
    assert 'never sends API requests' in overview
    descriptions(public)
    site = output / 'site'
    assert {p.name for p in site.iterdir()} == ALLOWLIST
    html = (site / 'index.html').read_text()
    assert not re.findall(r'<script[^>]+src=["\']https?://', html)
    assert not re.findall(r'<link[^>]+href=["\']https?://', html)
    assert 'https://fonts.googleapis.com' not in html
    assert '<form' not in html.lower() and 'type="password"' not in html.lower()
    manifest = json.loads((output / 'private/provenance.json').read_text())
    assert manifest['sourceCommit'] not in html
    assert str(ROOT) not in html, 'Local path leaked into generated HTML'
    for filename, expected in manifest['publicFiles'].items():
        from build import digest
        assert digest(site / filename) == expected
    result = dict(mode='READ_ONLY_REPOSITORY_OAS_AND_LINKED_CONTRACTS', independentReview='PENDING',
                  operationCount=len(report), validatedExamples=examples, operations=report,
                  authorityBoundary='OAS availability and grants do not establish Principal/task execution permission.',
                  noNetworkOrOperationalMutation=True)
    (output / 'private/agent-specimen.json').write_text(json.dumps(result, indent=2) + '\n')
    print(f'PASS: agent reconstruction of {len(report)} operations; {examples} examples; unchanged wire/security authority; public projection/allowlist')


if __name__ == '__main__':
    main()
