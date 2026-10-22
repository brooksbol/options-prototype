#!/usr/bin/env python3
"""Deterministic engineering promotion of accepted domain shapes; never publication acceptance."""
import copy,json,re
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
  if path=='/v2/orders':op['parameters'].append({'name':'brokerGroupId','in':'query','required':False,'schema':{'type':'string','minLength':1,'maxLength':1024},'description':'Exact reported parent complex-order ID; combine with accountId for broker-qualified scope. Selection of retained peers does not establish current completeness or OCO/OTOCO behavior.'})
  for parameter in op.get('parameters',[]):
   if parameter.get('name')=='positionId':parameter['description']='Filter by an independently authorized Position GUID. The caller also needs its Account Position-read permission; unknown and unauthorized targets return404. Construction-targeted associations resolve through their same-Account Position, including retained history. Filtering preserves UNKNOWN/AMBIGUOUS association qualifications; it does not validate them.'
  for status,(code,title) in statuses.items():
   response=op['responses'][str(status)]
   response['content']['application/problem+json']['schema']={'allOf':[{'$ref':'#/components/schemas/Problem'},{'type':'object','properties':{'status':{'const':status},'code':{'const':code},'title':{'const':title},'type':{'const':'urn:wheelwright:problem:'+code.lower()}}}]}
   response['headers']=copy.deepcopy(op['responses']['200']['headers'])
   if status==401:response['headers']['WWW-Authenticate']={'required':True,'schema':{'const':'Bearer'}}
module['x-implementation-handoff']='docs/discovery/api-v2-full-implementation-handoff-2026-10-21.md'
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
