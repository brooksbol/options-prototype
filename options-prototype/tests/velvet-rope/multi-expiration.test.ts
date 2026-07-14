/**
 * Tests for multi-expiration evaluation semantics.
 *
 * Validates:
 * - All eligible expirations are evaluated independently
 * - Admission determined from best expiration, not single arbitrary one
 * - Yield suppressed when spread exceeds hard limit
 * - Observational volume below threshold not labeled "pass"
 * - Deterministic ranking and selection
 * - Full audit serialization with expiration-level evidence
 */

import { describe, it, expect } from "vitest";
import {
  selectEligibleExpirations,
  selectAdmissionContract,
  evaluatePerSideCriteria,
  evaluateSymbolAdmission,
} from "../../src/velvet-rope/evaluate";
import { DEFAULT_ADMISSION_POLICY } from "../../src/velvet-rope/policy";
import type { Expiration, OptionContract, OptionsChain, Underlying } from "../../src/domain/types";
import type { MarketDataProvider } from "../../src/domain/provider";
import type { ContractEvidence, AdmissionPolicy } from "../../src/velvet-rope/types";

// --- Helpers ---

function makeExpiration(dte: number): Expiration {
  const d = new Date();
  d.setDate(d.getDate() + dte);
  return { date: d.toISOString().split("T")[0], dte };
}

function makeContract(overrides: Partial<OptionContract> & { type: "CALL" | "PUT"; strike: number }): OptionContract {
  return { bid: 1.00, ask: 1.20, delta: 0.30, openInterest: 200, volume: 50, ...overrides };
}

function makeContractEvidence(overrides?: Partial<ContractEvidence>): ContractEvidence {
  return {
    strike: 55,
    delta: 0.30,
    bid: 1.00,
    ask: 1.20,
    mid: 1.10,
    spread: 0.20,
    spreadPercent: 10.0,
    openInterest: 200,
    volume: 50,
    iv: 0.28,
    annualizedYield: 25.0,
    dte: 14,
    ...overrides,
  };
}

function healthyChain(expiration: Expiration, underlyingPrice = 50): OptionsChain {
  return {
    underlying: { symbol: "TEST", name: "Test ETF", price: underlyingPrice },
    expiration,
    calls: [
      makeContract({ type: "CALL", strike: 55, delta: 0.30, bid: 1.00, ask: 1.10, openInterest: 500, volume: 100 }),
      makeContract({ type: "CALL", strike: 57, delta: 0.20, bid: 0.60, ask: 0.70, openInterest: 300, volume: 80 }),
    ],
    puts: [
      makeContract({ type: "PUT", strike: 45, delta: -0.30, bid: 0.90, ask: 1.00, openInterest: 400, volume: 90 }),
      makeContract({ type: "PUT", strike: 43, delta: -0.20, bid: 0.50, ask: 0.60, openInterest: 350, volume: 60 }),
    ],
  };
}

function illiquidChain(expiration: Expiration, underlyingPrice = 50): OptionsChain {
  return {
    underlying: { symbol: "TEST", name: "Test ETF", price: underlyingPrice },
    expiration,
    calls: [
      makeContract({ type: "CALL", strike: 55, delta: 0.30, bid: 0.10, ask: 0.80, openInterest: 15, volume: 2 }),
    ],
    puts: [
      makeContract({ type: "PUT", strike: 45, delta: -0.30, bid: 0.20, ask: 0.90, openInterest: 10, volume: 1 }),
    ],
  };
}

function makeMockProvider(chainsByDate: Record<string, OptionsChain>, expirations: Expiration[]): MarketDataProvider {
  return {
    getUnderlyings: async () => [{ symbol: "TEST", name: "Test ETF", price: 50 }],
    getQuotes: async () => new Map([["TEST", 50]]),
    getExpirations: async () => expirations,
    getOptionsChain: async (_symbol: string, date: string) => {
      if (chainsByDate[date]) return chainsByDate[date];
      throw new Error(`No chain for ${date}`);
    },
  };
}

// --- selectEligibleExpirations ---

describe("selectEligibleExpirations", () => {
  const range = { min: 7, max: 45 };

  it("returns all expirations within DTE range, sorted ascending", () => {
    const exps = [makeExpiration(30), makeExpiration(14), makeExpiration(7), makeExpiration(45), makeExpiration(60)];
    const result = selectEligibleExpirations(exps, range);
    expect(result.map((e) => e.dte)).toEqual([7, 14, 30, 45]);
  });

  it("excludes expirations below minimum DTE", () => {
    const exps = [makeExpiration(3), makeExpiration(5), makeExpiration(14)];
    const result = selectEligibleExpirations(exps, range);
    expect(result.map((e) => e.dte)).toEqual([14]);
  });

  it("excludes expirations above maximum DTE", () => {
    const exps = [makeExpiration(14), makeExpiration(50), makeExpiration(90)];
    const result = selectEligibleExpirations(exps, range);
    expect(result.map((e) => e.dte)).toEqual([14]);
  });

  it("returns empty when no expirations in range", () => {
    const exps = [makeExpiration(3), makeExpiration(60)];
    const result = selectEligibleExpirations(exps, range);
    expect(result).toEqual([]);
  });

  it("handles descending input order correctly", () => {
    const exps = [makeExpiration(45), makeExpiration(30), makeExpiration(14), makeExpiration(7)];
    const result = selectEligibleExpirations(exps, range);
    expect(result.map((e) => e.dte)).toEqual([7, 14, 30, 45]);
  });

  it("does not accidentally select last item when expirations are descending", () => {
    // Regression: old code would pick inRange[inRange.length - 1] which was always max DTE
    const exps = [makeExpiration(45), makeExpiration(14), makeExpiration(7)];
    const result = selectEligibleExpirations(exps, range);
    // Should include all three, not just 45
    expect(result.length).toBe(3);
    expect(result[0].dte).toBe(7);
  });
});

// --- Multi-expiration evaluation ---

describe("evaluateSymbolAdmission — multi-expiration", () => {
  const policy = DEFAULT_ADMISSION_POLICY;

  it("admits when one expiration passes among several failures", async () => {
    const exp14 = makeExpiration(14);
    const exp30 = makeExpiration(30);
    const exp45 = makeExpiration(45);

    const chains: Record<string, OptionsChain> = {
      [exp14.date]: healthyChain(exp14),
      [exp30.date]: illiquidChain(exp30),
      [exp45.date]: illiquidChain(exp45),
    };

    const provider = makeMockProvider(chains, [exp14, exp30, exp45]);
    const result = await evaluateSymbolAdmission("TEST", provider, policy);

    expect(result.outcome).toBe("admit");
    expect(result.winningExpiration).not.toBeNull();
    expect(result.winningExpiration!.dte).toBe(14);
    expect(result.expirationEvaluations.length).toBe(3);
  });

  it("rejects when all expirations fail", async () => {
    const exp14 = makeExpiration(14);
    const exp30 = makeExpiration(30);

    const chains: Record<string, OptionsChain> = {
      [exp14.date]: illiquidChain(exp14),
      [exp30.date]: illiquidChain(exp30),
    };

    const provider = makeMockProvider(chains, [exp14, exp30]);
    const result = await evaluateSymbolAdmission("TEST", provider, policy);

    expect(result.outcome).toBe("reject");
    expect(result.winningExpiration).toBeNull();
    expect(result.expirationEvaluations.length).toBe(2);
    expect(result.explanation).toContain("No admissible call/put pair");
    expect(result.explanation).toContain("2 expirations");
  });

  it("call passing while put fails → expiration is incomplete (sideRequirement=both)", async () => {
    const exp = makeExpiration(21);
    const chain: OptionsChain = {
      underlying: { symbol: "TEST", name: "Test ETF", price: 50 },
      expiration: exp,
      calls: [
        makeContract({ type: "CALL", strike: 55, delta: 0.30, bid: 1.00, ask: 1.10, openInterest: 500, volume: 100 }),
      ],
      puts: [
        // All zero-bid puts → no_valid_quotes
        makeContract({ type: "PUT", strike: 45, delta: -0.30, bid: 0, ask: 0.90, openInterest: 100, volume: 50 }),
      ],
    };

    const provider = makeMockProvider({ [exp.date]: chain }, [exp]);
    const result = await evaluateSymbolAdmission("TEST", provider, policy);

    expect(result.expirationEvaluations[0].outcome).toBe("incomplete");
    expect(result.outcome).toBe("insufficient_evidence");
  });

  it("deterministic selection when multiple expirations pass — prefers lower spread then lower DTE", async () => {
    const exp14 = makeExpiration(14);
    const exp21 = makeExpiration(21);

    // Both healthy but exp14 has tighter spreads
    const chains: Record<string, OptionsChain> = {
      [exp14.date]: {
        underlying: { symbol: "TEST", name: "Test ETF", price: 50 },
        expiration: exp14,
        calls: [makeContract({ type: "CALL", strike: 55, delta: 0.30, bid: 1.05, ask: 1.10, openInterest: 500, volume: 100 })],
        puts: [makeContract({ type: "PUT", strike: 45, delta: -0.30, bid: 0.95, ask: 1.00, openInterest: 400, volume: 90 })],
      },
      [exp21.date]: {
        underlying: { symbol: "TEST", name: "Test ETF", price: 50 },
        expiration: exp21,
        calls: [makeContract({ type: "CALL", strike: 55, delta: 0.30, bid: 1.00, ask: 1.20, openInterest: 500, volume: 100 })],
        puts: [makeContract({ type: "PUT", strike: 45, delta: -0.30, bid: 0.80, ask: 1.10, openInterest: 400, volume: 90 })],
      },
    };

    const provider = makeMockProvider(chains, [exp14, exp21]);
    const result = await evaluateSymbolAdmission("TEST", provider, policy);

    expect(result.outcome).toBe("admit");
    // exp14 should win — lower spread and lower DTE
    expect(result.winningExpiration!.dte).toBe(14);
  });

  it("audit record contains expiration-level evidence and winning expiration", async () => {
    const exp14 = makeExpiration(14);
    const exp30 = makeExpiration(30);

    const chains: Record<string, OptionsChain> = {
      [exp14.date]: healthyChain(exp14),
      [exp30.date]: illiquidChain(exp30),
    };

    const provider = makeMockProvider(chains, [exp14, exp30]);
    const result = await evaluateSymbolAdmission("TEST", provider, policy);

    // Verify serializable (JSON round-trip)
    const serialized = JSON.parse(JSON.stringify(result));
    expect(serialized.expirationEvaluations).toHaveLength(2);
    expect(serialized.winningExpiration).not.toBeNull();
    expect(serialized.winningExpiration.dte).toBe(14);

    // Each expiration has evidence
    for (const ev of serialized.expirationEvaluations) {
      expect(ev.date).toBeDefined();
      expect(ev.dte).toBeDefined();
      expect(ev.outcome).toBeDefined();
      expect(ev.callEvidence).toBeDefined();
      expect(ev.putEvidence).toBeDefined();
    }
  });

  it("prevents accidental maximum-DTE selection", async () => {
    // Regression test: old code always picked the last (max DTE) expiration.
    // New code should evaluate all and pick the best passing one.
    const exp7 = makeExpiration(7);
    const exp45 = makeExpiration(45);

    const chains: Record<string, OptionsChain> = {
      [exp7.date]: healthyChain(exp7),
      [exp45.date]: illiquidChain(exp45),
    };

    const provider = makeMockProvider(chains, [exp7, exp45]);
    const result = await evaluateSymbolAdmission("TEST", provider, policy);

    expect(result.outcome).toBe("admit");
    // Must NOT select 45 DTE (which would reject)
    expect(result.winningExpiration!.dte).toBe(7);
  });
});

// --- Yield suppression ---

describe("evaluatePerSideCriteria — yield suppression", () => {
  const policy = DEFAULT_ADMISSION_POLICY;

  it("suppresses midpoint yield when spread exceeds hard limit", () => {
    // Spread is 40% — way above 15% hard limit
    const evidence = makeContractEvidence({ spreadPercent: 40.0, annualizedYield: 50.0 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const yieldResult = results.find((r) => r.criterion === "minYieldAtTargetDelta");
    expect(yieldResult!.status).toBe("unavailable");
    expect(yieldResult!.measuredValue).toBeNull();
    expect(yieldResult!.explanation).toContain("suppressed");
  });

  it("evaluates yield normally when spread is within limit", () => {
    const evidence = makeContractEvidence({ spreadPercent: 10.0, annualizedYield: 25.0 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const yieldResult = results.find((r) => r.criterion === "minYieldAtTargetDelta");
    expect(yieldResult!.status).toBe("pass");
    expect(yieldResult!.measuredValue).toBe(25.0);
  });
});

// --- Observational volume semantics ---

describe("evaluatePerSideCriteria — observational volume", () => {
  const policy = DEFAULT_ADMISSION_POLICY;

  it("reports observed_below when volume is below threshold", () => {
    const evidence = makeContractEvidence({ volume: 3 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const volResult = results.find((r) => r.criterion === "minOptionVolume");
    expect(volResult!.status).toBe("observed_below");
    expect(volResult!.severity).toBe("observational");
    expect(volResult!.explanation).toContain("below observational threshold");
  });

  it("reports pass when volume meets threshold", () => {
    const evidence = makeContractEvidence({ volume: 100 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const volResult = results.find((r) => r.criterion === "minOptionVolume");
    expect(volResult!.status).toBe("pass");
  });
});
