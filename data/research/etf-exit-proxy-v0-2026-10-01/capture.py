#!/usr/bin/env python3
"""Bounded ETF four-leg quote probe. Tradier GET only; raw responses retained."""
import csv, datetime as dt, gzip, hashlib, json, math, os, re, tarfile, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path
P=Path(__file__).resolve().parent
REPO=P.parents[2]
COHORT=REPO/'data/research/pass-minus-one-etf-view-2026-10-01/cboe-etf-underlyings.csv'
ARCHIVE=REPO/'data/research/pass-minus-one-v0-2026-09-30/evidence.tar.gz'
ASOF=dt.date(2026,10,1)
MANIFEST=P/'capture-manifest.jsonl'
RAW=P/'raw';RAW.mkdir(exist_ok=True)
assert hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()=='1a43983917a7e2b2f96f291afe2c8a7859042e5ec12b9a3ad6630374d8694e25'
secrets={}
for line in Path(os.environ.get('WW_TRADIER_ENV_PATH',str(REPO/'.env'))).read_text().splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  k,v=line.split('=',1);secrets[k.strip()]=v.strip()
TOKEN=secrets['TRADIER_API_KEY'];BASE=secrets.get('TRADIER_BASE_URL','https://api.tradier.com/v1')
assert BASE=='https://api.tradier.com/v1'
cohort=list(csv.DictReader(COHORT.open()));assert len(cohort)==1643
symbols=sorted(r['occ_underlying'] for r in cohort)
last_start=0.0
attempt=0

def iso():return dt.datetime.now(dt.timezone.utc).isoformat()
def get_quotes(names,kind):
 global last_start,attempt
 assert 1<=len(names)<=40
 query=urllib.parse.urlencode({'symbols':','.join(names),'greeks':'false'})
 path='/markets/quotes?'+query
 for trial in range(3):
  wait=max(0,.55-(time.monotonic()-last_start))
  if wait:time.sleep(wait)
  last_start=time.monotonic();attempt+=1;started=iso()
  req=urllib.request.Request(BASE+path,headers={'Authorization':'Bearer '+TOKEN,'Accept':'application/json','User-Agent':'WW-ETF-exit-proxy-v0'})
  status=None;headers={};body=b'';error=None
  try:
   with urllib.request.urlopen(req,timeout=20) as response:
    status=response.status;headers=dict(response.headers);body=response.read()
  except urllib.error.HTTPError as e:
   status=e.code;headers=dict(e.headers);body=e.read();error='HTTP_'+str(e.code)
  except Exception as e:error=type(e).__name__
  received=iso();digest=hashlib.sha256(body).hexdigest();f=RAW/f'{attempt:05d}.json';f.write_bytes(body)
  rec={'attempt':attempt,'kind':kind,'symbols':names,'path':path,'started_at_utc':started,'received_at_utc':received,'status':status,'headers':{k:v for k,v in headers.items() if k.lower().startswith(('date','x-ratelimit','retry-after','content-type'))},'error':error,'raw_path':str(f.relative_to(P)),'sha256':digest,'bytes':len(body)}
  with MANIFEST.open('a') as out:out.write(json.dumps(rec)+'\n')
  if status==200:
   try:return json.loads(body),rec
   except json.JSONDecodeError:error='MALFORMED_JSON'
  if status==429:
   try:delay=float(headers.get('Retry-After',60))
   except ValueError:delay=60
   time.sleep(min(max(delay,1),120))
  elif status in (500,502,503,504) or status is None or error=='MALFORMED_JSON':time.sleep(2 if trial==0 else 8)
  else:break
 return None,rec

def quote_map(body):
 q=(body or {}).get('quotes',{}).get('quote')
 if not q:return {}
 if isinstance(q,dict):q=[q]
 return {x.get('symbol'):x for x in q if isinstance(x,dict) and x.get('symbol')}

# One underlying quote per name, batched. The bulk response is shared only for spot selection.
spots={};underlying_request={}
for i in range(0,len(symbols),40):
 block=symbols[i:i+40];body,rec=get_quotes(block,'underlying')
 q=quote_map(body)
 for s in block:
  spots[s]=q.get(s);underlying_request[s]=rec['attempt']
 if i%400==0:print('underlyings',min(i+40,len(symbols)),'/',len(symbols),flush=True)
(P/'underlying-quotes.json').write_text(json.dumps({'quotes':spots,'request_ids':underlying_request},separators=(',',':')))

# Frozen same-day Pass -1 listing strings determine two fixed observation expirations and strike probes.
probes=[]
with tarfile.open(ARCHIVE,'r:gz') as archive:
 under={r['occ_underlying_symbol']:r for r in map(json.loads,archive.extractfile('analysis/underlyings.jsonl').read().splitlines())}
 for s in symbols:
  q=spots[s];price=None
  if q:
   for field in ('last','close'):
    v=q.get(field)
    if isinstance(v,(int,float)) and v>0 and math.isfinite(v):price=float(v);break
  row={'symbol':s,'spot':price,'spot_request_id':underlying_request[s],'probes':[],'reason':None}
  if price is None:row['reason']='NO_UNDERLYING_PRICE';probes.append(row);continue
  provider=under[s]
  raw=gzip.decompress(archive.extractfile('full/'+provider['raw_gzip']).read())
  assert hashlib.sha256(raw).hexdigest()==provider['raw_sha256']
  groups={g['rootSymbol']:g['options'] for g in (json.loads(raw).get('symbols') or [])}
  opts=groups.get(s)
  if not opts:row['reason']='EXACT_ROOT_ABSENT';probes.append(row);continue
  bydate={}
  for opt in opts:
   suffix=opt[len(s):]
   if not re.fullmatch(r'\d{6}[CP]\d{8}',suffix):continue
   date=dt.date(2000+int(suffix[:2]),int(suffix[2:4]),int(suffix[4:6]));dte=(date-ASOF).days
   if not 21<=dte<=100:continue
   right=suffix[6];strike=int(suffix[7:])/1000
   bydate.setdefault(date,{'P':{},'C':{}})[right][strike]=opt
  available=sorted(bydate)
  selected=[]
  for target in (45,75):
   candidates=[d for d in available if d not in selected]
   if candidates:selected.append(min(candidates,key=lambda d:(abs((d-ASOF).days-target),d)))
  for date in selected:
   parts=bydate[date];legs={};targets={'short_put':('P',.95*price),'long_put':('P',.90*price),'short_call':('C',1.05*price),'long_call':('C',1.10*price)}
   for name,(right,target) in targets.items():
    if name=='long_put':eligible=[k for k in parts[right] if k<legs['short_put']['strike']]
    elif name=='long_call':eligible=[k for k in parts[right] if k>legs['short_call']['strike']]
    else:eligible=[k for k in parts[right] if (k<price if right=='P' else k>price)]
    if eligible:
     strike=min(eligible,key=lambda k:(abs(k-target),k));legs[name]={'symbol':parts[right][strike],'strike':strike,'target':target}
   valid=len(legs)==4 and legs['long_put']['strike']<legs['short_put']['strike']<price<legs['short_call']['strike']<legs['long_call']['strike']
   row['probes'].append({'expiration':date.isoformat(),'dte':(date-ASOF).days,'legs':legs if valid else {},'geometry_valid':valid,'quote_request_id':None})
  if not row['probes']:row['reason']='NO_21_TO_100_DTE_EXPIRATION'
  probes.append(row)
(P/'probe-plan.json').write_text(json.dumps({'as_of':ASOF.isoformat(),'price_field_preference':['last','close'],'expiration_targets_dte':[45,75],'expiration_window_dte':[21,100],'strike_targets_price_ratio':{'short_put':.95,'long_put':.90,'short_call':1.05,'long_call':1.10},'rows':probes},separators=(',',':')))
print('planned',sum(len(r['probes']) for r in probes),'probes,',sum(p['geometry_valid'] for r in probes for p in r['probes']),'valid geometry',flush=True)

# Keep every complete four-leg probe in a single bulk response. Pack up to ten probes/request.
items=[(r,p) for r in probes for p in r['probes'] if p['geometry_valid']]
quoted={}
for i in range(0,len(items),10):
 block=items[i:i+10];names=[p['legs'][leg]['symbol'] for _,p in block for leg in ('short_put','long_put','short_call','long_call')]
 body,rec=get_quotes(names,'option_legs')
 for r,p in block:p['quote_request_id']=rec['attempt']
 quoted.update(quote_map(body))
 if i%400==0:print('option probes',min(i+10,len(items)),'/',len(items),flush=True)
(P/'probe-plan.json').write_text(json.dumps({'as_of':ASOF.isoformat(),'price_field_preference':['last','close'],'expiration_targets_dte':[45,75],'expiration_window_dte':[21,100],'strike_targets_price_ratio':{'short_put':.95,'long_put':.90,'short_call':1.05,'long_call':1.10},'rows':probes},separators=(',',':')))
print('done',attempt,'requests',len(quoted),'unique option quotes',flush=True)
