"""Validate generated integration specimens against existing authoritative API.
Engineering-only: local files; no API/provider/operational calls.
"""
import json
from v2_oas import Contracts, ROOT
c = Contracts()
c.validate_structure()
for method, route, name in [
    ('GET', '/v2/positions', 'structural-live-preview.json'),
    ('GET', '/v2/accounts', 'structural-live-accounts.json'),
]:
    c.validate_response(method, route, 200, json.loads((ROOT / 'evidence-service-java/build' / name).read_text()))
print('PASS actual Java integration representations against authoritative v2 OAS; no new API contract.')
