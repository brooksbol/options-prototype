#!/usr/bin/env python3
"""Idempotent implementation-entry corrections to review fixtures; no application or broker actions."""
import json,copy,hashlib
from pathlib import Path
from fractions import Fraction as F
P=Path(__file__).resolve().parent;o=json.loads((P/'openapi.json').read_text());b=json.loads((P/'examples/resources.json').read_text());R=b['resources'];N=b['names'];get=lambda n:R[N[n]]['value']
for name in ['Metric','FeeMetric','PriceMetric','ReferenceMetric']:
 for rule in o['components']['schemas'][name].get('allOf',[]):
  if rule.get('if',{}).get('properties',{}).get('status')=={'const':'REDACTED'}:rule['then']['properties']['asOf']={'type':'null'}

if 'MARKET_OBSERVATION_MISSING' not in o['components']['schemas']['Warning']['properties']['code']['enum']:o['components']['schemas']['Warning']['properties']['code']['enum'].append('MARKET_OBSERVATION_MISSING')
# Gross/net/fees are evaluations; the opening clock remains solely in source evidence.
for r in R.values():
 if r['schema']=='Position':
  e=r['value']['evaluation']
  def time_fix(x):
   if isinstance(x,dict):
    for k,z in x.items():
     if k in ['fees','fee','grossUnrealizedPl','netUnrealizedPl','realizedGrossPl','realizedNetPl'] and isinstance(z,dict) and 'asOf'in z:z['asOf']=e['evaluatedAt']
     time_fix(z)
   elif isinstance(x,list):
    for z in x:time_fix(z)
  time_fix(e)
def dec(f):return str(int(f)) if F(f).denominator==1 else str(float(f))
def leaves(n):return [z for child in n['children'] for z in leaves(child)] if n['kind']=='GROUP' else [n]
for name in ['covered-call-ten-rolls','successive-protective-puts','leaps-maturity']:
 p=get(name);c=R[p['currentConstruction']['href']]['value'];e=p['evaluation'];t=e['evaluatedAt'];xs=leaves(c['composition']);costs=[x['allocation']['basis'] for x in xs];ev=copy.deepcopy(c['evidence']);opening=sum((1 if x['side']=='SHORT' else -1)*F(x['allocation']['basis']['value']) for x in xs if x['kind']!='CASH');opt=[x for x in xs if x['kind']=='OPTION'];expiry=opt[0]['terms']['expiration']
 def f(s):
  value=F(0)
  for x in xs:
   sign=1 if x['side']=='LONG' else -1;q=F(x['quantity']);cost=F(x['allocation']['basis']['value']);term=x.get('terms')
   amount=q if x['kind']=='CASH' else q*s if x['kind']=='LONG_SHARES' else q*F(term['multiplier'])*max((s-F(term['strike']))*(1 if term['right']=='CALL' else -1),0)
   value+=sign*(amount-cost)
  return value
 ks=sorted({F(x['terms']['strike']) for x in opt});bounds=[F(0)]+ks;segs=[];roots=[]
 for i,lo in enumerate(bounds):
  hi=bounds[i+1] if i+1<len(bounds) else None;spot=lo+1 if hi is None else (lo+hi)/2;slope=f(spot+F(1,100))-f(spot);slope*=100;intercept=f(spot)-slope*spot;segs.append({'lower':dec(lo),'upper':None if hi is None else dec(hi),'slope':dec(slope),'intercept':dec(intercept)})
  if slope and -intercept/slope>=lo and (hi is None or -intercept/slope<=hi):roots.append(dec(-intercept/slope))
 geom=copy.deepcopy(get('broken-wing')['evaluation']['payoff']['geometry']);geom.update(horizon={'kind':'COMMON_EXPIRATION','date':expiry},segments=segs,boundaries=[{'price':dec(k),'value':dec(f(k))} for k in ks],breakEvenPrices=list(dict.fromkeys(roots)))
 e['payoff'].update(status='QUALIFIED',geometry=geom,evaluatedAt=t,evidence=ev,assumptions=['Explicit documented constituent costs and standard terms; terminal gross intrinsic before fees.'],warningCodes=[])
 for k in ['marketValue','grossUnrealizedPl','netUnrealizedPl','spot','estimatedClosingCashFlow']:
  e[k].update(value=None,status='INCOMPLETE',method='CURRENT_MARKET_OBSERVATION_UNAVAILABLE',origin='UNKNOWN',asOf=t,evidence=[],assumptions=[],warningCodes=['MARKET_OBSERVATION_MISSING'])
 e.pop('historicalMarketValue',None);e.pop('brokerReportedOpenPl',None);e['freshness']='UNKNOWN';e['oldestMaterialObservationAt']=None
 e['openingCashFlow'].update(value=dec(opening),status='QUALIFIED',evidence=ev,asOf=t)
 # Period-bounded fees are available in the documented cumulative record; do not attribute them to current open P/L.
 for k in ['fees','realizedGrossPl','realizedNetPl']:
  e[k].update(value=None,status='INCOMPLETE',asOf=t,method='CURRENT_ATTRIBUTION_NOT_ESTABLISHED',origin='UNKNOWN',evidence=[],warningCodes=['HISTORY_INCOMPLETE'])
 for k in ['profitTargetGrossPl','reportedStopThresholdGrossPl']:e['management'][k].update(value=None,status='INCOMPLETE',asOf=t,method='ORDER_ASSOCIATION_NOT_ESTABLISHED',origin='UNKNOWN',evidence=[],warningCodes=['ASSOCIATION_UNRESOLVED'])
 e['management'].update(associationStatus='UNAVAILABLE',protectiveOrderEvidence='UNKNOWN',orders=[],evidence=[],manualCheckpoint=None,warningCodes=['ASSOCIATION_UNRESOLVED'])
 # Strike range is geometrically available for CC/protective put; long call has a rising tail and no plateau.
 if name=='covered-call-ten-rolls':e['range'].update(status='QUALIFIED',kind='LOWER_HALF_LINE',lower=dec(ks[0]),upper=None,evidence=ev,warningCodes=[])
 elif name=='successive-protective-puts':e['range'].update(status='QUALIFIED',kind='UPPER_HALF_LINE',lower=None,upper=dec(ks[0]),evidence=ev,warningCodes=[])
 else:e['range'].update(status='UNSUPPORTED',kind='UNAVAILABLE',lower=None,upper=None,evidence=[],warningCodes=['VALUATION_UNSUPPORTED'])
 p['warnings']=[]
 codes=set()
 def collect(v):
  if isinstance(v,dict):
   codes.update(v.get('warningCodes',[]))
   for z in v.values():collect(z)
  elif isinstance(v,list):
   for z in v:collect(z)
 collect(e)
 for code in sorted(codes):p['warnings'].append({'code':code,'affected':['/evaluation'],'establishedFacts':['Current constituents, original/current documented costs and terminal geometry remain established within source qualifications.'],'incompleteConclusions':['Only the named missing-market, history-attribution or Order result is unavailable.'],'evidence':[],'remediation':[]})
# Coverage Account view and truthful pointers, same independent100-share/2-call cut.
x=b['coverageConflictScenario'];a=x['assessment'];rec=copy.deepcopy(b['inventoryReconciliation']);rec.update(coverageAssessments=[copy.deepcopy(a)],coverage='COMPLETE_CURRENT_ALLOCATIONS',balances=[],warnings=[])
for h,allocated in [(x['supportHolding'],'0'),(x['callHolding'],'2')]:
 inv={'key':h['id'],'account':h['account'],'instrument':h['instrument'],'side':h['side'],'quantity':h['quantity'],'unit':h['unit'],'currency':None,'evidence':h['evidence'],'holding':h['self']}
 used=F(allocated);rec['balances'].append({'inventory':inv,'allocated':dec(used),'residual':dec(F(h['quantity'])-used),'status':'RECONCILED','availability':'UNKNOWN','currentConstructions':[c['self'] for c in x['constructions']] if used else []})
rec['warnings']=[{'code':'COVERAGE_INSUFFICIENT','affected':['/coverageAssessments/0'],'establishedFacts':['Owned inventory remains independently known.'],'incompleteConclusions':['Two obligations require200 shares against100 eligible shares; no reservation or availability is established.'],'evidence':a['authority']['evidence'],'remediation':[]}]
for p in x['positions']:
 for w in p['warnings']:w['affected']=['/evaluation/payoff','/evaluation/grossUnrealizedPl','/evaluation/netUnrealizedPl']
x['accountReconciliation']=rec
# Safe financial redaction in the candidate policy oracle.
p=P/'verify.py';s=p.read_text();s=s.replace("value=None,status='REDACTED'","value=None,asOf=None,status='REDACTED'");p.write_text(s)
# An independently readable lifecycle assertion does not expose a restricted source event clock.
lifecycle=o['components']['schemas']['LifecycleEvidence']
lifecycle['properties']['establishedAtAccess']={'enum':['VISIBLE','REDACTED'],'description':'Field-level source permission for the establishment clock. Redaction preserves the independently authorized lifecycle assertion, not the private event timestamp.'}
for rule in lifecycle['allOf']:
 if rule.get('if',{}).get('properties',{}).get('status')=={'const':'ESTABLISHED'} and 'establishedAt' in rule.get('then',{}).get('properties',{}):
  rule['then']={'if':{'properties':{'establishedAtAccess':{'const':'REDACTED'}},'required':['establishedAtAccess']},'then':{'properties':{'establishedAt':{'type':'null'}}},'else':{'properties':{'establishedAt':{'type':'string','format':'date-time'}}}}
clock_gate={'if':{'properties':{'establishedAtAccess':{'const':'REDACTED'}},'required':['establishedAtAccess']},'then':{'properties':{'establishedAt':{'type':'null'}}}}
if clock_gate not in lifecycle['allOf']:lifecycle['allOf'].append(clock_gate)
for rule in o['components']['schemas']['Allocation']['allOf']:
 if rule.get('if',{}).get('properties',{}).get('basisMethod')=={'const':'UNKNOWN'}:
  statuses=rule['then']['properties']['basis']['properties']['status']['enum']
  if 'REDACTED' not in statuses:statuses.append('REDACTED')
# Units are typed at their financial field, not left to a generic metric union.
for name,unit in [('FeeMetric','MONEY'),('PriceMetric','PRICE')]:
 o['components']['schemas'][name]['properties']['unit']={'const':unit}
for name,fields,unit in [
 ('Evaluation',['marketValue','grossUnrealizedPl','historicalMarketValue','brokerReportedOpenPl','openingCashFlow','estimatedClosingCashFlow','netUnrealizedPl','realizedGrossPl','realizedNetPl'],'MONEY'),
 ('Evaluation',['spot'],'PRICE'),('Timeline',['remainingDays','originalDays'],'DAY')]:
 for field in fields:
  old=o['components']['schemas'][name]['properties'][field]
  restriction={'properties':{'unit':{'const':unit}}}
  if 'allOf' not in old:o['components']['schemas'][name]['properties'][field]={'allOf':[old,restriction]}
  elif restriction not in old['allOf']:old['allOf'].append(restriction)
# Complete the already-declared Construction collection include projection with the same typed, authorized expansion shape.
o['components']['schemas']['Construction']['properties']['included']={'$ref':'#/components/schemas/Position/properties/included'}
for path,v in [('openapi.json',o),('examples/resources.json',b)]: (P/path).write_text(json.dumps(v,indent=2)+'\n')
