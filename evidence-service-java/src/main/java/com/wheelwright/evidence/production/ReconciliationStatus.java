package com.wheelwright.evidence.production;

/**
 * Overall reconciliation status of a production assessment.
 *
 * Determines whether the knownCashProduction figure is authoritative (penny-exact
 * and complete) or whether unresolved items could change the result.
 */
public enum ReconciliationStatus {

    /** All transactions classified, all basis resolved, full period covered. Number is authoritative. */
    FULLY_RECONCILED,

    /** Classified completely, but unresolved items exist that could affect production. */
    PRODUCTION_UNCERTAIN,

    /** Source data does not cover the full requested period. Cannot produce authoritative answer. */
    SOURCE_INCOMPLETE
}
