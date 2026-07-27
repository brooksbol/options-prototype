/**
 * Call Brief Builder Tests — Proves:
 *
 * 1. buildCallBrief produces complete view model from cached chain + candidate
 * 2. Call strike neighborhood extracts correct 5-contract window from calls
 * 3. Neighborhood tags classify contracts correctly
 * 4. Position economics propagate into position context (unrealized calculation)
 * 5. Null economics produces null unrealized values (graceful degradation)
 * 6. Provenance reflects session classification
 * 7. Instrument name resolves from chain (not just symbol echo)
 * 8. Coverage gap when chain is missing
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { buildCallBrief, type CallBriefViewModel } from "../../src/write-desk/call-brief-builder";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import type { CallCandidate } from "../../src/write-desk/scan-orchestrator";
import type { MarketSessionClassification } from "../../src/market-session/session-policy";

let testId = 0;

describe("buildCallBrief", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  const sessionClassification: MarketSessionClassification = {
    state: "REGULAR_OBSERVATION",
    canonicalSessionDate: "2026-07-21",
    currentTradingSessionDate: "2026-07-21",
    acceptingCanonicalEvidence: true,
    priorSessionOperationallyValid: false,
    profileId: "us-equity-standard",
  };

  beforeEach(() => {
    testId++;
    env = `cb-test-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  function makeCallCandidate(overrides: Partial<CallCandidate> = {}): CallCandidate {
    return {
      rank: 1,
      symbol: "XLE",
      expiration: "2026-08-03",
      dte: 21,
      strike: 60,
      delta: 0.30,
      bid: 1.20,
      ask: 1.40,
      mid: 1.30,
      spreadPercent: 15.4,
      openInterest: 300,
      volume: 80,
      freeShares: 200,
      maxContracts: 2,
      premiumPerContract: 130,
      yieldAnnualized: 38.9,
      assessment: {
        score: 75,
        posture: "ACTIONABLE",
        components: [
          { name: "Spread", measured: 15.4, reference: 15, score: 99, weight: 0.40 },
          { name: "Open Interest", measured: 300, reference: 50, score: 100, weight: 0.25 },
          { name: "Volume", measured: 80, reference: 10, score: 100, weight: 0.15 },
          { name: "Premium", measured: 1.20, reference: 0.10, score: 100, weight: 0.20 },
        ],
        hardNoReason: null,
        policyVersion: "v1-provisional",
      },
      posture: "ACTIONABLE",
      strikeAbovePrice: true,
      underlyingPrice: 58.0,
      economics: {
        averageCostPerShare: 52.50,
        costBasis: 10500,
        marketValue: 11600,
      },
      ...overrides,
    };
  }

  async function populateCallChain(
    symbol: string = "XLE",
    calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }> | null = null,
    underlyingPrice: number = 58.0,
    expDate: string = "2026-08-03",
    name: string = "Energy Select Sector SPDR Fund"
  ) {
    const defaultCalls = [
      { strike: 57, bid: 2.50, ask: 2.80, delta: 0.55, openInterest: 150, volume: 40 },
      { strike: 58, bid: 1.90, ask: 2.10, delta: 0.45, openInterest: 250, volume: 60 },
      { strike: 59, bid: 1.50, ask: 1.70, delta: 0.38, openInterest: 280, volume: 70 },
      { strike: 60, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 300, volume: 80 },
      { strike: 61, bid: 0.90, ask: 1.10, delta: 0.24, openInterest: 200, volume: 50 },
      { strike: 62, bid: 0.60, ask: 0.80, delta: 0.18, openInterest: 120, volume: 30 },
      { strike: 63, bid: 0.30, ask: 0.50, delta: 0.12, openInterest: 80, volume: 20 },
    ];

    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, expDate, {
      underlying: { symbol, name, price: underlyingPrice },
      calls: calls ?? defaultCalls,
      puts: [],
    }));
  }

  // --- Test: Complete view model construction ---

  it("produces complete view model from cached chain and candidate", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    // Identity
    expect(brief.identity.symbol).toBe("XLE");
    expect(brief.identity.name).toBe("Energy Select Sector SPDR Fund");
    expect(brief.identity.strike).toBe(60);
    expect(brief.identity.expiration).toBe("2026-08-03");
    expect(brief.identity.dte).toBe(21);
    expect(brief.identity.side).toBe("call");
    expect(brief.identity.rank).toBe(1);
    expect(brief.identity.posture).toBe("ACTIONABLE");

    // Decision
    expect(brief.decision.mid).toBe(1.30);
    expect(brief.decision.premiumPerContract).toBe(130);
    expect(brief.decision.yieldAnnualized).toBe(38.9);
    expect(brief.decision.maxContracts).toBe(2);
    expect(brief.decision.strikeAbovePrice).toBe(true);
    expect(brief.decision.spreadPercent).toBeCloseTo(15.4, 1);

    // Delta fit
    expect(brief.deltaFit.selectedDelta).toBeCloseTo(0.30, 2);
    expect(brief.deltaFit.category).toBe("preferred_band");
  });

  // --- Test: Neighborhood extracts 5-contract window ---

  it("extracts 5-contract neighborhood window around selected strike", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({ strike: 60 });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.neighborhood.contracts.length).toBe(5);
    expect(brief.neighborhood.coverageGap).toBe(false);

    // Window should be strikes 58, 59, 60, 61, 62 (2 below, selected, 2 above)
    const strikes = brief.neighborhood.contracts.map(c => c.strike);
    expect(strikes).toEqual([58, 59, 60, 61, 62]);

    // Selected contract should be tagged
    const selected = brief.neighborhood.contracts.find(c => c.isSelected);
    expect(selected).toBeDefined();
    expect(selected!.strike).toBe(60);
    expect(selected!.tag).toBe("SELECTED");
  });

  // --- Test: Neighbor tags ---

  it("classifies neighborhood contracts with correct tags", async () => {
    await populateCallChain("XLE", [
      { strike: 58, bid: 0, ask: 0.10, delta: 0.45, openInterest: 250, volume: 60 },     // LOW_PREMIUM (zero bid)
      { strike: 59, bid: 1.50, ask: 1.70, delta: 0, openInterest: 280, volume: 70 },      // NO_GREEKS
      { strike: 60, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 300, volume: 80 },   // SELECTED
      { strike: 61, bid: 0.90, ask: 1.10, delta: 0.24, openInterest: 200, volume: 50 },   // valid alt
      { strike: 62, bid: 0.60, ask: 0.80, delta: 0.18, openInterest: 120, volume: 30 },   // valid alt
    ]);
    const candidate = makeCallCandidate({ strike: 60 });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    const tagMap = Object.fromEntries(brief.neighborhood.contracts.map(c => [c.strike, c.tag]));
    expect(tagMap[58]).toBe("LOW_PREMIUM");
    expect(tagMap[59]).toBe("NO_GREEKS");
    expect(tagMap[60]).toBe("SELECTED");
    // 61 and 62 should be some valid alternative tag
    expect(["OUTSIDE_TARGET", "LOWER_YIELD", "LOWER_EXEC", "LOW_OI"]).toContain(tagMap[61]);
    expect(["OUTSIDE_TARGET", "LOWER_YIELD", "LOWER_EXEC", "LOW_DELTA"]).toContain(tagMap[62]);
  });

  // --- Test: Position economics propagation ---

  it("computes unrealized gain from position economics", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({
      economics: { averageCostPerShare: 52.50, costBasis: 10500, marketValue: 11600 },
      underlyingPrice: 58.0,
      freeShares: 200,
    });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.positionContext.averageCostPerShare).toBe(52.50);
    expect(brief.positionContext.underlyingPrice).toBe(58.0);
    expect(brief.positionContext.freeShares).toBe(200);
    expect(brief.positionContext.maxContracts).toBe(2);
    // Unrealized: 58.0 - 52.50 = 5.50 per share
    expect(brief.positionContext.unrealizedPerShare).toBeCloseTo(5.50, 2);
    // Total: 5.50 * 200 = 1100
    expect(brief.positionContext.unrealizedTotal).toBeCloseTo(1100, 0);
  });

  // --- Test: Null economics graceful degradation ---

  it("produces null unrealized values when economics are absent", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({ economics: null });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.positionContext.averageCostPerShare).toBeNull();
    expect(brief.positionContext.unrealizedPerShare).toBeNull();
    expect(brief.positionContext.unrealizedTotal).toBeNull();
    // Non-economics fields still present
    expect(brief.positionContext.freeShares).toBe(200);
    expect(brief.positionContext.underlyingPrice).toBe(58.0);
  });

  // --- Test: Provenance from session classification ---

  it("reflects session classification in provenance", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.provenance.provider).toBe("tradier");
    expect(brief.provenance.canonicalSessionDate).toBe("2026-07-21");
    expect(brief.provenance.sessionState).toBe("REGULAR_OBSERVATION");
    expect(brief.provenance.evidenceStatus).toBe("Current-session canonical");
  });

  it("reflects prior-session provenance when not accepting new evidence", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate();
    const closedSession: MarketSessionClassification = {
      ...sessionClassification,
      state: "CLOSED_CANONICAL",
      acceptingCanonicalEvidence: false,
      priorSessionOperationallyValid: true,
    };

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, closedSession, cache, cacheEnv());

    expect(brief.provenance.sessionState).toBe("CLOSED_CANONICAL");
    expect(brief.provenance.evidenceStatus).toBe("Prior-session canonical (sealed)");
  });

  // --- Test: Instrument name resolution ---

  it("resolves instrument name from chain (not just symbol echo)", async () => {
    await populateCallChain("XLE", null, 58.0, "2026-08-03", "Energy Select Sector SPDR Fund");
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.identity.name).toBe("Energy Select Sector SPDR Fund");
  });

  it("returns null name when chain name is just the symbol", async () => {
    await populateCallChain("XLE", null, 58.0, "2026-08-03", "XLE");
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.identity.name).toBeNull();
  });

  // --- Test: Coverage gap ---

  it("reports coverage gap when chain is not in cache", async () => {
    // Do NOT populate cache
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.neighborhood.coverageGap).toBe(true);
    expect(brief.neighborhood.contracts.length).toBe(0);
    // Other sections still populated from candidate directly
    expect(brief.identity.symbol).toBe("XLE");
    expect(brief.decision.mid).toBe(1.30);
    expect(brief.positionContext.freeShares).toBe(200);
  });

  // --- Test: Negative unrealized (loss) ---

  it("computes negative unrealized when underwater", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({
      economics: { averageCostPerShare: 62.00, costBasis: 12400, marketValue: 11600 },
      underlyingPrice: 58.0,
      freeShares: 200,
    });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    // Unrealized: 58.0 - 62.0 = -4.00 per share
    expect(brief.positionContext.unrealizedPerShare).toBeCloseTo(-4.00, 2);
    // Total: -4.00 * 200 = -800
    expect(brief.positionContext.unrealizedTotal).toBeCloseTo(-800, 0);
  });

  // --- Posture Explanation Tests ---

  it("produces posture explanation with weighted_score derivation for ACTIONABLE", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.postureExplanation.posture).toBe("ACTIONABLE");
    expect(brief.postureExplanation.derivation).toBe("weighted_score");
    expect(brief.postureExplanation.score).toBe(75);
    expect(brief.postureExplanation.scoreRange).not.toBeNull();
    expect(brief.postureExplanation.scoreRange!.lowerInclusive).toBe(65);
    expect(brief.postureExplanation.contributors.length).toBe(4);
  });

  it("produces posture explanation for EDGE call candidate", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({
      assessment: {
        score: 48,
        posture: "EDGE",
        components: [
          { name: "Spread", measured: 25, reference: 15, score: 78, weight: 0.40 },
          { name: "Open Interest", measured: 20, reference: 50, score: 40, weight: 0.25 },
          { name: "Volume", measured: 5, reference: 10, score: 50, weight: 0.15 },
          { name: "Premium", measured: 0.30, reference: 0.10, score: 100, weight: 0.20 },
        ],
        hardNoReason: null,
        policyVersion: "v1-provisional",
      },
      posture: "EDGE",
    });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.postureExplanation.posture).toBe("EDGE");
    expect(brief.postureExplanation.score).toBe(48);
    expect(brief.postureExplanation.scoreRange!.nextPosture).toBe("ACTIONABLE");
    expect(brief.postureExplanation.scoreRange!.nextThreshold).toBe(65);
  });

  it("produces posture explanation for WAIT call candidate", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({
      assessment: {
        score: 25,
        posture: "WAIT",
        components: [
          { name: "Spread", measured: 45, reference: 15, score: 33, weight: 0.40 },
          { name: "Open Interest", measured: 5, reference: 50, score: 10, weight: 0.25 },
          { name: "Volume", measured: 1, reference: 10, score: 10, weight: 0.15 },
          { name: "Premium", measured: 0.15, reference: 0.10, score: 100, weight: 0.20 },
        ],
        hardNoReason: null,
        policyVersion: "v1-provisional",
      },
      posture: "WAIT",
    });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.postureExplanation.posture).toBe("WAIT");
    expect(brief.postureExplanation.score).toBe(25);
    expect(brief.postureExplanation.scoreRange!.nextPosture).toBe("EDGE");
    expect(brief.postureExplanation.scoreRange!.nextThreshold).toBe(35);
  });

  it("call posture explanation has null governance (not applicable, not fabricated)", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.postureExplanation.governance).toBeNull();
  });

  it("removes rank metadata — not present in posture explanation", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate();

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    // The postureExplanation model has no rank or tablePosition fields
    expect((brief.postureExplanation as any).rank).toBeUndefined();
    expect((brief.postureExplanation as any).tablePosition).toBeUndefined();
    expect((brief.postureExplanation as any).rankingObjective).toBeUndefined();
  });

  // --- Projected Called-Away Economics Tests ---

  it("computes positive projected gain when strike + mid > basis", async () => {
    await populateCallChain();
    // strike=60, mid=1.30, basis=52.50
    // effective sale = 60 + 1.30 = 61.30
    // gain/share = 61.30 - 52.50 = 8.80
    // maxContracts=2, covered=200
    // total = 8.80 * 200 = 1760
    const candidate = makeCallCandidate({ strike: 60, mid: 1.30, maxContracts: 2, economics: { averageCostPerShare: 52.50, costBasis: 10500, marketValue: 11600 } });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    const ca = brief.positionContext.projectedCalledAway!;
    expect(ca).not.toBeNull();
    expect(ca.premiumAssumption).toBe("midpoint");
    expect(ca.modeledPremiumPerShare).toBeCloseTo(1.30, 2);
    expect(ca.projectedEffectiveSalePricePerShare).toBeCloseTo(61.30, 2);
    expect(ca.costBasisPerShare).toBeCloseTo(52.50, 2);
    expect(ca.projectedGainPerShare).toBeCloseTo(8.80, 2);
    expect(ca.maximumContracts).toBe(2);
    expect(ca.coveredSharesAtMaximumDeployment).toBe(200);
    expect(ca.projectedTotalGainAtMaximumDeployment).toBeCloseTo(1760, 0);
    expect(ca.unavailableReason).toBeNull();
  });

  it("computes negative projected loss when strike + mid < basis", async () => {
    await populateCallChain();
    // strike=55, mid=0.50, basis=58.00
    // effective sale = 55 + 0.50 = 55.50
    // gain/share = 55.50 - 58.00 = -2.50
    const candidate = makeCallCandidate({ strike: 55, mid: 0.50, maxContracts: 1, economics: { averageCostPerShare: 58.00, costBasis: 11600, marketValue: 11000 } });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    const ca = brief.positionContext.projectedCalledAway!;
    expect(ca.projectedGainPerShare).toBeCloseTo(-2.50, 2);
    expect(ca.coveredSharesAtMaximumDeployment).toBe(100);
    expect(ca.projectedTotalGainAtMaximumDeployment).toBeCloseTo(-250, 0);
  });

  it("shows partial economics when basis is unavailable", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({ strike: 60, mid: 1.30, economics: null });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    const ca = brief.positionContext.projectedCalledAway!;
    expect(ca).not.toBeNull();
    // Sale price is computable even without basis
    expect(ca.projectedEffectiveSalePricePerShare).toBeCloseTo(61.30, 2);
    expect(ca.modeledPremiumPerShare).toBeCloseTo(1.30, 2);
    // Gain/loss unavailable
    expect(ca.costBasisPerShare).toBeNull();
    expect(ca.projectedGainPerShare).toBeNull();
    expect(ca.projectedTotalGainAtMaximumDeployment).toBeNull();
    expect(ca.unavailableReason).toContain("cost basis");
  });

  it("returns null projectedCalledAway when mid is zero or negative", async () => {
    await populateCallChain();
    const candidate = makeCallCandidate({ mid: 0, bid: 0, ask: 0 });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    expect(brief.positionContext.projectedCalledAway).toBeNull();
  });

  it("covered shares use maxContracts × 100, not freeShares", async () => {
    await populateCallChain();
    // freeShares=300 but maxContracts=2 (e.g., some shares below quantization boundary after encumbrance)
    const candidate = makeCallCandidate({ freeShares: 300, maxContracts: 2 });

    const brief = await buildCallBrief(candidate, DEFAULT_RECOMMENDATION_POLICY, sessionClassification, cache, cacheEnv());

    const ca = brief.positionContext.projectedCalledAway!;
    expect(ca.coveredSharesAtMaximumDeployment).toBe(200); // 2 × 100, not 300
  });
});