#!/usr/bin/env python3
"""Actual held-detail specimens and codec; unrelated OAS paths may grow."""
import json
from v2_oas import COMMON, ROOT, Contracts, assert_preserved_quote_contract

contracts = Contracts()
contracts.validate_structure()
assert_preserved_quote_contract(contracts)
samples = json.loads((ROOT / 'evidence-service-java/build/held-quote-detail-specimens.json').read_text())
statuses = set()
for sample in samples:
    statuses.add(sample['status'])
    contracts.validate_response('GET', '/v2/quotes/{symbol}', sample['status'], sample['payload'], sample.get('headers'))
assert statuses == {200, 401, 403, 404, 422, 500, 503}, statuses
validator = contracts.validator(contracts.documents[COMMON]['components']['schemas']['EncodedQuoteSymbol'], COMMON)
for token in ['SPY', 'BRK_2FB', 'BRK_5F2FB', '_5ESPX', '_5E'*32, 'A_2F._2FB']:
    validator.validate(token)
for token in ['spy', 'SPY\n', 'BRK_', 'BRK_2fB', 'BRK_41', 'BRK_2E', '_5E'*33, 'BRK/B', '^SPX']:
    assert not validator.is_valid(token), token
print(f'PASS: {len(samples)} actual detail specimens, all 7 statuses, OAS 3.1 and codec; quote request/success/read contracts preserved')
