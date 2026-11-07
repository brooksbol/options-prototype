"""Synthetic lifecycle specimens only; none is an authenticated assignment."""
import copy
from decimal import Decimal
import unittest

from activity_records import order_records, cash_records, RecordError
from reconcile_lifecycle import audit, timelines, unique_cash


ACCOUNT = "synthetic-account"


def cash(identifier, kind, subtype, amount, symbol="DEMO-PUT", time="2026-11-06T19:27:59.000Z"):
    return cash_records([{"id": identifier, "account_id": ACCOUNT, "activity_type": kind,
                          "activity_sub_type": subtype, "net_amount": amount, "symbol": symbol,
                          "currency": "USD", "biz_time": time, "trade_date": "2026-11-06"}], ACCOUNT)[0]


def specimen(outcome="open", event=True):
    group = {"combo_type": "NORMAL", "orders": [{
        "order_id": "synthetic-order", "client_order_id": "synthetic-client", "symbol": "DEMO",
        "side": "SELL", "status": "FILLED", "total_quantity": "1", "filled_quantity": "1",
        "filled_price": "1.58", "limit_price": "1.50", "place_time_at": "2026-11-06T19:04:47Z",
        "filled_time_at": "2026-11-06T19:27:59Z", "legs": [{"symbol": "DEMO", "option_type": "PUT",
        "option_expire_date": "2026-11-06", "strike_price": "560", "option_contract_multiplier": "100",
        "option_contract_deliverable": "100"}]}]}
    orders = order_records([group], ACCOUNT)
    rows = [cash("synthetic-deposit", "DEPOSIT", "WIRE", "1000000", symbol="DEMO"),
            cash("synthetic-control", "TRADE", "BUY", "-55960", symbol="DEMO", time="2026-11-06T18:58:22Z"),
            cash("synthetic-credit", "TRADE", "SELL", "157.93")]
    shares = "200" if outcome == "assigned" else "100"
    positions = [{"symbol": "DEMO", "instrument_type": "EQUITY", "quantity": shares,
                  "last_price": "560", "market_value": str(Decimal(shares) * 560)}]
    if outcome == "open":
        positions.append({"symbol": "DEMO", "instrument_type": "OPTION", "quantity": "-1",
                          "market_value": "-158", "legs": [{"symbol": "DEMO", "option_type": "PUT",
                          "option_expire_date": "2026-11-06", "option_exercise_price": "560",
                          "option_contract_multiplier": "100", "option_contract_deliverable": "100"}]})
    elif outcome == "assigned" and event:
        rows.append(cash("synthetic-assignment", "OPTION_EA", "OPTION_ASSIGNMENT", "-56000"))
    elif outcome == "expired" and event:
        rows.append(cash("synthetic-expiry", "OPTION_EA", "OPTION_EXPIRATION", "0"))
    total_cash = sum(Decimal(row["net_amount"]) for row in rows)
    mv = sum(Decimal(p["market_value"]) for p in positions)
    return {"account_id": ACCOUNT, "finished_at": "2026-11-07T03:00:00Z", "operations": {
        "history": {"status": "OBSERVED", "result": {"normalized_orders": orders, "complete_for_query": True}},
        "cash": {"status": "OBSERVED", "result": {"normalized_activities": rows, "complete_for_query": True}},
        "positions": {"status": "OBSERVED", "result": positions},
        "balances": {"status": "OBSERVED", "result": {"total_cash_balance": str(total_cash),
                     "total_market_value": str(mv), "total_net_liquidation_value": str(total_cash + mv)}}}}


def run(before, after):
    return audit(before, after, "DEMO", "2026-11-06", "560", "100")


class LifecycleTest(unittest.TestCase):
    def test_same_order_limit_change_does_not_add_a_trade(self):
        before, after = specimen(), specimen()
        a = before["operations"]["history"]["result"]["normalized_orders"][0]
        a.update(limit_price="1.89", state="SUBMITTED", filled_quantity="0", average_fill_price=None)
        tracks = timelines([before, after])
        self.assertEqual(len(tracks), 1)
        self.assertEqual([s["limit_price"] for s in tracks[0]["observations"]], ["1.89", "1.50"])
        self.assertEqual(tracks[0]["latest_filled_quantity"], "1")

    def test_partial_and_multiple_execution_observations_are_cumulative(self):
        before, after = specimen(), specimen()
        row = before["operations"]["history"]["result"]["normalized_orders"][0]
        row.update(state="PARTIALLY_FILLED", filled_quantity="1")
        final = after["operations"]["history"]["result"]["normalized_orders"][0]
        final.update(filled_quantity="2", quantity="2")
        final["provider"]["executions"] = [{"execution_id": "synthetic-e1"}, {"execution_id": "synthetic-e2"}]
        tracks = timelines([before, after, copy.deepcopy(after)])
        self.assertEqual(tracks[0]["latest_filled_quantity"], "2")
        self.assertEqual(len(tracks[0]["observations"]), 2)
        with self.assertRaises(RecordError):
            timelines([after, before])

    def test_canceled_and_new_id_not_merged_by_contract(self):
        before, after = specimen(), specimen()
        row = before["operations"]["history"]["result"]["normalized_orders"][0]
        row.update(state="CANCELED", filled_quantity="0")
        final = after["operations"]["history"]["result"]["normalized_orders"][0]
        final["identity"] = [ACCOUNT, "order_id", "synthetic-replacement"]
        final["order_id"] = "synthetic-replacement"
        self.assertEqual(len(timelines([before, after])), 2)

    def test_assignment_requires_extra_control_block_and_strike_cash(self):
        result = run(specimen(), specimen("assigned"))
        self.assertEqual(result["outcome"], "ASSIGNED")
        self.assertEqual(result["control_shares"], "100")
        self.assertEqual(result["aggregate_shares"], "200")
        self.assertEqual(result["additional_shares"], "100")
        self.assertTrue(result["assignment_strike_debit_observed"])
        self.assertEqual(result["conditional_assignment_outlay_before_unknown_assignment_charges"], "55842.07")

    def test_expiration_without_assignment_requires_native_expiration_event(self):
        self.assertEqual(run(specimen(), specimen("expired"))["outcome"], "EXPIRED_WITHOUT_ASSIGNMENT")
        result = run(specimen(), specimen("expired", event=False))
        self.assertEqual(result["outcome"], "UNRESOLVED")
        self.assertEqual(result["additional_shares"], "0")

    def test_existing_control_alone_cannot_demonstrate_assignment(self):
        after = specimen("assigned")
        after["operations"]["positions"]["result"][0]["quantity"] = "100"
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")

    def test_delayed_cash_or_missing_delivery_remains_unresolved(self):
        after = specimen("assigned", event=False)
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")
        after = specimen("assigned")
        row = after["operations"]["cash"]["result"]["normalized_activities"][-1]
        row["net_amount"] = "-55999"
        row["provider"]["net_amount"] = "-55999"
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")

    def test_still_open_after_expiry_is_not_a_moneyness_verdict(self):
        after = specimen()
        after["operations"]["positions"]["result"][0]["last_price"] = "1"
        result = run(specimen(), after)
        self.assertEqual(result["outcome"], "UNRESOLVED")
        self.assertEqual(result["target_option_quantity"], "-1")
        self.assertTrue(result["valuation_inconsistencies"])

    def test_duplicate_paged_cash_deduplicated_but_conflicts_refused(self):
        before, after = specimen(), specimen("assigned")
        rows = after["operations"]["cash"]["result"]["normalized_activities"]
        rows.append(copy.deepcopy(rows[0]))
        rows[0].pop("account_reference_source", None)  # normalization-version differences aren't cash changes
        self.assertEqual(len(unique_cash([before, after])), 4)
        rows[-1]["provider"]["net_amount"] = "999999"
        with self.assertRaises(RecordError):
            unique_cash([before, after])

    def test_missing_fees_are_not_zero_and_contract_terms_not_guessed(self):
        result = run(specimen(), specimen("assigned"))
        self.assertEqual(result["gross_minus_net"], "0.07")  # observed gross/net difference, not a guessed fee
        after = specimen("assigned")
        order = after["operations"]["history"]["result"]["normalized_orders"][0]
        del order["legs"][0]["option_contract_multiplier"]
        result = run(specimen(), after)
        self.assertEqual(result["outcome"], "UNRESOLVED")
        self.assertIsNone(result["opening_gross_credit"])
        order["legs"] = ["malformed-contract"]
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")

    def test_incomplete_position_terms_do_not_establish_option_absence(self):
        after = specimen("assigned")
        after["operations"]["positions"]["result"].append({"symbol": "DEMO", "instrument_type": "OPTION",
                                                          "quantity": "-1", "market_value": "0"})
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")

    def test_inconsistent_account_cash_blocks_complete_assignment_claim(self):
        after = specimen("assigned")
        after["operations"]["balances"]["result"]["total_cash_balance"] = "999999"
        result = run(specimen(), after)
        self.assertEqual(result["outcome"], "UNRESOLVED")
        self.assertFalse(result["cash_sum_equals_balance"])

    def test_wrong_account_or_incomplete_history_refused(self):
        after = specimen()
        after["account_id"] = "synthetic-other"
        with self.assertRaises(RecordError):
            run(specimen(), after)
        after = specimen()
        after["operations"]["cash"]["result"]["complete_for_query"] = False
        with self.assertRaises(RecordError):
            run(specimen(), after)

    def test_multiple_same_expiry_strikes_do_not_create_event_association(self):
        after = specimen("assigned")
        rows = after["operations"]["history"]["result"]["normalized_orders"]
        other = copy.deepcopy(rows[0])
        other["identity"] = [ACCOUNT, "order_id", "synthetic-other-strike"]
        other["order_id"] = "synthetic-other-strike"
        other["legs"][0]["strike_price"] = "550"
        rows.append(other)
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")

    def test_net_zero_option_rows_do_not_prove_removal(self):
        before, after = specimen(), specimen("assigned")
        option = copy.deepcopy(before["operations"]["positions"]["result"][1])
        after["operations"]["positions"]["result"].append(option)
        offset = copy.deepcopy(option)
        offset.update(quantity="1", market_value="158")
        after["operations"]["positions"]["result"].append(offset)
        result = run(before, after)
        self.assertEqual(result["target_option_quantity"], "0")
        self.assertEqual(result["outcome"], "UNRESOLVED")

    def test_control_quantity_must_be_established_by_prior_snapshot(self):
        before = specimen()
        before["operations"]["positions"]["result"][0]["quantity"] = "0"
        result = run(before, specimen("assigned"))
        self.assertFalse(result["prior_control_quantity_verified"])
        self.assertEqual(result["outcome"], "UNRESOLVED")

    def test_lifecycle_event_without_time_does_not_prove_complete_history(self):
        after = specimen("assigned")
        after["operations"]["cash"]["result"]["normalized_activities"][-1]["occurred_at_utc"] = None
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")

    def test_event_at_observation_millisecond_uses_normalized_utc_boundary(self):
        after = specimen("assigned")
        after["finished_at"] = "2026-11-07T03:00:00.000100+00:00"
        row = after["operations"]["cash"]["result"]["normalized_activities"][-1]
        row["occurred_at_utc"] = "2026-11-07T03:00:00.000Z"
        row["provider"]["biz_time"] = "2026-11-07T03:00:00Z"
        self.assertEqual(run(specimen(), after)["outcome"], "ASSIGNED")

    def test_closing_fill_is_not_mislabeled_unassigned_expiration(self):
        after = specimen("expired")
        rows = after["operations"]["history"]["result"]["normalized_orders"]
        close = copy.deepcopy(rows[0])
        close.update(side="BUY", order_id="synthetic-close", identity=[ACCOUNT, "order_id", "synthetic-close"])
        rows.append(close)
        self.assertEqual(run(specimen(), after)["outcome"], "UNRESOLVED")


if __name__ == "__main__":
    unittest.main()
