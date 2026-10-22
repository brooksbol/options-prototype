#!/usr/bin/env python3
"""Synchronize review-only catalog, retained source hash and embedded examples."""
import json,hashlib,copy,subprocess,sys
from pathlib import Path
from collections import defaultdict
p=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(p/'apply-entry-corrections.py')],check=True)
b=json.loads((p/'examples/resources.json').read_text());o=json.loads((p/'openapi.json').read_text());groups=defaultdict(list)
for r in b['resources'].values():
 if r['schema']=='BrokerHolding':groups[(r['value']['account']['href'],r['value']['snapshotId'])].append(r['value'])
items=[]
for (a,snap),hs in sorted(groups.items()):
 items.append({'account':{'href':a},'snapshotId':snap,'evidenceDate':hs[0]['observationDate'],'dateBasis':'SYNTHETIC_SOURCE_INSTANT','recordedAt':min(h['receivedAt'] for h in hs),'source':'SYNTHETIC_OFFLINE_SOURCE','sourceSha256':hashlib.sha256((p/'examples/source-artifact.json').read_bytes()).hexdigest(),'holdingCount':len(hs),'holdings':{'href':'/v2/holdings?accountId='+a.split('/')[-1]+'&snapshotId='+snap},'evidence':hs[0]['evidence'],'qualifications':['Synthetic retained observation; no complete brokerage history or Position identity claim.']})
b['holdingsDiscovery']={'view':'observations','items':items,'next':None,'warnings':[]};b['externalReferences'][2]['sha256']=hashlib.sha256((p/'examples/source-artifact.json').read_bytes()).hexdigest()
for path,item in o['paths'].items():
 if '$ref'in item:continue
 media=item['get']['responses']['200']['content']['application/json'];ex=media.get('example')
 if isinstance(ex,dict) and ex.get('self',{}).get('href')in b['resources']:media['example']=copy.deepcopy(b['resources'][ex['self']['href']]['value'])
o['paths']['/v2/holdings']['get']['responses']['200']['content']['application/json']['examples']={'retainedSnapshots':{'value':b['holdingsDiscovery']}}
for f,d in [('openapi.json',o),('examples/resources.json',b)]: (p/f).write_text(json.dumps(d,indent=2)+'\n')
