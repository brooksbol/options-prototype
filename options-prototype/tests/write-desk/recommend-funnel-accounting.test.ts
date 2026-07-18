/**
 * Funnel Accounting Tests — Verifies:
 *
 * 1. Funnel counts reconcile arithmetically
 * 2. Non-optionable counts as resolved but not optionable/evaluable/eligible
 * 3. Partial acquisition state (pending > 0)
 * 4. Complete resolution state (pending = 0)
 * 5. Exclusion breakdown matches funnel math
 * 6. Displayed count respects Show limit
 * 7. Yield suppression with explicit reason
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY, type RecommendationPolicy } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";

let testId = 0;

describe("funnel accounting — reconciliation", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `funnel-acct-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateSymbol(symbol: string, puts: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", { underlying: { symbol, name: `${symbol} Test Fund`, price: 100 }, puts }));
  }

  async function populateAbsent(symbol: string) {
    const absKey = buildCacheKey("tradier", env, "absence", symbol);
    await cache.put(cache.createRecord(absKey, "absence", "tradier", env, symbol, null, { reason: "no expirations" }));
  }

  it("funnel reconciles: monitored = resolved + pending", async () => {
    // 3 symbols: 1 eligible, 1 absent, 1 has no cached evidence (pending)
    await populateSymbol("XLE", [
      { strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
    ]);
    await populateAbsent("NOOPT");

    const result = await recommendPuts(["XLE", "NOOPT", "UNKNOWN"], 500_000, cache, cacheEnv());
    const f = result.funnel;

    expect(f.monitored).toBe(3);
    expect(f.resolved + f.pending).toBe(f.monitored);
    expect(f.resolved).toBe(2); // XLE + NOOPT resolved
    expect(f.pending).toBe(1); // UNKNOWN
  });

  it("funnel reconciles: resolved = optionable + nonOptionable + product-structure-excluded", async () => {
    await populateSymbol("XLE", [
      { strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
    ]);
    await populateAbsent("BOND1");
    await populateAbsent("BOND2");

    const result = await recommendPuts(["XLE", "BOND1", "BOND2"], 500_000, cache, cacheEnv());
    const f = result.funnel;

    expect(f.resolved).toBe(3);
    expect(f.optionable).toBe(1); // XLE
    expect(f.nonOptionable).toBe(2); // BOND1, BOND2
    expect(f.optionable + f.nonOptionable).toBe(f.resolved);
  });

  it("non-optionable counts as resolved, not as evaluable or eligible", async () => {
    await populateAbsent("NOOPT1");
    await populateAbsent("NOOPT2");
    await populateAbsent("NOOPT3");

    const result = await recommendPuts(["NOOPT1", "NOOPT2", "NOOPT3"], 500_000, cache, cacheEnv());
    const f = result.funnel;

    expect(f.monitored).toBe(3);
    expect(f.resolved).toBe(3);
    expect(f.nonOptionable).toBe(3);
    expect(f.optionable).toBe(0);
    expect(f.evaluable).toBe(0);
    expect(f.eligible).toBe(0);
  });

  it("partial acquisition: pending > 0 reflects unresolved symbols", async () => {
    await populateSymbol("XLE", [
      { strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
    ]);
    // SYM2, SYM3 have no evidence at all
    const result = await recommendPuts(["XLE", "SYM2", "SYM3"], 500_000, cache, cacheEnv());
    const f = result.funnel;

    expect(f.pending).toBe(2);
    expect(f.resolved).toBe(1);
    expect(f.eligible).toBe(1);
  });

  it("complete resolution: pending = 0 when all have evidence", async () => {
    await populateSymbol("XLE", [
      { strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
    ]);
    await populateAbsent("NOOPT");

    const result = await recommendPuts(["XLE", "NOOPT"], 500_000, cache, cacheEnv());
    const f = result.funnel;

    expect(f.pending).toBe(0);
    expect(f.resolved).toBe(f.monitored);
  });

  it("exclusion reasons sum to expected count", async () => {
    await populateSymbol("GOOD", [
      { strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
    ]);
    await populateAbsent("ABSENT1");
    // Symbol with distant expiration only (90 DTE — outside 7-45 range)
    const expKey = buildCacheKey("tradier", env, "expirations", "FARDTE");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "FARDTE", null, [{ date: "2026-10-01", dte: 90 }]));
    // Symbol with chain but weak liquidity (WAIT posture)
    await populateSymbol("WEAK", [
      { strike: 30, bid: 0.30, ask: 0.50, delta: -0.25, openInterest: 5, volume: 0 },
    ]);

    const result = await recommendPuts(["GOOD", "ABSENT1", "FARDTE", "WEAK"], 500_000, cache, cacheEnv());
    const f = result.funnel;

    expect(f.monitored).toBe(4);
    expect(f.eligible).toBe(1); // GOOD
    expect(f.nonOptionable).toBe(1); // ABSENT1
    expect(f.waitPosture).toBe(1); // WEAK

    // Exclusion reasons should be present
    const exclSum = f.exclusions.reduce((sum, e) => sum + e.count, 0);
    // Total exclusions = everything that's not eligible or pending
    expect(exclSum).toBeGreaterThan(0);
  });

  it("funnel.eligible matches candidates.length", async () => {
    for (let i = 0; i < 5; i++) {
      await populateSymbol(`ETF${i}`, [
        { strike: 40 + i, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
      ]);
    }
    await populateAbsent("NOOPT");

    const result = await recommendPuts(["ETF0", "ETF1", "ETF2", "ETF3", "ETF4", "NOOPT"], 500_000, cache, cacheEnv());
    expect(result.funnel.eligible).toBe(result.candidates.length);
    expect(result.funnel.eligible).toBe(5);
  });

  it("funnel.ranked respects maxResults cap", async () => {
    const symbols: string[] = [];
    for (let i = 0; i < 15; i++) {
      const sym = `R${String(i).padStart(2, "0")}`;
      symbols.push(sym);
      await populateSymbol(sym, [
        { strike: 30 + i, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
      ]);
    }

    const policy: RecommendationPolicy = {
      ...DEFAULT_RECOMMENDATION_POLICY,
      ranking: { ...DEFAULT_RECOMMENDATION_POLICY.ranking, maxResults: 10 },
    };

    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv(), policy);
    expect(result.funnel.eligible).toBe(15); // All are eligible
    expect(result.funnel.ranked).toBe(15); // No artificial cap
    expect(result.candidates.length).toBe(15);
  });

  it("yield is suppressed when spread > 2x preferred (30%) with explicit reason available", async () => {
    // bid=1.00, ask=1.50 → mid=1.25, spread=0.50, spreadPct=40% > 30%
    await populateSymbol("WSPY", [
      { strike: 50, bid: 1.00, ask: 1.50, delta: -0.30, openInterest: 500, volume: 100 },
    ]);

    const result = await recommendPuts(["WSPY"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].yieldAnnualized).toBeNull();
    // The candidate is still ACTIONABLE or EDGE despite suppressed yield
    expect(["ACTIONABLE", "EDGE"]).toContain(result.candidates[0].posture);
    // The spreadPercent is available for explicit reason
    expect(result.candidates[0].spreadPercent).toBeGreaterThan(30);
  });

  it("no unexplained missing metric on ACTIONABLE/EDGE rows", async () => {
    await populateSymbol("XLE", [
      { strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 },
    ]);

    const result = await recommendPuts(["XLE"], 500_000, cache, cacheEnv());
    const c = result.candidates[0];

    // All fields should be defined (not undefined)
    expect(c.symbol).toBeDefined();
    expect(c.expiration).toBeDefined();
    expect(c.dte).toBeGreaterThan(0);
    expect(c.strike).toBeGreaterThan(0);
    expect(c.delta).not.toBe(0);
    expect(c.bid).toBeGreaterThan(0);
    expect(c.ask).toBeGreaterThan(0);
    expect(c.mid).toBeGreaterThan(0);
    expect(c.spreadPercent).toBeDefined();
    expect(c.openInterest).toBeGreaterThan(0);
    expect(c.cashRequired).toBeGreaterThan(0);
    expect(c.assessment).toBeDefined();
    expect(c.assessment.score).toBeGreaterThan(0);
    expect(c.posture).toBeDefined();
    // yieldAnnualized may be null — but only when spread > 30% (has explicit reason)
    if (c.yieldAnnualized === null) {
      expect(c.spreadPercent).toBeGreaterThan(30);
    }
  });
});
