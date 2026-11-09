"""Focused synthetic controls; these do not establish live broker behavior."""
from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
import json
import os
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest
from unittest.mock import patch

from acquisition_state import StateError, collect_current, inspect
from experiment_state import ExperimentStore, enroll, evaluate, prepare, reconcile, record_uncertainty, scope
from webull_identity import validate_request, AuditError

NOW = datetime(2026, 11, 7, 16, tzinfo=timezone.utc)
DAY = NOW.date()
ACCOUNT = "SYNTHETIC_ACCOUNT"
SCOPE = scope(ACCOUNT)
CONTRACTS = [{"symbol": "DEMO", "expiration": "2026-11-13", "strike": "100",
              "right": "PUT", "multiplier": "100", "deliverable": "100",
              "reference": "SANITIZED_TEST_REFERENCE"}]


def snapshot(positions=(), orders=()):
    mv = sum(float(p["market_value"]) for p in positions)
    balance = {"total_asset_currency": "USD", "total_cash_balance": "1000000",
               "total_market_value": str(mv), "total_net_liquidation_value": str(1000000 + mv),
               "account_currency_assets": [{"currency": "USD", "settled_cash": "1000000",
                                            "buying_power": "1000000", "option_buying_power": "1000000"}]}
    working = [r for r in orders if r["state"] in ("PENDING", "SUBMITTED", "PARTIALLY_FILLED")]
    def paged(rows):
        return {"status": "OBSERVED", "result": {"data": [], "complete_for_query": True, "normalized_orders": list(rows)}}
    return {"account_id": ACCOUNT, "started_at": (NOW - timedelta(seconds=3)).isoformat(), "finished_at": NOW.isoformat(),
            "operations": {"positions": {"status": "OBSERVED", "result": list(positions)},
                           "balances": {"status": "OBSERVED", "result": balance},
                           "working": paged(working), "history": paged(orders),
                           "cash": {"status": "OBSERVED", "result": {"data": [], "normalized_activities": [], "complete_for_query": True}}},
            "details_status": "OBSERVED" if orders else "NOT EXERCISED: no observed client order IDs",
            "details": [{"status": "OBSERVED", "client_order_id": r["client_order_id"], "normalized_orders": [r]} for r in orders],
            "closing": {"positions": {"status": "OBSERVED", "result": list(positions)},
                        "balances": {"status": "OBSERVED", "result": deepcopy(balance)}, "working": paged(working)}}


def stock(quantity):
    return {"symbol": "DEMO", "instrument_type": "EQUITY", "quantity": str(quantity), "market_value": str(quantity * 100)}


def order(child, filled, state="FILLED"):
    return {"account_id": ACCOUNT, "identity": [ACCOUNT, "order_id", "BROKER-DEMO"], "order_id": "BROKER-DEMO",
            "client_order_id": child["client_order_id"], "symbol": "DEMO", "state": state,
            "quantity": child["quantity"], "filled_quantity": str(filled), "side": "BUY", "legs": None,
            "provider": {"instrument_type": "EQUITY"}}


class ExperimentTest(unittest.TestCase):
    def current(self, positions=(), orders=()):
        return inspect(snapshot(positions, orders), NOW)

    def enrolled(self):
        data = {"schema": 1, "cohorts": []}
        result = enroll(data, self.current(), SCOPE, "DEMO", "event-1", CONTRACTS, DAY)
        self.assertTrue(result["created"])
        return data, result["cohort"]

    def test_duplicate_events_keep_identity_and_other_signals_cannot_duplicate_underlying(self):
        data, cohort = self.enrolled()
        again = enroll(data, self.current(), SCOPE, "DEMO", "event-1", CONTRACTS, DAY)
        self.assertFalse(again["created"])
        self.assertEqual(again["cohort"], cohort)
        blocked = enroll(data, self.current(), SCOPE, "DEMO", "different-event", CONTRACTS, DAY)
        self.assertIsNone(blocked["cohort"])
        self.assertEqual(len(data["cohorts"]), 1)
        self.assertEqual(blocked["evaluation"]["status"], "BLOCKED")

    def test_existing_broker_exposure_does_not_create_an_identity(self):
        data = {"cohorts": []}
        result = enroll(data, self.current([stock(100)]), SCOPE, "DEMO", "event", CONTRACTS, DAY)
        self.assertFalse(result["created"])
        self.assertEqual(data["cohorts"], [])

    def test_control_fill_preserves_already_planned_put_child(self):
        data, c = self.enrolled()
        current = self.current([stock(100)], [order(c["treatments"][0], 100)])
        self.assertEqual(current["status"], "OBSERVED")
        reconcile(c, current)
        decision = evaluate(current, SCOPE, "DEMO", data, c["id"])
        self.assertEqual(decision["status"], "EXISTING_COHORT")
        self.assertEqual([t["status"] for t in decision["children"]], ["BROKER_OBSERVED", "PLANNED_NO_SUBMISSION"])
        self.assertFalse(prepare(c["treatments"][1])["submission_enabled"])

    def test_partial_fill_and_repeated_cumulative_observation_not_added(self):
        data, c = self.enrolled()
        current = self.current([stock(40)], [order(c["treatments"][0], 40, "PARTIALLY_FILLED")])
        for _ in range(2):
            reconcile(c, current)
            self.assertEqual(evaluate(current, SCOPE, "DEMO", data, c["id"])["status"], "EXISTING_COHORT")
        self.assertEqual(c["treatments"][0]["last_observation"]["filled_quantity"], "40")

    def test_unassociated_activity_blocks_children_even_when_symbol_matches(self):
        data, c = self.enrolled()
        external = order(c["treatments"][0], 100)
        external["client_order_id"] = "OTHER-MANUAL-ORDER"
        current = self.current([stock(100)], [external])
        self.assertEqual(evaluate(current, SCOPE, "DEMO", data, c["id"])["status"], "BLOCKED")

    def test_pending_order_blocks_new_enrollment_with_zero_positions(self):
        data, c = self.enrolled()
        current = self.current([], [order(c["treatments"][0], 0, "SUBMITTED")])
        self.assertEqual(evaluate(current, SCOPE, "DEMO", {"cohorts": []})["status"], "BLOCKED")

    def test_unknown_attempt_remains_stopped_when_lists_are_empty_or_later_find_order(self):
        data, c = self.enrolled()
        record_uncertainty(c, c["treatments"][0]["intent_id"], "SYNTHETIC_INTERRUPTION_EVIDENCE")
        self.assertEqual(evaluate(self.current(), SCOPE, "DEMO", data, c["id"])["status"], "UNRESOLVED")
        current = self.current([stock(100)], [order(c["treatments"][0], 100)])
        reconcile(c, current)
        self.assertEqual(evaluate(current, SCOPE, "DEMO", data, c["id"])["status"], "UNRESOLVED")

    def test_filled_position_disagreement_and_delayed_assignment_are_unresolved(self):
        data, c = self.enrolled()
        current = self.current([stock(200)], [order(c["treatments"][0], 100)])
        self.assertEqual(evaluate(current, SCOPE, "DEMO", data, c["id"])["reasons"],
                         ["POSITIONS_DO_NOT_RECONCILE_TO_COHORT_OPENINGS"])

    def test_incomplete_stale_or_inconsistent_financial_observations_fail_closed(self):
        for defect in ("missing", "pages", "stale", "future", "bracket", "cash", "capacity", "unknown", "detail"):
            s = snapshot()
            if defect == "missing": s["operations"]["positions"]["status"] = "FAILED"
            if defect == "pages": s["operations"]["history"]["result"]["complete_for_query"] = False
            if defect == "stale": s["finished_at"] = (NOW - timedelta(minutes=2)).isoformat()
            if defect == "future": s["finished_at"] = (NOW + timedelta(seconds=1)).isoformat()
            if defect == "bracket": s["closing"]["positions"]["result"] = [stock(100)]
            if defect == "cash": s["operations"]["balances"]["result"]["total_net_liquidation_value"] = "2"
            if defect == "capacity": s["operations"]["balances"]["result"]["account_currency_assets"] = []
            if defect == "unknown": s["operations"]["positions"]["result"] = [{"symbol": "DEMO", "quantity": "1"}]
            if defect == "detail": s["details"].append({"status": "FAILED", "client_order_id": "unknown"})
            with self.subTest(defect=defect): self.assertEqual(inspect(s, NOW)["status"], "UNRESOLVED")

    def test_failed_known_id_lookup_cannot_be_used_as_proof_of_absence(self):
        class Reader:
            def order_detail(self, *a): raise AuditError("unavailable")
            def positions(self, *a): return []
            def working_orders(self, *a): return {"data": [], "normalized_orders": [], "complete_for_query": True}
            def balances(self, *a): return snapshot()["operations"]["balances"]["result"]
        with patch("acquisition_state.collect_activity", return_value=snapshot()):
            s = collect_current(Reader(), ACCOUNT, "start", "end", ["unknown"])
        self.assertEqual(inspect(s)["status"], "UNRESOLVED")

    def test_atomic_store_recovery_preserves_ids_but_not_old_operational_authority(self):
        with tempfile.TemporaryDirectory() as path:
            os.chmod(path, 0o700)
            first = ExperimentStore(path)
            with first.transaction() as data:
                c = enroll(data, self.current(), SCOPE, "DEMO", "event-1", CONTRACTS, DAY)["cohort"]
            second = ExperimentStore(path)
            with second.transaction() as recovered:
                self.assertEqual(recovered["cohorts"][0], c)
                current = inspect(snapshot(), NOW + timedelta(minutes=5))
                self.assertEqual(evaluate(current, SCOPE, "DEMO", recovered, c["id"])["status"], "UNRESOLVED")
            child_code = "import json,sys\nfrom experiment_state import ExperimentStore\nwith ExperimentStore(sys.argv[1]).transaction() as data:\n print(json.dumps(data['cohorts'][0]))\n"
            recovered_process = subprocess.run([sys.executable, "-c", child_code, path], check=True,
                capture_output=True, text=True, env={"PYTHONPATH": str(Path(__file__).resolve().parent)})
            self.assertEqual(json.loads(recovered_process.stdout), c)
            self.assertEqual((Path(path) / "experiment.json").stat().st_mode & 0o777, 0o600)
            old = (Path(path) / "experiment.json").read_bytes()
            with self.assertRaises(StateError), second.transaction() as data:
                data["cohorts"].clear()
                raise StateError("interrupted")
            self.assertEqual((Path(path) / "experiment.json").read_bytes(), old)

    def test_corrupt_or_symlink_identity_store_never_resets(self):
        with tempfile.TemporaryDirectory() as path:
            os.chmod(path, 0o700)
            state = Path(path) / "experiment.json"
            state.write_text("broken"); state.chmod(0o600)
            with self.assertRaises(StateError), ExperimentStore(path).transaction(): pass
            state.unlink(); state.symlink_to("other")
            with self.assertRaises(StateError), ExperimentStore(path).transaction(): pass

    def test_changed_event_payload_account_scope_and_duplicate_expiry_cannot_alias(self):
        data, c = self.enrolled()
        changed = deepcopy(CONTRACTS); changed[0]["strike"] = "101"
        with self.assertRaises(StateError): enroll(data, self.current(), SCOPE, "DEMO", "event-1", changed, DAY)
        with self.assertRaises(StateError): evaluate(self.current(), scope("OTHER"), "DEMO", data, c["id"])
        with self.assertRaises(StateError): enroll({"cohorts": []}, self.current(), SCOPE, "DEMO", "event", CONTRACTS * 2, DAY)

    def test_preparation_is_unpriced_disabled_and_get_transport_still_rejects_it(self):
        _, c = self.enrolled()
        for child in c["treatments"]:
            plan = prepare(child)
            self.assertFalse(plan["submission_enabled"])
            self.assertFalse(plan["retry_permitted"])
            self.assertIn("PRINCIPAL_ORDER_AUTHORIZATION", plan["missing"])
            self.assertNotIn("limit_price", plan["order_fields"])
            self.assertEqual(plan["order_fields"]["time_in_force"], "DAY")
            with self.assertRaises(AuditError):
                validate_request("POST", "https://api.sandbox.webull.com/trading/orders/place", json.dumps(plan))
        self.assertEqual(len(c["treatments"][1]["client_order_id"]), 32)

    def test_official_sdk_can_package_disabled_construction_without_a_network_call(self):
        from webull.trade.request.v3.place_order_request import PlaceOrderRequest
        _, c = self.enrolled()
        for child in c["treatments"]:
            fields = prepare(child)["order_fields"]
            request = PlaceOrderRequest()
            request.set_account_id("SUBMISSION_DISABLED")
            request.set_new_orders([fields])
            request.add_custom_headers_from_order([fields])
            self.assertEqual(request.get_body_params()["new_orders"], [fields])
            self.assertEqual(request.get_method(), "POST")
            # Packaging is not broker schema acceptance. Its method is refused
            # by the unchanged actual transport even if a caller tries it.
            with self.assertRaises(AuditError):
                validate_request(request.get_method(), "https://api.sandbox.webull.com/trading/orders/place", request.get_body_params())

    def test_financial_scope_and_client_content_conflicts_cannot_be_promoted(self):
        data, c = self.enrolled()
        wrong = deepcopy(self.current()); wrong["account_scope"] = scope("OTHER_ACCOUNT")
        with self.assertRaises(StateError): evaluate(wrong, SCOPE, "DEMO", data)
        with self.assertRaises(StateError): reconcile(c, wrong)
        conflict = order(c["treatments"][0], 100)
        conflict["side"] = "SELL"
        current = self.current([stock(100)], [conflict])
        reconcile(c, current)
        self.assertEqual(c["treatments"][0]["phase"], "UNCERTAIN")
        self.assertEqual(evaluate(current, SCOPE, "DEMO", data, c["id"])["status"], "UNRESOLVED")

    def test_opposing_rows_and_missing_or_conflicting_details_fail_closed(self):
        self.assertEqual(self.current([stock(100), stock(-100)])["status"], "UNRESOLVED")
        _, c = self.enrolled()
        s = snapshot([stock(100)], [order(c["treatments"][0], 100)])
        s["details"] = []
        self.assertEqual(inspect(s, NOW)["status"], "UNRESOLVED")
        s = snapshot([stock(100)], [order(c["treatments"][0], 100)])
        s["details"][0]["normalized_orders"] = [deepcopy(s["details"][0]["normalized_orders"][0])]
        s["details"][0]["normalized_orders"][0]["filled_quantity"] = "40"
        self.assertEqual(inspect(s, NOW)["status"], "UNRESOLVED")


if __name__ == "__main__": unittest.main()
