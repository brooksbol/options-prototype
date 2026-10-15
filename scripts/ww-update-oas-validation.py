#!/usr/bin/env python3
"""Actual selection HTTP specimens plus unchanged explicit quote wire contract."""
import json,sys,subprocess
from pathlib import Path
import yaml
from jsonschema import Draft202012Validator,FormatChecker
from openapi_spec_validator import validate
root=Path(__file__).resolve().parent.parent
contracts=root/'docs/contracts'
path='docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml'
common=yaml.safe_load((root/path).read_text())
old=yaml.safe_load(subprocess.check_output(['git','show','e7b09da:'+path],cwd=root,text=True))
assert common['paths']['/v2/quotes']==old['paths']['/v2/quotes']
assert common['components']==old['components']
spec=json.loads((contracts/'api-v2-market-evidence-subjects.json').read_text())
def absolute(v):
 if isinstance(v,list):return [absolute(x) for x in v]
 if not isinstance(v,dict):return v
 out={k:absolute(x) for k,x in v.items()}
 ref=out.get('$ref','')
 if ref and not ref.startswith('#'):
  filename,fragment=ref.split('#',1);out['$ref']=(contracts/filename).as_uri()+'#'+fragment
 return out
validate(absolute(spec));validate(absolute(common))
samples=json.loads(Path(sys.argv[1]).read_text())
for sample in samples:
 schema=spec['components']['schemas']['MarketEvidenceSubjectSelection'] if sample['status']==200 else common['components']['schemas']['HeldQuoteReadProblem']
 Draft202012Validator({**schema,'components':spec['components']},format_checker=FormatChecker()).validate(sample['payload'])
print(f'PASS: selection/common OAS; {len(samples)} actual HTTP specimens; explicit quote operation/components unchanged')
