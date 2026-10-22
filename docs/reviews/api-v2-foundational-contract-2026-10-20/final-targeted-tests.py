#!/usr/bin/env python3
"""Seven residual finding falsifiers. Offline author checks, not independent acceptance."""
import copy,json,unittest
from fractions import Fraction as F
from datetime import datetime,date
from urllib.parse import urlsplit,parse_qs
import verify as v
P=v.HERE;B=v.B;R=v.R;S=v.S
SOURCE=json.loads((P/'examples/final-source-fixtures.json').read_text())
def source_result(sc,spot=None):
 flow=F(0);close=F(0);fees=F(0);pnl=F(0)
 for x in sc['holdings']:
  sign=1 if x['side']=='LONG' else -1;q=F(x['quantity']);cost=F(x['basisMagnitude']);fees+=F(x['fee'])
  if x['kind']=='CASH':continue
  flow-=sign*cost;close+=sign*q*F(x['multiplier'])*F(x['midPrice'])
  if spot is not None:
   value=q*spot if x['kind']=='LONG_SHARES' else q*F(x['multiplier'])*max((spot-F(x['strike']))*(1 if x['right']=='CALL' else -1),0)
   pnl+=sign*(value-cost)
 return flow,close,fees,pnl
class ResidualChecks(unittest.TestCase):
 def test_major_all_three_examples_are_independently_derived(self):
  for name,sc in SOURCE['scenarios'].items():
   p=v.resource(name+'-position');e=p['evaluation'];flow,close,fees,_=source_result(sc);self.assertEqual(F(e['openingCashFlow']['value']),flow);self.assertEqual(F(e['estimatedClosingCashFlow']['value']),close);self.assertEqual(F(e['grossUnrealizedPl']['value']),flow+close);self.assertEqual(F(e['fees']['value']),fees);self.assertEqual(F(e['netUnrealizedPl']['value']),flow+close-fees)
   self.assertEqual([w['code'] for w in p['warnings']],['ASSOCIATION_UNRESOLVED']);self.assertEqual(e['timeline']['openedAt'],SOURCE['openingAt']);self.assertEqual(e['timeline']['expiration'],SOURCE['expiration']);self.assertEqual(int(e['timeline']['remainingDays']['value']),(date.fromisoformat(SOURCE['expiration'])-date.fromisoformat(SOURCE['asOf'][:10])).days);self.assertEqual(int(e['timeline']['originalDays']['value']),(date.fromisoformat(SOURCE['expiration'])-date.fromisoformat(SOURCE['openingAt'][:10])).days)
   self.assertEqual(e['spot']['asOf'],SOURCE['spotAt']);self.assertEqual(e['freshness'],'CURRENT');self.assertEqual(e['oldestMaterialObservationAt'],SOURCE['quoteAt']);self.assertLess((datetime.fromisoformat(SOURCE['asOf'].replace('Z','+00:00'))-datetime.fromisoformat(SOURCE['quoteAt'].replace('Z','+00:00'))).total_seconds(),SOURCE['freshnessMaxAgeSeconds'])
   for seg in e['payoff']['geometry']['segments']:
    lo=F(seg['lower']);hi=None if seg['upper'] is None else F(seg['upper']);s=lo+1 if hi is None else (lo+hi)/2;self.assertEqual(F(seg['slope'])*s+F(seg['intercept']),source_result(sc,s)[3])
 def test_major_mutated_source_cost_falsifies_example(self):
  for name,sc in SOURCE['scenarios'].items():
   bad=copy.deepcopy(sc);bad['holdings'][0]['basisMagnitude']=str(F(bad['holdings'][0]['basisMagnitude'])+1);self.assertNotEqual(source_result(bad)[0],F(v.resource(name+'-position')['evaluation']['openingCashFlow']['value']))
 def test_major_no_inherited_missing_basis_or_stale_warnings(self):
  for name in SOURCE['scenarios']:
   p=v.resource(name+'-position');self.assertEqual(p['evaluation']['payoff']['status'],'QUALIFIED');self.assertEqual(p['evaluation']['range']['status'],'QUALIFIED');self.assertNotIn('OPENING_FILLS_UNAVAILABLE',json.dumps(p));self.assertNotIn('STALE_MARKET_OBSERVATION',json.dumps(p));v.check('Position',p)
 def test_m1_coverage_conflict_reaches_both_positions_and_constructions(self):
  x=B['coverageConflictScenario'];v.conservation(x['constructions']);self.assertEqual(x['callHolding']['quantity'],'2');self.assertEqual(x['supportHolding']['quantity'],'100');self.assertEqual(x['assessment']['requiredQuantity'],'200');self.assertEqual([p['self'] for p in x['positions']],x['assessment']['obligations'])
  for p,c in zip(x['positions'],x['constructions']):
   v.check('Position',p);v.check('Construction',c);self.assertIn('COVERAGE_INSUFFICIENT',[w['code'] for w in p['warnings']]);self.assertEqual(p['evaluation']['payoff']['status'],'CONFLICT');self.assertIsNone(p['evaluation']['payoff']['geometry']);self.assertEqual(c['relationships'][0]['status'],'CONFLICT');self.assertEqual(c['recognition']['status'],'INCOMPATIBLE')
 def test_m1_falsely_sufficient_summary_rejected_by_coverage_oracle(self):
  x=copy.deepcopy(B['coverageConflictScenario']);self.assertFalse(v.aggregate_coverage_sufficient([x['assessment']]))
  x['positions'][0]['warnings']=[]
  with self.assertRaises(ValueError):v.qualification_complete(x['positions'][0])
 def test_m2_holdings_pattern_does_not_establish_reservation(self):
  c=v.resource('cc-current');self.assertEqual(c['recognition']['authority']['basis'],'BROKER_HOLDING_OBSERVATION');self.assertEqual(c['recognition']['authority']['status'],'QUALIFIED')
  for r in R.values():
   if r['schema']=='Construction':
    for rel in r['value']['relationships']:
     if rel['kind']=='BROKER_ENCUMBRANCE' and rel['status']=='ESTABLISHED':self.assertEqual(rel['authority']['basis'],'BROKER_RESERVATION_RECORD')
 def test_m2_schema_blocks_unsupported_reservation_but_allows_unknown(self):
  x=copy.deepcopy(B['insufficientCoverage']);x['reservationStatus']='BROKER_RESERVED'
  with self.assertRaises(v.jsonschema.ValidationError):v.check('CoverageAssessment',x)
  x['reservationStatus']='NOT_ESTABLISHED';x['status']='UNKNOWN';v.check('CoverageAssessment',x)
  x['reservationStatus']='BROKER_RESERVED';x['authority']['basis']='BROKER_RESERVATION_RECORD';v.check('CoverageAssessment',x) # Structural control only, truth still runtime.
 def test_m3_discover_then_select_every_retained_snapshot(self):
  catalog=B['holdingsDiscovery'];v.check('HoldingSnapshotCollection',catalog);self.assertGreater(len(catalog['items']),1);seen=set()
  for item in catalog['items']:
   qs=parse_qs(urlsplit(item['holdings']['href']).query);account=item['account']['href'];self.assertEqual(qs['accountId'],[account.split('/')[-1]]);self.assertEqual(qs['snapshotId'],[item['snapshotId']]);selected=[r['value'] for r in R.values() if r['schema']=='BrokerHolding' and r['value']['account']['href']==account and r['value']['snapshotId']==item['snapshotId']];self.assertEqual(len(selected),item['holdingCount']);seen.add(item['snapshotId'])
  self.assertEqual(seen,{r['value']['snapshotId'] for r in R.values() if r['schema']=='BrokerHolding'});self.assertIn('specimen-cash-secured-put',seen);self.assertIn('specimen-iron-condor',seen)
 def test_m3_catalog_authority_is_not_id_possession(self):
  for item in B['holdingsDiscovery']['items']:
   with self.assertRaises(ValueError):v.graph_scope(item['account'],set())
 def test_m4_opening_order_time_hidden_in_both_projections(self):
  for n in ['buy-write-position','cash-secured-put-position','iron-condor-position']:
   p=v.resource(n);self.assertIsNotNone(p['evaluation']['timeline']['openedAt'])
   for mode in ['summary','expanded']:
    x=v.projection(v.redact_position(p,{'account.positions.read'}),mode);v.check('PositionSummary' if mode=='summary' else 'Position',x);self.assertIsNone(x['evaluation']['timeline']['openedAt']);self.assertIsNone(x['evaluation']['timeline']['originalDays']['value']);self.assertEqual(x['evaluation']['timeline']['originalDays']['status'],'REDACTED');self.assertEqual(x['evaluation']['timeline']['openingEvidence'],[]);self.assertIsNotNone(x['evaluation']['timeline']['remainingDays']['value']);v.qualification_complete(x)
 def test_m4_actual_tt_opening_evidence_redacted_in_both_projections(self):
  for name in ['tt-live-equivalence.json','tt-live-expanded-parity.json']:
   for row in json.loads((P/'examples'/name).read_text())['positions']:
    p=copy.deepcopy(v.resource('covered-call'));p['evaluation']=row['evaluation'];opened=p['evaluation']['timeline']['openedAt']
    for mode in ['summary','expanded']:
     x=v.projection(v.redact_position(p,{'account.positions.read'}),mode);v.check('PositionSummary' if mode=='summary' else 'Position',x);self.assertIsNone(x['evaluation']['timeline']['openedAt']);self.assertNotIn(opened,json.dumps(x));self.assertEqual(x['evaluation']['timeline']['originalDays']['status'],'REDACTED')
 def test_m4_authorized_original_timeline_retained(self):
  p=v.resource('buy-write-position');x=v.redact_position(p,{'account.positions.read','account.orders.read'});self.assertEqual(x['evaluation']['timeline']['openedAt'],SOURCE['openingAt']);self.assertEqual(x['evaluation']['timeline']['originalDays']['value'],p['evaluation']['timeline']['originalDays']['value'])
  # Separate already-admitted Position facts require their actual grant, not automatic Order permission.
  independent=copy.deepcopy(p);tl=independent['evaluation']['timeline'];tl['originalDays']['dependencies']=[]
  for e in tl['openingEvidence']:e['requiredCapability']='account.positions.read:'+independent['account']['href'].split('/')[-1]
  y=v.redact_position(independent,{'account.positions.read'});self.assertEqual(y['evaluation']['timeline']['openedAt'],SOURCE['openingAt'])
 def test_m5_invalid_terminal_state_rejected_unknown_open_retained(self):
  p=copy.deepcopy(v.resource('closed'));v.check('Position',p);p['stateEvidence'].update(status='UNRESOLVED',completeness='UNKNOWN')
  with self.assertRaises(v.jsonschema.ValidationError):v.check('Position',p)
  p=copy.deepcopy(v.resource('covered-call'));p['state']='UNRESOLVED';p['stateEvidence'].update(status='UNRESOLVED',completeness='UNKNOWN',establishedAt=None,evidence=[]);v.check('Position',p)
 def test_m5_bound_model_family_and_latest_references_rejected(self):
  c=copy.deepcopy(v.resource('bwb'));good=c['recognition']['modelVersion']['href'];v.check('Construction',c)
  for bad in [good.rsplit('/versions/',1)[0],good+'?version=2',good.rsplit('/',1)[0]+'/latest','/v2/constructions/models/latest']:
   c['recognition']['modelVersion']={'href':bad}
   with self.assertRaises(v.jsonschema.ValidationError):v.check('Construction',c)
  role=copy.deepcopy(v.resource('model-COVERED_CALL')['roles'][0]);role.update(kind='MODEL',modelVersion={'href':good});v.check('ModelRole',role);role['modelVersion']={'href':good.rsplit('/versions/',1)[0]}
  with self.assertRaises(v.jsonschema.ValidationError):v.check('ModelRole',role)
 def test_m6_immediate_history_matches_explicit_source_records(self):
  hist=json.loads((P/'examples/economic-history.json').read_text());src=json.loads((P/'examples/source-artifact.json').read_text())['historyTransitions'];chain=hist['immediateConstructionChain'];self.assertEqual(len(chain),11)
  for i,entry in enumerate(src,1):
   c=R[entry['instance']]['value'];self.assertEqual(c['self'],chain[i]);self.assertEqual(c['predecessor'],chain[i-1]);self.assertEqual(c['composition'],entry['composition']);self.assertEqual(c['predecessor']['href'],entry['predecessor']);v.check('Construction',c)
  self.assertEqual(R[chain[-1]['href']]['value']['predecessor'],chain[-2]);self.assertNotEqual(chain[-2],chain[0])
 def test_m6_unknown_immediate_predecessor_does_not_invent_a_link(self):
  c=copy.deepcopy(v.resource('cc-current'));c.update(predecessor=None,predecessorStatus='UNKNOWN',warnings=[copy.deepcopy(B['warningExamples'][0])]);v.check('Construction',c)
  c.pop('predecessorStatus')
  with self.assertRaises(v.jsonschema.ValidationError):v.check('Construction',c)
 def test_m6_shortcut_falsifies_immediate_navigation(self):
  h=json.loads((P/'examples/economic-history.json').read_text());chain=h['immediateConstructionChain'];c=copy.deepcopy(R[chain[-1]['href']]['value']);c['predecessor']=chain[0];v.check('Construction',c);self.assertNotEqual(c['predecessor'],chain[-2]) # Cross-resource truth cannot be enforced by schema.
if __name__=='__main__':unittest.main(verbosity=2)
