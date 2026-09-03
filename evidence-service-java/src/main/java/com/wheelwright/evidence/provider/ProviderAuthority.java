package com.wheelwright.evidence.provider;

/**
 * A single provider authority: one upstream identity (e.g. Tradier production or
 * Tradier sandbox) bound to its OWN isolated adapter, response cache, and request
 * pacer.
 *
 * PL-PROV-FAILOVER Layer 1 (provider control plane). Isolation is structural, not
 * key-based: each authority owns a distinct {@link ResponseCache} and
 * {@link RequestPacer}, so cached responses and pacing/backoff/control state can
 * never cross provider-authority boundaries ambiguously (invariant I6) and one
 * authority's request budget cannot be consumed by another (I8). This avoids
 * threading a regime id into every cache key.
 *
 * Provider/environment identity lives HERE (control plane). It is not a domain
 * branching input; the Wheelwright domain consumes evidence semantics, not source
 * (see docs/parking-lot-3.md PL-PROV-FAILOVER, Layer 3).
 */
public final class ProviderAuthority {

    private final String id;            // stable authority id, e.g. "prod" / "sandbox"
    private final String environment;   // "production" | "sandbox"
    private final TradierAdapter adapter;
    private final ResponseCache cache;
    private final RequestPacer pacer;

    public ProviderAuthority(String id, String environment,
                             TradierAdapter adapter, ResponseCache cache, RequestPacer pacer) {
        this.id = id;
        this.environment = environment;
        this.adapter = adapter;
        this.cache = cache;
        this.pacer = pacer;
    }

    public String id() { return id; }
    public String environment() { return environment; }
    public TradierAdapter adapter() { return adapter; }
    public ResponseCache cache() { return cache; }
    public RequestPacer pacer() { return pacer; }

    private ObservationRecorder observer;

    /**
     * Bind this authority's isolated pacer to the shared authoritative observer
     * (PL-PROV-FAILOVER observer correction). {@code id} is the opaque authority identity.
     * Idempotent-safe to call once at wiring time.
     */
    public void bindObserver(ObservationRecorder observer) {
        this.observer = observer;
        pacer.bindObserver(observer, id);
    }

    /**
     * Representative, non-writing capability probe against THIS authority (constraint 4),
     * capturing the control-plane epoch that authorized the probe.
     *
     * Opens a RECOVERY_PROBE purpose scope on this authority's pacer (carrying the CAPTURED
     * epoch) so every HTTP call the probe issues is recorded against THIS authority —
     * independent of whichever authority is actively acquiring. Emits a terminal LOGICAL
     * outcome (PROBE_USABLE / PROBE_UNUSABLE) on the shared plane: three successful HTTP
     * calls whose payloads fail normalization terminate as PROBE_UNUSABLE, never usable.
     */
    public TradierAdapter.ProbeResult probeRepresentative(String symbol, long capturedEpoch) {
        // Mint ONE logical probe id shared by the probe's quote/expirations/chain requests and
        // its terminal verdict, so an observer can prove which transport operations produced the
        // PROBE_USABLE/PROBE_UNUSABLE verdict (review-3 finding #4).
        String probeLogicalId = observer != null
            ? observer.newLogicalOperationId(ObservationRecorder.Purpose.RECOVERY_PROBE)
            : "probe-" + id + "-" + capturedEpoch;
        pacer.openPurposeScope(probeLogicalId, ObservationRecorder.Purpose.RECOVERY_PROBE,
            symbol, environment, capturedEpoch);
        TradierAdapter.ProbeResult result;
        try {
            result = adapter.probeRepresentative(symbol);
        } finally {
            pacer.clearPurposeScope();
        }
        if (observer != null) {
            observer.recordLogicalOutcome(probeLogicalId, id, capturedEpoch, symbol,
                ObservationRecorder.Purpose.RECOVERY_PROBE,
                result.usable() ? ObservationRecorder.LogicalOutcome.PROBE_USABLE
                                : ObservationRecorder.LogicalOutcome.PROBE_UNUSABLE);
        }
        return result;
    }

    @Override
    public String toString() {
        return "ProviderAuthority[" + id + " (" + environment + ")]";
    }
}
