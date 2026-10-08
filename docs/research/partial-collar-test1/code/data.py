"""Frozen raw downloads, explicit source normalization and fail-closed validation."""
from pathlib import Path
import argparse
import datetime as dt
import hashlib
import json
import urllib.request
import subprocess
import numpy as np
import pandas as pd
import exchange_calendars as xc

ROOT = Path(__file__).resolve().parents[1]
CUTOFF = '2026-10-07'
URLS = {
 'iwm.json': 'https://query1.finance.yahoo.com/v8/finance/chart/IWM?period1=946684800&period2=1791417600&interval=1d&events=div%2Csplits',
 'rvx_fred.csv': 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=RVXCLS',
 'rvx_cboe.csv': 'https://cdn.cboe.com/api/global/us_indices/daily_prices/RVX_History.csv',
}

def download(refresh=False):
    manifest = {}
    for name, url in URLS.items():
        p = ROOT/'data/raw'/name
        if refresh or not p.exists():
            req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'} if 'yahoo' in url else {})
            try:
                with urllib.request.urlopen(req, timeout=15) as r:
                    p.write_bytes(r.read())
            except (TimeoutError, OSError):
                subprocess.run(['curl','--fail','--silent','--show-error','--location','--max-time','30',url,'--output',str(p)],check=True)
        manifest[name] = {'url': url, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes':p.stat().st_size}
    previous = ROOT/'data/raw/manifest.json'
    if previous.exists() and not refresh:
        old = json.loads(previous.read_text())
        for k in manifest:
            if old['files'][k]['sha256'] != manifest[k]['sha256']:
                raise ValueError('Raw hash changed: '+k)
        return old
    result = {'retrieved_utc':dt.datetime.now(dt.timezone.utc).isoformat(), 'cutoff':CUTOFF, 'files':manifest,
              'theta_status':'Main benchmark data uses longer fallback history. Theta terminal later authenticated with user-local creds file; see theta_availability.json and theta_comparison.json.'}
    previous.write_text(json.dumps(result,indent=2)+'\n')
    return result


def session_index(start, end):
    c = xc.get_calendar('XNYS', start=start, end=end)
    sessions = c.sessions_in_range(start,end)
    if sessions.tz is not None:
        sessions = sessions.tz_localize(None)
    # exchange_calendars4.5 predates Carter's national day of mourning.
    return sessions[sessions != pd.Timestamp('2025-01-09')]


def indicators(df):
    d = df.copy()
    if 'split' not in d: d['split']=1.0
    previous = d.close.shift(1)
    div_factor = 1/(1-d.dividend.div(previous/d.split).fillna(0))
    if (div_factor <= 0).any():
        raise ValueError('Invalid corporate action adjustment')
    factor = (div_factor*d.split).cumprod()
    for k in ['open','high','low','close']:
        d['signal_'+k] = d[k]*factor
    d['sma50'] = d.signal_close.rolling(50,min_periods=50).mean()
    d['sma200'] = d.signal_close.rolling(200,min_periods=200).mean()
    d['high252'] = d.signal_high.rolling(252,min_periods=252).max()
    d['drawdown'] = d.signal_close/d.high252-1
    d['price5'] = d.signal_close/d.signal_close.shift(5)-1
    d['rvx5'] = d.rvx/d.rvx.shift(5)-1
    d['price_anchor'] = d.signal_close.shift(5)
    d['vol_anchor'] = d.rvx.shift(5)
    return d


def normalize():
    raw = ROOT/'data/raw'
    result = json.loads((raw/'iwm.json').read_text())['chart']['result'][0]
    timestamps = pd.to_datetime(result['timestamp'],unit='s',utc=True)
    dates = timestamps.tz_convert('America/New_York').tz_localize(None).normalize()
    d = pd.DataFrame(result['indicators']['quote'][0], index=dates)
    d['adj_close'] = result['indicators']['adjclose'][0]['adjclose']
    d['dividend'] = 0.0
    splits = result.get('events',{}).get('splits',{})
    d['split']=1.0
    # Yahoo OHLC and dividends are already split-adjusted. Undo only future splits.
    for e in splits.values():
        date=pd.Timestamp(e['date'],unit='s',tz='UTC').tz_convert('America/New_York').tz_localize(None).normalize()
        ratio=e['numerator']/e['denominator']
        d.loc[date,'split']=ratio
        for k in ['open','high','low','close']:
            d.loc[d.index<date,k]*=ratio
    for e in result.get('events',{}).get('dividends',{}).values():
        date = pd.Timestamp(e['date'],unit='s',tz='UTC').tz_convert('America/New_York').tz_localize(None).normalize()
        if date in d.index:
            future_ratio=d.loc[d.index>date,'split'].prod()
            d.loc[date,'dividend'] += e['amount']*future_ratio
    d = d.loc[:CUTOFF].sort_index()
    if d.index.has_duplicates:
        raise ValueError('Duplicate IWM sessions')
    if d[['open','high','low','close','adj_close']].isna().any().any():
        raise ValueError('Missing IWM prices; no interpolation')
    if (d[['open','high','low','close','adj_close']]<=0).any().any():
        raise ValueError('Nonpositive IWM prices')
    if ((d.high < d[['open','close','low']].max(axis=1)-0.0001) | (d.low > d[['open','close','high']].min(axis=1)+0.0001)).any():
        raise ValueError('Invalid OHLC bounds')
    expected = session_index(d.index.min(), d.index.max())
    missing = expected.difference(d.index)
    extra = d.index.difference(expected)
    if len(missing) or len(extra):
        raise ValueError(f'IWM calendar missing={list(missing)} extra={list(extra)}')
    fred = pd.read_csv(raw/'rvx_fred.csv',parse_dates=['observation_date'],na_values=['.']).set_index('observation_date')['RVXCLS']
    cboe = pd.read_csv(raw/'rvx_cboe.csv',parse_dates=['DATE']).set_index('DATE')['CLOSE']
    if fred.index.has_duplicates or cboe.index.has_duplicates:
        raise ValueError('Duplicate RVX dates')
    rvx = fred.combine_first(cboe)
    d['rvx'] = rvx.reindex(d.index)
    d['rvx_missing'] = d.rvx.isna()
    if (d.rvx.dropna()<=0).any():
        raise ValueError('Invalid RVX')
    factor = d.adj_close/d.close
    for k in ['open','high','low','close']:
        d['adjusted_'+k] = d[k]*factor
    d.index.name='date'
    d.to_csv(ROOT/'data/normalized/iwm_rvx.csv',float_format='%.10g')
    enriched = indicators(d)
    # Compare dividend-only changes in vendor adjustment factors with causal factors.
    expected_ratio = d.split/(1-d.dividend/(d.close.shift(1)/d.split))
    ratio_error = (factor/factor.shift(1)-expected_ratio).abs().dropna()
    overlap = pd.concat([fred.rename('fred'),cboe.rename('cboe')],axis=1).dropna().loc[:CUTOFF]
    discrepancy = (overlap.fred-overlap.cboe).abs()
    valid_start = enriched.index[(enriched.high252.notna()) & enriched.rvx.notna() & enriched.vol_anchor.notna() & (enriched.index>pd.Timestamp('2005-06-09'))][0]
    audit = {
      'iwm_start':str(d.index.min().date()), 'iwm_end':str(d.index.max().date()),'iwm_sessions':len(d),
      'rvx_start':str(rvx.dropna().index.min().date()),'simulation_start':str(valid_start.date()),
      'missing_iwm_sessions':len(missing),'off_calendar_iwm':len(extra),
      'missing_rvx_after_simulation_start':int(d.loc[valid_start:,'rvx_missing'].sum()),
      'missing_rvx_dates':[str(x.date()) for x in d.loc[valid_start:].index[d.loc[valid_start:,'rvx_missing']]],
      'dividend_events':int((d.dividend>0).sum()),'split_events':len(splits),
      'max_adjustment_ratio_error':float(ratio_error.max()),
      'rvx_cboe_fred_overlap':len(overlap),'rvx_max_source_disagreement':float(discrepancy.max()),
      'rvx_disagree_gt_0_02':int((discrepancy>0.02).sum()),
      'timestamp_zone':result['meta'].get('exchangeTimezoneName'),
      'calendar':'XNYS exchange_calendars4.5.6 with explicit Carter closure2025-01-09',
      'normalized_sha256':hashlib.sha256((ROOT/'data/normalized/iwm_rvx.csv').read_bytes()).hexdigest(),
    }
    if audit['max_adjustment_ratio_error'] > 0.0001:
        raise ValueError('Unexplained adjustment factor changes')
    (ROOT/'data/validation.json').write_text(json.dumps(audit,indent=2)+'\n')
    return audit


def load():
    d = pd.read_csv(ROOT/'data/normalized/iwm_rvx.csv',parse_dates=['date']).set_index('date')
    return indicators(d)

if __name__=='__main__':
    a=argparse.ArgumentParser(); a.add_argument('--refresh',action='store_true'); args=a.parse_args()
    download(args.refresh)
    print(json.dumps(normalize(),indent=2))
