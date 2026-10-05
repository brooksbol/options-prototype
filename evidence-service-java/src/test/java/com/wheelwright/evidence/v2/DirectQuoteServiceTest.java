package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.ProviderAuthority;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Deterministic acceptance + adversarial regression tests for the reuse-identity (I1),
 * temporal-truth (I2), and off-hours/FORCE specimens that require controlled clocks
 * (Doc 79 falsification matrix). These drive {@link DirectQuoteService} directly with fixed
 * clocks, a real in-memory store, a real {@link ProviderAuthorityManager} (genuine fencing),
 * and a programmable source, so the real reuse logic (sessions, calendar, precise duration) is
 * exercised rather than mocked.
 *
 * <p>Each @DisplayName names the Doc 79 §5 counterexample the test prevents from recurring.
 */
class DirectQuoteServiceTest {

    // --- fixed clocks (2026 calendar) --------------------------------------------------
    // 2026-10-05 Monday 10:30 ET → regular-observation. regularSessionDate = 2026-10-05.
    private static final Instant MON_ACTIVE = Instant.parse("2026-10-05T14:30:00Z");
    // 2026-10-05 Monday 20:30 ET → after close → closed period; latest completed = 2026-10-05.
    private static final Instant MON_AFTER_CLOSE = Instant.parse("2026-10-06T00:30:00Z");
    // Sunday 2026-10-04 22:00 ET → non-trading; latest completed regular session = Fri 2026-10-02.
    private static final Instant SUNDAY_NIGHT = Instant.parse("2026-10-05T02:00:00Z");
    // Monday 2026-01-19 is a holiday (MLK). Fri 2026-01-16 is the latest completed session.
    private static final Instant HOLIDAY_MON = Instant.parse("2026-01-19T18:00:00Z"); // 13:00 ET holiday

    private final ObjectMapper mapper = new ObjectMapper();

    // --- harness -----------------------------------------------------------------------

    private record Harness(DirectQuoteService service, SqliteEvidenceStore store,
                           ProgrammableSource source) {}

    private Harness harness(Instant now, long activeAgeSeconds, boolean completedReuse,
                            boolean offHours) throws SQLException {
        SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        ProviderAuthorityManager manager = realtimeManager();
        QuoteAcquisitionPolicy policy = new QuoteAcquisitionPolicy(activeAgeSeconds, completedReuse, offHours);
        ProgrammableSource source = new ProgrammableSource();
        DirectQuoteService service = new DirectQuoteService(source, manager, store, policy, clock);
        return new Harness(service, store, source);
    }

    /** A minimal real production (real-time) ProviderAuthorityManager, epoch 1. */
    private ProviderAuthorityManager realtimeManager() {
        ResponseCache cache = new ResponseCache();
        RequestPacer pacer = new RequestPacer(119, 200);
        TradierAdapter adapter = new TradierAdapter("test-key", "https://api.tradier.com/v1", cache, pacer);
        ProviderAuthority prod = new ProviderAuthority("prod", "production", adapter, cache, pacer);
        ProviderAuthorityManager m = new ProviderAuthorityManager(prod, null);
        m.markSingleAuthorityActiveForLegacy();
        return m;
    }

    private static List<AcquireQuotesRequest.RequestedSubject> subjects(String... syms) {
        List<AcquireQuotesRequest.RequestedSubject> out = new ArrayList<>();
        for (String s : syms) out.add(new AcquireQuotesRequest.RequestedSubject(s));
        return out;
    }

    private List<SubjectAcquisitionResult> acquire(Harness h, AcquireQuotesRequest.Mode mode, String... syms) {
        return h.service().acquire(subjects(syms), mode, "req-" + UUID.randomUUID());
    }

    private static DirectQuoteSource.RawQuote rawLast(double last) {
        return new DirectQuoteSource.RawQuote(
            ResolvedSubject.SecurityType.ETF, "desc", "ARCA",
            last, 100L, "2026-10-05T14:30:00Z",
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null);
    }

    /**
     * Seed a held direct quote whose provenance names {@code sessionDate} as the contact-context
     * regular-session date, acquired {@code agoSeconds} before {@code now} with the given phase.
     * The receivedAt (receipt) is {@code now - agoSeconds}; clocks are preserved verbatim on reuse.
     */
    private void seedHeld(SqliteEvidenceStore store, String symbol, Instant now, long agoSeconds,
                          QuoteProvenance.AcquisitionPhase phase, String sessionDate) throws Exception {
        QuoteFacts facts = new QuoteFacts(null, null,
            new QuoteFacts.TradeFact(100.0, null, null), null, null,
            null, null, null, null, null, null, null, null, null, null, null);
        String factsJson = mapper.writeValueAsString(facts);
        String received = now.minusSeconds(agoSeconds).toString();
        store.setDirectQuote(new SqliteEvidenceStore.DirectQuoteRow(
            symbol, UUID.randomUUID().toString(), "ETF", factsJson,
            "tradier", "PRODUCTION", UUID.randomUUID().toString(), "1",
            phase.name(), sessionDate, null, received, received));
    }

    // === REUSE IDENTITY (Doc 79 I1) ====================================================

    @Test
    @DisplayName("I1 active age at threshold (60s) with matching session → REUSED (precise duration, no truncation)")
    void activeAgeAtThresholdReused() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        seedHeld(h.store(), "SPY", MON_ACTIVE, 60, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-05");
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        assertThat(h.source().batchCount()).isZero();
    }

    @Test
    @DisplayName("I1 active age 60s exactly (sub-second over truncates to 60 but is really 60.5s) → NOT reused")
    void activeAgePreciseDurationNoTruncation() throws Exception {
        // Age is 60.5s: whole-second truncation (the rejected impl) would read 60 and REUSE;
        // precise Duration semantics read 60.5 > 60 and must reacquire.
        Harness h = harness(MON_ACTIVE, 60, true, true);
        QuoteFacts facts = new QuoteFacts(null, null, new QuoteFacts.TradeFact(100.0, null, null),
            null, null, null, null, null, null, null, null, null, null, null, null, null);
        String received = MON_ACTIVE.minus(Duration.ofMillis(60_500)).toString();
        h.store().setDirectQuote(new SqliteEvidenceStore.DirectQuoteRow(
            "SPY", UUID.randomUUID().toString(), "ETF", mapper.writeValueAsString(facts),
            "tradier", "PRODUCTION", UUID.randomUUID().toString(), "1",
            QuoteProvenance.AcquisitionPhase.REGULAR_USABLE.name(), "2026-10-05", null, received, received));
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        assertThat(h.source().batchCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("I1 active age just beyond 60s with matching session → reacquires")
    void activeAgeJustBeyondThresholdReacquires() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        seedHeld(h.store(), "SPY", MON_ACTIVE, 61, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-05");
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 prior-boundary evidence under 60s but from a DIFFERENT regular session → not active-reusable")
    void priorBoundaryYoungButDifferentSessionNotReused() throws Exception {
        // Young (10s) and REGULAR_USABLE, but its session date is the PRIOR trading day, not today.
        // A new regular/feed boundary disqualifies it despite the sub-threshold age (Doc 79 I1).
        Harness h = harness(MON_ACTIVE, 60, true, true);
        seedHeld(h.store(), "SPY", MON_ACTIVE, 10, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-02");
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 off-hours-acquired prior (phase != REGULAR_USABLE) cannot satisfy active reuse even if young")
    void offHoursPriorNotActiveReusable() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        seedHeld(h.store(), "SPY", MON_ACTIVE, 10, QuoteProvenance.AcquisitionPhase.POST_MARKET, "2026-10-05");
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 completed-session reuse during weekend selects the ACTUAL latest completed session (Fri)")
    void weekendCompletedSessionReuse() throws Exception {
        // Sunday night: latest completed regular session is Friday 2026-10-02.
        Harness h = harness(SUNDAY_NIGHT, 60, true, true);
        seedHeld(h.store(), "SPY", SUNDAY_NIGHT, 200_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-02");
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        assertThat(h.source().batchCount()).isZero();
    }

    @Test
    @DisplayName("I1 quote from TWO sessions ago does not reuse during closure (not the latest completed session)")
    void twoSessionsAgoDoesNotReuse() throws Exception {
        // Sunday night: latest completed = Fri 2026-10-02. A Thursday 2026-10-01 quote must NOT reuse.
        Harness h = harness(SUNDAY_NIGHT, 60, true, true);
        seedHeld(h.store(), "SPY", SUNDAY_NIGHT, 300_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-01");
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 holiday boundary selects the actual latest completed trading session (Fri before MLK Monday)")
    void holidayBoundaryLatestCompletedSession() throws Exception {
        // 2026-01-19 (MLK) is a holiday; latest completed regular session is Fri 2026-01-16.
        Harness h = harness(HOLIDAY_MON, 60, true, true);
        seedHeld(h.store(), "SPY", HOLIDAY_MON, 300_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-01-16");
        var reused = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(reused.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);

        // A quote dated to the holiday itself (not a real session) must NOT reuse.
        Harness h2 = harness(HOLIDAY_MON, 60, true, true);
        seedHeld(h2.store(), "SPY", HOLIDAY_MON, 1_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-01-19");
        h2.source().verified("SPY", rawLast(1.0));
        var reacq = acquire(h2, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(reacq.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 quote acquired AFTER Friday close does not become Friday completed-session evidence")
    void postCloseQuoteNotCompletedSessionEvidence() throws Exception {
        // Monday after close: latest completed session = Monday 2026-10-05. A quote whose contact
        // phase was POST_MARKET (acquired after a close) is not REGULAR_USABLE, so it fails the
        // phase gate — it never becomes that session's completed-session evidence merely by being
        // newest (Doc 79 I1).
        Harness h = harness(MON_AFTER_CLOSE, 60, true, true);
        seedHeld(h.store(), "SPY", MON_AFTER_CLOSE, 60, QuoteProvenance.AcquisitionPhase.POST_MARKET, "2026-10-05");
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 absent regularSessionDate fails closed for completed-session reuse")
    void absentSessionDateFailsClosed() throws Exception {
        Harness h = harness(SUNDAY_NIGHT, 60, true, true);
        seedHeld(h.store(), "SPY", SUNDAY_NIGHT, 200_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, null);
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 completed-session reuse DISABLED → closed-period request reacquires")
    void completedSessionReuseDisabled() throws Exception {
        Harness h = harness(SUNDAY_NIGHT, 60, false, true);
        seedHeld(h.store(), "SPY", SUNDAY_NIGHT, 200_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-02");
        h.source().verified("SPY", rawLast(756.19));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    @Test
    @DisplayName("I1 provider availability does not alter reuse eligibility (eligible held reuses while provider down)")
    void providerAvailabilityDoesNotAlterReuse() throws Exception {
        Harness h = harness(SUNDAY_NIGHT, 60, true, true);
        h.source().contactAvailable(false); // provider down
        seedHeld(h.store(), "SPY", SUNDAY_NIGHT, 200_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-02");
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        // Still REUSED — eligibility is evidence-identity-bound, not provider-availability-bound.
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        assertThat(h.source().batchCount()).isZero();
    }

    @Test
    @DisplayName("I1 an INELIGIBLE held quote does not become eligible because the provider is down")
    void providerDownDoesNotMakeIneligibleReusable() throws Exception {
        Harness h = harness(SUNDAY_NIGHT, 60, true, true);
        h.source().contactAvailable(false);
        // Two-sessions-ago quote: ineligible for completed-session reuse.
        seedHeld(h.store(), "SPY", SUNDAY_NIGHT, 300_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-01");
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        // Not reused; and since provider is unavailable, truthful UPSTREAM_UNAVAILABLE (no laundering).
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.UPSTREAM_UNAVAILABLE);
    }

    // === TEMPORAL TRUTH (Doc 79 I2) ====================================================

    @Test
    @DisplayName("I2 reused observation preserves original provenance/clocks (receivedAt/committedAt/session unchanged)")
    void reusePreservesClocks() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        String received = MON_ACTIVE.minusSeconds(30).toString();
        QuoteFacts facts = new QuoteFacts(null, null, new QuoteFacts.TradeFact(100.0, null, null),
            null, null, null, null, null, null, null, null, null, null, null, null, null);
        String obsId = UUID.randomUUID().toString();
        h.store().setDirectQuote(new SqliteEvidenceStore.DirectQuoteRow(
            "SPY", obsId, "ETF", mapper.writeValueAsString(facts),
            "tradier", "PRODUCTION", "acq-xyz", "1",
            QuoteProvenance.AcquisitionPhase.REGULAR_USABLE.name(), "2026-10-05", null, received, received));
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        QuoteObservation obs = results.get(0).observation();
        assertThat(obs.observationId()).isEqualTo(obsId);
        assertThat(obs.provenance().receivedAt()).isEqualTo(received);
        assertThat(obs.provenance().committedAt()).isEqualTo(received);
        assertThat(obs.provenance().regularSessionDate()).isEqualTo("2026-10-05");
        assertThat(obs.provenance().acquisitionPhase()).isEqualTo(QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
    }

    @Test
    @DisplayName("I2 failed FORCE reacquisition does not rewrite the retained prior's clocks")
    void failedReacquisitionDoesNotRewritePriorClocks() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        String received = MON_ACTIVE.minusSeconds(30).toString();
        String obsId = UUID.randomUUID().toString();
        QuoteFacts facts = new QuoteFacts(null, null, new QuoteFacts.TradeFact(100.0, null, null),
            null, null, null, null, null, null, null, null, null, null, null, null, null);
        h.store().setDirectQuote(new SqliteEvidenceStore.DirectQuoteRow(
            "SPY", obsId, "ETF", mapper.writeValueAsString(facts),
            "tradier", "PRODUCTION", "acq-xyz", "1",
            QuoteProvenance.AcquisitionPhase.REGULAR_USABLE.name(), "2026-10-05", null, received, received));
        h.source().failed("SPY");
        var results = acquire(h, AcquireQuotesRequest.Mode.FORCE, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.UPSTREAM_FAILED);
        assertThat(results.get(0).priorRetained()).isTrue();
        // The held row is byte-identical afterward.
        var held = h.store().getDirectQuote("SPY");
        assertThat(held.observationId()).isEqualTo(obsId);
        assertThat(held.receivedAt()).isEqualTo(received);
        assertThat(held.committedAt()).isEqualTo(received);
    }

    @Test
    @DisplayName("I2 source event time stays a provider fact, distinct from Wheelwright receipt/commit clocks")
    void sourceEventTimeDistinctFromWheelwrightClocks() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        // Provider trade time is an arbitrary provider-reported instant; the service must not
        // overwrite it with its own clocks.
        DirectQuoteSource.RawQuote raw = new DirectQuoteSource.RawQuote(
            ResolvedSubject.SecurityType.ETF, "desc", "ARCA",
            756.19, 100L, "2026-10-05T09:31:12Z", // last.sourceEventAt — a provider fact
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null);
        h.source().verifiedAt("SPY", raw, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE,
            "2026-10-05", MON_ACTIVE.minusSeconds(2).toString());
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        QuoteObservation obs = results.get(0).observation();
        assertThat(obs.facts().last().sourceEventAt()).isEqualTo("2026-10-05T09:31:12Z");
        assertThat(obs.provenance().receivedAt()).isEqualTo(MON_ACTIVE.minusSeconds(2).toString());
        // committedAt is "now" (the fixed clock), distinct from both source time and receipt.
        assertThat(obs.provenance().committedAt()).isEqualTo(MON_ACTIVE.toString());
        assertThat(obs.provenance().committedAt()).isNotEqualTo(obs.facts().last().sourceEventAt());
        assertThat(obs.provenance().committedAt()).isNotEqualTo(obs.provenance().receivedAt());
    }

    @Test
    @DisplayName("I2 contact-before-close / receipt-after-close: phase=pre-close contact, receivedAt=post-close receipt")
    void contactBeforeCloseReceiptAfterClose() throws Exception {
        Harness h = harness(MON_AFTER_CLOSE, 60, true, true);
        // The SOURCE classifies phase/session at contact (REGULAR_USABLE, 2026-10-05) and records
        // a receivedAt that falls AFTER the close. The service must not force them to agree.
        DirectQuoteSource.RawQuote raw = rawLast(756.19);
        String receiptAfterClose = Instant.parse("2026-10-05T20:01:00Z").toString(); // 16:01 ET
        h.source().verifiedAt("SPY", raw, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE,
            "2026-10-05", receiptAfterClose);
        var results = acquire(h, AcquireQuotesRequest.Mode.FORCE, "SPY"); // FORCE to guarantee upstream
        QuoteObservation obs = results.get(0).observation();
        assertThat(obs.provenance().acquisitionPhase()).isEqualTo(QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        assertThat(obs.provenance().regularSessionDate()).isEqualTo("2026-10-05");
        assertThat(obs.provenance().receivedAt()).isEqualTo(receiptAfterClose);
    }

    // === OFF-HOURS / FORCE (contract §13/§14) ==========================================

    @Test
    @DisplayName("off-hours with no reusable prior attempts upstream; result is NOT labeled regular-session evidence")
    void offHoursContactAttempts() throws Exception {
        Harness h = harness(SUNDAY_NIGHT, 60, true, true);
        DirectQuoteSource.RawQuote raw = rawLast(756.19);
        h.source().verifiedAt("SPY", raw, QuoteProvenance.AcquisitionPhase.CLOSED, null,
            SUNDAY_NIGHT.toString());
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        assertThat(results.get(0).observation().provenance().acquisitionPhase())
            .isEqualTo(QuoteProvenance.AcquisitionPhase.CLOSED);
        assertThat(results.get(0).observation().provenance().regularSessionDate()).isNull();
    }

    @Test
    @DisplayName("off-hours contact DISABLED → CONTACT_NOT_PERMITTED, no provider work (ORDINARY and FORCE)")
    void offHoursContactDisabled() throws Exception {
        Harness ordinary = harness(SUNDAY_NIGHT, 60, true, false);
        ordinary.source().verifiedAt("SPY", rawLast(1.0), QuoteProvenance.AcquisitionPhase.CLOSED, null, SUNDAY_NIGHT.toString());
        var r1 = acquire(ordinary, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(r1.get(0).outcome()).isEqualTo(SubjectOutcome.CONTACT_NOT_PERMITTED);
        assertThat(ordinary.source().batchCount()).isZero();

        Harness forced = harness(SUNDAY_NIGHT, 60, true, false);
        forced.source().verifiedAt("SPY", rawLast(1.0), QuoteProvenance.AcquisitionPhase.CLOSED, null, SUNDAY_NIGHT.toString());
        var r2 = acquire(forced, AcquireQuotesRequest.Mode.FORCE, "SPY");
        assertThat(r2.get(0).outcome()).isEqualTo(SubjectOutcome.CONTACT_NOT_PERMITTED);
        assertThat(forced.source().batchCount()).isZero();
    }

    @Test
    @DisplayName("mixed held + upstream: eligible held REUSED and omitted from the upstream batch")
    void mixedHeldAndUpstream() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        seedHeld(h.store(), "SPY", MON_ACTIVE, 10, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-05");
        h.source().verifiedAt("QQQ", rawLast(698.41), QuoteProvenance.AcquisitionPhase.REGULAR_USABLE,
            "2026-10-05", MON_ACTIVE.toString());
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY", "QQQ");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        assertThat(results.get(1).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        assertThat(h.source().lastBatch()).containsExactly("QQQ");
    }

    @Test
    @DisplayName("FORCE bypasses an otherwise-eligible held quote and makes a real upstream attempt")
    void forceBypassesReuse() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        seedHeld(h.store(), "SPY", MON_ACTIVE, 5, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-05");
        h.source().verifiedAt("SPY", rawLast(756.19), QuoteProvenance.AcquisitionPhase.REGULAR_USABLE,
            "2026-10-05", MON_ACTIVE.toString());
        var results = acquire(h, AcquireQuotesRequest.Mode.FORCE, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        assertThat(h.source().batchCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("legacy chain-only spot (no held DIRECT quote) does not reuse")
    void legacyChainSpotNoReuse() throws Exception {
        Harness h = harness(MON_ACTIVE, 60, true, true);
        h.source().verifiedAt("SPY", rawLast(756.19), QuoteProvenance.AcquisitionPhase.REGULAR_USABLE,
            "2026-10-05", MON_ACTIVE.toString());
        var results = acquire(h, AcquireQuotesRequest.Mode.ORDINARY, "SPY");
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    // --- A programmable DirectQuoteSource that carries contact-time facts ---------------

    private static final class ProgrammableSource implements DirectQuoteSource {
        private final Map<String, SubjectUpstream> programmed = new LinkedHashMap<>();
        private final List<List<String>> batches = new ArrayList<>();
        private boolean contactAvailable = true;

        void contactAvailable(boolean v) { this.contactAvailable = v; }

        void verified(String symbol, RawQuote raw) {
            verifiedAt(symbol, raw, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, "2026-10-05",
                "2026-10-05T14:30:01Z");
        }

        void verifiedAt(String symbol, RawQuote raw, QuoteProvenance.AcquisitionPhase phase,
                        String sessionDate, String receivedAt) {
            programmed.put(symbol.toUpperCase(), new SubjectUpstream(
                UpstreamStatus.VERIFIED, raw, "tradier", QuoteProvenance.Environment.PRODUCTION,
                UUID.randomUUID().toString(), "prod", "1", phase, sessionDate, receivedAt, null));
        }

        void failed(String symbol) {
            programmed.put(symbol.toUpperCase(), new SubjectUpstream(
                UpstreamStatus.FAILED, null, "tradier", QuoteProvenance.Environment.PRODUCTION,
                UUID.randomUUID().toString(), "prod", "1",
                QuoteProvenance.AcquisitionPhase.UNKNOWN, null, null, "provider failed"));
        }

        int batchCount() { return batches.size(); }
        List<String> lastBatch() { return batches.isEmpty() ? List.of() : batches.get(batches.size() - 1); }

        @Override public boolean contactAvailable() { return contactAvailable; }

        @Override public BatchResult acquire(List<String> subjects, String requestId) {
            batches.add(List.copyOf(subjects));
            Map<String, SubjectUpstream> bySubject = new LinkedHashMap<>();
            for (String s : subjects) {
                SubjectUpstream u = programmed.get(s.toUpperCase());
                bySubject.put(s, u != null ? u : new SubjectUpstream(
                    UpstreamStatus.UNMATCHED, null, "tradier", QuoteProvenance.Environment.PRODUCTION,
                    UUID.randomUUID().toString(), "prod", "1",
                    QuoteProvenance.AcquisitionPhase.UNKNOWN, null, null, "not returned"));
            }
            return new BatchResult(bySubject);
        }
    }
}
