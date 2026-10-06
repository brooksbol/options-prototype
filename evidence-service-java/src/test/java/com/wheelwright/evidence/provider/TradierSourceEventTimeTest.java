package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/** BUG-029: real provider parsing only; no HTTP or acquisition. */
class TradierSourceEventTimeTest {
    private TradierAdapter.RawQuoteFacts parse(String fields) {
        var pacer = new RequestPacer(1000, 1);
        try {
            var adapter = new TradierAdapter("test", "https://example.invalid", new ResponseCache(), pacer);
            return adapter.parseQuotesResponse("{\"quotes\":{\"quote\":{\"symbol\":\"SPY\",\"type\":\"etf\",\"last\":1," + fields + "}}}",
                List.of("SPY"), "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z").bySymbol().get("SPY");
        } finally { pacer.shutdown(); }
    }
    @Test void numericProviderDatesCannotCaptureAdjacentKeys() {
        var q = parse("\"trade_date\":1757948508561,\"prevclose\":177.82,\"bid_date\":1757948508000,\"asksize\":5,\"ask_date\":1757948509000,\"root_symbols\":\"SPY\"");
        assertEquals("2025-09-15T15:01:48.561Z", q.tradeDate());
        assertEquals("2025-09-15T15:01:48Z", q.bidDate());
        assertEquals("2025-09-15T15:01:49Z", q.askDate());
    }

    @Test void absentAndNullTimesStayAbsentWithoutBundleFallback() {
        var absent = parse("\"bid\":0,\"ask\":2,\"receivedAt\":\"2026-10-05T14:30:00Z\"");
        var nul = parse("\"trade_date\":null,\"prevclose\":2,\"bid_date\":null,\"asksize\":1,\"ask_date\":null,\"root_symbols\":\"SPY\"");
        for (var q : List.of(absent, nul)) {
            assertNull(q.tradeDate()); assertNull(q.bidDate()); assertNull(q.askDate());
        }
        assertEquals(0.0, absent.bid()); assertEquals(2.0, absent.ask());
    }

    @Test void stringTimesNormalizeIndependentlyAndZeroEpochIsNotAbsence() {
        var q = parse("\"trade_date\":\"2026-10-05T10:30:00.123456789-04:00\",\"bid_date\":\"2026-10-05T14:29:59Z\",\"ask_date\":0");
        assertEquals("2026-10-05T14:30:00.123456789Z", q.tradeDate());
        assertEquals("2026-10-05T14:29:59Z", q.bidDate());
        assertEquals("1970-01-01T00:00:00Z", q.askDate());
    }

    @Test void malformedPresentTimesFailRatherThanBecomingEvidence() {
        for (String key : List.of("trade_date", "bid_date", "ask_date")) {
            for (String value : List.of("true", "{}", "[]", "{\"time\":\"2026-10-05T14:30:00Z\"}",
                    "1.5", "9223372036854775808", "253402300800000", "\"prevclose\"", "\"asksize\"",
                    "\"root_symbols\"", "\"\"", "\"1757948508561\"", "\"2026-02-30T14:30:00Z\"",
                    "\"2026-10-05T14:30:00\"", "\"2026-10-05T14:30:60Z\"")) {
                assertThrows(IllegalArgumentException.class,
                    () -> parse("\"" + key + "\":" + value + ",\"prevclose\":1,\"asksize\":2,\"root_symbols\":\"SPY\""), key + "=" + value);
            }
        }
    }

    @Test void orderingNestedNamesakesAndEscapedBracesCannotChangeFacts() {
        String fields = "\"description\":\"escaped \\\"quote\\\" and } {\",\"metadata\":{\"bid_date\":0,\"bid\":999},"
            + "\"ask_date\":1757948509000,\"root_symbols\":\"SPY\",\"bid_date\":1757948508000,"
            + "\"trade_date\":1757948508561,\"prevclose\":0,\"bid\":0,\"ask\":2,\"bidsize\":0,\"asksize\":5,"
            + "\"close\":3,\"open\":4,\"high\":5,\"low\":0,\"volume\":0,\"change\":-1,\"change_percentage\":-2,"
            + "\"average_volume\":10,\"week_52_high\":6,\"week_52_low\":0,\"exch\":\"Q\",\"bidexch\":\"B\",\"askexch\":\"A\",\"last_volume\":0";
        var q = parse(fields);
        assertEquals("2025-09-15T15:01:48.561Z", q.tradeDate());
        assertEquals("2025-09-15T15:01:48Z", q.bidDate()); assertEquals("2025-09-15T15:01:49Z", q.askDate());
        assertEquals("escaped \"quote\" and } {", q.description());
        assertEquals(1.0, q.last()); assertEquals(0L, q.lastSize());
        assertEquals(0.0, q.bid()); assertEquals(0L, q.bidSize()); assertEquals("B", q.bidExchange());
        assertEquals(2.0, q.ask()); assertEquals(5L, q.askSize()); assertEquals("A", q.askExchange());
        assertEquals(3.0, q.close()); assertEquals(0.0, q.prevClose()); assertEquals(4.0, q.open());
        assertEquals(5.0, q.high()); assertEquals(0.0, q.low()); assertEquals(0L, q.volume());
        assertEquals(-1.0, q.change()); assertEquals(-2.0, q.changePercentage());
        assertEquals(10L, q.averageVolume()); assertEquals(6.0, q.week52High()); assertEquals(0.0, q.week52Low());
        assertEquals("Q", q.exchange()); assertEquals("etf", q.securityTypeRaw());
    }

    @Test void nestedEventTimeDoesNotFillMissingFactTime() {
        var q = parse("\"metadata\":{\"trade_date\":0,\"bid_date\":0,\"ask_date\":0},\"description\":\"trade_date\"");
        assertNull(q.tradeDate()); assertNull(q.bidDate()); assertNull(q.askDate());
    }

    @Test void malformedJsonAndDuplicateDatesFailClosed() {
        assertThrows(IllegalArgumentException.class, () -> parse("\"trade_date\":1e"));
        assertThrows(IllegalArgumentException.class, () -> parse("\"bid_date\":0,\"bid_date\":1"));
    }

    @Test void sharedStringHelperNeverSkipsIntoNeighborsOrNestedMembers() throws Exception {
        var pacer = new RequestPacer(1000, 1);
        try {
            var adapter = new TradierAdapter("test", "https://example.invalid", new ResponseCache(), pacer);
            var method = TradierAdapter.class.getDeclaredMethod("extractQuotedString", String.class, String.class);
            method.setAccessible(true);
            // Every shared caller's string field: no accidental identity, type, venue or time.
            for (String key : List.of("symbol", "type", "description", "exch", "bidexch", "askexch",
                    "unmatched_symbols", "option_type", "time", "updated_at")) {
                for (String value : List.of("null", "0", "true", "{}", "[]")) {
                    assertNull(method.invoke(adapter, "{\"" + key + "\":" + value + ",\"neighbor\":\"wrong\"}", key));
                }
                assertNull(method.invoke(adapter, "{\"nested\":{\"" + key + "\":\"wrong\"},\"neighbor\":\"" + key + "\"}", key));
                assertEquals("right \"value\"", method.invoke(adapter,
                    "{\"neighbor\":\"" + key + "\",\"" + key + "\":\"right \\\"value\\\"\"}", key));
            }
        } finally { pacer.shutdown(); }
    }

    @Test void batchArrayReconcilesBySymbolAndNullUnmatchedCannotLeak() {
        var pacer = new RequestPacer(1000, 1);
        try {
            var adapter = new TradierAdapter("test", "https://example.invalid", new ResponseCache(), pacer);
            var result = adapter.parseQuotesResponse("{\"quotes\":{\"unmatched_symbols\":null,\"quote\":["
                + "{\"symbol\":\"QQQ\",\"trade_date\":0},{\"description\":\"} {\",\"symbol\":\"SPY\",\"trade_date\":1}]}}",
                List.of("SPY", "QQQ"), null, null);
            assertEquals("1970-01-01T00:00:00Z", result.bySymbol().get("QQQ").tradeDate());
            assertEquals("1970-01-01T00:00:00.001Z", result.bySymbol().get("SPY").tradeDate());
            assertTrue(result.unmatched().isEmpty());
        } finally { pacer.shutdown(); }
    }
}
