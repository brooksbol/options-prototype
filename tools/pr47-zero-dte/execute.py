"""All-69 two-session 0DTE PUT runner. Unresolved account bindings cannot trade.

No funding, reset, stock-buy, close, cancel, replace, or automatic order retry
operation exists here. Account provisioning remains separately verified.
"""
import argparse
from collections import Counter
from contextlib import ExitStack
from copy import deepcopy
from datetime import datetime,time as daytime
from decimal import Decimal
import hashlib
import json
import os
from pathlib import Path
import sys
import time

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'pr47-covered-call'))
import runner as r
from sequential import CoherentBroker
from experiment import order_match
from pr46_proven import ReconciliationPending,reconcile_confirmed
from prepare import ROOT,DATES,PutGreeks,catalog
from model import Blocked,Put,broker_contract,canonical,identity,number,select_lowest,tick,treatment_id


def execution_window(date):
    now=r.now().astimezone(r.ET)
    if date not in DATES or now.date().isoformat()!=date or not daytime(12)<=now.time().replace(tzinfo=None)<daytime(16):
        raise Blocked('Outside assigned expiration-day noon-to-close session; no later-expiration substitute')


def order_fields(contract,metadata,bid):
    price=tick(metadata,bid);native=metadata['underlying_symbol']
    return dict(client_order_id=treatment_id(contract.symbol,contract.expiration),combo_type='NORMAL',
        option_strategy='SINGLE',instrument_type='OPTION',entrust_type='QTY',support_trading_session='CORE',
        symbol=native,market='US',side='SELL',position_intent='SELL_TO_OPEN',order_type='LIMIT',
        time_in_force='DAY',quantity='1',limit_price=str(price),legs=[dict(symbol=native,market='US',
        instrument_type='OPTION',side='SELL',quantity='1',option_type='PUT',strike_price=str(contract.strike),
        option_expire_date=contract.expiration)])


class Broker(CoherentBroker):
    def __init__(self,path,metrics,binding):
        if binding.get('status')!='VERIFIED' or binding.get('mode') not in {'SEPARATE','EXPLICIT_EXISTING_EXCEPTION'}:
            raise Blocked('Account instruction unresolved; no implicit GRA5/PR46 substitution')
        if binding['mode']=='EXPLICIT_EXISTING_EXCEPTION' and not binding.get('principal_override'):
            raise Blocked('Existing-account exception lacks actual Principal instruction')
        self.path,self.measurements=path,metrics;self.credentials=r.load_credentials();self.reader=self.new_reader('identity')
        accounts=self.reader.accounts();matching=[x for x in accounts if x.get('account_id')==binding.get('native_account_id')
            and x.get('account_class')==binding.get('account_class') and x.get('account_number','').endswith(binding.get('account_suffix','INVALID'))]
        if len(matching)!=1 or matching[0]['account_class'] not in {'INDIVIDUAL_CASH','INDIVIDUAL_MARGIN'}:
            raise Blocked('Exact authorized Sandbox US-stock/options account did not verify')
        self.account=matching[0]['account_id']
        if binding['mode']=='SEPARATE' and self.account in binding.get('excluded_native_account_ids',[]):
            raise Blocked('Separate-account policy forbids an existing experimental account')
        self.experiment_symbols=set(json.loads((ROOT/'calendar-batches.json').read_text())['universe'])
    def opaque(self,positions):
        known=[];opaque=[]
        for row in positions:
            if row.get('instrument_type')=='EQUITY' or row.get('option_strategy') in {'SINGLE','COVERED_STOCK'}:
                known.append(row);continue
            symbol=canonical(row.get('symbol'));legs=row.get('legs') or [];quantity=number(row.get('quantity'))
            if (symbol in self.experiment_symbols or row.get('instrument_type')!='OPTION' or row.get('option_strategy')!='VERTICAL'
                    or row.get('currency')!='USD' or len(legs)!=2 or abs(quantity)!=1 or not row.get('position_id')):
                raise Blocked('Unsupported position cannot be reconciled or bounded outside original69')
            keys=[]
            for leg in legs:
                if (canonical(leg.get('symbol'))!=symbol or leg.get('instrument_type')!='OPTION' or leg.get('option_type')!='PUT'
                        or number(leg.get('option_contract_multiplier'))!=100 or number(leg.get('option_contract_deliverable'))!=100):
                    raise Blocked('Opaque foreign spread lacks a finite verified100-multiplier put bound')
                key=r.contract_key(leg)
                if key[3]<=0:raise Blocked('Invalid opaque foreign put strike')
                keys.append((symbol,)+key[1:])
            if keys[0][2]!=keys[1][2] or keys[0][3]==keys[1][3]:raise Blocked('Ambiguous foreign vertical geometry')
            opaque.append(dict(position_id=row['position_id'],symbol=symbol,quantity=str(quantity),keys=keys,
                gross_cash_bound=sum((key[3]*100*abs(quantity) for key in keys),Decimal(0)),
                standing='Leg polarity UNKNOWN; both puts reserved as if short; no invented signed position'))
        return known,opaque
    def position_inventory(self,positions):
        known,_=self.opaque(positions);return r.inventory(known)
    def position_signature(self,positions):
        known,opaque=self.opaque(positions)
        return r.inventory(known),tuple(sorted((x['position_id'],x['symbol'],x['quantity'],tuple(sorted(x['keys']))) for x in opaque))
    def snapshot(self,history=False):
        cut=super().snapshot(history)
        _,opaque=self.opaque(cut['positions']);cut['opaque_foreign_positions']=opaque
        for position in opaque:
            # Native position rows omit leg polarity/ratios. Prove the actual
            # one-to-one leg quantities from the unique filled opening history,
            # reserving BOTH legs as short instead of inferring either side.
            if not history:raise Blocked('Opaque foreign put bound requires complete native order history')
            def geometry(row):return frozenset((canonical(leg['symbol']),)+r.contract_key(leg)[1:] for leg in row.get('legs') or [])
            matches=[row for row in cut['orders'] if canonical(row.get('symbol'))==position['symbol']
                and row['provider'].get('option_strategy')=='VERTICAL' and geometry(row)==frozenset(position['keys'])]
            if (not matches or len({row.get('order_id') for row in matches})!=1 or not matches[0].get('order_id')
                    or any(row['state']!='FILLED' or row['provider'].get('position_intent') not in {'BUY_TO_OPEN','SELL_TO_OPEN'}
                        or number(row['quantity'])!=1 or number(row['filled_quantity'])!=1 or len(row['legs'])!=2
                        or any(number(leg.get('quantity'))!=1 for leg in row['legs']) for row in matches)):
                raise Blocked('Native history does not prove one filled one-to-one foreign put vertical')
            position['ratio_evidence_order_id']=matches[0]['order_id']
        cut['inventory_scope']='Supported positions only; opaque foreign puts separately reserved at full both-leg gross bound'
        shares,options=cut['inventory'];normalized_shares=Counter();normalized_options=Counter()
        for symbol,q in shares.items():normalized_shares[canonical(symbol)]+=q
        for key,q in options.items():normalized_options[(canonical(key[0]),)+key[1:]]+=q
        cut['inventory']=(normalized_shares,normalized_options)
        return cut


def normalized_record(record):
    result=deepcopy(record);result['request']['symbol']=canonical(result['request']['symbol'])
    for leg in result['request']['legs']:leg['symbol']=canonical(leg['symbol'])
    for leg in result['option_baseline']:leg['symbol']=canonical(leg['symbol'])
    return result


def normalized_order(row):
    result=deepcopy(row);result['symbol']=canonical(row.get('symbol'))
    for leg in result.get('legs') or []:leg['symbol']=canonical(leg.get('symbol'))
    return result


def full_funding(cut,state,plans,current_symbol=None,current_strike=None):
    r.check_cut_age(cut)
    if cut['balance'].get('open_margin_calls'):raise Blocked('Open margin call; borrowing not authorized')
    owned={row['client_order_id']:symbol for symbol,row in state['treatments'].items()}
    if any(row.get('client_order_id') not in owned for row in cut['working']):
        raise Blocked('Other working orders require explicit reconciliation')
    # Native outstanding obligations include filled new puts exactly once.
    options=cut['inventory'][1];required=r.put_obligation(options);opaque=sum((number(x['gross_cash_bound']) for x in cut.get('opaque_foreign_positions',[])),Decimal(0));unseen=Decimal(0);remaining=Decimal(0)
    for symbol,treatment in state['treatments'].items():
        record=state['orders'].get(treatment['client_order_id'])
        if record:
            if record.get('terminal_no_fill'):continue
            request=record['request'];rawkey=r.contract_key(request['legs'][0]);key=(canonical(rawkey[0]),)+rawkey[1:]
            baseline=number(record['option_baseline'][0]['baseline_quantity'])
            # An unreflected/uncertain accepted claim retains full collateral.
            if options[key]>baseline-1 and not record.get('lifecycle_cash_settled'):
                unseen+=number(request['legs'][0]['strike_price'])*100
        elif treatment.get('disposition') not in {'MISSED_SESSION','EXCLUDED'}:
            plan=plans.get(symbol,{})
            strike=current_strike if symbol==current_symbol else plan.get('strike',plan.get('planning_strike'))
            if strike is None:raise Blocked(f'{symbol}: missing remaining-treatment reserve')
            remaining+=number(strike)*100
    usd=next(x for x in cut['balance']['account_currency_assets'] if x['currency']=='USD')
    cash=number(usd['cash_balance']);need=required+opaque+unseen+remaining
    # Positive actual premium remains cash; anticipated premiums and stock values
    # are never added to capacity. Stock assignment debits already reduce cash.
    shortfall=max(Decimal(0),need-cash)
    if shortfall:raise Blocked(f'Full69 gross funding shortfall ${shortfall}; no scope reduction or margin borrowing')
    if remaining+unseen>number(usd['option_buying_power']):raise Blocked('Option buying power below remaining new obligations')
    return dict(cash=str(cash),current_put_obligations=str(required),opaque_foreign_gross_put_bound=str(opaque),unreflected_claims=str(unseen),
                remaining_intended_reserves=str(remaining),total_required=str(need),shortfall=str(shortfall))


def observations(cut,state):
    result={}
    for cid,record in state['orders'].items():
        projected=normalized_record(record)
        projected_orders=[normalized_order(x) for x in cut['orders']+cut['working']]
        status=r.reconcile(projected,projected_orders,*cut['inventory'])
        matching=[x for x in cut['orders']+cut['working'] if x.get('client_order_id')==cid]
        # Never hide a conflicting identity/terminal row behind a valid one.
        if len({x.get('order_id') for x in matching})>1 or any(x['state'] not in {'PENDING','SUBMITTED','FILLED','PARTIALLY_FILLED','CANCELED','FAILED'} for x in matching):
            raise Blocked('Conflicting or terminal original PUT order evidence')
        def geometry(leg):
            return (canonical(leg['symbol']),leg['option_type'],leg['option_expire_date'],number(leg['strike_price']),leg['side'],number(leg['quantity']))
        expected=Counter(map(geometry,record['request']['legs']))
        for row in matching:
            if (canonical(row.get('symbol'))!=canonical(record['request']['symbol']) or row.get('side')!='SELL'
                    or number(row.get('quantity'))!=1 or Counter(map(geometry,row.get('legs') or []))!=expected
                    or number(row.get('limit_price'))!=number(record['request']['limit_price'])
                    or (record.get('order_id') and row.get('order_id')!=record['order_id'])):
                raise Blocked('Original PUT geometry or native identity changed, including working rows')
        terminal=[x for x in matching if x['state'] in {'CANCELED','FAILED'}]
        if terminal:
            if (len(terminal)!=len(matching) or len({x['state'] for x in terminal})!=1
                    or any(number(x.get('filled_quantity'))!=0 for x in terminal)
                    or record.get('fill_confirmed_at') or any(x.get('client_order_id')==cid for x in cut['working'])):
                raise Blocked('Conflicting terminal/fill/working evidence; original identity retained')
            record.update(terminal_no_fill=True,terminal_disposition=terminal[0]['state'],terminal_observed_at=cut['observed_at'])
            result[cid]={'state':'UNFILLED_TERMINAL'};continue
        filled=[x for x in projected_orders if x.get('client_order_id')==cid and x['state']=='FILLED']
        if filled and all(order_match(x,projected['request']) for x in filled):
            record.setdefault('fill_confirmed_at',cut['observed_at'])
            record.setdefault('fill_utc',filled[0].get('last_execution_at_utc'))
        working=[x for x in cut['working'] if x.get('client_order_id')==cid]
        if status['state'] in {'PENDING','SUBMITTED'} and working and record.get('order_id'):
            status={'state':'SUBMITTED'}
        elif status['state'] in {'PENDING','SUBMITTED'} and not working:
            status={'state':'WORKING_ENDPOINT_PENDING'}
        if status['state']=='POSITION_RECONCILED':
            record.setdefault('fill_observed_at',cut['observed_at']);record.setdefault('fill_utc',status.get('fill_utc'))
            record.setdefault('position_reconciled_at',cut['observed_at'])
        if filled and all(order_match(x,projected['request']) for x in filled) and all(x['state']=='FILLED' for x in matching):
            if record.get('lifecycle_cash_settled'):status={'state':'LIFECYCLE_RECONCILED'}
            elif record.get('position_reconciled_at') and datetime.fromisoformat(cut['observed_at']).astimezone(r.ET)>=datetime.combine(
                    datetime.fromisoformat(record['request']['legs'][0]['option_expire_date']).date(),daytime(16),tzinfo=r.ET):
                status={'state':'EXPIRED_ENTRY_LIFECYCLE_PENDING'}
        result[cid]=status
    return result


def reconciled_cut(broker,state):
    def read():
        cut=broker.snapshot(history=True);statuses=observations(cut,state)
        if any(x['state'] not in {'POSITION_RECONCILED','SUBMITTED','UNFILLED_TERMINAL','LIFECYCLE_RECONCILED','EXPIRED_ENTRY_LIFECYCLE_PENDING'} for x in statuses.values()):
            raise ReconciliationPending('Original acknowledged identity still propagating; never resend')
        return cut,statuses
    return reconcile_confirmed(read)


class Sender(r._PR47SingleSender):
    def __init__(self,broker,order,path,validate,metrics):
        super().__init__(broker.reader,broker.account,order,path)
        self.expected=deepcopy(order);self.validate=validate
        send=self.session.send
        def measured(prepared,**kwargs):
            self.validate();metrics.mark('request',route='webull:place');metrics.mark('http_send',route='webull:place',client_order_id=order['client_order_id'])
            return send(prepared,**kwargs)
        self.session.send=measured
    def validate_geometry(self):
        if self.order!=self.expected or self.order.get('option_strategy')!='SINGLE' or self.order.get('position_intent')!='SELL_TO_OPEN':
            raise Blocked('Frozen single PUT intent changed')
        if self.order.get('side')!='SELL' or self.order.get('quantity')!='1' or self.order.get('order_type')!='LIMIT' or self.order.get('time_in_force')!='DAY':
            raise Blocked('Only one LIMIT DAY sell-to-open PUT permitted')
        if len(self.order.get('legs',[]))!=1 or self.order['legs'][0].get('option_type')!='PUT' or self.order['legs'][0].get('side')!='SELL':
            raise Blocked('No stock, call, buyback or other order path')
        leg=self.order['legs'][0]
        if (leg.get('quantity')!='1' or leg.get('instrument_type')!='OPTION' or leg.get('symbol')!=self.order['symbol']
                or self.order['client_order_id']!=treatment_id(canonical(self.order['symbol']),leg['option_expire_date'])):
            raise Blocked('Single-contract assigned treatment identity mismatch')
        execution_window(leg['option_expire_date'])
        self.validate()


def initialize(batch):
    state=dict(schema='pr47.all69-0dte/1',status='PREPARING',orders={},treatments={},lifecycle_status='PENDING',
               initial_authorized_experiment_cash='2000000')
    for symbol in batch['universe']:
        date=DATES[0] if symbol in batch['nov13'] else DATES[1]
        state['treatments'][symbol]=dict(symbol=symbol,execution_date=date,expiration=date,
            client_order_id=treatment_id(symbol,date),disposition='SCHEDULED')
    if (len(state['treatments'])!=69 or len(batch['nov13'])!=28 or len(batch['nov20'])!=41
            or set(batch['nov13'])&set(batch['nov20']) or set(batch['nov13'])|set(batch['nov20'])!=set(batch['universe'])
            or 'KVUE' in state['treatments']):
        raise Blocked('Frozen first-attempt treatment partition invalid')
    return state


def validate_state(state,batch):
    expected=initialize(batch)['treatments']
    if set(state['treatments'])!=set(expected):raise Blocked('Treatment universe changed')
    for symbol,treatment in state['treatments'].items():
        for key in ('symbol','execution_date','expiration','client_order_id'):
            if treatment[key]!=expected[symbol][key]:raise Blocked('Immutable original treatment changed')
    owned={x['client_order_id']:s for s,x in expected.items()}
    for cid,record in state['orders'].items():
        if cid not in owned or record['request']['client_order_id']!=cid:raise Blocked('Unknown dispatch claim identity')
        request=record['request'];symbol=owned[cid]
        if (canonical(request['symbol'])!=symbol or len(request['legs'])!=1
                or request['legs'][0]['option_expire_date']!=expected[symbol]['expiration']):
            raise Blocked('Dispatch claim detached from assigned original treatment')



class DataBlocked(Blocked):pass

def dispatch_one(broker,providers,greeks,path,metrics,state,plans,date,symbol,treatment):
    cid=treatment['client_order_id']
    prepared=time.monotonic()
    try:
        pairs=catalog(broker.reader,symbol,date);contracts=[c for c,_ in pairs]
        greek=greeks.read(symbol,date);selected,delta=select_lowest(contracts,greek,r.now().timestamp())
    except (Blocked,r.Blocked) as error:raise DataBlocked(str(error)) from error
    metadata=next(row for c,row in pairs if c==selected)
    cut,statuses=reconciled_cut(broker,state)
    r.atomic(path/(symbol+'-funding.json'),full_funding(cut,state,plans,symbol,selected.strike))
    with r.qualification_slot():
        metrics.wait('webull:place',r.PLACEMENT_INTERVAL)
        provider='BF/B' if symbol=='BF.B' else symbol
        books,meta,clock=providers.prices((provider,selected.occ))
        q=books[selected.occ]
        def validate():
            execution_window(date);r.check_cut_age(cut)
            try:
                r.qualified(books,meta,clock)
                if canonical(books[provider].get('symbol'))!=symbol or books[provider].get('type')!='stock':raise Blocked('Underlying quote identity mismatch')
                if identity(symbol,q,date)!=selected:raise Blocked('Exact PUT quote identity changed')
                chosen,_=select_lowest(contracts,greek,r.now().timestamp())
                if chosen!=selected:raise Blocked('Lowest qualifying put changed before dispatch')
                tick(metadata,q['bid'])
            except (Blocked,r.Blocked) as error:raise DataBlocked(str(error)) from error
            full_funding(cut,state,plans,symbol,selected.strike)
        validate();order=order_fields(selected,metadata,q['bid']);directory=path/cid;directory.mkdir(mode=0o700)
        sender=Sender(broker,order,directory,validate,metrics)
        r.retain(directory/'unsigned-order.json',json.dumps(sender.package).encode())
        r.atomic(directory/'pre-send-audit.json',dict(symbol=symbol,selected_delta=str(delta),greeks=greek,
            contracts=[dict(symbol=c.symbol,expiration=c.expiration,strike=str(c.strike),occ=c.occ) for c in contracts],
            quotes=books,quote_meta=meta,clock=clock,contract=metadata,account_observed_at=cut['observed_at'],request_sha256=sender.package['sha256']))
        validate()
        rawkey=r.contract_key(order['legs'][0]);key=(canonical(rawkey[0]),)+rawkey[1:]
        record=dict(phase='zero-dte-put',request=order,shares_before=str(cut['inventory'][0][symbol]),
            option_baseline=[dict(order['legs'][0],baseline_quantity=str(cut['inventory'][1][key]))],cash_reservation=str(selected.strike*100),
            status='ATTEMPT_RECORDED',prepared_at=r.now().isoformat())
        state['orders'][cid]=record;treatment['disposition']='ATTEMPT_RECORDED';r.atomic(ROOT/'state.json',state)
        try:
            response=sender.place_once(placement_authorized=True)
            if not r.positive_ack(response,order):raise Blocked('Rejected or unresolved acknowledgement; original identity retained')
            record.update(status='ACCEPTED',order_id=response['response']['order_id'],acknowledged_at=r.now().isoformat())
            treatment['disposition']='ACCEPTED';metrics.mark('accepted',client_order_id=cid,preparation_to_ack=time.monotonic()-prepared)
        except Exception:
            record['status']='UNCERTAIN';raise
        finally:r.atomic(ROOT/'state.json',state)

def run(broker,providers,greeks,path,metrics,state,plans,date,binding):
    execution_window(date)
    for symbol,treatment in state['treatments'].items():
        if treatment['execution_date']<date and treatment['client_order_id'] not in state['orders']:
            treatment.update(disposition='MISSED_SESSION',reason='Original assigned expiration session passed without any dispatch claim; never re-enrolled')
    r.atomic(ROOT/'state.json',state)
    cut,statuses=reconciled_cut(broker,state)
    if 'baseline' not in state:
        if binding['mode']=='SEPARATE' and (any(cut['inventory'][0].values()) or any(cut['inventory'][1].values())
                or cut['working'] or number(cut['balance']['total_cash_balance'])!=Decimal('2000000')):
            raise Blocked('Separate experiment must start empty with exactly$2m verified simulated cash')
        state['baseline']=dict(at=cut['observed_at'],cash=cut['balance']['total_cash_balance'],shares=dict(cut['inventory'][0]),
            historical_order_ids=[x['order_id'] for x in cut['orders']])
        r.atomic(ROOT/'state.json',state)
    r.atomic(path/'whole-universe-funding.json',full_funding(cut,state,plans));metrics.mark('prepared')
    for symbol,treatment in state['treatments'].items():
        cid=treatment['client_order_id']
        if treatment['execution_date']!=date or cid in state['orders']:continue
        try:dispatch_one(broker,providers,greeks,path,metrics,state,plans,date,symbol,treatment)
        except DataBlocked as error:
            if cid in state['orders']:raise
            treatment.update(disposition='DATA_BLOCKED',reason=str(error),last_checked_at=r.now().isoformat())
            r.atomic(ROOT/'state.json',state)
            print(json.dumps(dict(symbol=symbol,status='DATA_BLOCKED',reason=str(error))),flush=True)
    cut=broker.snapshot(history=True);report=observations(cut,state);r.atomic(path/'reconciliation.json',report)
    r.atomic(ROOT/'state.json',state);print(json.dumps(dict(accepted=len(state['orders']),filled=sum(bool(v.get('position_reconciled_at')) for v in state['orders'].values()))),flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['observe','execute']);parser.add_argument('--reviewed-execution',action='store_true');args=parser.parse_args()
    if args.action=='execute' and not args.reviewed_execution:parser.error('Reviewed execution flag required')
    binding=json.loads((ROOT/'account-binding.json').read_text())
    if binding.get('status')!='VERIFIED':raise Blocked('Separate account / explicit exception unresolved; execution disabled')
    if args.action=='execute' and not binding.get('execution_enabled'):raise Blocked('Independent review and verified funding admission not yet recorded')
    os.umask(0o077);path=ROOT/(args.action+'-'+str(time.time_ns()));path.mkdir(mode=0o700);metrics=r.Measurements()
    try:
        with ExitStack() as stack:
            for lock in [ROOT/'writer.lock',r.ROOT/'writer.lock',r.SHARED_ROOT.parent/'pr47-stock-basket/server.lock',
                         r.SHARED_ROOT.parent/'aristocrats-covered-calls/execution.lock',r.SHARED_ROOT/'cohort-dispatch/writer.lock',r.SHARED_ROOT/'sender-control.lock']:
                stack.enter_context(r.exclusive(lock))
            broker=Broker(path,metrics,binding)
            batch=json.loads((ROOT/'calendar-batches.json').read_text())
            state=json.loads((ROOT/'state.json').read_text()) if (ROOT/'state.json').exists() else initialize(batch)
            validate_state(state,batch)
            if args.action=='observe':
                cut=broker.snapshot(history=True);report=observations(cut,state);r.atomic(path/'reconciliation.json',report)
                r.atomic(ROOT/'state.json',state);print(json.dumps(report),flush=True)
            else:
                date=r.now().astimezone(r.ET).date().isoformat();execution_window(date)
                prep=Path(json.loads((ROOT/'latest-preparation.json').read_text())['path']);fund=json.loads((prep/'funding.json').read_text())
                if not fund.get('funding_complete',fund['complete']):raise Blocked('Full69 reserve evidence incomplete; no implicit basket reduction')
                plans=json.loads((prep/'outcomes.json').read_text());providers=r.Providers(path,metrics);greeks=PutGreeks(path,metrics)
                stack.callback(providers.close);stack.callback(greeks.close)
                run(broker,providers,greeks,path,metrics,state,plans,date,binding)
    except Exception as error:
        print(json.dumps(dict(blocker=str(error),evidence=str(path))),flush=True);raise SystemExit(1) from None
    finally:r.atomic(path/'performance.json',metrics.summary())

if __name__=='__main__':
    try:main()
    except Blocked as error:print(json.dumps(dict(blocker=str(error))),flush=True);raise SystemExit(1)
