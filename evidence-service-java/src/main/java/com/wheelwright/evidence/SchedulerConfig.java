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
    long publicationCoalesceMs
) {
    public static final SchedulerConfig DEFAULT = new SchedulerConfig(
        15 * 60 * 1000L,       // 15 min
        120 * 60 * 1000L,      // 120 min
        6 * 60 * 60 * 1000L,   // 6 hours
        10,
        20,
        5000L
    );
}
