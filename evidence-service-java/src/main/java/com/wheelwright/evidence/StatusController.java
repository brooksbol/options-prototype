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

    private final SqliteEvidenceStore store;
    private final AcquisitionWorker worker;
    private final RequestPacer pacer;
    private final ResponseCache cache;

    public StatusController(SqliteEvidenceStore store,
                           AcquisitionWorker worker,
                           RequestPacer pacer,
                           ResponseCache cache) {
        this.store = store;
        this.worker = worker;
        this.pacer = pacer;
        this.cache = cache;
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
        result.put("credentialConfigured", true); // simplified — adapter validates at call time

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
