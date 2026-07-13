/**
 * Velvet Rope — Outcome Aggregation
 *
 * Determines the overall admission outcome from call/put side evidence
 * and cross-side criteria, respecting side requirements and severity rules.
 */

import type {
  OptionSideEvidence,
  CriterionResult,
  AdmissionPolicy,
  AdmissionOutcome,
} from "./types";

interface AggregationResult {
  outcome: AdmissionOutcome;
  explanation: string;
}

export function aggregateOutcome(
  callEvidence: OptionSideEvidence,
  putEvidence: OptionSideEvidence,
  crossCriteria: CriterionResult[],
  policy: AdmissionPolicy
): AggregationResult {
  const reasons: string[] = [];

  // --- Side requirement check ---
  if (policy.sideRequirement === "both") {
    if (callEvidence.selectionStatus !== "selected" && putEvidence.selectionStatus !== "selected") {
      return {
        outcome: "insufficient_evidence",
        explanation: `Neither call nor put contract could be selected. Call: ${callEvidence.selectionStatus}. Put: ${putEvidence.selectionStatus}.`,
      };
    }
    if (callEvidence.selectionStatus !== "selected") {
      return {
        outcome: "insufficient_evidence",
        explanation: `Call contract unavailable (${callEvidence.selectionStatus}). Policy requires both sides.`,
      };
    }
    if (putEvidence.selectionStatus !== "selected") {
      return {
        outcome: "insufficient_evidence",
        explanation: `Put contract unavailable (${putEvidence.selectionStatus}). Policy requires both sides.`,
      };
    }
  } else if (policy.sideRequirement === "either") {
    if (callEvidence.selectionStatus !== "selected" && putEvidence.selectionStatus !== "selected") {
      return {
        outcome: "insufficient_evidence",
        explanation: `Neither side has a selectable contract. Call: ${callEvidence.selectionStatus}. Put: ${putEvidence.selectionStatus}.`,
      };
    }
  }

  // --- Collect all criteria ---
  const allCriteria: CriterionResult[] = [
    ...callEvidence.criteria,
    ...putEvidence.criteria,
    ...crossCriteria,
  ];

  // --- Classify ---
  let hasHardFail = false;
  let hasEvidenceGap = false;
  let hasNearMiss = false;
  let hasSoftFail = false;

  for (const cr of allCriteria) {
    if (cr.severity === "observational") continue; // never counts

    switch (cr.status) {
      case "fail":
        if (cr.severity === "hard") {
          hasHardFail = true;
          reasons.push(`REJECT: ${cr.criterion} — ${cr.explanation}`);
        } else {
          hasSoftFail = true;
          reasons.push(`Soft fail: ${cr.criterion} — ${cr.explanation}`);
        }
        break;
      case "unavailable":
        hasEvidenceGap = true;
        reasons.push(`Evidence gap: ${cr.criterion} — ${cr.explanation}`);
        break;
      case "near_miss":
        hasNearMiss = true;
        reasons.push(`Near miss: ${cr.criterion} — ${cr.explanation}`);
        break;
      case "pass":
        // no action
        break;
    }
  }

  // --- Determine outcome ---
  if (hasHardFail) {
    return {
      outcome: "reject",
      explanation: reasons.join(" | "),
    };
  }

  if (hasEvidenceGap) {
    return {
      outcome: "insufficient_evidence",
      explanation: reasons.length > 0 ? reasons.join(" | ") : "Evidence gaps prevent full evaluation.",
    };
  }

  if (hasNearMiss || hasSoftFail) {
    return {
      outcome: "manual_review",
      explanation: reasons.length > 0 ? reasons.join(" | ") : "Near-miss or soft failures require operator review.",
    };
  }

  return {
    outcome: "admit",
    explanation: "All criteria passed.",
  };
}
