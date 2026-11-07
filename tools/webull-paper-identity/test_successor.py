"""Bounded rejection regressions. Offline only; no Keychain or broker reads."""
from contextlib import redirect_stdout
from copy import deepcopy
from datetime import timedelta
from io import StringIO
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import experiment
from acquisition_state import inspect
from activity_records import cash_records
from experiment_state import enroll
from test_experiment import ACCOUNT, CONTRACTS, DAY, NOW, SCOPE, snapshot, stock


def with_cash(records):
    s = snapshot()
    s["operations"]["cash"]["result"].update(
        data=records, normalized_activities=cash_records(records, ACCOUNT))
    return s


def cash(amount="100"):
    return {"id": "SYNTHETIC_ACTIVITY", "account_id": ACCOUNT, "net_amount": amount,
            "activity_type": "TRADE", "currency": "USD", "biz_time": "2026-11-07T15:59:00Z"}


class QualificationCorrectionTest(unittest.TestCase):
    def assert_no_enrollment(self, s):
        qualified = inspect(s, NOW)
        self.assertEqual(qualified["status"], "UNRESOLVED")
        data = {"schema": 1, "cohorts": []}
        result = enroll(data, qualified, SCOPE, "DEMO", "regression-event", CONTRACTS, DAY)
        self.assertFalse(result["created"])
        self.assertEqual(data["cohorts"], [])
        return qualified

    def test_identical_cash_duplicates_are_acceptable(self):
        row = cash()
        current = inspect(with_cash([row, deepcopy(row)]), NOW)
        self.assertEqual(current["status"], "OBSERVED")
        self.assertTrue(enroll({"cohorts": []}, current, SCOPE, "DEMO", "event", CONTRACTS, DAY)["created"])

    def test_conflicting_cash_identity_blocks_financial_qualification_and_enrollment(self):
        result = self.assert_no_enrollment(with_cash([cash("100"), cash("200")]))
        self.assertIn("Conflicting cash records", result["reason"])

    def test_conflicting_normalized_amount_cannot_hide_behind_identical_provider_rows(self):
        s = with_cash([cash(), cash()])
        s["operations"]["cash"]["result"]["normalized_activities"][0]["net_amount"] = "200"
        result = self.assert_no_enrollment(s)
        self.assertIn("projection conflicts", result["reason"])

    def test_closing_missing_invalid_currency_or_inconsistent_values_block_enrollment(self):
        for field in ("total_cash_balance", "total_market_value", "total_net_liquidation_value"):
            for defect in ("missing", "nonfinite"):
                s = snapshot(); closing = s["closing"]["balances"]["result"]
                if defect == "missing": closing.pop(field)
                else: closing[field] = "NaN"
                with self.subTest(field=field, defect=defect):
                    self.assertIn("Closing balance", self.assert_no_enrollment(s)["reason"])
        s = snapshot(); s["closing"]["balances"]["result"]["total_net_liquidation_value"] = "1"
        self.assertIn("Closing balance cash + market value", self.assert_no_enrollment(s)["reason"])
        s = snapshot(); s["closing"]["balances"]["result"].pop("total_asset_currency")
        self.assertIn("Closing balance currency", self.assert_no_enrollment(s)["reason"])

    def test_consistent_market_movement_does_not_require_equal_opening_and_closing_nlv(self):
        other = stock(100); other["symbol"] = "OTHER"
        s = snapshot([other])
        s["closing"]["positions"]["result"] = deepcopy(s["closing"]["positions"]["result"])
        s["closing"]["positions"]["result"][0]["market_value"] = "10010"
        closing = s["closing"]["balances"]["result"]
        closing.update(total_market_value="10010", total_net_liquidation_value="1010010")
        current = inspect(s, NOW)
        self.assertEqual(current["status"], "OBSERVED")
        self.assertTrue(enroll({"cohorts": []}, current, SCOPE, "DEMO", "event", CONTRACTS, DAY)["created"])

    def test_closing_uses_existing_one_cent_rounding_convention(self):
        s = snapshot(); s["closing"]["balances"]["result"]["total_net_liquidation_value"] = "1000000.01"
        self.assertEqual(inspect(s, NOW)["status"], "OBSERVED")
        s["closing"]["balances"]["result"]["total_net_liquidation_value"] = "1000000.02"
        self.assert_no_enrollment(s)


class PublicationCorrectionTest(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        self.base = Path(temp.name); self.root = self.base / "evidence"
        anchor = self.base / "anchor"; anchor.mkdir()
        (anchor / "01-accounts.json").write_text("[]")
        (anchor / "desktop-observation.json").write_text("{}")
        self.contracts = self.base / "contracts.json"
        self.contracts.write_text(json.dumps(CONTRACTS))
        for target, kwargs in (
            ("experiment.ROOT", {"new": self.root}),
            ("experiment.VERIFIED_RUN", {"new": anchor}),
            ("experiment.load_credentials", {"return_value": ("synthetic-key", "synthetic-secret")}),
            ("experiment.IdentityReader", {}),
            ("experiment.verified_account", {"return_value": ACCOUNT}),
            ("experiment.collect_current", {"side_effect": lambda *a, **k: snapshot()}),
            ("experiment.inspect", {"side_effect": lambda s: inspect(s, NOW)}),
            ("requests.sessions.Session.send", {"side_effect": AssertionError("Offline regression attempted HTTP")}),
        ):
            mock = patch(target, **kwargs); mock.start(); self.addCleanup(mock.stop)
        self.calls = 0

    def invoke(self):
        at = NOW + timedelta(seconds=10 * self.calls); self.calls += 1
        output = StringIO()
        with patch("experiment.datetime") as clock, redirect_stdout(output):
            clock.now.return_value = at
            code = experiment.main(["DEMO", "--event-id", "same-event", "--contracts", str(self.contracts)])
        return code, output.getvalue()

    def identities(self):
        return json.loads((self.root / "aristocrats-experiment" / "experiment.json").read_text())

    def test_replace_commit_failure_cannot_publish_successful_preview(self):
        with patch("experiment_state.os.replace", side_effect=OSError("synthetic commit failure")):
            code, output = self.invoke()
        self.assertEqual(code, 1)
        self.assertFalse(list(self.root.glob("*/experiment-result.json")))
        self.assertFalse((self.root / "aristocrats-experiment" / "experiment.json").exists())
        self.assertNotIn("durable identity retained", output)
        self.assertNotIn("— ELIGIBLE_FOR_PLANNING", output)

    def test_directory_sync_failure_also_prevents_successful_preview(self):
        # After replace but before durability confirmation: do not falsely
        # promise rollback, and do not publish successful enrollment.
        with patch("experiment_state.os.fsync", side_effect=[None, OSError("synthetic directory sync failure")]):
            code, output = self.invoke()
        self.assertEqual(code, 1)
        self.assertFalse(list(self.root.glob("*/experiment-result.json")))
        self.assertNotIn("durable identity retained", output)

    def test_preview_failure_preserves_commit_and_same_event_recovers_original_identities(self):
        retain = experiment.retain
        def fail_preview(path, content):
            if path.name == "experiment-result.json":
                self.assertEqual(len(self.identities()["cohorts"]), 1)  # Already committed.
                raise OSError("synthetic publication failure")
            return retain(path, content)
        with patch("experiment.retain", side_effect=fail_preview):
            code, output = self.invoke()
        self.assertEqual(code, 1)
        self.assertIn("Preview publication failed after the identity transaction completed", output)
        self.assertNotIn("durable identity retained", output)
        self.assertFalse(list(self.root.glob("*/experiment-result.json")))
        committed = self.identities()
        code, output = self.invoke()
        self.assertEqual(code, 0)
        self.assertEqual(self.identities(), committed)
        self.assertEqual(len(self.identities()["cohorts"]), 1)
        self.assertIn("durable identity retained", output)
        self.assertEqual(len(list(self.root.glob("*/experiment-result.json"))), 1)


if __name__ == "__main__": unittest.main()
