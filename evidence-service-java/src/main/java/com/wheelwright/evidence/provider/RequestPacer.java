package com.wheelwright.evidence.provider;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Request Pacer — serializes upstream provider calls with minimum spacing.
 *
 * Behavioral parity with TypeScript RequestPacer:
 *   - Requests are queued and dispatched one-at-a-time
 *   - Minimum intervalMs between dispatches (default: 1112ms = ~0.9 req/sec)
 *   - Queue has a maximum size; exceeding it throws immediately
 *   - Failed requests propagate errors without special pacing treatment
 *   - Pacing applies between consecutive requests regardless of success/failure
 */
public class RequestPacer {

    private final long intervalMs;
    private final int maxQueueSize;
    private final BlockingQueue<PacedTask<?>> queue;
    private final Thread dispatchThread;
    private volatile boolean running = true;

    private final AtomicInteger dispatched = new AtomicInteger(0);
    private final AtomicInteger queued = new AtomicInteger(0);
    private final AtomicInteger rejected = new AtomicInteger(0);

    /**
     * @param requestsPerSecond target rate (default: 0.9 = ~54/min, under 60/min limit)
     * @param maxQueueSize reject if queue exceeds this (default: 200)
     */
    public RequestPacer(double requestsPerSecond, int maxQueueSize) {
        this.intervalMs = (long) Math.ceil(1000.0 / requestsPerSecond);
        this.maxQueueSize = maxQueueSize;
        this.queue = new LinkedBlockingQueue<>(maxQueueSize);

        this.dispatchThread = new Thread(this::processQueue, "request-pacer");
        this.dispatchThread.setDaemon(true);
        this.dispatchThread.start();
    }

    public RequestPacer() {
        this(0.9, 200);
    }

    /**
     * Submit a request to be paced. Blocks the calling thread until the request
     * is dispatched and completes (or fails).
     */
    public <T> T submit(Callable<T> task) throws Exception {
        if (queue.size() >= maxQueueSize) {
            rejected.incrementAndGet();
            throw new ProviderError("Request queue full — provider capacity exhausted", 503);
        }

        queued.incrementAndGet();
        CompletableFuture<T> future = new CompletableFuture<>();
        PacedTask<T> pacedTask = new PacedTask<>(task, future);

        if (!queue.offer(pacedTask)) {
            rejected.incrementAndGet();
            throw new ProviderError("Request queue full — provider capacity exhausted", 503);
        }

        return future.get(); // Block until dispatched and complete
    }

    /**
     * Get pacing state for diagnostics.
     */
    public PacerState getState() {
        return new PacerState(
            queue.size(),
            intervalMs,
            dispatched.get(),
            queued.get(),
            rejected.get()
        );
    }

    public void shutdown() {
        running = false;
        dispatchThread.interrupt();
    }

    private void processQueue() {
        boolean isFirst = true;
        while (running) {
            try {
                PacedTask<?> task = queue.poll(1, TimeUnit.SECONDS);
                if (task == null) continue;

                // Pace: sleep before dispatch (except for the very first request)
                if (!isFirst) {
                    Thread.sleep(intervalMs);
                }
                isFirst = false;

                executeTask(task);
                dispatched.incrementAndGet();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    @SuppressWarnings("unchecked")
    private <T> void executeTask(PacedTask<T> task) {
        try {
            T result = task.callable().call();
            task.future().complete(result);
        } catch (Exception e) {
            task.future().completeExceptionally(e);
        }
    }

    private record PacedTask<T>(Callable<T> callable, CompletableFuture<T> future) {}

    public record PacerState(int queueDepth, long paceMs, int dispatched, int queued, int rejected) {}
}
