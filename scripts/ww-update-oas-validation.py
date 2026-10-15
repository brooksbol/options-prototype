#!/usr/bin/env python3
"""Actual selection specimens; current OAS errors and preserved quote behavior."""
import json
import sys
from pathlib import Path
from v2_oas import Contracts, assert_preserved_quote_contract

contracts = Contracts()
contracts.validate_structure()
assert_preserved_quote_contract(contracts)
samples = json.loads(Path(sys.argv[1]).read_text())
for sample in samples:
    contracts.validate_response('GET', '/v2/market-evidence-subjects', sample['status'],
                                sample['payload'], sample.get('headers'))
print(f'PASS: selection/common OAS; {len(samples)} actual HTTP specimens; quote request/success/read contracts preserved')
