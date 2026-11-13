from collections import Counter
from copy import deepcopy
from decimal import Decimal as D
import unittest
from observe_lifecycle import lifecycle_report
import test_execute as fixture

class LifecycleTests(unittest.TestCase):
    def specimen(self):
        record=fixture.Tests().record();cid=record['request']['client_order_id'];record['position_reconciled_at']='2026-11-13T17:01:00+00:00'
        row=dict(deepcopy(record['request']),order_id='native-proof',state='FILLED',filled_quantity='1',average_fill_price='1.25',last_execution_at_utc='2026-11-13T17:01:00Z')
        state=dict(orders={cid:record},baseline=dict(historical_order_ids=[]),treatments={'PG':dict(client_order_id=cid,disposition='ACCEPTED')})
        baseline=dict(as_of='2026-11-13T17:00:00+00:00',cash='10000',shares={'PG':'100'},options=[dict(symbol='PG',right='CALL',expiration='2026-11-13',strike='95',quantity='-1')])
        def event(identity,kind,subtype,amount,symbol):return dict(activity_id=identity,event_type=kind,event_sub_type=subtype,net_amount=amount,currency='USD',occurred_at_utc='2026-11-13T21:05:00Z',provider=dict(symbol=symbol))
        events=[event('premium','TRADE','SELL','125','PG 20261113P'),event('put','OPTION_EA','OPTION_ASSIGNMENT','-10000','PG261113P00100000'),event('call','OPTION_EA','OPTION_ASSIGNMENT','9500','PG261113C00095000')]
        cut=dict(observed_at='2026-11-13T22:00:00+00:00',orders=[row],working=[],cash=events,balance=dict(total_cash_balance='9625'),inventory=(Counter(PG=D(100)),Counter()))
        return cut,state,baseline
    def test_put_delivery_and_existing_call_away_net_zero_shares(self):
        cut,state,baseline=self.specimen();report=lifecycle_report(cut,state,baseline)
        self.assertTrue(report['cash_reconciled']);self.assertEqual(report['treatments']['PG']['status'],'ASSIGNED_DELIVERED');self.assertEqual(report['treatments']['PG']['delivered_share_quantity'],100)
        self.assertEqual(report['treatments']['PG']['effective_cost_after_all_fees'],'98.75')
        self.assertIsNone(report['treatments']['PG']['reported_entry_commission'])
    def test_cash_or_share_mismatch_cannot_establish_acquisition(self):
        for component in ('cash','shares'):
            cut,state,baseline=self.specimen()
            if component=='cash':cut['cash']=cut['cash'][1:]
            else:cut['inventory'][0]['PG']=200
            self.assertNotEqual(lifecycle_report(cut,state,baseline)['treatments']['PG']['status'],'ASSIGNED_DELIVERED')
    def test_external_order_prevents_false_share_attribution(self):
        cut,state,baseline=self.specimen();cut['orders'].append(dict(order_id='foreign',client_order_id='foreign'))
        self.assertNotEqual(lifecycle_report(cut,state,baseline)['treatments']['PG']['status'],'ASSIGNED_DELIVERED')
    def test_multi_lot_not_silently_allocated(self):
        cut,state,baseline=self.specimen();baseline['options'].append(dict(symbol='PG',right='PUT',expiration='2026-11-13',strike='100',quantity='-1'))
        self.assertEqual(lifecycle_report(cut,state,baseline)['treatments']['PG']['status'],'UNRESOLVED_MULTI_LOT_ALLOCATION')
    def test_missing_exact_occ_event_not_assignment_proof(self):
        cut,state,baseline=self.specimen();cut['cash'][1]['provider']['symbol']='PG 20261113P'
        self.assertNotEqual(lifecycle_report(cut,state,baseline)['treatments']['PG']['status'],'ASSIGNED_DELIVERED')
    def test_expired_unassigned_requires_native_expiration_evidence(self):
        cut,state,baseline=self.specimen()
        for event in cut['cash'][1:]:event.update(event_sub_type='OPTION_EXPIRATION',net_amount='0')
        cut['balance']['total_cash_balance']='10125'
        self.assertEqual(lifecycle_report(cut,state,baseline)['treatments']['PG']['status'],'EXPIRED_UNASSIGNED')
    def test_unallocated_fee_never_disappears_from_economics(self):
        cut,state,baseline=self.specimen();fee=deepcopy(cut['cash'][0]);fee.update(activity_id='fee',event_type='FEE',event_sub_type='UNKNOWN',net_amount='-1');cut['cash'].append(fee);cut['balance']['total_cash_balance']='9624'
        result=lifecycle_report(cut,state,baseline)['treatments']['PG'];self.assertEqual(result['status'],'ASSIGNED_DELIVERED');self.assertIsNone(result['effective_cost_after_all_fees'])

if __name__=='__main__':unittest.main()
