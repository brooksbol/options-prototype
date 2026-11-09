"""Conservative financial observations for the read-only Webull pilot.

Planning clearance is not submission permission, an atomic broker snapshot, a
cash-secured determination, or proof that broker order lists have no delay.
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import re

from activity_records import RecordError, cash_records, order_records, timestamp
from reconcile_lifecycle import unique_cash
from webull_identity import AuditError, HOST, collect_activity


class StateError(ValueError):
    pass


def account_scope(account):
    """Private provider correlation fingerprint, not a canonical Account ID."""
    if not isinstance(account, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", account):
        raise StateError("Invalid observed account scope.")
    return hashlib.sha256((HOST + ":" + account).encode()).hexdigest()


def amount(value):
    try:
        if value is None or isinstance(value, bool):
            raise ValueError()
        result = Decimal(str(value))
        if not result.is_finite():
            raise ValueError()
        return result
    except (InvalidOperation, ValueError, TypeError):
        raise StateError("Missing or invalid financial quantity.") from None


def symbol(value):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Z][A-Z0-9.]{0,9}", value):
        raise StateError("A supported exact underlying symbol is required.")
    return value


def instrument(row, *, position=False):
    """Exact geometry from provider fields; never parse or guess OCC strings."""
    root = symbol(row.get("symbol"))
    kind = row.get("instrument_type") or row.get("provider", {}).get("instrument_type")
    legs = row.get("legs")
    if kind == "EQUITY" or (not position and not legs and kind == "STOCK"):
        return (root, "EQUITY")
    if kind != "OPTION" or not isinstance(legs, list) or len(legs) != 1:
        raise StateError("Unsupported or incomplete instrument scope.")
    leg = legs[0]
    if leg.get("symbol") != root or leg.get("option_type") not in ("PUT", "CALL"):
        raise StateError("Option underlying or right is unresolved.")
    expiry = leg.get("option_expire_date")
    try:
        datetime.strptime(expiry, "%Y-%m-%d")
    except (TypeError, ValueError):
        raise StateError("Option expiration is unresolved.") from None
    strike = amount(leg.get("option_exercise_price" if position else "strike_price"))
    multiplier = amount(leg.get("option_contract_multiplier"))
    deliverable = amount(leg.get("option_contract_deliverable"))
    if strike <= 0 or multiplier != 100 or deliverable != 100:
        raise StateError("Only explicitly reported standard 100-share contracts are supported.")
    return (root, "OPTION", expiry, leg["option_type"], format(strike.normalize(), "f"))


def position_quantities(rows):
    result = {}
    for row in rows:
        key = instrument(row, position=True)
        quantity = amount(row.get("quantity"))
        if quantity != quantity.to_integral_value():
            raise StateError("Fractional inventory is outside this pilot.")
        if key in result and result[key] * quantity < 0:
            raise StateError("Opposing same-instrument rows cannot establish absence by netting.")
        result[key] = result.get(key, Decimal(0)) + quantity
    return {k: v for k, v in result.items() if v}


def valuation(document, boundary):
    """The pilot's existing USD balance relationship, at either read boundary."""
    if document.get("total_asset_currency") != "USD":
        raise StateError(boundary + " balance currency is unsupported or missing.")
    try:
        cash = amount(document.get("total_cash_balance"))
        market = amount(document.get("total_market_value"))
        nav = amount(document.get("total_net_liquidation_value"))
    except StateError:
        raise StateError(boundary + " balance has missing or invalid financial values.") from None
    if abs(cash + market - nav) > Decimal("0.01"):
        raise StateError(boundary + " balance cash + market value does not reconcile to NLV.")
    return cash, market, nav


def observed_orders(snapshot):
    result = {}
    for name in ("working", "history"):
        for row in snapshot["operations"][name]["result"]["normalized_orders"]:
            key = tuple(row["identity"])
            fields = ("client_order_id", "state", "quantity", "filled_quantity", "symbol", "side", "legs")
            if key in result and any(result[key].get(f) != row.get(f) for f in fields):
                raise StateError("Order views disagree; reacquire before planning.")
            result[key] = row
    for detail in snapshot["details"]:
        if detail.get("status") != "OBSERVED":
            raise StateError("A required order-detail lookup is unavailable.")
        for row in detail["normalized_orders"]:
            key = tuple(row["identity"])
            if key in result and any(result[key].get(f) != row.get(f) for f in
                                     ("state", "filled_quantity", "quantity", "side", "symbol", "legs")):
                raise StateError("Order detail conflicts with the observation cut.")
            result[key] = row
    return list(result.values())


def collect_current(reader, account, start, end, client_ids=()):
    snapshot = collect_activity(reader, account, start, end)
    found = {d["client_order_id"] for d in snapshot["details"]}
    # Durable intent IDs are used for lookup only, never as proof of submission.
    for cid in sorted(set(client_ids) - found):
        try:
            raw = reader.order_detail(account, cid)
            snapshot["details"].append({"status": "OBSERVED", "client_order_id": cid,
                                        "normalized_orders": order_records([raw], account)})
        except (ValueError, RuntimeError, AuditError):
            snapshot["details"].append({"status": "FAILED", "client_order_id": cid,
                                        "reason": "Known intent lookup unavailable; no absence or retry inferred."})
    # A changing quantity/order/cash bracket is not a coherent planning cut.
    snapshot["closing"] = {}
    for name, read in (("positions", reader.positions), ("working", reader.working_orders),
                       ("balances", reader.balances)):
        try:
            value = read(account)
            if name == "working":
                value["normalized_orders"] = order_records(value["data"], account)
            snapshot["closing"][name] = {"status": "OBSERVED", "result": value}
        except (ValueError, RuntimeError, AuditError):
            snapshot["closing"][name] = {"status": "FAILED"}
    snapshot["finished_at"] = datetime.now(timezone.utc).isoformat()
    return snapshot


def inspect(snapshot, now=None):
    """Fail closed on unobserved, stale, contradictory or unsupported state."""
    now = now or datetime.now(timezone.utc)
    try:
        start = datetime.fromisoformat(timestamp(snapshot["started_at"]))
        finish = datetime.fromisoformat(timestamp(snapshot["finished_at"]))
        # Engineering observation bound, not a market-quote freshness policy.
        if not timedelta(0) <= now - finish <= timedelta(seconds=60) or not timedelta(0) <= finish - start <= timedelta(seconds=60):
            raise StateError("Account observation is old or acquisition exceeded 60 seconds; reacquire.")
        operations = snapshot["operations"]
        for name in ("balances", "positions", "working", "history", "cash"):
            if operations[name]["status"] != "OBSERVED":
                raise StateError("Required account observations are incomplete.")
        for name in ("working", "history", "cash"):
            if operations[name]["result"].get("complete_for_query") is not True:
                raise StateError("Required pagination/history query is incomplete.")
        try:
            # Reuse lifecycle identity/conflict semantics. The existing source
            # normalizer also prevents a contradictory cached projection from
            # disagreeing with its retained provider row.
            unique_cash([snapshot])
            for row in operations["cash"]["result"]["normalized_activities"]:
                if not isinstance(row.get("provider"), dict):
                    raise StateError("Cash activity provider evidence is missing or malformed.")
                if cash_records([row["provider"]], snapshot["account_id"])[0] != row:
                    raise StateError("Cash activity projection conflicts with its provider evidence.")
        except RecordError as error:
            raise StateError("Cash activity qualification failed: " + str(error)) from None
        if snapshot.get("details_status", "INCOMPLETE").startswith("INCOMPLETE"):
            raise StateError("Order details are incomplete.")
        quantities = position_quantities(operations["positions"]["result"])
        closing = snapshot["closing"]
        if any(closing[n]["status"] != "OBSERVED" for n in ("positions", "working", "balances")):
            raise StateError("Closing observation bracket is incomplete.")
        if quantities != position_quantities(closing["positions"]["result"]):
            raise StateError("Position quantities changed during observation.")
        before_work = operations["working"]["result"]["normalized_orders"]
        after_work = closing["working"]["result"]
        if not after_work.get("complete_for_query") or before_work != after_work["normalized_orders"]:
            raise StateError("Working orders changed during observation.")
        balances = operations["balances"]["result"]
        cash, market, nav = valuation(balances, "Opening")
        closing_cash, _, _ = valuation(closing["balances"]["result"], "Closing")
        if cash != closing_cash:
            raise StateError("Cash changed during observation.")
        mv = sum((amount(p.get("market_value")) for p in operations["positions"]["result"]), Decimal(0))
        if abs(mv - market) > Decimal("0.01"):
            raise StateError("Position market values do not reconcile to balances.")
        usd = [a for a in balances.get("account_currency_assets", []) if a.get("currency") == "USD"]
        if len(usd) != 1:
            raise StateError("Account capacity evidence is unavailable.")
        capacity = {k: str(amount(usd[0].get(k))) for k in ("settled_cash", "buying_power", "option_buying_power")}
        orders = observed_orders(snapshot)
        required = {r["client_order_id"] for r in orders if r.get("client_order_id")}
        detailed = {r.get("client_order_id") for d in snapshot["details"] for r in d.get("normalized_orders", [])}
        if not required <= detailed:
            raise StateError("Enumerated order detail coverage is incomplete.")
        for detail in snapshot["details"]:
            if detail["client_order_id"] not in {r.get("client_order_id") for r in detail["normalized_orders"]}:
                raise StateError("Order lookup returned a different or absent client identity.")
        for row in orders:
            if row.get("account_id") != snapshot["account_id"] or row.get("state") == "UNKNOWN":
                raise StateError("Order account or state is unresolved.")
            instrument(row)
            qty, filled = amount(row.get("quantity")), amount(row.get("filled_quantity"))
            if qty <= 0 or not 0 <= filled <= qty or row.get("side") not in ("BUY", "SELL", "SHORT"):
                raise StateError("Order quantity or side is inconsistent.")
            if row["state"] == "FILLED" and filled != qty:
                raise StateError("Filled order quantity is inconsistent.")
        return {"status": "OBSERVED", "account_scope": account_scope(snapshot["account_id"]),
                "quantities": quantities, "orders": orders,
                "cash": str(cash), "net_liquidation_value": str(nav), "capacity": capacity,
                "observed_at": snapshot["finished_at"],
                "limitation": "Sequential bracket, not atomic broker state; order-list propagation and market-data qualification remain separate."}
    except (KeyError, TypeError, RecordError, StateError) as error:
        return {"status": "UNRESOLVED", "reason": str(error) if isinstance(error, StateError)
                else "Required financial evidence has an unsupported shape."}


def contract_candidates(snapshot, root, today):
    """Only observed contracts, not a full chain, ATM selection, or advice."""
    found = set()
    for row in snapshot.get("operations", {}).get("positions", {}).get("result", []):
        try:
            key = instrument(row, position=True)
            if key[:2] == (root, "OPTION") and key[3] == "PUT":
                dte = (datetime.strptime(key[2], "%Y-%m-%d").date() - today).days
                if 0 <= dte <= 45:
                    found.add(key)
        except StateError:
            continue
    return [{"symbol": k[0], "expiration": k[2], "strike": k[4], "right": "PUT",
             "multiplier": "100", "deliverable": "100", "reference": "CURRENT_POSITION_METADATA"}
            for k in sorted(found)]
