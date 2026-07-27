/**
 * Posture Explanation — View Model for "Why ACTIONABLE / EDGE / WAIT?"
 *
 * Preserves the actual posture derivation path so the UI renders it
 * rather than recreating policy semantics.
 *
 * The posture is determined by one of two paths:
 * 1. Weighted composite score → threshold floors (normal classification)
 * 2. Hard-no exclusion → UNAVAILABLE/WIDE_SPREAD (absolute gate)
 *
 * Delta fit and governance are separate observations that do not
 * participate in the execution score but are relevant context.
 */

import type { ExecutionAssessment, ActionPosture, QualityComponent } from "./execution-assessment";
import type { DeltaFit } from "./brief-builder";
import type { GovernanceAnnotation } from "./scan-orchestrator";
import type { ExecutionPolicy } from "./execution-policy";

// --- Types ---

export interface ScoreContributor {
  /** Component name (e.g., "Spread", "Open Interest") */
  name: string;
  /** Measured value (e.g., 12 for spread %, 30 for OI contracts) */
  measured: number;
  /** Human-readable measured label (e.g., "12% relative spread", "30 contracts") */
  measuredLabel: string;
  /** Human-readable reference label (e.g., "preferred ≤ 15%", "preferred ≥ 50") */
  referenceLabel: string;
  /** Component score 0-100 */
  componentScore: number;
  /** Weight in the composite (0-1) */
  weight: number;
  /** Weighted contribution to the total score */
  weightedContribution: number;
}

export interface ScoreRange {
  /** Lower bound of this posture's range (inclusive) */
  lowerInclusive: number;
  /** Upper bound (exclusive), null for ACTIONABLE (no ceiling) */
  upperExclusive: number | null;
  /** Next posture above this range (if applicable) */
  nextPosture: ActionPosture | null;
  /** Score threshold where the next posture begins */
  nextThreshold: number | null;
}

export interface PostureExplanation {
  /** The assigned posture */
  posture: ActionPosture;
  /** How the posture was determined */
  derivation: "weighted_score" | "hard_no";
  /** Composite execution score (null for hard-no) */
  score: number | null;
  /** The score range for this posture (null for hard-no) */
  scoreRange: ScoreRange | null;
  /** Hard-no exclusion reasons (empty for normal scoring) */
  hardNoReasons: string[];
  /** Score contributors (empty for hard-no) */
  contributors: ScoreContributor[];
  /** Delta fit observation (independent of execution score) */
  deltaFit: {
    delta: number;
    category: string;
    label: string;
  };
  /** Governance observation (independent of execution score) */
  governance: {
    status: string;
    hasRestriction: boolean;
    summary: string;
  };
}

// --- Builder ---

/**
 * Build a PostureExplanation from the existing assessment, delta fit, and governance.
 * This is a pure transformation — no new computation, just restructuring for display.
 */
export function buildPostureExplanation(
  assessment: ExecutionAssessment,
  deltaFit: DeltaFit,
  governance: GovernanceAnnotation,
  policy: ExecutionPolicy
): PostureExplanation {
  // Hard-no path
  if (assessment.hardNoReason || assessment.posture === "UNAVAILABLE" || assessment.posture === "WIDE_SPREAD") {
    return {
      posture: assessment.posture,
      derivation: "hard_no",
      score: null,
      scoreRange: null,
      hardNoReasons: assessment.hardNoReason ? [assessment.hardNoReason] : ["Contract excluded by absolute policy gate"],
      contributors: [],
      deltaFit: buildDeltaFitSummary(deltaFit),
      governance: buildGovernanceSummary(governance),
    };
  }

  // Normal weighted-score path
  const scoreRange = buildScoreRange(assessment.posture, policy);
  const contributors = assessment.components.map(c => buildContributor(c, policy));

  return {
    posture: assessment.posture,
    derivation: "weighted_score",
    score: assessment.score,
    scoreRange,
    hardNoReasons: [],
    contributors,
    deltaFit: buildDeltaFitSummary(deltaFit),
    governance: buildGovernanceSummary(governance),
  };
}

// --- Internal Helpers ---

function buildScoreRange(posture: ActionPosture, policy: ExecutionPolicy): ScoreRange {
  switch (posture) {
    case "ACTIONABLE":
      return {
        lowerInclusive: policy.actionableFloor,
        upperExclusive: null,
        nextPosture: null,
        nextThreshold: null,
      };
    case "EDGE":
      return {
        lowerInclusive: policy.edgeFloor,
        upperExclusive: policy.actionableFloor,
        nextPosture: "ACTIONABLE",
        nextThreshold: policy.actionableFloor,
      };
    case "WAIT":
      return {
        lowerInclusive: policy.waitFloor,
        upperExclusive: policy.edgeFloor,
        nextPosture: "EDGE",
        nextThreshold: policy.edgeFloor,
      };
    default:
      return {
        lowerInclusive: 0,
        upperExclusive: policy.waitFloor,
        nextPosture: "WAIT",
        nextThreshold: policy.waitFloor,
      };
  }
}

function buildContributor(component: QualityComponent, policy: ExecutionPolicy): ScoreContributor {
  const measuredLabel = formatMeasuredLabel(component.name, component.measured);
  const referenceLabel = formatReferenceLabel(component.name, component.reference);

  return {
    name: component.name,
    measured: component.measured,
    measuredLabel,
    referenceLabel,
    componentScore: component.score,
    weight: component.weight,
    weightedContribution: Math.round(component.score * component.weight * 10) / 10,
  };
}

function formatMeasuredLabel(name: string, measured: number): string {
  switch (name) {
    case "Spread":
      return `${measured.toFixed(1)}% relative spread`;
    case "Open Interest":
      return `${measured.toLocaleString()} contracts`;
    case "Volume":
      return `${measured.toLocaleString()} daily volume`;
    case "Premium":
      return `$${measured.toFixed(2)} bid`;
    default:
      return `${measured}`;
  }
}

function formatReferenceLabel(name: string, reference: number): string {
  switch (name) {
    case "Spread":
      return `preferred ≤ ${reference}%`;
    case "Open Interest":
      return `preferred ≥ ${reference}`;
    case "Volume":
      return `preferred ≥ ${reference}`;
    case "Premium":
      return `preferred ≥ $${reference.toFixed(2)}`;
    default:
      return `reference: ${reference}`;
  }
}

function buildDeltaFitSummary(deltaFit: DeltaFit): PostureExplanation["deltaFit"] {
  return {
    delta: deltaFit.selectedDelta,
    category: deltaFit.category,
    label: `Delta ${deltaFit.selectedDelta.toFixed(2)} — ${deltaFit.label}`,
  };
}

function buildGovernanceSummary(governance: GovernanceAnnotation): PostureExplanation["governance"] {
  const hasRestriction = governance.status === "danger" || governance.status === "review" || governance.status === "unknown";
  let summary: string;

  switch (governance.status) {
    case "authorized":
      summary = "No governance restrictions";
      break;
    case "danger":
      summary = "Governance restriction: not authorized for standard operation";
      break;
    case "review":
      summary = "Governance: requires additional review";
      break;
    case "unknown":
      summary = "Governance: classification undetermined";
      break;
    default:
      summary = `Governance: ${governance.status}`;
  }

  return { status: governance.status, hasRestriction, summary };
}
