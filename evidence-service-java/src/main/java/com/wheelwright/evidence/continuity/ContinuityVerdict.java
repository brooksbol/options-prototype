package com.wheelwright.evidence.continuity;

/**
 * The bounded continuity verdict (ADR-022 / Doc 70 §8). Maps to the ADR-021 predicate
 * vocabulary the browser Decision evaluator consumes. Deliberately narrow: only the
 * whole-quantity opening-anchored applicability question is answered here.
 */
public enum ContinuityVerdict {
    /**
     * The entire original whole quantity Q is proven intact and currently applicable:
     * accepted complete History through a quiet day, no admissible event could reduce any of
     * the governed Q, and a compatible Positions quantity reconciles on the quiet day.
     * (Browser membership predicate => SATISFIED.)
     */
    FULL_Q_INTACT_APPLICABLE,

    /**
     * A required authority-bearing input is missing (no accepted completeness premise, no
     * opening anchor). Not uncertainty about a fact under known semantics. => AUTHORITY_MISSING.
     */
    AUTHORITY_MISSING,

    /**
     * Evidence exists or is required but cannot support the claim: no/incompatible endpoint
     * observation, a non-quiet quiet day, or a temporal ordering that cannot be established
     * from admitted rows. => EVIDENCE_INSUFFICIENT.
     */
    EVIDENCE_INSUFFICIENT,

    /**
     * A known partial survivor of the original Q exists (some but provably not all of Q was
     * reduced), OR governed/ungoverned same-series quantity mixed and a later reduction makes
     * allocation ambiguous. Residual/partial Program applicability is unratified. => POLICY_UNDEFINED.
     */
    POLICY_UNDEFINED,

    /**
     * The original obligation is authoritatively exhausted (fully closed/assigned/expired).
     * A known-negative economic result; identical reopening does not revive the cohort.
     * (Not negative Program membership.) => NOT_SATISFIED (known negative).
     */
    EXHAUSTED
}
