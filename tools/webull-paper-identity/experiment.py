"""Observe Webull paper eligibility; optionally retain a supplied-event cohort.

No stochastic trigger, trading, quote acquisition, scheduler or notification send.
"""
import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from zoneinfo import ZoneInfo

from acquisition_state import StateError, collect_current, contract_candidates, inspect, symbol
from experiment_state import ExperimentStore, enroll, evaluate, prepare, reconcile, scope, treatments
from webull_identity import (AuditError, IdentityReader, ROOT, VERIFIED_RUN, load_credentials,
                             private_directory, retain, secret_free, verified_account)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("symbol", help="Exact underlying, for example CAT")
    parser.add_argument("--event-id", help="Explicit externally confirmed event; not a trigger implementation")
    parser.add_argument("--contracts", type=Path,
                        help="Private JSON list of selected standard put references, one per DTE")
    args = parser.parse_args(argv)
    try:
        root = symbol(args.symbol)
        if bool(args.event_id) != bool(args.contracts):
            raise StateError("Supply both --event-id and --contracts to request cohort enrollment.")
        contracts = json.loads(args.contracts.read_text()) if args.contracts else None
        now = datetime.now(timezone.utc)
        today = now.astimezone(ZoneInfo("America/New_York")).date()
        if contracts is not None:
            treatments(root, contracts, today)  # Validate before credentials/network.
        private_directory(ROOT)
        evidence = ROOT / now.strftime("%Y%m%dT%H%M%S.%fZ")
        evidence.mkdir(mode=0o700)
        store = ExperimentStore(ROOT / "aristocrats-experiment")
        key, secret = load_credentials()
        reader = IdentityReader(key, secret, evidence)
        accounts = reader.accounts()
        prior = json.loads((VERIFIED_RUN / "01-accounts.json").read_bytes())
        desktop = json.loads((VERIFIED_RUN / "desktop-observation.json").read_bytes())
        account = verified_account(accounts, prior, desktop)
        account_scope = scope(account)
        # One lock spans observation and enrollment to serialize local evaluations.
        # It cannot lock the broker or exclude manual Desktop orders.
        with store.transaction() as data:
            known = [t["client_order_id"] for c in data["cohorts"] if c["account_scope"] == account_scope
                     for t in c["treatments"] if t["phase"] != "PLANNED"]
            if len(known) > 20:
                raise StateError("Known-intent detail bound reached; no truncated reconciliation.")
            start = max(now - timedelta(days=7), now.replace(month=1, day=1, hour=0, minute=0, second=0))
            snapshot = collect_current(reader, account, start.isoformat(), now.isoformat(), known)
            if not secret_free(snapshot, (key, secret)):
                raise StateError("Observation contained authentication material; not retained.")
            retain(evidence / "current-state.json", json.dumps(snapshot, indent=2).encode())
            current = inspect(snapshot)
            existing = [c for c in data["cohorts"] if c["account_scope"] == account_scope and c["symbol"] == root]
            for cohort in existing:
                reconcile(cohort, current)
            if args.event_id:
                result = enroll(data, current, account_scope, root, args.event_id, contracts, today)
                cohort, decision = result["cohort"], result["evaluation"]
            else:
                cohort = existing[0] if existing else None
                decision = evaluate(current, account_scope, root, data, cohort["id"] if cohort else None)
            observed = contract_candidates(snapshot, root, today)
            definitions = cohort["treatments"] if cohort else ([{"kind": "DIRECT_STOCK", "symbol": root, "quantity": "100"}]
                + [{"kind": "STATIC_PUT", "symbol": root, "quantity": "1", "contract": c} for c in observed])
            # Preview is observable even when enrollment is blocked. It has no
            # executable price and does not assign persistent IDs to rejected work.
            candidates = [prepare(t) if "client_order_id" in t else {
                "submission_enabled": False, "kind": t["kind"], "quantity": t["quantity"],
                "contract": t.get("contract"), "status": "UNENROLLED_UNPRICED_PREVIEW"} for t in definitions]
            product = {"symbol": root, "mode": "READ_ONLY_PREPARATION", "submission_enabled": False,
                       "eligibility": decision, "account_observation": {
                           k: current[k] for k in ("status", "observed_at", "cash", "net_liquidation_value", "capacity", "reason") if k in current},
                       "candidate_treatments": candidates,
                       "observed_inventory": [{"instrument": list(k), "quantity": str(v)}
                                              for k, v in current.get("quantities", {}).items() if k[0] == root],
                       "contract_scope": "Explicit selected references or currently held contracts only; not a full chain or verified ATM selection.",
                       "broker_observation": "New authenticated reads; sequential bracket, not atomic or a no-propagation-delay guarantee.",
                       "retry_permitted": False}
            if not secret_free(data, (key, secret)) or not secret_free(product, (key, secret)):
                raise StateError("Authentication material refused before experimental retention.")
        # The identity context has now completed replace + directory fsync.
        # Publication is a separate resource: failure must not roll identities
        # back or advertise uncommitted enrollment as successful.
        try:
            retain(evidence / "experiment-result.json", json.dumps(product, indent=2).encode())
        except OSError:
            print("Preview publication failed after the identity transaction completed; committed identities preserved. No order sent or retry authorized.")
            return 1
        print(f"{root} — {decision['status']}; submission disabled")
        print("Reasons: " + "; ".join(decision["reasons"]))
        print("Fresh account observation: " + snapshot["finished_at"])
        if current["status"] == "OBSERVED":
            print(f"Cash ${current['cash']}; NLV ${current['net_liquidation_value']}")
            print("Reported capacity (not equivalent to free cash): " + json.dumps(current["capacity"]))
            for key, quantity in current["quantities"].items():
                if key[0] == root:
                    print("Observed inventory: " + " ".join(key) + "; quantity " + str(quantity))
        print(f"Candidate treatments: {len(candidates)}; unpriced; no submission or retry permitted.")
        for t in definitions:
            label = "buy 100 shares" if t["kind"] == "DIRECT_STOCK" else f"sell 1 {t['contract']['expiration']} ${t['contract']['strike']} put"
            print("  " + label + ("; durable identity retained" if "id" in t else "; not enrolled"))
        print("Contract scope: selected/held references; full listed-expiration and ATM discovery remain unverified.")
        print(f"Private evidence: {evidence}")
        return 1 if decision["status"] == "UNRESOLVED" else 0
    except (AuditError, StateError, OSError, ValueError, KeyError, TypeError):
        print("Experiment evaluation unavailable; no order sent and no retry authorized. Inspect protected evidence.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
