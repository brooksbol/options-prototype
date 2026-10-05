package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Source-reported direct quote-family facts (ratified OAS {@code QuoteFacts}).
 *
 * <p>Each absent fact is OMITTED from serialization — never null, zero, synthesized, or
 * relabeled (Doc 76 §21.2, contract §"Observation and clocks"). {@code last} is never
 * synthesized from {@code close}; {@code previousClose} is never promoted to {@code last};
 * absence is distinct from zero.
 *
 * <p>This record is both the internal domain fact bundle and the wire representation.
 * {@code JsonInclude.NON_NULL} enforces the "absence is omitted" contract.
 *
 * <p>The price-bearing success predicate (contract §7) is evaluated by
 * {@link #hasPositivePriceFact()}: at least one of last/bid/ask (as a strictly positive
 * price) or open/high/low/close (strictly positive) must be present. A source-reported
 * zero is preserved as a fact but does not satisfy the predicate.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuoteFacts(
        String description,
        String exchange,
        TradeFact last,
        SideFact bid,
        SideFact ask,
        Double open,
        Double high,
        Double low,
        Double close,
        Double previousClose,
        Long volume,
        Double reportedChange,
        Double reportedChangePercent,
        Long averageVolume,
        Double fiftyTwoWeekHigh,
        Double fiftyTwoWeekLow
) {

    /** A trade fact: price plus optional size and source event time. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record TradeFact(Double price, Long size, String sourceEventAt) {}

    /** A side (bid/ask) fact: price plus optional size, venue, and source event time. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SideFact(Double price, Long size, String venue, String sourceEventAt) {}

    private static boolean positive(Double v) {
        return v != null && v > 0.0;
    }

    /**
     * The ratified price-bearing success predicate (contract §7, OAS QuoteFacts anyOf).
     *
     * <p>True iff at least one strictly positive direct quote-family price fact exists among
     * {@code last.price}, {@code bid.price}, {@code ask.price}, {@code open}, {@code high},
     * {@code low}, {@code close}. {@code previousClose}, metadata, and reported change alone
     * are insufficient. A source-reported zero does not qualify.
     */
    public boolean hasPositivePriceFact() {
        if (last != null && positive(last.price())) return true;
        if (bid != null && positive(bid.price())) return true;
        if (ask != null && positive(ask.price())) return true;
        return positive(open) || positive(high) || positive(low) || positive(close);
    }
}
