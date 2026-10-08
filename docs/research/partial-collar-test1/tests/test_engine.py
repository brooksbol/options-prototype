import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'code'))
import unittest
from dataclasses import replace
from types import SimpleNamespace
import numpy as np
import pandas as pd
from data import indicators, load
from engine import Config,Controller,simulate,metrics

def row(**kw):
    v=dict(signal_close=100.,sma50=110.,sma200=110.,drawdown=0.,price5=0.,rvx5=0.,price_anchor=110.,vol_anchor=20.,rvx=20.)
    v.update(kw);return SimpleNamespace(**v)

def fixture(prices,opens=None,divs=None):
    ix=pd.bdate_range('2020-01-02',periods=len(prices)); p=np.array(prices,dtype=float)
    d=pd.DataFrame(dict(open=p if opens is None else opens,high=p+1,low=p-1,close=p,adj_close=p,volume=1000,dividend=np.zeros(len(p)) if divs is None else divs,rvx=20.),index=ix)
    d=indicators(d); d['sma50']=110.;d['sma200']=110.;d['drawdown']=-.2;d['price5']=0.;d['rvx5']=0.;d['price_anchor']=110.;d['vol_anchor']=20.
    return d

class TestController(unittest.TestCase):
    def test_l1_confirmation_and_sequential_l2(self):
        c=Controller(Config(mode='slow'))
        for i in range(9):c.step(i,row(drawdown=-.3))
        self.assertEqual(c.slow,0)
        c.step(9,row(drawdown=-.3));self.assertEqual(c.slow,1)
        c.step(10,row(drawdown=-.3));self.assertEqual(c.slow,2)
    def test_fast_only_a(self):
        c=Controller(Config())
        p=c.step(0,row(price5=-.07,rvx5=.6))
        self.assertFalse(p['a']);self.assertTrue(p['b']);self.assertEqual(c.slow,0)
    def test_requires_both_and_missing_vol_fails_closed(self):
        for vol in [.1,np.nan]:
            c=Controller(Config());c.step(0,row(price5=-.1,rvx5=vol));self.assertFalse(c.fast)
        c=Controller(Config(require_vol=False));c.step(0,row(price5=-.1,rvx5=np.nan));self.assertTrue(c.fast)
    def test_fast_causal_anchors_and_two_close_recovery(self):
        c=Controller(Config());c.step(0,row(signal_close=90.,price5=-.1,rvx5=1.,price_anchor=100.,vol_anchor=20.,rvx=40.))
        c.step(1,row(signal_close=80.,rvx=50.))
        c.step(2,row(signal_close=90.,rvx=35.));self.assertTrue(c.fast)
        c.step(3,row(signal_close=91.,rvx=34.));self.assertFalse(c.fast)
        self.assertEqual(c.anchor_price,100.);self.assertEqual(c.low,80.)
    def test_recovery2_before1(self):
        c=Controller(Config(mode='slow'));c.slow=2
        for i in range(5):p=c.step(i,row(signal_close=120.,drawdown=-.1))
        self.assertEqual(c.slow,0);self.assertTrue(p['a']);self.assertTrue(p['b'])
    def test_only_a_sold_then_recovery1(self):
        c=Controller(Config(mode='slow'));c.slow=1
        for i in range(5):c.step(i,row(signal_close=105.,sma50=100.,sma200=110.,drawdown=-.1))
        self.assertEqual(c.slow,0)
    def test_recovery1_not_repeated_for_second_block(self):
        c=Controller(Config(mode='slow'));c.slow=2
        for i in range(20):c.step(i,row(signal_close=105.,sma50=100.,sma200=110.,drawdown=-.1))
        self.assertEqual(c.slow,1)
    def test_fast_veto_beats_slow_restoration(self):
        c=Controller(Config());c.slow=1;c.above200=4
        p=c.step(0,row(signal_close=120.,drawdown=-.1,price5=-.1,rvx5=.7))
        self.assertEqual(c.slow,0);self.assertFalse(p['a']);self.assertTrue(p['b'])
    def test_edge_hysteresis_and_new_bear(self):
        c=Controller(Config(mode='slow',below_days=1,recovery_days=1,hysteresis=0))
        c.step(0,row(drawdown=-.2));self.assertEqual(c.slow,1)
        c.step(1,row(signal_close=105.,sma50=100.,drawdown=-.2));self.assertEqual(c.slow,0)
        c.step(2,row(drawdown=-.2));self.assertEqual(c.slow,0)
        c.step(3,row(drawdown=-.1));c.step(4,row(drawdown=-.2));self.assertEqual(c.slow,1)
    def test_persistent_bear_sensitivity(self):
        c=Controller(Config(mode='slow',persistent_bear=True,below_days=1,recovery_days=1,hysteresis=0))
        c.step(0,row(drawdown=-.2));c.step(1,row(signal_close=105.,sma50=100.,drawdown=-.2))
        c.step(2,row(drawdown=-.2));self.assertEqual(c.slow,1)

class TestLedger(unittest.TestCase):
    def test_last_close_signal_is_not_filled(self):
        d=fixture([100,90]);d.iloc[1,d.columns.get_loc('price5')]=-.1;d.iloc[1,d.columns.get_loc('rvx5')]=.6
        daily,t,s=simulate(d,Config())
        self.assertFalse((t.action=='SELL').any());self.assertTrue(s.iloc[-1].new_state.endswith('F1'))
    def test_gap_can_break_drawdown_target(self):
        d=fixture([300,100,100]);daily,t,s=simulate(d,Config(slippage=0,fee_share=0))
        self.assertLess(metrics(daily,t)['max_drawdown'],-.15)
    def test_split_crossing_refused(self):
        d=fixture([100,50]);d['split']=[1,2]
        with self.assertRaises(ValueError):simulate(d,Config())
    def test_causal_split_indicator(self):
        d=fixture([100,50]);d['split']=[1,2];d['dividend']=0.
        d=indicators(d);self.assertAlmostEqual(d.signal_close.iloc[0],d.signal_close.iloc[1])

    def test_next_open_not_signal_close(self):
        d=fixture([100,90,85]);d.iloc[0,d.columns.get_loc('price5')]=-.1;d.iloc[0,d.columns.get_loc('rvx5')]=.6
        daily,t,_=simulate(d,Config(slippage=0,fee_share=0))
        sell=t[t.action=='SELL'].iloc[0]
        self.assertEqual(sell.date,d.index[1]);self.assertEqual(sell.execution_price,90.)
        self.assertEqual(daily.iloc[1].core,100)
    def test_no_unsettled_cash_spend_or_partial_block(self):
        d=fixture([100,90,200,200,200]);d.iloc[0,d.columns.get_loc('price5')]=-.1;d.iloc[0,d.columns.get_loc('rvx5')]=.6
        d['signal_close']=200.;d.iloc[0,d.columns.get_loc('signal_close')]=90.
        d['rvx']=20.;d.iloc[0,d.columns.get_loc('rvx')]=40.
        daily,t,_=simulate(d,Config(slippage=0,fee_share=0,require_vol=False,fast_confirm=1),initial_capital=30000.)
        self.assertTrue((t.action=='DENIED_CASH').any());self.assertTrue((daily.cash>=0).all())
        self.assertTrue(daily.A.isin([0,100]).all())
    def test_dividend_once_and_receivable(self):
        d=fixture([100,99,99],divs=[0,1,0]);daily,t,_=simulate(d,Config(mode='hold300',slippage=0,fee_share=0,dividend_delay=7))
        self.assertAlmostEqual(daily.iloc[1].nav,100000.)
        self.assertAlmostEqual(daily.iloc[1].dividend_receivable,300.)
        self.assertAlmostEqual(daily.iloc[1].cash,70000.)
    def test_initial_affordability(self):
        with self.assertRaises(ValueError):simulate(fixture([400,400]),Config())
    def test_costs_and_nav_independent_reconciliation(self):
        d=fixture([100,100,100]);cfg=Config(mode='hold300',slippage=.01,fee_share=.1)
        daily,t,_=simulate(d,cfg)
        self.assertAlmostEqual(daily.nav.iloc[-1],100000-330)
        self.assertAlmostEqual(daily.costs.iloc[-1],330)
    def test_one_block_restoration(self):
        d=fixture([100]*25);d['drawdown']=-.3
        d.loc[d.index[12]:,'signal_close']=120.;d.loc[d.index[12]:,'drawdown']=-.1
        daily,t,_=simulate(d,Config(mode='slow',recovery2_one=True,slippage=0,fee_share=0))
        buys=t[(t.action=='BUY') & (t.trigger!='initial_allocation')]
        self.assertTrue(len(buys)>0);self.assertFalse(buys.date.duplicated().any())
    def test_prefix_invariant_indicators_and_actions(self):
        d=load();cut=pd.Timestamp('2020-04-01');perturbed=d.copy()
        for k in ['open','high','low','close']:perturbed.loc[perturbed.index>cut,k]*=3
        a=indicators(d);b=indicators(perturbed)
        pd.testing.assert_frame_equal(a.loc[:cut],b.loc[:cut])
        da,ta,sa=simulate(a,Config(),start='2019-01-02',end='2020-06-01')
        db,tb,sb=simulate(b,Config(),start='2019-01-02',end='2020-06-01')
        pd.testing.assert_frame_equal(da.loc[:cut],db.loc[:cut]);pd.testing.assert_frame_equal(sa.loc[:cut],sb.loc[:cut])
        pd.testing.assert_frame_equal(ta[ta.date<=cut],tb[tb.date<=cut])
    def test_full_portfolio_drawdown_not_underlying(self):
        daily,t,_=simulate(fixture([100,50]),Config(mode='hold300',slippage=0,fee_share=0))
        m=metrics(daily,t);self.assertAlmostEqual(m['max_drawdown'],-.15)

if __name__=='__main__':unittest.main()
