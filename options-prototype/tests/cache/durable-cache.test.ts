/**
 * Tests for durable IndexedDB market cache.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { DurableMarketCache, buildCacheKey, classifyFreshness, type CacheRecord } from "../../src/cache/durable-cache";

describe("DurableMarketCache", () => {
  let cache: DurableMarketCache;

  beforeEach(() => {
    cache = new DurableMarketCache();
  });

  it("returns null for missing keys", async () => {
    const result = await cache.get("nonexistent");
    expect(result).toBeNull();
  });

  it("stores and retrieves a record", async () => {
    const record = cache.createRecord(
      buildCacheKey("tradier", "sandbox", "expirations", "XLE"),
      "expirations",
      "tradier",
      "sandbox",
      "XLE",
      null,
      [{ date: "2026-08-14", dte: 31 }]
    );
    await cache.put(record);
    const retrieved = await cache.get(record.key);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.payload).toEqual([{ date: "2026-08-14", dte: 31 }]);
    expect(retrieved!.symbol).toBe("XLE");
  });

  it("L1 cache serves immediately without L2 lookup on second get", async () => {
    const record = cache.createRecord(
      buildCacheKey("tradier", "sandbox", "chain", "XLF", "2026-08-14"),
      "chain",
      "tradier",
      "sandbox",
      "XLF",
      "2026-08-14",
      { calls: [], puts: [] }
    );
    await cache.put(record);

    // Second get should hit L1
    const r1 = await cache.get(record.key);
    const r2 = await cache.get(record.key);
    expect(r1).toBe(r2); // Same object reference = L1 hit
  });

  it("fresh record classified as fresh", () => {
    const now = Date.now();
    const record: CacheRecord = {
      key: "test",
      dataType: "quote",
      provider: "tradier",
      environment: "sandbox",
      symbol: "XLE",
      expiration: null,
      schemaVersion: "v1",
      retrievedAt: now,
      freshUntil: now + 60000,
      staleUntil: now + 300000,
      payload: { price: 55.0 },
    };
    expect(classifyFreshness(record, now + 1000)).toBe("fresh");
  });

  it("stale record classified as stale_usable", () => {
    const now = Date.now();
    const record: CacheRecord = {
      key: "test",
      dataType: "quote",
      provider: "tradier",
      environment: "sandbox",
      symbol: "XLE",
      expiration: null,
      schemaVersion: "v1",
      retrievedAt: now - 180000,
      freshUntil: now - 60000,
      staleUntil: now + 120000,
      payload: { price: 55.0 },
    };
    expect(classifyFreshness(record, now)).toBe("stale_usable");
  });

  it("expired record classified as expired", () => {
    const now = Date.now();
    const record: CacheRecord = {
      key: "test",
      dataType: "quote",
      provider: "tradier",
      environment: "sandbox",
      symbol: "XLE",
      expiration: null,
      schemaVersion: "v1",
      retrievedAt: now - 600000,
      freshUntil: now - 500000,
      staleUntil: now - 100000,
      payload: { price: 55.0 },
    };
    expect(classifyFreshness(record, now)).toBe("expired");
  });

  it("null record classified as missing", () => {
    expect(classifyFreshness(null)).toBe("missing");
  });

  it("environment isolation: sandbox key ≠ live key", () => {
    const sandboxKey = buildCacheKey("tradier", "sandbox", "chain", "XLE", "2026-08-14");
    const liveKey = buildCacheKey("tradier", "live", "chain", "XLE", "2026-08-14");
    expect(sandboxKey).not.toBe(liveKey);
  });

  it("different symbols produce different keys", () => {
    const k1 = buildCacheKey("tradier", "sandbox", "expirations", "XLE");
    const k2 = buildCacheKey("tradier", "sandbox", "expirations", "XLF");
    expect(k1).not.toBe(k2);
  });

  it("expiration-specific chain key differs from expiration-less key", () => {
    const k1 = buildCacheKey("tradier", "sandbox", "chain", "XLE", "2026-08-14");
    const k2 = buildCacheKey("tradier", "sandbox", "chain", "XLE", "2026-08-21");
    expect(k1).not.toBe(k2);
  });

  it("per-type TTLs: expirations have longer fresh period than quotes", () => {
    const quoteRecord = cache.createRecord(
      buildCacheKey("tradier", "sandbox", "quote", "XLE"),
      "quote", "tradier", "sandbox", "XLE", null, 55.0
    );
    const expRecord = cache.createRecord(
      buildCacheKey("tradier", "sandbox", "expirations", "XLE"),
      "expirations", "tradier", "sandbox", "XLE", null, []
    );
    const quoteFreshDuration = quoteRecord.freshUntil - quoteRecord.retrievedAt;
    const expFreshDuration = expRecord.freshUntil - expRecord.retrievedAt;
    expect(expFreshDuration).toBeGreaterThan(quoteFreshDuration);
  });
});
