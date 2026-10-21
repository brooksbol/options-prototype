import sys,unittest,json,copy
from pathlib import Path
P=Path(__file__).resolve().parents[2]/'reviews/api-v2-foundational-contract-2026-10-20';sys.path.insert(0,str(P));import verify as v
class EntryCorrections(unittest.TestCase):
 def test_six_examples_source_costs_geometry_and_evaluation_clock(self):
  for n in ['cash-secured-put-position','buy-write-position','iron-condor-position','covered-call-ten-rolls','successive-protective-puts','leaps-maturity']:
   p=v.resource(n);c=v.R[p['currentConstruction']['href']]['value'];e=p['evaluation'];self.assertIsNotNone(e['payoff']['geometry']);self.assertNotIn('123.45',json.dumps(p));self.assertNotIn('2026-09-01',json.dumps(p));
   for k in ['grossUnrealizedPl','netUnrealizedPl','fees']:self.assertEqual(e[k]['asOf'],e['evaluatedAt'])
   for seg in e['payoff']['geometry']['segments']:
    lo=v.q(seg['lower']);hi=None if seg['upper']is None else v.q(seg['upper']);s=lo+1 if hi is None else (lo+hi)/2;self.assertEqual(v.intrinsic(c,s),v.q(seg['slope'])*s+v.q(seg['intercept']))
 def test_redacted_metrics_never_keep_asof(self):
  p=copy.deepcopy(v.resource('buy-write-position'));p['evaluation']['openingCashFlow']['asOf']='2026-10-12T15:00:00Z'
  for projection in ['summary','expanded']:
   x=v.projection(v.redact_position(p,{'account.positions.read'}),projection);m=x['evaluation']['openingCashFlow'];self.assertIsNone(m['value']);self.assertIsNone(m['asOf']);v.check('Metric',m);bad=copy.deepcopy(m);bad['asOf']='2026-10-12T15:00:00Z'
   with self.assertRaises(v.jsonschema.ValidationError):v.check('Metric',bad)
 def test_account_coverage_conflict_and_precise_position_warning_paths(self):
  x=v.B['coverageConflictScenario'];r=x['accountReconciliation'];v.check('InventoryReconciliation',r);self.assertEqual(r['coverageAssessments'][0]['requiredQuantity'],'200');self.assertEqual(r['coverageAssessments'][0]['eligibleQuantity'],'100')
  for p in x['positions']:
   for w in p['warnings']:
    for pointer in w['affected']:
     obj=p
     for segment in pointer.strip('/').split('/'):obj=obj[segment]
     self.assertEqual(obj['status'],'CONFLICT')
if __name__=='__main__':unittest.main(verbosity=2)
