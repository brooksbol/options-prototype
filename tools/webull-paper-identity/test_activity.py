"""Synthetic fixtures; no real orders, credentials, Keychain or network access."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

import requests
import webull_identity as w
from activity_records import RecordError, timestamp, window, order_records, cash_records, page
from test_webull_identity import reply, KEY, SECRET

START, END = "2026-11-05T00:00:00.000Z", "2026-11-06T19:15:00.000Z"


class ActivityTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)
        self.reader = w.IdentityReader(KEY, SECRET, self.path)
        self.fixture = json.loads((Path(__file__).parent / "fixtures/orders.json").read_text())

    def test_approved_requests_use_sdk_builders_and_exact_parameters(self):
        responses = [reply({"data": []}), reply({"data": []}), reply({"data": []}),
                     reply(self.fixture["data"][0])]
        seen = []
        def send(adapter, request, **kwargs):
            seen.append(request)
            return responses[len(seen)-1]
        with patch("requests.adapters.HTTPAdapter.send", send):
            self.reader.working_orders("fixture-account")
            self.reader.historical_orders("fixture-account", START, END)
            self.reader.cash_activities("fixture-account", START, END)
            self.reader.order_detail("fixture-account", "fixture-client-1")
        self.assertEqual([urlsplit(r.url).path for r in seen], [w.PATHS[k] for k in ("working", "history", "cash", "detail")])
        for r in seen:
            self.assertEqual(r.method, "GET")
            self.assertEqual(r.headers["x-version"], "v3")
            self.assertEqual(parse_qs(urlsplit(r.url).query)["account_id"], ["fixture-account"])
        self.assertEqual(parse_qs(urlsplit(seen[1].url).query)["start_time"], [START])
        self.assertEqual(parse_qs(urlsplit(seen[2].url).query)["end_time"], [END])
        self.assertEqual(parse_qs(urlsplit(seen[3].url).query)["client_order_id"], ["fixture-client-1"])

    def test_every_approved_path_rejects_production_and_non_get(self):
        for path in w.PATHS.values():
            for method, host in [("POST", w.BASE), ("DELETE", w.BASE), ("GET", "https://api.webull.com")]:
                with self.subTest(path=path, method=method), patch("requests.adapters.HTTPAdapter.send") as network:
                    with self.assertRaises(w.AuditError):
                        w.SandboxSession().send(requests.Request(method, host + path).prepare())
                    network.assert_not_called()

    def test_history_requires_bounded_canonical_window_before_network(self):
        bad = [(None, END), (END, START), (START, "2027-01-01T00:00:00Z"),
               ("2026-11-05T00:00:00", END)]
        for start, end in bad:
            with self.subTest(start=start), patch("requests.adapters.HTTPAdapter.send") as network:
                with self.assertRaises(RecordError):
                    self.reader.historical_orders("fixture-account", start, end)
                network.assert_not_called()
        with self.assertRaises(RecordError):
            window("2026-12-31T00:00:00Z", "2027-01-01T00:00:00Z", cash=True)
        for suffix in ["?account_id=a", "?account_id=a&start_date=2026-11-05&end_date=2026-11-06"]:
            with self.assertRaises(w.AuditError):
                w.validate_request("GET", w.BASE + w.PATHS["history"] + suffix)

    def test_cursor_walk_keeps_window_and_follows_empty_page(self):
        seen = []
        def send(adapter, request, **kwargs):
            seen.append(request)
            return reply({"data": [], "pagination_key": "next=="} if len(seen) == 1 else self.fixture)
        with patch("requests.adapters.HTTPAdapter.send", send):
            result = self.reader.historical_orders("fixture-account", START, END)
        self.assertTrue(result["complete_for_query"])
        self.assertEqual(len(result["pages"]), 2)
        queries = [parse_qs(urlsplit(r.url).query) for r in seen]
        self.assertEqual(queries[1]["pagination_key"], ["next=="])
        for q in queries:
            self.assertEqual(q["start_time"], [START])
            self.assertEqual(q["end_time"], [END])

    def test_repeated_cursor_and_page_cap_never_claim_complete(self):
        with patch("requests.adapters.HTTPAdapter.send", return_value=reply({"data": [], "pagination_key": "same"})):
            # Fresh response bodies for each request.
            with patch.object(self.reader, "_read", return_value={"data": [], "pagination_key": "same"}) as read:
                with self.assertRaisesRegex(w.AuditError, "Repeated"):
                    self.reader.working_orders("fixture-account")
                self.assertEqual(read.call_count, 2)
        with patch.object(self.reader, "_read", side_effect=[{"data": [], "pagination_key": "a"}, {"data": [], "pagination_key": "b"}]), patch.object(w, "MAX_PAGES", 2):
            with self.assertRaisesRegex(w.AuditError, "Page bound"):
                self.reader.working_orders("fixture-account")

    def test_record_cap_and_unknown_pagination_schema(self):
        with patch.object(self.reader, "_read", return_value={"data": [{}, {}]}), patch.object(w, "MAX_RECORDS", 1):
            with self.assertRaisesRegex(w.AuditError, "Record bound"):
                self.reader.working_orders("fixture-account")
        for value in [[], {"data": None}, {"data": [1]}, {"data": [], "has_more": True}, {"data": [], "pagination_key": 1}]:
            with self.subTest(value=value), self.assertRaises(RecordError):
                page(value)

    def test_partially_filled_option_preserves_exact_provider_contract(self):
        record = order_records(self.fixture["data"], "fixture-account")[0]
        self.assertEqual(record["state"], "PARTIALLY_FILLED")
        self.assertEqual(record["filled_quantity"], "1")
        self.assertEqual(record["average_fill_price"], "2.35")
        self.assertEqual(record["quantity"], "2")
        self.assertEqual(record["legs"][0]["option_contract_multiplier"], "100")
        self.assertEqual(record["legs"][0]["strike_price"], "100")
        self.assertEqual(record["submitted_at_utc"], "2026-11-06T14:35:00.000Z")
        self.assertEqual(record["last_execution_at_utc"], "2026-11-06T14:36:00.123Z")
        self.assertIsNone(record["fees"])
        self.assertIsNone(record["commission"])

    def test_canceled_replaced_unknown_status_and_group_relationships_preserved(self):
        group = self.fixture["data"][0]
        group["replaces_client_order_id"] = "fixture-prior"
        group["orders"][0]["status"] = "CANCELLED"
        self.assertEqual(order_records([group], "fixture-account")[0]["state"], "CANCELED")
        group["orders"][0]["status"] = "REPLACED"
        record = order_records([group], "fixture-account")[0]
        self.assertEqual(record["state"], "UNKNOWN")  # not a documented retail status
        self.assertEqual(record["provider"]["status"], "REPLACED")
        self.assertEqual(record["group"]["replaces_client_order_id"], "fixture-prior")

    def test_multiple_executions_are_not_invented_from_aggregate_fill(self):
        group = self.fixture["data"][0]
        order = group["orders"][0]
        record = order_records([group], "fixture-account")[0]
        self.assertNotIn("executions", record)
        # Forward-compatibility fixture only: retail schema does not document
        # this extension. Keep distinct provider records without inventing trades.
        order["executions"] = [{"execution_id": "fixture-e1", "quantity": "1"},
                               {"execution_id": "fixture-e2", "quantity": "1"}]
        record = order_records([group], "fixture-account")[0]
        self.assertEqual(len(record["provider"]["executions"]), 2)
        self.assertNotIn("executions", record)

    def test_missing_timestamps_legacy_ms_and_invalid_timezone(self):
        group = self.fixture["data"][0]
        order = group["orders"][0]
        del order["place_time_at"]
        del order["filled_time_at"]
        self.assertIsNone(order_records([group], "a")[0]["submitted_at_utc"])
        order["place_time"] = "0"
        self.assertEqual(order_records([group], "a")[0]["submitted_at_utc"], "1970-01-01T00:00:00.000Z")
        with self.assertRaises(RecordError):
            timestamp("2026-11-06T12:00:00")
        with self.assertRaises(RecordError):
            timestamp("bad")

    def test_cash_is_separate_signed_activity_not_derived_from_orders(self):
        row = {"id": "fixture-activity", "account_id": "a", "activity_type": "FEES",
               "activity_sub_type": "fixture", "net_amount": "-0.03", "currency": "USD",
               "trade_date": "2026-11-06", "biz_time": "2026-11-06T14:36:00Z"}
        record = cash_records([row], "a")[0]
        self.assertEqual(record["net_amount"], "-0.03")
        self.assertEqual(record["accounting_date"], "2026-11-06")
        self.assertEqual(record["occurred_at_utc"], "2026-11-06T14:36:00.000Z")
        with self.assertRaises(RecordError):
            cash_records([row], "other")

    def test_sdk_detail_fee_structure_preserved_without_summing(self):
        group = self.fixture["data"][0]
        group["orders"][0].update(commission={"actual_commission": "0.08"},
                                  fees=[{"type": "fixture-fee", "actual_value": "0.03", "receivable_value": "0.04"}])
        record = order_records([group], "a")[0]
        self.assertEqual(record["fees"][0]["actual_value"], "0.03")
        self.assertEqual(record["commission"]["actual_commission"], "0.08")

    def test_verified_scope_does_not_select_other_cash_accounts(self):
        rows = [{"account_id": "a", "account_number": "fixture-number", "account_class": "INDIVIDUAL_CASH"}]
        self.assertEqual(w.verified_account(rows, rows, {"account_number": "fixture-number"}), "a")
        with self.assertRaises(w.AuditError):
            w.verified_account([], rows, {"account_number": "fixture-number"})

    def test_collect_preserves_failures_and_deduplicates_detail_reads_only(self):
        with patch.object(self.reader, "balances", return_value={}), patch.object(self.reader, "positions", return_value=[]), \
             patch.object(self.reader, "working_orders", return_value=copy.deepcopy(self.fixture)), \
             patch.object(self.reader, "historical_orders", return_value=copy.deepcopy(self.fixture)), \
             patch.object(self.reader, "cash_activities", side_effect=w.AuditError("Sandbox HTTP 403; stopped.")), \
             patch.object(self.reader, "order_detail", return_value=self.fixture["data"][0]) as detail:
            result = w.collect_activity(self.reader, "a", START, END)
        self.assertEqual(detail.call_count, 2)  # unique parent and child IDs, not four
        self.assertEqual(result["operations"]["cash"]["status"], "FAILED")
        self.assertEqual(result["operations"]["history"]["status"], "OBSERVED")

    def test_detail_failure_and_detail_bound_are_explicit(self):
        def collect():
            with patch.object(self.reader, "balances", return_value={}), patch.object(self.reader, "positions", return_value=[]), \
                 patch.object(self.reader, "working_orders", return_value=copy.deepcopy(self.fixture)), \
                 patch.object(self.reader, "historical_orders", return_value={"data": []}), \
                 patch.object(self.reader, "cash_activities", return_value={"data": []}):
                return w.collect_activity(self.reader, "a", START, END)
        with patch.object(self.reader, "order_detail", side_effect=w.AuditError("Sandbox HTTP 429; stopped.")):
            self.assertTrue(collect()["details_status"].startswith("INCOMPLETE"))
        with patch.object(w, "MAX_DETAILS", 1), patch.object(self.reader, "order_detail") as detail:
            self.assertTrue(collect()["details_status"].startswith("INCOMPLETE"))
            detail.assert_not_called()

    def test_empty_lists_do_not_trigger_fabricated_detail_request(self):
        with patch.object(self.reader, "balances", return_value={}), patch.object(self.reader, "positions", return_value=[]), \
             patch.object(self.reader, "working_orders", return_value={"data": []}), \
             patch.object(self.reader, "historical_orders", return_value={"data": []}), \
             patch.object(self.reader, "cash_activities", return_value={"data": []}), \
             patch.object(self.reader, "order_detail") as detail:
            result = w.collect_activity(self.reader, "a", START, END)
        detail.assert_not_called()
        self.assertTrue(result["details_status"].startswith("NOT EXERCISED"))


if __name__ == "__main__":
    unittest.main()
