/**
 * governed-drawer-language — operator-first plain-English framing for the dense governed
 * Recommendation drawer.
 *
 * SCOPE DISCIPLINE (Doc 65 + Principal corrective UX):
 *   - Maps ALREADY-COMPUTED evaluator output (recommendation + unresolvedCauses) into
 *     operator-language explanation. It makes NO decision and changes NO semantics.
 *   - Asks only operator questions the current authority can legitimately support — the one
 *     bounded question being the operator's DESIRED call-away disposition.
 *   - MUST NOT fabricate friendly questions for undefined governed conditions
 *     (intervention / eligibility / no-write). Where those block the recommendation we state
 *     the boundary; we never invent a question or instruct choosing CLEAR.
 *   - "Recognition is not authority": mechanical resemblance never establishes Wheel
 *     membership or operator intent.
 */

import type { GovernedRecommendation } from "../governed-decision/types";
import type { DecisionSubject } from "../governed-decision/subject";

/** A compact NEEDS row: what governed fact is required and its plain-English status. */
export interface NeedRow {
  label: string;
  status: string;
}

const UNDEFINED_POLICY_CAUSES = new Set<string>([
  "governed-intervention-condition-active",
  "intervention-condition-unknown",
  "program-eligibility-condition-active",
  "program-eligibility-unknown",
  "governed-no-write-condition-active",
  "no-write-condition-unknown",
]);

const SCOPE_ASSOCIATION_CAUSES = new Set<string>(["no-governed-scope-association"]);

export interface OperatorExplanation {
  /** One-line plain-English summary of the current recommendation. */
  headline: string;
  /** Compact NEEDS rows (UNRESOLVED only). */
  needs: NeedRow[];
  /** One-line plain-English "why unresolved" (UNRESOLVED only). */
  whyUnresolved: string | null;
  /** True when the DESIRED call-away question can legitimately be asked. */
  canAskCallAway: boolean;
}

/** The operator-facing call-away question. Captures DESIRED disposition, not tolerance. */
export function callAwayQuestion(subject: DecisionSubject, strike: number | null): string {
  const at = strike != null ? ` at $${strike}` : "";
  return `Do you want ${subject.symbol} to be called away${at}?`;
}

/** Plain-English subject line, e.g. "COPX · covered call" / "COPX share block". */
export function subjectSummary(subject: DecisionSubject): string {
  return subject.subjectType === "covered-call"
    ? `${subject.symbol} · covered call`
    : `${subject.symbol} · share block`;
}

export function explainForOperator(
  recommendation: GovernedRecommendation,
  unresolvedCauses: string[],
  subject: DecisionSubject,
): OperatorExplanation {
  if (recommendation === "LET_RESOLVE") {
    return {
      headline: `Let the ${subject.symbol} covered call resolve on its own — no action now.`,
      needs: [],
      whyUnresolved: null,
      canAskCallAway: false,
    };
  }
  if (recommendation === "SELL_CALL") {
    return {
      headline: `Sell a call against the ${subject.symbol} shares (which call is a separate step).`,
      needs: [],
      whyUnresolved: null,
      canAskCallAway: false,
    };
  }

  // UNRESOLVED — translate causes into compact operator-language NEEDS rows.
  const causes = new Set(unresolvedCauses);
  const needsScopeAssociation = [...causes].some((c) => SCOPE_ASSOCIATION_CAUSES.has(c));
  const callAwayMissing = causes.has("call-away-stance-not-accepted");
  const hasUndefinedPolicyBoundary = [...causes].some((c) => UNDEFINED_POLICY_CAUSES.has(c));

  const needs: NeedRow[] = [];
  needs.push({
    label: "Wheel program membership",
    status: needsScopeAssociation ? "Not established" : "Established",
  });
  if (!needsScopeAssociation) {
    needs.push({
      label: "Call-away intent",
      status: callAwayMissing ? "Not established" : "Established",
    });
  }
  if (causes.has("evidence-insufficient")) {
    needs.push({ label: "Position evidence", status: "Not yet authoritative" });
  }
  if (hasUndefinedPolicyBoundary) {
    needs.push({ label: "Eligibility / intervention", status: "No governed determination" });
  }

  const whyUnresolved = needsScopeAssociation
    ? `No governed Wheel association exists for this ${subject.symbol} ${subject.subjectType === "covered-call" ? "call" : "share block"}. WW will not infer Wheel membership from the position itself.`
    : hasUndefinedPolicyBoundary
      ? "A governed condition this decision depends on is not defined in WW's ratified rules, so WW holds at UNRESOLVED rather than guessing."
      : callAwayMissing
        ? `WW does not yet know your intended call-away disposition for ${subject.symbol}.`
        : "Required governance or evidence is not yet established.";

  return {
    headline: `WW cannot make a recommendation for ${subject.symbol} yet.`,
    needs,
    whyUnresolved,
    // Ask call-away only when it is the missing bounded fact AND a scope association exists.
    canAskCallAway: callAwayMissing && !needsScopeAssociation,
  };
}
