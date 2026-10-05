package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.SessionGate;
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
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Focused acceptance tests for the session-/age-/reuse-dependent specimens that require
 * deterministic control over the clock and session phase (contract §§11–14, specimens
 * 2/4/10/11/12/13/23). These cannot be made deterministic through MockMvc with the live
 * system clock, so they drive {@link DirectQuoteService} directly with fixed clocks and a
 * phase-aligned {@link SessionGate}, a real in-memory store, a real
 * {@link ProviderAuthorityManager} (genuine fencing), and a programmable fake source.
 */
class DirectQuoteServiceTest {

    // 2026-10-05 is a Monday. 14:30 UTC == 10:30 ET → regular-observation (FULL) phase.
    private static final Instant ACTIVE_NOON = Instant.parse("2026-10-05T14:30:00Z");
    // 02:00 UTC == 22:00 ET prior day → BLOCKED (closed period).
    private static final Instant CLOSED_NIGHT = Instant.parse("2026-10-05T02:00:00Z");

    private final ObjectMapper mapper = new ObjectMapper();

    // --- harness -----------------------------------------------------------------------

    private record Harness(DirectQuoteService service, SqliteEvidenceStore store,
                           ProgrammableSource source) {}

    private Harness harness(Instant now, long activeAgeSeconds, boolean completedReuse,
                            boolean offHours) throws SQLException {
        SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        // Real-time provider → FULL at/after 09:30; the fixed clock places us in the intended phase.
        SessionGate gate = new SessionGate(clock, () -> true);
        ProviderAuthorityManager manager = legacyManager();
        QuoteAcquisitionPolicy policy = new QuoteAcquisitionPolicy(activeAgeSeconds, completedReuse, offHours);
        ProgrammableSource source = new ProgrammableSource();
        DirectQuoteService service = new DirectQuoteService(source, manager, store, gate, policy, clock);
        return new Harness(service, store, source);
    }

    /** A minimal real ProviderAuthorityManager (production authority, epoch 1). */
    private ProviderAuthorityManager legacyManager() {
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

    private static DirectQuoteSource.RawQuote rawLast(double last) {
        return new DirectQuoteSource.RawQuote(
            ResolvedSubject.SecurityType.ETF, "desc", "ARCA",
            last, 100L, "2026-10-05T14:30:00Z",
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null);
    }

    /** Prepopulate a held direct-quote row acquired `agoSeconds` before `now` in `phase`. */
    private void seedHeld(SqliteEvidenceStore store, String symbol, Instant now, long agoSeconds,
                          QuoteProvenance.AcquisitionPhase phase) throws Exception {
        QuoteFacts facts = new QuoteFacts(null, null,
            new QuoteFacts.TradeFact(100.0, null, null), null, null,
            null, null, null, null, null, null, null, null, null, null, null);
        String factsJson = mapper.writeValueAsString(facts);
        String received = now.minusSeconds(agoSeconds).toString();
        store.setDirectQuote(new SqliteEvidenceStore.DirectQuoteRow(
            symbol, UUID.randomUUID().toString(), "ETF", factsJson,
            "tradier", "PRODUCTION", UUID.randomUUID().toString(), "1",
            phase.name(), "2026-10-05", null, received, received));
    }

    // --- Specimen 12: active age boundary at and just beyond 60s ------------------------

    @Test
    @DisplayName("Specimen 12: at age == 60s (active phase) eligible held quote is REUSED")
    void activeAgeAtBoundaryReused() throws Exception {
        Harness h = harness(ACTIVE_NOON, 60, true, true);
        seedHeld(h.store(), "SPY", ACTIVE_NOON, 60, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        assertThat(h.source().batchCount()).isZero(); // no upstream contact
    }

    @Test
    @DisplayName("Specimen 12: at age just beyond 60s (active phase) must attempt upstream")
    void activeAgeJustBeyondBoundaryReacquires() throws Exception {
        Harness h = harness(ACTIVE_NOON, 60, true, true);
        seedHeld(h.store(), "SPY", ACTIVE_NOON, 61, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        h.source().verified("SPY", rawLast(756.19));
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        assertThat(h.source().batchCount()).isEqualTo(1); // upstream attempted
    }

    // --- Specimen 13: new regular/feed boundary (off-hours-acquired prior cannot reuse) --

    @Test
    @DisplayName("Specimen 13: a prior acquired off-hours cannot satisfy active-session reuse even if < 60s old")
    void newRegularBoundaryForcesReacquire() throws Exception {
        Harness h = harness(ACTIVE_NOON, 60, true, true);
        // Prior acquired 10s ago but during a CLOSED phase (off-hours). Active-session reuse
        // requires a REGULAR_USABLE prior, so this must reacquire despite being young.
        seedHeld(h.store(), "SPY", ACTIVE_NOON, 10, QuoteProvenance.AcquisitionPhase.CLOSED);
        h.source().verified("SPY", rawLast(756.19));
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    // --- Specimen 10: closed-period completed-session reuse -----------------------------

    @Test
    @DisplayName("Specimen 10: during a closed period a prior regular-session quote is REUSED (default)")
    void completedSessionReuse() throws Exception {
        Harness h = harness(CLOSED_NIGHT, 60, true, true);
        // Acquired many hours ago during a regular session; wall-clock age far exceeds 60s but
        // completed-session reuse applies during the closed period.
        seedHeld(h.store(), "SPY", CLOSED_NIGHT, 36_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        assertThat(h.source().batchCount()).isZero();
    }

    @Test
    @DisplayName("Specimen 10b: with completed-session reuse DISABLED the closed-period request reacquires")
    void completedSessionReuseDisabled() throws Exception {
        Harness h = harness(CLOSED_NIGHT, 60, false, true);
        seedHeld(h.store(), "SPY", CLOSED_NIGHT, 36_000, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        h.source().verified("SPY", rawLast(756.19));
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    // --- Specimen 11: explicit off-hours contact behavior -------------------------------

    @Test
    @DisplayName("Specimen 11: off-hours with no reusable prior attempts upstream (default contact enabled)")
    void offHoursContactAttempts() throws Exception {
        Harness h = harness(CLOSED_NIGHT, 60, true, true);
        h.source().verified("SPY", rawLast(756.19));
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        // Off-hours acquisition is NOT labeled active regular-session evidence.
        assertThat(results.get(0).observation().provenance().acquisitionPhase())
            .isEqualTo(QuoteProvenance.AcquisitionPhase.CLOSED);
    }

    @Test
    @DisplayName("Specimen 11b: with off-hours contact DISABLED a closed-period miss is CONTACT_NOT_PERMITTED")
    void offHoursContactDisabled() throws Exception {
        Harness h = harness(CLOSED_NIGHT, 60, true, false);
        h.source().verified("SPY", rawLast(756.19)); // would succeed, but contact is prohibited
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.CONTACT_NOT_PERMITTED);
        assertThat(h.source().batchCount()).isZero(); // no upstream work
    }

    @Test
    @DisplayName("FORCE off-hours with contact disabled is CONTACT_NOT_PERMITTED (no manufactured attempt)")
    void forceOffHoursContactDisabled() throws Exception {
        Harness h = harness(CLOSED_NIGHT, 60, true, false);
        h.source().verified("SPY", rawLast(756.19));
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.FORCE);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.CONTACT_NOT_PERMITTED);
        assertThat(h.source().batchCount()).isZero();
    }

    // --- Specimen 23: legacy chain-only spot => no canonical direct-quote reuse ----------

    @Test
    @DisplayName("Specimen 23: a symbol with no held DIRECT quote (legacy chain spot only) does not reuse")
    void legacyChainSpotNoReuse() throws Exception {
        // No direct_quote row is seeded (legacy chain-derived spot lives in a different table
        // and is never consulted here). An ORDINARY active request therefore seeks upstream.
        Harness h = harness(ACTIVE_NOON, 60, true, true);
        h.source().verified("SPY", rawLast(756.19));
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
    }

    // --- Specimen 4: mixed held and upstream -------------------------------------------

    @Test
    @DisplayName("Specimen 4: mixed — held subject REUSED (omitted from batch), other NEWLY_ACQUIRED")
    void mixedHeldAndUpstream() throws Exception {
        Harness h = harness(ACTIVE_NOON, 60, true, true);
        seedHeld(h.store(), "SPY", ACTIVE_NOON, 10, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        h.source().verified("QQQ", rawLast(698.41));
        var results = h.service().acquire(subjects("SPY", "QQQ"), AcquireQuotesRequest.Mode.ORDINARY);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.REUSED);
        assertThat(results.get(1).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        // Reusable subject is NOT included in the upstream batch (semantic work first).
        assertThat(h.source().lastBatch()).containsExactly("QQQ");
    }

    // --- FORCE bypasses reuse (even for a young held quote) -----------------------------

    @Test
    @DisplayName("FORCE bypasses an otherwise-eligible held quote and makes a real attempt")
    void forceBypassesReuse() throws Exception {
        Harness h = harness(ACTIVE_NOON, 60, true, true);
        seedHeld(h.store(), "SPY", ACTIVE_NOON, 5, QuoteProvenance.AcquisitionPhase.REGULAR_USABLE);
        h.source().verified("SPY", rawLast(756.19));
        var results = h.service().acquire(subjects("SPY"), AcquireQuotesRequest.Mode.FORCE);
        assertThat(results.get(0).outcome()).isEqualTo(SubjectOutcome.NEWLY_ACQUIRED);
        assertThat(h.source().batchCount()).isEqualTo(1); // real upstream attempt despite young prior
    }

    // --- A simple programmable DirectQuoteSource for service-level tests ----------------

    private static final class ProgrammableSource implements DirectQuoteSource {
        private final Map<String, SubjectUpstream> programmed = new LinkedHashMap<>();
        private final List<List<String>> batches = new ArrayList<>();

        void verified(String symbol, RawQuote raw) {
            programmed.put(symbol.toUpperCase(), new SubjectUpstream(
                UpstreamStatus.VERIFIED, raw, "tradier", QuoteProvenance.Environment.PRODUCTION,
                UUID.randomUUID().toString(), "1", "2026-10-05T14:30:01Z", null));
        }

        int batchCount() { return batches.size(); }
        List<String> lastBatch() { return batches.isEmpty() ? List.of() : batches.get(batches.size() - 1); }

        @Override public boolean contactAvailable() { return true; }

        @Override public BatchResult acquire(List<String> subjects) {
            batches.add(List.copyOf(subjects));
            Map<String, SubjectUpstream> bySubject = new LinkedHashMap<>();
            for (String s : subjects) {
                SubjectUpstream u = programmed.get(s.toUpperCase());
                bySubject.put(s, u != null ? u : new SubjectUpstream(
                    UpstreamStatus.UNMATCHED, null, "tradier", QuoteProvenance.Environment.PRODUCTION,
                    UUID.randomUUID().toString(), "1", "2026-10-05T14:30:01Z", "not returned"));
            }
            return new BatchResult(bySubject);
        }
    }
}
