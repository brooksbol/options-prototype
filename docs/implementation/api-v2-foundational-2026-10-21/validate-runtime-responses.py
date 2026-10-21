#!/usr/bin/env python3
"""Validate actual Java service responses; no synthetic response copies or broker requests."""
import json,sys
from pathlib import Path
import jsonschema
root=Path(__file__).resolve().parents[3]
spec=json.loads((root/'docs/reviews/api-v2-foundational-contract-2026-10-20/openapi.json').read_text())
lookup={'positions':'PositionCollection','constructions':'ConstructionCollection','orders':'OrderCollection','instruments':'InstrumentCollection','holdings':'BrokerHoldingCollection','market-observations':'MarketObservationCollection'}
failures=[];count=0
for f in sorted((root/'evidence-service-java/build/portfolio-responses').glob('*.json')):
 r=json.loads(f.read_text());p=r['path'].split('?')[0];body=r['body'];parts=p.split('/')[2:]
 if r.get('schema'):name=r['schema']
 elif '/audit/' in p:name='AuditRecord'
 elif p.endswith('/audit'):name='AuditRecordCollection'
 elif p.endswith('inventory-reconciliation'):name='InventoryReconciliation'
 elif body.get('view')=='observations':name='HoldingSnapshotCollection'
 elif p=='/v2/constructions/models':name='ModelFamilyCollection'
 elif '/versions/' in p:name='ModelVersion'
 elif 'items' in body:name=lookup[parts[0]]
 else:name={'positions':'Position','constructions':'Construction','holdings':'BrokerHolding','instruments':'Instrument','orders':'Order','market-observations':'MarketObservation'}[parts[0]]
 v=jsonschema.Draft202012Validator({'$ref':'#/components/schemas/'+name,'components':spec['components']},format_checker=jsonschema.FormatChecker())
 for error in v.iter_errors(body):failures.append((r['path'],name,'/'.join(map(str,error.absolute_path)),error.message[:240]))
 count+=1
for e in failures: print(*e,sep=' | ')
print(f'{count} actual response payloads; {len(failures)} schema violations')
sys.exit(bool(failures) or not count)
