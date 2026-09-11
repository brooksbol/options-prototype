package com.wheelwright.evidence;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.function.BooleanSupplier;
import java.util.function.Predicate;

/**
 * Authoritative market-session classification (Issue #16).
 *
 * <p>WHY THIS EXISTS — authority boundary. Market-session state and evidence
 * admissibility/canonicality are DOMAIN judgments that depend on the active
 * provider authority (real-time vs delayed). Only the backend knows the active
 * provider authority (via {@code ProviderAuthorityManager}), so only the backend
 * may compute these judgments. The frontend previously re-derived them from a
 * hardcoded Sandbox provider-delay profile, which manufactured a phantom
 * 09:30–09:45 ET "Open Delay" on the real-time Production feed and suppressed
 * canonical/admissible evidence. This classifier makes the backend the single
 * authority; the frontend renders/consumes its output and must not map provider
 * identity to delay policy itself.
 *
 * <p>This is the six-state TEMPORAL/evidence model the frontend needs. It is a
 * distinct projection from {@link SessionGate}'s three-state ACQUISITION posture
 * (BLOCKED / EXPIRATIONS_ONLY / FULL): the gate decides "what acquisition work is
 * permitted"; this classifier decides "what session condition to report and when
 * evidence is admissible/canonical". Both are driven by the SAME failover-aware
 * real-time signal so they can never disagree about provider authority.
 *
 * <p>PROVIDER-AWARE DELAY. {@code providerDelayMinutes} is 0 for a real-time
 * authority (Production) and 15 for a delayed authority (Sandbox). With a
 * real-time authority the REGULAR_OPEN_DELAY window {@code [open, open+delay]}
 * collapses to zero, so the session is REGULAR_OBSERVATION at the 09:30 open and
 * evidence acquired at/after the open is admissible immediately. With a delayed
 * authority the 15-minute open-delay window is preserved.
 *
 * <p>Pure/deterministic given an {@link Instant} and the real-time signal.
 * Reuses the ET/holiday/early-close conventions of {@link SessionGate} (kept in
 * sync deliberately — the gate and classifier share one calendar truth).
 */
public final class SessionClassifier {

    /** Six-state temporal/evidence session model (backend authority for the UI + admissibility). */
    public enum State {
        PREMARKET,
        REGULAR_OPEN_DELAY,
        REGULAR_OBSERVATION,
        DELAY_DRAIN,
        CLOSED_CANONICAL,
        NON_TRADING_DAY
    }

    // Calendar truth shared with SessionGate (2026). Kept identical intentionally.
    private static final Set<String> US_MARKET_HOLIDAYS_2026 = Set.of(
        "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
        "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25"
    );
    private static final Set<String> US_EARLY_CLOSE_2026 = Set.of(
        "2026-11-27", "2026-12-24"
    );

    private static final int MARKET_OPEN_MINUTES = 9 * 60 + 30;        // 09:30 ET
    private static final int STANDARD_CLOSE_MINUTES = 16 * 60;         // 16:00 ET
    private static final int EARLY_CLOSE_MINUTES = 13 * 60 + 15;       // 13:15 ET (eligible options close)

    /** Delayed-provider open/close delay, in minutes (Sandbox). Real-time uses 0. */
    private static final int DELAYED_PROVIDER_MINUTES = 15;

    private final Clock clock;
    /** True when the active provider serves real-time (undelayed) market data. */
    private final BooleanSupplier realtimeData;
    /** Durable authority for whether a completed canonical session can survive restart. */
    private final Predicate<String> persistedSessionValid;

    public SessionClassifier(Clock clock, BooleanSupplier realtimeData) {
        this(clock, realtimeData, ignored -> true);
    }

    public SessionClassifier(Clock clock, BooleanSupplier realtimeData,
                             Predicate<String> persistedSessionValid) {
        this.clock = clock != null ? clock : Clock.systemUTC();
        this.realtimeData = realtimeData != null ? realtimeData : () -> false;
        this.persistedSessionValid = persistedSessionValid != null
            ? persistedSessionValid : ignored -> false;
    }

    /** The provider delay in minutes for the CURRENT active authority (0 real-time, 15 delayed). */
    public int providerDelayMinutes() {
        return realtimeData.getAsBoolean() ? 0 : DELAYED_PROVIDER_MINUTES;
    }

    /** Classify at the current clock instant. */
    public Classification classify() {
        return classify(Instant.now(clock));
    }

    /**
     * Classify the authoritative session condition at a specific instant, for the
     * CURRENT active provider authority's delay semantics.
     */
    public Classification classify(Instant now) {
        int delayMin = providerDelayMinutes();
        EasternTime et = toEasternTime(now);

        // Non-trading day (weekend / holiday): canonical is the prior completed session.
        if (et.dow == DayOfWeek.SATURDAY || et.dow == DayOfWeek.SUNDAY
                || US_MARKET_HOLIDAYS_2026.contains(et.dateStr)) {
            String canonical = previousTradingDay(et.dateStr);
            return new Classification(State.NON_TRADING_DAY, canonical, null,
                /*acceptingCanonicalEvidence*/ false, persistedSessionValid.test(canonical),
                delayMin, /*admissibilityBoundaryEpochMs*/ null);
        }

        int closeMinutes = US_EARLY_CLOSE_2026.contains(et.dateStr)
            ? EARLY_CLOSE_MINUTES : STANDARD_CLOSE_MINUTES;

        long openEpochMs = etMinutesToEpochMs(et.dateStr, MARKET_OPEN_MINUTES, et.offsetHours);
        long admissibilityBoundaryMs = openEpochMs + (long) delayMin * 60_000L;
        int openPlusDelay = MARKET_OPEN_MINUTES + delayMin;
        int closePlusDelay = closeMinutes + delayMin;

        String today = et.dateStr;

        // Before open → PREMARKET (prior session canonical).
        if (et.timeMinutes < MARKET_OPEN_MINUTES) {
            String canonical = previousTradingDay(today);
            return new Classification(State.PREMARKET, canonical, today,
                false, persistedSessionValid.test(canonical), delayMin, null);
        }

        // [open, open+delay) → REGULAR_OPEN_DELAY. For a real-time authority delay=0,
        // so this window is empty and we fall straight through to REGULAR_OBSERVATION.
        if (et.timeMinutes < openPlusDelay) {
            String canonical = previousTradingDay(today);
            return new Classification(State.REGULAR_OPEN_DELAY, canonical, today,
                false, persistedSessionValid.test(canonical), delayMin, admissibilityBoundaryMs);
        }

        // [open+delay, close) → REGULAR_OBSERVATION (accepting canonical evidence).
        if (et.timeMinutes < closeMinutes) {
            return new Classification(State.REGULAR_OBSERVATION, today, today,
                true, false, delayMin, admissibilityBoundaryMs);
        }

        // [close, close+delay) → DELAY_DRAIN (final delayed observations still arriving).
        // For a real-time authority delay=0, so this window is empty.
        if (et.timeMinutes < closePlusDelay) {
            return new Classification(State.DELAY_DRAIN, today, today,
                true, false, delayMin, admissibilityBoundaryMs);
        }

        // Past close+delay → CLOSED_CANONICAL (sealed).
        return new Classification(State.CLOSED_CANONICAL, today, today,
            false, persistedSessionValid.test(today), delayMin, null);
    }

    /**
     * Determine whether a single evidence SUBJECT is admissible/canonical under the
     * session policy of the AUTHORITY THAT ACQUIRED IT (Issue #16 per-subject truth).
     *
     * <p>This is the anti-laundering core: a subject is judged by ITS OWN environment,
     * not by the currently-active authority. A production-acquired chain gets real-time
     * (0-delay) semantics; a sandbox-acquired chain gets delayed (15-min) semantics;
     * an unknown-environment chain is conservatively inadmissible (explicit unknown).
     *
     * @param subjectEnvironment "production" | "sandbox" | "unknown" (from provenance)
     * @param acquiredAt         the subject's own authoritative acquisition instant (nullable)
     * @param now                evaluation instant
     */
    public SubjectAdmissibility admissibilityForSubject(String subjectEnvironment,
                                                        Instant acquiredAt, Instant now) {
        String env = subjectEnvironment == null ? "unknown" : subjectEnvironment;
        if (!"production".equals(env) && !"sandbox".equals(env)) {
            // Unknown authority: do not invent semantics. Explicit conservative result.
            return new SubjectAdmissibility(false, "unknown", null, null);
        }
        int delayMin = "production".equals(env) ? 0 : DELAYED_PROVIDER_MINUTES;
        String basis = "production".equals(env) ? "real-time" : "delayed";

        EasternTime et = toEasternTime(now);
        if (et.dow == DayOfWeek.SATURDAY || et.dow == DayOfWeek.SUNDAY
                || US_MARKET_HOLIDAYS_2026.contains(et.dateStr)) {
            // Non-trading day: prior sealed session remains canonical; a subject acquired
            // in the prior session is admissible as sealed evidence.
            String canonical = previousTradingDay(et.dateStr);
            boolean admissible = acquiredAt != null;
            return new SubjectAdmissibility(admissible, basis, canonical, admissibilityBoundaryFor(canonical, delayMin, et.offsetHours));
        }

        int closeMinutes = US_EARLY_CLOSE_2026.contains(et.dateStr)
            ? EARLY_CLOSE_MINUTES : STANDARD_CLOSE_MINUTES;
        long openEpochMs = etMinutesToEpochMs(et.dateStr, MARKET_OPEN_MINUTES, et.offsetHours);
        long boundaryMs = openEpochMs + (long) delayMin * 60_000L;
        long closeEpochMs = etMinutesToEpochMs(et.dateStr, closeMinutes, et.offsetHours);
        boolean beforeBoundary = et.timeMinutes < MARKET_OPEN_MINUTES + delayMin;

        // The subject is admissible/canonical iff its EFFECTIVE observation (acquisition
        // minus this authority's delay) falls within TODAY's open session [open, close].
        // This is the anti-laundering core: a sandbox subject uses the 15-min delay, so a
        // chain acquired at 09:35 has effective observation 09:20 (before the 09:30 open)
        // and is NOT admissible as today's canonical evidence — even while production is
        // the active authority. A production subject (0 delay) is admissible immediately at
        // the open. Prior-session sealed evidence is not represented per-subject here
        // (chains carry a today acquisition instant); before-boundary we simply report the
        // prior canonical date with the subject inadmissible for today until its effective
        // observation lands in the open session.
        String canonical = beforeBoundary ? previousTradingDay(et.dateStr) : et.dateStr;
        boolean admissible = false;
        if (acquiredAt != null) {
            long effectiveMs = acquiredAt.toEpochMilli() - (long) delayMin * 60_000L;
            admissible = effectiveMs >= openEpochMs && effectiveMs <= closeEpochMs;
        }
        return new SubjectAdmissibility(admissible, basis, canonical, boundaryMs);
    }

    private Long admissibilityBoundaryFor(String dateStr, int delayMin, int offsetHours) {
        long openEpochMs = etMinutesToEpochMs(dateStr, MARKET_OPEN_MINUTES, offsetHours);
        return openEpochMs + (long) delayMin * 60_000L;
    }

    // --- Result records ---

    /**
     * Session-level classification (backend authority for UI + session behavior).
     *
     * @param state                        six-state temporal/evidence session state
     * @param canonicalSessionDate         the trading date whose evidence is currently canonical (ET, ISO)
     * @param currentTradingSessionDate    today's trading date, or null on a non-trading day
     * @param acceptingCanonicalEvidence   whether new current-session canonical evidence is being accepted
     * @param priorSessionOperationallyValid whether prior-session canonical evidence remains valid
     * @param providerDelayMinutes         delay of the CURRENT active authority (0 real-time, 15 delayed)
     * @param admissibilityBoundaryEpochMs epoch-ms before which active-session evidence is inadmissible; null when no gate applies
     */
    public record Classification(
        State state,
        String canonicalSessionDate,
        String currentTradingSessionDate,
        boolean acceptingCanonicalEvidence,
        boolean priorSessionOperationallyValid,
        int providerDelayMinutes,
        Long admissibilityBoundaryEpochMs
    ) {}

    /**
     * Per-subject admissibility verdict.
     *
     * @param admissible            whether this subject may be relied upon now
     * @param basis                 "real-time" | "delayed" | "unknown" (the authority's semantics)
     * @param canonicalSessionDate  the session date this subject is canonical for (nullable when unknown)
     * @param admissibilityBoundaryEpochMs the boundary applied to this subject (nullable)
     */
    public record SubjectAdmissibility(
        boolean admissible,
        String basis,
        String canonicalSessionDate,
        Long admissibilityBoundaryEpochMs
    ) {}

    // --- ET conversion (mirrors SessionGate's DST approximation for calendar consistency) ---

    private record EasternTime(String dateStr, DayOfWeek dow, int hours, int minutes,
                               int timeMinutes, int offsetHours) {}

    private EasternTime toEasternTime(Instant now) {
        ZonedDateTime utc = now.atZone(ZoneOffset.UTC);
        int month = utc.getMonthValue();
        int day = utc.getDayOfMonth();
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
        return new EasternTime(dateStr, dow, hours, minutes, hours * 60 + minutes, etOffsetHours);
    }

    /** Epoch-ms for a given ET date + ET minutes-from-midnight, using the supplied ET offset. */
    private long etMinutesToEpochMs(String dateStr, int etMinutes, int offsetHours) {
        LocalDate date = LocalDate.parse(dateStr);
        // Midnight ET = midnight UTC minus the offset (offset is negative for ET).
        long midnightUtcMs = date.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
            - (long) offsetHours * 3600_000L;
        return midnightUtcMs + (long) etMinutes * 60_000L;
    }

    /** Previous trading day (skips weekends + 2026 holidays). ISO date string. */
    private String previousTradingDay(String dateStr) {
        LocalDate d = LocalDate.parse(dateStr).minusDays(1);
        while (true) {
            DayOfWeek dow = d.getDayOfWeek();
            String iso = d.format(DateTimeFormatter.ISO_LOCAL_DATE);
            boolean holiday = US_MARKET_HOLIDAYS_2026.contains(iso);
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY && !holiday) {
                return iso;
            }
            d = d.minusDays(1);
        }
    }
}
