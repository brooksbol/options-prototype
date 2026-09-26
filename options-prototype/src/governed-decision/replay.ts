/**
 * Executable historical replay (P3).
 *
 * Replay recovers an immutable Decision's pinned Context Version and exact consumed
 * inputs, dispatches to the HISTORICAL evaluator version, re-runs it, and compares the
 * recomputed Recommendation/reasoning against what was persisted.
 *
 * It NEVER consults current context, current portfolio, current eligibility, current
 * P&L, or later lifecycle/operator events to decide what the historical answer should
 * have been. The recovered bundle is the sole input.
 *
 * Replay is real re-execution, not text comparison: it calls the same pure evaluator
 * the original Decision used.
 */

import { evaluateCoveredCall, evaluateSharePhase } from "./evaluators";
import type { GovernedInputsBase } from "./evaluators";
import type { DecisionInputBundle, DecisionResult } from "./decision-bundle";
import type { EvaluatorId, GovernedRecommendation } from "./types";
import { EVALUATOR_VERSION } from "./types";

export type ReplayStatus =
  | "MATCH"
  | "MISMATCH"
  | "UNSUPPORTED_EVALUATOR_VERSION";

export interface ReplayOutcome {
  status: ReplayStatus;
  /** The Recommendation recomputed by re-running the historical evaluator (null if unsupported). */
  recomputed: GovernedRecommendation | null;
  /** The Recommendation as originally persisted. */
  persisted: GovernedRecommendation;
  /** Human-facing detail for mismatch/unsupported reporting. */
  detail: string;
}

/**
 * Whether this build can dispatch the historical evaluator version. A future version
 * bump that changes semantics must keep the old version dispatchable (or report
 * UNSUPPORTED_EVALUATOR_VERSION) — never silently re-run new semantics against old inputs.
 */
export function isEvaluatorVersionSupported(id: EvaluatorId, version: string): boolean {
  // This build ships version "1" of both evaluators. When a v2 is introduced, this
  // registry must dispatch to the correct historical implementation rather than assume
  // the current one.
  return EVALUATOR_VERSION[id] === version;
}

/**
 * Re-execute the historical evaluator against the recovered bundle.
 */
export function replayDecision(
  bundle: DecisionInputBundle,
  persistedResult: DecisionResult,
): ReplayOutcome {
  const persisted = persistedResult.recommendation;

  if (!isEvaluatorVersionSupported(bundle.evaluatorId, bundle.evaluatorVersion)) {
    return {
      status: "UNSUPPORTED_EVALUATOR_VERSION",
      recomputed: null,
      persisted,
      detail:
        `Historical evaluator ${bundle.evaluatorId}@${bundle.evaluatorVersion} is not dispatchable ` +
        `by this build (current ${bundle.evaluatorId}@${EVALUATOR_VERSION[bundle.evaluatorId]}). ` +
        `Replay withheld rather than re-run mismatched semantics.`,
    };
  }

  const inputs: GovernedInputsBase = {
    context: bundle.contextVersion,
    associationEstablished: bundle.associationEstablished,
  };

  let recomputed: GovernedRecommendation;
  if (bundle.consumed.kind === "covered-call") {
    recomputed = evaluateCoveredCall(bundle.consumed.facts, inputs).recommendation;
  } else {
    recomputed = evaluateSharePhase(bundle.consumed.facts, inputs).recommendation;
  }

  if (recomputed === persisted) {
    return {
      status: "MATCH",
      recomputed,
      persisted,
      detail: "Recomputed Recommendation matches the persisted historical Recommendation.",
    };
  }

  return {
    status: "MISMATCH",
    recomputed,
    persisted,
    detail:
      `Replay mismatch: recomputed ${recomputed} but persisted ${persisted}. ` +
      `The durable record and re-execution disagree; investigate integrity/version binding.`,
  };
}
