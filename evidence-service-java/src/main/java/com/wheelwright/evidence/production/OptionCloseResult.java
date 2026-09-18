package com.wheelwright.evidence.production;

import java.math.BigDecimal;

/**
 * Backend-authoritative interpreted lifecycle-association result for ONE executed buy-to-close
 * (BTC) event (BUG-021, third amendment).
 *
 * The backend Production path is the SINGLE authority for BTC recognized-lifecycle association
 * (ADR-016). The frontend RENDERS this result; it must not independently reconstruct a competing
 * matched/residual/unmatched/status answer from Activity evidence.
 *
 * Four independent facts are preserved, never conflated:
 *   (1) executed cash — the close's own signed net debit ({@code executedDebit}); known independent
 *       of any lifecycle association;
 *   (2) affected quantity — the close's own executed quantity ({@code closedQuantity}); may be null
 *       (unavailable) independent of cash;
 *   (3) recognized-lifecycle association — the recognized outstanding short quantity that existed
 *       for the exact contract IMMEDIATELY BEFORE this close, expressed as an inclusive integer
 *       RANGE [{@code outstandingBeforeMin}, {@code outstandingBeforeMax}] to PRESERVE UNCERTAINTY
 *       (unknown historical consumption is never treated as zero);
 *   (4) unresolved/conflicting evidence — captured by {@code status} + {@code reason}.
 *
 * Quantity semantics against a close of quantity q:
 *   - status DETERMINISTIC_COMPLETE / DETERMINISTIC_PARTIAL when the evidence RANGE establishes the
 *     close is fully covered by recognized outstanding (min ≥ q). matched = q; residual = range−q.
 *   - status OVER_CLOSE when max &lt; q (definitely more closed than could have been outstanding).
 *     matched = [min,max]; excess = q − max (the guaranteed-unmatched portion).
 *   - status UNRESOLVED when q lies within the range (min &lt; q ≤ max), or ordering/opening/quantity
 *     evidence is missing/ambiguous — history does not determine how much obligation existed.
 *
 * All range bounds are non-negative integers (contract counts). Null bounds are not used; when the
 * opening quantity itself is uncertain the status is UNRESOLVED and the range carries the best
 * finite bounds available.
 */
public record OptionCloseResult(
    /** Non-unique content fingerprint of the BTC row (trace only; mirrors NormalizedTransaction.id). */
    String closeFingerprint,
    /** OCC contract key when usable, else the raw trimmed symbol (identity for matching/display). */
    String contractKey,
    String symbol,
    String date,
    /** Raw Fidelity action text of the close row (so the frontend renders from authoritative provenance). */
    String action,
    /** Executed net closing cash (signed; a debit is negative). Null when the row carried no amount. */
    BigDecimal executedDebit,
    /** Executed closed quantity (|quantity|). Null when unavailable. */
    BigDecimal closedQuantity,

    /** Inclusive recognized-outstanding-before RANGE (contract counts), preserving uncertainty. */
    BigDecimal outstandingBeforeMin,
    BigDecimal outstandingBeforeMax,

    /** Defensibly matched (retired) quantity range for this close. */
    BigDecimal matchedMin,
    BigDecimal matchedMax,

    /** Residual recognized outstanding range AFTER this close (what may still be open). */
    BigDecimal residualMin,
    BigDecimal residualMax,

    /**
     * Guaranteed-unmatched (excess) quantity when the close definitely exceeded the maximum possible
     * outstanding (OVER_CLOSE); otherwise zero. This is the portion that cannot correspond to any
     * recognized obligation under any admissible history.
     */
    BigDecimal excessUnmatched,

    OptionCloseStatus status,
    String reason
) {
    /** Lifecycle-association disposition for a single executed BTC. */
    public enum OptionCloseStatus {
        /** The close fully retires recognized outstanding and none remains (min ≥ q and max == q). */
        DETERMINISTIC_COMPLETE,
        /** The close retires part of recognized outstanding; a residual definitely remains (min ≥ q, max &gt; q). */
        DETERMINISTIC_PARTIAL,
        /** The close definitely exceeds the maximum possible outstanding (max &lt; q); excess is unmatched. */
        OVER_CLOSE,
        /**
         * Recognized-lifecycle association cannot be determined: no recognized opening before the
         * close, missing/insufficient contract identity, missing executed quantity, same-day ordering
         * ambiguity, prior unknown-quantity consumption widening the range, or q within the range.
         */
        UNRESOLVED
    }

    /** True when this close's recognized-lifecycle association is deterministically established. */
    public boolean isDeterministic() {
        return status == OptionCloseStatus.DETERMINISTIC_COMPLETE
            || status == OptionCloseStatus.DETERMINISTIC_PARTIAL;
    }
}
