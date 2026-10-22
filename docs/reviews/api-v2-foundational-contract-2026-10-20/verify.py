#!/usr/bin/env python3
"""Read-only candidate contract/oracle checks, not application implementation or independent acceptance.
Run with the pinned validation requirements. Emits results to stdout; never writes or calls a broker.
"""
import copy,json,sys,unittest
from pathlib import Path
from fractions import Fraction as F
from uuid import UUID
from urllib.parse import urlsplit,parse_qs
import jsonschema
from openapi_spec_validator import validate
HERE=Path(__file__).resolve().parent
SPEC=json.loads((HERE/'openapi.json').read_text());B=json.loads((HERE/'examples/resources.json').read_text())
R=B['resources'];N=B['names'];S=SPEC['components']['schemas']
FORMAT=jsonschema.FormatChecker()
def check(schema,value):
 jsonschema.Draft202012Validator({'$ref':'#/components/schemas/'+schema,'components':SPEC['components']},format_checker=FORMAT).validate(value)
def resource(name):return R[N[name]]['value']
def leaves(n):
 if n['kind']=='GROUP':
  return [x for child in n['children'] for x in leaves(child)]
 return [n]
def all_nodes(n):
 return [n]+([x for c in n['children'] for x in all_nodes(c)] if n['kind']=='GROUP' else [])
def links(value):
 if isinstance(value,dict):
  if set(value)=={'href'}:yield value['href']
  for x in value.values():yield from links(x)
 elif isinstance(value,list):
  for x in value:yield from links(x)
def q(v):
 return F(v) if isinstance(v,str) else F(int(v['numerator']),int(v['denominator']))
def source_scope(href):
 if href in R:return R[href]['value'].get('account',{}).get('href')
 match=next((x for x in B['externalReferences'] if x['href']==href),None)
 if match:return match['account']
 if href.startswith('https://example.invalid/'):return None
 path=urlsplit(href).path
 if path.endswith('/inventory-reconciliation'):return path.rsplit('/',1)[0]
 if path=='/v2/orders':return None # Filter result still has object-level checks, handled on each returned resource.
 raise ValueError('Unresolved fixture link '+href)
def graph_scope(value,allowed):
 # Independent offline policy oracle; this is NOT evidence that an HTTP server enforces grants.
 for href in links(value):
  account=source_scope(href)
  if account and account not in allowed:raise ValueError('Unauthorized cross-Account link')
def closure(before,after):
 if before['id']!=after['id']:raise ValueError('Not a transition of one resource')
 if before['state']=='CLOSED' and after['state']!='CLOSED':raise ValueError('CLOSED is terminal')
def immutable(before,after):
 if before!=after:raise ValueError('Immutable resource changed')
def recognition(c,model):
 flat=leaves(c['composition']);by={x['nodeId']:x for x in flat}
 if len(by)!=len(flat):raise ValueError('Duplicate node')
 for role in model['roles']:
  if role['name'] not in by:raise ValueError('Missing role')
  x=by[role['name']]
  if x['kind']!=role['kind'] or role['side']!='ANY' and x['side']!=role['side']:raise ValueError('Wrong role type/side')
  if x['kind']=='OPTION' and (x['terms'] is None or x['terms']['right']!=role['optionRight']):raise ValueError('Unknown/wrong contract')
 # Reference oracle for the declared finite standard models. No claim of a production recognizer.
 for t in model['constraints']:
  xs=[by[n] for n in t['roles']];opts=[x['terms'] for x in xs if x['kind']=='OPTION']
  k=t['kind']
  if k=='SAME_ACCOUNT' and len({x['allocation']['inventory']['account']['href'] for x in xs})>1:raise ValueError(k)
  if k=='SAME_CURRENCY' and (len({x['currency'] for x in xs})>1 or any(x['kind']=='OPTION' and x['terms']['currency']!=x['currency'] for x in xs)):raise ValueError(k)
  if k=='SAME_UNDERLYING' and len({x['underlying']['href'] for x in opts})>1:raise ValueError(k)
  if k=='SAME_EXPIRATION' and len({x['expiration'] for x in opts})>1:raise ValueError(k)
  if k=='COMPATIBLE_MULTIPLIERS' and len({x['multiplier'] for x in opts})>1:raise ValueError(k)
  if k=='COMPATIBLE_DELIVERABLES' and len({json.dumps([x['settlement'],x['adjustment'],x['deliverable']],sort_keys=True) for x in opts})>1:raise ValueError(k)
  if k=='UNEQUAL_WING_WIDTHS' and len(opts)==3 and F(opts[1]['strike'])-F(opts[0]['strike'])==F(opts[2]['strike'])-F(opts[1]['strike']):raise ValueError(k)
  if k=='STRIKE_ORDER' and not all(F(a['strike'])<F(b['strike']) for a,b in zip(opts,opts[1:])):raise ValueError(k)
  if k=='EVIDENCED_COVERAGE':
   shares,call=xs
   required=F(call['quantity'])*F(call['terms']['multiplier'])*F(call['terms']['strike']) if shares['kind']=='CASH' else F(call['quantity'])*F(call['terms']['deliverable'][0]['quantity'])
   if F(shares['quantity'])<required:raise ValueError(k)
   if not any(r['kind']=='ECONOMIC_COVERAGE' and r['status']=='ESTABLISHED' and r['evidence'] for r in c['relationships']):raise ValueError('Coverage authority missing')
  if k=='COORDINATED_OPENING':
   facts=json.loads((HERE/'examples/evidence-facts.json').read_text())['facts'];claim=c['recognition']['authority'];record=facts.get(claim['claimId'],{})
   if not (record.get('predicate')=='COMPOSITION_MEMBERSHIP' and record.get('coordinatedOpening') is True and claim['basis'] in ['BROKER_PACKAGE_RECORD','RECONCILED_DOCUMENTED_ACTIVITY']):raise ValueError(k)
  if k=='EVIDENCED_MEMBERSHIP' and not c['recognition']['evidence']:raise ValueError(k)
 optionroles=[r for r in model['roles'] if r['kind']=='OPTION']
 if len(optionroles)>1 and len({F(by[r['name']]['quantity'])/F(r['ratio']) for r in optionroles})!=1:raise ValueError('ROLE_RATIO')
def intrinsic(c,spot):
 xs=leaves(c['composition']);opts=[x for x in xs if x['kind']=='OPTION']
 if len({x['currency'] for x in xs})>1 or any(x['terms']['currency']!=x['currency'] for x in opts):raise ValueError('Mixed currency needs explicit conversion')
 if len({x['terms']['expiration'] for x in opts})>1:raise ValueError('Mixed horizon')
 value=F(0)
 for x in xs:
  sign=1 if x['side']=='LONG' else -1;size=F(x['quantity'])
  if x['kind']=='CASH':gross=size
  elif x['kind']=='LONG_SHARES':gross=size*spot
  else:
   t=x['terms']
   if t['payoffApplicability']!='STANDARD_EQUITY_INTRINSIC' or t['adjustment']!='STANDARD' or t['settlement']!='PHYSICAL' or len(t['deliverable'])!=1 or F(t['deliverable'][0]['quantity'])!=F(t['multiplier']):raise ValueError('Adjusted/unsupported payoff')
   gross=size*F(t['multiplier'])*max((spot-F(t['strike']))*(1 if t['right']=='CALL' else -1),F(0))
  basis=x['allocation']['basis']
  if basis['status'] not in ['ESTABLISHED','QUALIFIED']:raise ValueError('Unknown basis')
  value+=sign*(gross-F(basis['value']))
 return value

def conservation(constructions):
 totals={};limits={}
 for c in constructions:
  for x in leaves(c['composition']):
   a=x['allocation'];i=a['inventory'];key=(i['account']['href'],i['key'],i['side'],i['unit'],i['currency'])
   if F(x['quantity'])!=F(a['quantity']):raise ValueError('Allocation/constituent discrepancy')
   limits.setdefault(key,F(i['quantity']))
   if limits[key]!=F(i['quantity']):raise ValueError('Conflicting source cuts')
   totals[key]=totals.get(key,F(0))+F(a['quantity'])
 if any(totals[k]>limits[k] for k in totals):raise ValueError('Account inventory overallocated')
 return totals

def predecessor_graph(resources):
 for href,item in resources.items():
  if item['schema']!='Construction':continue
  seen=set();cur=item['value']
  while cur.get('predecessor'):
   if cur['self']['href'] in seen:raise ValueError('Predecessor cycle')
   seen.add(cur['self']['href']);prev=resources[cur['predecessor']['href']]['value']
   if prev['account']!=cur['account'] or prev['position']!=cur['position']:raise ValueError('Predecessor scope mismatch')
   cur=prev

def projection(p,mode):
 if mode=='uri':return {'self':p['self']}
 if mode=='summary':return {k:copy.deepcopy(v) for k,v in p.items() if k in S['PositionSummary']['properties']}
 return copy.deepcopy(p)
def qualification_complete(p):
 codes=set()
 def walk(v):
  if isinstance(v,dict):
   codes.update(v.get('warningCodes',[]))
   for x in v.values():walk(x)
  elif isinstance(v,list):
   for x in v:walk(x)
 walk(p.get('evaluation',{}))
 if not codes.issubset({w['code'] for w in p.get('warnings',[])}):raise ValueError('Projection dropped warning')

class CandidateTests(unittest.TestCase):
 def test_openapi_and_all_local_schema_definitions(self):
  validate(SPEC,base_uri=(HERE/'openapi.json').as_uri())
  for schema in S.values():jsonschema.Draft202012Validator.check_schema(schema)
 def test_every_example_resource_and_embedded_response(self):
  for href,r in R.items():
   with self.subTest(href=href):check(r['schema'],r['value'])
  check('InventoryReconciliation',B['inventoryReconciliation'])
  for w in B['warningExamples']:check('Warning',w)
  for item in SPEC['paths'].values():
   if '$ref' in item:continue
   for op in item.values():
    media=op['responses']['200']['content']['application/json'];schema=media['schema']
    for ex in media.get('examples',{}).values():jsonschema.Draft202012Validator({**schema,'components':SPEC['components']},format_checker=FORMAT).validate(ex['value'])
    if 'example' in media:jsonschema.Draft202012Validator({**schema,'components':SPEC['components']},format_checker=FORMAT).validate(media['example'])
 def test_guid_identity_repeated_series_closed_reopened(self):
  old,new=resource('closed'),resource('reopened');UUID(old['id']);UUID(new['id'])
  self.assertNotEqual(old['id'],new['id']);self.assertEqual(old['sourceIdentifiers'],new['sourceIdentifiers'])
  p=[r['value']['id'] for r in R.values() if r['schema']=='Position'];self.assertEqual(len(p),len(set(p)))
 def test_terminal_closure_no_resurrection(self):
  old=resource('closed');bad=copy.deepcopy(old);bad['state']='OPEN'
  with self.assertRaises(ValueError):closure(old,bad)
  closure(old,copy.deepcopy(old))
 def test_immutable_construction_and_model_version(self):
  for n in ['cc-current','model-COVERED_CALL']:
   old=resource(n);immutable(old,copy.deepcopy(old));bad=copy.deepcopy(old);bad['createdAt']='2026-10-21T00:00:00Z'
   with self.assertRaises(ValueError):immutable(old,bad)
  for r in R.values():
   if r['schema']=='Construction' and r['value']['recognition']['status']=='VALIDATED':
    h=r['value']['recognition']['modelVersion']['href'];self.assertIn('/versions/',h);self.assertEqual(R[h]['schema'],'ModelVersion')
 def test_predecessor_scope_and_cycle(self):
  predecessor_graph(R);bad=copy.deepcopy(R);h=N['cc-prior'];bad[h]['value']['predecessor']={'href':N['cc-current']}
  with self.assertRaises(ValueError):predecessor_graph(bad)
 def test_unclassified_retains_evaluable_constituents(self):
  c=resource('unclassified-composition');self.assertEqual(c['recognition']['status'],'UNCLASSIFIED');self.assertIsNone(c['recognition']['modelVersion']);self.assertEqual(len(leaves(c['composition'])),2);self.assertIsInstance(intrinsic(c,F(100)),F)
 def test_multiplier_deliverable_rejection(self):
  c=resource('bwb');m=resource('model-CALL_BROKEN_WING_BUTTERFLY');recognition(c,m)
  for field,value in [('multiplier','150'),('deliverable',[{'kind':'SHARES','instrument':{'href':N['underlying']},'quantity':'150','currency':None}])]:
   bad=copy.deepcopy(c);leaves(bad['composition'])[-1]['terms'][field]=value
   with self.assertRaises(ValueError):recognition(bad,m)
 def test_adjusted_deliverable_and_mixed_expiration_no_false_geometry(self):
  for field,value in [('expiration','2027-01-15'),('adjustment','ADJUSTED')]:
   c=copy.deepcopy(resource('bwb'));leaves(c['composition'])[-1]['terms'][field]=value
   with self.assertRaises(ValueError):intrinsic(c,F(100))
 def test_mixed_currency_not_summed_or_named(self):
  c=copy.deepcopy(resource('bwb'));leaves(c['composition'])[-1]['currency']='EUR'
  with self.assertRaises(ValueError):recognition(c,resource('model-CALL_BROKEN_WING_BUTTERFLY'))
  with self.assertRaises(ValueError):intrinsic(c,F(100))
 def test_reverse_jade_lizard_strike_order(self):
  c=copy.deepcopy(resource('bwb'));ls=leaves(c['composition']);ls[0]['nodeId']='LP';ls[0]['terms']['right']='PUT';ls[1]['nodeId']='SP';ls[1]['side']='SHORT';ls[1]['quantity']='1';ls[1]['terms']['right']='PUT';ls[2]['nodeId']='SC';ls[2]['side']='SHORT'
  m=resource('model-REVERSE_JADE_LIZARD');recognition(c,m);ls[2]['terms']['strike']='80'
  with self.assertRaises(ValueError):recognition(c,m)
 def test_broken_wing_exact_affine_values_and_unequal_tails(self):
  c=resource('bwb');g=resource('broken-wing')['evaluation']['payoff']['geometry']
  for seg in g['segments']:
   lo,hi=q(seg['lower']),None if seg['upper'] is None else q(seg['upper'])
   for spot in [lo,lo+F(1,100),lo+1] if hi is None else [lo,(lo+hi)/2,hi]:self.assertEqual(intrinsic(c,spot),q(seg['slope'])*spot+q(seg['intercept']))
  for b in g['boundaries']:self.assertEqual(intrinsic(c,q(b['price'])),q(b['value']))
  self.assertEqual(intrinsic(c,F(80)),-700);self.assertEqual(intrinsic(c,F(100)),300);self.assertEqual(intrinsic(c,F(130)),-1700)
  self.assertEqual(intrinsic(c,F(97)),0);self.assertEqual(intrinsic(c,F(103)),0)
 def test_covered_call_exact_geometry(self):
  c=resource('cc-current');recognition(c,resource('model-COVERED_CALL'))
  for s,v in [(0,-9300),(93,0),(100,700),(150,700)]:self.assertEqual(intrinsic(c,F(s)),v)
 def test_account_wide_overallocation_fails_not_only_tree_local(self):
  roots=[resource('cc-current'),resource('shares-residual')];conservation(roots)
  bad=copy.deepcopy(roots);x=leaves(bad[1]['composition'])[0];x['quantity']='151';x['allocation']['quantity']='151'
  # Each still fits its source individually, but their aggregate fails.
  for c in bad:conservation([c])
  with self.assertRaises(ValueError):conservation(bad)
 def test_cash_partition_and_residual_not_available(self):
  cs=[resource('construction-'+n) for n in ['cash-free','cash-allocated-b','cash-allocated-c']];totals=conservation(cs);self.assertEqual(list(totals.values()),[F(20000)])
  self.assertTrue(all(x['allocation']['availability']=='UNKNOWN' for c in cs for x in leaves(c['composition'])))
 def test_missing_historical_quote_preserved(self):
  p=resource('incomplete-evidence');x=p['evaluation']['historicalMarketValue'];self.assertIsNone(x['value']);self.assertEqual(x['asOf'],'2026-09-01T20:00:00Z');self.assertIn('HISTORICAL_OPTION_QUOTE_MISSING',x['warningCodes'])
 def test_working_order_without_fill_never_changes_composition(self):
  c=copy.deepcopy(resource('cc-current'));o=resource('working-order');self.assertEqual(o['status'],'WORKING');self.assertEqual(o['legs'][0]['filledQuantity']['value'],'0');self.assertEqual(o['legs'][0]['fills'],[]);self.assertEqual(c,resource('cc-current'))
  # This checks representation separation, not behavior of an unimplemented synchronization service.
  self.assertNotIn('heldQuantity',S['Order']['properties']);self.assertNotIn('post',SPEC['paths']['/v2/orders'])
 def test_missing_opening_credit_is_null_not_order_limit(self):
  p=resource('incomplete-evidence');self.assertIsNone(p['evaluation']['openingCashFlow']['value']);self.assertIsNone(p['evaluation']['grossUnrealizedPl']['value']);qualification_complete(p)
 def test_projections_preserve_financial_qualifications(self):
  p=resource('incomplete-evidence')
  for mode in ['uri','summary','expanded']:
   x=projection(p,mode);check({'uri':'ResourceURI','summary':'PositionSummary','expanded':'Position'}[mode],x)
   if mode!='uri':qualification_complete(x)
   check('PositionCollection',{'projection':mode,'items':[x],'next':None,'warnings':[]})
  bad=projection(p,'summary');bad['warnings']=[]
  with self.assertRaises(ValueError):qualification_complete(bad)
 def test_unauthorized_cross_account_historical_and_source_links(self):
  a=resource('covered-call')['account']['href'];graph_scope(resource('covered-call'),{a})
  for field in ['currentConstruction','audit']:
   bad=copy.deepcopy(resource('covered-call'));bad[field]={'href':B['externalReferences'][1]['href']}
   with self.assertRaises(ValueError):graph_scope(bad,{a})
  bad=copy.deepcopy(resource('covered-call'));bad['evaluation']['openingCashFlow']['evidence']=[copy.deepcopy(resource('cc-current')['evidence'][0])];bad['evaluation']['openingCashFlow']['evidence'][0]['artifact']={'href':B['externalReferences'][1]['href']}
  with self.assertRaises(ValueError):graph_scope(bad,{a})
 def test_all_graph_links_resolve_and_scopes_are_explicit(self):
  a=resource('covered-call')['account']['href']
  for r in R.values():graph_scope(r['value'],{a})
 def test_schema_refuses_false_precision_and_unknown_types(self):
  m=copy.deepcopy(resource('incomplete-evidence')['evaluation']['openingCashFlow']);m['value']='0'
  with self.assertRaises(jsonschema.ValidationError):check('Metric',m)
  c=copy.deepcopy(resource('cc-current'));c['recognition']['modelVersion']=None
  with self.assertRaises(jsonschema.ValidationError):check('Construction',c)
 def test_replay_evaluations_and_conflict_examples_are_typed(self):
  data=json.loads((HERE/'examples/tt-live-equivalence.json').read_text())
  for x in data['positions']:check('Evaluation',x['evaluation'])
  check('Construction',B['incompatibleConstruction']);check('InventoryReconciliation',B['overallocatedReconciliation'])
  self.assertEqual(B['incompatibleConstruction']['recognition']['status'],'INCOMPATIBLE')
  self.assertEqual(B['overallocatedReconciliation']['balances'][0]['residual'],'-50')
 def test_closed_position_has_evidenced_empty_current_composition(self):
  p=resource('closed');c=R[p['currentConstruction']['href']]['value']
  self.assertEqual(leaves(c['composition']),[]);self.assertEqual(p['stateEvidence']['completeness'],'SCOPED_ACCEPTED')
  self.assertGreater(resource('reopened')['stateEvidence']['establishedAt'],p['stateEvidence']['establishedAt'])
 def test_exact_rational_coordinates_and_no_binary_numbers(self):
  check('ExactNumber',{'numerator':'1','denominator':'3'})
  with self.assertRaises(jsonschema.ValidationError):check('ExactNumber',{'numerator':'1','denominator':'0'})
  with self.assertRaises(jsonschema.ValidationError):check('Metric',{**resource('covered-call')['evaluation']['openingCashFlow'],'value':1.2})
 def test_recursive_subconstruction_and_duplicate_ownership(self):
  c=copy.deepcopy(resource('cc-current'));xs=c['composition']['children'];c['composition']['children']=[{'kind':'GROUP','nodeId':'SUB','modelVersion':None,'children':xs}]
  check('Construction',c);self.assertEqual(intrinsic(c,F(100)),700)
  c['composition']['children'].append(copy.deepcopy(xs[0]))
  with self.assertRaises(ValueError):conservation([c,resource('shares-residual')])
 def test_source_manifest_and_json_pointer_witnesses(self):
  facts=json.loads((HERE/'examples/evidence-facts.json').read_text())['facts']
  def walk(v):
   if isinstance(v,dict):
    if v.get('kind')=='ACCOUNT_SOURCE' and v.get('locator',{}).get('value','').startswith('/facts/'):
     self.assertIn(v['locator']['value'].split('/')[-1],facts)
    for x in v.values():walk(x)
   elif isinstance(v,list):
    for x in v:walk(x)
  walk(B)
 def test_coverage_matrix_paths_and_candidate_fields(self):
  import re
  repo=HERE.parents[2];data=json.loads((HERE/'source-coverage.json').read_text())
  allowed={'ALREADY_SUPPORTED','BROKER_AVAILABLE_V2_MISSING','BACKEND_DERIVATION_NEEDED','SOURCE_UNAVAILABLE_OR_UNVERIFIED','DOMAIN_MODEL_GAP'}
  for row in data['rows']:
   self.assertTrue(set(row['classification'])<=allowed);self.assertTrue(row['faithfullyRepresentable'])
   for citation in row['evidence']:
    path,span=citation.rsplit(':',1);first,last=map(int,span.split('-')) if '-' in span else (int(span),int(span))
    if (repo/path).exists():text=(repo/path).read_text()
    else:
     # Historical working-source citations remain pinned after an alpha handler is retired.
     import subprocess
     text=subprocess.run(['git','show',data['baseMain']+':'+path],cwd=repo,check=True,capture_output=True,text=True).stdout
    n=len(text.splitlines());self.assertTrue(1<=first<=last<=n,citation)
 def test_missing_partial_terms_preserve_known_expiry_without_payoff(self):
  terms=copy.deepcopy(leaves(resource('cc-current')['composition'])[-1]['terms']);terms.update(multiplier=None,payoffApplicability='UNKNOWN',qualification='INCOMPLETE')
  check('OptionTerms',terms);self.assertEqual(terms['expiration'],'2026-11-20');self.assertEqual(terms['strike'],'100')
 def test_fractional_contracts_and_unqualified_discretionary_basis_fail(self):
  leaf=copy.deepcopy(leaves(resource('bwb')['composition'])[0]);leaf['quantity']='0.5'
  with self.assertRaises(jsonschema.ValidationError):check('OptionLeaf',leaf)
  a=copy.deepcopy(leaf['allocation']);a['basisMethod']='EXPLICIT_ASSUMPTION'
  with self.assertRaises(jsonschema.ValidationError):check('Allocation',a)
  a['basis']['status']='QUALIFIED';a['basis']['assumptions']=['Synthetic explicit allocation method, not established tax lots'];check('Allocation',a)
 def test_reported_pl_is_not_promoted_to_gross(self):
  ev=resource('incomplete-evidence')['evaluation'];self.assertEqual(ev['brokerReportedOpenPl']['value'],'123.45');self.assertEqual(ev['brokerReportedOpenPl']['origin'],'BROKER_REPORTED');self.assertEqual(ev['brokerReportedOpenPl']['status'],'QUALIFIED');self.assertIsNone(ev['grossUnrealizedPl']['value'])
 def test_cash_and_nonoption_dte_not_applicable_not_missing(self):
  for n in ['cash-free','cash-allocated-b','cash-allocated-c','shares-partition','closed']:
   ev=resource(n)['evaluation'];self.assertIsNone(ev['timeline']['expiration']);self.assertEqual(ev['timeline']['remainingDays']['status'],'NOT_APPLICABLE')
  self.assertEqual(resource('cash-allocated-b')['evaluation']['marketValue']['value'],'5000')
  self.assertEqual(resource('working-order')['stopTrigger']['status'],'NOT_APPLICABLE')
 def test_new_routes_are_get_only_and_no_optional_roots(self):
  for p,item in SPEC['paths'].items():
   if '$ref' not in item:self.assertEqual(set(item),{'get'})
  for p in ['/v2/portfolios','/v2/executions','/v2/evaluations','/v2/imports']:self.assertNotIn(p,SPEC['paths'])


def association_proven(authority,predicate,subjects):
 facts=json.loads((HERE/'examples/evidence-facts.json').read_text())['facts']
 if authority['status']!='ESTABLISHED':return False
 permitted={'ORDER_TARGET':{'BROKER_EXPLICIT_ORDER_LINK','RECONCILED_DOCUMENTED_ACTIVITY'},'COMPOSITION_MEMBERSHIP':{'BROKER_PACKAGE_RECORD','RECONCILED_DOCUMENTED_ACTIVITY'},'AGGREGATE_COVERAGE':{'AGGREGATE_ECONOMIC_CALCULATION'},'BROKER_RESERVATION':{'BROKER_RESERVATION_RECORD'}}
 if authority['basis'] not in permitted.get(predicate,set()):return False
 for e in authority['evidence']:
  if e.get('kind')!='ACCOUNT_SOURCE':continue
  f=facts.get(e['recordKey'],{})
  if f.get('predicate')==predicate and f.get('account')==authority['account']['href'] and set(subjects)<=set(f.get('subjects',[])):return True
 return False

def redact_position(p,grants):
 # Candidate-only reference oracle. No server, no operational authorization claim.
 x=copy.deepcopy(p);has_orders='account.orders.read' in grants
 original_timeline=p['evaluation']['timeline'];opening_sources=original_timeline.get('openingEvidence',[])
 independent_opening=bool(opening_sources) and original_timeline.get('openingAccess')=='VISIBLE' and 'ORDER_EVIDENCE' not in original_timeline['originalDays'].get('dependencies',[]) and all(e.get('kind')=='ACCOUNT_SOURCE' and e.get('requiredCapability','').split(':')[0] in grants for e in opening_sources)
 def visit(v):
  if isinstance(v,list):return [visit(z) for z in v]
  if not isinstance(v,dict):return v
  if v.get('kind')=='ACCOUNT_SOURCE' and v['requiredCapability'].split(':')[0] not in grants:return {'kind':'REDACTED','reason':'INSUFFICIENT_PERMISSION'}
  if 'dependencies' in v and 'value' in v and 'ORDER_EVIDENCE' in v['dependencies'] and not has_orders:
   v.update(value=None,asOf=None,status='REDACTED',origin='UNKNOWN',method='ACCESS_RESTRICTED',evidence=[],assumptions=[],dependencies=[],warningCodes=['ACCESS_RESTRICTED']);return v
  return {k:visit(z) for k,z in v.items()}
 x=visit(x)
 if not has_orders:
  x['orders']=None
  tl=x['evaluation']['timeline']
  if not independent_opening:tl['openedAt']=None;tl['openingEvidence']=[];tl['openingAccess']='REDACTED'
  if not independent_opening:tl['originalDays'].update(value=None,asOf=None,status='REDACTED',origin='UNKNOWN',method='ACCESS_RESTRICTED',evidence=[],assumptions=[],dependencies=[],warningCodes=['ACCESS_RESTRICTED'])
  if 'included' in x:x['included']['orders']=[]
  if x['evaluation']['openingCashFlow']['status']=='REDACTED':x['evaluation']['payoff'].update(status='REDACTED',geometry=None,evidence=[],assumptions=[],warningCodes=['ACCESS_RESTRICTED'])
  mg=x['evaluation']['management'];mg.update(access='REDACTED',orders=[],manualCheckpoint=None,protectiveOrderEvidence='UNKNOWN',associationStatus='UNAVAILABLE',evidence=[])
  for k in ['profitTargetGrossPl','reportedStopThresholdGrossPl']:
   mg[k].update(value=None,asOf=None,status='REDACTED',origin='UNKNOWN',method='ACCESS_RESTRICTED',evidence=[],assumptions=[],dependencies=[],warningCodes=['ACCESS_RESTRICTED'])
  x['warnings'].append({'code':'ACCESS_RESTRICTED','affected':['/orders','/evaluation/management'],'establishedFacts':['Authorized held inventory remains inspectable'],'incompleteConclusions':['Restricted Order-derived management terms are unavailable'],'evidence':[],'remediation':[]})
 return x

class CorrectionTests(unittest.TestCase):
 def test_symmetric_butterfly_not_broken_wing(self):
  c=copy.deepcopy(resource('bwb'));leaves(c['composition'])[-1]['terms']['strike']='110'
  with self.assertRaisesRegex(ValueError,'UNEQUAL_WING_WIDTHS'):recognition(c,resource('model-CALL_BROKEN_WING_BUTTERFLY'))
  self.assertIsInstance(intrinsic(c,F(100)),F) # Generic economics still computable.
 def test_global_conflict_qualifies_each_affected_position(self):
  x=B['overallocatedScenario'];check('InventoryReconciliation',x['reconciliation'])
  for r in x['positions']:
   check('Position',r);self.assertEqual(r['allocation']['status'],'CONFLICT');self.assertIsNone(r['evaluation']['grossUnrealizedPl']['value']);self.assertIsNone(r['evaluation']['payoff']['geometry'])
  with self.assertRaises(ValueError):conservation(x['constructions'])
 def test_aggregate_coverage_no_double_count_or_reservation(self):
  x=B['insufficientCoverage'];check('CoverageAssessment',x);self.assertLess(F(x['eligibleQuantity']),F(x['requiredQuantity']));self.assertEqual(x['status'],'INSUFFICIENT');self.assertEqual(x['reservationStatus'],'NOT_ESTABLISHED');self.assertEqual(x['selection'],'AGGREGATE_FUNGIBLE_NO_SPECIFIC_SHARE_SELECTION')
  for c in [resource('cc-current'),resource('shares-residual')]:
   for r in c['relationships']:self.assertIn('supportHolding',r)
 def test_holding_observation_cannot_prove_order_association(self):
  a=copy.deepcopy(resource('working-order')['associations'][0]['authority']);self.assertTrue(association_proven(a,'ORDER_TARGET',[resource('working-order')['associations'][0]['target']['href']]))
  a['basis']='BROKER_HOLDING_OBSERVATION';self.assertFalse(association_proven(a,'ORDER_TARGET',[resource('working-order')['associations'][0]['target']['href']]))
 def test_typed_source_pointer_is_not_relationship_proof(self):
  a=copy.deepcopy(resource('cc-current')['recognition']['authority']);self.assertEqual(a['basis'],'BROKER_HOLDING_OBSERVATION');self.assertFalse(association_proven(a,'COMPOSITION_MEMBERSHIP',[N['cc-current']]))
  a['evidence']=[copy.deepcopy(resource('cc-current')['evidence'][0])];self.assertFalse(association_proven(a,'COMPOSITION_MEMBERSHIP',[N['cc-current']]))
  a=copy.deepcopy(resource('cc-current')['recognition']['authority']);a['account']={'href':'/v2/accounts/other'};self.assertFalse(association_proven(a,'COMPOSITION_MEMBERSHIP',[N['cc-current']]))
 def test_broker_holding_independent_of_recognition(self):
  holdings=[r['value'] for r in R.values() if r['schema']=='BrokerHolding'];self.assertTrue(holdings)
  for h in holdings:check('BrokerHolding',h);self.assertNotIn('position',h);self.assertNotIn('construction',h)
  c=resource('unclassified-composition')
  for x in leaves(c['composition']):self.assertEqual(R[x['allocation']['holding']['href']]['schema'],'BrokerHolding')
  h=next(x for x in holdings if x['reportedMarketValue']['value'] is not None);self.assertEqual(h['reportedOpenPl']['origin'],'BROKER_REPORTED');self.assertEqual(h['reportedCapitalRequirement']['value'],'2500')
 def test_shared_instrument_refuses_private_account_provenance(self):
  x=copy.deepcopy(resource('call100'));check('Instrument',x);x['evidence']=[resource('cc-current')['evidence'][0]]
  with self.assertRaises(jsonschema.ValidationError):check('Instrument',x)
 def test_same_account_position_permission_does_not_grant_order_details(self):
  x=redact_position(resource('covered-call'),{'account.positions.read'});check('Position',x);self.assertIsNone(x['orders']);self.assertEqual(x['evaluation']['management']['access'],'REDACTED');qualification_complete(x)
  encoded=json.dumps(x);self.assertNotIn(N['working-order'],encoded);self.assertNotIn('targetOrder',encoded)
  for mode in ['summary','expanded']:
   y=projection(x,mode);check('PositionSummary' if mode=='summary' else 'Position',y);qualification_complete(y)
 def test_order_derived_value_is_redacted_not_merely_link_removed(self):
  x=copy.deepcopy(resource('covered-call'));x['evaluation']['openingCashFlow']['dependencies']=['ORDER_EVIDENCE'];x=redact_position(x,{'account.positions.read'})
  self.assertIsNone(x['evaluation']['openingCashFlow']['value']);self.assertEqual(x['evaluation']['openingCashFlow']['status'],'REDACTED');check('Position',x)
 def test_unclassified_generic_geometry_and_incomplete_cost(self):
  c=resource('unclassified-composition');p=resource('unclassified');g=p['evaluation']['payoff']['geometry'];self.assertIsNotNone(g)
  for seg in g['segments']:
   lo=q(seg['lower']);hi=None if seg['upper'] is None else q(seg['upper']);spot=lo+1 if hi is None else (lo+hi)/2;self.assertEqual(intrinsic(c,spot),q(seg['slope'])*spot+q(seg['intercept']))
  p=resource('incomplete-evidence');self.assertIsNone(p['evaluation']['openingCashFlow']['value']);self.assertIsNone(p['evaluation']['payoff']['geometry'])
 def test_history_extensions_are_typed(self):
  x=json.loads((HERE/'examples/economic-history.json').read_text())
  for e in x['comparisons'].values():check('EconomicComparison',e)
  ev=copy.deepcopy(resource('covered-call')['evaluation']);ev['economicComparison']=x['comparisons']['covered-call-ten-rolls'];check('Evaluation',ev)
 def test_credit_and_debit_signs_net_and_realized_separate(self):
  x=json.loads((HERE/'examples/economic-history.json').read_text())
  for r in x['workedEconomics']:
   for k in ['openingCashFlow','estimatedClosingCashFlow','fees','grossUnrealizedPl','netUnrealizedPl','realizedGrossPl','realizedNetPl']:check('Metric',r[k])
   gross=F(r['openingCashFlow']['value'])+F(r['estimatedClosingCashFlow']['value']);self.assertEqual(gross,F(r['grossUnrealizedPl']['value']));self.assertEqual(gross-F(r['fees']['value']),F(r['netUnrealizedPl']['value']));self.assertIsNone(r['realizedGrossPl']['value'])
  cases={r['name']:r for r in x['workedEconomics']};self.assertEqual(cases['long-leaps-call']['grossUnrealizedPl']['value'],'500');self.assertEqual(cases['debit-broken-wing-butterfly']['grossUnrealizedPl']['value'],'-200')
 def test_covered_call_ten_rolls_cumulative_not_tax_basis(self):
  e=json.loads((HERE/'examples/economic-history.json').read_text())['comparisons']['covered-call-ten-rolls'];c=e['cumulative'];events=c['events'];self.assertEqual(len(events),11)
  openings=sum(F(x['openingCashFlow']['value']) for x in events);closes=sum(F(x['closingCashFlow']['value']) for x in events);fees=sum(F(x['fee']['value']) for x in events)
  self.assertEqual(openings,2250);self.assertEqual(closes,-800);self.assertEqual(fees,22);self.assertEqual(openings+closes-fees,F(c['netDocumentedOptionCashFlow']['value']));self.assertEqual(F(c['realizedNetPl']['value']),1180)
  self.assertEqual((F(e['original']['shareAcquisitionBasis']['value'])-F(c['netDocumentedOptionCashFlow']['value']))/100,F(c['economicBreakevenPerShare']['value']));self.assertEqual(c['brokerTaxBasis']['value'],'10000')
 def test_replaced_put_protection_not_current_and_leaps_not_shares(self):
  x=json.loads((HERE/'examples/economic-history.json').read_text())['comparisons'];p=x['successive-protective-puts'];self.assertEqual(p['original']['protectionStatus'],'HISTORICAL_ONLY');self.assertEqual(p['current']['protectionStatus'],'CURRENT_CONTRACTUAL')
  for e in [p['original'],p['current']]:self.assertEqual(F(e['protectionStrike']['value'])*100+F(e['openingCashFlow']['value']),F(e['lossFloorGrossPl']['value']))
  for e in [x['leaps-maturity']['original'],x['leaps-maturity']['current']]:self.assertEqual(e['rights'],'RIGHT_TO_BUY_SHARES');self.assertEqual(e['shareAcquisitionBasis']['status'],'NOT_APPLICABLE')

class FurtherCorrectionTests(unittest.TestCase):
 def test_supported_named_examples_and_exact_economics(self):
  for n in ['cash-secured-put','buy-write','iron-condor']:
   c=resource(n+'-construction');recognition(c,resource('model-'+n));conservation([c]);check('Construction',c)
  self.assertEqual(intrinsic(resource('iron-condor-construction'),F(100)),200);self.assertEqual(intrinsic(resource('iron-condor-construction'),F(80)),-300)
  self.assertEqual(intrinsic(resource('buy-write-construction'),F(100)),200)
  # Securing cash is retained principal, not an option opening debit. Subtract cash principal for P/L.
  self.assertEqual(intrinsic(resource('cash-secured-put-construction'),F(100)),200)
 def test_expanded_replay_evaluations_have_schema_and_meaning(self):
  x=json.loads((HERE/'examples/tt-live-expanded-parity.json').read_text())
  for row in x['positions']:
   e=row['evaluation'];check('Evaluation',e);self.assertEqual(F(e['openingCashFlow']['value'])+F(e['estimatedClosingCashFlow']['value']),F(e['grossUnrealizedPl']['value']))
   segs=e['payoff']['geometry']['segments']
   for a,b in zip(segs,segs[1:]):
    self.assertEqual(a['upper'],b['lower']);spot=q(a['upper']);self.assertEqual(q(a['slope'])*spot+q(a['intercept']),q(b['slope'])*spot+q(b['intercept']))
 def test_all_history_references_resolve_immutable_snapshots(self):
  for e in json.loads((HERE/'examples/economic-history.json').read_text())['comparisons'].values():
   old,cur=[R[e[k]['construction']['href']]['value'] for k in ['original','current']];self.assertEqual(old['position'],cur['position']);predecessor_graph(R)
   for ep,c in [(e['original'],old),(e['current'],cur)]:
    actual=sum((1 if x['side']=='SHORT' else -1)*F(x['allocation']['basis']['value']) for x in leaves(c['composition']));self.assertEqual(actual,F(ep['openingCashFlow']['value']))
 def test_order_derived_geometry_and_included_orders_do_not_leak(self):
  x=copy.deepcopy(resource('covered-call'));x['evaluation']['openingCashFlow']['dependencies']=['ORDER_EVIDENCE'];x['included']={'construction':None,'orders':[resource('working-order')],'holdings':[],'modelVersions':[]};y=redact_position(x,{'account.positions.read'});check('Position',y);self.assertIsNone(y['evaluation']['payoff']['geometry']);self.assertEqual(y['included']['orders'],[]);self.assertNotIn(N['working-order'],json.dumps(y))
 def test_negative_fee_and_order_price_rejected(self):
  fee=copy.deepcopy(resource('covered-call')['evaluation']['openingCashFlow']);fee['value']='-1'
  with self.assertRaises(jsonschema.ValidationError):check('FeeMetric',fee)
  with self.assertRaises(jsonschema.ValidationError):check('PriceMetric',fee)
 def test_fill_price_units_prevent_100x_ambiguity(self):
  m=copy.deepcopy(resource('covered-call')['evaluation']['openingCashFlow']);m.update(value='-200',status='QUALIFIED',assumptions=['Synthetic buy-to-open fill, two contracts at 1 USD per underlying unit.'])
  fee=copy.deepcopy(m);fee['value']='2';fill={'sourceId':'synthetic-fill','quantity':'2','price':'1','currency':'USD','executedAt':'2026-10-20T18:00:00Z','evidence':m['evidence'],'priceUnit':'PER_UNDERLYING_UNIT','multiplier':'100','cashFlow':m,'fees':fee};check('Fill',fill);self.assertEqual(-F(fill['quantity'])*F(fill['price'])*F(fill['multiplier']),F(fill['cashFlow']['value']))
  bad=copy.deepcopy(fill);bad.pop('priceUnit')
  with self.assertRaises(jsonschema.ValidationError):check('Fill',bad)
 def test_schema_does_not_claim_to_prove_cross_resource_authority(self):
  c=copy.deepcopy(resource('cc-current'));c['recognition']['authority']['evidence']=[copy.deepcopy(resource('cc-current')['evidence'][0])];check('Construction',c)
  self.assertFalse(association_proven(c['recognition']['authority'],'COMPOSITION_MEMBERSHIP',[c['self']['href']]))

class AllExampleConsistencyTests(unittest.TestCase):
 def test_all_position_conclusions_keep_warnings_and_known_expiry(self):
  for r in R.values():
   if r['schema']!='Position':continue
   p=r['value'];qualification_complete(p);c=R[p['currentConstruction']['href']]['value'];opts=[x for x in leaves(c['composition']) if x['kind']=='OPTION'];exps={x['terms']['expiration'] for x in opts if x['terms']}
   if len(exps)==1:self.assertEqual(p['evaluation']['timeline']['expiration'],next(iter(exps)))
   if p['evaluation']['payoff']['geometry'] is not None:
    self.assertTrue(all(x['allocation']['basis']['value'] is not None for x in leaves(c['composition'])))
 def test_all_option_instrument_labels_match_terms(self):
  for r in R.values():
   if r['schema']=='Instrument' and r['value']['kind']=='OPTION':
    i=r['value'];self.assertIn(i['option']['expiration'],i['symbol']);self.assertIn(i['option']['right'],i['symbol']);self.assertIn(i['option']['strike'],i['symbol'])
 def test_retained_artifact_resolves_specific_claim_witnesses(self):
  import hashlib
  ext=B['externalReferences'][2];raw=json.loads((HERE/ext['localFile']).read_text());self.assertEqual(hashlib.sha256((HERE/ext['localFile']).read_bytes()).hexdigest(),ext['sha256'])
  self.assertEqual(raw['facts'],json.loads((HERE/'examples/evidence-facts.json').read_text())['facts'])

def aggregate_coverage_sufficient(assessments):
 used={};eligible={};seen=set()
 for a in assessments:
  key=(a['supportHolding']['href'],a['unit'],a['currency'])
  if a['id'] in seen:raise ValueError('Repeated coverage claim')
  seen.add(a['id']);n=F(a['eligibleQuantity'])
  if key in eligible and eligible[key]!=n:raise ValueError('Conflicting eligibility')
  eligible[key]=n;used[key]=used.get(key,F(0))+F(a['requiredQuantity'])
 return all(used[k]<=eligible[k] for k in used)

def assert_global_qualification(scenario):
 conflict=False
 try:conservation(scenario['constructions'])
 except ValueError:conflict=True
 if conflict:
  for p in scenario['positions']:
   if p['allocation']['status']!='CONFLICT' or p['evaluation']['grossUnrealizedPl']['value'] is not None:raise ValueError('Global conflict hidden by Position')

class CrossResourceNegativeTests(unittest.TestCase):
 def test_separate_coverage_sets_cannot_reuse_same_eligible_inventory(self):
  a=copy.deepcopy(B['insufficientCoverage']);a.update(requiredQuantity='100',status='SUFFICIENT');b=copy.deepcopy(a);b['id']='another-set';b['obligations']=[{'href':N['reopened']}]
  check('CoverageAssessment',a);check('CoverageAssessment',b);self.assertTrue(aggregate_coverage_sufficient([a]));self.assertFalse(aggregate_coverage_sufficient([a,b]))
 def test_schema_valid_false_reconciled_position_fails_global_oracle(self):
  a=copy.deepcopy(B['overallocatedScenario']);assert_global_qualification(a);a['positions'][0]['allocation']['status']='RECONCILED';check('Position',a['positions'][0])
  with self.assertRaisesRegex(ValueError,'Global conflict hidden'):assert_global_qualification(a)

class PartialHistoryTest(unittest.TestCase):
 def test_missing_history_cannot_claim_lifetime_economics(self):
  x=json.loads((HERE/'examples/economic-history.json').read_text())['incompleteComparison'];check('EconomicComparison',x);self.assertEqual(x['cumulative']['historyStatus'],'PARTIAL');self.assertEqual(x['original']['shareAcquisitionBasis']['value'],'10000')
  for k in ['openingPremiumsReceived','closingCashFlows','fees','netDocumentedOptionCashFlow','economicBreakevenPerShare']:self.assertIsNone(x['cumulative'][k]['value'])

class NamedCoverageNegativeTests(unittest.TestCase):
 def test_cash_secured_put_requires_enough_evidenced_cash(self):
  c=copy.deepcopy(resource('cash-secured-put-construction'));leaves(c['composition'])[-1]['quantity']='9499'
  with self.assertRaisesRegex(ValueError,'EVIDENCED_COVERAGE'):recognition(c,resource('model-cash-secured-put'))
 def test_buy_write_not_merely_any_existing_covered_call(self):
  c=copy.deepcopy(resource('buy-write-construction'));c['recognition']['authority']['claimId']='general'
  with self.assertRaisesRegex(ValueError,'COORDINATED_OPENING'):recognition(c,resource('model-buy-write'))

class NewlyConstructedSchemaProbes(unittest.TestCase):
 pass
for _probe in json.loads((HERE/'examples/newly-constructed-probes.json').read_text())['probes']:
 def _test(self,p=_probe):
  check(p['schema'],p['validControl'])
  with self.assertRaises(jsonschema.ValidationError):check(p['schema'],p['invalidInput'])
 setattr(NewlyConstructedSchemaProbes,'test_'+_probe['id'].replace('-','_'),_test)

if __name__=='__main__':unittest.main(verbosity=2)
