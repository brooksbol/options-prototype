#!/usr/bin/env python3
"""Validate newly emitted catalog HTTP bodies/order/cursor traces against operative schemas.
Not a Kiro reproduction, live brokerage check, or runtime authorization proof.
"""
import base64,json,sys
from pathlib import Path
from urllib.parse import urlparse,parse_qs
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[4];sys.path.insert(0,str(ROOT/'scripts'))
from v2_oas import Contracts
contracts=Contracts();files=list((ROOT/'evidence-service-java/build/catalog-pagination').glob('*.json'));assert len(files)==25,len(files)
key=lambda n:n['account']['href']+':'+n['snapshotId']
responses=0
for path in files:
 r=json.loads(path.read_text());expected=r['reference'];assert r['concatenated']==expected,path;assert r['expectedCount']==r['actualCount']==len(expected);assert r['termination']=='NEXT_NULL';all_keys=[key(v)for v in expected];assert len(set(all_keys))==len(all_keys)
 first=r['pages'][0]['request'];descending=parse_qs(urlparse(first).query)['sort']==['-id'];assert all_keys==sorted(all_keys,reverse=descending)
 assert r['pages'][-1]['response']['next'] is None
 traversed=[]
 for page in r['pages']:
  b=page['response'];contracts.validate_response('GET','/v2/holdings',200,b);responses+=1;traversed.extend(key(n)for n in b['items'])
  if b['next']:
   assert b['items'];token=parse_qs(urlparse(b['next']['href']).query)['cursor'][0];payload=token.split('.')[0];scope,last=base64.urlsafe_b64decode(payload+'='*(-len(payload)%4)).decode().split('\n',1);assert len(scope)==64;assert last==key(b['items'][-1]);assert last.startswith('/v2/accounts/')
 assert traversed==all_keys,path
 if path.name.startswith('walk-'):assert len(expected)==7
 elif path.name.startswith('restricted-'):assert len(expected)==5 and len({n['account']['href']for n in expected})==1
 else:assert path.stem=='five-cuts-limit-two' and len(expected)==5
print(f'PASS: {len(files)} independently emitted walks; {responses} page bodies schema-valid; exact ordered concatenation, unique identities, canonical cursor keys, next=null termination')
