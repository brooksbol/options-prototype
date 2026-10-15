#!/usr/bin/env python3
"""Validate Account OAS and actual isolated history HTTP specimens; no provider contact.
Requires jsonschema, openapi-spec-validator and PyYAML in an engineer-local environment.
"""
import json, sys
from pathlib import Path
import yaml
from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012
root = Path(__file__).resolve().parent.parent
contracts = root / 'docs/contracts'

def absolute_refs(value):
    if isinstance(value, list):
        return [absolute_refs(item) for item in value]
    if not isinstance(value, dict):
        return value
    result = {k:absolute_refs(v) for k,v in value.items()}
    ref = result.get('$ref', '')
    if ref and not ref.startswith('#'):
        filename, fragment = ref.split('#', 1)
        assert '/' not in filename and ':' not in filename, 'Local contract references only'
        result['$ref'] = (contracts / filename).as_uri() + '#' + fragment
    return result

spec = absolute_refs(json.loads((contracts / 'api-v2-account-evidence.json').read_text()))
validate(spec)
common_path = contracts / 'api-v2-direct-quote-acquisition-proposal.yaml'
common = absolute_refs(yaml.safe_load(common_path.read_text()))
registry = Registry().with_resource(common_path.as_uri(), Resource.from_contents(common, default_specification=DRAFT202012))
samples = json.loads(Path(sys.argv[1]).read_text())
for sample in samples:
    path = '/v2/accounts/{accountId}/transactions' + ('/{transactionId}' if sample['path'].endswith('/{transactionId}') else '')
    media = 'application/json' if sample['status'] == 200 else 'application/problem+json'
    response = spec['paths'][path]['get']['responses'][str(sample['status'])]
    if '$ref' in response:
        ref = response['$ref']; doc = spec if ref.startswith('#') else common
        response = doc
        for key in ref.split('#',1)[1].lstrip('/').split('/'):
            response = response[key.replace('~1','/').replace('~0','~')]
    schema = response['content'][media]['schema']
    Draft202012Validator({**schema,'components':spec['components']}, registry=registry, format_checker=FormatChecker()).validate(sample['payload'])
print(f'PASS: Account OAS 3.1 and {len(samples)} actual history HTTP specimens validate')
