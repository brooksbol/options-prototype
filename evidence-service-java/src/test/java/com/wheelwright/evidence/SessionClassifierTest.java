package com.wheelwright.evidence;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SessionClassifier tests (Issue #16) — deterministic, injectable clock + realtime signal.
 *
 * These encode the AUTHORITY TRUTH so that tomorrow's 09:30–09:45 ET window is a
 * confirmation window, not a debugging window:
 *   - Production (real-time): NO phantom 09:30–09:45 REGULAR_OPEN_DELAY; regular
 *     observation and admissible/canonical at the 09:30 open.
 *   - Sandbox (delayed): the 15-minute open-delay window is preserved.
 *   - Per-subject admissibility is judged by the SUBJECT's OWN environment (no laundering).
 *   - Unknown authority yields an explicit conservative (not-admissible) verdict.
 *   - Pre-market / post-close / non-trading-day semantics are correct.
 */
class SessionClassifierTest {

    /** ET wall-clock -> Instant, same DST approximation as SessionGate/SessionClassifier. */
    private static Instant etInstant(String dateStr, int etHours, int etMinutes) {
        LocalDate date = LocalDate.parse(dateStr);
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();
        boolean isEDT = (month > 3 && month < 11) || (month == 3 && day >= 8) || (month == 11 && day < 1);
        int utcOffset = isEDT ? 4 : 5;
        int utcHours = etHours + utcOffset;
        LocalDate utcDate = date;
        while (utcHours >= 24) { utcHours -= 24; utcDate = utcDate.plusDays(1); }
        return ZonedDateTime.of(utcDate, LocalTime.of(utcHours, etMinutes), ZoneOffset.UTC).toInstant();
    }

    private static SessionClassifier classifier(boolean realtime) {
        return new SessionClassifier(Clock.systemUTC(), () -> realtime);
    }

    // A normal 2026 trading day (Thursday) well clear of holidays.
    private static final String TRADING_DAY = "2026-09-10";
    private static final String PRIOR_TRADING_DAY = "2026-09-09";

    @Nested
    @DisplayName("Production (real-time) — the defect scenario")
    class ProductionRealtime {

        @Test
        @DisplayName("09:30 ET: REGULAR_OBSERVATION, NOT REGULAR_OPEN_DELAY (no phantom delay)")
        void atOpenNoPhantomDelay() {
            var c = classifier(true).classify(etInstant(TRADING_DAY, 9, 30));
            assertEquals(SessionClassifier.State.REGULAR_OBSERVATION, c.state());
            assertTrue(c.acceptingCanonicalEvidence());
            assertEquals(0, c.providerDelayMinutes());
            assertEquals(TRADING_DAY, c.canonicalSessionDate());
        }

        @Test
        @DisplayName("09:41 ET (the observed defect time): still REGULAR_OBSERVATION")
        void at0941NoOpenDelay() {
            var c = classifier(true).classify(etInstant(TRADING_DAY, 9, 41));
            assertEquals(SessionClassifier.State.REGULAR_OBSERVATION, c.state());
            assertNotEquals(SessionClassifier.State.REGULAR_OPEN_DELAY, c.state());
        }

        @Test
        @DisplayName("admissibility boundary equals the 09:30 open (no delay added)")
        void admissibilityBoundaryIsOpen() {
            var c = classifier(true).classify(etInstant(TRADING_DAY, 9, 41));
            assertEquals(etInstant(TRADING_DAY, 9, 30).toEpochMilli(), c.admissibilityBoundaryEpochMs());
        }

        @Test
        @DisplayName("a production-acquired chain is admissible/canonical at the open")
        void productionSubjectAdmissibleAtOpen() {
            var now = etInstant(TRADING_DAY, 9, 35);
            var a = classifier(true).admissibilityForSubject(
                "production", etInstant(TRADING_DAY, 9, 32), now);
            assertTrue(a.admissible());
            assertEquals("real-time", a.basis());
            assertEquals(TRADING_DAY, a.canonicalSessionDate());
        }
    }

    @Nested
    @DisplayName("Sandbox (delayed) — legitimate delayed-open preserved")
    class SandboxDelayed {

        @Test
        @DisplayName("09:35 ET: REGULAR_OPEN_DELAY (inside the 15-min window)")
        void at0935OpenDelay() {
            var c = classifier(false).classify(etInstant(TRADING_DAY, 9, 35));
            assertEquals(SessionClassifier.State.REGULAR_OPEN_DELAY, c.state());
            assertFalse(c.acceptingCanonicalEvidence());
            assertEquals(15, c.providerDelayMinutes());
        }

        @Test
        @DisplayName("09:46 ET: past the 15-min delay -> REGULAR_OBSERVATION")
        void at0946Observation() {
            var c = classifier(false).classify(etInstant(TRADING_DAY, 9, 46));
            assertEquals(SessionClassifier.State.REGULAR_OBSERVATION, c.state());
            assertTrue(c.acceptingCanonicalEvidence());
        }

        @Test
        @DisplayName("admissibility boundary is open + 15 min")
        void admissibilityBoundaryIsOpenPlus15() {
            var c = classifier(false).classify(etInstant(TRADING_DAY, 9, 35));
            assertEquals(etInstant(TRADING_DAY, 9, 45).toEpochMilli(), c.admissibilityBoundaryEpochMs());
        }

        @Test
        @DisplayName("a sandbox-acquired chain at 09:35 is NOT yet admissible (delayed)")
        void sandboxSubjectNotAdmissibleInDelayWindow() {
            var now = etInstant(TRADING_DAY, 9, 35);
            // Acquired at 09:35; effective observation = 09:20, before the 09:30 open.
            var a = classifier(false).admissibilityForSubject(
                "sandbox", etInstant(TRADING_DAY, 9, 35), now);
            assertFalse(a.admissible());
            assertEquals("delayed", a.basis());
        }
    }

    @Nested
    @DisplayName("Mixed authority — no laundering (subject judged by its OWN environment)")
    class MixedAuthority {

        @Test
        @DisplayName("while Production is active, a sandbox-provenance subject keeps delayed semantics")
        void sandboxSubjectNotLaunderedWhileProductionActive() {
            // Active authority is production (real-time) ...
            SessionClassifier c = classifier(true);
            var now = etInstant(TRADING_DAY, 9, 35);
            // ... but THIS subject was sandbox-acquired at 09:35 (effective 09:20 < open).
            var sandboxSubject = c.admissibilityForSubject("sandbox", etInstant(TRADING_DAY, 9, 35), now);
            assertFalse(sandboxSubject.admissible(), "sandbox subject must not inherit real-time semantics");
            assertEquals("delayed", sandboxSubject.basis());

            // A production subject on the same snapshot IS admissible at the same instant.
            var prodSubject = c.admissibilityForSubject("production", etInstant(TRADING_DAY, 9, 32), now);
            assertTrue(prodSubject.admissible());
            assertEquals("real-time", prodSubject.basis());
        }

        @Test
        @DisplayName("unknown environment is conservative: not admissible, basis 'unknown'")
        void unknownNotSilentlyProduction() {
            var now = etInstant(TRADING_DAY, 10, 0);
            var a = classifier(true).admissibilityForSubject("unknown", etInstant(TRADING_DAY, 9, 40), now);
            assertFalse(a.admissible());
            assertEquals("unknown", a.basis());
            assertNull(a.canonicalSessionDate());
        }

        @Test
        @DisplayName("null environment is treated as unknown, never production")
        void nullEnvironmentUnknown() {
            var now = etInstant(TRADING_DAY, 10, 0);
            var a = classifier(true).admissibilityForSubject(null, etInstant(TRADING_DAY, 9, 40), now);
            assertFalse(a.admissible());
            assertEquals("unknown", a.basis());
        }
    }

    @Nested
    @DisplayName("Pre/post/non-trading unchanged")
    class OtherStates {

        @Test
        @DisplayName("09:15 ET -> PREMARKET (prior session canonical)")
        void premarket() {
            var c = classifier(true).classify(etInstant(TRADING_DAY, 9, 15));
            assertEquals(SessionClassifier.State.PREMARKET, c.state());
            assertEquals(PRIOR_TRADING_DAY, c.canonicalSessionDate());
            assertFalse(c.acceptingCanonicalEvidence());
        }

        @Test
        @DisplayName("16:30 ET (production, real-time) -> CLOSED_CANONICAL (sealed)")
        void closedProduction() {
            var c = new SessionClassifier(Clock.systemUTC(), () -> true,
                date -> TRADING_DAY.equals(date)).classify(etInstant(TRADING_DAY, 16, 30));
            assertEquals(SessionClassifier.State.CLOSED_CANONICAL, c.state());
            assertFalse(c.acceptingCanonicalEvidence());
            assertTrue(c.priorSessionOperationallyValid());
            assertNull(c.admissibilityBoundaryEpochMs());
        }

        @Test
        @DisplayName("closed-session validity fails closed without a matching durable session")
        void closedWithoutDurableSession() {
            var c = new SessionClassifier(Clock.systemUTC(), () -> true,
                date -> false).classify(etInstant(TRADING_DAY, 16, 30));
            assertFalse(c.priorSessionOperationallyValid());
        }

        @Test
        @DisplayName("16:05 ET (sandbox, delayed) -> DELAY_DRAIN (final delayed obs)")
        void delayDrainSandbox() {
            var c = classifier(false).classify(etInstant(TRADING_DAY, 16, 5));
            assertEquals(SessionClassifier.State.DELAY_DRAIN, c.state());
            assertTrue(c.acceptingCanonicalEvidence());
        }

        @Test
        @DisplayName("16:05 ET (production, real-time) -> already CLOSED_CANONICAL (no drain)")
        void noDrainForRealtime() {
            var c = classifier(true).classify(etInstant(TRADING_DAY, 16, 5));
            assertEquals(SessionClassifier.State.CLOSED_CANONICAL, c.state());
        }

        @Test
        @DisplayName("Saturday -> NON_TRADING_DAY")
        void weekend() {
            // 2026-09-12 is a Saturday
            var c = classifier(true).classify(etInstant("2026-09-12", 12, 0));
            assertEquals(SessionClassifier.State.NON_TRADING_DAY, c.state());
        }

        @Test
        @DisplayName("Labor Day 2026-09-07 (holiday) -> NON_TRADING_DAY")
        void holiday() {
            var c = classifier(true).classify(etInstant("2026-09-07", 12, 0));
            assertEquals(SessionClassifier.State.NON_TRADING_DAY, c.state());
        }
    }

    @Nested
    @DisplayName("failover-aware: the SAME classifier reflects a live authority switch")
    class FailoverAware {

        @Test
        @DisplayName("flipping the realtime signal flips the 09:35 verdict (prod<->sandbox)")
        void reflectsLiveSwitch() {
            AtomicBoolean realtime = new AtomicBoolean(true);
            SessionClassifier c = new SessionClassifier(Clock.systemUTC(), realtime::get);
            var t = etInstant(TRADING_DAY, 9, 35);

            assertEquals(SessionClassifier.State.REGULAR_OBSERVATION, c.classify(t).state());
            realtime.set(false); // failover to sandbox
            assertEquals(SessionClassifier.State.REGULAR_OPEN_DELAY, c.classify(t).state());
        }
    }
}
