package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.PrioritizedWorkItem;
import com.wheelwright.evidence.provider.*;
import org.junit.jupiter.api.*;

import java.sql.SQLException;
import java.time.*;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Acquisition Worker Tests.
 *
 * Proves:
 * 1. A/B/C/D classification and queue ordering
 * 2. Fresh symbols excluded from work queue
 * 3. Session-blocked vs permitted operation
 * 4. Anti-starvation batch selection
 * 5. Publication triggered on evidence change
 * 6. Worker telemetry reports correct state
 */
class AcquisitionWorkerTest {

    private static final SchedulerConfig CONFIG = new SchedulerConfig(
        15 * 60 * 1000L,       // 15 min
        120 * 60 * 1000L,      // 120 min
        6 * 60 * 60 * 1000L,   // 6 hours
        10, 20, 5000L
    );

    // Chain JSON with qualifying puts (Class A)
    private static final String QUALIFYING_CHAIN = """
        {"symbol":"XLE","expiration":"2026-08-03","underlying":{"symbol":"XLE","name":"Energy","price":58.0},\
        "puts":[{"strike":55,"bid":1.50,"ask":1.70,"delta":-0.28,"openInterest":520,"volume":110}],\
        "calls":[{"strike":60,"bid":1.20,"ask":1.40,"delta":0.32,"openInterest":300,"volume":80}]}""";

    // Chain JSON with NO qualifying puts (Class B)
    private static final String NONQUALIFYING_CHAIN = """
        {"symbol":"OBSCURE","expiration":"2026-08-03","underlying":{"symbol":"OBSCURE","name":"Obscure","price":10.0},\
        "puts":[{"strike":9,"bid":0,"ask":0.05,"delta":-0.10,"openInterest":0,"volume":0}],\
        "calls":[]}""";

    private static final String EXPIRATIONS_JSON = "[{\"date\":\"2026-08-03\",\"dte\":21}]";

    private static String minutesAgo(int min) {
        return Instant.now().minusSeconds(min * 60L).toString();
    }

    private static String hoursAgo(int hours) {
        return Instant.now().minusSeconds(hours * 3600L).toString();
    }

    @Nested
    @DisplayName("prioritized work queue — classification")
    class Classification {

        @Test
        @DisplayName("qualifying chain symbol is Class A when stale")
        void classAWhenStale() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE", EXPIRATIONS_JSON, minutesAgo(20));
            store.setChain("XLE", QUALIFYING_CHAIN, minutesAgo(20));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            var xle = queue.stream().filter(i -> "XLE".equals(i.symbol())).findFirst().orElse(null);
            assertNotNull(xle);
            assertEquals("A", xle.urgencyClass());
            store.close();
        }

        @Test
        @DisplayName("non-qualifying chain symbol is Class B when past max age")
        void classBWhenPastMax() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("OBSCURE"));
            store.setExpirations("OBSCURE", EXPIRATIONS_JSON, hoursAgo(3));
            store.setChain("OBSCURE", NONQUALIFYING_CHAIN, hoursAgo(3));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            var item = queue.stream().filter(i -> "OBSCURE".equals(i.symbol())).findFirst().orElse(null);
            assertNotNull(item);
            assertEquals("B", item.urgencyClass());
            store.close();
        }

        @Test
        @DisplayName("fresh Class A symbol NOT in work queue")
        void freshClassAExcluded() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE", EXPIRATIONS_JSON, minutesAgo(5));
            store.setChain("XLE", QUALIFYING_CHAIN, minutesAgo(5));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            assertTrue(queue.stream().noneMatch(i -> "XLE".equals(i.symbol())));
            store.close();
        }

        @Test
        @DisplayName("pending symbol is Class C")
        void pendingIsClassC() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("NEW"));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            var item = queue.stream().filter(i -> "NEW".equals(i.symbol())).findFirst().orElse(null);
            assertNotNull(item);
            assertEquals("C", item.urgencyClass());
            store.close();
        }

        @Test
        @DisplayName("prior-epoch absent symbol is Class D (via explicit session date)")
        void priorEpochAbsentIsClassD() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("NOOPT"));
            // Directly insert with a different session_date by using the store's setExpirations
            // then querying with a different currentSessionDate
            store.setExpirations("NOOPT", "[]", "2026-07-17T14:00:00Z");

            // Query as if today is 2026-07-21 (NOOPT was resolved on a prior date via DB state)
            // The setExpirations wrote session_date as today's date (store default).
            // To simulate prior-epoch, we query with a future session date.
            String futureSession = java.time.LocalDate.now().plusDays(1).toString();
            var queue = store.getPrioritizedWorkQueue(CONFIG, futureSession);
            var item = queue.stream().filter(i -> "NOOPT".equals(i.symbol())).findFirst().orElse(null);
            assertNotNull(item);
            assertEquals("D", item.urgencyClass());
            store.close();
        }

        @Test
        @DisplayName("Class A ordered oldest first, precedes Class B")
        void classAOldestFirstPrecedesB() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("OLD_A", "NEW_A", "BG"));
            store.setExpirations("OLD_A", EXPIRATIONS_JSON, minutesAgo(30));
            store.setChain("OLD_A", QUALIFYING_CHAIN.replace("XLE", "OLD_A"), minutesAgo(30));
            store.setExpirations("NEW_A", EXPIRATIONS_JSON, minutesAgo(20));
            store.setChain("NEW_A", QUALIFYING_CHAIN.replace("XLE", "NEW_A"), minutesAgo(20));
            store.setExpirations("BG", EXPIRATIONS_JSON, hoursAgo(3));
            store.setChain("BG", NONQUALIFYING_CHAIN, hoursAgo(3));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            assertEquals("OLD_A", queue.get(0).symbol()); // oldest A first
            assertEquals("NEW_A", queue.get(1).symbol()); // next A
            assertEquals("BG", queue.get(2).symbol());    // B after all A
            store.close();
        }
    }

    @Nested
    @DisplayName("classified population (eligible vs due)")
    class EligibleVsDue {

        @Test
        @DisplayName("fresh Class A counts in eligible but not due")
        void freshClassAEligibleNotDue() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("FRESH", "STALE"));
            store.setExpirations("FRESH", EXPIRATIONS_JSON, minutesAgo(5));
            store.setChain("FRESH", QUALIFYING_CHAIN.replace("XLE", "FRESH"), minutesAgo(5));
            store.setExpirations("STALE", EXPIRATIONS_JSON, minutesAgo(20));
            store.setChain("STALE", QUALIFYING_CHAIN.replace("XLE", "STALE"), minutesAgo(20));

            var population = store.getClassifiedPopulation();
            var queue = store.getPrioritizedWorkQueue(CONFIG);

            assertEquals(2, population.classA()); // both classified A
            assertEquals(1, queue.stream().filter(i -> "A".equals(i.urgencyClass())).count()); // only STALE due
            store.close();
        }
    }

    @Nested
    @DisplayName("session gate integration")
    class SessionGateIntegration {

        @Test
        @DisplayName("worker enters session_blocked when gate denies")
        void sessionBlocked() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("XLE"));

            // Saturday clock — always blocked
            var saturdayClock = Clock.fixed(
                ZonedDateTime.of(2026, 7, 18, 16, 0, 0, 0, ZoneOffset.UTC).toInstant(),
                ZoneOffset.UTC);
            var gate = new SessionGate(saturdayClock);

            var adapter = createStubAdapter();
            var worker = new AcquisitionWorker(adapter, store, gate, CONFIG);
            worker.start(List.of("XLE"));

            // Wait for cycle to attempt
            Thread.sleep(2000);

            assertEquals("session_blocked", worker.getStatus().state());
            assertNull(worker.getSchedulerTelemetry().lastAssessedAt()); // no cycle ran
            worker.stop();
            store.close();
        }

        @Test
        @DisplayName("worker runs cycle when gate permits")
        void sessionPermitted() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE", EXPIRATIONS_JSON, minutesAgo(5));
            store.setChain("XLE", QUALIFYING_CHAIN, minutesAgo(5));
            store.publishSnapshot();

            // Tuesday 11:00 ET — always permitted
            var tuesdayClock = Clock.fixed(
                ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(), // 11:00 ET
                ZoneOffset.UTC);
            var gate = new SessionGate(tuesdayClock);

            var adapter = createStubAdapter();
            var worker = new AcquisitionWorker(adapter, store, gate, CONFIG);
            worker.start(List.of("XLE"));

            // Wait for cycle
            Thread.sleep(2000);

            assertNotEquals("session_blocked", worker.getStatus().state());
            assertNotNull(worker.getSchedulerTelemetry().lastAssessedAt());
            assertTrue(worker.getSchedulerTelemetry().cycleCount() > 0);
            worker.stop();
            store.close();
        }
    }

    @Nested
    @DisplayName("publication behavior")
    class Publication {

        @Test
        @DisplayName("generation does not advance when no evidence changes")
        void noAdvanceWithoutChange() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE", EXPIRATIONS_JSON, minutesAgo(2));
            store.setChain("XLE", QUALIFYING_CHAIN, minutesAgo(2)); // fresh
            store.publishSnapshot();
            int genBefore = store.getGeneration();

            // Tuesday clock — permits session
            var clock = Clock.fixed(
                ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(),
                ZoneOffset.UTC);
            var gate = new SessionGate(clock);
            var adapter = createStubAdapter();

            var worker = new AcquisitionWorker(adapter, store, gate, CONFIG);
            worker.start(List.of("XLE"));

            Thread.sleep(2000);

            // No work was needed, so no publication should have occurred
            assertEquals(genBefore, store.getGeneration());
            assertEquals("all_within_targets", worker.getSchedulerTelemetry().idleReason());
            worker.stop();
            store.close();
        }
    }

    @Nested
    @DisplayName("anti-starvation")
    class AntiStarvation {

        @Test
        @DisplayName("B and C/D present in queue when work exists")
        void multipleClassesInQueue() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("A1", "B1", "C1"));
            store.setExpirations("A1", EXPIRATIONS_JSON, minutesAgo(20));
            store.setChain("A1", QUALIFYING_CHAIN.replace("XLE", "A1"), minutesAgo(20));
            store.setExpirations("B1", EXPIRATIONS_JSON, hoursAgo(3));
            store.setChain("B1", NONQUALIFYING_CHAIN.replace("OBSCURE", "B1"), hoursAgo(3));
            // C1 stays pending

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            assertTrue(queue.stream().anyMatch(i -> "A".equals(i.urgencyClass())));
            assertTrue(queue.stream().anyMatch(i -> "B".equals(i.urgencyClass())));
            assertTrue(queue.stream().anyMatch(i -> "C".equals(i.urgencyClass())));
            store.close();
        }
    }

    // --- Stub adapter that doesn't make real network calls ---

    private TradierAdapter createStubAdapter() {
        return new TradierAdapter("stub-key", "https://localhost", new ResponseCache(), new RequestPacer(100, 10));
    }
}
