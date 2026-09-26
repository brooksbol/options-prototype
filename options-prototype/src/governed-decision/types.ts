/**
 * Governed-decision core types (Candidate B).
 *
 * These are the Wheel-specific BOUNDED Product semantics ratified by
 * `docs/65-principal-ratification-bounded-production-console-wheel-rules-2026-09-26.md`.
 *
 * SCOPE DISCIPLINE:
 *   - The only affirmative Recommendations in this bounded slice are `LET_RESOLVE`
 *     (existing governed covered call) and `SELL_CALL` (eligible unencumbered Wheel
 *     shares — a PHASE recommendation that does NOT select a contract).
 *   - Every insufficiency, missing governance, missing association, missing evidence,
 *     UNKNOWN gate, or ACTIVE (but not-governed-response) gate resolves to `UNRESOLVED`.
 *   - This module MUST NOT import or reuse the provisional BTC/HOLD lifecycle evaluator
 *     policy (`write-desk/short-obligation-decision.ts`). That evaluator is an
 *     implementation seam, not governing Wheel authority. In particular there is NO
 *     mapping HOLD -> LET_RESOLVE.
 *
 * This file defines ONLY vocabulary and value objects. Evaluation logic lives in
 * `evaluators.ts`; governance representation in `governed-context.ts`; subject
 * identity/association in `subject.ts`.
 */

/**
 * The bounded Recommendation vocabulary for THIS walking slice.
 *
 * NOT a universal Recommendation enum. Do not collapse LET_RESOLVE into HOLD,
 * UNRESOLVED into WAIT, or SELL_CALL into an exact option contract.
 */
export type GovernedRecommendation = "LET_RESOLVE" | "SELL_CALL" | "UNRESOLVED";

/**
 * Human-facing projection labels (Console tag). Kept separate from the enum so the
 * enum stays a stable machine token while the label can be presented verbatim.
 */
export const RECOMMENDATION_LABEL: Record<GovernedRecommendation, string> = Object.freeze({
  LET_RESOLVE: "LET RESOLVE",
  SELL_CALL: "SELL CALL",
  UNRESOLVED: "UNRESOLVED",
});

/**
 * Tri-state governed gate (Correction 4). Missing information is UNKNOWN, never CLEAR.
 *   - CLEAR   — affirmatively established that the gate permits a positive Recommendation.
 *   - ACTIVE  — a governed condition is present; because Doc 65 does not ratify the
 *               intervention/no-write RESPONSE, ACTIVE forces UNRESOLVED.
 *   - UNKNOWN — not affirmatively established (this is also the value for any missing gate).
 */
export type GateState = "CLEAR" | "ACTIVE" | "UNKNOWN";

/**
 * Accepted call-away disposition stance for a governed scope. `unknown` is the honest
 * default absent explicit authorized governance and fails closed.
 */
export type CallAwayStance = "accepted" | "unknown";

/**
 * Provenance of a governed fact (ADR-015 discipline extended to governance):
 *   - "operator-governance" — an explicit authority-bearing operator/Principal assertion.
 *   - "broker-evidence"     — authoritative broker-derived evidence.
 *   - "derived"             — deterministically derived from other authoritative facts.
 *   - "unknown"             — not established (never fabricated).
 */
export type GovernanceProvenance =
  | "operator-governance"
  | "broker-evidence"
  | "derived"
  | "unknown";

/** The evaluators shipped in this slice, versioned for replay dispatch (P3). */
export type EvaluatorId = "wheel-covered-call" | "wheel-share-phase";

/** Doc 65 bounded rule identities. */
export type RuleId = "DOC65-RULE-1-LET-RESOLVE" | "DOC65-RULE-2-SELL-CALL";

/**
 * Current evaluator versions. Bumping a version means the historical evaluator must
 * still be dispatchable by P3 replay; never silently reuse a version number after a
 * semantic change.
 */
export const EVALUATOR_VERSION: Record<EvaluatorId, string> = Object.freeze({
  "wheel-covered-call": "1",
  "wheel-share-phase": "1",
});

/** A single governed reason, naming the load-bearing fact/provenance behind it. */
export interface GovernedReason {
  text: string;
  /** Which predicate/fact this reason stands on (audit trail). */
  basis:
    | "subject"
    | "coverage"
    | "association"
    | "context"
    | "call-away"
    | "eligibility"
    | "intervention"
    | "no-write"
    | "evidence"
    | "ownership";
}

/**
 * The bounded result of a governed evaluator. `recommendation` is the machine token;
 * `reasons` explain why it is affirmative or unresolved; `unresolvedCauses` enumerates
 * the specific failed predicate(s) when UNRESOLVED (never empty for UNRESOLVED).
 */
export interface GovernedEvaluation {
  recommendation: GovernedRecommendation;
  evaluatorId: EvaluatorId;
  evaluatorVersion: string;
  ruleId: RuleId;
  reasons: GovernedReason[];
  /** Present (non-empty) iff recommendation === "UNRESOLVED". */
  unresolvedCauses: string[];
}
