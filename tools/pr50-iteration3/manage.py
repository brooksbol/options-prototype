"""One-date I3 arm manager. Reuse accepted cancel/readback/atomic close unchanged.
No scheduler installed here. Default is read-only; execution needs the new grant.
"""
from pathlib import Path
from copy import deepcopy
from datetime import datetime,timezone
from decimal import Decimal as D
import argparse,json,time,fcntl
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy,runtime
from reuse import components

def items_for_arm(root,plan,arm,m,e,r):
    result=[]
    for file in sorted((root/'enrollments').glob('*.json')):
        x=json.loads(file.read_bytes())
        if x['arm']!=arm:continue
        symbol=x['symbol']
        if symbol not in policy.ROSTER or x['planSha256']!=policy.validate_plan(plan) or plan['assignment'][symbol]!=arm:
            raise policy.Hold('COHORT_ARM_OR_PLAN_IDENTITY_CHANGED')
        entry=x['entry'];p50=x['p50'];expected=deepcopy(entry)
        expected.update(client_order_id=runtime.new_identity(symbol,'P50'),side='BUY',position_intent='BUY_TO_CLOSE',time_in_force='GTC',limit_price=str(policy.p50(x['openingFill'],x['tick'])))
        for leg,side in zip(expected['legs'],('BUY','SELL')):leg['side']=side
        if entry['client_order_id']!=runtime.new_identity(symbol,'ENTRY') or p50!=expected or any(l['option_expire_date']!=policy.EXPIRY.isoformat() for l in entry['legs']):raise policy.Hold('EXACT_OWN_ENTRY_OR_P50_CHANGED')
        for intent,folder,o,native in [('ENTRY',Path(x['entryFolder']),entry,x['entryNative']),('P50',Path(x['p50Folder']),p50,x['p50Native'])]:
            packet=json.loads((folder/'prepared-packet.json').read_bytes());claim=json.loads((folder/'place-dispatch-claim.json').read_bytes());detail=json.loads((folder/'first-readback.json').read_bytes())
            if packet['order']!=o or packet['account_id']!=x['account_id'] or packet['package']!=m.package(x['account_id'],m.account_scope(x['account_id']),o) or claim['request_sha256']!=packet['package']['sha256']:raise policy.Hold('ORIGINAL_REQUEST_OR_CLAIM_CHANGED')
            rec=m.order_records([detail],x['account_id'])
            if len(rec)!=1 or rec[0]['order_id']!=native:raise policy.Hold('ORIGINAL_NATIVE_BINDING_CHANGED')
            e.verify_geometry(rec[0],o)
            if intent=='ENTRY':contracts=[packet['selection'][k]['contract'] for k in ('short','long')]
        for c,leg in zip(contracts,entry['legs']):
            if c.get('underlying_symbol')!=symbol or c.get('option_type')!='PUT' or c.get('expiration_date')!=policy.EXPIRY.isoformat() or D(c['strike_price'])!=D(leg['strike_price']) or D(c.get('multiplier','0'))!=100 or not isinstance(c.get('symbol'),str) or not c['symbol'].startswith(symbol+policy.EXPIRY.strftime('%y%m%d')+'P'):raise policy.Hold('ENTRY_CONTRACT_METADATA_MISMATCH')
        width=D(entry['legs'][0]['strike_price'])-D(entry['legs'][1]['strike_price'])
        result.append({'account':x['account_id'],'entry':entry,'p50':p50,'entryNative':x['entryNative'],'p50Native':x['p50Native'],'tick':D(x['tick']),'item':{'contracts':contracts},
                       'row':{'label':symbol+'-'+policy.EXPIRY.isoformat(),'width':str(width),'shortStrike':entry['legs'][0]['strike_price'],'cancel':r.policy.cancel_packet(x['account_id'],p50['client_order_id'])}})
    return result

def configure(root,plan,arm,grant_path,admission_path,admission_sha,execute):
    m,e,r=components();policy.validate_plan(plan)
    r.ROOT=root/'management'/arm;r.ROOT.mkdir(mode=0o700,parents=True,exist_ok=True)
    r.START=datetime.fromisoformat(plan['arms'][arm]['selectionAt']);r.END=datetime.fromisoformat(plan['arms'][arm]['mutationDeadline']);r.CLOCK_ANCHOR=None
    items=items_for_arm(root,plan,arm,m,e,r)
    if not items:return m,e,r,items
    if execute:
        for item in items:runtime.authorize(grant_path,plan,item['account'],item['entry']['symbol'],'TIME_CLOSE_'+arm)
    admission=runtime.admission_module(admission_path,admission_sha)
    # Keep all accepted quote/selection/terminal-cancel/no-resend guards. The
    # capacity extension admits current standard foreign constructions conservatively.
    def capacity(snap,width):
        cash,bp=admission.balance(snap['balance']);_,held=admission.positions(snap['positions']);pending=D(0)
        for order in snap['working']:
            shape=admission.order_shape(order)
            if shape['bound'] is None:raise policy.Hold('UNBOUNDED_FOREIGN_WORKING_EXPOSURE')
            pending+=shape['bound']
        a=json.loads(Path(grant_path).read_bytes());reserve=policy.amount(a['retainedReserveUSD']);local=D(0)
        for p in r.ROOT.glob('run/*/prepared-close.json'):
            o=json.loads(p.read_bytes())['order'];local+=abs(D(o['legs'][0]['strike_price'])-D(o['legs'][1]['strike_price']))*100
        required=reserve+held+pending+local+policy.amount(width)*100
        if min(cash,bp)<=required:raise policy.Hold('SHARED_CASH_OR_BP_INSUFFICIENT')
        return {'actualCash':str(cash),'actualOptionBuyingPower':str(bp),'retainedScenario':str(reserve),'heldNoOffsetBound':str(held),'pendingGrossBound':str(pending),'additionalLocalWidth':str(local),'candidateWidth':str(width*100)}
    r.capacity=capacity
    original_guard=r.guard
    # components() is process-cached; capture the base guard once to avoid
    # recursive wrapping on successive read-only/arm invocations in one process.
    if hasattr(r,'_i2_original_guard'):original_guard=r._i2_original_guard
    else:r._i2_original_guard=original_guard
    def guard(t=None,cancel=False):
        original_guard(t,cancel=cancel)
        if execute:
            for item in items:runtime.authorize(grant_path,plan,item['account'],item['entry']['symbol'],'TIME_CLOSE_'+arm)
    r.guard=guard
    # Preserve the reviewed transport; only give native readbacks time to converge.
    original_cancel=getattr(r,'_i3_original_cancel',r.cancel_once);r._i3_original_cancel=original_cancel
    def cancel_once(reader,item,folder,readiness_check):
        class DelayedOriginalReader:
            def __init__(self):self.polls=0
            def __getattr__(self,key):return getattr(reader,key)
            def order_detail(self,account,cid):
                if account!=item['account'] or cid!=item['p50']['client_order_id']:raise runtime.AccountStop('CANCEL_READBACK_IDENTITY_CHANGED')
                if self.polls:time.sleep(1)
                self.polls+=1
                return reader.order_detail(account,cid)
        return original_cancel(DelayedOriginalReader(),item,folder,readiness_check)
    r.cancel_once=cancel_once
    original_capture=getattr(r,'_i3_original_capture',r.capture);r._i3_original_capture=original_capture
    def capture(item,folder):
        reader,snap=original_capture(item,folder)
        if folder.name=='after' and (folder.parent/'cancel-dispatch-claim.json').exists():
            detail=reader.order_detail(item['account'],item['p50']['client_order_id']);runtime.save(folder/'terminal-original-detail.json',detail)
            resolved,row,standing=runtime.resolved_own_history(m,e,snap['history'],detail,item['p50'],item['account'],item['p50Native'])
            if row['state']!='CANCELED' or D(row['filled_quantity'])!=0:raise r.Hold('LOCAL_CANCEL_DETAIL_TERMINAL_CONTRADICTION')
            # A current working row or a fill race is never papered over by detail.
            wanted={e.key(l) for l in item['entry']['legs']}
            if any(any(e.key(l) in wanted for l in x.get('legs',[])) for x in snap['working']):raise r.Hold('LOCAL_POST_CANCEL_WORKING_CONTRADICTION')
            runtime.save(folder/'source-resolution.json',{'standing':standing,'nativeState':row['state'],'noRawCaptureOverwritten':True})
            snap={**snap,'history':resolved}
        return reader,snap
    r.capture=capture
    return m,e,r,items

def global_failure(error,folder,r):
    """Only known cancellation/quote-local failures permit unrelated allocations.
    Unknown placement, account identity/conservation, clock and transport stop all.
    """
    if isinstance(error,runtime.AccountStop) or (folder/'place-dispatch-claim.json').exists():return True
    text=str(error)
    if any(x in text for x in ('PAPER Margin binding','Cash changed','Inventory changed','Incomplete','clock drift','Outside exact','transport changed','request bytes','Frozen close')):return True
    if (folder/'cancel-dispatch-claim.json').exists():
        return not any(x in text for x in ('Cancel remains nonterminal','Cancel rejected/uncertain','Terminal-zero cancel','LOCAL_POST_CANCEL','LOCAL_CANCEL_DETAIL','LOCAL_HISTORY_DETAIL','Quote stale after cancel','Closing quote unqualified','Post-cancel','Pre-cancel quote expired'))
    return isinstance(error,r.Stop)


def manage(root,plan,arm,grant_path,admission_path,admission_sha,execute=False):
    if execute and (root/'account-global-hold.json').exists():return {'status':'ACCOUNT_GLOBAL_HOLD_READBACK_ONLY','arm':arm,'ordersSubmitted':0}
    m,e,r,items=configure(root,plan,arm,grant_path,admission_path,admission_sha,execute)
    if not items:return {'status':'NO_ENROLLED_ALLOCATIONS','arm':arm,'ordersSubmitted':0}
    with (r.ROOT/'executor.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if not execute or (r.ROOT/'run-claim.json').exists():
            folder=r.ROOT/('readback-'+runtime.utc().strftime('%Y%m%dT%H%M%S.%fZ'));folder.mkdir(mode=0o700)
            return r.reconcile_only(items,folder)
        r.selection_time();r.CLOCK_ANCHOR=(r.now(),time.monotonic())
        r.exclusive_claim(r.ROOT/'run-claim.json',{'at':runtime.stamp(),'cohort':policy.VERSION,'arm':arm,'planSha256':policy.digest(plan),'mode':'NO_RESTART_MUTATIONS'})
        run=r.ROOT/'run';run.mkdir(mode=0o700);market=m.Market(run/'selection-market');outcomes=[];account_global_stop=False
        try:
            clock,doc,meta,by=r.books(market,[x['entry']['symbol'] for x in items]);r.selection_time()
            selections=[]
            for item in items:
                symbol=item['entry']['symbol'];q=m.qualify([by[symbol]],meta,clock)
                yes=q['status']=='QUALIFIED' and policy.selected(item['row']['shortStrike'],by[symbol]['bid'],by[symbol]['ask'])
                selections.append({'label':item['row']['label'],'selected':yes,'quality':q,'status':'SELECTED' if yes else 'FARTHER_OTM_P50_RETAINED' if q['status']=='QUALIFIED' else 'UNABLE_TO_EVALUATE'})
            runtime.save(run/'selection.json',{'at':runtime.stamp(),'arm':arm,'rows':selections,'quotes':doc,'meta':meta,'clock':clock,'oneSnapshotOnly':True})
            for item,s in zip(items,selections):
                folder=run/item['row']['label'];folder.mkdir(mode=0o700)
                if not s['selected']:result={'label':s['label'],'status':s['status']}
                else:
                    try:result={'label':s['label'],**r.process(item,market,folder)}
                    except Exception as err:
                        attempted=any((folder/n).exists() for n in ('cancel-dispatch-claim.json','place-dispatch-claim.json'))
                        global_stop=global_failure(err,folder,r)
                        if global_stop:status='ACCOUNT_OR_UNKNOWN_PLACE_STOP'
                        elif attempted:status='MANAGEMENT_DELIVERY_FAILURE_AFTER_CANCEL_NO_RESEND'
                        elif isinstance(err,(r.Hold,policy.Hold)):status='UNABLE_TO_EVALUATE'
                        else:status='MANAGEMENT_DELIVERY_FAILURE'
                        result={'label':s['label'],'status':status,'reason':str(err),'mutationAttempted':attempted,'scope':'ACCOUNT' if global_stop else 'SYMBOL_LOCAL','noReplay':True}
                        runtime.save(folder/'outcome.json',result);outcomes.append(result)
                        if global_stop:
                            account_global_stop=True;break
                        continue
                runtime.save(folder/'outcome.json',result);outcomes.append(result)
        except Exception as err:
            account_global_stop=isinstance(err,runtime.AccountStop)
            runtime.save(run/'fatal-exception.json',{'at':runtime.stamp(),'reason':str(err),'state':'MANAGEMENT_DELIVERY_FAILURE','noResend':True})
        finally:
            market.close();done={x['label'] for x in outcomes}
            for item in items:
                if item['row']['label'] not in done:outcomes.append({'label':item['row']['label'],'status':'NOT_ATTEMPTED_AFTER_STOP_OR_SELECTION_FAILURE'})
            final=run/'final';final.mkdir(mode=0o700)
            try:reconciled=r.reconcile_only(items,final)
            except Exception as err:
                if isinstance(err,runtime.AccountStop):account_global_stop=True
                reconciled={'unresolvedCount':None,'reason':str(err)}
            if account_global_stop and not (root/'account-global-hold.json').exists():runtime.save(root/'account-global-hold.json',{'at':runtime.stamp(),'phase':'MANAGEMENT_'+arm,'reason':'ACCOUNT_OR_UNKNOWN_PLACEMENT_INVARIANT'})
            runtime.save(run/'summary.json',{'at':runtime.stamp(),'cohort':policy.VERSION,'arm':arm,'outcomes':outcomes,'accountGlobalStop':account_global_stop,'scope':'ACCOUNT' if account_global_stop else 'COHORT','reconciliation':reconciled,'notAFlatGuarantee':True,'noResend':True,'deadline':r.END.isoformat()})
        return json.loads((run/'summary.json').read_bytes())

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('root',type=Path);p.add_argument('--arm',choices=['A','B'],required=True);p.add_argument('--grant',type=Path);p.add_argument('--admission',type=Path,required=True);p.add_argument('--admission-sha',required=True);p.add_argument('--execute',action='store_true');a=p.parse_args();plan=json.loads((a.root/'plan.json').read_bytes());print(json.dumps(manage(a.root,plan,a.arm,a.grant,a.admission,a.admission_sha,a.execute),indent=2))
