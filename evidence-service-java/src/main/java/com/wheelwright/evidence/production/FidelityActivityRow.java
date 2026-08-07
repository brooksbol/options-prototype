package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Raw parsed row from a Fidelity Activity History CSV export.
 *
 * This is the adapter boundary — Fidelity's format does not escape this record.
 * All fields match the CSV column structure exactly. Nullable fields correspond
 * to columns that Fidelity may leave empty.
 */
public record FidelityActivityRow(
    LocalDate runDate,
    String action,
    String symbol,            // may be empty; option symbols have leading space in CSV
    String description,       // may be empty
    String type,              // "Cash" in observed exports
    BigDecimal price,         // nullable
    BigDecimal quantity,      // signed (negative = sold/removed)
    BigDecimal commission,    // nullable
    BigDecimal fees,          // nullable
    BigDecimal accruedInterest, // nullable
    BigDecimal amount,        // net cash impact
    BigDecimal cashBalance,   // nullable (informational)
    LocalDate settlementDate  // nullable
) {}
