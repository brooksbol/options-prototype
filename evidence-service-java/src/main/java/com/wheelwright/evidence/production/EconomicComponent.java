package com.wheelwright.evidence.production;

import java.math.BigDecimal;

/**
 * One economic component derived from a Fidelity broker transaction.
 *
 * A single broker transaction may produce multiple components. For example,
 * a Treasury redemption produces:
 *   - PRINCIPAL_MOVEMENT for the returned cost basis
 *   - PRODUCTION/TREASURY_DISCOUNT for the discount income
 *
 * The asymmetric realization model means dispositions above basis produce
 * PRODUCTION/REALIZED_APPRECIATION, while dispositions below basis produce
 * CAPITAL_EROSION — never netting against each other.
 */
public record EconomicComponent(
    String transactionId,
    ComponentType type,
    ProductionSource source,    // nullable — only meaningful when type == PRODUCTION
    BigDecimal amount,          // non-negative for PRODUCTION and CAPITAL_EROSION
    Confidence confidence,
    String derivation           // human-readable explanation of how this was derived
) {}
