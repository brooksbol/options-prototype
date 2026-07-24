package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.PrioritizedWorkItem;
import com.wheelwright.evidence.db.SqliteEvidenceStore.ClassifiedPopulation;
import com.wheelwright.evidence.provider.TradierAdapter;

import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * Acquisition Worker — Tiered, self-scheduling background evidence acquisition.
 *
 * Behavioral parity with TypeScript AcquisitionWorker:
 *   - Single acquisition cycle in flight at a time
 *   - Session gate at cycle start (injectable clock)
 *   - A/B/C/D prioritized work queue
 *   - Anti-starvation floors for B and C/D
 *   - Publication coalescing (change-driven, not heartbeat)
 *   - Full telemetry capture per cycle
 */
public class AcquisitionWorker {

    // --- Constants (matching TypeScript) ---
    private static final long DELAY_AFTER_FAILURE_MS = 5000;
    private static final long DELAY_SESSION_BLOCKED_MS = 300_000;
    private static final long DELAY_IDLE_MS = 30_000;
    private static final int BATCH_SIZE = 10;

    // --- Dependencies ---
    private final TradierAdapter adapter;
    private final SqliteEvidenceStore store;
    private final SessionGate sessionGate;
    private final SchedulerConfig schedulerConfig;

    // --- Lifecycle ---
    private volatile boolean running = false;
    private volatile boolean cycleActive = false;
    private boolean idleLogged = false;
    private boolean sessionBlockLogged = false;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "acquisition-worker");
        t.setDaemon(true);
        return t;
    });
    private ScheduledFuture<?> nextCycle;

    // --- Counters ---
    private int dispatchedJobs = 0;
    private int lastBServiceJob = 0;
    private int lastCDServiceJob = 0;
    private long lastPublishAt = 0;
    private boolean evidenceChangedSincePublish = false;
    private int changedSymbolsThisPublish = 0;

    // Publication counters
    private int pubTotal = 0;
    private int pubSkippedNoChange = 0;
    private int pubSkippedCoalescing = 0;
    private int pubLastChangedSymbols = 0;

    // Dispatch counters by class
    private int dispatchCountA = 0;
    private int dispatchCountB = 0;
    private int dispatchCountC = 0;
    private int dispatchCountD = 0;
    private int floorDispatchB = 0;
    private int floorDispatchCD = 0;

    // --- Observable State ---
    private volatile WorkerStatus status = new WorkerStatus(
        "stopped", null, 0, 0, null, null, null, 0
    );

    private volatile SchedulerTelemetry telemetry = SchedulerTelemetry.EMPTY;

    // --- Constructor ---

    public AcquisitionWorker(TradierAdapter adapter, SqliteEvidenceStore store, SessionGate sessionGate, SchedulerConfig schedulerConfig) {
        this.adapter = adapter;
        this.store = store;
        this.sessionGate = sessionGate;
        this.schedulerConfig = schedulerConfig;
    }

    // --- Lifecycle ---

    public void start(List<String> universe) {
        if (running) return;
        running = true;
        status = status.withState("starting");

        try {
            store.initUniverse(universe);
        } catch (Exception e) {
            System.err.println("[worker] Failed to init universe: " + e.getMessage());
        }

        System.out.printf("[worker] Started. Universe: %d symbols. Beginning acquisition.%n", universe.size());
        scheduleCycle(1000);
    }

    public void stop() {
        running = false;
        status = status.withState("stopped");
        if (nextCycle != null) {
            nextCycle.cancel(false);
            nextCycle = null;
        }
        System.out.println("[worker] Stopped.");
    }

    public WorkerStatus getStatus() {
        return status;
    }

    public SchedulerTelemetry getSchedulerTelemetry() {
        return telemetry;
    }

    public void nudge() {
        if (!running || cycleActive) return;
        if (nextCycle != null) nextCycle.cancel(false);
        idleLogged = false;
        scheduleCycle(0);
    }

    // --- Self-scheduling core ---

    private void scheduleCycle(long delayMs) {
        if (!running) return;
        status = status.withNextScheduledAt(Instant.now().plusMillis(delayMs).toString());
        nextCycle = scheduler.schedule(this::runCycle, delayMs, TimeUnit.MILLISECONDS);
    }

    private void runCycle() {
        if (!running || cycleActive) return;

        // Session gate
        var session = sessionGate.isPermitted();
        if (!session.permitted()) {
            if (!sessionBlockLogged) {
                System.out.printf("[worker] Acquisition suspended · %s%n", session.reason());
                sessionBlockLogged = true;
            }
            status = status.withState("session_blocked");
            scheduleCycle(DELAY_SESSION_BLOCKED_MS);
            return;
        }
        if (sessionBlockLogged) {
            System.out.printf("[worker] Acquisition resumed · %s%n", session.reason());
            sessionBlockLogged = false;
        }

        cycleActive = true;
        int cycleCount = status.cycleCount() + 1;
        status = status.withState("acquiring")
            .withCycleCount(cycleCount)
            .withLastCycleStartedAt(Instant.now().toString());
        long cycleStart = System.currentTimeMillis();

        try {
            // Build prioritized work queue
            List<PrioritizedWorkItem> workQueue = store.getPrioritizedWorkQueue(schedulerConfig);

            // --- Capture telemetry ---
            ClassifiedPopulation eligible = store.getClassifiedPopulation();

            List<PrioritizedWorkItem> classA = workQueue.stream().filter(i -> "A".equals(i.urgencyClass())).toList();
            List<PrioritizedWorkItem> classB = workQueue.stream().filter(i -> "B".equals(i.urgencyClass())).toList();
            List<PrioritizedWorkItem> classC = workQueue.stream().filter(i -> "C".equals(i.urgencyClass())).toList();
            List<PrioritizedWorkItem> classD = workQueue.stream().filter(i -> "D".equals(i.urgencyClass())).toList();

            String idleReason = null;

            var due = new SchedulerTelemetry.ClassCounts(classA.size(), classB.size(), classC.size(), classD.size());
            var oldestAge = new SchedulerTelemetry.OldestAge(
                classA.isEmpty() ? null : (int)(classA.get(0).chainAgeMs() / 1000),
                classB.isEmpty() ? null : (int)(classB.get(0).chainAgeMs() / 1000),
                null, null
            );

            // --- End telemetry capture (will be finalized below) ---

            if (workQueue.isEmpty()) {
                if (!idleLogged) {
                    try {
                        System.out.printf("[worker] All evidence within targets · gen %d%n", store.getGeneration());
                    } catch (Exception e) { /* ignore */ }
                    idleLogged = true;
                }
                idleReason = "all_within_targets";
                status = status.withState("idle")
                    .withLastCycleDurationMs(System.currentTimeMillis() - cycleStart);
                cycleActive = false;
                publishIfDue(true);
                updateTelemetry(session.reason(), cycleCount, eligible, due, oldestAge, idleReason);
                scheduleCycle(DELAY_IDLE_MS);
                return;
            }

            idleLogged = false;

            // Select batch with anti-starvation floors
            List<PrioritizedWorkItem> batch = selectBatchWithFloors(workQueue);

            for (PrioritizedWorkItem item : batch) {
                if (!running) break;
                status = status.withCurrentSymbol(item.symbol());
                acquireSymbolTiered(item);
                dispatchedJobs++;

                switch (item.urgencyClass()) {
                    case "A" -> dispatchCountA++;
                    case "B" -> dispatchCountB++;
                    case "C" -> dispatchCountC++;
                    case "D" -> dispatchCountD++;
                }
            }

            status = status.withCurrentSymbol(null)
                .withLastCycleDurationMs(System.currentTimeMillis() - cycleStart);
            publishIfDue(false);
            updateTelemetry(session.reason(), cycleCount, eligible, due, oldestAge, idleReason);

        } catch (Exception err) {
            System.err.println("[worker] Cycle error: " + err.getMessage());
            status = status.withFailures(status.failures() + 1);
        }

        cycleActive = false;

        // Continuous refresh: always check for more work
        try {
            boolean hasMoreWork = !store.getPrioritizedWorkQueue(schedulerConfig).isEmpty();
            long nextDelay = hasMoreWork ? 1000 : DELAY_IDLE_MS;
            status = status.withState(hasMoreWork ? "acquiring" : "idle");
            scheduleCycle(nextDelay);
        } catch (Exception e) {
            scheduleCycle(DELAY_IDLE_MS);
        }
    }

    // --- Batch selection with anti-starvation floors ---

    private List<PrioritizedWorkItem> selectBatchWithFloors(List<PrioritizedWorkItem> queue) {
        if (queue.isEmpty()) return List.of();

        List<PrioritizedWorkItem> batch = new ArrayList<>();
        Set<String> batchSymbols = new HashSet<>();
        List<PrioritizedWorkItem> classB = queue.stream().filter(i -> "B".equals(i.urgencyClass())).toList();
        List<PrioritizedWorkItem> classCD = queue.stream().filter(i -> "C".equals(i.urgencyClass()) || "D".equals(i.urgencyClass())).toList();

        boolean bDebt = !classB.isEmpty() && (dispatchedJobs - lastBServiceJob) >= schedulerConfig.classBMinServiceInterval();
        boolean cdDebt = !classCD.isEmpty() && (dispatchedJobs - lastCDServiceJob) >= schedulerConfig.classCDMinServiceInterval();

        if (bDebt) {
            batch.add(classB.get(0));
            batchSymbols.add(classB.get(0).symbol());
            lastBServiceJob = dispatchedJobs;
            floorDispatchB++;
        }
        if (cdDebt) {
            var cdItem = classCD.stream().filter(i -> !batchSymbols.contains(i.symbol())).findFirst().orElse(classCD.get(0));
            if (!batchSymbols.contains(cdItem.symbol())) {
                batch.add(cdItem);
                batchSymbols.add(cdItem.symbol());
                lastCDServiceJob = dispatchedJobs;
                floorDispatchCD++;
            }
        }

        for (PrioritizedWorkItem item : queue) {
            if (batch.size() >= BATCH_SIZE) break;
            if (batchSymbols.contains(item.symbol())) continue;
            batch.add(item);
            batchSymbols.add(item.symbol());
        }

        return batch;
    }

    // --- Tiered symbol acquisition ---

    private void acquireSymbolTiered(PrioritizedWorkItem item) {
        try {
            Map<String, Object> ev = store.getEvidence(item.symbol());
            if (ev == null) return;

            String evStatus = (String) ev.get("status");

            if ("pending".equals(evStatus) || "failed".equals(evStatus)) {
                // Lifecycle: full acquisition
                var result = adapter.getExpirations(item.symbol());
                store.recordMetrics(result.cacheHit() ? 0 : 1, result.cacheHit() ? 1 : 0);
                String expJson = marshalExpirations(result.expirations());
                store.setExpirations(item.symbol(), expJson, result.retrievedAt());
                status = status.withSymbolsAcquiredTotal(status.symbolsAcquiredTotal() + 1);
                evidenceChangedSincePublish = true;
                changedSymbolsThisPublish++;

                var updated = store.getEvidence(item.symbol());
                if (updated != null && "expirations_known".equals(updated.get("status")) && updated.get("primaryExpiration") != null) {
                    acquireChain(item.symbol(), (String) updated.get("primaryExpiration"));
                }
            } else if ("expirations_known".equals(evStatus) && ev.get("primaryExpiration") != null) {
                // Partial: chain only
                acquireChain(item.symbol(), (String) ev.get("primaryExpiration"));
            } else if ("ready".equals(evStatus) || "absent".equals(evStatus)) {
                // Refresh
                if (item.needsExpirations()) {
                    var result = adapter.getExpirations(item.symbol());
                    store.recordMetrics(result.cacheHit() ? 0 : 1, result.cacheHit() ? 1 : 0);
                    String expJson = marshalExpirations(result.expirations());
                    store.setExpirations(item.symbol(), expJson, result.retrievedAt());
                    status = status.withSymbolsAcquiredTotal(status.symbolsAcquiredTotal() + 1);
                    evidenceChangedSincePublish = true;
                    changedSymbolsThisPublish++;

                    var updated = store.getEvidence(item.symbol());
                    if (updated != null && "expirations_known".equals(updated.get("status")) && updated.get("primaryExpiration") != null) {
                        acquireChain(item.symbol(), (String) updated.get("primaryExpiration"));
                    }
                } else if (ev.get("primaryExpiration") != null) {
                    acquireChain(item.symbol(), (String) ev.get("primaryExpiration"));
                }
            }
        } catch (Exception err) {
            String msg = err.getMessage() != null ? err.getMessage() : "Unknown error";
            try {
                store.setFailure(item.symbol(), msg);
            } catch (Exception e) { /* ignore */ }
            status = status.withFailures(status.failures() + 1);
            evidenceChangedSincePublish = true;
            changedSymbolsThisPublish++;
            try { Thread.sleep(DELAY_AFTER_FAILURE_MS); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
        }
    }

    private void acquireChain(String symbol, String expiration) throws Exception {
        var result = adapter.getOptionsChain(symbol, expiration);
        store.recordMetrics(result.cacheHit() ? 0 : 2, result.cacheHit() ? 1 : 0);
        store.setChain(symbol, marshalChain(result.chain()), result.retrievedAt());
        status = status.withSymbolsAcquiredTotal(status.symbolsAcquiredTotal() + 1);
        evidenceChangedSincePublish = true;
        changedSymbolsThisPublish++;
    }

    // --- Publication coalescing ---

    private void publishIfDue(boolean forceBeforeIdle) {
        if (!evidenceChangedSincePublish) {
            pubSkippedNoChange++;
            return;
        }

        long now = System.currentTimeMillis();
        long elapsed = now - lastPublishAt;

        if (forceBeforeIdle || elapsed >= schedulerConfig.publicationCoalesceMs()) {
            try {
                store.publishSnapshot();
                lastPublishAt = now;
                pubTotal++;
                pubLastChangedSymbols = changedSymbolsThisPublish;
                changedSymbolsThisPublish = 0;
                evidenceChangedSincePublish = false;
                System.out.printf("[worker] Published · gen %d · changed %d%n", store.getGeneration(), pubLastChangedSymbols);
            } catch (Exception e) {
                System.err.println("[worker] Publish failed: " + e.getMessage());
            }
        } else {
            pubSkippedCoalescing++;
        }
    }

    // --- Telemetry update ---

    private void updateTelemetry(String sessionState, int cycleCount,
                                  ClassifiedPopulation eligible,
                                  SchedulerTelemetry.ClassCounts due,
                                  SchedulerTelemetry.OldestAge oldestAge,
                                  String idleReason) {
        telemetry = new SchedulerTelemetry(
            Instant.now().toString(),
            sessionState,
            new SchedulerTelemetry.ClassCounts(eligible.classA(), eligible.classB(), eligible.classC(), eligible.classD()),
            due,
            oldestAge,
            null, // lastDispatch - updated inline during batch
            new SchedulerTelemetry.ClassCounts(dispatchCountA, dispatchCountB, dispatchCountC, dispatchCountD),
            new SchedulerTelemetry.ServiceDebt(dispatchedJobs - lastBServiceJob, dispatchedJobs - lastCDServiceJob),
            new SchedulerTelemetry.FloorDispatches(floorDispatchB, floorDispatchCD),
            new SchedulerTelemetry.Publications(pubTotal, pubSkippedNoChange, pubSkippedCoalescing, pubLastChangedSymbols),
            cycleCount,
            idleReason
        );
    }

    // --- JSON marshalling (store expects JSON strings) ---

    private String marshalExpirations(List<com.wheelwright.evidence.provider.MarketExpiration> expirations) {
        if (expirations.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < expirations.size(); i++) {
            var exp = expirations.get(i);
            if (i > 0) sb.append(",");
            sb.append("{\"date\":\"").append(exp.date()).append("\",\"dte\":").append(exp.dte()).append("}");
        }
        sb.append("]");
        return sb.toString();
    }

    private String marshalChain(com.wheelwright.evidence.provider.MarketChain chain) {
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"symbol\":\"").append(chain.symbol()).append("\",");
        sb.append("\"expiration\":\"").append(chain.expiration()).append("\",");
        sb.append("\"underlying\":{\"symbol\":\"").append(chain.underlying().symbol())
          .append("\",\"name\":\"").append(escapeJson(chain.underlying().name()))
          .append("\",\"price\":").append(chain.underlying().price()).append("},");

        sb.append("\"puts\":[");
        for (int i = 0; i < chain.puts().size(); i++) {
            if (i > 0) sb.append(",");
            appendContract(sb, chain.puts().get(i));
        }
        sb.append("],\"calls\":[");
        for (int i = 0; i < chain.calls().size(); i++) {
            if (i > 0) sb.append(",");
            appendContract(sb, chain.calls().get(i));
        }
        sb.append("]}");
        return sb.toString();
    }

    private void appendContract(StringBuilder sb, com.wheelwright.evidence.provider.MarketChain.OptionContract c) {
        sb.append("{\"strike\":").append(c.strike())
          .append(",\"bid\":").append(c.bid())
          .append(",\"ask\":").append(c.ask())
          .append(",\"delta\":").append(c.delta())
          .append(",\"openInterest\":").append(c.openInterest())
          .append(",\"volume\":").append(c.volume())
          .append("}");
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    // --- Status / Telemetry records ---

    public record WorkerStatus(
        String state,
        String currentSymbol,
        int cycleCount,
        int symbolsAcquiredTotal,
        String lastCycleStartedAt,
        Long lastCycleDurationMs,
        String nextScheduledAt,
        int failures
    ) {
        WorkerStatus withState(String s) { return new WorkerStatus(s, currentSymbol, cycleCount, symbolsAcquiredTotal, lastCycleStartedAt, lastCycleDurationMs, nextScheduledAt, failures); }
        WorkerStatus withCurrentSymbol(String s) { return new WorkerStatus(state, s, cycleCount, symbolsAcquiredTotal, lastCycleStartedAt, lastCycleDurationMs, nextScheduledAt, failures); }
        WorkerStatus withCycleCount(int c) { return new WorkerStatus(state, currentSymbol, c, symbolsAcquiredTotal, lastCycleStartedAt, lastCycleDurationMs, nextScheduledAt, failures); }
        WorkerStatus withSymbolsAcquiredTotal(int t) { return new WorkerStatus(state, currentSymbol, cycleCount, t, lastCycleStartedAt, lastCycleDurationMs, nextScheduledAt, failures); }
        WorkerStatus withLastCycleStartedAt(String t) { return new WorkerStatus(state, currentSymbol, cycleCount, symbolsAcquiredTotal, t, lastCycleDurationMs, nextScheduledAt, failures); }
        WorkerStatus withLastCycleDurationMs(long d) { return new WorkerStatus(state, currentSymbol, cycleCount, symbolsAcquiredTotal, lastCycleStartedAt, d, nextScheduledAt, failures); }
        WorkerStatus withNextScheduledAt(String t) { return new WorkerStatus(state, currentSymbol, cycleCount, symbolsAcquiredTotal, lastCycleStartedAt, lastCycleDurationMs, t, failures); }
        WorkerStatus withFailures(int f) { return new WorkerStatus(state, currentSymbol, cycleCount, symbolsAcquiredTotal, lastCycleStartedAt, lastCycleDurationMs, nextScheduledAt, f); }
    }
}
