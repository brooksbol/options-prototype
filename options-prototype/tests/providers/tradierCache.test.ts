import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResponseCache } from "../../src/providers/tradier/TradierProvider";

describe("ResponseCache", () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache(1000); // 1 second TTL for fast tests
  });

  it("returns null for missing keys", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("stores and retrieves data", () => {
    cache.set("key1", { value: 42 });
    const result = cache.get<{ value: number }>("key1");
    expect(result).not.toBeNull();
    expect(result!.data.value).toBe(42);
  });

  it("reports age in milliseconds", () => {
    cache.set("key1", "data");
    const result = cache.get<string>("key1");
    expect(result).not.toBeNull();
    expect(result!.ageMs).toBeGreaterThanOrEqual(0);
    expect(result!.ageMs).toBeLessThan(100); // should be near-instant
  });

  it("expires entries after TTL", async () => {
    const shortCache = new ResponseCache(50); // 50ms TTL
    shortCache.set("key1", "data");

    // Immediately available
    expect(shortCache.get("key1")).not.toBeNull();

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 60));
    expect(shortCache.get("key1")).toBeNull();
  });

  it("uses different keys for different symbols", () => {
    cache.set("chain:SPY:2025-07-18", { spy: true });
    cache.set("chain:QQQ:2025-07-18", { qqq: true });

    const spy = cache.get<{ spy: boolean }>("chain:SPY:2025-07-18");
    const qqq = cache.get<{ qqq: boolean }>("chain:QQQ:2025-07-18");

    expect(spy!.data.spy).toBe(true);
    expect(qqq!.data.qqq).toBe(true);
  });

  it("uses different keys for different expirations", () => {
    cache.set("chain:SPY:2025-07-18", { exp1: true });
    cache.set("chain:SPY:2025-07-25", { exp2: true });

    const exp1 = cache.get<{ exp1: boolean }>("chain:SPY:2025-07-18");
    const exp2 = cache.get<{ exp2: boolean }>("chain:SPY:2025-07-25");

    expect(exp1!.data.exp1).toBe(true);
    expect(exp2!.data.exp2).toBe(true);
  });

  it("invalidate() clears all entries", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    cache.invalidate();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeNull();
  });

  it("invalidate(prefix) clears only matching keys", () => {
    cache.set("chain:SPY:2025-07-18", "spy-data");
    cache.set("chain:QQQ:2025-07-18", "qqq-data");
    cache.set("expirations:SPY", "spy-exps");

    cache.invalidate("chain:SPY");

    expect(cache.get("chain:SPY:2025-07-18")).toBeNull();
    expect(cache.get("chain:QQQ:2025-07-18")).not.toBeNull();
    expect(cache.get("expirations:SPY")).not.toBeNull();
  });

  it("repeated gets return same data (cache hit)", () => {
    cache.set("key1", { count: 1 });
    const first = cache.get<{ count: number }>("key1");
    const second = cache.get<{ count: number }>("key1");
    expect(first!.data).toBe(second!.data); // Same reference
  });
});
