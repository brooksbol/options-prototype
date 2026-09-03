package com.wheelwright.evidence.provider;

/**
 * Typed classification of the outcome of a provider acquisition attempt.
 *
 * PL-PROV-FAILOVER constraint 3 (typed provider outcomes): provider-wide
 * unusability must NOT be inferred by inspecting arbitrary outer exceptions, and
 * must survive exception wrapping (the acquisition path wraps a primary-chain
 * {@link ProviderError} in a RuntimeException). This boundary classifies a thrown
 * error, walking the cause chain cause-safely, so that provider-wide unusability
 * cannot fall through into per-symbol quality-failure handling
 * ({@code store.setFailure}).
 *
 * HTTP 401 is the FIRST demonstrated provider-unusable classifier; it is not the
 * architectural definition of failover. Additional classes enter only by explicit
 * reconciliation (see docs/parking-lot-3.md PL-PROV-FAILOVER).
 */
public enum ProviderOutcome {
    /** The attempt produced usable normalized evidence. */
    USABLE,
    /**
     * The provider itself is unusable (a provider-wide condition), independent of
     * any individual symbol. First classifier: confirmed HTTP 401 (entitlement/auth).
     * Must be routed to provider-control handling, never to symbol-quality failure.
     */
    PROVIDER_UNUSABLE,
    /**
     * The attempt failed for a reason attributable to this specific symbol's
     * evidence (or an unclassified error). Routed to ordinary per-symbol failure
     * handling.
     */
    SYMBOL_QUALITY_FAILURE;

    /**
     * Classify a thrown error cause-safely. Walks the cause chain so a wrapped
     * {@link ProviderError} (e.g. "Primary chain failed: ..." wrapping a 401) is
     * still recognized as provider-wide unusability.
     *
     * Current provider-unusable classifier set: HTTP 401 only. 429 is ordinary
     * throttling (handled by the pacer, not failover) and is NOT provider-unusable.
     */
    public static ProviderOutcome classify(Throwable error) {
        ProviderError pe = findProviderError(error);
        if (pe == null) {
            return SYMBOL_QUALITY_FAILURE;
        }
        if (isProviderUnusableStatus(pe.getStatusCode())) {
            return PROVIDER_UNUSABLE;
        }
        return SYMBOL_QUALITY_FAILURE;
    }

    /** The set of HTTP status codes currently treated as provider-wide unusability. */
    public static boolean isProviderUnusableStatus(int statusCode) {
        // First demonstrated classifier only. Do NOT widen without explicit reconciliation.
        return statusCode == 401;
    }

    /** Walk the cause chain (bounded) to find a ProviderError, if any. */
    static ProviderError findProviderError(Throwable error) {
        Throwable current = error;
        int guard = 0;
        while (current != null && guard++ < 32) {
            if (current instanceof ProviderError pe) {
                return pe;
            }
            current = current.getCause();
        }
        return null;
    }
}
