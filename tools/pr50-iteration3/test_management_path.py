"""Future-dated SYNTHETIC broker variants built from retained I2 specimens.
Actual SDK packaging/claim/atomic sender + real quote qualifier are exercised.
requests.Session.send is replaced; credentials, pacer and shared lock are inert.
"""
from pathlib import Path
from datetime import datetime,timezone,timedelta
from decimal import Decimal as D
from contextlib import ExitStack,nullcontext
from copy import deepcopy
from types import SimpleNamespace
import sys,json,tempfile,unittest,time,hashlib
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy,runtime,manage
B=Path.home()/'Library/Application Support/Wheelwright/agent-communication/20261119-pr50-iteration2';OLD=B/'execution-v01'
load=lambda p:json.loads(p.read_bytes())

def transform(value,cids):
 if isinstance(value,list):return [transform(x,cids) for x in value]
 if isinstance(value,dict):return {k:transform(v,cids) for k,v in value.items()}
 if isinstance(value,str):return cids.get(value,value.replace('261120P','261201P').replace('2026-11-20','2026-12-01').replace('2026-11-19','2026-11-30'))
 return value

class BrokerSpecimen:
 def __init__(self,root,syms,scenarios):
  self.root=root;self.syms=syms;self.scenarios=scenarios;self.m,self.e,self.r=runtime.components();self.plan=policy.freeze_plan();self.arm=self.plan['assignment'][syms[0]];assert all(self.plan['assignment'][s]==self.arm for s in syms)
  self.at=datetime.fromisoformat(self.plan['arms'][self.arm]['selectionAt'])+timedelta(seconds=1);self.realstart=time.monotonic();self.posts=[];self.states={s:'SUBMITTED' for s in syms};self.polls={s:0 for s in syms};self.new={};self.en={};self.bookdata={};self.active=None
  self.base=load(OLD/'management/A/run/MSTR-2026-11-20/before/snapshot.json');self.account=load(OLD/'enrollments/MSTR.json')['account_id'];self.cids={}
  for s in syms:
   old=load(OLD/'enrollments'/f'{s}.json');self.cids[old['entry']['client_order_id']]=runtime.new_identity(s,'ENTRY');self.cids[old['p50']['client_order_id']]=runtime.new_identity(s,'P50')
  self.base=transform(self.base,self.cids)
  for s in syms:
   old=load(OLD/'enrollments'/f'{s}.json');en=transform(old,self.cids);en.update(arm=self.arm,planSha256=policy.digest(self.plan),entryFolder=str(root/'entries'/s),p50Folder=str(root/'p50'/s));self.en[s]=en
   for side,source in [('entry','entries'),('p50','p50')]:
    folder=Path(en[side+'Folder']);folder.mkdir(parents=True);packet=transform(load(OLD/source/s/'prepared-packet.json'),self.cids);packet['package']=self.m.package(self.account,self.m.account_scope(self.account),packet['order']);runtime.save(folder/'prepared-packet.json',packet);runtime.save(folder/'place-dispatch-claim.json',{'request_sha256':packet['package']['sha256']});runtime.save(folder/'first-readback.json',transform(load(OLD/source/s/'first-readback.json'),self.cids))
   runtime.save(root/'enrollments'/f'{s}.json',en)
   doc=transform(load(OLD/'entries'/s/'quotes/00002.json'),self.cids)
   for q in doc['quotes']['quote']:self.bookdata[q['symbol']]=q
  # Remove retained prior time-close events from the synthetic fresh cohort;
  # retain every unrelated contract/event and its inventory unchanged.
  wanted={self.e.key(l) for en in self.en.values() for l in en['entry']['legs']};allowed={en[k]['client_order_id'] for en in self.en.values() for k in ('entry','p50')}
  for name in ('history','working'):
   self.base[name]=[x for x in self.base[name] if x['client_order_id'] in allowed or not any(self.e.key(l) in wanted for l in x.get('legs',[]))]
  self.foreign_signature=self.m.position_signature([p for p in self.base['positions'] if p.get('symbol') not in syms])
  runtime.save(root/'plan.json',self.plan)
  hashes={n:runtime.hashfile(Path(__file__).parent/n) for n in policy.SOURCE_FILES};review=root/'review-SYNTHETIC-NOT-AUTHORITY.json';runtime.save(review,{'disposition':'ACCEPT','sourceHashes':hashes})
  self.grant=root/'grant-SYNTHETIC-NOT-AUTHORITY.json';runtime.save(self.grant,{'schema':'pr50-i3-execution-grant/1','standing':'PRINCIPAL_APPROVED','principalText':'OFFLINE SYNTHETIC FIXTURE ONLY; NETWORK DISABLED','planSha256':policy.digest(self.plan),'account_id':self.account,'venue':self.plan['venue'],'symbols':self.plan['eligibleAtFreeze'],'intents':['ENTRY','P50','SCHEDULE','TIME_CLOSE_A','TIME_CLOSE_B'],'sourceHashes':hashes,'independentReviewPath':str(review),'independentReviewSha256':runtime.hashfile(review),'validFrom':self.plan['entryWindowUTC'][0],'validUntil':self.plan['awakeUntilUTC'],'maximumSpreads':policy.MAXIMUM_SPREADS,'maximumAggregateGrossWidthUSD':policy.MAXIMUM_AGGREGATE_GROSS_WIDTH_USD,'perSymbolMaximumWidth':policy.PER_SYMBOL_MAXIMUM_WIDTH,'retainedReserveUSD':'2190300'})
 def now(self):return self.at+timedelta(seconds=time.monotonic()-self.realstart)
 def p50row(self,s,state=None):
  en=self.en[s];row=deepcopy(next(x for x in self.base['history'] if x['client_order_id']==en['p50']['client_order_id']));state=state or self.states[s];row.update(state=state,filled_quantity='1' if state=='FILLED' else '0',average_fill_price=en['p50']['limit_price'] if state=='FILLED' else None);row['provider'].update(status='CANCELLED' if state=='CANCELED' else state,filled_quantity=row['filled_quantity']);row['provider']['filled_price']=row['average_fill_price'];return row
 def history(self,stale=False):
  rows=[deepcopy(x) for x in self.base['history'] if x['client_order_id'] not in {v['p50']['client_order_id'] for v in self.en.values()}]
  for s in self.syms:rows.append(self.p50row(s,'PENDING' if stale and s==self.active and self.states[s]=='CANCELED' else None))
  return rows+list(self.new.values())
 def positions(self):
  return [deepcopy(p) for p in self.base['positions'] if p.get('symbol') not in self.syms or self.states[p['symbol']]!='FILLED']
 def working(self):
  cids={v['p50']['client_order_id'] for v in self.en.values()};rows=[deepcopy(x) for x in self.base['working'] if x['client_order_id'] not in cids]
  return rows+[self.p50row(s) for s in self.syms if self.states[s]=='SUBMITTED']+list(self.new.values())
 def reader(self,*args):
  broker=self
  class Reader:
   _secrets=();_signer=SimpleNamespace(sign=lambda req:{'category':'US_OPTION'})
   def accounts(self):return [{'account_id':broker.account,'account_class':'INDIVIDUAL_MARGIN','account_type':'MARGIN'}]
   def balances(self,a):return deepcopy(broker.base['balance'])
   def positions(self,a):return broker.positions()
   def historical_orders(self,*a):return {'complete_for_query':True,'data':[{'orders':[x['provider']]} for x in broker.history()]}
   def working_orders(self,*a):return {'complete_for_query':True,'data':[{'orders':[x['provider']]} for x in broker.working()]}
   def order_detail(self,a,cid):
    for s,en in broker.en.items():
     if cid==en['p50']['client_order_id']:
      broker.polls[s]+=1;scenario=broker.scenarios.get(s,'lag')
      state='PENDING' if scenario=='uncertain' or (scenario=='lag' and broker.polls[s]==1) else broker.states[s]
      return {'orders':[broker.p50row(s,state)['provider']]}
    return {'orders':[next(x['provider'] for x in broker.new.values() if x['client_order_id']==cid)]}
  return Reader()
 def capture(self,item,folder):
  self.active=item['entry']['symbol'];reader=self.reader();self.r.bind(reader,self.account)
  snap={'at':self.now().isoformat(),'balance':deepcopy(self.base['balance']),'history':self.history(stale=folder.name=='after'),'positions':self.positions(),'working':self.working()};runtime.save(folder/'snapshot.json',snap);return reader,snap
 def market(self,*a):
  broker=self
  class Market:
   def close(self):pass
   def get(self,endpoint,**kwargs):
    at=broker.now();meta={'environment':'production','method':'GET','status':200,'completed_utc':at.isoformat()}
    clock={'clock':{'date':policy.EXPIRY.isoformat(),'state':'open','timestamp':int(at.timestamp()),'next_change':'16:00'}}
    if endpoint=='clock':return clock,meta
    books=[]
    for name in kwargs['symbols'].split(','):
     q=deepcopy(broker.bookdata[name]);q.update(bid_date=int(at.timestamp()*1000)-10,ask_date=int(at.timestamp()*1000)-10)
     if name in broker.en:
      strike=float(broker.en[name]['entry']['legs'][0]['strike_price']);q.update(bid=strike-.50,ask=strike-.49)
     books.append(q)
    return {'quotes':{'quote':books}},meta
  return Market()
 def send(self,session,prepared,**kwargs):
  assert prepared.url.startswith('https://api.sandbox.webull.com/trading/orders/');body=json.loads(prepared.body);assert body['account_id']==self.account
  if prepared.url.endswith('/cancel'):
   cid=body['client_order_id'];s=next(s for s,en in self.en.items() if en['p50']['client_order_id']==cid);self.states[s]='FILLED' if self.scenarios.get(s)=='fillrace' else 'CANCELED';self.posts.append(('CANCEL',s));doc={}
  else:
   assert prepared.url.endswith('/place');o=body['new_orders'][0];s=o['symbol'];en=self.en[s];assert o['side']=='BUY' and o['position_intent']=='BUY_TO_CLOSE' and o['option_strategy']=='VERTICAL' and o['time_in_force']=='DAY' and o['quantity']=='1';assert D(o['limit_price'])<=D(en['width']);assert self.states[s]=='CANCELED'
   assert not any(x==('PLACE',s) for x in self.posts);self.posts.append(('PLACE',s));row=self.p50row(s);row.update(order_id='SYNTHETIC-NATIVE-'+s,client_order_id=o['client_order_id'],state='SUBMITTED',limit_price=o['limit_price']);row['provider'].update(order_id=row['order_id'],client_order_id=o['client_order_id'],status='SUBMITTED',limit_price=o['limit_price'],time_in_force='DAY');row['provider']['legs']=deepcopy(row['legs']);self.new[s]=row;doc={'client_order_id':o['client_order_id'],'order_id':row['order_id']}
  class Response:
   status_code=200
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def iter_content(self,*args):yield json.dumps(doc).encode()
  return Response()
 def run(self):
  realqual=self.m.qualify
  with ExitStack() as stack:
   stack.enter_context(patch.object(runtime,'utc',side_effect=self.now));stack.enter_context(patch.object(self.r,'now',side_effect=self.now));stack.enter_context(patch.object(self.r,'_i3_original_capture',side_effect=self.capture,create=True));stack.enter_context(patch.object(self.m.PACER,'wait',lambda *a:None))
   for m in (self.m,self.r.m):
    stack.enter_context(patch.object(m,'Reader',side_effect=self.reader));stack.enter_context(patch.object(m,'load_credentials',return_value=()));stack.enter_context(patch.object(m,'Market',side_effect=self.market));stack.enter_context(patch.object(m,'qualification_slot',side_effect=lambda:nullcontext()));stack.enter_context(patch.object(m,'qualify',side_effect=lambda b,meta,c:realqual(b,meta,c,now=self.now())))
   stack.enter_context(patch('requests.sessions.Session.send',new=lambda sess,prepared,**kw:self.send(sess,prepared,**kw)));stack.enter_context(patch('time.sleep',return_value=None))
   result=manage.manage(self.root,self.plan,self.arm,self.grant,B/'pr47-admission/admission.py','b227f4f9a086358ebecaacd03c9b9d481530caa6a9834a612c1b54379d6514fd',True)
   again=manage.manage(self.root,self.plan,self.arm,self.grant,B/'pr47-admission/admission.py','b227f4f9a086358ebecaacd03c9b9d481530caa6a9834a612c1b54379d6514fd',True)
  assert self.m.position_signature([p for p in self.positions() if p.get('symbol') not in self.syms])==self.foreign_signature
  return result,again

class ManagementPathTests(unittest.TestCase):
 def case(self,syms,scenarios=None):
  with tempfile.TemporaryDirectory() as td:
   broker=BrokerSpecimen(Path(td),syms,scenarios or {});result,again=broker.run();return broker.posts,result,again
 def test_armA_full_atomic_path_and_no_restart_mutation(self):
  posts,result,again=self.case(['META']);self.assertEqual(posts,[('CANCEL','META'),('PLACE','META')]);self.assertEqual(result['outcomes'][0]['status'],'TIME_CLOSE_SUBMITTED');self.assertEqual(result['reconciliation']['unresolvedCount'],0);self.assertTrue(again['observationOnly'])
 def test_armB_full_atomic_path_with_terminal_history_lag(self):
  posts,result,again=self.case(['MSTR']);self.assertEqual(posts,[('CANCEL','MSTR'),('PLACE','MSTR')]);self.assertEqual(result['outcomes'][0]['status'],'TIME_CLOSE_SUBMITTED');self.assertEqual(result['reconciliation']['unresolvedCount'],0)
 def test_fill_race_no_replacement(self):
  posts,result,again=self.case(['META'],{'META':'fillrace'});self.assertEqual(posts,[('CANCEL','META')]);self.assertEqual(result['outcomes'][0]['status'],'P50_FILLED_DURING_CANCEL_NO_NEW_CLOSE')
 def test_uncertain_cancel_isolated_next_item_delivered_no_resend(self):
  posts,result,again=self.case(['MSTR','ORCL'],{'MSTR':'uncertain'});self.assertEqual(posts,[('CANCEL','MSTR'),('CANCEL','ORCL'),('PLACE','ORCL')]);self.assertIn('MANAGEMENT_DELIVERY_FAILURE',result['outcomes'][0]['status']);self.assertEqual(result['outcomes'][1]['status'],'TIME_CLOSE_SUBMITTED')

if __name__=='__main__':unittest.main()
