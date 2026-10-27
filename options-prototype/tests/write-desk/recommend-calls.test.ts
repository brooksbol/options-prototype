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

// BUG-050: known basis below every strike used by the delta-policy tests.
const KNOWN_BASIS_50 = { averageCostPerShare: 50, costBasis: 10000, marketValue: null };

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

  // BUG-050: fixtures carry a known basis below every strike used by the
  // generic tests (unknown basis fails closed; see the BUG-050 block below).
  const makeInventory = (symbol: string, sharesFree: number, maxContracts: number, averageCostPerShare: number | null = 50): InventoryPosition => ({
    symbol,
    sharesOwned: sharesFree + 100,
    sharesEncumbered: 100,
    sharesFree,
    maxAdditionalContracts: maxContracts,
    economics: averageCostPerShare == null
      ? null
      : { averageCostPerShare, costBasis: averageCostPerShare * (sharesFree + 100), marketValue: null },
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

  it("emits one candidate per eligible expiration for an owned symbol", async () => {
    // Same symbol, three eligible expirations, each with a qualifying call.
    // Expect one row per expiration (not a single collapsed best row).
    const symbol = "XLE";
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [
      { date: "2026-08-03", dte: 10 },
      { date: "2026-08-17", dte: 24 },
      { date: "2026-08-31", dte: 38 },
    ]));
    for (const { date } of [{ date: "2026-08-03" }, { date: "2026-08-17" }, { date: "2026-08-31" }]) {
      const chainKey = buildCacheKey("tradier", env, "chain", symbol, date);
      await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, date, {
        underlying: { symbol, name: `${symbol} Fund`, price: 58.0 },
        calls: [{ strike: 60, bid: 1.50, ask: 1.70, delta: 0.30, openInterest: 800, volume: 200 }],
        puts: [],
      }));
    }

    const result = await recommendCalls(
      [makeInventory(symbol, 100, 1)],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    // One row per eligible expiration
    expect(result.candidates.length).toBe(3);
    const expirations = result.candidates.map(c => c.expiration).sort();
    expect(expirations).toEqual(["2026-08-03", "2026-08-17", "2026-08-31"]);
    // All rows are the same symbol
    expect(result.candidates.every(c => c.symbol === symbol)).toBe(true);
    // symbolsWithCandidates counts distinct symbols, not rows
    expect(result.symbolsWithCandidates).toBe(1);
  });

  it("BUG-050: removes a below-basis target-delta pick and keeps the basis-positive strike", async () => {
    // Basis $95. Target-delta (0.30) pick is strike 93 (below basis → loss if called away).
    // A higher strike 96 is admissible (delta 0.20, within 0.15-0.50) and at/above basis.
    // Expect ONE row: basis-positive (96). The 93 pick is never surfaced.
    await populateChain("XLE", [
      { strike: 93, bid: 1.70, ask: 1.90, delta: 0.30, openInterest: 500, volume: 100 },
      { strike: 96, bid: 0.90, ask: 1.10, delta: 0.20, openInterest: 400, volume: 90 },
    ], 94.0);

    const inventory: InventoryPosition = {
      symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100,
      maxAdditionalContracts: 1,
      economics: { averageCostPerShare: 95.0, costBasis: 9500, marketValue: 9400 },
    };

    const result = await recommendCalls(
      [inventory], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    const all = [...result.candidates, ...result.waitCandidates];
    expect(all.length).toBe(1);
    expect(all[0].selectionBasis).toBe("basis-positive");
    expect(all[0].strike).toBe(96);
    expect(all.some(c => c.strike < 95)).toBe(false);
  });

  it("does not duplicate a row when the target-delta pick is already basis-positive", async () => {
    // Basis $90. Target-delta pick strike 93 is already >= basis.
    // The lowest basis-positive strike is the same 93 → no second row.
    await populateChain("XLE", [
      { strike: 93, bid: 1.70, ask: 1.90, delta: 0.30, openInterest: 500, volume: 100 },
    ], 92.0);

    const inventory: InventoryPosition = {
      symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100,
      maxAdditionalContracts: 1,
      economics: { averageCostPerShare: 90.0, costBasis: 9000, marketValue: 9200 },
    };

    const result = await recommendCalls(
      [inventory], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    const all = [...result.candidates, ...result.waitCandidates];
    expect(all.length).toBe(1);
    expect(all[0].selectionBasis).toBe("target-delta");
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
      [{ symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: KNOWN_BASIS_50 }],
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
      [{ symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: KNOWN_BASIS_50 }],
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
      [{ symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1, economics: KNOWN_BASIS_50 }],
      cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY
    );

    // BUG-050 fixture carries a known basis, so a distinct basis-positive row may
    // accompany the pick; this test concerns only the target-delta selection.
    const targetRows = result.candidates.filter(c => c.selectionBasis === "target-delta");
    expect(targetRows.length).toBe(1);
    // Both are equidistant from 0.30 (|0.25-0.30| = |0.35-0.30| = 0.05)
    // Sort is stable — first in array wins when equidistant
    expect([0.25, 0.35]).toContain(targetRows[0].delta);
  });
});

// BUG-050 — covered calls must never sell held shares below cost basis.
// Principal rulings (October 27, 2026): 1A unknown basis fails closed;
// 2A strike >= basis, share leg only (equality admitted); 3A below-basis
// calls are removed from the surface with an explicit terminal reason.
describe("recommendCalls — BUG-050 call-away basis guard", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `call-bug050-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateChain(
    symbol: string,
    calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>,
    underlyingPrice: number,
    dte = 24,
  ) {
    const expDate = "2026-11-20";
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: expDate, dte }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, expDate, {
      underlying: { symbol, name: `${symbol} Fund`, price: underlyingPrice },
      calls,
      puts: [],
    }));
  }

  const held = (symbol: string, averageCostPerShare: number | null): InventoryPosition => ({
    symbol, sharesOwned: 100, sharesEncumbered: 0, sharesFree: 100, maxAdditionalContracts: 1,
    economics: averageCostPerShare == null ? null : { averageCostPerShare, costBasis: averageCostPerShare * 100, marketValue: null },
  });

  it("bug-record specimen: XLE basis $63, spot $58 → no below-basis recommendation, explicit reason", async () => {
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.30, delta: 0.30, openInterest: 500, volume: 100 },
      { strike: 62, bid: 0.60, ask: 0.70, delta: 0.18, openInterest: 400, volume: 80 },
    ], 58.0);

    const result = await recommendCalls([held("XLE", 63.0)], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);

    expect(result.candidates).toHaveLength(0);
    expect(result.waitCandidates).toHaveLength(0);
    expect(result.excluded).toEqual([{ symbol: "XLE", reason: expect.stringMatching(/below basis/i) }]);
  });

  it("admits a strike exactly at basis (zero share-leg appreciation is not negative)", async () => {
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.30, delta: 0.30, openInterest: 500, volume: 100 },
    ], 58.0);

    const result = await recommendCalls([held("XLE", 60.0)], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].strike).toBe(60);
    expect(result.candidates[0].selectionBasis).toBe("target-delta");
  });

  it("premium does not rescue a below-basis strike (share leg only)", async () => {
    // Strike 60 + mid 1.25 = 61.25 >= basis 61, but strike 60 < basis 61 → still removed.
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.30, delta: 0.30, openInterest: 500, volume: 100 },
    ], 58.0);

    const result = await recommendCalls([held("XLE", 61.0)], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);

    expect(result.candidates).toHaveLength(0);
    expect(result.waitCandidates).toHaveLength(0);
  });

  it("unknown basis fails closed with an explicit reason", async () => {
    await populateChain("XLE", [
      { strike: 60, bid: 1.20, ask: 1.30, delta: 0.30, openInterest: 500, volume: 100 },
    ], 58.0);

    const result = await recommendCalls([held("XLE", null)], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);

    expect(result.candidates).toHaveLength(0);
    expect(result.waitCandidates).toHaveLength(0);
    expect(result.excluded).toEqual([{ symbol: "XLE", reason: expect.stringMatching(/basis unknown/i) }]);
    expect(result.eligiblePositions).toBe(1);
  });

  it("removes below-basis WAIT rows too (removed from the surface, not demoted)", async () => {
    // Wide-ish spread / thin OI so the pick lands in WAIT rather than ACTIONABLE/EDGE.
    await populateChain("XLE", [
      { strike: 60, bid: 0.40, ask: 0.60, delta: 0.30, openInterest: 5, volume: 0 },
    ], 58.0);
    const control = await recommendCalls([held("XLE", 50.0)], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);
    const surfacedWhenCompliant = control.candidates.length + control.waitCandidates.length;

    const result = await recommendCalls([held("XLE", 63.0)], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);

    expect(surfacedWhenCompliant).toBeGreaterThan(0);
    expect(result.candidates).toHaveLength(0);
    expect(result.waitCandidates).toHaveLength(0);
  });

  it("every surfaced covered call is at or above known basis across mixed holdings", async () => {
    await populateChain("AAA", [
      { strike: 93, bid: 1.70, ask: 1.90, delta: 0.30, openInterest: 500, volume: 100 },
      { strike: 96, bid: 0.90, ask: 1.10, delta: 0.20, openInterest: 400, volume: 90 },
    ], 94.0);
    await populateChain("BBB", [
      { strike: 60, bid: 1.20, ask: 1.30, delta: 0.30, openInterest: 500, volume: 100 },
    ], 58.0);
    const inventory = [held("AAA", 95.0), held("BBB", 55.0)];

    const result = await recommendCalls(inventory, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);
    const all = [...result.candidates, ...result.waitCandidates];

    expect(all.map(c => `${c.symbol}:${c.strike}`).sort()).toEqual(["AAA:96", "BBB:60"]);
    for (const c of all) expect(c.strike).toBeGreaterThanOrEqual(c.basisPerShare!);
  });
});
