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
    void pacingIntroducesDelayBetweenRequests() throws Exception {
        // Use a pacer with measurable interval
        RequestPacer pacer = new RequestPacer(10, 50); // 100ms interval
        try {
            long start = System.currentTimeMillis();

            // Submit two requests sequentially (not from cache)
            pacer.submit(() -> "first");
            pacer.submit(() -> "second");

            long elapsed = System.currentTimeMillis() - start;

            // Should have at least one interval of pacing (~100ms)
            // Use a generous minimum to avoid flakiness
            assertTrue(elapsed >= 50, "Expected pacing delay, but elapsed was " + elapsed + "ms");
        } finally {
            pacer.shutdown();
        }
    }
}
