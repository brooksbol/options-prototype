/**
 * Write Desk — Execution Assessment Service
 *
 * Evaluates the execution quality of a specific contract on a continuum.
 * Separates true hard-no conditions from graded quality scoring.
 *
 * The assessment answers: "How reasonable is it to attempt this contract today?"
 */

import type { ExecutionPolicy } from "./execution-policy";
import { DEFAULT_EXECUTION_POLICY } from "./execution-policy";

// --- Types ---

export type ActionPosture = "ACTIONABLE" | "EDGE" | "WAIT" | "WIDE_SPREAD" | "UNAVAILABLE" | "DATA_INCOMPLETE";

export interface QualityComponent {
  name: string;
  measured: number;
  reference: number;
  score: number;   // 0-100 for this component
  weight: number;
}

export interface ExecutionAssessment {
  /** Overall score 0-100 */
  score: number;
  /** Derived posture */
  posture: ActionPosture;
  /** Individual scoring components (transparent, auditable) */
  components: QualityComponent[];
  /** True hard-no reason (null if not excluded) */
  hardNoReason: string | null;
  /** Policy version used */
  policyVersion: string;
}

export interface ContractEvidence {
  bid: number;
  ask: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  delta: number;
}

// --- Hard-No Check ---

export function isHardNo(evidence: ContractEvidence, policy: ExecutionPolicy = DEFAULT_EXECUTION_POLICY): string | null {
  if (policy.hardExcludeZeroBid && evidence.bid <= 0) {
    return "Zero or invalid bid — contract cannot be evaluated for short sale.";
  }
  if (policy.hardExcludeZeroOI && evidence.openInterest === 0) {
    return "Zero open interest — no market participation.";
  }
  if (evidence.spreadPercent > policy.hardExcludeSpreadPercent) {
    return `Spread ${evidence.spreadPercent.toFixed(0)}% exceeds absolute exclusion floor (${policy.hardExcludeSpreadPercent}%).`;
  }
  return null;
}

// --- Scoring ---

function scoreComponent(measured: number, preferred: number, direction: "higher_better" | "lower_better"): number {
  if (direction === "higher_better") {
    if (measured >= preferred) return 100;
    if (measured <= 0) return 0;
    return Math.round((measured / preferred) * 100);
  } else {
    // lower is better (spread)
    if (measured <= preferred) return 100;
    // Degrade linearly from preferred to 4x preferred (where score → 0)
    const degradeRange = preferred * 3;
    const excess = measured - preferred;
    if (excess >= degradeRange) return 0;
    return Math.round(100 * (1 - excess / degradeRange));
  }
}

export function assessExecution(
  evidence: ContractEvidence,
  policy: ExecutionPolicy = DEFAULT_EXECUTION_POLICY
): ExecutionAssessment {
  // Check hard-no first
  const hardNoReason = isHardNo(evidence, policy);
  if (hardNoReason) {
    return {
      score: 0,
      posture: "UNAVAILABLE",
      components: [],
      hardNoReason,
      policyVersion: policy.version,
    };
  }

  // Score each component
  const spreadScore = scoreComponent(evidence.spreadPercent, policy.preferredSpreadPercent, "lower_better");
  const oiScore = scoreComponent(evidence.openInterest, policy.preferredOpenInterest, "higher_better");
  const volumeScore = scoreComponent(evidence.volume, policy.preferredVolume, "higher_better");
  const premiumScore = scoreComponent(evidence.bid, policy.preferredMinBid, "higher_better");

  const components: QualityComponent[] = [
    { name: "Spread", measured: evidence.spreadPercent, reference: policy.preferredSpreadPercent, score: spreadScore, weight: policy.weights.spread },
    { name: "Open Interest", measured: evidence.openInterest, reference: policy.preferredOpenInterest, score: oiScore, weight: policy.weights.openInterest },
    { name: "Volume", measured: evidence.volume, reference: policy.preferredVolume, score: volumeScore, weight: policy.weights.volume },
    { name: "Premium", measured: evidence.bid, reference: policy.preferredMinBid, score: premiumScore, weight: policy.weights.premium },
  ];

  // Weighted composite score
  const score = Math.round(
    spreadScore * policy.weights.spread +
    oiScore * policy.weights.openInterest +
    volumeScore * policy.weights.volume +
    premiumScore * policy.weights.premium
  );

  // Posture assignment
  let posture: ActionPosture;
  if (score >= policy.actionableFloor) {
    posture = "ACTIONABLE";
  } else if (score >= policy.edgeFloor) {
    posture = "EDGE";
  } else if (score >= policy.waitFloor) {
    posture = "WAIT";
  } else {
    posture = "UNAVAILABLE"; // Safety net — should have been hard-no
  }

  return {
    score,
    posture,
    components,
    hardNoReason: null,
    policyVersion: policy.version,
  };
}
