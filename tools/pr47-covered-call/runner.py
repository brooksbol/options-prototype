"""PR47 Margin Sandbox buy-write and roll runner. Default operations are reads."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack, contextmanager
from copy import deepcopy
from datetime import datetime, timezone
from decimal import Decimal
import fcntl
import hashlib
import json
import os
from pathlib import Path
import select
import subprocess
import sys
import threading
import time

import requests
from webull.data.request.get_option_contracts_request_v2 import GetOptionContractsRequestV2

from experiment import (
    Blocked, COHORT, Contract, ENTRY_DATE, EXPIRY, buy_write, calls, client_id,
    contract_identity, contract_key, funding, inventory, lifecycle, number,
    put_obligation, reconcile, roll_order, rows, select_entry, select_roll, verify_option_quote,
)

# This immutable installed PR46 release composes the proven PR47 transport and
# owns the same on-disk pacing locks currently used by PR46's observer.
HOME = Path.home()
RELEASE = HOME / ".local/share/wheelwright/pr46/releases/20261111T004747Z-0dee8393c03a"
def verify_sources():
    graph = json.loads(Path(__file__).with_name("source-graph.json").read_text())
    roots = {"release": RELEASE, "repository": HOME / "kiro/options",
             "tradier": HOME / "kiro/market-sentinel-audit/src/market_sentinel"}
    for entry in graph["files"]:
        path = roots[entry["root"]] / entry["path"]
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry["sha256"]:
            raise Blocked(f"Recovered dependency changed: {entry['root']}/{entry['path']}")


verify_sources()
sys.path.insert(0, str(RELEASE))
from activity_records import cash_records, order_records
from acquisition_state import valuation
from pr46_execution import ET, Market, qualify as shared_qualify, quote_map
from pr46_proven import _PR47SingleSender, atomic, positive_ack
from pr46_universe import PACER, PLACEMENT_INTERVAL, ROOT as SHARED_ROOT, qualification_slot
from webull_identity import HOST, IdentityReader, load_credentials, retain, secret_free

ROOT = SHARED_ROOT.parent / "pr47-buywrite-roll-20261111"
ORIGINAL = SHARED_ROOT.parent / "pr47-stock-basket/20261109T170831Z/unsigned-batch-1.json"
TRADIER_INTERVAL = 0.65
# Maintain the observer's existing cadence. Every actual send is marked on
# the same route as PR46 and is serialized under its qualification lock.
WEBULL_INTERVAL = 3
FINANCIAL_REFRESH_SECONDS = 15
CATALOG_PATH = "/trading/instruments/options/contracts/list"


def now():
    return datetime.now(timezone.utc)


@contextmanager
def exclusive(path):
    fd = os.open(path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "w") as stream:
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise Blocked(f"Another workflow owns {path.name}") from None
        yield


class Measurements:
    def __init__(self):
        self.start = time.monotonic()
        self.events = []
        self.lock = threading.Lock()

    def mark(self, kind, **fields):
        with self.lock:
            self.events.append(dict(kind=kind, elapsed=time.monotonic() - self.start,
                                    utc=now().isoformat(), **fields))

    def wait(self, route, interval=WEBULL_INTERVAL):
        # The same file names and monotonic marks as PR46's SharedPacer.
        # Timing this bounded extension separates lock contention from pacing.
        name = route.replace(":", "-")
        path = SHARED_ROOT / ("universe-pacing-" + name + ".json")
        lock = SHARED_ROOT / ("universe-pacing-" + name + ".lock")
        fd = os.open(lock, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, "r+") as stream:
            started = time.monotonic()
            fcntl.flock(stream, fcntl.LOCK_EX)
            self.mark("lock_wait", route=route + ":pacer", seconds=time.monotonic() - started)
            data = json.loads(path.read_text()) if path.exists() else {}
            delay = max(0, interval - (time.monotonic() - data.get(route, 0)))
            started = time.monotonic()
            if delay:
                time.sleep(delay)
            self.mark("pacing_wait", route=route, seconds=time.monotonic() - started)
            atomic(path, {route: time.monotonic()})

    def summary(self):
        events = self.events
        sends = [e["elapsed"] for e in events if e["kind"] == "accepted"]
        waits = Counter()
        for e in events:
            if e["kind"] in {"pacing_wait", "lock_wait", "worker_lock_wait"}:
                waits[e.get("route", e["kind"])] += e["seconds"]
        latency = sorted(e["preparation_to_ack"] for e in events if e["kind"] == "accepted")
        p95 = latency[(95 * len(latency) + 99) // 100 - 1] if latency else None
        providers = Counter(e["route"] for e in events if e["kind"] == "request")
        return dict(startup_to_prepared=next((e["elapsed"] for e in events if e["kind"] == "prepared"), None),
                    startup_to_ack=sends[0] if sends else None, accepted=len(sends),
                    accepted_peak_60s=max((sum(at - 60 < value <= at for value in sends)
                                           for at in sends), default=0),
                    accepted_per_minute=(len(sends) * 60 / (sends[-1] - sends[0]) if len(sends) > 1 else None),
                    preparation_to_ack_p50_seconds=(latency[(len(latency) - 1) // 2] if latency else None),
                    preparation_to_ack_p95_seconds=p95, requests=dict(providers),
                    requests_per_accepted={k: v / len(sends) for k, v in providers.items()} if sends else None,
                    waits_seconds=dict(waits), events=events)


class Reader(IdentityReader):
    def __init__(self, credentials, path, measurements):
        path.mkdir(mode=0o700)
        super().__init__(*credentials, path)
        self.measurements = measurements

    def _read(self, kind, account_id=None, **parameters):
        route = "webull:" + kind
        self.measurements.wait(route)
        self.measurements.mark("request", route=route)
        return super()._read(kind, account_id, **parameters)


class Providers:
    def __init__(self, path, measurements):
        self.path = path
        self.measurements = measurements
        self.tradier = Market(path / "tradier")
        self.greek_worker = None
        self.tradier_lock = threading.Lock()
        self.greek_lock = threading.Lock()
        self.clock = None
        self.clock_at = 0

    def _market(self, endpoint, **params):
        self.measurements.wait("tradier", TRADIER_INTERVAL)
        self.measurements.mark("request", route="tradier:" + endpoint)
        return self.tradier.get(endpoint, **params)

    def market(self, endpoint, **params):
        start = time.monotonic()
        with self.tradier_lock:
            self.measurements.mark("worker_lock_wait", route="tradier:worker", seconds=time.monotonic() - start)
            return self._market(endpoint, **params)

    def prices(self, symbols):
        # Single exact batch of bid/ask books. Session clock can be reused
        # within its own qualification window, never as a proxy for quote age.
        start = time.monotonic()
        with self.tradier_lock:
            self.measurements.mark("worker_lock_wait", route="tradier:worker", seconds=time.monotonic() - start)
            if self.clock is None or time.monotonic() - self.clock_at >= 30:
                self.clock, _ = self._market("clock")
                self.clock_at = time.monotonic()
            document, meta = self._market("quotes", symbols=",".join(symbols), greeks="false")
            return quote_map(document, symbols), meta, self.clock

    def greeks(self, symbol):
        start = time.monotonic()
        with self.greek_lock:
            self.measurements.mark("worker_lock_wait", route="tastytrade:worker", seconds=time.monotonic() - start)
            if self.greek_worker is None:
                script = Path(__file__).with_name("greek-worker.mjs")
                credential_source = HOME / "kiro/options/scripts/tastytrade.mjs"
                self.greek_worker = subprocess.Popen(["node", script, credential_source], text=True,
                                                    stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                                    stderr=subprocess.DEVNULL, bufsize=1)
            worker = self.greek_worker
            worker.stdin.write(json.dumps(dict(symbol=symbol, expiration=EXPIRY)) + "\n")
            worker.stdin.flush()
            if not select.select([worker.stdout], [], [], 55)[0]:
                raise Blocked("Tastytrade Greek worker timed out")
            raw = worker.stdout.readline()
            if not raw:
                raise Blocked("Tastytrade Greek worker exited")
            result = json.loads(raw)
            for kind, count in result["requests"].items():
                for _ in range(count):
                    self.measurements.mark("request", route="tastytrade:" + kind)
            retain(self.path / f"greeks-{symbol}-{time.time_ns()}.json", raw.encode())
            return result

    def close(self):
        self.tradier.close()
        if self.greek_worker:
            self.greek_worker.stdin.close()
            try:
                self.greek_worker.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.greek_worker.kill()
                self.greek_worker.wait(timeout=5)


class Broker:
    def __init__(self, path, measurements):
        self.path = path
        self.measurements = measurements
        self.credentials = load_credentials()
        self.reader = self.new_reader("identity")
        original = json.loads(ORIGINAL.read_text())["account_id"]
        accounts = self.reader.accounts()
        matching = [a for a in accounts if a.get("account_id") == original
                    and a.get("account_class") == "INDIVIDUAL_MARGIN"
                    and a.get("account_number", "").endswith("GRA5")]
        if len(matching) != 1:
            raise Blocked("Exact original Webull Sandbox Individual Margin GRA5 account was not verified")
        self.account = original

    def new_reader(self, label):
        return Reader(self.credentials, self.path / f"{label}-{time.time_ns()}", self.measurements)

    def snapshot(self, history=False):
        before = now()
        queries = {"positions": lambda r: r.positions(self.account),
                   "balance": lambda r: r.balances(self.account),
                   "working": lambda r: r.working_orders(self.account)}
        if history:
            since = "2026-11-09T00:00:00+00:00"
            queries.update(history=lambda r: r.historical_orders(self.account, since, before.isoformat()),
                           cash=lambda r: r.cash_activities(self.account, since, before.isoformat()))

        def observe(item):
            key, read = item
            return key, read(self.new_reader(key))

        with ThreadPoolExecutor(max_workers=len(queries)) as pool:
            observed = dict(pool.map(observe, queries.items()))
        for key in ("working", "history", "cash"):
            if key in observed and not observed[key]["complete_for_query"]:
                raise Blocked(f"Incomplete {key} observation")
        # Match PR46's opening/closing financial bracket using the covered
        # stock-aware inventory normalization. Acquisition is outside any ledger lock.
        closing_queries = {key: queries[key] for key in ("positions", "balance", "working")}
        with ThreadPoolExecutor(max_workers=3) as pool:
            closing = dict(pool.map(observe, closing_queries.items()))
        if not closing["working"]["complete_for_query"]:
            raise Blocked("Incomplete closing working-order view")
        working = order_records(observed["working"]["data"], self.account)
        if (inventory(observed["positions"]) != inventory(closing["positions"])
                or working != order_records(closing["working"]["data"], self.account)):
            raise Blocked("Inventory or working orders changed within the financial cut")
        balance = observed["balance"]
        cash, market, _ = valuation(balance, "Opening")
        closing_cash, _, _ = valuation(closing["balance"], "Closing")
        for boundary in (balance, closing["balance"]):
            usd = [row for row in boundary["account_currency_assets"] if row.get("currency") == "USD"]
            if len(usd) != 1 or number(usd[0].get("cash_balance")) != number(boundary["total_cash_balance"]):
                raise Blocked("USD cash disagrees with the total cash used for reconciliation")
        position_value = sum((number(row["market_value"]) for row in observed["positions"]), Decimal(0))
        if cash != closing_cash or abs(position_value - market) > Decimal(".01"):
            raise Blocked("Cash or position valuation failed financial-cut reconciliation")
        if (now() - before).total_seconds() > 60:
            raise Blocked("Financial observation exceeded the retained 60-second bound")
        history_rows = order_records(observed["history"]["data"], self.account) if history else []
        cash = cash_records(observed["cash"]["data"], self.account) if history else []
        return dict(balance=observed["balance"], inventory=inventory(observed["positions"]),
                    working=working, orders=history_rows, cash=cash, observed_at=now().isoformat())

    def catalog(self, contract):
        # Narrow call equivalent of the existing PR47 exact-catalog GET.
        request = GetOptionContractsRequestV2()
        request.set_endpoint(HOST)
        request.set_category("US_OPTION")
        request.set_option_symbols(contract.occ)
        request.set_status("LISTING")
        request.set_option_type("CALL")
        request.set_show_deliverables("true")
        url = "https://" + HOST + CATALOG_PATH
        prepared = requests.Request("GET", url, params=request.get_query_params()).prepare()
        if HOST != "api.sandbox.webull.com" or prepared.url.split("?")[0] != url or (
            request.get_action_name() != CATALOG_PATH or request.get_method() != "GET"
        ):
            raise Blocked("Unexpected exact-contract endpoint")
        prepared.headers.update(self.reader._signer.sign(request))
        self.measurements.wait("webull:contracts")
        self.measurements.mark("request", route="webull:contracts")
        with requests.Session() as session:
            session.trust_env = False
            with session.send(prepared, allow_redirects=False, verify=True, proxies={},
                              timeout=(5, 15), stream=True) as response:
                body = bytearray()
                for chunk in response.iter_content(65536):
                    body.extend(chunk)
                    if len(body) > 2_000_000:
                        raise Blocked("Oversized exact-contract response")
                document = json.loads(body)
                secrets = self.credentials + tuple(v for k, v in prepared.headers.items()
                                                   if k.lower() in {"x-signature", "x-access-token"})
                if not secret_free(document, secrets):
                    raise Blocked("Authentication material in exact-contract response")
                retain(self.path / f"{contract.occ}-catalog-{time.time_ns()}.json", bytes(body))
                if response.status_code != 200:
                    raise Blocked(f"{contract.occ}: Webull catalog HTTP {response.status_code}")
        candidates = [r for r in document.get("data", []) if r.get("symbol") == contract.occ]
        if len(candidates) != 1 or document.get("pagination_key"):
            raise Blocked(f"{contract.occ}: Webull exact contract unavailable")
        row = candidates[0]
        delivery = row.get("deliverables", [])
        if (row.get("underlying_symbol") != contract.symbol or row.get("expiration_date") != contract.expiry
                or number(row.get("strike_price")) != contract.strike or row.get("option_type") != "CALL"
                or row.get("status") != "LISTING" or row.get("tradable_status") != "OC"
                or row.get("def_type") != "STANDARD" or row.get("style") != "AMERICAN"
                or row.get("settlement_method") != "PHYSICAL" or row.get("currency") != "USD"
                or row.get("underlying_type") != "EQUITY_CALL_OPTION" or number(row.get("multiplier")) != 100
                or len(delivery) != 1 or delivery[0].get("symbol") != contract.symbol
                or delivery[0].get("asset_type") != "EQUITY" or number(delivery[0].get("amount")) != 100
                or number(delivery[0].get("allocation_percentage")) != 100
                or not row.get("underlying_instrument_id")
                or delivery[0].get("instrument_id") != row["underlying_instrument_id"]):
            raise Blocked(f"{contract.occ}: Webull contract/deliverable qualification failed")
        return row


class ComboSender(_PR47SingleSender):
    def __init__(self, broker, order, path, validate, measurements):
        super().__init__(broker.reader, broker.account, order, path)
        self.expected = deepcopy(order)
        self.validate_evidence = validate
        original_send = self.session.send

        def measured_send(prepared, **kwargs):
            route = "webull:" + ("preview" if prepared.url.endswith("/preview") else "place")
            if route == "webull:place":
                self.validate_evidence()
                PACER.mark(route)
            measurements.mark("request", route=route)
            measurements.mark("http_send", route=route, client_order_id=order["client_order_id"])
            return original_send(prepared, **kwargs)

        self.session.send = measured_send

    def validate_geometry(self):
        if (self.order != self.expected or self.order["symbol"] not in COHORT
                or self.order["option_strategy"] not in {"COVERED_STOCK", "CALENDAR", "DIAGONAL"}):
            raise Blocked("Frozen PR47 combo geometry changed")
        self.validate_evidence()


def qualify(books, meta, clock, now=None):
    """Compose PR46 transport checks with the proven PR47 quote-clock meaning.

    Portfolio Nov 9 execution report records same-session last-change clocks
    and <=5s receipt age. Last-change age/skew is disclosed independently and
    does not establish how recently a real-time quote snapshot was delivered.
    """
    result = shared_qualify(books, meta, clock, now)
    sources = [side for observation in result["observations"] for side in observation["sides"].values()]
    complete = bool(books) and len(sources) == 2 * len(books)
    ages = [side["age_seconds"] for side in sources]
    result["source_skew_seconds"] = max(ages) - min(ages) if complete else None
    if complete and all(side["age_seconds"] >= 0 for side in sources):
        last_change_reasons = {"SOURCE_AGE_BID", "SOURCE_AGE_ASK", "SOURCE_CLOCK_SKEW"}
        result["reasons"] = [reason for reason in result["reasons"] if reason not in last_change_reasons]
    if not books:
        result["reasons"].append("INCOMPLETE_QUOTE_EVIDENCE")
    result["status"] = "UNQUALIFIED" if result["reasons"] else "QUALIFIED"
    result["policy"] = dict(response_age_seconds=5, source_clocks="NONFUTURE_SAME_CORE_SESSION",
                            last_change_age_and_skew="DISCLOSED",
                            precedent="Portfolio 2026-11-09-aristocrats-paper-execution-report.md, Tradier production prices")
    return result


def qualify_equities(books, meta, clock):
    failures = {}
    for symbol, book in books.items():
        quality = qualify([book], meta, clock)
        if book.get("type") != "stock" or quality["status"] != "QUALIFIED":
            failures[symbol] = quality["reasons"] or ["EXPECTED_EQUITY"]
    if failures:
        raise Blocked("Basket equity quotes unqualified: " + json.dumps(failures))


def qualified(books, meta, clock):
    quality = qualify(list(books.values()), meta, clock)
    if quality["status"] != "QUALIFIED":
        raise Blocked("Tradier qualification: " + ", ".join(quality["reasons"]))
    return quality


def session_window(phase):
    when = now().astimezone(ET)
    if when.date().isoformat() != (ENTRY_DATE if phase == "entry" else EXPIRY) or when.hour < 10:
        raise Blocked("Order placement is outside the experiment's date or before 10:00 a.m. Eastern")


def reserve_order(state, phase, order, cut, limit, prepared_at):
    cid = order["client_order_id"]
    if cid in state["orders"]:
        raise Blocked("Original reservation or claim exists. Reconcile by original client ID")
    symbol = order["symbol"]
    shares, options = cut["inventory"]
    state["orders"][cid] = dict(phase=phase, request=order, shares_before=shares[symbol],
                               cash_reservation=limit, coverage_reservation_shares=100,
                               prepared_at=prepared_at, status="ATTEMPT_RECORDED",
                               option_baseline=[dict(leg, baseline_quantity=options[contract_key(leg)])
                                                for leg in order["legs"] if leg.get("option_type")])
    atomic(ROOT / "state.json", state)


def entry_preflight(broker, providers, state):
    cut = broker.snapshot(history=True)
    records = state["orders"]
    original_ids = {client_id("entry", symbol) for symbol in COHORT}
    if any(cid not in original_ids or record["phase"] != "entry" for cid, record in records.items()):
        raise Blocked("Entry cannot continue from a different phase")
    for row in cut["orders"] + cut["working"]:
        cid = row.get("client_order_id")
        if cid in original_ids and cid not in records:
            raise Blocked("Broker history has an original entry identity without a retained reservation")
    for record in records.values():
        if reconcile(record, cut["orders"] + cut["working"], *cut["inventory"])["state"] != "POSITION_RECONCILED":
            raise Blocked("Prior entry is still working or unresolved. Reconcile before resuming unattempted names")
    remaining = tuple(symbol for symbol in COHORT if client_id("entry", symbol) not in records)
    if not remaining:
        raise Blocked("All original entry identities are already reconciled")
    books, meta, clock = providers.prices(remaining)
    qualify_equities(books, meta, clock)
    limits = {s: number(books[s]["ask"]) for s in remaining}
    capacity = funding(cut["balance"], *cut["inventory"], cut["working"], limits)
    print(json.dumps({"whole_basket": capacity, "remaining": len(remaining)}, default=str), flush=True)
    if capacity["shortfall"] > 0:
        raise Blocked(f"Remaining full basket is short by ${capacity['shortfall']}; no orders admitted")
    for symbol in remaining:
        if cut["inventory"][0][symbol] < 100:
            raise Blocked(f"{symbol}: the original covered stock lot is missing")
    return cut, limits, capacity


def friday_puts(positions):
    return [dict(symbol=symbol, option_type=kind, option_expire_date=expiry, strike_price=str(strike),
                 quantity=str(-quantity))
            for (symbol, kind, expiry, strike), quantity in positions.items()
            if kind == "PUT" and expiry == EXPIRY and quantity < 0]


def check_cut_age(cut):
    if not 0 <= (now() - datetime.fromisoformat(cut["observed_at"])).total_seconds() < 20:
        raise Blocked("Account cut aged before dispatch")


def check_entry_cut(current, opening, state, symbol, selected, limits):
    check_cut_age(current)
    shares, options = current["inventory"]
    initial_shares, initial_options = opening["inventory"]
    known = state["orders"]
    if any(row.get("client_order_id") not in known for row in current["working"]):
        raise Blocked("New external working order observed during the run")
    if shares[symbol] != initial_shares[symbol] or any(
        options[key] != initial_options[key] for key in options.keys() | initial_options.keys()
        if key[0] == symbol
    ):
        raise Blocked(f"{symbol}: stock or option inventory changed since basket admission")
    if options[contract_identity(selected)] != 0:
        raise Blocked(f"{symbol}: selected contract already has an exposure")
    known_by_symbol = {record["request"]["symbol"]: record for record in known.values()}
    remaining = {name: price for name, price in limits.items() if name not in known_by_symbol}
    # A lagging position view leaves its original cash claim reserved.
    unseen = sum((number(record["cash_reservation"]) for name, record in known_by_symbol.items()
                  if shares[name] != number(record["shares_before"]) + 100
                  or options[contract_identity(record_contract(record))] != -1), Decimal(0))
    fresh = funding(current["balance"], shares, options, [], remaining)
    original = funding(opening["balance"], initial_shares, initial_options, [], limits)
    shortfall = max(original["shortfall"], fresh["shortfall"], unseen - fresh["cash_after"],
                    unseen + fresh["stock"] - fresh["stock_buying_power"])
    if shortfall > 0:
        raise Blocked(f"Refreshed full-basket funding shortfall ${shortfall}")


def try_prepare(providers, broker, symbol):
    document, _ = providers.market("options/chains", symbol=symbol, expiration=EXPIRY, greeks="false")
    contracts = calls(document, symbol, EXPIRY)
    greek = providers.greeks(symbol)
    selected, delta = select_entry(contracts, greek, now().timestamp())
    broker.catalog(selected)
    return contracts, greek, selected, delta, time.monotonic()


def submit(broker, order, phase, cut, reserved_cash, state, validate, prepared_at, evidence):
    path = broker.path / order["client_order_id"]
    path.mkdir(mode=0o700)
    sender = ComboSender(broker, order, path, validate, broker.measurements)
    retain(path / "unsigned-order.json", json.dumps(sender.package).encode())
    atomic(path / "pre-send-audit.json", dict(evidence, cash_reservation=reserved_cash,
                                              account_observed_at=cut["observed_at"],
                                              request_sha256=sender.package["sha256"]))
    broker.measurements.wait("webull:place", PLACEMENT_INTERVAL)
    session_window(phase)
    check_cut_age(cut)
    validate()
    reserve_order(state, phase, order, cut, reserved_cash, now().isoformat())
    record = state["orders"][order["client_order_id"]]
    try:
        result = sender.place_once(placement_authorized=True)
        if not positive_ack(result, order):
            raise Blocked(f"Webull HTTP {result.get('http_status')} or unresolved acknowledgment")
        record.update(status="ACCEPTED", order_id=result["response"]["order_id"], acknowledged_at=now().isoformat())
        broker.measurements.mark("accepted", client_order_id=order["client_order_id"],
                                 preparation_to_ack=time.monotonic() - prepared_at)
    except Exception:
        record["status"] = "UNCERTAIN"
        raise
    finally:
        atomic(ROOT / "state.json", state)


def entry(broker, providers, state, execute):
    cut, limits, capacity = entry_preflight(broker, providers, state)
    errors = {}
    candidates = {}
    # Catalog preparation, Greek subscriptions, and read-only Tradier work can
    # overlap across providers. Per-provider worker I/O stays serialized.
    pending = tuple(limits)
    for wave in range(3):
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {symbol: pool.submit(try_prepare, providers, broker, symbol) for symbol in pending}
            for symbol, future in futures.items():
                try:
                    candidates[symbol] = future.result()
                    errors.pop(symbol, None)
                    broker.measurements.mark("prepared", symbol=symbol)
                except Exception as error:
                    errors[symbol] = str(error)
                    print(json.dumps({"symbol": symbol, "blocker": str(error), "preparation_wave": wave + 1}),
                          flush=True)
        # Only pre-send Greek-data failures get another bounded read. Retain
        # successful preparations and revalidate their Greeks before dispatch.
        pending = tuple(symbol for symbol, error in errors.items()
                        if error.startswith("Missing or stale Tastytrade Greeks"))
        if not pending:
            break
        if wave < 2:
            time.sleep(3)
    if errors:
        raise Blocked(f"Entry preparation blocked on {len(errors)}/{len(limits)} remaining symbols; no orders admitted")
    prices = {}
    # Funding refresh after catalog and Greeks preparation. Gross stock limits
    # reserve the shares even though the combo uses a smaller net debit.
    cut, limits, capacity = entry_preflight(broker, providers, state)
    state.setdefault("friday_puts", friday_puts(cut["inventory"][1]))
    state.setdefault("baseline_at", cut["observed_at"])
    state.setdefault("baseline_shares", {symbol: str(cut["inventory"][0][symbol]) for symbol in COHORT})
    current = cut
    for symbol, (contracts, greek, selected, delta, prepared_at) in candidates.items():
        try:
            if select_entry(contracts, greek, now().timestamp())[0] != selected:
                raise Blocked("Prepared selection changed")
        except Blocked:
            greek = providers.greeks(symbol)
            fresh, delta = select_entry(contracts, greek, now().timestamp())
            if fresh != selected:
                broker.catalog(fresh)
            selected = fresh
        if (now() - datetime.fromisoformat(current["observed_at"])).total_seconds() >= FINANCIAL_REFRESH_SECONDS:
            current = broker.snapshot()
        wait_start = time.monotonic()
        with qualification_slot():
            broker.measurements.mark("lock_wait", route="webull:qualification", seconds=time.monotonic() - wait_start)
            books, meta, clock = providers.prices((symbol, selected.occ))
            try:
                if books[symbol].get("type") != "stock":
                    raise Blocked("Expected an equity book")
                verify_option_quote(selected, books[selected.occ])
                order = buy_write(selected, books[symbol], books[selected.occ])
                def validate():
                    qualified(books, meta, clock)
                    check_entry_cut(current, cut, state, symbol, selected, limits)
                    if select_entry(contracts, greek, now().timestamp())[0] != selected:
                        raise Blocked("Selected Greek evidence changed before send")
                validate()
                limits[symbol] = number(books[symbol]["ask"])
                check_entry_cut(current, cut, state, symbol, selected, limits)
                prices[symbol] = dict(contract=selected.occ, delta=delta, limit=order["limit_price"])
                if execute:
                    submit(broker, order, "entry", current, limits[symbol] * 100, state, validate, prepared_at,
                           dict(quotes=books, quote_meta=meta, clock=clock, selected_delta=delta, greek=greek,
                                stock_reservations=limits, whole_basket=capacity))
            except Exception as error:
                errors[symbol] = str(error)
                print(json.dumps({"symbol": symbol, "blocker": str(error)}), flush=True)
                if execute:
                    raise
    atomic(broker.path / "entry-plan.json", dict(orders=prices, blockers=errors, funding=capacity))
    if errors:
        raise Blocked(f"Final quotes blocked {len(errors)}/{len(COHORT)} names")


def next_expiration(providers, symbol):
    document, _ = providers.market("options/expirations", symbol=symbol, includeAllRoots="true",
                                   contractSize="true", expirationType="true")
    listed = rows((document.get("expirations") or {}).get("expiration"))
    dates = sorted(row["date"] for row in listed if row.get("date", "") > EXPIRY)
    if not dates:
        raise Blocked(f"{symbol}: no listed expiration after {EXPIRY}")
    return dates[0]


def record_contract(record):
    leg = next(leg for leg in record["request"]["legs"] if leg.get("position_intent") == "SELL_TO_OPEN")
    symbol, _, expiry, strike = contract_key(leg)
    return Contract(symbol, expiry, strike, symbol + expiry[2:].replace("-", "") + "C" + f"{int(strike * 1000):08}")


def observe(broker, state, save=False):
    cut = broker.snapshot(history=True)
    shares, options = cut["inventory"]
    observations = cut["orders"] + cut["working"]
    statuses = {}
    for cid, record in state["orders"].items():
        result = reconcile(record, observations, shares, options)
        # A later roll or expiration can remove an already reconciled call.
        # Keep the first position proof, alongside the latest observation.
        if result["state"] in {"POSITION_RECONCILED", "FILL_CONFIRMED_POSITION_PENDING"}:
            record.setdefault("fill_observed_at", cut["observed_at"])
            if result["fill_utc"] and not record.get("fill_utc"):
                record["fill_utc"] = result["fill_utc"]
        if result["state"] == "POSITION_RECONCILED":
            record.setdefault("position_reconciled_at", cut["observed_at"])
        result.update(accepted_at=record.get("acknowledged_at"),
                      fill_observed_at=record.get("fill_observed_at"),
                      position_reconciled_at=record.get("position_reconciled_at"))
        statuses[cid] = result
        broker.measurements.mark("reconciliation", client_order_id=cid, **result)
    for symbol in COHORT:
        entry_record = state["orders"].get(client_id("entry", symbol))
        puts = [leg for leg in state.get("friday_puts", []) if leg["symbol"] == symbol]
        if not entry_record and not puts:
            continue
        if entry_record and not entry_record.get("position_reconciled_at"):
            statuses[client_id("entry", symbol)]["delivery"] = {"status": "ENTRY_NOT_POSITION_RECONCILED"}
            continue
        active = {}
        if entry_record:
            old = record_contract(entry_record)
            active[contract_identity(old)] = old.occ
        roll_id = client_id("roll", symbol)
        roll_record = state["orders"].get(roll_id)
        if roll_record:
            if not roll_record.get("position_reconciled_at"):
                statuses[client_id("entry", symbol)]["delivery"] = {"status": "ROLL_UNRESOLVED"}
                continue
            new = record_contract(roll_record)
            active = {contract_identity(new): new.occ}
        for leg in state.get("friday_puts", []):
            key = contract_key(leg)
            if key[0] == symbol:
                active[key] = (symbol + key[2][2:].replace("-", "") + "P"
                               + f"{int(key[3] * 1000):08}")
        entry_at = entry_record.get("fill_utc") if entry_record else state.get("baseline_at")
        if not entry_at:
            continue
        equity_changed = any(row["state"] in {"FILLED", "PARTIALLY_FILLED"} and row["symbol"] == symbol
                             and row.get("last_execution_at_utc", "") and row["last_execution_at_utc"] > entry_at
                             and not row.get("legs") for row in cut["orders"])
        activities = [event for event in cut["cash"] if (event.get("occurred_at_utc") or "") >= entry_at]
        base_shares = (number(entry_record["shares_before"]) + 100 if entry_record
                       else number(state["baseline_shares"][symbol]))
        statuses.setdefault(client_id("entry", symbol), {})["delivery"] = lifecycle(
            symbol, base_shares, cut["inventory"], activities, active, equity_changed,
        )
    if save:
        atomic(ROOT / "state.json", state)
    counts = dict(accepted=sum(r.get("accepted_at") is not None for r in statuses.values()),
                  filled=sum(r.get("fill_observed_at") is not None for r in statuses.values()),
                  reconciled=sum(r.get("position_reconciled_at") is not None for r in statuses.values()))
    atomic(broker.path / "reconciliation.json", dict(counts=counts, orders=statuses))
    print(json.dumps({"reconciliation": counts}), flush=True)
    return cut, statuses


def check_roll_cut(cut, state, old, new, debit):
    check_cut_age(cut)
    shares, options = cut["inventory"]
    open_calls = sum(-q for key, q in options.items() if key[:2] == (old.symbol, "CALL") and q < 0)
    if (options[contract_identity(old)] != -1 or options[contract_identity(new)] != 0
            or shares[old.symbol] < 100 * open_calls):
        raise Blocked(f"{old.symbol}: old call, destination, or retained share coverage changed")
    if any(row.get("client_order_id") not in state["orders"] for row in cut["working"]):
        raise Blocked("External working order requires fresh funding and coverage reconciliation")
    usd = next(row for row in cut["balance"]["account_currency_assets"] if row["currency"] == "USD")
    current_id = client_id("roll", old.symbol)
    unseen = sum((number(record["cash_reservation"]) for cid, record in state["orders"].items()
                  if cid != current_id and record["phase"] == "roll"
                  and not record.get("position_reconciled_at")), Decimal(0))
    capacity = min(number(usd["cash_balance"]) - put_obligation(options),
                   number(usd["option_buying_power"]))
    if debit + unseen > max(Decimal(0), capacity):
        raise Blocked(f"{old.symbol}: roll debit and prior reservations exceed cash/option buying power")


def roll(broker, providers, state, execute, strike_selector=select_roll):
    cut, statuses = observe(broker, state, save=execute)
    if not state["orders"]:
        raise Blocked("No original buy-write records exist")
    shares, options = cut["inventory"]
    targets = {}
    screening = {}
    for symbol in COHORT:
        cid = client_id("entry", symbol)
        record = state["orders"].get(cid)
        if record is None:
            screening[symbol] = "NO_ENTRY"
            continue
        if client_id("roll", symbol) in state["orders"]:
            screening[symbol] = "ROLL_ALREADY_RESERVED"
            continue
        status = statuses[cid]["state"]
        if status != "POSITION_RECONCILED":
            screening[symbol] = f"ENTRY_{status}"
            continue
        old = record_contract(record)
        if options[contract_identity(old)] != -1 or shares[symbol] < 100:
            screening[symbol] = "ENTRY_COVERAGE_UNRESOLVED"
            continue
        targets[symbol] = old
    if targets:
        # Use one observation for the 10:00 ITM screen, then qualify each
        # intended roll again at the actual send slot.
        stocks, meta, clock = providers.prices(tuple(targets))
        qualify_equities(stocks, meta, clock)
    for symbol, old in targets.items():
        prepared_at = time.monotonic()
        stock = stocks[symbol]
        if stock.get("type") != "stock":
            raise Blocked(f"{symbol}: unexpected underlying quote")
        mark = (number(stock["bid"]) + number(stock["ask"])) / 2
        screening[symbol] = dict(mark=mark, strike=old.strike,
                                 state="ITM" if mark > old.strike else "ATM" if mark == old.strike else "OTM")
        if mark <= old.strike:
            continue
        try:
            expiry = next_expiration(providers, symbol)
            screening[symbol]["next_expiration"] = expiry
            document, _ = providers.market("options/chains", symbol=symbol, expiration=expiry, greeks="false")
            destination = strike_selector(old, calls(document, symbol, expiry))
            if destination.expiry != expiry:
                raise Blocked("Roll selector did not use the next listed expiration")
            broker.catalog(old)
            broker.catalog(destination)
            if (now() - datetime.fromisoformat(cut["observed_at"])).total_seconds() >= FINANCIAL_REFRESH_SECONDS:
                cut = broker.snapshot()
            wait_start = time.monotonic()
            with qualification_slot():
                broker.measurements.mark("lock_wait", route="webull:qualification",
                                         seconds=time.monotonic() - wait_start)
                books, meta, clock = providers.prices((symbol, old.occ, destination.occ))
                verify_option_quote(old, books[old.occ])
                verify_option_quote(destination, books[destination.occ])

                def validate():
                    qualified(books, meta, clock)
                    if execute:
                        check_roll_cut(cut, state, old, destination, debit)
                    stock = books[symbol]
                    if stock.get("type") != "stock" or (number(stock["bid"]) + number(stock["ask"])) / 2 <= old.strike:
                        raise Blocked("Original call no longer qualifies as ITM")
                order = roll_order(old, destination, books[old.occ], books[destination.occ])
                debit = number(order["limit_price"]) * 100 if order["side"] == "BUY" else Decimal(0)
                validate()
                screening[symbol]["order"] = order
                if execute:
                    check_roll_cut(cut, state, old, destination, debit)
                    submit(broker, order, "roll", cut, debit, state, validate, prepared_at,
                           dict(quotes=books, quote_meta=meta, clock=clock, initial_screen=screening[symbol]))
        except Blocked as error:
            screening[symbol]["blocker"] = str(error)
            print(json.dumps({"symbol": symbol, "blocker": str(error)}), flush=True)
            if execute:
                raise
        finally:
            atomic(broker.path / "roll-plan.json", screening)
    atomic(broker.path / "roll-plan.json", screening)
    print(json.dumps(screening, default=str), flush=True)


def replay_benchmark(providers, measurements):
    """Compare request paths using actual GETs. Never produce a place packet."""
    samples = {}
    for symbol in COHORT[:8]:
        document, _ = providers.market("options/chains", symbol=symbol, expiration=EXPIRY, greeks="false")
        chain = calls(document, symbol, EXPIRY)
        samples[symbol] = chain[len(chain) // 2].occ
    results = {}
    for variant in ("prior_two_pairs", "single_exact_with_clock_reuse"):
        started = time.monotonic()
        offset = len(measurements.events)
        for symbol, option in samples.items():
            if variant == "prior_two_pairs":
                for _ in range(2):
                    providers.market("clock")
                    providers.market("quotes", symbols=symbol + "," + option, greeks="false")
            else:
                providers.prices((symbol, option))
        requests = Counter(event["route"] for event in measurements.events[offset:] if event["kind"] == "request")
        results[variant] = dict(seconds=time.monotonic() - started, requests=dict(requests),
                                requests_per_sample=sum(requests.values()) / len(samples))
    atomic(providers.path / "request-benchmark.json", results)
    print(json.dumps(results), flush=True)


def verify_pr46_handoff(dependency, ledger, today):
    if (dependency.get("execution_date") != today or dependency.get("handoff_status") != "READY"
            or dependency.get("runner_exit_observed") is not True):
        raise Blocked("PR46-first handoff is pending. PR47 must keep monitoring")
    evidence = dependency.get("final_reconciliation_locator")
    if not isinstance(evidence, str) or not Path(evidence).is_file():
        raise Blocked("PR46 final reconciliation evidence is unavailable")
    content = Path(evidence).read_bytes()
    if not isinstance(json.loads(content), dict):
        raise Blocked("PR46 final reconciliation is not a machine-readable object")
    last = ledger.get("universe_run", {}).get("last_reconciliation")
    if not last or datetime.fromisoformat(last).astimezone(ET).date().isoformat() != today:
        raise Blocked("PR46 ledger has no current-session final reconciliation")
    dispositions = {"working": set(dependency.get("working_client_order_ids", [])),
                    "uncertain": set(dependency.get("uncertain_client_order_ids", []))}
    if not all(name in dependency for name in ("working_client_order_ids", "uncertain_client_order_ids")):
        raise Blocked("PR46 working/uncertain inventories are not explicitly accounted for")
    found = {"working": set(), "uncertain": set()}
    attempted = set()
    for cohort in ledger.get("cohorts", []):
        for treatment in cohort.get("treatments", []):
            attempt = treatment.get("submission_attempt")
            if not attempt:
                continue
            cid = treatment["client_order_id"]
            if cid in attempted or attempt.get("client_order_id") != cid:
                raise Blocked("Conflicting PR46 original submission identities")
            attempted.add(cid)
            observation = treatment.get("last_observation") or {}
            if not observation.get("at") or observation["at"] < last:
                raise Blocked("PR46 submission lacks final original-ID reconciliation")
            status = observation.get("state")
            if status in {"SUBMITTED", "PENDING", "PARTIALLY_FILLED"}:
                found["working"].add(cid)
            elif treatment["phase"] in {"UNCERTAIN", "ATTEMPT_RECORDED"} or status == "UNKNOWN":
                if not (treatment.get("uncertainty_reference") or attempt.get("evidence")):
                    raise Blocked("PR46 uncertain claim has no retained evidence")
                if cohort["id"] not in ledger.get("universe_run", {}).get("reservations", {}):
                    raise Blocked("PR46 uncertain claim has no retained capital reservation")
                found["uncertain"].add(cid)
            elif status not in {"FILLED", "CANCELED", "REJECTED", "EXPIRED"}:
                raise Blocked("Unknown PR46 final submission disposition")
    if found != dispositions:
        raise Blocked("PR46 final working/uncertain receipt differs from its original-ID ledger")
    return dict(attempted=len(attempted), working=len(found["working"]), uncertain=len(found["uncertain"]),
                final_reconciliation=evidence, final_sha256=hashlib.sha256(content).hexdigest(), observed_at=last)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("observe", "plan-entry", "plan-roll", "benchmark", "entry", "roll"))
    parser.add_argument("--reviewed-execution", action="store_true",
                        help="Enable a separately authorized Sandbox run on its approved date")
    args = parser.parse_args()
    execute = args.action in {"entry", "roll"}
    if execute and not args.reviewed_execution:
        parser.error("Execution plan must be reviewed before any placement")
    if execute:
        session_window(args.action)
    os.umask(0o077)
    ROOT.mkdir(mode=0o700, exist_ok=True)
    path = ROOT / f"{args.action}-{time.time_ns()}"
    path.mkdir(mode=0o700)
    metrics = Measurements()
    with ExitStack() as stack:
        if execute:
            stack.enter_context(exclusive(ROOT / "writer.lock"))
            stack.enter_context(exclusive(SHARED_ROOT.parent / "pr47-stock-basket/server.lock"))
            stack.enter_context(exclusive(SHARED_ROOT.parent / "aristocrats-covered-calls/execution.lock"))
            # No PR46 writer may overlap the separately scheduled PR47 run.
            # Scheduled read-only observers continue through shared pacing.
            stack.enter_context(exclusive(SHARED_ROOT / "cohort-dispatch/writer.lock"))
            stack.enter_context(exclusive(SHARED_ROOT / "sender-control.lock"))
            if args.action == "entry":
                dependency_path = SHARED_ROOT / "pr46-pr47-continuation-dependency-20261111.json"
                ledger_path = SHARED_ROOT / "aristocrats-experiment/experiment.json"
                handoff = verify_pr46_handoff(json.loads(dependency_path.read_text()),
                                             json.loads(ledger_path.read_text()), ENTRY_DATE)
                atomic(path / "pr46-handoff.json", handoff)
        state_path = ROOT / "state.json"
        state = json.loads(state_path.read_text()) if state_path.exists() else {"orders": {}}
        try:
            if args.action == "observe":
                broker = Broker(path, metrics)
                with exclusive(ROOT / "writer.lock"):
                    state = json.loads(state_path.read_text()) if state_path.exists() else {"orders": {}}
                    observe(broker, state, save=state_path.exists())
                return
            providers = Providers(path, metrics)
            stack.callback(providers.close)
            if args.action == "benchmark":
                replay_benchmark(providers, metrics)
                return
            broker = Broker(path, metrics)
            if args.action.endswith("entry"):
                entry(broker, providers, state, execute)
            else:
                roll(broker, providers, state, execute)
            if execute:
                observe(broker, state, save=True)
        except Exception as error:
            print(json.dumps({"blocker": str(error), "evidence": str(path)}), file=sys.stderr, flush=True)
            raise SystemExit(1) from None
        finally:
            atomic(path / "performance.json", metrics.summary())


if __name__ == "__main__":
    try:
        main()
    except (Blocked, FileNotFoundError) as error:
        print(json.dumps({"blocker": str(error)}), file=sys.stderr, flush=True)
        raise SystemExit(1) from None
