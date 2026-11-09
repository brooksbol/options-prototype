"""Offline only. The final HTTP adapter and Keychain access are mocked."""
import io
import json
import logging
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import requests
import webull_identity as w

KEY = "synthetic-app-key"
SECRET = "synthetic-app-secret"


def reply(document, status=200):
    response = requests.Response()
    response.status_code = status
    response.raw = io.BytesIO(json.dumps(document).encode())
    return response


class IdentityTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name)
        self.reader = w.IdentityReader(KEY, SECRET, self.path)

    def test_three_supported_reads_use_official_sdk_signatures(self):
        responses = [reply([{"account_id": "fixture-account", "account_type": "CASH"}]),
                     reply({"cash": "1000000.00", "unknown_field": None}),
                     reply([{"symbol": "DEMO", "quantity": "100"},
                            {"symbol": "DEMO261120P00100000", "quantity": "-1",
                             "strike": "100", "expiration": "2026-11-20", "right": "PUT", "multiplier": 100}])]
        seen = []
        def send(adapter, request, **kwargs):
            seen.append((request, kwargs))
            return responses[len(seen) - 1]
        with patch("requests.adapters.HTTPAdapter.send", send):
            self.assertEqual(self.reader.accounts()[0]["account_type"], "CASH")
            self.assertIsNone(self.reader.balances("fixture-account")["unknown_field"])
            self.assertEqual(self.reader.positions("fixture-account")[1]["quantity"], "-1")
        for request, options in seen:
            self.assertEqual(request.method, "GET")
            self.assertTrue(request.url.startswith(w.BASE + "/trading/"))
            self.assertIn("x-signature", request.headers)
            self.assertNotIn(SECRET, str(request.headers))
            self.assertTrue(options["verify"])
            self.assertEqual(options["proxies"], {})
        self.assertEqual(len(list(self.path.glob("*.json"))), 6)

    def test_production_and_host_confusion_rejected_before_network(self):
        for base in ["https://api.webull.com", "http://" + w.HOST,
                     w.BASE + ".evil.example", "https://user@" + w.HOST,
                     w.BASE + ":444", "https://broker-api.sandbox.webull.com"]:
            with self.subTest(base=base), patch("requests.adapters.HTTPAdapter.send") as network:
                prepared = requests.Request("GET", base + w.PATHS["accounts"]).prepare()
                with self.assertRaises(w.AuditError):
                    w.SandboxSession().send(prepared)
                network.assert_not_called()

    def test_mutating_methods_and_unlisted_paths_rejected(self):
        for method in ["POST", "PUT", "PATCH", "DELETE", "HEAD"]:
            with self.subTest(method=method), self.assertRaises(w.AuditError):
                w.validate_request(method, w.BASE + w.PATHS["accounts"])
        for path in ["/trading/orders/place", "/trading/orders/cancel", "/auth/tokens/create",
                     "/trading/orders/preview", "/trading/orders/get", "/trading/accounts/list/../list"]:
            with self.subTest(path=path), self.assertRaises(w.AuditError):
                w.validate_request("GET", w.BASE + path)

    def test_query_body_fragment_and_duplicate_parameter_rejected(self):
        for url in [w.BASE + w.PATHS["accounts"] + "?account_id=fixture",
                    w.BASE + w.PATHS["accounts"] + "#fragment",
                    w.BASE + w.PATHS["balances"],
                    w.BASE + w.PATHS["balances"] + "?account_id=a&account_id=b"]:
            with self.subTest(url=url), self.assertRaises(w.AuditError):
                w.validate_request("GET", url)
        with self.assertRaises(w.AuditError):
            w.validate_request("GET", w.BASE + w.PATHS["accounts"], "{}")

    def test_host_header_rejected(self):
        prepared = requests.Request("GET", w.BASE + w.PATHS["accounts"], headers={"Host": "api.webull.com"}).prepare()
        with patch("requests.adapters.HTTPAdapter.send") as network, self.assertRaises(w.AuditError):
            w.SandboxSession().send(prepared)
        network.assert_not_called()

    def test_redirect_not_followed(self):
        response = reply({"message": "redirect"}, 302)
        response.headers["Location"] = "https://api.webull.com/trading/accounts/list"
        response.request = requests.Request("GET", w.BASE + w.PATHS["accounts"]).prepare()
        with patch("requests.adapters.HTTPAdapter.send", return_value=response) as network:
            with self.assertRaisesRegex(w.AuditError, "HTTP 302"):
                self.reader.accounts()
        self.assertEqual(network.call_count, 1)

    def test_failures_and_rate_limits_do_not_retry_or_echo(self):
        for code in [401, 403, 417, 429, 500]:
            reader = w.IdentityReader(KEY, SECRET, self.path)
            reader._sequence = code
            with self.subTest(code=code), patch("requests.adapters.HTTPAdapter.send", return_value=reply({"message": "provider detail"}, code)) as network:
                with self.assertRaises(w.AuditError) as caught:
                    reader.accounts()
                self.assertNotIn("provider detail", str(caught.exception))
                self.assertEqual(network.call_count, 1)

    def test_transport_error_has_no_secret_or_url(self):
        with patch("requests.adapters.HTTPAdapter.send", side_effect=requests.ConnectionError(SECRET)):
            with self.assertRaises(w.AuditError) as caught:
                self.reader.accounts()
        self.assertNotIn(SECRET, str(caught.exception))

    def test_official_signer_debug_material_cannot_reach_logs(self):
        output = io.StringIO()
        handler = logging.StreamHandler(output)
        root = logging.getLogger()
        old_level = root.level
        root.addHandler(handler)
        root.setLevel(logging.DEBUG)
        try:
            with patch("requests.adapters.HTTPAdapter.send", return_value=reply([])):
                self.reader.accounts()
        finally:
            root.removeHandler(handler)
            root.setLevel(old_level)
        self.assertNotIn(KEY, output.getvalue())
        self.assertNotIn(SECRET, output.getvalue())
        self.assertNotIn("signature", output.getvalue())

    def test_secret_echo_and_auth_fields_never_retained(self):
        for value in [{"message": SECRET}, {"nested": {"access_token": "synthetic"}},
                      {"message": "synthetic-app-\u0073ecret"}]:
            with self.subTest(value=value):
                self.assertFalse(w.secret_free(value, (KEY, SECRET)))
        with patch("requests.adapters.HTTPAdapter.send", return_value=reply({"message": SECRET})):
            with self.assertRaises(w.AuditError):
                self.reader.accounts()
        self.assertEqual([p.name for p in self.path.glob("*.json")], ["01-accounts-metadata.json"])

    def test_keychain_values_not_in_errors_and_no_write_command(self):
        calls = []
        def run(command, **kwargs):
            calls.append(command)
            return subprocess.CompletedProcess(command, 0, KEY if len(calls) == 1 else SECRET, "")
        self.assertEqual(w.load_credentials(run), (KEY, SECRET))
        self.assertEqual([c[1] for c in calls], ["find-generic-password"] * 2)
        bad = lambda *a, **k: subprocess.CompletedProcess([], 1, SECRET, SECRET)
        with self.assertRaises(w.AuditError) as caught:
            w.load_credentials(bad)
        self.assertNotIn(SECRET, str(caught.exception))

    def test_account_schema_unknown_and_duplicate_fail_closed(self):
        for value in [{"unrecognized": []}, [{"account_type": "CASH"}],
                      [{"account_id": "a"}, {"account_id": "a"}]]:
            with self.subTest(value=value), self.assertRaises(w.AuditError):
                w.account_rows(value)
        self.assertEqual(w.account_rows([]), [])

    def test_pagination_fails_closed_instead_of_claiming_completeness(self):
        w.require_unpaginated({"data": [], "pagination_key": ""})
        for value in [{"pagination_key": "next"}, {"data": {"next_cursor": "next"}}, {"has_more": True}]:
            with self.subTest(value=value), self.assertRaises(w.AuditError):
                w.require_unpaginated(value)

    def test_metadata_utc_and_raw_bytes_integrity_and_permissions(self):
        with patch("requests.adapters.HTTPAdapter.send", return_value=reply([])):
            self.reader.accounts()
        meta = json.loads((self.path / "01-accounts-metadata.json").read_bytes())
        self.assertEqual(meta["method"], "GET")
        self.assertTrue(meta["started_at"].endswith("+00:00"))
        self.assertLessEqual(meta["started_at"], meta["finished_at"])
        raw = self.path / "01-accounts.json"
        self.assertEqual(meta["body_sha256"], w.hashlib.sha256(raw.read_bytes()).hexdigest())
        self.assertEqual(raw.stat().st_mode & 0o777, 0o600)
        with self.assertRaises(FileExistsError):
            w.retain(raw, b"replacement")

    def test_non_json_and_oversized_response(self):
        for body in [b"<html>unrecognized</html>", b" " * (w.MAX_BYTES + 1)]:
            response = requests.Response()
            response.status_code = 200
            response.raw = io.BytesIO(body)
            reader = w.IdentityReader(KEY, SECRET, self.path)
            reader._sequence = len(body)
            with patch("requests.adapters.HTTPAdapter.send", return_value=response):
                with self.assertRaises(w.AuditError):
                    reader.accounts()

    def test_exact_desktop_number_match_is_distinct_from_api_id(self):
        accounts = [{"account_id": "internal-fixture", "account_number": "desktop-fixture",
                     "account_class": "INDIVIDUAL_CASH"}]
        balances = {"internal-fixture": {"total_asset_currency": "USD", "total_net_liquidation_value": "1000000.00"}}
        self.assertEqual(w.compare_identity(accounts, balances, "desktop-fixture", "1000000"), "SAME ACCOUNT")
        self.assertEqual(w.compare_identity(accounts, balances, "internal-fixture", "1000000"), "DIFFERENT ACCOUNT")
        self.assertEqual(w.compare_identity(accounts, balances, "desktop-fixture", "999999"), "UNRESOLVED")
        self.assertEqual(w.compare_identity(accounts, {}, "desktop-fixture", "1000000"), "UNRESOLVED")
        self.assertEqual(w.compare_identity([], {}, "desktop-fixture", "1000000"), "UNRESOLVED")

    def test_missing_balance_and_contract_facts_remain_unknown(self):
        summary = w.balances_summary({"total_asset_currency": "USD", "total_market_value": "0"})
        self.assertIsNone(summary["cash"])
        self.assertIsNone(summary["net_liquidation_value"])
        self.assertEqual(summary["market_value"], w.Decimal(0))
        row = {"symbol": "unrecognized", "quantity": "-1"}
        self.assertNotIn("multiplier", w.position_rows([row])[0])
        for bad in [None, {}, [None]]:
            with self.assertRaises(w.AuditError):
                w.position_rows(bad)
        with self.assertRaises(w.AuditError):
            w.balances_summary({"total_cash_balance": "NaN"})


if __name__ == "__main__":
    unittest.main()
