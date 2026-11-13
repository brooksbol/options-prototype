"""Bounded all-69 read-only listings, put-Greek and collateral preparation."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
import json
import os
import select
import subprocess
import sys
import threading
import time

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'pr47-covered-call'))
import runner as r
from model import Blocked,broker_contract,canonical,identity,number,select_lowest,tick,treatment_id

ROOT=r.ROOT.parent/'pr47-all69-0dte-acquisition-20261113'
DATES=('2026-11-13','2026-11-20')

def session_symbols(universe,first,session):
    if session not in DATES:raise Blocked('Not an assigned entry date')
    return [s for s in universe if (DATES[0] if s in first else DATES[1])>=session]

class PutGreeks:
    def __init__(self,path,metrics):
        self.path,self.metrics=path,metrics
        self.worker=subprocess.Popen(['node',str(Path(__file__).with_name('greek-worker.mjs')),
            str(r.HOME/'kiro/options/scripts/tastytrade.mjs')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,text=True,bufsize=1)
    def read(self,symbol,date):
        started=time.monotonic()
        self.worker.stdin.write(json.dumps(dict(symbol=symbol,expiration=date))+'\n');self.worker.stdin.flush()
        if not select.select([self.worker.stdout],[],[],55)[0]:raise Blocked('Put Greek worker timeout')
        line=self.worker.stdout.readline()
        if not line:raise Blocked('Put Greek worker exited')
        result=json.loads(line)
        r.atomic(self.path/(symbol+'-'+date+'-greeks-'+str(time.time_ns())+'.json'),result)
        for kind,n in result.get('requests',{}).items():
            for _ in range(n):self.metrics.mark('request',route='tastytrade:'+kind)
        self.metrics.mark('put_greek_preparation',symbol=symbol,seconds=time.monotonic()-started)
        if result.get('error'):raise Blocked(result['error'])
        return result
    def close(self):
        self.worker.stdin.close()
        try:self.worker.wait(timeout=5)
        except subprocess.TimeoutExpired:self.worker.kill();self.worker.wait(timeout=5)

def calendar(path):
    source=json.loads(path.read_text());rows={x['session_date']:x for x in source['calendar']}
    first=rows[DATES[0]]['symbols_with_listed_puts'];all69=rows[DATES[1]]['symbols_with_listed_puts']
    rest=[s for s in all69 if s not in first]
    if len(first)!=len(set(first)) or len(first)!=28 or len(all69)!=len(set(all69)) or len(all69)!=69 or len(rest)!=41 or 'KVUE' in all69:
        raise Blocked('Retained calendar does not prove disjoint28/41 split')
    return first,rest,all69

def catalog(reader,symbol,date):
    result=reader.put_contracts(symbol,date,date)
    if symbol=='BF.B' and not result['data']:
        result=reader.put_contracts('BFB',date,date)
    if not result['complete_for_query']:raise Blocked('Incomplete broker put grid')
    raw=result['data'];pairs=[]
    prefix=('BFB' if symbol=='BF.B' else symbol)+date[2:].replace('-','')+'P'
    for row in raw:
        if canonical(row.get('underlying_symbol'))!=symbol or row.get('expiration_date')!=date:continue
        if row.get('def_type')!='STANDARD':continue
        # The API can label adjusted-root KMB1 rows STANDARD; the canonical
        # stock's exact OCC root is part of eligibility, not an ignored failure.
        if not row.get('symbol','').startswith(prefix):continue
        if row.get('tradable_status')!='OC':continue
        pairs.append((broker_contract(symbol,row,date),row))
    if not pairs:raise Blocked('No tradable standard physical puts listed')
    return pairs

def main():
    os.umask(0o077);ROOT.mkdir(mode=0o700,exist_ok=True)
    session=r.now().astimezone(r.ET).date().isoformat()
    if session not in DATES:raise Blocked('Run session preparation only on its actual assigned execution date')
    source=max(r.ROOT.parent.glob('pr47-0dte-20261113-discovery-*'),key=lambda p:p.stat().st_mtime)
    first,rest,universe=calendar(source/'retained-calendar.json')
    batches=dict(nov13=first,nov20=rest,universe=universe)
    if (ROOT/'calendar-batches.json').exists() and json.loads((ROOT/'calendar-batches.json').read_text())!=batches:
        raise Blocked('Original immutable28/41 enrollment changed')
    r.atomic(ROOT/'calendar-batches.json',batches)
    if not (ROOT/'account-binding.json').exists():r.atomic(ROOT/'account-binding.json',dict(status='UNRESOLVED',required='Separate US-options Sandbox account; no implicit GRA5/PR46 substitution',initial_authorized_cash='2000000',execution_enabled=False))
    path=ROOT/('prepare-'+str(time.time_ns()));path.mkdir(mode=0o700);metrics=r.Measurements()
    reader=r.Reader(r.load_credentials(),path/'catalog',metrics);providers=r.Providers(path,metrics);greeks=PutGreeks(path,metrics)
    active=session_symbols(universe,first,session)
    outcomes={s:dict(status='PRIOR_SESSION_RECONCILE_ONLY',symbol=s,execution_date=DATES[0],
        note='Original November13 treatment stays with its original identity; read broker lifecycle, never re-enroll in remaining41') for s in universe if s not in active}
    try:
        books,meta,clock=providers.prices(tuple('BF/B' if s=='BF.B' else s for s in active))
        r.qualify_equities(books,meta,clock)
        r.atomic(path/'underlyings.json',dict(books=books,meta=meta,clock=clock))
        # Catalog I/O overlaps the independent provider/Greek workers, retaining
        # shared Webull and Tradier pacing. At most one Greek snapshot is active.
        with ThreadPoolExecutor(max_workers=1) as pool:
            futures={s:pool.submit(catalog,reader,s,DATES[0] if s in first else DATES[1]) for s in active}
            for i,symbol in enumerate(active):
                date=DATES[0] if symbol in first else DATES[1]
                try:
                    outcome={}
                    pairs=futures[symbol].result()
                    provider='BF/B' if symbol=='BF.B' else symbol
                    document,_=providers.market('options/chains',symbol=provider,expiration=date,greeks='false')
                    chain=(document.get('options') or {}).get('option') or []
                    chain=chain if isinstance(chain,list) else [chain]
                    listed={identity(symbol,row,date).occ for row in chain if row.get('option_type')=='put'
                            and canonical(row.get('root_symbol'))==symbol and str(row.get('contract_size'))=='100'}
                    if not listed:raise Blocked('Retained session listing is no longer available')
                    contracts=[c for c,_ in pairs]
                    if any(c.occ not in listed for c in contracts):raise Blocked('Broker/Tradier standard put grids disagree')
                    if date==session:
                        g=greeks.read(symbol,date)
                        selected,delta=select_lowest(contracts,g,r.now().timestamp())
                        row=next(raw for c,raw in pairs if c==selected)
                        outcome=dict(status='PREPARED_NOT_AUTHORIZED_FOR_ACCOUNT',symbol=symbol,execution_date=date,expiration=date,
                            strike=str(selected.strike),occ=selected.occ,selected_delta=str(delta),put_count=len(contracts),
                            greek_receipt=g['receipt_utc'],gross_collateral=str(selected.strike*100),client_order_id=treatment_id(symbol,date),
                            contract=row,greeks=g,listed_contracts=[dict(symbol=c.symbol,expiration=c.expiration,strike=str(c.strike),occ=c.occ) for c in contracts])
                        quotes,qmeta,qclock=providers.prices((provider,selected.occ))
                        outcome.update(quotes=quotes,quote_meta=qmeta,quote_clock=qclock,underlying=quotes[provider])
                        r.qualified(quotes,qmeta,qclock)
                        outcome['bid']=str(tick(row,quotes[selected.occ]['bid']))
                    else:
                        ask=number(books[provider]['ask']);higher=[c for c in contracts if c.strike>=ask]
                        if not higher:raise Blocked('No listed strike for future collateral planning proxy')
                        estimated=min(higher,key=lambda c:c.strike)
                        outcome=dict(status='NOV20_ESTIMATE_ONLY',symbol=symbol,execution_date=date,expiration=date,
                            planning_strike=str(estimated.strike),gross_collateral_estimate=str(estimated.strike*100),
                            basis='Lowest current listed strike at/above observed underlying ask; not the future delta selector or a future-price guarantee',
                            observed_underlying=books[provider],put_count=len(contracts),client_order_id=treatment_id(symbol,date))
                    outcomes[symbol]=outcome
                    print(json.dumps(dict(symbol=symbol,status=outcome['status'],strike=outcome.get('strike',outcome.get('planning_strike')))),flush=True)
                except Exception as error:
                    outcomes[symbol]=dict(outcome,status='BLOCKED',symbol=symbol,execution_date=date,reason=str(error))
                    print(json.dumps(dict(symbol=symbol,blocker=str(error))),flush=True)
                r.atomic(path/'outcomes.json',outcomes)
        exact=sum((number(x['gross_collateral']) for x in outcomes.values() if 'gross_collateral'in x),Decimal(0))
        estimated=sum((number(x['gross_collateral_estimate']) for x in outcomes.values() if 'gross_collateral_estimate'in x),Decimal(0))
        r.atomic(path/'funding.json',dict(today_exact_indicative=str(exact),nov20_estimated=str(estimated),combined_indicative=str(exact+estimated),
            blockers=[s for s,x in outcomes.items() if x['status']=='BLOCKED'],complete=len(outcomes)==69 and all(x['status']!='BLOCKED' for x in outcomes.values()),
            funding_complete=len(outcomes)==69 and all('gross_collateral' in x or 'gross_collateral_estimate' in x or x['status']=='PRIOR_SESSION_RECONCILE_ONLY' for x in outcomes.values()),
            session=session,current_batch_size=sum(x['execution_date']==session for x in outcomes.values()),
            note='No account admission or orders. All data must be refreshed at actual dispatch; future reserve is an estimate.'))
        r.atomic(ROOT/'latest-preparation.json',dict(path=str(path)))
    finally:
        greeks.close();providers.close();r.atomic(path/'performance.json',metrics.summary())

if __name__=='__main__':main()
