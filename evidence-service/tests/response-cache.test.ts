/**
 * Tests for ResponseCache — TTL-based in-memory cache.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResponseCache } from "../src/response-cache.js";

describe("ResponseCache", () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache();
  });

  it("returns null for missing keys", () => {
    expect(cache.get("expirations", "XLE")).toBeNull();
  });

  it("stores and retrieves within TTL", () => {
    cache.set("expirations", "XLE", [{ date: "2026-08-21", dte: 37 }], "2026-07-15T10:00:00Z");
    const result = cache.get<{ date: string; dte: number }[]>("expirations", "XLE");
    expect(result).not.toBeNull();
    expect(result!.data[0].date).toBe("2026-08-21");
    expect(result!.retrievedAt).toBe("2026-07-15T10:00:00Z");
  });

  it("returns null after TTL expires", () => {
    vi.useFakeTimers();
    cache.set("quote", "XLE", { price: 88.5, name: "Energy" }, "2026-07-15T10:00:00Z");

    // Advance past 60s quote TTL
    vi.advanceTimersByTime(61_000);

    expect(cache.get("quote", "XLE")).toBeNull();
    vi.useRealTimers();
  });

  it("different types have different TTLs", () => {
    vi.useFakeTimers();
    cache.set("expirations", "XLE", [], "now");
    cache.set("quote", "XLE", { price: 1 }, "now");

    // At 90 seconds: quote expired, expirations still valid
    vi.advanceTimersByTime(90_000);

    expect(cache.get("quote", "XLE")).toBeNull();
    expect(cache.get("expirations", "XLE")).not.toBeNull();
    vi.useRealTimers();
  });

  it("reports stats correctly", () => {
    cache.set("expirations", "A", [], "now");
    cache.set("expirations", "B", [], "now");
    cache.set("quote", "A", {}, "now");
    cache.set("chain", "A:2026-08-21", {}, "now");

    const stats = cache.stats();
    expect(stats.size).toBe(4);
    expect(stats.byType.expirations).toBe(2);
    expect(stats.byType.quote).toBe(1);
    expect(stats.byType.chain).toBe(1);
  });
});
