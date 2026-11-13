"""Unknown foreign put polarity stays unknown; reserve both legs at gross."""
from collections import Counter
from copy import deepcopy
from decimal import Decimal as D
import unittest
from unittest.mock import patch
import execute as e
from model import Blocked

class Tests(unittest.TestCase):
    def broker(self):
        b=object.__new__(e.Broker);b.experiment_symbols={'PG','KO'};return b
    def position(self):
        return dict(position_id='foreign-position-proof',symbol='SPY',quantity='-1',instrument_type='OPTION',option_strategy='VERTICAL',legs=[
            dict(symbol='SPY',instrument_type='OPTION',option_type='PUT',option_expire_date='2026-11-13',option_exercise_price=str(k),option_contract_multiplier='100',option_contract_deliverable='100') for k in (751,752)])
    def cut(self):
        position=self.position();order=dict(order_id='foreign-opening-proof',symbol='SPY',state='FILLED',quantity='1',filled_quantity='1',
            provider=dict(option_strategy='VERTICAL',position_intent='SELL_TO_OPEN'),legs=[dict(x,quantity='1') for x in position['legs']])
        return dict(positions=[position],orders=[order],working=[],inventory=(Counter(),Counter()),observed_at=e.r.now().isoformat(),
            balance=dict(open_margin_calls=[],account_currency_assets=[dict(currency='USD',cash_balance='200000',option_buying_power='200000')]))
    def test_polarity_not_invented_bound_is_both_puts_not_spread_width(self):
        b=self.broker();cut=self.cut()
        with patch.object(e.CoherentBroker,'snapshot',return_value=cut):result=b.snapshot(history=True)
        self.assertEqual(result['inventory'],(Counter(),Counter()))
        self.assertEqual(result['opaque_foreign_positions'][0]['gross_cash_bound'],D(150300))
        finance=e.full_funding(result,dict(orders={},treatments={}),{})
        self.assertEqual(finance['total_required'],'150300')
        result['balance']['account_currency_assets'][0]['cash_balance']='150000'
        with self.assertRaises(Blocked):e.full_funding(result,dict(orders={},treatments={}),{})
    def test_array_order_does_not_create_leg_sides_or_change_signature(self):
        b=self.broker();p=self.position();q=deepcopy(p);q['legs'].reverse()
        self.assertEqual(b.position_signature([p]),b.position_signature([q]))
        self.assertNotIn('side',p['legs'][0])
    def test_original69_call_or_nonstandard_positions_cannot_be_opaque(self):
        for change in ('cohort','call','multiple','deliverable'):
            p=self.position()
            if change=='cohort':p['symbol']='PG'
            elif change=='call':p['legs'][0]['option_type']='CALL'
            elif change=='multiple':p['quantity']='-2'
            else:p['legs'][0]['option_contract_deliverable']='150'
            with self.assertRaises(Blocked):self.broker().position_inventory([p])
    def test_native_one_to_one_opening_history_is_mandatory(self):
        for change in ('missing','ratio','duplicate','no_history'):
            b=self.broker();cut=self.cut()
            if change=='missing':cut['orders']=[]
            elif change=='ratio':cut['orders'][0]['legs'][0]['quantity']='2'
            elif change=='duplicate':
                other=deepcopy(cut['orders'][0]);other['order_id']='other-native-order';cut['orders'].append(other)
            with patch.object(e.CoherentBroker,'snapshot',return_value=cut):
                with self.assertRaises(Blocked):b.snapshot(history=change!='no_history')

if __name__=='__main__':unittest.main()
