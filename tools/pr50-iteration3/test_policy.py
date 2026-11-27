import unittest
from copy import deepcopy
from decimal import Decimal as D
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import policy as p

class PolicyTests(unittest.TestCase):
 def setUp(self):
  self.cs=[{'symbol':'ABC261201P00100000','instrument_id':'short','strike_price':'100','expiration_date':'2026-12-01','underlying_symbol':'ABC','option_type':'PUT','ppind':True}, {'symbol':'ABC261201P00095000','instrument_id':'long','strike_price':'95','expiration_date':'2026-12-01','underlying_symbol':'ABC','option_type':'PUT','ppind':True}]
  self.now=int(p.session_clock(p.ENTRY_DATE,10).timestamp()*1000)
  self.gs=[{'symbol':c['symbol'],'delta':d,'updatedAt':self.now} for c,d in zip(self.cs,(-.30,-.20))]
  self.books=[{'symbol':c['symbol'],'underlying':'ABC','expiration_date':'2026-12-01','strike':float(c['strike_price']),'option_type':'put','contract_size':100,'bid':b,'ask':a,'bidsize':2,'asksize':2} for c,b,a in zip(self.cs,(1.2,.4),(1.3,.5))]
 def test_roster_assignment_frozen_before_eligibility(self):
  a=p.assignments();self.assertEqual(len(a),52);self.assertEqual(sum(v=='A' for v in a.values()),26);self.assertEqual(a,p.assignments());self.assertEqual(set(a),set(p.ROSTER))
 def test_eligible_block_balanced_before_exposure(self):
  members=list(p.PER_SYMBOL_MAXIMUM_WIDTH);a=p.assignments(members);self.assertEqual(sum(a[s]=='A' for s in members),17);self.assertEqual(sum(a[s]=='B' for s in members),16);p.validate_plan(p.freeze_plan(members))
 def test_arms_only_clock_changes(self):
  a,b=[deepcopy(p.freeze_plan()['arms'][x]) for x in ('A','B')]
  for x in ('selectionAt','latestSelectionAtExclusive','mutationDeadline','latestCancelAtExclusive','readbackAt'):a.pop(x);b.pop(x)
  self.assertEqual(a,b)
 def test_bool_cannot_replace_plan_integer(self):
  x=p.freeze_plan();x['quantity']=True
  with self.assertRaises(p.Hold):p.validate_plan(x)
 def test_expiry_is_exactly_one_calendar_day(self):self.assertEqual((p.EXPIRY-p.ENTRY_DATE).days,1)
 def test_fresh_unique_delta(self):
  x=p.select(self.cs,self.gs,self.now);self.assertEqual(x['freshCoverage'],2);self.assertEqual(x['short']['contract']['instrument_id'],'short')
 def test_epoch_unit_confusion_refused(self):
  with self.assertRaises(p.Hold):p.select(self.cs,self.gs,self.now/1000)
 def test_future_and_stale_delta_wait(self):
  for t in (self.now-300001,self.now+1):
   g=deepcopy(self.gs);g[0]['updatedAt']=t
   with self.assertRaises(p.Hold):p.select(self.cs,g,self.now)
 def test_no_silent_expiry_substitution(self):
  self.cs[0]['expiration_date']='2026-11-27'
  with self.assertRaises(p.Hold):p.select(self.cs,self.gs,self.now)
 def test_duplicate_greek_refused(self):
  with self.assertRaises(p.Hold):p.select(self.cs,self.gs+[self.gs[0]],self.now)
 def test_delta_tie_wait(self):
  self.cs.append({**self.cs[0],'instrument_id':'tie','symbol':'TIE'});self.gs.append({**self.gs[0],'symbol':'TIE'})
  with self.assertRaises(p.Hold):p.select(self.cs,self.gs,self.now)
 def test_natural_credit_and_p50(self):
  x=p.economics(*self.books,self.cs);self.assertEqual(D(x['limitCredit']),D('.7'));self.assertEqual(D(x['minimumP50AtLimit']),D('.35'))
 def test_swapped_option_books_refused(self):
  with self.assertRaises(p.Hold):p.economics(self.books[1],self.books[0],self.cs)
 def test_contract_multiplier_refused(self):
  self.books[0]['contract_size']=10
  with self.assertRaises(p.Hold):p.economics(*self.books,self.cs)
 def test_zero_long_bid_refused_at_entry(self):
  self.books[1]['bid']=0
  with self.assertRaises(p.Hold):p.economics(*self.books,self.cs)
 def test_missing_size_is_not_zero_assumed(self):
  self.books[0]['bidsize']=None
  with self.assertRaises(p.Hold):p.economics(*self.books,self.cs)
 def test_nonpositive_natural_wait(self):
  self.books[1]['ask']=2
  with self.assertRaises(p.Hold):p.economics(*self.books,self.cs)
 def test_credit_cannot_exceed_width(self):
  self.books[0].update(bid=7,ask=8)
  with self.assertRaises(p.Hold):p.economics(*self.books,self.cs)
 def test_tick_boolean_not_truthy(self):
  self.cs[0]['ppind']='true';self.assertEqual(p.tick(self.cs),D('.05'))
 def test_unrepresentable_p50_wait(self):
  with self.assertRaises(p.Hold):p.p50('.01','.01')
 def test_xlf_legacy_positive_long_bid_preserved(self):
  with self.assertRaises(p.Hold):p.close_debit('.12','0','.5','.01')
 def test_gld_unmarketable_width_cap_is_not_fill(self):
  self.assertEqual(p.close_debit('2.25','.05','2','.01'),D('2'))
 def test_equality_at_one_percent_included(self):self.assertTrue(p.selected('99','100','100'));self.assertFalse(p.selected('98.99','100','100'))
 def test_nonfinite_and_boolean_inputs(self):
  for x in (True,'NaN','Infinity',None):
   with self.assertRaises(p.Hold):p.amount(x)
 def test_nonroster_cannot_build_order(self):
  sel=p.select(self.cs,self.gs,self.now)
  with self.assertRaises(p.Hold):p.entry_order('ABC',sel,{'limitCredit':'.7'},'INERT')

if __name__=='__main__':unittest.main()
