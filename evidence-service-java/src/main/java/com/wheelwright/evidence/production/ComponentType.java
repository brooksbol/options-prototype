package com.wheelwright.evidence.production;

/**
 * Economic meaning of a decomposed component from a Fidelity transaction.
 *
 * One broker transaction may produce multiple components (e.g., a Treasury
 * redemption produces PRINCIPAL_MOVEMENT + PRODUCTION for the discount income).
 */
public enum ComponentType {

    /** Cash production — contributes to knownCashProduction or unresolvedPotentialProduction */
    PRODUCTION,

    /** Principal destroyed through realized loss on disposition */
    CAPITAL_EROSION,

    /** Deposits, withdrawals, returned capital, assignment stock flows */
    PRINCIPAL_MOVEMENT,

    /** Purchases — capital deployed into assets */
    CAPITAL_DEPLOYMENT,

    /** Assignment/expiration notifications with $0 cash impact */
    LIFECYCLE_NOTIFICATION,

    /** Automated reinvestment of received income */
    REINVESTMENT,

    /** Cannot determine economic character from available evidence */
    UNRESOLVED
}
