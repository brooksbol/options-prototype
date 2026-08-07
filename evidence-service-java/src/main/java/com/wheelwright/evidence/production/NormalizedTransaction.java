package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A Fidelity activity row after structural classification.
 *
 * Preserves the raw action text for audit/provenance while adding the typed
 * FidelityTransactionKind classification. This is the input to the
 * EconomicDecomposer.
 */
public record NormalizedTransaction(
    String id,                         // deterministic identifier for deduplication
    LocalDate date,                    // Run Date
    LocalDate settlementDate,          // nullable
    FidelityTransactionKind kind,      // typed structural classification
    String rawAction,                  // preserved for audit
    String symbol,                     // trimmed
    String description,
    BigDecimal amount,                 // net cash impact from Fidelity
    BigDecimal commission,             // nullable
    BigDecimal fees,                   // nullable
    BigDecimal price,                  // nullable — per-unit price
    BigDecimal quantity                // signed
) {
    /**
     * Creates a NormalizedTransaction from a parsed row and its classification.
     */
    public static NormalizedTransaction from(FidelityActivityRow row, FidelityTransactionKind kind) {
        String id = generateId(row);
        return new NormalizedTransaction(
            id, row.runDate(), row.settlementDate(), kind,
            row.action(), row.symbol(), row.description(),
            row.amount(), row.commission(), row.fees(),
            row.price(), row.quantity()
        );
    }

    private static String generateId(FidelityActivityRow row) {
        // Deterministic hash from key fields for deduplication
        String key = row.runDate() + "|" + row.action() + "|" + row.symbol() + "|" + row.amount();
        return Integer.toHexString(key.hashCode());
    }
}
