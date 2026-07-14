/**
 * Tests for in-flight request deduplication in TradierProvider.
 *
 * Proves that simultaneous identical calls produce only one API request.
 * Also verifies that failed requests don't permanently poison the key.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { ResponseCache, TradierProvider } from "../../src/providers/tradier/TradierProvider";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache } from "../../src/cache/durable-cache";
import type { TradierConfig } from "../../src/config/tradier";

// --- Mock fetch ---

let fetchCallCount = 0;
let fetchDelay = 50;
let fetchShouldFail = false;

const mockConfig: TradierConfig = {
  apiKey: "test-key",
  baseUrl: "https://mock.tradier.test/v1",
  accountId: "test-account",
};

beforeEach(() => {
  fetchCallCount = 0;
  fetchDelay = 50;
  fetchShouldFail = false;
  resetDB();
  resetDurableCache();

  global.fetch = vi.fn(async () => {
    fetchCallCount++;
    await new Promise((r) => setTimeout(r, fetchDelay));

    if (fetchShouldFail) {
      return {
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
        headers: new Headers(),
      } as unknown as Response;
    }

    return {
      ok: true,
      json: async () => ({
        expirations: { date: ["2026-08-14", "2026-08-21"] },
      }),
      headers: new Headers(),
    } as unknown as Response;
  });
});

// --- Tests ---

describe("TradierProvider — in-flight deduplication", () => {
  it("simultaneous identical getExpirations calls produce only one fetch", async () => {
    const provider = new TradierProvider(mockConfig);

    // Fire 3 concurrent calls for the same symbol
    const [r1, r2, r3] = await Promise.all([
      provider.getExpirations("DEDUP_SYM"),
      provider.getExpirations("DEDUP_SYM"),
      provider.getExpirations("DEDUP_SYM"),
    ]);

    // Only 1 actual fetch should have been made
    expect(fetchCallCount).toBe(1);

    // All three should return the same data
    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
    expect(r1.length).toBe(2);
  });

  it("different symbols produce separate fetches (when not cached)", async () => {
    const provider = new TradierProvider(mockConfig);

    // Use symbols that won't already be in durable cache
    // Since beforeEach resets the singleton, this should be clean
    await Promise.all([
      provider.getExpirations("UNIQUE_A"),
      provider.getExpirations("UNIQUE_B"),
    ]);

    expect(fetchCallCount).toBe(2);
  });

  it("sequential calls hit L1 cache within TTL (no new fetch)", async () => {
    const provider = new TradierProvider(mockConfig);

    await provider.getExpirations("SEQ_TEST");
    expect(fetchCallCount).toBe(1);

    // Second call should hit L1 memory cache (within 60s TTL)
    await provider.getExpirations("SEQ_TEST");
    expect(fetchCallCount).toBe(1); // still 1
  });

  it("failed request clears in-flight entry and does not poison future calls", async () => {
    fetchShouldFail = true;
    const provider = new TradierProvider(mockConfig);

    // First call fails
    const result1 = await provider.getExpirations("FAIL_TEST");
    expect(result1).toEqual([]); // getExpirations returns [] on error
    expect(fetchCallCount).toBe(1);

    // Reset — next call should succeed
    fetchShouldFail = false;
    const result2 = await provider.getExpirations("FAIL_TEST");
    expect(result2.length).toBe(2);
    expect(fetchCallCount).toBe(2); // new fetch was made
  });

  it("concurrent calls during a failure all receive the error gracefully", async () => {
    fetchShouldFail = true;
    fetchDelay = 30;
    const provider = new TradierProvider(mockConfig);

    const results = await Promise.all([
      provider.getExpirations("CONC_FAIL"),
      provider.getExpirations("CONC_FAIL"),
      provider.getExpirations("CONC_FAIL"),
    ]);

    // All should gracefully return empty (getExpirations catches errors)
    expect(results.every((r) => r.length === 0)).toBe(true);
    // Only one actual fetch
    expect(fetchCallCount).toBe(1);
  });
});

describe("ResponseCache", () => {
  it("returns null for missing keys", () => {
    const cache = new ResponseCache();
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("returns cached data within TTL", () => {
    const cache = new ResponseCache(5000);
    cache.set("key1", { value: 42 });
    const result = cache.get<{ value: number }>("key1");
    expect(result).not.toBeNull();
    expect(result!.data.value).toBe(42);
    expect(result!.ageMs).toBeLessThan(100);
  });

  it("expires entries beyond TTL", async () => {
    const cache = new ResponseCache(10); // 10ms TTL
    cache.set("key1", { value: 42 });
    await new Promise((r) => setTimeout(r, 20));
    expect(cache.get("key1")).toBeNull();
  });

  it("invalidate clears matching keys", () => {
    const cache = new ResponseCache();
    cache.set("chain:XLE:2026-08-14", "data1");
    cache.set("chain:XLE:2026-08-21", "data2");
    cache.set("expirations:XLE", "data3");
    cache.invalidate("chain:XLE");
    expect(cache.get("chain:XLE:2026-08-14")).toBeNull();
    expect(cache.get("chain:XLE:2026-08-21")).toBeNull();
    expect(cache.get("expirations:XLE")).not.toBeNull();
  });
});
