package com.wheelwright.evidence.provider;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory response cache with per-type TTLs.
 *
 * Behavioral parity with TypeScript ResponseCache:
 *   - Expirations: 5 minutes
 *   - Quotes: 60 seconds
 *   - Chains: 90 seconds
 *   - Returns null on miss or expiry
 *   - Process-local, resets on restart
 */
public class ResponseCache {

    public enum CacheType {
        EXPIRATIONS(5 * 60 * 1000L),
        QUOTE(60 * 1000L),
        CHAIN(90 * 1000L);

        final long ttlMs;
        CacheType(long ttlMs) { this.ttlMs = ttlMs; }
    }

    public record CacheEntry<T>(T data, String retrievedAt, long expiresAt) {}

    private final ConcurrentHashMap<String, CacheEntry<?>> store = new ConcurrentHashMap<>();

    /**
     * Get cached response. Returns null on miss or expiry.
     */
    @SuppressWarnings("unchecked")
    public <T> CacheEntry<T> get(CacheType type, String key) {
        String fullKey = type.name().toLowerCase() + ":" + key;
        CacheEntry<?> entry = store.get(fullKey);
        if (entry == null) return null;
        if (System.currentTimeMillis() > entry.expiresAt()) {
            store.remove(fullKey);
            return null;
        }
        return (CacheEntry<T>) entry;
    }

    /**
     * Store a response with type-appropriate TTL.
     */
    public <T> void set(CacheType type, String key, T data, String retrievedAt) {
        String fullKey = type.name().toLowerCase() + ":" + key;
        long expiresAt = System.currentTimeMillis() + type.ttlMs;
        store.put(fullKey, new CacheEntry<>(data, retrievedAt, expiresAt));
    }

    /**
     * Cache statistics for diagnostics.
     */
    public CacheStats stats() {
        int expirations = 0, quote = 0, chain = 0;
        for (String key : store.keySet()) {
            if (key.startsWith("expirations:")) expirations++;
            else if (key.startsWith("quote:")) quote++;
            else if (key.startsWith("chain:")) chain++;
        }
        return new CacheStats(store.size(), expirations, quote, chain);
    }

    public record CacheStats(int size, int expirations, int quote, int chain) {}
}
