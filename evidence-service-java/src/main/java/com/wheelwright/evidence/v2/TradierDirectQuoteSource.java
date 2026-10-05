package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.provider.AcquisitionLease;
import com.wheelwright.evidence.provider.ObservationRecorder;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.ProviderError;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Production {@link DirectQuoteSource}: a real, paced, authority-fenced Tradier quote batch.
 *
 * <p>It mints ONE acquisition lease off {@link ProviderAuthorityManager} (capturing the
 * current authority + fence epoch atomically), opens the pacer's {@code PurposeScope} so the
 * request correlation id and captured epoch travel onto the provider observer plane (Doc 79
 * I4), and issues one multi-symbol {@link TradierAdapter#getQuotes} call. It performs NO
 * persistence here — the fenced durable commit happens in {@link DirectQuoteService}. The
 * captured authority identity/epoch, the contact-time acquisition phase + regular-session date
 * (classified at the actual HTTP-send boundary — Doc 79 I2), and the receipt instant are
 * carried back per subject.
 *
 * <p>Subject verification is positive and fail-closed (Doc 79 I3): a subject is VERIFIED only
 * when the returned canonical symbol equals the requested canonical symbol AND the provider
 * security type maps to an allowed underlying type. Options, unknown, missing, or unrecognized
 * types are UNSUPPORTED; a symbol the provider did not return is UNMATCHED. There is no
 * {@code OTHER_UNDERLYING} fallback.
 *
 * <p>Deliberately does NOT reuse the v1 acquisition path: no chain acquisition, no
 * expirations, no observation-demand enrollment, no snapshot publication (contract §5, §25).
 */
@Component
public class TradierDirectQuoteSource implements DirectQuoteSource {

    private final ProviderAuthorityManager providerManager;

    public TradierDirectQuoteSource(ProviderAuthorityManager providerManager) {
        this.providerManager = providerManager;
    }

    @Override
    public boolean contactAvailable() {
        return providerManager.acquisitionAuthorityEstablished();
    }

    @Override
    public BatchResult acquire(List<String> subjects, String requestId) {
        Map<String, SubjectUpstream> bySubject = new LinkedHashMap<>();
        if (subjects == null || subjects.isEmpty()) {
            return new BatchResult(bySubject);
        }

        // One atomic lease: authority identity + fence epoch captured together. acquisitionId is
        // the Wheelwright identity of this accepted upstream attempt (subordinate to requestId).
        AcquisitionLease lease = providerManager.acquireLease();
        String acquisitionId = UUID.randomUUID().toString();
        String authorityId = lease.authorityId();
        long epoch = lease.fenceEpoch();
        String authorityEpoch = Long.toString(epoch);
        QuoteProvenance.Environment environment = environmentOf(lease.environment());
        boolean realtime = "production".equalsIgnoreCase(lease.environment());
        String provider = "tradier";

        // I4 correlation: open the pacer purpose scope so EVERY provider observer event this
        // acquisition causes carries the request-correlated logical operation id and the
        // CAPTURED authority epoch — never the null-logical-id / epoch-zero default. The
        // logical id embeds the request id so provider work is reconstructably attributable to
        // the HTTP request while the acquisitionId remains a coexisting subordinate identity.
        String logicalOperationId = "v2quote-" + safeRequestId(requestId) + "-" + acquisitionId;
        ObservationRecorder observer = providerManager.observer();
        lease.adapter().pacer().openPurposeScope(
            logicalOperationId, ObservationRecorder.Purpose.ACTIVE_ACQUISITION,
            String.join(",", subjects), acquisitionId, epoch);

        TradierAdapter.QuotesResult result;
        try {
            result = lease.adapter().getQuotes(subjects);
        } catch (ProviderError pe) {
            lease.adapter().pacer().clearPurposeScope();
            recordLogicalOutcome(observer, logicalOperationId, authorityId, epoch,
                String.join(",", subjects), ObservationRecorder.LogicalOutcome.ACQUISITION_REJECTED);
            UpstreamStatus status = pe.getStatusCode() == 429
                ? UpstreamStatus.ADMISSION_REJECTED
                : UpstreamStatus.UNAVAILABLE;
            for (String s : subjects) {
                bySubject.put(s, failure(status, provider, environment, acquisitionId,
                    authorityId, authorityEpoch, safeDetail(pe)));
            }
            return new BatchResult(bySubject);
        } catch (Exception e) {
            lease.adapter().pacer().clearPurposeScope();
            recordLogicalOutcome(observer, logicalOperationId, authorityId, epoch,
                String.join(",", subjects), ObservationRecorder.LogicalOutcome.ACQUISITION_REJECTED);
            for (String s : subjects) {
                bySubject.put(s, failure(UpstreamStatus.FAILED, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, safeDetail(e)));
            }
            return new BatchResult(bySubject);
        } finally {
            lease.adapter().pacer().clearPurposeScope();
        }

        // I2 temporal truth: classify acquisitionPhase + regularSessionDate from the ACTUAL
        // upstream-contact instant captured inside the callable (bracketing the HTTP send),
        // and record receivedAt from the distinct successful-payload-receipt instant. They
        // describe different events and are not forced to agree.
        Instant contactAt = parseInstant(result.contactAt());
        QuoteProvenance.AcquisitionPhase phase = contactAt == null
            ? QuoteProvenance.AcquisitionPhase.UNKNOWN
            : DirectQuoteSessionIdentity.phaseAt(contactAt, realtime);
        String regularSessionDate = contactAt == null ? null
            : DirectQuoteSessionIdentity.regularSessionDateAt(contactAt, realtime)
                .map(java.time.LocalDate::toString).orElse(null);
        String receivedAt = result.receivedAt();

        boolean anyVerified = false;
        for (String s : subjects) {
            TradierAdapter.RawQuoteFacts raw = result.bySymbol().get(s);
            if (raw == null) {
                // Not returned by an otherwise completed response → UNMATCHED (contract §16).
                bySubject.put(s, new SubjectUpstream(
                    UpstreamStatus.UNMATCHED, null, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, phase, regularSessionDate,
                    receivedAt, "provider did not return a matching subject"));
                continue;
            }
            // I3 positive subject verification. (a) returned canonical symbol must equal the
            // requested canonical symbol; a mismatch fails that subject independently even under
            // HTTP 200. (b) the provider security type must map to an allowed underlying type.
            String returnedSymbol = raw.symbol() == null ? null : raw.symbol().toUpperCase(Locale.ROOT);
            if (returnedSymbol == null || !returnedSymbol.equals(s)) {
                bySubject.put(s, new SubjectUpstream(
                    UpstreamStatus.UNMATCHED, null, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, phase, regularSessionDate,
                    receivedAt, "returned subject identity did not match requested subject"));
                continue;
            }
            ResolvedSubject.SecurityType type = allowedUnderlyingType(raw.securityTypeRaw());
            if (type == null) {
                // Unknown / missing / unrecognized / option / otherwise unsupported provider
                // type FAILS CLOSED. No OTHER_UNDERLYING fallback (Doc 79 I3).
                bySubject.put(s, new SubjectUpstream(
                    UpstreamStatus.UNSUPPORTED, null, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, phase, regularSessionDate,
                    receivedAt, "provider security type is not a supported underlying: "
                        + describeType(raw.securityTypeRaw())));
                continue;
            }
            anyVerified = true;
            bySubject.put(s, new SubjectUpstream(
                UpstreamStatus.VERIFIED, toRawQuote(raw, type), provider, environment,
                acquisitionId, authorityId, authorityEpoch, phase, regularSessionDate,
                receivedAt, null));
        }

        // Transport-level logical outcome correlated to the request (subordinate to the pacer's
        // per-HTTP transport records). COMMITTED/REJECTED evidence outcomes are recorded by the
        // fenced commit path in the service; this records whether the batch yielded any
        // verified subject at all, attributable to the request.
        recordLogicalOutcome(observer, logicalOperationId, authorityId, epoch,
            String.join(",", subjects),
            anyVerified ? ObservationRecorder.LogicalOutcome.ACQUISITION_NO_USABLE_EVIDENCE
                        : ObservationRecorder.LogicalOutcome.ACQUISITION_REJECTED);
        return new BatchResult(bySubject);
    }

    private static void recordLogicalOutcome(ObservationRecorder observer, String logicalId,
                                             String authorityId, long epoch, String subject,
                                             ObservationRecorder.LogicalOutcome outcome) {
        if (observer == null) return;
        try {
            observer.recordLogicalOutcome(logicalId, authorityId, epoch, subject,
                ObservationRecorder.Purpose.ACTIVE_ACQUISITION, outcome);
        } catch (RuntimeException ignored) {
            // observer faults must never affect acquisition
        }
    }

    private static String safeRequestId(String requestId) {
        return requestId == null || requestId.isBlank() ? "unknown" : requestId;
    }

    private static SubjectUpstream failure(UpstreamStatus status, String provider,
                                           QuoteProvenance.Environment environment,
                                           String acquisitionId, String authorityId,
                                           String authorityEpoch, String detail) {
        // A request-wide provider failure has no subject-verified contact facts: phase UNKNOWN,
        // no regular-session date, no receipt instant.
        return new SubjectUpstream(status, null, provider, environment,
            acquisitionId, authorityId, authorityEpoch,
            QuoteProvenance.AcquisitionPhase.UNKNOWN, null, null, detail);
    }

    private static QuoteProvenance.Environment environmentOf(String leaseEnvironment) {
        if ("production".equalsIgnoreCase(leaseEnvironment)) return QuoteProvenance.Environment.PRODUCTION;
        return QuoteProvenance.Environment.SANDBOX;
    }

    /**
     * Map a Tradier security type to an allowed underlying type, or null when it is not a
     * supported underlying. Positive verification only (Doc 79 I3): {@code option} and any
     * unknown/missing/unrecognized type return null so the caller fails closed. There is NO
     * {@code OTHER_UNDERLYING} fallback.
     */
    static ResolvedSubject.SecurityType allowedUnderlyingType(String tradierType) {
        if (tradierType == null) return null;
        return switch (tradierType.toLowerCase(Locale.ROOT)) {
            case "etf" -> ResolvedSubject.SecurityType.ETF;
            case "stock" -> ResolvedSubject.SecurityType.EQUITY;
            case "index" -> ResolvedSubject.SecurityType.INDEX;
            // option, unknown, absent, unrecognized → not a supported underlying → fail closed.
            default -> null;
        };
    }

    private static String describeType(String tradierType) {
        return tradierType == null ? "(absent)" : tradierType;
    }

    /** Map verified Tradier raw facts to the Wheelwright {@link RawQuote} with its resolved type. */
    private static RawQuote toRawQuote(TradierAdapter.RawQuoteFacts r, ResolvedSubject.SecurityType type) {
        return new RawQuote(
            type,
            r.description(), r.exchange(),
            r.last(), r.lastSize(), r.tradeDate(),
            r.bid(), r.bidSize(), r.bidExchange(), r.bidDate(),
            r.ask(), r.askSize(), r.askExchange(), r.askDate(),
            r.open(), r.high(), r.low(), r.close(), r.prevClose(),
            r.volume(), r.change(), r.changePercentage(), r.averageVolume(),
            r.week52High(), r.week52Low());
    }

    private static Instant parseInstant(String s) {
        if (s == null) return null;
        try {
            return Instant.parse(s);
        } catch (RuntimeException e) {
            return null;
        }
    }

    /** Safe detail: provider message only, never credentials or raw payload. */
    private static String safeDetail(Throwable t) {
        String msg = t.getMessage();
        return msg == null ? t.getClass().getSimpleName() : msg;
    }
}
