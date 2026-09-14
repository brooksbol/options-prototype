/**
 * Funnel Export — shared contract for exporting the exact evaluation-unit
 * membership that produced a strategy's visible Decision funnel.
 *
 * BUG-016 (observability): the Deployment funnels expose aggregate counts
 * without preserving/exporting the exact per-evaluation-unit terminal-outcome
 * membership that produced them. This module defines the immutable, per-strategy
 * export result each engine attaches to its output.
 *
 * SOURCE-OF-TRUTH INVARIANT
 * -------------------------
 * The visible aggregate counters MUST be derived from the same membership
 * collection that is exported. Membership and displayed counts cannot diverge
 * because they are computed from one array (see `deriveCounters`).
 *
 * PARTITION INVARIANT (addendum)
 * ------------------------------
 * Every governed evaluation unit appears exactly once. The sum of ALL
 * terminal-outcome groups — named categories PLUS any residual/other bucket —
 * equals the strategy's displayed governed denominator, not merely the sum of
 * the visible named categories.
 *
 * This module performs NO acquisition, NO evidence mutation, and NO Decision
 * reruns. It is a pure, in-memory description of a Decision run that already
 * happened.
 */

/** The three Deployment strategy surfaces. */
export type ExportStrategy = "csp" | "covered_call" | "buy_write";

/**
 * The kind of governed evaluation unit a row represents. Each strategy uses the
 * unit that matches its ACTUAL governed denominator — we do not force all three
 * into an artificial symbol-only model.
 *
 * - `universe_symbol`   — CSP: one row per monitored universe symbol.
 * - `evaluated_symbol`  — Buy-write: one row per symbol evaluated by the engine.
 * - `holding`           — Covered call: one row per governed inventory holding
 *                         (position with call-writing capacity).
 */
export type EvaluationUnitType = "universe_symbol" | "evaluated_symbol" | "holding";

/**
 * Run metadata — provenance captured at the moment the Decision result is
 * produced. Immutable once built. When a newer Decision run arrives it produces
 * a NEW result object with a NEW `decisionRunId`; exporting an existing result
 * never mints a new id.
 */
export interface DecisionRunMetadata {
  /** Strategy this result belongs to. */
  strategy: ExportStrategy;
  /**
   * Locally-unique, stable-for-this-result identifier. Created ONCE when the
   * result is produced (not when it is exported). Deterministic in shape:
   * `<strategy>-gen<generation>-<sessionDate>-<epochMs>-<seq>`.
   */
  decisionRunId: string;
  /** ISO timestamp when the Decision run that produced this result completed. */
  evaluatedAt: string;
  /** Backend evidence snapshot generation in effect, or null if unknown. */
  evidenceGeneration: number | null;
  /** RecommendationPolicy.version applied. */
  policyVersion: string;
  /** Market-session state at Decision time (e.g. CLOSED_CANONICAL). */
  sessionState: string;
  /** Canonical session date the evidence belongs to (YYYY-MM-DD), or null. */
  canonicalSessionDate: string | null;
  /** Provider environment producing the evidence: "production" | "sandbox" | "unknown". */
  evidenceEnvironment: string;
}

/**
 * One terminal-outcome record for one governed evaluation unit. Exactly one
 * record per unit; exactly one `terminalOutcome` per record.
 *
 * `terminalOutcome` is the strategy-native terminal state (each strategy
 * preserves its own taxonomy — see the engine result modules). `terminalReason`
 * is an optional human-readable elaboration.
 */
export interface TerminalMembershipRecord {
  evaluationUnitType: EvaluationUnitType;
  symbol: string;
  /** Holding/lot identifier where the unit is a holding; blank otherwise. */
  holdingOrLotId: string | null;
  /** Expiration where the governed unit is expiration-specific; blank otherwise. */
  expiration: string | null;
  /** Strategy-native terminal outcome (the single bucket this unit landed in). */
  terminalOutcome: string;
  /** Optional elaboration; blank when not applicable. */
  terminalReason: string | null;
  /**
   * Operator-facing evidence acquisition instant for this unit's evidence, if
   * available (ISO). Blank when no admissible evidence participated. Never
   * reconstructed from cache TTL — copied from established provenance only.
   */
  evidenceRetrievedAt: string | null;
  /** Backend per-subject admissibility verdict if known: true/false/null. */
  admissible: boolean | null;
  /**
   * Optional strategy-specific metadata already available at Decision time.
   * MUST NOT trigger additional data acquisition. Rendered as extra CSV columns.
   */
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * The complete, immutable exportable result for ONE strategy from ONE Decision
 * run. Contains run metadata, the terminal membership records, and the derived
 * aggregate counters. A newer run replaces this object atomically.
 */
export interface DecisionExportResult {
  metadata: DecisionRunMetadata;
  /** One record per governed evaluation unit. */
  membership: readonly TerminalMembershipRecord[];
  /**
   * Derived aggregate counters: terminal-outcome -> count. Computed FROM
   * `membership` (never independently accumulated), so displayed counts and
   * exported membership cannot diverge.
   */
  derivedCounters: Readonly<Record<string, number>>;
  /**
   * The governed denominator this strategy displays. Equals `membership.length`
   * and equals the sum of all `derivedCounters` values (partition invariant).
   */
  denominator: number;
}

/**
 * Derive aggregate terminal-outcome counters from membership. This is the ONLY
 * sanctioned way to produce the counters, guaranteeing membership/counts parity.
 */
export function deriveCounters(
  membership: readonly TerminalMembershipRecord[],
): Record<string, number> {
  const counters: Record<string, number> = {};
  for (const record of membership) {
    counters[record.terminalOutcome] = (counters[record.terminalOutcome] ?? 0) + 1;
  }
  return counters;
}

/**
 * Derive counters as a typed record over a fixed set of terminal-outcome keys.
 * Every key in `keys` is present (defaulting to 0), and no membership record may
 * carry a terminal outcome outside `keys` — an unknown key means the taxonomy and
 * the accounting have drifted apart, which is a defect, not a silently-tolerated
 * state. Used by each engine to build its visible funnel/outcomes object from the
 * SAME membership collection that is exported (single accounting authority).
 */
export function deriveTypedCounters<K extends string>(
  membership: readonly TerminalMembershipRecord[],
  keys: readonly K[],
): Record<K, number> {
  const allowed = new Set<string>(keys);
  const counters = {} as Record<K, number>;
  for (const k of keys) counters[k] = 0;
  for (const record of membership) {
    if (!allowed.has(record.terminalOutcome)) {
      throw new Error(
        `[funnel-export] membership carries terminal outcome "${record.terminalOutcome}" ` +
          `not in the strategy taxonomy [${keys.join(", ")}] — accounting/taxonomy drift`,
      );
    }
    counters[record.terminalOutcome as K] += 1;
  }
  return counters;
}

/**
 * Runtime reconciliation invariant for a complete strategy Decision result:
 *
 *   membership.length === governed denominator
 *   sum(all derived terminal counters) === governed denominator
 *
 * These are defensive correctness assertions, not fallback logic. A violation
 * means the single-accounting-authority guarantee has been broken. This throws
 * (fail loudly) so development and tests surface the drift rather than silently
 * repairing, dropping, or exporting inconsistent membership. Callers that must
 * remain non-fatal in production should catch and treat the result as INVALID
 * for display/export (never exported as if complete).
 */
export function assertReconciled(
  membership: readonly TerminalMembershipRecord[],
  governedDenominator: number,
  strategy: ExportStrategy,
): void {
  if (membership.length !== governedDenominator) {
    throw new Error(
      `[funnel-export] ${strategy}: membership.length (${membership.length}) !== governed denominator (${governedDenominator})`,
    );
  }
  const sum = Object.values(deriveCounters(membership)).reduce((s, n) => s + n, 0);
  if (sum !== governedDenominator) {
    throw new Error(
      `[funnel-export] ${strategy}: sum of derived terminal counters (${sum}) !== governed denominator (${governedDenominator})`,
    );
  }
}

/**
 * Assemble an immutable DecisionExportResult from run metadata + membership.
 * Counters and denominator are derived here — callers never pass them in.
 */
export function buildDecisionExportResult(
  metadata: DecisionRunMetadata,
  membership: TerminalMembershipRecord[],
): DecisionExportResult {
  const derivedCounters = deriveCounters(membership);
  return {
    metadata,
    membership,
    derivedCounters,
    denominator: membership.length,
  };
}

let runSequence = 0;

/**
 * Create a locally-unique, deterministic-shape Decision run identifier at the
 * moment a result is PRODUCED. Not called on export.
 *
 * Shape: `<strategy>-gen<generation|na>-<sessionDate|na>-<epochMs>-<seq>`.
 * The monotonic `seq` disambiguates runs produced within the same millisecond
 * (e.g. the three strategies of one evaluation pass, or rapid policy changes).
 */
export function createDecisionRunId(
  strategy: ExportStrategy,
  evidenceGeneration: number | null,
  canonicalSessionDate: string | null,
  epochMs: number = Date.now(),
): string {
  const gen = evidenceGeneration == null ? "na" : String(evidenceGeneration);
  const day = canonicalSessionDate == null ? "na" : canonicalSessionDate;
  const seq = runSequence++;
  return `${strategy}-gen${gen}-${day}-${epochMs}-${seq}`;
}
