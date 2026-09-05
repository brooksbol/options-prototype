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
    /**
     * Content FINGERPRINT (deterministic hash of run date | action | symbol | amount). Its only
     * guaranteed scope is trace/deduplication: two genuinely identical rows share it, and hash
     * collisions across different rows are possible in principle. Per ADR-016 it carries only
     * the guarantees it actually has — it is NOT a unique evidence-row identity and MUST NOT be
     * used as a uniqueness-bearing association-map key. Use {@link #occurrenceId} for that.
     */
    String id,
    /**
     * Assessment-local evidence-row OCCURRENCE identity. Assigned as a monotonic sequence within
     * one Production assessment (see {@code ProductionAssessor.assess}) so the solver can tell
     * exact transaction occurrences apart — including two rows that share the same {@link #id}
     * fingerprint. Scope discipline (ADR-016):
     *   - unique only WITHIN one assessment, by construction;
     *   - NOT durable broker-event identity;
     *   - NOT lifecycle/episode identity;
     *   - NOT cross-ingestion identity; never persisted;
     *   - its numeric value implies NO economic or broker-authoritative ordering — it only
     *     distinguishes occurrences. -1 marks a transaction not produced through an assessment.
     */
    int assessmentOccurrenceId,
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
     * Creates a NormalizedTransaction from a parsed row and its classification, WITHOUT an
     * assessment-local occurrence identity ({@code assessmentOccurrenceId = -1}). Callers that need
     * occurrence identity (the assessment pipeline) assign it via {@link #withAssessmentOccurrenceId(int)}.
     */
    public static NormalizedTransaction from(FidelityActivityRow row, FidelityTransactionKind kind) {
        String id = generateId(row);
        return new NormalizedTransaction(
            id, -1, row.runDate(), row.settlementDate(), kind,
            row.action(), row.symbol(), row.description(),
            row.amount(), row.commission(), row.fees(),
            row.price(), row.quantity()
        );
    }

    /** Returns a copy carrying the given assessment-local occurrence identity. */
    public NormalizedTransaction withAssessmentOccurrenceId(int assessmentOccurrenceId) {
        return new NormalizedTransaction(
            id, assessmentOccurrenceId, date, settlementDate, kind,
            rawAction, symbol, description,
            amount, commission, fees, price, quantity
        );
    }

    private static String generateId(FidelityActivityRow row) {
        // Deterministic content fingerprint from key fields — trace/dedup only, NOT unique identity.
        String key = row.runDate() + "|" + row.action() + "|" + row.symbol() + "|" + row.amount();
        return Integer.toHexString(key.hashCode());
    }
}
