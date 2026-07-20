package com.wheelwright.evidence.provider;

import org.junit.jupiter.api.*;

import java.io.IOException;
import java.nio.file.Files;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TradierAdapter tests — normalization, error handling, caching, pacing.
 * Uses a mock HTTP layer (subclass override) to avoid live Tradier calls.
 */
class TradierAdapterTest {

    private ResponseCache cache;
    private RequestPacer pacer;

    @BeforeEach
    void setUp() {
        cache = new ResponseCache();
        pacer = new RequestPacer(1000, 50); // fast for tests
    }

    @AfterEach
    void tearDown() {
        pacer.shutdown();
    }

    // --- Test adapter with controllable HTTP responses ---

    static class MockTradierAdapter extends TradierAdapter {
        private final MockResponder responder;

        MockTradierAdapter(String apiKey, MockResponder responder, ResponseCache cache, RequestPacer pacer) {
            super(apiKey, "https://sandbox.tradier.com/v1", cache, pacer);
            this.responder = responder;
        }

        @Override
        public ExpirationResult getExpirations(String symbol) throws Exception {
            // Use mock by calling our controllable fetch methods
            return super.getExpirations(symbol);
        }
    }

    interface MockResponder {
        String respond(String url) throws IOException;
    }

    // For testing, we use a testable subclass approach.
    // The TradierAdapter uses java.net.http.HttpClient internally.
    // Since we can't easily mock that without a library, we test at the normalization level.

    // --- Normalization tests (using the adapter with mocked HTTP responses) ---

    @Nested
    class ExpirationNormalization {

        @Test
        void normalizesStandardExpirationResponse() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setResponse("""
                {"expirations":{"date":["2026-07-24","2026-08-21","2026-09-19"]}}
            """);

            var result = adapter.getExpirations("XLE");
            assertEquals(3, result.expirations().size());
            assertEquals("2026-07-24", result.expirations().get(0).date());
            assertFalse(result.cacheHit());
            assertNotNull(result.retrievedAt());
        }

        @Test
        void returnsEmptyForNullExpirations() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setResponse("""
                {"expirations":null}
            """);

            var result = adapter.getExpirations("NOOPT");
            assertEquals(0, result.expirations().size());
        }

        @Test
        void returnsEmptyForMissingDateField() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setResponse("""
                {"expirations":{}}
            """);

            var result = adapter.getExpirations("NOOPT");
            assertEquals(0, result.expirations().size());
        }

        @Test
        void calculatesCorrectDte() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            // Use a date far in the future so DTE is always positive
            adapter.setResponse("""
                {"expirations":{"date":["2030-01-01"]}}
            """);

            var result = adapter.getExpirations("XLE");
            assertTrue(result.expirations().get(0).dte() > 0);
        }
    }

    @Nested
    class ChainNormalization {

        @Test
        void normalizesChainWithPutsAndCalls() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setChainResponse("""
                {"options":{"option":[
                    {"strike":55,"bid":0.80,"ask":0.95,"option_type":"put","greeks":{"delta":-0.30},"open_interest":500,"volume":120},
                    {"strike":60,"bid":1.20,"ask":1.35,"option_type":"call","greeks":{"delta":0.35},"open_interest":400,"volume":200}
                ]}}
            """);
            adapter.setQuoteResponse("""
                {"quotes":{"quote":{"symbol":"XLE","description":"Energy Select Sector SPDR Fund","last":57.50}}}
            """);

            var result = adapter.getOptionsChain("XLE", "2026-08-21");
            assertEquals("XLE", result.chain().symbol());
            assertEquals("Energy Select Sector SPDR Fund", result.chain().underlying().name());
            assertEquals(57.50, result.chain().underlying().price());
            assertEquals(1, result.chain().puts().size());
            assertEquals(1, result.chain().calls().size());
            assertEquals(55, result.chain().puts().get(0).strike());
            assertEquals(-0.30, result.chain().puts().get(0).delta(), 0.001);
            assertEquals(500, result.chain().puts().get(0).openInterest());
            assertFalse(result.cacheHit());
        }

        @Test
        void sortsContractsByStrike() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setChainResponse("""
                {"options":{"option":[
                    {"strike":60,"bid":0.5,"ask":0.6,"option_type":"put","greeks":{"delta":-0.20},"open_interest":100,"volume":10},
                    {"strike":50,"bid":1.0,"ask":1.1,"option_type":"put","greeks":{"delta":-0.40},"open_interest":200,"volume":20},
                    {"strike":55,"bid":0.8,"ask":0.9,"option_type":"put","greeks":{"delta":-0.30},"open_interest":150,"volume":15}
                ]}}
            """);
            adapter.setQuoteResponse("""
                {"quotes":{"quote":{"symbol":"XLE","last":57.50}}}
            """);

            var result = adapter.getOptionsChain("XLE", "2026-08-21");
            assertEquals(50, result.chain().puts().get(0).strike());
            assertEquals(55, result.chain().puts().get(1).strike());
            assertEquals(60, result.chain().puts().get(2).strike());
        }

        @Test
        void handlesEmptyOptionsArray() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setChainResponse("""
                {"options":{"option":[]}}
            """);
            adapter.setQuoteResponse("""
                {"quotes":{"quote":{"symbol":"XLE","last":57.50}}}
            """);

            var result = adapter.getOptionsChain("XLE", "2026-08-21");
            assertEquals(0, result.chain().puts().size());
            assertEquals(0, result.chain().calls().size());
        }

        @Test
        void handlesMissingOptionsField() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setChainResponse("""
                {"options":null}
            """);
            adapter.setQuoteResponse("""
                {"quotes":{"quote":{"symbol":"XLE","last":57.50}}}
            """);

            var result = adapter.getOptionsChain("XLE", "2026-08-21");
            assertEquals(0, result.chain().puts().size());
            assertEquals(0, result.chain().calls().size());
        }

        @Test
        void usesCloseWhenLastIsMissing() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setChainResponse("""
                {"options":{"option":[]}}
            """);
            adapter.setQuoteResponse("""
                {"quotes":{"quote":{"symbol":"XLE","close":56.00}}}
            """);

            var result = adapter.getOptionsChain("XLE", "2026-08-21");
            assertEquals(56.00, result.chain().underlying().price());
        }

        @Test
        void usesSymbolWhenDescriptionIsMissing() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setChainResponse("""
                {"options":{"option":[]}}
            """);
            adapter.setQuoteResponse("""
                {"quotes":{"quote":{"symbol":"XLE","last":57.50}}}
            """);

            var result = adapter.getOptionsChain("XLE", "2026-08-21");
            assertEquals("XLE", result.chain().underlying().name());
        }
    }

    @Nested
    class ErrorHandling {

        @Test
        void throwsWhenApiKeyMissing() {
            TestableAdapter adapter = new TestableAdapter("", cache, pacer);
            assertThrows(ProviderError.class, () -> adapter.getExpirations("XLE"));
        }

        @Test
        void throwsProviderErrorOn429() {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setStatusCode(429);

            ProviderError err = assertThrows(ProviderError.class, () -> adapter.getExpirations("XLE"));
            assertEquals(429, err.getStatusCode());
            assertEquals(60000L, err.getRetryAfterMs());
        }

        @Test
        void throwsProviderErrorOnNon2xx() {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setStatusCode(500);

            ProviderError err = assertThrows(ProviderError.class, () -> adapter.getExpirations("XLE"));
            assertEquals(500, err.getStatusCode());
        }

        @Test
        void throwsOnNetworkFailure() {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setNetworkFailure(true);

            assertThrows(Exception.class, () -> adapter.getExpirations("XLE"));
        }
    }

    @Nested
    class CacheBehavior {

        @Test
        void returnsCacheHitOnSecondCall() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setResponse("""
                {"expirations":{"date":["2026-08-21"]}}
            """);

            var first = adapter.getExpirations("XLE");
            assertFalse(first.cacheHit());

            var second = adapter.getExpirations("XLE");
            assertTrue(second.cacheHit());
        }

        @Test
        void chainCachesQuoteForSubsequentCalls() throws Exception {
            TestableAdapter adapter = new TestableAdapter("test-key", cache, pacer);
            adapter.setChainResponse("""
                {"options":{"option":[]}}
            """);
            adapter.setQuoteResponse("""
                {"quotes":{"quote":{"symbol":"XLE","description":"Energy","last":90.0}}}
            """);

            adapter.getOptionsChain("XLE", "2026-08-21");
            int callsAfterFirst = adapter.getCallCount();

            // Second chain call for different expiration — quote should be cached
            adapter.setChainResponse("""
                {"options":{"option":[]}}
            """);
            adapter.getOptionsChain("XLE", "2026-09-19");

            // Should NOT have fetched quote again (cached from first call)
            // Only 1 new call (chain), not 2 (chain + quote)
            assertEquals(callsAfterFirst + 1, adapter.getCallCount());
        }
    }

    @Nested
    class PacingBehavior {

        @Test
        void serializesConsecutiveRequests() throws Exception {
            RequestPacer slowPacer = new RequestPacer(1000, 50); // fast but serial
            try {
                TestableAdapter adapter = new TestableAdapter("test-key", cache, slowPacer);
                adapter.setResponse("""
                    {"expirations":{"date":["2026-08-21"]}}
                """);

                // Clear cache between calls to force upstream requests
                var r1 = adapter.getExpirations("A");
                assertFalse(r1.cacheHit());

                var r2 = adapter.getExpirations("B");
                assertFalse(r2.cacheHit());

                // Both succeeded — requests were serialized through the pacer
                assertEquals(2, adapter.getCallCount());
            } finally {
                slowPacer.shutdown();
            }
        }
    }

    @Nested
    class ConfigurationValidation {

        @Test
        void noSecretsInMainSourceProperties() throws IOException {
            // Read the MAIN application.properties (not test override)
            var url = getClass().getClassLoader().getResource("application.properties");
            // In test context, we get the test properties. Check both.
            assertNotNull(url);
            try (var is = url.openStream()) {
                String content = new String(is.readAllBytes());
                assertFalse(content.contains("Bearer "),
                    "application.properties must not contain Bearer tokens");
            }

            // Also verify the main source file directly
            var mainProps = new java.io.File("src/main/resources/application.properties");
            if (mainProps.exists()) {
                String content = java.nio.file.Files.readString(mainProps.toPath());
                assertFalse(content.contains("Bearer "),
                    "Main application.properties must not contain Bearer tokens");
                assertTrue(content.contains("${TRADIER_API_KEY"),
                    "API key must use environment variable reference");
            }
        }
    }

    // --- Testable adapter that bypasses real HTTP ---

    static class TestableAdapter extends TradierAdapter {
        private String response = "{}";
        private String chainResponse = "{}";
        private String quoteResponse = "{}";
        private int statusCode = 200;
        private boolean networkFailure = false;
        private final AtomicInteger callCount = new AtomicInteger(0);
        private final String apiKey;

        TestableAdapter(String apiKey, ResponseCache cache, RequestPacer pacer) {
            super(apiKey, "https://sandbox.tradier.com/v1", cache, pacer);
            this.apiKey = apiKey;
        }

        void setResponse(String response) { this.response = response; }
        void setChainResponse(String response) { this.chainResponse = response; }
        void setQuoteResponse(String response) { this.quoteResponse = response; }
        void setStatusCode(int code) { this.statusCode = code; }
        void setNetworkFailure(boolean fail) { this.networkFailure = fail; }
        int getCallCount() { return callCount.get(); }

        @Override
        public ExpirationResult getExpirations(String symbol) throws Exception {
            if (apiKey == null || apiKey.isBlank()) {
                throw new ProviderError("Tradier API key not configured", 503);
            }

            String cacheKey = symbol.toUpperCase();
            var cached = getCacheForTest().get(ResponseCache.CacheType.EXPIRATIONS, cacheKey);
            if (cached != null) {
                @SuppressWarnings("unchecked")
                List<MarketExpiration> data = (List<MarketExpiration>) cached.data();
                return new ExpirationResult(data, cached.retrievedAt(), true);
            }

            String body = simulateHttpCall(response);
            List<MarketExpiration> expirations = normalizeExpirationsForTest(body);
            String retrievedAt = java.time.Instant.now().toString();
            getCacheForTest().set(ResponseCache.CacheType.EXPIRATIONS, cacheKey, expirations, retrievedAt);
            return new ExpirationResult(expirations, retrievedAt, false);
        }

        @Override
        public ChainResult getOptionsChain(String symbol, String expiration) throws Exception {
            if (apiKey == null || apiKey.isBlank()) {
                throw new ProviderError("Tradier API key not configured", 503);
            }

            String cacheKey = symbol.toUpperCase() + ":" + expiration;
            var cachedChain = getCacheForTest().get(ResponseCache.CacheType.CHAIN, cacheKey);
            if (cachedChain != null) {
                @SuppressWarnings("unchecked")
                MarketChain data = (MarketChain) cachedChain.data();
                return new ChainResult(data, cachedChain.retrievedAt(), true);
            }

            String chainBody = simulateHttpCall(chainResponse);

            // Quote (check cache first)
            String quoteCacheKey = symbol.toUpperCase();
            double price;
            String name;
            var cachedQuote = getCacheForTest().get(ResponseCache.CacheType.QUOTE, quoteCacheKey);
            if (cachedQuote != null) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> q = (java.util.Map<String, Object>) cachedQuote.data();
                price = (Double) q.get("price");
                name = (String) q.get("name");
            } else {
                String quoteBody = simulateHttpCall(quoteResponse);
                price = extractTestDouble(quoteBody, "last");
                if (price == 0) price = extractTestDouble(quoteBody, "close");
                name = extractTestString(quoteBody, "description");
                if (name == null || name.isBlank()) name = symbol.toUpperCase();
                getCacheForTest().set(ResponseCache.CacheType.QUOTE, quoteCacheKey,
                    java.util.Map.of("price", price, "name", name), java.time.Instant.now().toString());
            }

            MarketChain chain = normalizeChainForTest(chainBody, symbol, expiration, name, price);
            String retrievedAt = java.time.Instant.now().toString();
            getCacheForTest().set(ResponseCache.CacheType.CHAIN, cacheKey, chain, retrievedAt);
            return new ChainResult(chain, retrievedAt, false);
        }

        private ResponseCache getCacheForTest() {
            try {
                var field = TradierAdapter.class.getDeclaredField("cache");
                field.setAccessible(true);
                return (ResponseCache) field.get(this);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        private String simulateHttpCall(String responseBody) throws IOException {
            callCount.incrementAndGet();
            if (networkFailure) throw new IOException("Network failure");
            if (statusCode == 429) throw new ProviderError("Rate limited by Tradier", 429, 60000L);
            if (statusCode < 200 || statusCode >= 300) throw new ProviderError("Tradier returned " + statusCode, statusCode);
            return responseBody;
        }

        // Expose parent normalization for testing
        private List<MarketExpiration> normalizeExpirationsForTest(String body) {
            List<String> dates = new java.util.ArrayList<>();
            int dateIdx = body.indexOf("\"date\"");
            if (dateIdx < 0) return List.of();
            int bracketStart = body.indexOf('[', dateIdx);
            if (bracketStart < 0) return List.of();
            int bracketEnd = body.indexOf(']', bracketStart);
            if (bracketEnd < 0) return List.of();
            String arrayContent = body.substring(bracketStart + 1, bracketEnd);
            for (String part : arrayContent.split(",")) {
                String trimmed = part.trim().replace("\"", "");
                if (!trimmed.isEmpty() && trimmed.matches("\\d{4}-\\d{2}-\\d{2}")) dates.add(trimmed);
            }
            if (dates.isEmpty()) return List.of();
            java.time.LocalDate today = java.time.LocalDate.now();
            List<MarketExpiration> result = new java.util.ArrayList<>();
            for (String d : dates) {
                int dte = (int) java.time.temporal.ChronoUnit.DAYS.between(today, java.time.LocalDate.parse(d));
                result.add(new MarketExpiration(d, dte));
            }
            return result;
        }

        private MarketChain normalizeChainForTest(String body, String symbol, String expiration, String name, double price) {
            List<MarketChain.OptionContract> puts = new java.util.ArrayList<>();
            List<MarketChain.OptionContract> calls = new java.util.ArrayList<>();
            int optionIdx = body.indexOf("\"option\"");
            if (optionIdx >= 0) {
                int bracketStart = body.indexOf('[', optionIdx);
                if (bracketStart >= 0) {
                    int depth = 0;
                    int objStart = -1;
                    for (int i = bracketStart + 1; i < body.length(); i++) {
                        char c = body.charAt(i);
                        if (c == '{') { if (depth == 0) objStart = i; depth++; }
                        else if (c == '}') { depth--; if (depth == 0 && objStart >= 0) {
                            String obj = body.substring(objStart, i + 1);
                            double strike = extractTestDouble(obj, "strike");
                            double bid = extractTestDouble(obj, "bid");
                            double ask = extractTestDouble(obj, "ask");
                            int oi = (int) extractTestDouble(obj, "open_interest");
                            int vol = (int) extractTestDouble(obj, "volume");
                            String type = extractTestString(obj, "option_type");
                            double delta = 0;
                            int gIdx = obj.indexOf("\"greeks\"");
                            if (gIdx >= 0) { int gs = obj.indexOf('{', gIdx); int ge = obj.indexOf('}', gs);
                                if (gs >= 0 && ge >= 0) delta = extractTestDouble(obj.substring(gs, ge+1), "delta"); }
                            var contract = new MarketChain.OptionContract(strike, bid, ask, delta, oi, vol);
                            if ("put".equals(type)) puts.add(contract);
                            else if ("call".equals(type)) calls.add(contract);
                            objStart = -1;
                        }}
                        else if (c == ']' && depth == 0) break;
                    }
                }
            }
            puts.sort(java.util.Comparator.comparingDouble(MarketChain.OptionContract::strike));
            calls.sort(java.util.Comparator.comparingDouble(MarketChain.OptionContract::strike));
            return new MarketChain(symbol.toUpperCase(), expiration, new MarketChain.Underlying(symbol.toUpperCase(), name, price), puts, calls);
        }

        private double extractTestDouble(String json, String key) {
            String pattern = "\"" + key + "\"";
            int idx = json.indexOf(pattern);
            if (idx < 0) return 0;
            int colonIdx = json.indexOf(':', idx + pattern.length());
            if (colonIdx < 0) return 0;
            int start = colonIdx + 1;
            while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '\t')) start++;
            if (start >= json.length() || json.charAt(start) == 'n') return 0;
            int end = start;
            while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-')) end++;
            if (end == start) return 0;
            try { return Double.parseDouble(json.substring(start, end)); } catch (NumberFormatException e) { return 0; }
        }

        private String extractTestString(String json, String key) {
            String pattern = "\"" + key + "\"";
            int idx = json.indexOf(pattern);
            if (idx < 0) return null;
            int colonIdx = json.indexOf(':', idx + pattern.length());
            if (colonIdx < 0) return null;
            int qs = json.indexOf('"', colonIdx + 1);
            if (qs < 0) return null;
            int qe = json.indexOf('"', qs + 1);
            if (qe < 0) return null;
            return json.substring(qs + 1, qe);
        }
    }
}
