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
 * Opening-Relevant Evidence Experiment extensions:
 *   - Three-phase posture awareness (BLOCKED / EXPIRATIONS_ONLY / FULL)
 *   - During EXPIRATIONS_ONLY: only expiration refreshes; opening set first, then general A/B
 *   - During FULL: opening-relevant symbols as Priority 1 (before general A/B/C/D cascade)
 *   - Opening-set hydration telemetry
 *
 * Preserved invariants:
 *   - Single acquisition cycle in flight at a time (INV-ACQ-01)
 *   - A/B/C/D service classes unmodified
 *   - Anti-starvation floors for B and C/D
 *   - Publication coalescing (change-driven, not heartbeat)
 */
public class AcquisitionWorker {

    // --- Constants ---
    private static final long DELAY_AFTER_FAILURE_MS = 5000;
    private static final long DELAY_SESSION_BLOCKED_MS = 300_000;
    private static final long DELAY_IDLE_MS = 30_000;
    private static final int BATCH_SIZE = 10;

    // --- Dependencies ---
    private final TradierAdapter adapter;
    private final SqliteEvidenceStore store;
    private final SessionGate sessionGate;
    private final SchedulerConfig schedulerConfig;
    private final Set<String> openingSet;

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

    // --- Opening-set experiment telemetry ---
    private volatile OpeningTelemetry openingTelemetry = OpeningTelemetry.EMPTY;
    private String openingBurstStartAt = null;
    private String openingFirstChainAt = null;
    private String openingHydration50At = null;
    private String openingHydration80At = null;
    private String openingHydration100At = null;
    private int openingFloorInterruptions = 0;
    private int openingTotalProviderCalls = 0;
    private boolean openingBurstComplete = false;

    // --- Cycle timing instrumentation (overhead analysis) ---
    private volatile CycleTimingStats cycleTimingStats = CycleTimingStats.EMPTY;

    // --- Observable State ---
    private volatile WorkerStatus status = new WorkerStatus(
        "stopped", null, 0, 0, null, null, null, 0
    );

    private volatile SchedulerTelemetry telemetry = SchedulerTelemetry.EMPTY;

    // --- Constructor ---

    public AcquisitionWorker(TradierAdapter adapter, SqliteEvidenceStore store,
                             SessionGate sessionGate, SchedulerConfig schedulerConfig,
                             Set<String> openingSet) {
        this.adapter = adapter;
        this.store = store;
        this.sessionGate = sessionGate;
        this.schedulerConfig = schedulerConfig;
        this.openingSet = openingSet != null ? openingSet : Collections.emptySet();

        if (!this.openingSet.isEmpty()) {
            System.out.printf("[worker] Opening-relevant set: %d symbols (experiment active)%n", this.openingSet.size());
        }
    }

    /** Backward-compatible constructor (experiment disabled) */
    public AcquisitionWorker(TradierAdapter adapter, SqliteEvidenceStore store,
                             SessionGate sessionGate, SchedulerConfig schedulerConfig) {
        this(adapter, store, sessionGate, schedulerConfig, Collections.emptySet());
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

    public WorkerStatus getStatus() { return status; }
    public SchedulerTelemetry getSchedulerTelemetry() { return telemetry; }
    public OpeningTelemetry getOpeningTelemetry() { return openingTelemetry; }

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

        // Phase-aware session gate
        var posture = sessionGate.getPosture();
        if (posture.posture() == SessionGate.Posture.BLOCKED) {
            if (!sessionBlockLogged) {
                System.out.printf("[worker] Acquisition suspended · %s%n", posture.reason());
                sessionBlockLogged = true;
            }
            status = status.withState("session_blocked");
            scheduleCycle(DELAY_SESSION_BLOCKED_MS);
            return;
        }
        if (sessionBlockLogged) {
            System.out.printf("[worker] Acquisition resumed · %s%n", posture.reason());
            sessionBlockLogged = false;
            // Reset opening-burst state at session resumption (new day)
            resetOpeningBurstState();
        }

        cycleActive = true;
        int cycleCount = status.cycleCount() + 1;
        status = status.withState("acquiring")
            .withCycleCount(cycleCount)
            .withLastCycleStartedAt(Instant.now().toString());
        long cycleStart = System.currentTimeMillis();

        try {
            if (posture.posture() == SessionGate.Posture.EXPIRATIONS_ONLY) {
                runExpirationsOnlyCycle(posture.reason(), cycleCount, cycleStart);
            } else {
                // FULL posture — normal acquisition with opening-burst priority
                runFullCycle(posture.reason(), cycleCount, cycleStart);
            }
        } catch (Exception err) {
            System.err.println("[worker] Cycle error: " + err.getMessage());
            status = status.withFailures(status.failures() + 1);
        }

        cycleActive = false;

        // Schedule next cycle
        try {
            long tPostStart = System.currentTimeMillis();
            boolean hasMoreWork;
            if (posture.posture() == SessionGate.Posture.EXPIRATIONS_ONLY) {
                hasMoreWork = hasExpirationsWork();
            } else {
                hasMoreWork = !store.getPrioritizedWorkQueue(schedulerConfig).isEmpty();
            }
            long tPostEnd = System.currentTimeMillis();
            long nextDelay = hasMoreWork ? 1000 : DELAY_IDLE_MS;
            status = status.withState(hasMoreWork ? "acquiring" : "idle");

            // Record post-cycle overhead (the "hasMoreWork" query + reschedule delay)
            recordPostCycleTiming(tPostEnd - tPostStart, nextDelay);

            scheduleCycle(nextDelay);
        } catch (Exception e) {
            scheduleCycle(DELAY_IDLE_MS);
        }
    }

    // --- Phase 1/2: Expirations-only cycle ---

    private void runExpirationsOnlyCycle(String sessionState, int cycleCount, long cycleStart) throws Exception {
        // During EXPIRATIONS_ONLY posture: refresh only stale expirations.
        // Priority: opening-set symbols first, then general Class A, then Class B.
        // No chain/quote fetches — those would produce inadmissible evidence.

        List<String> needsExpRefresh = store.getSymbolsNeedingExpirationRefresh(schedulerConfig.expirationFreshnessMs());

        if (needsExpRefresh.isEmpty()) {
            if (!idleLogged) {
                System.out.printf("[worker] Expirations-only: all within threshold · %s%n", sessionState);
                idleLogged = true;
            }
            status = status.withState("idle")
                .withLastCycleDurationMs(System.currentTimeMillis() - cycleStart);
            publishIfDue(true);

            // Emit telemetry with current eligible counts
            ClassifiedPopulation eligible = store.getClassifiedPopulation();
            var due = new SchedulerTelemetry.ClassCounts(0, 0, 0, 0);
            var oldestAge = new SchedulerTelemetry.OldestAge(null, null, null, null);
            updateTelemetry(sessionState, cycleCount, eligible, due, oldestAge, "expirations_satisfied");
            return;
        }

        idleLogged = false;

        // Partition into opening-set vs general, take a batch
        List<String> openingNeedsExp = needsExpRefresh.stream()
            .filter(openingSet::contains)
            .toList();
        List<String> generalNeedsExp = needsExpRefresh.stream()
            .filter(s -> !openingSet.contains(s))
            .toList();

        // Build batch: opening set first, then general, up to BATCH_SIZE
        List<String> batch = new ArrayList<>();
        for (String s : openingNeedsExp) {
            if (batch.size() >= BATCH_SIZE) break;
            batch.add(s);
        }
        for (String s : generalNeedsExp) {
            if (batch.size() >= BATCH_SIZE) break;
            batch.add(s);
        }

        int refreshed = 0;
        for (String symbol : batch) {
            if (!running) break;
            status = status.withCurrentSymbol(symbol);
            try {
                var result = adapter.getExpirations(symbol);
                store.recordMetrics(result.cacheHit() ? 0 : 1, result.cacheHit() ? 1 : 0);
                String expJson = marshalExpirations(result.expirations());
                store.setExpirations(symbol, expJson, result.retrievedAt());
                evidenceChangedSincePublish = true;
                changedSymbolsThisPublish++;
                refreshed++;

                if (openingSet.contains(symbol)) {
                    openingTotalProviderCalls++;
                }
            } catch (Exception e) {
                // Expirations-only failures are non-critical; log and continue
                System.err.printf("[worker] Expiration refresh failed for %s: %s%n", symbol, e.getMessage());
            }
        }

        status = status.withCurrentSymbol(null)
            .withLastCycleDurationMs(System.currentTimeMillis() - cycleStart);
        publishIfDue(false);

        if (refreshed > 0 && !idleLogged) {
            System.out.printf("[worker] Expirations-only: refreshed %d · %s%n", refreshed, sessionState);
        }

        // Telemetry
        ClassifiedPopulation eligible = store.getClassifiedPopulation();
        var due = new SchedulerTelemetry.ClassCounts(0, 0, 0, 0);
        var oldestAge = new SchedulerTelemetry.OldestAge(null, null, null, null);
        updateTelemetry(sessionState, cycleCount, eligible, due, oldestAge, null);
    }

    private boolean hasExpirationsWork() {
        try {
            return !store.getSymbolsNeedingExpirationRefresh(schedulerConfig.expirationFreshnessMs()).isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    // --- Phase 3: Full acquisition cycle with opening-burst priority ---

    private void runFullCycle(String sessionState, int cycleCount, long cycleStart) throws Exception {
        // Record burst start on first full cycle
        if (openingBurstStartAt == null && !openingSet.isEmpty()) {
            openingBurstStartAt = Instant.now().toString();
            System.out.printf("[worker] Opening burst started · %d symbols in opening set%n", openingSet.size());
        }

        // --- Cycle timing instrumentation ---
        long t0 = System.currentTimeMillis();

        // Build prioritized work queue
        List<PrioritizedWorkItem> workQueue = store.getPrioritizedWorkQueue(schedulerConfig);
        long t1 = System.currentTimeMillis();

        // --- Capture telemetry ---
        ClassifiedPopulation eligible = store.getClassifiedPopulation();
        long t2 = System.currentTimeMillis();

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
            publishIfDue(true);
            updateTelemetry(sessionState, cycleCount, eligible, due, oldestAge, idleReason);
            updateOpeningTelemetry();
            return;
        }

        idleLogged = false;

        // Reorder queue: opening-relevant symbols as Priority 1 during burst
        List<PrioritizedWorkItem> prioritizedQueue = applyOpeningBurstPriority(workQueue);

        // Select batch with anti-starvation floors
        List<PrioritizedWorkItem> batch = selectBatchWithFloors(prioritizedQueue);

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

            // Track opening-set chain acquisitions
            if (openingSet.contains(item.symbol())) {
                openingTotalProviderCalls += item.needsExpirations() ? 3 : 2;
                if (openingFirstChainAt == null) {
                    openingFirstChainAt = Instant.now().toString();
                }
            }
        }
        long t3 = System.currentTimeMillis();

        status = status.withCurrentSymbol(null)
            .withLastCycleDurationMs(System.currentTimeMillis() - cycleStart);
        publishIfDue(false);
        long t4 = System.currentTimeMillis();

        updateTelemetry(sessionState, cycleCount, eligible, due, oldestAge, idleReason);

        // Update opening-set hydration after each batch
        updateOpeningTelemetry();
        long t5 = System.currentTimeMillis();

        // Record cycle timing breakdown
        recordCycleTiming(t0, t1, t2, t3, t4, t5, batch.size());
    }

    /**
     * Apply opening-burst priority: opening-relevant symbols with eligible work
     * sort before non-opening-relevant symbols, regardless of A/B classification.
     * Once the opening set is fully current, this is a no-op.
     */
    private List<PrioritizedWorkItem> applyOpeningBurstPriority(List<PrioritizedWorkItem> queue) {
        if (openingSet.isEmpty() || openingBurstComplete) {
            return queue; // No reordering needed
        }

        // Partition: opening-relevant work items vs. the rest
        List<PrioritizedWorkItem> openingItems = new ArrayList<>();
        List<PrioritizedWorkItem> generalItems = new ArrayList<>();

        for (PrioritizedWorkItem item : queue) {
            if (openingSet.contains(item.symbol())) {
                openingItems.add(item);
            } else {
                generalItems.add(item);
            }
        }

        if (openingItems.isEmpty()) {
            // Opening set is fully satisfied — mark burst complete
            if (!openingBurstComplete) {
                openingBurstComplete = true;
                openingHydration100At = Instant.now().toString();
                System.out.printf("[worker] Opening burst complete · all %d symbols current%n", openingSet.size());
            }
            return queue;
        }

        // Opening items first (preserving internal oldest-first ordering), then general
        List<PrioritizedWorkItem> result = new ArrayList<>(queue.size());
        result.addAll(openingItems);
        result.addAll(generalItems);
        return result;
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
            // Track floor interruptions during opening burst
            if (!openingBurstComplete && !openingSet.isEmpty()) {
                openingFloorInterruptions++;
            }
        }
        if (cdDebt) {
            var cdItem = classCD.stream().filter(i -> !batchSymbols.contains(i.symbol())).findFirst().orElse(classCD.get(0));
            if (!batchSymbols.contains(cdItem.symbol())) {
                batch.add(cdItem);
                batchSymbols.add(cdItem.symbol());
                lastCDServiceJob = dispatchedJobs;
                floorDispatchCD++;
                if (!openingBurstComplete && !openingSet.isEmpty()) {
                    openingFloorInterruptions++;
                }
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
                    String primary = (String) updated.get("primaryExpiration");
                    acquireChain(item.symbol(), primary);
                    // Multi-expiration spike: fan out to secondary expirations
                    acquireSecondaryChains(item.symbol(), primary, expJson);
                }
            } else if ("expirations_known".equals(evStatus) && ev.get("primaryExpiration") != null) {
                // Partial: chain only — complete resolution to ready
                String primary = (String) ev.get("primaryExpiration");
                acquireChain(item.symbol(), primary);
                // No secondary fan-out here — this invocation did not fetch fresh
                // expirations from the provider. Experimental provenance requires
                // a fresh expiration list to precede secondary sampling.
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
                        String primary = (String) updated.get("primaryExpiration");
                        acquireChain(item.symbol(), primary);
                        // Multi-expiration spike: fan out to secondary expirations
                        acquireSecondaryChains(item.symbol(), primary, expJson);
                    }
                } else if (ev.get("primaryExpiration") != null) {
                    String primary = (String) ev.get("primaryExpiration");
                    acquireChain(item.symbol(), primary);
                    // No secondary fan-out on normal refresh — primary only.
                    // Secondary chains are acquired once when a fresh expiration list
                    // establishes the eligible set (call sites 1 and 3).
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

    /**
     * Multi-expiration fan-out: acquire chains for all eligible expirations
     * beyond the primary. Used for weekly-capable symbols (those with >1
     * eligible expiration in the 7-45 DTE window).
     *
     * EXPERIMENTAL SPIKE — observational only. Does not affect symbol resolution,
     * recommendation policy, or operator-facing behavior.
     */
    private void acquireSecondaryChains(String symbol, String primaryExpiration, String expirationsJson) {
        List<String> eligible = SqliteEvidenceStore.getEligibleExpirations(expirationsJson);
        if (eligible.size() <= 1) return; // Monthly-only — nothing to fan out

        for (String exp : eligible) {
            if (exp.equals(primaryExpiration)) continue; // Already acquired as primary
            if (!running) break;

            try {
                var result = adapter.getOptionsChain(symbol, exp);
                store.recordMetrics(result.cacheHit() ? 0 : 2, result.cacheHit() ? 1 : 0);
                store.setChainForExpiration(symbol, exp, marshalChain(result.chain()), result.retrievedAt());
                status = status.withSymbolsAcquiredTotal(status.symbolsAcquiredTotal() + 1);
                evidenceChangedSincePublish = true;
                changedSymbolsThisPublish++;
            } catch (Exception e) {
                // Log and continue — secondary chain failure is non-fatal
                System.err.printf("[worker] Secondary chain failed: %s/%s — %s%n", symbol, exp, e.getMessage());
            }
        }
    }

    // --- Opening-set telemetry ---

    private void resetOpeningBurstState() {
        openingBurstStartAt = null;
        openingFirstChainAt = null;
        openingHydration50At = null;
        openingHydration80At = null;
        openingHydration100At = null;
        openingFloorInterruptions = 0;
        openingTotalProviderCalls = 0;
        openingBurstComplete = false;
        openingTelemetry = OpeningTelemetry.EMPTY;
    }

    private void updateOpeningTelemetry() {
        if (openingSet.isEmpty()) return;

        try {
            // Count how many opening-set symbols have current-session chain evidence
            String sessionDate = SqliteEvidenceStore.sessionDateFor(Instant.now());
            int currentCount = store.countCurrentSessionChains(openingSet, sessionDate);
            int setSize = openingSet.size();

            double fraction = setSize > 0 ? (double) currentCount / setSize : 0.0;

            // Record hydration milestones
            if (openingHydration50At == null && fraction >= 0.50) {
                openingHydration50At = Instant.now().toString();
                System.out.printf("[worker] Opening set 50%% hydrated (%d/%d)%n", currentCount, setSize);
            }
            if (openingHydration80At == null && fraction >= 0.80) {
                openingHydration80At = Instant.now().toString();
                System.out.printf("[worker] Opening set 80%% hydrated (%d/%d)%n", currentCount, setSize);
            }
            if (openingHydration100At == null && fraction >= 1.0) {
                openingHydration100At = Instant.now().toString();
                openingBurstComplete = true;
                System.out.printf("[worker] Opening set 100%% hydrated (%d/%d)%n", currentCount, setSize);
            }

            openingTelemetry = new OpeningTelemetry(
                setSize,
                currentCount,
                fraction,
                openingBurstStartAt,
                openingFirstChainAt,
                openingHydration50At,
                openingHydration80At,
                openingHydration100At,
                openingFloorInterruptions,
                openingTotalProviderCalls,
                openingBurstComplete
            );
        } catch (Exception e) {
            // Telemetry should never crash the worker
            System.err.println("[worker] Opening telemetry error: " + e.getMessage());
        }
    }

    // --- Cycle timing instrumentation ---

    // Running averages (exponential moving average, alpha=0.1)
    private double avgQueueBuildMs = 0;
    private double avgClassifyMs = 0;
    private double avgBatchDispatchMs = 0;
    private double avgPublishMs = 0;
    private double avgTelemetryMs = 0;
    private double avgPostCycleQueryMs = 0;
    private long scheduledDelayMs = 1000;
    private int timingSamples = 0;

    private void recordCycleTiming(long t0, long t1, long t2, long t3, long t4, long t5, int batchSize) {
        long queueBuild = t1 - t0;
        long classify = t2 - t1;
        long batchDispatch = t3 - t2;
        long publish = t4 - t3;
        long telemetry = t5 - t4;

        double alpha = timingSamples < 10 ? 0.5 : 0.1; // converge faster initially
        avgQueueBuildMs = avgQueueBuildMs * (1 - alpha) + queueBuild * alpha;
        avgClassifyMs = avgClassifyMs * (1 - alpha) + classify * alpha;
        avgBatchDispatchMs = avgBatchDispatchMs * (1 - alpha) + batchDispatch * alpha;
        avgPublishMs = avgPublishMs * (1 - alpha) + publish * alpha;
        avgTelemetryMs = avgTelemetryMs * (1 - alpha) + telemetry * alpha;
        timingSamples++;

        cycleTimingStats = new CycleTimingStats(
            (long) avgQueueBuildMs,
            (long) avgClassifyMs,
            (long) avgBatchDispatchMs,
            (long) avgPublishMs,
            (long) avgTelemetryMs,
            (long) avgPostCycleQueryMs,
            scheduledDelayMs,
            timingSamples,
            batchSize
        );
    }

    private void recordPostCycleTiming(long queryMs, long nextDelay) {
        double alpha = timingSamples < 10 ? 0.5 : 0.1;
        avgPostCycleQueryMs = avgPostCycleQueryMs * (1 - alpha) + queryMs * alpha;
        scheduledDelayMs = nextDelay;
    }

    public CycleTimingStats getCycleTimingStats() {
        return cycleTimingStats;
    }

    /**
     * Cycle timing breakdown — where does inter-batch overhead go?
     * All times in milliseconds (exponential moving averages).
     */
    public record CycleTimingStats(
        long avgQueueBuildMs,
        long avgClassifyMs,
        long avgBatchDispatchMs,
        long avgPublishMs,
        long avgTelemetryMs,
        long avgPostCycleQueryMs,
        long scheduledDelayMs,
        int samples,
        int lastBatchSize
    ) {
        public static final CycleTimingStats EMPTY = new CycleTimingStats(0, 0, 0, 0, 0, 0, 0, 0, 0);

        /** Total measured overhead (everything except batch dispatch and scheduled delay) */
        public long overheadMs() {
            return avgQueueBuildMs + avgClassifyMs + avgPublishMs + avgTelemetryMs + avgPostCycleQueryMs;
        }
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
            null,
            new SchedulerTelemetry.ClassCounts(dispatchCountA, dispatchCountB, dispatchCountC, dispatchCountD),
            new SchedulerTelemetry.ServiceDebt(dispatchedJobs - lastBServiceJob, dispatchedJobs - lastCDServiceJob),
            new SchedulerTelemetry.FloorDispatches(floorDispatchB, floorDispatchCD),
            new SchedulerTelemetry.Publications(pubTotal, pubSkippedNoChange, pubSkippedCoalescing, pubLastChangedSymbols),
            cycleCount,
            idleReason
        );
    }

    // --- JSON marshalling ---

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

    // --- Records ---

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

    /**
     * Opening-set experiment telemetry — exposed via /api/status.
     */
    public record OpeningTelemetry(
        int setSize,
        int currentCount,
        double hydrationFraction,
        String burstStartAt,
        String firstChainAt,
        String hydration50At,
        String hydration80At,
        String hydration100At,
        int floorInterruptions,
        int totalProviderCalls,
        boolean burstComplete
    ) {
        public static final OpeningTelemetry EMPTY = new OpeningTelemetry(0, 0, 0.0, null, null, null, null, null, 0, 0, false);
    }
}
