/**
 * Rule-local predicate-result contract (ADR-021 / Doc 67).
 *
 * The evaluator's semantic source of truth is no longer a first-blocker cause string. Each
 * evaluator version returns a COMPLETE, ordered accounting of the predicates relevant to
 * that rule, using the canonical eight-state taxonomy. "Complete" means every relevant
 * predicate has a truthful state — NOT that dependency-blocked predicates were evaluated.
 *
 * SCOPE DISCIPLINE (ADR-021 §12, Doc 67 §4/§15):
 *   - This is NOT a generic predicate/workflow/dependency engine. Predicate keys, order,
 *     and dependencies are finite, rule-local, and evaluator-versioned.
 *   - Resolution metadata is DERIVED rule/capability metadata, not mutable workflow state.
 *   - Status alone never enables an operator control; admissibility is a separate gate.
 */

/**
 * Canonical predicate semantic status (ADR-021 §2 / Doc 67 §3). This is the smallest
 * taxonomy that preserves current authority; each value is load-bearing and must not be
 * collapsed into another.
 */
export type PredicateStatus =
  /** Evaluated under its governing semantics and true. */
  | "SATISFIED"
  /** Evaluated and false: a KNOWN NEGATIVE, not uncertainty. */
  | "NOT_SATISFIED"
  /** Meaningful and evaluable, but the required fact is not known at the boundary. */
  | "UNKNOWN"
  /** Evidence exists or is required but cannot authoritatively support a result. */
  | "EVIDENCE_INSUFFICIENT"
  /** The fact/association needs an authority-bearing assertion; none applicable is established. */
  | "AUTHORITY_MISSING"
  /** Evaluation needs governing policy/semantics that are not ratified/versioned. */
  | "POLICY_UNDEFINED"
  /** Deliberately not evaluated because named prerequisite result(s) were unavailable. */
  | "NOT_EVALUATED"
  /** An evaluated applicability condition established that this predicate does not govern. */
  | "NOT_APPLICABLE";

/**
 * The authorized mechanism (if any) that could change a predicate's input at a FUTURE
 * decision boundary (ADR-021 §3 / Doc 67 §5). Derived metadata; a predicate may advertise
 * more than one. NONE_IN_SLICE means no mechanism is available within this bounded slice.
 */
export type ResolutionMode =
  | "OPERATOR_GOVERNANCE"
  | "AUTHORITATIVE_EVIDENCE"
  | "DETERMINISTIC_POLICY_EVALUATION"
  | "LIFECYCLE_EVENT"
  | "PROGRAM_CONFIGURATION"
  | "PRINCIPAL_AUTHORITY"
  | "NONE_IN_SLICE";

/** Availability of an advertised resolution mechanism within this slice. */
export type ResolutionAvailability = "available" | "unavailable";

/**
 * A single advertised resolution affordance for a predicate. It identifies the mechanism,
 * whether it is actually available in this slice, and a stable capability id a consumer can
 * map to an admissibility manifest (Doc 67 §6). It never itself enables a control.
 */
export interface ResolutionAffordance {
  mode: ResolutionMode;
  availability: ResolutionAvailability;
  /** Stable capability/write-contract identifier a control manifest can reference, or null. */
  capabilityId: string | null;
  /** Operator-language explanation of the mechanism, when defined. */
  explanation?: string;
}

/**
 * One rule-local predicate result. Ordered position is assigned by the evaluator. For
 * NOT_EVALUATED, `blockedBy` names the exact prerequisite predicate keys that prevented
 * valid evaluation (never empty for NOT_EVALUATED).
 */
export interface PredicateResult {
  /** Stable rule-local predicate key (e.g. "wheel-membership", "call-away-preacceptance"). */
  key: string;
  /** Operator-facing short label. */
  label: string;
  status: PredicateStatus;
  /** Prerequisite predicate keys that blocked evaluation (present iff NOT_EVALUATED). */
  blockedBy?: string[];
  /** Plain-language reason for the status. */
  reason: string;
  /** Derived resolution affordances (may be empty). */
  resolution: ResolutionAffordance[];
}

/** Convenience constructors keep evaluator code terse and consistent. */
export function predicate(
  key: string,
  label: string,
  status: PredicateStatus,
  reason: string,
  resolution: ResolutionAffordance[] = [],
  blockedBy?: string[],
): PredicateResult {
  const r: PredicateResult = { key, label, status, reason, resolution };
  if (status === "NOT_EVALUATED") {
    r.blockedBy = blockedBy && blockedBy.length > 0 ? blockedBy : ["<unspecified-prerequisite>"];
  }
  return r;
}

/** A predicate deliberately not evaluated because prerequisites were unavailable. */
export function notEvaluated(
  key: string,
  label: string,
  blockedBy: string[],
  reason: string,
): PredicateResult {
  return { key, label, status: "NOT_EVALUATED", blockedBy, reason, resolution: [] };
}
