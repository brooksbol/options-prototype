package com.wheelwright.evidence.continuity;

import com.wheelwright.evidence.production.FidelityActivityRow;

import java.time.LocalDate;
import java.util.List;

/**
 * Inputs to a bounded option-obligation continuity assessment (ADR-022 / Doc 70).
 *
 * The assessment answers ONE narrow question: does the ENTIRE original whole quantity
 * {@code openingQuantity} of an opening-anchored short-option cohort remain currently
 * applicable, given accepted-complete History through a quiet endpoint day and a compatible
 * Positions observation on that day?
 *
 * This is deliberately not a general brokerage lifecycle model. Every field here is a
 * scoped, operator/Principal-supplied premise or observed evidence; the engine never
 * invents completeness, ordering, or an endpoint cut.
 */
public record ContinuityInputs(
    // --- Cohort opening anchor (whole-quantity, ADR-022 §1/§4) ---
    String brokerageAccountId,
    String underlying,
    String optionType,          // "CALL" | "PUT"
    double strike,
    LocalDate expiration,
    /** Whole governed quantity Q of the opening-anchored cohort (contracts, > 0). */
    int openingQuantity,
    /** Economic effective date of the opening establishment (the anchor boundary). */
    LocalDate openingDate,

    // --- Accepted completeness premise (ADR-022 §3, Doc 70 §5) ---
    /**
     * Operator/Principal scoped premise: the supplied History is complete for every option
     * lifecycle event of this series economically effective from {@code openingDate} through
     * the end of {@code quietDay}. This is a scoped premise, NOT a universal Fidelity
     * guarantee. Absent/false => AUTHORITY_MISSING.
     */
    boolean historyCompleteThroughQuietDay,
    /** The quiet endpoint day P used for positive reconciliation (Doc 70 §5). */
    LocalDate quietDay,

    // --- History evidence (raw rows; the engine admits each semantically) ---
    /** All raw History rows in the admitted interval. Never pre-filtered by the caller. */
    List<FidelityActivityRow> historyRows,

    // --- Positions endpoint observation on the quiet day (Doc 70 §5) ---
    /**
     * Observed short-option quantity for this exact series from a Positions export whose
     * export day is {@code quietDay}. Negative or magnitude convention is normalized by the
     * caller to a non-negative contract count of the SHORT position. Null => no endpoint
     * observation (EVIDENCE_INSUFFICIENT for the positive reconciliation).
     */
    Integer positionsShortQuantityOnQuietDay,
    /** True when the Positions artifact identifies this exact account+series. */
    boolean positionsIdentifiesSeries,

    // --- Temporal admission rule version (Doc 70 §4) ---
    String admissionRuleVersion
) {}
