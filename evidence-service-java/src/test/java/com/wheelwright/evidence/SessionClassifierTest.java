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
    @DisplayName("BUG-013 sealed-evidence validity across the ET midnight into a trading day")
    class SealedEvidenceAcrossMidnight {

        // Friday's completed session, and a production chain acquired during it.
        private static final String FRIDAY = "2026-09-11";
        private static final String MONDAY = "2026-09-14";
        // A validity predicate that trusts Friday's completed session (mirrors a durable
        // hasCompletePublishedSession('2026-09-11') == true).
        private static SessionClassifier withFridayValid(boolean realtime) {
            return new SessionClassifier(Clock.systemUTC(), () -> realtime,
                FRIDAY::equals);
        }
        private static Instant fridayAcquisition() {
            return etInstant(FRIDAY, 15, 53); // ~15:53 ET Friday, inside [09:30, 16:00]
        }

        @Test
        @DisplayName("Sunday (NON_TRADING_DAY): a Friday production chain is admissible (sealed)")
        void sundayFridayChainAdmissible() {
            var now = etInstant("2026-09-13", 22, 0); // Sunday evening ET
            var a = withFridayValid(true).admissibilityForSubject("production", fridayAcquisition(), now);
            assertTrue(a.admissible(), "Friday sealed evidence must be admissible on a non-trading day");
            assertEquals("real-time", a.basis());
            assertEquals(FRIDAY, a.canonicalSessionDate());
        }

        @Test
        @DisplayName("Monday 00:28 ET PREMARKET: the SAME Friday chain is STILL admissible (prior session valid)")
        void mondayPremarketFridayChainStillAdmissible() {
            var now = etInstant(MONDAY, 0, 28); // the exact observed failure time
            var c = withFridayValid(true);
            // Session-level: PREMARKET, Friday canonical, prior session operationally valid.
            var cls = c.classify(now);
            assertEquals(SessionClassifier.State.PREMARKET, cls.state());
            assertEquals(FRIDAY, cls.canonicalSessionDate());
            assertTrue(cls.priorSessionOperationallyValid());
            // Per-subject verdict MUST AGREE: the Friday chain stays admissible (sealed).
            var a = c.admissibilityForSubject("production", fridayAcquisition(), now);
            assertTrue(a.admissible(), "sealed Friday evidence must not flip inadmissible just because ET rolled into Monday");
            assertEquals(FRIDAY, a.canonicalSessionDate());
            assertEquals("real-time", a.basis());
        }

        @Test
        @DisplayName("Monday PREMARKET but prior session NOT operationally valid: Friday chain NOT admitted")
        void mondayPremarketPriorSessionInvalid() {
            var now = etInstant(MONDAY, 0, 28);
            // persistedSessionValid returns false for everything -> prior session not valid.
            var c = new SessionClassifier(Clock.systemUTC(), () -> true, date -> false);
            var a = c.admissibilityForSubject("production", fridayAcquisition(), now);
            assertFalse(a.admissible(),
                "must not admit prior-session evidence when the prior session is not operationally valid");
        }

        @Test
        @DisplayName("Monday REGULAR_OBSERVATION: the Friday chain is NO LONGER current-session evidence")
        void mondayRegularSessionFridayChainNotCurrent() {
            var now = etInstant(MONDAY, 10, 0); // Monday, well after the open -> Monday canonical
            var c = withFridayValid(true);
            var cls = c.classify(now);
            assertEquals(SessionClassifier.State.REGULAR_OBSERVATION, cls.state());
            assertEquals(MONDAY, cls.canonicalSessionDate());
            // Friday chain must not be treated as Monday's current-session evidence.
            var a = c.admissibilityForSubject("production", fridayAcquisition(), now);
            assertFalse(a.admissible(), "a Friday chain is not current-session evidence once Monday is canonical");
            assertEquals(MONDAY, a.canonicalSessionDate());
        }

        @Test
        @DisplayName("production vs sandbox semantics remain distinct in Monday PREMARKET")
        void productionVsSandboxDistinctInPremarket() {
            var now = etInstant(MONDAY, 0, 28);
            // Production Friday chain: admissible (sealed, prior valid).
            var prod = withFridayValid(true).admissibilityForSubject("production", fridayAcquisition(), now);
            assertTrue(prod.admissible());
            assertEquals("real-time", prod.basis());
            // Sandbox Friday chain acquired at 15:53 Friday: effective 15:38 Friday, still within
            // Friday [09:30,16:00] -> admissible, but with DELAYED basis (semantics stay distinct).
            var sandbox = withFridayValid(false).admissibilityForSubject("sandbox", fridayAcquisition(), now);
            assertTrue(sandbox.admissible());
            assertEquals("delayed", sandbox.basis());
        }

        @Test
        @DisplayName("a Friday chain acquired AFTER Friday close is not admitted as Friday sealed evidence")
        void fridayAfterCloseNotSealed() {
            var now = etInstant(MONDAY, 0, 28);
            // Acquired 16:30 Friday (after the 16:00 close) -> effective 16:30 > Friday close.
            var afterClose = etInstant(FRIDAY, 16, 30);
            var a = withFridayValid(true).admissibilityForSubject("production", afterClose, now);
            assertFalse(a.admissible(),
                "a subject observed outside the prior session window is not that session's sealed evidence");
        }

        @Test
        @DisplayName("REGULAR session: a chain acquired overnight (after prior close, before today's open) IS current-session admissible")
        void regularSessionOvernightAcquiredChainAdmissible() {
            // The live COPX/GDXJ/UNG/URA incident (2026-09-14): the freshest real-time chains
            // were acquired ~Sun 23:53 ET during overnight/pre-open re-resolution, i.e. AFTER
            // Friday close and BEFORE Monday's 09:30 open. During REGULAR_OBSERVATION they must
            // be admissible current-session evidence, not rejected for being pre-open.
            var now = etInstant(MONDAY, 9, 40); // regular session, after the open
            var overnight = etInstant(MONDAY, 0, 0); // Monday 00:00 ET (after Fri close, before open)
            var a = withFridayValid(true).admissibilityForSubject("production", overnight, now);
            assertTrue(a.admissible(),
                "overnight-acquired current-session evidence must be admissible during regular hours");
            assertEquals(MONDAY, a.canonicalSessionDate());
            assertEquals("real-time", a.basis());
        }

        @Test
        @DisplayName("REGULAR session: a future-dated acquisition is NOT admitted (upper bound holds)")
        void regularSessionFutureAcquisitionRejected() {
            var now = etInstant(MONDAY, 9, 40);
            // Acquired after today's close -> effective observation beyond the session window.
            var afterClose = etInstant(MONDAY, 16, 30);
            var a = withFridayValid(true).admissibilityForSubject("production", afterClose, now);
            assertFalse(a.admissible(), "evidence beyond today's close must not be admitted");
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
