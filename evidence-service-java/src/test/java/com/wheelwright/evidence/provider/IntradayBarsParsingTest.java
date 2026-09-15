package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.*;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for intraday bar extraction (close + time) used by the high-resolution
 * moneyness sparkline. Pure parsing — no HTTP.
 */
class IntradayBarsParsingTest {

    private TradierAdapter adapter;
    private RequestPacer pacer;

    @BeforeEach
    void setUp() {
        pacer = new RequestPacer(1000, 50);
        adapter = new TradierAdapter("test-key", "https://api.tradier.com/v1", new ResponseCache(), pacer);
    }

    @AfterEach
    void tearDown() {
        pacer.shutdown();
    }

    @Test
    void extractsCloseAndTimePerBarInOrder() {
        String body = "{\"series\":{\"data\":["
            + "{\"time\":\"2026-09-15T09:30:00\",\"price\":85.295,\"open\":85.51,\"high\":85.56,\"low\":85.03,\"close\":85.095,\"volume\":73451},"
            + "{\"time\":\"2026-09-15T09:35:00\",\"price\":85.20,\"open\":85.10,\"high\":85.30,\"low\":85.05,\"close\":85.25,\"volume\":50000}"
            + "]}}";
        List<TradierAdapter.IntradayBar> bars = adapter.extractBars(body);
        assertEquals(2, bars.size());
        assertEquals(85.095, bars.get(0).close());
        assertEquals("2026-09-15T09:30:00", bars.get(0).time());
        assertEquals(85.25, bars.get(1).close());
        assertEquals("2026-09-15T09:35:00", bars.get(1).time());
    }

    @Test
    void emptyOrNullSeriesYieldsNoBars() {
        assertTrue(adapter.extractBars("{\"series\":null}").isEmpty());
        assertTrue(adapter.extractBars("{}").isEmpty());
        assertTrue(adapter.extractBars(null).isEmpty());
    }

    @Test
    void skipsBarsMissingCloseOrTime() {
        // A malformed bar (no close) is skipped, not fabricated; the valid one remains.
        String body = "{\"series\":{\"data\":["
            + "{\"time\":\"2026-09-15T09:30:00\",\"open\":85.5},"
            + "{\"time\":\"2026-09-15T09:35:00\",\"close\":85.25}"
            + "]}}";
        List<TradierAdapter.IntradayBar> bars = adapter.extractBars(body);
        assertEquals(1, bars.size());
        assertEquals(85.25, bars.get(0).close());
    }
}
