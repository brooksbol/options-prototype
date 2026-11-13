from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
from decimal import Decimal as D
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch

import runner as r
import sequential as s
from experiment import Blocked, buy_write, client_id, contract_identity, contract_key
from test_experiment import OLD, NEW, balance, listed, position_leg

AT = datetime(2026, 11, 13, 15, 30, tzinfo=timezone.utc)


class Broker:
    pending = False
    position_pending = False

    def __init__(self, path):
        self.path = path
        self.measurements = r.Measurements()
        self.shares = Counter(PG=D(200))
        self.options = Counter({contract_identity(OLD): D(-1)})
        self.history = []
        self.sent = []

    def catalog(self, contract):
        return {}

    def snapshot(self, history=False):
        return dict(balance=balance(), inventory=(deepcopy(self.shares), deepcopy(self.options)),
                    positions=[dict(symbol='PG', instrument_type='OPTION', option_strategy='COVERED_STOCK',
                                    quantity='1', position_id='original-covered', legs=[position_leg(OLD)])],
                    orders=deepcopy(self.history), working=[], cash=[], observed_at=AT.isoformat())


class Providers:
    def prices(self, symbols):
        books = {'PG': dict(symbol='PG', type='stock', bid='181', ask='181.10')}
        books.update({c.occ: dict(listed(c), bid='2', ask='2.10') for c in [OLD, NEW]})
        return {k: books[k] for k in symbols}, {}, {}

    def market(self, endpoint, **params):
        if endpoint == 'options/expirations':
            return {'expirations': {'expiration': [{'date': OLD.expiry}, {'date': NEW.expiry}]}}, {}
        return dict(options=dict(option=[listed(NEW)])), {}


class Sender:
    def __init__(self, broker, order, path, validate, metrics):
        self.broker, self.order, self.validate = broker, deepcopy(order), validate
        self.package = dict(sha256='fixture')

    def place_once(self, placement_authorized=False):
        assert placement_authorized
        self.validate()
        state = json.loads((r.ROOT / 'state.json').read_text())
        assert state['orders'][self.order['client_order_id']]['status'] == 'ATTEMPT_RECORDED'
        self.broker.sent.append(deepcopy(self.order))
        closing = self.order['side'] == 'BUY'
        contract = OLD if closing else NEW
        pending = self.broker.pending and closing
        if not pending and not (self.broker.position_pending and closing):
            self.broker.options[contract_identity(contract)] += 1 if closing else -1
        self.broker.history.append(dict(client_order_id=self.order['client_order_id'], order_id='broker-'+str(len(self.broker.sent)),
            symbol='PG', side=self.order['side'], quantity='1', filled_quantity='0' if pending else '1',
            average_fill_price=self.order['limit_price'], legs=deepcopy(self.order['legs']),
            state='SUBMITTED' if pending else 'FILLED', last_execution_at_utc=AT.isoformat()))
        return dict(http_status=200, response=dict(client_order_id=self.order['client_order_id'],
                    order_id=self.broker.history[-1]['order_id']))


def state():
    request = buy_write(OLD, {'ask': '181'}, {'bid': '2'})
    return dict(orders={client_id('entry', 'PG'): dict(phase='entry', request=request, shares_before='100',
                position_reconciled_at=AT.isoformat(), cash_reservation='18100')})


class Tests(unittest.TestCase):
    def test_wire_shape_and_distinct_intents(self):
        close = s.single(OLD, True, '2.10', 'native-position')
        opened = s.single(NEW, False, '2')
        self.assertNotEqual(close['client_order_id'], opened['client_order_id'])
        self.assertEqual(close['position_intent'], 'BUY_TO_CLOSE')
        self.assertEqual(close['leg_in_or_out'], 'LEG_OUT')
        self.assertEqual(close['position_id'], 'native-position')
        self.assertNotIn('position_intent', close['legs'][0])
        self.assertNotIn('position_id', opened)
        for invalid in ['0', '-1', '1.001', 'NaN']:
            with self.assertRaises(Blocked):
                s.single(NEW, False, invalid)

    def test_full_close_confirmation_and_restart_no_replay(self):
        with tempfile.TemporaryDirectory() as path:
            path = Path(path); b = Broker(path); st = state()
            with patch.object(r, 'ROOT', path), patch.object(r, 'now', return_value=AT), patch.object(s, 'COHORT', ('PG',)), \
                 patch.object(r, 'qualified'), patch.object(r, 'qualify_equities'), patch.object(s, 'Sender', Sender):
                s.run(b, Providers(), st, True)
                self.assertEqual([x['position_intent'] for x in b.sent], ['BUY_TO_CLOSE', 'SELL_TO_OPEN'])
                self.assertEqual(st['sequential_rolls']['PG']['status'], 'COMPLETE')
                self.assertEqual(b.options[contract_identity(OLD)], 0)
                self.assertEqual(b.options[contract_identity(NEW)], -1)
                s.run(b, Providers(), st, True)
                self.assertEqual(len(b.sent), 2)

    def test_unfilled_close_never_opens(self):
        self.pending_case('pending')

    def test_fill_without_position_removal_never_opens(self):
        self.pending_case('position_pending')

    def pending_case(self, attribute):
        with tempfile.TemporaryDirectory() as path:
            path = Path(path); b = Broker(path); setattr(b, attribute, True); st = state()
            with patch.object(r, 'ROOT', path), patch.object(r, 'now', return_value=AT), patch.object(s, 'COHORT', ('PG',)), \
                 patch.object(r, 'qualified'), patch.object(r, 'qualify_equities'), patch.object(s, 'Sender', Sender):
                s.run(b, Providers(), st, True)
                self.assertEqual(len(b.sent), 1)
                self.assertNotEqual(st['sequential_rolls']['PG']['status'], 'COMPLETE')
                s.run(b, Providers(), st, True)
                self.assertEqual(len(b.sent), 1)

    def test_gross_close_cost_and_puts_not_net_credit(self):
        cut = Broker(Path('/tmp')).snapshot();cut['balance'] = balance(cash='1100', option='10000')
        cut['inventory'][1][('PG', 'PUT', OLD.expiry, D(10))] = -1
        with patch.object(r, 'now', return_value=AT), self.assertRaises(Blocked):
            s.finance(cut, state(), D(101))

    def test_external_working_and_uncovered_calls_block(self):
        cut = Broker(Path('/tmp')).snapshot();cut['working'] = [dict(client_order_id='foreign')]
        with patch.object(r, 'now', return_value=AT), self.assertRaises(Blocked):
            s.finance(cut, state())
        cut['working'] = [];cut['inventory'][0]['PG'] = 0
        with patch.object(r, 'now', return_value=AT), self.assertRaises(Blocked):
            s.finance(cut, state())

    def test_original_position_ambiguity_rejected(self):
        cut = Broker(Path('/tmp')).snapshot()
        self.assertEqual(s.close_position(cut, OLD), 'original-covered')
        cut['positions'] *= 2
        with self.assertRaises(Blocked):s.close_position(cut, OLD)

    def test_malformed_sender_is_rejected_without_http(self):
        sender = object.__new__(s.Sender)
        sender.order = s.single(NEW, False, '2');sender.expected = deepcopy(sender.order)
        sender.order['legs'][0]['side'] = 'BUY';sender.expected = deepcopy(sender.order)
        sender.validate_evidence = lambda: None
        with self.assertRaises(Blocked):sender.validate_geometry()


if __name__ == '__main__':unittest.main()
