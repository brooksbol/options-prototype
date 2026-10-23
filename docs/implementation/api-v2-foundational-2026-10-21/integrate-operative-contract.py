#!/usr/bin/env python3
"""Deterministic engineering promotion of accepted domain shapes; never publication acceptance."""
import copy,json,re,yaml
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
CONTRACTS=ROOT/'docs/contracts'
NAME='api-v2-foundational-portfolio.json'
COMMON='api-v2-direct-quote-acquisition-proposal.yaml'
source=json.loads((ROOT/'docs/reviews/api-v2-foundational-contract-2026-10-20/openapi.json').read_text())
module=copy.deepcopy(source)
module['info']={'title':'Wheelwright foundational financial domain','version':'0.6.0-foundational',
 'description':'Foundational financial resources implemented in the isolated full-API workstream. Domain baseline a32c7c79 plus Principal-required evidence, redaction and reconciliation corrections. Source availability and financial qualification remain explicit. This engineering contract does not declare runtime, independent-review, deployment or Product acceptance. No Order submission. Portfolio/Execution roots and universal split/recombine rules remain deferred.'}
module['servers']=[{'url':'/'}]
module['paths']={path:item for path,item in module['paths'].items() if '$ref' not in item}
# Every reference remains local to the declared operative package.
def rewrite(value):
 if isinstance(value,list):return [rewrite(x) for x in value]
 if not isinstance(value,dict):return value
 out={k:rewrite(v) for k,v in value.items()}
 if '$ref' in out:out['$ref']=out['$ref'].replace('../../contracts/','')
 return out
module=rewrite(module)
module['components']['schemas']['Order']['properties']['relatedOrders']['description']='Known retained peers reporting the same Account/broker/environment parent complex-order ID. At most200 instance links; RELATED_ORDERS_PARTIAL warns when more are retained, discoverable through the paginated brokerGroupId filter. This is not proof of OCO/OTOCO behavior, complete current group membership or Position association.'
module['components']['schemas']['Order']['properties']['brokerGroupAuthority']={'$ref':'#/components/schemas/AssociationAuthority','description':'Optional source-predicate corroboration of the reported complex parent/child record against the independently retained brokerage instruction. QUALIFIED does not establish Position membership, current atomic group completeness or guaranteed execution behavior. Missing means unknown.'}
module['components']['schemas']['Position']['properties']['orders']['description']='Authorized scoped collection navigation, including Construction-targeted relationships. A link does not establish an opening, complete history or an Order association; inspect each result qualification. Null for readers without the Order capability.'
schemas=module['components']['schemas']
schemas['Position']['properties']['exposure']={'$ref':'#/components/schemas/CurrentExposureEvidence','description':'Current quantity interpretation is separate from Position lifecycle. Empty UNKNOWN composition is not zero; SUPERSEDED_INTERPRETATION is prior provisional interpretation, not an economic merge or CLOSED transition.'}
schemas['CurrentExposureEvidence']={'type':'object','additionalProperties':False,'properties':{'status':{'type':'string','enum':['OBSERVED','ZERO_OBSERVED','UNKNOWN','RETAINED','SUPERSEDED_INTERPRETATION']},'sourceSnapshotId':{'type':'string'},'sourceDate':{'type':'string','format':'date'},'receivedAt':{'type':'string','format':'date-time'},'continuity':{'const':'UNRESOLVED'},'qualification':{'type':'string'},'evidence':{'type':'array','items':{'$ref':'#/components/schemas/EvidenceRef'}},'successorPosition':{'$ref':'#/components/schemas/Link'}},'required':['status','sourceSnapshotId','sourceDate','receivedAt','continuity','qualification','evidence'],'description':'Latest applicable retained inventory cut, not a proven opening/closing event. RETAINED/UNKNOWN cannot establish current financial totals. Historical source observations and immutable predecessors remain readable. A superseding financial interpretation does not establish economic occurrence continuity or split/recombine policy.'}
schemas['CurrentExposureEvidence']['allOf']=[{'if':{'properties':{'status':{'const':'SUPERSEDED_INTERPRETATION'}},'required':['status']},'then':{'required':['successorPosition']}}]
schemas['Position'].setdefault('allOf',[]).append({'if':{'properties':{'state':{'const':'CLOSED'}},'required':['state']},'then':{'not':{'required':['exposure']}}})
schemas['PositionSummary']['properties']['exposure']=copy.deepcopy(schemas['Position']['properties']['exposure'])
schemas['PositionSummary'].setdefault('allOf',[]).append(copy.deepcopy(schemas['Position']['allOf'][-1]))
schemas['OrderAssociation']['properties']['purpose']={'type':'string','enum':['CURRENT_OBSERVED_CLOSING_SCOPE'],'description':'When present, the established predicate is instruction-to-current-observed-contract-quantity scope only. It supplies no opening occurrence, historical origin, reservation or fill evidence. Absence preserves the original association predicate, whose authority must still be demonstrated.'}
module['components']['schemas']['Problem']={'$ref':COMMON+'#/components/schemas/HeldQuoteReadProblem'}
statuses={401:('UNAUTHENTICATED','Unauthenticated'),403:('FORBIDDEN','Forbidden'),404:('NOT_FOUND','Not found'),422:('INVALID_REQUEST','Invalid request'),503:('CAPABILITY_UNAVAILABLE','Capability unavailable'),500:('INTERNAL_ERROR','Internal error')}
for path,item in module['paths'].items():
 item['parameters']=[{'name':'X-Request-Id','in':'header','required':False,'schema':{'type':'string','pattern':r'^\s*([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})?\s*$'},'description':'Single optional correlation UUID. Trim and echo; absent/blank generates one. Invalid/repeated values return 422 after applicable authorization. Not an idempotency key.'}]
 for method,op in item.items():
  if method=='parameters':continue
  if method!='get':raise ValueError('No new mutation authorized by domain promotion')
  op['tags']=['Holdings' if path.startswith('/v2/holdings') else 'Construction Models' if '/models' in path else 'Constructions' if path.startswith('/v2/constructions') else 'Orders' if path.startswith('/v2/orders') else 'Instruments' if path.startswith('/v2/instruments') else 'Market observations' if path.startswith('/v2/market-observations') else 'Positions']
  # Reuse internal description convention; security remains machine-readable too.
  op['description']='Evidence-qualified financial read. Collection projections retain financial qualifications. Resource identifiers confer no authority.\n\n<!-- internal-only:start -->\n'+op['description']+'\n<!-- internal-only:end -->'
  if path=='/v2/accounts/{accountId}/inventory-reconciliation':
   op['x-required-grants']=['account.positions.read:{accountId}','account.holdings.read:{accountId}']
   op['description']+=' This Account-wide custody/Position reconciliation requires both Position-read and holdings-read; it exposes independently protected retained inventory quantities and residuals.'
  if path=='/v2/positions':op['parameters'].append({'name':'exposureStatus','in':'query','required':False,'schema':schemas['CurrentExposureEvidence']['properties']['status'],'description':'Filter current observed, zero-observed, unknown, retained, or superseded provisional financial interpretations independently from lifecycle state.'})
  if path=='/v2/orders':op['parameters'].append({'name':'brokerGroupId','in':'query','required':False,'schema':{'type':'string','minLength':1,'maxLength':1024},'description':'Exact reported parent complex-order ID; combine with accountId for broker-qualified scope. Selection of retained peers does not establish current completeness or OCO/OTOCO behavior.'})
  for parameter in op.get('parameters',[]):
   if parameter.get('name')=='positionId':parameter['description']='Filter by an independently authorized Position GUID. The caller also needs its Account Position-read permission; unknown and unauthorized targets return404. Construction-targeted associations resolve through their same-Account Position, including retained history. Filtering preserves UNKNOWN/AMBIGUOUS association qualifications; it does not validate them.'
  for status,(code,title) in statuses.items():
   response=op['responses'][str(status)]
   response['content']['application/problem+json']['schema']={'allOf':[{'$ref':'#/components/schemas/Problem'},{'type':'object','properties':{'status':{'const':status},'code':{'const':code},'title':{'const':title},'type':{'const':'urn:wheelwright:problem:'+code.lower()}}}]}
   response['headers']=copy.deepcopy(op['responses']['200']['headers'])
   if status==401:response['headers']['WWW-Authenticate']={'required':True,'schema':{'const':'Bearer'}}
module['x-implementation-handoff']='docs/discovery/api-v2-full-implementation-handoff-2026-10-21.md'
# Publication annotations from deterministic synthetic Java responses; no wire constraints changed.
annotations=json.loads((ROOT/'docs/implementation/api-v2-foundational-2026-10-21/documentation-annotations.json').read_text())['operations']
for path,notes in annotations.items():
 op=module['paths'][path]['get']
 for field in ['summary','externalDocs','x-codeSamples']:op[field]=copy.deepcopy(notes[field])
 op['description']=notes['description']+'\n\n<!-- internal-only:start -->\n'+op['description'].split('<!-- internal-only:start -->',1)[1].split('<!-- internal-only:end -->',1)[0].strip()+'\n<!-- internal-only:end -->'
 for status,examples in notes['examples'].items():
  media='application/json' if status=='200' else 'application/problem+json'
  op['responses'][status]['content'][media].pop('example',None)
  op['responses'][status]['content'][media]['examples']=copy.deepcopy(examples)
(CONTRACTS/NAME).write_text(json.dumps(module,indent=2)+'\n')
p=CONTRACTS/COMMON;text=p.read_text()
text=text.replace('title: Wheelwright v2 canonical evidence — quotes and accounts','title: Wheelwright v2 financial domain and source evidence').replace('version: 0.5.0-contract','version: 0.6.0-foundational')
text=text.replace("    $ref: 'api-v2-account-evidence.json#/paths/~1v2~1positions'", "    $ref: '"+NAME+"#/paths/~1v2~1positions'")
for path in module['paths']:
 if re.search(r'^  '+re.escape(path)+r':$',text,re.M):continue
 pointer=path.replace('~','~0').replace('/','~1')
 insertion="  "+path+":\n    $ref: '"+NAME+'#/paths/'+pointer+"'\n"
 text=text.replace('paths:\n','paths:\n'+insertion,1)
text=text.replace('    capabilities, plus canonical User/Account discovery, self identity, artifact resources and Position collections.', '    capabilities, plus the Principal-accepted foundational financial domain, token User/Account discovery,\n    independent custody observations, immutable Construction history, read-only Orders, qualified evaluations\n    and retained source Artifacts. Full API runtime acceptance remains a separate gate.')
text=text.replace('  description: Retained Position inspection and holdings acquisition.', '  description: Independently identified economic Positions; broker custody is separately readable.')
p.write_text(text)
p=CONTRACTS/'api-v2-account-evidence.json';account=json.loads(p.read_text());account['paths']['/v2/positions']={'$ref':NAME+'#/paths/~1v2~1positions'}
# Processing-attempt provenance is not the upload type allowlist.
for schema in account['components']['schemas'].values():
 prop=schema.get('properties',{}).get('fileType',{})
 if 'API_POSITIONS' in prop.get('enum',[]):
  for kind in ['API_BALANCES','API_ORDERS','API_MARKET_DATA','API_MARKET_SESSION','API_OPTION_CHAIN','API_OPTION_DEFINITIONS','API_OPTION_DEFINITION']:
   if kind not in prop['enum']:prop['enum'].append(kind)
access=account['components']['schemas']['UserAccountAccess']
for field,description in {'holdingsRead':'Independent broker-custody observation read; no Position or Order grant implied.','ordersRead':'Read-only brokerage instructions and authorized Order-derived facts.','positionsAuditRead':'Retained Wheelwright Position audit; no missing brokerage history implied.','marketRead':'Private Account market/source evidence; global market.read is also required for observations.'}.items():
 access['properties'][field]={'type':'boolean','description':description}
 if field not in access['required']:access['required'].append(field)
def qualify_access_examples(value):
 if isinstance(value,dict):
  if isinstance(value.get('metadataRead'),bool) and isinstance(value.get('positionsRead'),bool) and 'accountId' in value:
   for field in ['holdingsRead','ordersRead','positionsAuditRead','marketRead']:value.setdefault(field,False)
  for child in value.values():qualify_access_examples(child)
 elif isinstance(value,list):
  for child in value:qualify_access_examples(child)
qualify_access_examples(account)
operation=account['paths']['/v2/position-acquisitions']['post']
operation['description']=operation['description'].replace('Interpretation is all-or-nothing;', 'Securities interpretation is all-or-nothing;')
addition=' A separately timed settled-cash companion response is retained in the existing Artifact/import owner when available. Securities ACCEPTED does not imply cash completeness: the result and holdings snapshot qualifications identify the cash outcome. Cash source failure preserves securities evidence; cash, securities and receipt clocks do not establish an atomic brokerage cut, buying power or reservation.'
if addition not in operation['description']:operation['description']=operation['description'].replace('Every response has X-Request-Id and private,no-store.', 'Every response has X-Request-Id and private,no-store.'+addition)
p.write_text(json.dumps(account,indent=2)+'\n')


# Principal-authorized F6 delta: common routing failure grammar, no new operation.
common_path=CONTRACTS/COMMON
common=yaml.safe_load(common_path.read_text())
routing=copy.deepcopy(common['components']['schemas']['HeldQuoteReadProblem'])
routing['description']='Uniform v2 framework routing failures. Unknown routes are NOT_FOUND; unsupported methods are METHOD_NOT_ALLOWED with Allow. Authentication and correlation are enforced before exposing routing results. Resource existence remains separately concealed by its capability.'
routing['properties']['status']['enum'].append(405)
routing['properties']['code']['enum'].append('METHOD_NOT_ALLOWED')
routing['oneOf'].append({'type':'object','properties':{'status':{'const':405},'code':{'const':'METHOD_NOT_ALLOWED'},'title':{'const':'Method not allowed'},'type':{'const':'urn:wheelwright:problem:method_not_allowed'}}})
method_response={'description':'The HTTP method is not supported for this route; this does not establish that a private instance exists. Allow identifies supported route methods. Unknown routes use the same Problem envelope with NOT_FOUND; unauthenticated requests remain UNAUTHENTICATED.',
 'headers':{'X-Request-Id':{'required':True,'schema':{'type':'string','format':'uuid'}},'Cache-Control':{'required':True,'schema':{'const':'private, no-store'}},'Allow':{'required':True,'schema':{'type':'string','minLength':1},'description':'Supported route methods; GET also permits HEAD and framework OPTIONS.'}},
 'content':{'application/problem+json':{'schema':{'allOf':[{'$ref':'#/components/schemas/RoutingProblem'},{'type':'object','properties':{'status':{'const':405},'code':{'const':'METHOD_NOT_ALLOWED'}}}]},'examples':{'syntheticMethodNotAllowed':{'summary':'Synthetic routing failure; no private resource existence asserted','value':{'type':'urn:wheelwright:problem:method_not_allowed','title':'Method not allowed','status':405,'code':'METHOD_NOT_ALLOWED','requestId':'11111111-1111-4111-8111-111111111111','detail':'Method is not supported for this v2 route'}}}}}}
text=common_path.read_text()
def add_yaml_component(section,name,value):
 global text
 existing=common['components'].get(section,{}).get(name)
 if existing is not None:
  if existing!=value:raise ValueError('Unexpected existing routing component '+name)
  return
 fragment=yaml.safe_dump({name:value},sort_keys=False,allow_unicode=True)
 indented=''.join('    '+line+'\n' for line in fragment.splitlines())
 marker='  '+section+':\n'
 if len(re.findall('^'+re.escape(marker),text,re.M))!=1:raise ValueError('Expected one component section '+section)
 text=re.sub('^'+re.escape(marker),lambda _:marker+indented,text,count=1,flags=re.M)
add_yaml_component('schemas','RoutingProblem',routing)
add_yaml_component('responses','MethodNotAllowed',method_response)
# Preserve existing human-authored YAML layout; add only the common error reference.
def annotate_yaml_operation(match):
 block=match.group(0)
 if not re.search(r'^        [\'\"]?405[\'\"]?:',block,re.M):
  if '      responses:\n' not in block:raise ValueError('Missing response section')
  block=block.replace('      responses:\n',"      responses:\n        '405':\n          $ref: '#/components/responses/MethodNotAllowed'\n",1)
 if 'operationId: acquireDirectQuotes' in block and 'x-required-grants-when-force:' not in block:
  block=block.replace('      operationId: acquireDirectQuotes\n','      operationId: acquireDirectQuotes\n      x-required-grants: [quote.acquire]\n      x-required-grants-when-force: [quote.force]\n')
 return block
text=re.sub(r'^    (?:get|post):\n.*?(?=^    (?:get|post):|^  /|^components:|\Z)',annotate_yaml_operation,text,flags=re.M|re.S)
common_path.write_text(text)
for name in ['api-v2-account-evidence.json','api-v2-market-evidence-subjects.json',NAME]:
 path=CONTRACTS/name;document=json.loads(path.read_text())
 for route,item in document['paths'].items():
  for method,operation in item.items():
   if method not in ['get','post']:continue
   operation['responses']['405']={'$ref':COMMON+'#/components/responses/MethodNotAllowed'}
   if route.startswith('/v2/market-observations'):
    operation['x-required-grants-for-account-scope']=['account.market.read:{accountId}']
   if route=='/v2/holdings':
    for parameter in operation.get('parameters',[]):
     if parameter.get('name')=='cursor':parameter['description']='Opaque continuation bound to caller scope, selection and projection. For default current holdings, a changed applicable Account snapshot set returns422; restart or select an explicit retained snapshot. No atomic cross-broker instant is asserted.'
 path.write_text(json.dumps(document,indent=2)+'\n')
