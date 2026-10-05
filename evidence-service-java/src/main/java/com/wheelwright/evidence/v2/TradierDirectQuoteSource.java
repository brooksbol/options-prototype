package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.provider.AcquisitionLease;
import com.wheelwright.evidence.provider.ObservationRecorder;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.ProviderError;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
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
 * I4), and issues one multi-symbol {@link TradierAdapter#getQuotes} call with a contact hook.
 *
 * <p><b>Actual-contact classification + off-hours gate (Doc 79 I2 / off-hours finding).</b> The
 * contact hook runs at the real HTTP-send boundary inside the adapter. It classifies the
 * acquisition phase + regular-session date from the ACTUAL contact instant, and — when
 * off-hours contact is disabled by policy and the contact-time phase is not a usable regular
 * phase — vetoes the send so no HTTP contact occurs. This enforces the policy against the phase
 * that exists when contact would actually happen, with no intervening work before the send.
 *
 * <p><b>Terminal correlation (Doc 79 I4).</b> This source does NOT emit the terminal logical
 * outcome for the success path: the terminal acquisition verdict is only known after the
 * service accepts/commits. The source emits a terminal {@code ACQUISITION_REJECTED} only for a
 * request-wide transport failure where no subject can reach the service; otherwise it carries
 * the {@code logicalOperationId} back so the SERVICE records the per-subject terminal outcome
 * after commit.
 *
 * <p>Subject verification is positive and fail-closed (Doc 79 I3): VERIFIED only when the
 * returned canonical symbol equals the requested symbol AND the provider security type maps to
 * an allowed underlying type; options/unknown/missing/unrecognized are UNSUPPORTED; a symbol
 * the provider did not return is UNMATCHED. No {@code OTHER_UNDERLYING} fallback.
 *
 * <p>Deliberately does NOT reuse the v1 acquisition path: no chain acquisition, no
 * expirations, no observation-demand enrollment, no snapshot publication (contract §5, §25).
 */
@Component
public class TradierDirectQuoteSource implements DirectQuoteSource {

    private final ProviderAuthorityManager providerManager;
    private final QuoteAcquisitionPolicy policy;

    public TradierDirectQuoteSource(ProviderAuthorityManager providerManager,
                                    QuoteAcquisitionPolicy policy) {
        this.providerManager = providerManager;
        this.policy = policy;
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
        // CAPTURED authority epoch — never the null-logical-id / epoch-zero default.
        String logicalOperationId = "v2quote-" + safeRequestId(requestId) + "-" + acquisitionId;
        ObservationRecorder observer = providerManager.observer();
        lease.adapter().pacer().openPurposeScope(
            logicalOperationId, ObservationRecorder.Purpose.ACTIVE_ACQUISITION,
            String.join(",", subjects), acquisitionId, epoch);

        // Contact-time phase/session, captured by the hook AT the actual send boundary. The hook
        // also vetoes the send when off-hours contact is disabled for the contact-time phase.
        QuoteProvenance.AcquisitionPhase[] contactPhase =
            { QuoteProvenance.AcquisitionPhase.UNKNOWN };
        String[] contactSessionDate = { null };
        boolean offHoursContactEnabled = policy.offHoursContactEnabled();
        TradierAdapter.ContactHook hook = contactAt -> {
            QuoteProvenance.AcquisitionPhase phase =
                DirectQuoteSessionIdentity.phaseAt(contactAt, realtime);
            contactPhase[0] = phase;
            contactSessionDate[0] = DirectQuoteSessionIdentity
                .regularSessionDateAt(contactAt, realtime).map(LocalDate::toString).orElse(null);
            // Off-hours gate AT CONTACT: if the contact-time phase is off-hours and off-hours
            // contact is disabled, veto the send (no HTTP contact occurs).
            return !contactVetoed(phase, offHoursContactEnabled);
        };

        TradierAdapter.QuotesResult result;
        try {
            result = lease.adapter().getQuotes(subjects, hook);
        } catch (TradierAdapter.ContactBlockedException blocked) {
            // Off-hours contact policy forbade the send at the actual-contact boundary. No HTTP
            // contact occurred. This is a per-subject CONTACT_NOT_PERMITTED, not a transport
            // failure; the terminal logical outcome is the service's to record.
            lease.adapter().pacer().clearPurposeScope();
            for (String s : subjects) {
                bySubject.put(s, failure(UpstreamStatus.CONTACT_NOT_PERMITTED, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, logicalOperationId,
                    "off-hours provider contact is disabled by policy at the contact boundary"));
            }
            return new BatchResult(bySubject);
        } catch (ProviderError pe) {
            // A request-wide provider transport failure: no subject reaches the service, so the
            // terminal rejected outcome is correctly recorded here (and only here).
            lease.adapter().pacer().clearPurposeScope();
            recordLogicalOutcome(observer, logicalOperationId, authorityId, epoch,
                String.join(",", subjects), ObservationRecorder.LogicalOutcome.ACQUISITION_REJECTED);
            UpstreamStatus status = pe.getStatusCode() == 429
                ? UpstreamStatus.ADMISSION_REJECTED
                : UpstreamStatus.UNAVAILABLE;
            for (String s : subjects) {
                bySubject.put(s, failure(status, provider, environment, acquisitionId,
                    authorityId, authorityEpoch, logicalOperationId, safeDetail(pe)));
            }
            return new BatchResult(bySubject);
        } catch (Exception e) {
            lease.adapter().pacer().clearPurposeScope();
            recordLogicalOutcome(observer, logicalOperationId, authorityId, epoch,
                String.join(",", subjects), ObservationRecorder.LogicalOutcome.ACQUISITION_REJECTED);
            for (String s : subjects) {
                bySubject.put(s, failure(UpstreamStatus.FAILED, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, logicalOperationId, safeDetail(e)));
            }
            return new BatchResult(bySubject);
        } finally {
            lease.adapter().pacer().clearPurposeScope();
        }

        // I2 temporal truth: phase/session come from the hook (captured at the ACTUAL contact
        // instant); receivedAt is the distinct successful-payload-receipt instant.
        QuoteProvenance.AcquisitionPhase phase = contactPhase[0];
        String regularSessionDate = contactSessionDate[0];
        String receivedAt = result.receivedAt();

        for (String s : subjects) {
            TradierAdapter.RawQuoteFacts raw = result.bySymbol().get(s);
            if (raw == null) {
                bySubject.put(s, upstream(UpstreamStatus.UNMATCHED, null, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, logicalOperationId, phase,
                    regularSessionDate, receivedAt, "provider did not return a matching subject"));
                continue;
            }
            // I3 positive subject verification: returned symbol must equal the requested symbol,
            // and the provider security type must map to an allowed underlying type.
            String returnedSymbol = raw.symbol() == null ? null : raw.symbol().toUpperCase(Locale.ROOT);
            if (returnedSymbol == null || !returnedSymbol.equals(s)) {
                bySubject.put(s, upstream(UpstreamStatus.UNMATCHED, null, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, logicalOperationId, phase,
                    regularSessionDate, receivedAt,
                    "returned subject identity did not match requested subject"));
                continue;
            }
            ResolvedSubject.SecurityType type = allowedUnderlyingType(raw.securityTypeRaw());
            if (type == null) {
                bySubject.put(s, upstream(UpstreamStatus.UNSUPPORTED, null, provider, environment,
                    acquisitionId, authorityId, authorityEpoch, logicalOperationId, phase,
                    regularSessionDate, receivedAt,
                    "provider security type is not a supported underlying: "
                        + describeType(raw.securityTypeRaw())));
                continue;
            }
            bySubject.put(s, upstream(UpstreamStatus.VERIFIED, toRawQuote(raw, type), provider,
                environment, acquisitionId, authorityId, authorityEpoch, logicalOperationId, phase,
                regularSessionDate, receivedAt, null));
        }

        // Doc 79 I4: the SOURCE no longer records a terminal logical outcome for a completed
        // batch. The terminal acquisition verdict (COMMITTED / REJECTED / FENCED) is only known
        // after the service accepts/commits each verified subject, so the service records it then
        // (carrying the same logicalOperationId). The pacer has already recorded the per-HTTP
        // transport START/COMPLETE events under this logical id.
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

    private static SubjectUpstream upstream(UpstreamStatus status, RawQuote raw, String provider,
                                            QuoteProvenance.Environment environment,
                                            String acquisitionId, String authorityId,
                                            String authorityEpoch, String logicalOperationId,
                                            QuoteProvenance.AcquisitionPhase phase,
                                            String regularSessionDate, String receivedAt,
                                            String detail) {
        return new SubjectUpstream(status, raw, provider, environment, acquisitionId, authorityId,
            authorityEpoch, logicalOperationId, phase, regularSessionDate, receivedAt, detail);
    }

    private static SubjectUpstream failure(UpstreamStatus status, String provider,
                                           QuoteProvenance.Environment environment,
                                           String acquisitionId, String authorityId,
                                           String authorityEpoch, String logicalOperationId,
                                           String detail) {
        // A request-wide provider failure / blocked contact has no subject-verified contact
        // facts: phase UNKNOWN, no regular-session date, no receipt instant.
        return new SubjectUpstream(status, null, provider, environment,
            acquisitionId, authorityId, authorityEpoch, logicalOperationId,
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

    /**
     * Whether the contact-boundary off-hours gate must VETO the send for the given contact-time
     * phase and policy (Doc 79 off-hours finding). Off-hours = any phase other than a usable
     * regular phase; when off-hours contact is disabled, such a contact is vetoed. Package-
     * visible so the policy→gate wiring is deterministically testable.
     */
    static boolean contactVetoed(QuoteProvenance.AcquisitionPhase contactPhase,
                                 boolean offHoursContactEnabled) {
        boolean offHoursAtContact = contactPhase != QuoteProvenance.AcquisitionPhase.REGULAR_USABLE;
        return offHoursAtContact && !offHoursContactEnabled;
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

    /** Safe detail: provider message only, never credentials or raw payload. */
    private static String safeDetail(Throwable t) {
        String msg = t.getMessage();
        return msg == null ? t.getClass().getSimpleName() : msg;
    }
}
