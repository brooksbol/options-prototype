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

    public record OptionContract(
        double strike,
        double bid,
        double ask,
        double delta,
        int openInterest,
        int volume
    ) {}
}
