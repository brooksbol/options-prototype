package com.wheelwright.evidence;

/**
 * Scheduler configuration — freshness targets, anti-starvation intervals, coalescing.
 *
 * Behavioral parity with TypeScript DEFAULT_SCHEDULER_CONFIG.
 */
public record SchedulerConfig(
    /** Class A freshness target (default: 15 min) */
    long chainFreshnessTargetMs,
    /** Class B maximum age before becoming due (default: 120 min) */
    long chainMaxAgeMs,
    /** Expiration evidence freshness threshold (default: 6 hours) */
    long expirationFreshnessMs,
    /** Anti-starvation: B gets serviced after this many A dispatches (default: 10) */
    int classBMinServiceInterval,
    /** Anti-starvation: C/D gets serviced after this many dispatches (default: 20) */
    int classCDMinServiceInterval,
    /** Publication coalescing window (default: 5s) */
    long publicationCoalesceMs,
    /**
     * Monitored-position freshness target (default: 15 min).
     *
     * PL-EVID-01 monitored-position observation obligation. A held/open-position symbol
     * (declared via /api/evidence/observe) must be kept current enough to MONITOR
     * throughout the session, independent of its recommendation class. When a monitored
     * symbol's chain age exceeds this target it becomes due — even if it is Class B for
     * recommendation purposes. Serviced via a dedicated anti-starvation floor so the
     * (small, bounded) monitored set maintains a tight cadence without redefining class
     * or preempting overdue Class A.
     */
    long monitoredFreshnessTargetMs,
    /**
     * Anti-starvation: monitored positions get serviced at least once per this many
     * dispatched jobs (default: 5). The monitored set is small (single-digit to low
     * double-digit symbols), so this guarantees a tight monitoring cadence at negligible
     * provider cost while leaving the bulk of capacity for A/B/C/D.
     */
    int monitoredMinServiceInterval,
    /**
     * Multi-DTE surface service target (default: 25 min).
     *
     * SOFT urgency threshold for the weekly-capable (multi-expiration) 7-45 DTE
     * decision surface — the age at which a multi-DTE symbol's OLDEST currently-eligible
     * chain makes the symbol due for a full-surface refresh. Distinct from the 15-min
     * Class-A primary target on purpose.
     *
     * Sizing (measured Aug 2026, PL-COHERE-01 Finding #1 recovery):
     *   The multi-DTE cohort is ~64 symbols / ~421 eligible chains = ~842 provider
     *   requests = ~15.6 min of provider time per full pass at the 0.9 req/sec pacer.
     *   Refreshing that cohort on the 15-min Class-A target would consume ~104% of
     *   provider capacity and starve ordinary A/B/C/D work. Decision only requires a
     *   30-min validity window (chainStaleMs), so the surface must merely stay inside
     *   30 min — not match the 15-min primary target.
     *
     *   25 min keeps the surface a safe 5-minute margin inside Decision's 30-min window
     *   while consuming ~62% of provider capacity in the worst case (whole cohort due at
     *   once), leaving headroom for the rest of acquisition. Like Class B's chainMaxAgeMs,
     *   this is a SOFT threshold: it raises multi-DTE full-surface urgency but does not
     *   preempt overdue Class-A primary work or the anti-starvation floors.
     */
    long multiDteSurfaceTargetMs
) {
    public static final SchedulerConfig DEFAULT = new SchedulerConfig(
        25 * 60 * 1000L,       // 25 min — chain refresh target (was 15 min scarcity-era value).
                               // Production simplification experiment: refresh near the Decision
                               // horizon (30 min) with a 5-min guard band, instead of re-fetching
                               // already-admissible chains at 15 min and starving breadth coverage.
        120 * 60 * 1000L,      // 120 min — Class B soft urgency (unchanged)
        6 * 60 * 60 * 1000L,   // 6 hours — expirations
        10,
        20,
        5000L,
        15 * 60 * 1000L,       // 15 min — monitored-position freshness target (overlay retained)
        5,                     // monitored anti-starvation interval (every 5 dispatches)
        25 * 60 * 1000L        // 25 min — multi-DTE surface target: RETAINED as a value but the
                               // blanket multi-DTE surface OBLIGATION is disabled in the scheduler
                               // (see getPrioritizedWorkQueue). Production breadth acquisition makes
                               // the special cohort unnecessary; kept only for diagnostic telemetry.
    );
}
