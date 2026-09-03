package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.AcquisitionLease;
import com.wheelwright.evidence.provider.MarketExpiration;
import com.wheelwright.evidence.provider.ProviderAuthority;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER constraint 2 / invariants I9-I10: an atomic acquisition lease,
 * once superseded by an authority transition mid-operation, must not commit its
 * result — no durable write, no symbol-lifecycle change, no generation/publish.
 *
 * Also proves the manager's lease/validate contract directly.
 */
class AcquisitionFencingTest {

    private static final String FUTURE_EXPIRATION =
        java.time.LocalDate.now(java.time.ZoneOffset.UTC).plusDays(21).toString();

    private static ProviderAuthority authority(String id, String env, String baseUrl, TradierAdapter adapter) {
        return new ProviderAuthority(id, env, adapter, adapter.cache(), adapter.pacer());
    }

    private static TradierAdapter plainAdapter(String baseUrl) {
        return new TradierAdapter("stub", baseUrl, new ResponseCache(), new RequestPacer(100, 10));
    }

    @Test
    void validateFailsAfterTransition() {
        var prod = authority("prod", "production", "https://api.tradier.com/v1", plainAdapter("https://api.tradier.com/v1"));
        var sbx = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", plainAdapter("https://sandbox.tradier.com/v1"));
        var mgr = new ProviderAuthorityManager(prod, sbx);

        AcquisitionLease lease = mgr.acquireLease();
        assertEquals("prod", lease.authorityId());
        assertTrue(mgr.validate(lease));

        mgr.activateDegraded(); // bumps fence epoch
        assertFalse(mgr.validate(lease), "lease from before the transition must be stale/fenced");

        // A fresh lease reflects the new authority and is valid again.
        AcquisitionLease fresh = mgr.acquireLease();
        assertEquals("sandbox", fresh.authorityId());
        assertTrue(mgr.validate(fresh));
        assertNotEquals(lease.provenanceId(), fresh.provenanceId());
    }

    @Test
    void staleLeaseResultIsNotWrittenToDurableStore() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("XLE")); // pending → expirations path

        // Adapter↔manager are mutually referential: the adapter must transition the
        // manager it belongs to. Resolve with a holder set after construction.
        final ProviderAuthorityManager[] ref = new ProviderAuthorityManager[1];
        var mutatingAdapter = new TradierAdapter(
                "stub", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)) {
            @Override public ExpirationResult getExpirations(String symbol) {
                // Fence the in-flight production lease mid-operation, then return a
                // "successful" result. commitGuarded must discard it.
                ref[0].activateDegraded();
                return new ExpirationResult(
                    List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)),
                    java.time.Instant.now().toString(), false);
            }
        };
        var prod = authority("prod", "production", "https://api.tradier.com/v1", mutatingAdapter);
        var sbx = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1",
                            plainAdapter("https://sandbox.tradier.com/v1"));
        var mgr = new ProviderAuthorityManager(prod, sbx);
        ref[0] = mgr;

        var worker = new AcquisitionWorker(mgr, store,
            new SessionGate(java.time.Clock.fixed(
                java.time.ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, java.time.ZoneOffset.UTC).toInstant(),
                java.time.ZoneOffset.UTC)),
            workerConfig(), java.util.Collections.emptySet());
        worker.start(List.of("XLE"));
        try {
            Thread.sleep(2000);
        } finally {
            worker.stop();
        }

        // The production lease was fenced mid-operation → expirations must NOT be written.
        var ev = store.getEvidence("XLE");
        assertNotNull(ev);
        assertEquals("pending", ev.get("status"),
            "fenced (stale-lease) result must not advance the symbol beyond pending");
        assertNull(ev.get("expirations"),
            "fenced (stale-lease) result must not write durable expirations evidence");
        store.close();
    }

    @Test
    void commitIfCurrentIsAtomicWithTransition_deterministicInterleaving() {
        // Deterministic (explicitly interleaved) proof that once a transition becomes
        // effective, an obsolete operation cannot modify durable/current state. We force
        // the exact interleaving from INSIDE the guarded mutation: the mutation, if it were
        // allowed to run, would attempt a transition-then-write. Because commitIfCurrent
        // holds the transition lock across validate+apply, and the lease was captured at the
        // pre-transition epoch, the only way to observe safety is: a lease from epoch N, after
        // a transition to N+1, must NOT apply its mutation.
        var prod = authority("prod", "production", "https://api.tradier.com/v1", plainAdapter("https://api.tradier.com/v1"));
        var sbx = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", plainAdapter("https://sandbox.tradier.com/v1"));
        var mgr = new ProviderAuthorityManager(prod, sbx);

        AcquisitionLease stale = mgr.acquireLease();          // captured at epoch N
        assertTrue(mgr.activateDegraded());                    // transition to N+1 becomes effective

        boolean[] applied = {false};
        boolean[] effect = {false};
        boolean committed;
        try {
            committed = mgr.commitIfCurrent(stale, "XLE", "chain",
                () -> applied[0] = true, () -> effect[0] = true);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        assertFalse(committed, "stale lease must not commit after the transition is effective");
        assertFalse(applied[0], "the obsolete mutation must NOT run once the transition is effective");
        assertFalse(effect[0], "the authority-sensitive side effect must NOT run for a stale lease");

        // A fresh lease at the new epoch commits, runs its mutation AND its authority effect.
        AcquisitionLease fresh = mgr.acquireLease();
        boolean[] applied2 = {false};
        boolean[] effect2 = {false};
        boolean committed2;
        try {
            committed2 = mgr.commitIfCurrent(fresh, "XLE", "chain",
                () -> applied2[0] = true, () -> effect2[0] = true);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        assertTrue(committed2);
        assertTrue(applied2[0]);
        assertTrue(effect2[0], "authority-sensitive effect runs inside the boundary when current");
    }

    @Test
    void concurrentTransitionDuringCommitCannotApplyStaleMutation() throws Exception {
        // A controlled race: a committer thread parks INSIDE the guarded mutation region
        // only if it was allowed to enter (i.e. lease still current). We force a transition
        // to land first, then release the committer, and prove it did not apply. Because
        // commitIfCurrent is synchronized with transitions, the committer either (a) sees the
        // transition already effective and refuses, or (b) holds the lock so the transition
        // waits — but the lease it holds is from the pre-transition epoch, so on (b) the
        // validate inside the SAME lock still sees the pre-transition epoch and commits, then
        // the transition runs after. The safety invariant is: no mutation under a lease whose
        // epoch != the epoch effective at apply time. We assert that outcome directly.
        var prod = authority("prod", "production", "https://api.tradier.com/v1", plainAdapter("https://api.tradier.com/v1"));
        var sbx = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", plainAdapter("https://sandbox.tradier.com/v1"));
        var mgr = new ProviderAuthorityManager(prod, sbx);

        AcquisitionLease lease = mgr.acquireLease();
        var transitionLanded = new java.util.concurrent.CountDownLatch(1);

        Thread transitioner = new Thread(() -> {
            mgr.activateDegraded();
            transitionLanded.countDown();
        });
        transitioner.start();
        transitionLanded.await();

        boolean[] applied = {false};
        boolean[] effect = {false};
        boolean committed = mgr.commitIfCurrent(lease, "XLE", "chain",
            () -> applied[0] = true, () -> effect[0] = true);
        transitioner.join();

        // Transition landed before commit → lease is stale → no mutation, no accounting.
        assertFalse(committed);
        assertFalse(applied[0]);
        assertFalse(effect[0], "authority-sensitive accounting must not run for a stale lease");
    }

    @Test
    void staleAuthority401DoesNotAffectNewAuthorityFailureStreak() {
        // Review-5 #1 deterministic interleaving: a provider-unusable (401) completion under a
        // lease captured at epoch N, arriving AFTER a transition to N+1, must not run the
        // current authority's failure-streak control mutation.
        var prod = authority("prod", "production", "https://api.tradier.com/v1", plainAdapter("https://api.tradier.com/v1"));
        var sbx = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", plainAdapter("https://sandbox.tradier.com/v1"));
        var mgr = new ProviderAuthorityManager(prod, sbx);

        AcquisitionLease stale = mgr.acquireLease();   // epoch N
        assertTrue(mgr.activateDegraded());             // transition to N+1 becomes effective

        int[] streak = { 0 };
        boolean ran = mgr.signalProviderUnusableIfCurrent(stale, () -> streak[0]++);
        assertFalse(ran, "stale-lease provider-unusable control mutation must NOT run");
        assertEquals(0, streak[0], "the new authority's failure streak must be untouched by an old-authority 401");

        // A fresh lease under the current authority DOES run the control mutation.
        AcquisitionLease fresh = mgr.acquireLease();
        boolean ranFresh = mgr.signalProviderUnusableIfCurrent(fresh, () -> streak[0]++);
        assertTrue(ranFresh);
        assertEquals(1, streak[0]);
    }

    @Test
    void concurrentTransitionFencesProviderUnusableControlSignal() throws Exception {
        // Latch-forced: transition lands before the stale lease's 401 control signal is applied.
        var prod = authority("prod", "production", "https://api.tradier.com/v1", plainAdapter("https://api.tradier.com/v1"));
        var sbx = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", plainAdapter("https://sandbox.tradier.com/v1"));
        var mgr = new ProviderAuthorityManager(prod, sbx);

        AcquisitionLease lease = mgr.acquireLease();
        var transitioned = new java.util.concurrent.CountDownLatch(1);
        Thread t = new Thread(() -> { mgr.activateDegraded(); transitioned.countDown(); });
        t.start();
        transitioned.await();

        int[] streak = { 0 };
        boolean ran = mgr.signalProviderUnusableIfCurrent(lease, () -> streak[0]++);
        t.join();
        assertFalse(ran);
        assertEquals(0, streak[0], "transition-before-signal must fence the stale 401's streak bump");
    }

    private static SchedulerConfig workerConfig() {
        return new SchedulerConfig(
            25 * 60 * 1000L, 120 * 60 * 1000L, 6 * 60 * 60 * 1000L,
            10, 20, 5000L, 15 * 60 * 1000L, 5, 25 * 60 * 1000L);
    }
}
