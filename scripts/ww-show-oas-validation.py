#!/usr/bin/env python3
"""Actual held-detail HTTP specimens and codec schema; no market/provider contact."""
import json,re,subprocess
from pathlib import Path
import yaml
from jsonschema import Draft202012Validator,FormatChecker
from openapi_spec_validator import validate
root=Path(__file__).resolve().parent.parent
path='docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml'
spec=yaml.safe_load((root/path).read_text());validate(spec)
old=yaml.safe_load(subprocess.check_output(['git','show',f'4ff8c7a:{path}'],cwd=root,text=True))
assert spec['paths']['/v2/quotes']==old['paths']['/v2/quotes']
assert set(spec['paths'])=={'/v2/quotes','/v2/quotes/{symbol}'}
for k,v in old['components']['schemas'].items():assert spec['components']['schemas'][k]==v,k
samples=json.loads((root/'evidence-service-java/build/held-quote-detail-specimens.json').read_text());statuses=set()
for sample in samples:
 status=sample['status'];statuses.add(status)
 schema=spec['paths']['/v2/quotes/{symbol}']['get']['responses'][str(status)]['content']['application/json' if status==200 else 'application/problem+json']['schema']
 Draft202012Validator({**schema,'components':spec['components']},format_checker=FormatChecker()).validate(sample['payload'])
assert statuses=={200,401,403,404,422,500,503},statuses
validator=Draft202012Validator(spec['components']['schemas']['EncodedQuoteSymbol'])
for token in ['SPY','BRK_2FB','BRK_5F2FB','_5ESPX','_5E'*32,'A_2F._2FB']:validator.validate(token)
for token in ['spy','SPY\n','BRK_','BRK_2fB','BRK_41','BRK_2E','_5E'*33,'BRK/B','^SPX']:assert not validator.is_valid(token),token
print(f'PASS: {len(samples)} actual detail specimens, all 7 statuses, OAS 3.1 and codec schema; accepted POST/collection schemas unchanged')
