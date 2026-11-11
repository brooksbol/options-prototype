"""Regressions specific to combined orders, shared coverage and exact identities."""
from collections import Counter
from copy import deepcopy
from decimal import Decimal as D
import unittest

from experiment import (
    Blocked, COHORT, Contract, buy_write, calls, client_id, contract_identity, funding, inventory,
    lifecycle, reconcile, roll_order, select_entry, select_roll, verify_option_quote,
)

OLD = Contract("PG", "2026-11-13", D("180"), "PG261113C00180000")
NEW = Contract("PG", "2026-11-20", D("180"), "PG261120C00180000")


def position_leg(contract, kind="CALL"):
    return dict(symbol=contract.symbol, option_type=kind, option_expire_date=contract.expiry,
                option_exercise_price=str(contract.strike), option_contract_multiplier="100",
                option_contract_deliverable="100", instrument_type="OPTION")


def balance(cash="100000", stock="100000", option="100000"):
    return dict(account_currency_assets=[dict(currency="USD", cash_balance=cash,
                                             overnight_buying_power=stock, option_buying_power=option)])


def listed(contract):
    return dict(symbol=contract.occ, underlying=contract.symbol, root_symbol=contract.symbol,
                expiration_date=contract.expiry, option_type="call", contract_size=100,
                strike=str(contract.strike), type="option")


class SelectorTests(unittest.TestCase):
    def test_exact_retained_cohort(self):
        self.assertEqual(len(COHORT), 28)
        self.assertEqual(len(set(COHORT)), 28)
        self.assertNotIn("KVUE", COHORT)

    def test_nearest_delta_can_be_itm_and_tie_prefers_higher_strike(self):
        high = Contract("PG", OLD.expiry, D("185"), "PG261113C00185000")
        sample = dict(expiration=OLD.expiry, greeks=[
            dict(symbol=OLD.occ, delta=".51", updatedAt=1000000),
            dict(symbol=high.occ, delta=".49", updatedAt=1000000)])
        self.assertEqual(select_entry([OLD, high], sample, 1001), (high, D(".49")))
        sample["greeks"][0]["delta"] = ".501"
        self.assertEqual(select_entry([OLD, high], sample, 1001)[0], OLD)

    def test_missing_or_stale_greek_blocks_selection(self):
        for greeks in ([], [dict(symbol=OLD.occ, delta=".5", updatedAt=1000)]):
            with self.assertRaises(Blocked):
                select_entry([OLD], dict(expiration=OLD.expiry, greeks=greeks), 1000)

    def test_duplicate_greeks_block(self):
        row = dict(symbol=OLD.occ, delta=".5", updatedAt=1000000)
        with self.assertRaises(Blocked):
            select_entry([OLD], dict(expiration=OLD.expiry, greeks=[row, row]), 1000)

    def test_original_strike_requires_exact_next_chain_match(self):
        self.assertEqual(select_roll(OLD, [NEW]), NEW)
        with self.assertRaises(Blocked):
            select_roll(OLD, [])
        with self.assertRaises(Blocked):
            select_roll(OLD, [NEW, NEW])

    def test_exact_occ_and_quote_geometry(self):
        doc = dict(options=dict(option=[listed(OLD)]))
        self.assertEqual(calls(doc, "PG", OLD.expiry), [OLD])
        row = listed(OLD)
        verify_option_quote(OLD, row)
        row["strike"] = "181"
        with self.assertRaises(Blocked):
            verify_option_quote(OLD, row)

    def test_duplicate_chain_contracts(self):
        with self.assertRaises(Blocked):
            calls(dict(options=dict(option=[listed(OLD)] * 2)), "PG", OLD.expiry)


class PriceTests(unittest.TestCase):
    def test_buywrite_uses_stock_ask_less_call_bid(self):
        order = buy_write(OLD, {"ask": "181.23"}, {"bid": "2.11"})
        self.assertEqual(order["limit_price"], "179.12")
        self.assertEqual(order["option_strategy"], "COVERED_STOCK")
        self.assertEqual([(leg["side"], leg["quantity"]) for leg in order["legs"]], [("BUY", "100"), ("SELL", "1")])

    def test_zero_bid_never_uses_ask(self):
        with self.assertRaises(Blocked):
            buy_write(OLD, {"ask": "181"}, {"bid": "0", "ask": "1"})

    def test_roll_credit_and_uncapped_debit(self):
        credit = roll_order(OLD, NEW, {"ask": "2.30"}, {"bid": "2.50"})
        debit = roll_order(OLD, NEW, {"ask": "102.30"}, {"bid": "2.50"})
        self.assertEqual((credit["side"], credit["limit_price"]), ("SELL", "0.20"))
        self.assertEqual((debit["side"], debit["limit_price"]), ("BUY", "99.80"))

    def test_approved_zero_net_fallback_is_one_dollar_per_contract(self):
        order = roll_order(OLD, NEW, {"ask": "2"}, {"bid": "2"})
        self.assertEqual((order["side"], order["limit_price"]), ("BUY", "0.01"))

    def test_precision_and_cross_underlying_refused(self):
        with self.assertRaises(Blocked):
            buy_write(OLD, {"ask": "181.001"}, {"bid": "1"})
        with self.assertRaises(Blocked):
            roll_order(OLD, Contract("KO", NEW.expiry, NEW.strike, "x"), {"ask": "1"}, {"bid": "2"})

    def test_client_id_is_stable_unique_by_phase_and_underlying(self):
        self.assertEqual(client_id("entry", "PG"), client_id("entry", "PG"))
        self.assertNotEqual(client_id("entry", "PG"), client_id("roll", "PG"))
        self.assertEqual(len({client_id("entry", symbol) for symbol in COHORT}), 28)
        self.assertLessEqual(len(client_id("entry", "PG")), 32)


class InventoryTests(unittest.TestCase):
    def test_two_covered_stock_units_are_two_lots_and_two_calls(self):
        grouped = dict(symbol="PG", quantity="2", instrument_type="OPTION", option_strategy="COVERED_STOCK",
                       legs=[dict(symbol="PG", instrument_type="EQUITY"), position_leg(OLD)])
        shares, options = inventory([grouped])
        self.assertEqual(shares["PG"], 200)
        self.assertEqual(options[contract_identity(OLD)], -2)

    def test_existing_puts_and_funding_shortfall(self):
        shares = Counter(PG=D(100))
        options = Counter({contract_identity(OLD): D(-1), ("PG", "PUT", OLD.expiry, D(180)): D(-1)})
        result = funding(balance(cash="30000"), shares, options, [], {"PG": "181"})
        self.assertEqual(result["puts"], 18000)
        self.assertEqual(result["shortfall"], 6100)

    def test_working_orders_and_duplicate_coverage_are_blockers(self):
        for orders, shares in ([{"state": "SUBMITTED"}], Counter(PG=100)), ([], Counter(PG=0)):
            with self.assertRaises(Blocked):
                funding(balance(), shares, Counter({contract_identity(OLD): D(-1)}), orders, {"PG": 180})

    def test_adjusted_deliverable_is_not_stock_coverage(self):
        leg = position_leg(OLD)
        leg["option_contract_deliverable"] = "150"
        with self.assertRaises(Blocked):
            inventory([dict(symbol="PG", quantity="-1", instrument_type="OPTION", option_strategy="SINGLE", legs=[leg])])


class ReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.order = buy_write(OLD, {"ask": "181"}, {"bid": "2"})
        self.record = dict(request=self.order, shares_before="100",
                           option_baseline=[dict(self.order["legs"][1], baseline_quantity="0")], order_id="broker")
        self.row = dict(symbol="PG", state="FILLED", order_id="broker",
                        client_order_id=self.order["client_order_id"], side="BUY", quantity="1", filled_quantity="1", average_fill_price=self.order["limit_price"],
                        legs=deepcopy(self.order["legs"]), last_execution_at_utc="2026-11-11T15:01:00Z")

    def test_acceptance_fill_and_positions_are_distinct(self):
        row = dict(self.row, state="SUBMITTED", filled_quantity="0")
        result = reconcile(self.record, [row], Counter(PG=100), Counter())
        self.assertEqual(result["state"], "SUBMITTED")
        result = reconcile(self.record, [self.row], Counter(PG=100), Counter())
        self.assertEqual(result["state"], "FILL_CONFIRMED_POSITION_PENDING")
        result = reconcile(self.record, [self.row], Counter(PG=200), Counter({contract_identity(OLD): -1}))
        self.assertEqual(result["state"], "POSITION_RECONCILED")

    def test_missing_leg_or_wrong_broker_id_remains_unresolved(self):
        row = dict(self.row, legs=[self.row["legs"][0]])
        self.assertEqual(reconcile(self.record, [row], Counter(), Counter())["state"], "FILLED_LEGS_UNVERIFIED")
        row = dict(self.row, order_id="other")
        self.assertEqual(reconcile(self.record, [row], Counter(), Counter())["state"], "UNRESOLVED_IDENTITY")

    def test_partial_fills_keep_reservations(self):
        row = dict(self.row, state="PARTIALLY_FILLED", filled_quantity=".5")
        self.assertEqual(reconcile(self.record, [row], Counter(), Counter())["state"], "PARTIALLY_FILLED")

    def test_delivery_requires_contract_cash_and_inventory(self):
        key = contract_identity(OLD)
        event = dict(activity_id="ea", event_type="OPTION_EA", event_sub_type="OPTION_ASSIGNMENT",
                     provider=dict(symbol=OLD.occ), net_amount="18000")
        result = lifecycle("PG", 200, (Counter(PG=100), Counter()), [event], {key: OLD.occ}, False)
        self.assertEqual(result[OLD.occ], "ASSIGNED_DELIVERED")
        event["provider"]["symbol"] = "PG"
        self.assertEqual(lifecycle("PG", 200, (Counter(PG=100), Counter()), [event],
                                   {key: OLD.occ}, False)[OLD.occ], "UNRESOLVED")

    def test_simultaneous_put_assignment_and_call_delivery_reconcile_separately(self):
        put_key = ("PG", "PUT", OLD.expiry, D(181))
        put_occ = "PG261113P00181000"
        events = [
            dict(activity_id="c", event_type="OPTION_EA", event_sub_type="OPTION_ASSIGNMENT",
                 provider=dict(symbol=OLD.occ), net_amount="18000"),
            dict(activity_id="p", event_type="OPTION_EA", event_sub_type="OPTION_ASSIGNMENT",
                 provider=dict(symbol=put_occ), net_amount="-18100"),
        ]
        result = lifecycle("PG", 200, (Counter(PG=200), Counter()), events,
                           {contract_identity(OLD): OLD.occ, put_key: put_occ}, False)
        self.assertEqual(set(result.values()), {"ASSIGNED_DELIVERED"})

    def test_share_absence_alone_never_proves_assignment(self):
        result = lifecycle("PG", 200, (Counter(PG=100), Counter()), [],
                           {contract_identity(OLD): OLD.occ}, False)
        self.assertEqual(result[OLD.occ], "UNRESOLVED")


if __name__ == "__main__":
    unittest.main()
