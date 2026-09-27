/**
 * governed-drawer-language — operator-first plain-English framing for the dense governed
 * Recommendation drawer, driven by the ADR-021 predicate picture.
 *
 * SCOPE DISCIPLINE (ADR-021 / Doc 67):
 *   - Maps the ALREADY-COMPUTED predicate picture into operator language. It makes NO
 *     decision and changes NO semantics.
 *   - Renders every relevant predicate's truthful status (established / known-negative /
 *     authority-missing / evidence-insufficient / not-evaluated-blocked / policy-undefined /
 *     not-applicable), never conflating them.
 *   - Advertises no enabled control here; control admissibility is a separate gate
 *     (governed-control-admissibility.ts). Where a resolution mechanism is unavailable it is
 *     described honestly, never offered as a fake control.
 *   - "Recognition is not authority."
 */

import type { GovernedEvaluation } from "../governed-decision/types";
import type { DecisionSubject } from "../governed-decision/subject";
import type { PredicateResult, PredicateStatus } from "../governed-decision/predicate";

/** A compact predicate row for the drawer's picture. */
export interface PictureRow {
  key: string;
  label: string;
  /** Short operator-language status word/phrase. */
  statusLabel: string;
  /** Machine status (for styling/testing). */
  status: PredicateStatus;
  reason: string;
  blockedBy?: string[];
}

export interface OperatorExplanation {
  headline: string;
  /** The complete ordered predicate picture, in operator language. */
  rows: PictureRow[];
  /** One-line plain-English summary of why the outcome is what it is (UNRESOLVED only). */
  whyUnresolved: string | null;
  /** True when this subject is authoritatively OUTSIDE the Program (known-negative membership). */
  outsideProgram: boolean;
}

/** Plain-English subject line, e.g. "COPX · covered call" / "COPX · share block". */
export function subjectSummary(subject: DecisionSubject): string {
  return subject.subjectType === "covered-call"
    ? `${subject.symbol} · covered call`
    : `${subject.symbol} · share block`;
}

/** Plain-language rule name beside the machine rule id (ADR-021 presentation cleanup). */
export function ruleName(ruleId: string): string {
  switch (ruleId) {
    case "DOC65-RULE-1-LET-RESOLVE":
      return "Existing governed covered call (let resolve)";
    case "DOC65-RULE-2-SELL-CALL":
      return "Eligible Wheel shares (sell call)";
    default:
      return ruleId;
  }
}

/** Operator-language status word for each canonical predicate state (ADR-021 §2). */
const STATUS_LABEL: Record<PredicateStatus, string> = {
  SATISFIED: "Established",
  NOT_SATISFIED: "No",
  UNKNOWN: "Unknown",
  EVIDENCE_INSUFFICIENT: "Evidence insufficient",
  AUTHORITY_MISSING: "Not established",
  POLICY_UNDEFINED: "No governed policy yet",
  NOT_EVALUATED: "Not yet evaluated",
  NOT_APPLICABLE: "Not applicable",
};

function toRow(p: PredicateResult): PictureRow {
  return {
    key: p.key,
    label: p.label,
    statusLabel: STATUS_LABEL[p.status],
    status: p.status,
    reason: p.reason,
    blockedBy: p.blockedBy,
  };
}

/**
 * Build the operator explanation from the full evaluation (ADR-021 picture).
 */
export function explainForOperator(evaluation: GovernedEvaluation, subject: DecisionSubject): OperatorExplanation {
  const rows = evaluation.predicateResults.map(toRow);
  const outsideProgram = evaluation.programApplicability === "outside-program";

  if (outsideProgram) {
    return {
      headline: `${subject.symbol} is outside the Wheel program — no applicable recommendation.`,
      rows,
      whyUnresolved: null,
      outsideProgram: true,
    };
  }

  if (evaluation.recommendation === "LET_RESOLVE") {
    return {
      headline: `Let the ${subject.symbol} covered call resolve on its own — no action now.`,
      rows,
      whyUnresolved: null,
      outsideProgram: false,
    };
  }
  if (evaluation.recommendation === "SELL_CALL") {
    return {
      headline: `Sell a call against the ${subject.symbol} shares (which call is a separate step).`,
      rows,
      whyUnresolved: null,
      outsideProgram: false,
    };
  }

  // UNRESOLVED — the leading blocker drives the one-line "why", but the full picture is shown.
  const blocker = evaluation.predicateResults.find(
    (p) => p.status !== "SATISFIED" && p.status !== "NOT_APPLICABLE",
  );
  const why = blocker
    ? blocker.reason
    : "Required governance or evidence is not yet established.";
  return {
    headline: `WW cannot make a recommendation for ${subject.symbol} yet.`,
    rows,
    whyUnresolved: why,
    outsideProgram: false,
  };
}
