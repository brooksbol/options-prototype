/**
 * Tests for Velvet Rope outcome aggregation.
 */

import { describe, it, expect } from "vitest";
import { aggregateOutcome } from "../../src/velvet-rope/aggregate";
import { DEFAULT_ADMISSION_POLICY } from "../../src/velvet-rope/policy";
import type { OptionSideEvidence, CriterionResult } from "../../src/velvet-rope/types";

// --- Helpers ---

function makeSelectedSide(side: "call" | "put", criteria: CriterionResult[] = []): OptionSideEvidence {
  return {
    side,
    selectedContract: { strike: 55, delta: 0.30, bid: 1.0, ask: 1.2, mid: 1.1, spread: 0.2, spreadPercent: 18, openInterest: 200, volume: 50, iv: 0.28, annualizedYield: 25, dte: 14 },
    selectionStatus: "selected",
    criteria,
  };
}

function makeUnavailableSide(side: "call" | "put"): OptionSideEvidence {
  return { side, selectedContract: null, selectionStatus: "greeks_unavailable", criteria: [] };
}

function passCriterion(name: string): CriterionResult {
  return { criterion: name, status: "pass", measuredValue: 100, threshold: "50", severity: "hard", explanation: "OK" };
}

function failHardCriterion(name: string): CriterionResult {
  return { criterion: name, status: "fail", measuredValue: 10, threshold: "50", severity: "hard", explanation: "Failed hard" };
}

function failSoftCriterion(name: string): CriterionResult {
  return { criterion: name, status: "fail", measuredValue: 3, threshold: "5", severity: "soft", explanation: "Failed soft" };
}

function nearMissCriterion(name: string): CriterionResult {
  return { criterion: name, status: "near_miss", measuredValue: 45, threshold: "50", severity: "hard", explanation: "Near miss" };
}

function unavailableCriterion(name: string): CriterionResult {
  return { criterion: name, status: "unavailable", measuredValue: null, threshold: "50", severity: "hard", explanation: "No data" };
}

const policy = DEFAULT_ADMISSION_POLICY;

// --- Tests ---

describe("aggregateOutcome", () => {
  it("admits when all criteria pass on both sides", () => {
    const call = makeSelectedSide("call", [passCriterion("oi"), passCriterion("spread")]);
    const put = makeSelectedSide("put", [passCriterion("oi"), passCriterion("spread")]);
    const cross = [passCriterion("capital")];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("admit");
  });

  it("rejects when any hard criterion fails", () => {
    const call = makeSelectedSide("call", [passCriterion("oi")]);
    const put = makeSelectedSide("put", [failHardCriterion("oi")]);
    const cross = [passCriterion("capital")];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("reject");
  });

  it("rejects when cross-side capital fails hard", () => {
    const call = makeSelectedSide("call", [passCriterion("oi")]);
    const put = makeSelectedSide("put", [passCriterion("oi")]);
    const cross = [failHardCriterion("maxCapitalPerContract")];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("reject");
  });

  it("returns insufficient_evidence when call side unavailable (both required)", () => {
    const call = makeUnavailableSide("call");
    const put = makeSelectedSide("put", [passCriterion("oi")]);
    const cross: CriterionResult[] = [];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("insufficient_evidence");
  });

  it("returns insufficient_evidence when put side unavailable (both required)", () => {
    const call = makeSelectedSide("call", [passCriterion("oi")]);
    const put = makeUnavailableSide("put");
    const cross: CriterionResult[] = [];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("insufficient_evidence");
  });

  it("returns insufficient_evidence when evidence gap in criteria", () => {
    const call = makeSelectedSide("call", [unavailableCriterion("oi")]);
    const put = makeSelectedSide("put", [passCriterion("oi")]);
    const cross = [passCriterion("capital")];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("insufficient_evidence");
  });

  it("returns manual_review on near-miss", () => {
    const call = makeSelectedSide("call", [nearMissCriterion("oi")]);
    const put = makeSelectedSide("put", [passCriterion("oi")]);
    const cross = [passCriterion("capital")];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("manual_review");
  });

  it("returns manual_review on soft failure", () => {
    const call = makeSelectedSide("call", [passCriterion("oi")]);
    const put = makeSelectedSide("put", [failSoftCriterion("yield")]);
    const cross = [passCriterion("capital")];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("manual_review");
  });

  it("hard failure takes precedence over evidence gap", () => {
    const call = makeSelectedSide("call", [failHardCriterion("oi")]);
    const put = makeSelectedSide("put", [unavailableCriterion("spread")]);
    const cross: CriterionResult[] = [];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("reject");
  });

  it("evidence gap takes precedence over near-miss", () => {
    const call = makeSelectedSide("call", [nearMissCriterion("oi")]);
    const put = makeSelectedSide("put", [unavailableCriterion("spread")]);
    const cross: CriterionResult[] = [];

    const { outcome } = aggregateOutcome(call, put, cross, policy);
    expect(outcome).toBe("insufficient_evidence");
  });

  it("explanation includes reasons for rejection", () => {
    const call = makeSelectedSide("call", [failHardCriterion("oi")]);
    const put = makeSelectedSide("put", [passCriterion("oi")]);
    const cross: CriterionResult[] = [];

    const { explanation } = aggregateOutcome(call, put, cross, policy);
    expect(explanation).toContain("REJECT");
    expect(explanation).toContain("oi");
  });
});
