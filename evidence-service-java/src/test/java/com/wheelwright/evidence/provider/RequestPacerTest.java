package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RequestPacer tests — serial dispatch, pacing, queue limits, error propagation.
 * Behavioral parity with TypeScript request-pacer.test.ts.
 */
class RequestPacerTest {

    @Test
    void executesSingleRequestImmediately() throws Exception {
        RequestPacer pacer = new RequestPacer(1000, 10); // fast
        try {
            String result = pacer.submit(() -> "hello");
            assertEquals("hello", result);
        } finally {
            pacer.shutdown();
        }
    }

    @Test
    void executesMultipleRequestsSequentially() throws Exception {
        RequestPacer pacer = new RequestPacer(1000, 10);
        try {
            List<Integer> order = Collections.synchronizedList(new ArrayList<>());

            // Submit from multiple threads — all should be serialized
            CompletableFuture<Integer> f1 = CompletableFuture.supplyAsync(() -> {
                try { return pacer.submit(() -> { order.add(1); return 1; }); }
                catch (Exception e) { throw new RuntimeException(e); }
            });
            CompletableFuture<Integer> f2 = CompletableFuture.supplyAsync(() -> {
                try { return pacer.submit(() -> { order.add(2); return 2; }); }
                catch (Exception e) { throw new RuntimeException(e); }
            });
            CompletableFuture<Integer> f3 = CompletableFuture.supplyAsync(() -> {
                try { return pacer.submit(() -> { order.add(3); return 3; }); }
                catch (Exception e) { throw new RuntimeException(e); }
            });

            f1.get(5, TimeUnit.SECONDS);
            f2.get(5, TimeUnit.SECONDS);
            f3.get(5, TimeUnit.SECONDS);

            // All three completed
            assertEquals(3, order.size());
        } finally {
            pacer.shutdown();
        }
    }

    @Test
    void rejectsWhenQueueIsFull() throws Exception {
        // Pacer with max queue 2 — we'll block the dispatch thread with a latch
        CountDownLatch blockLatch = new CountDownLatch(1);
        RequestPacer pacer = new RequestPacer(1000, 2);
        try {
            // First task blocks the dispatch thread
            CompletableFuture.runAsync(() -> {
                try { pacer.submit(() -> { blockLatch.await(); return 1; }); }
                catch (Exception ignored) {}
            });

            // Wait for dispatch thread to pick up the blocking task
            Thread.sleep(100);

            // Now dispatch thread is blocked. Submit two more to fill the queue.
            CompletableFuture.runAsync(() -> {
                try { pacer.submit(() -> 2); } catch (Exception ignored) {}
            });
            CompletableFuture.runAsync(() -> {
                try { pacer.submit(() -> 3); } catch (Exception ignored) {}
            });

            Thread.sleep(100);

            // Queue should now be full. Next submit should throw.
            assertThrows(ProviderError.class, () -> pacer.submit(() -> 4));
        } finally {
            blockLatch.countDown(); // unblock
            pacer.shutdown();
        }
    }

    @Test
    void reportsStateCorrectly() throws Exception {
        RequestPacer pacer = new RequestPacer(1000, 10);
        try {
            pacer.submit(() -> "done");

            RequestPacer.PacerState state = pacer.getState();
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(1);
            while (state.dispatched() < 1 && System.nanoTime() < deadline) {
                Thread.sleep(1);
                state = pacer.getState();
            }
            assertEquals(1, state.dispatched());
            assertEquals(1, state.queued());
            assertEquals(0, state.queueDepth()); // drained
            assertEquals(0, state.rejected());
        } finally {
            pacer.shutdown();
        }
    }

    @Test
    void propagatesErrorsFromExecutedFunctions() {
        RequestPacer pacer = new RequestPacer(1000, 10);
        try {
            assertThrows(Exception.class, () ->
                pacer.submit(() -> { throw new RuntimeException("boom"); })
            );
        } finally {
            pacer.shutdown();
        }
    }

    @Test
    void trailingWindowLedgerWaitsOnlyWhenBudgetIsConsumed() throws Exception {
        RequestPacer pacer = new RequestPacer(2, 100, 50, new ProviderMeasurementRecorder());
        try {
            long start = System.currentTimeMillis();

            pacer.submit(() -> "first");
            pacer.submit(() -> "second");
            long beforeThird = System.currentTimeMillis();
            pacer.submit(() -> "third");

            long elapsed = System.currentTimeMillis() - start;
            assertTrue(beforeThird - start < 50,
                "first two starts should not receive an artificial spacing delay");
            assertTrue(elapsed >= 80,
                "third start must wait for the oldest ledger entry to expire; elapsed=" + elapsed);
            var state = pacer.getState();
            assertEquals(2, state.requestLimit());
            assertEquals(100, state.windowMs());
        } finally {
            pacer.shutdown();
        }
    }

    @Test
    void provider429AppliesAuthoritativeBackoffBeforeNextStart() throws Exception {
        RequestPacer pacer = new RequestPacer(100, 1000, 10, new ProviderMeasurementRecorder());
        try {
            assertThrows(Exception.class, () -> pacer.submit(() -> {
                throw new ProviderError("limited", 429, 80L);
            }));
            long start = System.currentTimeMillis();
            pacer.submit(() -> "recovered");
            long elapsed = System.currentTimeMillis() - start;
            assertTrue(elapsed >= 60, "next start must honor provider backoff; elapsed=" + elapsed);
            assertEquals(0, pacer.getState().backoffRemainingMs());
        } finally {
            pacer.shutdown();
        }
    }
}
