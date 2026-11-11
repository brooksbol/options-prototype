"""Order construction and reconciliation for PR47's additional lots."""
from collections import Counter
from dataclasses import dataclass
from decimal import Decimal
import hashlib
import json
from pathlib import Path

ENTRY_DATE = "2026-11-11"
EXPIRY = "2026-11-13"
COHORT = tuple(json.loads(Path(__file__).with_name("cohort.json").read_text())["cohort"])


class Blocked(ValueError):
    """A condition that must be surfaced before sending an order."""


def number(value):
    try:
        result = Decimal(str(value))
        if result.is_finite():
            return result
    except ArithmeticError:
        pass
    raise Blocked("Missing or invalid numeric evidence")


def rows(value):
    return value if isinstance(value, list) else [value] if isinstance(value, dict) else []


@dataclass(frozen=True)
class Contract:
    symbol: str
    expiry: str
    strike: Decimal
    occ: str

    @classmethod
    def listed(cls, root, row):
        strike = number(row.get("strike"))
        expiry = row.get("expiration_date")
        occ = root + expiry[2:].replace("-", "") + "C" + f"{int(strike * 1000):08}"
        if strike <= 0 or strike * 1000 != int(strike * 1000) or row.get("symbol") != occ:
            raise Blocked("OCC call identity does not match listed terms")
        return cls(root, expiry, strike, occ)

    def leg(self, side, intent):
        return dict(symbol=self.symbol, market="US", instrument_type="OPTION", quantity="1",
                    option_type="CALL", option_expire_date=self.expiry,
                    strike_price=str(self.strike), side=side, position_intent=intent)


def calls(document, root, expiry):
    result = [Contract.listed(root, row) for row in rows((document.get("options") or {}).get("option"))
              if row.get("underlying") == root and row.get("root_symbol") == root
              and row.get("expiration_date") == expiry and row.get("option_type") == "call"
              and str(row.get("contract_size")) == "100"]
    if not result or len(set(result)) != len(result):
        raise Blocked(f"{root} {expiry}: missing or duplicate standard call listings")
    return result


def select_entry(contracts, greek_result, epoch_seconds):
    if greek_result.get("expiration") != EXPIRY:
        raise Blocked("No Tastytrade Greek evidence for November 13")
    fresh = {}
    for row in greek_result.get("greeks", []):
        delta = number(row.get("delta"))
        age = number(epoch_seconds) - number(row.get("updatedAt")) / 1000
        if -1 <= age <= 120 and 0 <= delta <= 1:
            occ = "".join(row["symbol"].split())
            if occ in fresh:
                raise Blocked(f"Duplicate Greek observation for {occ}")
            fresh[occ] = delta
    missing = [contract.occ for contract in contracts if contract.occ not in fresh]
    if missing:
        raise Blocked(f"Missing or stale Tastytrade Greeks for {len(missing)} calls")
    chosen = min(contracts, key=lambda c: (abs(fresh[c.occ] - Decimal(".50")), -c.strike, c.occ))
    return chosen, fresh[chosen.occ]


def client_id(phase, symbol):
    suffix = hashlib.sha256(f"PR47|2026-11-11|{phase}|{symbol}".encode()).hexdigest()[:20]
    return "PR47" + suffix


def combo(symbol, phase, strategy, side, limit, legs):
    return dict(client_order_id=client_id(phase, symbol), combo_type="NORMAL", instrument_type="OPTION",
                entrust_type="QTY", support_trading_session="CORE", symbol=symbol, market="US",
                order_type="LIMIT", time_in_force="DAY", quantity="1", option_strategy=strategy,
                side=side, limit_price=format(limit, "f"), legs=legs)


def buy_write(contract, stock, option):
    ask, bid = number(stock.get("ask")), number(option.get("bid"))
    debit = ask - bid
    if bid <= 0 or debit <= 0 or debit != debit.quantize(Decimal(".01")):
        raise Blocked("Nonpositive bid, nonpositive buy-write debit, or unsupported price precision")
    shares = dict(symbol=contract.symbol, market="US", instrument_type="EQUITY", side="BUY", quantity="100")
    return combo(contract.symbol, "entry", "COVERED_STOCK", "BUY", debit,
                 [shares, contract.leg("SELL", "SELL_TO_OPEN")])


def roll_order(old, new, close, opened):
    if old.symbol != new.symbol or old.expiry >= new.expiry:
        raise Blocked("Roll destination must be a later call on the same underlying")
    ask, bid = number(close.get("ask")), number(opened.get("bid"))
    if min(ask, bid) <= 0:
        raise Blocked("Roll requires a positive closing ask and opening bid")
    net = bid - ask
    if net == 0:
        net = Decimal("-.01")
    limit = abs(net)
    if limit != limit.quantize(Decimal(".01")):
        raise Blocked("Roll net price exceeds verified decimal precision")
    strategy = "CALENDAR" if old.strike == new.strike else "DIAGONAL"
    return combo(old.symbol, "roll", strategy, "SELL" if net > 0 else "BUY", limit,
                 [old.leg("BUY", "BUY_TO_CLOSE"), new.leg("SELL", "SELL_TO_OPEN")])



def select_roll(old, contracts):
    matches = [contract for contract in contracts if contract.symbol == old.symbol
               and contract.strike == old.strike and contract.expiry > old.expiry]
    if len(matches) != 1:
        raise Blocked(f"{old.symbol}: original strike {old.strike} unavailable or ambiguous at the next expiration")
    return matches[0]


def contract_key(leg):
    return (leg["symbol"], leg["option_type"], leg["option_expire_date"],
            number(leg.get("option_exercise_price", leg.get("strike_price"))))


def contract_identity(contract):
    return (contract.symbol, "CALL", contract.expiry, contract.strike)


def inventory(positions):
    shares, options = Counter(), Counter()
    for row in positions:
        symbol, quantity = row["symbol"], number(row["quantity"])
        if row["instrument_type"] == "EQUITY":
            if quantity < 0 or quantity != int(quantity):
                raise Blocked(f"Unsupported equity quantity for {symbol}")
            shares[symbol] += quantity
            continue
        legs = row.get("legs") or []
        if row.get("option_strategy") == "COVERED_STOCK":
            equity = [leg for leg in legs if leg.get("instrument_type") == "EQUITY"]
            option = [leg for leg in legs if leg.get("option_type") == "CALL"]
            if len(legs) != 2 or len(equity) != 1 or len(option) != 1 or quantity <= 0:
                raise Blocked(f"Unresolved covered-stock shape for {symbol}")
            if equity[0].get("symbol") != symbol:
                raise Blocked(f"Covered-stock underlying differs for {symbol}")
            shares[symbol] += quantity * 100
            quantity, legs = -quantity, option
        elif row.get("option_strategy") != "SINGLE" or len(legs) != 1:
            raise Blocked(f"Unsupported option position shape for {symbol}")
        leg = legs[0]
        if (leg.get("symbol") != symbol or number(leg.get("option_contract_multiplier")) != 100
                or number(leg.get("option_contract_deliverable")) != 100 or quantity != int(quantity)):
            raise Blocked(f"Unresolved option deliverable for {symbol}")
        options[contract_key(leg)] += quantity
    return shares, options


def put_obligation(options):
    return sum((-q * key[3] * 100 for key, q in options.items() if key[1] == "PUT" and q < 0), Decimal(0))


def funding(balance, shares, options, orders, stock_limits):
    # Existing working orders can consume cash or coverage. Their effect is
    # uncertain unless they are our known combos, whose full limits stay reserved.
    if balance.get("open_margin_calls"):
        raise Blocked("Webull reports an open margin call")
    if orders:
        raise Blocked("Existing working or unresolved Webull orders require reconciliation before basket admission")
    for symbol in stock_limits:
        committed = sum(-q for key, q in options.items() if key[:2] == (symbol, "CALL") and q < 0)
        if shares[symbol] < 100 * committed:
            raise Blocked(f"{symbol}: existing call coverage cannot be established")
    usd = [row for row in balance["account_currency_assets"] if row["currency"] == "USD"]
    if len(usd) != 1:
        raise Blocked("Missing USD balance")
    cash = number(usd[0]["cash_balance"])
    stock_bp = number(usd[0]["overnight_buying_power"])
    cost = sum((number(ask) * 100 for ask in stock_limits.values()), Decimal(0))
    puts = put_obligation(options)
    result = dict(cash=cash, stock_buying_power=stock_bp,
                  option_buying_power=number(usd[0]["option_buying_power"]), stock=cost, puts=puts,
                  cash_after=cash - puts - cost, shortfall=max(Decimal(0), cost + puts - cash, cost - stock_bp))
    return result


def order_match(observed, request):
    if observed["symbol"] != request["symbol"] or observed["side"] != request["side"]:
        return False
    if number(observed["quantity"]) != 1 or number(observed["filled_quantity"]) != 1:
        return False
    try:
        fill = number(observed.get("average_fill_price"))
        limit = number(request["limit_price"])
        if fill < 0 or (request["side"] == "BUY" and fill > limit) or (
            request["side"] == "SELL" and fill < limit
        ):
            return False
    except Blocked:
        return False
    # Require explicit constituent side, quantity and geometry. Parent FILLED
    # alone cannot prove attribution of either stock delivery or an option leg.
    def geometry(leg):
        key = contract_key(leg) if leg.get("option_type") else (leg["symbol"], "EQUITY")
        return key, leg["side"], number(leg["quantity"])
    try:
        return Counter(map(geometry, observed.get("legs") or [])) == Counter(map(geometry, request["legs"]))
    except (KeyError, Blocked):
        return False


def reconcile(record, observations, shares, options):
    request = record["request"]
    symbol = request["symbol"]
    observed = [row for row in observations if row.get("client_order_id") == request["client_order_id"]]
    identities = {row.get("order_id") for row in observed}
    if len(identities) != 1 or None in identities or (
        record.get("order_id") and identities != {record["order_id"]}
    ):
        return {"state": "UNRESOLVED_IDENTITY"}
    filled = [row for row in observed if row["state"] == "FILLED"]
    if not filled:
        return {"state": observed[0]["state"]}
    if (any(row["state"] != "FILLED" for row in observed)
            or not all(order_match(row, request) for row in filled)):
        return {"state": "FILLED_LEGS_UNVERIFIED"}
    changes = Counter()
    share_change = 0
    for leg in request["legs"]:
        if leg["instrument_type"] == "EQUITY":
            share_change += 100
        else:
            changes[contract_key(leg)] += 1 if leg["side"] == "BUY" else -1
    baseline = {contract_key(leg): number(leg["baseline_quantity"]) for leg in record["option_baseline"]}
    matched = (shares[symbol] == number(record["shares_before"]) + share_change
               and all(options[key] == baseline[key] + delta for key, delta in changes.items()))
    return {"state": "POSITION_RECONCILED" if matched else "FILL_CONFIRMED_POSITION_PENDING",
            "fill_utc": filled[0].get("last_execution_at_utc")}


def verify_option_quote(contract, row):
    if (row.get("type") != "option" or row.get("symbol") != contract.occ
            or row.get("underlying") != contract.symbol or row.get("root_symbol") != contract.symbol
            or row.get("expiration_date") != contract.expiry or row.get("option_type") != "call"
            or number(row.get("strike")) != contract.strike or str(row.get("contract_size")) != "100"):
        raise Blocked(f"{contract.occ}: option quote identity changed")


def lifecycle(symbol, starting_shares, positions, cash_events, outstanding, equity_orders_changed):
    """Resolve delivery only from exact OCC cash activity AND a complete share bridge.

    Provider rows labeled only by underlying are insufficient when both a put
    and a call can resolve. Closing fills are reconciled independently.
    """
    shares, positions_by_contract = positions
    changes = 0
    results = {}
    for key, occ in outstanding.items():
        if positions_by_contract[key] < 0:
            results[occ] = "OPEN"
            continue
        events = {event["activity_id"]: event for event in cash_events
                  if event.get("event_type") == "OPTION_EA"
                  and "".join(str(event["provider"].get("symbol", "")).split()) == occ}
        if len(events) != 1:
            results[occ] = "UNRESOLVED"
            continue
        event = next(iter(events.values()))
        subtype = event.get("event_sub_type")
        signed = 100 if key[1] == "PUT" else -100
        if subtype == "OPTION_ASSIGNMENT" and number(event.get("net_amount")) == -signed * key[3]:
            changes += signed
            results[occ] = "DELIVERY_PENDING"
        elif subtype == "OPTION_EXPIRATION" and number(event.get("net_amount")) == 0:
            results[occ] = "EXPIRATION_PENDING"
        else:
            results[occ] = "UNRESOLVED"
    if (not equity_orders_changed and "UNRESOLVED" not in results.values()
            and shares[symbol] == number(starting_shares) + changes):
        return {occ: {"DELIVERY_PENDING": "ASSIGNED_DELIVERED",
                      "EXPIRATION_PENDING": "EXPIRED_UNASSIGNED"}.get(status, status)
                for occ, status in results.items()}
    return results
