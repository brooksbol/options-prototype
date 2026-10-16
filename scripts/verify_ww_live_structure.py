"""Engineering-only OAS checks against an actual generated backend HTTP specimen.
Run StructuralPositionsTest first. Never contacts a brokerage or operational API.
"""
import copy
import json
import subprocess
from pathlib import Path
from v2_oas import Contracts, ACCOUNT, COMMON, ROOT

c = Contracts()
c.validate_structure()
p = json.loads((ROOT / 'evidence-service-java/build/structural-position-specimen.json').read_text())
c.validate_response('GET', '/v2/positions', 200, p)
for name in ['structural-fractional-specimen.json', 'structural-vertical-specimen.json']:
    c.validate_response('GET', '/v2/positions', 200, json.loads((ROOT / 'evidence-service-java/build' / name).read_text()))
old = json.loads(subprocess.check_output(['git', 'show', 'HEAD:docs/contracts/' + ACCOUNT], cwd=ROOT))
current = c.documents[ACCOUNT]
assert all(current['components']['schemas'][k] == v for k, v in old['components']['schemas'].items())
mutations = []
x = copy.deepcopy(p)
x['accounts'][0]['structures'][0]['membership'] = {'status': 'ESTABLISHED', 'basis': 'UNASSOCIATED_INVENTORY', 'evidenceIds': [], 'reasons': []}
mutations.append(x)
x = copy.deepcopy(p)
x['accounts'][0]['structures'][0]['constituents'][0]['signedQuantity'] = '0.5'
mutations.append(x)
x = copy.deepcopy(p)
x['accounts'][0]['structures'][0]['constituents'][0]['terms']['value']['deliverableShares'] = '-100'
mutations.append(x)
x = copy.deepcopy(p)
x['accounts'][0]['availability'] = 'NO_RETAINED_SNAPSHOT'
mutations.append(x)
for x in mutations:
    try:
        c.validate_response('GET', '/v2/positions', 200, x)
    except Exception:
        pass
    else:
        raise AssertionError('Contradictory local state accepted')
c.validate_parameters('POST', '/v2/position-associations', {('header', 'X-Request-Id'): ' 11111111-1111-4111-8111-111111111111 '})
print('PASS actual structural HTTP response, complete OAS references, preserved existing component schemas, four rejected contradiction probes and padded correlation contract. Not operational-source or Product acceptance.')
