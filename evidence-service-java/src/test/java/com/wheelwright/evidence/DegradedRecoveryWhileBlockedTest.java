package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.MarketChain;
import com.wheelwright.evidence.provider.MarketExpiration;
import com.wheelwright.evidence.provider.ObservationRecorder;
import com.wheelwright.evidence.provider.ProviderAuthority;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.ProviderError;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER — Degraded mode is self-healing INDEPENDENTLY of the market-session
 * acquisition gate (invariant I12). While ordinary acquisition is session-BLOCKED, the
 * provider-availability control plane evaluates production recovery on its own cadence and
 * automatically fails back. Authority recovery does NOT imply evidence restoration; NORMAL
 * requires a current-epoch production primary-chain commit.
 */
class DegradedRecoveryWhileBlockedTest {

    private static final String FUTURE_EXPIRATION =
        java.time.LocalDate.now(ZoneOffset.UTC).plusDays(21).toString();

    /** Saturday — ordinary acquisition is BLOCKED. */
    private static Clock weekendBlockedClock() {
        return Clock.fixed(
            ZonedDateTime.of(2026, 7, 25, 12, 0, 0, 0, ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
    }

    /** Regular observation — ordinary acquisition is FULL. */
    private static Clock marketClock() {
        return Clock.fixed(
            ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
    }

    private static MarketChain usableChain(String symbol) {
        var underlying = new MarketChain.Underlying(symbol, symbol, 50.0);
        var put = new MarketChain.OptionContract(48.0, 1.0, 1.1, -0.28, 100, 10);
        return new MarketChain(symbol, FUTURE_EXPIRATION, underlying, List.of(put), List.of());
    }

    private static ProviderAuthority auth(String id, String env, TradierAdapter a) {
        return new ProviderAuthority(id, env, a, a.cache(), a.pacer());
    }

    private static SchedulerConfig config() {
        return new SchedulerConfig(25*60*1000L, 120*60*1000L, 6*60*60*1000L, 10, 20, 5000L, 15*60*1000L, 5, 25*60*1000L);
    }

    /**
     * Config where the CHAIN is immediately stale but EXPIRATIONS stay fresh, so a ready
     * symbol skips the expirations-only refresh and re-acquires its primary CHAIN promptly
     * after failback (producing the production primary-chain commit that restores NORMAL).
     * arg order: chainFreshnessTargetMs, chainMaxAgeMs, expirationFreshnessMs, ...
     */
    private static SchedulerConfig chainStaleExpirationsFreshConfig() {
        return new SchedulerConfig(1L, 1L, 6*60*60*1000L, 10, 20, 100L, 15*60*1000L, 5, 1L);
    }

    // --- Adapter doubles ---------------------------------------------------

    private static final class RecoverableAdapter extends TradierAdapter {
        final AtomicBoolean healthy = new AtomicBoolean(false);
        final AtomicInteger probeCalls = new AtomicInteger(0);
        RecoverableAdapter() { super("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            return new ExpirationResult(List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)), Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            return new ChainResult(usableChain(s), Instant.now().toString(), false);
        }
        @Override public ProbeResult probeRepresentative(String s) {
            probeCalls.incrementAndGet();
            return healthy.get() ? new ProbeResult(true, "usable") : new ProbeResult(false, "401");
        }
    }

    private static final class UsableSandboxAdapter extends TradierAdapter {
        UsableSandboxAdapter() { super("k", "https://sandbox.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            return new ExpirationResult(List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)), Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            return new ChainResult(usableChain(s), Instant.now().toString(), false);
        }
        @Override public ProbeResult probeRepresentative(String s) { return new ProbeResult(true, "usable"); }
    }

    private static final class HealthyProdAdapter extends TradierAdapter {
        final AtomicInteger probeCalls = new AtomicInteger(0);
        HealthyProdAdapter() { super("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            return new ExpirationResult(List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)), Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            return new ChainResult(usableChain(s), Instant.now().toString(), false);
        }
        @Override public ProbeResult probeRepresentative(String s) { probeCalls.incrementAndGet(); return new ProbeResult(true, "usable"); }
    }

    private static ProviderAuthorityManager degradedManager(RecoverableAdapter prod, UsableSandboxAdapter sandbox) {
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", sandbox));
        assertTrue(mgr.activateDegraded());
        return mgr;
    }

    private static ObservationRecorder observerOf(AcquisitionWorker w) {
        return w.providerManagerForTesting().observer();
    }

    // --- #1 BLOCKED still prevents ALL ordinary acquisition ----------------

    @Test
    void blockedPreventsOrdinaryAcquisitionEvenWhileRecoveryProbing() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY", "XLE"));
        var prod = new RecoverableAdapter();
        var mgr = degradedManager(prod, new UsableSandboxAdapter());
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY", "XLE"));
        String state; int cycleCount; int acquired;
        try {
            Thread.sleep(1500);
            state = worker.getStatus().state();
            cycleCount = worker.getStatus().cycleCount();
            acquired = worker.getStatus().symbolsAcquiredTotal();
        } finally {
            worker.stop();
        }
        assertEquals("session_blocked", state);
        assertEquals(0, cycleCount, "no acquisition cycle may run while BLOCKED");
        assertEquals(0, acquired, "no symbol may be acquired while BLOCKED");
        store.close();
    }

    // --- #2 recovery probes run while BLOCKED ------------------------------

    @Test
    void recoveryProbesRunWhileBlocked() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();
        var mgr = degradedManager(prod, new UsableSandboxAdapter());
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        String state; int probes;
        try {
            Thread.sleep(1500);
            state = worker.getStatus().state();
            probes = prod.probeCalls.get();
        } finally {
            worker.stop();
        }
        assertTrue(probes > 0, "degraded-mode recovery probe must reach production while BLOCKED");
        assertEquals("session_blocked", state);
        store.close();
    }

    // --- #3 probe cadence remains authoritative while BLOCKED --------------

    @Test
    void probeCadenceIsHonoredWhileBlockedNotSessionBlockedDelay() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();
        var mgr = degradedManager(prod, new UsableSandboxAdapter());
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        java.util.concurrent.atomic.AtomicLong fixedNanos = new java.util.concurrent.atomic.AtomicLong(1_000_000_000L);
        worker.setProbeClockForTesting(fixedNanos::get);
        worker.setProbeIntervalForTesting(30_000);
        worker.start(List.of("SPY"));
        int probes;
        try {
            Thread.sleep(1200);
            probes = prod.probeCalls.get();
        } finally {
            worker.stop();
        }
        assertEquals(1, probes,
            "probe cadence must be governed by recoveryProbeDue(), not the blocked wake interval");
        store.close();
    }

    // --- #5 recovery while BLOCKED auto-advances authority to production ---
    // (subsumes #4: three usable probes still satisfy the unchanged predicate)

    @Test
    void sustainedRecoveryWhileBlockedAutoActivatesProductionAuthority() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();
        var mgr = degradedManager(prod, new UsableSandboxAdapter());
        long degradedEpoch = mgr.currentEpoch();
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        String activeEnv; String lifecycle; long epoch;
        try {
            Thread.sleep(800);
            assertEquals("sandbox", worker.getActiveEnvironment(), "still degraded while production 401s");
            prod.healthy.set(true);
            // 3 probes × 2s blocked wake cadence ≈ 6s minimum. Give 8s.
            Thread.sleep(8000);
            activeEnv = worker.getActiveEnvironment();
            lifecycle = worker.getProviderLifecycle();
            epoch = mgr.currentEpoch();
        } finally {
            worker.stop();
        }
        assertEquals("production", activeEnv,
            "sustained recovery while BLOCKED must auto-activate production authority");
        assertEquals("PRODUCTION_ACTIVE", lifecycle);
        assertTrue(epoch > degradedEpoch, "failback advances the fence epoch");
        store.close();
    }

    // --- #6 + #7 authority recovery while BLOCKED != evidence restoration --

    @Test
    void authorityRecoveryWhileBlockedIsNotEvidenceRestoration() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();
        var mgr = degradedManager(prod, new UsableSandboxAdapter());
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        String activeEnv; String lifecycle; String availability; int acquired;
        try {
            Thread.sleep(600);
            prod.healthy.set(true);
            Thread.sleep(8000);
            activeEnv = worker.getActiveEnvironment();
            lifecycle = worker.getProviderLifecycle();
            availability = worker.getEvidenceAvailability();
            acquired = worker.getStatus().symbolsAcquiredTotal();
        } finally {
            worker.stop();
        }
        assertEquals("production", activeEnv);
        assertEquals("PRODUCTION_ACTIVE", lifecycle);
        assertEquals("DEGRADED", availability,
            "authority recovery without fresh production evidence must not present NORMAL");
        assertFalse(worker.providerManagerForTesting().productionEvidenceCurrent());
        assertEquals(0, acquired, "authority change while BLOCKED must not acquire/commit production evidence");
        store.close();
    }

    // --- Restoration boundary: NORMAL only after current-epoch production primary commit --

    @Test
    void restorationCompletesAtCurrentEpochProductionPrimaryChainCommit() throws Exception {
        var prod = new RecoverableAdapter();
        var sandbox = new UsableSandboxAdapter();
        var mgr = degradedManager(prod, sandbox);
        // Simulate failback (as if probes succeeded).
        assertTrue(mgr.activateProduction());
        long recoveredEpoch = mgr.currentEpoch();
        assertEquals("DEGRADED", mgr.evidenceAvailability(), "authority recovered, evidence not yet");
        assertFalse(mgr.productionEvidenceCurrent());

        // Simulate the first current-epoch production primary-chain commit.
        mgr.markProductionEvidenceRestored(recoveredEpoch);
        assertTrue(mgr.productionEvidenceCurrent());
        assertEquals("NORMAL", mgr.evidenceAvailability(),
            "restoration completes at the current-epoch production primary-chain commit");
    }

    // --- Re-degrade before restoration stays DEGRADED ----------------------

    @Test
    void reDegradeBeforeRestorationStaysDegraded() throws Exception {
        var prod = new RecoverableAdapter();
        var sandbox = new UsableSandboxAdapter();
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", sandbox));
        // Construction is UNVERIFIED (production not validated yet) — DEGRADED, never NORMAL.
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_UNVERIFIED, mgr.lifecycle());
        assertEquals("DEGRADED", mgr.evidenceAvailability(), "unverified startup is DEGRADED, not NORMAL");

        // Reach a settled restored baseline: verify production, then a fresh primary commit.
        assertTrue(mgr.establishProductionVerified());
        assertEquals("DEGRADED", mgr.evidenceAvailability(), "verified authority alone is not restoration");
        mgr.markProductionEvidenceRestored(mgr.currentEpoch());
        assertEquals("NORMAL", mgr.evidenceAvailability());

        // Degrade, then fail back: a new epoch must not inherit the prior epoch's restoration.
        assertTrue(mgr.activateDegraded());
        assertEquals("DEGRADED", mgr.evidenceAvailability());
        assertTrue(mgr.activateProduction());
        assertEquals("DEGRADED", mgr.evidenceAvailability(), "failback without fresh evidence stays DEGRADED");
        mgr.markProductionEvidenceRestored(mgr.currentEpoch());
        assertEquals("NORMAL", mgr.evidenceAvailability());
        assertTrue(mgr.activateDegraded());
        assertEquals("DEGRADED", mgr.evidenceAvailability());
        assertTrue(mgr.activateProduction());
        assertEquals("DEGRADED", mgr.evidenceAvailability(),
            "a new failback epoch must not inherit a prior epoch's restoration");
    }

    // --- #9 SETTLED PRODUCTION_ACTIVE (verified + restored) while BLOCKED does not probe --
    // Note: under the corrected model an UNVERIFIED or ACTIVE-but-not-restored production is
    // deliberately validated even while BLOCKED (startup validation / relapse watch). The
    // "quiet" state is only the SETTLED one: production verified AND fresh evidence restored.

    @Test
    void settledProductionWhileBlockedDoesNotProbe() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new HealthyProdAdapter();
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        // Bring the manager to the SETTLED state directly (as if startup validation + a fresh
        // production primary commit had already occurred during a prior session).
        assertTrue(mgr.establishProductionVerified());
        mgr.markProductionEvidenceRestored(mgr.currentEpoch());
        assertEquals("NORMAL", mgr.evidenceAvailability());
        assertTrue(mgr.productionEvidenceCurrent());

        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        String state; int probes;
        try {
            Thread.sleep(1200);
            state = worker.getStatus().state();
            probes = prod.probeCalls.get();
        } finally {
            worker.stop();
        }
        assertEquals("session_blocked", state);
        assertEquals(0, probes, "SETTLED PRODUCTION_ACTIVE (verified + restored) while BLOCKED must not probe");
        store.close();
    }

    // --- #8 observer records complete recovery sequence while BLOCKED ------

    @Test
    void observerRecordsCompleteRecoverySequenceWhileBlocked() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();
        var mgr = degradedManager(prod, new UsableSandboxAdapter());
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        try {
            // Blocked wake cadence is ~2s, so wait > one wake to guarantee at least one
            // production probe records PROBE_UNUSABLE while still 401, before recovery.
            Thread.sleep(3500);
            prod.healthy.set(true);
            Thread.sleep(8000);
        } finally {
            worker.stop();
        }

        var page = observerOf(worker).page(0, 1_000_000);
        var events = page.events();

        long probeUnusable = events.stream()
            .filter(e -> "LOGICAL_OUTCOME".equals(e.recordType()))
            .filter(e -> "PROBE_UNUSABLE".equals(e.logicalOutcome())).count();
        long probeUsable = events.stream()
            .filter(e -> "LOGICAL_OUTCOME".equals(e.recordType()))
            .filter(e -> "PROBE_USABLE".equals(e.logicalOutcome())).count();
        long fenceAdvanced = events.stream()
            .filter(e -> "FENCE_ADVANCED".equals(e.recordType())).count();

        assertTrue(probeUnusable >= 1, "expected PROBE_UNUSABLE records before recovery");
        assertTrue(probeUsable >= 1, "expected PROBE_USABLE records after recovery");
        // At least 2 FENCE_ADVANCED: one from degradedManager's activateDegraded, one from failback.
        assertTrue(fenceAdvanced >= 2, "expected FENCE_ADVANCED for degrade + failback");

        long firstUsableSeq = events.stream()
            .filter(e -> "PROBE_USABLE".equals(e.logicalOutcome()))
            .mapToLong(ObservationRecorder.Event::sequence).min().orElse(Long.MAX_VALUE);
        long failbackFenceSeq = events.stream()
            .filter(e -> "FENCE_ADVANCED".equals(e.recordType()))
            .filter(e -> e.detailOrProvenance() != null && e.detailOrProvenance().contains("failback"))
            .mapToLong(ObservationRecorder.Event::sequence).min().orElse(Long.MAX_VALUE);
        assertTrue(firstUsableSeq < failbackFenceSeq,
            "the recovery probe stream must precede the failback FENCE_ADVANCED");

        long storeFenced = events.stream()
            .filter(e -> "STORE_MUTATION_FENCED".equals(e.recordType())).count();
        assertEquals(0, storeFenced,
            "no stale-work fencing occurred (no acquisition while BLOCKED)");
        store.close();
    }

    // --- End-to-end: restoration completes when acquisition is permitted ---

    @Test
    void restorationCompletesEndToEndWhenAcquisitionPermitted() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY", "XLE"));
        var prod = new RecoverableAdapter();
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        // Chain stale / expirations fresh so production re-acquires the primary CHAIN promptly.
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), chainStaleExpirationsFreshConfig(), Collections.emptySet());
        worker.setProbeIntervalForTesting(200);
        worker.start(List.of("SPY", "XLE"));
        try {
            Thread.sleep(5000); // degrade under 401s
            assertEquals("DEGRADED", worker.getEvidenceAvailability());
            prod.healthy.set(true);
            Thread.sleep(10000); // failback + re-acquisition of production chains → NORMAL
        } finally {
            worker.stop();
        }
        assertEquals("production", worker.getActiveEnvironment());
        assertEquals("NORMAL", worker.getEvidenceAvailability(),
            "restoration completes at the first current-epoch production primary commit");
        assertTrue(worker.providerManagerForTesting().productionEvidenceCurrent());
        store.close();
    }

    // =====================================================================
    // Codex release-blocking tests (1–6), stated explicitly.
    // =====================================================================

    /** Production that recovers, but whose PRIMARY chain always reports a CACHE HIT. */
    private static final class CacheHitPrimaryProdAdapter extends TradierAdapter {
        final AtomicBoolean healthy = new AtomicBoolean(false);
        CacheHitPrimaryProdAdapter() { super("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            return new ExpirationResult(List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)), Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            // cacheHit=true → this is NOT a fresh provider response; must never restore.
            return new ChainResult(usableChain(s), Instant.now().toString(), true);
        }
        @Override public ProbeResult probeRepresentative(String s) {
            return healthy.get() ? new ProbeResult(true, "usable") : new ProbeResult(false, "401");
        }
    }

    // #1 — restart BLOCKED + production 401 + sandbox usable → degraded automatically.
    @Test
    void codex1_restartBlockedProduction401SandboxUsable_degradesAutomatically() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter(); // stays 401
        // Fresh manager (UNVERIFIED) — simulates a restart onto the new code.
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_UNVERIFIED, mgr.lifecycle());
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        String env; String avail; String state;
        try {
            Thread.sleep(4000); // several blocked wakes → validate production (401) → degrade to sandbox
            env = worker.getActiveEnvironment();
            avail = worker.getEvidenceAvailability();
            state = worker.getStatus().state();
        } finally {
            worker.stop();
        }
        assertEquals("session_blocked", state, "ordinary acquisition stays blocked");
        assertEquals("sandbox", env, "unverified production that is 401 must auto-degrade to verified sandbox while BLOCKED");
        assertEquals("DEGRADED", avail);
        store.close();
    }

    // #2 — restart BLOCKED + production usable → production established, evidence still DEGRADED.
    @Test
    void codex2_restartBlockedProductionUsable_establishedButEvidenceDegraded() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();
        prod.healthy.set(true); // production usable from the start
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        String env; String lifecycle; String avail; int acquired;
        try {
            Thread.sleep(8000); // 3 sustained usable probes at ~2s cadence → establishProductionVerified
            env = worker.getActiveEnvironment();
            lifecycle = worker.getProviderLifecycle();
            avail = worker.getEvidenceAvailability();
            acquired = worker.getStatus().symbolsAcquiredTotal();
        } finally {
            worker.stop();
        }
        assertEquals("production", env);
        assertEquals("PRODUCTION_ACTIVE", lifecycle, "usable production must be established (verified) while BLOCKED");
        assertEquals("DEGRADED", avail,
            "authority established, but no fresh production evidence has committed while BLOCKED → DEGRADED, not NORMAL");
        assertFalse(worker.providerManagerForTesting().productionEvidenceCurrent());
        assertEquals(0, acquired, "no ordinary acquisition may occur while BLOCKED");
        store.close();
    }

    // #3 — blocked failback + production relapse → degraded automatically.
    @Test
    void codex3_blockedFailbackThenRelapse_degradesAutomatically() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();
        prod.healthy.set(true); // usable → will be established as PRODUCTION_ACTIVE (unrestored)
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        String env;
        try {
            Thread.sleep(8000);
            assertEquals("PRODUCTION_ACTIVE", worker.getProviderLifecycle(), "established while BLOCKED");
            assertFalse(worker.providerManagerForTesting().productionEvidenceCurrent(), "not yet restored (blocked)");
            // Relapse: production becomes unusable again BEFORE any fresh production commit.
            prod.healthy.set(false);
            Thread.sleep(6000); // control-plane validation must catch the relapse and re-degrade
            env = worker.getActiveEnvironment();
        } finally {
            worker.stop();
        }
        assertEquals("sandbox", env,
            "a PRODUCTION_ACTIVE-but-unrestored relapse must auto-return to verified sandbox while BLOCKED");
        store.close();
    }

    // #4 — a pre-outage production CACHE HIT primary cannot restore.
    @Test
    void codex4_cacheHitPrimaryCannotRestore() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new CacheHitPrimaryProdAdapter();
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        // Chain stale / expirations fresh so a ready symbol re-acquires the primary chain,
        // but that primary chain reports cacheHit=true → must NOT establish restoration.
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), chainStaleExpirationsFreshConfig(), Collections.emptySet());
        worker.setProbeIntervalForTesting(200);
        worker.start(List.of("SPY"));
        String env; String avail;
        try {
            Thread.sleep(5000);
            prod.healthy.set(true);
            Thread.sleep(10000); // failback + repeated cache-hit primary commits
            env = worker.getActiveEnvironment();
            avail = worker.getEvidenceAvailability();
        } finally {
            worker.stop();
        }
        assertEquals("production", env, "authority still fails back on usable probes");
        assertEquals("DEGRADED", avail,
            "a cache-hit primary is not a fresh provider response and must never restore production evidence");
        assertFalse(worker.providerManagerForTesting().productionEvidenceCurrent());
        store.close();
    }

    // Two eligible expirations so acquireAllEligibleChains runs a PRIMARY + one SECONDARY.
    private static final String SECOND_EXPIRATION =
        java.time.LocalDate.now(ZoneOffset.UTC).plusDays(28).toString();
    private static final String TWO_EXPIRATIONS_JSON =
        "[{\"date\":\"" + FUTURE_EXPIRATION + "\",\"dte\":21},"
      + "{\"date\":\"" + SECOND_EXPIRATION + "\",\"dte\":28}]";

    /**
     * Production that recovers, whose PRIMARY chain is a CACHE HIT but whose SECONDARY chain is
     * a FRESH provider response. Proves a real fresh secondary commit still cannot restore —
     * only a fresh PRIMARY qualifies.
     */
    private static final class CacheHitPrimaryFreshSecondaryAdapter extends TradierAdapter {
        final AtomicBoolean healthy = new AtomicBoolean(false);
        CacheHitPrimaryFreshSecondaryAdapter() { super("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            return new ExpirationResult(List.of(
                new MarketExpiration(FUTURE_EXPIRATION, 21), new MarketExpiration(SECOND_EXPIRATION, 28)),
                Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            // PRIMARY (nearest) = cache hit (non-qualifying); SECONDARY = fresh (still must not restore).
            boolean primary = e.equals(FUTURE_EXPIRATION);
            return new ChainResult(usableChain(s), Instant.now().toString(), /*cacheHit*/ primary);
        }
        @Override public ProbeResult probeRepresentative(String s) {
            return healthy.get() ? new ProbeResult(true, "usable") : new ProbeResult(false, "401");
        }
    }

    // #5 — a REAL secondary-chain commit cannot restore.
    @Test
    void codex5_realSecondaryChainCommitCannotRestore() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        // Pre-seed SPY as ready with TWO eligible expirations so the worker acquires a primary
        // AND a secondary chain each refresh. Primary is a cache hit (cannot restore); secondary
        // is a fresh provider response — but secondaries use the NON-qualifying commit path, so
        // even a fresh secondary must not establish restoration.
        store.setExpirations("SPY", TWO_EXPIRATIONS_JSON, Instant.now().toString());
        var prod = new CacheHitPrimaryFreshSecondaryAdapter();
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), chainStaleExpirationsFreshConfig(), Collections.emptySet());
        worker.setProbeIntervalForTesting(200);
        worker.start(List.of("SPY"));
        String env; String avail;
        try {
            Thread.sleep(5000);
            prod.healthy.set(true);
            Thread.sleep(10000); // failback + repeated (cache-hit primary + fresh secondary) commits
            env = worker.getActiveEnvironment();
            avail = worker.getEvidenceAvailability();
        } finally {
            worker.stop();
        }
        // Prove the secondary really committed (fresh secondary chain persisted for SPY),
        // yet restoration did NOT occur.
        var ev = store.getEvidence("SPY");
        assertNotNull(ev);
        assertEquals("ready", ev.get("status"), "symbol acquired chains (primary + secondary committed)");
        assertEquals("production", env, "authority failed back on usable probes");
        assertEquals("DEGRADED", avail,
            "a fresh SECONDARY chain commit uses the non-qualifying path and must never restore");
        assertFalse(worker.providerManagerForTesting().productionEvidenceCurrent());
        assertEquals(0L, worker.providerManagerForTesting().restoredProductionEpoch(),
            "no qualifying primary commit occurred → restoration epoch never set");
        store.close();
    }

    // #6 — a REAL current-epoch, non-cache PRIMARY production commit establishes NORMAL, and a
    // subsequent qualifying commit does not create a second restoration transition.
    @Test
    void codex6_realPrimaryCommitEstablishesNormalAndDoesNotReTransition() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY", "XLE"));
        var prod = new RecoverableAdapter(); // fresh (cacheHit=false) primary chains
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), chainStaleExpirationsFreshConfig(), Collections.emptySet());
        worker.setProbeIntervalForTesting(200);
        worker.start(List.of("SPY", "XLE"));
        long restoredEpoch; long currentEpochAtRestore; long normalTransitionsObserved;
        try {
            Thread.sleep(5000);
            assertEquals("DEGRADED", worker.getEvidenceAvailability());
            prod.healthy.set(true);
            Thread.sleep(8000); // failback + fresh non-cache primary commit → restoration/NORMAL
            assertEquals("NORMAL", worker.getEvidenceAvailability(),
                "a real fresh non-cache primary production commit establishes NORMAL");
            assertTrue(worker.providerManagerForTesting().productionEvidenceCurrent());
            restoredEpoch = worker.providerManagerForTesting().restoredProductionEpoch();
            currentEpochAtRestore = worker.providerManagerForTesting().currentEpoch();
            // Let ordinary acquisition keep committing MORE fresh primary production chains at
            // the same epoch. Restoration must NOT re-transition: the restored epoch is a latch.
            Thread.sleep(4000);
            // "No second restoration transition" is observed via the fence/authority stream: the
            // restoration commit is NOT an authority transition, and no NEW FENCE_ADVANCED /
            // AUTHORITY_TRANSITION to production occurs merely because more primaries commit.
            var events = observerOf(worker).page(0, 1_000_000).events();
            normalTransitionsObserved = events.stream()
                .filter(e -> "FENCE_ADVANCED".equals(e.recordType()))
                .filter(e -> e.detailOrProvenance() != null && e.detailOrProvenance().contains("failback"))
                .count();
        } finally {
            worker.stop();
        }
        assertEquals(currentEpochAtRestore, restoredEpoch, "restoration recorded at the current production epoch");
        // Exactly one failback authority transition established production this run; the many
        // subsequent qualifying primary commits did NOT create additional failback transitions.
        assertEquals(1L, normalTransitionsObserved,
            "restoration/continued acquisition must not create a second failback authority transition");
        assertEquals("NORMAL", worker.getEvidenceAvailability());
        assertEquals(restoredEpoch, worker.providerManagerForTesting().restoredProductionEpoch(),
            "restoration epoch is a stable latch across further same-epoch commits");
        store.close();
    }

    // =====================================================================
    // Suspended-production recovery (blocker #1) + acquisition gating (blocker #2).
    // =====================================================================

    /** Sandbox whose usability can be toggled (starts unusable). */
    private static final class SwitchableSandboxAdapter extends TradierAdapter {
        final AtomicBoolean usable = new AtomicBoolean(false);
        SwitchableSandboxAdapter() { super("k", "https://sandbox.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            if (!usable.get()) throw new ProviderError("sandbox down", 500);
            return new ExpirationResult(List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)), Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            if (!usable.get()) throw new ProviderError("sandbox down", 500);
            return new ChainResult(usableChain(s), Instant.now().toString(), false);
        }
        @Override public ProbeResult probeRepresentative(String s) {
            return usable.get() ? new ProbeResult(true, "usable") : new ProbeResult(false, "sandbox down");
        }
    }

    // No sandbox configured → production unusable → SUSPENDED → production recovers → ACTIVE.
    @Test
    void noSandboxProductionUnusableSuspendedThenRecovers() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter(); // 401 initially
        // No sandbox authority.
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), null);
        assertFalse(mgr.hasSandbox());
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        try {
            Thread.sleep(4000);
            assertEquals(ProviderAuthorityManager.Lifecycle.ACQUISITION_SUSPENDED,
                mgr.lifecycle(), "no sandbox + production unusable → suspended");
            assertEquals("UNAVAILABLE", worker.getEvidenceAvailability());
            // Production recovers; sustained probes must recover the suspended authority.
            prod.healthy.set(true);
            Thread.sleep(8000);
        } finally {
            worker.stop();
        }
        assertEquals("PRODUCTION_ACTIVE", worker.getProviderLifecycle(),
            "suspended (no sandbox) production must recover to ACTIVE on sustained probes — not dead-end");
        assertEquals("production", worker.getActiveEnvironment());
        // Evidence still DEGRADED (blocked, no fresh commit yet), but authority is no longer suspended.
        assertEquals("DEGRADED", worker.getEvidenceAvailability());
        store.close();
    }

    // Both production AND sandbox unusable → SUSPENDED → production later recovers → ACTIVE.
    @Test
    void bothUnusableSuspendedThenProductionRecovers() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY"));
        var prod = new RecoverableAdapter();          // 401 initially
        var sandbox = new SwitchableSandboxAdapter(); // unusable initially
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", sandbox));
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(weekendBlockedClock()), config(), Collections.emptySet());
        worker.setProbeIntervalForTesting(50);
        worker.start(List.of("SPY"));
        try {
            Thread.sleep(4000);
            assertEquals(ProviderAuthorityManager.Lifecycle.ACQUISITION_SUSPENDED,
                mgr.lifecycle(), "production unusable + sandbox unusable → suspended");
            assertEquals("UNAVAILABLE", worker.getEvidenceAvailability());
            // Production recovers (sandbox stays down): must recover directly to production ACTIVE.
            prod.healthy.set(true);
            Thread.sleep(8000);
        } finally {
            worker.stop();
        }
        assertEquals("PRODUCTION_ACTIVE", worker.getProviderLifecycle(),
            "suspended (both down) must recover to production ACTIVE when production returns");
        assertEquals("production", worker.getActiveEnvironment());
        store.close();
    }

    // Non-BLOCKED startup cannot perform ordinary acquisition before production verification.
    @Test
    void nonBlockedStartupCannotAcquireBeforeVerification() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY", "XLE"));
        // Production is usable, but must be VERIFIED by the control plane (3 probes) before any
        // ordinary acquisition. Use a slow probe cadence so verification does NOT complete during
        // the observation window; assert zero acquisition in the meantime.
        var prod = new RecoverableAdapter();
        prod.healthy.set(true);
        var mgr = new ProviderAuthorityManager(auth("prod", "production", prod), auth("sandbox", "sandbox", new UsableSandboxAdapter()));
        // FULL session (acquisition would run if not gated); large probe interval so the 3-probe
        // streak cannot complete within the window (first probe is always-due, then gated 60s).
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), chainStaleExpirationsFreshConfig(), Collections.emptySet());
        worker.setProbeIntervalForTesting(60_000);
        worker.start(List.of("SPY", "XLE"));
        String lifecycle; String state; int acquired; long restoredEpoch;
        try {
            Thread.sleep(3000);
            lifecycle = worker.getProviderLifecycle();
            state = worker.getStatus().state();
            acquired = worker.getStatus().symbolsAcquiredTotal();
            restoredEpoch = mgr.restoredProductionEpoch();
        } finally {
            worker.stop();
        }
        // Verification has NOT completed (only 1 probe issued; streak < 3), so:
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_UNVERIFIED.name(), lifecycle,
            "production not yet verified within the window");
        assertEquals("provider_unverified", state, "worker reports the pre-verification gate state");
        assertEquals(0, acquired, "NO ordinary acquisition may run before production verification");
        assertEquals(0L, restoredEpoch,
            "no pre-verification primary commit may set restoration state");
        assertNotEquals("ready", store.getEvidence("SPY").get("status"));
        store.close();
    }
}
