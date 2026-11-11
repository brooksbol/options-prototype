"""PR47's retained real-time snapshot and last-change clock distinction."""
from copy import deepcopy
from datetime import datetime, timezone
import unittest

from runner import qualify

AT = datetime(2026, 11, 11, 16, 0, tzinfo=timezone.utc)


class QuotePolicyTests(unittest.TestCase):
    def setUp(self):
        self.meta = dict(completed_utc=AT.isoformat(), environment="production", method="GET", status=200)
        self.clock = dict(clock=dict(state="open", date="2026-11-11", timestamp=AT.timestamp(), next_change="16:00"))
        self.book = dict(symbol="PG", bid="1.00", ask="1.10", bidsize=1, asksize=1,
                         bid_date=int((AT.timestamp()-120)*1000), ask_date=int((AT.timestamp()-1)*1000))

    def test_quiet_same_session_sides_keep_source_ages_disclosed(self):
        result = qualify([self.book], self.meta, self.clock, AT)
        self.assertEqual(result["status"], "QUALIFIED")
        self.assertEqual(result["observations"][0]["sides"]["bid"]["age_seconds"], 120)

    def test_old_response_remains_blocked(self):
        self.meta["completed_utc"] = datetime.fromtimestamp(AT.timestamp()-6, timezone.utc).isoformat()
        self.assertEqual(qualify([self.book], self.meta, self.clock, AT)["status"], "UNQUALIFIED")

    def test_future_and_prior_session_source_clocks_stay_blocked(self):
        for epoch in (AT.timestamp()+1, AT.timestamp()-86400, AT.replace(hour=14,minute=29).timestamp()):
            row = dict(self.book, bid_date=int(epoch*1000))
            self.assertEqual(qualify([row], self.meta, self.clock, AT)["status"], "UNQUALIFIED")

    def test_missing_clock_crossed_prices_zero_bid_and_size_stay_blocked(self):
        for changes in (dict(bid_date=None),dict(bid="2"),dict(bid="0"),dict(asksize=0)):
            self.assertEqual(qualify([dict(self.book,**changes)],self.meta,self.clock,AT)["status"],"UNQUALIFIED")

    def test_wrong_environment_and_closed_clock_stay_blocked(self):
        meta = dict(self.meta, environment="sandbox")
        self.assertEqual(qualify([self.book],meta,self.clock,AT)["status"],"UNQUALIFIED")
        clock = deepcopy(self.clock)
        clock["clock"]["state"] = "closed"
        self.assertEqual(qualify([self.book],self.meta,clock,AT)["status"],"UNQUALIFIED")

    def test_empty_books_never_qualify(self):
        self.assertEqual(qualify([],self.meta,self.clock,AT)["status"],"UNQUALIFIED")


if __name__ == "__main__":
    unittest.main()
