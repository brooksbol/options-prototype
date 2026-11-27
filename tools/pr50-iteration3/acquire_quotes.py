"""Bounded selected-pair decision quote reads. No account/order operations."""
from pathlib import Path
from datetime import datetime,timezone
import sys,json,time,hashlib,math
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy
import runtime
runtime.configure_environment()
from decimal import Decimal
sys.dont_write_bytecode=True
RELEASE=Path.home()/'.local/share/wheelwright/pr46/releases/20261116T145837Z-722d9bc31ff5'
sys.path.insert(0,str(RELEASE))
from pr46_universe import Market
SRC=Path(sys.argv[1]).resolve();OUT=Path(sys.argv[2]).resolve()
OUT.mkdir(mode=0o700,parents=True,exist_ok=False)
now=lambda:datetime.now(timezone.utc).isoformat()
def save(path,obj):
    raw=(json.dumps(obj,indent=2,allow_nan=False)+'\n').encode()
    with path.open('xb') as f:f.write(raw)
    path.chmod(0o600)
    return hashlib.sha256(raw).hexdigest()
start=now();market=Market(OUT/'raw-tradier');done=set();results=[];requests=0;clock_at=0;clock=None;clockmeta=None
try:
    deadline=time.monotonic()+900
    while time.monotonic()<deadline:
        progress=SRC/'progress.jsonl'
        lines=progress.read_text().splitlines() if progress.exists() else []
        for line in lines:
            try:p=json.loads(line)
            except ValueError:continue
            symbol=p['symbol']
            if symbol in done:continue
            source=json.loads((SRC/symbol/'result.json').read_bytes());done.add(symbol)
            if not source['status'].startswith('CANDIDATE_'):continue
            folder=OUT/symbol;folder.mkdir(mode=0o700)
            row={'symbol':symbol,'expiry':policy.EXPIRY.isoformat(),'started_at':now(),'status':'WAIT','orders_authorized':False,'selection_sha256':source['result_sha256'] if 'result_sha256' in source else hashlib.sha256((SRC/symbol/'result.json').read_bytes()).hexdigest()}
            try:
                short=source['short']['contract'];long=source['long']['contract'];expected=[symbol,short['symbol'],long['symbol']]
                if time.monotonic()-clock_at>=30:
                    requests+=1;clock,clockmeta=market.get('clock');clock_at=time.monotonic()
                request={'symbols':','.join(expected),'greeks':'false'};save(folder/'request.json',{'endpoint':'quotes','params':request,'started_at':now()})
                requests+=1;doc,meta=market.get('quotes',**request);capture={'data':doc,'metadata':meta,'session_clock':clock,'session_clock_metadata':clockmeta};sha=save(folder/'response.json',capture)
                values=doc.get('quotes',{}).get('quote');values=values if isinstance(values,list) else [values] if isinstance(values,dict) else []
                by={x.get('symbol'):x for x in values};issues=[]
                if len(values)!=3 or set(by)!=set(expected):issues.append('QUOTE_IDENTITY_COVERAGE')
                metrics={};selection_ages={}
                for role,c in [('short',short),('long',long)]:
                    q=by.get(c['symbol'],{});bid=q.get('bid');ask=q.get('ask')
                    if not all(type(v) in (int,float) and math.isfinite(v) for v in [bid,ask]) or not 0<bid<=ask:issues.append(role.upper()+'_INVALID_OR_CROSSED_BOOK')
                    identity_ok=(q.get('underlying')==symbol and q.get('expiration_date')==policy.EXPIRY.isoformat() and str(q.get('option_type','')).lower()=='put' and Decimal(str(q.get('strike',-1)))==Decimal(c['strike_price']) and q.get('contract_size')==100)
                    if not identity_ok:issues.append(role.upper()+'_QUOTE_CONTRACT_MISMATCH')
                    sides={}
                    for side in ['bid','ask']:
                        ts=q.get(side+'_date');size=q.get(side+'size')
                        sides[side]={'price':q.get(side),'size':size,'source_epoch_ms':ts,'age_seconds_at_capture':time.time()-ts/1000 if type(ts) in (int,float) and ts>0 else None}
                        if not isinstance(size,(int,float)) or size<=0:issues.append(role.upper()+'_MISSING_'+side.upper()+'_SIZE')
                        if type(ts) not in (int,float) or ts<=0:issues.append(role.upper()+'_MISSING_'+side.upper()+'_CLOCK')
                    metrics[role]={'symbol':c['symbol'],'strike':c['strike_price'],'sides':sides,'open_interest':q.get('open_interest'),'volume':q.get('volume'),'identity_matches':identity_ok}
                    stamp=source[role]['greek']['updatedAt'];selection_ages[role]=time.time()-stamp/1000
                credit=None
                if not issues:
                    credit=Decimal(str(by[short['symbol']]['bid']))-Decimal(str(by[long['symbol']]['ask']))
                    if credit<=0:issues.append('NONPOSITIVE_NATURAL_CREDIT')
                row.update(response_sha256=sha,request=request,quote_received_at=meta.get('completed_utc'),book_observations=metrics,underlying_quote=by.get(symbol),natural_credit_per_share=str(credit) if credit is not None else None,Greek_age_seconds_at_quote=selection_ages,issues=sorted(set(issues)),session_state=clock.get('clock',{}).get('state'),status='WAIT' if issues else 'DISCOVERY_PAIR_QUOTED_NOT_TRADE_READY',qualification='Raw dated candidate quote, not accepted execution freshness, event, account, ownership, fee or collateral admission. Greek clocks are independent Tastytrade observations, quotes are Tradier.')
            except Exception as e:
                row.update(reason=type(e).__name__+'_QUOTE_SOURCE_OR_VALIDATION_UNAVAILABLE',http_status=getattr(e,'http_status',None))
                if getattr(e,'http_status',None) in [401,403,429]:row['stop_shared_source_failure']=True
            row['finished_at']=now();save(folder/'result.json',row);results.append(row)
            with (OUT/'progress.jsonl').open('a') as f:f.write(json.dumps({k:row.get(k) for k in ['symbol','status','issues','reason','finished_at']})+'\n')
            (OUT/'progress.jsonl').chmod(0o600)
            print(json.dumps({k:row.get(k) for k in ['symbol','status','issues','reason']}),flush=True)
            if row.get('stop_shared_source_failure'):raise RuntimeError('SHARED_QUOTE_SOURCE_FAILURE_NO_RETRY')
        if (SRC/'results.json').exists():break
        time.sleep(.5)
finally:
    market.close()
    save(OUT/'results.json',{'started_at':start,'finished_at':now(),'rows':results,'actual_attempted_requests':requests,'Greek_or_catalog_acquisition_not_duplicated':True,'orders_submitted':0,'no_account_reads_or_writes':True})
    save(OUT/'manifest.json',{str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file()})
