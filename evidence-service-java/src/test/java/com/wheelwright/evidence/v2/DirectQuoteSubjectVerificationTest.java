package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Positive subject-verification regression tests (Doc 79 I3), exercising the REAL provider
 * normalization/type-mapping path — {@link TradierAdapter#parseQuotesResponse} (the actual
 * JSON parser) and {@link TradierDirectQuoteSource#allowedUnderlyingType} (the actual
 * fail-closed security-type mapping) — rather than a fake source that has already classified a
 * subject. This directly falsifies the rejected candidate's {@code OTHER_UNDERLYING} fallback.
 */
class DirectQuoteSubjectVerificationTest {

    private TradierAdapter adapter() {
        return new TradierAdapter("test-key", "https://api.tradier.com/v1",
            new ResponseCache(), new RequestPacer(119, 200));
    }

    // --- real JSON normalization path --------------------------------------------------

    @Test
    @DisplayName("I3 real path: provider returns an option quote (type=option) with a positive price")
    void providerOptionQuoteParsedWithOptionType() {
        // A syntactically valid OCC-style option symbol with a positive last, provider type option.
        String body = """
            {"quotes":{"quote":{"symbol":"SPY260116C00500000","type":"option",
            "last":12.34,"bid":12.3,"ask":12.4,"description":"SPY Jan 16 2026 $500 Call"}}}""";
        TradierAdapter.QuotesResult result = adapter().parseQuotesResponse(
            body, List.of("SPY260116C00500000"), "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z");
        TradierAdapter.RawQuoteFacts facts = result.bySymbol().get("SPY260116C00500000");
        assertThat(facts).isNotNull();
        assertThat(facts.securityTypeRaw()).isEqualTo("option");
        assertThat(facts.last()).isEqualTo(12.34);
        // The REAL fail-closed mapping must refuse to classify an option as an underlying.
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(facts.securityTypeRaw())).isNull();
    }

    @Test
    @DisplayName("I3 real path: provider type etf/stock/index map to allowed underlying types")
    void providerUnderlyingTypesMapped() {
        String body = """
            {"quotes":{"quote":[
              {"symbol":"SPY","type":"etf","last":756.19},
              {"symbol":"AAPL","type":"stock","last":180.0},
              {"symbol":"SPX","type":"index","last":5800.0}
            ]}}""";
        TradierAdapter.QuotesResult result = adapter().parseQuotesResponse(
            body, List.of("SPY", "AAPL", "SPX"), "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z");
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(
            result.bySymbol().get("SPY").securityTypeRaw())).isEqualTo(ResolvedSubject.SecurityType.ETF);
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(
            result.bySymbol().get("AAPL").securityTypeRaw())).isEqualTo(ResolvedSubject.SecurityType.EQUITY);
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(
            result.bySymbol().get("SPX").securityTypeRaw())).isEqualTo(ResolvedSubject.SecurityType.INDEX);
    }

    @Test
    @DisplayName("I3 real path: unknown provider type fails closed (no OTHER_UNDERLYING fallback)")
    void unknownProviderTypeFailsClosed() {
        String body = """
            {"quotes":{"quote":{"symbol":"XYZ","type":"mutualfund","last":42.0}}}""";
        TradierAdapter.QuotesResult result = adapter().parseQuotesResponse(
            body, List.of("XYZ"), "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z");
        assertThat(result.bySymbol().get("XYZ").securityTypeRaw()).isEqualTo("mutualfund");
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType("mutualfund")).isNull();
    }

    @Test
    @DisplayName("I3 real path: missing provider type fails closed")
    void missingProviderTypeFailsClosed() {
        String body = """
            {"quotes":{"quote":{"symbol":"XYZ","last":42.0}}}""";
        TradierAdapter.QuotesResult result = adapter().parseQuotesResponse(
            body, List.of("XYZ"), "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z");
        assertThat(result.bySymbol().get("XYZ").securityTypeRaw()).isNull();
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(null)).isNull();
    }

    @Test
    @DisplayName("I3 real path: unrecognized/empty provider type fails closed")
    void unrecognizedProviderTypeFailsClosed() {
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType("")).isNull();
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType("warrant")).isNull();
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType("future")).isNull();
    }

    @Test
    @DisplayName("I3 real path: a returned symbol that does not match the request is reconciled as unmatched")
    void returnedSymbolMismatchIsUnmatched() {
        // Provider returned a DIFFERENT symbol than requested. parseQuotesResponse reconciles by
        // identity: the requested symbol has no match and lands in unmatched.
        String body = """
            {"quotes":{"quote":{"symbol":"SPYY","type":"etf","last":756.19}}}""";
        TradierAdapter.QuotesResult result = adapter().parseQuotesResponse(
            body, List.of("SPY"), "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z");
        assertThat(result.bySymbol()).doesNotContainKey("SPY");
        assertThat(result.unmatched()).contains("SPY");
    }

    @Test
    @DisplayName("I3 real path: Tradier unmatched_symbols is parsed and reconciled by identity")
    void unmatchedSymbolsParsed() {
        String body = """
            {"quotes":{"quote":{"symbol":"SPY","type":"etf","last":756.19},
            "unmatched_symbols":"BOGUS"}}""";
        TradierAdapter.QuotesResult result = adapter().parseQuotesResponse(
            body, List.of("SPY", "BOGUS"), "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z");
        assertThat(result.bySymbol()).containsKey("SPY");
        assertThat(result.unmatched()).contains("BOGUS");
    }

    @Test
    @DisplayName("I3 real path: mixed batch — verified underlying, option, unknown-type, unmatched reconcile independently")
    void mixedBatchReconcilesByIdentity() {
        String body = """
            {"quotes":{"quote":[
              {"symbol":"SPY","type":"etf","last":756.19},
              {"symbol":"SPY260116C00500000","type":"option","last":12.34},
              {"symbol":"XYZ","type":"mutualfund","last":42.0}
            ],"unmatched_symbols":"NOPE"}}""";
        TradierAdapter.QuotesResult result = adapter().parseQuotesResponse(
            body, List.of("SPY", "SPY260116C00500000", "XYZ", "NOPE"),
            "2026-10-05T14:30:00Z", "2026-10-05T14:30:01Z");
        // Underlying verifies; option + unknown fail the type gate; NOPE is unmatched.
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(
            result.bySymbol().get("SPY").securityTypeRaw())).isEqualTo(ResolvedSubject.SecurityType.ETF);
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(
            result.bySymbol().get("SPY260116C00500000").securityTypeRaw())).isNull();
        assertThat(TradierDirectQuoteSource.allowedUnderlyingType(
            result.bySymbol().get("XYZ").securityTypeRaw())).isNull();
        assertThat(result.unmatched()).contains("NOPE");
    }
}
