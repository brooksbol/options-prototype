package com.wheelwright.evidence.production;

/**
 * Types of reconciliation issues that prevent a fully reconciled production assessment.
 */
public enum IssueType {

    /** CSV does not contain transactions spanning the full target month */
    INCOMPLETE_PERIOD_COVERAGE,

    /** Treasury or disposition basis cannot be determined from available evidence */
    BASIS_UNKNOWN,

    /** Fund distribution may contain return of capital — character undetermined */
    DISTRIBUTION_CHARACTER_UNKNOWN,

    /** Fidelity action pattern not recognized — transaction is unclassified */
    UNCLASSIFIED_ACTION,

    /** Prior purchases needed for basis resolution not found within the data */
    INSUFFICIENT_HISTORY,

    /**
     * An option-close (buy-to-close) transaction cannot be fully associated with a recognized
     * short-option obligation within the assessed data: no recognized opening, insufficient
     * contract identity, or a closed quantity exceeding the recognized open short quantity
     * (over-close). The executed closing debit remains known period option economics, but the
     * recognized short lifecycle/quantity it retired is unresolved — so the assessment must not
     * appear fully reconciled.
     */
    OPTION_CLOSE_LIFECYCLE_UNRESOLVED
}
