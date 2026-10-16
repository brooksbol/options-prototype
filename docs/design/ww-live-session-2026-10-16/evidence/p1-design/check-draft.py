import json,sys,copy,pathlib,hashlib
root=pathlib.Path('/tmp/ww-live-api-proposal.bDAtaf'); sys.path.insert(0,str(root/'baseline/scripts'))
import v2_oas
from v2_oas import Contracts,ACCOUNT
import shutil
CONTRACTS=root/"validation-contracts"; CONTRACTS.mkdir(exist_ok=True)
for name in (v2_oas.COMMON,v2_oas.SELECTION): shutil.copyfile(root/"baseline/docs/contracts"/name,CONTRACTS/name)
shutil.copyfile(root/"proposed-account-evidence.openapi.json",CONTRACTS/ACCOUNT)
v2_oas.CONTRACTS=CONTRACTS
from referencing import Registry,Resource
from referencing.jsonschema import DRAFT202012
c=Contracts(); old=json.loads((root/"baseline/docs/contracts"/ACCOUNT).read_text()); new=json.loads((root/'proposed-account-evidence.openapi.json').read_text()); c.documents[ACCOUNT]=new
c.registry=Registry().with_resources(((CONTRACTS/name).as_uri(),Resource.from_contents(c.absolute(doc,name),default_specification=DRAFT202012)) for name,doc in c.documents.items())
c.validate_structure()
assert all(new['components']['schemas'][k]==v for k,v in old['components']['schemas'].items())
c.validate_parameters('GET','/v2/positions',{('query','view'):'option-structure'})
S=new['components']['schemas']; v=lambda n:c.validator({'$ref':'#/components/schemas/'+n},ACCOUNT)
def established(value): return {'status':'ESTABLISHED','value':value,'evidenceIds':['e1'],'reasons':[]}
def unknown(): return {'status':'UNKNOWN','value':None,'evidenceIds':[],'reasons':['SOURCE_NOT_ESTABLISHED']}
def rat(n): return {'numerator':str(n),'denominator':'1'}
payoff=established({'basis':'GROSS_EXPIRATION_EXERCISE_VALUE_BEFORE_PREMIUM_AND_BASIS','quantityBasis':'TOTAL_CURRENT_ALLOCATED_QUANTITIES','currency':'USD','domainMinimum':'0','knots':[{'underlyingPrice':rat(x),'terminalValue':rat(y)} for x,y in [(0,-3000),(500,-3000),(510,0),(550,0),(560,-3000)]],'rightTailSlope':rat(0),'includesAssociatedShares':False})
v('StructuralPayoff').validate(payoff)
for name,payload in [('StructuralPayoff',{'status':'ESTABLISHED','value':None,'evidenceIds':['e1'],'reasons':[]}),('StructuralRational',{'numerator':'1','denominator':'0'}),('StructuralRational',{'numerator':1.5,'denominator':'1'})]:
 assert list(v(name).iter_errors(payload)),name
row={'subjectId':'synthetic-current-subject','inventoryPositionIds':['position-'+'a'*24], 'identity':unknown(),'membership':{'status':'ESTABLISHED','basis':'EXPLICIT_ASSOCIATION','evidenceIds':['e1'],'reasons':[]},'constituents':[], 'underlying':established({'symbol':'SPY','priceCurrency':'USD'}),'expiration':established({'date':'2026-11-20','expiresAt':None}),'remainingDte':35,'openingFillAt':unknown(),'units':established('3'),'strategy':established({'kind':'IRON_CONDOR','optionLegCount':4,'complexityRank':4}),'payoff':payoff,'range':established({'kind':'SHORT_STRIKE_INTERVAL','lower':'510','upper':'550'}),'collateral':unknown(),'qualifications':['SYNTHETIC_SCHEMA_SPECIMEN_NOT_ACTUAL_EVIDENCE']}
for i,(strike,right,q) in enumerate([(500,'PUT','3'),(510,'PUT','-3'),(550,'CALL','-3'),(560,'CALL','3')]):
 row['constituents'].append({'holdingId':'h'+str(i),'observedContract':'synthetic-contract-'+str(i),'custody':'BROKER_REPORTED','signedQuantity':q,'allocationEvidenceIds':['e1'],'terms':established({'contractKey':'synthetic-term-'+str(i),'underlyingSymbol':'SPY','expiration':'2026-11-20','right':right,'quotedStrike':str(strike),'priceMultiplier':'100','deliverableShares':'100','deliverableCash':'0','exerciseAmount':str(strike*100),'currency':'USD','adjustment':'STANDARD','settlement':'PHYSICAL_SINGLE_UNDERLYING'})})
e={'evidenceId':'e1','kind':'EXPLICIT_ASSOCIATION','recordId':'synthetic-assertion','artifactId':None,'sha256':None,'sourceRows':[],'sourceEffectiveAt':None,'sourceDate':'2026-10-16','recordedAt':'2026-10-16T15:00:00Z','acquisitionStartedAt':None,'acquisitionReceivedAt':None}
a={'accountId':'acct_'+'a'*32,'availability':'RETAINED','snapshot':{'snapshotId':'synthetic-snapshot','evidenceDate':'2026-10-16','recordedAt':'2026-10-16T15:00:00Z','observation':None,'observationContext':{'broker':'FIDELITY','evidenceDateBasis':'FIDELITY_EXPORT_DATE','evidenceDatePrecision':'DAY'}},'evidenceSetId':'synthetic-evidence-set','evidenceQualification':'INCOMPLETE','structures':[row],'evidence':[e],'excludedExpiredHoldingIds':[],'refreshReasons':[],'qualifications':['SYNTHETIC_SCHEMA_SPECIMEN_NOT_PROVENANCE_PROOF']}
r={'requestId':'11111111-1111-4111-8111-111111111111','view':'option-structure','evaluatedAt':'2026-10-16T15:00:00Z','evaluationBasis':'RETAINED_INSPECTION','interpretationVersion':'option-structure-v1','accounts':[a]}
c.validate_response('GET','/v2/positions',200,r)
(root/'synthetic-schema-response.json').write_text(json.dumps(r,indent=2)+'\n')
print('PASS: resolved draft OAS structure/references; original schemas unchanged; new view parameter; synthetic full response; 3 invalid schema specimens rejected. These are schema checks, NOT evidence or API approval.')
