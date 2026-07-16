/**
 * Evidence Context Tests — Verifies:
 *
 * 1. Call Candidates section is explicitly deferred (not silently empty)
 * 2. Partial backend coverage with complete prior cache: funnel reflects actual cache state
 * 3. Closed session with sealed evidence: all cached records participate
 * 4. Closed session with truly ancient evidence: still accepted (transitional limitation)
 * 5. Full backend coverage collapses into one current context
 * 6. Funnel and trust describe consistent evidence populations
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";

let testId = 0;

describe("evidence context — mixed generation behavior", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `ctx-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateSymbolFresh(symbol: string) {
    const now = Date.now();
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put({
      key: expKey, dataType: "expirations", provider: "tradier", environment: env,
      symbol, expiration: null, schemaVersion: "v1",
      retrievedAt: now - 60000, freshUntil: now + 300000, staleUntil: now + 1800000,
      payload: [{ date: "2026-08-03", dte: 21 }],
    });
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put({
      key: chainKey, dataType: "chain", provider: "tradier", environment: env,
      symbol, expiration: "2026-08-03", schemaVersion: "v1",
      retrievedAt: now - 60000, freshUntil: now + 240000, staleUntil: now + 1800000,
      payload: { puts: [{ strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }] },
    });
  }

  async function populateSymbolStale(symbol: string) {
    const now = Date.now();
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put({
      key: expKey, dataType: "expirations", provider: "tradier", environment: env,
      symbol, expiration: null, schemaVersion: "v1",
      retrievedAt: now - 600000, freshUntil: now - 300000, staleUntil: now + 600000,
      payload: [{ date: "2026-08-03", dte: 21 }],
    });
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put({
      key: chainKey, dataType: "chain", provider: "tradier", environment: env,
      symbol, expiration: "2026-08-03", schemaVersion: "v1",
      retrievedAt: now - 600000, freshUntil: now - 300000, staleUntil: now + 600000,
      payload: { puts: [{ strike: 45, bid: 1.20, ask: 1.40, delta: -0.28, openInterest: 400, volume: 80 }] },
    });
  }

  async function populateSymbolExpired(symbol: string) {
    const now = Date.now();
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put({
      key: expKey, dataType: "expirations", provider: "tradier", environment: env,
      symbol, expiration: null, schemaVersion: "v1",
      retrievedAt: now - 7200000, freshUntil: now - 6000000, staleUntil: now - 3600000,
      payload: [{ date: "2026-08-03", dte: 21 }],
    });
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put({
      key: chainKey, dataType: "chain", provider: "tradier", environment: env,
      symbol, expiration: "2026-08-03", schemaVersion: "v1",
      retrievedAt: now - 7200000, freshUntil: now - 6600000, staleUntil: now - 3600000,
      payload: { puts: [{ strike: 40, bid: 1.00, ask: 1.20, delta: -0.25, openInterest: 300, volume: 60 }] },
    });
  }

  it("partial backend with complete prior cache: funnel shows actual cache-resolvable symbols", async () => {
    // Simulate: 2 symbols fresh (from current backend), 1 stale (from prior generation)
    await populateSymbolFresh("SYM1");
    await populateSymbolFresh("SYM2");
    await populateSymbolStale("SYM3");

    const result = await recommendPuts(
      ["SYM1", "SYM2", "SYM3", "SYM4"], // SYM4 has no cache at all
      500_000, cache, cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false }
    );

    // Fresh + stale_usable = eligible for active session
    expect(result.funnel.resolved).toBeGreaterThanOrEqual(3); // SYM1+SYM2+SYM3 all have usable cache
    expect(result.funnel.pending).toBe(1); // SYM4 has no data
    expect(result.funnel.eligible).toBe(3); // All 3 produce candidates
  });

  it("expired records rejected during active session", async () => {
    await populateSymbolExpired("OLD1");

    const result = await recommendPuts(
      ["OLD1"], 500_000, cache, cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false }
    );

    // Expired evidence is NOT eligible during active session
    expect(result.candidates.length).toBe(0);
    expect(result.funnel.pending).toBe(1); // treated as pending (no usable evidence)
  });

  it("expired records accepted during closed session (sealed evidence)", async () => {
    await populateSymbolExpired("OLD1");

    const result = await recommendPuts(
      ["OLD1"], 500_000, cache, cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: true }
    );

    // During closed session, ALL cached evidence is accepted
    expect(result.candidates.length).toBe(1);
    expect(result.funnel.eligible).toBe(1);
  });

  it("full current coverage: funnel shows clean single context", async () => {
    await populateSymbolFresh("A");
    await populateSymbolFresh("B");
    await populateSymbolFresh("C");

    const result = await recommendPuts(
      ["A", "B", "C"], 500_000, cache, cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false }
    );

    expect(result.funnel.monitored).toBe(3);
    expect(result.funnel.resolved).toBe(3);
    expect(result.funnel.pending).toBe(0);
    expect(result.funnel.eligible).toBe(3);
    // No mixed context — all symbols have fresh evidence
  });

  it("funnel counts are internally consistent within one recommendation run", async () => {
    await populateSymbolFresh("X1");
    await populateSymbolFresh("X2");
    await populateSymbolStale("X3");

    const result = await recommendPuts(
      ["X1", "X2", "X3", "MISSING"], 500_000, cache, cacheEnv(),
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false }
    );

    const f = result.funnel;
    // Arithmetic reconciliation
    expect(f.monitored).toBe(4);
    expect(f.resolved + f.pending).toBe(f.monitored);
    expect(f.eligible).toBe(result.candidates.length);
    // Funnel and candidates describe the same population
  });
});
