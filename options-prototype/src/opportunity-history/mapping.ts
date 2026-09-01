/**
 * Opportunity-History — Funnel/Outcome -> Evaluation-State Mapping (pure)
 *
 * Translates the recommendation engines' per-surface and per-symbol evaluation outcomes
 * into policy-neutral fact states. This is the ONLY place the engine's internal
 * classification vocabulary is mapped to the durable fact vocabulary, so the fact plane
 * never inherits engine-internal naming and remains scheduler-independent.
 *
 * The mapping is total and unambiguous: every possible per-surface outcome maps to exactly
 * one SurfaceEvaluationState; every per-symbol outcome maps to exactly one
 * SymbolEvaluationState. Property tests assert totality and the EVALUATED/NOT_EVALUATED
 * partition.
 */

import type {
  SurfaceEvaluationState,
  SymbolEvaluationState,
  WinnerEconomics,
} from "./opportunity-fact";
import { QUALIFYING_SURFACE_STATES } from "./opportunity-fact";

// --- Per-surface evaluation outcome (what the engine knows after evaluating one surface) ---
//
// This is a neutral description of the outcome the engine already computes per (symbol,
// expiration). The engine populates it; the mapper converts it to a fact state + winner.

export type SurfaceOutcomeKind =
  | { kind: "qualified"; posture: "ACTIONABLE" | "EDGE" | "WAIT"; winner: WinnerEconomics }
  | { kind: "wide_spread"; winner: WinnerEconomics }
  | { kind: "no_delta_match" }
  | { kind: "hard_no_zero_bid" }
  | { kind: "hard_no_zero_oi" }
  | { kind: "strategy_unfit" } // buy-write only
  | { kind: "stale" }          // chain present but failed freshness/admissibility
  | { kind: "no_chain" };      // expirations known; chain absent for this expiration

export function mapSurfaceOutcome(outcome: SurfaceOutcomeKind): {
  state: SurfaceEvaluationState;
  winner: WinnerEconomics | null;
} {
  switch (outcome.kind) {
    case "qualified":
      switch (outcome.posture) {
        case "ACTIONABLE":
          return { state: "QUALIFIED_ACTIONABLE", winner: outcome.winner };
        case "EDGE":
          return { state: "QUALIFIED_EDGE", winner: outcome.winner };
        case "WAIT":
          return { state: "EVALUATED_WAIT", winner: outcome.winner };
      }
    // eslint-disable-next-line no-fallthrough
    case "wide_spread":
      return { state: "EVALUATED_WIDE_SPREAD", winner: outcome.winner };
    case "no_delta_match":
      return { state: "EVALUATED_NO_DELTA_MATCH", winner: null };
    case "hard_no_zero_bid":
      return { state: "EVALUATED_HARD_NO_ZERO_BID", winner: null };
    case "hard_no_zero_oi":
      return { state: "EVALUATED_HARD_NO_ZERO_OI", winner: null };
    case "strategy_unfit":
      return { state: "EVALUATED_STRATEGY_UNFIT", winner: null };
    case "stale":
      return { state: "NOT_EVALUATED_STALE", winner: null };
    case "no_chain":
      return { state: "NOT_EVALUATED_NO_CHAIN", winner: null };
  }
}

// --- Per-symbol evaluation outcome (symbol-scope; no surface) ---

export type SymbolOutcomeKind =
  | { kind: "has_evaluable_surfaces" }
  | { kind: "pending" }        // not yet resolved (no expirations)
  | { kind: "no_dte" }         // no expiration in eligible DTE range
  | { kind: "non_optionable" };// confirmed absence

export function mapSymbolOutcome(outcome: SymbolOutcomeKind): SymbolEvaluationState {
  switch (outcome.kind) {
    case "has_evaluable_surfaces":
      return "HAS_EVALUABLE_SURFACES";
    case "pending":
      return "NOT_EVALUATED_PENDING";
    case "no_dte":
      return "NOT_EVALUATED_NO_DTE";
    case "non_optionable":
      return "NON_OPTIONABLE";
  }
}

// --- Invariant helpers (used by consumers and tests) ---

/** Winner economics MUST be present iff the state is a qualifying/wait/wide-spread state. */
export function requiresWinner(state: SurfaceEvaluationState): boolean {
  return QUALIFYING_SURFACE_STATES.has(state);
}

/** True for states proving the surface WAS examined (survivorship-safe). */
export function isEvaluatedState(state: SurfaceEvaluationState): boolean {
  return (
    state === "QUALIFIED_ACTIONABLE" ||
    state === "QUALIFIED_EDGE" ||
    state === "EVALUATED_WAIT" ||
    state === "EVALUATED_NO_DELTA_MATCH" ||
    state === "EVALUATED_HARD_NO_ZERO_BID" ||
    state === "EVALUATED_HARD_NO_ZERO_OI" ||
    state === "EVALUATED_WIDE_SPREAD" ||
    state === "EVALUATED_STRATEGY_UNFIT"
  );
}

/** True for states proving the surface was NOT examined (and why). */
export function isNotEvaluatedState(state: SurfaceEvaluationState): boolean {
  return state === "NOT_EVALUATED_STALE" || state === "NOT_EVALUATED_NO_CHAIN";
}
