# Proposal artifact generation only. Does not modify repository OAS or application code.
import json,copy,pathlib
root=pathlib.Path('/tmp/ww-live-api-proposal.bDAtaf')
d=json.loads((root/'baseline/docs/contracts/api-v2-account-evidence.json').read_text())
s={}
def ref(n): return {'$ref':'#/components/schemas/'+n}
def obj(props,required=None): return {'type':'object','additionalProperties':False,'required':list(props) if required is None else required,'properties':props}
def arr(t,**kw): return {'type':'array','items':t,**kw}
def enum(*v): return {'type':'string','enum':list(v)}
def nullable(t): return {'anyOf':[t,{'type':'null'}]}
st={'type':'string','minLength':1}
dec={'type':'string','pattern':r'^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$'}
positive={'type':'string','pattern':r'^[1-9][0-9]*$'}
integer={'type':'string','pattern':r'^(?:0|-?[1-9][0-9]*)$'}
date={'type':'string','format':'date'}
time={'type':'string','format':'date-time'}
refs=arr(st,uniqueItems=True)
reasons=arr(st,uniqueItems=True)
s['StructuralRational']=obj({'numerator':integer,'denominator':positive})
s['StructuralRational']['description']='Exact reduced rational; denominator positive. Scalar decoding and viewport interpolation are presentation, not option valuation.'
def qualified(n,value):
 s[n]={'oneOf':[obj({'status':{'const':'ESTABLISHED'},'value':value,'evidenceIds':arr(st,minItems=1,uniqueItems=True),'reasons':{'type':'array','maxItems':0}}),obj({'status':enum('UNKNOWN','CONFLICTING','UNSUPPORTED'),'value':{'type':'null'},'evidenceIds':refs,'reasons':arr(st,minItems=1,uniqueItems=True)})]}
s['StructuralEvidence']=obj({'evidenceId':st,'kind':enum('HOLDINGS_SNAPSHOT','EXPLICIT_ASSOCIATION','ARTIFACT_ROW','TRANSACTION_OBSERVATION','CONTRACT_TERMS','COVERAGE_ASSERTION'), 'recordId':st,'artifactId':nullable(st),'sha256':nullable({'type':'string','pattern':'^[a-f0-9]{64}$'}),'sourceRows':arr({'type':'integer','minimum':1},uniqueItems=True),'sourceEffectiveAt':nullable(time),'sourceDate':nullable(date),'recordedAt':time,'acquisitionStartedAt':nullable(time),'acquisitionReceivedAt':nullable(time)})
s['StructuralEvidence']['description']='Account-scoped evidence references only; no original payload, raw brokerage identifier, order detail or transaction money. IDs confer no artifact/history access. Time precision is not synthesized.'
qualified('StructuralIdentity',obj({'positionId':st,'occurrenceAnchorId':st,'constructionBoundaryId':st}))
qualified('StructuralUnderlying',obj({'symbol':st,'priceCurrency':{'type':'string','pattern':'^[A-Z]{3}$'}}))
qualified('StructuralExpiration',obj({'date':date,'expiresAt':nullable(time)}))
qualified('StructuralOpening',time)
qualified('StructuralUnits',positive)
qualified('StructuralTerms',obj({'contractKey':st,'underlyingSymbol':st,'expiration':date,'right':enum('CALL','PUT'),'quotedStrike':dec,'priceMultiplier':dec,'deliverableShares':dec,'deliverableCash':dec,'exerciseAmount':dec,'currency':{'type':'string','pattern':'^[A-Z]{3}$'},'adjustment':enum('STANDARD','ADJUSTED'),'settlement':{'const':'PHYSICAL_SINGLE_UNDERLYING'}}))
s['StructuralTerms']['description']='ESTABLISHED requires proven effective terms, positive share deliverable, positive exercise amount/multiplier, nonnegative fixed cash, compatible currency and right. Root/strike encoding or multiplier=100 alone is insufficient. Other settlement models explicitly UNSUPPORTED.'
s['StructuralConstituent']=obj({'holdingId':st,'observedContract':st,'custody':st,'signedQuantity':dec,'allocationEvidenceIds':arr(st,minItems=1,uniqueItems=True),'terms':ref('StructuralTerms')})
s['StructuralMembership']=obj({'status':enum('ESTABLISHED','UNKNOWN','CONFLICTING'),'basis':enum('EXPLICIT_ASSOCIATION','BROKERAGE_RECONCILIATION','UNASSOCIATED_INVENTORY'),'evidenceIds':refs,'reasons':reasons})
s['StructuralMembership']['description']='ESTABLISHED must have nonempty evidenceIds and basis other than UNASSOCIATED_INVENTORY; unknown/conflicting rows have one residual option constituent. Whole-holding old assertions do not establish lifecycle continuity.'
qualified('StructuralStrategy',obj({'kind':enum('IRON_CONDOR','PUT_CREDIT_VERTICAL','CALL_CREDIT_VERTICAL','SINGLE_OPTION','NONSTANDARD'),'optionLegCount':{'type':'integer','minimum':1},'complexityRank':{'type':'integer','minimum':0}}))
s['StructuralStrategy']['description']='Construction classification only; credit in a name does not prove opening credit. NONSTANDARD with established terms is a valid shape, not failed recognition.'
s['StructuralKnot']=obj({'underlyingPrice':ref('StructuralRational'),'terminalValue':ref('StructuralRational')})
qualified('StructuralPayoff',obj({'basis':{'const':'GROSS_EXPIRATION_EXERCISE_VALUE_BEFORE_PREMIUM_AND_BASIS'},'quantityBasis':{'const':'TOTAL_CURRENT_ALLOCATED_QUANTITIES'},'currency':{'type':'string','pattern':'^[A-Z]{3}$'},'domainMinimum':{'const':'0'},'knots':arr(ref('StructuralKnot'),minItems=1),'rightTailSlope':ref('StructuralRational'),'includesAssociatedShares':{'type':'boolean'}}))
s['StructuralPayoff']['description']='Knots include x=0 and every positive slope-change point in strictly increasing order; y and right tail determine the continuous function on S>=0. No left/negative-price domain. Premium, basis, fees, tax, funding, cash collateral and execution excluded. Total actual allocated quantity, not per unit. Complete compatible terms required; no partial package payoff.'
qualified('StructuralRange',{'oneOf':[obj({'kind':{'const':'SHORT_STRIKE_INTERVAL'},'lower':dec,'upper':dec}),obj({'kind':{'const':'SHORT_STRIKE_HALF_LINE'},'boundary':dec,'direction':enum('AT_OR_ABOVE','AT_OR_BELOW')})]})
s['StructuralRange']['description']='Verified ordinary short-strike region for supported standard constructions; never breakevens. Nonstandard/adjusted structures may have established payoff with UNSUPPORTED range.'
s['StructuralCollateralItem']=obj({'kind':enum('SHARES','CASH'),'symbol':nullable(st),'quantity':dec,'currency':nullable({'type':'string','pattern':'^[A-Z]{3}$'}),'evidenceIds':arr(st,minItems=1,uniqueItems=True)})
qualified('StructuralCollateral',arr(ref('StructuralCollateralItem')))
s['OptionStructure']=obj({'subjectId':st,'inventoryPositionIds':arr(st,minItems=1,uniqueItems=True),'identity':ref('StructuralIdentity'),'membership':ref('StructuralMembership'),'constituents':arr(ref('StructuralConstituent'),minItems=1),'underlying':ref('StructuralUnderlying'),'expiration':ref('StructuralExpiration'),'remainingDte':nullable({'type':'integer','minimum':0}),'openingFillAt':ref('StructuralOpening'),'units':ref('StructuralUnits'),'strategy':ref('StructuralStrategy'),'payoff':ref('StructuralPayoff'),'range':ref('StructuralRange'),'collateral':ref('StructuralCollateral'),'qualifications':reasons})
s['OptionStructure']['description']='subjectId is a response/snapshot-scoped projection key, never lifecycle identity. identity is established only from proven occurrence + construction boundaries. Unknown expiration remains represented; remainingDte null means unavailable. Clients do not reconstruct membership, identity, quantities or payoff.'
s['StructuralSnapshot']=obj({'snapshotId':st,'evidenceDate':date,'recordedAt':time,'observation':nullable(ref('HoldingsObservation')),'observationContext':ref('PositionObservationContext')})
s['StructuralAccount']=obj({'accountId':{'type':'string','pattern':'^acct_[a-f0-9]{32}$'},'availability':enum('RETAINED','NO_RETAINED_SNAPSHOT'),'snapshot':nullable(ref('StructuralSnapshot')),'evidenceSetId':nullable(st),'evidenceQualification':enum('QUALIFIED','INCOMPLETE','CONFLICTING','UNAVAILABLE'),'structures':arr(ref('OptionStructure')),'evidence':arr(ref('StructuralEvidence')),'excludedExpiredHoldingIds':refs,'refreshReasons':arr(enum('EXPIRED_OPTIONS_IN_RETAINED_FIDELITY_SNAPSHOT'),uniqueItems=True),'qualifications':reasons})
s['StructuralAccount']['description']='Every authorized Account is represented, including no retained snapshot. Missing snapshot implies null snapshot/evidenceSetId and empty structures/evidence, UNAVAILABLE qualification. Selected accepted inventory is conserved across allocated and residual quantities; definitely expired and non-option holdings are out of displayed scope, not proven executed closes.'
s['OptionStructureCollection']=obj({'requestId':{'type':'string','format':'uuid'},'view':{'const':'option-structure'},'evaluatedAt':time,'evaluationBasis':{'const':'RETAINED_INSPECTION'},'interpretationVersion':{'const':'option-structure-v1'},'accounts':arr(ref('StructuralAccount'))})
s['OptionStructureCollection']['description']='Pure retained-state domain projection; one SQLite read transaction and evaluation instant for all authorized Accounts. Database consistency is not brokerage snapshot atomicity. No provider calls, writes, durable new identity admission, history read-through or automatic remediation. No live-market, opening economics or order completeness claim.'
d['components']['schemas'].update(s)
o=d['paths']['/v2/positions']['get']
for p in o['parameters']:
 if p['name']=='view':
  p['schema']['enum'].append('option-structure')
  p['description']+=' option-structure selects current retained open-option structures across authorized Accounts; cannot combine with snapshotId. No implicit acquisition.'
o['responses']['200']['content']['application/json']['schema']['oneOf'].append(ref('OptionStructureCollection'))
o['description']+=' PROPOSED ONLY: view=option-structure follows the accompanying ww live v2 API Change Proposal. Default inventory and observations are unchanged. Authorized missing snapshot is a qualified per-Account result in this projection. Shape and opening economics are independently qualified.'
d['info']['version']='0.7.0-proposal.1'
d['info']['description']=d['info'].get('description','')+' UNAPPROVED DESIGN ARTIFACT. Not authoritative runtime OAS.'
(root/'proposed-account-evidence.openapi.json').write_text(json.dumps(d,indent=2)+'\n')
(root/'structural-schemas.json').write_text(json.dumps(s,indent=2)+'\n')
print('Draft OAS written outside repository:', len(s),'new schemas; old schemas preserved.')
