"""Lossless projections of documented Webull order groups and cash records.

These are observations, not a generic transaction ledger or synthetic fills.
"""
from datetime import datetime, timedelta, timezone


class RecordError(ValueError):
    pass


def timestamp(value, *, epoch_ms=False):
    if value is None:
        return None
    try:
        if epoch_ms:
            if not str(value).isdigit():
                raise ValueError()
            parsed = datetime(1970, 1, 1, tzinfo=timezone.utc) + timedelta(milliseconds=int(value))
        else:
            if not isinstance(value, str) or "T" not in value:
                raise ValueError()
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None or parsed.utcoffset() is None:
                raise ValueError()
        return parsed.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    except (ValueError, OverflowError, TypeError):
        raise RecordError("Invalid provider/query timestamp; original evidence retained when available.") from None


def window(start, end, *, cash=False):
    start, end = timestamp(start), timestamp(end)
    if start is None or end is None:
        raise RecordError("Explicit start and end timestamps are required.")
    a, b = datetime.fromisoformat(start), datetime.fromisoformat(end)
    if not timedelta(0) < b - a <= timedelta(days=31):
        raise RecordError("History window must be ordered and no longer than 31 days.")
    if cash and a.year != b.year:
        raise RecordError("Webull cash activity queries cannot cross calendar years.")
    return start, end


def page(document):
    if (not isinstance(document, dict) or not isinstance(document.get("data"), list)
            or any(not isinstance(row, dict) for row in document["data"])):
        raise RecordError("Unrecognized paginated response schema; inspect private evidence.")
    cursor = document.get("pagination_key")
    if cursor is not None and (not isinstance(cursor, str) or len(cursor) > 4096):
        raise RecordError("Invalid pagination cursor.")
    # Unknown continuation protocols must not silently truncate a result.
    if any(document.get(k) for k in ("has_more", "next_cursor", "next_page_token")):
        raise RecordError("Undocumented continuation indicator; result is incomplete.")
    return document["data"], cursor or None


STATES = {"PENDING": "PENDING", "SUBMITTED": "SUBMITTED", "CANCELLED": "CANCELED",
          "FILLED": "FILLED", "FAILED": "FAILED", "PARTIAL_FILLED": "PARTIALLY_FILLED"}


def order_records(groups, account_id):
    result = []
    for group in groups:
        if not isinstance(group, dict) or not isinstance(group.get("orders"), list):
            raise RecordError("Unrecognized order-group schema.")
        if any(not isinstance(order, dict) for order in group["orders"]):
            raise RecordError("Unrecognized order object.")
        for order in group["orders"]:
            oid, cid = order.get("order_id"), order.get("client_order_id")
            if not any(isinstance(v, str) and v for v in (oid, cid)):
                raise RecordError("Order lacks a stable provider identifier.")
            # Parent/group client IDs must not be substituted for a missing child ID.
            submitted = (timestamp(order["place_time_at"]) if order.get("place_time_at") is not None
                         else timestamp(order.get("place_time"), epoch_ms=True))
            filled = (timestamp(order["filled_time_at"]) if order.get("filled_time_at") is not None
                      else timestamp(order.get("filled_time"), epoch_ms=True))
            result.append({
                "account_id": account_id, "account_reference_source": "request_scope",
                "order_id": oid, "client_order_id": cid,
                "identity": [account_id, "order_id" if oid else "client_order_id", oid or cid],
                "state": STATES.get(order.get("status"), "UNKNOWN"),
                "submitted_at_utc": submitted, "last_execution_at_utc": filled,
                "symbol": order.get("symbol"), "legs": order.get("legs"),
                "side": order.get("side"), "quantity": order.get("total_quantity"),
                "limit_price": order.get("limit_price"),
                "filled_quantity": order.get("filled_quantity"),
                "average_fill_price": order.get("filled_price"),
                "commission": order.get("commission"), "fees": order.get("fees"),
                "group": {k: v for k, v in group.items() if k != "orders"},
                "provider": order,
            })
    return result


def cash_records(rows, account_id):
    result = []
    for row in rows:
        if not isinstance(row.get("id"), str) or not row["id"]:
            raise RecordError("Cash activity lacks a stable provider identifier.")
        if row.get("account_id") not in (None, account_id):
            raise RecordError("Cash activity account differs from request scope.")
        result.append({"account_id": account_id,
                       "account_reference_source": "provider" if row.get("account_id") is not None else "request_scope",
                       "identity": [account_id, row["id"]],
                       "activity_id": row["id"], "event_type": row.get("activity_type"),
                       "event_sub_type": row.get("activity_sub_type"),
                       "occurred_at_utc": timestamp(row.get("biz_time")),
                       "accounting_date": row.get("trade_date"), "currency": row.get("currency"),
                       "net_amount": row.get("net_amount"), "provider": row})
    return result
