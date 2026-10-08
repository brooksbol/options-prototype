"""Read-only coverage probes of a user-authenticated local Theta Terminal.
No credential ingestion, output, process arguments, or remote credential transfer.
"""
import datetime as dt
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
from data import ROOT

BASE='http://127.0.0.1:25503/v3'
PROBES=[
 ('symbols','index/list/symbols',{}),
 ('iwm2004','stock/history/eod',dict(symbol='IWM',start_date='20040102',end_date='20040109')),
 ('iwm2008','stock/history/eod',dict(symbol='IWM',start_date='20080915',end_date='20080919')),
 ('iwm2020','stock/history/eod',dict(symbol='IWM',start_date='20200309',end_date='20200313')),
 ('iwm2023','stock/history/eod',dict(symbol='IWM',start_date='20230601',end_date='20230607')),
 ('iwm2026','stock/history/eod',dict(symbol='IWM',start_date='20260901',end_date='20260904')),
 ('rvx2020','index/history/eod',dict(symbol='RVX',start_date='20200309',end_date='20200313')),
 ('rvx2026','index/history/eod',dict(symbol='RVX',start_date='20260901',end_date='20260904')),
]

def run():
    directory=ROOT/'data/raw/theta';directory.mkdir(exist_ok=True)
    report={'checked_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'terminal':BASE,'probes':{}}
    for name,route,params in PROBES:
        url=BASE+'/'+route+'?'+urllib.parse.urlencode({**params,'format':'json'})
        try:
            with urllib.request.urlopen(url,timeout=20) as r:
                payload=r.read();status=r.status
        except urllib.error.HTTPError as e:
            payload=e.read();status=e.code
        except (OSError,TimeoutError) as e:
            report['probes'][name]={'url':url,'error_class':type(e).__name__};continue
        (directory/(name+'.json')).write_bytes(payload)
        record={'url':url,'http_status':status,'sha256':hashlib.sha256(payload).hexdigest(),'bytes':len(payload)}
        try:
            parsed=json.loads(payload);rows=parsed.get('response',parsed) if isinstance(parsed,dict) else parsed
            record['rows']=len(rows) if isinstance(rows,list) else 0
            if name=='symbols':
                syms={x['symbol'] for x in rows}
                record['RVX_listed']='RVX' in syms
                record['rvx_matches']=sorted(x for x in syms if 'RVX' in x)[:20]
            elif isinstance(rows,list) and rows:
                record['first_created']=rows[0].get('created')
                record['first_last_trade']=rows[0].get('last_trade')
        except (ValueError,KeyError,TypeError): pass
        report['probes'][name]=record
        print(name,status,record.get('rows'),flush=True)
        time.sleep(2.1)
    (ROOT/'data/theta_availability.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__=='__main__':run()
