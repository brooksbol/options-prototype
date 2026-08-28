import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import { recommendBuyWrites } from "../../src/write-desk/recommend-buy-writes";
import { OpportunityAccumulator, type AccumulatorContext, type LastSeenMap } from "../../src/opportunity-history/accumulator";

const CTX: AccumulatorContext = {
  policyVersion: "routine-csp-v1",
  evidenceGeneration: 16244,
  sessionDate: "2026-08-28",
  sessionPosture: "FULL",
  provider: "tradier",
  environment: "production",
};

describe("opportunity-history emission integration", () => {
  let cache: DurableMarketCache;
  let counter = 0;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(async () => {
    await resetDB();
    resetDurableCache();
    cache = getDurableCache();
    env = `test-${counter++}`;
  });

  async function populateActionable(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-09-18", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-09-18");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-09-18", {
      underlying: { symbol, name: `${symbol} Test Fund`, price: 100 },
      puts: [{ strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
    }));
  }

  async function populateAbsent(symbol: string) {
    const absKey = buildCacheKey("tradier", env, "absence", symbol);
    await cache.put(cache.createRecord(absKey, "absence", "tradier", env, symbol, null, { reason: "no expirations" }));
  }

  it("BYTE-IDENTICAL: sink-present result deeply equals sink-absent result", async () => {
    await populateActionable("A1");
    await populateAbsent("N1");
    const symbols = ["A1", "N1", "MISSING"];

    const withoutSink = await recommendPuts(symbols, 500_000, cache, cacheEnv());

    const acc = new OpportunityAccumulator(CTX, new Map() as LastSeenMap);
    const withSink = await recommendPuts(symbols, 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });

    // Decision output must be byte-identical (computedAt differs — exclude it)
    const strip = (r: any) => ({ ...r, computedAt: undefined });
    expect(strip(withSink)).toEqual(strip(withoutSink));
  });

  it("sink captures a qualified surface fact with winner economics", async () => {
    await populateActionable("A1");
    const acc = new OpportunityAccumulator(CTX, new Map() as LastSeenMap);
    await recommendPuts(["A1"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });

    const batch = acc.build();
    const surf = batch!.surfaceObservations.find((o) => o.symbol === "A1" && o.expiration === "2026-09-18");
    expect(surf).toBeTruthy();
    expect(surf!.evaluationState).toBe("QUALIFIED_ACTIONABLE");
    expect(surf!.winner).not.toBeNull();
    expect(surf!.winner!.strike).toBe(50);
    expect(surf!.strategy).toBe("csp");
  });

  it("sink captures non_optionable as a symbol fact (no invented surface)", async () => {
    await populateAbsent("N1");
    const acc = new OpportunityAccumulator(CTX, new Map() as LastSeenMap);
    await recommendPuts(["N1"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });

    const batch = acc.build();
    const sy = batch!.symbolObservations.find((o) => o.symbol === "N1");
    expect(sy!.symbolState).toBe("NON_OPTIONABLE");
    // No surface row invented for a symbol with no surface
    expect(batch!.surfaceObservations.some((o) => o.symbol === "N1")).toBe(false);
  });

  it("sink captures pending symbol fact for a symbol with no evidence", async () => {
    const acc = new OpportunityAccumulator(CTX, new Map() as LastSeenMap);
    await recommendPuts(["MISSING"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });

    const batch = acc.build();
    const sy = batch!.symbolObservations.find((o) => o.symbol === "MISSING");
    expect(sy!.symbolState).toBe("NOT_EVALUATED_PENDING");
  });

  // --- Buy-write emission (Correction #2: no CSP-only selection bias) ---

  async function populateBuyWrite(symbol: string, callStrike: number, price: number) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-09-18", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-09-18");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-09-18", {
      underlying: { symbol, name: `${symbol} Test Fund`, price },
      // strike above price => positive appreciation (strategy-fit buy-write)
      calls: [{ strike: callStrike, bid: 2.00, ask: 2.20, delta: 0.35, openInterest: 800, volume: 200 }],
    }));
  }

  it("BYTE-IDENTICAL: buy-write sink-present result deeply equals sink-absent result", async () => {
    await populateBuyWrite("BW1", 105, 100);
    const symbols = ["BW1"];

    const withoutSink = await recommendBuyWrites(symbols, 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);
    const acc = new OpportunityAccumulator(CTX, new Map() as LastSeenMap);
    const withSink = await recommendBuyWrites(symbols, 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });

    const strip = (r: any) => ({ ...r, computedAt: undefined });
    expect(strip(withSink)).toEqual(strip(withoutSink));
  });

  it("buy-write sink captures a strategy-aware surface fact (strategy = buy_write)", async () => {
    await populateBuyWrite("BW1", 105, 100);
    const acc = new OpportunityAccumulator(CTX, new Map() as LastSeenMap);
    await recommendBuyWrites(["BW1"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });

    const batch = acc.build();
    const surf = batch!.surfaceObservations.find((o) => o.symbol === "BW1" && o.strategy === "buy_write");
    expect(surf).toBeTruthy();
    expect(["QUALIFIED_ACTIONABLE", "QUALIFIED_EDGE", "EVALUATED_WAIT"]).toContain(surf!.evaluationState);
    expect(surf!.winner).not.toBeNull();
    expect(surf!.winner!.strike).toBe(105);
  });

  it("CSP + BW share one epoch: a symbol useful only for BW is not recorded as useless", async () => {
    // XLE: qualifying put AND qualifying buy-write. GLDBW: buy-write only (put delta out of range).
    await populateActionable("XLE");
    // A symbol whose put is out of the admissible delta band but whose call is a fine buy-write.
    const expKey = buildCacheKey("tradier", env, "expirations", "BWONLY");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "BWONLY", null, [{ date: "2026-09-18", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "BWONLY", "2026-09-18");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "BWONLY", "2026-09-18", {
      underlying: { symbol: "BWONLY", name: "BW Only Fund", price: 100 },
      puts: [{ strike: 50, bid: 5.0, ask: 5.2, delta: -0.80, openInterest: 500, volume: 100 }], // delta 0.80 out of 0.15-0.50
      calls: [{ strike: 105, bid: 2.0, ask: 2.2, delta: 0.35, openInterest: 800, volume: 200 }],
    }));

    const acc = new OpportunityAccumulator(CTX, new Map() as LastSeenMap);
    await recommendPuts(["XLE", "BWONLY"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });
    await recommendBuyWrites(["XLE", "BWONLY"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { observationSink: acc });

    const batch = acc.build();
    // BWONLY: CSP surface should be no-delta-match; BW surface should be qualified.
    const bwOnlyCsp = batch!.surfaceObservations.find((o) => o.symbol === "BWONLY" && o.strategy === "csp");
    const bwOnlyBw = batch!.surfaceObservations.find((o) => o.symbol === "BWONLY" && o.strategy === "buy_write");
    expect(bwOnlyCsp!.evaluationState).toBe("EVALUATED_NO_DELTA_MATCH"); // CSP alone would call it useless
    expect(["QUALIFIED_ACTIONABLE", "QUALIFIED_EDGE", "EVALUATED_WAIT"]).toContain(bwOnlyBw!.evaluationState); // BW rescues it
    // Both strategies present in ONE epoch — no CSP-only selection bias.
    expect(batch!.epoch.epochId).toBeTruthy();
  });
});
