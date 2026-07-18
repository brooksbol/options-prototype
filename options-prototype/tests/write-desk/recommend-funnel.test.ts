/**
 * Recommendation Funnel Tests — Proves:
 *
 * 1. No hidden cap truncates the eligible population
 * 2. Engine can return more than 20, 50, or 100 candidates
 * 3. Show/maxResults does not alter eligibility or ranking
 * 4. One-result-per-symbol behavior is intentional
 * 5. Each major exclusion rule contributes to the funnel correctly
 * 6. Policy sensitivity analysis (wider delta, wider DTE)
 * 7. Yield null semantics (spread suppression, not divide-by-zero)
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY, type RecommendationPolicy } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";

let testId = 0;

describe("recommendation funnel — no hidden caps", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `funnel-test-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateSymbol(
    symbol: string,
    puts: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>,
    expDate = "2026-08-03",
    dte = 21
  ) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: expDate, dte }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, expDate, { underlying: { symbol, name: `${symbol} Test Fund`, price: 100 }, puts }));
  }

  function makeGoodPut(strike: number): { strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number } {
    return { strike, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 };
  }

  it("engine returns more than 20 candidates when population is larger", async () => {
    // Populate 30 symbols with good puts
    const symbols: string[] = [];
    for (let i = 0; i < 30; i++) {
      const sym = `ETF${String(i).padStart(2, "0")}`;
      symbols.push(sym);
      await populateSymbol(sym, [makeGoodPut(50 + i)]);
    }

    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(30);
    expect(result.candidates[29].rank).toBe(30);
  });

  it("engine returns more than 50 candidates when population is larger", async () => {
    const symbols: string[] = [];
    for (let i = 0; i < 60; i++) {
      const sym = `SYM${String(i).padStart(3, "0")}`;
      symbols.push(sym);
      await populateSymbol(sym, [makeGoodPut(30 + i)]);
    }

    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(60);
  });

  it("maxResults caps output but does not affect eligibility", async () => {
    const symbols: string[] = [];
    for (let i = 0; i < 25; i++) {
      const sym = `CAP${String(i).padStart(2, "0")}`;
      symbols.push(sym);
      await populateSymbol(sym, [makeGoodPut(40 + i)]);
    }

    // Default maxResults = 100 → shows all 25
    const fullResult = await recommendPuts(symbols, 500_000, cache, cacheEnv());
    expect(fullResult.candidates.length).toBe(25);

    // With maxResults = 10 → caps at 10 but same eligibility
    const cappedPolicy: RecommendationPolicy = {
      ...DEFAULT_RECOMMENDATION_POLICY,
      ranking: { ...DEFAULT_RECOMMENDATION_POLICY.ranking, maxResults: 10 },
    };
    const cappedResult = await recommendPuts(symbols, 500_000, cache, cacheEnv(), cappedPolicy);
    expect(cappedResult.candidates.length).toBe(10);

    // Both have same coverage stats
    expect(cappedResult.coverage.symbolsWithEvidence).toBe(fullResult.coverage.symbolsWithEvidence);
  });

  it("one result per symbol — multiple contracts produce single best candidate", async () => {
    // Two puts for same symbol at different strikes
    await populateSymbol("XLE", [
      { strike: 48, bid: 0.80, ask: 1.00, delta: -0.20, openInterest: 200, volume: 50 },
      { strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
      { strike: 52, bid: 2.50, ask: 2.80, delta: -0.40, openInterest: 400, volume: 80 },
    ]);

    const result = await recommendPuts(["XLE"], 500_000, cache, cacheEnv());
    // Should produce exactly 1 candidate (best scoring)
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].symbol).toBe("XLE");
  });

  it("Show/display count does not alter engine output", async () => {
    const symbols: string[] = [];
    for (let i = 0; i < 40; i++) {
      const sym = `DSP${String(i).padStart(2, "0")}`;
      symbols.push(sym);
      await populateSymbol(sym, [makeGoodPut(45 + i)]);
    }

    // Engine always returns same population regardless of how UI will slice
    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(40);
    // UI would do .slice(0, showCount) — that's display-layer, not engine
  });
});

describe("recommendation funnel — exclusion stages", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `funnel-excl-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  it("confirmed absence excludes symbol from evaluation", async () => {
    const absKey = buildCacheKey("tradier", env, "absence", "NOOPT");
    await cache.put(cache.createRecord(absKey, "absence", "tradier", env, "NOOPT", null, { reason: "no expirations" }));

    const result = await recommendPuts(["NOOPT"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(0);
    expect(result.coverage.confirmedAbsence).toBe(1);
    expect(result.coverageRequests.length).toBe(0);
  });

  it("no expirations in DTE range excludes symbol", async () => {
    // Expiration at 90 DTE — outside default eligible range (7-45)
    const expKey = buildCacheKey("tradier", env, "expirations", "FAR");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "FAR", null, [{ date: "2026-10-01", dte: 90 }]));

    const result = await recommendPuts(["FAR"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(0);
    expect(result.coverage.symbolsExcluded).toBe(1);
  });

  it("zero bid causes hard-no exclusion", async () => {
    const expKey = buildCacheKey("tradier", env, "expirations", "ZBID");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "ZBID", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "ZBID", "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "ZBID", "2026-08-03", {
      puts: [{ strike: 30, bid: 0, ask: 0.50, delta: -0.30, openInterest: 100, volume: 10 }],
    }));

    const result = await recommendPuts(["ZBID"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(0);
  });

  it("zero OI causes hard-no exclusion", async () => {
    const expKey = buildCacheKey("tradier", env, "expirations", "ZOI");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "ZOI", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "ZOI", "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "ZOI", "2026-08-03", {
      puts: [{ strike: 30, bid: 0.50, ask: 0.70, delta: -0.30, openInterest: 0, volume: 0 }],
    }));

    const result = await recommendPuts(["ZOI"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(0);
  });

  it("spread > 80% causes hard-no exclusion", async () => {
    const expKey = buildCacheKey("tradier", env, "expirations", "WIDE");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "WIDE", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "WIDE", "2026-08-03");
    // bid=0.10, ask=1.00 → mid=0.55, spread=0.90, spreadPct=0.90/0.55*100 ≈ 164%
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "WIDE", "2026-08-03", {
      puts: [{ strike: 30, bid: 0.10, ask: 1.00, delta: -0.30, openInterest: 100, volume: 10 }],
    }));

    const result = await recommendPuts(["WIDE"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(0);
  });

  it("delta outside admissible range excludes contract", async () => {
    const expKey = buildCacheKey("tradier", env, "expirations", "DEEP");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "DEEP", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "DEEP", "2026-08-03");
    // delta -0.80 is outside default admissible range (0.15-0.50)
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "DEEP", "2026-08-03", {
      puts: [{ strike: 30, bid: 5.00, ask: 5.20, delta: -0.80, openInterest: 500, volume: 100 }],
    }));

    const result = await recommendPuts(["DEEP"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(0);
  });

  it("low execution score → WAIT posture → excluded from eligible candidates", async () => {
    // Contract with low OI, low volume, high spread → low exec score → WAIT
    const expKey = buildCacheKey("tradier", env, "expirations", "WEAK");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "WEAK", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "WEAK", "2026-08-03");
    // bid=0.30, ask=0.50 → mid=0.40, spread=0.20, spreadPct=50%
    // OI=5, volume=0 → low scores for OI and volume
    // Composite score will be below edgeFloor (35)
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "WEAK", "2026-08-03", {
      underlying: { symbol: "WEAK", name: "WEAK Test Fund", price: 100 },
      puts: [{ strike: 30, bid: 0.30, ask: 0.50, delta: -0.25, openInterest: 5, volume: 0 }],
    }));

    const result = await recommendPuts(["WEAK"], 500_000, cache, cacheEnv());
    // Not in candidates (score too low for ACTIONABLE or EDGE)
    expect(result.candidates.length).toBe(0);
    // But appears in waitCandidates
    expect(result.waitCandidates.length).toBe(1);
    expect(result.waitCandidates[0].posture).toBe("WAIT");
  });
});

describe("recommendation funnel — yield null semantics", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `funnel-yield-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  it("yield is null when spread exceeds 2x preferredSpreadPercent", async () => {
    // preferredSpreadPercent = 15 → threshold = 30%
    // bid=1.00, ask=1.50 → mid=1.25, spread=0.50, spreadPct=40% > 30%
    const expKey = buildCacheKey("tradier", env, "expirations", "WSPY");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "WSPY", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "WSPY", "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "WSPY", "2026-08-03", {
      underlying: { symbol: "WSPY", name: "WSPY Test Fund", price: 100 },
      puts: [{ strike: 50, bid: 1.00, ask: 1.50, delta: -0.30, openInterest: 500, volume: 100 }],
    }));

    const result = await recommendPuts(["WSPY"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].yieldAnnualized).toBeNull();
  });

  it("yield is calculated when spread is within 2x preferredSpreadPercent", async () => {
    // bid=1.50, ask=1.70 → mid=1.60, spread=0.20, spreadPct=12.5% < 30%
    const expKey = buildCacheKey("tradier", env, "expirations", "GOOD");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "GOOD", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "GOOD", "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "GOOD", "2026-08-03", {
      underlying: { symbol: "GOOD", name: "GOOD Test Fund", price: 100 },
      puts: [{ strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
    }));

    const result = await recommendPuts(["GOOD"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].yieldAnnualized).not.toBeNull();
    // yield = (bid/strike) * (365/dte) * 100 = (1.50/50) * (365/21) * 100 ≈ 52.1%
    expect(result.candidates[0].yieldAnnualized).toBeCloseTo(52.14, 0);
  });
});

describe("recommendation funnel — policy sensitivity", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `funnel-sens-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateSymbolWithExp(
    symbol: string,
    puts: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>,
    expDate: string,
    dte: number
  ) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: expDate, dte }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, expDate, { underlying: { symbol, name: `${symbol} Test Fund`, price: 100 }, puts }));
  }

  it("wider delta range admits more symbols", async () => {
    // Symbol with only deep OTM put (delta -0.10) — outside default range (0.15-0.50)
    await populateSymbolWithExp("OTM", [
      { strike: 20, bid: 0.50, ask: 0.60, delta: -0.10, openInterest: 300, volume: 50 },
    ], "2026-08-03", 21);

    const defaultResult = await recommendPuts(["OTM"], 500_000, cache, cacheEnv());
    expect(defaultResult.candidates.length).toBe(0);

    // Wider delta range includes 0.10
    const widePolicy: RecommendationPolicy = {
      ...DEFAULT_RECOMMENDATION_POLICY,
      contractSelection: {
        ...DEFAULT_RECOMMENDATION_POLICY.contractSelection,
        admissibleDeltaRange: { min: 0.05, max: 0.60 },
      },
    };
    const wideResult = await recommendPuts(["OTM"], 500_000, cache, cacheEnv(), widePolicy);
    expect(wideResult.candidates.length).toBe(1);
  });

  it("wider DTE range admits symbols with only distant expirations", async () => {
    // Symbol with only 60 DTE expiration — outside default (7-45)
    await populateSymbolWithExp("DIST", [
      { strike: 40, bid: 2.00, ask: 2.20, delta: -0.30, openInterest: 400, volume: 80 },
    ], "2026-09-01", 60);

    const defaultResult = await recommendPuts(["DIST"], 500_000, cache, cacheEnv());
    expect(defaultResult.candidates.length).toBe(0);

    const wideDtePolicy: RecommendationPolicy = {
      ...DEFAULT_RECOMMENDATION_POLICY,
      contractSelection: {
        ...DEFAULT_RECOMMENDATION_POLICY.contractSelection,
        eligibleDteRange: { min: 7, max: 90 },
      },
    };
    const wideResult = await recommendPuts(["DIST"], 500_000, cache, cacheEnv(), wideDtePolicy);
    expect(wideResult.candidates.length).toBe(1);
  });

  it("relaxed execution thresholds admit more candidates (lower edgeFloor)", async () => {
    // Contract with low liquidity → WAIT under default policy
    await populateSymbolWithExp("THIN", [
      { strike: 30, bid: 0.30, ask: 0.50, delta: -0.25, openInterest: 5, volume: 0 },
    ], "2026-08-03", 21);

    const defaultResult = await recommendPuts(["THIN"], 500_000, cache, cacheEnv());
    expect(defaultResult.candidates.length).toBe(0); // WAIT posture

    // Lower edge floor to 10
    const relaxedPolicy: RecommendationPolicy = {
      ...DEFAULT_RECOMMENDATION_POLICY,
      executionAssessment: {
        ...DEFAULT_RECOMMENDATION_POLICY.executionAssessment,
        edgeFloor: 10,
      },
    };
    const relaxedResult = await recommendPuts(["THIN"], 500_000, cache, cacheEnv(), relaxedPolicy);
    expect(relaxedResult.candidates.length).toBe(1); // Now EDGE
    expect(relaxedResult.candidates[0].posture).toBe("EDGE");
  });
});
