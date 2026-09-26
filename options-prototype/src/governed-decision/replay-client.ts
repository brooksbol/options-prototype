/**
 * Replay client (P3) — fetch a persisted Decision and execute historical replay.
 *
 * Reconstructs the exact DecisionInputBundle from the durable record's `inputBundleJson`
 * (the replay-bound consumed inputs) and re-runs the pinned evaluator via `replayDecision`.
 * It consults ONLY the persisted record — never current context/portfolio/evidence.
 */

import { fetchGovernedDecision } from "./client";
import { replayDecision, type ReplayOutcome } from "./replay";
import type { DecisionInputBundle, DecisionResult } from "./decision-bundle";
import type { GovernedRecommendation } from "./types";

export interface ReplayFetchOutcome extends ReplayOutcome {
  decisionId: string;
  /** True when the persisted bundle_hash matches a recomputed hash over the recovered bundle. */
  bundleIntegrityOk: boolean;
}

/**
 * Load a persisted Decision by id and replay it. Returns null when the Decision does not
 * exist. Reports MATCH / MISMATCH / UNSUPPORTED_EVALUATOR_VERSION plus a bundle-integrity
 * check derived purely from recovered content.
 */
export async function loadAndReplay(
  decisionId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ReplayFetchOutcome | null> {
  const row = await fetchGovernedDecision(decisionId, fetchImpl);
  if (!row) return null;

  const bundle = JSON.parse(String(row.inputBundleJson)) as DecisionInputBundle;
  const persistedResult: DecisionResult = {
    recommendation: String(row.recommendation) as GovernedRecommendation,
    reasons: JSON.parse(String(row.reasoningJson ?? "[]")),
    unresolvedCauses: JSON.parse(String(row.unresolvedCausesJson ?? "[]")),
  };

  const outcome = replayDecision(bundle, persistedResult);

  // Integrity: recompute the canonical hash over the recovered bundle and compare to the
  // persisted bundle_hash. A mismatch means the stored bundle was altered/corrupted.
  const { bundleHash } = await import("./decision-bundle");
  const bundleIntegrityOk = bundleHash(bundle) === String(row.bundleHash);

  return { ...outcome, decisionId, bundleIntegrityOk };
}
