#!/usr/bin/env python3
"""Reconcile the class ledger with PR #33's existing, dated ETF quote probes."""
import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent


def verified(path, digest):
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == digest, path
    return data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pr33-dir", type=Path, required=True,
                    help="checkout directory containing PR #33's frozen ETF result")
    args = ap.parse_args()
    source = args.pr33_dir
    manifest = json.loads((source / "summary.json").read_text())
    hashes = manifest["files_sha256"]
    details = json.loads(verified(source / "probe-details.json", hashes["probe-details.json"]))
    scores = list(csv.DictReader(verified(source / "exit-reliability-v0.csv",
                                         hashes["exit-reliability-v0.csv"]).decode().splitlines()))
    unevaluable = json.loads(verified(source / "unevaluable.json", hashes["unevaluable.json"]))
    ledger = list(csv.DictReader((HERE / "class-ledger.csv").open()))
    etf = {r["underlying"] for r in ledger if r["product_cohort"] == "ETF_CBOE_CONFIRMED"}
    score_symbols = {r["Symbol"] for r in scores}
    assert len(scores) == len(score_symbols) == 1641
    assert score_symbols <= etf and len(etf) == 1643
    assert len(details) == 2529 and {r["symbol"] for r in details} == score_symbols
    assert len(ledger) == 2273
    per_symbol = Counter(r["symbol"] for r in details if r["result"].get("full_four_leg") is True)
    result = {
        "schema": "wheelwright-iron-condor-existing-market-evidence/v0",
        "ledger_classes": len(ledger),
        "ledger_underlyings": len({r["underlying"] for r in ledger}),
        "pr33_market_date": manifest["as_of_market_date"],
        "pr33_probe_details_sha256": hashes["probe-details.json"],
        "pr33_score_csv_sha256": hashes["exit-reliability-v0.csv"],
        "pr33_scored_ordinary_etf_classes": len(score_symbols),
        "pr33_unevaluable_underlyings": sorted(etf - score_symbols),
        "pr33_probe_slots_observed": len(details),
        "pr33_slots_with_four_usable_legs": sum(per_symbol.values()),
        "pr33_symbols_with_one_or_more_four_usable_leg_slots": len(per_symbol),
        "pr33_symbols_with_two_four_usable_leg_slots": sum(n >= 2 for n in per_symbol.values()),
        "pr33_symbols_with_no_four_usable_leg_slot": len(score_symbols) - len(per_symbol),
        "classes_without_pr33_quote_probe": len(ledger) - len(score_symbols),
        "classes_without_pr33_probe_by_reason": {
            "no_usable_underlying_price": 2,
            "other_etf_option_class": 123,
            "occ_name_etf_candidate_class": 453,
            "index_option_class": 54,
        },
        "four_leg_definition": "PR #33 fixed representative probe: four positive, uncrossed two-sided leg quotes, positive displayed sizes, side timestamps within 60 minutes of its 20:15 UTC anchor; one bulk response per four-leg slot",
        "interpretation": "Dated positive quote-surface observations only. A failed fixed probe is not a general market rejection; a successful probe is not a package fill or production admission.",
    }
    assert sum(result["classes_without_pr33_probe_by_reason"].values()) == result["classes_without_pr33_quote_probe"]
    assert sorted(etf - score_symbols) == ["BLCN", "TXS"]
    assert len(unevaluable) == 2
    (HERE / "existing-market-evidence-summary.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
