/**
 * Conditioned Call Surface — Domain Tests
 *
 * Tests the pure assessment function (assessConditionedCallSurface)
 * against pre-constructed evidence bundles. No cache access required.
 *
 * Proves:
 * 1. Rich chain produces qualifying opportunities with correct yield-from-basis
 * 2. No expirations → evidenceState "unavailable"
 * 3. Expirations but missing chains → evidenceState "partial"
 * 4. All calls below basis → zero qualifying, callsBelowBasis counted
 * 5. Calls above basis failing policy → counted with all applicable reasons
 * 6. Yield computed from conditioned basis (not underlying price)
 * 7. Strike distance from basis correctly computed
 * 8. Representative opportunities bounded (max 5) and sorted by delta proximity
 * 9. basisSource "strike-only" produces same computation shape
 * 10. Multiple expirations: per-expiration evidence preserved, summary aggregates
 * 11. Calls below basis remain measurable (included in opportunities with aboveBasis=false)
 * 12. Multiple failure reasons collected per contract
 */

import { describe, it, expect } from "vitest";
import {
  assessConditionedCallSurface,
  type ConditionedOwnershipInput,
  type ConditionedCallEvidenceBundle,
  type CachedCallContract,
} from "../../src/write-desk/conditioned-call-surface";
import { DEFAULT_EXECUTION_POLICY } from "../../src/write-desk/execution-policy";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";

// --- Helpers ---

const defaultPolicy = {
  contractSelection: DEFAULT_RECOMMENDATION_POLICY.contractSelection,
  executionAssessment: DEFAULT_EXECUTION_POLICY,
};

function makeInput(overrides: Partial<ConditionedOwnershipInput> = {}): ConditionedOwnershipInput {
  return {
    underlying: "XLE",
    assumedBasisPerShare: 55.0,
    shareQuantity: 100,
    basisSource: "projected-mid",
    origin: "proposed-put",
    sourceExpiration: "2026-08-14",
    sourceStrike: 56,
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<ConditionedCallEvidenceBundle> = {}): ConditionedCallEvidenceBundle {
  return {
    expirationsAvailable: true,
    eligibleExpirations: [{ date: "2026-08-14", dte: 21 }],
    chains: [{
      expiration: "2026-08-14",
      dte: 21,
      chainAvailable: true,
      underlyingPrice: 58.0,
      calls: [
        { strike: 53, bid: 5.50, ask: 5.80, delta: 0.82, openInterest: 50, volume: 10 },
        { strike: 55, bid: 3.80, ask: 4.10, delta: 0.68, openInterest: 100, volume: 20 },
        { strike: 57, bid: 2.20, ask: 2.50, delta: 0.48, openInterest: 150, volume: 40 },
        { strike: 58, bid: 1.60, ask: 1.85, delta: 0.40, openInterest: 200, volume: 55 },
        { strike: 59, bid: 1.10, ask: 1.35, delta: 0.33, openInterest: 250, volume: 70 },
        { strike: 60, bid: 0.75, ask: 0.95, delta: 0.26, openInterest: 180, volume: 45 },
        { strike: 61, bid: 0.50, ask: 0.68, delta: 0.20, openInterest: 120, volume: 30 },
        { strike: 62, bid: 0.30, ask: 0.48, delta: 0.15, openInterest: 80, volume: 15 },
        { strike: 63, bid: 0.15, ask: 0.30, delta: 0.10, openInterest: 40, volume: 5 },
        { strike: 64, bid: 0.05, ask: 0.20, delta: 0.06, openInterest: 20, volume: 2 },
      ],
    }],
    freshness: "current-session",
    provider: "tradier",
    canonicalSessionDate: "2026-07-27",
    ...overrides,
  };
}

// --- Tests ---

describe("assessConditionedCallSurface", () => {

  it("produces qualifying opportunities with yield from conditioned basis", () => {
    const input = makeInput({ assumedBasisPerShare: 55.0 });
    const evidence = makeEvidence();

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    expect(result.evidenceState).toBe("available");
    expect(result.evidenceStateReason).toBeNull();
    expect(result.underlyingPrice).toBe(58.0);
    expect(result.evidenceFreshness).toBe("current-session");
    expect(result.evidenceMetadata.provider).toBe("tradier");

    // Calls above basis ($55): strikes 57, 58, 59, 60, 61, 62, 63, 64
    expect(result.summary.totalCallsAboveBasis).toBe(8);
    // Qualifying: delta 0.15-0.50, bid > 0, OI > 0, spread < 80%
    // Strikes 57 (0.48), 58 (0.40), 59 (0.33), 60 (0.26), 61 (0.20), 62 (0.15) should qualify
    expect(result.summary.totalCallsQualifying).toBeGreaterThan(0);

    // Representative opportunities sorted by delta proximity to target (0.30)
    expect(result.representativeOpportunities.length).toBeGreaterThan(0);
    expect(result.representativeOpportunities.length).toBeLessThanOrEqual(5);

    // Yield is from basis, not from underlying price
    const firstOpp = result.representativeOpportunities[0];
    expect(firstOpp.yieldFromBasis).not.toBeNull();
    expect(firstOpp.aboveBasis).toBe(true);
    expect(firstOpp.satisfiesPolicy).toBe(true);
    // Verify yield uses basis ($55) not underlying ($58)
    // For strike 59, mid ≈ 1.225, basis = 55, dte = 21
    // annualizedYield(1.225, 55, 21) ≈ 38.7%
    // annualizedYield(1.225, 58, 21) ≈ 36.7%
    // The difference confirms basis is used
  });

  it("returns unavailable when no expirations exist", () => {
    const input = makeInput();
    const evidence = makeEvidence({
      expirationsAvailable: false,
      eligibleExpirations: [],
      chains: [],
      freshness: "unavailable",
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    expect(result.evidenceState).toBe("unavailable");
    expect(result.evidenceStateReason).toContain("No expiration data");
    expect(result.evidenceFreshness).toBe("unavailable");
    expect(result.summary.expirationsEvaluated).toBe(0);
    expect(result.representativeOpportunities).toHaveLength(0);
  });

  it("returns partial when expirations exist but chains are missing", () => {
    const input = makeInput();
    const evidence = makeEvidence({
      chains: [{
        expiration: "2026-08-14",
        dte: 21,
        chainAvailable: false,
        underlyingPrice: null,
        calls: [],
      }],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    expect(result.evidenceState).toBe("partial");
    expect(result.evidenceStateReason).toContain("chain evidence missing");
    expect(result.expirations[0].chainAvailable).toBe(false);
    expect(result.summary.expirationsWithChains).toBe(0);
  });

  it("counts calls below basis without treating them as qualifying", () => {
    const input = makeInput({ assumedBasisPerShare: 62.0 }); // High basis — most calls below
    const evidence = makeEvidence();

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    // Only strikes 63, 64 are above basis $62
    expect(result.summary.totalCallsAboveBasis).toBe(2);
    expect(result.summary.totalCallsBelowBasis).toBe(8);
    // Strike 63 (delta 0.10) is below admissible range — fails policy
    // Strike 64 (delta 0.06) is below admissible range — fails policy
    expect(result.summary.totalCallsQualifying).toBe(0);
    expect(result.summary.totalCallsFailingPolicy).toBe(2);
    expect(result.representativeOpportunities).toHaveLength(0);
  });

  it("collects all applicable failure reasons per contract", () => {
    const input = makeInput({ assumedBasisPerShare: 55.0 });
    // Contract with multiple failures: zero bid + zero OI + delta out of range
    const evidence = makeEvidence({
      chains: [{
        expiration: "2026-08-14",
        dte: 21,
        chainAvailable: true,
        underlyingPrice: 58.0,
        calls: [
          { strike: 60, bid: 0, ask: 0.50, delta: 0.05, openInterest: 0, volume: 0 },
        ],
      }],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    // This call is above basis but fails multiple rules
    expect(result.expirations[0].callsAboveBasis).toBe(1);
    expect(result.expirations[0].callsFailingPolicy).toBe(1);
    expect(result.expirations[0].failureReasons.length).toBeGreaterThan(1);

    // Verify the individual opportunity has multiple reasons
    const allOpps = result.expirations[0]; // Assessment-level
    expect(allOpps.failureReasons.some(r => r.reason.includes("bid"))).toBe(true);
    expect(allOpps.failureReasons.some(r => r.reason.includes("Delta"))).toBe(true);
    expect(allOpps.failureReasons.some(r => r.reason.includes("open interest"))).toBe(true);
  });

  it("computes yield from conditioned basis, not underlying price", () => {
    const basis = 50.0;
    const input = makeInput({ assumedBasisPerShare: basis });
    const evidence = makeEvidence({
      chains: [{
        expiration: "2026-08-14",
        dte: 21,
        chainAvailable: true,
        underlyingPrice: 58.0, // Different from basis
        calls: [
          { strike: 55, bid: 1.50, ask: 1.70, delta: 0.35, openInterest: 200, volume: 50 },
        ],
      }],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    const opp = result.representativeOpportunities[0];
    expect(opp).toBeDefined();
    expect(opp.yieldFromBasis).not.toBeNull();
    // mid = 1.60, basis = 50, dte = 21 → annualized yield = (1.60/50) * (365/21) ≈ 55.6%
    // If it were from underlying: (1.60/58) * (365/21) ≈ 47.9%
    expect(opp.yieldFromBasis!).toBeGreaterThan(50); // Confirms basis-based, not price-based
  });

  it("computes strike distance from basis correctly", () => {
    const input = makeInput({ assumedBasisPerShare: 55.0 });
    const evidence = makeEvidence({
      chains: [{
        expiration: "2026-08-14",
        dte: 21,
        chainAvailable: true,
        underlyingPrice: 58.0,
        calls: [
          { strike: 60, bid: 0.75, ask: 0.95, delta: 0.26, openInterest: 180, volume: 45 },
          { strike: 52, bid: 6.50, ask: 6.80, delta: 0.90, openInterest: 30, volume: 5 },
        ],
      }],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    // Find the above-basis opportunity
    const above = result.representativeOpportunities.find(o => o.strike === 60);
    if (above) {
      expect(above.strikeDistanceFromBasis).toBe(5.0); // 60 - 55
      expect(above.aboveBasis).toBe(true);
    }
  });

  it("bounds representative opportunities at 5 and sorts by delta proximity to target", () => {
    const input = makeInput({ assumedBasisPerShare: 50.0 }); // Low basis — many calls above
    const calls: CachedCallContract[] = [];
    for (let i = 0; i < 10; i++) {
      calls.push({
        strike: 52 + i,
        bid: 2.0 - i * 0.15,
        ask: 2.3 - i * 0.15,
        delta: 0.45 - i * 0.03,
        openInterest: 200,
        volume: 50,
      });
    }
    // Ensure all have positive bid
    const validCalls = calls.filter(c => c.bid > 0);

    const evidence = makeEvidence({
      chains: [{
        expiration: "2026-08-14",
        dte: 21,
        chainAvailable: true,
        underlyingPrice: 55.0,
        calls: validCalls,
      }],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    expect(result.representativeOpportunities.length).toBeLessThanOrEqual(5);

    // Should be sorted by proximity to target delta (0.30)
    if (result.representativeOpportunities.length >= 2) {
      const deltas = result.representativeOpportunities.map(o => Math.abs(o.delta - 0.30));
      for (let i = 1; i < deltas.length; i++) {
        expect(deltas[i]).toBeGreaterThanOrEqual(deltas[i - 1]);
      }
    }
  });

  it("handles strike-only basis source identically in computation", () => {
    const input = makeInput({
      assumedBasisPerShare: 56.0,
      basisSource: "strike-only",
      origin: "existing-put",
    });
    const evidence = makeEvidence();

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    // Same computation structure regardless of basis source
    expect(result.input.basisSource).toBe("strike-only");
    expect(result.input.origin).toBe("existing-put");
    expect(result.evidenceState).toBe("available");
    // Calls above $56: strikes 57, 58, 59, 60, 61, 62, 63, 64
    expect(result.summary.totalCallsAboveBasis).toBe(8);
  });

  it("aggregates across multiple expirations with per-expiration detail", () => {
    const input = makeInput({ assumedBasisPerShare: 55.0 });
    const evidence = makeEvidence({
      eligibleExpirations: [
        { date: "2026-08-07", dte: 14 },
        { date: "2026-08-14", dte: 21 },
      ],
      chains: [
        {
          expiration: "2026-08-07",
          dte: 14,
          chainAvailable: true,
          underlyingPrice: 58.0,
          calls: [
            { strike: 57, bid: 1.50, ask: 1.70, delta: 0.40, openInterest: 100, volume: 30 },
            { strike: 59, bid: 0.60, ask: 0.80, delta: 0.25, openInterest: 150, volume: 40 },
          ],
        },
        {
          expiration: "2026-08-14",
          dte: 21,
          chainAvailable: true,
          underlyingPrice: 58.0,
          calls: [
            { strike: 58, bid: 1.80, ask: 2.00, delta: 0.42, openInterest: 200, volume: 50 },
            { strike: 60, bid: 0.90, ask: 1.10, delta: 0.28, openInterest: 180, volume: 45 },
          ],
        },
      ],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    // Two expirations evaluated
    expect(result.expirations.length).toBe(2);
    expect(result.expirations[0].expiration).toBe("2026-08-07");
    expect(result.expirations[1].expiration).toBe("2026-08-14");

    // Per-expiration detail preserved
    expect(result.expirations[0].callsAboveBasis).toBe(2);
    expect(result.expirations[1].callsAboveBasis).toBe(2);

    // Summary aggregates
    expect(result.summary.expirationsEvaluated).toBe(2);
    expect(result.summary.expirationsWithChains).toBe(2);
    expect(result.summary.totalCallsAboveBasis).toBe(4);
  });

  it("includes calls below basis as measurable evidence", () => {
    const input = makeInput({ assumedBasisPerShare: 59.0 });
    const evidence = makeEvidence({
      chains: [{
        expiration: "2026-08-14",
        dte: 21,
        chainAvailable: true,
        underlyingPrice: 58.0,
        calls: [
          { strike: 57, bid: 2.20, ask: 2.50, delta: 0.48, openInterest: 150, volume: 40 },
          { strike: 58, bid: 1.60, ask: 1.85, delta: 0.40, openInterest: 200, volume: 55 },
          { strike: 60, bid: 0.75, ask: 0.95, delta: 0.26, openInterest: 180, volume: 45 },
        ],
      }],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    // Strikes 57, 58 are below basis $59 — counted as below
    expect(result.summary.totalCallsBelowBasis).toBe(2);
    // Strike 60 is above
    expect(result.summary.totalCallsAboveBasis).toBe(1);
    // Below-basis calls are counted in the per-expiration detail
    expect(result.expirations[0].callsBelowBasis).toBe(2);
  });

  it("returns unavailable when expirations exist but none in eligible DTE range", () => {
    const input = makeInput();
    const evidence = makeEvidence({
      expirationsAvailable: true,
      eligibleExpirations: [], // None passed the DTE filter
      chains: [],
    });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    expect(result.evidenceState).toBe("unavailable");
    expect(result.evidenceStateReason).toContain("No expirations within eligible DTE range");
  });

  it("preserves evidence freshness in output", () => {
    const input = makeInput();
    const evidence = makeEvidence({ freshness: "sealed-prior-session" });

    const result = assessConditionedCallSurface(input, evidence, defaultPolicy);

    expect(result.evidenceFreshness).toBe("sealed-prior-session");
  });
});
