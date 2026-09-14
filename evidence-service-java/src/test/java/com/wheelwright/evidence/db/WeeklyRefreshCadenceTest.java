package com.wheelwright.evidence.db;

import com.wheelwright.evidence.SchedulerConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Generation-29066 WEEKLY_REFRESH attempt-cadence tests.
 *
 * Weekly = one execution of the normal servicing path every seven days, governed purely by an
 * ATTEMPT clock ({@code symbol_resolution.weekly_last_attempt_at}) advanced regardless of outcome.
 * These tests exercise the scheduler seam: exclusion from routine selection until due,
 * never-attempted symbols due, the seven-day boundary, attempt-clock advancement, no auto-retry
 * within the interval, and that protected/unlisted symbols keep normal cadence.
 */
class WeeklyRefreshCadenceTest {

    private static final long WEEK_MS = 7L * 24 * 60 * 60 * 1000L;

    // A stale timestamp (well past the 25-min refresh target) so a ready symbol is routinely due.
    private static String staleTs() {
        return Instant.now().minusSeconds(3600).toString(); // 1h old
    }

    private static final String CHAIN = """
        {"symbol":"%s","expiration":"%s","underlying":{"symbol":"%s","name":"Test","price":100.0},"puts":[{"strike":95,"bid":1.5,"ask":1.7,"delta":-0.28,"openInterest":520,"volume":110}],"calls":[]}""";

    private static final String EXPIRATIONS = """
        [{"date":"2026-09-18","dte":28}]""";

    /** Make a symbol 'ready' with a stale primary chain so it is routinely due for refresh. */
    private static void makeReadyStale(SqliteEvidenceStore store, String symbol) throws Exception {
        store.initUniverse(List.of(symbol));
        store.setExpirations(symbol, EXPIRATIONS, staleTs());
        store.setChain(symbol, String.format(CHAIN, symbol, "2026-09-18", symbol), staleTs());
    }

    private static Set<String> queueSymbols(SqliteEvidenceStore store, SchedulerConfig cfg) throws Exception {
        return store.getPrioritizedWorkQueue(cfg).stream()
            .map(SqliteEvidenceStore.PrioritizedWorkItem::symbol)
            .collect(Collectors.toSet());
    }

    @Test
    @DisplayName("weekly seam disabled (empty cohort): all stale-ready symbols remain routinely due")
    void seamDisabledIsNoOp() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            makeReadyStale(store, "WKLY");
            makeReadyStale(store, "CTRL");
            var q = queueSymbols(store, SchedulerConfig.DEFAULT);
            assertTrue(q.contains("WKLY"));
            assertTrue(q.contains("CTRL"));
        }
    }

    @Test
    @DisplayName("never-attempted weekly symbol is due")
    void neverAttemptedIsDue() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            makeReadyStale(store, "WKLY");
            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            assertTrue(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "a weekly symbol with no prior governed attempt must be due");
        }
    }

    @Test
    @DisplayName("weekly symbol attempted <7d ago is excluded from routine selection")
    void recentlyAttemptedExcluded() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            makeReadyStale(store, "WKLY");
            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            // Attempted 1 day ago — inside the 7-day interval.
            store.markWeeklyAttempt("WKLY", Instant.now().minusSeconds(24 * 3600).toString());
            assertFalse(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "a weekly symbol attempted within the interval must be excluded");
        }
    }

    @Test
    @DisplayName("weekly symbol becomes due again at the seven-day boundary")
    void dueAtSevenDayBoundary() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            makeReadyStale(store, "WKLY");
            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            // Attempted just over 7 days ago.
            store.markWeeklyAttempt("WKLY", Instant.now().minusMillis(WEEK_MS + 60_000).toString());
            assertTrue(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "a weekly symbol past the 7-day boundary must be due again");
        }
    }

    @Test
    @DisplayName("markWeeklyAttempt advances the attempt clock and suppresses re-dispatch")
    void markAdvancesClock() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            makeReadyStale(store, "WKLY");
            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            assertNull(store.getWeeklyLastAttemptAt("WKLY"));
            assertTrue(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"));

            store.markWeeklyAttempt("WKLY"); // now
            assertNotNull(store.getWeeklyLastAttemptAt("WKLY"));
            assertFalse(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "after a governed attempt the weekly symbol is not re-dispatched within the interval");
        }
    }

    @Test
    @DisplayName("attempt clock advances regardless of outcome (markWeeklyAttempt is outcome-agnostic)")
    void clockAdvancesOnAnyOutcome() throws Exception {
        // markWeeklyAttempt records the attempt without inspecting resolution/outcome. Prove it
        // advances the clock for a symbol whose resolution is 'failed' or 'absent' just the same.
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("ABSENT_SYM"));
            store.setExpirations("ABSENT_SYM", "[]", staleTs()); // -> resolution 'absent'
            store.setWeeklyRefreshCohort(Set.of("ABSENT_SYM"));
            store.markWeeklyAttempt("ABSENT_SYM");
            assertNotNull(store.getWeeklyLastAttemptAt("ABSENT_SYM"),
                "clock advances even when the governed attempt produced an absent/failed outcome");
        }
    }

    @Test
    @DisplayName("protected and unlisted symbols retain normal cadence when a weekly cohort is active")
    void protectedAndControlUnaffected() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            makeReadyStale(store, "WKLY");
            makeReadyStale(store, "PROT");   // would be NORMAL_PROTECTED — not in weekly cohort
            makeReadyStale(store, "CTRL");   // unlisted control
            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            // WKLY already attempted recently -> excluded; PROT and CTRL must remain due.
            store.markWeeklyAttempt("WKLY", Instant.now().minusSeconds(3600).toString());
            var q = queueSymbols(store, SchedulerConfig.DEFAULT);
            assertFalse(q.contains("WKLY"));
            assertTrue(q.contains("PROT"), "protected (non-weekly) symbol keeps normal cadence");
            assertTrue(q.contains("CTRL"), "unlisted control symbol keeps normal cadence");
        }
    }

    @Test
    @DisplayName("B1: a FRESH never-attempted weekly symbol is positively admitted (not exclusion-only)")
    void freshNeverAttemptedIsAdmitted() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            // Ready with a FRESH primary chain — ordinary selection would NOT admit it (within the
            // 25-min refresh target -> `continue`). This proves weekly admission is positive, not a
            // filter over the ordinary due-work queue.
            store.initUniverse(List.of("WKLY"));
            String fresh = Instant.now().toString();
            store.setExpirations("WKLY", EXPIRATIONS, fresh);
            store.setChain("WKLY", String.format(CHAIN, "WKLY", "2026-09-18", "WKLY"), fresh);

            // Sanity: without the cohort it is NOT in the ordinary queue (it is fresh).
            assertFalse(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "precondition: a fresh ready symbol is not ordinarily due");

            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            assertTrue(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "a never-attempted weekly symbol must be admitted even though it is ordinarily fresh");
        }
    }

    @Test
    @DisplayName("B1: a weekly-due symbol omitted by ordinary selection (absent) is admitted anyway")
    void weeklyDueOtherwiseOmittedIsAdmitted() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            // 'absent' current-epoch is an existing ordinary omission: absent symbols are only
            // queued as Class D when PRIOR-epoch. A current-epoch absent symbol is omitted.
            store.initUniverse(List.of("WKLY"));
            store.setExpirations("WKLY", "[]", Instant.now().toString()); // -> resolution 'absent', current epoch

            assertFalse(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "precondition: a current-epoch absent symbol is ordinarily omitted");

            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            // Never attempted -> weekly-due -> must be admitted despite ordinary omission.
            assertTrue(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "a weekly-due symbol ordinarily omitted must still be admitted by weekly cadence");
        }
    }

    @Test
    @DisplayName("B1: positive admission does not re-admit a soft-removed weekly symbol")
    void positiveAdmissionSkipsRemoved() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("WKLY"));
            store.setExpirations("WKLY", EXPIRATIONS, Instant.now().toString());
            store.setChain("WKLY", String.format(CHAIN, "WKLY", "2026-09-18", "WKLY"), Instant.now().toString());
            // Soft-remove it.
            try (var st = store.getConnection().createStatement()) {
                st.executeUpdate("UPDATE symbols SET removed_at = '2026-09-14T00:00:00Z' WHERE symbol = 'WKLY'");
            }
            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            assertFalse(queueSymbols(store, SchedulerConfig.DEFAULT).contains("WKLY"),
                "a removed symbol must not be re-admitted by weekly positive admission");
        }
    }

    @Test
    @DisplayName("weekly telemetry counts active cohort and due members")
    void weeklyTelemetry() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            makeReadyStale(store, "W1");
            makeReadyStale(store, "W2");
            store.setWeeklyRefreshCohort(Set.of("W1", "W2"));
            store.markWeeklyAttempt("W1"); // W1 attempted now -> not due; W2 never attempted -> due
            var counts = store.getWeeklyCadenceCounts(WEEK_MS);
            assertEquals(2, counts.eligibleWeekly());
            assertEquals(1, counts.dueWeekly());
        }
    }
}
