package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER step 2/3: isolated provider authorities + fence-epoch mechanics.
 *
 * Proves structural isolation (distinct cache/pacer per authority), single active
 * authority (I4), atomic transitions that bump the fence epoch (so in-flight
 * results of the prior authority are fenced — I9/I10), no-op safety, suspend, and
 * the operator-facing availability projection.
 */
class ProviderAuthorityManagerTest {

    private static ProviderAuthority authority(String id, String env, String baseUrl) {
        ResponseCache cache = new ResponseCache();
        RequestPacer pacer = new RequestPacer(100, 10);
        TradierAdapter adapter = new TradierAdapter("stub-key", baseUrl, cache, pacer);
        return new ProviderAuthority(id, env, adapter, cache, pacer);
    }

    private static ProviderAuthority prod() {
        return authority("prod", "production", "https://api.tradier.com/v1");
    }

    private static ProviderAuthority sandbox() {
        return authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1");
    }

    @Test
    void authoritiesHaveStructurallyIsolatedCacheAndPacer() {
        ProviderAuthority p = prod();
        ProviderAuthority s = sandbox();
        assertNotSame(p.cache(), s.cache(), "each authority must own a distinct cache");
        assertNotSame(p.pacer(), s.pacer(), "each authority must own a distinct pacer");
        assertNotSame(p.adapter(), s.adapter());
        // Adapter's own isolated instances are exposed and match the authority's.
        assertSame(p.cache(), p.adapter().cache());
        assertSame(p.pacer(), p.adapter().pacer());
    }

    @Test
    void startsProductionUnverifiedAtEpochOne() {
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        // PL-PROV-FAILOVER correction: production is the preferred authority (bound at epoch 1)
        // but its health is NOT established by construction — it starts UNVERIFIED and must be
        // validated before being treated as active. It is never NORMAL at construction.
        assertEquals("prod", mgr.active().id());
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_UNVERIFIED, mgr.lifecycle());
        assertEquals("DEGRADED", mgr.evidenceAvailability(),
            "unverified startup with a sandbox is DEGRADED, never NORMAL");
        assertFalse(mgr.productionEvidenceCurrent());
        assertTrue(mgr.hasSandbox());
        assertEquals(1L, mgr.currentEpoch());

        // Validation establishes production active at the SAME epoch (initial authority, not a
        // failback); evidence still DEGRADED until a fresh production commit.
        assertTrue(mgr.establishProductionVerified());
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_ACTIVE, mgr.lifecycle());
        assertEquals(1L, mgr.currentEpoch(), "startup validation does not bump the epoch");
        assertEquals("DEGRADED", mgr.evidenceAvailability());
    }

    @Test
    void unverifiedWithoutSandboxIsUnavailable() {
        var mgr = new ProviderAuthorityManager(prod(), null);
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_UNVERIFIED, mgr.lifecycle());
        assertFalse(mgr.hasSandbox());
        assertEquals("UNAVAILABLE", mgr.evidenceAvailability(),
            "unverified startup with no sandbox is UNAVAILABLE, never NORMAL");
    }

    @Test
    void activateDegradedSwitchesAuthorityAndBumpsEpoch() {
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        long before = mgr.currentEpoch();

        assertTrue(mgr.activateDegraded());
        assertEquals("sandbox", mgr.active().id());
        assertEquals(ProviderAuthorityManager.Lifecycle.DEGRADED_SANDBOX, mgr.lifecycle());
        assertEquals("DEGRADED", mgr.evidenceAvailability());
        assertEquals(before + 1, mgr.currentEpoch(), "transition must bump the fence epoch");

        // A lease bound to the pre-transition epoch is now stale (fenced).
        assertFalse(mgr.isCurrentEpoch(before));
        assertTrue(mgr.isCurrentEpoch(mgr.currentEpoch()));

        // No-op safe: activating degraded again does not bump the epoch.
        long afterFirst = mgr.currentEpoch();
        assertFalse(mgr.activateDegraded());
        assertEquals(afterFirst, mgr.currentEpoch());
    }

    @Test
    void probingIsDegradedFacingButStillServesSandbox() {
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        mgr.activateDegraded();
        mgr.enterProbing();
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_PROBING, mgr.lifecycle());
        assertEquals("sandbox", mgr.active().id(), "probing still serves from sandbox");
        assertEquals("DEGRADED", mgr.evidenceAvailability());
        mgr.abandonProbing();
        assertEquals(ProviderAuthorityManager.Lifecycle.DEGRADED_SANDBOX, mgr.lifecycle());
    }

    @Test
    void failbackSwitchesToProductionAndBumpsEpoch() {
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        mgr.activateDegraded();
        long degradedEpoch = mgr.currentEpoch();

        assertTrue(mgr.activateProduction());
        assertEquals("prod", mgr.active().id());
        assertEquals(ProviderAuthorityManager.Lifecycle.PRODUCTION_ACTIVE, mgr.lifecycle());
        assertEquals(degradedEpoch + 1, mgr.currentEpoch(), "failback must bump the fence epoch");
        assertFalse(mgr.isCurrentEpoch(degradedEpoch), "in-flight sandbox result is fenced after failback");

        // PL-PROV-FAILOVER: authority recovery is NOT evidence restoration. Immediately after
        // failback, no fresh production evidence has committed under the new epoch, so the
        // operator-facing projection is DEGRADED — not NORMAL.
        assertEquals("DEGRADED", mgr.evidenceAvailability(),
            "failback restores authority, not evidence: NORMAL requires a current-epoch production commit");
        assertFalse(mgr.productionEvidenceCurrent());

        // A normalized production PRIMARY chain committing under the current epoch completes
        // restoration → NORMAL.
        mgr.markProductionEvidenceRestored(mgr.currentEpoch());
        assertTrue(mgr.productionEvidenceCurrent());
        assertEquals("NORMAL", mgr.evidenceAvailability());
    }

    @Test
    void suspendReportsUnavailableWithoutBindingChange() {
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        mgr.suspend();
        assertEquals(ProviderAuthorityManager.Lifecycle.ACQUISITION_SUSPENDED, mgr.lifecycle());
        assertEquals("UNAVAILABLE", mgr.evidenceAvailability());
    }

    @Test
    void noSandboxMeansDegradedCannotActivate() {
        var mgr = new ProviderAuthorityManager(prod(), null);
        assertFalse(mgr.hasSandbox());
        assertThrows(IllegalStateException.class, mgr::activateDegraded);
        assertEquals("prod", mgr.active().id(), "without sandbox, production remains the only authority");
    }

    @Test
    void productionRequiredAtConstruction() {
        assertThrows(IllegalArgumentException.class,
            () -> new ProviderAuthorityManager(null, sandbox()));
    }

    // --- Atomicity: lease captures a CONSISTENT (authority, epoch) snapshot ---

    @Test
    void leaseAuthorityAndEpochAreAlwaysConsistent() {
        // Invariant under test: a lease never observes a torn pair — e.g. the NEW
        // authority with the OLD epoch or vice versa. Because the binding is a single
        // atomic value, every lease's environment must agree with the authority it names,
        // regardless of interleaving with transitions.
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        for (int i = 0; i < 200; i++) {
            AcquisitionLease lease = mgr.acquireLease();
            if ("prod".equals(lease.authorityId())) {
                assertEquals("production", lease.environment());
            } else if ("sandbox".equals(lease.authorityId())) {
                assertEquals("sandbox", lease.environment());
            } else {
                fail("unexpected authority id " + lease.authorityId());
            }
            // The provenance id encodes the SAME epoch the lease carries.
            assertTrue(lease.provenanceId().contains(":" + lease.fenceEpoch() + ":"),
                "provenance must encode the lease's own epoch");
            if (i % 2 == 0) mgr.activateDegraded(); else mgr.activateProduction();
        }
    }

    @Test
    void concurrentLeasesNeverObserveTornBinding() throws InterruptedException {
        // Deterministic-invariant race test: hammer acquireLease() from many threads while
        // another thread flips the authority repeatedly. Every observed lease must be
        // internally consistent (authority id <-> environment), and validate() must be
        // monotonic w.r.t. the epoch it captured. A torn read would surface as a mismatch.
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        int readers = 8;
        int iterations = 5_000;
        var pool = java.util.concurrent.Executors.newFixedThreadPool(readers + 1);
        var start = new java.util.concurrent.CountDownLatch(1);
        var errors = new java.util.concurrent.ConcurrentLinkedQueue<String>();
        var done = new java.util.concurrent.CountDownLatch(readers);

        for (int r = 0; r < readers; r++) {
            pool.submit(() -> {
                try {
                    start.await();
                    for (int i = 0; i < iterations; i++) {
                        AcquisitionLease lease = mgr.acquireLease();
                        String env = lease.environment();
                        String id = lease.authorityId();
                        boolean consistent =
                            ("prod".equals(id) && "production".equals(env))
                            || ("sandbox".equals(id) && "sandbox".equals(env));
                        if (!consistent) {
                            errors.add("torn lease: id=" + id + " env=" + env);
                        }
                        if (!lease.provenanceId().startsWith(env + ":" + lease.fenceEpoch() + ":")) {
                            errors.add("provenance/epoch mismatch: " + lease.provenanceId()
                                + " epoch=" + lease.fenceEpoch());
                        }
                    }
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        // Transition flipper.
        pool.submit(() -> {
            try {
                start.await();
                for (int i = 0; i < iterations; i++) {
                    if (i % 2 == 0) mgr.activateDegraded(); else mgr.activateProduction();
                }
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        });

        start.countDown();
        assertTrue(done.await(30, java.util.concurrent.TimeUnit.SECONDS), "readers must finish");
        pool.shutdownNow();
        assertTrue(errors.isEmpty(), "no torn/inconsistent lease permitted; saw: " + errors);
    }

    @Test
    void staleLeaseNeverValidatesAfterAnyTransition() {
        // A lease captured at epoch N must be invalid after ANY subsequent transition,
        // and a fresh lease after the transition must be valid.
        var mgr = new ProviderAuthorityManager(prod(), sandbox());
        AcquisitionLease e1 = mgr.acquireLease();
        assertTrue(mgr.validate(e1));

        mgr.activateDegraded();
        assertFalse(mgr.validate(e1), "lease from epoch 1 must be stale after degrade");
        AcquisitionLease e2 = mgr.acquireLease();
        assertTrue(mgr.validate(e2));

        mgr.activateProduction();
        assertFalse(mgr.validate(e2), "lease from the degraded epoch must be stale after failback");
        assertFalse(mgr.validate(e1), "the original lease remains stale");
        assertTrue(mgr.validate(mgr.acquireLease()));
    }
}
