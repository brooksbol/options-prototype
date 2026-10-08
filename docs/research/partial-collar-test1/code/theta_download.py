"""Monthly EOD downloads within the empirically demonstrated Theta access window."""
import datetime as dt
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import pandas as pd
from data import ROOT,CUTOFF

def run():
    directory=ROOT/'data/raw/theta/history';directory.mkdir(parents=True,exist_ok=True)
    manifest={};all_rows={}
    for asset,symbol in [('stock','IWM'),('index','RVX')]:
        combined=[]
        for start in pd.date_range('2023-06-01',CUTOFF,freq='MS'):
            end=min(start+pd.offsets.MonthEnd(0),pd.Timestamp(CUTOFF))
            name=f'{symbol}_{start:%Y%m}.json';p=directory/name
            url='http://127.0.0.1:25503/v3/'+asset+'/history/eod?'+urllib.parse.urlencode(dict(symbol=symbol,start_date=f'{start:%Y%m%d}',end_date=f'{end:%Y%m%d}',format='json'))
            status=None
            status_path=p.with_suffix('.status.json')
            if status_path.exists():status=json.loads(status_path.read_text())['status']
            if not p.exists():
                try:
                    with urllib.request.urlopen(url,timeout=25) as response:payload=response.read();status=response.status
                except urllib.error.HTTPError as e:payload=e.read();status=e.code
                p.write_bytes(payload);status_path.write_text(json.dumps({'status':status}));time.sleep(2.1)
            else:payload=p.read_bytes()
            try:parsed=json.loads(payload)
            except ValueError:parsed={}
            rows=parsed.get('response',[])
            if not isinstance(rows,list):rows=[]
            combined+=rows
            manifest[name]={'url':url,'status':status,'rows':len(rows),'sha256':hashlib.sha256(payload).hexdigest()}
        frame=pd.DataFrame(combined)
        if len(frame):
            frame['date']=frame.created.str[:10]
            frame.to_csv(ROOT/f'data/normalized/theta_{symbol.lower()}_eod.csv',index=False)
        all_rows[symbol]=len(frame)
        print(symbol,len(frame),flush=True)
    (ROOT/'data/theta_history_manifest.json').write_text(json.dumps({'retrieved_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'coverage_request':['2023-06-01',CUTOFF],'files':manifest,'rows':all_rows},indent=2)+'\n')
    reference=pd.read_csv(ROOT/'data/normalized/iwm_rvx.csv').set_index('date')
    comparisons={}
    for symbol,column in [('iwm','close'),('rvx','rvx')]:
        path=ROOT/f'data/normalized/theta_{symbol}_eod.csv'
        if not path.exists():continue
        frame=pd.read_csv(path).set_index('date')
        if frame.index.has_duplicates:raise ValueError('Duplicate Theta session')
        matched=frame[['close']].join(reference[[column]].rename(columns={column:'reference'})).dropna()
        differences=(matched.close-matched.reference).abs()
        comparisons[symbol]={'matched_sessions':len(matched),'max_abs_close_difference':float(differences.max()),
                             'differences_gt_0_02':int((differences>.02).sum()),
                             'max_relative_difference':float((differences/matched.reference).max()),
                             'off_reference_dates':list(frame.index.difference(reference.index)),
                             'theta_first':str(frame.index.min()),'theta_last':str(frame.index.max())}
        matched.to_csv(ROOT/f'data/normalized/theta_{symbol}_comparison.csv')
    (ROOT/'data/theta_comparison.json').write_text(json.dumps(comparisons,indent=2)+'\n')

if __name__=='__main__':run()
