package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.PrioritizedWorkItem;
import com.wheelwright.evidence.db.SqliteEvidenceStore.ClassifiedPopulation;
import com.wheelwright.evidence.provider.TradierAdapter;
import com.wheelwright.evidence.provider.ProviderOutcome;
import com.wheelwright.evidence.provider.ProviderAuthority;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.AcquisitionLease;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ObservationRecorder;

import java.sql.SQLException;
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

    // --- PL-PROV-FAILOVER lifecycle thresholds (provisional / experimental) ---
    // Confirmed provider-unusable signals required to consider failover. Provisional.
    private static final long DEGRADE_SIGNAL_THRESHOLD = 5;
    // Sustained representative production-probe successes required to fail back.
    private static final int FAILBACK_STREAK_REQUIRED = 3;
    // Representative probe symbol (liquid; well-formed in both environments).
    private static final String PROBE_SYMBOL = "SPY";
    // Max reschedule delay while not in normal production (keeps failback probing responsive).
    private static final long DELAY_PROVIDER_PROBE_MS = 2000;

    // Explicit recovery-probe cadence (PL-PROV-FAILOVER blocker: probe cadence must be
    // explicit and tested, not "whenever a cycle happens to run"). While degraded/probing/
    // suspended, a representative recovery probe is issued at most once per this interval,
    // decoupling probe frequency from scheduler cycle frequency. Provisional/experimental.
    private static final long DEFAULT_PROVIDER_PROBE_INTERVAL_MS = 30_000;

    // --- Dependencies ---
    // Retained for backward compatibility (tests, telemetry). Live acquisition routes
    // through leases from `providerManager` rather than this field directly.
    private final TradierAdapter adapter;
    private final ProviderAuthorityManager providerManager;
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
    private int lastMonitoredServiceJob = 0;
    private int floorDispatchMonitored = 0;
    private long lastPublishAt = 0;
    private boolean evidenceChangedSincePublish = false;
    private int changedSymbolsThisPublish = 0;

    // Publication counters
    private int pubTotal = 0;
    private int pubSkippedNoChange = 0;
    private int pubSkippedCoalescing = 0;
    private int pubLastChangedSymbols = 0;

    // Provider-availability signals (PL-PROV-FAILOVER constraint 3). Provider-WIDE
    // unusability (e.g. confirmed 401) increments this instead of contaminating any
    // symbol's lifecycle. Consumed by the provider-availability lifecycle, not by
    // per-symbol failure accounting.
    private volatile long providerUnusableSignals = 0;
    private volatile String lastProviderUnusableReason = null;

    // Provider-availability lifecycle tracking (PL-PROV-FAILOVER steps 6-8).
    // Hysteresis correction: degrade requires SUSTAINED/CONSECUTIVE provider-unusable
    // outcomes with NO intervening representative success. Any successful acquisition
    // (a representative success — the provider clearly served usable evidence) RESETS the
    // consecutive counter, so isolated/interleaved 401s can never accumulate across long
    // spans into a spurious failover. This replaces the previous cumulative
    // (providerUnusableSignals - baseline) trigger, which never reset on success.
    private volatile long consecutiveProviderUnusable = 0;
    private int productionProbeStreak = 0;          // consecutive representative successes
    // Monotonic-clock timestamp of the last recovery probe (0 = never). Gates cadence so
    // probes are issued at most once per the probe interval regardless of cycle rate.
    private long lastProviderProbeAtNanos = 0;
    // Injectable clock for deterministic cadence testing (defaults to System.nanoTime()).
    private java.util.function.LongSupplier probeClockNanos = System::nanoTime;
    // Effective probe interval (ms); overridable for tests via setProbeIntervalForTesting.
    private volatile long providerProbeIntervalMs = DEFAULT_PROVIDER_PROBE_INTERVAL_MS;
    private volatile String lastProbeDetail = null;

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

    /**
     * Primary constructor (PL-PROV-FAILOVER): acquisition routes through leases from
     * the {@link ProviderAuthorityManager}, which owns the active authority + fence
     * epoch. The {@code adapter} is retained for telemetry/back-compat.
     */
    public AcquisitionWorker(ProviderAuthorityManager providerManager, SqliteEvidenceStore store,
                             SessionGate sessionGate, SchedulerConfig schedulerConfig,
                             Set<String> openingSet) {
        this.providerManager = providerManager;
        this.adapter = providerManager.active().adapter();
        this.store = store;
        this.sessionGate = sessionGate;
        this.schedulerConfig = schedulerConfig;
        this.openingSet = openingSet != null ? openingSet : Collections.emptySet();

        if (!this.openingSet.isEmpty()) {
            System.out.printf("[worker] Opening-relevant set: %d symbols (experiment active)%n", this.openingSet.size());
        }
    }

    /**
     * Backward-compatible constructor (single adapter, no failover). Synthesizes a
     * single-authority manager so acquisition still routes through a lease — the epoch
     * never advances, so {@code validate()} is always true and behavior is unchanged.
     * Used by existing tests and any single-provider deployment.
     */
    public AcquisitionWorker(TradierAdapter adapter, SqliteEvidenceStore store,
                             SessionGate sessionGate, SchedulerConfig schedulerConfig,
                             Set<String> openingSet) {
        this(singleAuthorityManager(adapter), store, sessionGate, schedulerConfig, openingSet);
    }

    /**
     * Build a single-authority (no-failover) manager for the legacy adapter constructor and
     * mark it ACTIVE/settled. There is no sandbox, no epoch advancement, and no degraded-mode
     * concept here, so production-availability VERIFICATION does not apply — behavior must be
     * exactly as it was before failover existed (immediate acquisition under the sole authority).
     * The failover-aware (manager-based) constructor path deliberately does NOT do this: it
     * starts PRODUCTION_UNVERIFIED and validates via the control plane.
     */
    private static ProviderAuthorityManager singleAuthorityManager(TradierAdapter adapter) {
        var mgr = new ProviderAuthorityManager(
            new ProviderAuthority("prod", adapter.environmentLabel(), adapter, adapter.cache(), adapter.pacer()),
            null);
        mgr.markSingleAuthorityActiveForLegacy();
        return mgr;
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

    /**
     * Count of provider-WIDE unusability signals observed (PL-PROV-FAILOVER constraint 3).
     * Incremented when a provider call fails with a provider-unusable outcome (first
     * classifier: confirmed HTTP 401) instead of contaminating any symbol's lifecycle.
     * This is provider-availability telemetry, NOT per-symbol failure accounting.
     */
    public long getProviderUnusableSignals() { return providerUnusableSignals; }
    public String getLastProviderUnusableReason() { return lastProviderUnusableReason; }

    /** Provider-availability lifecycle projection for status (PL-PROV-FAILOVER step 9). */
    public String getProviderLifecycle() { return providerManager.lifecycle().name(); }
    public String getEvidenceAvailability() { return providerManager.evidenceAvailability(); }
    public String getActiveEnvironment() { return providerManager.active().environment(); }
    public boolean hasSandboxAuthority() { return providerManager.hasSandbox(); }
    public String getLastProbeDetail() { return lastProbeDetail; }

    /**
     * Active-acquisition admission observer (PL-PROV-FAILOVER — regime-agnostic).
     *
     * Reports the pacer/admission state of whatever authority is CURRENTLY ACTIVE,
     * addressed by ROLE ("active"), never by provider identity. This is the correct
     * throughput surface while degraded: the fixed production pacer bean injected into
     * StatusController measures the idle production authority, not the authority doing
     * the work. Consumers read admission behavior (119-start/60s ledger, single-flight,
     * backoff) without knowing or branching on production vs sandbox.
     */
    public RequestPacer.PacerState getActiveAuthorityPacerState() {
        return providerManager.active().pacer().getState();
    }

    public String getActiveAuthorityId() { return providerManager.active().id(); }

    /**
     * Recovery-probe admission observer. The production authority is the failback probe
     * authority whenever it is NOT the active authority. Exposing its pacer state proves
     * (constraint 4) that recovery probes run on their OWN isolated pacer and do not
     * consume the active authority's admission capacity — the two ledgers are distinct
     * RequestPacer instances by construction (one per ProviderAuthority).
     */
    public RequestPacer.PacerState getProbeAuthorityPacerState() {
        var active = providerManager.active();
        var production = providerManager.production();
        // While degraded/probing, production is the probe authority. While production is
        // active, there is no separate probe authority (sandbox, if present, is idle).
        if (active == production) {
            return providerManager.hasSandbox()
                ? providerManager.sandboxOrNull().pacer().getState()
                : null;
        }
        return production.pacer().getState();
    }

    public String getProbeAuthorityId() {
        var active = providerManager.active();
        var production = providerManager.production();
        if (active == production) {
            return providerManager.hasSandbox() ? providerManager.sandboxOrNull().id() : null;
        }
        return production.id();
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

        // Phase-aware session gate
        var posture = sessionGate.getPosture();
        if (posture.posture() == SessionGate.Posture.BLOCKED) {
            if (!sessionBlockLogged) {
                System.out.printf("[worker] Acquisition suspended · %s%n", posture.reason());
                sessionBlockLogged = true;
            }
            status = status.withState("session_blocked");

            // PL-PROV-FAILOVER: degraded mode is SELF-HEALING independently of market-session
            // acquisition policy (invariant I12: provider availability is orthogonal to the
            // Market Session Model). While BLOCKED we still evaluate the provider-availability
            // control plane so a production recovery (or a re-degrade) is detected and acted on
            // overnight/weekends/holidays — WITHOUT permitting any ordinary acquisition,
            // expirations work, chain acquisition, store mutation, or publication. This is
            // control-plane-only work: evaluateProviderLifecycle() runs non-writing probes and
            // may switch the active authority, but writes no evidence. It is wrapped so a
            // probe/transition error cannot disturb the blocked reschedule. cycleCount is NOT
            // incremented and state stays "session_blocked": a recovery evaluation is not an
            // acquisition cycle (telemetry integrity).
            try {
                evaluateProviderLifecycle();
            } catch (Exception le) {
                System.err.println("[provider] Lifecycle evaluation error: " + le.getMessage());
            }

            // Cadence while BLOCKED: recoveryProbeDue() (the injectable 30s gate) remains the
            // SOLE authority on probe frequency. We only choose how often to WAKE and check it.
            // Wake frequently (2s) whenever the control plane still has production to validate:
            // that is EVERY state except a fully-settled PRODUCTION_ACTIVE whose evidence is
            // already restored (productionEvidenceCurrent). This deliberately includes
            // PRODUCTION_UNVERIFIED (startup validation) AND PRODUCTION_ACTIVE-but-not-restored
            // (relapse-risk window), so a startup 401 is validated and a relapse is caught even
            // while ordinary acquisition is BLOCKED. Only the settled state stays quiet at 300s.
            long blockedDelay = providerManager.settledProduction()
                ? DELAY_SESSION_BLOCKED_MS
                : Math.min(DELAY_SESSION_BLOCKED_MS, DELAY_PROVIDER_PROBE_MS);
            scheduleCycle(blockedDelay);
            return;
        }
        // PL-PROV-FAILOVER: ordinary acquisition cannot run under an UNVERIFIED or SUSPENDED
        // authority — production must first be ESTABLISHED by the control plane. This gate runs
        // BEFORE any ordinary acquisition (unlike the post-acquisition lifecycle evaluation
        // below) so a PRODUCTION_UNVERIFIED binding can never perform a production acquisition —
        // and therefore can never set restoration state — before the representative-probe
        // verification predicate has passed. While not established we do control-plane
        // validation ONLY (non-writing probes; may establish/degrade/suspend), do NOT run
        // expirations/chain/store/publish, do NOT increment cycleCount, and reschedule
        // responsively so the 30s validation gate stays authoritative.
        if (!providerManager.acquisitionAuthorityEstablished()) {
            status = status.withState("provider_unverified");
            try {
                evaluateProviderLifecycle();
            } catch (Exception le) {
                System.err.println("[provider] Lifecycle evaluation error: " + le.getMessage());
            }
            long delay = providerManager.settledProduction()
                ? DELAY_IDLE_MS
                : Math.min(DELAY_IDLE_MS, DELAY_PROVIDER_PROBE_MS);
            scheduleCycle(delay);
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

            // Provider-availability lifecycle (PL-PROV-FAILOVER): after the acquisition
            // work, evaluate whether to fail over to sandbox or fail back to production.
            // Control-plane only; never writes evidence. Isolated so a probe/transition
            // error cannot abort the acquisition cycle.
            try {
                evaluateProviderLifecycle();
            } catch (Exception le) {
                System.err.println("[provider] Lifecycle evaluation error: " + le.getMessage());
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
            // PL-PROV-FAILOVER: until production is SETTLED (verified AND fresh evidence
            // restored), keep cycles frequent so representative validation / failback stays
            // responsive even when the (sandbox) work queue is momentarily empty. This uses the
            // SAME settled-production predicate as the operator-facing projection and the BLOCKED
            // path — PRODUCTION_ACTIVE-but-unrestored is NOT settled and still needs validation.
            if (!providerManager.settledProduction()) {
                nextDelay = Math.min(nextDelay, DELAY_PROVIDER_PROBE_MS);
            }
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

        // Monitored-position floor (PL-EVID-01) — highest-priority overlay obligation.
        // Capital is already exposed to these symbols, so they get a guaranteed tight
        // service cadence independent of recommendation class. The monitored set is small
        // and bounded (the operator's open positions), so this costs little provider budget.
        // Ordered oldest-first among due monitored items (queue is already oldest-first per class).
        List<PrioritizedWorkItem> monitored = queue.stream().filter(PrioritizedWorkItem::isMonitored).toList();
        boolean monitoredDebt = !monitored.isEmpty()
            && (dispatchedJobs - lastMonitoredServiceJob) >= schedulerConfig.monitoredMinServiceInterval();
        if (monitoredDebt) {
            batch.add(monitored.get(0));
            batchSymbols.add(monitored.get(0).symbol());
            lastMonitoredServiceJob = dispatchedJobs;
            floorDispatchMonitored++;
        }

        List<PrioritizedWorkItem> classB = queue.stream().filter(i -> "B".equals(i.urgencyClass())).toList();
        List<PrioritizedWorkItem> classCD = queue.stream().filter(i -> "C".equals(i.urgencyClass()) || "D".equals(i.urgencyClass())).toList();

        boolean bDebt = !classB.isEmpty() && (dispatchedJobs - lastBServiceJob) >= schedulerConfig.classBMinServiceInterval();
        boolean cdDebt = !classCD.isEmpty() && (dispatchedJobs - lastCDServiceJob) >= schedulerConfig.classCDMinServiceInterval();

        if (bDebt) {
            var bItem = classB.stream().filter(i -> !batchSymbols.contains(i.symbol())).findFirst().orElse(null);
            if (bItem != null) {
                batch.add(bItem);
                batchSymbols.add(bItem.symbol());
                lastBServiceJob = dispatchedJobs;
                floorDispatchB++;
                // Track floor interruptions during opening burst
                if (!openingBurstComplete && !openingSet.isEmpty()) {
                    openingFloorInterruptions++;
                }
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
        // Constraint 2: acquire ONE atomic lease for this operation. Every provider
        // call goes through lease.adapter(); every durable/status consequence is
        // committed only while the lease is still valid (commitGuarded). A concurrent
        // authority transition bumps the fence epoch, so an in-flight result is fenced
        // out — never written, never published (invariants I9/I10).
        final AcquisitionLease lease = providerManager.acquireLease();
        // Shared authoritative observer: mark every provider call this operation makes as
        // ACTIVE_ACQUISITION against the leased authority. The adapter refines the per-call
        // kind (quote/expirations/chain). Purpose is independent of authority identity, so
        // the observer can distinguish active-acquisition load from recovery-probe load even
        // when they resolve to the same pacer.
        // Scope opened ONCE per logical acquisition, keyed to the lease's logical operation id
        // (review-3 #2): every HTTP request this acquisition issues shares that id, and so does
        // the single terminal verdict recorded below.
        lease.adapter().pacer().openPurposeScope(lease.operationId(),
            ObservationRecorder.Purpose.ACTIVE_ACQUISITION, item.symbol(), lease.provenanceId(),
            lease.fenceEpoch());
        // Terminal-outcome bookkeeping (review-3 #3): exactly ONE terminal outcome per lease.
        // terminal[0]: the terminal LogicalOutcome; committedPrimary[0]: whether the normalized,
        // fenced, durable PRIMARY chain (usable evidence) was written under a current lease.
        final ObservationRecorder.LogicalOutcome[] terminal = { null };
        final boolean[] fenced = { false };
        final boolean[] committedPrimary = { false };
        final boolean[] backoffAfterFailure = { false };
        try {
            Map<String, Object> ev = store.getEvidence(item.symbol());
            if (ev == null) {
                // Missing/unexpected state — nothing to acquire. Honest terminal: ABORTED.
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_ABORTED;
                return;
            }

            String evStatus = (String) ev.get("status");

            if ("pending".equals(evStatus) || "failed".equals(evStatus)) {
                // Lifecycle: full acquisition
                var result = lease.adapter().getExpirations(item.symbol());
                boolean committed = commitGuarded(lease, item.symbol(), "expirations", () -> {
                    store.recordMetrics(result.cacheHit() ? 0 : 1, result.cacheHit() ? 1 : 0);
                    store.setExpirations(item.symbol(), marshalExpirations(result.expirations()), result.retrievedAt(), lease.environment(), lease.provenanceId());
                });
                if (!committed) { fenced[0] = true; terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_FENCED; return; }

                var updated = store.getEvidence(item.symbol());
                if (updated != null && "expirations_known".equals(updated.get("status")) && updated.get("primaryExpiration") != null) {
                    String primary = (String) updated.get("primaryExpiration");
                    committedPrimary[0] = acquireAllEligibleChains(lease, item.symbol(), primary, marshalExpirations(result.expirations()), fenced);
                }
            } else if ("expirations_known".equals(evStatus) && ev.get("primaryExpiration") != null) {
                // Partial: chain only — complete resolution with full surface
                String primary = (String) ev.get("primaryExpiration");
                String expJson = (String) ev.get("expirations");
                committedPrimary[0] = acquireAllEligibleChains(lease, item.symbol(), primary, expJson, fenced);
            } else if ("ready".equals(evStatus) || "absent".equals(evStatus)) {
                // Refresh
                if (item.needsExpirations()) {
                    var result = lease.adapter().getExpirations(item.symbol());
                    boolean committed = commitGuarded(lease, item.symbol(), "expirations", () -> {
                        store.recordMetrics(result.cacheHit() ? 0 : 1, result.cacheHit() ? 1 : 0);
                        store.setExpirations(item.symbol(), marshalExpirations(result.expirations()), result.retrievedAt(), lease.environment(), lease.provenanceId());
                    });
                    if (!committed) { fenced[0] = true; terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_FENCED; return; }

                    var updated = store.getEvidence(item.symbol());
                    if (updated != null && "expirations_known".equals(updated.get("status")) && updated.get("primaryExpiration") != null) {
                        String primary = (String) updated.get("primaryExpiration");
                        committedPrimary[0] = acquireAllEligibleChains(lease, item.symbol(), primary, marshalExpirations(result.expirations()), fenced);
                    }
                } else if (ev.get("primaryExpiration") != null) {
                    // Normal refresh: acquire full eligible surface
                    String primary = (String) ev.get("primaryExpiration");
                    String expJson = (String) ev.get("expirations");
                    committedPrimary[0] = acquireAllEligibleChains(lease, item.symbol(), primary, expJson, fenced);
                }
            }
            // Terminal verdict for the whole logical acquisition (review-4 #2: EVERY completed
            // path yields exactly one honest terminal):
            //   FENCED             — a transition discarded the result mid-op;
            //   COMMITTED          — a normalized primary chain (usable evidence) was durably
            //                        written under a current lease;
            //   NO_USABLE_EVIDENCE — the op completed without a usable primary chain
            //                        (expirations-only, absent, or an unhandled/absent state).
            if (fenced[0]) {
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_FENCED;
            } else if (committedPrimary[0]) {
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_COMMITTED;
            } else {
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_NO_USABLE_EVIDENCE;
            }
        } catch (Exception err) {
            String msg = err.getMessage() != null ? err.getMessage() : "Unknown error";

            // PL-PROV-FAILOVER constraint 3: classify the outcome cause-safely so a
            // provider-WIDE unusability (first classifier: confirmed HTTP 401) is NEVER
            // projected into per-symbol lifecycle. Provider-unusable must not call
            // store.setFailure() (which would increment failure_count and eventually flip
            // resolution='failed' — the incident's symbol-contamination path, invariant I2).
            ProviderOutcome outcome = ProviderOutcome.classify(err);
            if (outcome == ProviderOutcome.PROVIDER_UNUSABLE) {
                // Provider-control signal only: no durable symbol mutation, no per-symbol
                // failure accounting. The provider-availability lifecycle owns this condition.
                //
                // AUTHORITY-FENCED control signaling (review-5 #1): the failure-streak counters
                // belong to the CURRENT authority. A 401 completing under a STALE lease (a
                // transition already landed) must NOT pollute the new authority's streak or
                // trigger a spurious re-degrade — so the counter bump runs ONLY IF the lease is
                // still current, inside the transition boundary. The completion stays observable
                // via the terminal PROVIDER_UNUSABLE below regardless.
                providerManager.signalProviderUnusableIfCurrent(lease, () -> {
                    providerUnusableSignals++;        // cumulative telemetry (never resets)
                    consecutiveProviderUnusable++;    // sustained-run trigger (resets on success)
                    lastProviderUnusableReason = msg;
                });
                // Honest terminal for THIS logical acquisition (review-4 #2): the provider was
                // unusable, so this acquisition produced no usable evidence. Observable whether
                // or not the control counters were current-authority-applicable.
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_PROVIDER_UNUSABLE;
                return;
            }

            // Genuine per-symbol quality failure (or unclassified). Failure accounting is
            // AUTHORITY-SENSITIVE (review-3 #5): store.setFailure + failure/changed-symbol
            // counters must NOT corrupt current-authority semantics if a transition landed
            // during this operation. Route the failure write + accounting through the manager's
            // guarded boundary so a stale lease applies NEITHER. Three DISTINCT dispositions
            // (review-5 #3), never conflated:
            //   commitIfCurrent == false           -> FENCED (stale lease; nothing attempted)
            //   guarded mutation throws (current)   -> PERSISTENCE_FAILED (write failed, NOT fencing)
            //   guarded recording succeeds          -> REJECTED (per-subject quality failure recorded)
            boolean failureApplied = false;
            boolean persistenceFailed = false;
            try {
                failureApplied = providerManager.commitIfCurrent(lease, item.symbol(), "failure",
                    () -> store.setFailure(item.symbol(), msg),
                    () -> {
                        status = status.withFailures(status.failures() + 1);
                        evidenceChangedSincePublish = true;
                        changedSymbolsThisPublish++;
                    });
            } catch (SQLException | RuntimeException persistErr) {
                // The lease was CURRENT (commitIfCurrent only runs the mutation when current) but
                // the durable write threw. This is a persistence failure, NOT fencing.
                persistenceFailed = true;
            }
            if (persistenceFailed) {
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_PERSISTENCE_FAILED;
            } else if (failureApplied) {
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_REJECTED;
            } else {
                terminal[0] = ObservationRecorder.LogicalOutcome.ACQUISITION_FENCED;
            }
            // The per-symbol failure backoff sleep is deferred to AFTER the terminal is recorded
            // (below the finally) so the terminal disposition is observable immediately and is not
            // hidden behind the backoff delay. Only after a genuinely RECORDED failure.
            backoffAfterFailure[0] = failureApplied;
        } finally {
            // EXACTLY ONE terminal logical outcome per lease, correlated to the logical operation
            // id (review-4 #2). Every exit path sets terminal[0]: COMMITTED (usable primary chain),
            // NO_USABLE_EVIDENCE (completed without one), FENCED (transition mid-op), REJECTED
            // (per-subject quality failure), PROVIDER_UNUSABLE (provider-wide condition), or
            // ABORTED (missing/unexpected state). terminal[0] should never be null here; the
            // null-guard is defensive only.
            if (terminal[0] != null) {
                providerManager.recordTerminalOutcome(lease, item.symbol(), terminal[0]);
            }
            lease.adapter().pacer().clearPurposeScope();
        }
        // Per-symbol failure backoff, AFTER the terminal disposition has been recorded/observed.
        if (backoffAfterFailure[0]) {
            try { Thread.sleep(DELAY_AFTER_FAILURE_MS); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
        }
    }

    /**
     * Provider-availability lifecycle evaluation (PL-PROV-FAILOVER steps 6-8), run once
     * per acquisition cycle. Pure control-plane: it may switch the active authority and
     * run non-writing probes, but performs NO store write, symbol-lifecycle change, or
     * publication. Domain code never branches on provider identity — this is Layer 1.
     */
    private void evaluateProviderLifecycle() {
        var lifecycle = providerManager.lifecycle();

        // Case 1 — PRODUCTION_ACTIVE and evidence already restored (a fresh production primary
        // chain committed under the current epoch). Ordinary acquisition is naturally exercising
        // production, so provider health is supplied by acquisition outcomes: degrade only on a
        // SUSTAINED consecutive run of provider-unusable acquisition outcomes (reset on any
        // representative success). No control-plane probing needed here.
        if (lifecycle == ProviderAuthorityManager.Lifecycle.PRODUCTION_ACTIVE
                && providerManager.productionEvidenceCurrent()) {
            if (consecutiveProviderUnusable >= DEGRADE_SIGNAL_THRESHOLD) {
                degradeFromUnusableProduction();
            }
            return;
        }

        // Every other state means production is NOT confirmed to be supplying current usable
        // evidence: PRODUCTION_UNVERIFIED (startup — never validated this process),
        // PRODUCTION_ACTIVE-but-not-yet-restored (authority established but no qualifying fresh
        // commit yet — the relapse-risk window while ordinary acquisition cannot exercise it),
        // DEGRADED_SANDBOX / PRODUCTION_PROBING (serving sandbox, probing production), or
        // ACQUISITION_SUSPENDED. In ALL of these the control plane must ACTIVELY validate
        // production on the explicit cadence, because ordinary acquisition cannot (or has not
        // yet) established production health. This is the single unified validation path.
        if (!recoveryProbeDue()) {
            return; // decouple probe cadence from cycle/wake rate
        }
        lastProviderProbeAtNanos = probeClockNanos.getAsLong();

        boolean servingSandbox = providerManager.active() == providerManager.sandboxOrNull()
            && providerManager.hasSandbox();

        // If we are serving sandbox (degraded/suspended) confirm sandbox still usable so a
        // suspended state can recover into degraded and a degraded state stays justified.
        if ((lifecycle == ProviderAuthorityManager.Lifecycle.ACQUISITION_SUSPENDED)
                && providerManager.hasSandbox()) {
            var sp = providerManager.sandboxOrNull().probeRepresentative(PROBE_SYMBOL, providerManager.currentEpoch());
            if (sp.usable()) {
                providerManager.activateDegraded();
                consecutiveProviderUnusable = 0;
                servingSandbox = true;
            }
        }

        // Representative validation of the PREFERRED production authority.
        var prod = providerManager.production();
        var probe = prod.probeRepresentative(PROBE_SYMBOL, providerManager.currentEpoch());
        lastProbeDetail = "production: " + probe.detail();

        if (probe.usable()) {
            productionProbeStreak++;
            // While serving sandbox, reflect the in-progress recovery as PROBING (hysteresis).
            if (servingSandbox) {
                providerManager.enterProbing();
            }
            if (productionProbeStreak >= FAILBACK_STREAK_REQUIRED) {
                if (servingSandbox) {
                    // Sandbox → production failback (increments the fence epoch).
                    if (providerManager.activateProduction()) {
                        System.out.printf("[provider] Production recovered (%d sustained representative successes) — PRODUCTION_ACTIVE (evidence still degraded until a fresh production commit).%n",
                            productionProbeStreak);
                    }
                } else {
                    // Production is the active binding but not yet active: UNVERIFIED (startup)
                    // or ACQUISITION_SUSPENDED (production-bound, previously unusable, no usable
                    // sandbox). Establish/recover production ACTIVE at the SAME epoch (initial/
                    // retained authority, not a failback). This is the fix for the suspended
                    // dead-end: establishProductionVerified() now accepts SUSPENDED too, so the
                    // streak actually recovers instead of resetting forever. Evidence stays
                    // DEGRADED until a fresh production primary commit restores NORMAL.
                    if (providerManager.establishProductionVerified()) {
                        System.out.printf("[provider] Production verified/recovered (%d sustained representative successes) — PRODUCTION_ACTIVE (evidence still degraded until a fresh production commit).%n",
                            productionProbeStreak);
                    }
                }
                productionProbeStreak = 0;
                consecutiveProviderUnusable = 0;
            }
        } else {
            // Production not usable. Reset the recovery streak and ensure we are on a VERIFIED
            // fallback authority (or suspended). This handles BOTH startup-unusable and the
            // relapse of a PRODUCTION_ACTIVE-but-not-yet-restored authority while ordinary
            // acquisition cannot supply failure signals.
            productionProbeStreak = 0;
            if (servingSandbox) {
                // Already serving sandbox: stay degraded (drop out of PROBING if we were in it).
                providerManager.abandonProbing();
            } else {
                // Preferred (production) authority is active/unverified but unusable → move to a
                // verified fallback, exactly like the acquisition-driven degrade path.
                degradeFromUnusableProduction();
            }
        }
    }

    /**
     * Move off an unusable production authority to a VERIFIED sandbox (DEGRADED_SANDBOX), or
     * ACQUISITION_SUSPENDED when no sandbox exists / sandbox is also unusable. Shared by the
     * acquisition-driven degrade (Case 1) and the control-plane validation path (startup and
     * the PRODUCTION_ACTIVE-but-unrestored relapse window). Verifies sandbox is actually usable
     * before failing over so we never present a fallback we have not validated.
     */
    private void degradeFromUnusableProduction() {
        if (!providerManager.hasSandbox()) {
            providerManager.suspend();
            System.out.println("[provider] Production unusable and no sandbox authority — ACQUISITION_SUSPENDED.");
            return;
        }
        var sandbox = providerManager.sandboxOrNull();
        var probe = sandbox.probeRepresentative(PROBE_SYMBOL, providerManager.currentEpoch());
        lastProviderProbeAtNanos = probeClockNanos.getAsLong();
        lastProbeDetail = "sandbox: " + probe.detail();
        if (probe.usable()) {
            if (providerManager.activateDegraded()) {
                consecutiveProviderUnusable = 0;
                System.out.println("[provider] Production unusable; sandbox verified usable — DEGRADED_SANDBOX active.");
            }
        } else {
            providerManager.suspend();
            System.out.println("[provider] Production unusable and sandbox not usable — ACQUISITION_SUSPENDED.");
        }
    }

    /**
     * Explicit recovery-probe cadence gate (PL-PROV-FAILOVER). A probe is due when none
     * has been issued yet, or at least {@link #PROVIDER_PROBE_INTERVAL_MS} has elapsed
     * since the last one. Uses the injectable monotonic clock so cadence is deterministically
     * testable. This is the ONLY place recovery-probe frequency is decided.
     */
    boolean recoveryProbeDue() {
        long now = probeClockNanos.getAsLong();
        if (lastProviderProbeAtNanos == 0) return true;
        long elapsedMs = (now - lastProviderProbeAtNanos) / 1_000_000L;
        return elapsedMs >= providerProbeIntervalMs;
    }

    /** Test seam: inject a deterministic monotonic clock for probe-cadence tests. */
    void setProbeClockForTesting(java.util.function.LongSupplier nanos) {
        this.probeClockNanos = nanos;
    }

    /** Test seam: set the last-probe timestamp (monotonic ns) to exercise cadence math. */
    void setLastProbeAtNanosForTesting(long nanos) {
        this.lastProviderProbeAtNanos = nanos;
    }

    /** Test seam: override the recovery-probe interval (ms) for deterministic timing tests. */
    void setProbeIntervalForTesting(long ms) {
        this.providerProbeIntervalMs = ms;
    }

    /** Test accessor: the effective recovery-probe interval (ms). */
    long providerProbeIntervalMsForTesting() {
        return providerProbeIntervalMs;
    }

    /** Test accessor: current consecutive provider-unusable run length. */
    long consecutiveProviderUnusableForTesting() {
        return consecutiveProviderUnusable;
    }

    /** Test accessor: the provider-authority manager (exposes the shared observer). */
    ProviderAuthorityManager providerManagerForTesting() {
        return providerManager;
    }

    /**
     * Commit a store/status mutation only if the lease is still valid (its authority
     * epoch has not been superseded by a transition). A stale lease discards the
     * result: NO durable write, NO symbol-lifecycle change, NO generation/publish, NO
     * acquisition accounting. Returns true if the mutation was applied.
     *
     * This is the single choke point enforcing constraint 2 / invariants I9/I10 for
     * successful acquisitions. Provider calls have already happened by the time this is
     * invoked; only their externally-meaningful consequences are gated here.
     */
    private boolean commitGuarded(AcquisitionLease lease, String subject, String operationKind,
                                  StoreMutation mutation) throws SQLException {
        // Non-restoration-qualifying commit (expirations, secondary chains, absent/failure,
        // cache-hit primaries). Never establishes production evidence restoration.
        return commitGuarded(lease, subject, operationKind, false, mutation);
    }

    /**
     * Commit a store/status mutation only if the lease is still valid.
     *
     * @param qualifiesForRestoration TRUE only for an explicit FRESH (non-cache),
     *        POST-TRANSITION PRIMARY production provider acquisition. This — and ONLY this —
     *        may establish production-evidence restoration (PL-PROV-FAILOVER). The caller
     *        computes this fact from the actual provider response; it is NOT inferred from the
     *        {@code operationKind} string, provenance alone, a cache hit, or a secondary chain.
     */
    private boolean commitGuarded(AcquisitionLease lease, String subject, String operationKind,
                                  boolean qualifiesForRestoration, StoreMutation mutation) throws SQLException {
        // ATOMIC transition+commit (review-2/3): the SQL write AND every authority-sensitive
        // post-SQL consequence (hysteresis reset, acquisition total, publication-dirty flag,
        // changed-symbol count) run INSIDE the manager's transition synchronization boundary,
        // so a stale lease applies NONE of them. Records an INTERMEDIATE STORE_MUTATION_APPLIED
        // (not a terminal verdict — the single terminal outcome is recorded once per lease).
        return providerManager.commitIfCurrent(lease, subject, operationKind, mutation::apply,
            () -> {
                consecutiveProviderUnusable = 0;   // representative success breaks the unusable run
                status = status.withSymbolsAcquiredTotal(status.symbolsAcquiredTotal() + 1);
                evidenceChangedSincePublish = true;
                changedSymbolsThisPublish++;

                // PL-PROV-FAILOVER restoration boundary: operational evidence restoration
                // completes ONLY for an explicit fresh (non-cache), post-transition PRIMARY
                // production provider commit under the CURRENT epoch. commitIfCurrent guarantees
                // this effect runs only when the lease is current, so lease.fenceEpoch() is the
                // current epoch here. Restoration is NOT inferred from operationKind, provenance
                // alone, a cache hit, or a secondary chain — the caller passes the explicit fact.
                if (qualifiesForRestoration && "production".equals(lease.environment())) {
                    providerManager.markProductionEvidenceRestored(lease.fenceEpoch());
                }
            });
    }

    @FunctionalInterface
    private interface StoreMutation { void apply() throws SQLException; }

    /**
     * Acquire chains for ALL eligible expirations within the 7-45 DTE window, through
     * the given lease. All provider calls use lease.adapter(); all writes are
     * commit-guarded so a mid-operation authority transition fences the result.
     *
     * The primary expiration is acquired via setChain() (updates resolution to ready).
     * Additional eligible expirations are acquired via setChainForExpiration().
     * Failures on individual (non-primary) expirations are non-fatal — logged, skipped.
     */
    private boolean acquireAllEligibleChains(AcquisitionLease lease, String symbol,
                                             String primaryExpiration, String expirationsJson,
                                             boolean[] fenced) {
        List<String> eligible = expirationsJson != null
            ? SqliteEvidenceStore.getEligibleExpirations(expirationsJson)
            : List.of(primaryExpiration);

        // Always acquire the primary first (sets resolution to ready). A committed primary is
        // the normalized, fenced, durable chain that constitutes USABLE EVIDENCE (review-3 #3).
        try {
            var result = lease.adapter().getOptionsChain(symbol, primaryExpiration);
            // This is THE primary chain. It qualifies to establish production-evidence
            // restoration ONLY when it is a FRESH provider response (not a cache hit) — a
            // cache hit may be pre-transition/pre-outage evidence and must never restore.
            boolean qualifiesForRestoration = !result.cacheHit();
            boolean committed = commitGuarded(lease, symbol, "chain", qualifiesForRestoration, () -> {
                store.recordMetrics(result.cacheHit() ? 0 : 2, result.cacheHit() ? 1 : 0);
                store.setChain(symbol, marshalChain(result.chain()), result.retrievedAt(), lease.environment(), lease.provenanceId());
            });
            if (!committed) { fenced[0] = true; return false; } // fenced — stop, primary not usable
        } catch (Exception e) {
            // Primary chain failure is fatal for this symbol — propagate (cause preserved
            // so ProviderOutcome.classify can still see a wrapped ProviderError, constraint 3).
            throw new RuntimeException("Primary chain failed: " + symbol + "/" + primaryExpiration, e);
        }

        // Acquire remaining eligible expirations (intermediate store mutations, not terminal)
        for (String exp : eligible) {
            if (exp.equals(primaryExpiration)) continue;
            if (!running) break;

            try {
                var result = lease.adapter().getOptionsChain(symbol, exp);
                commitGuarded(lease, symbol, "chain", () -> {
                    store.recordMetrics(result.cacheHit() ? 0 : 2, result.cacheHit() ? 1 : 0);
                    store.setChainForExpiration(symbol, exp, marshalChain(result.chain()), result.retrievedAt(), lease.environment(), lease.provenanceId());
                });
            } catch (Exception e) {
                // Constraint 3 also applies to SECONDARY expirations: a provider-WIDE
                // unusability (confirmed 401) surfacing on a secondary chain is NOT a
                // per-symbol quality issue — it must feed the provider-availability
                // control plane, not be silently swallowed as a per-expiration skip.
                // Otherwise a production outage that first manifests on a secondary chain
                // would be invisible to failover detection.
                ProviderOutcome outcome = ProviderOutcome.classify(e);
                if (outcome == ProviderOutcome.PROVIDER_UNUSABLE) {
                    // AUTHORITY-FENCED (review-5 #1): a secondary-chain 401 completing under a
                    // stale lease must not pollute the current authority's failure streak.
                    final String reason = e.getMessage();
                    providerManager.signalProviderUnusableIfCurrent(lease, () -> {
                        providerUnusableSignals++;
                        consecutiveProviderUnusable++;
                        lastProviderUnusableReason = reason;
                    });
                    // Abandon the rest of this symbol's secondary surface — the provider
                    // is unusable; continuing would just accumulate the same failure. The
                    // PRIMARY chain already committed, so usable evidence stands (terminal
                    // COMMITTED); the secondary-surface unusability is a control-plane signal.
                    return true;
                }
                // Genuine per-expiration quality failure: non-fatal, logged, skipped.
                System.err.printf("[worker] Chain acquisition failed: %s/%s — %s%n", symbol, exp, e.getMessage());
            }
        }
        return true; // primary chain committed → usable evidence
    }

    /**
     * @deprecated Use acquireAllEligibleChains instead. Retained temporarily for
     * any callers outside acquireSymbolTiered.
     */
    private void acquireSecondaryChains(String symbol, String primaryExpiration, String expirationsJson) {
        // Now subsumed by acquireAllEligibleChains — this method is no longer called
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
