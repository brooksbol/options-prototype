package com.wheelwright.evidence.provider;

import java.util.List;

/**
 * Application-owned option chain representation.
 * Normalized from provider-specific response shapes.
 */
public record MarketChain(
    String symbol,
    String expiration,
    Underlying underlying,
    List<OptionContract> puts,
    List<OptionContract> calls
) {
    public record Underlying(String symbol, String name, double price) {}

    /**
     * A single option contract.
     *
     * The five greeks are nullable ({@link Double}) to preserve the provider's
     * distinction between an ABSENT observation and a numeric zero. Provider
     * absence (field omitted, explicit JSON null, or unparseable) is represented
     * as {@code null} and MUST remain null through normalization, snapshot
     * serialization, the durable cache, and the Console. A greek is {@code 0.0}
     * only when the provider actually supplied numeric zero. This upholds
     * "persist facts; derive trust" at the provider boundary — we never
     * fabricate a zero for missing evidence.
     *
     * strike/bid/ask/openInterest/volume remain primitive; they are outside this
     * greek-nullability correction and the provider supplies them for real
     * contracts.
     */
    public record OptionContract(
        double strike,
        double bid,
        double ask,
        Double delta,
        Double gamma,
        Double theta,
        Double vega,
        Double rho,
        int openInterest,
        int volume
    ) {}
}
