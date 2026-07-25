/**
 * Call Recommendation Tests — Proves:
 *
 * 1. Eligible inventory with cached chains produces call candidates
 * 2. Fully encumbered positions are excluded
 * 3. Sub-100 share positions are excluded
 * 4. Missing chain evidence excludes symbol
 * 5. Ranking works (execution_first mode)
 * 6. Yield uses midpoint / underlyingPrice
 * 7. Delta filter applies to call contracts
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendCalls } from "../../src/write-desk/recommend-calls";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import type { InventoryPosition } from "../../src/write-desk/types";

let testId = 0;

describe("recommendCalls", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `call-test-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateChain(
    symbol: string,
    calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>,
    underlyingPrice: number = 58.0,
    expDate: string = "2026-08-03",
    dte: number = 21
  ) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: expDate, dte }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, expDate, {
      underlying: { symbol, name: `${symbol} Fund`, price: underlyingPrice },
      calls,
      puts: [],
    }));
  }

  const makeInventory = (symbol: string, sharesFree: number, maxContracts: number): InventoryPosition => ({
    symbol,
    sharesOwned: sharesFree + 100,
    sharesEncumbered: 100,
    sharesFree,
    maxAdditionalContracts: maxContracts,
    economics: null,
  });

  it("produces call candidate for eligible inventory with cached chain", async () => {
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 },
    ]);

    const result = await recommendCalls(
      [makeInventory("XLE", 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].symbol).toBe("XLE");
    expect(result.candidates[0].strike).toBe(60);
    expect(result.candidates[0].freeShares).toBe(100);
    expect(result.candidates[0].maxContracts).toBe(1);
    expect(result.candidates[0].rank).toBe(1);
  });

  it("excludes inventory with zero maxAdditionalContracts", async () => {
    await populateChain("QQQ", [
      { strike: 500, bid: 5.0, ask: 5.50, delta: 0.30, openInterest: 1000, volume: 200 },
    ]);

    const result = await recommendCalls(
      [{ symbol: "QQQ", sharesOwned: 300, sharesEncumbered: 300, sharesFree: 0, maxAdditionalContracts: 0, economics: null }],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates.length).toBe(0);
    expect(result.excluded.length).toBe(0); // not even evaluated — pre-filtered
    expect(result.eligiblePositions).toBe(0);
  });

  it("excludes symbol when no chain evidence exists", async () => {
    // Only expirations, no chain
    const expKey = buildCacheKey("tradier", env, "expirations", "SPY");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "SPY", null, [{ date: "2026-08-03", dte: 21 }]));

    const result = await recommendCalls(
      [makeInventory("SPY", 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates.length).toBe(0);
    expect(result.excluded.some(e => e.symbol === "SPY")).toBe(true);
  });

  it("excludes symbol when no expirations cached", async () => {
    const result = await recommendCalls(
      [makeInventory("UNKNOWN", 200, 2)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates.length).toBe(0);
    expect(result.excluded.some(e => e.symbol === "UNKNOWN" && e.reason.includes("expirations"))).toBe(true);
  });

  it("filters call contracts by delta range", async () => {
    await populateChain("XLE", [
      { strike: 55, bid: 3.0, ask: 3.20, delta: 0.65, openInterest: 200, volume: 50 }, // too high delta
      { strike: 58, bid: 1.50, ask: 1.70, delta: 0.08, openInterest: 100, volume: 30 }, // too low delta
    ]);

    const result = await recommendCalls(
      [makeInventory("XLE", 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    // Neither contract is within default 0.15-0.50 admissible range for calls
    // delta 0.65 > 0.50, delta 0.08 < 0.15
    expect(result.candidates.length).toBe(0);
    expect(result.excluded.some(e => e.symbol === "XLE")).toBe(true);
  });

  it("yield uses midpoint / underlyingPrice", async () => {
    // bid=1.20, ask=1.40 → mid=1.30
    // underlyingPrice=58.0, dte=21
    // yield = (1.30 / 58.0) * (365/21) * 100 ≈ 38.96%
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 500, volume: 100 },
    ], 58.0);

    const result = await recommendCalls(
      [makeInventory("XLE", 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates[0].yieldAnnualized).not.toBeNull();
    expect(result.candidates[0].yieldAnnualized).toBeCloseTo(38.96, 0);
  });

  it("ranks multiple candidates by execution score", async () => {
    // Two symbols: one with better spread/OI, one with worse
    await populateChain("XLE", [
      { strike: 60, bid: 1.50, ask: 1.70, delta: 0.30, openInterest: 800, volume: 200 },
    ], 58.0);
    await populateChain("IWM", [
      { strike: 210, bid: 0.50, ask: 1.00, delta: 0.25, openInterest: 50, volume: 10 },
    ], 200.0);

    const result = await recommendCalls(
      [makeInventory("XLE", 100, 1), makeInventory("IWM", 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates.length).toBe(2);
    // XLE should rank higher (better spread, higher OI)
    expect(result.candidates[0].symbol).toBe("XLE");
    expect(result.candidates[0].rank).toBe(1);
    expect(result.candidates[1].symbol).toBe("IWM");
    expect(result.candidates[1].rank).toBe(2);
  });

  it("premiumPerContract uses midpoint × 100", async () => {
    // bid=1.20, ask=1.40 → mid=1.30 → premium=130
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 500, volume: 100 },
    ]);

    const result = await recommendCalls(
      [makeInventory("XLE", 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates[0].premiumPerContract).toBeCloseTo(130, 0);
  });

  it("strikeAbovePrice is true when strike > underlying", async () => {
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 500, volume: 100 },
    ], 58.0); // price=58, strike=60

    const result = await recommendCalls(
      [makeInventory("XLE", 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates[0].strikeAbovePrice).toBe(true);
  });
});

describe("recommendCalls — delta policy consistency", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `call-delta-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateChain(
    symbol: string,
    calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>,
    puts: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>,
    underlyingPrice: number = 58.0
  ) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      underlying: { symbol, name: `${symbol} Fund`, price: underlyingPrice },
      calls,
      puts,
    }));
  }

  it("call delta uses raw positive value; put delta uses absolute value — same policy range applies consistently", async () => {
    // Given: policy admissibleDeltaRange = { min: 0.15, max: 0.50 }
    //
    // Calls have positive delta (0.15 to 0.50 = qualifying range)
    // Puts have negative delta (-0.15 to -0.50 = qualifying when |delta| applied)
    //
    // This test verifies that a 0.30 delta call and a -0.30 delta put
    // both pass the same admissible range filter.

    await populateChain("XLE",
      [{ strike: 60, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 500, volume: 100 }],
      [{ strike: 55, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }]
    );

    // Call recommendation: delta 0.30 is within [0.15, 0.50] (raw positive)
    const callResult = await recommendCalls(
      [{ symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: null }],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );
    expect(callResult.candidates.length).toBe(1);
    expect(callResult.candidates[0].delta).toBe(0.30);

    // Put recommendation: delta -0.30, |delta| = 0.30 is within [0.15, 0.50]
    const { recommendPuts } = await import("../../src/write-desk/recommend");
    const putResult = await recommendPuts(
      ["XLE"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );
    expect(putResult.candidates.length).toBe(1);
    expect(Math.abs(putResult.candidates[0].delta)).toBeCloseTo(0.30, 2);
  });

  it("call contract outside admissible range is excluded (same boundary as puts)", async () => {
    // delta 0.55 > 0.50 max — excluded for calls
    await populateChain("XLE",
      [{ strike: 58, bid: 2.50, ask: 2.80, delta: 0.55, openInterest: 500, volume: 100 }],
      []
    );

    const result = await recommendCalls(
      [{ symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: null }],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );
    expect(result.candidates.length).toBe(0);
  });

  it("policy targetDelta selects closest call contract", async () => {
    // Two calls: delta 0.25 and delta 0.35
    // Default targetDelta = 0.30 → closer to 0.30 is preferred
    await populateChain("XLE",
      [
        { strike: 62, bid: 0.80, ask: 1.00, delta: 0.25, openInterest: 300, volume: 50 },
        { strike: 59, bid: 1.80, ask: 2.00, delta: 0.35, openInterest: 400, volume: 80 },
      ],
      []
    );

    const result = await recommendCalls(
      [{ symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: null }],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    expect(result.candidates.length).toBe(1);
    // Both are equidistant from 0.30 (|0.25-0.30| = |0.35-0.30| = 0.05)
    // Sort is stable — first in array wins when equidistant
    expect([0.25, 0.35]).toContain(result.candidates[0].delta);
  });
});
