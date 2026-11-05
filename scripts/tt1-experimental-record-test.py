"""Offline scientific-accountability and archive/CLI regression specimens."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile

SPEC = importlib.util.spec_from_file_location("tt1_record", Path(__file__).with_name("tt1-experimental-record.py"))
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)
SHORT, LONG = "QQQ   261218P00700000", "QQQ   261218P00690000"
ENTRY, EXIT = "2026-10-28T15:03:00Z", "2026-11-05T14:30:15Z"
NOW = "2026-11-05T17:00:00Z"


def order(identity, opening=False, status="Live", group=5, price="1.11", trigger=None, when=ENTRY):
    legs = [dict(symbol=SHORT, action="Sell to Open" if opening else "Buy to Close", quantity=1,
                 **{"instrument-type": "Equity Option"}, fills=[]),
            dict(symbol=LONG, action="Buy to Open" if opening else "Sell to Close", quantity=1,
                 **{"instrument-type": "Equity Option"}, fills=[])]
    if status == "Filled":
        for leg, value in zip(legs, ["14.16", "11.75"] if opening else ["28.53", "23.30"]):
            leg["fills"] = [{"fill-price": value, "quantity": 1, "filled-at": when}]
    result = {"id": identity, "status": status, "legs": legs, "complex-order-id": group,
              "received-at": "2026-10-28T15:02:00Z" if opening else when,
              "order-type": "Stop Limit" if trigger else "Limit", "price": price,
              "price-effect": "Credit" if opening else "Debit", "time-in-force": "GTD", "gtc-date": "2026-11-27"}
    if trigger:
        result["stop-trigger"] = trigger
    return result


def package(orders=None, at="2026-11-05T16:00:00Z", key="b"):
    contracts = [dict(observedContractIdentity=symbol, observedMultiplier=100, observed={}) for symbol in [SHORT, LONG]]
    pair = dict(underlying="QQQ", expiration="2026-12-18", shortStrike=700, longStrike=690,
                status="RECENT_BROKER_SNAPSHOT_INDICATIVE_NOT_EXECUTABLE", midpoint={"creditPerShare": 2.41})
    return dict(sha256=key*64, manifestSha256=key*64, collectedThrough=at, sourceRevision="test",
                sessionDate=at[:10], account=dict(nickname="tt1", retrievedAt=at, observed=dict(reads=[
                    dict(path="/accounts/tt1/orders", retrievedAt=at, body=dict(data=dict(items=orders or [])))]),
                    balances={}, derivedPositions=[]), market=dict(contracts=contracts, verticalPairs=[pair]), raw=b"synthetic")


def sources():
    pre = package(at="2026-10-28T15:00:00Z", key="a")
    opened = order(1, True, "Filled")
    old = order(3, price="3.01", trigger="3.01")
    old.update(status="Cancelled", **{"cancelled-at": "2026-11-03T18:54:33Z", "replacing-order-id": 4})
    close = order(4, status="Filled", price="5.25", trigger="5.00", when=EXIT)
    close.update(**{"received-at": "2026-11-03T18:54:32Z", "replaces-order-id": 3})
    post = package([opened, order(2), old, close])
    note = dict(id="d1", decidedAt="2026-10-28T15:01:00Z", packageSha256=pre["sha256"], manifestSha256=pre["manifestSha256"],
                policyVersion="p1", action="SELECT", selected=dict(underlying="QQQ", expiration="2026-12-18", shortStrike=700,
                    longStrike=690, quantity=1), openingOrderId="1", rationale=None)
    source = dict(schema="tt1-experimental-input/v1", experiment=dict(id="tt1-19-session", hypothesis=None, successCriteria=None),
                  policies=[dict(id="p1", effectiveAt="2026-10-27T12:00:00Z", declaredAt="2026-10-27T12:00:00Z", rules={"timeExitDte": 21})],
                  decisions=[note])
    return source, [pre, post]


def history(orders, final=True):
    rows = []
    for order_ in orders:
        for leg in order_["legs"]:
            value = m.Decimal(leg["fills"][0]["fill-price"]) * 100 * (-1 if leg["action"].startswith("Buy") else 1)
            rows.append(dict(accountId="account", transactionId=str(len(rows)), kind="TRADE", orderId=str(order_["id"]),
                             symbol=leg["symbol"], action=leg["action"], quantity="1", value=str(value),
                             netCash=str(value - m.Decimal("0.25")), commission="0", fees="-0.25",
                             commissionStatus="REPORTED", feesStatus="REPORTED_TOTAL", estimatedFee=not final,
                             executedAt=leg["fills"][0]["filled-at"], history=dict(provider="TASTYTRADE", environment="PRODUCTION",
                             complete=False, lifetimeCoverage="UNKNOWN", requestedThrough=NOW)))
    for index, row in enumerate(rows):
        row.update(currency="USD", normalization="SUPPORTED", correctionStatus="NONE_OBSERVED", reversalStatus="NONE_REPORTED",
                   sourceTransactionId=str(1000 + index), sourceIdentityStatus="BROKER_TRANSACTION_ID",
                   provenance=dict(artifactId="artifact", observationId="observation-" + str(index), sha256="0"*64,
                                   receivedAt=NOW, rowNumber=index + 1))
        row["history"]["recordCount"] = len(rows)
    return rows


class EvidenceTests(unittest.TestCase):
    def record(self, source=None, packages=None, rows=None):
        src, ps = sources()
        source, packages = source or src, packages or ps
        if rows is not None:
            source["history"] = dict(accountId="account")
        return m.build_record(source, packages, None if rows is None else "\n".join(json.dumps(r) for r in rows).encode(), NOW)

    def test_qqq_gross_replacement_missing_costs_and_rationale(self):
        r = self.record(); trade = r["lifecycles"][0]
        self.assertEqual(trade["grossRealized"], "-282.00")
        self.assertEqual(trade["entryGrossCredit"], "241.00")
        self.assertEqual(trade["economics"]["netRealized"], None)
        self.assertEqual(trade["selectionRationaleStatus"], "MISSING")
        self.assertEqual(trade["actualExitConfigurations"][-1]["replacesOrderId"], 3)
        self.assertEqual(trade["actualExitConfigurations"][-1]["activationAt"], None)
        self.assertEqual(trade["researchCheckpoint21Dte"], "2026-11-27")

    def test_complete_cost_rows_and_partial_history_are_separate(self):
        source, packages = sources()
        rows = history([packages[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"][i] for i in [0, 3]])
        r = self.record(source, packages, rows)
        self.assertFalse(r["historyCoverage"]["complete"])
        self.assertEqual(r["lifecycles"][0]["economics"]["netRealized"], "-283.00")
        self.assertEqual(r["accountReconciliation"]["status"], "NOT_ESTABLISHED")

    def test_estimated_or_missing_final_fees_not_zero(self):
        _, packages = sources()
        orders = packages[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([orders[0], orders[3]], final=False)
        r = self.record(rows=rows)
        self.assertIsNone(r["lifecycles"][0]["economics"]["netRealized"])
        rows[0]["fees"] = None
        self.assertIsNone(self.record(rows=rows)["lifecycles"][0]["economics"]["costs"])

    def test_open_incomplete_and_concurrent_packages(self):
        s, ps = sources()
        items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        items.pop()
        other = order(8, True, "Filled", group=8)
        other["legs"][0]["symbol"] = "QQQ   261218P00710000"
        other["legs"][1]["symbol"] = "QQQ   261218P00705000"
        items.append(other)
        ps[1]["market"]["contracts"] += [dict(observedContractIdentity=l["symbol"], observedMultiplier=100) for l in other["legs"]]
        r = self.record(s, ps)
        self.assertEqual(len(r["lifecycles"]), 2)
        self.assertTrue(all(t["grossRealized"] is None for t in r["lifecycles"]))

    def test_ambiguous_same_group_cannot_duplicate_close(self):
        s, ps = sources()
        items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        second = copy.deepcopy(items[0]); second["id"] = 9; items.append(second)
        r = self.record(s, ps)
        self.assertTrue(all(t["grossRealized"] is None for t in r["lifecycles"]))

    def test_wait_and_unfilled_attempt(self):
        s, ps = sources()
        s["decisions"][0].update(action="WAIT", selected=None, openingOrderId=None)
        r = self.record(s, ps)
        self.assertEqual(r["decisions"][0]["candidateStatus"], "NOT_RETAINED")
        s, ps = sources()
        ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"][0].update(status="Cancelled")
        r = self.record(s, ps)
        self.assertEqual(r["decisions"][0]["observedOrderStatus"], "Cancelled")
        self.assertEqual(r["lifecycles"], [])

    def test_no_later_package_or_policy_in_decision(self):
        s, ps = sources()
        s["decisions"][0]["decidedAt"] = "2026-10-28T14:59:00Z"
        with self.assertRaises(ValueError): self.record(s, ps)
        s, ps = sources()
        s["policies"][0]["declaredAt"] = "2026-11-01T12:00:00Z"
        with self.assertRaises(ValueError): self.record(s, ps)
        s, ps = sources()
        s["policies"].append(dict(id="p2", declaredAt=EXIT, effectiveAt=EXIT, rules={"stopLimitMultiple": 2}))
        self.assertEqual(self.record(s, ps)["decisions"][0]["policy"]["id"], "p1")

    def test_post_exit_original_contract_observation(self):
        s, ps = sources()
        c = ps[1]["market"]["contracts"][0]
        c["observed"] = dict(marketEvidence=dict(marketQuoteObservedAt="2026-11-05T15:00:00Z"), bid=47, ask=49)
        after = self.record(s, ps)["lifecycles"][0]["postExitObservations"]
        self.assertEqual(after[0]["kind"], "POST_EXIT_RESEARCH_NOT_EXECUTABLE")
        self.assertIsNone(self.record(s, ps)["accountReconciliation"]["unexplainedResidual"])

    def test_unknown_multiplier_or_conflicting_transaction_withholds_economics(self):
        s, ps = sources()
        for p in ps: p["market"]["contracts"] = []
        self.assertEqual(self.record(s, ps)["lifecycles"], [])
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]]); rows[0]["value"] = "0"
        self.assertEqual(self.record(s, ps, rows)["lifecycles"][0]["economics"]["status"], "TRANSACTION_FILL_CONFLICT")

    def test_zero_net_is_not_unknown(self):
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        items[3]["legs"][0]["fills"][0]["fill-price"] = "14.15"
        items[3]["legs"][1]["fills"][0]["fill-price"] = "11.75"
        rows = history([items[0], items[3]])
        self.assertEqual(self.record(s, ps, rows)["lifecycles"][0]["economics"]["netRealized"], "0.00")

    def test_conditional_cash_residual_is_not_fees(self):
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]])
        for row in rows: row["history"]["complete"] = True
        ps[1]["account"]["balances"] = dict(observedAt="2026-11-05T16:00:00Z", netLiquidatingValue=700,
            brokerResponse=dict(body=dict(data={"cash-balance": "720"})))
        s["accountBasis"] = dict(beginningAt="2026-10-27T00:00:00Z", beginningCash="1000", beginningEquity="1000",
             endingPackageSha256=ps[1]["sha256"], historyCompletenessAssertion=dict(source="operator assertion", from_="unused",
             **{"from": "2026-10-27T00:00:00Z", "through": NOW}))
        bridge = self.record(s, ps, rows)["accountReconciliation"]
        self.assertEqual(bridge["unexplainedResidual"], "3.00")
        self.assertNotIn("fees", bridge)

    def test_duplicate_transaction_and_mixed_context_rejected(self):
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]])
        with self.assertRaises(ValueError): self.record(s, ps, rows + [rows[0]])
        rows[1]["history"]["complete"] = True
        with self.assertRaises(ValueError): self.record(s, ps, rows)

    def test_truncated_history_missing_lineage_and_unknown_correction(self):
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]])
        with self.assertRaises(ValueError): self.record(s, ps, rows[:-1])
        bad = copy.deepcopy(rows); del bad[0]["provenance"]
        with self.assertRaises(ValueError): self.record(s, ps, bad)
        del rows[0]["correctionStatus"]
        self.assertIsNone(self.record(s, ps, rows)["lifecycles"][0]["economics"]["netRealized"])

    def test_partial_fills_are_visible_unresolved_not_a_completed_trade(self):
        s, ps = sources()
        opening = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"][0]
        opening["legs"][0]["fills"][0]["quantity"] = "0.5"
        record = self.record(s, ps)
        self.assertEqual(record["lifecycles"], [])
        self.assertEqual(record["unresolvedOpeningOrders"][0]["orderId"], "1")

    def test_changed_rationale_excluded_candidate_and_unknown_attempt_preserved(self):
        s, ps = sources()
        s["decisions"][0].update(rationale="Operator words\nkept verbatim", rejectedAlternatives=[], attemptOrderIds=[99])
        ps[0]["market"]["verticalPairs"][0]["status"] = "EXCLUDED"
        d = self.record(s, ps)["decisions"][0]
        self.assertEqual(d["candidateEvidence"]["status"], "EXCLUDED")
        self.assertEqual(d["rationale"], "Operator words\nkept verbatim")
        self.assertIsNone(d["attempts"][0]["status"])

    def test_future_fill_or_conflicting_decision_link_cannot_be_promoted(self):
        s, ps = sources()
        ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"][0]["legs"][0]["fills"][0]["filled-at"] = "2027-01-01T00:00:00Z"
        with self.assertRaises(ValueError): self.record(s, ps)
        s, ps = sources(); s["decisions"][0]["selected"]["shortStrike"] = 701
        self.assertEqual(self.record(s, ps)["decisions"][0]["executionAssociation"], "CONFLICT_OR_ORDER_PRECEDES_DECISION")

    def test_history_account_discovery_does_not_require_operator_guid(self):
        _, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]])
        raw = "\n".join(json.dumps(r) for r in rows).encode()
        result, _ = m.history_rows(raw, None, NOW)
        self.assertEqual(len(result), 4)
        rows[1]["accountId"] = "other"
        with self.assertRaises(ValueError): m.history_rows("\n".join(json.dumps(r) for r in rows).encode(), None, NOW)

    def test_review_incoming_reversal_blocks_final_net(self):
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]])
        reversal = copy.deepcopy(rows[0])
        reversal.update(transactionId="reversal", sourceTransactionId="2000", reversesSourceId=rows[0]["sourceTransactionId"],
                        reversesTransactionId=rows[0]["transactionId"], kind="OTHER", orderId=None)
        rows.append(reversal)
        for row in rows: row["history"]["recordCount"] = len(rows)
        result = self.record(s, ps, rows)
        self.assertEqual(result["lifecycles"][0]["economics"]["status"], "TRANSACTION_FILL_CONFLICT")
        self.assertIsNone(result["lifecycles"][0]["economics"]["netRealized"])

    def test_review_future_receipt_or_context_never_enters_past_record(self):
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]])
        rows[0]["provenance"]["receivedAt"] = "2027-01-01T00:00:00Z"
        with self.assertRaises(ValueError): self.record(s, ps, rows)
        rows = history([items[0], items[3]])
        for row in rows: row["history"]["checkedAt"] = "2027-01-01T00:00:00Z"
        with self.assertRaises(ValueError): self.record(s, ps, rows)

    def test_review_partial_or_cancelled_filled_sibling_makes_group_ambiguous(self):
        for status in ["Filled", "Cancelled"]:
            s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
            sibling = copy.deepcopy(items[0]); sibling["id"] = 9; sibling["status"] = status
            for leg in sibling["legs"]: leg["fills"][0]["quantity"] = "0.5"
            items.append(sibling)
            record = self.record(s, ps)
            self.assertIsNone(record["lifecycles"][0]["grossRealized"])
            self.assertEqual(record["unresolvedOpeningOrders"][0]["orderId"], "9")

    def test_observed_order_event_classes_share_source_receipt_boundary(self):
        for field in ["cancelled-at", "filled-at", "rejected-at", "expired-at", "live-at", "triggered-at"]:
            for when in ["2027-01-01T00:00:00Z", "2026-11-05T16:30:00Z", "2026-10-27T00:00:00Z"]:
                with self.subTest(field=field, when=when):
                    s, ps = sources()
                    ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"][2][field] = when
                    with self.assertRaises(ValueError): self.record(s, ps)

    def test_future_planned_expiry_is_distinct_from_occurred_event(self):
        s, ps = sources()
        stop = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"][2]
        stop["gtc-date"] = "2027-01-01"
        self.assertEqual(self.record(s, ps)["lifecycles"][0]["actualExitConfigurations"][1]["expiresAt"], "2027-01-01")

    def test_native_order_update_and_fill_clocks_cannot_exceed_source_cut(self):
        s, ps = sources()
        opening = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"][0]
        opening["updated-at"] = int(m.instant("2027-01-01T00:00:00Z").timestamp() * 1000)
        with self.assertRaises(ValueError): self.record(s, ps)
        del opening["updated-at"]
        opening["legs"][0]["fills"][0]["filled-at"] = "2026-10-28T15:01:00Z"
        with self.assertRaises(ValueError): self.record(s, ps)

    def test_transaction_event_after_artifact_receipt_is_not_historical_evidence(self):
        s, ps = sources(); items = ps[1]["account"]["observed"]["reads"][0]["body"]["data"]["items"]
        rows = history([items[0], items[3]])
        rows[0]["provenance"]["receivedAt"] = "2026-10-27T00:00:00Z"
        with self.assertRaises(ValueError): self.record(s, ps, rows)


class ArchiveTests(unittest.TestCase):
    def test_zip_integrity_private_output_and_cli(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); s, ps = sources(); p = ps[0]
            payloads = {"market-and-verticals.json": m.encoded(p["market"]),
                        "tt1-account-positions-orders.json": m.encoded(p["account"]),
                        "evidence-coverage.json": b"{}", "symbol-liquidity.csv": b"", "README.md": b"synthetic"}
            manifest = dict(schema="tt1-cadence-package/v1", exportedAt=p["collectedThrough"], sessionDate=p["sessionDate"],
                sourceRevision="test", files=[dict(name=k, sha256=m.digest(v), bytes=len(v)) for k, v in payloads.items()])
            payloads["manifest.json"] = m.encoded(manifest)
            path = root / "cadence.zip"
            with zipfile.ZipFile(path, "w") as z:
                for k, v in payloads.items(): z.writestr(k, v)
            loaded = m.load_package(path)
            s["decisions"][0].update(packageSha256=loaded["sha256"], manifestSha256=loaded["manifestSha256"])
            s["packages"] = ["cadence.zip"]
            notes = root / "notes.json"; notes.write_bytes(m.encoded(s))
            before = path.read_bytes()
            result = subprocess.run(["node", str(Path(__file__).with_name("wheelwright.mjs")), "export", "tt1-record",
                 "--input", str(notes), "--output", str(root / "out")], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            output = Path(result.stdout.strip())
            self.assertEqual(output.stat().st_mode & 0o777, 0o600)
            with zipfile.ZipFile(output) as z:
                self.assertEqual(z.read("sources/" + loaded["sha256"] + ".zip"), before)
                self.assertIsNone(z.testzip())
            self.assertEqual(path.read_bytes(), before)
            payloads["README.md"] = b"tampered"
            with zipfile.ZipFile(path, "w") as z:
                for k, v in payloads.items(): z.writestr(k, v)
            with self.assertRaises(ValueError): m.load_package(path)


if __name__ == "__main__":
    unittest.main()
