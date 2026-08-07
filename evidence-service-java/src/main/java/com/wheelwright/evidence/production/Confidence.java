package com.wheelwright.evidence.production;

/**
 * Confidence level of an economic component's classification.
 *
 * Determines whether a PRODUCTION component contributes to knownCashProduction
 * (DETERMINISTIC, HIGH_CONFIDENCE) or to unresolvedPotentialProduction
 * (CHARACTER_UNCERTAIN, BASIS_UNKNOWN).
 */
public enum Confidence {

    /** Arithmetic from known facts — amount is exact */
    DETERMINISTIC,

    /** Structurally certain by instrument type (e.g., SPAXX = money market income) */
    HIGH_CONFIDENCE,

    /** Distribution character unconfirmed — may contain return of capital */
    CHARACTER_UNCERTAIN,

    /** Basis unavailable — gain/loss or discount income cannot be computed */
    BASIS_UNKNOWN
}
