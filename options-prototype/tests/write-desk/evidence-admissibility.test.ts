/**
 * Evidence Admissibility Tests
 *
 * Reproduces the 2026-08-11 live-session failure:
 * - Backend retrieval during pre-admissibility window (09:30–09:45 ET) should NOT
 *   produce recommendations during an active regular session.
 * - Repeated snapshot merges must NOT reset evidence age.
 * - Post-boundary retrieval becomes admissible.
 * - Mixed population produces recommendations only from admissible symbols.
 * - Hydration count is based on evidence coverage, not recommendation count.
 * - Recent snapshot publication cannot turn old evidence Current.
 * - Closed-session sealed evidence remains usable regardless of age.
 * - Progressive hydration can produce a valid partial candidate set.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { recommendBuyWrites } from "../../src/write-desk/recommend-buy-writes";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import { deriveTrustState } from "../../src/write-desk/trust-state";

let testId = 0;

// Simulated times (epoch ms) — relative to now for TTL correctness
const NOW = Date.now();
const MARKET_OPEN = NOW - 30 * 60 * 1000;                    // 30 min ago (simulated 09:30)
const ADMISSIBILITY_BOUNDARY = NOW - 15 * 60 * 1000;         // 15 min ago (simulated 09:45)
const PRE_BOUNDARY_RETRIEVAL = NOW - 28 * 60 * 1000;         // 28 min ago (before boundary, simulated 09:32)
const POST_BOUNDARY_RETRIEVAL = NOW - 2 * 60 * 1000;         // 2 min ago (after boundary, within fresh TTL)
const LATE_RETRIEVAL = NOW - 1 * 60 * 1000;                  // 1 min ago (well after boundary, fresh)

describe("evidence admissibility gate", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `admissibility-test-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateSymbol(
    symbol: string,
    retrievedAtMs: number,
    calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }> = [],
    puts: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }> = [],
    underlyingPrice: number = 58.0,
    expDate: string = "2026-08-21",
    dte: number = 10
  ) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    const expRecord = cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: expDate, dte }], retrievedAtMs);
    await cache.put(expRecord);

    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    const chainRecord = cache.createRecord(chainKey, "chain", "tradier", env, symbol, expDate, {
      underlying: { symbol, name: `${symbol} Fund`, price: underlyingPrice },
      calls,
      puts,
    }, retrievedAtMs);
    await cache.put(chainRecord);
  }

  const GOOD_PUT = { strike: 55, bid: 1.50, ask: 1.80, delta: -0.30, openInterest: 200, volume: 50 };
  const GOOD_CALL = { strike: 60, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 300, volume: 80 };

  // --- Test 1: Pre-boundary evidence is inadmissible ---

  it("evidence retrieved during pre-admissibility window does NOT produce recommendations", async () => {
    // Simulates: backend fetched at 09:32 (before 09:45 boundary)
    await populateSymbol("STALE", PRE_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);

    const result = await recommendPuts(
      ["STALE"],
      10000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    // Evidence exists but is pre-boundary → inadmissible → no candidates
    expect(result.candidates.length).toBe(0);
    expect(result.waitCandidates.length).toBe(0);
    expect(result.evidenceHydration.inadmissible).toBe(1);
    expect(result.evidenceHydration.admissible).toBe(0);
  });

  // --- Test 2: Merging same record repeatedly does NOT reset age ---

  it("repeated cache.put with explicit retrievedAtMs preserves original retrieval time", async () => {
    const key = buildCacheKey("tradier", env, "chain", "XLE", "2026-08-21");

    // First write with pre-boundary time
    const record1 = cache.createRecord(key, "chain", "tradier", env, "XLE", "2026-08-21", { test: 1 }, PRE_BOUNDARY_RETRIEVAL);
    await cache.put(record1);

    // Second write simulating re-merge from same snapshot (same payload, same timestamp)
    const record2 = cache.createRecord(key, "chain", "tradier", env, "XLE", "2026-08-21", { test: 1 }, PRE_BOUNDARY_RETRIEVAL);
    await cache.put(record2);

    const stored = await cache.get(key);
    expect(stored).not.toBeNull();
    expect(stored!.retrievedAt).toBe(PRE_BOUNDARY_RETRIEVAL);
    // TTLs should be relative to retrievedAt, not to Date.now()
    expect(stored!.freshUntil).toBe(PRE_BOUNDARY_RETRIEVAL + 5 * 60 * 1000); // chain fresh = 5 min
  });

  // --- Test 3: Post-boundary retrieval becomes admissible ---

  it("evidence retrieved after admissibility boundary produces recommendations", async () => {
    await populateSymbol("FRESH", POST_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);

    const result = await recommendPuts(
      ["FRESH"],
      10000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].symbol).toBe("FRESH");
    expect(result.evidenceHydration.admissible).toBe(1);
    expect(result.evidenceHydration.inadmissible).toBe(0);
  });

  // --- Test 4: Mixed population — only admissible symbols produce candidates ---

  it("mixed-age population produces recommendations only from admissible evidence", async () => {
    // STALE: retrieved at 09:32 (pre-boundary)
    await populateSymbol("STALE_A", PRE_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);
    // FRESH: retrieved at 09:48 (post-boundary)
    await populateSymbol("FRESH_B", POST_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);
    // LATE: retrieved at 10:05 (well post-boundary)
    await populateSymbol("LATE_C", LATE_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);

    const result = await recommendPuts(
      ["STALE_A", "FRESH_B", "LATE_C"],
      50000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    // Only FRESH_B and LATE_C should produce candidates
    const symbols = result.candidates.map(c => c.symbol);
    expect(symbols).not.toContain("STALE_A");
    expect(symbols).toContain("FRESH_B");
    expect(symbols).toContain("LATE_C");
    expect(result.evidenceHydration.admissible).toBe(2);
    expect(result.evidenceHydration.inadmissible).toBe(1);
    expect(result.evidenceHydration.total).toBe(3);
  });

  // --- Test 5: Hydration count is evidence-based, not recommendation-based ---

  it("hydration tracks evidence admissibility regardless of whether recommendations are produced", async () => {
    // Symbol with admissible evidence but contracts that produce no recommendation
    // (e.g., all contracts outside delta range)
    await populateSymbol("NO_REC", POST_BOUNDARY_RETRIEVAL,
      [{ strike: 60, bid: 1.00, ask: 1.20, delta: 0.90, openInterest: 100, volume: 50 }], // delta 0.90 = outside admissible
      [{ strike: 55, bid: 1.00, ask: 1.20, delta: -0.90, openInterest: 100, volume: 50 }], // delta 0.90 = outside admissible
    );

    const result = await recommendPuts(
      ["NO_REC"],
      10000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    // No recommendations (all contracts outside delta range)
    expect(result.candidates.length).toBe(0);
    // But hydration counts this symbol as admissible (evidence was fresh enough)
    expect(result.evidenceHydration.admissible).toBe(1);
  });

  // --- Test 6: Publication freshness alone cannot establish Current ---

  it("recent generatedAt does NOT make trust Complete when hydration is below 100%", () => {
    const result = deriveTrustState({
      coverage: { ready: 960, absent: 340, pending: 0, failed: 0 },
      universe: 1300,
      generatedAt: new Date(Date.now() - 30_000).toISOString(), // 30s ago — very fresh publication
      serviceAvailable: true,
      sessionClosed: false,
      isAcquiring: false,
      evidenceHydration: { admissible: 100, inadmissible: 860, total: 960 },
    });

    // Despite recent publication, hydration is only 100/960 — NOT complete
    expect(result.trust).not.toBe("current");
    expect(result.trustLabel).toContain("Searching");
  });

  // --- Test 7: Closed-session sealed evidence remains usable ---

  it("sealed evidence is usable regardless of age during closed session", async () => {
    // Evidence from yesterday (far pre-boundary) — but session is closed
    await populateSymbol("SEALED", PRE_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);

    const result = await recommendPuts(
      ["SEALED"],
      10000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: true, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    // Sealed session bypasses admissibility — evidence is valid
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].symbol).toBe("SEALED");
  });

  // --- Test 8: Progressive hydration produces valid partial candidate set ---

  it("partial hydration produces valid recommendations from only the admissible subset", async () => {
    // 3 symbols: 1 admissible, 2 inadmissible
    await populateSymbol("ADM_1", POST_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT], 58.0);
    await populateSymbol("INADM_1", PRE_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT], 45.0);
    await populateSymbol("INADM_2", PRE_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT], 30.0);

    const result = await recommendPuts(
      ["ADM_1", "INADM_1", "INADM_2"],
      50000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    // Only ADM_1 produces a candidate — the partial set is valid
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].symbol).toBe("ADM_1");
    // Hydration reflects partial state
    expect(result.evidenceHydration.admissible).toBe(1);
    expect(result.evidenceHydration.inadmissible).toBe(2);
    expect(result.evidenceHydration.total).toBe(3);
  });

  // --- Test 9: Buy-Write engine also respects admissibility ---

  it("buy-write engine rejects pre-boundary evidence", async () => {
    await populateSymbol("BW_STALE", PRE_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);

    const result = await recommendBuyWrites(
      ["BW_STALE"],
      10000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    expect(result.candidates.length).toBe(0);
  });

  it("buy-write engine accepts post-boundary evidence", async () => {
    await populateSymbol("BW_FRESH", POST_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);

    const result = await recommendBuyWrites(
      ["BW_FRESH"],
      10000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: ADMISSIBILITY_BOUNDARY }
    );

    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].symbol).toBe("BW_FRESH");
  });

  // --- Test 10: No admissibility boundary during sealed session (null) ---

  it("null admissibility boundary accepts all evidence (sealed/pre-market behavior)", async () => {
    await populateSymbol("ANY_AGE", PRE_BOUNDARY_RETRIEVAL, [GOOD_CALL], [GOOD_PUT]);

    const result = await recommendPuts(
      ["ANY_AGE"],
      10000,
      cache,
      cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false, admissibilityBoundaryMs: null }
    );

    // null boundary = no admissibility check (only TTL freshness applies)
    // The record was created with retrievedAt = PRE_BOUNDARY_RETRIEVAL
    // Its TTL (5min fresh, 30min stale) is relative to that timestamp
    // At current time it may be expired — that's a separate freshness concern
    // The admissibility gate specifically should NOT reject it
    expect(result.evidenceHydration.inadmissible).toBe(0);
  });
});

// --- Trust State Hydration Tests ---

describe("trust-state hydration semantics", () => {

  it("fully hydrated active session with fresh evidence shows Complete", () => {
    const result = deriveTrustState({
      coverage: { ready: 960, absent: 340, pending: 0, failed: 0 },
      universe: 1300,
      generatedAt: new Date(Date.now() - 30_000).toISOString(),
      serviceAvailable: true,
      sessionClosed: false,
      isAcquiring: false,
      evidenceHydration: { admissible: 960, inadmissible: 0, total: 960 },
    });

    expect(result.trust).toBe("current");
    expect(result.trustLabel).toBe("Complete");
  });

  it("partially hydrated shows Searching with admissible count", () => {
    const result = deriveTrustState({
      coverage: { ready: 960, absent: 340, pending: 0, failed: 0 },
      universe: 1300,
      generatedAt: new Date(Date.now() - 30_000).toISOString(),
      serviceAvailable: true,
      sessionClosed: false,
      isAcquiring: true,
      evidenceHydration: { admissible: 311, inadmissible: 649, total: 960 },
    });

    expect(result.trustLabel).toBe("Searching");
    expect(result.covered).toBe(311);
    expect(result.universe).toBe(960);
  });

  it("sealed session ignores hydration data", () => {
    const result = deriveTrustState({
      coverage: { ready: 960, absent: 340, pending: 0, failed: 0 },
      universe: 1300,
      generatedAt: new Date(Date.now() - 30_000).toISOString(),
      serviceAvailable: true,
      sessionClosed: true,
      isAcquiring: false,
      evidenceHydration: { admissible: 0, inadmissible: 960, total: 960 },
    });

    // Sealed session: hydration doesn't matter
    expect(result.trust).toBe("current");
    expect(result.trustLabel).not.toContain("Searching");
  });

  it("100% admissible but stale snapshot shows Refreshing when acquiring", () => {
    const result = deriveTrustState({
      coverage: { ready: 960, absent: 340, pending: 0, failed: 0 },
      universe: 1300,
      generatedAt: new Date(Date.now() - 10 * 60_000).toISOString(), // 10 min ago (> 5min CURRENT threshold)
      serviceAvailable: true,
      sessionClosed: false,
      isAcquiring: true,
      evidenceHydration: { admissible: 960, inadmissible: 0, total: 960 },
    });

    expect(result.trustLabel).toBe("Refreshing");
    expect(result.trust).toBe("stale_but_usable");
  });

  it("100% admissible but stale snapshot shows Stale when NOT acquiring", () => {
    const result = deriveTrustState({
      coverage: { ready: 960, absent: 340, pending: 0, failed: 0 },
      universe: 1300,
      generatedAt: new Date(Date.now() - 10 * 60_000).toISOString(), // 10 min ago
      serviceAvailable: true,
      sessionClosed: false,
      isAcquiring: false, // NOT actively acquiring
      evidenceHydration: { admissible: 960, inadmissible: 0, total: 960 },
    });

    // Cannot claim Refreshing without observed acquisition activity
    expect(result.trustLabel).toBe("Stale");
    expect(result.trust).toBe("stale_but_usable");
  });

  it("even one inadmissible symbol prevents Complete", () => {
    const result = deriveTrustState({
      coverage: { ready: 960, absent: 340, pending: 0, failed: 0 },
      universe: 1300,
      generatedAt: new Date(Date.now() - 30_000).toISOString(),
      serviceAvailable: true,
      sessionClosed: false,
      isAcquiring: false,
      evidenceHydration: { admissible: 959, inadmissible: 1, total: 960 },
    });

    // 959/960 is NOT 100% — still Searching
    expect(result.trustLabel).toBe("Searching");
    expect(result.trust).toBe("partially_current");
  });
});
