#!/usr/bin/env python3
"""Synthetic Step 1 regression specimens. Never contacts a service or provider.
Run with engineer-local PyYAML, jsonschema and openapi-spec-validator.
"""
import unittest

from jsonschema import ValidationError
from v2_oas import (ACCOUNT, COMMON, SELECTION, Contracts, assert_preserved_quote_contract,
                    implemented_v2_operations, normalized_route)

UUID = '11111111-1111-4111-8111-111111111111'
ACCOUNT_ID = 'acct_' + 'a' * 32
ERRORS = {
    400: ('MALFORMED_REQUEST', 'Malformed request'),
    401: ('UNAUTHENTICATED', 'Unauthenticated'),
    403: ('FORBIDDEN', 'Forbidden'),
    404: ('NOT_FOUND', 'Not found'),
    415: ('UNSUPPORTED_MEDIA_TYPE', 'Unsupported media type'),
    422: ('INVALID_REQUEST', 'Invalid request'),
    500: ('INTERNAL_ERROR', 'Internal error'),
    503: ('CAPABILITY_UNAVAILABLE', 'Capability unavailable'),
}


def problem(status):
    code, title = ERRORS[status]
    value = dict(type='urn:wheelwright:problem:' + code.lower(), title=title,
                 status=status, code=code, requestId=UUID)
    if status == 422:
        value['invalidParams'] = [dict(name='request', reason='Synthetic invalid input')]
    return value


def artifact(file_type, content_type, import_id=UUID):
    return dict(artifactId=UUID, accountId=ACCOUNT_ID, sha256='a' * 64,
                contentType=content_type, sizeBytes=2, receivedAt='2026-10-15T20:00:00Z',
                imports=[dict(importId=import_id, originalFilename='synthetic-source.json',
                              fileType=file_type, importedAt='2026-10-15T20:00:00Z',
                              status='ACCEPTED', result='Synthetic admission', sourcePeriod=None)])


class ContractConformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.contracts = Contracts()

    def test_structure_references_and_independent_v2_inventory(self):
        self.contracts.validate_structure()
        operations = self.contracts.operations()
        self.assertEqual(implemented_v2_operations(),
                         {(method, normalized_route(path)) for method, path in operations})
        identifiers = [op['operationId'] for op, _, _ in operations.values()]
        self.assertEqual(len(identifiers), len(set(identifiers)))
        self.assertTrue(all(op.get('security') for op, _, _ in operations.values()))
        assert_preserved_quote_contract(self.contracts)
        print(f'Validated {len(operations)} v2 operations against production mappings')

    def test_issue40_metadata_detail_and_inventory(self):
        for kind, media, import_id in [('POSITIONS', 'text/csv', UUID),
                                      ('API_POSITIONS', 'application/json', UUID),
                                      ('API_TRANSACTIONS', 'application/json', UUID + '-0'),
                                      ('API_TRANSACTIONS', 'application/json', UUID + '-99')]:
            with self.subTest(kind=kind, import_id=import_id):
                value = artifact(kind, media, import_id)
                self.contracts.validate_response('GET', '/v2/artifacts/{artifactId}', 200, value)
                self.contracts.validate_response('GET', '/v2/artifacts', 200,
                    dict(requestId=UUID, accountId=ACCOUNT_ID, brokerAccount='SYNTHETIC',
                         historyCoverage='UNKNOWN', artifacts=[value]))
        schema = self.contracts.documents[ACCOUNT]['components']['schemas']['Artifact']
        for field, bad in [('contentType', 'application/pdf'), ('sizeBytes', None)]:
            value = artifact('API_POSITIONS', 'application/json'); value[field] = bad
            with self.assertRaises(ValidationError):
                self.contracts.validator(schema, ACCOUNT).validate(value)
        for bad in ['not-an-id', UUID + '-x', UUID + '--1']:
            value = artifact('API_TRANSACTIONS', 'application/json', bad)
            with self.assertRaises(ValidationError):
                self.contracts.validator(schema, ACCOUNT).validate(value)
        value = artifact('UNKNOWN', 'application/json')
        with self.assertRaises(ValidationError):
            self.contracts.validator(schema, ACCOUNT).validate(value)

    def test_issue41_required_upload_headers_and_supported_types(self):
        values = {('query', 'accountId'): ACCOUNT_ID,
                  ('header', 'Content-Disposition'): 'attachment; filename="synthetic.csv"',
                  ('header', 'X-Brokerage-File-Type'): 'POSITIONS'}
        self.contracts.validate_parameters('POST', '/v2/artifacts', values)
        for field in [('header', 'Content-Disposition'), ('header', 'X-Brokerage-File-Type')]:
            bad = dict(values); del bad[field]
            with self.assertRaises(ValueError):
                self.contracts.validate_parameters('POST', '/v2/artifacts', bad)
        for kind in ['POSITIONS', 'BALANCES', 'ACTIVITY', 'OPTION_SUMMARY']:
            good = dict(values); good[('header', 'X-Brokerage-File-Type')] = kind
            self.contracts.validate_parameters('POST', '/v2/artifacts', good)
        for kind in ['API_POSITIONS', 'API_TRANSACTIONS', 'positions', 'UNKNOWN']:
            bad = dict(values); bad[('header', 'X-Brokerage-File-Type')] = kind
            with self.assertRaises(ValidationError):
                self.contracts.validate_parameters('POST', '/v2/artifacts', bad)
        for disposition in ['attachment', '']:
            bad = dict(values); bad[('header', 'Content-Disposition')] = disposition
            with self.assertRaises(ValidationError):
                self.contracts.validate_parameters('POST', '/v2/artifacts', bad)
        good = dict(values)
        good[('header', 'Content-Disposition')] = "attachment; filename*=UTF-8''synthetic%20source.csv"
        self.contracts.validate_parameters('POST', '/v2/artifacts', good)

    def test_every_error_is_bound_to_http_status_and_stable_problem_identity(self):
        for (method, path), (op, _, _) in self.contracts.operations().items():
            for status in (int(s) for s in op['responses'] if s.isdigit() and int(s) >= 400):
                with self.subTest(method=method, path=path, status=status):
                    self.contracts.validate_response(method, path, status, problem(status))
                    for other in ERRORS:
                        if other != status:
                            with self.assertRaises(ValidationError):
                                self.contracts.validate_response(method, path, status, problem(other))
                    for field, bad in [('code', 'INVENTED'), ('type', 'urn:wrong'), ('title', 'Wrong')]:
                        value = problem(status); value[field] = bad
                        with self.assertRaises(ValidationError):
                            self.contracts.validate_response(method, path, status, value)
                    if status == 422:
                        for value in [dict(problem(status), invalidParams=[]),
                                      {k: v for k, v in problem(status).items() if k != 'invalidParams'}]:
                            with self.assertRaises(ValidationError):
                                self.contracts.validate_response(method, path, status, value)

    def test_problem_fields_cannot_be_independently_mixed(self):
        for name in ['Problem', 'HeldQuotesReadProblem', 'HeldQuoteReadProblem']:
            schema = self.contracts.documents[COMMON]['components']['schemas'][name]
            value = problem(401); value['code'] = 'INTERNAL_ERROR'
            with self.assertRaises(ValidationError):
                self.contracts.validator(schema, COMMON).validate(value)

    def test_response_headers_correlation_attachment_and_no_store(self):
        headers = {'Content-Type': 'application/problem+json', 'X-Request-Id': UUID,
                   'Cache-Control': 'private, no-store', 'WWW-Authenticate': 'Bearer'}
        self.contracts.validate_response('GET', '/v2/accounts', 401, problem(401), headers)
        for field, bad in [('X-Request-Id', '22222222-2222-4222-8222-222222222222'),
                           ('Cache-Control', 'public'), ('Content-Type', 'application/json')]:
            value = dict(headers); value[field] = bad
            with self.assertRaises((ValueError, ValidationError)):
                self.contracts.validate_response('GET', '/v2/accounts', 401, problem(401), value)
        for field in ['X-Request-Id', 'Cache-Control', 'WWW-Authenticate']:
            value = dict(headers); del value[field]
            with self.assertRaises(ValueError):
                self.contracts.validate_response('GET', '/v2/accounts', 401, problem(401), value)
        response, name = self.contracts.response('GET', '/v2/artifacts/{artifactId}/content', 200)
        attachment = response['headers']['Content-Disposition']
        self.assertTrue(attachment['required'])
        self.contracts.validator(attachment['schema'], name).validate('attachment')
        with self.assertRaises(ValidationError):
            self.contracts.validator(attachment['schema'], name).validate('inline')

    def test_optional_correlation_across_all_operations(self):
        op = self.contracts.documents[SELECTION]['paths']['/v2/market-evidence-subjects']['get']
        self.assertIn('X-Request-Id', [p['name'] for p in op['parameters']])
        for (method, path), (operation, item, name) in self.contracts.operations().items():
            headers = [p for p in item.get('parameters', []) + operation.get('parameters', [])
                       if p['name'] == 'X-Request-Id']
            with self.subTest(method=method, path=path):
                self.assertEqual(len(headers), 1)
                self.assertFalse(headers[0].get('required', False))
                validator = self.contracts.validator(headers[0]['schema'], name)
                for value in [UUID, ' ' + UUID + ' ', '', ' ']:
                    validator.validate(value)
                with self.assertRaises(ValidationError):
                    validator.validate('not-a-uuid')


if __name__ == '__main__':
    unittest.main(verbosity=2)
