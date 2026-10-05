package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.provider.AcquisitionLease;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.ProviderError;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Production {@link DirectQuoteSource}: a real, paced, authority-fenced Tradier quote batch.
 *
 * <p>It mints ONE acquisition lease off {@link ProviderAuthorityManager} (capturing the
 * current authority + fence epoch atomically) and issues one multi-symbol
 * {@link TradierAdapter#getQuotes} call through that authority's adapter/pacer. It performs
 * NO persistence here — the fenced durable commit happens in {@link DirectQuoteService} via
 * {@link ProviderAuthorityManager#commitIfCurrent}. The lease's provenance (environment,
 * authority epoch, acquisition id) is carried back per subject so the service can build
 * truthful provenance and detect authority supersession at commit time.
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
    public BatchResult acquire(List<String> subjects) {
        Map<String, SubjectUpstream> bySubject = new LinkedHashMap<>();
        if (subjects == null || subjects.isEmpty()) {
            return new BatchResult(bySubject);
        }

        // One atomic lease: authority + fence epoch captured together. acquisitionId is the
        // Wheelwright identity of this accepted upstream attempt; authorityEpoch is the opaque
        // fencing identity (no credential). environment is the provider data environment.
        AcquisitionLease lease = providerManager.acquireLease();
        String acquisitionId = UUID.randomUUID().toString();
        String authorityEpoch = Long.toString(lease.fenceEpoch());
        QuoteProvenance.Environment environment = environmentOf(lease.environment());
        String provider = "tradier";

        TradierAdapter.QuotesResult result;
        try {
            result = lease.adapter().getQuotes(subjects);
        } catch (ProviderError pe) {
            // A request-wide provider condition maps INDEPENDENTLY to each requested subject
            // (contract §16 "batch-wide provider failure maps independently"). 429/503-style
            // admission conditions are admission rejection; everything else is unavailability.
            UpstreamStatus status = pe.getStatusCode() == 429
                ? UpstreamStatus.ADMISSION_REJECTED
                : UpstreamStatus.UNAVAILABLE;
            for (String s : subjects) {
                bySubject.put(s, failure(status, provider, environment, acquisitionId,
                    authorityEpoch, safeDetail(pe)));
            }
            return new BatchResult(bySubject);
        } catch (Exception e) {
            for (String s : subjects) {
                bySubject.put(s, failure(UpstreamStatus.FAILED, provider, environment,
                    acquisitionId, authorityEpoch, safeDetail(e)));
            }
            return new BatchResult(bySubject);
        }

        String receivedAt = result.retrievedAt();
        for (String s : subjects) {
            TradierAdapter.RawQuoteFacts raw = result.bySymbol().get(s);
            if (raw != null) {
                bySubject.put(s, new SubjectUpstream(
                    UpstreamStatus.VERIFIED, toRawQuote(raw), provider, environment,
                    acquisitionId, authorityEpoch, receivedAt, null));
            } else {
                // Not returned by an otherwise completed response → UNMATCHED (contract §16).
                bySubject.put(s, new SubjectUpstream(
                    UpstreamStatus.UNMATCHED, null, provider, environment,
                    acquisitionId, authorityEpoch, receivedAt,
                    "provider did not return a matching subject"));
            }
        }
        return new BatchResult(bySubject);
    }

    private static SubjectUpstream failure(UpstreamStatus status, String provider,
                                           QuoteProvenance.Environment environment,
                                           String acquisitionId, String authorityEpoch,
                                           String detail) {
        return new SubjectUpstream(status, null, provider, environment,
            acquisitionId, authorityEpoch, null, detail);
    }

    private static QuoteProvenance.Environment environmentOf(String leaseEnvironment) {
        if ("production".equalsIgnoreCase(leaseEnvironment)) return QuoteProvenance.Environment.PRODUCTION;
        return QuoteProvenance.Environment.SANDBOX;
    }

    /**
     * Map Tradier raw facts to the Wheelwright {@link RawQuote}, resolving security type from
     * the provider's quote {@code type}. ETF vs equity vs index resolution follows Tradier's
     * reported type; unknown provider types resolve to {@code OTHER_UNDERLYING}.
     */
    private static RawQuote toRawQuote(TradierAdapter.RawQuoteFacts r) {
        return new RawQuote(
            resolveSecurityType(r.securityTypeRaw()),
            r.description(), r.exchange(),
            r.last(), r.lastSize(), r.tradeDate(),
            r.bid(), r.bidSize(), r.bidExchange(), r.bidDate(),
            r.ask(), r.askSize(), r.askExchange(), r.askDate(),
            r.open(), r.high(), r.low(), r.close(), r.prevClose(),
            r.volume(), r.change(), r.changePercentage(), r.averageVolume(),
            r.week52High(), r.week52Low());
    }

    private static ResolvedSubject.SecurityType resolveSecurityType(String tradierType) {
        if (tradierType == null) return ResolvedSubject.SecurityType.OTHER_UNDERLYING;
        return switch (tradierType.toLowerCase(java.util.Locale.ROOT)) {
            case "etf" -> ResolvedSubject.SecurityType.ETF;
            case "stock" -> ResolvedSubject.SecurityType.EQUITY;
            case "index" -> ResolvedSubject.SecurityType.INDEX;
            default -> ResolvedSubject.SecurityType.OTHER_UNDERLYING;
        };
    }

    /** Safe detail: provider message only, never credentials or raw payload. */
    private static String safeDetail(Throwable t) {
        String msg = t.getMessage();
        return msg == null ? t.getClass().getSimpleName() : msg;
    }
}
