package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.PrioritizedWorkItem;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Generation-29066 weekly ATTEMPT-CLOCK dispatch semantics (Blocker 2).
 *
 * The weekly clock advances exactly once when a weekly symbol is actually DISPATCHED into its
 * governed acquisition attempt — regardless of outcome, including a thrown acquisition failure —
 * and never merely because a symbol was queued/planned but not dispatched.
 *
 * These tests target the exact seam changed: {@link AcquisitionWorker#dispatchItemWithWeeklyClock}
 * (try/finally around {@link AcquisitionWorker#runAcquisition}). Driving that seam directly is
 * deterministic and avoids the self-scheduling worker's provider-lifecycle/session gating, which is
 * out of scope for this cadence fix.
 */
class WeeklyAttemptClockTest {

    private static Clock marketClock() {
        return Clock.fixed(ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
    }

    private static SchedulerConfig config() {
        return new SchedulerConfig(25*60*1000L, 120*60*1000L, 6*60*60*1000L, 10, 20, 5000L, 15*60*1000L, 5, 25*60*1000L);
    }

    private static TradierAdapter inertAdapter() {
        return new TradierAdapter("k", "https://localhost", new ResponseCache(), new RequestPacer(100, 10));
    }

    /** Worker whose governed acquisition step throws, to prove the finally still advances the clock. */
    private static final class ThrowingWorker extends AcquisitionWorker {
        final AtomicInteger acquisitions = new AtomicInteger();
        ThrowingWorker(SqliteEvidenceStore store) {
            super(inertAdapter(), store, new SessionGate(marketClock()), config());
        }
        @Override void runAcquisition(PrioritizedWorkItem item) {
            acquisitions.incrementAndGet();
            throw new RuntimeException("synthetic acquisition failure");
        }
    }

    /** Worker whose governed acquisition step succeeds (no-op), to count attempts. */
    private static final class NoopWorker extends AcquisitionWorker {
        final AtomicInteger acquisitions = new AtomicInteger();
        NoopWorker(SqliteEvidenceStore store) {
            super(inertAdapter(), store, new SessionGate(marketClock()), config());
        }
        @Override void runAcquisition(PrioritizedWorkItem item) {
            acquisitions.incrementAndGet();
        }
    }

    private static PrioritizedWorkItem item(String symbol) {
        return new PrioritizedWorkItem(symbol, "B", Long.MAX_VALUE, false, false, false);
    }

    @Test
    @DisplayName("B2: a thrown acquisition failure still advances the weekly attempt clock exactly once")
    void thrownFailureAdvancesClock() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("WKLY"));
            store.setWeeklyRefreshCohort(Set.of("WKLY"));
            assertNull(store.getWeeklyLastAttemptAt("WKLY"), "precondition: never attempted");

            ThrowingWorker worker = new ThrowingWorker(store);
            // The governed acquisition throws; dispatchItemWithWeeklyClock must still advance the clock.
            assertThrows(RuntimeException.class, () -> worker.dispatchItemWithWeeklyClock(item("WKLY")));

            assertEquals(1, worker.acquisitions.get(), "acquisition was actually dispatched once");
            String after = store.getWeeklyLastAttemptAt("WKLY");
            assertNotNull(after, "thrown acquisition failure must still advance the weekly attempt clock");
            long ageMs = System.currentTimeMillis() - java.time.Instant.parse(after).toEpochMilli();
            assertTrue(ageMs < config().weeklyRefreshIntervalMs(),
                "clock is recent -> symbol is not immediately weekly-due again");
        }
    }

    @Test
    @DisplayName("B2: a successful dispatch advances the clock exactly once")
    void successAdvancesClockOnce() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("WKLY"));
            store.setWeeklyRefreshCohort(Set.of("WKLY"));

            NoopWorker worker = new NoopWorker(store);
            worker.dispatchItemWithWeeklyClock(item("WKLY"));
            String after = store.getWeeklyLastAttemptAt("WKLY");
            assertNotNull(after);
            assertEquals(1, worker.acquisitions.get());
        }
    }

    @Test
    @DisplayName("B2: a non-weekly symbol dispatch never touches a weekly clock")
    void nonWeeklyDispatchNoClock() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("CTRL"));
            store.setWeeklyRefreshCohort(Set.of("WKLY")); // CTRL not in cohort
            NoopWorker worker = new NoopWorker(store);
            worker.dispatchItemWithWeeklyClock(item("CTRL"));
            assertNull(store.getWeeklyLastAttemptAt("CTRL"),
                "a non-weekly symbol must never get a weekly attempt clock");
        }
    }

    @Test
    @DisplayName("B2: queued/planned but UNDISPATCHED weekly work does not advance the clock")
    void queuedButUndispatchedDoesNotAdvance() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("WKLY"));
            String futureExp = java.time.LocalDate.now(ZoneOffset.UTC).plusDays(21).toString();
            store.setExpirations("WKLY", "[{\"date\":\"" + futureExp + "\",\"dte\":21}]", java.time.Instant.now().toString());
            store.setWeeklyRefreshCohort(Set.of("WKLY"));

            // Build/plan the work queue (weekly symbol admitted as planned work) WITHOUT dispatching.
            var queue = store.getPrioritizedWorkQueue(config());
            assertTrue(queue.stream().anyMatch(i -> "WKLY".equals(i.symbol())),
                "precondition: weekly symbol is planned/queued");

            assertNull(store.getWeeklyLastAttemptAt("WKLY"),
                "queued-but-undispatched weekly work must NOT advance the attempt clock");
        }
    }
}
