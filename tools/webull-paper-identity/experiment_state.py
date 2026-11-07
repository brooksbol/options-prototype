"""Portfolio-owned experiment identities, not a brokerage ledger or v2 resource.

No network, SDK, credentials, notifications or submission capability. A small
locked, atomically replaced private JSON document survives process failure.
Every evaluation still requires a freshly acquired financial observation.
"""
from contextlib import contextmanager
from datetime import date
import fcntl
import json
import os
from pathlib import Path
import tempfile
import uuid

from acquisition_state import StateError, account_scope, amount, instrument, symbol
from webull_identity import private_directory


def scope(account):
    return account_scope(account)


class ExperimentStore:
    def __init__(self, directory):
        self.directory = Path(directory)
        private_directory(self.directory)

    @contextmanager
    def transaction(self):
        lock = self.directory / "experiment.lock"
        fd = os.open(lock, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, "r+") as stream:
            if os.fstat(stream.fileno()).st_uid != os.getuid() or os.fstat(stream.fileno()).st_mode & 0o077:
                raise StateError("Experiment lock must be owner-only.")
            fcntl.flock(stream, fcntl.LOCK_EX)
            path = self.directory / "experiment.json"
            if path.is_symlink():
                raise StateError("Experiment state cannot be a symlink.")
            if path.exists():
                if path.stat().st_uid != os.getuid() or path.stat().st_mode & 0o077:
                    raise StateError("Experiment state must be owner-only.")
                try:
                    data = json.loads(path.read_text())
                except (ValueError, OSError):
                    raise StateError("Experiment identities are unreadable; no reset or reenrollment.") from None
                if data.get("schema") != 1 or not isinstance(data.get("cohorts"), list):
                    raise StateError("Unrecognized experiment state; no reset.")
            else:
                data = {"schema": 1, "cohorts": []}
            before = json.dumps(data, sort_keys=True)
            yield data
            if json.dumps(data, sort_keys=True) != before:
                handle, name = tempfile.mkstemp(dir=self.directory, prefix=".experiment-")
                try:
                    with os.fdopen(handle, "w") as output:
                        json.dump(data, output, sort_keys=True, indent=2)
                        output.flush()
                        os.fsync(output.fileno())
                    os.replace(name, path)
                    dfd = os.open(self.directory, os.O_RDONLY)
                    try:
                        os.fsync(dfd)
                    finally:
                        os.close(dfd)
                finally:
                    if os.path.exists(name):
                        os.unlink(name)


def treatments(root, contracts, today):
    result = [{"kind": "DIRECT_STOCK", "symbol": root, "quantity": "100"}]
    expirations = set()
    for contract in contracts:
        expiry = date.fromisoformat(contract["expiration"])
        if (contract.get("symbol") != root or contract.get("right") != "PUT"
                or amount(contract.get("multiplier")) != 100 or amount(contract.get("deliverable")) != 100
                or amount(contract.get("strike")) <= 0 or not 0 <= (expiry - today).days <= 45
                or expiry in expirations or not isinstance(contract.get("reference"), str)
                or not contract["reference"]):
            raise StateError("Explicit distinct standard put-DTE references within 45 days are required.")
        expirations.add(expiry)
        result.append({"kind": "STATIC_PUT", "symbol": root, "quantity": "1",
                       "contract": {**contract, "strike": format(amount(contract["strike"]).normalize(), "f")}})
    if not expirations:
        raise StateError("At least one explicitly supplied put reference is required for a cohort.")
    return result


def evaluate(current, account_scope, root, data, cohort_id=None):
    symbol(root)
    if current["status"] != "OBSERVED":
        return {"status": "UNRESOLVED", "reasons": [current["reason"]]}
    if current.get("account_scope") != account_scope:
        raise StateError("Financial observation belongs to a different account scope.")
    existing = [c for c in data["cohorts"] if c["account_scope"] == account_scope and c["symbol"] == root]
    target = next((c for c in existing if c["id"] == cohort_id), None)
    if cohort_id and target is None:
        raise StateError("Cohort does not belong to this account and underlying.")
    if existing and not target:
        return {"status": "BLOCKED", "reasons": ["EXISTING_COHORT"], "cohort_id": existing[0]["id"]}
    actual = {k: v for k, v in current["quantities"].items() if k[0] == root}
    orders = [r for r in current["orders"] if r["symbol"] == root]
    if target:
        own = {t["client_order_id"]: t for t in target["treatments"]}
        # Presence is affirmative evidence; absence never clears uncertainty.
        expected = {}
        seen = set()
        for row in orders:
            child = own.get(row.get("client_order_id"))
            if child is None:
                return {"status": "BLOCKED", "reasons": ["UNASSOCIATED_BROKER_ACTIVITY"]}
            if row["client_order_id"] in seen:
                return {"status": "UNRESOLVED", "reasons": ["CLIENT_ID_HAS_MULTIPLE_BROKER_ORDERS"]}
            seen.add(row["client_order_id"])
            expected_key = (root, "EQUITY") if child["kind"] == "DIRECT_STOCK" else (
                root, "OPTION", child["contract"]["expiration"], "PUT", child["contract"]["strike"])
            if (instrument(row) != expected_key or amount(row["quantity"]) != amount(child["quantity"])
                    or row["side"] != ("BUY" if child["kind"] == "DIRECT_STOCK" else "SELL")):
                return {"status": "UNRESOLVED", "reasons": ["INTENT_BROKER_CONTENT_CONFLICT"]}
            filled = amount(row["filled_quantity"])
            expected[expected_key] = expected.get(expected_key, 0) + filled * (1 if child["kind"] == "DIRECT_STOCK" else -1)
        expected = {k: v for k, v in expected.items() if v}
        if actual != expected:
            return {"status": "UNRESOLVED", "reasons": ["POSITIONS_DO_NOT_RECONCILE_TO_COHORT_OPENINGS"]}
        if any(t["phase"] == "UNCERTAIN" for t in own.values()):
            return {"status": "UNRESOLVED", "reasons": ["SUBMISSION_UNCERTAIN_NO_RESEND"]}
        return {"status": "EXISTING_COHORT", "reasons": ["PLANNED_CHILDREN_PRESERVED"],
                "cohort_id": target["id"], "children": [
                    {"treatment_id": t["id"], "status": "BROKER_OBSERVED" if t["client_order_id"] in seen else
                     "PLANNED_NO_SUBMISSION" if t["phase"] == "PLANNED" else "UNRESOLVED_NO_RESEND"}
                    for t in target["treatments"]]}
    reasons = []
    if actual:
        reasons.append("EXISTING_BROKER_EXPOSURE")
    if any(amount(r["filled_quantity"]) > 0 or r["state"] not in ("CANCELED", "FAILED") for r in orders):
        reasons.append("REPORTED_UNDERLYING_ORDER_ACTIVITY")
    return {"status": "BLOCKED" if reasons else "ELIGIBLE_FOR_PLANNING", "reasons": reasons or [
        "NO_EXPOSURE_OR_ORDER_OBSERVED_AT_THIS_CUT; NOT_EXECUTION_CLEARANCE"]}


def enroll(data, current, account_scope, root, event_id, contracts, today):
    if not isinstance(event_id, str) or not 1 <= len(event_id) <= 128:
        raise StateError("Explicit supplied-event identity is required; no stochastic predicate is inferred.")
    same = [c for c in data["cohorts"] if c["account_scope"] == account_scope and c["event_id"] == event_id]
    definitions = treatments(root, contracts, today)
    if same:
        old = same[0]
        if old["symbol"] != root or old["definitions"] != definitions:
            raise StateError("An event identity cannot change underlying or treatments.")
        return {"cohort": old, "evaluation": evaluate(current, account_scope, root, data, old["id"]), "created": False}
    result = evaluate(current, account_scope, root, data)
    if result["status"] != "ELIGIBLE_FOR_PLANNING":
        return {"cohort": None, "evaluation": result, "created": False}
    cohort = {"id": uuid.uuid4().hex, "account_scope": account_scope, "symbol": root,
              "event_id": event_id, "definitions": definitions, "created_at": current["observed_at"],
              "treatments": [{**t, "id": uuid.uuid4().hex, "intent_id": uuid.uuid4().hex,
                              "client_order_id": uuid.uuid4().hex, "phase": "PLANNED"} for t in definitions]}
    data["cohorts"].append(cohort)
    return {"cohort": cohort, "evaluation": result, "created": True}


def reconcile(cohort, current):
    """Correlation history only. Never synthesize ownership or retry permission."""
    if current["status"] != "OBSERVED":
        return
    if current.get("account_scope") != cohort["account_scope"]:
        raise StateError("Financial observation belongs to a different account scope.")
    for child in cohort["treatments"]:
        rows = [r for r in current["orders"] if r.get("client_order_id") == child["client_order_id"]]
        if len(rows) == 1:
            row = rows[0]
            expected = (child["symbol"], "EQUITY") if child["kind"] == "DIRECT_STOCK" else (
                child["symbol"], "OPTION", child["contract"]["expiration"], "PUT", child["contract"]["strike"])
            if (instrument(row) != expected or amount(row["quantity"]) != amount(child["quantity"])
                    or row["side"] != ("BUY" if child["kind"] == "DIRECT_STOCK" else "SELL")):
                record_uncertainty(cohort, child["intent_id"], "CLIENT_ID_CONTENT_CONFLICT")
                continue
            child["last_observation"] = {"at": current["observed_at"], "state": row["state"],
                                          "filled_quantity": row["filled_quantity"], "order_id": row["order_id"]}
            # Even a positive read cannot erase an uncertain attempt automatically.
            if child["phase"] != "UNCERTAIN":
                child["phase"] = "BROKER_OBSERVED"


def record_uncertainty(cohort, intent_id, evidence_reference):
    """Retain an externally reported unknown outcome; cannot authorize a send.

    This slice never creates such an attempt itself. The operation is useful
    for recovery of an interrupted/externally reported attempt, not simulation
    of an executed order. No automatic clearing or retry transition exists.
    """
    if not isinstance(evidence_reference, str) or not evidence_reference:
        raise StateError("Uncertainty requires an explicit evidence reference.")
    matches = [t for t in cohort["treatments"] if t["intent_id"] == intent_id]
    if len(matches) != 1:
        raise StateError("Unknown intent identity.")
    matches[0]["phase"] = "UNCERTAIN"
    matches[0]["uncertainty_reference"] = evidence_reference


def prepare(child):
    """Unsigned construction data only; no account, token, URL or send method."""
    symbol(child["symbol"])
    if (len(child["client_order_id"]) != 32 or not all(c in "0123456789abcdef" for c in child["client_order_id"])
            or child["quantity"] != ("100" if child["kind"] == "DIRECT_STOCK" else "1")):
        raise StateError("Invalid bounded child quantity or correlation ID.")
    order = {"client_order_id": child["client_order_id"], "combo_type": "NORMAL", "market": "US",
             "symbol": child["symbol"], "quantity": child["quantity"], "entrust_type": "QTY",
             "support_trading_session": "CORE", "time_in_force": "DAY"}
    if child["kind"] == "DIRECT_STOCK":
        order.update(instrument_type="EQUITY", side="BUY", order_type="MARKET")
    elif child["kind"] == "STATIC_PUT":
        c = child["contract"]
        order.update(instrument_type="OPTION", side="SELL", position_intent="SELL_TO_OPEN",
                     option_strategy="SINGLE", order_type="LIMIT", legs=[{
                         "symbol": child["symbol"], "market": "US", "instrument_type": "OPTION",
                         "side": "SELL", "quantity": "1", "option_type": "PUT",
                         "strike_price": c["strike"], "option_expire_date": c["expiration"]}])
    else:
        raise StateError("Only direct-stock and static-put children are supported.")
    return {"submission_enabled": False, "order_fields": order,
            "missing": (["EXECUTION_QUALIFIED_BID_AND_GREEKS", "LIMIT_PRICE_FROM_FRESH_BID"]
                        if child["kind"] == "STATIC_PUT" else ["EXECUTION_QUALIFIED_STOCK_QUOTE"])
                       + ["INDEPENDENT_CONTRACT_AND_ATM_VALIDATION", "CURRENT_CAPACITY_AND_OBLIGATION_RECHECK", "PERMITTED_MARKET_DATA_USE",
                          "SANDBOX_WRITE_ACCEPTANCE", "PRINCIPAL_ORDER_AUTHORIZATION"],
            "retry_permitted": False, "broker_schema_acceptance": "UNTESTED"}
