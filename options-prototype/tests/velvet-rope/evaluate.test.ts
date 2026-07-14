/**
 * Tests for Velvet Rope evaluation pipeline.
 *
 * Exercises: expiration selection, contract selection, per-side criteria,
 * cross-side capital, and the full evaluateSymbolAdmission pipeline.
 */

import { describe, it, expect } from "vitest";
import { selectExpiration, selectAdmissionContract, evaluatePerSideCriteria, evaluateCrossSideCriteria } from "../../src/velvet-rope/evaluate";
import { DEFAULT_ADMISSION_POLICY } from "../../src/velvet-rope/policy";
import type { OptionContract, Expiration } from "../../src/domain/types";
import type { ContractEvidence } from "../../src/velvet-rope/types";

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
    spreadPercent: 18.2,
    openInterest: 200,
    volume: 50,
    iv: 0.28,
    annualizedYield: 25.0,
    dte: 14,
    ...overrides,
  };
}

// --- Expiration Selection ---

describe("selectExpiration", () => {
  const range = { min: 7, max: 45 };

  it("selects longest within DTE range", () => {
    const exps = [makeExpiration(5), makeExpiration(14), makeExpiration(28), makeExpiration(60)];
    const result = selectExpiration(exps, range);
    expect(result.status).toBe("selected");
    expect(result.selectedDte).toBe(28);
  });

  it("returns no_usable_expiration when none in range", () => {
    const exps = [makeExpiration(3), makeExpiration(50), makeExpiration(90)];
    const result = selectExpiration(exps, range);
    expect(result.status).toBe("no_usable_expiration");
  });

  it("returns no_usable_expiration when all below minimum", () => {
    const exps = [makeExpiration(2), makeExpiration(4), makeExpiration(6)];
    const result = selectExpiration(exps, range);
    expect(result.status).toBe("no_usable_expiration");
  });

  it("returns no_usable_expiration on empty list", () => {
    const result = selectExpiration([], range);
    expect(result.status).toBe("no_usable_expiration");
    expect(result.availableCount).toBe(0);
  });
});

// --- Contract Selection ---

describe("selectAdmissionContract", () => {
  const policy = DEFAULT_ADMISSION_POLICY;

  it("selects contract nearest target delta", () => {
    const contracts = [
      makeContract({ type: "CALL", strike: 90, delta: 0.15 }),
      makeContract({ type: "CALL", strike: 87, delta: 0.30 }),
      makeContract({ type: "CALL", strike: 85, delta: 0.45 }),
    ];
    const { contract, status } = selectAdmissionContract(contracts, policy, "call");
    expect(status).toBe("selected");
    expect(contract!.delta).toBe(0.30);
  });

  it("returns greeks_unavailable when all deltas are 0", () => {
    const contracts = [
      makeContract({ type: "CALL", strike: 87, delta: 0 }),
      makeContract({ type: "CALL", strike: 85, delta: 0 }),
    ];
    const { status } = selectAdmissionContract(contracts, policy, "call");
    expect(status).toBe("greeks_unavailable");
  });

  it("returns no_valid_quotes when all bids are 0", () => {
    const contracts = [
      makeContract({ type: "CALL", strike: 87, delta: 0.30, bid: 0, ask: 0.50 }),
      makeContract({ type: "CALL", strike: 85, delta: 0.25, bid: 0, ask: 0.30 }),
    ];
    const { status } = selectAdmissionContract(contracts, policy, "call");
    expect(status).toBe("no_valid_quotes");
  });

  it("returns no_contract_in_delta_range when none within range", () => {
    const contracts = [
      makeContract({ type: "CALL", strike: 95, delta: 0.05 }),
      makeContract({ type: "CALL", strike: 80, delta: 0.80 }),
    ];
    const { status } = selectAdmissionContract(contracts, policy, "call");
    expect(status).toBe("no_contract_in_delta_range");
  });

  it("handles put delta as absolute value", () => {
    const contracts = [
      makeContract({ type: "PUT", strike: 50, delta: -0.30 }),
      makeContract({ type: "PUT", strike: 48, delta: -0.20 }),
    ];
    const { contract, status } = selectAdmissionContract(contracts, policy, "put");
    expect(status).toBe("selected");
    expect(contract!.delta).toBe(-0.30);
  });
});

// --- Per-Side Criteria ---

describe("evaluatePerSideCriteria", () => {
  const policy = DEFAULT_ADMISSION_POLICY;

  it("passes all criteria for healthy contract", () => {
    const evidence = makeContractEvidence({
      openInterest: 500,
      spreadPercent: 5.0,
      annualizedYield: 20.0,
      volume: 100,
    });
    const results = evaluatePerSideCriteria(evidence, policy);
    const statuses = results.map((r) => r.status);
    expect(statuses).not.toContain("fail");
  });

  it("fails on low open interest (hard)", () => {
    const evidence = makeContractEvidence({ openInterest: 10 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const oiResult = results.find((r) => r.criterion === "minOpenInterest");
    expect(oiResult!.status).toBe("fail");
    expect(oiResult!.severity).toBe("hard");
  });

  it("fails on wide spread (hard)", () => {
    const evidence = makeContractEvidence({ spreadPercent: 25.0 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const spreadResult = results.find((r) => r.criterion === "maxBidAskSpreadPercent");
    expect(spreadResult!.status).toBe("fail");
    expect(spreadResult!.severity).toBe("hard");
  });

  it("detects near-miss for open interest", () => {
    // Threshold is 50, near-miss is 15% = 7.5 tolerance → 43-50 is near-miss
    const evidence = makeContractEvidence({ openInterest: 44 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const oiResult = results.find((r) => r.criterion === "minOpenInterest");
    expect(oiResult!.status).toBe("near_miss");
  });

  it("volume below threshold is observational (observed_below, non-gating)", () => {
    const evidence = makeContractEvidence({ volume: 0 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const volResult = results.find((r) => r.criterion === "minOptionVolume");
    expect(volResult!.severity).toBe("observational");
    expect(volResult!.status).toBe("observed_below");
  });

  it("yield below threshold is soft fail", () => {
    const evidence = makeContractEvidence({ annualizedYield: 2.0, spreadPercent: 5.0 });
    const results = evaluatePerSideCriteria(evidence, policy);
    const yieldResult = results.find((r) => r.criterion === "minYieldAtTargetDelta");
    expect(yieldResult!.status).toBe("fail");
    expect(yieldResult!.severity).toBe("soft");
  });
});

// --- Cross-Side Criteria ---

describe("evaluateCrossSideCriteria", () => {
  const policy = DEFAULT_ADMISSION_POLICY;

  it("passes when capital is within range", () => {
    // Strike $55 → capital $5,500 (within $2,000–$60,000)
    const results = evaluateCrossSideCriteria(55, policy);
    const maxCap = results.find((r) => r.criterion === "maxCapitalPerContract");
    const minCap = results.find((r) => r.criterion === "minCapitalPerContract");
    expect(maxCap!.status).toBe("pass");
    expect(minCap!.status).toBe("pass");
  });

  it("fails when capital exceeds maximum (hard)", () => {
    // Strike $700 → capital $70,000 (exceeds $60,000)
    const results = evaluateCrossSideCriteria(700, policy);
    const maxCap = results.find((r) => r.criterion === "maxCapitalPerContract");
    expect(maxCap!.status).toBe("fail");
    expect(maxCap!.severity).toBe("hard");
  });

  it("SPY-like strike demonstrates capital rejection", () => {
    // SPY strike ~$750 → capital $75,000
    const results = evaluateCrossSideCriteria(750, policy);
    const maxCap = results.find((r) => r.criterion === "maxCapitalPerContract");
    expect(maxCap!.status).toBe("fail");
  });

  it("soft-fails when capital is below minimum", () => {
    // Strike $15 → capital $1,500 (below $2,000 soft minimum)
    const results = evaluateCrossSideCriteria(15, policy);
    const minCap = results.find((r) => r.criterion === "minCapitalPerContract");
    expect(minCap!.status).toBe("fail");
    expect(minCap!.severity).toBe("soft");
  });

  it("returns unavailable when no put strike", () => {
    const results = evaluateCrossSideCriteria(null, policy);
    const maxCap = results.find((r) => r.criterion === "maxCapitalPerContract");
    expect(maxCap!.status).toBe("unavailable");
  });
});
