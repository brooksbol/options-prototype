package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ResponseCache tests — TTL-based in-memory caching.
 * Behavioral parity with TypeScript response-cache.test.ts.
 */
class ResponseCacheTest {

    private ResponseCache cache;

    @BeforeEach
    void setUp() {
        cache = new ResponseCache();
    }

    @Test
    void returnsNullForMissingKeys() {
        assertNull(cache.get(ResponseCache.CacheType.EXPIRATIONS, "XLE"));
    }

    @Test
    void storesAndRetrievesWithinTtl() {
        cache.set(ResponseCache.CacheType.EXPIRATIONS, "XLE", "test-data", "2026-07-15T10:00:00Z");
        var result = cache.get(ResponseCache.CacheType.EXPIRATIONS, "XLE");
        assertNotNull(result);
        assertEquals("test-data", result.data());
        assertEquals("2026-07-15T10:00:00Z", result.retrievedAt());
    }

    @Test
    void differentKeysAreIndependent() {
        cache.set(ResponseCache.CacheType.EXPIRATIONS, "XLE", "xle-data", "now");
        cache.set(ResponseCache.CacheType.EXPIRATIONS, "SPY", "spy-data", "now");

        assertEquals("xle-data", cache.get(ResponseCache.CacheType.EXPIRATIONS, "XLE").data());
        assertEquals("spy-data", cache.get(ResponseCache.CacheType.EXPIRATIONS, "SPY").data());
    }

    @Test
    void differentTypesAreIndependent() {
        cache.set(ResponseCache.CacheType.EXPIRATIONS, "XLE", "exp-data", "now");
        cache.set(ResponseCache.CacheType.QUOTE, "XLE", "quote-data", "now");

        assertEquals("exp-data", cache.get(ResponseCache.CacheType.EXPIRATIONS, "XLE").data());
        assertEquals("quote-data", cache.get(ResponseCache.CacheType.QUOTE, "XLE").data());
    }

    @Test
    void reportsStatsCorrectly() {
        cache.set(ResponseCache.CacheType.EXPIRATIONS, "A", "a", "now");
        cache.set(ResponseCache.CacheType.EXPIRATIONS, "B", "b", "now");
        cache.set(ResponseCache.CacheType.QUOTE, "A", "qa", "now");
        cache.set(ResponseCache.CacheType.CHAIN, "A:2026-08-21", "ca", "now");

        ResponseCache.CacheStats stats = cache.stats();
        assertEquals(4, stats.size());
        assertEquals(2, stats.expirations());
        assertEquals(1, stats.quote());
        assertEquals(1, stats.chain());
    }
}
