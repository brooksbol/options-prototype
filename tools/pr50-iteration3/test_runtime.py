"""Inert integration tests: no credentials, providers or actual brokerage clients."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import unittest,tempfile,json,hashlib
from types import SimpleNamespace
from copy import deepcopy
from unittest.mock import patch
import policy,runtime,run_batch

class RuntimeTests(unittest.TestCase):
 def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
 def tearDown(self):self.tmp.cleanup()
 def test_no_grant_refuses_before_broker_credentials(self):
  with self.assertRaisesRegex(policy.Hold,'NEW_PRINCIPAL_GRANT_REQUIRED'):runtime.authorize(None,policy.freeze_plan(),'INERT','SPY','ENTRY')
 def test_old_date_plan_not_reused(self):
  p=policy.freeze_plan();p['entryDate']='2026-11-17'
  with self.assertRaises(policy.Hold):policy.validate_plan(p)
 def test_entry_and_exit_identifiers_distinct_and_restart_stable(self):
  a=runtime.new_identity('SPY','ENTRY');b=runtime.new_identity('SPY','P50');self.assertNotEqual(a,b);self.assertEqual(a,runtime.new_identity('SPY','ENTRY'));self.assertLessEqual(len(a),32)
 def test_foreign_new_claim_stops(self):
  foreign=self.root/'foreign';foreign.mkdir();inv={'claimRoots':[str(foreign)],'observedClaimFiles':{}}
  runtime.claims_unchanged(inv,self.root/'own');(foreign/'place-dispatch-claim.json').write_text('{}')
  with self.assertRaisesRegex(policy.Hold,'FOREIGN_CLAIM_SET'):runtime.claims_unchanged(inv,self.root/'own')
 def test_changed_historical_claim_not_ignored(self):
  foreign=self.root/'foreign';foreign.mkdir();p=foreign/'place-dispatch-claim.json';p.write_text('1');inv={'claimRoots':[str(foreign)],'observedClaimFiles':{str(p):runtime.hashfile(p)}};p.write_text('2')
  with self.assertRaises(policy.Hold):runtime.claims_unchanged(inv,self.root/'own')
 def test_own_new_claim_not_foreign_bypass(self):
  foreign=self.root/'scope';foreign.mkdir();own=foreign/'own';own.mkdir();inv={'claimRoots':[str(foreign)],'observedClaimFiles':{}};(own/'place-dispatch-claim.json').write_text('{}');runtime.claims_unchanged(inv,own)
 def test_cap_is_gross_width_not_premium(self):
  grant={'maximumSpreads':1,'maximumAggregateGrossWidthUSD':'100','perSymbolMaximumWidth':{'SPY':'1'}}
  runtime.check_budget(grant,self.root,'SPY','1')
  with self.assertRaises(policy.Hold):runtime.check_budget(grant,self.root,'SPY','1.01')
 def test_unknown_local_claim_has_no_release(self):
  folder=self.root/'entries/SPY';folder.mkdir(parents=True);(folder/'place-dispatch-claim.json').write_text('{}')
  with self.assertRaisesRegex(policy.Hold,'UNBOUND_LOCAL'):runtime.own_claims(self.root,[])
 def test_prospective_freeze_bool_tamper_refused(self):
  plan=policy.freeze_plan();plan['assignment']['SPY']='B' if plan['assignment']['SPY']=='A' else 'A'
  with self.assertRaises(policy.Hold):policy.validate_plan(plan)
 def test_no_source_claim_is_not_an_empty_known_inventory(self):
  with self.assertRaisesRegex(policy.Hold,'COVERAGE_MISSING'):runtime.claims_unchanged({'claims':[]},self.root)
 def test_pending_ack_repolls_to_confirmed_fill(self):
  entry={'state':'PENDING','filled_quantity':'0','order_id':'INERT'};done={**entry,'state':'FILLED','filled_quantity':'1'};seq=iter([entry,done]);reader=SimpleNamespace(order_detail=lambda *x:next(seq));m=SimpleNamespace(order_records=lambda d,a:d);e=SimpleNamespace(verify_geometry=lambda *x:None)
  result=runtime.poll_entry(m,e,reader,'TEST',{'client_order_id':'CID'},entry,self.root);self.assertEqual(result['state'],'FILLED');self.assertEqual(len(list(self.root.glob('entry-poll-*.json'))),2)
 def test_pending_poll_is_bounded_and_never_resends(self):
  entry={'state':'PENDING','filled_quantity':'0','order_id':'INERT'};calls=[];reader=SimpleNamespace(order_detail=lambda *x:(calls.append('GET') or entry));m=SimpleNamespace(order_records=lambda d,a:d);e=SimpleNamespace(verify_geometry=lambda *x:None)
  result=runtime.poll_entry(m,e,reader,'TEST',{'client_order_id':'CID'},entry,self.root);self.assertEqual(result['state'],'PENDING');self.assertEqual(calls,['GET']*3)
 def test_pending_poll_identity_conflict_stops(self):
  entry={'state':'PENDING','filled_quantity':'0','order_id':'INERT'};reader=SimpleNamespace(order_detail=lambda *x:{**entry,'order_id':'FOREIGN'});m=SimpleNamespace(order_records=lambda d,a:d);e=SimpleNamespace(verify_geometry=lambda *x:None)
  with self.assertRaises(policy.Hold):runtime.poll_entry(m,e,reader,'TEST',{'client_order_id':'CID'},entry,self.root)
 def test_no_poll_after_confirmed_fill(self):
  entry={'state':'FILLED','filled_quantity':'1','order_id':'INERT'};reader=SimpleNamespace(order_detail=lambda *x:(_ for _ in ()).throw(AssertionError('extra GET')));self.assertEqual(runtime.poll_entry(None,None,reader,'TEST',{},entry,self.root),entry)

 def test_attach_p50_persists_enrollment_after_dispatch(self):
  order={'client_order_id':'ENTRY','symbol':'SPY','limit_price':'.40','legs':[{'side':'SELL'},{'side':'BUY'}]}
  entry={'account_id':'TEST','state':'FILLED','filled_quantity':'1','average_fill_price':'.40','order_id':'NATIVE','client_order_id':'ENTRY','quantity':'1'}
  m=SimpleNamespace(Reader=lambda *x:SimpleNamespace(order_detail=lambda *a:entry),load_credentials=lambda:(),order_records=lambda d,a:d if isinstance(d,list) else [d],package=lambda *x:{},account_scope=lambda x:x,PACER=SimpleNamespace(wait=lambda *x:None))
  e=SimpleNamespace(verify_geometry=lambda *x:None)
  def send(m,reader,packet,folder,validator,guard,metrics):
   validator(packet['order']);guard();return {'order_id':'EXIT','state':'SUBMITTED','filled_quantity':'0'}
  with patch.object(runtime,'authorize',return_value={}),patch.object(runtime,'capture',return_value={'account_id':'TEST','history':{'data':[entry],'complete_for_query':True},'working':{'data':[],'complete_for_query':True},'at':runtime.stamp()}),patch.object(runtime,'held_one'),patch.object(runtime,'dispatch',side_effect=send):
   result,_=runtime.attach_p50(m,e,self.root,None,policy.freeze_plan(),'SPY',order,entry,{'width':'1','tick':'.01'})
  saved=json.loads((self.root/'enrollments/SPY.json').read_text());self.assertEqual(saved,result);self.assertEqual(saved['entryFolder'],str(self.root/'entries/SPY'));self.assertEqual(saved['p50Native'],'EXIT')

if __name__=='__main__':unittest.main()
