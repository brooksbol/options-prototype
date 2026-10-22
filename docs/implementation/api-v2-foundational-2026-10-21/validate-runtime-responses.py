#!/usr/bin/env python3
"""Validate emitted Java HTTP/source/evaluator representations against operative routes.
No network, copied expected responses or financial truth inferred from schema success.
"""
import json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(root/'scripts'))
from v2_oas import Contracts,FOUNDATION
contracts=Contracts();operations=contracts.operations();failures=[];count=0;standalone=0;selected=set()
for f in sorted((root/'evidence-service-java/build/portfolio-responses').glob('*.json')):
 r=json.loads(f.read_text());path=r['path'].split('?')[0];body=r['body'];status=r.get('status',200);method=r.get('method','GET')
 candidates=[p for m,p in operations if m==method and re.fullmatch(re.sub(r'\\\{[^}]+\\\}',r'[^/]+',re.escape(p)),path)]
 if not candidates:
  if r.get('schema'):
   try:contracts.validator({'$ref':'#/components/schemas/'+r['schema']},FOUNDATION).validate(body)
   except Exception as error:failures.append((path,r['schema'],str(getattr(error,'message',error))[:500]+' at '+str(list(getattr(error,'absolute_path',[])))))
   standalone+=1
  else:failures.append((path,'No operative route or declared standalone schema matches emitted representation'))
  continue
 template=sorted(candidates,key=lambda p:(p.count('{'),-len(p)))[0];selected.add((method,template,status))
 try:
  contracts.validate_response(method,template,status,body,r.get('headers'))
  if r.get('schema'):contracts.validator({'$ref':'#/components/schemas/'+r['schema']},FOUNDATION).validate(body)
 except Exception as error:failures.append((path,template,str(getattr(error,'message',error))[:500]+' at '+str(list(getattr(error,'absolute_path',[])))))
 count+=1
for error in failures:print(*error,sep=' | ')
print(f'{count} route representations plus {standalone} standalone financial representations; {len(selected)} route/status combinations; {len(failures)} operative schema violations')
print('Includes HTTP, source-normalizer and evaluator captures. Payload count is not endpoint or authorization coverage.')
sys.exit(bool(failures) or not count)
