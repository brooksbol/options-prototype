#!/usr/bin/env python3
"""Validate generated real HTTP specimens against frozen OAS (PyYAML/jsonschema).
Run focused HeldQuotesControllerTest first; this is acceptance support, not runtime.
"""
import json
from pathlib import Path
import yaml
from jsonschema import Draft202012Validator, FormatChecker

root = Path(__file__).resolve().parent.parent
spec = yaml.safe_load((root / "docs/contracts/api-v2-direct-quote-acquisition-proposal.yaml").read_text())
samples = json.loads((root / "evidence-service-java/build/held-quotes-oas-specimens.json").read_text())
statuses = set()
empty = nonempty = False
for sample in samples:
    status = sample.get("status", 200)
    statuses.add(status)
    schema = spec["paths"]["/v2/quotes"]["get"]["responses"][str(status)]["content"][
        "application/json" if status == 200 else "application/problem+json"]["schema"]
    Draft202012Validator({**schema, "components": spec["components"]},
                         format_checker=FormatChecker()).validate(sample)
    if status == 200:
        empty |= not sample["items"]
        nonempty |= bool(sample["items"])
        symbols = [item["subject"]["symbol"] for item in sample["items"]]
        assert symbols == sorted(set(symbols)), "complete canonical order/uniqueness"
        for item in sample["items"]:
            assert set(item) == {"observationId", "subject", "provenance"}
            assert set(item["subject"]) == {"symbol", "securityType"}
            assert set(item["provenance"]) == {"provider", "environment", "receivedAt", "committedAt"}
assert statuses == {200, 401, 403, 422, 500, 503}, statuses
assert empty and nonempty
print(f"PASS: {len(samples)} real HTTP specimens match frozen GET OAS; all status/code pairs, empty/nonempty, ordering and bounded fields")
