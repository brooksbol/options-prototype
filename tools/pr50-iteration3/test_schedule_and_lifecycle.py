"""One-date event delivery and retained broker/settlement evidence boundaries."""
from pathlib import Path
from datetime import datetime,timedelta,timezone
import sys,json,tempfile,unittest
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy,runtime,run_batch
B=Path.home()/'Library/Application Support/Wheelwright/agent-communication';I=B/'20261119-pr50-iteration2'
load=lambda p:json.loads(p.read_bytes())
class ScheduleAndLifecycleTests(unittest.TestCase):
 def test_B_software_failure_does_not_suppress_A_or_reports(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);plan=policy.freeze_plan();runtime.save(root/'plan.json',plan);runtime.save(root/'enrollments/META.json',{'symbol':'META','account_id':'SYNTHETIC'})
   clock=[datetime(2026,12,1,15,59,59,tzinfo=timezone.utc)];actions=[];reads=[]
   def sleep(seconds):clock[0]+=timedelta(seconds=seconds)
   def action(*args,**kwargs):
    arm=args[2];actions.append(arm)
    if arm=='B':raise KeyError('SYNTHETIC_FAILURE_NOT_HOLD')
    return {'outcomes':[],'state':'A_DELIVERED'}
   with patch.object(runtime,'utc',side_effect=lambda:clock[0]),patch.object(runtime,'authorize',return_value={}),patch.object(run_batch.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout='AC Power')),patch.object(run_batch.subprocess,'Popen',return_value=SimpleNamespace(pid=123)),patch.object(run_batch.time,'sleep',side_effect=sleep),patch.object(run_batch.manage,'manage',side_effect=action),patch.object(run_batch,'readback',side_effect=lambda root,label:reads.append(label) or {'readOnly':True}):
    run_batch.schedule(root,None,None,None)
   self.assertEqual(actions,['B','A']);self.assertEqual(reads,['arm-B','arm-A','post-close']);self.assertEqual(load(root/'schedule-action-B.json')['state'],'MANAGEMENT_DELIVERY_FAILURE');self.assertEqual(load(root/'schedule-action-A.json')['state'],'A_DELIVERED')
 def test_late_fill_watch_stays_open_when_initially_empty(self):
  with tempfile.TemporaryDirectory() as td:
   root=Path(td);plan=policy.freeze_plan();runtime.save(root/'plan.json',plan);runtime.save(root/'enrollments/META.json',{'symbol':'META','account_id':'SYNTHETIC'})
   clock=[datetime(2026,11,30,20,29,59,tzinfo=timezone.utc)];saw=[]
   def sleep(seconds):
    clock[0]+=timedelta(seconds=seconds)
    if clock[0]>=datetime(2026,11,30,20,30,tzinfo=timezone.utc) and not (root/'entries/PLTR/pending-intent.json').exists():runtime.save(root/'entries/PLTR/pending-intent.json',{'symbol':'PLTR','synthetic':True})
   def watch(*args):
    if (root/'entries/PLTR/pending-intent.json').exists():saw.append('PLTR')
    return []
   with patch.object(runtime,'utc',side_effect=lambda:clock[0]),patch.object(runtime,'authorize',return_value={}),patch.object(runtime,'late_fill_pass',side_effect=watch),patch.object(run_batch.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout='AC Power')),patch.object(run_batch.subprocess,'Popen',return_value=SimpleNamespace(pid=123)),patch.object(run_batch.time,'sleep',side_effect=sleep),patch.object(run_batch.manage,'manage',return_value={'outcomes':[]}),patch.object(run_batch,'readback',return_value={}):run_batch.schedule(root,None,None,None)
   self.assertTrue(saw)
 def test_retained_AUTO_CLOSE_is_not_own_P50_or_permission_to_mutate(self):
  m,e,r=runtime.components();p=load(B/'20261117-pr50/repair-20261118/restored/XLF-2026-11-18/prepared-packet.json');cut=load(B/'20261127-pr50-reconciliation/fresh-20261127T154413Z/account-cut.json');history=m.order_records(cut['history']['data'],cut['account_id']);entry=next(x for x in history if x['client_order_id']==p['original_order']['client_order_id']);p50=next(x for x in history if x['client_order_id']==p['order']['client_order_id']);item={'account':cut['account_id'],'entry':p['original_order'],'p50':p['order'],'entryNative':entry['order_id'],'p50Native':p50['order_id']}
  with self.assertRaisesRegex(r.Hold,'Competing native activity'):r.state(item,{'history':history,'working':[],'positions':cut['positions']})
 def test_missing_expired_position_does_not_prove_native_expiration(self):
  m,e,r=runtime.components();from reuse import load as module
  ep=B/'20261117-pr50/claude-1-I2-lifecycle-E-v3/lifecycle_e.py';self.assertEqual(runtime.hashfile(ep),'68cb45231ac414ccab42e2dac1eac5c259549d02731752c8ab9e60b8d020bdb7');E=module('unchanged_E_for_boundary',ep);cut=load(B/'20261127-pr50-reconciliation/fresh-20261127T154413Z/account-cut.json');en=load(I/'execution-v01/enrollments/GLD.json')
  report=E.evaluate({'account_id':cut['account_id'],'expiry':'2026-11-20','entry_order':en['entry'],'entry_claimed':True,'exits':[{'client_order_id':en['p50']['client_order_id'],'role':'P50','claimed':True,'readback_verified':True}],'foreign_claims':[]},{'observed_at':cut['at'],'decision_cut_at':cut['at'],'history_complete':True,'working_complete':True,'positions_complete':True,'positions':cut['positions'],'history':m.order_records(cut['history']['data'],cut['account_id']),'working':[],'cash_events':None,'lifecycle_events':None,'as_of_date':'2026-11-27'})
  self.assertEqual(report['state'],'UNRESOLVED');self.assertNotIn(report['state'],('EXPIRED_WORTHLESS_NATIVE','ASSIGNED_NATIVE','EXERCISED_NATIVE'))
 def test_account_stop_exception_and_returned_unack_both_suppress_actions(self):
  for mode in ('EXCEPTION','RETURNED_UNACK'):
   with self.subTest(mode=mode),tempfile.TemporaryDirectory() as td:
    root=Path(td);plan=policy.freeze_plan();runtime.save(root/'plan.json',plan);runtime.save(root/'enrollments/SPY.json',{'symbol':'SPY','account_id':'SYNTHETIC'});clock=[datetime(2026,11,30,20,59,59,tzinfo=timezone.utc)];actions=[];reads=[]
    def jump(n):
     targets=[datetime.fromisoformat(plan['p50LatestUTC'])]+[datetime.fromisoformat(x) for x in [plan['arms']['B']['selectionAt'],plan['arms']['B']['readbackAt'],plan['arms']['A']['selectionAt'],plan['arms']['A']['readbackAt'],plan['finalReadbackUTC']]]
     clock[0]=next((x for x in targets if x>clock[0]),clock[0]+timedelta(seconds=n))
    def watch(*args):
     if mode=='EXCEPTION':raise runtime.AccountStop('UNCERTAIN_ACK_STOP_NO_RESEND')
     return [{'state':'UNACKNOWLEDGED_ENTRY_READBACK_ONLY'}]
    with patch.object(runtime,'utc',side_effect=lambda:clock[0]),patch.object(runtime,'authorize',return_value={}),patch.object(runtime,'late_fill_pass',side_effect=watch),patch.object(run_batch.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout='AC Power')),patch.object(run_batch.subprocess,'Popen',return_value=SimpleNamespace(pid=123)),patch.object(run_batch.time,'sleep',side_effect=jump),patch.object(run_batch.manage,'manage',side_effect=lambda *a,**kw:actions.append(a[2]) or {}),patch.object(run_batch,'readback',side_effect=lambda root,label:reads.append(label) or {}):run_batch.schedule(root,None,None,None)
    self.assertEqual(actions,[]);self.assertEqual(len(reads),3);self.assertTrue((root/'account-global-hold.json').exists())
 def test_outer_management_account_stop_is_persisted_and_visible(self):
  with tempfile.TemporaryDirectory() as td:
   import manage
   root=Path(td);runroot=root/'management/B';runroot.mkdir(parents=True);plan=policy.freeze_plan();item={'entry':{'symbol':'SPY'},'row':{'label':'SPY-2026-12-01'}}
   r=SimpleNamespace(ROOT=runroot,END=datetime(2026,12,1,16,20,tzinfo=timezone.utc),selection_time=lambda:None,now=runtime.utc,exclusive_claim=runtime.save,books=lambda *a:(_ for _ in ()).throw(runtime.AccountStop('PAPER_MARGIN_IDENTITY')),reconcile_only=lambda *a:{})
   m=SimpleNamespace(Market=lambda p:SimpleNamespace(close=lambda:None))
   with patch.object(manage,'configure',return_value=(m,None,r,[item])):result=manage.manage(root,plan,'B',None,None,None,True)
   self.assertTrue(result['accountGlobalStop']);self.assertEqual(result['scope'],'ACCOUNT');self.assertTrue((root/'account-global-hold.json').exists())
 def test_frozen_node_path_survives_minimal_schedule_PATH(self):
  import os
  with patch.dict(os.environ,{'PATH':'/usr/bin:/bin'}):
   env=runtime.configure_environment();self.assertEqual(os.environ['PATH'].split(os.pathsep)[0],str(Path(env['node']).parent))
if __name__=='__main__':unittest.main()
