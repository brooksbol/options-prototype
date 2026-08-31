package com.wheelwright.evidence.provider;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bounded, in-memory provider-boundary measurement recorder.
 *
 * Measurement only: recorder failures must never affect acquisition behavior.
 * No credentials, authorization headers, URLs, query strings, or response bodies
 * are accepted by this type.
 */
public final class ProviderMeasurementRecorder {

    public static final int DEFAULT_CAPACITY = 10_000;

    private final int capacity;
    private final Map<Long, MutableEvent> inFlight = new LinkedHashMap<>();
    private final ArrayDeque<ProviderMeasurementEvent> completed = new ArrayDeque<>();
    private long eventsDropped;
    private long recorderErrors;

    public ProviderMeasurementRecorder() {
        this(DEFAULT_CAPACITY);
    }

    ProviderMeasurementRecorder(int capacity) {
        if (capacity < 1) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
    }

    public synchronized void enqueued(long sequence, long monotonicNs, int queueDepth) {
        safely(() -> inFlight.put(sequence,
            new MutableEvent(sequence, Instant.now().toString(), monotonicNs, queueDepth)));
    }

    public synchronized void dequeued(long sequence, long monotonicNs, int queueDepth) {
        safely(() -> event(sequence).dequeued(monotonicNs, queueDepth));
    }

    public synchronized void paceWait(long sequence, long startNs, long endNs) {
        safely(() -> event(sequence).paceWait(startNs, endNs));
    }

    public synchronized void callableStarted(long sequence, long monotonicNs) {
        safely(() -> event(sequence).callableStarted(Instant.now().toString(), monotonicNs));
    }

    public synchronized void httpStarted(long sequence, long monotonicNs, String endpointClass) {
        safely(() -> event(sequence).httpStarted(Instant.now().toString(), monotonicNs, endpointClass));
    }

    public synchronized void httpCompleted(long sequence, long monotonicNs, int status,
                                           Map<String, List<String>> rateLimitHeaders) {
        safely(() -> event(sequence).httpCompleted(
            Instant.now().toString(), monotonicNs, status, copyHeaders(rateLimitHeaders), null));
    }

    public synchronized void httpFailed(long sequence, long monotonicNs, Throwable error) {
        safely(() -> event(sequence).httpCompleted(
            Instant.now().toString(), monotonicNs, null, Map.of(), error.getClass().getName()));
    }

    public synchronized void callableCompleted(long sequence, long monotonicNs, Throwable error) {
        safely(() -> {
            MutableEvent mutable = event(sequence);
            mutable.callableCompleted(Instant.now().toString(), monotonicNs, error);
            retain(mutable.freeze());
            inFlight.remove(sequence);
        });
    }

    public synchronized MeasurementPage page(long afterSequence, int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 5_000));
        List<ProviderMeasurementEvent> events = new ArrayList<>();
        for (ProviderMeasurementEvent event : completed) {
            if (event.sequence() > afterSequence) {
                events.add(event);
                if (events.size() >= limit) break;
            }
        }
        Long oldest = completed.isEmpty() ? null : completed.getFirst().sequence();
        Long newest = completed.isEmpty() ? null : completed.getLast().sequence();
        return new MeasurementPage(oldest, newest, eventsDropped, recorderErrors, inFlight.size(), events);
    }

    private MutableEvent event(long sequence) {
        MutableEvent value = inFlight.get(sequence);
        if (value == null) throw new IllegalStateException("unknown provider measurement sequence " + sequence);
        return value;
    }

    private void retain(ProviderMeasurementEvent event) {
        if (completed.size() == capacity) {
            completed.removeFirst();
            eventsDropped++;
        }
        completed.addLast(event);
    }

    private static Map<String, List<String>> copyHeaders(Map<String, List<String>> headers) {
        Map<String, List<String>> copy = new LinkedHashMap<>();
        headers.forEach((name, values) -> copy.put(name, List.copyOf(values)));
        return Map.copyOf(copy);
    }

    private void safely(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException ignored) {
            // Measurement must never change provider behavior.
            recorderErrors++;
        }
    }

    public record MeasurementPage(
        Long oldestRetainedSequence,
        Long newestRetainedSequence,
        long eventsDropped,
        long recorderErrors,
        int inFlightCount,
        List<ProviderMeasurementEvent> events
    ) {}

    public record ProviderMeasurementEvent(
        long sequence,
        String enqueuedAtUtc,
        long enqueuedAtMonotonicNs,
        int queueDepthAtEnqueue,
        Long dequeuedAtMonotonicNs,
        Integer queueDepthAtDequeue,
        Long paceWaitStartNs,
        Long paceWaitEndNs,
        Long callableStartNs,
        String callableStartUtc,
        Long callableCompleteNs,
        String callableCompleteUtc,
        boolean success,
        String exceptionClass,
        Long httpStartNs,
        String httpStartUtc,
        Long httpCompleteNs,
        String httpCompleteUtc,
        String endpointClass,
        Integer httpStatus,
        String httpExceptionClass,
        Map<String, List<String>> rateLimitHeaders
    ) {}

    private static final class MutableEvent {
        private final long sequence;
        private final String enqueuedAtUtc;
        private final long enqueuedAtMonotonicNs;
        private final int queueDepthAtEnqueue;
        private Long dequeuedAtMonotonicNs;
        private Integer queueDepthAtDequeue;
        private Long paceWaitStartNs;
        private Long paceWaitEndNs;
        private Long callableStartNs;
        private String callableStartUtc;
        private Long callableCompleteNs;
        private String callableCompleteUtc;
        private boolean success;
        private String exceptionClass;
        private Long httpStartNs;
        private String httpStartUtc;
        private Long httpCompleteNs;
        private String httpCompleteUtc;
        private String endpointClass;
        private Integer httpStatus;
        private String httpExceptionClass;
        private Map<String, List<String>> rateLimitHeaders = Map.of();

        MutableEvent(long sequence, String enqueuedAtUtc, long enqueuedAtMonotonicNs, int queueDepthAtEnqueue) {
            this.sequence = sequence;
            this.enqueuedAtUtc = enqueuedAtUtc;
            this.enqueuedAtMonotonicNs = enqueuedAtMonotonicNs;
            this.queueDepthAtEnqueue = queueDepthAtEnqueue;
        }

        void dequeued(long atNs, int queueDepth) {
            this.dequeuedAtMonotonicNs = atNs;
            this.queueDepthAtDequeue = queueDepth;
        }

        void paceWait(long startNs, long endNs) {
            this.paceWaitStartNs = startNs;
            this.paceWaitEndNs = endNs;
        }

        void callableStarted(String atUtc, long atNs) {
            this.callableStartUtc = atUtc;
            this.callableStartNs = atNs;
        }

        void httpStarted(String atUtc, long atNs, String endpointClass) {
            this.httpStartUtc = atUtc;
            this.httpStartNs = atNs;
            this.endpointClass = endpointClass;
        }

        void httpCompleted(String atUtc, long atNs, Integer status,
                           Map<String, List<String>> headers, String exceptionClass) {
            this.httpCompleteUtc = atUtc;
            this.httpCompleteNs = atNs;
            this.httpStatus = status;
            this.rateLimitHeaders = headers;
            this.httpExceptionClass = exceptionClass;
        }

        void callableCompleted(String atUtc, long atNs, Throwable error) {
            this.callableCompleteUtc = atUtc;
            this.callableCompleteNs = atNs;
            this.success = error == null;
            this.exceptionClass = error == null ? null : error.getClass().getName();
        }

        ProviderMeasurementEvent freeze() {
            return new ProviderMeasurementEvent(
                sequence, enqueuedAtUtc, enqueuedAtMonotonicNs, queueDepthAtEnqueue,
                dequeuedAtMonotonicNs, queueDepthAtDequeue, paceWaitStartNs, paceWaitEndNs,
                callableStartNs, callableStartUtc, callableCompleteNs, callableCompleteUtc,
                success, exceptionClass, httpStartNs, httpStartUtc, httpCompleteNs,
                httpCompleteUtc, endpointClass, httpStatus, httpExceptionClass,
                rateLimitHeaders);
        }
    }
}
