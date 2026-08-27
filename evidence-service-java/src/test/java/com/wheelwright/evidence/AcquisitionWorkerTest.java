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
        25 * 60 * 1000L,       // 25 min — chain refresh target (production simplification)
        120 * 60 * 1000L,      // 120 min
        6 * 60 * 60 * 1000L,   // 6 hours
        10, 20, 5000L,
        15 * 60 * 1000L,       // 15 min — monitored freshness target
        5,                     // monitored anti-starvation interval
        25 * 60 * 1000L        // 25 min — multi-DTE surface target (obligation disabled; telemetry only)
    );

    // Dynamic future expiration (21 days from today) — avoids test rot when dates pass
    private static final String FUTURE_EXPIRATION = java.time.LocalDate.now(java.time.ZoneOffset.UTC).plusDays(21).toString();

    // Chain JSON with qualifying puts (Class A)
    private static final String QUALIFYING_CHAIN =
        "{\"symbol\":\"XLE\",\"expiration\":\"" + FUTURE_EXPIRATION + "\",\"underlying\":{\"symbol\":\"XLE\",\"name\":\"Energy\",\"price\":58.0}," +
        "\"puts\":[{\"strike\":55,\"bid\":1.50,\"ask\":1.70,\"delta\":-0.28,\"openInterest\":520,\"volume\":110}]," +
        "\"calls\":[{\"strike\":60,\"bid\":1.20,\"ask\":1.40,\"delta\":0.32,\"openInterest\":300,\"volume\":80}]}";

    // Chain JSON with NO qualifying puts (Class B)
    private static final String NONQUALIFYING_CHAIN =
        "{\"symbol\":\"OBSCURE\",\"expiration\":\"" + FUTURE_EXPIRATION + "\",\"underlying\":{\"symbol\":\"OBSCURE\",\"name\":\"Obscure\",\"price\":10.0}," +
        "\"puts\":[{\"strike\":9,\"bid\":0,\"ask\":0.05,\"delta\":-0.10,\"openInterest\":0,\"volume\":0}]," +
        "\"calls\":[]}";

    private static final String EXPIRATIONS_JSON = "[{\"date\":\"" + FUTURE_EXPIRATION + "\",\"dte\":21}]";

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
        @DisplayName("qualifying chain symbol is Class A when stale (past the 25-min refresh horizon)")
        void classAWhenStale() throws Exception {
            // CONTRACT: normal refresh horizon is 25 min (production simplification), not 15.
            // A qualifying symbol older than 25 min is due and classified Class A.
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE", EXPIRATIONS_JSON, minutesAgo(30));
            store.setChain("XLE", QUALIFYING_CHAIN, minutesAgo(30));

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

            // Query with a session date guaranteed to differ from the one written by setExpirations.
            // currentSessionDate() uses UTC; use UTC+2 days to avoid timezone-boundary coincidence.
            String futureSession = java.time.LocalDate.now(java.time.ZoneOffset.UTC).plusDays(2).toString();
            var queue = store.getPrioritizedWorkQueue(CONFIG, futureSession);
            var item = queue.stream().filter(i -> "NOOPT".equals(i.symbol())).findFirst().orElse(null);
            assertNotNull(item);
            assertEquals("D", item.urgencyClass());
            store.close();
        }

        @Test
        @DisplayName("BREADTH-FIRST: stalest evidence first across classes; fresh (<25m) not yet due")
        void breadthFirstStaleFrontier() throws Exception {
            // Production simplification (Aug 2026): ordering favors the stale frontier — oldest
            // chain age first, across A and B together. Class A is only a tiebreaker at equal age.
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("OLD_A", "NEW_A", "BG"));
            store.setExpirations("OLD_A", EXPIRATIONS_JSON, minutesAgo(30));   // Class A, 30m — due
            store.setChain("OLD_A", QUALIFYING_CHAIN.replace("XLE", "OLD_A"), minutesAgo(30));
            store.setExpirations("NEW_A", EXPIRATIONS_JSON, minutesAgo(20));   // Class A, 20m — NOT due (<25)
            store.setChain("NEW_A", QUALIFYING_CHAIN.replace("XLE", "NEW_A"), minutesAgo(20));
            store.setExpirations("BG", EXPIRATIONS_JSON, hoursAgo(3));         // Class B, 3h — stalest
            store.setChain("BG", NONQUALIFYING_CHAIN, hoursAgo(3));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            // BG (3h, stalest) first — before OLD_A (30m) — despite BG being Class B.
            assertEquals("BG", queue.get(0).symbol());
            assertEquals("OLD_A", queue.get(1).symbol());
            // NEW_A (20m) is within the 25-min target — not due, absent from the queue.
            assertTrue(queue.stream().noneMatch(i -> "NEW_A".equals(i.symbol())),
                "a chain within the 25-min refresh target must not be due");
            store.close();
        }
    }

    @Nested
    @DisplayName("multi-DTE surface freshness (PL-COHERE-01 Finding #1 recovery)")
    class MultiDteSurfaceFreshness {

        // Two eligible expirations within 7-45 DTE.
        private static final String EXP_NEAR = LocalDate.now(ZoneOffset.UTC).plusDays(10).toString();
        private static final String EXP_FAR = LocalDate.now(ZoneOffset.UTC).plusDays(40).toString();
        private static final String MULTI_EXPIRATIONS_JSON =
            "[{\"date\":\"" + EXP_NEAR + "\",\"dte\":10},{\"date\":\"" + EXP_FAR + "\",\"dte\":40}]";

        /** Build a qualifying chain JSON for a given symbol + expiration (Class A). */
        private static String chainFor(String symbol, String expiration) {
            return "{\"symbol\":\"" + symbol + "\",\"expiration\":\"" + expiration + "\"," +
                "\"underlying\":{\"symbol\":\"" + symbol + "\",\"name\":\"" + symbol + "\",\"price\":58.0}," +
                "\"puts\":[{\"strike\":55,\"bid\":1.50,\"ask\":1.70,\"delta\":-0.28,\"openInterest\":520,\"volume\":110}]," +
                "\"calls\":[{\"strike\":60,\"bid\":1.20,\"ask\":1.40,\"delta\":0.32,\"openInterest\":300,\"volume\":80}]}";
        }

        /** Build a NON-qualifying chain JSON (no put clears delta/OI/bid gates -> Class B). */
        private static String nonQualifyingChainFor(String symbol, String expiration) {
            return "{\"symbol\":\"" + symbol + "\",\"expiration\":\"" + expiration + "\"," +
                "\"underlying\":{\"symbol\":\"" + symbol + "\",\"name\":\"" + symbol + "\",\"price\":10.0}," +
                "\"puts\":[{\"strike\":9,\"bid\":0,\"ask\":0.05,\"delta\":-0.10,\"openInterest\":0,\"volume\":0}]," +
                "\"calls\":[]}";
        }

        // NOTE (production simplification, Aug 2026): the blanket multi-DTE SURFACE obligation
        // was REMOVED from the scheduler. At production throughput the breadth-first sweep covers
        // the full eligible surface without a special weekly cohort, and the surface obligation
        // was consuming budget that starved breadth. The `multiDteSurface` telemetry is retained
        // (diagnostic only). Tests that asserted the removed surface-due obligation were deleted;
        // the surviving tests below cover the monitored-position overlay (retained), the dead-row
        // eligibility guard, and monthly-only behavior.

        @Test
        @DisplayName("fresh chain excluded; the removed surface obligation does not resurrect a stale secondary")
        void freshPrimaryExcludedRegardlessOfSecondary() throws Exception {
            // A multi-DTE symbol whose PRIMARY (newest) chain is fresh (<25m) is NOT due, even
            // if a secondary eligible chain is older. The surface obligation is gone; only the
            // newest-chain refresh target and the monitored overlay drive due-ness now.
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("WKLY"));
            store.setExpirations("WKLY", MULTI_EXPIRATIONS_JSON, minutesAgo(5));
            store.setChain("WKLY", chainFor("WKLY", EXP_NEAR), minutesAgo(5));                      // newest: 5m
            store.setChainForExpiration("WKLY", EXP_FAR, chainFor("WKLY", EXP_FAR), minutesAgo(40)); // secondary: 40m

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            assertTrue(queue.stream().noneMatch(i -> "WKLY".equals(i.symbol())),
                "fresh newest chain -> not due; removed surface obligation must not resurrect it");
            store.close();
        }

        @Test
        @DisplayName("monthly-only symbol behavior unchanged: fresh single chain stays excluded")
        void monthlyOnlyUnchangedWhenFresh() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("MONTH"));
            String singleExp = "[{\"date\":\"" + EXP_NEAR + "\",\"dte\":10}]";
            store.setExpirations("MONTH", singleExp, minutesAgo(5));
            store.setChain("MONTH", chainFor("MONTH", EXP_NEAR), minutesAgo(5));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            assertTrue(queue.stream().noneMatch(i -> "MONTH".equals(i.symbol())),
                "monthly-only fresh symbol must remain excluded (behavior unchanged)");
            store.close();
        }

        @Test
        @DisplayName("dead/expired historical row must NOT force a fresh symbol permanently due")
        void deadRowDoesNotForceDue() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("WKLY"));
            store.setExpirations("WKLY", MULTI_EXPIRATIONS_JSON, minutesAgo(5));
            // Both eligible chains fresh
            store.setChain("WKLY", chainFor("WKLY", EXP_NEAR), minutesAgo(5));
            store.setChainForExpiration("WKLY", EXP_FAR, chainFor("WKLY", EXP_FAR), minutesAgo(6));
            // A DEAD row: expiration already passed (yesterday), very old retrieved_at.
            String deadExp = LocalDate.now(ZoneOffset.UTC).minusDays(1).toString();
            store.setChainForExpiration("WKLY", deadExp, chainFor("WKLY", deadExp), hoursAgo(200));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            assertTrue(queue.stream().noneMatch(i -> "WKLY".equals(i.symbol())),
                "a dead/ineligible historical row must be excluded from eligibility and not force the symbol due");
            store.close();
        }

        @Test
        @DisplayName("monitored position (Class B) becomes due when past the monitoring target, without changing class")
        void monitoredPositionDueOverlay() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("HELD"));
            // Class B (non-qualifying), single eligible chain, newest 20 min old.
            // As ordinary B (max age 120 min) it would NOT be due. But it is monitored,
            // and 20 min > 15-min monitoring target, so it must be due AND stay Class B.
            String singleExp = "[{\"date\":\"" + EXP_NEAR + "\",\"dte\":10}]";
            store.setExpirations("HELD", singleExp, minutesAgo(20));
            store.setChain("HELD", nonQualifyingChainFor("HELD", EXP_NEAR), minutesAgo(20));
            store.setMonitoredSymbols(List.of("HELD"));

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            var item = queue.stream().filter(i -> "HELD".equals(i.symbol())).findFirst().orElse(null);
            assertNotNull(item, "monitored position past monitoring target must be due");
            assertEquals("B", item.urgencyClass(), "monitoring overlay must NOT change recommendation class");
            assertTrue(item.isMonitored(), "item must be tagged monitored for the floor");
            store.close();
        }

        @Test
        @DisplayName("non-monitored Class B within max age stays out (overlay is opt-in)")
        void nonMonitoredBStaysOut() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("BGND"));
            String singleExp = "[{\"date\":\"" + EXP_NEAR + "\",\"dte\":10}]";
            store.setExpirations("BGND", singleExp, minutesAgo(20));
            store.setChain("BGND", nonQualifyingChainFor("BGND", EXP_NEAR), minutesAgo(20));
            // NOT monitored — 20 min is within the 120-min B max age, so it should be skipped.

            var queue = store.getPrioritizedWorkQueue(CONFIG);
            assertTrue(queue.stream().noneMatch(i -> "BGND".equals(i.symbol())),
                "non-monitored Class B within max age must not be due");
            store.close();
        }

        @Test
        @DisplayName("setMonitoredSymbols atomically replaces the monitored set")
        void monitoredSetReplacement() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("A1", "A2", "A3"));
            store.setMonitoredSymbols(List.of("A1", "A2"));
            assertEquals(List.of("A1", "A2"), store.getMonitoredSymbols());
            // Replace: A2 closes, A3 opens
            store.setMonitoredSymbols(List.of("A2", "A3"));
            assertEquals(List.of("A2", "A3"), store.getMonitoredSymbols());
            store.close();
        }

        @Test
        @DisplayName("monitored coverage telemetry counts current vs stale held positions")
        void monitoredCoverageTelemetry() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("FRESHHELD", "STALEHELD", "UNHELD"));
            String singleExp = "[{\"date\":\"" + EXP_NEAR + "\",\"dte\":10}]";
            store.setExpirations("FRESHHELD", singleExp, minutesAgo(5));
            store.setChain("FRESHHELD", chainFor("FRESHHELD", EXP_NEAR), minutesAgo(5));
            store.setExpirations("STALEHELD", singleExp, minutesAgo(40));
            store.setChain("STALEHELD", chainFor("STALEHELD", EXP_NEAR), minutesAgo(40));
            store.setExpirations("UNHELD", singleExp, minutesAgo(5));
            store.setChain("UNHELD", chainFor("UNHELD", EXP_NEAR), minutesAgo(5));

            store.setMonitoredSymbols(List.of("FRESHHELD", "STALEHELD")); // UNHELD not monitored

            var cov = store.getMonitoredCoverage(CONFIG.monitoredFreshnessTargetMs());
            assertEquals(2, cov.total(), "only the two monitored symbols count");
            assertEquals(1, cov.current(), "FRESHHELD (5m) current; STALEHELD (40m) stale");
            assertEquals(1, cov.degraded());
            store.close();
        }

        @Test
        @DisplayName("multi-DTE coverage telemetry counts degraded surfaces")
        void coverageTelemetryReportsDegraded() throws Exception {
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("FRESHW", "DEGRW", "MONTH"));

            // FRESHW: multi-DTE, fully fresh
            store.setExpirations("FRESHW", MULTI_EXPIRATIONS_JSON, minutesAgo(5));
            store.setChain("FRESHW", chainFor("FRESHW", EXP_NEAR), minutesAgo(5));
            store.setChainForExpiration("FRESHW", EXP_FAR, chainFor("FRESHW", EXP_FAR), minutesAgo(6));

            // DEGRW: multi-DTE, secondary stale
            store.setExpirations("DEGRW", MULTI_EXPIRATIONS_JSON, minutesAgo(5));
            store.setChain("DEGRW", chainFor("DEGRW", EXP_NEAR), minutesAgo(5));
            store.setChainForExpiration("DEGRW", EXP_FAR, chainFor("DEGRW", EXP_FAR), minutesAgo(40));

            // MONTH: monthly-only — excluded from multi-DTE coverage entirely
            String singleExp = "[{\"date\":\"" + EXP_NEAR + "\",\"dte\":10}]";
            store.setExpirations("MONTH", singleExp, minutesAgo(5));
            store.setChain("MONTH", chainFor("MONTH", EXP_NEAR), minutesAgo(5));

            var coverage = store.getMultiDteSurfaceCoverage(CONFIG.chainFreshnessTargetMs());
            assertEquals(2, coverage.total(), "only the two multi-DTE symbols count");
            assertEquals(1, coverage.current(), "only FRESHW has a fully-fresh surface");
            assertEquals(1, coverage.degraded(), "DEGRW is degraded");
            store.close();
        }
    }

    @Nested
    @DisplayName("classified population (eligible vs due)")
    class EligibleVsDue {

        @Test
        @DisplayName("fresh Class A counts in eligible but not due (eligible vs due distinction, 25-min horizon)")
        void freshClassAEligibleNotDue() throws Exception {
            // CONTRACT: classification (eligible population) is independent of freshness (due).
            // A symbol within the 25-min refresh horizon is eligible-A but NOT due; one past it is due.
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("FRESH", "STALE"));
            store.setExpirations("FRESH", EXPIRATIONS_JSON, minutesAgo(5));
            store.setChain("FRESH", QUALIFYING_CHAIN.replace("XLE", "FRESH"), minutesAgo(5));   // <25m: not due
            store.setExpirations("STALE", EXPIRATIONS_JSON, minutesAgo(30));
            store.setChain("STALE", QUALIFYING_CHAIN.replace("XLE", "STALE"), minutesAgo(30));  // >25m: due

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
        @DisplayName("A, B and C present in queue when all have due work (25-min horizon)")
        void multipleClassesInQueue() throws Exception {
            // CONTRACT: A/B/C all appear when each has due work. A1 must be past the 25-min
            // horizon (not the old 15) to be due.
            var store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("A1", "B1", "C1"));
            store.setExpirations("A1", EXPIRATIONS_JSON, minutesAgo(30));
            store.setChain("A1", QUALIFYING_CHAIN.replace("XLE", "A1"), minutesAgo(30));
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
