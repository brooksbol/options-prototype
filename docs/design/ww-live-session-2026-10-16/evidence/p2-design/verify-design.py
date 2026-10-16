"""Off-repository design oracle; not a backend implementation or HTTP acceptance test."""
import json,pathlib,sys,copy,hashlib,math,shutil
from fractions import Fraction as F
r=pathlib.Path('/tmp/ww-live-api-p2');base=pathlib.Path('/tmp/ww-live-api-proposal.bDAtaf/baseline')
sys.path.insert(0,str(base/'scripts'))
import v2_oas,yaml
contracts=r/'validation-contracts';contracts.mkdir(exist_ok=True)
root=yaml.safe_load((base/'docs/contracts'/v2_oas.COMMON).read_text())
for route in ['/v2/position-associations','/v2/position-associations/{associationId}']:
 root['paths'][route]={'$ref':v2_oas.ACCOUNT+'#/paths/'+route.replace('~','~0').replace('/','~1')}
root['info']['version']='0.7.0-proposal.2';root['info']['description']='UNAPPROVED P2 DESIGN REVIEW ARTIFACT.'
(contracts/v2_oas.COMMON).write_text(yaml.safe_dump(root,sort_keys=False))
(r/'proposed-root.openapi.yaml').write_text(yaml.safe_dump(root,sort_keys=False))
shutil.copyfile(base/'docs/contracts'/v2_oas.SELECTION,contracts/v2_oas.SELECTION)
shutil.copyfile(r/'proposed-account-evidence.openapi.json',contracts/v2_oas.ACCOUNT)
v2_oas.CONTRACTS=contracts;c=v2_oas.Contracts();c.validate_structure()
old=json.loads((base/'docs/contracts'/v2_oas.ACCOUNT).read_text());d=json.loads((r/'proposed-account-evidence.openapi.json').read_text())
assert all(d['components']['schemas'][k]==v for k,v in old['components']['schemas'].items())
c.validate_parameters('GET','/v2/positions',{('query','view'):'option-structure'})
cap=base/'scripts/fixtures/tt-live-economic-observed.json'; source=json.loads(cap.read_text());sourcehash=hashlib.sha256(cap.read_bytes()).hexdigest();assert sourcehash=='7f6788c4fb6fb92a27c3bc4f2a61316c9718e8b2f0cf534eb7915f94784dc8e9'
for key in ['holdings','instruments']:
 for x in json.loads((r/'fixtures'/f'{key}.json').read_text()):
  i=int(x['sourcePointer'].split('/')[-1]);assert x['record']==source[key][i]
legs=[x['record'] for x in json.loads((r/'fixtures/holdings.json').read_text())];terms={x['record']['symbol']:x['record'] for x in json.loads((r/'fixtures/instruments.json').read_text())}
assert len(legs)==len(terms)==4
for h in legs:
 t=terms[h['symbol']];assert h['instrument-type']==t['instrument-type']=='Equity Option';assert t['option-chain-type']=='Standard' and t['shares-per-contract']==100;assert t['underlying-symbol']==h['underlying-symbol']=='XLE';assert t['expiration-date']=='2026-10-16';assert h['quantity']==1
bad=copy.deepcopy(next(iter(terms.values())));bad.pop('shares-per-contract');assert bad.get('shares-per-contract')!=100
bad2=copy.deepcopy(next(iter(terms.values())));bad2['shares-per-contract']=50;assert bad2['shares-per-contract']!=100
# Exact financial arithmetic from recorded source fields, independent of CLI/candidate/domain code.
qs=[(1 if h['quantity-direction']=='Long' else -1)*h['quantity'] for h in legs]
def intrinsic(S):
 return sum(q*100*max((S-F(terms[h['symbol']]['strike-price'])) if terms[h['symbol']]['option-type']=='C' else (F(terms[h['symbol']]['strike-price'])-S),F(0)) for h,q in zip(legs,qs))
xs=[F(0),F(59),F('59.5'),F('64.5'),F(65)];assert [intrinsic(x) for x in xs]==[-50,-50,0,0,-50]
assert math.gcd(*[2,2,4,2])==2 and math.gcd(*[2,1,2,2])==1
assert F(1000-10,50)==F(99,5)
def established(value):return {'status':'ESTABLISHED','value':value,'evidenceIds':['e1'],'reasons':[]}
def rational(x):return {'numerator':str(x.numerator),'denominator':str(x.denominator)}
result=json.loads(pathlib.Path('/tmp/ww-live-api-proposal.bDAtaf/synthetic-schema-response.json').read_text());a=result['accounts'][0];row=a['structures'][0]
row['associationId']='22222222-2222-4222-8222-222222222222';row['identity']={'status':'UNKNOWN','value':None,'evidenceIds':[],'reasons':['OCCURRENCE_NOT_ESTABLISHED']};row['openingFillAt']={'status':'UNKNOWN','value':None,'evidenceIds':[],'reasons':['OPENING_ATTRIBUTION_NOT_IMPLEMENTED']};row['underlying']=established({'symbol':'XLE','priceCurrency':'USD'});row['expiration']=established({'date':'2026-10-16','expiresAt':'2026-10-16T20:15:00Z'});row['remainingDte']=2;row['units']=established('1');row['range']=established({'kind':'SHORT_STRIKE_INTERVAL','lower':'59.5','upper':'64.5'})
row['payoff']['value']['knots']=[{'underlyingPrice':rational(x),'terminalValue':rational(intrinsic(x))} for x in xs]
for out,h,q in zip(row['constituents'],legs,qs):
 t=terms[h['symbol']];out['observedContract']=h['symbol'];out['signedQuantity']=str(q);v=out['terms']['value'];v.update({'underlyingSymbol':'XLE','expiration':'2026-10-16','right':'CALL' if t['option-type']=='C' else 'PUT','quotedStrike':str(F(t['strike-price']).numerator/F(t['strike-price']).denominator),'exerciseAmount':str(int(F(t['strike-price'])*100))})
result['evaluatedAt']='2026-10-14T19:21:15.312Z';a['snapshot']['evidenceDate']='2026-10-14';a['snapshot']['recordedAt']=result['evaluatedAt'];a['snapshot']['observationContext']={'broker':'TASTYTRADE','evidenceDateBasis':'BACKEND_RECEIPT_UTC_DATE','evidenceDatePrecision':'DAY'}
# Synthetic metadata authoring is labeled; record values retain original capture lineage in separate manifest.
row['qualifications']=['DESIGN_SPECIMEN_HISTORICAL_RECORDS_WITH_SYNTHETIC_ASSERTION'];result['interpretationVersion']='option-structure-v1'
c.validate_response('GET','/v2/positions',200,result)
(r/'synthetic-authoring-recorded-source-response.json').write_text(json.dumps(result,indent=2)+'\n')
mutations=[]
x=copy.deepcopy(result);x['accounts'][0]['structures'][0]['membership']={'status':'ESTABLISHED','basis':'UNASSOCIATED_INVENTORY','evidenceIds':[],'reasons':[]};mutations.append(x)
x=copy.deepcopy(result);x['accounts'][0]['structures'][0]['constituents'][0]['signedQuantity']='0.5';mutations.append(x)
x=copy.deepcopy(result);x['accounts'][0]['structures'][0]['constituents'][0]['terms']['value']['deliverableShares']='-100';mutations.append(x)
x=copy.deepcopy(result);x['accounts'][0]['availability']='NO_RETAINED_SNAPSHOT';mutations.append(x)
for x in mutations:
 try:c.validate_response('GET','/v2/positions',200,x)
 except Exception:pass
 else:raise AssertionError('Independent P1 mutation still accepted')
body={'accountId':'acct_'+'a'*32,'snapshotId':'synthetic-selected-snapshot','submissionId':'33333333-3333-4333-8333-333333333333','action':'ASSERT','supersedesAssociationId':None,'allocations':[{'holdingId':x['holdingId'],'signedQuantity':x['signedQuantity']} for x in row['constituents']],'declaration':'THESE_ALLOCATIONS_FORM_ONE_CURRENT_MANAGED_OPTION_POSITION'}
c.validator({'$ref':'#/components/schemas/PositionAssociationInput'},v2_oas.ACCOUNT).validate(body)
(r/'fixtures/synthetic-association-input.json').write_text(json.dumps(body,indent=2)+'\n')
for f in ['signedQuantity','holdingId']:
 b=copy.deepcopy(body);b['allocations'][0][f]='0.5' if f=='signedQuantity' else ''
 assert list(c.validator({'$ref':'#/components/schemas/PositionAssociationInput'},v2_oas.ACCOUNT).iter_errors(b))
print('PASS draft root/account OAS structure/references and old schemas unchanged; native source extraction/hash; stated standard/negative field predicates; exact recorded-XLE curve and ratio units; full response/input schemas; all4 independent P1 mutations rejected plus2 input negatives. NOT HTTP/backend/Product acceptance.')
