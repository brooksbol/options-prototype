package com.wheelwright.evidence.v2;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the Decision-independent calendar/session-identity mechanics (Doc 79 I1/I2).
 *
 * <p>These prove the pure classification follows the CONTACT INSTANT (not any queue/admission/
 * observer-start proxy), that the latest-completed-session selection is the ACTUAL latest
 * trading session across weekend and holiday boundaries, and that identity fails closed when it
 * cannot be established unambiguously.
 */
class DirectQuoteSessionIdentityTest {

    // Real-time (production) feed: no open/close delay.
    private static final boolean RT = true;

    @Test
    @DisplayName("I2 phase classification follows the contact instant (pre-open vs regular vs post-close)")
    void phaseFollowsContactInstant() {
        // 2026-10-05 Monday. 09:00 ET pre-open, 10:30 ET regular, 16:30 ET post-close.
        assertThat(DirectQuoteSessionIdentity.phaseAt(Instant.parse("2026-10-05T13:00:00Z"), RT))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.PRE_MARKET);   // 09:00 ET
        assertThat(DirectQuoteSessionIdentity.phaseAt(Instant.parse("2026-10-05T14:30:00Z"), RT))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.REGULAR_USABLE); // 10:30 ET
        assertThat(DirectQuoteSessionIdentity.phaseAt(Instant.parse("2026-10-05T20:30:00Z"), RT))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.POST_MARKET);  // 16:30 ET
    }

    @Test
    @DisplayName("I2 observer-start-before-boundary / contact-after-boundary: classification follows the LATER contact")
    void classificationFollowsContactNotEarlierProxy() {
        // Represent "observer started before the open, actual HTTP contact after the open":
        // the classification is a pure function of the CONTACT instant, so an instant just after
        // 09:30 ET classifies REGULAR_USABLE regardless of any earlier enqueue/observer moment.
        Instant justBeforeOpen = Instant.parse("2026-10-05T13:29:59Z"); // 09:29:59 ET
        Instant justAfterOpen = Instant.parse("2026-10-05T13:30:30Z");  // 09:30:30 ET
        assertThat(DirectQuoteSessionIdentity.phaseAt(justBeforeOpen, RT))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.PRE_MARKET);
        assertThat(DirectQuoteSessionIdentity.phaseAt(justAfterOpen, RT))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
    }

    @Test
    @DisplayName("I1 regularSessionDate present only inside the regular window; absent otherwise (fail closed)")
    void regularSessionDatePresentOnlyInWindow() {
        assertThat(DirectQuoteSessionIdentity.regularSessionDateAt(
            Instant.parse("2026-10-05T14:30:00Z"), RT))
            .contains(LocalDate.parse("2026-10-05"));
        // Pre-open and post-close have no unambiguous regular-session membership.
        assertThat(DirectQuoteSessionIdentity.regularSessionDateAt(
            Instant.parse("2026-10-05T13:00:00Z"), RT)).isEmpty();
        assertThat(DirectQuoteSessionIdentity.regularSessionDateAt(
            Instant.parse("2026-10-05T20:30:00Z"), RT)).isEmpty();
        // Weekend/holiday → empty.
        assertThat(DirectQuoteSessionIdentity.regularSessionDateAt(
            Instant.parse("2026-10-04T18:00:00Z"), RT)).isEmpty(); // Sunday
    }

    @Test
    @DisplayName("I1 latest completed regular session: weekend selects Friday")
    void latestCompletedWeekendSelectsFriday() {
        // Sunday 2026-10-04 → Friday 2026-10-02.
        assertThat(DirectQuoteSessionIdentity.latestCompletedRegularSessionDate(
            Instant.parse("2026-10-05T02:00:00Z"), RT))
            .contains(LocalDate.parse("2026-10-02"));
    }

    @Test
    @DisplayName("I1 latest completed regular session: holiday Monday selects the prior Friday")
    void latestCompletedHolidaySelectsPriorFriday() {
        // 2026-01-19 is MLK (holiday). Latest completed = Friday 2026-01-16.
        assertThat(DirectQuoteSessionIdentity.latestCompletedRegularSessionDate(
            Instant.parse("2026-01-19T18:00:00Z"), RT))
            .contains(LocalDate.parse("2026-01-16"));
    }

    @Test
    @DisplayName("I1 latest completed regular session: trading day after close is today; before close is prior day")
    void latestCompletedTradingDayCloseAware() {
        // Monday 2026-10-05 after close (16:30 ET) → today.
        assertThat(DirectQuoteSessionIdentity.latestCompletedRegularSessionDate(
            Instant.parse("2026-10-05T20:30:00Z"), RT))
            .contains(LocalDate.parse("2026-10-05"));
        // Monday 2026-10-05 mid-session (10:30 ET) → the prior trading day (Fri 2026-10-02).
        assertThat(DirectQuoteSessionIdentity.latestCompletedRegularSessionDate(
            Instant.parse("2026-10-05T14:30:00Z"), RT))
            .contains(LocalDate.parse("2026-10-02"));
    }

    @Test
    @DisplayName("I1 unknown calendar year fails closed (no guessed session identity)")
    void unknownYearFailsClosed() {
        // 2030 is outside the bounded known-year calendar tables.
        Instant future = Instant.parse("2030-06-10T14:30:00Z");
        assertThat(DirectQuoteSessionIdentity.phaseAt(future, RT))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.UNKNOWN);
        assertThat(DirectQuoteSessionIdentity.regularSessionDateAt(future, RT)).isEmpty();
        assertThat(DirectQuoteSessionIdentity.latestCompletedRegularSessionDate(future, RT)).isEmpty();
    }

    @Test
    @DisplayName("I1 delayed (sandbox) feed shifts the usable regular window by 15 minutes")
    void delayedFeedShiftsWindow() {
        // 09:40 ET: real-time is already REGULAR_USABLE; delayed feed is still PRE_MARKET
        // (usable only from 09:45 ET).
        Instant at0940 = Instant.parse("2026-10-05T13:40:00Z");
        assertThat(DirectQuoteSessionIdentity.phaseAt(at0940, true))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        assertThat(DirectQuoteSessionIdentity.phaseAt(at0940, false))
            .isEqualTo(QuoteProvenance.AcquisitionPhase.PRE_MARKET);
    }
}
