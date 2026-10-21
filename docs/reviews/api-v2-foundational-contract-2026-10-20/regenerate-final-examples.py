#!/usr/bin/env python3
"""Review-only synthetic example generation. Never acquires brokerage data or mutates the application."""
import copy,hashlib,json
from pathlib import Path
from fractions import Fraction as F
from datetime import datetime,date
P=Path(__file__).resolve().parent
B=json.loads((P/'examples/resources.json').read_text());R=B['resources'];N=B['names'];SRC=json.loads((P/'examples/final-source-fixtures.json').read_text());RAW=json.loads((P/'examples/source-artifact.json').read_text());FACT=json.loads((P/'examples/evidence-facts.json').read_text());O=json.loads((P/'openapi.json').read_text())
get=lambda n:R[N[n]]['value'];link=lambda h:{'href':h};T=SRC['asOf'];A=get('covered-call')['account'];ART=B['externalReferences'][2]['href']
def dec(n):return str(int(n)) if F(n).denominator==1 else str(float(n))
def ev(key,path,clock=None,orders=False):return {'kind':'ACCOUNT_SOURCE','account':A,'requiredCapability':('account.orders.read:' if orders else 'account.positions.read:')+A['href'].split('/')[-1],'artifact':link(ART),'recordKey':key,'locator':{'kind':'JSON_POINTER','value':path},'provider':'SYNTHETIC','environment':'OFFLINE','observedAt':clock or T,'observationPrecision':'INSTANT','observationDate':(clock or T)[:10],'receivedAt':T,'timeAuthority':'SOURCE'}
def metric(v=None,unit='MONEY',source=None,method='SOURCE_DERIVATION',deps=None):return {'value':None if v is None else dec(v),'unit':unit,'currency':'USD' if unit in ['MONEY','PRICE'] else None,'status':'NOT_APPLICABLE' if v is None else 'QUALIFIED','origin':'UNKNOWN' if v is None else 'WHEELWRIGHT_DERIVED','method':'NOT_APPLICABLE' if v is None else method,'asOf':source['observedAt'] if source else T,'assumptions':[] if v is None else ['Explicit synthetic source scope; no live brokerage validation.'],'evidence':[] if v is None else [source or ev('scenario','/finalSource')],'warningCodes':[],'dependencies':deps or []}
def auth(key,basis,subjects,source,predicate,**fields):
 FACT['facts'][key]={'account':A['href'],'predicate':predicate,'subjects':subjects,**fields};RAW.setdefault('facts',{})[key]=FACT['facts'][key]
 return {'claimId':key,'status':'ESTABLISHED','basis':basis,'account':A,'subjects':[link(h) for h in subjects],'evidence':[source],'qualification':'Only the explicitly supplied synthetic predicate; no broker reservation or specific-share selection.'}
# Fresh Evaluation, built from only this scenario's holdings/activity/quotes.
for name,scenario in SRC['scenarios'].items():
 c=get(name+'-construction');p=get(name+'-position');ch=c['self']['href'];src=ev(name,'/finalSource/scenarios/'+name);opening=ev(name+'-opening','/finalSource/scenarios/'+name+'/openingRecord',SRC['openingAt'],True);quote=ev(name+'-quotes','/finalSource/scenarios/'+name+'/holdings',SRC['quoteAt']);spot=ev('scenario-spot','/finalSource/spot',SRC['spotAt']);nodes={x['nodeId']:x for x in c['composition']['children']};flow=F(0);close=F(0);mv=F(0);fees=F(0)
 for raw in scenario['holdings']:
  x=nodes[raw['nodeId']];q=F(raw['quantity']);cost=F(raw['basisMagnitude']);sign=1 if raw['side']=='LONG' else -1;mark=sign*q*F(raw['multiplier'])*F(raw['midPrice']);cf=(0 if raw['kind']=='CASH' else -sign*cost);flow+=cf;close+=0 if raw['kind']=='CASH' else mark;mv+=mark;fees+=F(raw['fee']);a=x['allocation'];h=R[a['holding']['href']]['value'];x.update(quantity=raw['quantity'],side=raw['side']);a.update(quantity=raw['quantity'],basis=metric(cost,source=opening,deps=['OPENING_CASH_FLOW']),basisMethod='EXPLICIT_ASSUMPTION',globalStatus='RECONCILED');a['inventory'].update(quantity=raw['quantity'],evidence=[src]);a['authority']=auth(name+raw['nodeId']+'-allocation','AGGREGATE_ECONOMIC_CALCULATION',[ch,h['self']['href']],src,'ECONOMIC_QUANTITY',quantity=raw['quantity'])
  x['economics']={'openingCashFlow':metric(None if raw['kind']=='CASH' else cf,source=opening,deps=['ORDER_EVIDENCE']),'reportedMarketValue':metric(),'reportedOpenPl':metric(),'reportedCapitalRequirement':metric(),'fees':metric(F(raw['fee']),source=opening,deps=['ORDER_EVIDENCE'])}
  if raw['kind']=='OPTION':x['terms'].update(expiration=SRC['expiration'],strike=raw['strike'],right=raw['right'],multiplier=raw['multiplier'],evidence=[src]);inst=R[x['instrument']['href']]['value'];inst['option'].update(expiration=SRC['expiration'],strike=raw['strike'],right=raw['right'],multiplier=raw['multiplier']);inst['symbol']='SPY '+SRC['expiration']+' '+raw['right']+' '+raw['strike'];inst['brokerAliases'][0]['identifier']=inst['symbol'].replace(' ','-')
  h.update(observedAt=T,receivedAt=T,observationDate=T[:10],evidence=[src],warnings=[])
  for k in ['reportedMarketValue','reportedOpenPl','reportedCapitalRequirement']:h[k]=metric()
 c.update(createdAt=T,warnings=[],evidence=[src]);c['recognition']['authority']=auth(name+'-membership','RECONCILED_DOCUMENTED_ACTIVITY',[ch],ev(name+'-membership','/facts/'+name+'-membership'),'COMPOSITION_MEMBERSHIP',nodes=list(nodes),coordinatedOpening=scenario['coordinatedOpening']);c['recognition']['evidence']=[src]
 for rel in c['relationships']:
  rel['kind']='ECONOMIC_COVERAGE';rel['effectiveAt']=T;rel['authority']=auth('coverage-'+name,'AGGREGATE_ECONOMIC_CALCULATION',[ch,rel['supportHolding']['href']],src,'AGGREGATE_COVERAGE');rel['evidence']=[src];rel['status']='ESTABLISHED'
 def payoff(s):
  v=F(0)
  for z in scenario['holdings']:
   qty=F(z['quantity']);sign=1 if z['side']=='LONG' else -1;cost=F(z['basisMagnitude'])
   intrinsic=qty if z['kind']=='CASH' else qty*s if z['kind']=='LONG_SHARES' else qty*F(z['multiplier'])*max((s-F(z['strike']))*(1 if z['right']=='CALL' else -1),0)
   v+=sign*(intrinsic-cost)
  return v
 strikes=sorted({F(z['strike']) for z in scenario['holdings'] if z['strike'] is not None});bounds=[F(0)]+strikes;segments=[];roots=[]
 for i,lo in enumerate(bounds):
  hi=bounds[i+1] if i+1<len(bounds) else None;s=lo+1 if hi is None else (lo+hi)/2;slope=(payoff(s+F(1,1000))-payoff(s))/F(1,1000);intercept=payoff(s)-s*slope;segments.append({'lower':dec(lo),'upper':None if hi is None else dec(hi),'slope':dec(slope),'intercept':dec(intercept)})
  if slope and -intercept/slope>=lo and (hi is None or -intercept/slope<=hi):roots.append(dec(-intercept/slope))
 g=copy.deepcopy(get('broken-wing')['evaluation']['payoff']['geometry']);g.update(horizon={'kind':'COMMON_EXPIRATION','date':SRC['expiration']},segments=segments,boundaries=[{'price':dec(k),'value':dec(payoff(k))} for k in strikes],breakEvenPrices=list(dict.fromkeys(roots)))
 lower='95' if name=='cash-secured-put' else '105' if name=='buy-write' else '95';upper='105' if name=='iron-condor' else None
 evaluation={'evaluatedAt':T,'marketValue':metric(mv,source=quote,deps=['HELD_INVENTORY','CURRENT_MARKET']),'grossUnrealizedPl':metric(flow+close,source=opening,deps=['ORDER_EVIDENCE','CURRENT_MARKET']),'spot':metric(F(SRC['spot']),'PRICE',spot),'oldestMaterialObservationAt':SRC['quoteAt'],'freshness':'CURRENT','timeline':{'remainingDays':metric((date.fromisoformat(SRC['expiration'])-date.fromisoformat(T[:10])).days,'DAY',src),'originalDays':metric((date.fromisoformat(SRC['expiration'])-date.fromisoformat(SRC['openingAt'][:10])).days,'DAY',opening,deps=['ORDER_EVIDENCE']),'openedAt':SRC['openingAt'],'expiration':SRC['expiration'],'calendarZone':'America/New_York','openingEvidence':[opening],'openingAccess':'VISIBLE'},'range':{'status':'QUALIFIED','kind':'PLATEAU' if upper else 'LOWER_HALF_LINE','lower':lower,'upper':upper,'currency':'USD','evidence':[src],'warningCodes':[]},'management':{'access':'VISIBLE','associationStatus':'UNAVAILABLE','orders':[],'zeroGrossPl':metric(0),'profitTargetGrossPl':metric(),'reportedStopThresholdGrossPl':metric(),'stopInterpretation':'PROVISIONAL_NOT_EXECUTION_GUARANTEE','protectiveOrderEvidence':'UNKNOWN','manualCheckpoint':None,'evidence':[],'warningCodes':[]},'payoff':{'status':'QUALIFIED','geometry':g,'evaluatedAt':T,'assumptions':['Synthetic standard USD physical100-share contracts; terminal gross intrinsic before fees.'],'evidence':[src,opening],'warningCodes':[]},'openingCashFlow':metric(flow,source=opening,deps=['ORDER_EVIDENCE']),'estimatedClosingCashFlow':metric(close,source=quote,deps=['CURRENT_MARKET']),'fees':metric(fees,source=opening,deps=['ORDER_EVIDENCE']),'netUnrealizedPl':metric(flow+close-fees,source=opening,deps=['ORDER_EVIDENCE','CURRENT_MARKET']),'realizedGrossPl':metric(),'realizedNetPl':metric()}
 # Current management is outside this source fixture, independently of known opening economics.
 for k in ['profitTargetGrossPl','reportedStopThresholdGrossPl']:
  evaluation['management'][k].update(status='INCOMPLETE',method='CURRENT_ORDER_EVIDENCE_NOT_SUPPLIED',warningCodes=['ASSOCIATION_UNRESOLVED'])
 evaluation['management']['warningCodes']=['ASSOCIATION_UNRESOLVED']
 warning={'code':'ASSOCIATION_UNRESOLVED','affected':['/evaluation/management'],'establishedFacts':['Opening costs, held constituents, contract terms and quoted economics are supported by this fixture.'],'incompleteConclusions':['Current closing Order targets and stops are not supplied; their absence is not established.'],'evidence':[src],'remediation':[{'action':'IMPORT_SOURCE','description':'Supply authorized current closing Order evidence if management conclusions are needed.','capability':None,'requiredGrant':None}]}
 p.update(evaluation=evaluation,warnings=[warning],orders=None,audit=None);p['stateEvidence']['evidence']=[src];p['stateEvidence']['establishedAt']=T;p['allocation']['evidence']=[src]
# Broker-reservation assertions anywhere in existing synthetic examples need actual appropriate witnesses.
for item in R.values():
 if item['schema']!='Construction':continue
 for rel in item['value']['relationships']:
  if rel['kind']=='BROKER_ENCUMBRANCE' and rel['authority']['basis']!='BROKER_RESERVATION_RECORD':rel.update(status='INCOMPLETE');rel['authority'].update(status='UNRESOLVED',basis='UNKNOWN',evidence=[],qualification='No broker reservation record supplied; aggregate holdings are not reservation evidence.')
RAW['finalSource']=SRC;RAW['facts']=FACT['facts'];(P/'examples/resources.json').write_text(json.dumps(B,indent=2)+'\n');(P/'examples/evidence-facts.json').write_text(json.dumps(FACT,indent=2)+'\n');(P/'examples/source-artifact.json').write_text(json.dumps(RAW,indent=2)+'\n')
