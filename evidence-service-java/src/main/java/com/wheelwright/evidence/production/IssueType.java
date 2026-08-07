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
    INSUFFICIENT_HISTORY
}
