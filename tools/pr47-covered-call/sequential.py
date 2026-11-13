"""Friday-only close-confirm-open successor; default is read-only planning.

Reuse the reviewed account, financial bracket, quotes, pacing, sender and durable
claims. Original failed calendar claims are never removed or replayed.
"""
import argparse
from collections import Counter
from contextlib import ExitStack
from copy import deepcopy
from decimal import Decimal
import json
import os
from pathlib import Path
import time

import runner as r
from experiment import Blocked, COHORT, EXPIRY, Contract, client_id, combo, contract_identity, contract_key, number


def terms(document):
    return Contract(document['symbol'], document['expiry'], number(document['strike']), document['occ'])


def serialize(contract):
    return dict(symbol=contract.symbol, expiry=contract.expiry, strike=str(contract.strike), occ=contract.occ)


def close_id(symbol):
    return client_id('roll-close-legout', symbol)


def single(contract, closing, price, position=None):
    price = number(price)
    if price <= 0 or price != price.quantize(Decimal('.01')):
        raise Blocked('Single-leg limit must be positive with verified cent precision')
    intent = 'BUY_TO_CLOSE' if closing else 'SELL_TO_OPEN'
    side = 'BUY' if closing else 'SELL'
    leg = contract.leg(side, intent)
    del leg['position_intent']
    order = combo(contract.symbol, 'roll-close' if closing else 'roll-open', 'SINGLE', side, price, [leg])
    order['position_intent'] = intent
    if position:
        order.update(leg_in_or_out='LEG_OUT', position_id=position)
        # Observed 417: intent is forbidden on LEG_OUT in this API version.
        del order['position_intent']
    if closing:
        order['client_order_id'] = close_id(contract.symbol)
    return order


def close_position(cut, old):
    found = [row for row in cut['positions'] if row.get('instrument_type') == 'OPTION'
             and any(leg.get('instrument_type') == 'OPTION' and contract_key(leg) == contract_identity(old)
                     for leg in row.get('legs', []))]
    if len(found) != 1 or number(found[0]['quantity']) not in (Decimal(1), Decimal(-1)):
        raise Blocked(f'{old.symbol}: original short call position identity ambiguous')
    row = found[0]
    if row.get('option_strategy') == 'COVERED_STOCK':
        if not row.get('position_id'):
            raise Blocked('Missing native covered-stock position ID for LEG_OUT')
        return row['position_id']
    if row.get('option_strategy') != 'SINGLE' or number(row['quantity']) != -1:
        raise Blocked('Original option is not a recognized single short call')
    return None


class Sender(r.ComboSender):
    def validate_geometry(self):
        order = self.order
        if order != self.expected or order['symbol'] not in COHORT or order['option_strategy'] != 'SINGLE':
            raise Blocked('Frozen sequential request changed')
        if len(order['legs']) != 1 or order['quantity'] != '1':
            raise Blocked('Sequential order must be exactly one contract')
        leg = order['legs'][0]
        closing = order['client_order_id'] == close_id(order['symbol'])
        side = 'BUY' if closing else 'SELL'
        expected_intent = None if closing and order.get('leg_in_or_out') == 'LEG_OUT' else 'BUY_TO_CLOSE' if closing else 'SELL_TO_OPEN'
        if (order.get('position_intent') != expected_intent
                or order['side'] != side or leg['side'] != side or leg['quantity'] != '1'
                or leg['option_type'] != 'CALL' or leg['instrument_type'] != 'OPTION'
                or leg['symbol'] != order['symbol'] or 'position_intent' in leg
                or (not closing and ('leg_in_or_out' in order or 'position_id' in order))):
            raise Blocked('Sequential contract/intent/side mismatch')
        self.validate_evidence()


def finance(cut, state, debit=Decimal(0), current=None):
    r.check_cut_age(cut)
    if cut['balance'].get('open_margin_calls'):
        raise Blocked('Account reports an open margin call')
    shares, options = cut['inventory']
    if any(shares[symbol] < 100 * sum(-q for key, q in options.items()
           if key[:2] == (symbol, 'CALL') and q < 0) for symbol in COHORT):
        raise Blocked('Aggregate short-call stock coverage is insufficient')
    if any(row.get('client_order_id') not in state['orders'] for row in cut['working']):
        raise Blocked('External working order requires explicit reconciliation')
    usd = next(x for x in cut['balance']['account_currency_assets'] if x['currency'] == 'USD')
    available = min(number(usd['cash_balance']) - r.put_obligation(options), number(usd['option_buying_power']))
    reserved = sum((number(v['cash_reservation']) for cid, v in state['orders'].items()
                    if cid != current and v['phase'] == 'roll-close' and not v.get('position_reconciled_at')
                    and not v.get('rejected_no_order')), Decimal(0))
    if debit + reserved > max(Decimal(0), available):
        raise Blocked(f'Whole-basket closing debit/reservations exceed capacity by {debit + reserved - available}')
    return dict(cash=usd['cash_balance'], option_buying_power=usd['option_buying_power'],
                put_obligation=str(r.put_obligation(options)), available=str(available), reserved=str(reserved))


def confirm(record, cut):
    result = r.reconcile(record, cut['orders'] + cut['working'], *cut['inventory'])
    if result['state'] == 'POSITION_RECONCILED':
        record.setdefault('fill_observed_at', cut['observed_at'])
        if result.get('fill_utc'):
            record.setdefault('fill_utc', result['fill_utc'])
        record.setdefault('position_reconciled_at', cut['observed_at'])
    return result


def permit_prior_failures(broker, state, cut):
    """A retained rejection is not deleted or treated as a replay permission."""
    for cid, record in state['orders'].items():
        if record['phase'] not in {'roll', 'roll-close'}:
            continue
        # Corrected identities always recover through exact original-ID fill /
        # position reconciliation below, including lost acknowledgements.
        if record['phase'] == 'roll-close' and cid == close_id(record['request']['symbol']):
            continue
        if record.get('acknowledged_at') or record.get('order_id'):
            if record['phase'] == 'roll':
                raise Blocked('Existing paired roll requires separate reconciliation')
            if cid != close_id(record['request']['symbol']):
                raise Blocked('Acknowledged legacy close must reconcile; no new close identity permitted')
            continue
        evidence = list(r.ROOT.glob(f'roll-*/{cid}/place-result.json'))
        evidence += list(r.ROOT.glob(f'sequential-execute-*/{cid}/place-result.json'))
        if len(evidence) != 1:
            raise Blocked('Missing/ambiguous original calendar rejection evidence')
        result = json.loads(evidence[0].read_text())
        if result.get('http_status') != 417 or result.get('response', {}).get('error_code') not in {
            'OPENAPI_OPTION_STRATEGY_UNMATCHED', 'OPENAPI_MULTILEG_ORDER_OPEN_CLOSE_MISMATCH',
            'OPENAPI_POSITION_INTENT_NOT_SUPPORT_LEG_IN_OUT_ROLLING'}:
            raise Blocked('Original paired attempt does not have an explicit strategy rejection')
        if any(x.get('client_order_id') == cid for x in cut['orders'] + cut['working']):
            raise Blocked('Rejected calendar identity unexpectedly appears in broker orders')
        # Retained exact-ID response must corroborate absence, not merely empty history.
        receipts = list(r.ROOT.glob('failed-roll-audit-*/identity-*/*detail.json'))
        receipts += list(r.ROOT.glob('roll-diagnostic-*/identity-*/*detail.json'))
        matching = []
        for path in receipts:
            meta = path.with_name(path.stem + '-metadata.json')
            if meta.exists() and cid in meta.read_text():
                matching.append(json.loads(path.read_text()))
        if not any(x.get('error_code') == 'OPENAPI_PARAM_ERR' and x.get('message') == 'Parameter error, Order not present.'
                   for x in matching):
            raise Blocked('Original rejection lacks an exact-ID not-present receipt')
        record['rejected_no_order'] = dict(evidence=str(evidence[0]), verified_at=cut['observed_at'])


def publish(broker, state, cut):
    result = {}
    for symbol, workflow in state.get('sequential_rolls', {}).items():
        close = state['orders'].get(close_id(symbol))
        opened = state['orders'].get(client_id('roll-open', symbol))
        close_result = confirm(close, cut) if close else {'state': 'UNATTEMPTED'}
        open_result = confirm(opened, cut) if opened else {'state': 'UNATTEMPTED'}
        old, new = terms(workflow['old']), terms(workflow['new'])
        shares, options = cut['inventory']
        complete = (close and opened and close.get('position_reconciled_at') and opened.get('position_reconciled_at')
                    and options[contract_identity(old)] == 0 and options[contract_identity(new)] == -1
                    and shares[symbol] == number(workflow['shares']))
        workflow['status'] = 'COMPLETE' if complete else 'OPEN_PENDING' if close and close.get('position_reconciled_at') else 'CLOSE_PENDING'
        result[symbol] = dict(status=workflow['status'], close=close_result, open=open_result)
    r.atomic(broker.path / 'sequential-reconciliation.json', result)
    return result


def run(broker, providers, state, execute):
    cut = broker.snapshot(history=True)
    permit_prior_failures(broker, state, cut)
    finance(cut, state)
    state.setdefault('sequential_rolls', {})
    publish(broker, state, cut)
    # Full-basket admission excludes future sale proceeds and retains put reserves.
    remaining = {}
    for symbol in COHORT:
        record = state['orders'].get(client_id('entry', symbol))
        if not record or not record.get('position_reconciled_at'):
            raise Blocked('An original experiment entry lacks position proof')
        if symbol in state['sequential_rolls'] and close_id(symbol) in state['orders']:
            continue
        old = r.record_contract(record)
        if cut['inventory'][1][contract_identity(old)] != -1:
            raise Blocked(f'{symbol}: original call no longer exists; lifecycle reconciliation required')
        remaining[symbol] = old
    if remaining:
        books, meta, clock = providers.prices(tuple(remaining) + tuple(x.occ for x in remaining.values()))
        r.qualify_equities({s: books[s] for s in remaining}, meta, clock)
        needed = {}
        gross = Decimal(0)
        for symbol, old in remaining.items():
            r.verify_option_quote(old, books[old.occ])
            if (number(books[symbol]['bid']) + number(books[symbol]['ask'])) / 2 > old.strike:
                needed.update({symbol: books[symbol], old.occ: books[old.occ]})
                gross += number(books[old.occ]['ask']) * 100
        if needed:
            r.qualified(needed, meta, clock)
        finance(cut, state, gross)
        r.atomic(broker.path / 'basket-funding.json', dict(gross_close_debits=str(gross), **finance(cut, state)))
    for symbol in COHORT:
        workflow = state['sequential_rolls'].get(symbol)
        if workflow and workflow['status'] == 'COMPLETE':
            continue
        entry = state['orders'][client_id('entry', symbol)]
        old = r.record_contract(entry)
        if not workflow:
            stock = books[symbol]
            if (number(stock['bid']) + number(stock['ask'])) / 2 <= old.strike:
                continue
            expiry = r.next_expiration(providers, symbol)
            document, _ = providers.market('options/chains', symbol=symbol, expiration=expiry, greeks='false')
            new = r.select_roll(old, r.calls(document, symbol, expiry))
            workflow = dict(old=serialize(old), new=serialize(new), shares=str(cut['inventory'][0][symbol]), status='PREPARED')
        else:
            new = terms(workflow['new'])
        r.session_window('roll')
        broker.catalog(new)
        for closing, contract in [(True, old), (False, new)]:
            cid = close_id(symbol) if closing else client_id('roll-open', symbol)
            cut = broker.snapshot(history=True)
            prior = state['orders'].get(cid)
            if prior:
                result = confirm(prior, cut)
                if result['state'] != 'POSITION_RECONCILED':
                    print(json.dumps(dict(symbol=symbol, phase='close' if closing else 'open', pending=result)), flush=True)
                    break
                continue
            if not closing:
                close = state['orders'].get(close_id(symbol))
                if not close or confirm(close, cut)['state'] != 'POSITION_RECONCILED':
                    raise Blocked('Opening requires exact close fill and position removal')
            broker.catalog(contract)
            prepared = time.monotonic()
            with r.qualification_slot():
                quotes, quote_meta, clock = providers.prices((symbol, old.occ, new.occ) if closing else (symbol, new.occ))
                for c in ((old, new) if closing else (new,)):
                    r.verify_option_quote(c, quotes[c.occ])
                if number(quotes[new.occ]['bid']) <= 0:
                    raise Blocked('Opening call has no positive executable bid')
                def validate():
                    r.qualified(quotes, quote_meta, clock)
                    shares, options = cut['inventory']
                    if shares[symbol] != number(workflow['shares']) or shares[symbol] < number(entry['shares_before']) + 100:
                        raise Blocked('Original experimental share scope changed')
                    if options[contract_identity(new)] != 0 or options[contract_identity(old)] != (-1 if closing else 0):
                        raise Blocked('Exact old/destination quantities changed')
                    if closing and (number(quotes[symbol]['bid']) + number(quotes[symbol]['ask'])) / 2 <= old.strike:
                        raise Blocked('Call no longer ITM before close; no order sent')
                    finance(cut, state, number(quotes[old.occ]['ask']) * 100 if closing else Decimal(0), cid)
                validate()
                order = single(contract, closing, quotes[contract.occ]['ask' if closing else 'bid'],
                               close_position(cut, old) if closing else None)
                if not execute:
                    print(json.dumps(dict(symbol=symbol, proposed=order)), flush=True)
                    break
                state['sequential_rolls'][symbol] = workflow
                r.atomic(r.ROOT / 'state.json', state)
                original_sender = r.ComboSender
                try:
                    r.ComboSender = Sender
                    r.submit(broker, order, 'roll-close' if closing else 'roll-open', cut,
                             number(order['limit_price']) * 100 if closing else Decimal(0), state, validate, prepared,
                             dict(quotes=quotes, quote_meta=quote_meta, clock=clock, sequential=deepcopy(workflow)))
                finally:
                    r.ComboSender = original_sender
            cut = broker.snapshot(history=True)
            result = confirm(state['orders'][cid], cut)
            publish(broker, state, cut)
            r.atomic(r.ROOT / 'state.json', state)
            if result['state'] != 'POSITION_RECONCILED':
                print(json.dumps(dict(symbol=symbol, pending=result)), flush=True)
                break
        if execute:
            r.atomic(r.ROOT / 'state.json', state)
    result = publish(broker, state, broker.snapshot(history=True))
    if execute:
        r.atomic(r.ROOT / 'state.json', state)
    print(json.dumps(dict(sequential=result)), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['plan', 'execute', 'observe'])
    parser.add_argument('--reviewed-execution', action='store_true')
    args = parser.parse_args()
    execute = args.action == 'execute'
    if execute and not args.reviewed_execution:
        parser.error('Reviewed execution flag required')
    r.session_window('roll')
    os.umask(0o077)
    path = r.ROOT / f'sequential-{args.action}-{time.time_ns()}'
    path.mkdir(mode=0o700)
    metrics = r.Measurements()
    try:
        with ExitStack() as stack:
            if execute or args.action == 'observe':
                for lock in [r.ROOT / 'writer.lock', r.SHARED_ROOT.parent / 'pr47-stock-basket/server.lock',
                             r.SHARED_ROOT.parent / 'aristocrats-covered-calls/execution.lock',
                             r.SHARED_ROOT / 'cohort-dispatch/writer.lock', r.SHARED_ROOT / 'sender-control.lock']:
                    stack.enter_context(r.exclusive(lock))
            broker = r.Broker(path, metrics)
            state = json.loads((r.ROOT / 'state.json').read_text())
            if args.action == 'observe':
                result = publish(broker, state, broker.snapshot(history=True))
                r.atomic(r.ROOT / 'state.json', state)
                print(json.dumps(result), flush=True)
            else:
                providers = r.Providers(path, metrics)
                stack.callback(providers.close)
                run(broker, providers, state, execute)
    except Exception as error:
        print(json.dumps(dict(blocker=str(error), evidence=str(path))), flush=True)
        raise SystemExit(1) from None
    finally:
        r.atomic(path / 'performance.json', metrics.summary())


if __name__ == '__main__':
    main()
