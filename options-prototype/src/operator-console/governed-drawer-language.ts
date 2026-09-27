/**
 * governed-drawer-language — operator-first plain-English framing for the governed
 * Recommendation drawer.
 *
 * SCOPE DISCIPLINE (Doc 65 + Principal corrective UX):
 *   - This module maps ALREADY-COMPUTED evaluator output (recommendation + unresolvedCauses)
 *     into operator-language explanation. It makes NO decision and changes NO semantics.
 *   - It only asks operator questions the current authority can legitimately support. The
 *     one meaningful bounded question is the operator's DESIRED call-away disposition.
 *   - It MUST NOT fabricate friendly questions for undefined governed conditions
 *     (intervention / eligibility / no-write). Doc 65 does not define those operator
 *     conditions, so where they block the recommendation we explain the boundary in plain
 *     language rather than inventing a question. (§6 invariant: a friendly UI must not
 *     manufacture governance the underlying authority does not contain.)
 */

import type { GovernedRecommendation } from "../governed-decision/types";
import type { DecisionSubject } from "../governed-decision/subject";

/** Cause codes that correspond to governed conditions Doc 65 does NOT define for the
 *  operator to answer. We surface these as an honest boundary, never as a fake question. */
const UNDEFINED_POLICY_CAUSES = new Set<string>([
  "governed-intervention-condition-active",
  "intervention-condition-unknown",
  "program-eligibility-condition-active",
  "program-eligibility-unknown",
  "governed-no-write-condition-active",
  "no-write-condition-unknown",
]);

/** Cause codes that are PL-SETUP-01 scope-association / Wheel-attribution territory. */
const SCOPE_ASSOCIATION_CAUSES = new Set<string>([
  "no-governed-scope-association",
]);

export interface OperatorExplanation {
  /** One-line plain-English summary of the current recommendation. */
  headline: string;
  /** Plain-English bullet(s) describing why WW cannot recommend (UNRESOLVED only). */
  reasons: string[];
  /** True when the ONLY meaningful bounded operator input — call-away desire — can be asked. */
  canAskCallAway: boolean;
  /** True when a boundary beyond the operator's answer prevents an affirmative result. */
  hasUndefinedPolicyBoundary: boolean;
  /** True when the subject has no governed-scope association yet (PL-SETUP-01 territory). */
  needsScopeAssociation: boolean;
}

/** The operator-facing call-away question. Captures DESIRED disposition, not mere tolerance. */
export function callAwayQuestion(subject: DecisionSubject, strike: number | null): string {
  const at = strike != null ? ` at $${strike}` : "";
  return `Do you want ${subject.symbol} to be called away${at}?`;
}

export function explainForOperator(
  recommendation: GovernedRecommendation,
  unresolvedCauses: string[],
  subject: DecisionSubject,
): OperatorExplanation {
  if (recommendation === "LET_RESOLVE") {
    return {
      headline: `WW recommends letting the ${subject.symbol} covered call resolve on its own — no action now.`,
      reasons: [],
      canAskCallAway: false,
      hasUndefinedPolicyBoundary: false,
      needsScopeAssociation: false,
    };
  }
  if (recommendation === "SELL_CALL") {
    return {
      headline: `WW recommends selling a call against the ${subject.symbol} shares (which call is a separate step).`,
      reasons: [],
      canAskCallAway: false,
      hasUndefinedPolicyBoundary: false,
      needsScopeAssociation: false,
    };
  }

  // UNRESOLVED — translate causes into operator language.
  const causes = new Set(unresolvedCauses);
  const needsScopeAssociation = [...causes].some((c) => SCOPE_ASSOCIATION_CAUSES.has(c));
  const callAwayMissing = causes.has("call-away-stance-not-accepted");
  const hasUndefinedPolicyBoundary = [...causes].some((c) => UNDEFINED_POLICY_CAUSES.has(c));

  const reasons: string[] = [];
  if (needsScopeAssociation) {
    reasons.push(
      `WW has not been told that this ${subject.symbol} position is part of a governed Wheel. Until you confirm that, WW will not recommend an action.`,
    );
  }
  if (callAwayMissing && !needsScopeAssociation) {
    reasons.push(
      `WW does not yet know your intended call-away disposition for ${subject.symbol}.`,
    );
  }
  if (causes.has("evidence-insufficient")) {
    reasons.push("Some required position evidence is not yet authoritative enough to decide.");
  }
  if (hasUndefinedPolicyBoundary) {
    reasons.push(
      "One or more governed conditions that would need checking are not yet defined in WW's ratified rules, so WW cannot ask you about them and holds at UNRESOLVED rather than guessing.",
    );
  }
  if (reasons.length === 0) {
    reasons.push("Required governance or evidence is not yet established.");
  }

  // The only bounded question we can legitimately ask is call-away desire, and only once a
  // scope association exists (otherwise the prerequisite is PL-SETUP-01 territory).
  const canAskCallAway = callAwayMissing && !needsScopeAssociation;

  return { headline: `WW cannot make a recommendation for ${subject.symbol} yet.`, reasons, canAskCallAway, hasUndefinedPolicyBoundary, needsScopeAssociation };
}
