package com.wheelwright.evidence;

/**
 * Scheduler telemetry — observational state captured during real cycles.
 * Read by the status endpoint. Never recomputes scheduling decisions on demand.
 *
 * Behavioral parity with TypeScript SchedulerTelemetry interface.
 */
public record SchedulerTelemetry(
    String lastAssessedAt,
    String sessionState,
    ClassCounts eligible,
    ClassCounts due,
    OldestAge oldestAgeSeconds,
    LastDispatch lastDispatch,
    ClassCounts dispatchesByClass,
    ServiceDebt serviceDebt,
    FloorDispatches floorDispatches,
    Publications publications,
    int cycleCount,
    String idleReason
) {
    public static final SchedulerTelemetry EMPTY = new SchedulerTelemetry(
        null, "unknown",
        new ClassCounts(0, 0, 0, 0),
        new ClassCounts(0, 0, 0, 0),
        new OldestAge(null, null, null, null),
        null,
        new ClassCounts(0, 0, 0, 0),
        new ServiceDebt(0, 0),
        new FloorDispatches(0, 0),
        new Publications(0, 0, 0, 0),
        0, null
    );

    public record ClassCounts(int classA, int classB, int classC, int classD) {}
    public record OldestAge(Integer classA, Integer classB, Integer classC, Integer classD) {}
    public record LastDispatch(String symbol, String serviceClass, String workType, String dispatchedAt) {}
    public record ServiceDebt(int bJobsSinceService, int cdJobsSinceService) {}
    public record FloorDispatches(int classB, int classCD) {}
    public record Publications(int total, int skippedNoChange, int skippedCoalescing, int lastChangedSymbols) {}
}
