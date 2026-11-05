"""Offline TT1 research artifact composition. No provider, database or policy writes.

Inputs are operator-authored source notes, intact cadence ZIPs and optionally the
existing ww history JSONL representation. This is NOT a v2 decision/admission API.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone, timedelta
from decimal import Decimal, InvalidOperation, getcontext
import hashlib
import io
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile
from zoneinfo import ZoneInfo

LIMIT = 256 * 1024 * 1024
MEMBER_LIMIT = 128 * 1024 * 1024
MEMBERS = {"manifest.json", "README.md", "market-and-verticals.json",
           "tt1-account-positions-orders.json", "evidence-coverage.json", "symbol-liquidity.csv"}
getcontext().prec = 120


def require(condition, message):
    if not condition:
        raise ValueError(message)


def instant(value):
    require(isinstance(value, str) and re.search(r"(Z|[+-]\d\d:\d\d)$", value), "Explicit-zone timestamp required")
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def decimal(value):
    if value is None or isinstance(value, bool):
        return None
    try:
        result = Decimal(str(value))
        return result if result.is_finite() else None
    except InvalidOperation:
        return None


def money(value):
    return None if value is None else format(value, "f")


def encoded(value):
    return json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False).encode()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def read_bytes(path):
    require(path.is_file() and path.stat().st_size <= LIMIT, "Missing or oversized source file")
    return path.read_bytes()


def material_clocks(value):
    keys = {"retrievedAt", "evaluatedAt", "marketQuoteObservedAt", "underlyingSpotObservedAt",
            "greeksUpdatedAt", "sourcePublishedAt", "completedAt"}
    if isinstance(value, dict):
        for key, item in value.items():
            # Zone-unspecified provider Greek strings remain unqualified, not UTC.
            if key in keys and isinstance(item, str) and re.search(r"(Z|[+-]\d\d:\d\d)$", item):
                yield item
            yield from material_clocks(item)
    elif isinstance(value, list):
        for item in value:
            yield from material_clocks(item)


def load_package(path):
    raw = read_bytes(path)
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = archive.namelist()
        require(len(names) == len(MEMBERS) and set(names) == MEMBERS, "Unexpected cadence ZIP inventory")
        require(all(x.file_size <= MEMBER_LIMIT for x in archive.infolist()) and
                sum(x.file_size for x in archive.infolist()) <= LIMIT, "Cadence ZIP capacity exceeded")
        files = {name: archive.read(name) for name in names}
    manifest = json.loads(files["manifest.json"])
    require(manifest.get("schema") == "tt1-cadence-package/v1", "Unknown cadence schema")
    entries = manifest.get("files", [])
    require(len(entries) == 5 and {x["name"] for x in entries} == MEMBERS - {"manifest.json"}, "Invalid manifest inventory")
    for entry in entries:
        payload = files[entry["name"]]
        require(digest(payload) == entry["sha256"] and len(payload) == entry["bytes"], "Cadence payload checksum mismatch")
    account = json.loads(files["tt1-account-positions-orders.json"])
    market = json.loads(files["market-and-verticals.json"])
    require(account.get("nickname") == "tt1", "TT1 source attribution required")
    clocks = [manifest["exportedAt"], account["retrievedAt"]]
    clocks += list(material_clocks(account)) + list(material_clocks(market))
    # The export manifest can be stamped BEFORE collection completes.
    through = max(clocks, key=instant)
    return dict(sha256=digest(raw), manifestSha256=digest(files["manifest.json"]),
                collectedThrough=through, sourceRevision=manifest.get("sourceRevision"),
                sessionDate=manifest["sessionDate"], account=account, market=market, raw=raw)


def order_items(package):
    for read in (package["account"].get("observed") or {}).get("reads", []):
        if read["path"].endswith("/orders"):
            body = read["body"]
            for order in body.get("data", {}).get("items", []):
                yield order, read["retrievedAt"]


def geometry(symbol):
    match = re.fullmatch(r"([A-Z0-9.]+)\s+(\d{6})P(\d{8})", symbol)
    if not match:
        return None
    root, date, strike = match.groups()
    return root, datetime.strptime(date, "%y%m%d").date().isoformat(), Decimal(strike) / 1000


def constituents(order, opening):
    legs = order.get("legs", [])
    expected = {"Buy to Open", "Sell to Open"} if opening else {"Buy to Close", "Sell to Close"}
    if len(legs) != 2 or {x.get("action") for x in legs} != expected:
        return None
    result = []
    for leg in legs:
        geo = geometry(leg.get("symbol", ""))
        qty = decimal(leg.get("quantity"))
        if geo is None or qty is None or qty <= 0 or leg.get("instrument-type") != "Equity Option":
            return None
        result.append((leg["symbol"], leg["action"].startswith("Sell") == opening, qty, geo))
    short = next(x for x in result if x[1])
    long = next(x for x in result if not x[1])
    if short[2] != long[2] or short[3][:2] != long[3][:2] or short[3][2] <= long[3][2]:
        return None
    return dict(underlying=short[3][0], expiration=short[3][1], shortStrike=money(short[3][2]),
                longStrike=money(long[3][2]), quantity=money(short[2]),
                legKey=sorted((x[0], x[1], money(x[2])) for x in result))


def multipliers(packages):
    terms = {}
    def add(symbol, value):
        number = decimal(value)
        if number is not None:
            terms.setdefault(symbol, set()).add(number)
    for package in packages:
        for contract in package["market"].get("contracts", []):
            add(contract.get("observedContractIdentity"), contract.get("observedMultiplier"))
        for read in (package["account"].get("observed") or {}).get("reads", []):
            if read["path"].endswith("/positions"):
                for row in read["body"].get("data", {}).get("items", []):
                    add(row.get("symbol"), row.get("multiplier"))
    return terms


def fills(order, terms):
    cash = Decimal(0)
    times = []
    for leg in order.get("legs", []):
        multiplier = terms.get(leg.get("symbol"), set())
        # This bounded slice supports independently observed standard 100-share terms only.
        if multiplier != {Decimal(100)}:
            return None
        reported = leg.get("fills", [])
        qty = decimal(leg.get("quantity"))
        if not reported or qty is None:
            return None
        total = Decimal(0)
        for fill in reported:
            price, size = decimal(fill.get("fill-price")), decimal(fill.get("quantity"))
            if price is None or size is None or price < 0 or size <= 0:
                return None
            instant(fill["filled-at"])
            total += size
            cash += (-1 if leg["action"].startswith("Buy") else 1) * price * size * 100
            times.append(fill["filled-at"])
        if total != qty:
            return None
    if not times or order.get("status") != "Filled":
        return None
    return dict(cash=cash, first=min(times, key=instant), last=max(times, key=instant))


def history_rows(raw, account_id, knowledge_cut):
    if raw is None:
        return [], dict(status="NOT_SUPPLIED", lifetimeCoverage="UNKNOWN")
    rows = [json.loads(line) for line in raw.decode().splitlines() if line.strip()]
    require(rows, "Empty JSONL cannot establish Account or completeness; omit unavailable history")
    # A saved --account tt1 result identifies its one Account. No operator GUID entry.
    account_id = account_id or rows[0].get("accountId")
    require(account_id, "History Account identity missing")
    seen = set()
    contexts = []
    cut = instant(knowledge_cut)
    for row in rows:
        require(row.get("accountId") == account_id and isinstance(row.get("history"), dict), "History Account/context mismatch")
        identity = row.get("transactionId")
        require(identity and identity not in seen, "Duplicate or absent transaction identity")
        seen.add(identity)
        context = row["history"]
        require(context.get("provider") == "TASTYTRADE" and context.get("environment") == "PRODUCTION", "Unsupported history source")
        require(isinstance(context.get("complete"), bool) and context.get("recordCount") == len(rows) and
                context.get("lifetimeCoverage") == "UNKNOWN", "Truncated or invalid bounded history representation")
        require(context == rows[0]["history"], "Mixed history cuts must not be combined")
        provenance = row.get("provenance") or {}
        require(re.fullmatch(r"[a-f0-9]{64}", provenance.get("sha256", "")) and provenance.get("artifactId") and
                provenance.get("observationId") and isinstance(provenance.get("rowNumber"), int) and
                provenance["rowNumber"] > 0, "Transaction source lineage required")
        instant(provenance.get("receivedAt"))
        require(instant(provenance["receivedAt"]) <= cut, "Transaction received after composition cut")
        for key in ["executedAt", "sourceCreatedAt"]:
            if row.get(key) is not None:
                require(instant(row[key]) <= cut, "Future transaction event")
        for key in ["asOf", "checkedAt", "lastImportedAt", "requestedThrough"]:
            if context.get(key) is not None:
                require(instant(context[key]) <= cut, "History context after composition cut")
        contexts.append(context)
    return rows, dict(status="SUPPLIED_BOUNDED_RESULT", attribution="OPERATOR_SUPPLIED_TT1_SOURCE; NOT_NATIVE_ACCOUNT_CROSS_VERIFIED", **contexts[0])


def costs_for(orders, rows):
    matched = []
    for order in orders:
        candidates = [r for r in rows if str(r.get("orderId")) == str(order["id"]) and r.get("kind") == "TRADE"]
        if len(candidates) != len(order["legs"]):
            return dict(netRealized=None, reportedNetCash=None, costs=None, status="MISSING_TRANSACTION_ROWS")
        for leg in order["legs"]:
            matches = [r for r in candidates if r.get("symbol") == leg["symbol"] and r.get("action") == leg["action"]]
            if len(matches) != 1:
                return dict(netRealized=None, reportedNetCash=None, costs=None, status="TRANSACTION_ASSOCIATION_UNRESOLVED")
            row = matches[0]
            source_id = row.get("sourceTransactionId")
            incoming_reversal = any(other.get("reversesSourceId") == source_id or
                                    other.get("reversesTransactionId") == row.get("transactionId")
                                    for other in rows if other is not row)
            cash = sum((decimal(f["fill-price"]) * decimal(f["quantity"]) * 100 for f in leg["fills"]), Decimal(0))
            cash *= -1 if leg["action"].startswith("Buy") else 1
            if (decimal(row.get("quantity")) != decimal(leg["quantity"]) or decimal(row.get("value")) != cash or
                    row.get("correctionStatus") != "NONE_OBSERVED" or
                    row.get("reversalStatus") != "NONE_REPORTED" or row.get("reversesSourceId") is not None or
                    not source_id or row.get("sourceIdentityStatus") != "BROKER_TRANSACTION_ID" or incoming_reversal or
                    row.get("currency") != "USD" or row.get("normalization") != "SUPPORTED" or
                    not row.get("executedAt") or not min(instant(f["filled-at"]) for f in leg["fills"]) <=
                    instant(row["executedAt"]) <= max(instant(f["filled-at"]) for f in leg["fills"])):
                return dict(netRealized=None, reportedNetCash=None, costs=None, status="TRANSACTION_FILL_CONFLICT")
            matched.append(row)
    nets = [decimal(r.get("netCash")) for r in matched]
    reported = sum(nets, Decimal(0)) if all(x is not None for x in nets) else None
    final = all(r.get("estimatedFee") is False and r.get("commissionStatus") == "REPORTED" and
                r.get("feesStatus") in ["REPORTED_COMPONENTS_COMPLETE", "REPORTED_TOTAL"] and
                decimal(r.get("commission")) is not None and decimal(r.get("fees")) is not None and
                decimal(r.get("netCash")) == decimal(r["value"]) + decimal(r["commission"]) + decimal(r["fees"])
                for r in matched)
    cost = sum((-decimal(r["commission"]) - decimal(r["fees"]) for r in matched), Decimal(0)) if final else None
    return dict(netRealized=money(reported) if final else None, reportedNetCash=money(reported),
                costs=money(cost), status="FINAL_REPORTED_ROWS" if final else "ESTIMATED_OR_INCOMPLETE_COSTS")


def account_bridge(source, packages, rows, coverage):
    """A declared coverage premise is preserved, never inferred from paging."""
    result = dict(status="NOT_ESTABLISHED", unexplainedResidual=None,
                  reason="Missing complete-history/beginning-cash/common-ending-cut premise; residual is never fees")
    basis = source.get("accountBasis")
    if not basis:
        return result
    result["operatorAssertedBasis"] = basis
    package = next((p for p in packages if p["sha256"] == basis.get("endingPackageSha256")), None)
    require(package is not None, "Account basis must pin ending package")
    begin = instant(basis["beginningAt"])
    cash = decimal(basis.get("beginningCash"))
    assertion = basis.get("historyCompletenessAssertion") or {}
    balance = package["account"].get("balances", {})
    end = instant(balance["observedAt"])
    require(begin <= end, "Account cut precedes beginning")
    response = balance.get("brokerResponse") or {}
    broker = response.get("body", {}).get("data", {})
    ending_cash = decimal(broker.get("cash-balance"))
    if (cash is None or ending_cash is None or coverage.get("complete") is not True or
            not assertion.get("source") or not assertion.get("from") or not assertion.get("through") or
            instant(assertion["from"]) > begin or instant(assertion["through"]) < end or
            not coverage.get("requestedThrough") or instant(coverage["requestedThrough"]) < end):
        return result
    relevant = []
    for row in rows:
        if not row.get("executedAt") or decimal(row.get("netCash")) is None:
            return result
        if begin < instant(row["executedAt"]) <= end:
            relevant.append(row)
    net_cash = sum((decimal(r["netCash"]) for r in relevant), Decimal(0))
    result.update(status="CONDITIONAL_ON_OPERATOR_COMPLETENESS_ASSERTION", beginningCash=money(cash),
                  beginningEquity=basis.get("beginningEquity"), endingCash=money(ending_cash),
                  endingEquity=balance.get("netLiquidatingValue"), endingAt=balance.get("observedAt"),
                  reportedLedgerNetCash=money(net_cash), unexplainedResidual=money(ending_cash - cash - net_cash),
                  reason="Residual is unexplained cash, never reclassified as fees; provider snapshot consistency remains unverified")
    return result


def build_record(source, packages, history=None, recorded_at=None):
    recorded_at = recorded_at or datetime.now(timezone.utc).isoformat()
    require(source.get("schema") == "tt1-experimental-input/v1", "Unknown experimental input schema")
    require(isinstance(source.get("experiment"), dict) and source["experiment"].get("id"), "Experiment identity required")
    require(packages, "At least one cadence package required")
    require(all(instant(p["collectedThrough"]) <= instant(recorded_at) for p in packages), "Future source package")
    by_hash = {p["sha256"]: p for p in packages}
    require(len(by_hash) == len(packages), "Duplicate package")
    policies = {p["id"]: p for p in source.get("policies", [])}
    require(len(policies) == len(source.get("policies", [])), "Duplicate policy version")
    for policy in policies.values():
        require(instant(policy["declaredAt"]) <= instant(recorded_at), "Future policy assertion")
        instant(policy["effectiveAt"])
    rows, coverage = history_rows(history, source.get("history", {}).get("accountId"), recorded_at)
    terms = multipliers(packages)
    versions, observations = {}, {}
    for package in packages:
        for order, at in order_items(package):
            require(instant(order["received-at"]) <= instant(at), "Order receipt after source cut")
            require(all(instant(f["filled-at"]) <= instant(at) for l in order.get("legs", []) for f in l.get("fills", [])), "Fill after source cut")
            identity = str(order["id"])
            observations.setdefault(identity, []).append(dict(packageSha256=package["sha256"], retrievedAt=at, order=order))
            if identity not in versions or instant(at) > instant(versions[identity][1]):
                versions[identity] = order, at
    orders = {key: item[0] for key, item in versions.items()}
    def has_open_execution(order):
        return any(l.get("action", "").endswith("to Open") and
                   any((decimal(f.get("quantity")) or 0) > 0 for f in l.get("fills", [])) for l in order.get("legs", []))
    unresolved_openings = [dict(orderId=key, status=order.get("status"), evidence=observations[key],
        reason="UNSUPPORTED_CONSTRUCTION_OR_INCOMPLETE_FILLS_OR_UNVERIFIED_TERMS") for key, order in orders.items()
        if (order.get("status") == "Filled" or has_open_execution(order)) and any(l.get("action", "").endswith("to Open") for l in order.get("legs", []))
        and (not constituents(order, True) or not fills(order, terms))]
    groups = Counter(str(o.get("complex-order-id")) for o in orders.values() if o.get("complex-order-id") is not None
                     and (has_open_execution(o) or o.get("status") == "Filled" and
                          any(l.get("action", "").endswith("to Open") for l in o.get("legs", []))))
    decisions = []
    decision_ids = set()
    for note in source.get("decisions", []):
        require(note["id"] not in decision_ids and note.get("action") in ["SELECT", "WAIT"], "Duplicate/invalid decision")
        decision_ids.add(note["id"])
        package = by_hash.get(note.get("packageSha256"))
        require(package and note.get("manifestSha256") == package["manifestSha256"], "Decision must pin exact package and manifest")
        when = instant(note["decidedAt"])
        require(instant(package["collectedThrough"]) <= when <= instant(recorded_at), "Decision source contains later evidence or future decision")
        policy = policies.get(note.get("policyVersion"))
        require(note.get("policyVersion") is None or policy is not None, "Unknown pinned policy")
        if policy:
            require(instant(policy["effectiveAt"]) <= when and instant(policy["declaredAt"]) <= when, "Later policy cannot govern an earlier decision")
        selected = note.get("selected")
        require((note["action"] == "SELECT" and isinstance(selected, dict)) or
                (note["action"] == "WAIT" and selected is None and not note.get("openingOrderId")), "Selection/WAIT conflict")
        candidate = None
        if selected:
            require(decimal(selected.get("quantity")) is not None and decimal(selected["quantity"]) > 0, "Selected quantity required")
            for pair in package["market"].get("verticalPairs", []):
                if all(pair.get(k) == selected.get(k) for k in ["underlying", "expiration"]) and all(
                        decimal(pair.get(k)) == decimal(selected.get(k)) for k in ["shortStrike", "longStrike"]):
                    require(candidate is None, "Ambiguous candidate rows")
                    candidate = pair
        broker = orders.get(str(note.get("openingOrderId")))
        link = "NOT_SUPPLIED" if not note.get("openingOrderId") else "ORDER_NOT_OBSERVED"
        if broker:
            actual = constituents(broker, True)
            matches = selected and actual and all(actual[k] == selected[k] for k in ["underlying", "expiration"]) and all(
                decimal(actual[k]) == decimal(selected.get(k)) for k in ["shortStrike", "longStrike", "quantity"])
            link = "EXPLICIT_OPERATOR_LINK_BROKER_CONSTITUENTS_VERIFIED" if matches and instant(broker["received-at"]) >= when else "CONFLICT_OR_ORDER_PRECEDES_DECISION"
        decision = dict(note)
        attempt_ids = list(note.get("attemptOrderIds", []))
        if note.get("openingOrderId") is not None:
            attempt_ids.append(note["openingOrderId"])
        attempts = []
        for key in dict.fromkeys(str(i) for i in attempt_ids):
            observed = orders.get(key)
            attempts.append(dict(orderId=key, status=observed.get("status") if observed else None,
                                 observedAt=versions[key][1] if observed else None,
                                 association="OPERATOR_ASSERTED_ATTEMPT; SOURCE STATUS ONLY",
                                 evidence=observations.get(key, [])))
        decision.update(candidateEvidence=candidate, candidateStatus="RETAINED" if candidate else "NOT_RETAINED",
                        policy=policy, rationale=note.get("rationale"), rejectedAlternatives=note.get("rejectedAlternatives"),
                        contextPackageSha256=package["sha256"], executionAssociation=link,
                        observedOrderStatus=broker.get("status") if broker else None,
                        rationaleStatus="SUPPLIED" if note.get("rationale") else "MISSING",
                        attempts=attempts,
                        timeAuthority="OPERATOR_ASSERTED_DECISION_TIME; recordedAt is composition time")
        decisions.append(decision)
    lifecycles = []
    for identity, opening in orders.items():
        structure = constituents(opening, True)
        entry = fills(opening, terms) if structure else None
        if not structure or not entry:
            continue
        group = opening.get("complex-order-id")
        exits = [o for o in orders.values() if group is not None and groups[str(group)] == 1 and o.get("complex-order-id") == group and
                 constituents(o, False) == structure]
        closes = [(o, fills(o, terms)) for o in exits if fills(o, terms)]
        close = closes[0] if len(closes) == 1 and instant(closes[0][1]["first"]) >= instant(entry["last"]) else None
        closing, exit_fill = close if close else (None, None)
        configs = []
        for order in exits:
            notes = [n for n in source.get("exitChangeNotes", []) if str(n.get("orderId")) == str(order["id"])]
            configs.append(dict(orderId=str(order["id"]), orderType=order.get("order-type"),
                                debit=order.get("price") if order.get("price-effect") == "Debit" else None,
                                stopTrigger=order.get("stop-trigger"), timeInForce=order.get("time-in-force"),
                                expiresAt=order.get("gtc-date") or order.get("gtd-date"),
                                receivedAt=order.get("received-at"), cancelledAt=order.get("cancelled-at"),
                                replacesOrderId=order.get("replaces-order-id"), replacingOrderId=order.get("replacing-order-id"),
                                complexOrderId=group, status=order.get("status"),
                                reason=None if not notes else notes, activationAt=None,
                                effectivePeriod=dict(instructionReceivedAt=order.get("received-at"),
                                    confirmedCancellationAt=order.get("cancelled-at"),
                                    qualification="Receipt/cancellation, not arming or intraperiod edit history"),
                                observations=sorted(observations[str(order["id"])], key=lambda x: instant(x["retrievedAt"]))))
        after = []
        underlying_after = []
        if exit_fill:
            for package in packages:
                for contract in package["market"].get("contracts", []):
                    observed = contract.get("observed", {})
                    market_evidence = observed.get("marketEvidence", {})
                    spot_clock = market_evidence.get("underlyingSpotObservedAt")
                    if (contract.get("underlying") == structure["underlying"] and spot_clock and
                            instant(spot_clock) > instant(exit_fill["last"]) and market_evidence.get("underlyingSpot") is not None):
                        point = dict(packageSha256=package["sha256"], observedAt=spot_clock, price=market_evidence["underlyingSpot"],
                                     kind="POST_EXIT_RESEARCH", convention=market_evidence.get("spotPriceConvention"),
                                     sourceQualification={k: market_evidence.get(k) for k in ["status", "issues", "spotAgeSeconds"]})
                        if point not in underlying_after:
                            underlying_after.append(point)
                    clock = observed.get("marketEvidence", {}).get("marketQuoteObservedAt")
                    if (contract.get("observedContractIdentity") in [l["symbol"] for l in opening["legs"]] and
                            clock and instant(clock) > instant(exit_fill["last"])):
                        after.append(dict(kind="POST_EXIT_RESEARCH_NOT_EXECUTABLE", packageSha256=package["sha256"], contract=contract))
        linked = [d for d in decisions if str(d.get("openingOrderId")) == identity and
                  d["executionAssociation"] == "EXPLICIT_OPERATOR_LINK_BROKER_CONSTITUENTS_VERIFIED"]
        gross = entry["cash"] + exit_fill["cash"] if exit_fill else None
        costs = costs_for([opening, closing], rows) if closing else dict(netRealized=None, reportedNetCash=None, costs=None, status="OPEN_OR_UNRESOLVED")
        lifecycles.append(dict(openingOrderId=identity, structure=structure, entryGrossCredit=money(entry["cash"]),
                               cohortStatus="EXPLICIT_DECISION_LINK" if linked else "UNASSIGNED_HISTORICAL_TT1; NOT_AUTOMATIC_EXPERIMENT_MEMBERSHIP",
                               entryAt=entry["last"], closingOrderId=str(closing["id"]) if closing else None,
                               exitAt=exit_fill["last"] if exit_fill else None, closingDebit=money(-exit_fill["cash"]) if exit_fill else None,
                               grossRealized=money(gross), economics=costs, status="CLOSED" if closing else "OPEN_OR_CLOSE_NOT_ESTABLISHED",
                               association="BROKER_COMPLEX_GROUP_AND_EXACT_REVERSE_CONSTITUENTS" if group else "OPENING_ONLY_NO_BROKER_GROUP",
                               openingEvidence=observations[identity], actualExitConfigurations=configs,
                               decisions=linked, selectionRationaleStatus="MISSING" if not linked else linked[0]["rationaleStatus"],
                               researchCheckpoint21Dte=(datetime.fromisoformat(structure["expiration"]) - timedelta(days=21)).date().isoformat(),
                               checkpointStanding="DOCUMENTED_EXPERIMENT_OBJECTIVE_NOT_AN_EXECUTED_EXIT",
                               holdingCalendarDays=(instant(exit_fill["last"]) - instant(entry["last"])).total_seconds() / 86400 if exit_fill else None,
                               postExitObservations=after, postExitUnderlyingObservations=underlying_after,
                               postExitCompleteness="ONLY_SUPPLIED_SNAPSHOTS; PATH_AND_FUTURE_HORIZON_UNKNOWN",
                               buyingPowerOccupation=None))
    balances = []
    for package in packages:
        b = package["account"].get("balances", {})
        balances.append(dict(packageSha256=package["sha256"], observedAt=b.get("observedAt"),
                             netLiquidatingValue=b.get("netLiquidatingValue"), availableOptionsBuyingPower=b.get("availableOptionsBuyingPower"),
                             qualification="NONATOMIC_OBSERVATION_NOT_REALIZED_PL"))
    movements = [r for r in rows if r.get("kind") == "MONEY_MOVEMENT"]
    return dict(schema="tt1-experimental-record/v1", recordedAt=recorded_at, experiment=source["experiment"], policies=list(policies.values()),
                standing="OFFLINE_OPERATOR_RESEARCH_ARTIFACT; NOT_BACKEND_ADMITTED_DECISION_OR_TRADING_AUTHORITY",
                sources=[{k: p[k] for k in ["sha256", "manifestSha256", "collectedThrough", "sourceRevision", "sessionDate"]} for p in packages],
                historyCoverage=coverage, moneyMovements=movements, decisions=decisions, lifecycles=lifecycles,
                unresolvedOpeningOrders=unresolved_openings,
                balances=balances, currentValuations=[dict(packageSha256=p["sha256"], retrievedAt=p["account"]["retrievedAt"],
                    positions=p["account"].get("derivedPositions", []), qualification="INDICATIVE_GROSS_NOT_ACCOUNT_NAV") for p in packages],
                accountReconciliation=account_bridge(source, packages, rows, coverage),
                evaluation=source.get("evaluation"), context=dict(stochastic="NO_SUPPORTED_INTEGRATION; NOT_COMPUTED_OR_USED", correlation="NO_QUANTITATIVE_ESTIMATE"))


def review(record):
    session = lambda at: instant(at).astimezone(ZoneInfo("America/New_York")).date().isoformat()
    lines = ["TT1 experimental reconciliation", "Evidence cut: " + record["recordedAt"],
             "Offline research record; no strategy recommendation.",
             "Decisions: " + str(dict(Counter(d["action"] for d in record["decisions"]))),
             "Recorded WAIT sessions: " + str(sorted({session(d["decidedAt"]) for d in record["decisions"] if d["action"] == "WAIT"})),
             "Linked filled-entry sessions: " + str(sorted({session(t["entryAt"]) for t in record["lifecycles"] if t["decisions"]})),
             "Supported opening packages: " + str(len(record["lifecycles"])),
             "Unresolved opening orders: " + str(len(record["unresolvedOpeningOrders"])),
             "OPEN ORDER | POSITION | STATE | GROSS REALIZED | NET REALIZED | COST EVIDENCE | POLICY"]
    for row in record["lifecycles"]:
        structure = row["structure"]
        policy = [d.get("policyVersion") for d in row["decisions"]]
        lines.append(" | ".join([row["openingOrderId"], structure["underlying"] + " " + structure["shortStrike"] + "/" + structure["longStrike"],
                     row["status"], row["grossRealized"] or "?", row["economics"]["netRealized"] or "?",
                     row["economics"]["status"], str(policy) if policy else "?"]))
    lines.append("Historical opening orders are not automatically experimental cohort members.")
    for decision in record["decisions"]:
        lines.append("Decision " + decision["id"] + ": " + decision["action"] + "; attempts " +
                     str([(a["orderId"], a["status"]) for a in decision["attempts"]]) + "; rationale " + decision["rationaleStatus"])
    latest = max(record["currentValuations"], key=lambda x: instant(x["retrievedAt"]))
    lines.append("Latest supplied gross position marks (not realized/NAV), " + latest["retrievedAt"] + ": " +
                 str([(p.get("underlying"), p.get("pnl")) for p in latest["positions"]]))
    lines += ["History: " + record["historyCoverage"]["status"],
              "Account reconciliation: " + record["accountReconciliation"]["status"] + "; residual " + str(record["accountReconciliation"]["unexplainedResidual"]),
              "BP occupation, activation markets and unobserved paths remain unknown.",
              "Later option observations are research marks, never assumed fills.",
              "Hypothesis evaluation: " + ("operator supplied (see record)" if record["evaluation"] else "MISSING")]
    return "\n".join(lines) + "\n"


def publish(input_path, destination):
    source_raw = read_bytes(input_path)
    source = json.loads(source_raw)
    paths = [input_path.parent / name for name in source.get("packages", [])]
    require(len(paths) <= 64, "Package count exceeds bounded composition")
    require(sum(path.stat().st_size for path in paths) <= LIMIT, "Source archive capacity exceeded")
    packages = [load_package(path) for path in paths]
    history = read_bytes(input_path.parent / source["history"]["path"]) if source.get("history") else None
    record = build_record(source, packages, history)
    files = {"operator-source.json": source_raw, "experimental-record.json": encoded(record), "review.txt": review(record).encode()}
    for package in packages:
        files["sources/" + package["sha256"] + ".zip"] = package["raw"]
    if history is not None:
        files["history.jsonl"] = history
    require(sum(map(len, files.values())) <= LIMIT, "Experimental record capacity exceeded")
    files["manifest.json"] = encoded(dict(schema="tt1-experimental-package/v1", recordedAt=record["recordedAt"],
        files=[dict(name=k, sha256=digest(v), bytes=len(v)) for k, v in files.items()]))
    destination.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=".tt1-record-", suffix=".partial", dir=destination)
    try:
        os.chmod(temporary, 0o600)
        with os.fdopen(descriptor, "w+b") as stream:
            with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
                for name, payload in files.items():
                    archive.writestr(name, payload)
            stream.flush()
            os.fsync(stream.fileno())
        with zipfile.ZipFile(temporary) as archive:
            require(archive.testzip() is None and len(archive.namelist()) == len(files), "Output ZIP verification failed")
            require(all(archive.read(name) == data for name, data in files.items()), "Output payload mismatch")
        # Existing cadence publisher's verified atomic no-clobber pattern.
        output = destination / ("tt1-record-" + digest(files["manifest.json"]) + ".zip")
        os.link(temporary, output)
        return output
    finally:
        os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True, help="Private output directory; creates a new 0600 ZIP")
    args = parser.parse_args()
    try:
        print(publish(args.input.resolve(), args.output.resolve()))
    except (ValueError, KeyError, TypeError, OSError, zipfile.BadZipFile):
        parser.exit(1, "TT1 record validation/publication failed; input sources and existing output preserved.\n")


if __name__ == "__main__":
    main()
