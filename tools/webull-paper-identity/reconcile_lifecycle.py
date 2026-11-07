"""Offline, bounded put-lifecycle audit of preserved Webull observations.

No acquisition, order actions, scheduling or strategy decisions. A same-contract
match never establishes replacement identity, and position absence never proves
expiration. Exact original provider observations remain the evidence authority.
"""
import argparse
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path

from activity_records import RecordError, timestamp


def number(value):
    if value is None:
        raise RecordError("Required numeric evidence is missing.")
    try:
        result = Decimal(str(value))
    except InvalidOperation:
        raise RecordError("Invalid numeric evidence.") from None
    if not result.is_finite():
        raise RecordError("Non-finite numeric evidence.")
    return result


def operation(snapshot, name):
    item = snapshot.get("operations", {}).get(name, {})
    if item.get("status") != "OBSERVED":
        raise RecordError("A required account observation failed or is absent.")
    result = item["result"]
    if name in ("history", "cash") and not result.get("complete_for_query"):
        raise RecordError("A required history window is incomplete.")
    return result


def contract(legs, *, position=False):
    if not isinstance(legs, list) or len(legs) != 1:
        return None
    leg = legs[0]
    if not isinstance(leg, dict):
        return None
    try:
        return (leg["symbol"], leg["option_expire_date"],
                number(leg["option_exercise_price" if position else "strike_price"]),
                leg["option_type"], number(leg["option_contract_multiplier"]),
                number(leg["option_contract_deliverable"]))
    except (KeyError, RecordError):
        return None


def timelines(snapshots):
    """Cumulative order fills are kept per stable identity, never summed by read."""
    accounts = {s["account_id"] for s in snapshots}
    if len(accounts) != 1:
        raise RecordError("Cannot reconcile different accounts.")
    result = {}
    for snap in snapshots:
        for row in operation(snap, "history")["normalized_orders"]:
            key = tuple(row["identity"])
            track = result.setdefault(key, {"identity": list(key), "observations": []})
            if row["account_id"] != snap["account_id"]:
                raise RecordError("Order account differs from snapshot.")
            prior = track["observations"][-1] if track["observations"] else None
            item = {k: row.get(k) for k in ("client_order_id", "state", "limit_price", "filled_quantity",
                                           "average_fill_price", "submitted_at_utc", "last_execution_at_utc")}
            if prior is None or {k: v for k, v in prior.items() if k != "observed_at"} != item:
                if prior and prior.get("filled_quantity") is not None and item.get("filled_quantity") is not None:
                    if number(item["filled_quantity"]) < number(prior["filled_quantity"]):
                        raise RecordError("Cumulative filled quantity decreased for a stable order.")
                track["observations"].append({**item, "observed_at": snap.get("finished_at")})
            track["latest_filled_quantity"] = row.get("filled_quantity")
            track["latest_observed_at"] = snap.get("finished_at")
    return list(result.values())


def unique_cash(snapshots):
    result = {}
    for snap in snapshots:
        for row in operation(snap, "cash")["normalized_activities"]:
            if row["account_id"] != snap["account_id"]:
                raise RecordError("Cash activity account differs from snapshot.")
            key = tuple(row["identity"])
            if key in result and result[key]["provider"] != row["provider"]:
                raise RecordError("Conflicting cash records share a provider identity.")
            result[key] = row
    return list(result.values())


def audit(before, after, symbol, expiry, strike, control_shares):
    tracks = timelines([before, after])
    cash = unique_cash([before, after])
    positions = operation(after, "positions")
    balances = operation(after, "balances")
    orders = operation(after, "history")["normalized_orders"]
    # Exact explicit contract terms are required, including lot/delivery size.
    target = (symbol, expiry, number(strike), "PUT", Decimal(100), Decimal(100))
    opening = [r for r in orders if contract(r.get("legs")) == target and r.get("side") == "SELL"
               and r.get("state") == "FILLED" and number(r.get("filled_quantity")) == 1
               and number(r.get("quantity")) == 1]
    closing_trade = any(contract(r.get("legs")) == target and r.get("side") == "BUY"
                        and r.get("state") in ("FILLED", "PARTIALLY_FILLED")
                        and number(r.get("filled_quantity")) > 0 for r in orders)
    stock = sum((number(p.get("quantity")) for p in positions
                 if p.get("symbol") == symbol and p.get("instrument_type") == "EQUITY"), Decimal(0))
    control = number(control_shares)
    prior_stock = sum((number(p.get("quantity")) for p in operation(before, "positions")
                       if p.get("symbol") == symbol and p.get("instrument_type") == "EQUITY"), Decimal(0))
    control_verified = prior_stock == control
    extra = stock - control
    option_qty = Decimal(0)
    metadata_missing = False
    target_position_present = False
    for pos in positions:
        if pos.get("symbol") == symbol and pos.get("instrument_type") == "OPTION":
            terms = contract(pos.get("legs"), position=True)
            if terms is None:
                metadata_missing = True
            elif terms == target:
                option_qty += number(pos.get("quantity"))
                target_position_present |= number(pos.get("quantity")) != 0
    outcome, reasons = "UNRESOLVED", []
    gross = net = charges = economic_outlay = None
    activity_symbol = None
    if len(opening) == 1:
        order = opening[0]
        gross = number(order.get("average_fill_price")) * target[4]
        credits = [r for r in cash if r.get("event_type") == "TRADE" and r.get("event_sub_type") == "SELL"
                   and r.get("occurred_at_utc") == order.get("last_execution_at_utc")
                   and r.get("occurred_at_utc") is not None]
        if len(credits) == 1:
            net = number(credits[0].get("net_amount"))
            charges = gross - net
            activity_symbol = credits[0]["provider"].get("symbol")
            economic_outlay = target[2] * target[5] - net
            if net < 0 or charges < 0:
                reasons.append("Opening cash credit is inconsistent with the reported aggregate fill.")
                activity_symbol = None
    else:
        reasons.append("A unique, fully filled one-contract opening is not established.")
    if not control_verified:
        reasons.append("The prior snapshot does not establish the stated control-share quantity.")
    if closing_trade:
        reasons.append("A filled closing-side trade prevents attribution to a simple held-to-resolution put lifecycle.")
    # Native event subtypes are documented. Symbol correlation must be unique
    # among observed contract terms; it is not a fabricated order-ID link.
    related_terms = [contract(r.get("legs")) for r in orders if r.get("symbol") == symbol and r.get("legs")]
    metadata_missing |= any(terms is None for terms in related_terms)
    competing = {terms for terms in related_terms if terms is not None and terms[1] == expiry}
    as_of = timestamp(after.get("finished_at"))
    events = [r for r in cash if activity_symbol and len(competing) == 1
              and r.get("event_type") == "OPTION_EA"
              and r["provider"].get("symbol") == activity_symbol
              and r.get("occurred_at_utc") is not None
              and opening[0].get("last_execution_at_utc") is not None
              and opening[0]["last_execution_at_utc"] <= r["occurred_at_utc"]
              <= (as_of or "")]
    assignment = [r for r in events if r.get("event_sub_type") == "OPTION_ASSIGNMENT"]
    expiration = [r for r in events if r.get("event_sub_type") == "OPTION_EXPIRATION"]
    strike_debit = any(number(r.get("net_amount")) == -target[2] * target[5] for r in assignment)
    if metadata_missing:
        reasons.append("Option contract metadata is incomplete; absence cannot be established.")
    elif target_position_present:
        reasons.append("The target option is still reported as a position; removal is not established.")
    elif not closing_trade and control_verified and len(opening) == 1 and extra == target[5] and len(assignment) == 1 and strike_debit:
        outcome = "ASSIGNED"
    elif not closing_trade and control_verified and len(opening) == 1 and extra == 0 and len(expiration) == 1 and not assignment:
        outcome = "EXPIRED_WITHOUT_ASSIGNMENT"
    else:
        reasons.append("Option removal, contract-associated event, share delivery and strike cash are not jointly established.")
    if outcome == "UNRESOLVED" and not events:
        reasons.append("No uniquely contract-associated OPTION_EA lifecycle event is available in this window.")
    # Cash and valuation consistency do not select or rewrite a broker mark.
    cash_sum = sum((number(r.get("net_amount")) for r in cash), Decimal(0))
    cash_balance = number(balances.get("total_cash_balance"))
    mv = number(balances.get("total_market_value"))
    nlv = number(balances.get("total_net_liquidation_value"))
    position_mv = sum((number(p.get("market_value")) for p in positions), Decimal(0))
    if outcome != "UNRESOLVED" and (cash_sum != cash_balance or position_mv != mv or cash_balance + mv != nlv):
        outcome = "UNRESOLVED"
        reasons.append("Reported account state does not reconcile with the observed cash/position evidence.")
    inconsistencies = []
    for p in positions:
        if p.get("instrument_type") == "EQUITY" and p.get("last_price") is not None:
            if number(p["quantity"]) * number(p["last_price"]) != number(p["market_value"]):
                inconsistencies.append("Reported equity last price × quantity differs from reported market value.")
    return {"outcome": outcome, "reasons": reasons, "order_timelines": tracks,
            "target_option_quantity": str(option_qty), "control_shares": str(control),
            "prior_control_quantity_verified": control_verified,
            "aggregate_shares": str(stock), "additional_shares": str(extra),
            "assignment_event_count": len(assignment), "expiration_event_count": len(expiration),
            "assignment_strike_debit_observed": strike_debit,
            "opening_gross_credit": str(gross) if gross is not None else None,
            "opening_net_credit": str(net) if net is not None else None,
            "gross_minus_net": str(charges) if charges is not None else None,
            "conditional_assignment_outlay_before_unknown_assignment_charges": str(economic_outlay) if economic_outlay is not None else None,
            "unique_cash_record_count": len(cash), "observed_cash_sum": str(cash_sum),
            "cash_sum_equals_balance": cash_sum == cash_balance,
            "cash_sum_qualification": "Observed records only; completeness/opening balance require separate evidence.",
            "positions_sum_equals_balance_market_value": position_mv == mv,
            "cash_plus_market_equals_nlv": cash_balance + mv == nlv,
            "valuation_inconsistencies": inconsistencies,
            "event_link_qualification": "Native subtype plus observed cash symbol unique among returned expiry contracts; no order ID in cash schema.",
            "as_of": after.get("finished_at")}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before", type=Path, required=True)
    parser.add_argument("--after", type=Path, required=True)
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--expiry", required=True)
    parser.add_argument("--strike", required=True)
    parser.add_argument("--control-shares", required=True)
    args = parser.parse_args()
    # Reuse private evidence retention; this imports no network operation at runtime.
    from webull_identity import ROOT, private_directory, retain, AuditError
    try:
        for directory in (args.before, args.after):
            if not directory.resolve().is_relative_to(ROOT.resolve()):
                raise RecordError("Only private acquisition directories are accepted.")
            private_directory(directory)
        before = json.loads((args.before / "activity-observation.json").read_bytes())
        after = json.loads((args.after / "activity-observation.json").read_bytes())
        result = audit(before, after, args.symbol, args.expiry, args.strike, args.control_shares)
        result["source_runs"] = [str(args.before), str(args.after)]
        result["analysis_source_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
        name = "lifecycle-reconciliation-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ") + ".json"
        retain(args.after / name, json.dumps(result, indent=2).encode())
        print("Put lifecycle outcome:", result["outcome"])
        print("Private reconciliation evidence retained; no API request performed.")
        return 0
    except (RecordError, AuditError, OSError, ValueError, KeyError):
        print("Offline reconciliation failed; inspect private evidence. No acquisition or order action occurred.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
