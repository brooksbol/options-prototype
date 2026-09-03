package com.wheelwright.evidence.provider;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Unified, append-only observer recorder — the AUTHORITATIVE measurement plane for
 * provider acquisition behavior (PL-PROV-FAILOVER observer correction, review 2).
 *
 * <p>ONE process-wide instance is SHARED by every provider authority/pacer and by the
 * authority manager. It is the plane from which an observer reconstructs — without
 * knowing the provider implementation or the internal control-state machine — every
 * acquisition attempt, authority boundary, fencing outcome, and usable-evidence
 * transition.
 *
 * <h2>Cursor model (review-2 correction)</h2>
 * Every record is APPEND-ONLY and receives its own global monotonically increasing
 * sequence AT APPEND TIME (under the recorder lock). An operation therefore emits TWO
 * records — an {@code OPERATION_STARTED} and a later {@code OPERATION_COMPLETED} —
 * correlated by {@code operationId}, plus (for acquisitions/probes) a terminal
 * {@code LOGICAL_OUTCOME} record. Because sequences are assigned at append, a record is
 * NEVER inserted behind an already-visible cursor: the safe consumption cursor is simply
 * the maximum record sequence a consumer has actually seen. There is no high-water value
 * that includes unpublished/in-flight records. Under arbitrary completion order across
 * concurrent authorities, no completion can be skipped: its COMPLETED record is appended
 * with a fresh sequence strictly greater than every previously appended record.
 *
 * <h2>Retention / discontinuity (review-2 correction)</h2>
 * A single bounded ring holds ALL record kinds. Eviction uses {@code >=} so the buffer
 * can never exceed capacity. Loss is exposed against the UNIFIED sequence:
 * {@code oldestRetainedSequence} + {@code eventsDropped} + {@code bufferDiscontinuity}
 * let an observer detect loss of ANY record type (operation OR control), not just
 * operations.
 *
 * <h2>Provider-neutrality</h2>
 * Authority identity is an OPAQUE string; environment/provider appear only as opaque
 * provenance. Observer interpretation must not depend on them. No credentials, URLs,
 * query strings, or response bodies are accepted.
 *
 * <h2>Safety</h2>
 * All recorder faults are swallowed and counted; a recorder fault can never fail an
 * acquisition.
 */
public final class ObservationRecorder {

    public static final int DEFAULT_CAPACITY = 50_000;

    /** Why an operation ran. Independent of which authority/pacer served it. */
    public enum Purpose {
        ACTIVE_ACQUISITION,
        RECOVERY_PROBE
    }

    /** HTTP-level operation result (transport outcome, NOT logical/evidence outcome). */
    public enum HttpResult {
        SUCCESS,
        PROVIDER_UNUSABLE,       // confirmed provider-level unusability (e.g. auth rejected)
        SYMBOL_QUALITY_FAILURE,  // per-subject failure (transient/quality), not provider-wide
        RATE_LIMITED,            // provider-directed throttling (e.g. 429)
        ERROR                    // other/unclassified transport failure
    }

    /**
     * Terminal LOGICAL outcome of an operation, correlated to its operationId. Distinct
     * from {@link HttpResult}: an HTTP 200 that fails normalization is NOT usable evidence
     * and terminates as ACQUISITION_REJECTED / PROBE_UNUSABLE, never as committed/usable.
     */
    public enum LogicalOutcome {
        ACQUISITION_COMMITTED,        // normalized primary chain written to the durable/current plane
        ACQUISITION_REJECTED,         // per-subject provider/normalization/quality failure — nothing committed
        ACQUISITION_FENCED,           // superseded by an authority transition — result discarded
        ACQUISITION_PROVIDER_UNUSABLE,// provider-wide unusability (e.g. confirmed 401) — control-plane condition
        ACQUISITION_NO_USABLE_EVIDENCE,// completed without a usable primary chain (expirations-only / absent)
        ACQUISITION_ABORTED,          // exited before acquiring (missing/unexpected state, shutdown)
        ACQUISITION_PERSISTENCE_FAILED,// durable write threw while the lease was still current (NOT fencing)
        PROBE_USABLE,                 // representative probe produced usable normalized evidence
        PROBE_UNUSABLE                // representative probe did not produce usable evidence
    }

    /** Why admission waited before the request start. */
    public enum AdmissionWaitReason {
        NONE,                    // admitted immediately
        WINDOW_LEDGER,           // trailing-window start budget full
        PROVIDER_BACKOFF         // provider-directed backoff (e.g. 429 Retry-After)
    }

    /**
     * Record kinds on the unified append-only stream.
     *
     * There is intentionally NO buffer-discontinuity RECORD kind: discontinuity is surfaced
     * as page metadata ({@code bufferDiscontinuity} + {@code firstDiscontinuitySequence} +
     * {@code eventsDropped}), never as an in-band record that could reorder relative to its
     * trigger. Intermediate store mutations and the single terminal acquisition outcome are
     * distinct kinds (review-3).
     */
    public enum RecordType {
        RECORDER_STARTED,        // control: recorder epoch anchor (process discontinuity)
        OPERATION_STARTED,       // an operation's request was admitted/started
        OPERATION_COMPLETED,     // an operation's HTTP call completed (transport result)
        STORE_MUTATION_APPLIED,  // an intermediate durable write under a current lease (not terminal)
        STORE_MUTATION_FENCED,   // an attempted durable write discarded because the lease went stale
        LOGICAL_OUTCOME,         // the SINGLE terminal logical/evidence verdict for a logical op
        AUTHORITY_TRANSITION,    // control: active authority changed / initial binding
        FENCE_ADVANCED           // control: fence epoch advanced (transition landed)
    }

    private final int capacity;

    /** Process-scoped recorder epoch. A new value each construction exposes process discontinuity. */
    private final String recorderEpoch = UUID.randomUUID().toString();

    /** Global append-time sequence (assigned under lock in {@link #append}). */
    private long appendSequence = 0;
    /** Correlation-id source for per-request (transport) records. */
    private final AtomicLong requestSeq = new AtomicLong(0);
    /** Correlation-id source for logical operations (acquisition / probe). */
    private final AtomicLong logicalSeq = new AtomicLong(0);
    /** Live concurrency across ALL authorities (started-but-not-completed operations). */
    private final AtomicInteger inFlight = new AtomicInteger(0);

    private final ArrayDeque<Event> buffer = new ArrayDeque<>();
    private long eventsDropped;
    private long recorderErrors;
    /**
     * Discontinuity is tracked as OUT-OF-BAND metadata, never as an in-band buffer record
     * (review-3 correction). An in-band discontinuity record competed for buffer slots and
     * could be physically inserted out of append-sequence order relative to the record whose
     * eviction triggered it (guaranteed at capacity 1). Instead we surface the discontinuity
     * via {@code eventsDropped} + {@code bufferDiscontinuity} + {@code firstDiscontinuitySequence}
     * in the page. Combined with {@code oldestRetainedSequence} against the unified sequence,
     * an observer detects loss of ANY record type — with the physical buffer ALWAYS in strict
     * append-sequence order.
     */
    private boolean discontinuityFlagged;
    /** The append sequence at/around which the first eviction occurred (0 = none). */
    private long firstDiscontinuitySequence;

    public ObservationRecorder() {
        this(DEFAULT_CAPACITY);
    }

    public ObservationRecorder(int capacity) {
        if (capacity < 1) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
        appendControl(RecordType.RECORDER_STARTED, null, 0L, null, "recorder epoch " + recorderEpoch);
    }

    public String recorderEpoch() { return recorderEpoch; }

    /**
     * Begin an operation. Appends an {@code OPERATION_STARTED} record immediately (so the
     * start is visible/ordered on the unified stream) and returns an opaque handle whose
     * {@code operationId} correlates the later COMPLETED + LOGICAL_OUTCOME records.
     *
     * <p><b>Captured epoch (review-2 correction):</b> {@code authorityEpoch} is the epoch
     * CAPTURED with the lease/control decision that authorized this operation — NOT read
     * from the manager at dispatch time. An operation authorized before a transition is
     * recorded with its old epoch, never old-authority + new-epoch.
     */
    /** Mint a fresh logical-operation id for one acquisition or probe (shared by its requests). */
    public String newLogicalOperationId(Purpose purpose) {
        String tag = purpose == Purpose.RECOVERY_PROBE ? "probe" : "acq";
        return tag + "-" + logicalSeq.incrementAndGet();
    }

    /**
     * Begin ONE HTTP/provider request within a logical operation. {@code logicalOperationId}
     * is shared across all requests of the acquisition/probe; a distinct {@code requestId} is
     * minted for this request. Appends an OPERATION_STARTED record and returns the handle.
     */
    public OperationHandle beginOperation(String logicalOperationId,
                                          Purpose purpose,
                                          String authorityId,
                                          long authorityEpoch,
                                          String operationKind,
                                          String subject,
                                          String opaqueProvenance,
                                          AdmissionWaitReason admissionWaitReason,
                                          long admissionWaitMs) {
        String requestId = "req-" + requestSeq.incrementAndGet();
        int concurrency;
        try {
            concurrency = inFlight.incrementAndGet();
        } catch (RuntimeException e) {
            concurrency = -1;
        }
        long startNs = System.nanoTime();
        OperationHandle h = new OperationHandle(logicalOperationId, requestId, purpose, authorityId,
            authorityEpoch, operationKind, subject, opaqueProvenance, admissionWaitReason,
            admissionWaitMs, startNs);
        synchronized (this) {
            try {
                append(new Event(RecordType.OPERATION_STARTED, logicalOperationId, requestId,
                    purpose.name(), authorityId, authorityEpoch, operationKind, subject, opaqueProvenance,
                    admissionWaitReason.name(), admissionWaitMs, startNs, safeNow(),
                    null, null, null, null, null, concurrency));
            } catch (RuntimeException e) {
                recorderErrors++;
            }
        }
        return h;
    }

    /**
     * Append the transport-level COMPLETED record for an operation. Does NOT emit the
     * logical outcome — the caller emits that separately (so an HTTP 200 that later fails
     * normalization is never conflated with usable evidence).
     */
    public synchronized void completeOperation(OperationHandle h,
                                               HttpResult httpResult,
                                               Integer httpStatus,
                                               Long providerBackoffMs) {
        if (h == null) return; // measurement safety
        try {
            inFlight.decrementAndGet();
            long completeNs = System.nanoTime();
            // EXACT httpStatus is preserved, INCLUDING successful responses (200), so an
            // observer can identify e.g. the first non-401 production response.
            append(new Event(RecordType.OPERATION_COMPLETED, h.logicalOperationId, h.requestId,
                h.purpose.name(), h.authorityId, h.authorityEpoch, h.operationKind, h.subject,
                h.opaqueProvenance, h.admissionWaitReason.name(), h.admissionWaitMs, completeNs, safeNow(),
                Math.max(0, completeNs - h.startNs), httpResult.name(), httpStatus, providerBackoffMs,
                null, null));
        } catch (RuntimeException e) {
            recorderErrors++;
        }
    }

    /**
     * Append an INTERMEDIATE store-mutation record (a durable write committed under a current
     * lease) — NOT the terminal verdict. One acquisition may commit a primary chain plus
     * several secondary-expiration chains; each is a STORE_MUTATION_APPLIED, and exactly one
     * terminal LOGICAL_OUTCOME is recorded for the whole logical operation.
     */
    public synchronized void recordStoreMutation(String logicalOperationId, String authorityId,
                                                 long authorityEpoch, String subject, String operationKind) {
        try {
            append(new Event(RecordType.STORE_MUTATION_APPLIED, logicalOperationId, null, null,
                authorityId, authorityEpoch, operationKind, subject, null, null, 0,
                System.nanoTime(), safeNow(), null, null, null, null, null, null));
        } catch (RuntimeException e) {
            recorderErrors++;
        }
    }

    /**
     * Append an intermediate STORE_MUTATION_FENCED record — an attempted durable write that was
     * DISCARDED because its lease became stale (an authority transition landed). Correlated to
     * the same logical operation + subject so a discarded stale-lease mutation never vanishes
     * from the observer (review-4 #3). This is intermediate, not a terminal verdict.
     */
    public synchronized void recordStoreMutationFenced(String logicalOperationId, String authorityId,
                                                       long authorityEpoch, String subject, String operationKind) {
        try {
            append(new Event(RecordType.STORE_MUTATION_FENCED, logicalOperationId, null, null,
                authorityId, authorityEpoch, operationKind, subject, null, null, 0,
                System.nanoTime(), safeNow(), null, null, null, null, null, null));
        } catch (RuntimeException e) {
            recorderErrors++;
        }
    }

    /**
     * Append the terminal LOGICAL outcome for an operation, correlated by operationId +
     * subject. This is the authoritative evidence-level signal (committed/rejected/fenced/
     * probe-usable/probe-unusable) — an observer must use THIS, not HTTP status, to judge
     * usable-evidence yield.
     */
    public synchronized void recordLogicalOutcome(OperationHandle h, LogicalOutcome outcome) {
        if (h == null) return;
        try {
            append(new Event(RecordType.LOGICAL_OUTCOME, h.logicalOperationId, null, h.purpose.name(),
                h.authorityId, h.authorityEpoch, h.operationKind, h.subject, h.opaqueProvenance,
                null, 0, System.nanoTime(), safeNow(), null, null, null, null, outcome.name(), null));
        } catch (RuntimeException e) {
            recorderErrors++;
        }
    }

    /**
     * Append the SINGLE terminal LOGICAL outcome for a logical operation, by its
     * {@code logicalOperationId} + subject, when no live handle is available (e.g. the terminal
     * acquisition verdict recorded at the end of a multi-request acquisition, or a fence at the
     * commit boundary). Correlates to the same logicalOperationId as all its request records.
     */
    public synchronized void recordLogicalOutcome(String logicalOperationId, String authorityId,
                                                  long authorityEpoch, String subject,
                                                  Purpose purpose, LogicalOutcome outcome) {
        try {
            append(new Event(RecordType.LOGICAL_OUTCOME, logicalOperationId, null,
                purpose == null ? null : purpose.name(), authorityId, authorityEpoch,
                null, subject, null, null, 0, System.nanoTime(), safeNow(),
                null, null, null, null, outcome.name(), null));
        } catch (RuntimeException e) {
            recorderErrors++;
        }
    }

    /** Append an authority/fence control event. Never throws. */
    public synchronized void appendControl(RecordType kind, String authorityId,
                                           long authorityEpoch, String subject, String detail) {
        try {
            append(new Event(kind, null, null, null, authorityId, authorityEpoch, null, subject,
                detail, null, 0, System.nanoTime(), safeNow(), null, null, null, null, null, null));
        } catch (RuntimeException e) {
            recorderErrors++;
        }
    }

    /**
     * Read a page of the unified stream strictly after {@code afterSequence}. The returned
     * records' sequences are safe to acknowledge as a cursor: every record is already
     * appended (never in-flight), so advancing past the maximum returned sequence cannot
     * skip an unappended earlier record.
     */
    public synchronized ObservationPage page(long afterSequence, int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 10_000));
        List<Event> out = new ArrayList<>();
        for (Event e : buffer) {
            if (e.sequence() > afterSequence) {
                out.add(e);
                if (out.size() >= limit) break;
            }
        }
        Long oldest = buffer.isEmpty() ? null : buffer.peekFirst().sequence();
        Long newest = buffer.isEmpty() ? null : buffer.peekLast().sequence();

        // PRECISE per-cursor gap (review-4 #4): a gap exists for THIS requested cursor iff a
        // record with sequence in (afterSequence, oldestRetainedSequence) was evicted — i.e. the
        // consumer's next-needed record (afterSequence + 1) is older than what we still retain.
        //   - Empty buffer: no basis to claim a gap for this cursor → false.
        //   - Cursor N with oldest N+1: CONTIGUOUS (the next record is retained) → false.
        //   - Cursor N with oldest > N+1: the records in (N, oldest) were evicted → GAP → true.
        // This replaces reliance on the sticky global bufferDiscontinuity flag; that flag +
        // firstDiscontinuitySequence + eventsDropped remain as diagnostics only.
        boolean gapForRequestedCursor = oldest != null && afterSequence + 1 < oldest;

        return new ObservationPage(recorderEpoch, appendSequence, oldest, newest,
            eventsDropped, recorderErrors, inFlight.get(),
            gapForRequestedCursor, discontinuityFlagged,
            firstDiscontinuitySequence == 0 ? null : firstDiscontinuitySequence, out);
    }

    // --- internal append (caller holds the monitor) ---

    private void append(Event partial) {
        // Assign the append-time sequence. Make room FIRST (evict oldest), THEN append the new
        // record — so the buffer's physical order is ALWAYS exactly append-sequence order.
        // Discontinuity is recorded as out-of-band metadata (never an in-band record that could
        // reorder relative to its trigger), which also makes capacity 1 correct.
        long seq = ++appendSequence;
        while (buffer.size() >= capacity) {
            buffer.removeFirst();
            eventsDropped++;
            if (!discontinuityFlagged) {
                discontinuityFlagged = true;
                firstDiscontinuitySequence = seq; // the append at which loss first occurred
            }
        }
        buffer.addLast(partial.withSequence(seq));
    }

    private static String safeNow() {
        try {
            return Instant.now().toString();
        } catch (RuntimeException e) {
            return null;
        }
    }

    /** Opaque in-flight operation handle. Carries the CAPTURED authority epoch. */
    public static final class OperationHandle {
        final String logicalOperationId;
        final String requestId;
        final Purpose purpose;
        final String authorityId;
        final long authorityEpoch;
        final String operationKind;
        final String subject;
        final String opaqueProvenance;
        final AdmissionWaitReason admissionWaitReason;
        final long admissionWaitMs;
        final long startNs;

        OperationHandle(String logicalOperationId, String requestId, Purpose purpose, String authorityId,
                        long authorityEpoch, String operationKind, String subject, String opaqueProvenance,
                        AdmissionWaitReason admissionWaitReason, long admissionWaitMs, long startNs) {
            this.logicalOperationId = logicalOperationId;
            this.requestId = requestId;
            this.purpose = purpose;
            this.authorityId = authorityId;
            this.authorityEpoch = authorityEpoch;
            this.operationKind = operationKind;
            this.subject = subject;
            this.opaqueProvenance = opaqueProvenance;
            this.admissionWaitReason = admissionWaitReason;
            this.admissionWaitMs = admissionWaitMs;
            this.startNs = startNs;
        }

        public String logicalOperationId() { return logicalOperationId; }
        public String requestId() { return requestId; }
        public String authorityId() { return authorityId; }
        public long authorityEpoch() { return authorityEpoch; }
        public String subject() { return subject; }
        public Purpose purpose() { return purpose; }
    }

    /**
     * A single frozen record on the unified append-only stream. Provider-neutral:
     * authorityId and opaqueProvenance are opaque to observer interpretation. Fields not
     * relevant to a record type are null/0.
     */
    public record Event(
        long sequence,               // append-time global monotonic sequence
        String recordType,
        String logicalOperationId,   // shared across ALL records of ONE acquisition/probe
        String requestId,            // distinct per HTTP/provider request (transport records)
        String purpose,
        String authorityId,
        long authorityEpoch,         // CAPTURED epoch (not dispatch-time)
        String operationKind,
        String subject,
        String detailOrProvenance,   // opaque provenance (operations) or detail (control)
        String admissionWaitReason,
        long admissionWaitMs,
        long monotonicNs,
        String atUtc,
        Long durationNs,             // OPERATION_COMPLETED only
        String httpResult,           // OPERATION_COMPLETED only
        Integer httpStatus,          // OPERATION_COMPLETED / STORE_MUTATION exact status
        Long providerBackoffMs,      // OPERATION_COMPLETED only (429)
        String logicalOutcome,       // LOGICAL_OUTCOME only
        Integer concurrencyAtStart   // OPERATION_STARTED only (global in-flight at start)
    ) {
        // Convenience constructor used before the append-time sequence is known.
        Event(RecordType type, String logicalOperationId, String requestId, String purpose,
              String authorityId, long authorityEpoch, String operationKind, String subject,
              String detailOrProvenance, String admissionWaitReason, long admissionWaitMs,
              long monotonicNs, String atUtc, Long durationNs, String httpResult, Integer httpStatus,
              Long providerBackoffMs, String logicalOutcome, Integer concurrencyAtStart) {
            this(-1L, type.name(), logicalOperationId, requestId, purpose, authorityId, authorityEpoch,
                operationKind, subject, detailOrProvenance, admissionWaitReason, admissionWaitMs,
                monotonicNs, atUtc, durationNs, httpResult, httpStatus, providerBackoffMs,
                logicalOutcome, concurrencyAtStart);
        }

        Event withSequence(long seq) {
            return new Event(seq, recordType, logicalOperationId, requestId, purpose, authorityId,
                authorityEpoch, operationKind, subject, detailOrProvenance, admissionWaitReason,
                admissionWaitMs, monotonicNs, atUtc, durationNs, httpResult, httpStatus,
                providerBackoffMs, logicalOutcome, concurrencyAtStart);
        }
    }

    /**
     * A page of the authoritative unified stream. {@code oldestRetainedSequence} is against
     * the UNIFIED sequence (any record type), so a consumer whose cursor falls below it —
     * or that sees a changed {@code recorderEpoch}, or {@code bufferDiscontinuity} true —
     * knows it lost events of some kind. {@code highWaterSequence} is diagnostic only and
     * must NOT be used as a safe consumption cursor (use the max sequence actually returned).
     */
    public record ObservationPage(
        String recorderEpoch,
        long highWaterSequence,
        Long oldestRetainedSequence,
        Long newestRetainedSequence,
        long eventsDropped,
        long recorderErrors,
        int inFlightCount,
        boolean gapForRequestedCursor,    // PRECISE per-cursor loss signal (review-4 #4)
        boolean bufferDiscontinuity,      // diagnostic: recorder has EVER evicted (sticky, global)
        Long firstDiscontinuitySequence,  // diagnostic: append seq at first eviction (null = none)
        List<Event> events
    ) {}
}
