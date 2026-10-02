#!/usr/bin/env python3
"""Replayable one-session quote-surface proxy for exiting fixed four-leg ETF probes."""
import csv,datetime as dt,hashlib,json,math,statistics
from pathlib import Path
P=Path(__file__).resolve().parent
CLOSE=dt.datetime(2026,10,1,20,15,tzinfo=dt.timezone.utc).timestamp()*1000
plan=json.loads((P/'probe-plan.json').read_text())
requests=[json.loads(x) for x in (P/'capture-manifest.jsonl').read_text().splitlines()]
byid={r['attempt']:r for r in requests};assert len(byid)==len(requests)
quotes={}
for r in requests:
 body=(P/r['raw_path']).read_bytes()
 assert hashlib.sha256(body).hexdigest()==r['sha256']
 if r['kind'] not in ('option_legs','option_legs_repair') or r['status']!=200:continue
 data=json.loads(body);q=(data.get('quotes') or {}).get('quote')
 if isinstance(q,dict):q=[q]
 quotes[r['attempt']]={x.get('symbol'):x for x in (q or []) if isinstance(x,dict)}

def finite(v):return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v)
def clamp(v):return max(0.,min(1.,v))
def score_probe(row,p):
 if not p['geometry_valid']:
  return {'state':'OBSERVED_GEOMETRY_UNMATCHED','score':0.,'usable_legs':0}
 req=byid[p['quote_request_id']]
 if req['status']!=200 or p['quote_request_id'] not in quotes:
  return {'state':'ACQUISITION_FAILURE','score':None,'usable_legs':None}
 qmap=quotes[p['quote_request_id']];legs={};missing=[];mismatch=[]
 for role,l in p['legs'].items():
  q=qmap.get(l['symbol'])
  if q is None:missing.append(role);continue
  right='put' if 'put' in role else 'call'
  if q.get('root_symbol')!=row['symbol'] or q.get('expiration_date')!=p['expiration'] or q.get('option_type')!=right or not finite(q.get('strike')) or abs(q['strike']-l['strike'])>1e-8:mismatch.append(role)
  legs[role]=q
 if missing or mismatch:return {'state':'QUOTE_MISSING_OR_IDENTITY_CONFLICT','score':None,'missing':missing,'mismatch':mismatch}
 usable={};ages=[]
 for role,q in legs.items():
  bs=q.get('bid_date');a=q.get('ask_date');times=finite(bs) and finite(a)
  age=max((CLOSE-bs)/60000,(CLOSE-a)/60000) if times else None
  if age is not None:ages.append(age)
  usable[role]=bool(finite(q.get('bid')) and finite(q.get('ask')) and q['bid']>0 and q['ask']>=q['bid'] and finite(q.get('bidsize')) and finite(q.get('asksize')) and q['bidsize']>0 and q['asksize']>0 and age is not None and 0<=age<=60)
 n=sum(usable.values());complete=n==4
 value=20*n/4+20*complete
 components={'usable_legs':n,'full_four_leg':complete}
 if complete:
  widths=[legs[k]['ask']-legs[k]['bid'] for k in legs]
  minwing=min(p['legs']['short_put']['strike']-p['legs']['long_put']['strike'],p['legs']['long_call']['strike']-p['legs']['short_call']['strike'])
  concession=sum(widths)/2/minwing
  min_exit_size=min(legs['short_put']['asksize'],legs['short_call']['asksize'],legs['long_put']['bidsize'],legs['long_call']['bidsize'])
  age=max(ages)
  value+=35*clamp(1-concession/.25)
  value+=10*clamp(math.log1p(min_exit_size)/math.log1p(20))
  value+=7*clamp(1-age/60)
  components.update({'half_spread_sum_over_min_wing':concession,'min_exit_side_size':min_exit_size,'max_side_age_at_close_minutes':age})
 oi=[q.get('open_interest') for q in legs.values()]
 if all(finite(v) and v>=0 for v in oi):value+=4*clamp(math.log1p(min(oi))/math.log1p(100))
 vol=[q.get('volume') for q in legs.values()]
 if all(finite(v) and v>=0 for v in vol):value+=2*clamp(math.log1p(sum(vol)/4)/math.log1p(25))
 dev=max(abs(l['strike']-l['target'])/row['spot'] for l in p['legs'].values())
 value+=2*clamp(1-dev/.03)
 components.update({'min_open_interest':min(oi) if all(finite(v) for v in oi) else None,'mean_volume':sum(vol)/4 if all(finite(v) for v in vol) else None,'max_target_strike_deviation_over_spot':dev})
 return {'state':'OBSERVED','score':round(value,6),**components}

out=[];details=[]
for row in plan['rows']:
 s=row['symbol'];results=[score_probe(row,p) for p in row['probes']]
 for p,r in zip(row['probes'],results):details.append({'symbol':s,'expiration':p['expiration'],'dte':p['dte'],'quote_request_id':p['quote_request_id'],'legs':p['legs'],'result':r})
 if row['reason'] in ('NO_UNDERLYING_PRICE',):out.append({'Symbol':s,'Exit Reliability':'','state':row['reason']});continue
 if any(r['state'] in ('ACQUISITION_FAILURE','QUOTE_MISSING_OR_IDENTITY_CONFLICT') for r in results):
  out.append({'Symbol':s,'Exit Reliability':'','state':'QUOTE_EVIDENCE_INCOMPLETE'});continue
 if not results and row['reason']=='EXACT_ROOT_ABSENT':out.append({'Symbol':s,'Exit Reliability':'','state':'IDENTITY_UNRESOLVED'});continue
 # Two fixed expiry slots: an absent listed expiry or unrepresentable four-leg geometry earns zero, not a fabricated quote.
 total=sum(r['score'] for r in results)
 out.append({'Symbol':s,'Exit Reliability':f'{total/2:.1f}','state':'EVALUATED'})
scored=sorted((r for r in out if r['state']=='EVALUATED'),key=lambda r:(-float(r['Exit Reliability']),r['Symbol']))
unscored=sorted((r for r in out if r['state']!='EVALUATED'),key=lambda r:r['Symbol'])
assert len(out)==1643
with (P/'exit-reliability-v0.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['Symbol','Exit Reliability'],lineterminator='\n');w.writeheader();w.writerows({k:r[k] for k in ('Symbol','Exit Reliability')} for r in scored)
with (P/'exit-reliability-v0.md').open('w') as f:
 f.write('| Symbol | Exit Reliability |\n| --- | ---: |\n')
 for r in scored:f.write(f"| {r['Symbol']} | {r['Exit Reliability']} |\n")
(P/'probe-details.json').write_text(json.dumps(details,separators=(',',':')))
(P/'unevaluable.json').write_text(json.dumps(unscored,indent=2)+'\n')
summary={'as_of_market_date':'2026-10-01','capture_started_at_utc':requests[0]['started_at_utc'],'capture_ended_at_utc':requests[-1]['received_at_utc'],'cohort_underlyings':1643,'evaluated':len(scored),'unevaluable':len(unscored),'request_attempts':len(requests),'http_200':sum(r['status']==200 for r in requests),'unevaluable_states':{k:sum(r['state']==k for r in unscored) for k in sorted(set(r['state'] for r in unscored))},'score_semantics':'0-100 monotone one-session four-leg exit quote-surface proxy, mean across two fixed DTE target slots (45,75); 0 for observed missing representative geometry, unavailable for acquisition/identity failure; not fill probability','weights':{'usable_leg_fraction':20,'all_four_usable':20,'half_spread_concession_over_min_wing':35,'minimum_exit_side_size':10,'maximum_side_age_at_2026_10_01_20_15_UTC':7,'minimum_leg_open_interest':4,'mean_leg_volume':2,'strike_target_deviation':2},'files_sha256':{name:hashlib.sha256((P/name).read_bytes()).hexdigest() for name in ('capture-manifest.jsonl','probe-plan.json','exit-reliability-v0.csv','probe-details.json','unevaluable.json')}}
(P/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
print('TOP',[(r['Symbol'],r['Exit Reliability']) for r in scored[:25]])
