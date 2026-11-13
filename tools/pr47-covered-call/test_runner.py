"""Exercise the normal CLI workflow through simulated provider/transport boundaries."""
from collections import Counter
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from decimal import Decimal as D
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace

import runner
REAL_COMBO_SENDER = runner.ComboSender
from experiment import Blocked, COHORT, Contract, client_id, contract_identity
from test_experiment import OLD, NEW, balance, listed


AT = datetime(2026, 11, 11, 15, 0, tzinfo=timezone.utc)


class FakeProviders:
    def __init__(self):
        self.quote_requests = []
        self.contracts = {symbol: Contract(symbol, "2026-11-13", D(101),
                                          symbol + "261113C00101000") for symbol in COHORT}

    def market(self, endpoint, **params):
        contract = self.contracts[params["symbol"]]
        return dict(options=dict(option=[listed(contract)])), {}

    def greeks(self, symbol):
        return dict(expiration="2026-11-13", greeks=[
            dict(symbol=self.contracts[symbol].occ, delta=".5", updatedAt=AT.timestamp() * 1000)])

    def prices(self, symbols):
        self.quote_requests.append(tuple(symbols))
        books = {}
        for symbol in symbols:
            contract = next((c for c in self.contracts.values() if c.occ == symbol), None)
            books[symbol] = dict(listed(contract), bid="1", ask="1.10") if contract else dict(
                symbol=symbol, type="stock", bid="100", ask="100.10")
        return books, dict(completed_utc=AT.isoformat()), {}


class FakeRollProviders(FakeProviders):
    def market(self, endpoint, **params):
        if endpoint == "options/expirations":
            return {"expirations": {"expiration": [{"date": "2026-11-13"}, {"date": "2026-11-20"}]}}, {}
        old = self.contracts[params["symbol"]]
        later = Contract(old.symbol, "2026-11-20", old.strike,
                         old.symbol + "261120C00101000")
        return dict(options=dict(option=[listed(later)])), {}

    def prices(self, symbols):
        self.quote_requests.append(tuple(symbols))
        books = {}
        for symbol in symbols:
            if symbol in self.contracts:
                mark = "100" if symbol == COHORT[0] else "101" if symbol == COHORT[1] else "102"
                books[symbol] = dict(symbol=symbol, type="stock", bid=mark, ask=mark)
            else:
                root = symbol.split("2611")[0]
                expiry = "2026-11-13" if "261113" in symbol else "2026-11-20"
                contract = Contract(root, expiry, D(101), symbol)
                books[symbol] = dict(listed(contract), bid="1.10", ask="1.10")
        return books, dict(completed_utc=AT.isoformat()), {}


class FakeBroker:
    def __init__(self, path, metrics):
        self.path, self.measurements = path, metrics
        self.shares = Counter({symbol: D(100) for symbol in COHORT})
        self.options = Counter()
        self.sent = []
        self.history = []

    def snapshot(self, history=False):
        return dict(balance=balance(cash="1000000", stock="2000000"), inventory=(deepcopy(self.shares),
                    deepcopy(self.options)), working=[], orders=deepcopy(self.history), cash=[],
                    observed_at=AT.isoformat())

    def catalog(self, contract):
        return dict(symbol=contract.occ)


class FakeSender:
    fail = False
    observed = []

    def __init__(self, broker, order, path, validate, measurements):
        self.broker, self.order, self.validate = broker, deepcopy(order), validate
        self.package = dict(sha256="test", submission_enabled=False)

    def place_once(self, placement_authorized=False):
        if not placement_authorized:
            raise PermissionError()
        self.validate()
        state = json.loads((runner.ROOT / "state.json").read_text())
        assert state["orders"][self.order["client_order_id"]]["status"] == "ATTEMPT_RECORDED"
        self.observed.append(self.order["client_order_id"])
        if self.fail:
            raise TimeoutError("ambiguous socket outcome")
        symbol = self.order["symbol"]
        if self.order["option_strategy"] == "COVERED_STOCK":
            self.broker.shares[symbol] += 100
        else:
            self.broker.options[runner.contract_key(self.order["legs"][0])] += 1
        leg = self.order["legs"][1]
        self.broker.options[runner.contract_key(leg)] -= 1
        row = dict(symbol=symbol, state="FILLED", order_id="broker-" + symbol,
                   client_order_id=self.order["client_order_id"], side=self.order["side"],
                   quantity="1", filled_quantity="1", average_fill_price=self.order["limit_price"], legs=deepcopy(self.order["legs"]),
                   last_execution_at_utc=AT.isoformat())
        self.broker.history.append(row)
        return dict(http_status=200, response=dict(client_order_id=self.order["client_order_id"], order_id=row["order_id"]))


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.shared = self.root / "shared"
        self.shared.mkdir()
        self.runtime = self.root / "runtime"
        self.runtime.mkdir()
        self.patches = [
            patch.object(runner, "ROOT", self.runtime),
            patch.object(runner, "SHARED_ROOT", self.shared),
            patch.object(runner, "now", return_value=AT),
            patch.object(runner, "qualified", return_value={}),
            patch.object(runner, "qualify_equities"),
            patch.object(runner, "ComboSender", FakeSender),
            patch.object(runner, "qualification_slot", return_value=runner.ExitStack()),
            patch.object(runner.PACER, "mark"),
            patch.object(runner.Measurements, "wait"),
        ]
        for current in self.patches:
            current.start()
            self.addCleanup(current.stop)
        FakeSender.fail = False
        FakeSender.observed = []

    def test_full_entry_claims_28_original_identities_and_reconciles_each_leg(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        providers = FakeProviders()
        state = {"orders": {}}
        runner.entry(broker, providers, state, True)
        self.assertEqual(len(FakeSender.observed), 28)
        self.assertEqual(len(set(FakeSender.observed)), 28)
        self.assertEqual({record["status"] for record in state["orders"].values()}, {"ACCEPTED"})
        _, statuses = runner.observe(broker, state)
        self.assertEqual({r["state"] for r in statuses.values()}, {"POSITION_RECONCILED"})
        exact_requests = [symbols for symbols in providers.quote_requests if len(symbols) == 2]
        self.assertEqual(len(exact_requests), 28)
        self.assertTrue(all("position_reconciled_at" in r for r in state["orders"].values()))

    def test_unfunded_full_basket_never_builds_sender_claim(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        original = broker.snapshot
        def no_cash(history=False):
            cut = original(history)
            cut["balance"] = balance(cash="1")
            return cut
        broker.snapshot = no_cash
        with self.assertRaises(Blocked):
            runner.entry(broker, FakeProviders(), {"orders": {}}, True)
        self.assertEqual(FakeSender.observed, [])

    def test_preparation_retries_only_stale_greeks_and_retains_successes(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        providers = FakeProviders()
        original = providers.greeks
        observations = Counter()
        def refresh(symbol):
            observations[symbol] += 1
            if symbol == COHORT[0] and observations[symbol] == 1:
                return {"expiration": "2026-11-13", "greeks": []}
            return original(symbol)
        providers.greeks = refresh
        with patch.object(runner.time, "sleep"):
            runner.entry(broker, providers, {"orders": {}}, False)
        self.assertEqual(observations[COHORT[0]], 2)
        self.assertTrue(all(observations[symbol] == 1 for symbol in COHORT[1:]))
        self.assertFalse(FakeSender.observed)

    def test_missing_greeks_stop_entire_basket_before_any_send(self):
        providers = FakeProviders()
        providers.greeks = lambda symbol: {"expiration": "2026-11-13", "greeks": []}
        with patch.object(runner.time, "sleep"), self.assertRaises(Blocked):
            runner.entry(FakeBroker(self.runtime, runner.Measurements()), providers, {"orders": {}}, True)
        self.assertEqual(FakeSender.observed, [])

    def test_ambiguous_send_retains_exclusive_claim_and_cannot_retry(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        state = {"orders": {}}
        FakeSender.fail = True
        with self.assertRaises(TimeoutError):
            runner.entry(broker, FakeProviders(), state, True)
        self.assertEqual(len(FakeSender.observed), 1)
        self.assertEqual(next(iter(state["orders"].values()))["status"], "UNCERTAIN")
        with self.assertRaises(Blocked):
            runner.entry(broker, FakeProviders(), state, True)
        self.assertEqual(len(FakeSender.observed), 1)

    def test_dispatch_validation_is_rechecked_after_pacing(self):
        metrics = runner.Measurements()
        broker = FakeBroker(self.runtime, metrics)
        providers = FakeProviders()
        state = {"orders": {}}
        # A network/pacing stall makes final data invalid before the claim.
        with patch.object(runner, "qualified", side_effect=Blocked("stale exact quote")):
            with self.assertRaises(Blocked):
                runner.entry(broker, providers, state, True)
        self.assertFalse(state["orders"])
        self.assertFalse(FakeSender.observed)

    def test_external_working_order_blocks_entry(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        original = broker.snapshot
        def external(history=False):
            cut = original(history)
            cut["working"] = [{"client_order_id": "external"}]
            return cut
        broker.snapshot = external
        with self.assertRaises(Blocked):
            runner.entry(broker, FakeProviders(), {"orders": {}}, True)
        self.assertFalse(FakeSender.observed)

    def test_request_only_plan_never_calls_placement(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        state = {"orders": {}}
        runner.entry(broker, FakeProviders(), state, False)
        self.assertEqual(state["orders"], {})
        self.assertFalse(FakeSender.observed)
        self.assertFalse((self.runtime / "state.json").exists())

    def test_friday_rolls_itm_only_same_strike_zero_net_fallback(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        state = {"orders": {}}
        runner.entry(broker, FakeProviders(), state, True)
        friday = datetime(2026, 11, 13, 15, tzinfo=timezone.utc)
        with patch.object(runner, "now", return_value=friday):
            original = broker.snapshot
            def current(history=False):
                cut = original(history)
                cut["observed_at"] = friday.isoformat()
                return cut
            broker.snapshot = current
            runner.roll(broker, FakeRollProviders(), state, True)
        rolls = [r for r in state["orders"].values() if r["phase"] == "roll"]
        self.assertEqual(len(rolls), 26)
        self.assertEqual({r["request"]["limit_price"] for r in rolls}, {"0.01"})
        self.assertEqual({r["request"]["side"] for r in rolls}, {"BUY"})
        self.assertEqual({r["request"]["option_strategy"] for r in rolls}, {"CALENDAR"})
        self.assertEqual(len(FakeSender.observed), 54)

    def test_financial_cut_refreshes_before_pacing_exhausts_dispatch_age(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        current = AT
        calls = 0
        original = broker.snapshot
        def snapshot(history=False):
            nonlocal calls
            calls += 1
            result = original(history)
            result["observed_at"] = current.isoformat()
            return result
        def wait(route, interval=3):
            nonlocal current
            if route == "webull:place":
                current += timedelta(seconds=2)
        broker.snapshot = snapshot
        with patch.object(runner, "now", side_effect=lambda: current), patch.object(
            broker.measurements, "wait", side_effect=wait
        ):
            runner.entry(broker, FakeProviders(), {"orders": {}}, True)
        self.assertEqual(len(FakeSender.observed), 28)
        self.assertGreaterEqual(calls, 5)

    def test_friday_stock_additions_preserve_proven_original_call_scope(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        state = {"orders": {}}
        runner.entry(broker, FakeProviders(), state, True)
        runner.observe(broker, state)
        broker.shares[COHORT[2]] += 100
        friday = datetime(2026, 11, 13, 15, tzinfo=timezone.utc)
        original = broker.snapshot
        def current(history=False):
            result = original(history)
            result["observed_at"] = friday.isoformat()
            return result
        broker.snapshot = current
        with patch.object(runner, "now", return_value=friday):
            runner.roll(broker, FakeRollProviders(), state, True)
        self.assertIn(client_id("roll", COHORT[2]), state["orders"])

    def test_friday_stock_removal_does_not_reassign_original_experiment_scope(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        state = {"orders": {}}
        runner.entry(broker, FakeProviders(), state, True)
        runner.observe(broker, state)
        broker.shares[COHORT[2]] -= 100
        friday = datetime(2026, 11, 13, 15, tzinfo=timezone.utc)
        original = broker.snapshot
        def current(history=False):
            result = original(history)
            result["observed_at"] = friday.isoformat()
            return result
        broker.snapshot = current
        with patch.object(runner, "now", return_value=friday):
            runner.roll(broker, FakeRollProviders(), state, True)
        self.assertNotIn(client_id("roll", COHORT[2]), state["orders"])

    def test_pacing_can_expire_final_quote_before_any_attempt_is_reserved(self):
        metrics = runner.Measurements()
        broker = FakeBroker(self.runtime, metrics)
        order = runner.buy_write(OLD, {"ask": "181"}, {"bid": "2"})
        expired = False
        def wait(*args):
            nonlocal expired
            expired = True
        def validate():
            if expired:
                raise Blocked("Quote expired during pacing")
        state = {"orders": {}}
        with patch.object(metrics, "wait", side_effect=wait):
            with self.assertRaises(Blocked):
                runner.submit(broker, order, "entry", broker.snapshot(), D(18100), state,
                              validate, runner.time.monotonic(), {})
        self.assertFalse(state["orders"])
        self.assertFalse(FakeSender.observed)

    def test_proven_sender_uses_exact_combo_bytes_and_prevents_second_post(self):
        metrics = runner.Measurements()
        reader = SimpleNamespace(_secrets=("FAKE_KEY", "FAKE_SECRET"),
                                 _signer=SimpleNamespace(sign=lambda request: {}))
        broker = SimpleNamespace(reader=reader, account="sandbox-test-account")
        order = runner.buy_write(OLD, {"ask": "181.23"}, {"bid": "2.11"})
        path = self.runtime / "one-send"
        path.mkdir()
        calls = []
        class Response:
            status_code = 200
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def iter_content(self, size):
                yield json.dumps(dict(client_order_id=order["client_order_id"], order_id="verified")).encode()
        def send(session, prepared, **kwargs):
            self.assertEqual(prepared.url, "https://api.sandbox.webull.com/trading/orders/place")
            body = json.loads(prepared.body)
            self.assertEqual(body["new_orders"], [order])
            self.assertTrue((path / "place-dispatch-claim.json").is_file())
            calls.append(prepared)
            return Response()
        with patch.object(runner.requests.Session, "send", new=send):
            sender = REAL_COMBO_SENDER(broker, order, path, lambda: None, metrics)
            result = sender.place_once(placement_authorized=True)
            self.assertTrue(runner.positive_ack(result, order))
            second = REAL_COMBO_SENDER(broker, order, path, lambda: None, metrics)
            with self.assertRaises(FileExistsError):
                second.place_once(placement_authorized=True)
        self.assertEqual(len(calls), 1)

    def test_pending_pr46_handoff_is_a_blocker(self):
        with self.assertRaises(Blocked):
            runner.verify_pr46_handoff({"execution_date": "2026-11-11", "handoff_status": "PENDING_FUTURE_RUN"},
                                      {}, "2026-11-11")

    def test_fresh_pr46_handoff_accounts_working_and_uncertain(self):
        evidence = self.root / "final.json"
        evidence.write_text("{}")
        at = AT.isoformat()
        dependency = dict(execution_date="2026-11-11", handoff_status="READY", runner_exit_observed=True,
                          final_reconciliation_locator=str(evidence), working_client_order_ids=[],
                          uncertain_client_order_ids=[])
        treatment = dict(client_order_id="pr46", phase="BROKER_OBSERVED",
                         submission_attempt=dict(client_order_id="pr46"),
                         last_observation=dict(at=at, state="FILLED"))
        ledger = dict(universe_run=dict(last_reconciliation=at), cohorts=[dict(treatments=[treatment])])
        self.assertEqual(runner.verify_pr46_handoff(dependency, ledger, "2026-11-11")["attempted"], 1)
        treatment["last_observation"]["state"] = "SUBMITTED"
        with self.assertRaises(Blocked):
            runner.verify_pr46_handoff(dependency, ledger, "2026-11-11")
        dependency["working_client_order_ids"] = ["pr46"]
        self.assertEqual(runner.verify_pr46_handoff(dependency, ledger, "2026-11-11")["working"], 1)

    def test_late_entry_has_no_artificial_ten_am_cutoff(self):
        with patch.object(runner, "now", return_value=datetime(2026, 11, 11, 19, tzinfo=timezone.utc)):
            runner.session_window("entry")
        with patch.object(runner, "now", return_value=datetime(2026, 11, 11, 14, tzinfo=timezone.utc)):
            with self.assertRaises(Blocked):
                runner.session_window("entry")

    def test_current_roll_claim_is_counted_once_after_persistence(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        cut = broker.snapshot()
        cut["balance"] = balance(cash="100", option="100")
        cut["inventory"][1][contract_identity(OLD)] = -1
        own = dict(phase="roll", cash_reservation="60")
        state = {"orders": {client_id("roll", OLD.symbol): own}}
        runner.check_roll_cut(cut, state, OLD, NEW, D(60))
        state["orders"][client_id("roll", "KO")] = dict(phase="roll", cash_reservation="60")
        with self.assertRaises(Blocked):
            runner.check_roll_cut(cut, state, OLD, NEW, D(60))

    def test_roll_debit_is_limited_by_real_capacity_without_a_policy_cap(self):
        broker = FakeBroker(self.runtime, runner.Measurements())
        cut = broker.snapshot()
        cut["inventory"][1][contract_identity(OLD)] = -1
        runner.check_roll_cut(cut, {"orders": {}}, OLD, NEW, D("10000"))
        with self.assertRaises(Blocked):
            runner.check_roll_cut(cut, {"orders": {}}, OLD, NEW, D("1000001"))


if __name__ == "__main__":
    unittest.main()
