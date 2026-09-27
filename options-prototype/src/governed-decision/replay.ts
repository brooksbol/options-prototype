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
  /** Whether the recomputed Recommendation token matched the persisted one. */
  recommendationMatch: boolean;
  /** Whether the recomputed complete predicate picture matched the persisted one (ADR-021 §10). */
  predicatePictureMatch: boolean;
  /** Human-facing detail for mismatch/unsupported reporting. */
  detail: string;
}

/** Canonical stable string for a predicate picture, for order-sensitive comparison. */
function canonicalizePicture(results: import("./predicate").PredicateResult[]): string {
  return results
    .map((p) => `${p.key}=${p.status}${p.blockedBy && p.blockedBy.length ? `[${[...p.blockedBy].sort().join(",")}]` : ""}`)
    .join("|");
}

/**
 * Whether this build can dispatch the historical evaluator version. A future version
 * bump that changes semantics must keep the old version dispatchable (or report
 * UNSUPPORTED_EVALUATOR_VERSION) — never silently re-run new semantics against old inputs.
 */
export function isEvaluatorVersionSupported(id: EvaluatorId, version: string): boolean {
  // This build ships version "2" of both evaluators (ADR-021 predicate-picture semantics).
  // A future bump must keep old versions dispatchable or report UNSUPPORTED.
  return EVALUATOR_VERSION[id] === version;
}

/**
 * Re-execute the historical evaluator against the recovered bundle and compare BOTH the
 * Recommendation and the complete predicate picture (ADR-021 §10). Anti-hindsight: the
 * recovered bundle is the sole input; current context/attestations are never consulted.
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
      recommendationMatch: false,
      predicatePictureMatch: false,
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

  const evaluation =
    bundle.consumed.kind === "covered-call"
      ? evaluateCoveredCall(bundle.consumed.facts, inputs)
      : evaluateSharePhase(bundle.consumed.facts, inputs);
  const recomputed = evaluation.recommendation;

  const recommendationMatch = recomputed === persisted;
  // Compare the complete predicate picture when one was persisted (ADR-021 v2 Decisions).
  // A pre-picture persisted result (empty) is treated as picture-agnostic MATCH on picture.
  const persistedPicture = persistedResult.predicateResults ?? [];
  const predicatePictureMatch =
    persistedPicture.length === 0
      ? true
      : canonicalizePicture(evaluation.predicateResults) === canonicalizePicture(persistedPicture);

  if (recommendationMatch && predicatePictureMatch) {
    return {
      status: "MATCH",
      recomputed,
      persisted,
      recommendationMatch,
      predicatePictureMatch,
      detail: "Recomputed Recommendation and predicate picture match the persisted historical Decision.",
    };
  }

  return {
    status: "MISMATCH",
    recomputed,
    persisted,
    recommendationMatch,
    predicatePictureMatch,
    detail:
      `Replay mismatch: recommendation ${recommendationMatch ? "matched" : `recomputed ${recomputed} vs persisted ${persisted}`}; ` +
      `predicate picture ${predicatePictureMatch ? "matched" : "differed"}. ` +
      `The durable record and re-execution disagree; investigate integrity/version binding.`,
  };
}
