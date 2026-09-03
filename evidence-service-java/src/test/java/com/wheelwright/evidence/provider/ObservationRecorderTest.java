package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER observer correction (review 3): unified append-only recorder with
 * physical-order == append-sequence order across eviction (incl capacity 1), shared
 * logicalOperationId correlation, exactly-one terminal outcome semantics, and exact HTTP
 * status preservation (including success). Provider identity is opaque throughout.
 */
class ObservationRecorderTest {

    private ObservationRecorder.OperationHandle begin(ObservationRecorder r, String logicalId,
            ObservationRecorder.Purpose purpose, String authorityId, long epoch,
            String kind, String subject, ObservationRecorder.AdmissionWaitReason wait, long waitMs) {
        return r.beginOperation(logicalId, purpose, authorityId, epoch, kind, subject, authorityId, wait, waitMs);
    }

    private List<ObservationRecorder.Event> ofType(List<ObservationRecorder.Event> evs, ObservationRecorder.RecordType t) {
        return evs.stream().filter(e -> e.recordType().equals(t.name())).toList();
    }

    @Test
    void physicalOrderEqualsAppendSequenceOrder() {
        var r = new ObservationRecorder();
        for (int i = 0; i < 5; i++) {
            String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
            var h = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "S" + i,
                ObservationRecorder.AdmissionWaitReason.NONE, 0);
            r.completeOperation(h, ObservationRecorder.HttpResult.SUCCESS, 200, null);
            r.recordLogicalOutcome(h, ObservationRecorder.LogicalOutcome.ACQUISITION_COMMITTED);
        }
        long prev = -1;
        for (var e : r.page(0, 10_000).events()) {
            assertTrue(e.sequence() > prev, "physical stream order must equal append-sequence order");
            prev = e.sequence();
        }
    }

    @Test
    void capacityOneNeverInvertsOrderAndPagingSkipsNothingBeyondDiscontinuity() {
        // Capacity 1 is the adversarial case for the old in-band discontinuity record. Prove:
        // (a) buffer never exceeds 1; (b) the single retained record's sequence is monotonic
        // across appends; (c) discontinuity is surfaced as metadata (not an out-of-order record).
        var r = new ObservationRecorder(1);
        long lastSeen = 0;
        for (int i = 0; i < 10; i++) {
            String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
            var h = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "S" + i,
                ObservationRecorder.AdmissionWaitReason.NONE, 0);
            r.completeOperation(h, ObservationRecorder.HttpResult.SUCCESS, 200, null);
            var page = r.page(lastSeen, 10_000);
            assertTrue(page.events().size() <= 1, "capacity-1 buffer must never exceed 1 record");
            for (var e : page.events()) {
                assertTrue(e.sequence() >= lastSeen, "no record delivered out of append order");
                lastSeen = Math.max(lastSeen, e.sequence());
            }
        }
        var page = r.page(0, 10_000);
        assertTrue(page.eventsDropped() > 0);
        assertTrue(page.bufferDiscontinuity());
        assertNotNull(page.firstDiscontinuitySequence());
        // No in-band discontinuity record exists to reorder — discontinuity is pure metadata.
        assertTrue(page.events().stream().noneMatch(e -> e.recordType().contains("DISCONTINUITY")));
    }

    @Test
    void cursorIsSafeUnderOutOfOrderCompletion() {
        var r = new ObservationRecorder();
        String la = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        String lb = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        var a = begin(r, la, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "AAA",
            ObservationRecorder.AdmissionWaitReason.NONE, 0);
        var b = begin(r, lb, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "BBB",
            ObservationRecorder.AdmissionWaitReason.NONE, 0);
        r.completeOperation(b, ObservationRecorder.HttpResult.SUCCESS, 200, null); // B first
        var firstPage = r.page(0, 1000);
        long cursor = firstPage.events().get(firstPage.events().size() - 1).sequence();
        r.completeOperation(a, ObservationRecorder.HttpResult.SUCCESS, 200, null); // A later
        var nextPage = r.page(cursor, 1000);
        boolean aCompleteAfterCursor = nextPage.events().stream().anyMatch(e ->
            e.recordType().equals(ObservationRecorder.RecordType.OPERATION_COMPLETED.name())
            && la.equals(e.logicalOperationId()));
        assertTrue(aCompleteAfterCursor, "A's later completion delivered after the cursor — never skipped");
    }

    @Test
    void logicalOperationIdCorrelatesRequestsAndTerminalVerdict() {
        // One acquisition, three HTTP requests, one terminal verdict — all share the logical id;
        // each request has its own distinct requestId.
        var r = new ObservationRecorder();
        String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        java.util.Set<String> requestIds = new java.util.HashSet<>();
        for (String kind : List.of("quote", "expirations", "chain")) {
            var h = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, kind, "SPY",
                ObservationRecorder.AdmissionWaitReason.NONE, 0);
            requestIds.add(h.requestId());
            r.completeOperation(h, ObservationRecorder.HttpResult.SUCCESS, 200, null);
        }
        r.recordLogicalOutcome(lid, "prod", 1, "SPY", ObservationRecorder.Purpose.ACTIVE_ACQUISITION,
            ObservationRecorder.LogicalOutcome.ACQUISITION_COMMITTED);

        var events = r.page(0, 1000).events();
        long sharingLogical = events.stream()
            .filter(e -> lid.equals(e.logicalOperationId())).count();
        assertEquals(3 + 3 + 1, sharingLogical, "3 STARTED + 3 COMPLETED + 1 terminal share the logical id");
        assertEquals(3, requestIds.size(), "each HTTP request has a distinct requestId");
        var terminal = ofType(events, ObservationRecorder.RecordType.LOGICAL_OUTCOME);
        assertEquals(1, terminal.size(), "exactly one terminal verdict");
        assertEquals(lid, terminal.get(0).logicalOperationId());
    }

    @Test
    void exactHttpStatusIsPreservedIncludingSuccess() {
        // The observer must preserve exact status, including 200, so the first non-401
        // production response is identifiable.
        var r = new ObservationRecorder();
        String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        var h401 = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "SPY",
            ObservationRecorder.AdmissionWaitReason.NONE, 0);
        r.completeOperation(h401, ObservationRecorder.HttpResult.PROVIDER_UNUSABLE, 401, null);
        var h200 = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "SPY",
            ObservationRecorder.AdmissionWaitReason.NONE, 0);
        r.completeOperation(h200, ObservationRecorder.HttpResult.SUCCESS, 200, null);

        var completed = ofType(r.page(0, 1000).events(), ObservationRecorder.RecordType.OPERATION_COMPLETED);
        assertEquals(401, completed.get(0).httpStatus());
        assertEquals(200, completed.get(1).httpStatus(), "successful status must be preserved exactly");
        // First non-401 is identifiable from the stream.
        var firstNon401 = completed.stream().filter(e -> e.httpStatus() != null && e.httpStatus() != 401).findFirst();
        assertTrue(firstNon401.isPresent() && firstNon401.get().httpStatus() == 200);
    }

    @Test
    void intermediateStoreMutationsAreDistinctFromTerminalOutcome() {
        var r = new ObservationRecorder();
        String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        // Two intermediate store mutations (primary + one secondary chain)...
        r.recordStoreMutation(lid, "prod", 1, "SPY", "chain");
        r.recordStoreMutation(lid, "prod", 1, "SPY", "chain");
        // ...and exactly one terminal outcome.
        r.recordLogicalOutcome(lid, "prod", 1, "SPY", ObservationRecorder.Purpose.ACTIVE_ACQUISITION,
            ObservationRecorder.LogicalOutcome.ACQUISITION_COMMITTED);
        var events = r.page(0, 1000).events();
        assertEquals(2, ofType(events, ObservationRecorder.RecordType.STORE_MUTATION_APPLIED).size());
        assertEquals(1, ofType(events, ObservationRecorder.RecordType.LOGICAL_OUTCOME).size());
    }

    @Test
    void rateLimitedBackoffAndAdmissionWaitAreObservable() {
        var r = new ObservationRecorder();
        String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        var h = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "SPY",
            ObservationRecorder.AdmissionWaitReason.PROVIDER_BACKOFF, 1000);
        r.completeOperation(h, ObservationRecorder.HttpResult.RATE_LIMITED, 429, 60_000L);
        var events = r.page(0, 100).events();
        var started = ofType(events, ObservationRecorder.RecordType.OPERATION_STARTED).get(0);
        assertEquals("PROVIDER_BACKOFF", started.admissionWaitReason());
        assertEquals(1000, started.admissionWaitMs());
        var completed = ofType(events, ObservationRecorder.RecordType.OPERATION_COMPLETED).get(0);
        assertEquals("RATE_LIMITED", completed.httpResult());
        assertEquals(429, completed.httpStatus());
        assertEquals(60_000L, completed.providerBackoffMs());
    }

    @Test
    void capturedEpochTravelsWithTheOperation() {
        var r = new ObservationRecorder();
        String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        var h = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "sandbox", 7, "chain", "SPY",
            ObservationRecorder.AdmissionWaitReason.NONE, 0);
        r.completeOperation(h, ObservationRecorder.HttpResult.SUCCESS, 200, null);
        var started = ofType(r.page(0, 100).events(), ObservationRecorder.RecordType.OPERATION_STARTED).get(0);
        assertEquals(7, started.authorityEpoch());
        assertEquals("sandbox", started.authorityId());
    }

    @Test
    void recorderFaultsNeverThrow() {
        var r = new ObservationRecorder();
        assertDoesNotThrow(() -> r.completeOperation(null, ObservationRecorder.HttpResult.SUCCESS, 200, null));
        assertDoesNotThrow(() -> r.recordLogicalOutcome((ObservationRecorder.OperationHandle) null,
            ObservationRecorder.LogicalOutcome.ACQUISITION_COMMITTED));
    }

    // --- review-4 #4: precise per-cursor gap boundary semantics ---

    private void appendOne(ObservationRecorder r) {
        String lid = r.newLogicalOperationId(ObservationRecorder.Purpose.ACTIVE_ACQUISITION);
        var h = begin(r, lid, ObservationRecorder.Purpose.ACTIVE_ACQUISITION, "prod", 1, "chain", "S",
            ObservationRecorder.AdmissionWaitReason.NONE, 0);
        r.completeOperation(h, ObservationRecorder.HttpResult.SUCCESS, 200, null);
    }

    @Test
    void gapForRequestedCursor_contiguousCursorHasNoGap() {
        var r = new ObservationRecorder(100); // large enough: nothing evicted
        for (int i = 0; i < 5; i++) appendOne(r);
        // Cursor at the newest sequence: empty page, no gap.
        long newest = r.page(0, 1000).newestRetainedSequence();
        var atNewest = r.page(newest, 1000);
        assertTrue(atNewest.events().isEmpty(), "cursor at newest -> empty page");
        assertFalse(atNewest.gapForRequestedCursor(), "cursor at newest is contiguous, no gap");
        // Cursor = oldest - 1 (contiguous): the next record is retained -> no gap.
        long oldest = r.page(0, 1000).oldestRetainedSequence();
        assertFalse(r.page(oldest - 1, 1000).gapForRequestedCursor(), "cursor N with oldest N+1 is contiguous");
        // Cursor 0 with nothing evicted: contiguous (oldest is 1) -> no gap.
        assertFalse(r.page(0, 1000).gapForRequestedCursor(), "no eviction -> no gap for cursor 0");
    }

    @Test
    void gapForRequestedCursor_actualGapAfterEviction() {
        var r = new ObservationRecorder(3); // small: forces eviction
        for (int i = 0; i < 10; i++) appendOne(r);
        long oldest = r.page(0, 1000).oldestRetainedSequence();
        // A stale cursor well before what we retain -> gap for THIS cursor.
        var stale = r.page(0, 1000);
        assertTrue(stale.gapForRequestedCursor(), "cursor 0 after eviction, oldest>1 -> gap");
        // But a cursor exactly at oldest-1 is still contiguous even after eviction.
        assertFalse(r.page(oldest - 1, 1000).gapForRequestedCursor(),
            "cursor == oldest-1 is contiguous regardless of prior eviction");
        // A cursor at oldest-2 (one before contiguous) IS a gap.
        assertTrue(r.page(oldest - 2, 1000).gapForRequestedCursor(), "cursor < oldest-1 -> gap");
        // Diagnostics still present.
        assertTrue(stale.bufferDiscontinuity());
        assertTrue(stale.eventsDropped() > 0);
        assertNotNull(stale.firstDiscontinuitySequence());
    }

    @Test
    void gapForRequestedCursor_emptyRecorderHasNoGap() {
        var r = new ObservationRecorder(); // only the RECORDER_STARTED control record exists
        // Cursor beyond everything: empty page, no gap.
        long newest = r.page(0, 1000).newestRetainedSequence();
        assertFalse(r.page(newest, 1000).gapForRequestedCursor());
    }

    @Test
    void gapForRequestedCursor_capacityOneEviction() {
        var r = new ObservationRecorder(1);
        for (int i = 0; i < 5; i++) appendOne(r);
        var page = r.page(0, 1000);
        assertEquals(1, page.events().size(), "capacity-1 retains exactly one");
        assertTrue(page.gapForRequestedCursor(), "cursor 0 with a single late record retained -> gap");
        long oldest = page.oldestRetainedSequence();
        assertFalse(r.page(oldest - 1, 1000).gapForRequestedCursor(), "contiguous cursor even at capacity 1");
    }

    @Test
    void recorderEpochChangeIsDetectableAcrossInstances() {
        var r1 = new ObservationRecorder();
        var r2 = new ObservationRecorder();
        assertNotEquals(r1.recorderEpoch(), r2.recorderEpoch(),
            "a new recorder instance (process restart) has a distinct epoch a consumer can detect");
    }
}
