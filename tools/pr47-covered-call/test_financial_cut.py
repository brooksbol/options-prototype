"""Financial evidence inconsistencies found by the independent review."""
from copy import deepcopy
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

import runner
from experiment import Blocked, funding
from test_experiment import balance


class CutReader:
    def __init__(self, opening, closing):
        self.cuts = [opening, closing]
        self.lock = threading.Lock()

    def balances(self, account):
        with self.lock:
            return deepcopy(self.cuts.pop(0))

    def positions(self, account):
        return [dict(symbol="PG", instrument_type="EQUITY", quantity="100", market_value="100")]

    def working_orders(self, account):
        return dict(data=[], complete_for_query=True)


class FinancialCutTests(unittest.TestCase):
    def observed(self, opening, closing):
        with tempfile.TemporaryDirectory() as path:
            broker = runner.Broker.__new__(runner.Broker)
            broker.account = "synthetic-account"
            broker.path = Path(path)
            broker.measurements = runner.Measurements()
            reader = CutReader(opening, closing)
            broker.new_reader = lambda label: reader
            return broker.snapshot()

    def valid(self):
        result = balance(cash="100", stock="1000000", option="1000000")
        result.update(total_market_value="100", total_net_liquidation_value="200")
        return result

    def test_usd_cash_conflict_never_reaches_capacity(self):
        opening = self.valid()
        opening["account_currency_assets"][0]["cash_balance"] = "1000000"
        with self.assertRaises(Blocked):
            self.observed(opening, self.valid())
        with self.assertRaises(Blocked):
            funding(opening, {"PG": 100}, {}, [], {"PG": 180})

    def test_closing_cash_row_is_also_qualified(self):
        closing = self.valid()
        closing["account_currency_assets"][0]["cash_balance"] = "1000000"
        with self.assertRaises(Blocked):
            self.observed(self.valid(), closing)

    def test_incoherent_closing_nav_is_rejected(self):
        closing = self.valid()
        closing["total_net_liquidation_value"] = "999999"
        with self.assertRaises(ValueError):
            self.observed(self.valid(), closing)

    def test_legitimate_changing_marks_preserve_a_coherent_cash_cut(self):
        closing = self.valid()
        closing.update(total_market_value="101", total_net_liquidation_value="201")
        result = self.observed(self.valid(), closing)
        self.assertEqual(result["balance"]["total_cash_balance"], "100")

    def test_coherent_closing_valuation_recovers_asynchronous_opening_marks(self):
        opening = self.valid()
        opening.update(total_market_value="105", total_net_liquidation_value="205")
        result = self.observed(opening, self.valid())
        self.assertEqual(result["valuation_boundary"], "CLOSING")
        self.assertEqual(result["balance"]["total_market_value"], "100")

    def test_two_incoherent_position_value_boundaries_are_rejected(self):
        opening, closing = self.valid(), self.valid()
        opening.update(total_market_value="105", total_net_liquidation_value="205")
        closing.update(total_market_value="106", total_net_liquidation_value="206")
        with self.assertRaises(Blocked):
            self.observed(opening, closing)

    def test_missing_closing_currency_is_rejected(self):
        closing = self.valid()
        closing.pop("total_asset_currency")
        with self.assertRaises(ValueError):
            self.observed(self.valid(), closing)


if __name__ == "__main__":
    unittest.main()
