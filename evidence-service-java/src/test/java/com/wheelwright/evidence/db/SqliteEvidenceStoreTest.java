package com.wheelwright.evidence.db;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SqliteEvidenceStore tests — reproduces TypeScript persistence invariants.
 *
 * Proves:
 * 1. Schema initialization on empty database
 * 2. Repeated initialization (idempotent)
 * 3. Successful evidence write and read
 * 4. Absence as resolution outcome
 * 5. Failed refresh preserves last successful evidence
 * 6. Work queue correctness
 * 7. Generation increments on publishSnapshot only
 * 8. Restart durability (close/reopen)
 * 9. Primary expiration selection
 */
class SqliteEvidenceStoreTest {

    // --- Fixtures ---

    private static final String EXPIRATIONS_JSON = """
        [{"date":"2026-08-03","dte":21},{"date":"2026-08-10","dte":28}]""";

    private static final String CHAIN_JSON = """
        {"symbol":"XLE","expiration":"2026-08-03","underlying":{"symbol":"XLE","name":"Energy Select Sector","price":92.5},"puts":[{"strike":88,"bid":1.5,"ask":1.7,"delta":-0.28,"openInterest":520,"volume":110}],"calls":[{"strike":95,"bid":1.2,"ask":1.4,"delta":0.32,"openInterest":300,"volume":80}]}""";

    private static final String NOW = "2026-07-16T14:30:00Z";

    // --- Schema Initialization ---

    @Nested
    class SchemaInitialization {

        @Test
        void initializesOnEmptyDatabase() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                // Should not throw — schema created successfully
                store.initUniverse(List.of("XLE"));
                Map<String, Object> ev = store.getEvidence("XLE");
                assertNotNull(ev);
                assertEquals("pending", ev.get("status"));
            }
        }

        @Test
        void repeatedInitializationIsIdempotent() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE", "XLF"));
                store.setExpirations("XLE", EXPIRATIONS_JSON, NOW);

                // Re-initialize with same + new symbols
                store.initUniverse(List.of("XLE", "XLF", "SPY"));

                // XLE evidence preserved
                Map<String, Object> xle = store.getEvidence("XLE");
                assertEquals("expirations_known", xle.get("status"));

                // SPY added as pending
                Map<String, Object> spy = store.getEvidence("SPY");
                assertEquals("pending", spy.get("status"));

                // Coverage correct
                Map<String, Integer> coverage = store.getCoverage();
                assertEquals(1, coverage.get("expirationsKnown"));
                assertEquals(2, coverage.get("pending"));
            }
        }
    }

    // --- Evidence Write and Read ---

    @Nested
    class EvidenceWriteRead {

        @Test
        void setExpirationsMovesToPartial() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));
                store.setExpirations("XLE", EXPIRATIONS_JSON, NOW);

                Map<String, Object> ev = store.getEvidence("XLE");
                assertEquals("expirations_known", ev.get("status"));
                assertEquals("2026-08-03", ev.get("primaryExpiration"));
                assertNotNull(ev.get("expirations"));
            }
        }

        @Test
        void setChainMovesToReady() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));
                store.setExpirations("XLE", EXPIRATIONS_JSON, NOW);
                store.setChain("XLE", CHAIN_JSON, NOW);

                Map<String, Object> ev = store.getEvidence("XLE");
                assertEquals("ready", ev.get("status"));
                assertNotNull(ev.get("chain"));
                assertEquals(NOW, ev.get("retrievedAt"));
            }
        }

        @Test
        void emptyExpirationsResultsInAbsent() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("NOOPT"));
                store.setExpirations("NOOPT", "[]", NOW);

                Map<String, Object> ev = store.getEvidence("NOOPT");
                assertEquals("absent", ev.get("status"));
                assertNull(ev.get("primaryExpiration"));
            }
        }

        @Test
        void unknownSymbolIsIgnored() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));
                // Should not throw for unknown symbol
                store.setExpirations("UNKNOWN", EXPIRATIONS_JSON, NOW);
                assertNull(store.getEvidence("UNKNOWN"));
            }
        }
    }

    // --- Failed Refresh Preservation ---

    @Nested
    class FailedRefreshPreservation {

        @Test
        void failureDoesNotOverwriteSuccessfulEvidence() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));
                store.setExpirations("XLE", EXPIRATIONS_JSON, NOW);
                store.setChain("XLE", CHAIN_JSON, NOW);

                // Verify ready state
                Map<String, Object> before = store.getEvidence("XLE");
                assertEquals("ready", before.get("status"));
                assertNotNull(before.get("chain"));

                // Fail — must NOT destroy chain data
                store.setFailure("XLE", "provider 503");

                Map<String, Object> after = store.getEvidence("XLE");
                assertEquals(CHAIN_JSON, after.get("chain"));
                assertEquals(EXPIRATIONS_JSON, after.get("expirations"));
            }
        }

        @Test
        void threeFailuresMarkSymbolAsFailed() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));

                store.setFailure("XLE", "timeout");
                assertEquals("pending", store.getEvidence("XLE").get("status"));

                store.setFailure("XLE", "timeout");
                assertEquals("pending", store.getEvidence("XLE").get("status"));

                store.setFailure("XLE", "timeout");
                assertEquals("failed", store.getEvidence("XLE").get("status"));
            }
        }
    }

    // --- Work Queue ---

    @Nested
    class WorkQueue {

        @Test
        void returnsOnlyPendingAndPartialSymbols() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("DONE", "PARTIAL", "ABSENT", "PENDING"));

                store.setExpirations("DONE", EXPIRATIONS_JSON, NOW);
                store.setChain("DONE", CHAIN_JSON, NOW);   // ready
                store.setExpirations("PARTIAL", EXPIRATIONS_JSON, NOW);  // partial
                store.setExpirations("ABSENT", "[]", NOW); // absent
                // PENDING: no evidence

                List<String> queue = store.getWorkQueue();
                queue.sort(String::compareTo);

                assertTrue(queue.contains("PARTIAL"));
                assertTrue(queue.contains("PENDING"));
                assertFalse(queue.contains("DONE"));
                assertFalse(queue.contains("ABSENT"));
            }
        }
    }

    // --- Generation ---

    @Nested
    class Generation {

        @Test
        void doesNotIncrementOnIndividualWrites() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));
                int gen0 = store.getGeneration();

                store.setExpirations("XLE", EXPIRATIONS_JSON, NOW);
                store.setChain("XLE", CHAIN_JSON, NOW);

                assertEquals(gen0, store.getGeneration());
            }
        }

        @Test
        void incrementsOnPublishSnapshot() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));
                int gen0 = store.getGeneration();

                store.setExpirations("XLE", EXPIRATIONS_JSON, NOW);
                store.publishSnapshot();

                assertEquals(gen0 + 1, store.getGeneration());
            }
        }

        @Test
        void etagReflectsGeneration() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XLE"));
                assertEquals("\"gen-0\"", store.getETag());

                store.publishSnapshot();
                assertEquals("\"gen-1\"", store.getETag());
            }
        }
    }

    // --- Restart Durability ---

    @Nested
    class RestartDurability {

        @TempDir
        Path tempDir;

        @Test
        void rebuildsIdenticalStateAfterRestart() throws Exception {
            String dbPath = tempDir.resolve("test.sqlite3").toString();

            // First instance: acquire evidence
            try (SqliteEvidenceStore store1 = new SqliteEvidenceStore(dbPath)) {
                store1.initUniverse(List.of("XLE", "NOOPT"));
                store1.setExpirations("XLE", EXPIRATIONS_JSON, NOW);
                store1.setChain("XLE", CHAIN_JSON, NOW);
                store1.setExpirations("NOOPT", "[]", NOW);
                store1.publishSnapshot();
            }

            // Second instance: reopen and verify
            try (SqliteEvidenceStore store2 = new SqliteEvidenceStore(dbPath)) {
                Map<String, Object> xle = store2.getEvidence("XLE");
                assertEquals("ready", xle.get("status"));
                assertEquals(CHAIN_JSON, xle.get("chain"));
                assertEquals(EXPIRATIONS_JSON, xle.get("expirations"));
                assertEquals("2026-08-03", xle.get("primaryExpiration"));

                Map<String, Object> noopt = store2.getEvidence("NOOPT");
                assertEquals("absent", noopt.get("status"));

                assertEquals(1, store2.getGeneration());

                Map<String, Integer> coverage = store2.getCoverage();
                assertEquals(1, coverage.get("ready"));
                assertEquals(1, coverage.get("absent"));
            }
        }

        @Test
        void workQueueCorrectAfterRestart() throws Exception {
            String dbPath = tempDir.resolve("test.sqlite3").toString();

            try (SqliteEvidenceStore store1 = new SqliteEvidenceStore(dbPath)) {
                store1.initUniverse(List.of("DONE", "PARTIAL", "PENDING"));
                store1.setExpirations("DONE", EXPIRATIONS_JSON, NOW);
                store1.setChain("DONE", CHAIN_JSON, NOW);
                store1.setExpirations("PARTIAL", EXPIRATIONS_JSON, NOW);
                // PENDING: no evidence
            }

            try (SqliteEvidenceStore store2 = new SqliteEvidenceStore(dbPath)) {
                List<String> queue = store2.getWorkQueue();
                queue.sort(String::compareTo);

                assertEquals(List.of("PARTIAL", "PENDING"), queue);
                assertFalse(queue.contains("DONE"));
            }
        }
    }

    // --- Session Date Parity ---

    @Nested
    class SessionDateParity {

        /**
         * Verifies behavioral parity with TypeScript:
         *   new Date().toISOString().split("T")[0]
         * which returns the UTC date portion.
         */

        @Test
        void standardTimeMiddleOfDay() {
            // 2026-01-15 14:30:00 UTC (EST, standard time)
            // ET would be 09:30 — same date in both UTC and ET
            Instant instant = Instant.parse("2026-01-15T14:30:00Z");
            assertEquals("2026-01-15", SqliteEvidenceStore.sessionDateFor(instant));
        }

        @Test
        void daylightSavingTimeMiddleOfDay() {
            // 2026-07-15 14:30:00 UTC (EDT, daylight saving)
            // ET would be 10:30 — same date in both UTC and ET
            Instant instant = Instant.parse("2026-07-15T14:30:00Z");
            assertEquals("2026-07-15", SqliteEvidenceStore.sessionDateFor(instant));
        }

        @Test
        void utcNearDayBoundaryBeforeMidnight() {
            // 2026-07-15 23:59:00 UTC = 7:59 PM ET
            // UTC date is still July 15, ET date is still July 15
            Instant instant = Instant.parse("2026-07-15T23:59:00Z");
            assertEquals("2026-07-15", SqliteEvidenceStore.sessionDateFor(instant));
        }

        @Test
        void utcAfterMidnightEtStillPriorDay() {
            // 2026-07-16 03:00:00 UTC = 11:00 PM ET July 15 (EDT, UTC-4)
            // UTC date is July 16, but ET date would be July 15
            // TypeScript returns the UTC date: "2026-07-16"
            Instant instant = Instant.parse("2026-07-16T03:00:00Z");
            assertEquals("2026-07-16", SqliteEvidenceStore.sessionDateFor(instant));
        }

        @Test
        void utcAfterMidnightEstStillPriorDay() {
            // 2026-01-16 04:00:00 UTC = 11:00 PM ET Jan 15 (EST, UTC-5)
            // UTC date is Jan 16, but ET date would be Jan 15
            // TypeScript returns the UTC date: "2026-01-16"
            Instant instant = Instant.parse("2026-01-16T04:00:00Z");
            assertEquals("2026-01-16", SqliteEvidenceStore.sessionDateFor(instant));
        }

        @Test
        void dstSpringForwardTransitionDate() {
            // 2026 spring forward: March 8, 2:00 AM ET → 3:00 AM ET
            // At 06:30 UTC on March 8, ET is either 1:30 AM (pre-spring) or 2:30 AM (post)
            // Regardless, UTC date is March 8
            Instant instant = Instant.parse("2026-03-08T06:30:00Z");
            assertEquals("2026-03-08", SqliteEvidenceStore.sessionDateFor(instant));
        }

        @Test
        void dstFallBackTransitionDate() {
            // 2026 fall back: November 1, 2:00 AM ET → 1:00 AM ET
            // At 06:30 UTC on November 1
            Instant instant = Instant.parse("2026-11-01T06:30:00Z");
            assertEquals("2026-11-01", SqliteEvidenceStore.sessionDateFor(instant));
        }

        @Test
        void utcExactlyAtMidnight() {
            // 2026-07-16 00:00:00 UTC = 8:00 PM ET July 15
            // TypeScript returns "2026-07-16" (UTC date)
            Instant instant = Instant.parse("2026-07-16T00:00:00Z");
            assertEquals("2026-07-16", SqliteEvidenceStore.sessionDateFor(instant));
        }
    }

    @Nested
    class PrimaryExpirationSelection {

        @Test
        void selectsNearestTo21DteWithinRange() {
            String json = """
                [{"date":"2026-07-24","dte":8},{"date":"2026-08-07","dte":22},{"date":"2026-08-21","dte":36}]""";
            assertEquals("2026-08-07", SqliteEvidenceStore.selectPrimaryExpiration(json));
        }

        @Test
        void fallsBackToNearestOverallWhenNoneInRange() {
            // All outside 7-45
            String json = """
                [{"date":"2026-07-18","dte":2},{"date":"2026-10-01","dte":77}]""";
            // 2 is closer to 21 than 77
            assertEquals("2026-07-18", SqliteEvidenceStore.selectPrimaryExpiration(json));
        }

        @Test
        void returnsNullForEmptyArray() {
            assertNull(SqliteEvidenceStore.selectPrimaryExpiration("[]"));
            assertNull(SqliteEvidenceStore.selectPrimaryExpiration(null));
        }
    }
}
