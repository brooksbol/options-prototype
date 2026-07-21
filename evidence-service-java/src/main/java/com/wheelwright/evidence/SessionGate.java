package com.wheelwright.evidence;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Set;

/**
 * Session Gate — determines whether acquisition is permitted at a given instant.
 *
 * Behavioral parity with TypeScript isAcquisitionPermitted():
 *   - Regular session: 09:30–16:15 ET on trading days
 *   - Pre-market: before 09:30 ET
 *   - Closed canonical: after 16:15 ET (includes 15-min delay drain)
 *   - Early close: after 13:30 ET on designated half-days
 *   - Non-trading day: weekends and exchange holidays
 *
 * Uses an injectable Clock for deterministic testing.
 */
public class SessionGate {

    private static final Set<String> US_MARKET_HOLIDAYS_2026 = Set.of(
        "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
        "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25"
    );

    private static final Set<String> US_EARLY_CLOSE_2026 = Set.of(
        "2026-11-27",
        "2026-12-24"
    );

    private static final int MARKET_OPEN_MINUTES = 9 * 60 + 30;        // 09:30 ET
    private static final int MARKET_CLOSE_WITH_DELAY = 16 * 60 + 15;   // 16:15 ET
    private static final int EARLY_CLOSE_WITH_DELAY = 13 * 60 + 30;    // 13:30 ET

    private final Clock clock;

    public SessionGate(Clock clock) {
        this.clock = clock;
    }

    public SessionGate() {
        this(Clock.systemUTC());
    }

    /**
     * Determine whether acquisition is permitted at the current clock instant.
     */
    public SessionDecision isPermitted() {
        return isPermitted(Instant.now(clock));
    }

    /**
     * Determine whether acquisition is permitted at a specific instant.
     * Uses the same DST approximation as the TypeScript implementation:
     *   EDT (UTC-4) for months Apr–Oct (and late March, early November)
     *   EST (UTC-5) otherwise
     */
    public SessionDecision isPermitted(Instant now) {
        // Convert to UTC components for the DST approximation
        ZonedDateTime utc = now.atZone(ZoneOffset.UTC);
        int month = utc.getMonthValue();
        int day = utc.getDayOfMonth();

        // DST approximation matching TypeScript:
        // (month > 3 && month < 11) || (month === 3 && day >= 8) || (month === 11 && day < 1)
        // Note: month === 11 && day < 1 is never true, but preserved for parity
        boolean isEDT = (month > 3 && month < 11)
            || (month == 3 && day >= 8)
            || (month == 11 && day < 1);
        int etOffsetHours = isEDT ? -4 : -5;

        // Compute ET time by applying offset
        Instant etInstant = now.plusSeconds(etOffsetHours * 3600L);
        ZonedDateTime etDate = etInstant.atZone(ZoneOffset.UTC);

        String dateStr = etDate.toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
        DayOfWeek dow = etDate.getDayOfWeek();
        int hours = etDate.getHour();
        int minutes = etDate.getMinute();
        int timeMinutes = hours * 60 + minutes;

        // Weekend check
        if (dow == DayOfWeek.SATURDAY) {
            return SessionDecision.blocked("Weekend (Saturday)");
        }
        if (dow == DayOfWeek.SUNDAY) {
            return SessionDecision.blocked("Weekend (Sunday)");
        }

        // Holiday check
        if (US_MARKET_HOLIDAYS_2026.contains(dateStr)) {
            return SessionDecision.blocked("Exchange holiday (" + dateStr + ")");
        }

        // Determine close time based on early-close calendar
        int closeWithDelay = US_EARLY_CLOSE_2026.contains(dateStr)
            ? EARLY_CLOSE_WITH_DELAY
            : MARKET_CLOSE_WITH_DELAY;

        // Pre-market check
        if (timeMinutes < MARKET_OPEN_MINUTES) {
            return SessionDecision.blocked(String.format(
                "Pre-market (%d:%02d ET)", hours, minutes));
        }

        // Post-market / early close check
        if (timeMinutes > closeWithDelay) {
            String closeType = US_EARLY_CLOSE_2026.contains(dateStr) ? "Early close" : "Market closed";
            return SessionDecision.blocked(String.format(
                "%s (%d:%02d ET)", closeType, hours, minutes));
        }

        return SessionDecision.permitted("Regular session");
    }

    /**
     * Result of a session gate check.
     */
    public record SessionDecision(boolean permitted, String reason) {
        public static SessionDecision permitted(String reason) {
            return new SessionDecision(true, reason);
        }
        public static SessionDecision blocked(String reason) {
            return new SessionDecision(false, reason);
        }
    }
}
