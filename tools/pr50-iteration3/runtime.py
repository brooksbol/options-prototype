"""I3 scoped batch entry + immediate P50, using accepted transport/claims/pacer.

No credentials or mutation on import. prepare/readback are read-only. execute
requires a NEW exact plan/source/account/ceiling/time-bound Principal grant.
"""
from pathlib import Path
from datetime import datetime, timezone
from decimal import Decimal as D
from copy import deepcopy
import hashlib,json,time,uuid,os
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy
from reuse import components, load

ROOT=Path(__file__).resolve().parent

class AccountStop(policy.Hold):
    """Account/source binding or unknown placement; no unrelated dispatch."""

UNKNOWN_PLACEMENT_STATES=frozenset(('UNACKNOWLEDGED_ENTRY_READBACK_ONLY','P50_INTENT_OR_ACK_UNCERTAIN_READBACK_ONLY','P50_RECOVERY_UNRESOLVED_READBACK_ONLY'))

class LocalPending(policy.Hold):
    """Known original entry; durable original-ID watch, never entry replay."""


def configure_environment():
    """Frozen executable discovery, process-local only; no machine/user settings."""
    value=json.loads((ROOT/'environment.json').read_bytes())
    node=Path(value['node']);python=Path(value['python'])
    if value.get('schema')!='pr50-process-environment/1' or value.get('processOnly') is not True or not node.is_file() or not os.access(node,os.X_OK) or not python.is_file():raise AccountStop('SCHEDULED_EXECUTABLE_ENVIRONMENT_UNAVAILABLE')
    node_dir=str(node.parent)
    if os.environ.get('PATH','').split(os.pathsep)[0]!=node_dir:os.environ['PATH']=node_dir+os.pathsep+os.environ.get('PATH','')
    return value


def utc():return datetime.now(timezone.utc)
def stamp():return utc().isoformat()
def hashfile(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def save(path,value):
    path=Path(path);path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    with path.open('x') as f:
        json.dump(value,f,indent=2,allow_nan=False);f.write('\n');f.flush();os.fsync(f.fileno())
    path.chmod(0o600)

def new_identity(symbol,intent):
    return 'P50I3'+uuid.uuid5(uuid.NAMESPACE_URL,policy.VERSION+'|'+symbol+'|'+intent).hex[:27]

def authorize(path,plan,account,symbol,intent):
    """Does not authenticate testimony: owner persists direct Principal grant AFTER approval.
    Exact source/plan/account binding, finite bounds and closed date are enforced.
    """
    if path is None:raise policy.Hold('NEW_PRINCIPAL_GRANT_REQUIRED')
    a=json.loads(Path(path).read_bytes());digest=policy.validate_plan(plan)
    if a.get('schema')!='pr50-i3-execution-grant/1' or a.get('standing')!='PRINCIPAL_APPROVED' or not a.get('principalText'):
        raise policy.Hold('NEW_PRINCIPAL_GRANT_REQUIRED')
    if a.get('planSha256')!=digest or a.get('account_id')!=account or a.get('venue')!=plan['venue']:
        raise policy.Hold('GRANT_ACCOUNT_OR_PLAN_MISMATCH')
    if symbol not in a.get('symbols',[]) or symbol not in policy.ROSTER or intent not in a.get('intents',[]):
        raise policy.Hold('OUTSIDE_APPROVED_SCOPE')
    if not all(hashfile(ROOT/name)==a.get('sourceHashes',{}).get(name) for name in policy.SOURCE_FILES):
        raise policy.Hold('EXACT_SOURCE_REVIEW_BINDING_MISSING')
    review=json.loads(Path(a['independentReviewPath']).read_bytes())
    if hashfile(a['independentReviewPath'])!=a.get('independentReviewSha256') or review.get('disposition')!='ACCEPT' or review.get('sourceHashes')!=a['sourceHashes']:
        raise policy.Hold('INDEPENDENT_EXACT_SOURCE_ACCEPTANCE_REQUIRED')
    if a.get('maximumSpreads')!=policy.MAXIMUM_SPREADS or policy.amount(a.get('maximumAggregateGrossWidthUSD'))!=policy.amount(policy.MAXIMUM_AGGREGATE_GROSS_WIDTH_USD) or a.get('perSymbolMaximumWidth')!=policy.PER_SYMBOL_MAXIMUM_WIDTH:
        raise AccountStop('APPROVED_RISK_LIMITS_CHANGED')
    if symbol not in policy.PER_SYMBOL_MAXIMUM_WIDTH:raise policy.Hold('WAIT_NO_APPROVED_WIDTH_CAP')
    now=utc();start=datetime.fromisoformat(a['validFrom']);end=datetime.fromisoformat(a['validUntil'])
    if start.tzinfo is None or end.tzinfo is None or not start<=now<end:
        raise policy.Hold('GRANT_OUTSIDE_WINDOW')
    end_entry=plan['p50LatestUTC'] if intent=='P50' else plan['entryWindowUTC'][1]
    if intent in ('ENTRY','P50','WAIT_REQUALIFICATION') and (now.date()!=policy.ENTRY_DATE or not datetime.fromisoformat(plan['entryWindowUTC'][0])<=now<datetime.fromisoformat(end_entry)):
        raise policy.Hold('ENTRY_DATE_OR_WINDOW')
    return a

def capture(m,reader,account,folder,full_cash=False):
    t=time.monotonic();seq=reader._sequence
    accounts=reader.accounts()
    if m.HOST!='api.sandbox.webull.com' or len([a for a in accounts if a.get('account_id')==account and a.get('account_class')=='INDIVIDUAL_MARGIN' and a.get('account_type')=='MARGIN'])!=1:
        raise AccountStop('PAPER_MARGIN_IDENTITY')
    opening=reader.balances(account);pos=reader.positions(account);working=reader.working_orders(account)
    history=reader.historical_orders(account,'2026-11-17T00:00:00+00:00',stamp())
    cash=reader.cash_activities(account,'2026-11-17T00:00:00+00:00',stamp()) if full_cash else None
    endpos=reader.positions(account);endworking=reader.working_orders(account);balance=reader.balances(account)
    s={'at':stamp(),'account_id':account,'accounts':accounts,'opening_balance':opening,'opening_positions':pos,
       'opening_working':working,'history':history,'cash':cash,'positions':endpos,'working':endworking,'balance':balance,
       'seconds':time.monotonic()-t,'requestCount':reader._sequence-seq}
    if m.position_signature(pos)!=m.position_signature(endpos) or opening['total_cash_balance']!=balance['total_cash_balance']:
        raise AccountStop('ACCOUNT_CHANGED_WITHIN_BRACKET')
    def ws(x):
        rows=m.order_records(x['data'],account)
        return sorted(json.dumps({k:r.get(k) for k in ('order_id','client_order_id','state','quantity','filled_quantity','side','limit_price','legs')},sort_keys=True) for r in rows)
    if ws(working)!=ws(endworking) or any(x.get('complete_for_query') is not True for x in (working,endworking,history)):
        raise AccountStop('INCOMPLETE_OR_MOVING_ACCOUNT_ACTIVITY')
    save(folder/'account-cut.json',s);return s

def new_native_identity_absent(m,snapshot,order):
    for name in ('history','working'):
        if snapshot[name].get('complete_for_query') is not True:raise AccountStop('NATIVE_ID_ABSENCE_COVERAGE_MISSING')
        if any(row['client_order_id']==order['client_order_id'] for row in m.order_records(snapshot[name]['data'],snapshot['account_id'])):
            raise AccountStop('EXISTING_NATIVE_IDENTITY_READBACK_ONLY_NO_REISSUE')


def scoped_no_competition(m,snapshot,entry,allowed):
    wanted={(l['symbol'],l['option_expire_date'],l['option_type'],D(l['strike_price'])) for l in entry['legs']}
    def key(l):return (l.get('symbol'),l.get('option_expire_date'),l.get('option_type'),D(str(l.get('strike_price',l.get('option_exercise_price',0)))))
    for row in m.order_records(snapshot['history']['data'],snapshot['account_id']):
        if row['client_order_id'] in allowed:continue
        if row['state'] in ('CANCELED','CANCELLED','FAILED','REJECTED') and D(row['filled_quantity'])==0:continue
        if any(key(l) in wanted for l in (row.get('legs') or [])):raise policy.Hold('COMPETING_EXACT_CONTRACT_ACTIVITY')
    return wanted

def held_one(m,snapshot,entry,allowed):
    wanted=scoped_no_competition(m,snapshot,entry,allowed)
    rows=[p for p in snapshot['positions'] if any((l.get('symbol'),l.get('option_expire_date'),l.get('option_type'),D(str(l.get('option_exercise_price',0)))) in wanted for l in p.get('legs',[]))]
    if len(rows)!=1 or rows[0].get('option_strategy')!='VERTICAL' or D(rows[0]['quantity'])!=-1:
        raise policy.Hold('UNIQUE_OWNED_HELD_ONE_NOT_ESTABLISHED')
    row=rows[0]
    keys={(l.get('symbol'),l.get('option_expire_date'),l.get('option_type'),D(str(l.get('option_exercise_price',0)))) for l in row.get('legs',[])}
    if row.get('currency')!='USD' or row.get('symbol')!=entry['symbol'] or len(row.get('legs',[]))!=2 or keys!=wanted:
        raise policy.Hold('HELD_VERTICAL_CONTRACT_GEOMETRY')
    for l in rows[0]['legs']:
        if D(l['option_contract_multiplier'])!=100 or D(l['option_contract_deliverable'])!=100:raise policy.Hold('NONSTANDARD_HELD')
    for row in m.order_records(snapshot['working']['data'],snapshot['account_id']):
        if any((l.get('symbol'),l.get('option_expire_date'),l.get('option_type'),D(str(l.get('strike_price',0)))) in wanted for l in (row.get('legs') or [])):
            raise policy.Hold('EXISTING_WORKING_ORDER_TOUCHES_CONTRACTS')
    return rows[0]

def admission_module(path,sha):
    if hashfile(path)!=sha:raise policy.Hold('ACCOUNT_ADMISSION_SOURCE_CHANGED')
    return load('i2_admission',path)

def dispatch(m,reader,packet,folder,validator,send_guard,metrics):
    class Sender(m._PR47SingleSender):
        def __init__(self):
            self.expected=deepcopy(packet['order']);super().__init__(reader,packet['account_id'],packet['order'],folder)
            self.validate_geometry()
        def validate_geometry(self):
            if self.order!=self.expected or self.package!=packet['package']:raise policy.Hold('EXACT_PACKET_CHANGED')
            validator(self.order)
        def dispatch(self,preview=False,placement_authorized=False):
            if preview or placement_authorized is not True:raise policy.Hold('EXPLICIT_REVIEWED_PLACEMENT_ONLY')
            return super().dispatch(False,placement_authorized=True)
    sender=Sender();original=sender.session.send
    def guarded(prepared,**kwargs):
        sender.validate_geometry();send_guard()
        if prepared.method!='POST' or prepared.url!='https://api.sandbox.webull.com/trading/orders/place' or hashlib.sha256(prepared.body).hexdigest()!=packet['package']['sha256'] or prepared.headers.get('category')!='US_OPTION':raise policy.Hold('SIGNED_TRANSPORT_CHANGED')
        return original(prepared,**kwargs)
    sender.session.send=guarded;t=time.monotonic();result=sender.place_once(placement_authorized=True);metrics['claimThroughAckSeconds']=time.monotonic()-t
    if not m.positive_ack(result,packet['order']):raise AccountStop('UNCERTAIN_ACK_STOP_NO_RESEND')
    t=time.monotonic();detail=reader.order_detail(packet['account_id'],packet['order']['client_order_id']);save(folder/'first-readback.json',detail);metrics['ackToReadbackSeconds']=time.monotonic()-t
    rows=m.order_records([detail],packet['account_id'])
    if len(rows)!=1 or rows[0]['order_id']!=result['response']['order_id']:raise policy.Hold('NATIVE_READBACK_IDENTITY')
    row=rows[0];o=packet['order'];native=row.get('provider',{})
    if row.get('account_id')!=packet['account_id'] or native.get('account_id') not in (None,packet['account_id']) or native.get('order_type')!='LIMIT' or native.get('time_in_force')!=o['time_in_force'] or D(row['limit_price'])!=D(o['limit_price']):raise policy.Hold('NATIVE_ORDER_TERMS_OR_ACCOUNT_CHANGED')
    if row['state'] not in ('PENDING','SUBMITTED','PARTIALLY_FILLED','FILLED') or not 0<=D(row['filled_quantity'])<=1:raise policy.Hold('NATIVE_ORDER_STATE_OR_QUANTITY')
    if D(row['filled_quantity'])>0:
        fill=policy.amount(row['average_fill_price']);limit=D(o['limit_price'])
        if fill<0 or (o['side']=='BUY' and fill>limit) or (o['side']=='SELL' and fill<limit):raise policy.Hold('NATIVE_FILL_WORSE_THAN_LIMIT')
    return row

def admission_cut(m,s):
    from activity_records import cash_records
    return {**s,'host':'api.sandbox.webull.com','closing_balance':s['balance'],
            'closing_positions':s['positions'],'closing_working':s['working'],
            'opening_working_orders':m.order_records(s['opening_working']['data'],s['account_id']),
            'working_orders':m.order_records(s['working']['data'],s['account_id']),
            'orders':m.order_records(s['history']['data'],s['account_id']),
            'cash':s['cash'] or {'complete_for_query':False},
            'cash_records':cash_records(s['cash']['data'],s['account_id']) if s['cash'] else []}

def check_budget(grant,root,symbol,width):
    width=policy.amount(width);total=width*100;count=1
    for p in (root/'entries').glob('*/prepared-packet.json'):
        if p.parent.name==symbol or not (p.parent/'place-dispatch-claim.json').exists():continue
        x=json.loads(p.read_bytes())['order'];total+=(D(x['legs'][0]['strike_price'])-D(x['legs'][1]['strike_price']))*100;count+=1
    if count>policy.amount(grant['maximumSpreads']) or total>policy.amount(grant['maximumAggregateGrossWidthUSD']) or width>policy.amount(grant['perSymbolMaximumWidth'][symbol]):
        raise policy.Hold('COHORT_OR_SYMBOL_WIDTH_CEILING')

def own_claims(root,foreign_claims):
    claims=deepcopy(foreign_claims)
    for p in root.glob('**/place-dispatch-claim.json'):
        packet_path=p.parent/'prepared-packet.json'
        if not packet_path.exists():raise policy.Hold('UNBOUND_LOCAL_DISPATCH_CLAIM')
        x=json.loads(packet_path.read_bytes());c=json.loads(p.read_bytes())
        if c['request_sha256']!=x['package']['sha256']:raise policy.Hold('LOCAL_CLAIM_HASH_MISMATCH')
        claims.append({'account_id':x['account_id'],'order':x['order'],'request_sha256':c['request_sha256'],'claim_request_sha256':c['request_sha256']})
    return claims

def claims_unchanged(inventory,run_root):
    """Read-only guard on existing sender roots; no new claim registry/service.
    Historical dispositions are supplied by peer-owned accepted proof, while
    this guard detects any new/changed foreign attempts before broker reflection.
    """
    roots=inventory.get('claimRoots');expected=inventory.get('observedClaimFiles')
    if not roots or not isinstance(expected,dict):raise policy.Hold('FOREIGN_CLAIM_SOURCE_COVERAGE_MISSING')
    current={};own=Path(run_root).resolve()
    for name in roots:
        root=Path(name).resolve()
        if not root.is_dir():raise policy.Hold('FOREIGN_CLAIM_ROOT_MISSING')
        for p in root.rglob('*claim*.json'):
            if p.is_file() and not p.resolve().is_relative_to(own):current[str(p.resolve())]=hashfile(p)
    if current!=expected:raise policy.Hold('FOREIGN_CLAIM_SET_OR_FACT_CHANGED')
    for name,digest in inventory.get('guardedSources',{}).items():
        if hashfile(name)!=digest:raise policy.Hold('FOREIGN_CLAIM_DISPOSITION_SOURCE_CHANGED')
    return current


def poll_entry(m,e,reader,account,order,entry,folder):
    for poll in range(3):
        if entry['state']=='FILLED' and D(entry['filled_quantity'])==1:break
        if poll:time.sleep(1)
        detail=reader.order_detail(account,order['client_order_id']);save(folder/('entry-poll-'+str(poll)+'.json'),detail)
        rows=m.order_records([detail],account)
        if len(rows)!=1 or rows[0]['order_id']!=entry['order_id']:raise policy.Hold('ENTRY_POLL_IDENTITY_CONFLICT')
        e.verify_geometry(rows[0],order);entry=rows[0]
    return entry

def resolved_own_history(m,e,history,detail,order,account,native):
    """Only same-ID nonterminal lag may yield to explicit terminal detail.
    Caller must separately prove current held/working/account conservation.
    Conflicting executions/terminal facts never yield to newer-looking data.
    """
    matches=[x for x in history if x['client_order_id']==order['client_order_id']]
    dr=m.order_records([detail],account)
    if len(dr)!=1 or len(matches)!=1:raise policy.Hold('LOCAL_OWN_ID_COVERAGE_AMBIGUOUS')
    old,new=matches[0],dr[0]
    for row in (old,new):
        e.verify_geometry(row,order)
        if row['account_id']!=account or row['order_id']!=native:raise AccountStop('OWN_NATIVE_IDENTITY_CONFLICT')
        if D(row['quantity'])!=1 or D(row['filled_quantity']) not in (0,1):raise policy.Hold('LOCAL_PARTIAL_OR_INVALID_QUANTITY')
    signature=lambda x:(x['state'],D(x['filled_quantity']),None if x.get('average_fill_price') is None else D(x['average_fill_price']))
    if signature(old)==signature(new):return history,new,'CONSISTENT'
    if old['state'] not in ('PENDING','SUBMITTED') or D(old['filled_quantity'])!=0 or new['state'] not in ('FILLED','CANCELED'):
        raise policy.Hold('LOCAL_HISTORY_DETAIL_CONTRADICTION')
    if new['state']=='FILLED' and (D(new['filled_quantity'])!=1 or D(new['average_fill_price'])<0):raise policy.Hold('LOCAL_FILL_INVALID')
    if new['state']=='CANCELED' and D(new['filled_quantity'])!=0:raise policy.Hold('LOCAL_CANCEL_HAS_FILL')
    return [new if x is old else x for x in history],new,'ORIGINAL_ID_TERMINAL_DETAIL_SUPERSEDES_NONTERMINAL_HISTORY'


def execute_candidate(symbol,plan,catalog_root,run_root,grant_path,claims_path,admission_path,admission_sha):
    """One new entry, then one P50 after a fully verified fill. No entry replay."""
    configure_environment()
    if (Path(run_root)/'account-global-hold.json').exists():raise AccountStop('ACCOUNT_GLOBAL_HOLD_READBACK_ONLY')
    m,e,_=components();anchor=json.loads((Path.home()/'Library/Application Support/Wheelwright/agent-communication/20261117-pr50/one-shot-margin-20261117/prepared-packet.json').read_bytes());account=anchor['account_id']
    grant=authorize(grant_path,plan,account,symbol,'ENTRY')
    if symbol not in policy.ROSTER:raise policy.Hold('OUTSIDE_ROSTER')
    if symbol not in policy.PER_SYMBOL_MAXIMUM_WIDTH:raise policy.Hold('WAIT_NO_APPROVED_WIDTH_CAP')
    ctx=Path(run_root);folder=ctx/'entries'/symbol
    if folder.exists():raise policy.Hold('EXISTING_ENTRY_INTENT_READBACK_ONLY_NO_REPLAY')
    folder.mkdir(mode=0o700,parents=True);metrics={'symbol':symbol,'arm':plan['assignment'][symbol],'startedAt':stamp()};start=time.monotonic()
    reader=m.Reader(*m.load_credentials(),folder/'broker');admission=admission_module(admission_path,admission_sha)
    foreign=json.loads(Path(claims_path).read_bytes())
    if foreign.get('standing')!='CURRENT_QUALIFIED_CLAIM_INVENTORY' or foreign.get('account_id')!=account:
        raise policy.Hold('QUALIFIED_ACCOUNT_GLOBAL_CLAIM_INVENTORY_REQUIRED')
    claims_unchanged(foreign,ctx)
    if hashfile(claims_path)!=grant.get('claimInventorySha256') or admission_sha!=grant.get('admissionSha256'):
        raise policy.Hold('GRANT_CLAIMS_OR_ADMISSION_MISMATCH')
    m.CATALOG_ROOT=Path(catalog_root);m.EXPIRY=policy.EXPIRY.isoformat();m.ROOT=folder
    with m.qualification_slot():
        t=time.monotonic();selection=m.fresh_selection(symbol,folder);metrics['freshGreekSelectionSeconds']=time.monotonic()-t
        # Re-evaluate pure I2 selector against retained complete catalog/Greek capture.
        contracts=json.loads((Path(catalog_root)/symbol/'validated-catalog.json').read_bytes());greeks=json.loads((folder/'fresh-greeks.json').read_bytes())
        checked=policy.select(contracts,greeks.get('greeks',[]),time.time()*1000)
        if any(checked[k]['contract']!=selection[k]['contract'] for k in ('short','long')):raise policy.Hold('SELECTION_REPLAY_MISMATCH')
        claims_unchanged(foreign,ctx)
        check_budget(grant,ctx,symbol,D(selection['short']['contract']['strike_price'])-D(selection['long']['contract']['strike_price']))
        snapshot=capture(m,reader,account,folder/'entry-proof',full_cash=True);metrics['account']=dict(seconds=snapshot['seconds'],requestCount=snapshot['requestCount'])
        m.PACER.wait('webull:place',2.05)
        market=m.Market(folder/'quotes')
        try:
            t=time.monotonic();clock,_=market.get('clock');symbols=[symbol]+[selection[k]['contract']['symbol'] for k in ('short','long')];doc,meta=market.get('quotes',symbols=','.join(symbols),greeks='false');books=m.quote_map(doc,symbols);quality=m.qualify([books[s] for s in symbols],meta,clock)
            if quality['status']!='QUALIFIED':raise policy.Hold('ENTRY_QUOTES_UNQUALIFIED')
            terms=policy.economics(books[symbols[1]],books[symbols[2]],[selection[k]['contract'] for k in ('short','long')]);metrics['qualificationSeconds']=time.monotonic()-t
            check_budget(grant,ctx,symbol,terms['width']);t=time.monotonic();order=policy.entry_order(symbol,selection,terms,new_identity(symbol,'ENTRY'));packet={'account_id':account,'order':order,'package':m.package(account,m.account_scope(account),order),'selection':selection,'terms':terms,'planSha256':policy.digest(plan),'arm':plan['assignment'][symbol]};metrics['orderPreparationSeconds']=time.monotonic()-t
            new_native_identity_absent(m,snapshot,order)
            candidate={'account_id':account,'order':order};proof=admission.admit(admission_cut(m,snapshot),candidate,own_claims(ctx,foreign['claims']),foreign['retainedReserveUSD']);save(folder/'admission.json',proof);save(folder/'prepared-packet.json',packet);save(folder/'decision.json',{'at':stamp(),'plan':plan['version'],'arm':plan['assignment'][symbol],'quality':quality,'quotes':doc,'metadata':meta,'clock':clock,'terms':terms,'events':foreign.get('researchBySymbol',{}).get(symbol,{'standing':'UNKNOWN'}),'P50Precommitted':True})
            expected=deepcopy(order)
            def validate(o):
                if o!=expected:raise policy.Hold('ENTRY_NOT_FROZEN_REVERSE_PUT_GEOMETRY')
            def guard():
                authorize(grant_path,plan,account,symbol,'ENTRY');claims_unchanged(foreign,ctx);m.check_greek_age(selection);check_budget(grant,ctx,symbol,terms['width'])
                if not 0<=(utc()-datetime.fromisoformat(snapshot['at'])).total_seconds()<=15:raise policy.Hold('ACCOUNT_PROOF_EXPIRED')
                if m.qualify([books[s] for s in symbols],meta,clock)['status']!='QUALIFIED':raise policy.Hold('ENTRY_QUOTE_EXPIRED')
            save(folder/'pending-intent.json',{'symbol':symbol,'account_id':account,'arm':plan['assignment'][symbol],'order':order,'terms':terms,'state':'ORIGINAL_INTENT_NO_RESEND','at':stamp()})
            entry=dispatch(m,reader,packet,folder,validate,guard,metrics)
            e.verify_geometry(entry,order)
            entry=poll_entry(m,e,reader,account,order,entry,folder)
            if entry['state']!='FILLED' or D(entry['filled_quantity'])!=1:
                raise LocalPending('ENTRY_ACK_KNOWN_WORKING; ORIGINAL_ID_WATCH_REQUIRED')
            fill=D(entry['average_fill_price'])
            if not 0< D(order['limit_price'])<=fill<D(terms['width']):raise policy.Hold('INVALID_OPENING_FILL')
        finally:market.close()
        try:enrollment,exitmetrics=attach_p50(m,e,ctx,grant_path,plan,symbol,order,entry,terms)
        except AccountStop:raise
        except Exception as exc:
            if (ctx/'p50'/symbol/'place-dispatch-claim.json').exists():raise AccountStop('P50_ATTEMPT_UNRESOLVED_READBACK_ONLY') from exc
            raise LocalPending('LOCAL_P50_QUALIFICATION_WAIT: '+str(exc)) from exc
        metrics['P50']=exitmetrics;metrics['totalSeconds']=time.monotonic()-start;metrics['finishedAt']=stamp();save(folder/'timings.json',metrics)
        return enrollment,metrics

def attach_p50(m,e,ctx,grant_path,plan,symbol,order,entry,terms):
    if (ctx/'account-global-hold.json').exists():raise AccountStop('ACCOUNT_GLOBAL_HOLD_READBACK_ONLY')
    account=entry['account_id'];fill=D(entry['average_fill_price'])
    if entry['state']!='FILLED' or D(entry['filled_quantity'])!=1 or not 0<D(order['limit_price'])<=fill<D(terms['width']):raise policy.Hold('P50_REQUIRES_VERIFIED_VALID_FULL_FILL')
    authorize(grant_path,plan,account,symbol,'P50')
    exitfolder=ctx/'p50'/symbol
    if exitfolder.exists():raise policy.Hold('EXISTING_P50_INTENT_READBACK_ONLY_NO_REPLAY')
    proof=ctx/'p50-qualification'/symbol/utc().strftime('%Y%m%dT%H%M%S.%fZ')
    exitreader=m.Reader(*m.load_credentials(),proof/'broker');after=capture(m,exitreader,account,proof/'ownership',full_cash=True)
    detail=exitreader.order_detail(account,order['client_order_id']);save(proof/'entry-detail.json',detail)
    history,current,standing=resolved_own_history(m,e,m.order_records(after['history']['data'],account),detail,order,account,entry['order_id'])
    save(proof/'entry-source-resolution.json',{'standing':standing,'originalNative':entry['order_id'],'noRawSourceOverwritten':True})
    held_one(m,after,order,{order['client_order_id']})
    if current['state']!='FILLED' or D(current['filled_quantity'])!=1 or D(current['average_fill_price'])!=fill:raise policy.Hold('P50_ORIGINAL_FILL_HISTORY_CONFLICT')
    exitfolder.mkdir(mode=0o700,parents=True,exist_ok=False)
    target=policy.p50(fill,terms['tick']);close=deepcopy(order);close.update(client_order_id=new_identity(symbol,'P50'),side='BUY',position_intent='BUY_TO_CLOSE',time_in_force='GTC',limit_price=str(target))
    for l,side in zip(close['legs'],('BUY','SELL')):l['side']=side
    new_native_identity_absent(m,after,close)
    xp={'account_id':account,'order':close,'original_order':order,'opening_credit':str(fill),'package':m.package(account,m.account_scope(account),close),'planSha256':policy.digest(plan),'arm':plan['assignment'][symbol]};save(exitfolder/'prepared-packet.json',xp)
    def validate_exit(o):
        if o!=close or not 0<D(o['limit_price'])<=fill/2:raise policy.Hold('P50_NOT_EXACT_PREDECLARED_REVERSE')
    def exitguard():
        authorize(grant_path,plan,account,symbol,'P50')
        if not 0<=(utc()-datetime.fromisoformat(after['at'])).total_seconds()<=10:raise policy.Hold('P50_OWNERSHIP_PROOF_EXPIRED')
    m.PACER.wait('webull:place',2.05);exitmetrics={};xr=dispatch(m,exitreader,xp,exitfolder,validate_exit,exitguard,exitmetrics);e.verify_geometry(xr,close)
    if xr['state'] not in ('PENDING','SUBMITTED','FILLED') or D(xr['filled_quantity']) not in (0,1):raise policy.Hold('P50_READBACK_UNRESOLVED')
    if xr['state']=='FILLED' and not 0<=D(xr['average_fill_price'])<=target:raise policy.Hold('P50_FILL_CONFLICT')
    enrollment={'symbol':symbol,'account_id':account,'arm':plan['assignment'][symbol],'planSha256':policy.digest(plan),'entry':order,'entryNative':entry['order_id'],'p50':close,'p50Native':xr['order_id'],'entryFolder':str(ctx/'entries'/symbol),'p50Folder':str(exitfolder),'width':terms['width'],'tick':terms['tick'],'openingFill':str(fill),'at':stamp()}
    save(ctx/'enrollments'/(symbol+'.json'),enrollment);return enrollment,exitmetrics

def late_fill_pass(root,plan,grant_path):
    """Read original IDs only, then one authorized P50 after fresh full ownership.
    Never resubmit the entry; any P50 attempt directory/claim stops replay.
    """
    m,e,_=components();results=[]
    if (root/'account-global-hold.json').exists():return [{'state':'ACCOUNT_GLOBAL_HOLD_READBACK_ONLY'}]
    for p in sorted(root.glob('entries/*/pending-intent.json')):
        x=json.loads(p.read_bytes());symbol=x['symbol']
        if (root/'enrollments'/(symbol+'.json')).exists() or (p.parent/'entry-terminal-zero.json').exists():continue
        if (root/'p50'/symbol).exists():
            results.append(recover_p50_enrollment(root,plan,grant_path,x));continue
        if not (p.parent/'place-dispatch-claim.json').exists():
            results.append({'symbol':symbol,'state':'PRE_DISPATCH_WAIT_REQUALIFIABLE'});continue
        if len(list((root/'p50-qualification'/symbol).glob('*')))>=3:
            results.append({'symbol':symbol,'state':'MANAGEMENT_DELIVERY_FAILURE_P50_QUALIFICATION_LIMIT','noResend':True});continue
        authorize(grant_path,plan,x['account_id'],symbol,'P50')
        reader=m.Reader(*m.load_credentials(),root/'late-fill'/symbol/utc().strftime('%Y%m%dT%H%M%S.%fZ'))
        with m.qualification_slot():
            detail=reader.order_detail(x['account_id'],x['order']['client_order_id']);rows=m.order_records([detail],x['account_id'])
            ackpath=p.parent/'place-result.json'
            if not (p.parent/'place-dispatch-claim.json').exists():
                results.append({'symbol':symbol,'state':'PRE_DISPATCH_WAIT_REQUALIFIABLE'});continue
            if not ackpath.exists():
                raise AccountStop('UNACKNOWLEDGED_ENTRY_READBACK_ONLY')
            ack=json.loads(ackpath.read_bytes());expected=ack.get('response',{}).get('order_id')
            packet=json.loads((p.parent/'prepared-packet.json').read_bytes());claim=json.loads((p.parent/'place-dispatch-claim.json').read_bytes())
            if packet['order']!=x['order'] or packet['account_id']!=x['account_id'] or packet['package']!=m.package(x['account_id'],m.account_scope(x['account_id']),x['order']) or claim['request_sha256']!=packet['package']['sha256'] or not m.positive_ack(ack,x['order']):raise AccountStop('LATE_FILL_ORIGINAL_CLAIM_OR_ACK_CONFLICT')
            if not expected or len(rows)!=1 or rows[0]['order_id']!=expected:raise AccountStop('LATE_FILL_IDENTITY_CONFLICT')
            entry=rows[0];e.verify_geometry(entry,x['order'])
            if entry['state']=='FILLED' and D(entry['filled_quantity'])==1:
                try:
                    enrollment,metrics=attach_p50(m,e,root,grant_path,plan,symbol,x['order'],entry,x['terms']);results.append({'symbol':symbol,'state':'LATE_FILL_P50_ATTACHED'})
                except AccountStop:raise
                except Exception as exc:
                    if (root/'p50'/symbol/'place-dispatch-claim.json').exists():raise AccountStop('P50_ATTEMPT_UNRESOLVED_READBACK_ONLY') from exc
                    results.append({'symbol':symbol,'state':'LOCAL_P50_QUALIFICATION_WAIT','reason':str(exc)})
            elif entry['state'] in ('CANCELED','CANCELLED','REJECTED','FAILED') and D(entry['filled_quantity'])==0:
                save(p.parent/'entry-terminal-zero.json',{'state':entry['state'],'filledQuantity':'0','at':stamp()});results.append({'symbol':symbol,'state':'ENTRY_ENDED_UNFILLED'})
            else:results.append({'symbol':symbol,'state':'ENTRY_NOT_FILLED_YET','nativeState':entry['state'],'filled':entry['filled_quantity']})
    return results


def recover_p50_enrollment(root,plan,grant_path,intent):
    """Existing P50 claim+ACK only: read back its original ID; never place again."""
    m,e,_=components();symbol=intent['symbol'];account=intent['account_id'];folder=root/'p50'/symbol
    authorize(grant_path,plan,account,symbol,'P50')
    if not all((folder/n).exists() for n in ('prepared-packet.json','place-dispatch-claim.json','place-result.json')):
        if (folder/'place-dispatch-claim.json').exists():raise AccountStop('P50_INTENT_OR_ACK_UNCERTAIN_READBACK_ONLY')
        return {'symbol':symbol,'state':'P50_PRE_DISPATCH_INTENT_READBACK_ONLY'}
    packet=json.loads((folder/'prepared-packet.json').read_bytes());claim=json.loads((folder/'place-dispatch-claim.json').read_bytes());ack=json.loads((folder/'place-result.json').read_bytes());order=packet['order']
    if packet['original_order']!=intent['order'] or packet['account_id']!=account or packet['package']!=m.package(account,m.account_scope(account),order) or claim['request_sha256']!=packet['package']['sha256'] or not m.positive_ack(ack,order):raise AccountStop('P50_RECOVERY_REQUEST_OR_ACK_CHANGED')
    evidence=root/'p50-recovery'/symbol/utc().strftime('%Y%m%dT%H%M%S.%fZ');reader=m.Reader(*m.load_credentials(),evidence/'broker');detail=reader.order_detail(account,order['client_order_id']);save(evidence/'readback.json',detail);rows=m.order_records([detail],account)
    if len(rows)!=1 or rows[0]['order_id']!=ack['response']['order_id']:raise AccountStop('P50_RECOVERY_NATIVE_IDENTITY_CHANGED')
    rr=rows[0];e.verify_geometry(rr,order)
    if D(rr['quantity'])!=1 or rr['state'] not in ('PENDING','SUBMITTED','FILLED') or D(rr['filled_quantity'])!=(1 if rr['state']=='FILLED' else 0) or (rr['state']=='FILLED' and not 0<=D(rr['average_fill_price'])<=D(order['limit_price'])):raise AccountStop('P50_RECOVERY_UNRESOLVED_READBACK_ONLY')
    if not (folder/'first-readback.json').exists():save(folder/'first-readback.json',detail)
    entryack=json.loads((root/'entries'/symbol/'place-result.json').read_bytes())
    en={'symbol':symbol,'account_id':account,'arm':plan['assignment'][symbol],'planSha256':policy.digest(plan),'entry':intent['order'],'entryNative':entryack['response']['order_id'],'p50':order,'p50Native':rr['order_id'],'entryFolder':str(root/'entries'/symbol),'p50Folder':str(folder),'width':intent['terms']['width'],'tick':intent['terms']['tick'],'openingFill':packet['opening_credit'],'at':stamp(),'enrollmentRecovery':'EXISTING_P50_ACK_ORIGINAL_ID_ONLY'}
    save(root/'enrollments'/(symbol+'.json'),en);return {'symbol':symbol,'state':'P50_ENROLLMENT_RECOVERED_NO_MUTATION'}
