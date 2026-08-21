package com.wheelwright.evidence;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Set;

/**
 * Session Gate — determines acquisition posture at a given instant.
 *
 * Three experimental postures for the opening-relevant evidence experiment:
 *
 *   BLOCKED         — No acquisition permitted (weekends, holidays, overnight, post-close)
 *   EXPIRATIONS_ONLY — Reference-data refresh permitted, no chain/quote (premarket + delay window)
 *   FULL            — Full acquisition permitted (regular observation)
 *
 * Phase mapping (experimental scheduler postures, not new canonical session states):
 *   Phase 1 (09:00–09:30 ET): EXPIRATIONS_ONLY — premarket preparation for opening set
 *   Phase 2 (09:30–09:45 ET): EXPIRATIONS_ONLY — delay window; chains would be inadmissible
 *   Phase 3 (09:45–16:15 ET): FULL — regular observation with opening-burst priority
 *
 * The prior binary isPermitted() API is preserved for backward compatibility.
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

    // Time boundaries (minutes from midnight ET)
    private static final int PREMARKET_PREP_START = 9 * 60;            // 09:00 ET
    private static final int MARKET_OPEN_MINUTES = 9 * 60 + 30;        // 09:30 ET
    private static final int DELAY_END_MINUTES = 9 * 60 + 45;          // 09:45 ET
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
     * Acquisition posture — what kind of work is admissible right now.
     */
    public enum Posture {
        /** No acquisition permitted */
        BLOCKED,
        /** Expirations/reference-data only — no chain/quote fetches */
        EXPIRATIONS_ONLY,
        /** Full acquisition — chains, quotes, expirations all permitted */
        FULL
    }

    /**
     * Determine acquisition posture at the current clock instant.
     */
    public PostureDecision getPosture() {
        return getPosture(Instant.now(clock));
    }

    /**
     * Determine acquisition posture at a specific instant.
     */
    public PostureDecision getPosture(Instant now) {
        EasternTime et = toEasternTime(now);

        // Weekend check
        if (et.dow == DayOfWeek.SATURDAY) {
            return PostureDecision.of(Posture.BLOCKED, "Weekend (Saturday)");
        }
        if (et.dow == DayOfWeek.SUNDAY) {
            return PostureDecision.of(Posture.BLOCKED, "Weekend (Sunday)");
        }

        // Holiday check
        if (US_MARKET_HOLIDAYS_2026.contains(et.dateStr)) {
            return PostureDecision.of(Posture.BLOCKED, "Exchange holiday (" + et.dateStr + ")");
        }

        // Determine close time based on early-close calendar
        int closeWithDelay = US_EARLY_CLOSE_2026.contains(et.dateStr)
            ? EARLY_CLOSE_WITH_DELAY
            : MARKET_CLOSE_WITH_DELAY;

        // Post-market / early close — blocked
        if (et.timeMinutes > closeWithDelay) {
            String closeType = US_EARLY_CLOSE_2026.contains(et.dateStr) ? "Early close" : "Market closed";
            return PostureDecision.of(Posture.BLOCKED, String.format(
                "%s (%d:%02d ET)", closeType, et.hours, et.minutes));
        }

        // Before premarket preparation start — blocked
        if (et.timeMinutes < PREMARKET_PREP_START) {
            return PostureDecision.of(Posture.BLOCKED, String.format(
                "Pre-market (%d:%02d ET)", et.hours, et.minutes));
        }

        // Phase 1: 09:00–09:30 ET — expirations only (premarket preparation)
        if (et.timeMinutes < MARKET_OPEN_MINUTES) {
            return PostureDecision.of(Posture.EXPIRATIONS_ONLY, String.format(
                "Premarket preparation (%d:%02d ET)", et.hours, et.minutes));
        }

        // Phase 2: 09:30–09:45 ET — expirations only (delay window)
        if (et.timeMinutes < DELAY_END_MINUTES) {
            return PostureDecision.of(Posture.EXPIRATIONS_ONLY, String.format(
                "Opening delay window (%d:%02d ET)", et.hours, et.minutes));
        }

        // Phase 3: 09:45–close — full acquisition
        return PostureDecision.of(Posture.FULL, "Regular observation");
    }

    /**
     * Legacy API — preserves backward compatibility with existing callers.
     * Maps EXPIRATIONS_ONLY and FULL to permitted; BLOCKED to not permitted.
     */
    public SessionDecision isPermitted() {
        return isPermitted(Instant.now(clock));
    }

    /**
     * Legacy API — preserves backward compatibility.
     */
    public SessionDecision isPermitted(Instant now) {
        PostureDecision posture = getPosture(now);
        if (posture.posture() == Posture.BLOCKED) {
            return SessionDecision.blocked(posture.reason());
        }
        return SessionDecision.permitted(posture.reason());
    }

    // --- Internal time conversion ---

    private record EasternTime(String dateStr, DayOfWeek dow, int hours, int minutes, int timeMinutes) {}

    private EasternTime toEasternTime(Instant now) {
        ZonedDateTime utc = now.atZone(ZoneOffset.UTC);
        int month = utc.getMonthValue();
        int day = utc.getDayOfMonth();

        // DST approximation matching TypeScript:
        boolean isEDT = (month > 3 && month < 11)
            || (month == 3 && day >= 8)
            || (month == 11 && day < 1);
        int etOffsetHours = isEDT ? -4 : -5;

        Instant etInstant = now.plusSeconds(etOffsetHours * 3600L);
        ZonedDateTime etDate = etInstant.atZone(ZoneOffset.UTC);

        String dateStr = etDate.toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
        DayOfWeek dow = etDate.getDayOfWeek();
        int hours = etDate.getHour();
        int minutes = etDate.getMinute();
        int timeMinutes = hours * 60 + minutes;

        return new EasternTime(dateStr, dow, hours, minutes, timeMinutes);
    }

    // --- Result records ---

    /**
     * Full posture decision with three-state posture.
     */
    public record PostureDecision(Posture posture, String reason) {
        public static PostureDecision of(Posture posture, String reason) {
            return new PostureDecision(posture, reason);
        }

        /** Convenience: is any acquisition work permitted? */
        public boolean isActive() {
            return posture != Posture.BLOCKED;
        }
    }

    /**
     * Legacy binary decision (preserved for backward compatibility).
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
