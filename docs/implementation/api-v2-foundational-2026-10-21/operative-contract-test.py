#!/usr/bin/env python3
"""Finite contract integration assertions; no runtime/source truth inferred."""
import json,shutil,subprocess,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];sys.path.insert(0,str(ROOT/'scripts'))
from v2_oas import Contracts,FOUNDATION,COMMON,ACCOUNT,implemented_v2_operations,normalized_route
class OperativeIntegration(unittest.TestCase):
 def test_generation_isolated_and_byte_idempotent(self):
  script=Path(__file__).relative_to(ROOT).with_name('integrate-operative-contract.py')
  inputs=[script,Path('docs/reviews/api-v2-foundational-contract-2026-10-20/openapi.json'),Path('docs/contracts')/COMMON,Path('docs/contracts')/ACCOUNT]
  outputs=[Path('docs/contracts')/name for name in [COMMON,ACCOUNT,FOUNDATION]]
  with tempfile.TemporaryDirectory() as tmp:
   target=Path(tmp)
   for path in inputs:(target/path).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/path,target/path)
   subprocess.run([sys.executable,str(target/script)],check=True)
   first={str(path):(target/path).read_bytes() for path in outputs}
   for path in outputs:self.assertEqual(first[str(path)],(ROOT/path).read_bytes(),str(path))
   subprocess.run([sys.executable,str(target/script)],check=True)
   self.assertEqual(first,{str(path):(target/path).read_bytes() for path in outputs})
 def test_complete_declared_route_inventory_and_no_new_mutations(self):
  c=Contracts();c.validate_structure();ops=c.operations()
  self.assertEqual(implemented_v2_operations(),{(m,normalized_route(p)) for m,p in ops})
  foundational=c.documents[FOUNDATION]['paths'];self.assertEqual(len(foundational),18)
  for item in foundational.values():self.assertEqual(set(item)-{'parameters'},{'get'})
  accepted=json.loads((ROOT/'docs/reviews/api-v2-foundational-contract-2026-10-20/openapi.json').read_text())
  for path,item in accepted['paths'].items():
   self.assertTrue(any(p==path for m,p in ops),path)
   for method in item:
    if method in ['get','post']:self.assertIn((method.upper(),path),ops)
  self.assertNotIn('/v2/portfolios',foundational);self.assertNotIn('/v2/executions',foundational)
 def test_account_access_advertises_implemented_independent_capabilities(self):
  access=Contracts().documents[ACCOUNT]['components']['schemas']['UserAccountAccess']
  for field in ['holdingsRead','ordersRead','positionsAuditRead','marketRead']:
   self.assertIn(field,access['required']);self.assertEqual(access['properties'][field]['type'],'boolean')
if __name__=='__main__':unittest.main(verbosity=2)
