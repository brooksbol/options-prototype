"""Retained native failures and deterministic future-response variants. No providers."""
from pathlib import Path
import sys,json,tempfile,unittest,hashlib
from copy import deepcopy
from decimal import Decimal as D
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy,runtime,manage,run_batch
B=Path.home()/'Library/Application Support/Wheelwright/agent-communication/20261119-pr50-iteration2'
ROOT=B/'execution-v01'
def load(p):return json.loads(p.read_bytes())

class RetainedRegressions(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.m,cls.e,cls.r=runtime.components()
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.out=Path(self.tmp.name)
  self.no_network=patch('requests.sessions.Session.send',side_effect=AssertionError('NO_NETWORK_IN_OFFLINE_REHEARSAL'));self.no_network.start()
 def tearDown(self):self.no_network.stop();self.tmp.cleanup()
 def test_original_caps_and_all52_are_identical(self):
  old=load(B/'principal-execution-grant.json');self.assertEqual(policy.PER_SYMBOL_MAXIMUM_WIDTH,old['perSymbolMaximumWidth']);self.assertEqual(policy.MAXIMUM_SPREADS,old['maximumSpreads']);self.assertEqual(D(policy.MAXIMUM_AGGREGATE_GROSS_WIDTH_USD),D(old['maximumAggregateGrossWidthUSD']))
  self.assertEqual(policy.ROSTER,load(ROOT/'plan.json')['roster'])
 def test_risk_membership_frozen_not_winner_selection(self):
  p=policy.freeze_plan();self.assertEqual(set(p['eligibleAtFreeze']),set(policy.PER_SYMBOL_MAXIMUM_WIDTH));self.assertEqual(len(p['roster']),52);self.assertEqual(sum(p['assignment'][s]=='A' for s in p['eligibleAtFreeze']),17)
  with self.assertRaises(policy.Hold):policy.freeze_plan(['IWM'])
 def test_mstr_orcl_actual_stale_history_yields_only_to_own_terminal_detail(self):
  for symbol in ('MSTR','ORCL'):
   with self.subTest(symbol=symbol):
    en=load(ROOT/'enrollments'/f'{symbol}.json');folder=ROOT/'management/A/run'/f'{symbol}-2026-11-20';snap=load(folder/'after/snapshot.json')
    detail=load(sorted(folder.glob('cancel-readback-*.json'))[-1]);history,new,standing=runtime.resolved_own_history(self.m,self.e,snap['history'],detail,en['p50'],en['account_id'],en['p50Native'])
    self.assertEqual(new['state'],'CANCELED');self.assertEqual(D(new['filled_quantity']),0);self.assertIn('SUPERSEDES',standing)
    item={'entry':en['entry'],'p50':en['p50'],'entryNative':en['entryNative'],'p50Native':en['p50Native'],'account':en['account_id']}
    with self.assertRaises(self.r.Hold):self.r.state(item,snap,'CANCELED')
    self.assertEqual(self.r.state(item,{**snap,'history':history},'CANCELED'),'OPEN_NO_EXIT')
 def test_meta_smh_actual_entry_detail_history_lag(self):
  for symbol in ('META','SMH'):
   with self.subTest(symbol=symbol):
    en=load(ROOT/'enrollments'/f'{symbol}.json');cut=load(next((ROOT/'exceptions').glob(symbol+'-pre-dispatch-*/ownership/account-cut.json')));rawhistory=self.m.order_records(cut['history']['data'],en['account_id']);detail=None
    for p in sorted((ROOT/'entries'/symbol).glob('entry-poll-*.json')):
     doc=load(p);rec=self.m.order_records([doc],en['account_id'])
     if rec[0]['state']=='FILLED':detail=doc
    self.assertIsNotNone(detail)
    resolved,current,standing=runtime.resolved_own_history(self.m,self.e,rawhistory,detail,en['entry'],en['account_id'],en['entryNative']);self.assertEqual(current['state'],'FILLED');self.assertEqual(D(current['average_fill_price']),D(en['openingFill']));self.assertIn('SUPERSEDES',standing)
    self.assertTrue(any(x['state']!='FILLED' for x in rawhistory if x['client_order_id']==en['entry']['client_order_id']))
 def native_case(self):
  en=load(ROOT/'enrollments/MSTR.json');snap=load(ROOT/'management/A/run/MSTR-2026-11-20/after/snapshot.json');detail=load(ROOT/'management/A/run/MSTR-2026-11-20/cancel-readback-1.json');return en,snap,detail
 def test_foreign_native_id_refuses_global(self):
  en,snap,detail=self.native_case()
  with self.assertRaises(runtime.AccountStop):runtime.resolved_own_history(self.m,self.e,snap['history'],detail,en['p50'],en['account_id'],'WRONG_NATIVE')
 def test_conflicting_terminal_fact_never_overridden(self):
  en,snap,detail=self.native_case();old=deepcopy(snap['history']);x=next(x for x in old if x['client_order_id']==en['p50']['client_order_id']);x.update(state='FILLED',filled_quantity='1',average_fill_price='.20')
  with self.assertRaisesRegex(policy.Hold,'CONTRADICTION'):runtime.resolved_own_history(self.m,self.e,old,detail,en['p50'],en['account_id'],en['p50Native'])
 def test_partial_fills_never_canceled_zero_by_overlay(self):
  en,snap,detail=self.native_case();old=deepcopy(snap['history']);next(x for x in old if x['client_order_id']==en['p50']['client_order_id'])['filled_quantity']='0.5'
  with self.assertRaisesRegex(policy.Hold,'PARTIAL'):runtime.resolved_own_history(self.m,self.e,old,detail,en['p50'],en['account_id'],en['p50Native'])
 def test_missing_history_is_not_invented_from_detail(self):
  en,snap,detail=self.native_case()
  with self.assertRaisesRegex(policy.Hold,'COVERAGE'):runtime.resolved_own_history(self.m,self.e,[],detail,en['p50'],en['account_id'],en['p50Native'])
 def test_all26_entry_and_exit_native_bindings_retained(self):
  cut=load(B/'readback-does-not-exist') if False else load(Path.home()/'Library/Application Support/Wheelwright/agent-communication/20261127-pr50-reconciliation/fresh-20261127T154413Z/account-cut.json')
  rows=self.m.order_records(cut['history']['data'],cut['account_id']);n=0
  for p in (ROOT/'enrollments').glob('*.json'):
   en=load(p)
   for wire,native in [(en['entry'],en['entryNative']),(en['p50'],en['p50Native'])]:
    native_row=next(x for x in rows if x['client_order_id']==wire['client_order_id']);self.r.record(native_row,wire,en['account_id'],native)
   n+=1
  self.assertEqual(n,26)
 def test_local_cancel_does_not_stop_unrelated_arm_item(self):
  f=self.out/'item';f.mkdir();(f/'cancel-dispatch-claim.json').write_text('{}')
  self.assertFalse(manage.global_failure(self.r.Stop('Cancel remains nonterminal; no replacement'),f,self.r))
  self.assertFalse(manage.global_failure(self.r.Hold('Terminal-zero cancel or no-working-conflict proof missing'),f,self.r))
 def test_unknown_place_and_account_failures_stop(self):
  f=self.out/'item';f.mkdir();(f/'place-dispatch-claim.json').write_text('{}');self.assertTrue(manage.global_failure(ValueError('lag'),f,self.r));self.assertTrue(manage.global_failure(runtime.AccountStop('identity'),self.out,self.r));self.assertTrue(manage.global_failure(self.r.Hold('Cash changed within observation bracket'),self.out,self.r))
 def test_wait_archives_require_native_absence_and_no_claim(self):
  en=load(ROOT/'enrollments/SPY.json') if (ROOT/'enrollments/SPY.json').exists() else load(ROOT/'enrollments/QQQ.json');account=en['account_id'];foreign=self.out/'foreign';foreign.mkdir();folder=self.out/'entries/SPY';folder.mkdir(parents=True);(folder/'qualification.json').write_text('{"reason":"WIDTH"}');inventory={'claimRoots':[str(foreign)],'observedClaimFiles':{}};cut={'account_id':account,'history':{'data':[],'complete_for_query':True},'working':{'data':[],'complete_for_query':True}}
  files=run_batch.wait_absence('SPY',cut,inventory,self.m,self.out);self.assertIn('qualification.json',files);(folder/'place-dispatch-claim.json').write_text('{}')
  with self.assertRaisesRegex(policy.Hold,'NEVER_REQUALIFY'):run_batch.wait_absence('SPY',cut,inventory,self.m,self.out)
 def test_terminal_zero_native_still_never_resubmitted(self):
  en,snap,detail=self.native_case();row=self.m.order_records([detail],en['account_id'])[0];wire={'client_order_id':row['client_order_id']};m=SimpleNamespace(order_records=lambda x,a:x);cut={'account_id':en['account_id'],'history':{'data':[row],'complete_for_query':True},'working':{'data':[],'complete_for_query':True}}
  with self.assertRaises(runtime.AccountStop):runtime.new_native_identity_absent(m,cut,wire)
 def test_late_watch_no_pre_dispatch_native_lookup(self):
  p=self.out/'entries/SPY';p.mkdir(parents=True);(p/'pending-intent.json').write_text(json.dumps({'symbol':'SPY'}))
  result=runtime.late_fill_pass(self.out,policy.freeze_plan(),None);self.assertEqual(result[0]['state'],'PRE_DISPATCH_WAIT_REQUALIFIABLE')
 def test_cutoffs_preserved_exactly(self):
  p=policy.freeze_plan();self.assertEqual(p['entryWindowUTC'][1],'2026-11-30T20:30:00+00:00')
  for arm,h in [('A','20'),('B','16')]:
   self.assertEqual(p['arms'][arm]['selectionAt'],f'2026-12-01T{h}:00:00+00:00');self.assertEqual(p['arms'][arm]['mutationDeadline'],f'2026-12-01T{h}:20:00+00:00')
 def test_missed_management_window_never_becomes_late_action(self):
  with tempfile.TemporaryDirectory() as td:
   m,e,r,items=manage.configure(Path(td),policy.freeze_plan(),'A',None,B/'pr47-admission/admission.py','b227f4f9a086358ebecaacd03c9b9d481530caa6a9834a612c1b54379d6514fd',False)
   from datetime import datetime,timezone
   with self.assertRaises(r.Stop):r.guard(datetime(2026,12,1,20,20,tzinfo=timezone.utc))

 def test_wide_WAIT_is_decided_before_account_reads(self):
  import time
  from contextlib import nullcontext
  account=load(B/'principal-execution-grant.json')['account_id'];foreign=self.out/'foreign';foreign.mkdir();inventory=self.out/'inventory.json';inventory.write_text(json.dumps({'standing':'CURRENT_QUALIFIED_CLAIM_INVENTORY','account_id':account,'claimRoots':[str(foreign)],'observedClaimFiles':{}}));catalog=self.out/'catalog/SPY';catalog.mkdir(parents=True)
  contracts=[{'symbol':'SPY261201P00100000','instrument_id':'SYNTHETIC-S','strike_price':'100','expiration_date':'2026-12-01','underlying_symbol':'SPY','option_type':'PUT','ppind':True},{'symbol':'SPY261201P00095000','instrument_id':'SYNTHETIC-L','strike_price':'95','expiration_date':'2026-12-01','underlying_symbol':'SPY','option_type':'PUT','ppind':True}]
  runtime.save(catalog/'validated-catalog.json',contracts);g={'greeks':[{'symbol':c['symbol'],'delta':d,'updatedAt':int(time.time()*1000)} for c,d in zip(contracts,(-.30,-.20))]};selection=policy.select(contracts,g['greeks'],time.time()*1000)
  grant={'claimInventorySha256':runtime.hashfile(inventory),'admissionSha256':'b227f4f9a086358ebecaacd03c9b9d481530caa6a9834a612c1b54379d6514fd','maximumSpreads':33,'maximumAggregateGrossWidthUSD':'11350','perSymbolMaximumWidth':policy.PER_SYMBOL_MAXIMUM_WIDTH}
  def fresh(symbol,folder):runtime.save(folder/'fresh-greeks.json',g);return selection
  with patch.object(runtime,'authorize',return_value=grant),patch.object(self.m,'Reader',return_value=object()),patch.object(self.m,'load_credentials',return_value=()),patch.object(self.m,'qualification_slot',side_effect=lambda:nullcontext()),patch.object(self.m,'fresh_selection',side_effect=fresh),patch.object(runtime,'capture',side_effect=AssertionError('UNNECESSARY_ACCOUNT_GET')):
   with self.assertRaisesRegex(policy.Hold,'WIDTH_CEILING'):runtime.execute_candidate('SPY',policy.freeze_plan(),catalog.parent,self.out/'run',None,inventory,B/'pr47-admission/admission.py',grant['admissionSha256'])
  self.assertFalse((self.out/'run/entries/SPY/place-dispatch-claim.json').exists())
if __name__=='__main__':unittest.main()
