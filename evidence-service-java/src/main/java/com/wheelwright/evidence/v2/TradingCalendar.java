package com.wheelwright.evidence.v2;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;

/**
 * Pure US-equity trading-calendar mechanics for the v2 direct-quote capability.
 *
 * <p><b>Why this exists (Doc 79 §4).</b> The direct-quote reuse-identity invariant (I1) needs
 * trading-date / weekend / holiday / early-close reasoning and a regular-session open/close
 * window, but it must NOT depend on {@code SessionClassifier.persistedSessionValid} (coupled
 * to complete published Decision-session state) or the classifier's whole admissibility
 * verdict. Named v2 quotes may exist with no Decision enrollment. This class therefore
 * reuses the SAME 2026 calendar truth and ET conventions as {@code SessionGate} /
 * {@code SessionClassifier} as pure mechanics, with zero Decision coupling. It is a mechanical
 * factoring, not a new Product concept.
 *
 * <p><b>Bounded authority (Doc 79 §4).</b> The holiday/early-close tables are explicitly
 * bounded to {@link #KNOWN_YEARS}. Outside the known range this calendar reports that it
 * cannot establish regular-session identity ({@link #isKnownYear(LocalDate)} is false), so the
 * direct-quote model omits {@code regularSessionDate} and fails closed for session-specific
 * reuse rather than guessing. This matches the ratified OAS, which makes
 * {@code regularSessionDate} optional/absent when unambiguous identity is unavailable.
 *
 * <p>All methods are pure functions of their arguments; no clock or provider state is held.
 */
public final class TradingCalendar {

    /** Years for which the holiday/early-close tables below are authoritative. */
    public static final Set<Integer> KNOWN_YEARS = Set.of(2026);

    // Calendar truth shared (by value) with SessionGate / SessionClassifier for 2026.
    private static final Set<String> US_MARKET_HOLIDAYS = Set.of(
        "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
        "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25"
    );
    private static final Set<String> US_EARLY_CLOSE = Set.of(
        "2026-11-27", "2026-12-24"
    );

    /** 09:30 ET regular open, in minutes from ET midnight. */
    public static final int MARKET_OPEN_MINUTES = 9 * 60 + 30;
    /** 16:00 ET standard close, in minutes from ET midnight. */
    public static final int STANDARD_CLOSE_MINUTES = 16 * 60;
    /** 13:00 ET early close, in minutes from ET midnight (half-day sessions). */
    public static final int EARLY_CLOSE_MINUTES = 13 * 60;

    private TradingCalendar() {
    }

    /** Whether this calendar can speak authoritatively about the given ET date's year. */
    public static boolean isKnownYear(LocalDate etDate) {
        return etDate != null && KNOWN_YEARS.contains(etDate.getYear());
    }

    /** Whether the given ET date is a regular US-equity trading day (not weekend/holiday). */
    public static boolean isTradingDay(LocalDate etDate) {
        if (etDate == null) return false;
        DayOfWeek dow = etDate.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) return false;
        return !US_MARKET_HOLIDAYS.contains(iso(etDate));
    }

    /** Regular close minutes for the given ET date (early-close aware). */
    public static int closeMinutes(LocalDate etDate) {
        return US_EARLY_CLOSE.contains(iso(etDate)) ? EARLY_CLOSE_MINUTES : STANDARD_CLOSE_MINUTES;
    }

    /** Most recent trading day strictly before {@code etDate} (skips weekends + holidays). */
    public static LocalDate previousTradingDay(LocalDate etDate) {
        LocalDate d = etDate.minusDays(1);
        while (!isTradingDay(d)) {
            d = d.minusDays(1);
        }
        return d;
    }

    /** The ET local date for a given instant (shared DST approximation with SessionGate). */
    public static LocalDate easternDate(Instant instant) {
        return easternDateTime(instant).toLocalDate();
    }

    /** ET minutes-from-midnight for a given instant. */
    public static int easternMinutes(Instant instant) {
        ZonedDateTime et = easternDateTime(instant);
        return et.getHour() * 60 + et.getMinute();
    }

    /**
     * ET wall-clock datetime for an instant, using the same DST approximation as SessionGate /
     * SessionClassifier so the three agree on calendar boundaries.
     */
    private static ZonedDateTime easternDateTime(Instant instant) {
        ZonedDateTime utc = instant.atZone(ZoneOffset.UTC);
        int month = utc.getMonthValue();
        int day = utc.getDayOfMonth();
        boolean isEDT = (month > 3 && month < 11)
            || (month == 3 && day >= 8)
            || (month == 11 && day < 1);
        int etOffsetHours = isEDT ? -4 : -5;
        return instant.plusSeconds(etOffsetHours * 3600L).atZone(ZoneOffset.UTC);
    }

    private static String iso(LocalDate d) {
        return d.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
