"""Causal regime controller and settled-cash whole-share ledger. No options."""
from dataclasses import dataclass, asdict
import math
import numpy as np
import pandas as pd

@dataclass(frozen=True)
class Config:
    mode: str = 'both'
    price: float = .06
    vol: float = .50
    recover_price: float = .50
    recover_vol: float = .50
    require_vol: bool = True
    bear1: float = .15
    bear2: float = .25
    below_days: int = 10
    recovery_days: int = 5
    hysteresis: int = 5
    fast_confirm: int = 2
    recovery2_one: bool = False
    persistent_bear: bool = False
    slippage: float = .0005
    fee_share: float = .005
    dividend_delay: int = 7
    cash_yield: float = 0.0

class Controller:
    def __init__(self, cfg):
        self.c = cfg
        self.slow = 0
        self.fast = False
        self.below = self.above50 = self.above200 = self.fast_good = 0
        self.arm1 = self.arm2 = self.armfast = True
        self.last_transition = -10000
        self.recovery1_used = False
        self.last_direction = None
        self.anchor_price = self.anchor_vol = self.low = self.peak = math.nan

    def state(self):
        return f'S{self.slow}:F{int(self.fast)}'

    def step(self, i, r):
        c = self.c
        old = self.state()
        reasons=[]
        close = r.signal_close
        self.below = self.below+1 if close < r.sma200 else 0
        self.above50 = self.above50+1 if close > r.sma50 else 0
        self.above200 = self.above200+1 if close > r.sma200 else 0
        condition1 = r.drawdown <= -c.bear1 and self.below >= c.below_days
        condition2 = r.drawdown <= -c.bear2
        if not condition1: self.arm1=True
        if not condition2: self.arm2=True
        if c.mode in ('slow','both'):
            before = self.slow
            bear_allowed=self.last_direction!='recovery' or i-self.last_transition>=c.hysteresis
            # Escalation is not delayed by recovery cooldown. L2 cannot share L1's signal day.
            if bear_allowed and condition2 and before >= 1 and (self.arm2 or c.persistent_bear) and before < 2:
                self.slow=2; self.recovery1_used=False; self.arm2=False; reasons.append('slow_bear2')
            elif bear_allowed and condition1 and (self.arm1 or c.persistent_bear) and before == 0:
                self.slow=1; self.recovery1_used=False; self.arm1=False; reasons.append('slow_bear1')
            elif i-self.last_transition >= c.hysteresis and self.slow:
                if self.above200 >= c.recovery_days:
                    self.slow=0; reasons.append('slow_recovery2')
                elif self.above50 >= c.recovery_days and not self.recovery1_used:
                    self.slow-=1; self.recovery1_used=True; reasons.append('slow_recovery1')
            if self.slow != before:
                self.last_transition=i
                self.last_direction='recovery' if self.slow<before else 'bear'
                self.above50=self.above200=0
        qualifying = (r.price5 <= -c.price and
                      (not c.require_vol or r.rvx5 >= c.vol))
        if not qualifying: self.armfast=True
        if c.mode=='both':
            if self.fast:
                self.low=min(self.low,close)
                if math.isfinite(r.rvx):
                    self.peak=max(self.peak,r.rvx) if math.isfinite(self.peak) else r.rvx
            if qualifying and self.fast: self.fast_good=0
            if qualifying and self.armfast:
                self.armfast=False
                # Repeated qualified bursts within a latched episode don't rewrite anchors.
                if not self.fast:
                    self.fast=True; self.fast_good=0
                    self.anchor_price=r.price_anchor; self.anchor_vol=r.vol_anchor
                    self.low=close; self.peak=r.rvx
                    reasons.append('fast_crash')
            elif self.fast and not qualifying:
                self.low=min(self.low,close)
                if math.isfinite(r.rvx):
                    self.peak=max(self.peak,r.rvx) if math.isfinite(self.peak) else r.rvx
                price_ok = close >= self.low+c.recover_price*(self.anchor_price-self.low)
                vol_ok = (not c.require_vol or (math.isfinite(r.rvx) and math.isfinite(self.anchor_vol)
                          and r.rvx <= self.peak-c.recover_vol*(self.peak-self.anchor_vol)))
                self.fast_good=self.fast_good+1 if price_ok and vol_ok else 0
                if self.fast_good>=c.fast_confirm:
                    self.fast=False; reasons.append('fast_recovery')
        target_a = self.slow==0 and not self.fast
        target_b = self.slow<2
        return {'old_state':old,'new_state':self.state(),'reason':'+'.join(reasons) or 'retain',
                'a':target_a,'b':target_b,'anchor_price':self.anchor_price,'anchor_vol':self.anchor_vol,
                'running_low':self.low,'running_peak':self.peak,'below200':self.below,
                'above50':self.above50,'above200':self.above200,'fast_good':self.fast_good}


def simulate(df, cfg=Config(), start=None, end=None, initial_capital=100000., schedule=None):
    d=df.loc[start:end].copy()
    if len(d)<2: raise ValueError('Need at least two sessions')
    if 'split' in d and (d.split!=1).any(): raise ValueError('100-share policy cannot cross a split without an explicit sleeve resizing policy')
    controller=Controller(cfg)
    cash=initial_capital; holdings={'core':0,'A':0,'B':0}
    sale_receivables=[]; dividend_receivables=[]
    dividends_total=costs=interest_total=0.
    pending=None; trades=[]; states=[]; daily=[]
    prior_date=None
    last_sleeve_trade={}; whipsaws=0; denies=0
    initial_shares=0
    for i,r in enumerate(d.itertuples()):
        date=r.Index
        cash+=sum(v for due,v in sale_receivables if due<=i)
        sale_receivables=[(due,v) for due,v in sale_receivables if due>i]
        cash+=sum(v for due,v in dividend_receivables if due<=i)
        dividend_receivables=[(due,v) for due,v in dividend_receivables if due>i]
        if prior_date is not None:
            interest=cash*((1+cfg.cash_yield)**((date-prior_date).days/365.25)-1)
            cash+=interest; interest_total+=interest
        prior_date=date
        # Ex-date entitlement belongs to holdings carried through the preceding close.
        entitlement=sum(holdings.values())*r.dividend
        if entitlement:
            dividends_total+=entitlement
            if cfg.dividend_delay==0: cash+=entitlement
            else: dividend_receivables.append((i+cfg.dividend_delay,entitlement))
        signal=pending
        if i==0:
            desired=(math.floor(cash/(r.open*(1+cfg.slippage)+cfg.fee_share)) if cfg.mode=='buyhold' else 300)
            if desired*(r.open*(1+cfg.slippage)+cfg.fee_share)>cash+1e-8:
                raise ValueError('Initial whole300 allocation not affordable')
            requests=[('core',desired)] if cfg.mode=='buyhold' else [('core',100),('A',100),('B',100)]
            signal={'old_state':'UNINITIALIZED','new_state':'S0:F0','reason':'initial_allocation','signal_date':None}
        elif cfg.mode in ('buyhold','hold300'):
            requests=[]
        else:
            requests=[]
            if signal:
                for sleeve,key in [('A','a'),('B','b')]:
                    if holdings[sleeve] and not signal[key]: requests.append((sleeve,-100))
                buys=[(s,100) for s,k in [('B','b'),('A','a')] if not holdings[s] and signal[k]] if signal else []
                if cfg.recovery2_one and len(buys)>1: buys=buys[:1]
                requests+=buys
        for sleeve,quantity in requests:
            before_cash=cash; before_shares=sum(holdings.values())
            price=r.open*(1+cfg.slippage*(1 if quantity>0 else -1))
            commission=abs(quantity)*cfg.fee_share
            action='BUY' if quantity>0 else 'SELL'
            if quantity>0 and quantity*price+commission>cash+1e-8:
                action='DENIED_CASH'; denies+=1
            else:
                holdings[sleeve]+=quantity
                if quantity>0: cash-=quantity*price+commission
                else:
                    lag=1 if date>=pd.Timestamp('2024-05-28') else 2
                    sale_receivables.append((i+lag,-quantity*price-commission))
                costs+=commission+abs(quantity)*abs(price-r.open)
                if i>0:
                    last=last_sleeve_trade.get(sleeve)
                    if last and last[1]!=action and i-last[0]<=20: whipsaws+=1
                    last_sleeve_trade[sleeve]=(i,action)
            total_shares=sum(holdings.values())
            unsettled=sum(v for _,v in sale_receivables)
            dividend_due=sum(v for _,v in dividend_receivables)
            log={'date':date,'signal_date':signal['signal_date'],'previous_state':signal['old_state'],
                 'new_state':signal['new_state'],'trigger':signal['reason'],'sleeve':sleeve,'action':action,
                 'execution_price':price,'shares_traded':quantity if action!='DENIED_CASH' else 0,
                 'cash_before':before_cash,'cash_after':cash,'shares_before':before_shares,'shares_after':total_shares,
                 'settlement_receivable':unsettled,'dividend_receivable':dividend_due,
                 'portfolio_value_at_open':cash+unsettled+dividend_due+total_shares*r.open,
                 'commission':commission if action!='DENIED_CASH' else 0,'signal_drawdown':signal.get('drawdown'),
                 'signal_price5':signal.get('price5'),'signal_rvx5':signal.get('rvx5'),
                 'signal_sma50':signal.get('sma50'),'signal_sma200':signal.get('sma200'),
                 'signal_close':signal.get('close'),'signal_rvx':signal.get('rvx'),
                 'actual_before':f'{before_shares}shares','actual_after':f'{total_shares}shares'}
            trades.append(log)
        if i==0: initial_shares=sum(holdings.values())
        assert cash>=-1e-7, 'Margin borrowing'
        assert holdings['core']==(initial_shares if cfg.mode=='buyhold' else 100), 'Core changed'
        assert cfg.mode=='buyhold' or all(holdings[s] in(0,100) for s in('A','B'))
        assert all(v>=0 for v in holdings.values())
        unsettled=sum(v for _,v in sale_receivables); dividend_due=sum(v for _,v in dividend_receivables)
        nav=cash+unsettled+dividend_due+sum(holdings.values())*r.close
        if schedule and controller.slow==0 and not controller.fast:
            controller.c=schedule.get(date.year,controller.c)
        pending=controller.step(i,r)
        pending.update(signal_date=date,drawdown=r.drawdown,price5=r.price5,rvx5=r.rvx5,
                       sma50=r.sma50,sma200=r.sma200,close=r.signal_close,rvx=r.rvx)
        states.append({'date':date,**pending,'actual_A':holdings['A'],'actual_B':holdings['B']})
        daily.append({'date':date,'nav':nav,'cash':cash,'unsettled_cash':unsettled,'dividend_receivable':dividend_due,
                      'shares':sum(holdings.values()),'core':holdings['core'],'A':holdings['A'],'B':holdings['B'],
                      'exposure':sum(holdings.values())*r.close/nav,'slow':controller.slow,'fast':int(controller.fast),
                      'costs':costs,'dividends':dividends_total,'interest':interest_total,'whipsaws':whipsaws,'denials':denies})
    return pd.DataFrame(daily).set_index('date'),pd.DataFrame(trades),pd.DataFrame(states).set_index('date')


def metrics(daily,trades,benchmark=None,initial=100000.,slice_start=None,slice_end=None):
    d=daily.loc[slice_start:slice_end]
    if len(d)<2: return {}
    # Include initial open-to-close return and costs for full runs, preceding NAV for windows.
    startpos=daily.index.get_loc(d.index[0])
    base=initial if startpos==0 else daily.iloc[startpos-1].nav
    values=np.r_[base,d.nav.to_numpy()]
    returns=values[1:]/values[:-1]-1
    years=max((d.index[-1]-d.index[0]).days/365.25,len(d)/252 if len(d)<2 else 1/365.25)
    total=values[-1]/base-1
    cagr=(1+total)**(1/years)-1
    dd=values/np.maximum.accumulate(values)-1
    std=np.std(returns,ddof=1)
    downside=np.sqrt(np.mean(np.minimum(returns,0)**2))
    maxdd=float(dd.min())
    under=d.shares.to_numpy()<300
    runs=[]; count=0
    for v in under:
        if v: count+=1
        elif count: runs.append(count); count=0
    if count:runs.append(count)
    subset=trades[(trades.date>=d.index[0]) & (trades.date<=d.index[-1])] if len(trades) else trades
    tactical=subset[subset.sleeve.isin(['A','B']) & (subset.trigger!='initial_allocation')] if len(subset) else subset
    before=daily.iloc[startpos-1] if startpos else None
    m={'cagr':cagr,'max_drawdown':maxdd,'annual_volatility':std*np.sqrt(252),
       'sharpe':np.mean(returns)/std*np.sqrt(252) if std else np.nan,
       'sortino':np.mean(returns)/downside*np.sqrt(252) if downside else np.nan,
       'calmar':cagr/abs(maxdd) if maxdd else np.nan,'total_return':total,
       'tactical_exits':int((tactical.action=='SELL').sum()) if len(tactical) else 0,
       'tactical_reentries':int((tactical.action=='BUY').sum()) if len(tactical) else 0,
       'whipsaw_count':int(d.whipsaws.iloc[-1]-(before.whipsaws if before is not None else 0)),
       'underinvested_fraction':float(under.mean()),'mean_underinvested_spell_sessions':float(np.mean(runs)) if runs else 0,
       'longest_underinvested_sessions':max(runs,default=0),'ending_shares':int(d.shares.iloc[-1]),
       'ending_cash':d.cash.iloc[-1],'ending_unsettled_cash':d.unsettled_cash.iloc[-1],
       'ending_dividend_receivable':d.dividend_receivable.iloc[-1],'ending_value':values[-1],
       'transaction_costs':d.costs.iloc[-1]-(before.costs if before is not None else 0),
       'worst_daily_loss':float(returns.min()),'mean_equity_allocation':float(d.exposure.mean()),
       'cash_denials':int(d.denials.iloc[-1]-(before.denials if before is not None else 0))}
    monthly=pd.Series(returns,index=d.index).groupby(d.index.to_period('M')).apply(lambda x:np.prod(1+x)-1)
    m['worst_monthly_loss']=float(monthly.min())
    m['whipsaw_frequency']=m['whipsaw_count']/max(1,m['tactical_exits']+m['tactical_reentries'])
    if benchmark is not None:
        b=benchmark.reindex(d.index)
        bstart=initial if startpos==0 else benchmark.loc[daily.index[startpos-1],'nav']
        br=np.r_[bstart,b.nav.to_numpy()]; br=br[1:]/br[:-1]-1
        for label,mask in [('upside_capture',br>0),('downside_capture',br<0)]:
            n=mask.sum()
            if n:
                a=np.expm1(np.log1p(returns[mask]).mean()*252)
                bb=np.expm1(np.log1p(br[mask]).mean()*252)
                m[label]=a/bb if abs(bb)>1e-10 else np.nan
                m['arithmetic_'+label]=float(np.mean(returns[mask])/np.mean(br[mask]))
            else:m[label]=np.nan
        benchmark_monthly=pd.Series(br,index=d.index).groupby(d.index.to_period('M')).apply(lambda x:np.prod(1+x)-1)
        for label,mask in [('monthly_upside_capture',benchmark_monthly>0),('monthly_downside_capture',benchmark_monthly<0)]:
            if mask.any():
                ma=np.expm1(np.log1p(monthly[mask]).mean()*12)
                mb=np.expm1(np.log1p(benchmark_monthly[mask]).mean()*12)
                m[label]=ma/mb if abs(mb)>1e-10 else np.nan
            else: m[label]=np.nan
        bt=b.nav.iloc[-1]/bstart-1
        m['total_return_participation']=total/bt if abs(bt)>1e-10 else np.nan
    return m
