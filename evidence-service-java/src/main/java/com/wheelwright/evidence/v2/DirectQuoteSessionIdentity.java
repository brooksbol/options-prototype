package com.wheelwright.evidence.v2;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Direct-quote session identity: the narrow, Decision-independent answers the reuse-identity
 * invariant (Doc 79 I1) requires.
 *
 * <p>It answers only three questions, each as a pure function of an explicit instant plus the
 * active feed's real-time-ness (production real-time vs sandbox 15-min delayed):
 * <ul>
 *   <li>{@link #phaseAt} — the acquisition phase classification at an upstream-contact instant;</li>
 *   <li>{@link #regularSessionDateAt} — the applicable regular-session date for a contact
 *       instant, present ONLY when it falls inside a regular observation window on a known-year
 *       trading day, else absent (fail closed);</li>
 *   <li>{@link #latestCompletedRegularSessionDate} — the most recent fully-completed regular
 *       trading session as of an evaluation instant, present ONLY when the calendar can
 *       establish it unambiguously.</li>
 * </ul>
 *
 * <p>It deliberately does NOT consult Decision publication state, {@code persistedSessionValid},
 * provider availability, or any held evidence. Session membership is derived from the
 * upstream-contact context and nothing else (Doc 79 I1/I2). When identity cannot be established
 * unambiguously, the relevant method returns {@link Optional#empty()} and the caller fails
 * closed; it never guesses a date from receipt or wall-clock age.
 */
public final class DirectQuoteSessionIdentity {

    /** Open/close shift for a delayed (sandbox) feed; real-time (production) uses 0. */
    private static final int DELAYED_FEED_MINUTES = 15;

    private DirectQuoteSessionIdentity() {
    }

    /**
     * Classify the acquisition phase at the actual upstream-contact instant.
     *
     * <p>REGULAR_USABLE only within the (delay-shifted) regular observation window of a
     * known-year trading day; PRE_MARKET before that window on a trading day; POST_MARKET after
     * it on a trading day; CLOSED on a non-trading day; UNKNOWN when the calendar cannot speak
     * for the instant's year (fail closed — never guess a session).
     */
    public static QuoteProvenance.AcquisitionPhase phaseAt(Instant contactAt, boolean realtime) {
        LocalDate etDate = TradingCalendar.easternDate(contactAt);
        if (!TradingCalendar.isKnownYear(etDate)) {
            return QuoteProvenance.AcquisitionPhase.UNKNOWN;
        }
        if (!TradingCalendar.isTradingDay(etDate)) {
            return QuoteProvenance.AcquisitionPhase.CLOSED;
        }
        int minutes = TradingCalendar.easternMinutes(contactAt);
        int delay = realtime ? 0 : DELAYED_FEED_MINUTES;
        int openUsable = TradingCalendar.MARKET_OPEN_MINUTES + delay;
        int closeUsable = TradingCalendar.closeMinutes(etDate) + delay;
        if (minutes < openUsable) return QuoteProvenance.AcquisitionPhase.PRE_MARKET;
        if (minutes >= closeUsable) return QuoteProvenance.AcquisitionPhase.POST_MARKET;
        return QuoteProvenance.AcquisitionPhase.REGULAR_USABLE;
    }

    /**
     * The applicable regular-session date for an upstream-contact instant, present only when the
     * contact falls within that trading day's regular observation window on a known-year trading
     * day. Absent otherwise — the OAS makes {@code regularSessionDate} optional, and a contact
     * outside a regular window has no unambiguous regular-session membership.
     */
    public static Optional<LocalDate> regularSessionDateAt(Instant contactAt, boolean realtime) {
        if (phaseAt(contactAt, realtime) != QuoteProvenance.AcquisitionPhase.REGULAR_USABLE) {
            return Optional.empty();
        }
        return Optional.of(TradingCalendar.easternDate(contactAt));
    }

    /**
     * The most recent fully-completed regular trading session as of {@code now}.
     *
     * <p>If {@code now} is on a trading day after that day's regular close (delay-aware), that
     * day is the latest completed session. Otherwise it is the previous trading day. Absent when
     * the calendar cannot speak for the applicable year(s) — in which case completed-session
     * reuse fails closed.
     */
    public static Optional<LocalDate> latestCompletedRegularSessionDate(Instant now, boolean realtime) {
        LocalDate etDate = TradingCalendar.easternDate(now);
        if (!TradingCalendar.isKnownYear(etDate)) {
            return Optional.empty();
        }
        int delay = realtime ? 0 : DELAYED_FEED_MINUTES;
        if (TradingCalendar.isTradingDay(etDate)) {
            int minutes = TradingCalendar.easternMinutes(now);
            int closeUsable = TradingCalendar.closeMinutes(etDate) + delay;
            if (minutes >= closeUsable) {
                return Optional.of(etDate); // today's regular session has fully completed
            }
        }
        LocalDate prev = TradingCalendar.previousTradingDay(etDate);
        if (!TradingCalendar.isKnownYear(prev)) {
            return Optional.empty();
        }
        return Optional.of(prev);
    }
}
