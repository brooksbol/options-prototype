"""Offline decision-time replay and SDK packet preparation, never execution.
Historical qualification is labeled; future dispatch MUST refresh sources.
"""
from pathlib import Path
from datetime import datetime
import argparse,json,time,statistics,math,hashlib
from datetime import timezone
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy
from runtime import save,new_identity
from reuse import components,BASE

def prepare(discovery,out):
    start=time.monotonic();m,_,_=components();plan=policy.freeze_plan();policy.validate_plan(plan)
    catalog_root=discovery/'catalog';quotes_root=discovery/'quotes'
    request=json.loads((catalog_root/'request.json').read_bytes())
    if request['symbols_literal']!=policy.ROSTER or request['expiry']!=policy.EXPIRY.isoformat():raise policy.Hold('EXACT_52_TARGET_DISCOVERY_REQUIRED')
    if request.get('synthetic') is True:raise policy.Hold('SYNTHETIC_DISCOVERY_NEVER_EXECUTABLE')
    cat=json.loads((catalog_root/'results.json').read_bytes());quoted=json.loads((quotes_root/'results.json').read_bytes())
    if len(cat['rows'])!=52 or {x['symbol'] for x in cat['rows']}!=set(policy.ROSTER):raise policy.Hold('EXACT_52_OUTCOME_COVERAGE')
    manifest={str(p.relative_to(discovery)):hashlib.sha256(p.read_bytes()).hexdigest() for p in discovery.rglob('*') if p.is_file() and p.name!='final-manifest.json'}
    if (discovery/'final-manifest.json').exists():
        if json.loads((discovery/'final-manifest.json').read_bytes())!=manifest:raise policy.Hold('DISCOVERY_SOURCE_BYTES_CHANGED')
    else:save(discovery/'final-manifest.json',manifest)
    byquote={x['symbol']:x for x in quoted['rows']};rows=[]
    for source in cat['rows']:
        row=dict(source);q=byquote.get(row['symbol'],{})
        if q.get('status')=='DISCOVERY_PAIR_QUOTED_NOT_TRADE_READY':row['status']='DISCOVERY_PAIR_OBSERVED_NOT_TRADE_READY'
        else:row['reason']=q.get('reason',row.get('reason','DISCOVERY_WAIT'))
        rows.append(row)
    result=[];durations=[]
    anchor=json.loads((BASE/'one-shot-margin-20261117/prepared-packet.json').read_bytes());account=anchor['account_id']
    for symbol in policy.ROSTER:
        t=time.monotonic();r=next(x for x in rows if x['symbol']==symbol);row={'symbol':symbol,'arm':plan['assignment'][symbol],'status':'WAIT','reason':r.get('reason'),'standing':'HISTORICAL_DISCOVERY_REPLAY_NOT_CURRENT_DISPATCH_QUALIFICATION','executionAuthorized':False}
        try:
            if symbol not in policy.PER_SYMBOL_MAXIMUM_WIDTH:raise policy.Hold('WAIT_NO_APPROVED_WIDTH_CAP')
            if symbol in ('SPX','XSP','VIX'):raise policy.Hold('INDEX_SETTLEMENT_UNSUPPORTED_BY_PHYSICAL100_PIPELINE')
            if r['status']!='DISCOVERY_PAIR_OBSERVED_NOT_TRADE_READY':raise policy.Hold(r.get('reason') or 'DISCOVERY_WAIT')
            contracts=json.loads((catalog_root/symbol/'validated-catalog.json').read_bytes());contracts=m.validate_catalog(contracts,symbol,'PUT')
            g=json.loads((catalog_root/symbol/'greek-worker-result.json').read_bytes());q=json.loads((quotes_root/symbol/'response.json').read_bytes())
            when=datetime.fromisoformat(q['metadata']['completed_utc']);selection=policy.select(contracts,g.get('greeks',[]),when.timestamp()*1000)
            if any(selection[k]['contract']['instrument_id']!=r[k]['contract']['instrument_id'] for k in ('short','long')):raise policy.Hold('SOURCE_SELECTION_CLOCK_OR_IDENTITY_MISMATCH')
            names=[symbol]+[selection[k]['contract']['symbol'] for k in ('short','long')];by=m.quote_map(q['data'],names);quality=m.qualify([by[x] for x in names],q['metadata'],q['session_clock'],now=when)
            if quality['status']!='QUALIFIED':raise policy.Hold('QUOTE_UNQUALIFIED_AT_OWN_RECEIPT')
            terms=policy.economics(by[names[1]],by[names[2]],[selection[k]['contract'] for k in ('short','long')]);
            if policy.amount(terms['width'])>policy.amount(policy.PER_SYMBOL_MAXIMUM_WIDTH[symbol]):raise policy.Hold('WAIT_REQUALIFIABLE_WIDTH_CAP')
            order=policy.entry_order(symbol,selection,terms,new_identity(symbol,'ENTRY'));packet={'account_id':account,'order':order,'package':m.package(account,m.account_scope(account),order),'arm':row['arm'],'planSha256':policy.digest(plan),'selection':selection,'terms':terms,'executionAuthorized':False,'sourceAt':when.isoformat()};row['packet']=packet
            row.update(status='QUALIFIED_AT_CAPTURE_REQUIRES_CURRENT_ADMISSION',reason='SOURCE_QUOTE_DELTA_CONSTRUCTION_PASSED_AT_CAPTURE',sourceAt=when.isoformat(),shortStrike=order['legs'][0]['strike_price'],longStrike=order['legs'][1]['strike_price'],**terms)
        except (policy.Hold,RuntimeError,ValueError,KeyError,FileNotFoundError) as exc:row['reason']=str(exc)
        row['preparationSeconds']=time.monotonic()-t;durations.append(row['preparationSeconds']);result.append(row)
    good=[x for x in result if x['status'].startswith('QUALIFIED_')];plan=policy.freeze_plan()
    eligibility={'sourceManifestSha256':hashlib.sha256((discovery/'final-manifest.json').read_bytes()).hexdigest(),'rows':[{k:v for k,v in row.items() if k not in ('packet','arm','preparationSeconds')} for row in result],'method':'PRESERVED_APPROVED_CAP_MEMBERSHIP_BEFORE_MARKET; MECHANICAL_CAPTURE_QUALIFICATION_ATTRITION; NO_MANUAL_EDITS'}
    save(out/'eligibility-evidence.json',eligibility)
    save(out/'freeze-receipt.json',{'at':datetime.now(timezone.utc).isoformat(),'planSha256':policy.digest(plan),'eligibilityEvidenceSha256':hashlib.sha256((out/'eligibility-evidence.json').read_bytes()).hexdigest(),'assignmentSeed':policy.SEED,'noOrdersBeforeFreeze':True,'noArmOutputBeforeReceipt':True,'discoveryManifestSha256':hashlib.sha256((discovery/'final-manifest.json').read_bytes()).hexdigest(),'catalogRoot':str(catalog_root.resolve())})
    save(out/'plan.json',plan)
    for row in result:
        row['arm']=plan['assignment'][row['symbol']]
        if 'packet' in row:
            packet=row.pop('packet');packet.update(arm=row['arm'],planSha256=policy.digest(plan));save(out/'packets'/(row['symbol']+'.json'),packet)
    metrics={'totalSeconds':time.monotonic()-start,'rows':52,'qualifiedAtCapture':len(good),'WAIT':52-len(good),'armQualifiedCounts':{a:sum(x['arm']==a for x in good) for a in ('A','B')},'medianPreparationSeconds':statistics.median(durations),'p95PreparationSeconds':sorted(durations)[math.ceil(.95*len(durations))-1],'sumPreparationSeconds':sum(durations),'aggregateGrossWidthUSD':str(sum((policy.amount(x['width'])*100 for x in good),policy.amount(0))),'theoreticalMaxLossAtLimitsUSD':str(sum((policy.amount(x['theoreticalMaxLossAtLimitUSD']) for x in good),policy.amount(0))),'sourceFreshness':'HISTORICAL_AT_CAPTURE_ONLY; CURRENT_GREEKS_QUOTES_ACCOUNT_REQUIRED_ON_EXECUTION','ordersSubmitted':0}
    save(out/'readiness.json',{'planSha256':policy.digest(plan),'metrics':metrics,'rows':result});return metrics

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('discovery',type=Path);p.add_argument('out',type=Path);a=p.parse_args();a.out.mkdir(mode=0o700,parents=True,exist_ok=False);print(json.dumps(prepare(a.discovery,a.out),indent=2))
