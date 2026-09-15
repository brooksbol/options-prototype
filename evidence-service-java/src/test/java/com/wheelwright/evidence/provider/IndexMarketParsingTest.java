package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.*;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the index Markets-glance parsing (PL-ELIG Markets card):
 * timesales intraday price extraction, honest emptiness, and quote-field extraction.
 * Pure parsing — no HTTP.
 */
class IndexMarketParsingTest {

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
    void extractsOrderedIntradayPricesFromTimesales() {
        String body = "{\"series\":{\"data\":["
            + "{\"time\":\"2026-09-15T09:30:00\",\"price\":7608.805,\"open\":7612.3,\"high\":7617.26,\"low\":7600.35,\"close\":7601.41,\"volume\":0},"
            + "{\"time\":\"2026-09-15T09:35:00\",\"price\":7606.63,\"open\":7601.41,\"high\":7611.85,\"low\":7601.41,\"close\":7610.82,\"volume\":0},"
            + "{\"time\":\"2026-09-15T09:40:00\",\"price\":7610.21,\"open\":7611.16,\"high\":7613.26,\"low\":7607.16,\"close\":7612.02,\"volume\":0}"
            + "]}}";
        List<Double> prices = adapter.extractSeriesPrices(body);
        assertEquals(List.of(7608.805, 7606.63, 7610.21), prices);
    }

    @Test
    void emptySeriesYieldsNoPoints_notFabrication() {
        // Off-hours / no data — Tradier returns null series. Must be empty, never invented.
        assertTrue(adapter.extractSeriesPrices("{\"series\":null}").isEmpty());
        assertTrue(adapter.extractSeriesPrices("{}").isEmpty());
        assertTrue(adapter.extractSeriesPrices(null).isEmpty());
    }

    @Test
    void handlesNegativeAndDecimalPrices() {
        // Robustness: the parser reads signed/decimal numerics after each "price" key.
        String body = "{\"series\":{\"data\":[{\"price\":-1.5},{\"price\":28936.54}]}}";
        assertEquals(List.of(-1.5, 28936.54), adapter.extractSeriesPrices(body));
    }
}
