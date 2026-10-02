#!/usr/bin/env python3
"""Offline ETF/index class ledger from the frozen Pass -1 archive; no provider calls."""
import csv
import gzip
import hashlib
import io
import json
import re
import tarfile
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ARCHIVE = ROOT / "data/research/pass-minus-one-v0-2026-09-30/evidence.tar.gz"
MANIFEST = ARCHIVE.with_name("artifact-manifest.json")
OUT = Path(__file__).resolve().parent
AS_OF = "2026-10-01"
CONTRACT = re.compile(r"^([A-Z0-9]+)(\d{6})([CP])(\d{8})$")
FCO = {"XDA", "XDB", "XDC", "XDE", "XDN", "XDS", "XDZ"}


def read(tar, name):
    return tar.extractfile(name).read()


def bucket(u):
    types = {r.get("symbol_type") for r in u["cboe_underlying_records"]}
    names = " ".join(c["name"].upper() for c in u["occ_classes"])
    symbol = u["occ_underlying_symbol"]
    if "ETF" in types:
        return "ETF_CBOE_CONFIRMED"
    if not types and re.search(r"\bETF\b|EXCHANGE TRADED FUND", names):
        return "ETF_OCC_NAME_CANDIDATE"
    if symbol == "XSPBX":
        return "OUT_BINARY_PAYOFF"
    if symbol in FCO:
        return "OUT_FOREIGN_CURRENCY_OPTION"
    if "Index" in types:
        return "INDEX_CBOE_CONFIRMED"
    if any(c["product_type"] == "IU" for c in u["occ_classes"]):
        return "INDEX_OCC_IU_CANDIDATE"
    if "Equity" in types:
        return "OUT_SINGLE_NAME_EQUITY"
    if not types:
        return "UNRESOLVED_PRODUCT_TYPE"
    return "OUT_OTHER_PRODUCT_TYPE"


def topology(body, root):
    per_expiry = defaultdict(lambda: {"P": set(), "C": set()})
    malformed = 0
    for group in body.get("symbols", []):
        if group.get("rootSymbol") != root:
            continue
        for value in group.get("options", []):
            match = CONTRACT.fullmatch(value)
            if not match or match.group(1) != root:
                malformed += 1
                continue
            expiration = "20" + match.group(2)[:2] + "-" + match.group(2)[2:4] + "-" + match.group(2)[4:]
            if expiration < AS_OF:
                continue
            per_expiry[expiration][match.group(3)].add(int(match.group(4)))
    two_sided = [e for e, sides in per_expiry.items() if len(sides["P"]) >= 2 and len(sides["C"]) >= 2
                 and min(sides["P"]) < max(sides["C"])]
    window = [e for e in two_sided if 21 <= (date.fromisoformat(e) - date.fromisoformat(AS_OF)).days <= 100]
    return len(per_expiry), len(two_sided), len(window), malformed


def main():
    manifest = json.loads(MANIFEST.read_text())
    digest = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    assert digest == manifest["archive_sha256"]
    with tarfile.open(ARCHIVE, "r:gz") as tar:
        population_bytes = read(tar, "declared-population.json")
        class_bytes = read(tar, "analysis/classes.jsonl")
        assert hashlib.sha256(population_bytes).hexdigest() == manifest["source_population_sha256"]
        assert hashlib.sha256(class_bytes).hexdigest() == manifest["analysis_classes_sha256"]
        population = json.loads(population_bytes)["underlyings"]
        class_rows = {(r["occ_underlying_symbol"], r["occ_option_class_symbol"]): r
                      for r in map(json.loads, class_bytes.splitlines())}
        assert len(population) == 6072 and len(class_rows) == 6381
        rows = []
        raw_cache = {}
        for u in population:
            cohort = bucket(u)
            if cohort.startswith("OUT_") or cohort == "UNRESOLVED_PRODUCT_TYPE":
                continue
            for c in u["occ_classes"]:
                cr = class_rows[(u["occ_underlying_symbol"], c["option_class_symbol"])]
                root = cr["provider_root_exact_match"]
                expirations = structures = window_structures = malformed = 0
                if root:
                    raw_file = cr["raw_gzip"]
                    if raw_file not in raw_cache:
                        body_bytes = gzip.decompress(read(tar, "full/" + raw_file))
                        assert hashlib.sha256(body_bytes).hexdigest() == cr["raw_sha256"]
                        raw_cache[raw_file] = json.loads(body_bytes)
                    expirations, structures, window_structures, malformed = topology(raw_cache[raw_file], root)
                state = ("IDENTITY_UNRESOLVED" if not root else
                         "LISTED_FOUR_LEG_SHAPE" if structures else "NO_LISTED_FOUR_LEG_SHAPE")
                rows.append({
                    "underlying": u["occ_underlying_symbol"],
                    "occ_class": c["option_class_symbol"],
                    "product_cohort": cohort,
                    "product_evidence": "CBOE_EXACT" if u["cboe_underlying_records"] else "OCC_ONLY",
                    "provider_class_state": cr["provider_class_state"],
                    "provider_root": root or "",
                    "listed_expirations": expirations,
                    "four_leg_expirations": structures,
                    "four_leg_expirations_21_100_dte": window_structures,
                    "cheap_geometry_state": state,
                    "malformed_contract_strings": malformed,
                    "raw_sha256": cr["raw_sha256"] or "",
                })
    rows.sort(key=lambda r: (r["product_cohort"], r["underlying"], r["occ_class"]))
    path = OUT / "class-ledger.csv"
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys(), lineterminator="\n")
        w.writeheader(); w.writerows(rows)
    cohorts = Counter(bucket(u) for u in population)
    cohort_classes = Counter()
    for u in population:
        cohort_classes[bucket(u)] += len(u["occ_classes"])
    summary = {
        "schema": "wheelwright-iron-condor-etf-index-offline-ledger/v0",
        "as_of": AS_OF,
        "archive_sha256": digest,
        "class_ledger_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "discovery_underlyings": len(population),
        "discovery_classes": len(class_rows),
        "product_cohorts_underlyings": dict(sorted(cohorts.items())),
        "product_cohorts_classes": dict(sorted(cohort_classes.items())),
        "ledger_underlyings": len({r["underlying"] for r in rows}),
        "ledger_classes": len(rows),
        "provider_states": dict(sorted(Counter(r["provider_class_state"] for r in rows).items())),
        "geometry_states": dict(sorted(Counter(r["cheap_geometry_state"] for r in rows).items())),
        "dated_window_class_counts": {
            "at_least_one_21_100_dte": sum(r["four_leg_expirations_21_100_dte"] >= 1 for r in rows),
            "at_least_two_21_100_dte": sum(r["four_leg_expirations_21_100_dte"] >= 2 for r in rows),
        },
        "index_underlyings": sorted({r["underlying"] for r in rows if r["product_cohort"].startswith("INDEX_")}),
        "index_class_count": sum(r["product_cohort"].startswith("INDEX_") for r in rows),
        "malformed_contract_strings": sum(r["malformed_contract_strings"] for r in rows),
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
