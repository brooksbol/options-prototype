package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.AcquisitionLease;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The direct-quote acquisition engine for {@code POST /v2/quotes}.
 *
 * <p>Implements the ratified capability (contract §§5–19, Doc 76 §§21–23): per-subject
 * ordinary reuse evaluation, compatible-batch upstream acquisition, authority-fenced durable
 * commit, held-evidence visibility postcondition, and truthful per-subject terminal outcomes.
 *
 * <p>It is semantically NARROWER than v1 targeted refresh: it never acquires chains or
 * expirations, never enrolls observation demand, and never advances the snapshot generation
 * or recomputes Decision (contract §5, §17, §25).
 *
 * <p>Execution order (contract §15): resolve/validate (done by caller) → evaluate ordinary
 * reuse per subject → identify subjects needing upstream → batch upstream work → reconcile by
 * subject identity → independently normalize, fence, accept, and report each subject.
 */
@Service
public class DirectQuoteService {

    private final DirectQuoteSource source;
    private final ProviderAuthorityManager providerManager;
    private final SqliteEvidenceStore store;
    private final QuoteAcquisitionPolicy policy;
    private final Clock clock;
    private final ObjectMapper mapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired
    public DirectQuoteService(DirectQuoteSource source,
                              ProviderAuthorityManager providerManager,
                              SqliteEvidenceStore store,
                              QuoteAcquisitionPolicy policy) {
        this(source, providerManager, store, policy, Clock.systemUTC());
    }

    DirectQuoteService(DirectQuoteSource source,
                       ProviderAuthorityManager providerManager,
                       SqliteEvidenceStore store,
                       QuoteAcquisitionPolicy policy,
                       Clock clock) {
        this.source = source;
        this.providerManager = providerManager;
        this.store = store;
        this.policy = policy;
        this.clock = clock;
    }

    /** Whether the active provider feed is real-time (production) vs delayed (sandbox). */
    private boolean realtimeFeed() {
        try {
            return "production".equalsIgnoreCase(providerManager.active().environment());
        } catch (RuntimeException e) {
            // Conservative: treat as delayed if the active authority cannot be read. This only
            // shifts the regular-session window; it never redefines reuse eligibility.
            return false;
        }
    }

    /** Thrown when the backend capability cannot start the operation (maps to 503). */
    public static class CapabilityUnavailableException extends RuntimeException {
        public CapabilityUnavailableException(String message) {
            super(message);
        }
    }

    /**
     * Execute the acquisition operation for the given validated canonical subjects, in request
     * order. Returns one terminal result per subject. The whole operation is synchronous: this
     * returns only after every subject has a terminal result (contract §18).
     *
     * @param orderedSubjects validated requested subjects (preserve order; canonical symbol
     *                        resolution and duplicate detection already done by the caller)
     * @param mode effective acquisition intent (ORDINARY or FORCE)
     */
    public List<SubjectAcquisitionResult> acquire(
            List<AcquireQuotesRequest.RequestedSubject> orderedSubjects,
            AcquireQuotesRequest.Mode mode,
            String requestId) {

        Instant now = Instant.now(clock);
        boolean realtime = realtimeFeed();
        // "Active regular phase now" for the OFF-HOURS CONTACT decision only — derived from the
        // direct-quote trading calendar (Doc 79), NOT from SessionGate's Decision posture. This
        // governs whether off-hours contact policy applies; it does NOT classify the eventual
        // observation's phase (that is captured at the actual upstream contact — Doc 79 I2).
        boolean activeRegularPhaseNow =
            DirectQuoteSessionIdentity.phaseAt(now, realtime) == QuoteProvenance.AcquisitionPhase.REGULAR_USABLE;

        // Phase 1 — per-subject reuse evaluation (ORDINARY only). FORCE bypasses reuse entirely.
        // Prior held evidence is read once per subject and retained for both reuse and
        // retained-prior reporting on failure.
        Map<String, SqliteEvidenceStore.DirectQuoteRow> priorBySubject = new LinkedHashMap<>();
        Map<String, SubjectOutcome> decided = new LinkedHashMap<>();
        Map<String, QuoteObservation> reusedObservation = new LinkedHashMap<>();
        List<String> needUpstream = new ArrayList<>();

        for (AcquireQuotesRequest.RequestedSubject subject : orderedSubjects) {
            String canonical = subject.symbol();
            SqliteEvidenceStore.DirectQuoteRow prior = readPrior(canonical);
            if (prior != null) priorBySubject.put(canonical, prior);

            if (mode == AcquireQuotesRequest.Mode.ORDINARY
                    && prior != null
                    && reuseEligible(prior, now, activeRegularPhaseNow, realtime)) {
                decided.put(canonical, SubjectOutcome.REUSED);
                reusedObservation.put(canonical, toObservation(prior));
            } else {
                needUpstream.add(canonical);
            }
        }

        // Phase 2 — upstream acquisition for unresolved subjects. The only request-level
        // override is FORCE (bypasses reuse); it does NOT override a contact restriction.
        Map<String, SubjectOutcome> upstreamOutcome = new LinkedHashMap<>();
        Map<String, QuoteObservation> newlyAcquired = new LinkedHashMap<>();
        Map<String, String> failureDetail = new LinkedHashMap<>();

        if (!needUpstream.isEmpty()) {
            boolean offHours = !activeRegularPhaseNow;
            boolean contactPermitted = !(offHours && !policy.offHoursContactEnabled());

            if (!contactPermitted) {
                // Effective policy prohibits provider contact (contract §13, §14): truthful
                // non-fulfillment, prior retained separately. Applies to FORCE too. No provider
                // work occurs.
                for (String s : needUpstream) {
                    upstreamOutcome.put(s, SubjectOutcome.CONTACT_NOT_PERMITTED);
                    failureDetail.put(s, "off-hours provider contact is disabled by policy");
                }
            } else if (!source.contactAvailable()) {
                // Provider authority not established — distinct from reuse eligibility.
                for (String s : needUpstream) {
                    upstreamOutcome.put(s, SubjectOutcome.UPSTREAM_UNAVAILABLE);
                    failureDetail.put(s, "provider authority not established");
                }
            } else {
                acquireUpstream(needUpstream, requestId, upstreamOutcome, newlyAcquired, failureDetail);
            }
        }

        // Phase 3 — assemble per-subject terminal results in request order.
        List<SubjectAcquisitionResult> results = new ArrayList<>(orderedSubjects.size());
        for (AcquireQuotesRequest.RequestedSubject subject : orderedSubjects) {
            String canonical = subject.symbol();
            SubjectOutcome reuse = decided.get(canonical);
            if (reuse == SubjectOutcome.REUSED) {
                results.add(SubjectAcquisitionResult.fulfilled(
                    subject, SubjectOutcome.REUSED, reusedObservation.get(canonical)));
                continue;
            }
            SubjectOutcome outcome = upstreamOutcome.get(canonical);
            if (outcome == SubjectOutcome.NEWLY_ACQUIRED) {
                results.add(SubjectAcquisitionResult.fulfilled(
                    subject, SubjectOutcome.NEWLY_ACQUIRED, newlyAcquired.get(canonical)));
                continue;
            }
            // Unfulfilled: retained prior canonical evidence (if held) is reported but does
            // NOT fulfill the request.
            QuoteObservation prior = priorObservation(canonical, priorBySubject);
            results.add(SubjectAcquisitionResult.failed(
                subject,
                outcome == null ? SubjectOutcome.UPSTREAM_FAILED : outcome,
                prior,
                retryable(outcome),
                failureDetail.get(canonical)));
        }
        return results;
    }

    /** Perform the batched upstream acquisition, fence-commit, and held-state postcondition. */
    private void acquireUpstream(List<String> needUpstream, String requestId,
                                 Map<String, SubjectOutcome> upstreamOutcome,
                                 Map<String, QuoteObservation> newlyAcquired,
                                 Map<String, String> failureDetail) {

        DirectQuoteSource.BatchResult batch = source.acquire(needUpstream, requestId);

        for (String canonical : needUpstream) {
            DirectQuoteSource.SubjectUpstream u = batch.bySubject().get(canonical);
            if (u == null) {
                upstreamOutcome.put(canonical, SubjectOutcome.UNMATCHED);
                failureDetail.put(canonical, "provider did not return a matching subject");
                continue;
            }
            switch (u.status()) {
                case UNMATCHED -> {
                    upstreamOutcome.put(canonical, SubjectOutcome.UNMATCHED);
                    failureDetail.put(canonical, u.detail());
                }
                case UNSUPPORTED -> {
                    upstreamOutcome.put(canonical, SubjectOutcome.UNSUPPORTED_SUBJECT);
                    failureDetail.put(canonical, u.detail());
                }
                case ADMISSION_REJECTED -> {
                    upstreamOutcome.put(canonical, SubjectOutcome.ADMISSION_REJECTED);
                    failureDetail.put(canonical, u.detail());
                }
                case UNAVAILABLE -> {
                    upstreamOutcome.put(canonical, SubjectOutcome.UPSTREAM_UNAVAILABLE);
                    failureDetail.put(canonical, u.detail());
                }
                case FAILED -> {
                    upstreamOutcome.put(canonical, SubjectOutcome.UPSTREAM_FAILED);
                    failureDetail.put(canonical, u.detail());
                }
                // Phase/session are carried on the SubjectUpstream, classified at the actual
                // upstream-contact boundary (Doc 79 I2) — the service does not re-derive them.
                case VERIFIED -> commitVerified(canonical, u,
                    upstreamOutcome, newlyAcquired, failureDetail);
            }
        }
    }

    /**
     * Normalize, apply the price-bearing predicate, fence-commit, and verify held-state
     * visibility for one subject-verified upstream observation.
     */
    private void commitVerified(String canonical, DirectQuoteSource.SubjectUpstream u,
                                Map<String, SubjectOutcome> upstreamOutcome,
                                Map<String, QuoteObservation> newlyAcquired,
                                Map<String, String> failureDetail) {

        QuoteFacts facts = toCanonicalFacts(u.rawQuote());
        if (!facts.hasPositivePriceFact()) {
            // Previous-close/metadata-only or zero-only evidence (contract §7, specimens 22/24).
            upstreamOutcome.put(canonical, SubjectOutcome.INVALID_UPSTREAM_EVIDENCE);
            failureDetail.put(canonical, "no strictly positive direct quote-family price fact");
            return;
        }

        // Phase + regularSessionDate were classified at the actual upstream-contact boundary and
        // carried on the SubjectUpstream (Doc 79 I2). receivedAt is the payload-receipt instant.
        // committedAt is captured now, at authoritative acceptance — a distinct third boundary.
        QuoteProvenance.AcquisitionPhase phase = u.acquisitionPhase();
        String regularSessionDate = u.regularSessionDate();
        String observationId = UUID.randomUUID().toString();
        String committedAt = Instant.now(clock).toString();
        ResolvedSubject resolved = new ResolvedSubject(canonical, u.rawQuote().securityType());
        QuoteProvenance provenance = new QuoteProvenance(
            u.provider(), u.environment(), u.acquisitionId(), u.authorityEpoch(),
            phase, regularSessionDate, null, u.receivedAt(), committedAt);
        QuoteObservation observation = new QuoteObservation(observationId, resolved, facts, provenance);

        String factsJson;
        try {
            factsJson = mapper.writeValueAsString(facts);
        } catch (JsonProcessingException e) {
            upstreamOutcome.put(canonical, SubjectOutcome.ACCEPTANCE_FAILED);
            failureDetail.put(canonical, "could not serialize canonical facts");
            return;
        }

        SqliteEvidenceStore.DirectQuoteRow row = new SqliteEvidenceStore.DirectQuoteRow(
            canonical, observationId, resolved.securityType().name(), factsJson,
            u.provider(), u.environment().name(), u.acquisitionId(), u.authorityEpoch(),
            phase.name(), regularSessionDate, null, u.receivedAt(), committedAt);

        // Fenced durable commit: a superseded acquisition authority MUST NOT commit/publish
        // current evidence (contract §9). The fence epoch was captured when the provider was
        // CONTACTED (carried on the upstream result as authorityEpoch). We commit against THAT
        // captured epoch: if an authority transition advanced the epoch between contact and
        // commit, commitIfCurrent returns false → AUTHORITY_SUPERSEDED. Using the contact-time
        // epoch (not a fresh lease) is what makes the fence meaningful — fencing is NOT weakened
        // for correlation (Doc 79 I4). The lease carries the captured authority id and the
        // acquisition's operation id so the fenced store-mutation record is reconstructably
        // attributable to this acquisition (subordinate to the request correlation id, which
        // the provider observer events already carry via the opened PurposeScope).
        long capturedEpoch = parseEpoch(u.authorityEpoch());
        AcquisitionLease commitLease = new AcquisitionLease(
            u.authorityId(), u.environment().name(), capturedEpoch, u.acquisitionId(),
            u.acquisitionId(), null);
        boolean committed;
        try {
            committed = providerManager.commitIfCurrent(
                commitLease, canonical, "v2-direct-quote",
                () -> store.setDirectQuote(row), null);
        } catch (SQLException e) {
            upstreamOutcome.put(canonical, SubjectOutcome.ACCEPTANCE_FAILED);
            failureDetail.put(canonical, "durable acceptance failed");
            return;
        }

        if (!committed) {
            upstreamOutcome.put(canonical, SubjectOutcome.AUTHORITY_SUPERSEDED);
            failureDetail.put(canonical, "acquisition authority superseded before commit");
            return;
        }

        // Held-evidence postcondition (contract §19): the accepted observation must already be
        // authoritative held direct-quote evidence, visible through the internal held-quote
        // read, before NEWLY_ACQUIRED is reported.
        SqliteEvidenceStore.DirectQuoteRow heldBack;
        try {
            heldBack = store.getDirectQuote(canonical);
        } catch (SQLException e) {
            upstreamOutcome.put(canonical, SubjectOutcome.ACCEPTANCE_FAILED);
            failureDetail.put(canonical, "held-state verification failed");
            return;
        }
        if (heldBack == null || !observationId.equals(heldBack.observationId())) {
            upstreamOutcome.put(canonical, SubjectOutcome.ACCEPTANCE_FAILED);
            failureDetail.put(canonical, "accepted observation not visible in held-quote state");
            return;
        }

        upstreamOutcome.put(canonical, SubjectOutcome.NEWLY_ACQUIRED);
        newlyAcquired.put(canonical, observation);
    }

    // --- Reuse eligibility --------------------------------------------------------------

    /**
     * Ordinary acquisition-reuse eligibility for a held observation (contract §11, §12).
     *
     * <p>During an active usable regular-observation phase: the prior must have been acquired
     * during that same regular phase ({@code REGULAR_USABLE}) and its upstream receipt age must
     * be within the configured contact-age limit (default 60s). During a closed period:
     * completed-session reuse (if enabled) permits a quote acquired during the latest completed
     * regular session to satisfy the request.
     */
    boolean reuseEligible(SqliteEvidenceStore.DirectQuoteRow prior, Instant now,
                          boolean activeRegularPhaseNow, boolean realtime) {
        // A held observation is reusable only when its PERSISTED provenance positively
        // establishes membership in the reuse boundary applicable NOW (Doc 79 I1). Session
        // membership comes from the persisted contact-context regularSessionDate — never from
        // receivedAt, wall-clock age, or Decision publication.
        if (!QuoteProvenance.AcquisitionPhase.REGULAR_USABLE.name().equals(prior.acquisitionPhase())) {
            // Only evidence acquired during a usable regular phase can satisfy either rule.
            return false;
        }
        String priorSession = prior.regularSessionDate();
        if (priorSession == null || priorSession.isBlank()) {
            // Absent regular-session identity → fail closed for session-specific reuse (Doc 79
            // I1). Never guess a session date from receipt time.
            return false;
        }

        if (activeRegularPhaseNow) {
            // Active-session reuse requires BOTH (a) session/feed identity agreement with the
            // current regular session AND (b) successful-upstream-contact age within the
            // configured threshold using PRECISE instant/duration comparison (no whole-second
            // truncation). A new regular/feed boundary therefore disqualifies prior-boundary
            // evidence even if its age is under the limit.
            String currentSession = DirectQuoteSessionIdentity
                .regularSessionDateAt(now, realtime).map(java.time.LocalDate::toString).orElse(null);
            if (currentSession == null || !currentSession.equals(priorSession)) {
                return false; // different (or unestablished) regular session → not reusable
            }
            Duration ageLimit = policy.activeContactAge();
            if (ageLimit.isZero() || ageLimit.isNegative()) return false; // zero disables age reuse
            Instant received = parseInstant(prior.receivedAt());
            if (received == null) return false;
            Duration age = Duration.between(received, now);
            if (age.isNegative()) return false; // future receipt is not reusable
            return age.compareTo(ageLimit) <= 0; // precise: <= threshold, no truncation
        }

        // Closed period: completed-session reuse requires POSITIVE proof that the persisted
        // regular-session date equals the LATEST COMPLETED regular trading session (Doc 79 I1).
        // Merely predating closure, or being the newest held quote, is insufficient; a quote
        // from two sessions ago, or one acquired after close, does not qualify. Provider
        // availability is NOT consulted.
        if (!policy.completedSessionReuseEnabled()) return false;
        String latestCompleted = DirectQuoteSessionIdentity
            .latestCompletedRegularSessionDate(now, realtime).map(java.time.LocalDate::toString).orElse(null);
        return latestCompleted != null && latestCompleted.equals(priorSession);
    }

    // --- Prior held evidence ------------------------------------------------------------

    private SqliteEvidenceStore.DirectQuoteRow readPrior(String canonical) {
        try {
            return store.getDirectQuote(canonical);
        } catch (SQLException e) {
            return null;
        }
    }

    private QuoteObservation priorObservation(
            String canonical, Map<String, SqliteEvidenceStore.DirectQuoteRow> priorBySubject) {
        SqliteEvidenceStore.DirectQuoteRow prior = priorBySubject.get(canonical);
        return prior == null ? null : toObservation(prior);
    }

    /** Rebuild a {@link QuoteObservation} from a held row (original identity and clocks). */
    private QuoteObservation toObservation(SqliteEvidenceStore.DirectQuoteRow row) {
        QuoteFacts facts;
        try {
            facts = mapper.readValue(row.factsJson(), QuoteFacts.class);
        } catch (JsonProcessingException e) {
            facts = new QuoteFacts(null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null);
        }
        ResolvedSubject.SecurityType type;
        try {
            type = ResolvedSubject.SecurityType.valueOf(row.securityType());
        } catch (IllegalArgumentException e) {
            type = ResolvedSubject.SecurityType.OTHER_UNDERLYING;
        }
        QuoteProvenance.AcquisitionPhase phase;
        try {
            phase = QuoteProvenance.AcquisitionPhase.valueOf(row.acquisitionPhase());
        } catch (IllegalArgumentException e) {
            phase = QuoteProvenance.AcquisitionPhase.UNKNOWN;
        }
        QuoteProvenance.Environment env;
        try {
            env = QuoteProvenance.Environment.valueOf(row.environment());
        } catch (IllegalArgumentException e) {
            env = QuoteProvenance.Environment.SANDBOX;
        }
        QuoteProvenance provenance = new QuoteProvenance(
            row.provider(), env, row.acquisitionId(), row.authorityEpoch(), phase,
            row.regularSessionDate(), row.feedIdentity(), row.receivedAt(), row.committedAt());
        return new QuoteObservation(row.observationId(),
            new ResolvedSubject(row.symbol(), type), facts, provenance);
    }

    // --- Fact canonicalization ----------------------------------------------------------

    /**
     * Canonicalize raw provider facts into {@link QuoteFacts}: preserve each present fact,
     * omit absent facts (never zero by substitution), never synthesize {@code last} or rename
     * {@code close} (contract §7). A side/trade fact object is built only when its price is
     * present.
     */
    private QuoteFacts toCanonicalFacts(DirectQuoteSource.RawQuote r) {
        QuoteFacts.TradeFact last = r.last() == null ? null
            : new QuoteFacts.TradeFact(r.last(), r.lastSize(), r.lastSourceEventAt());
        QuoteFacts.SideFact bid = r.bid() == null ? null
            : new QuoteFacts.SideFact(r.bid(), r.bidSize(), r.bidVenue(), r.bidSourceEventAt());
        QuoteFacts.SideFact ask = r.ask() == null ? null
            : new QuoteFacts.SideFact(r.ask(), r.askSize(), r.askVenue(), r.askSourceEventAt());
        return new QuoteFacts(
            r.description(), r.exchange(), last, bid, ask,
            r.open(), r.high(), r.low(), r.close(), r.previousClose(),
            r.volume(), r.reportedChange(), r.reportedChangePercent(),
            r.averageVolume(), r.fiftyTwoWeekHigh(), r.fiftyTwoWeekLow());
    }

    // --- Misc ---------------------------------------------------------------------------

    private static boolean retryable(SubjectOutcome outcome) {
        if (outcome == null) return true;
        return switch (outcome) {
            case UPSTREAM_UNAVAILABLE, ADMISSION_REJECTED, UPSTREAM_FAILED,
                 AUTHORITY_SUPERSEDED, ACCEPTANCE_FAILED -> true;
            // UNMATCHED, UNSUPPORTED_SUBJECT, CONTACT_NOT_PERMITTED, INVALID_UPSTREAM_EVIDENCE
            // describe conditions another immediate attempt is unlikely to change.
            default -> false;
        };
    }

    private static Instant parseInstant(String s) {
        if (s == null) return null;
        try {
            return Instant.parse(s);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Parse the opaque authority epoch captured at provider contact back to the long fence
     * epoch. A non-numeric/absent value yields -1, which can never equal a real current epoch
     * (so it fences out → AUTHORITY_SUPERSEDED rather than committing under unknown authority).
     */
    private static long parseEpoch(String authorityEpoch) {
        if (authorityEpoch == null) return -1L;
        try {
            return Long.parseLong(authorityEpoch.trim());
        } catch (NumberFormatException e) {
            return -1L;
        }
    }
}

