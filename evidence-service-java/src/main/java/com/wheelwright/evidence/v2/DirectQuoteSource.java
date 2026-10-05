package com.wheelwright.evidence.v2;

import java.util.List;
import java.util.Map;

/**
 * The upstream direct-quote acquisition seam.
 *
 * <p>This isolates the single act of "contact the provider for N subjects and return
 * subject-verified raw quote facts, reconciled by requested identity" from the acquisition
 * policy, fencing, persistence, and outcome logic in {@link DirectQuoteService}. The
 * production implementation ({@link TradierDirectQuoteSource}) performs a real, paced,
 * authority-fenced Tradier call; tests substitute a deterministic fake so acceptance
 * semantics are validated without live-provider access.
 *
 * <p>Reconciliation is BY REQUESTED CANONICAL SUBJECT IDENTITY, never by provider response
 * position (contract §15). An upstream HTTP 200 never implies every requested subject
 * succeeded; unmatched subjects are reported explicitly.
 */
public interface DirectQuoteSource {

    /** Whether provider contact can currently be attempted at all (authority established). */
    boolean contactAvailable();

    /**
     * Acquire raw quote facts for the given canonical subjects in one logical operation.
     *
     * <p>The implementation batches compatible upstream work (contract §15, Doc 77) but the
     * batch creates no shared success boundary: each requested subject is reconciled
     * independently. The returned {@link BatchResult} carries, per subject, either accepted
     * raw facts (with the acquisition identity/provenance context) or the reason it could
     * not be acquired.
     *
     * @param subjects canonical uppercase subjects requiring upstream acquisition
     * @param requestId the HTTP request correlation id, carried end-to-end into provider
     *                  observer context (Doc 79 I4) so provider work is reconstructably
     *                  attributable to the request; subordinate ids (acquisitionId, lease
     *                  logical id, measurement sequence) coexist and do not replace it
     * @return per-subject acquisition outcomes reconciled by identity
     */
    BatchResult acquire(List<String> subjects, String requestId);

    /**
     * Per-subject upstream acquisition outcome, reconciled by canonical identity.
     *
     * <p>{@code bySubject} contains exactly the requested subjects. Each maps to a
     * {@link SubjectUpstream} describing what happened for that subject alone.
     */
    record BatchResult(Map<String, SubjectUpstream> bySubject) {}

    /**
     * What the upstream contact produced for one canonical subject.
     *
     * <p>Temporal truth (Doc 79 I2): {@code acquisitionPhase} and {@code regularSessionDate}
     * are classified at the ACTUAL upstream-contact (HTTP-send) boundary and carried here;
     * {@code receivedAt} is the later successful-payload receipt instant. They describe
     * different events and are not forced to agree. {@code regularSessionDate} is null when the
     * contact had no unambiguous regular-session identity (fail closed).
     *
     * <p>Correlation (Doc 79 I4): {@code authorityId} and {@code authorityEpoch} are the
     * captured authority identity/epoch of the authorizing lease, carried so the service can
     * fence the commit against the contact-time epoch and attribute persistence to the request.
     */
    record SubjectUpstream(
            UpstreamStatus status,
            RawQuote rawQuote,
            String provider,
            QuoteProvenance.Environment environment,
            String acquisitionId,
            String authorityId,
            String authorityEpoch,
            QuoteProvenance.AcquisitionPhase acquisitionPhase,
            String regularSessionDate,
            String receivedAt,
            String detail
    ) {}

    /** The upstream status for a single subject within a completed acquisition operation. */
    enum UpstreamStatus {
        /** Provider returned a subject-verified quote (facts still subject to the price predicate). */
        VERIFIED,
        /** Provider completed but did not return this requested subject. */
        UNMATCHED,
        /** Subject is outside the supported underlying class / cannot be served. */
        UNSUPPORTED,
        /** No upstream call was admitted (admission control rejected the work). */
        ADMISSION_REJECTED,
        /** Provider could not be contacted / transport failure. */
        UNAVAILABLE,
        /** The upstream attempt failed for a provider-reported reason. */
        FAILED
    }

    /**
     * Raw provider-reported quote facts for one subject, before Wheelwright canonicalization
     * into {@link QuoteFacts}. All fields are nullable; absence is preserved (never zero by
     * substitution). Security type is Wheelwright-resolved.
     */
    record RawQuote(
            ResolvedSubject.SecurityType securityType,
            String description,
            String exchange,
            Double last, Long lastSize, String lastSourceEventAt,
            Double bid, Long bidSize, String bidVenue, String bidSourceEventAt,
            Double ask, Long askSize, String askVenue, String askSourceEventAt,
            Double open, Double high, Double low, Double close, Double previousClose,
            Long volume, Double reportedChange, Double reportedChangePercent,
            Long averageVolume, Double fiftyTwoWeekHigh, Double fiftyTwoWeekLow
    ) {}
}
