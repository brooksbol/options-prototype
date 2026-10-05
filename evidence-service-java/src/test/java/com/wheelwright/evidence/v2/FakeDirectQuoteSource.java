package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Deterministic test {@link DirectQuoteSource}: no live provider contact.
 *
 * <p>Tests program per-symbol upstream behavior via {@code verified}, {@code unmatched},
 * {@code unsupported}, {@code failed}, {@code unavailable}, {@code admissionRejected}, then
 * assert the resulting per-subject outcomes. It records every {@link #acquire} batch so tests
 * can prove no-provider-work on request-wide failures, single-batch grouping, and
 * reconcile-by-identity.
 *
 * <p>It exposes the shared in-memory {@link SqliteEvidenceStore} so tests can assert the
 * held-evidence postcondition and retained-prior semantics directly against the authoritative
 * held-quote state (contract §19), without a public read endpoint.
 */
public class FakeDirectQuoteSource implements DirectQuoteSource {

    @Autowired
    private SqliteEvidenceStore store;

    private final Map<String, SubjectUpstream> programmed = new LinkedHashMap<>();
    private final List<List<String>> batches = new ArrayList<>();
    private boolean contactAvailable = true;

    public SqliteEvidenceStore store() {
        return store;
    }

    public void reset() {
        programmed.clear();
        batches.clear();
        contactAvailable = true;
    }

    public void contactAvailable(boolean v) {
        this.contactAvailable = v;
    }

    public int batchCount() {
        return batches.size();
    }

    public List<String> lastBatch() {
        return batches.isEmpty() ? List.of() : batches.get(batches.size() - 1);
    }

    // --- programming helpers -----------------------------------------------------------

    // Contact-time facts supplied by the fake (classified at contact in production). Default a
    // REGULAR_USABLE phase with a fixed regular-session date so HTTP-level happy-path NEWLY/REUSE
    // specimens are deterministic regardless of wall clock. Deterministic session/age/boundary
    // specimens live in DirectQuoteServiceTest with fixed clocks against the real logic.
    static final String DEFAULT_SESSION_DATE = "2026-10-05";
    static final String DEFAULT_RECEIVED_AT = "2026-10-05T14:30:01Z";

    public void verified(String symbol, RawQuote raw) {
        verifiedWithEpoch(symbol, raw, "1"); // real manager starts at epoch 1 → commit is current
    }

    public void verifiedWithEpoch(String symbol, RawQuote raw, String epoch) {
        programmed.put(symbol.toUpperCase(), new SubjectUpstream(
            UpstreamStatus.VERIFIED, raw, "tradier", QuoteProvenance.Environment.SANDBOX,
            UUID.randomUUID().toString(), "sandbox", epoch,
            QuoteProvenance.AcquisitionPhase.REGULAR_USABLE, DEFAULT_SESSION_DATE,
            DEFAULT_RECEIVED_AT, null));
    }

    public void unmatched(String symbol) {
        program(symbol, UpstreamStatus.UNMATCHED, "no match");
    }

    public void unsupported(String symbol) {
        program(symbol, UpstreamStatus.UNSUPPORTED, "unsupported subject");
    }

    public void failed(String symbol) {
        program(symbol, UpstreamStatus.FAILED, "provider failed");
    }

    public void unavailable(String symbol) {
        program(symbol, UpstreamStatus.UNAVAILABLE, "provider unavailable");
    }

    public void admissionRejected(String symbol) {
        program(symbol, UpstreamStatus.ADMISSION_REJECTED, "admission rejected");
    }

    private void program(String symbol, UpstreamStatus status, String detail) {
        programmed.put(symbol.toUpperCase(), new SubjectUpstream(
            status, null, "tradier", QuoteProvenance.Environment.SANDBOX,
            UUID.randomUUID().toString(), "sandbox", "1",
            QuoteProvenance.AcquisitionPhase.UNKNOWN, null, null, detail));
    }

    // --- DirectQuoteSource -------------------------------------------------------------

    @Override
    public boolean contactAvailable() {
        return contactAvailable;
    }

    @Override
    public BatchResult acquire(List<String> subjects, String requestId) {
        batches.add(List.copyOf(subjects));
        Map<String, SubjectUpstream> bySubject = new LinkedHashMap<>();
        for (String s : subjects) {
            SubjectUpstream u = programmed.get(s.toUpperCase());
            // Unprogrammed subject within an attempted batch → UNMATCHED (reconcile by identity;
            // never assume success for an absent subject).
            bySubject.put(s, u != null ? u : new SubjectUpstream(
                UpstreamStatus.UNMATCHED, null, "tradier", QuoteProvenance.Environment.SANDBOX,
                UUID.randomUUID().toString(), "sandbox", "1",
                QuoteProvenance.AcquisitionPhase.UNKNOWN, null, DEFAULT_RECEIVED_AT,
                "not returned by provider"));
        }
        return new BatchResult(bySubject);
    }
}
