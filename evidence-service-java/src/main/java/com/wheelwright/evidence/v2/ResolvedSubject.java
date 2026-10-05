package com.wheelwright.evidence.v2;

/**
 * A Wheelwright-resolved underlying subject (ratified OAS {@code ResolvedSubject}).
 *
 * <p>{@code symbol} is the canonical uppercase Wheelwright underlying symbol; option
 * contracts are excluded by {@code securityType}.
 */
public record ResolvedSubject(String symbol, SecurityType securityType) {

    /** Wheelwright-resolved security class; option contracts are excluded. */
    public enum SecurityType { EQUITY, ETF, INDEX, OTHER_UNDERLYING }
}
