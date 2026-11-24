"""Offline safety and reconciliation probes; no broker or provider access."""
from collections import Counter
from copy import deepcopy
from datetime import datetime,timezone
from decimal import Decimal as D
import unittest
from unittest.mock import patch,Mock
from pathlib import Path
from contextlib import redirect_stdout
from io import StringIO
import execute as e
from model import Blocked,Put,treatment_id

class Tests(unittest.TestCase):
    def cut(self,cash='50000',positions=None):
        return dict(observed_at=e.r.now().isoformat(),balance=dict(open_margin_calls=[],account_currency_assets=[
            dict(currency='USD',cash_balance=cash,option_buying_power=cash)]),inventory=(Counter(),positions or Counter()),working=[],orders=[])
    def state(self):
        return dict(orders={},treatments={s:dict(client_order_id=treatment_id(s,'2026-11-13'),disposition='SCHEDULED') for s in ['PG','KO']})
    def order(self):return e.order_fields(Put('PG','2026-11-13',D(100),'PG261113P00100000'),dict(ppind=True,underlying_symbol='PG'),'1.25')
    def record(self):return dict(request=self.order(),option_baseline=[dict(self.order()['legs'][0],baseline_quantity='0')],shares_before='0',order_id='native-proof')
    def test_unresolved_binding_never_constructs_reader(self):
        with patch.object(e.r,'load_credentials',side_effect=AssertionError('Must not load credentials')):
            with self.assertRaises(Blocked):e.Broker(None,None,dict(status='UNRESOLVED'))
    def test_cash_only_old_obligations_and_all_remaining_reserved(self):
        c=self.cut('40000',Counter({('OLD','PUT','2026-11-20',D(200)):-1}));s=self.state()
        plan={'PG':{'strike':'100'},'KO':{'planning_strike':'90'}}
        self.assertEqual(e.full_funding(c,s,plan)['total_required'],'39000')
        c['balance']['account_currency_assets'][0]['cash_balance']='38000'
        with self.assertRaises(Blocked):e.full_funding(c,s,plan)
    def test_pending_claim_reserved_then_filled_position_counted_once(self):
        c=self.cut();s=self.state();record=self.record();cid=record['request']['client_order_id'];s['orders'][cid]=record
        plans={'PG':{'strike':'100'},'KO':{'strike':'90'}}
        result=e.full_funding(c,s,plans);self.assertEqual(result['unreflected_claims'],'10000');self.assertEqual(result['total_required'],'19000')
        c['inventory'][1][('PG','PUT','2026-11-13',D(100))]=-1
        result=e.full_funding(c,s,plans);self.assertEqual(result['unreflected_claims'],'0');self.assertEqual(result['total_required'],'19000')
    def test_unknown_working_order_and_missing_reserve_block(self):
        c=self.cut();c['working']=[dict(client_order_id='unrelated')]
        with self.assertRaises(Blocked):e.full_funding(c,self.state(),{})
        with self.assertRaises(Blocked):e.full_funding(self.cut(),self.state(),{'PG':{'strike':'100'}})
    def test_exact_noon_to_close_assigned_day_only(self):
        for stamp,allowed in [('2026-11-13T16:59:59+00:00',False),('2026-11-13T17:00:00+00:00',True),
            ('2026-11-13T20:59:59+00:00',True),('2026-11-13T21:00:00+00:00',False),('2026-11-20T17:00:00+00:00',False)]:
            with patch.object(e.r,'now',return_value=datetime.fromisoformat(stamp)):
                if allowed:e.execution_window('2026-11-13')
                else:
                    with self.assertRaises(Blocked):e.execution_window('2026-11-13')
    def test_native_bf_alias_keeps_immutable_experiment_identity(self):
        order=e.order_fields(Put('BF.B','2026-11-20',D(35),'BFB261120P00035000'),dict(ppind=False,underlying_symbol='BFB'),'1.25')
        self.assertEqual(order['symbol'],'BFB');self.assertEqual(order['client_order_id'],treatment_id('BF.B','2026-11-20'))
        self.assertEqual(order['legs'][0]['option_type'],'PUT');self.assertEqual(order['position_intent'],'SELL_TO_OPEN')
    def test_unknown_original_identity_not_permission_to_resend(self):
        c=self.cut();record=self.record();cid=record['request']['client_order_id'];s=dict(orders={cid:record})
        self.assertEqual(e.observations(c,s)[cid]['state'],'UNRESOLVED_IDENTITY')
        self.assertIn(cid,s['orders'])
    def test_working_geometry_checked_even_before_fill(self):
        c=self.cut();record=self.record();cid=record['request']['client_order_id'];s=dict(orders={cid:record})
        row=dict(deepcopy(record['request']),order_id='native-proof',state='SUBMITTED')
        c['working']=[row];self.assertEqual(e.observations(c,s)[cid]['state'],'SUBMITTED')
        c['working'][0]['legs'][0]['strike_price']='110'
        with self.assertRaises(Blocked):e.observations(c,s)
    def test_sender_frozen_put_only_without_http(self):
        sender=object.__new__(e.Sender);sender.order=self.order();sender.expected=deepcopy(sender.order);sender.validate=lambda:None
        with patch.object(e,'execution_window'):
            sender.validate_geometry()
            sender.order['legs'][0]['option_type']='CALL';sender.expected=deepcopy(sender.order)
            with self.assertRaises(Blocked):sender.validate_geometry()
    def test_changed_working_limit_stops_reconciliation(self):
        c=self.cut();record=self.record();cid=record['request']['client_order_id'];row=dict(deepcopy(record['request']),order_id='native-proof',state='SUBMITTED');row['limit_price']='1.30';c['working']=[row]
        with self.assertRaises(Blocked):e.observations(c,dict(orders={cid:record}))
    def test_terminal_zero_fill_releases_claim_reserve_never_deletes_identity(self):
        c=self.cut();s=self.state();record=self.record();cid=record['request']['client_order_id'];s['orders'][cid]=record
        c['orders']=[dict(deepcopy(record['request']),order_id='native-proof',state='CANCELED',filled_quantity='0')]
        self.assertEqual(e.observations(c,s)[cid]['state'],'UNFILLED_TERMINAL');self.assertIn(cid,s['orders'])
        self.assertEqual(e.full_funding(c,s,{'KO':{'strike':'90'}})['total_required'],'9000')
    def test_expiration_does_not_erase_historical_entry_proof_or_release_cash(self):
        c=self.cut();c['observed_at']='2026-11-20T17:00:00+00:00';record=self.record();record['position_reconciled_at']='2026-11-13T18:00:00Z';cid=record['request']['client_order_id']
        c['orders']=[dict(deepcopy(record['request']),order_id='native-proof',state='FILLED',filled_quantity='1',average_fill_price='1.25')]
        s=self.state();s['orders'][cid]=record
        self.assertEqual(e.observations(c,s)[cid]['state'],'EXPIRED_ENTRY_LIFECYCLE_PENDING')
        self.assertFalse(record.get('lifecycle_cash_settled',False));self.assertEqual(record['position_reconciled_at'],'2026-11-13T18:00:00Z')
    def test_principal_withdrawal_neither_dispatches_nor_becomes_missed(self):
        for date in ('2026-11-13','2026-11-20'):
            state=self.state();state['baseline']={};cut=self.cut()
            for treatment in state['treatments'].values():treatment.update(execution_date='2026-11-13',disposition='EXCLUDED')
            broker=Mock();broker.snapshot.return_value=cut
            with patch.object(e,'execution_window'),patch.object(e,'reconciled_cut',return_value=(cut,{})),patch.object(e.r,'atomic'),patch.object(e,'dispatch_one') as dispatch,redirect_stdout(StringIO()):
                e.run(broker,Mock(),Mock(),Path('/offline-fixture'),Mock(),state,{},date,dict(mode='EXPLICIT_EXISTING_EXCEPTION'))
            dispatch.assert_not_called();self.assertTrue(all(t['disposition']=='EXCLUDED' for t in state['treatments'].values()))

if __name__=='__main__':unittest.main()
