/**
 * Bounded governed evaluators (P0).
 *
 * Two pure, deterministic, fail-closed evaluators implementing the Doc 65 bounded
 * rules. They consume ONLY explicit inputs (the applicable Governed Context Version,
 * authoritative evidence facts, and the resolved scope association) so that P3 replay
 * can reproduce them exactly from replay-bound values.
 *
 * INVARIANTS:
 *   - No affirmative Recommendation from mechanical facts alone.
 *   - Missing context / association / evidence => UNRESOLVED.
 *   - Required gate UNKNOWN => UNRESOLVED. Required gate ACTIVE => UNRESOLVED.
 *   - `callAwayStance !== "accepted"` => UNRESOLVED.
 *   - No import of the provisional BTC/HOLD evaluator. No HOLD -> LET_RESOLVE.
 *   - `SELL_CALL` is a PHASE result; it never selects a contract.
 */

import type { GovernedContextVersion } from "./governed-context";
import type {
  EvaluatorId,
  GateState,
  GovernedEvaluation,
  GovernedReason,
} from "./types";
import { EVALUATOR_VERSION } from "./types";

/** Authoritative mechanical/evidence facts for a covered-call subject. */
export interface CoveredCallFacts {
  /** The short call is confirmed current (present in authoritative reconciled state). */
  callIsCurrent: boolean;
  /** The call is authoritatively covered by owned shares (ADR-020 ownership authority). */
  coverageEstablished: boolean;
  /** Whether the required decision evidence is sufficiently authoritative. */
  evidenceSufficient: boolean;
}

/** Authoritative mechanical/evidence facts for a share-block subject. */
export interface ShareBlockFacts {
  /** Authoritatively established free shares in the block (ADR-020). */
  freeShares: number;
  /** Ownership authority behind `freeShares` (ADR-020). Degraded fallback still counts,
   *  but a non-authoritative/absent source should be surfaced by the caller as
   *  insufficient evidence rather than passed as a high freeShares with no authority. */
  ownershipAuthority: "positions" | "option-summary" | null;
  /** Whether the required decision evidence is sufficiently authoritative. */
  evidenceSufficient: boolean;
}

/**
 * Inputs common to both evaluators: the applicable Context Version (already resolved
 * for the subject via an explicit association) or null when no governed context /
 * association is applicable.
 */
export interface GovernedInputsBase {
  /** The pinned applicable Context Version, or null when none is applicable/associated. */
  context: GovernedContextVersion | null;
  /** True iff an explicit evidence-backed subject->scope association was resolved. */
  associationEstablished: boolean;
}

function unresolved(
  evaluatorId: EvaluatorId,
  ruleId: GovernedEvaluation["ruleId"],
  causes: string[],
  reasons: GovernedReason[],
): GovernedEvaluation {
  return {
    recommendation: "UNRESOLVED",
    evaluatorId,
    evaluatorVersion: EVALUATOR_VERSION[evaluatorId],
    ruleId,
    reasons,
    unresolvedCauses: causes.length > 0 ? causes : ["insufficient-governance-or-evidence"],
  };
}

/** A required gate contributes a cause unless it is affirmatively CLEAR. */
function gateBlocks(gate: GateState): "active" | "unknown" | null {
  if (gate === "CLEAR") return null;
  if (gate === "ACTIVE") return "active";
  return "unknown";
}

/**
 * Rule 1 — existing governed covered call => LET_RESOLVE | UNRESOLVED.
 */
export function evaluateCoveredCall(
  facts: CoveredCallFacts,
  inputs: GovernedInputsBase,
): GovernedEvaluation {
  const evaluatorId: EvaluatorId = "wheel-covered-call";
  const ruleId = "DOC65-RULE-1-LET-RESOLVE" as const;
  const causes: string[] = [];

  if (!inputs.associationEstablished || !inputs.context) {
    return unresolved(evaluatorId, ruleId, ["no-governed-scope-association"], [
      { text: "No explicit governed-scope association is established for this subject.", basis: "association" },
    ]);
  }
  const ctx = inputs.context;

  if (!facts.callIsCurrent) causes.push("covered-call-not-current");
  if (!facts.coverageEstablished) causes.push("coverage-not-established");
  if (!facts.evidenceSufficient) causes.push("evidence-insufficient");
  if (ctx.callAwayStance !== "accepted") causes.push("call-away-stance-not-accepted");

  // Only the intervention gate is load-bearing for Rule 1 (Doc 65). eligibility/no-write
  // govern the share-writing phase, not an existing call.
  const intervention = gateBlocks(ctx.interventionGate);
  if (intervention === "active") causes.push("governed-intervention-condition-active");
  if (intervention === "unknown") causes.push("intervention-condition-unknown");

  if (causes.length > 0) {
    return unresolved(evaluatorId, ruleId, causes, [
      { text: "Governed applicability, call-away acceptance, evidence, and intervention clearance are not all established.", basis: "context" },
    ]);
  }

  return {
    recommendation: "LET_RESOLVE",
    evaluatorId,
    evaluatorVersion: EVALUATOR_VERSION[evaluatorId],
    ruleId,
    reasons: [
      { text: "Subject is a current covered call within the associated governed Wheel scope.", basis: "association" },
      { text: "Call-away at the existing strike is a pre-accepted, still-effective disposition.", basis: "call-away" },
      { text: "No governed intervention condition is active; the lifecycle proceeds toward the pre-accepted disposition.", basis: "intervention" },
    ],
    unresolvedCauses: [],
  };
}

/**
 * Rule 2 — eligible unencumbered Wheel shares => SELL_CALL | UNRESOLVED.
 *
 * SELL_CALL is a phase Recommendation; it does not select a contract.
 */
export function evaluateSharePhase(
  facts: ShareBlockFacts,
  inputs: GovernedInputsBase,
): GovernedEvaluation {
  const evaluatorId: EvaluatorId = "wheel-share-phase";
  const ruleId = "DOC65-RULE-2-SELL-CALL" as const;
  const causes: string[] = [];

  if (!inputs.associationEstablished || !inputs.context) {
    return unresolved(evaluatorId, ruleId, ["no-governed-scope-association"], [
      { text: "No explicit governed-scope association is established for this share block.", basis: "association" },
    ]);
  }
  const ctx = inputs.context;

  if (!(facts.freeShares >= 100)) causes.push("insufficient-free-shares-for-one-lot");
  if (facts.ownershipAuthority == null) causes.push("ownership-authority-absent");
  if (!facts.evidenceSufficient) causes.push("evidence-insufficient");
  if (ctx.callAwayStance !== "accepted") causes.push("call-away-stance-not-accepted");

  // Rule 2 load-bearing gates: eligibility AND no-write. (Intervention is the call-side
  // gate and is not required for the share-writing phase decision.)
  const eligibility = gateBlocks(ctx.eligibilityGate);
  if (eligibility === "active") causes.push("program-eligibility-condition-active");
  if (eligibility === "unknown") causes.push("program-eligibility-unknown");

  const noWrite = gateBlocks(ctx.noWriteGate);
  if (noWrite === "active") causes.push("governed-no-write-condition-active");
  if (noWrite === "unknown") causes.push("no-write-condition-unknown");

  if (causes.length > 0) {
    return unresolved(evaluatorId, ruleId, causes, [
      { text: "Governed applicability, eligibility, call-away acceptance, no-write clearance, and evidence are not all established.", basis: "context" },
    ]);
  }

  return {
    recommendation: "SELL_CALL",
    evaluatorId,
    evaluatorVersion: EVALUATOR_VERSION[evaluatorId],
    ruleId,
    reasons: [
      { text: "At least one authoritatively unencumbered 100-share lot belongs to the associated active Wheel scope.", basis: "ownership" },
      { text: "The underlying remains program-eligible and call-away is an accepted disposition.", basis: "eligibility" },
      { text: "No governed no-write condition is active; the inventory should enter the call-writing phase.", basis: "no-write" },
      { text: "This is a phase recommendation (SELL CALL != WHICH CALL?); it does not select a contract.", basis: "context" },
    ],
    unresolvedCauses: [],
  };
}
