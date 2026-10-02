#!/usr/bin/env python3
"""Bounded 2026-10-02 Tradier observation; same GET endpoint and raw-manifest pattern as PR #33."""
import csv,datetime as dt,gzip,hashlib,json,math,os,re,tarfile,time,urllib.parse,urllib.request,urllib.error
from pathlib import Path
P=Path(__file__).resolve().parent; ROOT=P.parents[2]; A=ROOT/'data/research/pass-minus-one-v0-2026-09-30/evidence.tar.gz'
OUT=P/'live-market-2026-10-02'; OUT.mkdir(exist_ok=True); RAW=OUT/'raw';RAW.mkdir(exist_ok=True)
assert hashlib.sha256(A.read_bytes()).hexdigest()=='1a43983917a7e2b2f96f291afe2c8a7859042e5ec12b9a3ad6630374d8694e25'
secrets={}
for line in Path(os.environ.get('WW_TRADIER_ENV_PATH',str(ROOT/'.env'))).read_text().splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  k,v=line.split('=',1);secrets[k.strip()]=v.strip().strip('"').strip("'")
TOKEN=secrets['TRADIER_API_KEY'];BASE=secrets.get('TRADIER_BASE_URL','https://api.tradier.com/v1');assert BASE=='https://api.tradier.com/v1'
ASOF=dt.date(2026,10,2); rows=list(csv.DictReader((P/'class-ledger.csv').open()))
# PR #33 reconciled all ordinary Cboe ETF roots except BLCN/TXS; see frozen existing-market-evidence-summary.json.
prior={r['underlying'] for r in rows if r['product_cohort']=='ETF_CBOE_CONFIRMED' and r['underlying']==r['occ_class'] and r['underlying'] not in ('BLCN','TXS')}
assert len(prior)==1641
unprobed=[r for r in rows if not(r['product_cohort']=='ETF_CBOE_CONFIRMED' and r['underlying'] in prior and r['occ_class']==r['underlying'])];assert len(unprobed)==632
attempt=0;last=0.;manifest=OUT/'capture-manifest.jsonl'
if manifest.exists():raise SystemExit('Capture manifest already exists; refusing to overwrite or append to a declared session')
def now():return dt.datetime.now(dt.timezone.utc).isoformat()
def quotes(body):
 q=((body or {}).get('quotes') or {}).get('quote')
 if isinstance(q,dict):q=[q]
 return {x.get('symbol'):x for x in (q or []) if isinstance(x,dict) and x.get('symbol')}
def get(names,kind):
 global attempt,last
 assert 1<=len(names)<=40
 path='/markets/quotes?'+urllib.parse.urlencode({'symbols':','.join(names),'greeks':'false'})
 for trial in range(3):
  wait=max(0,.55-(time.monotonic()-last))
  if wait:time.sleep(wait)
  last=time.monotonic();attempt+=1;start=now();status=None;headers={};body=b'';err=None
  req=urllib.request.Request(BASE+path,headers={'Authorization':'Bearer '+TOKEN,'Accept':'application/json','User-Agent':'WW-IronCondor-qualification-v1'})
  try:
   with urllib.request.urlopen(req,timeout=20) as resp:status=resp.status;headers=dict(resp.headers);body=resp.read()
  except urllib.error.HTTPError as e:status=e.code;headers=dict(e.headers);body=e.read();err='HTTP_'+str(e.code)
  except Exception as e:err=type(e).__name__
  received=now();raw=RAW/f'{attempt:05d}.json';raw.write_bytes(body)
  rec={'attempt':attempt,'kind':kind,'symbols':names,'path':path,'started_at_utc':start,'received_at_utc':received,'http_status':status,'error':err,'raw_path':str(raw.relative_to(OUT)),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'headers':{k:v for k,v in headers.items() if k.lower().startswith(('date','x-ratelimit','retry-after','content-type'))}}
  with manifest.open('a') as f:f.write(json.dumps(rec,separators=(',',':'))+'\n')
  if status==200:
   try:return json.loads(body),rec
   except json.JSONDecodeError:err='MALFORMED_JSON'
  if status==429:
   try:time.sleep(min(120,max(1,float(headers.get('Retry-After',60)))))
   except ValueError:time.sleep(60)
  elif status in (500,502,503,504) or status is None or err=='MALFORMED_JSON':time.sleep(2 if trial==0 else 8)
  else:break
 return None,rec
# Preserve the 40 identity failures, SMCF geometry miss, and unresolved ETF adjustment terms.
for r in unprobed:
 if r['cheap_geometry_state']=='IDENTITY_UNRESOLVED':r['result']='identity_unresolved';r['reason']='FROZEN_EXACT_ROOT_UNRESOLVED'
 elif r['cheap_geometry_state']!='LISTED_FOUR_LEG_SHAPE':r['result']='no_relevant_geometry';r['reason']='FROZEN_LISTED_FOUR_LEG_SHAPE_ABSENT'
 elif r['product_cohort'].startswith('ETF_') and r['occ_class']!=r['underlying']:r['result']='otherwise_unevaluable';r['reason']='ADJUSTED_CLASS_TERMS_UNVERIFIED'
 else:r['result']='pending';r['reason']=''
target=[r for r in unprobed if r['result']=='pending']
refs={};request={}
for i in range(0,len({r['underlying'] for r in target}),40):
 names=sorted({r['underlying'] for r in target})[i:i+40];body,rec=get(names,'reference');refs.update(quotes(body));request.update({s:rec['attempt'] for s in names})
 print('reference',min(i+40,len({r['underlying'] for r in target})),flush=True)
(OUT/'reference-quotes.json').write_text(json.dumps({'quotes':refs,'request_ids':request},separators=(',',':')))
with tarfile.open(A,'r:gz') as t:
 cr={(x['occ_underlying_symbol'],x['occ_option_class_symbol']):x for x in map(json.loads,t.extractfile('analysis/classes.jsonl').read().splitlines())}
 cache={};planned=[]
 for r in target:
  q=refs.get(r['underlying']);price=None;field=None
  if q:
   for f in ('last','close'):
    v=q.get(f)
    if isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v) and v>0:price=float(v);field=f;break
  r['reference_request_id']=request[r['underlying']];r['reference_price']=price;r['reference_field']=field;r['reference_quote']=q
  if price is None:r['result']='reference_price_unavailable';r['reason']='NO_POSITIVE_PROVIDER_LAST_OR_CLOSE';continue
  c=cr[(r['underlying'],r['occ_class'])];file=c['raw_gzip']
  if file not in cache:
   b=gzip.decompress(t.extractfile('full/'+file).read());assert hashlib.sha256(b).hexdigest()==c['raw_sha256'];cache[file]=json.loads(b)
  root=r['provider_root'];group=next((g for g in cache[file].get('symbols',[]) if g['rootSymbol']==root),None)
  by={}
  for sym in (group or {}).get('options',[]):
   m=re.fullmatch(re.escape(root)+r'(\d{6})([CP])(\d{8})',sym)
   if not m:continue
   d=dt.date(2000+int(m[1][:2]),int(m[1][2:4]),int(m[1][4:6]));dte=(d-ASOF).days
   if 21<=dte<=100:by.setdefault(d,{'P':{},'C':{}})[m[2]][int(m[3])/1000]=sym
  valid=[]
  for d,p in by.items():
   if len(p['P'])>=2 and len(p['C'])>=2 and min(p['P'])<max(p['C']):valid.append(d)
  chosen=[]
  for goal in (45,75):
   avail=[d for d in valid if d not in chosen]
   if avail:chosen.append(min(avail,key=lambda d:(abs((d-ASOF).days-goal),d)))
  if not chosen:r['result']='no_relevant_geometry';r['reason']='NO_21_TO_100_DTE_FOUR_LEG_EXPIRATION';continue
  r['probes']=[]
  for d in chosen:
   parts=by[d];legs={}
   # Price-only fixed ratios. Selection never uses spread, OI, volume, or quote quality.
   for role,right,ratio in [('short_put','P',.95),('long_put','P',.90),('short_call','C',1.05),('long_call','C',1.10)]:
    if role=='short_put':ks=[k for k in parts[right] if k<price]
    elif role=='long_put':ks=[k for k in parts[right] if 'short_put' in legs and k<legs['short_put']['strike']]
    elif role=='short_call':ks=[k for k in parts[right] if k>price]
    else:ks=[k for k in parts[right] if 'short_call' in legs and k>legs['short_call']['strike']]
    if ks:
     k=min(ks,key=lambda k:(abs(k-price*ratio),k));legs[role]={'symbol':parts[right][k],'strike':k,'target':price*ratio}
   p={'expiration':d.isoformat(),'dte':(d-ASOF).days,'legs':legs,'geometry_valid':len(legs)==4,'quote_request_id':None}
   r['probes'].append(p)
   if p['geometry_valid']:planned.append((r,p))
  if not any(p['geometry_valid'] for p in r['probes']):r['result']='no_relevant_geometry';r['reason']='PRICE_RELATIVE_FOUR_LEG_GEOMETRY_ABSENT'
(OUT/'probe-plan.json').write_text(json.dumps({'as_of':ASOF.isoformat(),'reference_field_preference':['last','close'],'expiration_targets_dte':[45,75],'expiration_window_dte':[21,100],'strike_targets_ratio':{'short_put':.95,'long_put':.90,'short_call':1.05,'long_call':1.10},'rows':unprobed},separators=(',',':')))
print('eligible',len(target),'planned_structures',len(planned),flush=True)
# First structure per class. Second is requested only if the first did not pass.
def evaluate(block):
 names=[p['legs'][role]['symbol'] for r,p in block for role in ('short_put','long_put','short_call','long_call')]
 body,rec=get(names,'option_legs');qm=quotes(body)
 for r,p in block:
  p['quote_request_id']=rec['attempt'];p['quote_result']={}
  if body is None:p['state']='provider_data_unavailable';p['reason']=rec['error'] or 'NON_200_OR_MALFORMED';continue
  good=0;issues=[];spreads=[];sizes=[];ois=[];vols=[]
  for role,l in p['legs'].items():
   q=qm.get(l['symbol']);item={'quote':q,'usable':False,'reason':None}
   p['quote_result'][role]=item
   if not q:item['reason']='MISSING_QUOTE';issues.append(role+':MISSING_QUOTE');continue
   right='put' if 'put' in role else 'call'
   if q.get('root_symbol')!=r['provider_root'] or q.get('expiration_date')!=p['expiration'] or q.get('option_type')!=right or q.get('strike')!=l['strike']:
    item['reason']='IDENTITY_MISMATCH';issues.append(role+':IDENTITY_MISMATCH');continue
   b,a=q.get('bid'),q.get('ask');bs,az=q.get('bidsize'),q.get('asksize');bd,ad=q.get('bid_date'),q.get('ask_date')
   t=dt.datetime.fromisoformat(rec['received_at_utc']).timestamp()*1000
   finite=lambda v:isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v)
   age=max((t-bd)/60000,(t-ad)/60000) if finite(bd) and finite(ad) else None
   item['max_side_age_minutes']=age
   if not(finite(b) and finite(a) and b>0 and a>=b and finite(bs) and finite(az) and bs>0 and az>0 and age is not None and 0<=age<=60):
    item['reason']='UNUSABLE_BID_ASK_SIZE_OR_AGE';issues.append(role+':UNUSABLE_BID_ASK_SIZE_OR_AGE');continue
   item['usable']=True;good+=1;spreads.append(a-b);sizes.append(min(bs,az));ois.append(q.get('open_interest'));vols.append(q.get('volume'))
  p['usable_legs']=good;p['issues']=issues
  if good==4:
   wing=min(p['legs']['short_put']['strike']-p['legs']['long_put']['strike'],p['legs']['long_call']['strike']-p['legs']['short_call']['strike'])
   p['half_spread_sum_over_min_wing']=sum(spreads)/2/wing;p['min_display_size']=min(sizes);p['min_open_interest']=min(ois) if all(isinstance(v,(int,float)) for v in ois) else None;p['mean_volume']=sum(vols)/4 if all(isinstance(v,(int,float)) for v in vols) else None
   p['state']='qualified_by_observation';p['reason']='FOUR_USABLE_DISPLAYED_LEG_MARKETS'
  else:p['state']='observed_insufficient_market_evidence';p['reason']=';'.join(issues)
for i in range(0,len(planned),10):
 # first pass only
 block=[x for x in planned[i:i+10] if x[1] is next((p for p in x[0]['probes'] if p['geometry_valid']),None)]
 if block:evaluate(block)
 if i%100==0:print('first_pass',i,flush=True)
retry=[]
for r in target:
 if r['result']!='pending':continue
 vp=[p for p in r.get('probes',[]) if p['geometry_valid']]
 if vp and vp[0].get('state')!='qualified_by_observation' and len(vp)>1:retry.append((r,vp[1]))
for i in range(0,len(retry),10):evaluate(retry[i:i+10]);print('alternative',min(i+10,len(retry)),flush=True)
for r in target:
 if r['result']!='pending':continue
 states=[p.get('state') for p in r.get('probes',[]) if p['geometry_valid'] and p['quote_request_id']]
 if 'qualified_by_observation' in states:r['result']='qualified_by_observation';r['reason']='FOUR_USABLE_DISPLAYED_LEG_MARKETS'
 elif 'observed_insufficient_market_evidence' in states:r['result']='observed_insufficient_market_evidence';r['reason']='ALL_ATTEMPTED_GEOMETRIES_INSUFFICIENT'
 elif 'provider_data_unavailable' in states:r['result']='provider_data_unavailable';r['reason']='ALL_ATTEMPTED_QUOTE_REQUESTS_UNAVAILABLE'
 else:r['result']='otherwise_unevaluable';r['reason']='NO_COMPLETED_PROBE'
(OUT/'results.json').write_text(json.dumps({'as_of':ASOF.isoformat(),'rows':unprobed},separators=(',',':')))
from collections import Counter
print(json.dumps({'requests':attempt,'results':dict(Counter(r['result'] for r in unprobed))},indent=2))
