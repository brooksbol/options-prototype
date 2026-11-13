"""Read-only PR47 lifecycle observer; no sender, funding or order mutation calls.

Composes the retained exact-OCC cash-event and full-share-bridge proof. It never
attributes a partial multi-lot assignment to this experiment by inference.
"""
from collections import Counter
from contextlib import ExitStack
from datetime import datetime,timezone
from decimal import Decimal
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import time

from execute import Broker,normalized_order,normalized_record,observations,validate_state
from experiment import order_match
from model import Blocked,canonical,number,occ_key
from prepare import ROOT,r


def occ(key):
    symbol,right,date,strike=key
    return ('BFB' if symbol=='BF.B' else symbol)+date[2:].replace('-','')+right[0]+f'{int(strike*1000):08}'


def verify_baseline(baseline,state):
    expected=(Counter({s:number(q) for s,q in baseline['shares'].items()}),Counter({
        (x['symbol'],x['right'],x['expiration'],number(x['strike'])):number(x['quantity']) for x in baseline['options']}))
    if (baseline['as_of']!=state['baseline']['at'] or number(baseline['cash'])!=number(state['baseline']['cash'])
            or expected[0]!=Counter({s:number(q) for s,q in state['baseline']['shares'].items()}) or len(baseline['sources'])!=2):
        raise Blocked('Lifecycle baseline detached from admitted opening account state')
    for source in baseline['sources']:
        raw=Path(source['path']).read_bytes()
        if hashlib.sha256(raw).hexdigest()!=source['sha256']:raise Blocked('Native opening position boundary changed')
        shares,options=r.inventory(json.loads(raw));normalized_shares=Counter();normalized_options=Counter()
        for symbol,q in shares.items():normalized_shares[canonical(symbol)]+=q
        for key,q in options.items():normalized_options[(canonical(key[0]),)+key[1:]]+=q
        if (normalized_shares,normalized_options)!=expected:raise Blocked('Native opening boundaries do not prove lifecycle baseline')


def lifecycle_report(cut,state,baseline):
    start=datetime.fromisoformat(baseline['as_of']);asof=datetime.fromisoformat(cut['observed_at'])
    owned=set(state['orders']);original={x for x in state['baseline']['historical_order_ids'] if x}
    foreign=[x for x in cut['orders']+cut['working'] if not (x.get('order_id') and x['order_id'] in original) and x.get('client_order_id') not in owned]
    events={x['activity_id']:x for x in cut['cash']}
    future=[x for x in events.values() if x.get('occurred_at_utc') and datetime.fromisoformat(x['occurred_at_utc'].replace('Z','+00:00'))>asof]
    unknown=[x for x in events.values() if not x.get('occurred_at_utc') or x.get('currency')!='USD']
    later=[x for x in events.values() if x.get('occurred_at_utc') and start<datetime.fromisoformat(x['occurred_at_utc'].replace('Z','+00:00'))<=asof]
    cash=number(cut['balance']['total_cash_balance']);expected_cash=number(baseline['cash'])+sum((number(x['net_amount']) for x in later),Decimal(0))
    cash_ok=not unknown and not future and cash==expected_cash
    outstanding=Counter({(x['symbol'],x['right'],x['expiration'],number(x['strike'])):-number(x['quantity']) for x in baseline['options']})
    filled={}
    for cid,record in state['orders'].items():
        projected=normalized_record(record);matching=[normalized_order(x) for x in cut['orders'] if x.get('client_order_id')==cid]
        if (matching and all(x['state']=='FILLED' and order_match(x,projected['request']) for x in matching)
                and len({x['order_id'] for x in matching})==1
                and (not record.get('order_id') or matching[0]['order_id']==record['order_id'])):
            leg=record['request']['legs'][0];key=(canonical(leg['symbol']),'PUT',leg['option_expire_date'],number(leg['strike_price']))
            outstanding[key]+=1;filled[cid]=key
    normalized_events=[]
    for event in later:
        copy=dict(event);provider=dict(event['provider']);provider['symbol']=occ_key(str(provider.get('symbol','')))
        copy['provider']=provider;normalized_events.append(copy)
    by_symbol={};multi={}
    for symbol in {key[0] for key in outstanding}:
        keys={key:occ(key) for key,n in outstanding.items() if key[0]==symbol}
        if any(outstanding[key]!=1 for key in keys):
            multi[symbol]='Multiple/unsupported lots require explicit native allocation; no inferred experiment assignment'
        by_symbol[symbol]=r.lifecycle(symbol,baseline['shares'].get(symbol,'0'),cut['inventory'],normalized_events,keys,bool(foreign))
    treatments={}
    for symbol,treatment in state['treatments'].items():
        cid=treatment['client_order_id'];record=state['orders'].get(cid)
        if cid not in filled:
            treatments[symbol]=dict(status='ENTRY_NOT_FILLED' if record else treatment['disposition']);continue
        key=filled[cid];status=by_symbol[symbol][occ(key)]
        if symbol in multi:status='UNRESOLVED_MULTI_LOT_ALLOCATION'
        if status in {'ASSIGNED_DELIVERED','EXPIRED_UNASSIGNED'} and not cash_ok:status='CASH_RECONCILIATION_PENDING'
        entry_rows=[x for x in later if x['event_type']=='TRADE' and x['event_sub_type']=='SELL'
            and occ_key(str(x['provider'].get('symbol',''))) in {occ(key),('BFB' if symbol=='BF.B' else symbol)+key[2].replace('-','')+'P'}]
        # The broker cash feed can omit strike/order ID. Under a verified window
        # with no external orders, this experiment has exactly one entry for
        # this symbol/right/date; otherwise attribution remains unresolved.
        unknown_charges=[x for x in later if x['event_type'] not in {'TRADE','OPTION_EA','DEPOSIT','WITHDRAWAL'} and number(x['net_amount'])!=0]
        credit=number(entry_rows[0]['net_amount']) if len(entry_rows)==1 and not foreign else None
        filled_row=next(x for x in cut['orders'] if x.get('client_order_id')==cid and x['state']=='FILLED')
        gross_credit=number(filled_row['average_fill_price'])*100
        credit_ok=credit is not None and 0<=credit<=gross_credit
        economics=status=='ASSIGNED_DELIVERED' and cash_ok and credit_ok and not unknown_charges
        treatments[symbol]=dict(status=status,contract=occ(key),entry_fill_confirmed=True,
            entry_position_observed=bool(record.get('position_reconciled_at')),
            delivered_share_quantity=100 if status=='ASSIGNED_DELIVERED' else None,
            share_delivery_first_observed_at=cut['observed_at'] if status=='ASSIGNED_DELIVERED' else None,
            gross_acquisition_cash_debit=str(key[3]*100) if status=='ASSIGNED_DELIVERED' else None,
            net_entry_premium=str(credit) if credit_ok else None,
            entry_cash_charges=str(gross_credit-credit) if credit_ok else None,
            reported_entry_commission=filled_row.get('commission'),reported_entry_fees=filled_row.get('fees'),
            entry_cash_attribution='Unique symbol/right/date within no-external-order window; cash feed may omit native order ID',
            effective_cost_after_all_fees=str((key[3]*100-credit)/100) if economics else None,
            economics_status='CASH_DERIVED_AS_OF_CUTOFF' if economics else 'PENDING_ENTRY_CASH_OR_UNALLOCATED_FEES')
    return dict(observed_at=cut['observed_at'],cash=str(cash),cash_bridge_expected=str(expected_cash),
        cash_bridge_difference=str(cash-expected_cash),cash_reconciled=cash_ok,
        external_order_count=len({x.get('order_id') for x in foreign}),multi_lot_symbols=multi,
        working_original_orders=len([x for x in cut['working'] if x.get('client_order_id') in owned]),
        treatments=treatments,scope='Original69 only; assignment requires exact native OCC event and complete symbol share bridge; economics not yet established')


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--scheduled',action='store_true');args=p.parse_args()
    # Scheduled wake-ups never enter an order sender. They stop acquiring after
    # the bounded experiment observation window; a future extension is explicit.
    if args.scheduled and not '2026-11-13'<=r.now().date().isoformat()<='2026-11-24':return
    os.umask(0o077);path=ROOT/('lifecycle-observe-'+str(time.time_ns()));path.mkdir(mode=0o700);metrics=r.Measurements()
    try:
        with ExitStack() as stack:
            for lock in (ROOT/'writer.lock',r.ROOT/'writer.lock'):stack.enter_context(r.exclusive(lock))
            binding=json.loads((ROOT/'account-binding.json').read_text());state=json.loads((ROOT/'state.json').read_text())
            validate_state(state,json.loads((ROOT/'calendar-batches.json').read_text()))
            baseline=json.loads((ROOT/'lifecycle-baseline.json').read_text())
            verify_baseline(baseline,state)
            broker=Broker(path,metrics,binding);cut=broker.snapshot(history=True);entry=observations(cut,state)
            r.atomic(path/'native-cut.json',dict(balance=cut['balance'],positions=cut['positions'],orders=cut['orders'],
                working=cut['working'],cash=cut['cash'],observed_at=cut['observed_at']))
            report=lifecycle_report(cut,state,baseline);r.atomic(path/'entry-reconciliation.json',entry);r.atomic(path/'lifecycle.json',report)
            for symbol,item in report['treatments'].items():
                cid=state['treatments'][symbol]['client_order_id'];record=state['orders'].get(cid)
                if not record:continue
                record['lifecycle_status']=item['status']
                if item['status'] in {'ASSIGNED_DELIVERED','EXPIRED_UNASSIGNED'}:
                    record['lifecycle_cash_settled']=True
                if item['status']=='ASSIGNED_DELIVERED':
                    first=record.setdefault('share_delivery_first_observed_at',cut['observed_at'])
                    item['share_delivery_first_observed_at']=first
                    state.setdefault('acquisition_lots',{}).setdefault(cid,dict(symbol=symbol,quantity='100',
                        first_observed_at=first,gross_debit=item['gross_acquisition_cash_debit'],
                        evidence=str(path/'native-cut.json'),economics_status=item['economics_status']))
                    state['acquisition_lots'][cid].update(economics_status=item['economics_status'],
                        effective_per_share_cost=item['effective_cost_after_all_fees'])
            r.atomic(path/'lifecycle.json',report)
            # Prior entry proof remains historical; current expiration state is
            # stored separately and never erases original claims or timestamps.
            state['lifecycle_observation']=dict(path=str(path),observed_at=cut['observed_at'])
            state['lifecycle_status']='PENDING'
            r.atomic(ROOT/'state.json',state);r.atomic(ROOT/'latest-lifecycle.json',dict(path=str(path)))
            print(json.dumps(dict(observed_at=cut['observed_at'],working=report['working_original_orders'],cash_reconciled=report['cash_reconciled'],
                disposition_counts=dict(Counter(x['status'] for x in report['treatments'].values())))),flush=True)
    except Exception as error:
        r.atomic(path/'failure.json',dict(error=str(error),observed_at=r.now().isoformat()))
        if args.scheduled and 'Another workflow owns' in str(error):print('Read-only observation skipped: active writer owns account state');return
        raise
    finally:r.atomic(path/'performance.json',metrics.summary())

if __name__=='__main__':main()
