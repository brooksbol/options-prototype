"""Independent vectorized transaction/settlement replay for every persisted run."""
import json
import numpy as np
import pandas as pd
from data import ROOT,load


def audit():
    market=load();rows=[]
    for file in sorted((ROOT/'results/logs').glob('*_daily.csv.gz')):
        prefix=file.name.removesuffix('_daily.csv.gz')
        daily=pd.read_csv(file,parse_dates=['date']).set_index('date')
        t=pd.read_csv(file.with_name(prefix+'_trades.csv.gz'),parse_dates=['date','signal_date'])
        n=len(daily);flow=np.zeros(n);sale_created=np.zeros(n);sale_paid=np.zeros(n)
        changes=np.zeros((n,3));sleeves={'core':0,'A':1,'B':2}
        y=.02 if 'cash_yield2' in prefix else .04 if 'cash_yield4' in prefix else 0
        delay=0 if 'dividend_delay0' in prefix else 14 if 'dividend_delay14' in prefix else 7
        for trade in t.itertuples():
            i=daily.index.get_loc(trade.date)
            if trade.trigger!='initial_allocation':
                assert trade.shares_traded in [-100,0,100]
                assert trade.signal_date<trade.date
                assert market.index[market.index.get_loc(trade.signal_date)+1]==trade.date
                assert trade.sleeve!='core'
            q=trade.shares_traded
            if trade.action=='DENIED_CASH':assert q==0;continue
            changes[i,sleeves[trade.sleeve]]+=q
            amount=q*trade.execution_price+trade.commission
            if q>0:flow[i]-=amount
            else:
                sale_created[i]+=-amount
                lag=1 if trade.date>=pd.Timestamp('2024-05-28') else 2
                if i+lag<n:sale_paid[i+lag]+=-amount
        positions=changes.cumsum(axis=0);shares=positions.sum(axis=1)
        prior_shares=np.r_[0,shares[:-1]]
        ex_div=prior_shares*market.reindex(daily.index).dividend.to_numpy()
        div_paid=np.zeros(n)
        if delay==0:div_paid=ex_div.copy()
        elif delay<n:div_paid[delay:]=ex_div[:-delay]
        credit=sale_paid+div_paid
        if y:
            days=daily.index.to_series().diff().dt.days.fillna(0).to_numpy()
            cash_values=[];cash=100000.
            for i in range(n):
                cash=(cash+credit[i])*(1+y)**(days[i]/365.25)+flow[i]
                cash_values.append(cash)
            cash_values=np.array(cash_values)
        else:cash_values=100000.+np.cumsum(credit+flow)
        sale_due=np.cumsum(sale_created-sale_paid)
        div_due=np.cumsum(ex_div-div_paid)
        expected=cash_values+sale_due+div_due+shares*market.reindex(daily.index).close.to_numpy()
        errors=abs(expected-daily.nav.to_numpy())
        assert errors.max()<.03,(prefix,float(errors.max()))
        assert abs(cash_values-daily.cash.to_numpy()).max()<.03
        np.testing.assert_array_equal(shares,daily.shares.to_numpy())
        np.testing.assert_array_equal(positions[:,0],daily.core.to_numpy())
        assert cash_values.min()>=-.01
        # Replay each same-open sequence separately to verify logged before/after cash.
        before=cash_values-flow
        running={}
        for trade in t.itertuples():
            i=daily.index.get_loc(trade.date);cash=running.get(i,before[i])
            assert abs(cash-trade.cash_before)<.03
            if trade.action=='BUY':cash-=trade.shares_traded*trade.execution_price+trade.commission
            assert abs(cash-trade.cash_after)<.03
            running[i]=cash
        rows.append({'run':prefix,'sessions':n,'transactions':len(t),'max_nav_rounding_error':float(errors.max())})
    result=pd.DataFrame(rows);result.to_csv(ROOT/'results/accounting_audit.csv',index=False)
    report={'runs':len(result),'sessions':int(result.sessions.sum()),'transactions':int(result.transactions.sum()),
            'max_nav_rounding_error':float(result.max_nav_rounding_error.max()),'status':'PASS'}
    (ROOT/'results/accounting_audit.json').write_text(json.dumps(report,indent=2)+'\n');print(report)

if __name__=='__main__':audit()
