/**
 * Posture Explanation — Tests
 *
 * Proves:
 * 1. ACTIONABLE derived from score ≥ 65 with correct range
 * 2. EDGE derived from score 35-64 with correct next-threshold
 * 3. WAIT derived from score 15-34 with correct next-threshold
 * 4. Hard-no does not pretend normal scoring occurred
 * 5. Component weights and contributions correspond to the assessment
 * 6. Delta fit and governance are independent observations
 * 7. Weighted contributions sum approximately to the total score
 */

import { describe, it, expect } from "vitest";
import { buildPostureExplanation } from "../../src/write-desk/posture-explanation";
import type { ExecutionAssessment, QualityComponent } from "../../src/write-desk/execution-assessment";
import type { DeltaFit } from "../../src/write-desk/brief-builder";
import type { GovernanceAnnotation } from "../../src/write-desk/scan-orchestrator";
import { DEFAULT_EXECUTION_POLICY } from "../../src/write-desk/execution-policy";

// --- Helpers ---

function makeAssessment(score: number, posture: "ACTIONABLE" | "EDGE" | "WAIT", components?: QualityComponent[]): ExecutionAssessment {
  const defaultComponents: QualityComponent[] = [
    { name: "Spread", measured: 12, reference: 15, score: 100, weight: 0.40 },
    { name: "Open Interest", measured: 200, reference: 50, score: 100, weight: 0.25 },
    { name: "Volume", measured: 50, reference: 10, score: 100, weight: 0.15 },
    { name: "Premium", measured: 1.50, reference: 0.10, score: 100, weight: 0.20 },
  ];
  return {
    score,
    posture,
    components: components ?? defaultComponents,
    hardNoReason: null,
    policyVersion: "v1-provisional",
  };
}

function makeHardNoAssessment(reason: string): ExecutionAssessment {
  return {
    score: 0,
    posture: "UNAVAILABLE",
    components: [],
    hardNoReason: reason,
    policyVersion: "v1-provisional",
  };
}

function makeDeltaFit(delta: number = 0.30, category: "preferred_band" | "admissible_range" | "extended_fallback" = "preferred_band"): DeltaFit {
  return {
    targetDelta: 0.30,
    selectedDelta: delta,
    deviation: delta - 0.30,
    category,
    label: category === "preferred_band" ? "Preferred" : category === "admissible_range" ? "Admissible" : "Extended",
  };
}

function makeGovernance(status: "authorized" | "danger" | "review" | "unknown" = "authorized"): GovernanceAnnotation {
  return { status, reason: status === "authorized" ? "Conventional structure" : "Test restriction" };
}

// --- Tests ---

describe("buildPostureExplanation", () => {

  it("ACTIONABLE: score ≥ 65, correct range, no next-threshold ceiling", () => {
    const explanation = buildPostureExplanation(
      makeAssessment(72, "ACTIONABLE"),
      makeDeltaFit(),
      makeGovernance(),
      DEFAULT_EXECUTION_POLICY
    );

    expect(explanation.posture).toBe("ACTIONABLE");
    expect(explanation.derivation).toBe("weighted_score");
    expect(explanation.score).toBe(72);
    expect(explanation.scoreRange).not.toBeNull();
    expect(explanation.scoreRange!.lowerInclusive).toBe(65);
    expect(explanation.scoreRange!.upperExclusive).toBeNull();
    expect(explanation.scoreRange!.nextPosture).toBeNull();
    expect(explanation.hardNoReasons).toHaveLength(0);
    expect(explanation.contributors.length).toBe(4);
  });

  it("EDGE: score 35-64, next threshold is ACTIONABLE at 65", () => {
    const explanation = buildPostureExplanation(
      makeAssessment(52, "EDGE"),
      makeDeltaFit(),
      makeGovernance(),
      DEFAULT_EXECUTION_POLICY
    );

    expect(explanation.posture).toBe("EDGE");
    expect(explanation.derivation).toBe("weighted_score");
    expect(explanation.score).toBe(52);
    expect(explanation.scoreRange!.lowerInclusive).toBe(35);
    expect(explanation.scoreRange!.upperExclusive).toBe(65);
    expect(explanation.scoreRange!.nextPosture).toBe("ACTIONABLE");
    expect(explanation.scoreRange!.nextThreshold).toBe(65);
  });

  it("WAIT: score 15-34, next threshold is EDGE at 35", () => {
    const explanation = buildPostureExplanation(
      makeAssessment(22, "WAIT"),
      makeDeltaFit(),
      makeGovernance(),
      DEFAULT_EXECUTION_POLICY
    );

    expect(explanation.posture).toBe("WAIT");
    expect(explanation.derivation).toBe("weighted_score");
    expect(explanation.score).toBe(22);
    expect(explanation.scoreRange!.lowerInclusive).toBe(15);
    expect(explanation.scoreRange!.upperExclusive).toBe(35);
    expect(explanation.scoreRange!.nextPosture).toBe("EDGE");
    expect(explanation.scoreRange!.nextThreshold).toBe(35);
  });

  it("hard-no does not pretend normal scoring occurred", () => {
    const explanation = buildPostureExplanation(
      makeHardNoAssessment("Zero open interest — no market participation."),
      makeDeltaFit(),
      makeGovernance(),
      DEFAULT_EXECUTION_POLICY
    );

    expect(explanation.posture).toBe("UNAVAILABLE");
    expect(explanation.derivation).toBe("hard_no");
    expect(explanation.score).toBeNull();
    expect(explanation.scoreRange).toBeNull();
    expect(explanation.hardNoReasons).toEqual(["Zero open interest — no market participation."]);
    expect(explanation.contributors).toHaveLength(0);
  });

  it("component weights and contributions correspond to the assessment", () => {
    const components: QualityComponent[] = [
      { name: "Spread", measured: 25, reference: 15, score: 78, weight: 0.40 },
      { name: "Open Interest", measured: 30, reference: 50, score: 60, weight: 0.25 },
      { name: "Volume", measured: 3, reference: 10, score: 30, weight: 0.15 },
      { name: "Premium", measured: 0.45, reference: 0.10, score: 100, weight: 0.20 },
    ];
    const explanation = buildPostureExplanation(
      makeAssessment(68, "ACTIONABLE", components),
      makeDeltaFit(),
      makeGovernance(),
      DEFAULT_EXECUTION_POLICY
    );

    expect(explanation.contributors.length).toBe(4);

    const spread = explanation.contributors.find(c => c.name === "Spread")!;
    expect(spread.componentScore).toBe(78);
    expect(spread.weight).toBe(0.40);
    expect(spread.weightedContribution).toBeCloseTo(31.2, 1);
    expect(spread.measuredLabel).toContain("25.0%");
    expect(spread.referenceLabel).toContain("15%");

    const oi = explanation.contributors.find(c => c.name === "Open Interest")!;
    expect(oi.componentScore).toBe(60);
    expect(oi.weight).toBe(0.25);
    expect(oi.weightedContribution).toBeCloseTo(15, 1);
    expect(oi.measuredLabel).toContain("30");

    const vol = explanation.contributors.find(c => c.name === "Volume")!;
    expect(vol.componentScore).toBe(30);
    expect(vol.weight).toBe(0.15);
    expect(vol.weightedContribution).toBeCloseTo(4.5, 1);
  });

  it("weighted contributions sum approximately to the total score", () => {
    const components: QualityComponent[] = [
      { name: "Spread", measured: 12, reference: 15, score: 100, weight: 0.40 },
      { name: "Open Interest", measured: 30, reference: 50, score: 60, weight: 0.25 },
      { name: "Volume", measured: 5, reference: 10, score: 50, weight: 0.15 },
      { name: "Premium", measured: 0.45, reference: 0.10, score: 100, weight: 0.20 },
    ];
    // Expected: 100*0.40 + 60*0.25 + 50*0.15 + 100*0.20 = 40+15+7.5+20 = 82.5 → 83
    const explanation = buildPostureExplanation(
      makeAssessment(83, "ACTIONABLE", components),
      makeDeltaFit(),
      makeGovernance(),
      DEFAULT_EXECUTION_POLICY
    );

    const totalWeighted = explanation.contributors.reduce((sum, c) => sum + c.weightedContribution, 0);
    // Contributions sum to within 1 of the total (rounding differences between individual and composite)
    expect(Math.abs(totalWeighted - explanation.score!)).toBeLessThanOrEqual(1);
  });

  it("delta fit and governance are independent observations", () => {
    const explanation = buildPostureExplanation(
      makeAssessment(72, "ACTIONABLE"),
      makeDeltaFit(0.42, "admissible_range"),
      makeGovernance("review"),
      DEFAULT_EXECUTION_POLICY
    );

    // Delta fit does NOT affect posture
    expect(explanation.posture).toBe("ACTIONABLE");
    expect(explanation.deltaFit.delta).toBe(0.42);
    expect(explanation.deltaFit.category).toBe("admissible_range");
    expect(explanation.deltaFit.label).toContain("0.42");
    expect(explanation.deltaFit.label).toContain("Admissible");

    // Governance does NOT affect posture but is reported
    expect(explanation.governance.status).toBe("review");
    expect(explanation.governance.hasRestriction).toBe(true);
    expect(explanation.governance.summary).toContain("review");
  });

  it("WIDE_SPREAD posture uses hard-no derivation path", () => {
    const assessment: ExecutionAssessment = {
      score: 0,
      posture: "WIDE_SPREAD" as any,
      components: [],
      hardNoReason: "Spread 85% exceeds absolute exclusion floor (80%).",
      policyVersion: "v1-provisional",
    };

    const explanation = buildPostureExplanation(
      assessment,
      makeDeltaFit(),
      makeGovernance(),
      DEFAULT_EXECUTION_POLICY
    );

    expect(explanation.derivation).toBe("hard_no");
    expect(explanation.score).toBeNull();
    expect(explanation.hardNoReasons).toContain("Spread 85% exceeds absolute exclusion floor (80%).");
  });
});
