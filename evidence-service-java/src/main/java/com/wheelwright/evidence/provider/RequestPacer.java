package com.wheelwright.evidence.provider;

import java.util.ArrayDeque;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Request Pacer — serializes upstream provider calls with minimum spacing.
 *
 * Behavioral parity with TypeScript RequestPacer:
 *   - Requests are queued and dispatched one-at-a-time
 *   - Strictly single-flight provider execution
 *   - Exact local start ledger (default: at most 119 starts in any trailing 60 seconds)
 *   - Queue has a maximum size; exceeding it throws immediately
 *   - Failed requests propagate errors without special pacing treatment
 *   - Provider 429 guidance overrides normal admission
 */
public class RequestPacer {

    private final int requestLimit;
    private final long windowNanos;
    private final int maxQueueSize;
    private final BlockingQueue<PacedTask<?>> queue;
    private final Thread dispatchThread;
    private final ProviderMeasurementRecorder measurementRecorder;
    private final ThreadLocal<Long> currentSequence = new ThreadLocal<>();
    private final Object admissionLock = new Object();
    private final ArrayDeque<Long> requestStarts = new ArrayDeque<>();
    private long providerBackoffUntilNs;
    private volatile boolean running = true;

    private final AtomicInteger dispatched = new AtomicInteger(0);
    private final AtomicInteger queued = new AtomicInteger(0);
    private final AtomicInteger rejected = new AtomicInteger(0);
    private final java.util.concurrent.atomic.AtomicLong measurementSequence = new java.util.concurrent.atomic.AtomicLong(0);

    /**
     * Legacy test/construction bridge. Production wiring uses the explicit
     * requests-per-minute constructor below.
     * @param maxQueueSize reject if queue exceeds this (default: 200)
     */
    public RequestPacer(double requestsPerSecond, int maxQueueSize) {
        this(Math.max(1, (int)Math.floor(requestsPerSecond * 60)), 60_000L,
            maxQueueSize, new ProviderMeasurementRecorder());
    }

    RequestPacer(double requestsPerSecond, int maxQueueSize, ProviderMeasurementRecorder measurementRecorder) {
        this(Math.max(1, (int)Math.floor(requestsPerSecond * 60)), 60_000L,
            maxQueueSize, measurementRecorder);
    }

    public RequestPacer(int requestsPerMinute, int maxQueueSize) {
        this(requestsPerMinute, 60_000L, maxQueueSize, new ProviderMeasurementRecorder());
    }

    RequestPacer(int requestLimit, long windowMs, int maxQueueSize,
                 ProviderMeasurementRecorder measurementRecorder) {
        if (requestLimit < 1) throw new IllegalArgumentException("requestLimit must be positive");
        if (windowMs < 1) throw new IllegalArgumentException("windowMs must be positive");
        this.requestLimit = requestLimit;
        this.windowNanos = TimeUnit.MILLISECONDS.toNanos(windowMs);
        this.maxQueueSize = maxQueueSize;
        this.queue = new LinkedBlockingQueue<>(maxQueueSize);
        this.measurementRecorder = measurementRecorder;

        this.dispatchThread = new Thread(this::processQueue, "request-pacer");
        this.dispatchThread.setDaemon(true);
        this.dispatchThread.start();
    }

    public RequestPacer() {
        this(119, 200);
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
        long sequence = measurementSequence.incrementAndGet();
        measurementRecorder.enqueued(sequence, System.nanoTime(), queue.size());
        PacedTask<T> pacedTask = new PacedTask<>(sequence, task, future);

        if (!queue.offer(pacedTask)) {
            rejected.incrementAndGet();
            measurementRecorder.callableCompleted(sequence, System.nanoTime(),
                new ProviderError("Request queue full — provider capacity exhausted", 503));
            throw new ProviderError("Request queue full — provider capacity exhausted", 503);
        }

        return future.get(); // Block until dispatched and complete
    }

    /**
     * Get pacing state for diagnostics.
     */
    public PacerState getState() {
        AdmissionState admission = admissionState();
        return new PacerState(
            queue.size(),
            0,
            dispatched.get(),
            queued.get(),
            rejected.get(),
            requestLimit,
            TimeUnit.NANOSECONDS.toMillis(windowNanos),
            admission.startsInWindow(),
            admission.nextAdmissionInMs(),
            admission.backoffRemainingMs()
        );
    }

    public ProviderMeasurementRecorder.MeasurementPage getMeasurementEvents(long afterSequence, int limit) {
        return measurementRecorder.page(afterSequence, limit);
    }

    ProviderMeasurementRecorder measurementRecorder() {
        return measurementRecorder;
    }

    Long currentMeasurementSequence() {
        return currentSequence.get();
    }

    public void shutdown() {
        running = false;
        dispatchThread.interrupt();
    }

    private void processQueue() {
        while (running) {
            try {
                PacedTask<?> task = queue.poll(1, TimeUnit.SECONDS);
                if (task == null) continue;

                measurementRecorder.dequeued(task.sequence(), System.nanoTime(), queue.size());

                // Admission: no fixed completion cooldown. Wait only for the exact
                // trailing-window budget or an authoritative provider backoff.
                long paceStart = System.nanoTime();
                awaitAdmission();
                long paceEnd = System.nanoTime();
                measurementRecorder.paceWait(task.sequence(), paceStart, paceEnd);
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
        Throwable failure = null;
        long completionNs = 0;
        try {
            currentSequence.set(task.sequence());
            measurementRecorder.callableStarted(task.sequence(), System.nanoTime());
            T result = task.callable().call();
            completionNs = System.nanoTime();
            task.future().complete(result);
        } catch (Exception e) {
            failure = e;
            completionNs = System.nanoTime();
            if (e instanceof ProviderError providerError && providerError.getStatusCode() == 429) {
                applyProviderBackoff(providerError.getRetryAfterMs());
            }
            task.future().completeExceptionally(e);
        } finally {
            if (completionNs == 0) completionNs = System.nanoTime();
            measurementRecorder.callableCompleted(task.sequence(), completionNs, failure);
            currentSequence.remove();
        }
    }

    private record PacedTask<T>(long sequence, Callable<T> callable, CompletableFuture<T> future) {}

    private void awaitAdmission() throws InterruptedException {
        while (running) {
            long waitNanos;
            synchronized (admissionLock) {
                long now = System.nanoTime();
                pruneStarts(now);
                long ledgerWait = requestStarts.size() >= requestLimit
                    ? Math.max(0, requestStarts.getFirst() + windowNanos - now)
                    : 0;
                long backoffWait = Math.max(0, providerBackoffUntilNs - now);
                waitNanos = Math.max(ledgerWait, backoffWait);
                if (waitNanos == 0) {
                    requestStarts.addLast(now);
                    return;
                }
            }
            TimeUnit.NANOSECONDS.sleep(waitNanos);
        }
        throw new InterruptedException("request pacer stopped");
    }

    private void applyProviderBackoff(Long retryAfterMs) {
        long delayMs = retryAfterMs != null ? retryAfterMs : 60_000L;
        synchronized (admissionLock) {
            providerBackoffUntilNs = Math.max(providerBackoffUntilNs,
                System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(delayMs));
        }
    }

    private AdmissionState admissionState() {
        synchronized (admissionLock) {
            long now = System.nanoTime();
            pruneStarts(now);
            long ledgerWait = requestStarts.size() >= requestLimit
                ? Math.max(0, requestStarts.getFirst() + windowNanos - now)
                : 0;
            long backoffWait = Math.max(0, providerBackoffUntilNs - now);
            return new AdmissionState(
                requestStarts.size(),
                TimeUnit.NANOSECONDS.toMillis(Math.max(ledgerWait, backoffWait)),
                TimeUnit.NANOSECONDS.toMillis(backoffWait));
        }
    }

    private void pruneStarts(long now) {
        while (!requestStarts.isEmpty() && now - requestStarts.getFirst() >= windowNanos) {
            requestStarts.removeFirst();
        }
    }

    private record AdmissionState(int startsInWindow, long nextAdmissionInMs, long backoffRemainingMs) {}

    public record PacerState(
        int queueDepth,
        long paceMs,
        int dispatched,
        int queued,
        int rejected,
        int requestLimit,
        long windowMs,
        int startsInWindow,
        long nextAdmissionInMs,
        long backoffRemainingMs
    ) {}
}
