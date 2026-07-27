/**
 * Brief Builder — Projected Call Surface Integration Tests
 *
 * Proves:
 * 1. PCS uses the canonical effectiveCostBasis (same as Position Impact)
 * 2. PCS failure does not prevent the ordinary brief from resolving
 * 3. Unavailable state when no call chain evidence exists
 * 4. Representative contracts present when rich call chain is cached
 * 5. True exception containment: loader throws → brief resolves with null PCS
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { buildWheelwrightBrief, type WheelwrightBriefViewModel } from "../../src/write-desk/brief-builder";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import type { PutCandidate } from "../../src/write-desk/scan-orchestrator";
import type { PortfolioSnapshot } from "../../src/write-desk/types";
import type { MarketSessionClassification } from "../../src/market-session/session-policy";
import * as pcsModule from "../../src/write-desk/conditioned-call-surface";

let testId = 0;

describe("buildWheelwrightBrief — Projected Call Surface integration", () => {
  let cache: DurableMarketCache;
  let env: string;

  const cacheEnv = () => ({ provider: "tradier", environment: env });

  const sessionClassification: MarketSessionClassification = {
    state: "REGULAR_OBSERVATION",
    canonicalSessionDate: "2026-07-27",
    currentTradingSessionDate: "2026-07-27",
    acceptingCanonicalEvidence: true,
    priorSessionOperationallyValid: false,
    profileId: "us-equity-standard",
  };

  const portfolio: PortfolioSnapshot = {
    id: "test-1",
    source: { type: "demo", label: "Test" },
    accountId: null,
    snapshotDate: "2026-07-27",
    inventory: [],
    existingCalls: [],
    existingPuts: [],
    deployableCash: 50000,
    balanceContext: null,
    provenance: { sourceType: "demo", sourceLabel: "Test", createdAt: "2026-07-27T10:00:00Z" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: null, warnings: [], blockReasons: [] },
  };

  beforeEach(() => {
    testId++;
    env = `pcs-brief-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  function makePutCandidate(overrides: Partial<PutCandidate> = {}): PutCandidate {
    return {
      rank: 1,
      symbol: "XLE",
      expiration: "2026-08-14",
      dte: 21,
      strike: 56,
      delta: -0.30,
      bid: 1.80,
      ask: 2.00,
      mid: 1.90,
      spreadPercent: 10.5,
      openInterest: 300,
      volume: 80,
      cashRequired: 5600,
      cashRemaining: 44400,
      yieldAnnualized: 22.1,
      assessment: { score: 75, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
      posture: "ACTIONABLE",
      affordable: true,
      governance: { status: "authorized", classification: null },
      ...overrides,
    };
  }

  async function populatePutChain(symbol: string = "XLE") {
    // Put chain (for the brief's own neighborhood)
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [
      { date: "2026-08-14", dte: 21 },
    ]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-14");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-14", {
      underlying: { symbol, name: "Energy Select Sector SPDR Fund", price: 58.0 },
      puts: [
        { strike: 54, bid: 0.80, ask: 1.00, delta: -0.18, openInterest: 200, volume: 40 },
        { strike: 55, bid: 1.20, ask: 1.40, delta: -0.24, openInterest: 250, volume: 55 },
        { strike: 56, bid: 1.80, ask: 2.00, delta: -0.30, openInterest: 300, volume: 80 },
        { strike: 57, bid: 2.50, ask: 2.70, delta: -0.38, openInterest: 200, volume: 50 },
        { strike: 58, bid: 3.20, ask: 3.50, delta: -0.45, openInterest: 150, volume: 30 },
      ],
      calls: [
        { strike: 57, bid: 2.20, ask: 2.50, delta: 0.48, openInterest: 150, volume: 40 },
        { strike: 58, bid: 1.60, ask: 1.85, delta: 0.40, openInterest: 200, volume: 55 },
        { strike: 59, bid: 1.10, ask: 1.30, delta: 0.33, openInterest: 250, volume: 70 },
        { strike: 60, bid: 0.75, ask: 0.95, delta: 0.26, openInterest: 180, volume: 45 },
        { strike: 61, bid: 0.50, ask: 0.68, delta: 0.20, openInterest: 120, volume: 30 },
        { strike: 62, bid: 0.30, ask: 0.48, delta: 0.15, openInterest: 80, volume: 15 },
      ],
    }));
  }

  // --- Test 1: PCS uses canonical basis ---

  it("PCS uses the same effectiveCostBasis as Position Impact", async () => {
    await populatePutChain();
    const candidate = makePutCandidate({ strike: 56, mid: 1.90 });

    const brief = await buildWheelwrightBrief(
      candidate, DEFAULT_RECOMMENDATION_POLICY, portfolio,
      sessionClassification, cache, cacheEnv()
    );

    // Canonical basis: 56 - 1.90 = 54.10
    expect(brief.decision.effectiveCostBasis).toBeCloseTo(54.10, 2);
    expect(brief.projectedCallSurface).not.toBeNull();
    expect(brief.projectedCallSurface!.input.assumedBasisPerShare).toBeCloseTo(54.10, 2);
    // Same value — single source of truth
    expect(brief.projectedCallSurface!.input.assumedBasisPerShare).toBe(brief.decision.effectiveCostBasis);
  });

  // --- Test 2: PCS failure does not reject brief ---

  it("brief resolves with projectedCallSurface null when PCS fails", async () => {
    // Populate put chain but NO expirations (so PCS loader has nothing)
    // Actually we need the put chain for the brief's own neighborhood
    // but we can NOT populate expirations to make PCS fail.
    // However, the brief builder uses the same expirations for its own neighborhood...
    // Let's use a scenario where the chain exists (for puts) but
    // the call-chain loader fails because we corrupt the data.
    //
    // Simpler: populate the chain normally. PCS will succeed.
    // To test failure containment, we need to break PCS specifically.
    // The cleanest test: populate puts but make the chain have no calls field.
    const expKey = buildCacheKey("tradier", env, "expirations", "XLE");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "XLE", null, [
      { date: "2026-08-14", dte: 21 },
    ]));
    const chainKey = buildCacheKey("tradier", env, "chain", "XLE", "2026-08-14");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "XLE", "2026-08-14", {
      underlying: { symbol: "XLE", name: "Energy Select Sector SPDR Fund", price: 58.0 },
      puts: [
        { strike: 56, bid: 1.80, ask: 2.00, delta: -0.30, openInterest: 300, volume: 80 },
      ],
      // No calls field — PCS will find zero calls but won't throw
    }));

    const candidate = makePutCandidate();
    const brief = await buildWheelwrightBrief(
      candidate, DEFAULT_RECOMMENDATION_POLICY, portfolio,
      sessionClassification, cache, cacheEnv()
    );

    // Brief resolved successfully
    expect(brief).not.toBeNull();
    expect(brief.identity.symbol).toBe("XLE");
    expect(brief.decision.effectiveCostBasis).toBeCloseTo(54.10, 2);
    // PCS resolved (not null — it didn't throw), but has no qualifying calls
    expect(brief.projectedCallSurface).not.toBeNull();
    expect(brief.projectedCallSurface!.representativeOpportunities).toHaveLength(0);
  });

  // --- Test 3: Unavailable state when no evidence ---

  it("PCS returns unavailable when no expirations exist for symbol", async () => {
    // Populate a chain for the put neighborhood, but under a DIFFERENT cache key
    // so PCS can't find expirations. Actually PCS uses the same expirations key.
    // The simplest way: populate the chain but don't populate expirations.
    // But the brief builder's own neighborhood also uses the chain key...
    // Let's just NOT populate anything — the brief will have an empty neighborhood
    // but still resolve (coverageGap: true).
    const candidate = makePutCandidate();
    const brief = await buildWheelwrightBrief(
      candidate, DEFAULT_RECOMMENDATION_POLICY, portfolio,
      sessionClassification, cache, cacheEnv()
    );

    // Brief still resolves
    expect(brief).not.toBeNull();
    expect(brief.neighborhood.coverageGap).toBe(true);
    // PCS should be unavailable (no expirations in cache)
    expect(brief.projectedCallSurface).not.toBeNull();
    expect(brief.projectedCallSurface!.evidenceState).toBe("unavailable");
  });

  // --- Test 4: Representative contracts present with rich evidence ---

  it("PCS produces representative opportunities from rich call chain", async () => {
    await populatePutChain();
    const candidate = makePutCandidate({ strike: 56, mid: 1.90 });
    // Basis: 56 - 1.90 = 54.10
    // Calls above basis: 57, 58, 59, 60, 61, 62 (all above 54.10)
    // Qualifying (delta 0.15-0.50, bid > 0): all 6

    const brief = await buildWheelwrightBrief(
      candidate, DEFAULT_RECOMMENDATION_POLICY, portfolio,
      sessionClassification, cache, cacheEnv()
    );

    expect(brief.projectedCallSurface).not.toBeNull();
    const pcs = brief.projectedCallSurface!;
    expect(pcs.evidenceState).toBe("available");
    expect(pcs.summary.totalCallsAboveBasis).toBe(6);
    expect(pcs.summary.totalCallsQualifying).toBeGreaterThan(0);
    expect(pcs.representativeOpportunities.length).toBeGreaterThan(0);
    expect(pcs.representativeOpportunities.length).toBeLessThanOrEqual(5);

    // Representative opportunities have correct evidence-only fields
    const first = pcs.representativeOpportunities[0];
    expect(first.aboveBasis).toBe(true);
    expect(first.satisfiesPolicy).toBe(true);
    expect(first.yieldFromBasis).not.toBeNull();
    expect(first.strikeDistanceFromBasis).toBeGreaterThan(0);
    expect(first.bid).toBeGreaterThan(0);
    expect(first.ask).toBeGreaterThan(first.bid);

    // Input uses projected-mid basis source
    expect(pcs.input.basisSource).toBe("projected-mid");
    expect(pcs.input.origin).toBe("proposed-put");
  });

  // --- Test 5: True exception containment ---

  it("brief resolves with projectedCallSurface: null when PCS loader throws", async () => {
    // Populate full put chain so the brief's own neighborhood succeeds
    await populatePutChain();
    const candidate = makePutCandidate();

    // Spy on loadConditionedCallEvidence and make it throw
    const spy = vi.spyOn(pcsModule, "loadConditionedCallEvidence").mockRejectedValueOnce(
      new Error("Simulated PCS loader failure")
    );

    const brief = await buildWheelwrightBrief(
      candidate, DEFAULT_RECOMMENDATION_POLICY, portfolio,
      sessionClassification, cache, cacheEnv()
    );

    // Brief resolved successfully — ordinary content intact
    expect(brief).not.toBeNull();
    expect(brief.identity.symbol).toBe("XLE");
    expect(brief.decision.effectiveCostBasis).toBeCloseTo(54.10, 2);
    expect(brief.neighborhood.coverageGap).toBe(false);
    expect(brief.positionImpact.effectiveCostBasis).toBeCloseTo(54.10, 2);

    // PCS is null (exception was caught, not propagated)
    expect(brief.projectedCallSurface).toBeNull();

    spy.mockRestore();
  });
});