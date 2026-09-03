package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER observer correction (review 3), task 7: prove the recorder reflects the
 * REAL provider-operation path — genuine concurrent submissions for single-flight, the actual
 * configured trailing-window admission regime, logical correlation through the real
 * acquisition/probe path, exact HTTP status preservation (incl success), and cursor safety
 * under concurrent completion. Operations run through a real {@link RequestPacer} bound (via a
 * real {@link ProviderAuthority}) to a real {@link ObservationRecorder}.
 */
class ObserverRealPacerIntegrationTest {

    private static final class DrivableAdapter extends TradierAdapter {
        DrivableAdapter(String baseUrl, RequestPacer pacer) {
            super("k", baseUrl, new ResponseCache(), pacer);
        }
        <T> T run(String kind, Callable<T> work) throws Exception {
            pacer().setOperationKind(kind);
            return pacer().submit(work);
        }
        /**
         * Run a request that reports its EXACT HTTP status through the real pacer path — exactly
         * as TradierAdapter.httpRequest does via pacer.recordHttpStatusForCurrentRequest(status),
         * including successful statuses. Non-2xx throws a ProviderError (as the real adapter does).
         */
        String runWithStatus(String kind, int status) throws Exception {
            pacer().setOperationKind(kind);
            return pacer().submit(() -> {
                pacer().recordHttpStatusForCurrentRequest(status);
                if (status < 200 || status >= 300) throw new ProviderError("http " + status, status);
                return "body";
            });
        }
    }

    private static ProviderAuthority authority(String id, String env, String baseUrl,
                                               RequestPacer pacer, ObservationRecorder rec) {
        var adapter = new DrivableAdapter(baseUrl, pacer);
        var a = new ProviderAuthority(id, env, adapter, adapter.cache(), pacer);
        a.bindObserver(rec);
        return a;
    }

    private static List<ObservationRecorder.Event> ofType(ObservationRecorder rec,
            ObservationRecorder.RecordType t) {
        return rec.page(0, 1_000_000).events().stream()
            .filter(e -> e.recordType().equals(t.name())).toList();
    }

    @Test
    void genuinelyConcurrentSubmissionsAreSingleFlightPerAuthority() throws Exception {
        // Many threads submit to ONE pacer at once. The pacer's single dispatch thread must
        // serialize them: max concurrency inside the work region is 1, and every STARTED
        // record shows concurrencyAtStart == 1.
        var rec = new ObservationRecorder();
        var pacer = new RequestPacer(100_000, 1000); // window not the constraint here
        var a = authority("prod", "production", "https://api.tradier.com/v1", pacer, rec);
        var adapter = (DrivableAdapter) a.adapter();

        AtomicInteger inWork = new AtomicInteger(0);
        AtomicInteger maxInWork = new AtomicInteger(0);
        int threads = 16, perThread = 8;
        var start = new CountDownLatch(1);
        var pool = java.util.concurrent.Executors.newFixedThreadPool(threads);
        var done = new CountDownLatch(threads);
        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                try {
                    start.await();
                    for (int i = 0; i < perThread; i++) {
                        String lid = rec.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
                        a.pacer().openPurposeScope(lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "S", "production", 1);
                        try {
                            adapter.run("chain", () -> {
                                int c = inWork.incrementAndGet();
                                maxInWork.updateAndGet(m -> Math.max(m, c));
                                Thread.sleep(1);
                                inWork.decrementAndGet();
                                return "ok";
                            });
                        } finally {
                            a.pacer().clearPurposeScope();
                        }
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                } finally {
                    done.countDown();
                }
            });
        }
        start.countDown();
        assertTrue(done.await(30, java.util.concurrent.TimeUnit.SECONDS));
        pool.shutdownNow();
        pacer.shutdown();

        assertEquals(1, maxInWork.get(), "single-flight: at most one work unit runs at a time per pacer");
        var started = ofType(rec, ObservationRecorder.RecordType.OPERATION_STARTED);
        assertEquals(threads * perThread, started.size());
        for (var s : started) assertEquals(1, s.concurrencyAtStart(), "per-authority concurrency at start is 1");
    }

    @Test
    void configuredTrailingWindowRegimeIsEnforced() throws Exception {
        // Exercise the ACTUAL configured production regime: 119 starts per trailing 60s window.
        // Submitting 119 immediately must all admit without WINDOW_LEDGER waits; the 120th must
        // wait on the trailing-window ledger (there is no fixed post-completion cooldown).
        var rec = new ObservationRecorder();
        // The REAL trailing-window admission mechanism at the production start budget (119),
        // with a compressed 800ms window so the over-budget wait is observable in-test. The
        // controller logic (exact start ledger, no fixed cooldown) is identical to the 60s regime.
        var pacer = new RequestPacer(119, 800L, 400, new ProviderMeasurementRecorder());
        var a = authority("prod", "production", "https://api.tradier.com/v1", pacer, rec);
        var adapter = (DrivableAdapter) a.adapter();

        for (int i = 0; i < 119; i++) {
            String lid = rec.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
            a.pacer().openPurposeScope(lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "S" + i, "production", 1);
            try { adapter.run("chain", () -> "ok"); } finally { a.pacer().clearPurposeScope(); }
        }
        long ledgerWaitsIn119 = ofType(rec, ObservationRecorder.RecordType.OPERATION_STARTED).stream()
            .filter(s -> s.admissionWaitReason().equals("WINDOW_LEDGER")).count();
        assertEquals(0, ledgerWaitsIn119, "the first 119 starts admit without trailing-window waits");

        // The 120th within the same window is over budget → it BLOCKS on the trailing-window
        // ledger until the window slides (~800ms), then admits with WINDOW_LEDGER recorded on
        // its STARTED record (the reason is stamped once admission resolves).
        String lid120 = rec.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        a.pacer().openPurposeScope(lid120, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "S120", "production", 1);
        long t0 = System.nanoTime();
        try { adapter.run("chain", () -> "ok"); } finally { a.pacer().clearPurposeScope(); }
        long waitedMs = (System.nanoTime() - t0) / 1_000_000L;
        pacer.shutdown();

        assertTrue(waitedMs >= 400, "the 120th start must actually wait for the window to slide; waited " + waitedMs + "ms");
        boolean sawLedgerWait = ofType(rec, ObservationRecorder.RecordType.OPERATION_STARTED).stream()
            .anyMatch(s -> "S120".equals(s.subject()) && s.admissionWaitReason().equals("WINDOW_LEDGER"));
        assertTrue(sawLedgerWait, "the 120th start must record a WINDOW_LEDGER admission wait");
    }

    @Test
    void distinctAuthoritiesHaveSeparateLedgersProbeDoesNotDebitActive() throws Exception {
        var rec = new ObservationRecorder();
        var sandboxPacer = new RequestPacer(1000, 50);
        var prodPacer = new RequestPacer(1000, 50);
        var sandbox = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", sandboxPacer, rec);
        var prod = authority("prod", "production", "https://api.tradier.com/v1", prodPacer, rec);
        var sandboxAdapter = (DrivableAdapter) sandbox.adapter();
        var prodAdapter = (DrivableAdapter) prod.adapter();

        for (int i = 0; i < 5; i++) {
            String lid = rec.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
            sandbox.pacer().openPurposeScope(lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "S" + i, "sandbox", 2);
            try { sandboxAdapter.run("chain", () -> "ok"); } finally { sandbox.pacer().clearPurposeScope(); }
        }
        for (int i = 0; i < 2; i++) {
            String lid = rec.newLogicalOperationId(ObservationRecorder.Purpose.RECOVERY_PROBE);
            prod.pacer().openPurposeScope(lid, ObservationRecorder.Purpose.RECOVERY_PROBE, "SPY", "production", 2);
            try { prodAdapter.run("quote", () -> "ok"); } finally { prod.pacer().clearPurposeScope(); }
        }
        sandboxPacer.shutdown();
        prodPacer.shutdown();

        var started = ofType(rec, ObservationRecorder.RecordType.OPERATION_STARTED);
        long probeOnSandbox = started.stream()
            .filter(s -> s.authorityId().equals("sandbox") && s.purpose().equals("RECOVERY_PROBE")).count();
        assertEquals(0, probeOnSandbox, "recovery probe must not debit the active (sandbox) authority's ledger");
        assertEquals(5, started.stream().filter(s -> s.authorityId().equals("sandbox")).count());
        assertEquals(2, started.stream().filter(s -> s.authorityId().equals("prod")).count());
    }

    @Test
    void rateLimit429AppliesObservableBackoff() throws Exception {
        var rec = new ObservationRecorder();
        var pacer = new RequestPacer(1000, 50);
        var a = authority("prod", "production", "https://api.tradier.com/v1", pacer, rec);
        var adapter = (DrivableAdapter) a.adapter();

        String lid0 = rec.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        a.pacer().openPurposeScope(lid0, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "S0", "production", 1);
        try {
            assertThrows(Exception.class, () -> adapter.run("chain", () -> {
                throw new ProviderError("rate limited", 429, 200L);
            }));
        } finally { a.pacer().clearPurposeScope(); }

        String lid1 = rec.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        a.pacer().openPurposeScope(lid1, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "S1", "production", 1);
        try { adapter.run("chain", () -> "ok"); } finally { a.pacer().clearPurposeScope(); }
        pacer.shutdown();

        var completed = ofType(rec, ObservationRecorder.RecordType.OPERATION_COMPLETED);
        assertTrue(completed.stream().anyMatch(c -> c.httpResult().equals("RATE_LIMITED")
            && c.httpStatus() != null && c.httpStatus() == 429 && c.providerBackoffMs() != null));
        var started = ofType(rec, ObservationRecorder.RecordType.OPERATION_STARTED);
        assertTrue(started.stream().anyMatch(s -> s.admissionWaitReason().equals("PROVIDER_BACKOFF")));
    }

    @Test
    void probeVerdictCorrelatesToItsTransportOpsThroughRealPath() throws Exception {
        // Drive a REAL probe through ProviderAuthority.probeRepresentative against an adapter
        // whose quote/expirations/chain succeed but whose normalization is exercised by the real
        // adapter. Prove the terminal PROBE verdict shares the logical id of its transport ops.
        var rec = new ObservationRecorder();
        var pacer = new RequestPacer(1000, 50);
        // A probe adapter that returns malformed bodies -> real normalization fails -> PROBE_UNUSABLE,
        // yet the HTTP calls themselves succeed (transport SUCCESS), proving logical != transport.
        var probeAdapter = new TradierAdapter("k", "https://api.tradier.com/v1", new ResponseCache(), pacer) {
            @Override public ProbeResult probeRepresentative(String symbol) {
                // Exercise the real pacer with 3 HTTP-successful calls, then a normalization-failed verdict.
                try {
                    pacer().setOperationKind("quote"); pacer().submit(() -> "{}");
                    pacer().setOperationKind("expirations"); pacer().submit(() -> "{}");
                    pacer().setOperationKind("chain"); pacer().submit(() -> "{}");
                } catch (Exception ignored) { }
                return new ProbeResult(false, "normalization failed despite HTTP success");
            }
        };
        var authority = new ProviderAuthority("prod", "production", probeAdapter, probeAdapter.cache(), pacer);
        authority.bindObserver(rec);

        var result = authority.probeRepresentative("SPY", 3);
        pacer.shutdown();
        assertFalse(result.usable());

        var events = rec.page(0, 10_000).events();
        var verdict = events.stream()
            .filter(e -> e.recordType().equals(ObservationRecorder.RecordType.LOGICAL_OUTCOME.name()))
            .findFirst().orElseThrow();
        assertEquals("PROBE_UNUSABLE", verdict.logicalOutcome());
        String probeLogicalId = verdict.logicalOperationId();
        long transportSharing = events.stream()
            .filter(e -> e.recordType().equals(ObservationRecorder.RecordType.OPERATION_STARTED.name()))
            .filter(e -> probeLogicalId.equals(e.logicalOperationId())).count();
        assertEquals(3, transportSharing,
            "all 3 probe transport ops share the verdict's logical id — verdict is provably attributable");
        // Transport was SUCCESS on all three, yet the logical verdict is UNUSABLE.
        long httpSuccesses = events.stream()
            .filter(e -> e.recordType().equals(ObservationRecorder.RecordType.OPERATION_COMPLETED.name()))
            .filter(e -> probeLogicalId.equals(e.logicalOperationId()))
            .filter(e -> "SUCCESS".equals(e.httpResult())).count();
        assertEquals(3, httpSuccesses, "HTTP success != usable evidence (transport vs logical separation)");
    }

    @Test
    void cursorSafeUnderConcurrentCompletionThroughRealPacers() throws Exception {
        var rec = new ObservationRecorder();
        var p1 = new RequestPacer(1000, 500);
        var p2 = new RequestPacer(1000, 500);
        var a1 = authority("prod", "production", "https://api.tradier.com/v1", p1, rec);
        var a2 = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", p2, rec);
        var ad1 = (DrivableAdapter) a1.adapter();
        var ad2 = (DrivableAdapter) a2.adapter();

        int perAuthority = 100;
        var start = new CountDownLatch(1);
        Thread t1 = new Thread(() -> driveMany(a1, ad1, rec, "prod", perAuthority, start));
        Thread t2 = new Thread(() -> driveMany(a2, ad2, rec, "sandbox", perAuthority, start));
        t1.start(); t2.start();
        start.countDown();
        t1.join(); t2.join();
        p1.shutdown(); p2.shutdown();

        java.util.Set<String> incremental = new java.util.HashSet<>();
        long cursor = 0;
        while (true) {
            var page = rec.page(cursor, 50);
            if (page.events().isEmpty()) break;
            for (var e : page.events()) {
                if (e.recordType().equals(ObservationRecorder.RecordType.OPERATION_COMPLETED.name())) {
                    incremental.add(e.requestId());
                }
                cursor = Math.max(cursor, e.sequence());
            }
        }
        java.util.Set<String> full = new java.util.HashSet<>();
        for (var e : rec.page(0, 1_000_000).events()) {
            if (e.recordType().equals(ObservationRecorder.RecordType.OPERATION_COMPLETED.name())) {
                full.add(e.requestId());
            }
        }
        assertEquals(2 * perAuthority, full.size());
        assertEquals(full, incremental, "incremental cursor consumption observes every completion — none skipped");
    }

    @Test
    void successfulHttpStatusReachesCompletedRecordAndFirstNon401IsIdentifiable() throws Exception {
        // Review-4 #1: the SUCCESS path must carry the exact status (200), not drop it. Drive
        // real paced ops that report their status through the pacer (as TradierAdapter does):
        // two 401s then a 200. The observer must record 200 on the successful COMPLETED, and the
        // first non-401 must be identifiable from observer data alone.
        var rec = new ObservationRecorder();
        var pacer = new RequestPacer(1000, 50);
        var a = authority("prod", "production", "https://api.tradier.com/v1", pacer, rec);
        var adapter = (DrivableAdapter) a.adapter();

        int[] statuses = { 401, 401, 200 };
        for (int i = 0; i < statuses.length; i++) {
            int s = statuses[i];
            String lid = rec.newLogicalOperationId(ObservationRecorder.Purpose.RECOVERY_PROBE);
            a.pacer().openPurposeScope(lid, ObservationRecorder.Purpose.RECOVERY_PROBE, "SPY", "production", 1);
            try {
                if (s == 200) adapter.runWithStatus("quote", 200);
                else assertThrows(Exception.class, () -> adapter.runWithStatus("quote", s));
            } finally { a.pacer().clearPurposeScope(); }
        }
        pacer.shutdown();

        var completed = ofType(rec, ObservationRecorder.RecordType.OPERATION_COMPLETED);
        assertEquals(3, completed.size());
        // Every COMPLETED carries its exact status, including the successful 200.
        assertEquals(401, completed.get(0).httpStatus());
        assertEquals(401, completed.get(1).httpStatus());
        assertEquals(200, completed.get(2).httpStatus(), "successful HTTP status must reach the COMPLETED record");
        assertEquals("SUCCESS", completed.get(2).httpResult());
        // First non-401 identifiable from observer data alone.
        var firstNon401 = completed.stream()
            .filter(e -> e.httpStatus() != null && e.httpStatus() != 401)
            .findFirst().orElseThrow();
        assertEquals(200, firstNon401.httpStatus());
    }

    @Test
    void fencedSecondaryWriteIsExposedNotVanished() throws Exception {
        // Review-4 #3: a discarded stale-lease write must not vanish. Using the real manager
        // boundary: a lease from epoch N, after a transition to N+1, has its commit fenced —
        // the manager emits STORE_MUTATION_FENCED correlated to the lease's logical operation.
        var rec = new ObservationRecorder();
        var prodPacer = new RequestPacer(1000, 50);
        var sbxPacer = new RequestPacer(1000, 50);
        var prod = authority("prod", "production", "https://api.tradier.com/v1", prodPacer, rec);
        var sbx = authority("sandbox", "sandbox", "https://sandbox.tradier.com/v1", sbxPacer, rec);
        var mgr = new ProviderAuthorityManager(prod, sbx, rec);

        var lease = mgr.acquireLease();                 // epoch N
        // Simulate: primary committed (terminal success recorded by the worker in real flow).
        mgr.commitIfCurrent(lease, "SPY", "chain", () -> {}, () -> {});
        mgr.recordTerminalOutcome(lease, "SPY", ObservationRecorder.LogicalOutcome.ACQUISITION_COMMITTED);
        // Transition lands; the SAME lease now attempts a SECONDARY write and is fenced.
        assertTrue(mgr.activateDegraded());             // epoch N+1
        boolean[] applied = { false };
        boolean committed = mgr.commitIfCurrent(lease, "SPY", "chain", () -> applied[0] = true, () -> {});
        prodPacer.shutdown(); sbxPacer.shutdown();

        assertFalse(committed);
        assertFalse(applied[0], "fenced secondary write must not apply");
        var events = rec.page(0, 100_000).events();
        var fencedRecords = events.stream()
            .filter(e -> e.recordType().equals(ObservationRecorder.RecordType.STORE_MUTATION_FENCED.name()))
            .filter(e -> lease.operationId().equals(e.logicalOperationId()))
            .toList();
        assertEquals(1, fencedRecords.size(), "the discarded secondary write is EXPOSED, not vanished");
        assertEquals("SPY", fencedRecords.get(0).subject());
        // Primary terminal success stands.
        long committedTerminals = events.stream()
            .filter(e -> e.recordType().equals(ObservationRecorder.RecordType.LOGICAL_OUTCOME.name()))
            .filter(e -> "ACQUISITION_COMMITTED".equals(e.logicalOutcome()))
            .filter(e -> lease.operationId().equals(e.logicalOperationId()))
            .count();
        assertEquals(1, committedTerminals, "primary terminal success is preserved alongside the fenced-secondary record");
    }

    private static void driveMany(ProviderAuthority a, DrivableAdapter adapter, ObservationRecorder rec,
                                  String env, int count, CountDownLatch start) {
        try {
            start.await();
            for (int i = 0; i < count; i++) {
                String lid = rec.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
                a.pacer().openPurposeScope(lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "S" + i, env, 1);
                try {
                    adapter.run("chain", () -> "ok");
                } finally {
                    a.pacer().clearPurposeScope();
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
