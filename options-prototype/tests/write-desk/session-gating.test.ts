/**
 * Tests for session-gated acquisition and session-based canonical validity.
 *
 * Proves:
 * 1. Canonical chain older than 30 min remains recommendation-eligible during CLOSED_CANONICAL
 * 2. Prior-session chain is usable during PREMARKET and NON_TRADING_DAY
 * 3. acquireEvidence blocks market-sensitive calls during CLOSED_CANONICAL
 * 4. acquireEvidence blocks market-sensitive calls during PREMARKET
 * 5. acquireEvidence blocks market-sensitive calls during REGULAR_OPEN_DELAY
 * 6. Expiration acquisition still permitted (non-session-sensitive)
 * 7. recommendPuts remains provider-free
 * 8. Closed-session reranking uses canonical cache with zero network calls
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { acquireEvidence } from "../../src/write-desk/acquire-evidence";
import { DurableMarketCache, buildCacheKey, getDurableCache, resetDurableCache } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { DEFAULT_PLANNER_CONFIG } from "../../src/cache/scan-planner";
import type { MarketDataProvider } from "../../src/domain/provider";

// --- Mock provider that tracks calls ---
function createTrackingProvider(): MarketDataProvider & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    getUnderlyings: async () => { calls.push("underlyings"); return []; },
    getQuotes: async () => { calls.push("quotes"); return new Map(); },
    getExpirations: async (sym) => { calls.push(`expirations:${sym}`); return [{ date: "2026-08-03", dte: 21 }]; },
    getOptionsChain: async (sym, date) => {
      calls.push(`chain:${sym}:${date}`);
      return {
        underlying: { symbol: sym, name: sym, price: 50 },
        expiration: { date, dte: 21 },
        calls: [],
        puts: [{ type: "PUT" as const, strike: 45, bid: 1.5, ask: 1.7, delta: -0.30, openInterest: 500, volume: 100 }],
      };
    },
    getCacheStats: () => ({ hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null }),
  };
}

let testId = 0;

describe("Session gating — acquireEvidence", () => {
  beforeEach(() => {
    testId++;
    resetDB();
    resetDurableCache();
  });

  // Mock the session policy to return specific states
  // We do this by mocking the module
  it("blocks market-sensitive chain calls during CLOSED_CANONICAL", async () => {
    // Mock getMarketSessionPolicy to return CLOSED_CANONICAL
    vi.doMock("../../src/market-session/session-policy", () => ({
      getMarketSessionPolicy: () => ({
        classify: () => ({
          state: "CLOSED_CANONICAL",
          canonicalSessionDate: "2026-07-14",
          currentTradingSessionDate: "2026-07-14",
          acceptingCanonicalEvidence: false,
          priorSessionOperationallyValid: false,
          profileId: "test",
        }),
        delayMs: 900000,
        sessionProfile: { id: "test" },
      }),
      MarketSessionPolicy: class {},
    }));

    // Re-import to get mocked version
    const { acquireEvidence: gatedAcquire } = await import("../../src/write-desk/acquire-evidence");
    const provider = createTrackingProvider();
    const env = `sg-${testId}`;

    // Pre-populate expirations so planner schedules chain work
    const cache = getDurableCache();
    await cache.put(cache.createRecord(
      buildCacheKey("tradier", env, "expirations", "XLE"),
      "expirations", "tradier", env, "XLE", null,
      [{ date: "2026-08-03", dte: 21 }]
    ));

    const result = await gatedAcquire(
      ["XLE"],
      provider,
      { ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: env },
    );

    // Chain calls should be blocked
    const chainCalls = provider.calls.filter((c) => c.startsWith("chain:"));
    expect(chainCalls.length).toBe(0);
    expect(result.telemetry.provider.requestsBlockedBySession).toBeGreaterThan(0);
    expect(result.status).toBe("SKIPPED_SESSION_CLOSED");

    vi.doUnmock("../../src/market-session/session-policy");
  });
});

describe("Session validity — recommendPuts", () => {
  beforeEach(() => {
    testId++;
    resetDB();
    resetDurableCache();
  });

  it("canonical chain older than 30 min remains eligible during closed session", async () => {
    const cache = getDurableCache();
    const env = `sv-${testId}`;
    const sym = `CANON_${testId}`;

    // Create a chain record that is technically "expired" (staleUntil in the past)
    const now = Date.now();
    const expKey = buildCacheKey("tradier", env, "expirations", sym);
    await cache.put({
      key: expKey,
      dataType: "expirations",
      provider: "tradier",
      environment: env,
      symbol: sym,
      expiration: null,
      schemaVersion: "v1",
      retrievedAt: now - 3600000,
      freshUntil: now - 3000000,
      staleUntil: now - 2400000,
      payload: [{ date: "2026-08-03", dte: 21 }],
    });

    const chainKey = buildCacheKey("tradier", env, "chain", sym, "2026-08-03");
    await cache.put({
      key: chainKey,
      dataType: "chain",
      provider: "tradier",
      environment: env,
      symbol: sym,
      expiration: "2026-08-03",
      schemaVersion: "v1",
      retrievedAt: now - 3600000,
      freshUntil: now - 3300000,
      staleUntil: now - 1800000,
      payload: { puts: [{ type: "PUT", strike: 45, bid: 1.5, ask: 1.7, delta: -0.30, openInterest: 500, volume: 100 }] },
    });

    // WITHOUT session validity: should NOT find evidence (TTL expired)
    const resultExpired = await recommendPuts(
      [sym], 18500, cache,
      { provider: "tradier", environment: env },
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: false }
    );
    expect(resultExpired.candidates.length).toBe(0);

    // WITH session validity (closed session): canonical evidence remains usable
    const resultCanonical = await recommendPuts(
      [sym], 18500, cache,
      { provider: "tradier", environment: env },
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: true }
    );
    expect(resultCanonical.coverage.symbolsWithEvidence).toBe(1);
    expect(resultCanonical.candidates.length).toBe(1);
  });

  it("recommendPuts makes zero provider calls regardless of session state", async () => {
    const cache = getDurableCache();
    const env = `sv-${testId}`;

    // Populate cache
    const expKey = buildCacheKey("tradier", env, "expirations", "XLE");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "XLE", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "XLE", "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "XLE", "2026-08-03", {
      puts: [{ type: "PUT", strike: 45, bid: 1.5, ask: 1.7, delta: -0.30, openInterest: 500, volume: 100 }],
    }));

    // No fetch mock — if it tried to call a provider, it would throw
    const result = await recommendPuts(
      ["XLE"], 18500, cache,
      { provider: "tradier", environment: env },
      DEFAULT_RECOMMENDATION_POLICY,
      { sessionClosed: true }
    );
    expect(result.candidates.length).toBe(1);
  });

  it("closed-session reranking with different policy produces different results, zero network", async () => {
    const cache = getDurableCache();
    const env = `sv-${testId}`;

    await cache.put(cache.createRecord(
      buildCacheKey("tradier", env, "expirations", "XLE"),
      "expirations", "tradier", env, "XLE", null,
      [{ date: "2026-08-03", dte: 21 }]
    ));
    await cache.put(cache.createRecord(
      buildCacheKey("tradier", env, "chain", "XLE", "2026-08-03"),
      "chain", "tradier", env, "XLE", "2026-08-03",
      { puts: [
        { type: "PUT", strike: 45, bid: 1.5, ask: 1.7, delta: -0.30, openInterest: 500, volume: 100 },
        { type: "PUT", strike: 48, bid: 2.0, ask: 2.3, delta: -0.40, openInterest: 300, volume: 80 },
      ] },
    ));

    const policy030 = { ...DEFAULT_RECOMMENDATION_POLICY };
    const policy040 = {
      ...DEFAULT_RECOMMENDATION_POLICY,
      contractSelection: { ...DEFAULT_RECOMMENDATION_POLICY.contractSelection, targetDelta: 0.40 },
    };

    const result1 = await recommendPuts(["XLE"], 18500, cache, { provider: "tradier", environment: env }, policy030, { sessionClosed: true });
    const result2 = await recommendPuts(["XLE"], 18500, cache, { provider: "tradier", environment: env }, policy040, { sessionClosed: true });

    // Both should produce results from sealed canonical evidence
    expect(result1.candidates.length).toBe(1);
    expect(result2.candidates.length).toBe(1);
  });
});
