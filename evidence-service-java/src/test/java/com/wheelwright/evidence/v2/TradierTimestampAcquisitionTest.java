package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.*;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/** BUG-029: real parser → source mapping → canonical persistence → strict read, fixture only. */
class TradierTimestampAcquisitionTest {
    private static final Instant NOW = Instant.parse("2026-10-05T14:30:00Z");

    private static class FixtureAdapter extends TradierAdapter {
        String fields;
        FixtureAdapter(ResponseCache cache, RequestPacer pacer, String fields) {
            super("fixture", "https://example.invalid", cache, pacer);
            this.fields = fields;
        }
        @Override public QuotesResult getQuotes(List<String> symbols, ContactHook hook) {
            assertTrue(hook.onContact(NOW));
            return parseQuotesResponse("{\"quotes\":{\"quote\":{\"symbol\":\"SPY\",\"type\":\"etf\","
                + "\"last\":1,\"bid\":0,\"ask\":2," + fields + "}}}", symbols,
                NOW.toString(), NOW.plusSeconds(1).toString());
        }
    }

    @Test void futureCanonicalHoldingHasOwnEventTimesAndMalformedRefreshPreservesPrior() throws Exception {
        var cache = new ResponseCache();
        var pacer = new RequestPacer(1000, 1);
        try (var store = new SqliteEvidenceStore(":memory:")) {
            var adapter = new FixtureAdapter(cache, pacer,
                "\"trade_date\":1757948508561,\"prevclose\":0,\"bid_date\":1757948508000,\"asksize\":0,\"ask_date\":1757948509000,\"root_symbols\":\"SPY\"");
            var authority = new ProviderAuthority("prod", "production", adapter, cache, pacer);
            var manager = new ProviderAuthorityManager(authority, null);
            manager.markSingleAuthorityActiveForLegacy();
            var policy = new QuoteAcquisitionPolicy(60, true, true);
            var service = new DirectQuoteService(new TradierDirectQuoteSource(manager, policy), manager,
                store, policy, Clock.fixed(NOW, ZoneOffset.UTC));
            var subjects = List.of(new AcquireQuotesRequest.RequestedSubject("SPY"));
            var result = service.acquire(subjects, AcquireQuotesRequest.Mode.FORCE, "fixture").getFirst();
            assertEquals(SubjectOutcome.NEWLY_ACQUIRED, result.outcome());
            var prior = store.getDirectQuote("SPY");
            var facts = StrictHeldQuoteDecoder.decode(prior, "SPY").path("facts");
            assertEquals("2025-09-15T15:01:48.561Z", facts.path("last").path("sourceEventAt").asText());
            assertEquals("2025-09-15T15:01:48Z", facts.path("bid").path("sourceEventAt").asText());
            assertEquals("2025-09-15T15:01:49Z", facts.path("ask").path("sourceEventAt").asText());
            assertEquals(0, facts.path("bid").path("price").asInt());
            assertEquals(0, facts.path("previousClose").asInt());
            for (String field : List.of("trade_date", "bid_date", "ask_date")) {
                adapter.fields = "\"" + field + "\":\"prevclose\"";
                assertEquals(SubjectOutcome.UPSTREAM_FAILED,
                    service.acquire(subjects, AcquireQuotesRequest.Mode.FORCE, "fixture").getFirst().outcome());
                assertEquals(prior, store.getDirectQuote("SPY"));
            }
            adapter.fields = "\"trade_date\":null,\"bid_date\":null,\"ask_date\":null";
            assertEquals(SubjectOutcome.NEWLY_ACQUIRED,
                service.acquire(subjects, AcquireQuotesRequest.Mode.FORCE, "fixture").getFirst().outcome());
            facts = StrictHeldQuoteDecoder.decode(store.getDirectQuote("SPY"), "SPY").path("facts");
            for (String side : List.of("last", "bid", "ask")) assertFalse(facts.path(side).has("sourceEventAt"));
        } finally { pacer.shutdown(); }
    }

    @Test void strictReadStillRejectsAllObservedBadTokensOnEverySide() {
        for (String side : List.of("last", "bid", "ask")) {
            for (String token : List.of("prevclose", "asksize", "root_symbols")) {
                String facts = "{\"" + side + "\":{\"price\":1,\"sourceEventAt\":\"" + token + "\"}}";
                assertThrows(Exception.class,
                    () -> StrictHeldQuoteDecoder.decode(HeldQuoteFixtures.row("SPY", facts), "SPY"));
            }
        }
    }
}
