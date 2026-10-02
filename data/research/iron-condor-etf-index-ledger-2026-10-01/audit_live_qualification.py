#!/usr/bin/env python3
"""Verify immutable live bodies and classify the bounded observation with reference freshness."""
import collections,csv,datetime as dt,hashlib,json,math,tarfile
from pathlib import Path
P=Path(__file__).resolve().parent;O=P/'live-market-2026-10-02';D=json.loads((O/'results.json').read_text());rows=D['rows']
manifest=[json.loads(x) for x in (O/'capture-manifest.jsonl').read_text().splitlines()];byid={x['attempt']:x for x in manifest}
assert len(manifest)==len(byid)==85
for m in manifest:assert hashlib.sha256((O/m['raw_path']).read_bytes()).hexdigest()==m['sha256']
assert len(rows)==632 and len({(r['underlying'],r['occ_class']) for r in rows})==632
# Recheck every reported four-leg positive directly against its retained bulk response.
for r in rows:
 for p in r.get('probes',[]):
  if p.get('state')!='qualified_by_observation':continue
  req=byid[p['quote_request_id']];assert req['http_status']==200
  body=json.loads((O/req['raw_path']).read_bytes());qs=(body.get('quotes') or {}).get('quote') or []
  if isinstance(qs,dict):qs=[qs]
  qm={q.get('symbol'):q for q in qs};t=dt.datetime.fromisoformat(req['received_at_utc']).timestamp()*1000
  for role,l in p['legs'].items():
   q=qm[l['symbol']];right='put' if 'put' in role else 'call'
   assert q['root_symbol']==r['provider_root'] and q['expiration_date']==p['expiration'] and q['option_type']==right and q['strike']==l['strike']
   assert q['bid']>0 and q['ask']>=q['bid'] and q['bidsize']>0 and q['asksize']>0
   assert 0<=max((t-q['bid_date'])/60000,(t-q['ask_date'])/60000)<=60
out=[]
for r in rows:
 state=r['result'];reason=r['reason'];q=r.get('reference_quote');age=None;ref_state=None
 if r.get('reference_request_id'):
  t=(q or {}).get('trade_date');req=byid[r['reference_request_id']]
  if isinstance(t,(int,float)) and t>0:
   age=(dt.datetime.fromisoformat(req['received_at_utc']).timestamp()*1000-t)/60000
  expected='etf' if r['product_cohort'].startswith('ETF') else 'index'
  if r.get('reference_price') is None:ref_state='NO_PRICE'
  elif not q or q.get('type')!=expected:ref_state='PRODUCT_TYPE_MISMATCH'
  elif age is None:ref_state='NO_TRADE_TIMESTAMP'
  elif age<0 or age>60:ref_state='STALE_OR_FUTURE_TRADE_TIMESTAMP'
  else:ref_state='CURRENT_TRADE_REFERENCE'
  if ref_state!='CURRENT_TRADE_REFERENCE':state='reference_price_unavailable';reason=ref_state
 positive=[p for p in r.get('probes',[]) if p.get('state')=='qualified_by_observation']
 observed=[p for p in r.get('probes',[]) if p.get('state') in ('qualified_by_observation','observed_insufficient_market_evidence')]
 # Preserve the result of the quote surface even if the reference gate fails.
 record={k:r.get(k) for k in ('underlying','occ_class','product_cohort','provider_root','cheap_geometry_state','raw_sha256')}
 record.update({'state':state,'reason':reason,'reference_request_id':r.get('reference_request_id'),'reference_price':r.get('reference_price'),'reference_field':r.get('reference_field'),'reference_age_minutes':round(age,3) if age is not None else None,'reference_state':ref_state,'option_market_observed':bool(observed),'four_leg_quote_positive':bool(positive),'probes':r.get('probes',[])})
 out.append(record)
summary={'schema':'wheelwright-iron-condor-live-market-qualification/v1','session':'2026-10-02 regular U.S. market session','capture_started_at_utc':manifest[0]['started_at_utc'],'capture_ended_at_utc':manifest[-1]['received_at_utc'],'provider':'Tradier production /markets/quotes; frozen Pass -1 exact-root contract strings','baseline':'6c96b30','qualification_population':{'underlyings':2128,'classes':2273},'pr33_previously_quoted_ordinary_etf_classes':1641,'newly_unprobed_classes':632,'newly_eligible_first_quote_ceiling_after_frozen_identity_and_geometry':591,'prequote_term_unresolved_adjusted_etf_classes':106,'reference_requested_underlyings':len({r['underlying'] for r in rows if r.get('reference_request_id')}),'request_attempts':len(manifest),'http_status_counts':dict(collections.Counter(str(m['http_status']) for m in manifest)),'final_states':dict(collections.Counter(r['state'] for r in out)),'final_reasons':dict(collections.Counter(r['reason'] for r in out)),'new_quote_surface_positives_even_if_reference_unavailable':sum(r['four_leg_quote_positive'] for r in out),'successful_option_market_observations':sum(r['option_market_observed'] for r in out),'qualified_by_cohort':dict(collections.Counter(r['product_cohort'] for r in out if r['state']=='qualified_by_observation')),'index_state_counts':dict(collections.Counter(r['state'] for r in out if r['product_cohort'].startswith('INDEX_'))),'coarse_positive_bands':{},'raw_manifest_sha256':hashlib.sha256((O/'capture-manifest.jsonl').read_bytes()).hexdigest()}
for width in (.25,.5,1.0):
 for size in (1,5,10):
  key=f'half_spread_sum_over_min_wing<={width};min_display_size>={size}'
  summary['coarse_positive_bands'][key]=sum(any(p.get('state')=='qualified_by_observation' and p.get('half_spread_sum_over_min_wing',float('inf'))<=width and p.get('min_display_size',0)>=size for p in r['probes']) for r in out if r['state']=='qualified_by_observation')
(O/'audited-results.json').write_text(json.dumps({'summary':summary,'rows':out},separators=(',',':')))
with (O/'audited-results.csv').open('w',newline='') as f:
 fields=['underlying','occ_class','product_cohort','provider_root','state','reason','reference_request_id','reference_price','reference_field','reference_age_minutes','reference_state','option_market_observed','four_leg_quote_positive','expirations_examined','usable_legs_by_expiration','quote_request_ids']
 w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader()
 for r in out:
  x={k:r.get(k) for k in fields};x['expirations_examined']='|'.join(p['expiration'] for p in r['probes']);x['usable_legs_by_expiration']='|'.join(str(p.get('usable_legs','')) for p in r['probes']);x['quote_request_ids']='|'.join(str(p['quote_request_id']) for p in r['probes'] if p.get('quote_request_id'));w.writerow(x)
(O/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
