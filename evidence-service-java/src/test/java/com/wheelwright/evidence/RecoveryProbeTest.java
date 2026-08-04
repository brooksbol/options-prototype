package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.PrioritizedWorkItem;
import org.junit.jupiter.api.*;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Recovery Probe Tests — prior-epoch failed symbols get one bounded probe per new session.
 *
 * Validates the transient-outage recovery lifecycle:
 *   - symbol previously ready
 *   - systemic failure causes it to reach failed on day N
 *   - day N+1 includes exactly one recovery probe
 *   - successful probe restores normal lifecycle
 *   - failed probe does not run again that same session
 *   - day N+2 makes it eligible for one probe again
 */
class RecoveryProbeTest {

    private static final String EXPIRATIONS_JSON = """
        [{"date":"2026-08-21","dte":21}]""";

    private static final String CHAIN_JSON = """
        {"symbol":"QQQ","expiration":"2026-08-21","underlying":{"symbol":"QQQ","name":"QQQ Trust","price":698.41},"puts":[],"calls":[]}""";

    private static final SchedulerConfig CONFIG = new SchedulerConfig(
        900_000L,    // chainFreshnessTargetMs (15 min)
        3_600_000L,  // chainMaxAgeMs (1 hour)
        86_400_000L, // expirationFreshnessMs (24 hours)
        10,          // classBMinServiceInterval
        10,          // classCDMinServiceInterval
        5000L        // publicationCoalesceMs
    );

    private SqliteEvidenceStore store;

    @BeforeEach
    void setUp() throws SQLException {
        store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("QQQ", "SPY", "READY1"));
    }

    @AfterEach
    void tearDown() throws SQLException {
        store.close();
    }

    // --- Helper: bring a symbol to ready state on a given date ---

    private void makeReady(String symbol, String date) throws SQLException {
        store.setSessionDateOverride(date);
        store.setExpirations(symbol, EXPIRATIONS_JSON, date + "T14:00:00Z");
        store.setChain(symbol, CHAIN_JSON, date + "T14:00:00Z");
        store.setSessionDateOverride(null);
    }

    // --- Helper: fail a symbol 3 times (reaching threshold) on a given date ---

    private void failToThreshold(String symbol, String date) throws SQLException {
        store.setSessionDateOverride(date);
        store.setFailure(symbol, "Tradier API key not configured");
        store.setFailure(symbol, "Tradier API key not configured");
        store.setFailure(symbol, "Tradier API key not configured");
        store.setSessionDateOverride(null);
    }

    // --- Tests ---

    @Test
    @DisplayName("prior-epoch failed symbol appears in work queue on new session day")
    void priorEpochFailedAppearsInWorkQueue() throws SQLException {
        // Day 1: symbol is ready
        makeReady("QQQ", "2026-08-03");

        // Day 1: systemic failure
        failToThreshold("QQQ", "2026-08-03");

        // Verify: failed
        Map<String, Object> ev = store.getEvidence("QQQ");
        assertEquals("failed", ev.get("status"));

        // Day 2: work queue should include QQQ as a recovery probe
        store.setSessionDateOverride("2026-08-04");
        List<PrioritizedWorkItem> queue = store.getPrioritizedWorkQueue(CONFIG, "2026-08-04");
        boolean hasQQQ = queue.stream().anyMatch(i -> "QQQ".equals(i.symbol()));
        assertTrue(hasQQQ, "QQQ should be eligible for recovery probe on day 2");

        // It should be Class C
        PrioritizedWorkItem qqq = queue.stream().filter(i -> "QQQ".equals(i.symbol())).findFirst().orElseThrow();
        assertEquals("C", qqq.urgencyClass());
    }

    @Test
    @DisplayName("prior-epoch failed symbol is NOT in work queue on same session day")
    void sameEpochFailedNotInWorkQueue() throws SQLException {
        // Day 1: ready then failed
        makeReady("QQQ", "2026-08-03");
        failToThreshold("QQQ", "2026-08-03");

        // Same day work queue — should NOT include QQQ (already at threshold)
        List<PrioritizedWorkItem> queue = store.getPrioritizedWorkQueue(CONFIG, "2026-08-03");
        boolean hasQQQ = queue.stream().anyMatch(i -> "QQQ".equals(i.symbol()));
        assertFalse(hasQQQ, "QQQ should NOT be in work queue on same day it reached failure threshold");
    }

    @Test
    @DisplayName("successful recovery probe restores symbol to normal lifecycle")
    void successfulProbeRestoresSymbol() throws SQLException {
        // Day 1: ready then failed
        makeReady("QQQ", "2026-08-03");
        failToThreshold("QQQ", "2026-08-03");

        // Day 2: recovery probe succeeds (simulating what acquireSymbolTiered does)
        store.setSessionDateOverride("2026-08-04");
        store.setExpirations("QQQ", EXPIRATIONS_JSON, "2026-08-04T14:00:00Z");
        store.setChain("QQQ", CHAIN_JSON, "2026-08-04T14:00:00Z");

        // Symbol should now be ready
        Map<String, Object> ev = store.getEvidence("QQQ");
        assertEquals("ready", ev.get("status"));
    }

    @Test
    @DisplayName("failed recovery probe suppresses symbol for remainder of session")
    void failedProbeSuppressesForSession() throws SQLException {
        // Day 1: ready then failed
        makeReady("QQQ", "2026-08-03");
        failToThreshold("QQQ", "2026-08-03");

        // Day 2: first work queue — QQQ is eligible
        store.setSessionDateOverride("2026-08-04");
        List<PrioritizedWorkItem> queue1 = store.getPrioritizedWorkQueue(CONFIG, "2026-08-04");
        assertTrue(queue1.stream().anyMatch(i -> "QQQ".equals(i.symbol())));

        // Day 2: recovery probe fails
        store.setFailure("QQQ", "Tradier API key not configured");

        // Day 2: second work queue — QQQ should NOT be eligible anymore
        List<PrioritizedWorkItem> queue2 = store.getPrioritizedWorkQueue(CONFIG, "2026-08-04");
        boolean hasQQQ = queue2.stream().anyMatch(i -> "QQQ".equals(i.symbol()));
        assertFalse(hasQQQ, "QQQ should NOT be eligible after failed probe on same day");
    }

    @Test
    @DisplayName("symbol becomes eligible again on day N+2 after failed probe on day N+1")
    void eligibleAgainNextDay() throws SQLException {
        // Day 1: ready then failed
        makeReady("QQQ", "2026-08-03");
        failToThreshold("QQQ", "2026-08-03");

        // Day 2: recovery probe fails
        store.setSessionDateOverride("2026-08-04");
        store.setFailure("QQQ", "Still broken");

        // Day 2: confirm suppressed
        List<PrioritizedWorkItem> queue2 = store.getPrioritizedWorkQueue(CONFIG, "2026-08-04");
        assertFalse(queue2.stream().anyMatch(i -> "QQQ".equals(i.symbol())));

        // Day 3: eligible again (session_date was set to 2026-08-04, which != 2026-08-05)
        List<PrioritizedWorkItem> queue3 = store.getPrioritizedWorkQueue(CONFIG, "2026-08-05");
        assertTrue(queue3.stream().anyMatch(i -> "QQQ".equals(i.symbol())),
            "QQQ should be eligible for another probe on day 3");
    }

    @Test
    @DisplayName("failure history (failure_count) is preserved across recovery probes")
    void failureHistoryPreserved() throws SQLException {
        // Day 1: ready then failed (count = 3 on chain row)
        makeReady("QQQ", "2026-08-03");
        failToThreshold("QQQ", "2026-08-03");

        // Day 2: recovery probe fails (count should be 4, not reset)
        store.setSessionDateOverride("2026-08-04");
        store.setFailure("QQQ", "Still broken");

        // Check failure count on the chain evidence row (where setFailure writes)
        // The chain row for primary expiration tracks the acquisition attempt failures
        var conn = store.getConnection();
        try (var ps = conn.prepareStatement(
                "SELECT failure_count FROM evidence WHERE symbol = ? AND evidence_type = 'chain' AND expiration = ?")) {
            ps.setString(1, "QQQ");
            ps.setString(2, "2026-08-21"); // primary expiration
            try (var rs = ps.executeQuery()) {
                assertTrue(rs.next());
                assertEquals(4, rs.getInt("failure_count"),
                    "failure_count should be 4 (3 from day 1 + 1 from day 2 probe)");
            }
        }
    }

    @Test
    @DisplayName("multiple prior-epoch failed symbols all get recovery probes")
    void multipleSymbolsGetProbes() throws SQLException {
        // Both ready on day 1, both fail
        makeReady("QQQ", "2026-08-03");
        makeReady("SPY", "2026-08-03");
        failToThreshold("QQQ", "2026-08-03");
        failToThreshold("SPY", "2026-08-03");

        // Day 2: both should be in work queue
        List<PrioritizedWorkItem> queue = store.getPrioritizedWorkQueue(CONFIG, "2026-08-04");
        assertTrue(queue.stream().anyMatch(i -> "QQQ".equals(i.symbol())));
        assertTrue(queue.stream().anyMatch(i -> "SPY".equals(i.symbol())));
    }

    @Test
    @DisplayName("ready symbol on same day is NOT affected by recovery probe logic")
    void readySymbolUnaffected() throws SQLException {
        // READY1 is ready today with fresh data
        makeReady("READY1", "2026-08-04");

        // QQQ is prior-epoch failed
        makeReady("QQQ", "2026-08-03");
        failToThreshold("QQQ", "2026-08-03");

        // Work queue on day 2
        List<PrioritizedWorkItem> queue = store.getPrioritizedWorkQueue(CONFIG, "2026-08-04");

        // READY1 should NOT be in Class C (it's fresh and ready)
        boolean hasReady1AsC = queue.stream()
            .anyMatch(i -> "READY1".equals(i.symbol()) && "C".equals(i.urgencyClass()));
        assertFalse(hasReady1AsC);
    }
}
