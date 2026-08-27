package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Status endpoint — /api/status
 * Exposes scheduler, store, cache, and pacer diagnostics.
 *
 * Behavioral parity with TypeScript routes/status.ts.
 */
@RestController
public class StatusController {

    /**
     * The Decision validity window used for the Decision Coverage measure. Mirrors the
     * frontend's chain stale-usable ceiling (durable-cache chainStaleMs = 30 min during
     * open sessions) — the window within which a chain can participate in candidate
     * generation. Kept here as the backend's coverage-reporting reference; it does NOT
     * change any frontend validity behavior.
     */
    private static final long DECISION_WINDOW_MS = 30 * 60 * 1000L;

    private final SqliteEvidenceStore store;
    private final AcquisitionWorker worker;
    private final RequestPacer pacer;
    private final ResponseCache cache;
    private final String tradierApiKey;

    public StatusController(SqliteEvidenceStore store,
                           AcquisitionWorker worker,
                           RequestPacer pacer,
                           ResponseCache cache,
                           @org.springframework.beans.factory.annotation.Value("${tradier.api-key:}") String tradierApiKey) {
        this.store = store;
        this.worker = worker;
        this.pacer = pacer;
        this.cache = cache;
        this.tradierApiKey = tradierApiKey;
    }

    @GetMapping("/api/status")
    public Map<String, Object> status() throws SQLException {
        var workerStatus = worker.getStatus();
        var telemetry = worker.getSchedulerTelemetry();
        var pacerState = pacer.getState();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "ok");
        result.put("provider", "tradier");
        result.put("environment", "sandbox");
        result.put("credentialConfigured", tradierApiKey != null && !tradierApiKey.isBlank());

        // Scheduler status
        Map<String, Object> schedulerMap = new LinkedHashMap<>();
        schedulerMap.put("state", workerStatus.state());
        schedulerMap.put("currentSymbol", workerStatus.currentSymbol());
        schedulerMap.put("cycleCount", workerStatus.cycleCount());
        schedulerMap.put("symbolsAcquiredTotal", workerStatus.symbolsAcquiredTotal());
        schedulerMap.put("lastCycleStartedAt", workerStatus.lastCycleStartedAt());
        schedulerMap.put("lastCycleDurationMs", workerStatus.lastCycleDurationMs());
        schedulerMap.put("nextScheduledAt", workerStatus.nextScheduledAt());
        schedulerMap.put("failures", workerStatus.failures());
        result.put("scheduler", schedulerMap);

        // Scheduler telemetry
        Map<String, Object> telemetryMap = new LinkedHashMap<>();
        telemetryMap.put("lastAssessedAt", telemetry.lastAssessedAt());
        telemetryMap.put("sessionState", telemetry.sessionState());
        telemetryMap.put("eligible", classCountsMap(telemetry.eligible()));
        telemetryMap.put("due", classCountsMap(telemetry.due()));
        telemetryMap.put("oldestAgeSeconds", oldestAgeMap(telemetry.oldestAgeSeconds()));
        telemetryMap.put("lastDispatch", telemetry.lastDispatch() != null
            ? Map.of("symbol", telemetry.lastDispatch().symbol(),
                     "serviceClass", telemetry.lastDispatch().serviceClass(),
                     "workType", telemetry.lastDispatch().workType(),
                     "dispatchedAt", telemetry.lastDispatch().dispatchedAt())
            : null);
        telemetryMap.put("dispatchesByClass", classCountsMap(telemetry.dispatchesByClass()));
        telemetryMap.put("serviceDebt", Map.of(
            "bJobsSinceService", telemetry.serviceDebt().bJobsSinceService(),
            "cdJobsSinceService", telemetry.serviceDebt().cdJobsSinceService()));
        telemetryMap.put("floorDispatches", Map.of(
            "classB", telemetry.floorDispatches().classB(),
            "classCD", telemetry.floorDispatches().classCD()));
        telemetryMap.put("publications", Map.of(
            "total", telemetry.publications().total(),
            "skippedNoChange", telemetry.publications().skippedNoChange(),
            "skippedCoalescing", telemetry.publications().skippedCoalescing(),
            "lastChangedSymbols", telemetry.publications().lastChangedSymbols()));
        telemetryMap.put("cycleCount", telemetry.cycleCount());
        telemetryMap.put("idleReason", telemetry.idleReason());
        result.put("schedulerTelemetry", telemetryMap);

        // Evidence
        Map<String, Object> evidenceMap = new LinkedHashMap<>();
        evidenceMap.put("generation", store.getGeneration());
        evidenceMap.put("generatedAt", store.getGeneratedAt());
        evidenceMap.put("coverage", store.getCoverage());
        evidenceMap.put("universe", store.getAllSymbols().size());
        result.put("evidence", evidenceMap);

        // Multi-DTE surface coverage (operational recovery — PL-COHERE-01 Finding #1).
        // Reports whether the weekly-capable 7-45 DTE decision surface is being held
        // fresh enough for Decision, so a collapsed board cannot masquerade as healthy.
        var mdte = store.getMultiDteSurfaceCoverage(SchedulerConfig.DEFAULT.multiDteSurfaceTargetMs());
        Map<String, Object> mdteMap = new LinkedHashMap<>();
        mdteMap.put("total", mdte.total());
        mdteMap.put("current", mdte.current());
        mdteMap.put("degraded", mdte.degraded());
        result.put("multiDteSurface", mdteMap);

        // Monitored-position coverage (PL-EVID-01). Are the operator's held positions
        // current enough to monitor? This is the decision/capital-at-risk obligation.
        var mon = store.getMonitoredCoverage(SchedulerConfig.DEFAULT.monitoredFreshnessTargetMs());
        Map<String, Object> monMap = new LinkedHashMap<>();
        monMap.put("total", mon.total());
        monMap.put("current", mon.current());
        monMap.put("degraded", mon.degraded());
        result.put("monitoredPositions", monMap);

        // Decision Coverage — how much of the eligible opportunity space can currently
        // participate in candidate generation (measured against Decision's validity window).
        // This is the honest "best available?" completeness measure: if a material fraction
        // of eligible symbols is stale, the Deployment board is NOT best-across-the-universe.
        var cov = store.getDecisionCoverage(DECISION_WINDOW_MS);
        Map<String, Object> covMap = new LinkedHashMap<>();
        covMap.put("eligibleSymbols", cov.eligibleSymbols());
        covMap.put("currentSymbols", cov.currentSymbols());
        covMap.put("staleSymbols", cov.staleSymbols());
        covMap.put("windowMs", DECISION_WINDOW_MS);
        result.put("decisionCoverage", covMap);

        // Cache
        result.put("cache", cache.stats());

        // Pacer
        Map<String, Object> pacerMap = new LinkedHashMap<>();
        pacerMap.put("queueDepth", pacerState.queueDepth());
        pacerMap.put("paceMs", pacerState.paceMs());
        pacerMap.put("dispatched", pacerState.dispatched());
        pacerMap.put("queued", pacerState.queued());
        pacerMap.put("rejected", pacerState.rejected());
        result.put("pacer", pacerMap);

        // Opening-set experiment telemetry
        var opening = worker.getOpeningTelemetry();
        if (opening.setSize() > 0) {
            Map<String, Object> openingMap = new LinkedHashMap<>();
            openingMap.put("setSize", opening.setSize());
            openingMap.put("currentCount", opening.currentCount());
            openingMap.put("hydrationFraction", opening.hydrationFraction());
            openingMap.put("burstStartAt", opening.burstStartAt());
            openingMap.put("firstChainAt", opening.firstChainAt());
            openingMap.put("hydration50At", opening.hydration50At());
            openingMap.put("hydration80At", opening.hydration80At());
            openingMap.put("hydration100At", opening.hydration100At());
            openingMap.put("floorInterruptions", opening.floorInterruptions());
            openingMap.put("totalProviderCalls", opening.totalProviderCalls());
            openingMap.put("burstComplete", opening.burstComplete());
            result.put("openingExperiment", openingMap);
        }

        // Cycle timing instrumentation (overhead analysis)
        var timing = worker.getCycleTimingStats();
        if (timing.samples() > 0) {
            Map<String, Object> timingMap = new LinkedHashMap<>();
            timingMap.put("avgQueueBuildMs", timing.avgQueueBuildMs());
            timingMap.put("avgClassifyMs", timing.avgClassifyMs());
            timingMap.put("avgBatchDispatchMs", timing.avgBatchDispatchMs());
            timingMap.put("avgPublishMs", timing.avgPublishMs());
            timingMap.put("avgTelemetryMs", timing.avgTelemetryMs());
            timingMap.put("avgPostCycleQueryMs", timing.avgPostCycleQueryMs());
            timingMap.put("scheduledDelayMs", timing.scheduledDelayMs());
            timingMap.put("overheadMs", timing.overheadMs());
            timingMap.put("samples", timing.samples());
            timingMap.put("lastBatchSize", timing.lastBatchSize());
            result.put("cycleTiming", timingMap);
        }

        return result;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "up");
    }

    private Map<String, Integer> classCountsMap(SchedulerTelemetry.ClassCounts counts) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("classA", counts.classA());
        map.put("classB", counts.classB());
        map.put("classC", counts.classC());
        map.put("classD", counts.classD());
        return map;
    }

    private Map<String, Integer> oldestAgeMap(SchedulerTelemetry.OldestAge age) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("classA", age.classA());
        map.put("classB", age.classB());
        map.put("classC", age.classC());
        map.put("classD", age.classD());
        return map;
    }
}
