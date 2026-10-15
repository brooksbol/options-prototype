#!/usr/bin/env python3
"""Validate actual isolated history specimens with the current local v2 OAS graph."""
import json
import sys
from pathlib import Path
from v2_oas import Contracts

contracts = Contracts()
contracts.validate_structure()
samples = json.loads(Path(sys.argv[1]).read_text())
for sample in samples:
    path = '/v2/accounts/{accountId}/transactions'
    if '/transactions/' in sample['path']:
        path += '/{transactionId}'
    contracts.validate_response('GET', path, sample['status'], sample['payload'], sample.get('headers'))
print(f'PASS: Account OAS 3.1 and {len(samples)} actual history HTTP specimens validate')
