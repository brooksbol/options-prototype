#!/usr/bin/env python3
"""Newly constructed R1/R2 schema probes, not Kiro's unavailable historical sixteen.
Schema does not prove source truth, reconciliation or runtime authorization.
"""
import json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
sys.path.insert(0,str(ROOT/'scripts'))
from v2_oas import Contracts,FOUNDATION
from jsonschema.exceptions import ValidationError
class Contract(unittest.TestCase):
 def setUp(self):self.c=Contracts();self.s=json.loads((ROOT/"docs/contracts"/FOUNDATION).read_text())['components']['schemas']
 def validate(self,schema,value):self.c.validator(schema,FOUNDATION).validate(value)
 def test_exposure_positive_and_unknown(self):
  base={'status':'UNKNOWN','sourceSnapshotId':'snapshot','sourceDate':'2026-10-14','receivedAt':'2026-10-14T19:21:15Z','continuity':'UNRESOLVED','qualification':'No occurrence proof','evidence':[]}
  self.validate(self.s['CurrentExposureEvidence'],base)
  self.validate(self.s['CurrentExposureEvidence'],dict(base,status='SUPERSEDED_INTERPRETATION',successorPosition={'href':'/v2/positions/00000000-0000-4000-8000-000000000001'}))
 def test_supersession_requires_navigation(self):
  value={'status':'SUPERSEDED_INTERPRETATION','sourceSnapshotId':'snapshot','sourceDate':'2026-10-14','receivedAt':'2026-10-14T19:21:15Z','continuity':'UNRESOLVED','qualification':'Historical interpretation','evidence':[]}
  with self.assertRaises(ValidationError):self.validate(self.s['CurrentExposureEvidence'],value)
 def test_closed_exposure_rule(self):
  # Isolate new conditional so unrelated required Position fields cannot mask its result.
  rule=self.s['Position']['allOf'][-1]
  self.assertEqual(rule,self.s['PositionSummary']['allOf'][-1]);self.assertEqual(self.s['Position']['properties']['exposure'],self.s['PositionSummary']['properties']['exposure'])
  self.validate(rule,{'state':'CLOSED'})
  with self.assertRaises(ValidationError):self.validate(rule,{'state':'CLOSED','exposure':{}})
  self.validate(rule,{'state':'UNRESOLVED','exposure':{}})
 def test_no_invented_continuity_or_status(self):
  schema=self.s['CurrentExposureEvidence']
  for name in ['continuity','status']:
   with self.assertRaises(ValidationError):self.validate(schema,{'status':'OBSERVED','sourceSnapshotId':'s','sourceDate':'2026-10-14','receivedAt':'2026-10-14T19:21:15Z','continuity':'UNRESOLVED','qualification':'Observed','evidence':[],name:'PROVEN_OPENING'})
 def test_emitted_source_specimen(self):
  value=json.loads((Path(__file__).parent/'examples/iron-condor.json').read_text());self.validate({'$ref':'#/components/schemas/Position'},value)
 def test_operation_and_property_inventory(self):
  accepted=json.loads((ROOT/'docs/reviews/api-v2-foundational-contract-2026-10-20/openapi.json').read_text());ops=lambda paths:{(m.upper(),p) for p,v in paths.items() for m in v if m.lower() in ['get','post','put','patch','delete']}
  self.assertEqual(18,len(ops(accepted['paths'])));self.assertTrue(ops(accepted['paths'])<=set(self.c.operations()));self.assertEqual(36,len(self.c.operations()))
  inv=json.loads((ROOT/'docs/implementation/api-v2-foundational-2026-10-21/contract-properties.json').read_text())['schemas'];self.assertEqual(set(inv),set(self.s))
  for name,schema in self.s.items():self.assertEqual(set(schema.get('properties',{})),set(inv[name]['properties']))
if __name__=='__main__':unittest.main(verbosity=2)
