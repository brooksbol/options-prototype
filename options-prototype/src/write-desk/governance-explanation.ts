/**
 * Governance Explanation — Human-readable explanations for governance annotations.
 *
 * Shared across all drawers (Put, Call, Buy-Write).
 * Deterministic, no LLM. Maps structural classification to operator-facing rationale.
 */

import type { GovernanceAnnotation } from "./candidate-types";

/**
 * Operator-facing title for a DANGER governance annotation.
 * e.g., "Daily Leveraged ETF" or "Inverse Daily-Reset Product"
 */
export function governanceDangerTitle(gov: GovernanceAnnotation): string {
  const parts: string[] = [];
  if (gov.classification?.dailyReset) parts.push("Daily");
  if (gov.classification?.leveraged) parts.push("Leveraged");
  if (gov.classification?.inverse) parts.push("Inverse");
  if (parts.length === 0) return "Structural Complexity";
  return `${parts.join(" ")} ETF`;
}

/**
 * Operator-facing explanation for a DANGER governance annotation.
 * Answers: "Why is this dangerous for me as an operator?"
 */
export function governanceDangerExplanation(gov: GovernanceAnnotation): string {
  const c = gov.classification;
  if (!c) return gov.reason;

  if (c.leveraged && c.dailyReset && !c.inverse) {
    return "This product resets its leverage daily. Over multi-day holding periods its performance can diverge materially from the underlying index, which makes it unsuitable for standard Wheelwright operation.";
  }
  if (c.inverse && c.dailyReset) {
    return "This product seeks the inverse of a benchmark's daily return and resets each trading day. Holding beyond the intended daily horizon produces unexpected losses from compounding. Assignment creates inverse exposure that conflicts with the income-oriented operating model.";
  }
  if (c.leveraged && !c.dailyReset) {
    return "This product provides leveraged exposure to an underlying benchmark. Leveraged products amplify both gains and losses. Assignment may create concentrated leveraged exposure unsuitable for standard Wheelwright operation.";
  }
  if (c.inverse && !c.dailyReset) {
    return "This product provides inverse exposure to an underlying benchmark. Assignment creates a position that profits from market decline, which conflicts with the standard income-oriented operating model.";
  }
  return gov.reason;
}

/**
 * Title for REVIEW governance status.
 */
export function governanceReviewTitle(): string {
  return "Non-Standard Product Structure";
}

/**
 * Explanation for REVIEW governance status.
 */
export function governanceReviewExplanation(): string {
  return "This instrument uses a non-standard structure that may behave differently from conventional equity ETFs. Assignment outcomes and holding-period characteristics require additional review before standard authorization.";
}

/**
 * Title for UNKNOWN governance status.
 */
export function governanceUnknownTitle(): string {
  return "Instrument Classification Unknown";
}

/**
 * Explanation for UNKNOWN governance status.
 */
export function governanceUnknownExplanation(): string {
  return "Instrument structure could not be established from the available evidence. Standard authorization is withheld until sufficient classification evidence is available.";
}

/**
 * Machine-readable governance taxonomy line (secondary evidence).
 * e.g., "LEVERAGED_DAILY_EQUITY_ETF · LEVERAGED_DAILY_PRODUCT"
 */
export function governanceTaxonomyLine(gov: GovernanceAnnotation): string | null {
  if (!gov.policyCode) return null;
  // Extract the productStructure from the reason (it follows "Structural complexity: ")
  const match = gov.reason.match(/Structural complexity: (.+?) \((.+?)\)/);
  if (match) {
    return `${match[1]} · ${match[2]}`;
  }
  return gov.policyCode;
}
