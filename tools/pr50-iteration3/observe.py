"""Read-only I3 cohort lifecycle/economics projection from retained full cuts.
Never sends, cancels, modifies or infers permissions. Unknowns stay queryable.
"""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from decimal import Decimal as D
import argparse,json,time
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy,runtime
from reuse import components,load

E_PATH=Path.home()/'Library/Application Support/Wheelwright/agent-communication/20261117-pr50/claude-1-I2-lifecycle-E-v3/lifecycle_e.py'
E_SHA='68cb45231ac414ccab42e2dac1eac5c259549d02731752c8ab9e60b8d020bdb7'

def evaluate_cohort(root,cut,foreign_claims=None,e_path=E_PATH,e_sha=E_SHA):
    if runtime.hashfile(e_path)!=e_sha:raise policy.Hold('ACCEPTED_LIFECYCLE_SOURCE_CHANGED')
    E=load('i2_lifecycle',e_path);m,e,_=components();account=cut['account_id']
    from activity_records import cash_records
    history=m.order_records(cut['history']['data'],account);working=m.order_records(cut['working']['data'],account)
    cash=cut.get('cash');cash_events=[] if cash else None
    if cash:
        cash_events=[{**r.get('provider',{}),'net_amount':r['net_amount'],'occurred_at_utc':r.get('occurred_at_utc')} for r in cash_records(cash['data'],account)]
    at=cut['at'];base={'observed_at':at,'decision_cut_at':at,'history_complete':cut['history'].get('complete_for_query') is True,
                      'working_complete':cut['working'].get('complete_for_query') is True,'positions_complete':True,
                      'positions':cut['positions'],'history':history,'working':working,
                      'cash_events':cash_events if cash and cash.get('complete_for_query') is True else None,
                      'lifecycle_events':None,'as_of_date':datetime.fromisoformat(at).astimezone(ZoneInfo('America/New_York')).date().isoformat()}
    plan=json.loads((root/'plan.json').read_bytes());policy.validate_plan(plan);rows=[];started=time.monotonic()
    for symbol in policy.ROSTER:
        folder=root/'entries'/symbol;packet=folder/'prepared-packet.json'
        if not packet.exists():
            rows.append({'symbol':symbol,'arm':plan['assignment'][symbol],'state':'WAIT_OR_NOT_SUBMITTED','unknowns':['NO_NATIVE_ENTRY']});continue
        p=json.loads(packet.read_bytes());o=p['order'];claim=folder/'place-dispatch-claim.json';exits=[]
        xp=root/'p50'/symbol/'prepared-packet.json'
        if xp.exists():
            x=json.loads(xp.read_bytes());exits.append({'client_order_id':x['order']['client_order_id'],'role':'P50','claimed':(xp.parent/'place-dispatch-claim.json').exists(),'readback_verified':(xp.parent/'first-readback.json').exists()})
        arm=plan['assignment'][symbol];tp=root/'management'/arm/'run'/(symbol+'-'+policy.EXPIRY.isoformat())/'prepared-close.json'
        if tp.exists():
            x=json.loads(tp.read_bytes());exits.append({'client_order_id':x['order']['client_order_id'],'role':'TIME_CLOSE','claimed':(tp.parent/'place-dispatch-claim.json').exists(),'readback_verified':(tp.parent/'new-close-readback.json').exists()})
        spread={'account_id':account,'expiry':policy.EXPIRY.isoformat(),'entry_order':o,'entry_claimed':claim.exists(),'exits':exits,'foreign_claims':foreign_claims}
        report=E.evaluate(spread,base);report.update(symbol=symbol,arm=arm,planSha256=policy.digest(plan),economicsBasis='ORDER_PRICE_IMPLIED_UNTIL_EXACT_LEG_CASH_RECONCILIATION',nativeExpiryExerciseAssignmentProof='UNKNOWN_UNLESS_EXPLICIT_NATIVE_LIFECYCLE_FACTS');rows.append(report)
    return {'at':at,'cohort':policy.VERSION,'rows':rows,'classificationSeconds':time.monotonic()-started,'coverage':{'history':base['history_complete'],'working':base['working_complete'],'positions':True,'cash':bool(cash and cash.get('complete_for_query') is True)},'nativeLifecycleSource':'UNKNOWN_NOT_EXPOSED_BY_CURRENT_CAPTURE','cashBridge':'NOT_CERTIFIED_BY_PER_TRADE_CLASSIFICATION','collateralPerTrade':'UNKNOWN; SHARED_ACCOUNT_NOT_PARTITIONED','noBrokerMutations':True}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('root',type=Path);p.add_argument('cut',type=Path);p.add_argument('out',type=Path);p.add_argument('--foreign-claims',type=Path);a=p.parse_args();claims=json.loads(a.foreign_claims.read_bytes()) if a.foreign_claims else None;result=evaluate_cohort(a.root,json.loads(a.cut.read_bytes()),claims);runtime.save(a.out,result);print(json.dumps({'at':result['at'],'states':{x['state']:sum(y['state']==x['state'] for y in result['rows']) for x in result['rows']},'seconds':result['classificationSeconds']},indent=2))
