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

    /**
     * Shared authoritative observer (PL-PROV-FAILOVER observer correction). Optional —
     * when null, the pacer behaves exactly as before. When set, the pacer records one
     * provider-neutral operation event per submitted operation onto the SHARED plane,
     * carrying purpose + opaque authority identity + admission-wait reason/duration +
     * single-flight-preserving timing + typed outcome + 429 backoff. The recorder never
     * affects pacing behavior (all recorder faults are swallowed inside the recorder).
     */
    private volatile ObservationRecorder observer;
    /** Opaque authority identity for observer events (set by the owning authority). */
    private volatile String observerAuthorityId;
    /**
     * Exact HTTP status of the request currently executing on the dispatch thread, reported by
     * the adapter's HTTP layer (review-4 #1). Set on every response INCLUDING success (200), so
     * the observer's OPERATION_COMPLETED carries the true status and the first non-401 response
     * is identifiable. Single-flight dispatch means one value per in-flight request.
     */
    private final ThreadLocal<Integer> currentHttpStatus = new ThreadLocal<>();
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
     * Bind the shared authoritative observer to this pacer. Called once by the owning
     * {@link ProviderAuthority} wiring. {@code authorityId} is opaque; {@code epochSupplier}
     * yields the current authority fence epoch at record time.
     */
    public void bindObserver(ObservationRecorder observer, String authorityId) {
        this.observer = observer;
        this.observerAuthorityId = authorityId;
    }

    /**
     * Per-operation observer context, set by the caller immediately before {@link #submit}.
     * Provider-neutral: purpose + operation kind + subject + opaque provenance + the
     * CAPTURED authority epoch. Cleared automatically once the operation is recorded.
     */
    private final ThreadLocal<OperationContext> pendingContext = new ThreadLocal<>();

    public record OperationContext(String logicalOperationId,
                                   ObservationRecorder.Purpose purpose,
                                   String operationKind,
                                   String subject,
                                   String opaqueProvenance,
                                   long capturedEpoch) {}

    /** Set the observer context for the NEXT {@link #submit} call on this thread. */
    public void setOperationContext(OperationContext context) {
        pendingContext.set(context);
    }

    /**
     * Sticky per-thread purpose scope. The CALLER (worker for ACTIVE_ACQUISITION, probe
     * path for RECOVERY_PROBE) opens a scope naming the logical operation's purpose +
     * subject + opaque provenance AND the authority epoch CAPTURED with the lease/control
     * decision that authorized it (review-2 correction: epoch travels with the operation,
     * never read at dispatch). The adapter supplies only the per-HTTP-call KIND, inheriting
     * the caller's purpose/subject/captured-epoch. Paired with {@link #clearPurposeScope}.
     */
    private final ThreadLocal<PurposeScope> purposeScope = new ThreadLocal<>();

    private record PurposeScope(String logicalOperationId, ObservationRecorder.Purpose purpose,
                                String subject, String opaqueProvenance, long capturedEpoch) {}

    /**
     * Open a scope for ONE logical operation (acquisition/probe). {@code logicalOperationId}
     * is shared by every HTTP request the operation issues, so START/COMPLETE transport
     * records and the terminal verdict are reconstructably related.
     */
    public void openPurposeScope(String logicalOperationId, ObservationRecorder.Purpose purpose,
                                 String subject, String opaqueProvenance, long capturedEpoch) {
        purposeScope.set(new PurposeScope(logicalOperationId, purpose, subject, opaqueProvenance, capturedEpoch));
    }

    public void clearPurposeScope() {
        purposeScope.remove();
    }

    /**
     * Adapter-facing: record the KIND of the next submit, inheriting the caller's open
     * purpose scope (logical id + captured epoch). When no scope is open (legacy callers),
     * defaults to ACTIVE_ACQUISITION with a null logical id and epoch 0.
     */
    public void setOperationKind(String operationKind) {
        PurposeScope scope = purposeScope.get();
        if (scope != null) {
            pendingContext.set(new OperationContext(scope.logicalOperationId(), scope.purpose(),
                operationKind, scope.subject(), scope.opaqueProvenance(), scope.capturedEpoch()));
        } else {
            pendingContext.set(new OperationContext(null,
                ObservationRecorder.Purpose.ACTIVE_ACQUISITION, operationKind, null, null, 0L));
        }
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
        // Capture the observer context on the CALLING thread (it will not be visible on
        // the dispatch thread otherwise). Cleared immediately so it never leaks to the
        // next submit on this thread.
        OperationContext context = pendingContext.get();
        pendingContext.remove();
        PacedTask<T> pacedTask = new PacedTask<>(sequence, task, future, context);

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
                AdmissionOutcome admission = awaitAdmission();
                long paceEnd = System.nanoTime();
                measurementRecorder.paceWait(task.sequence(), paceStart, paceEnd);

                // Shared authoritative observer: begin AFTER admission resolves, so the
                // recorded request-start timestamp reflects the actual admission/start
                // moment and the admission-wait reason/duration are exact. Single-flight
                // is intrinsic: this is the ONLY thread that dispatches for this pacer.
                ObservationRecorder.OperationHandle handle =
                    beginObserverOperation(task, admission, paceEnd - paceStart);

                executeTask(task, handle);
                dispatched.incrementAndGet();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    @SuppressWarnings("unchecked")
    private <T> void executeTask(PacedTask<T> task, ObservationRecorder.OperationHandle handle) {
        Throwable failure = null;
        long completionNs = 0;
        Long providerBackoffMs = null;
        Integer httpStatus = null;
        currentHttpStatus.remove(); // clear any prior value before the adapter reports this one
        try {
            currentSequence.set(task.sequence());
            measurementRecorder.callableStarted(task.sequence(), System.nanoTime());
            T result = task.callable().call();
            completionNs = System.nanoTime();
            // SUCCESS path: the adapter reported the exact response status (incl 200) via
            // recordHttpStatusForCurrentRequest during the call (review-4 #1).
            httpStatus = currentHttpStatus.get();
            task.future().complete(result);
        } catch (Exception e) {
            failure = e;
            completionNs = System.nanoTime();
            if (e instanceof ProviderError providerError) {
                httpStatus = providerError.getStatusCode();
                if (providerError.getStatusCode() == 429) {
                    providerBackoffMs = providerError.getRetryAfterMs() != null
                        ? providerError.getRetryAfterMs() : 60_000L;
                    applyProviderBackoff(providerError.getRetryAfterMs());
                }
            } else {
                // Non-provider failure may still have a reported status (rare); prefer it if present.
                Integer reported = currentHttpStatus.get();
                if (reported != null) httpStatus = reported;
            }
            task.future().completeExceptionally(e);
        } finally {
            if (completionNs == 0) completionNs = System.nanoTime();
            measurementRecorder.callableCompleted(task.sequence(), completionNs, failure);
            currentSequence.remove();
            currentHttpStatus.remove();
            completeObserverOperation(handle, failure, httpStatus, providerBackoffMs);
        }
    }

    /**
     * Adapter-facing (review-4 #1): report the EXACT HTTP status of the response the adapter
     * just received for the request currently executing on the dispatch thread — including
     * successful statuses (200). Read by the observer at completion so OPERATION_COMPLETED
     * carries the true status. Called from the adapter's HTTP layer while inside the paced
     * callable (same thread as the dispatch loop).
     */
    public void recordHttpStatusForCurrentRequest(int status) {
        currentHttpStatus.set(status);
    }

    private record PacedTask<T>(long sequence, Callable<T> callable,
                                CompletableFuture<T> future, OperationContext context) {}

    /** Result of awaiting admission: which constraint (if any) caused a wait. */
    private record AdmissionOutcome(ObservationRecorder.AdmissionWaitReason reason) {}

    private AdmissionOutcome awaitAdmission() throws InterruptedException {
        ObservationRecorder.AdmissionWaitReason waited = ObservationRecorder.AdmissionWaitReason.NONE;
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
                    return new AdmissionOutcome(waited);
                }
                // Attribute the dominant wait cause for this loop iteration.
                waited = backoffWait >= ledgerWait
                    ? ObservationRecorder.AdmissionWaitReason.PROVIDER_BACKOFF
                    : ObservationRecorder.AdmissionWaitReason.WINDOW_LEDGER;
            }
            TimeUnit.NANOSECONDS.sleep(waitNanos);
        }
        throw new InterruptedException("request pacer stopped");
    }

    // --- Shared authoritative observer integration (provider-neutral) ---

    private ObservationRecorder.OperationHandle beginObserverOperation(
            PacedTask<?> task, AdmissionOutcome admission, long admissionWaitNs) {
        ObservationRecorder obs = observer;
        if (obs == null) return null;
        OperationContext ctx = task.context();
        ObservationRecorder.Purpose purpose = ctx != null ? ctx.purpose()
            : ObservationRecorder.Purpose.ACTIVE_ACQUISITION;
        String kind = ctx != null ? ctx.operationKind() : "unknown";
        String subject = ctx != null ? ctx.subject() : null;
        String provenance = ctx != null ? ctx.opaqueProvenance() : null;
        String logicalId = ctx != null ? ctx.logicalOperationId() : null;
        // CAPTURED epoch travels with the operation context (set when the authorizing
        // lease/control decision was made), NOT read from the manager at dispatch time.
        long epoch = ctx != null ? ctx.capturedEpoch() : 0L;
        try {
            return obs.beginOperation(logicalId, purpose, observerAuthorityId, epoch, kind, subject,
                provenance, admission.reason(), TimeUnit.NANOSECONDS.toMillis(admissionWaitNs));
        } catch (RuntimeException e) {
            return null; // recorder must never affect pacing
        }
    }

    private void completeObserverOperation(ObservationRecorder.OperationHandle handle,
                                           Throwable failure, Integer httpStatus, Long providerBackoffMs) {
        ObservationRecorder obs = observer;
        if (obs == null || handle == null) return;
        // TRANSPORT-level result only. The logical/evidence outcome (committed/rejected/
        // fenced/probe-usable/probe-unusable) is recorded separately by the caller, so an
        // HTTP 200 that later fails normalization is never mistaken for usable evidence.
        ObservationRecorder.HttpResult result;
        if (failure == null) {
            result = ObservationRecorder.HttpResult.SUCCESS;
        } else if (failure instanceof ProviderError pe) {
            result = switch (pe.getStatusCode()) {
                case 401 -> ObservationRecorder.HttpResult.PROVIDER_UNUSABLE;
                case 429 -> ObservationRecorder.HttpResult.RATE_LIMITED;
                default -> ObservationRecorder.HttpResult.SYMBOL_QUALITY_FAILURE;
            };
        } else {
            result = ObservationRecorder.HttpResult.ERROR;
        }
        try {
            obs.completeOperation(handle, result, httpStatus, providerBackoffMs);
        } catch (RuntimeException ignored) {
            // recorder must never affect pacing
        }
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
