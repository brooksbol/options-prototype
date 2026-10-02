#!/usr/bin/env python3
"""One-time completion of probes initially misclassified by independent wing selection."""
import datetime as dt,gzip,hashlib,json,os,re,tarfile,time,urllib.error,urllib.parse,urllib.request
from pathlib import Path
P=Path(__file__).resolve().parent;REPO=P.parents[2]
ARCHIVE=REPO/'data/research/pass-minus-one-v0-2026-09-30/evidence.tar.gz'
plan=json.loads((P/'probe-plan.json').read_text());manifest=P/'capture-manifest.jsonl';rawdir=P/'raw'
records=[json.loads(x) for x in manifest.read_text().splitlines()];attempt=max(x['attempt'] for x in records)
secrets={}
for line in Path(os.environ.get('WW_TRADIER_ENV_PATH',str(REPO/'.env'))).read_text().splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  k,v=line.split('=',1);secrets[k.strip()]=v.strip()
token=secrets['TRADIER_API_KEY'];base=secrets.get('TRADIER_BASE_URL');assert base=='https://api.tradier.com/v1'
items=[]
with tarfile.open(ARCHIVE,'r:gz') as a:
 under={r['occ_underlying_symbol']:r for r in map(json.loads,a.extractfile('analysis/underlyings.jsonl').read().splitlines())}
 for row in plan['rows']:
  if not any(not p['geometry_valid'] for p in row['probes']):continue
  s=row['symbol'];spot=row['spot'];provider=under[s]
  body=gzip.decompress(a.extractfile('full/'+provider['raw_gzip']).read());assert hashlib.sha256(body).hexdigest()==provider['raw_sha256']
  groups={g['rootSymbol']:g['options'] for g in (json.loads(body).get('symbols') or [])};opts=groups.get(s,[])
  bydate={}
  for opt in opts:
   suffix=opt[len(s):]
   if not re.fullmatch(r'\d{6}[CP]\d{8}',suffix):continue
   date=dt.date(2000+int(suffix[:2]),int(suffix[2:4]),int(suffix[4:6])).isoformat();right=suffix[6];strike=int(suffix[7:])/1000
   bydate.setdefault(date,{'P':{},'C':{}})[right][strike]=opt
  for p in row['probes']:
   if p['geometry_valid']:continue
   parts=bydate.get(p['expiration'],{'P':{},'C':{}});legs={}
   targets=[('short_put','P',.95*spot),('long_put','P',.90*spot),('short_call','C',1.05*spot),('long_call','C',1.10*spot)]
   for name,right,target in targets:
    if name=='long_put':eligible=[k for k in parts[right] if k<legs['short_put']['strike']] if 'short_put' in legs else []
    elif name=='long_call':eligible=[k for k in parts[right] if k>legs['short_call']['strike']] if 'short_call' in legs else []
    else:eligible=[k for k in parts[right] if (k<spot if right=='P' else k>spot)]
    if eligible:
     strike=min(eligible,key=lambda k:(abs(k-target),k));legs[name]={'symbol':parts[right][strike],'strike':strike,'target':target}
   if len(legs)==4:
    p['geometry_valid']=True;p['legs']=legs;items.append((row,p))
print('newly valid',len(items),flush=True)
last=0.0
for i in range(0,len(items),10):
 block=items[i:i+10];names=[p['legs'][name]['symbol'] for _,p in block for name in ('short_put','long_put','short_call','long_call')]
 path='/markets/quotes?'+urllib.parse.urlencode({'symbols':','.join(names),'greeks':'false'})
 for trial in range(3):
  wait=max(0,.55-(time.monotonic()-last))
  if wait:time.sleep(wait)
  last=time.monotonic();attempt+=1;started=dt.datetime.now(dt.timezone.utc).isoformat();status=None;headers={};body=b'';error=None
  req=urllib.request.Request(base+path,headers={'Authorization':'Bearer '+token,'Accept':'application/json','User-Agent':'WW-ETF-exit-proxy-v0'})
  try:
   with urllib.request.urlopen(req,timeout=20) as response:status=response.status;headers=dict(response.headers);body=response.read()
  except urllib.error.HTTPError as e:status=e.code;headers=dict(e.headers);body=e.read();error='HTTP_'+str(e.code)
  except Exception as e:error=type(e).__name__
  received=dt.datetime.now(dt.timezone.utc).isoformat();name=f'raw/{attempt:05d}.json';(P/name).write_bytes(body)
  rec={'attempt':attempt,'kind':'option_legs_repair','symbols':names,'path':path,'started_at_utc':started,'received_at_utc':received,'status':status,'headers':{k:v for k,v in headers.items() if k.lower().startswith(('date','x-ratelimit','retry-after','content-type'))},'error':error,'raw_path':name,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)}
  with manifest.open('a') as f:f.write(json.dumps(rec)+'\n')
  if status==200:break
  if status==429:
   try:time.sleep(max(1,min(120,float(headers.get('Retry-After',60)))))
   except ValueError:time.sleep(60)
  elif status in (500,502,503,504) or status is None:time.sleep(2 if trial==0 else 8)
  else:break
 for row,p in block:p['quote_request_id']=attempt
(P/'probe-plan.json').write_text(json.dumps(plan,separators=(',',':')))
print('repair complete',attempt,flush=True)
