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
    /**
     * The underlying's normalized quote fields.
     *
     * <p>{@code previousClose} is the provider's prior-session official close
     * ({@code prevclose}). It is nullable ({@link Double}) to preserve the
     * provider's distinction between an ABSENT prior close and a genuine numeric
     * value: provider absence (field omitted / unparseable) is {@code null} and
     * MUST stay null through normalization, snapshot serialization, the durable
     * chain blob, and the Console. Consumers derive the broker-comparison
     * "Today's G/L" from {@code price - previousClose}; a null prior close means
     * the daily figure is unavailable (rendered as a dash), never a fabricated
     * zero or a wrong-baseline fallback. Upholds "persist facts; derive trust".
     */
    public record Underlying(String symbol, String name, double price, Double previousClose) {
        /** Backward-compatible constructor for callers/tests that predate previousClose. */
        public Underlying(String symbol, String name, double price) {
            this(symbol, name, price, null);
        }
    }

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
