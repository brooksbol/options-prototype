/**
 * Tests for execution assessment — graded scoring and posture assignment.
 */

import { describe, it, expect } from "vitest";
import { assessExecution, isHardNo, type ContractEvidence } from "../../src/write-desk/execution-assessment";
import { DEFAULT_EXECUTION_POLICY } from "../../src/write-desk/execution-policy";

function makeEvidence(overrides?: Partial<ContractEvidence>): ContractEvidence {
  return {
    bid: 1.50,
    ask: 1.70,
    spreadPercent: 12,
    openInterest: 200,
    volume: 50,
    delta: -0.30,
    ...overrides,
  };
}

describe("isHardNo", () => {
  it("excludes zero bid", () => {
    expect(isHardNo(makeEvidence({ bid: 0 }))).toContain("Zero or invalid bid");
  });

  it("excludes zero OI", () => {
    expect(isHardNo(makeEvidence({ openInterest: 0 }))).toContain("Zero open interest");
  });

  it("excludes extreme spread", () => {
    expect(isHardNo(makeEvidence({ spreadPercent: 85 }))).toContain("exclusion floor");
  });

  it("does not exclude normal evidence", () => {
    expect(isHardNo(makeEvidence())).toBeNull();
  });

  it("does not exclude wide-but-not-extreme spread", () => {
    expect(isHardNo(makeEvidence({ spreadPercent: 45 }))).toBeNull();
  });
});

describe("assessExecution", () => {
  it("healthy contract scores ACTIONABLE", () => {
    const result = assessExecution(makeEvidence({
      spreadPercent: 8,
      openInterest: 500,
      volume: 100,
      bid: 2.00,
    }));
    expect(result.posture).toBe("ACTIONABLE");
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.hardNoReason).toBeNull();
  });

  it("moderate evidence scores EDGE", () => {
    const result = assessExecution(makeEvidence({
      spreadPercent: 35,
      openInterest: 20,
      volume: 3,
      bid: 0.08,
    }));
    expect(result.posture).toBe("EDGE");
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThan(65);
  });

  it("weak evidence scores WAIT", () => {
    const result = assessExecution(makeEvidence({
      spreadPercent: 55,
      openInterest: 5,
      volume: 1,
      bid: 0.05,
    }));
    expect(result.posture).toBe("WAIT");
    expect(result.score).toBeGreaterThanOrEqual(15);
    expect(result.score).toBeLessThan(35);
  });

  it("hard-no returns UNAVAILABLE with reason", () => {
    const result = assessExecution(makeEvidence({ bid: 0 }));
    expect(result.posture).toBe("UNAVAILABLE");
    expect(result.hardNoReason).not.toBeNull();
    expect(result.score).toBe(0);
  });

  it("components are transparent and auditable", () => {
    const result = assessExecution(makeEvidence());
    expect(result.components.length).toBe(4);
    for (const c of result.components) {
      expect(c.name).toBeDefined();
      expect(c.measured).toBeDefined();
      expect(c.reference).toBeDefined();
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
      expect(c.weight).toBeGreaterThan(0);
    }
  });

  it("policy version is recorded", () => {
    const result = assessExecution(makeEvidence());
    expect(result.policyVersion).toBe(DEFAULT_EXECUTION_POLICY.version);
  });

  it("15% spread is not an automatic hard rejection", () => {
    // The current VR 15% threshold should NOT be a hard-no in the Write Desk
    const result = assessExecution(makeEvidence({ spreadPercent: 20, openInterest: 100, volume: 30 }));
    expect(result.posture).not.toBe("UNAVAILABLE");
    expect(result.hardNoReason).toBeNull();
  });
});
