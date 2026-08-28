/**
 * Opportunity-History Fact Plane — Core Types (Piece 1, observe-only)
 *
 * PURPOSE (ratified 2026-08-27 3AM ruling + capacity reframing):
 *   Retain the minimum POLICY-NEUTRAL Decision/evidence facts necessary to later
 *   estimate the historical opportunity usefulness of a decision SURFACE relative
 *   to the acquisition capacity required to keep it decision-fresh.
 *
 *   The governing question this plane exists to answer:
 *     "Which ~28% of continuously-serviced provider workload can Wheelwright stop
 *      paying to keep fresh, at the lowest demonstrated opportunity cost?"
 *
 * WHAT THIS IS:
 *   An append-only, duplicate-safe record of Decision-evaluation OUTCOMES, keyed by
 *   evidence input. One fact per distinct evidence input per surface/policy.
 *
 * WHAT THIS IS NOT:
 *   - Not a usefulness/membership/quality score (persist facts; DERIVE usefulness later)
 *   - Not a Deployment-board snapshot (no ranking, no top-N, no cross-symbol ordering)
 *   - Not browser-execution telemetry (repeated evaluation of unchanged evidence is NOT a fact)
 *   - Not coupled to scheduler class names (A/B/C/D). Facts are described by EVALUATION
 *     STATE and evidence freshness, independent of whatever scheduler taxonomy exists.
 *     The plane must survive a scheduler rewrite.
 *   - Not full per-contract chain topology (winner-only economics for V1; full-surface
 *     liquidity topology is a DEFERRED, addable-later concern — see KNOWN LOSS below).
 *
 * KNOWN LOSS (V1, deferred): we retain only the surface WINNER's economics, not the
 * full strike surface. This answers qualification persistence, yield persistence, and
 * winner spread/liquidity stability. It does NOT answer full-surface liquidity topology.
 * Recorded as an accepted, later-addable limitation.
 *
 * COST-DERIVATION INVARIANT (corrected):
 *   An epoch is an INCREMENTAL, evidence-driven batch — it contains only the surfaces whose
 *   evidence changed in that event. It is NOT a complete snapshot of a symbol's required
 *   surfaces. Therefore you must NOT infer required-surface-count from COUNT(DISTINCT
 *   expiration) within a single epoch.
 *
 *   Instead, the plane supports a BETTER cost measure:
 *     - Historical acquisition burden = count of distinct evidence-input observations
 *       (each surface_observation corresponds to a new chain retrieval Decision consumed)
 *       for a symbol/surface over a session/window. This measures ACTUAL provider work spent.
 *     - Maintained surface topology = the UNION of distinct expirations observed for a symbol
 *       over an appropriate session/window — never one incremental epoch.
 *
 *   Stable (symbol, expiration, chainRetrievedAt) identity therefore allows later derivation
 *   of BOTH historical opportunity production AND historical acquisition burden. No
 *   acquisition-cost field is stored; burden is the observable count of distinct retrievals.
 */

// --- Strategy (which Decision engine evaluated the surface) ---

export type OpportunityStrategy = "csp" | "buy_write";

// --- Surface-level evaluation state ---
//
// EVERY state below requires that an actual (symbol, expiration) surface exists.
// The load-bearing invariant: EVALUATED_* proves the surface WAS examined and failed a
// specific gate (survivorship-safe); NOT_EVALUATED_* proves it was NOT examined and why.
// These are recorded facts, never absences.

export type SurfaceEvaluationState =
  // --- QUALIFIED: surface produced a governed candidate (winner economics present) ---
  | "QUALIFIED_ACTIONABLE" // best candidate posture ACTIONABLE
  | "QUALIFIED_EDGE"        // best candidate posture EDGE
  // --- EVALUATED but did not qualify (surface examined; specific gate failed) ---
  | "EVALUATED_WAIT"            // best candidate below EDGE (winner economics present)
  | "EVALUATED_NO_DELTA_MATCH"  // chain present; no contract in admissible delta band
  | "EVALUATED_HARD_NO_ZERO_BID"// chain present; only zero-bid contracts
  | "EVALUATED_HARD_NO_ZERO_OI" // chain present; only zero-OI contracts
  | "EVALUATED_WIDE_SPREAD"     // chain present; only wide-spread contracts (partial winner economics)
  | "EVALUATED_STRATEGY_UNFIT"  // (buy-write) chain present; no positive-appreciation strike
  // --- NOT EVALUATED (surface exists in principle but was not examinable) ---
  | "NOT_EVALUATED_STALE"    // chain present but failed freshness/admissibility gate (the DTE-22 fact)
  | "NOT_EVALUATED_NO_CHAIN";// expirations known; chain evidence absent for this expiration

/** States for which winner economics MUST be present. */
export const QUALIFYING_SURFACE_STATES: ReadonlySet<SurfaceEvaluationState> = new Set([
  "QUALIFIED_ACTIONABLE",
  "QUALIFIED_EDGE",
  "EVALUATED_WAIT",
  "EVALUATED_WIDE_SPREAD",
]);

// --- Symbol-level evaluation state (NO surface exists) ---
//
// These are truthfully symbol-scope: there is no expiration/surface to describe.
// We do NOT invent an expiration to fit them into the surface table.

export type SymbolEvaluationState =
  | "HAS_EVALUABLE_SURFACES" // symbol had >=1 eligible surface; detail is in surface rows
  | "NOT_EVALUATED_PENDING"  // symbol not yet resolved (no expirations)
  | "NOT_EVALUATED_NO_DTE"   // no expiration in eligible DTE range
  | "NON_OPTIONABLE";        // confirmed absence

// --- Winner economics (raw governed facts of the surface's best candidate) ---
//
// Raw observed economics ONLY. No derived score, no ranking. Present iff the surface
// state is a qualifying/wait/wide-spread state; null otherwise.

export interface WinnerEconomics {
  delta: number;
  strike: number;
  mid: number;            // midpoint premium
  spreadPercent: number;
  openInterest: number;
  volume: number;
  yieldAnnualized: number; // collateral-normalized annualized yield
  posture: "ACTIONABLE" | "EDGE" | "WAIT";
}

// --- Evaluation epoch (one genuine new-evidence Decision run) ---
//
// An epoch groups observations from one Decision run that encountered NEW evidence
// (or a policy change). It is NOT an execution log: repeated evaluation of unchanged
// evidence under an unchanged policy produces NO epoch.

export interface EvaluationEpoch {
  epochId: string;            // deterministic id (see deriveEpochId)
  startedAt: string;          // ISO8601 UTC
  policyVersion: string;
  evidenceGeneration: number | null; // backend snapshot generation evaluated
  sessionDate: string;        // trading session (epoch) this evaluation belongs to
  sessionPosture: string;     // FULL | EXPIRATIONS_ONLY | BLOCKED (best-known at eval time)
  provider: string;
  environment: string;        // REAL runtime profile (production/sandbox), not a hardcoded label
  symbolsEvaluated: number;   // how many symbols Decision actually examined this run
  emitter: "browser" | "backend"; // 'browser' under B-1; 'backend' post-PL-ARCH-06
}

// --- Symbol observation (symbol-scope fact) ---

export interface SymbolObservation {
  observationId: string; // idempotency key (see deriveSymbolObservationId)
  epochId: string;
  symbol: string;
  symbolState: SymbolEvaluationState;
  observedAt: string;    // ISO8601 UTC
}

// --- Surface observation (surface-scope fact) ---

export interface SurfaceObservation {
  observationId: string; // idempotency key (see deriveSurfaceObservationId)
  epochId: string;
  symbol: string;
  expiration: string;    // ALWAYS present — this row only exists for real surfaces
  dte: number;
  strategy: OpportunityStrategy;
  evaluationState: SurfaceEvaluationState;
  chainRetrievedAt: string; // the evidence-input identity (freshness at decision time)
  observedAt: string;       // ISO8601 UTC
  /** Winner economics — present iff evaluationState is a qualifying/wait/wide-spread state. */
  winner: WinnerEconomics | null;
}

// --- Emission batch (one epoch + its observations) ---

export interface OpportunityHistoryBatch {
  epoch: EvaluationEpoch;
  symbolObservations: SymbolObservation[];
  surfaceObservations: SurfaceObservation[];
}
