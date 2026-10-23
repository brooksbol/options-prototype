#!/usr/bin/env python3
"""Finite author contract/projection/source-capture checks, not runtime or Product acceptance."""
import json,re,sys,unittest
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3];sys.path.insert(0,str(ROOT/'scripts'))
from v2_oas import Contracts,COMMON,FOUNDATION,implemented_v2_operations,normalized_route
class Corrections(unittest.TestCase):
 def setUp(self):self.c=Contracts()
 def test_all_36_operations_and_no_new_domain_roots(self):
  ops=self.c.operations();self.assertEqual(len(ops),36);self.assertEqual(implemented_v2_operations(),{(m,normalized_route(p))for m,p in ops});self.assertTrue(all('405'in op['responses']for op,_,_ in ops.values()))
 def test_exact_declarative_grants(self):
  for path in ['/v2/market-observations','/v2/market-observations/{observationId}']:
   op=self.c.operations()[('GET',path)][0];self.assertEqual(op['x-required-grants'],['market.read']);self.assertEqual(op['x-required-grants-for-account-scope'],['account.market.read:{accountId}'])
  op=self.c.operations()[('POST','/v2/quotes')][0];self.assertEqual(op['x-required-grants'],['quote.acquire']);self.assertEqual(op['x-required-grants-when-force'],['quote.force'])
 def test_source_derived_captures_pass_real_schemas(self):
  records=list((HERE/'examples').glob('*.json'))+list((ROOT/'evidence-service-java/build/product-conformance/examples').glob('*.json'));self.assertGreaterEqual(len(records),24)
  for path in records:
   record=json.loads(path.read_text());raw=record['path'].split('?')[0];paths=[p for m,p in self.c.operations()if m==record['method']and re.fullmatch(re.sub(r'\\\{[^}]+\\\}',r'[^/]+',re.escape(p)),raw)];self.assertTrue(paths,raw);template=sorted(paths,key=lambda p:(p.count('{'),-len(p)))[0];self.c.validate_response(record['method'],template,200,record['body'],record['headers'])
 def test_public_descriptions_are_operation_specific(self):
  a=json.loads((HERE.parent/'documentation-annotations.json').read_text())['operations'];self.assertEqual(len({op['description']for op in a.values()}),18)
  for path,op in a.items():
   self.assertGreater(len(op['description']),150,path)
   media=self.c.documents[FOUNDATION]['paths'][path]['get']['responses']['200']['content']['application/json'];self.assertNotIn('example',media);self.assertIn('examples',media)
 def test_actual_dispatch_errors(self):
  records=json.loads((ROOT/'evidence-service-java/build/product-conformance/routing-probes.json').read_text());self.assertEqual([r['status']for r in records],[404,405])
  for r in records:
   self.assertTrue(r['contentType'].startswith('application/problem+json'));body=json.loads(r['body']);self.c.validator({'$ref':'#/components/schemas/RoutingProblem'},COMMON).validate(body);self.assertEqual(body['status'],r['status']);self.assertEqual(body['requestId'],'11111111-1111-4111-8111-111111111111');self.assertNotIn(r['path'],r['body'])
 def test_page_complexity_not_whole_portfolio_expansion(self):
  rows=json.loads((ROOT/'evidence-service-java/build/product-conformance/complexity.json').read_text());self.assertEqual(len(rows),12)
  self.assertEqual({r['population']for r in rows},{10,100,1000});self.assertEqual({r['pageSize']for r in rows},{5,20})
  for r in rows:
   self.assertEqual(r['expandedItems'],min(r['pageSize'],r['population']));self.assertEqual(r['reconciliations'],1);self.assertEqual(r['fullPositionReads'],1);self.assertLessEqual(r['repositorySelects'],50+3*r['expandedItems']);self.assertLessEqual(r['repositoryRowsRead'],4*r['population']+500)
if __name__=='__main__':unittest.main(verbosity=2)
