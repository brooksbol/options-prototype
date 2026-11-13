from decimal import Decimal as D
import unittest
from model import Blocked,Put,select_lowest,tick,treatment_id,basket_capacity

class Tests(unittest.TestCase):
    def setUp(self):
        self.grid=[Put('PG','2026-11-13',D(k),'PG'+str(k)) for k in [100,105,110]]
    def obs(self,values):
        return dict(symbol='PG',right='PUT',expiration='2026-11-13',greeks=[dict(symbol=c.occ,delta=d,updatedAt=1000000) for c,d in zip(self.grid,values)])
    def test_strict_absolute_threshold_and_lowest_strike(self):
        c,d=select_lowest(self.grid,self.obs(['-.50','-.5001','-.90']),1001)
        self.assertEqual(c.strike,105);self.assertEqual(d,D('-.5001'))
    def test_missing_lower_cannot_promote_higher(self):
        o=self.obs(['-.20','-.6','-.8']);del o['greeks'][0]
        with self.assertRaises(Blocked):select_lowest(self.grid,o,1001)
    def test_lowest_strike_is_not_nearest_delta(self):
        c,_=select_lowest(self.grid,self.obs(['-.9','-.51','-.8']),1001)
        self.assertEqual(c.strike,100)
    def test_duplicate_greek_and_future_clock_block(self):
        o=self.obs(['-.1','-.6','-.8']);o['greeks'].append(o['greeks'][0])
        with self.assertRaises(Blocked):select_lowest(self.grid,o,1001)
    def test_missing_higher_does_not_hide_minimum(self):
        o=self.obs(['-.2','-.6']);self.assertEqual(select_lowest(self.grid,o,1001)[0].strike,105)
    def test_stale_future_or_wrong_right_block(self):
        for now in [999,1121]:
            with self.assertRaises(Blocked):select_lowest(self.grid,self.obs(['-.1','-.6','-.9']),now)
        o=self.obs(['-.1','-.6','-.9']);o['right']='CALL'
        with self.assertRaises(Blocked):select_lowest(self.grid,o,1001)
    def test_tick_never_rounds(self):
        self.assertEqual(tick({'ppind':True},'3.05'),D('3.05'))
        for flag,bid in [(True,'3.01'),(False,'1.01'),(True,'0')]:
            with self.assertRaises(Blocked):tick({'ppind':flag},bid)
    def test_distinct_immutable_batches_and_no_stock_recycling(self):
        self.assertNotEqual(treatment_id('PG','2026-11-13'),treatment_id('PG','2026-11-20'))
        self.assertEqual(basket_capacity('1000','200',['500','400']),-100)

if __name__=='__main__':unittest.main()
