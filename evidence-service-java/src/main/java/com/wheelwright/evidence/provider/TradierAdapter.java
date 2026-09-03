package com.wheelwright.evidence.provider;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Tradier Provider Adapter — HTTP client with caching and pacing.
 *
 * Behavioral parity with TypeScript TradierAdapter:
 *   - Owns the credential
 *   - Normalizes responses into application-owned domain types
 *   - Never exposes raw Tradier response structure
 *   - Uses ResponseCache to prevent redundant calls
 *   - Uses RequestPacer for rate-limit compliance
 *   - Quotes are cached and reused across chain requests
 */
public class TradierAdapter {

    private final String apiKey;
    private final String baseUrl;
    private final ResponseCache cache;
    private final RequestPacer pacer;
    private final HttpClient httpClient;

    public TradierAdapter(String apiKey, String baseUrl, ResponseCache cache, RequestPacer pacer) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.cache = cache;
        this.pacer = pacer;
        this.httpClient = HttpClient.newHttpClient();
    }

    /** This adapter's isolated response cache (per provider authority). */
    public ResponseCache cache() { return cache; }

    /** This adapter's isolated request pacer (per provider authority). */
    public RequestPacer pacer() { return pacer; }

    /** The environment/provider base URL this adapter targets (no secrets). */
    public String baseUrl() { return baseUrl; }

    /** Truthful environment label derived from the base URL (no secrets). */
    public String environmentLabel() {
        if (baseUrl == null) return "unknown";
        String u = baseUrl.toLowerCase(Locale.ROOT);
        if (u.contains("sandbox.tradier.com")) return "sandbox";
        if (u.contains("api.tradier.com")) return "production";
        return "unknown";
    }

    /**
     * Get expirations for a symbol.
     * Returns normalized MarketExpiration list with DTE calculated from today.
     */
    public ExpirationResult getExpirations(String symbol) throws Exception {
        String cacheKey = symbol.toUpperCase();

        // Check cache
        var cached = cache.get(ResponseCache.CacheType.EXPIRATIONS, cacheKey);
        if (cached != null) {
            @SuppressWarnings("unchecked")
            List<MarketExpiration> data = (List<MarketExpiration>) cached.data();
            return new ExpirationResult(data, cached.retrievedAt(), true);
        }

        // Validate key before queuing
        if (apiKey == null || apiKey.isBlank()) {
            throw new ProviderError("Tradier API key not configured", 503);
        }

        String retrievedAt = Instant.now().toString();

        // Fetch via pacer
        pacer.setOperationKind("expirations");
        String responseBody = pacer.submit(() -> fetchExpirations(symbol));

        // Normalize
        List<MarketExpiration> expirations = normalizeExpirations(responseBody);

        // Store in cache
        cache.set(ResponseCache.CacheType.EXPIRATIONS, cacheKey, expirations, retrievedAt);

        return new ExpirationResult(expirations, retrievedAt, false);
    }

    /**
     * Get options chain for a symbol and expiration.
     * Internally fetches quote (cached) to populate underlying data.
     */
    public ChainResult getOptionsChain(String symbol, String expiration) throws Exception {
        String cacheKey = symbol.toUpperCase() + ":" + expiration;

        // Check chain cache
        var cachedChain = cache.get(ResponseCache.CacheType.CHAIN, cacheKey);
        if (cachedChain != null) {
            @SuppressWarnings("unchecked")
            MarketChain data = (MarketChain) cachedChain.data();
            return new ChainResult(data, cachedChain.retrievedAt(), true);
        }

        String retrievedAt = Instant.now().toString();

        // Fetch chain via pacer
        pacer.setOperationKind("chain");
        String chainBody = pacer.submit(() -> fetchChain(symbol, expiration));

        // Get underlying quote (use cache if available)
        String quoteCacheKey = symbol.toUpperCase();
        var cachedQuote = cache.get(ResponseCache.CacheType.QUOTE, quoteCacheKey);

        double price;
        String name;
        if (cachedQuote != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> quoteData = (Map<String, Object>) cachedQuote.data();
            price = (Double) quoteData.get("price");
            name = (String) quoteData.get("name");
        } else {
            pacer.setOperationKind("quote");
            String quoteBody = pacer.submit(() -> fetchQuote(symbol));
            Map<String, Object> quoteInfo = normalizeQuote(quoteBody, symbol);
            price = (Double) quoteInfo.get("price");
            name = (String) quoteInfo.get("name");
            cache.set(ResponseCache.CacheType.QUOTE, quoteCacheKey, quoteInfo, retrievedAt);
        }

        // Normalize chain
        MarketChain chain = normalizeChain(chainBody, symbol, expiration, name, price);

        // Store in cache
        cache.set(ResponseCache.CacheType.CHAIN, cacheKey, chain, retrievedAt);

        return new ChainResult(chain, retrievedAt, false);
    }

    /**
     * Issue one uncached, read-only quote request for the explicitly enabled
     * after-hours provider measurement harness.
     *
     * This deliberately performs no normalization, cache mutation, scheduler
     * interaction, or evidence persistence. The returned value is only the
     * response-body byte/character count so the harness never republishes the
     * provider payload.
     */
    public int measureUncachedQuote(String symbol) throws Exception {
        if (symbol == null || !symbol.matches("[A-Za-z][A-Za-z0-9.\\-]{0,9}")) {
            throw new IllegalArgumentException("invalid measurement symbol");
        }
        String responseBody = pacer.submit(() -> fetchMeasurementQuote(symbol));
        return responseBody.length();
    }

    /**
     * Representative, NON-WRITING capability probe (PL-PROV-FAILOVER constraint 4).
     *
     * Validates that this provider authority can supply usable NORMALIZED evidence —
     * quote + expirations + option chain for the expected subject/expiration, with sane
     * payloads. It goes through this authority's pacer (isolated lane) but performs NO
     * cache mutation, NO store write, NO symbol-lifecycle change, NO generation/publish,
     * and NO acquisition accounting. It answers only: "is production capable of usable
     * normalized evidence again?" A quote-only check is insufficient — full failback
     * requires representative acquisition of all three.
     *
     * Returns {@link ProbeResult#usable()} true only when quote (positive price),
     * expirations (>=1 eligible), and a chain for the nearest eligible expiration
     * (>=1 contract) all normalize sanely. Any provider error or missing/insane payload
     * yields usable=false (never throws for a provider condition).
     */
    public ProbeResult probeRepresentative(String symbol) {
        if (symbol == null || !symbol.matches("[A-Za-z][A-Za-z0-9.\\-]{0,9}")) {
            return new ProbeResult(false, "invalid probe symbol");
        }
        try {
            // 1) Quote — must normalize to a positive price.
            pacer.setOperationKind("quote");
            String quoteBody = pacer.submit(() -> fetchQuote(symbol));
            Map<String, Object> quote = normalizeQuote(quoteBody, symbol);
            double price = quote.get("price") instanceof Double d ? d : 0.0;
            if (price <= 0.0) return new ProbeResult(false, "quote price not positive");

            // 2) Expirations — must have >=1 eligible expiration.
            pacer.setOperationKind("expirations");
            String expBody = pacer.submit(() -> fetchExpirations(symbol));
            List<MarketExpiration> exps = normalizeExpirations(expBody);
            if (exps.isEmpty()) return new ProbeResult(false, "no expirations");
            String nearest = exps.get(0).date();

            // 3) Chain — must normalize with >=1 contract for the nearest expiration.
            pacer.setOperationKind("chain");
            String chainBody = pacer.submit(() -> fetchChain(symbol, nearest));
            MarketChain chain = normalizeChain(chainBody, symbol, nearest, symbol, price);
            int contracts = (chain.puts() == null ? 0 : chain.puts().size())
                          + (chain.calls() == null ? 0 : chain.calls().size());
            if (contracts <= 0) return new ProbeResult(false, "chain has no contracts");

            return new ProbeResult(true, "usable: quote+expirations+chain");
        } catch (Exception e) {
            // Any provider condition (401, timeout, malformed, etc.) → not usable.
            return new ProbeResult(false, e.getMessage() != null ? e.getMessage() : "probe error");
        }
    }

    /** Outcome of a representative capability probe (non-writing). */
    public record ProbeResult(boolean usable, String detail) {}

    // --- Private HTTP methods ---

    private String fetchExpirations(String symbol) throws IOException, InterruptedException {
        String url = baseUrl + "/markets/options/expirations?symbol=" + symbol.toUpperCase() + "&includeAllRoots=true";
        return httpRequest(url, "expirations");
    }

    private String fetchChain(String symbol, String expiration) throws IOException, InterruptedException {
        String url = baseUrl + "/markets/options/chains?symbol=" + symbol.toUpperCase()
            + "&expiration=" + expiration + "&greeks=true";
        return httpRequest(url, "chain");
    }

    private String fetchQuote(String symbol) throws IOException, InterruptedException {
        String url = baseUrl + "/markets/quotes?symbols=" + symbol.toUpperCase();
        return httpRequest(url, "quote");
    }

    private String fetchMeasurementQuote(String symbol) throws IOException, InterruptedException {
        String url = baseUrl + "/markets/quotes?symbols=" + symbol.toUpperCase();
        return httpRequest(url, "measurement-quote");
    }

    private String httpRequest(String url, String endpointClass) throws IOException, InterruptedException {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ProviderError("Tradier API key not configured", 503);
        }

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer " + apiKey)
            .header("Accept", "application/json")
            .GET()
            .build();

        Long sequence = pacer.currentMeasurementSequence();
        if (sequence != null) {
            pacer.measurementRecorder().httpStarted(sequence, System.nanoTime(), endpointClass);
        }

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException error) {
            if (sequence != null) {
                pacer.measurementRecorder().httpFailed(sequence, System.nanoTime(), error);
            }
            throw error;
        }

        if (sequence != null) {
            pacer.measurementRecorder().httpCompleted(
                sequence,
                System.nanoTime(),
                response.statusCode(),
                rateLimitHeaders(response));
        }

        // Report the EXACT HTTP status (including success) to the shared observer path so the
        // OPERATION_COMPLETED record carries the true status (review-4 #1). For non-2xx we still
        // throw below (which the pacer maps), but the success status must not be dropped.
        pacer.recordHttpStatusForCurrentRequest(response.statusCode());

        if (response.statusCode() == 429) {
            throw new ProviderError("Rate limited by Tradier", 429, 60000L);
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ProviderError(
                "Tradier returned " + response.statusCode(),
                response.statusCode()
            );
        }

        return response.body();
    }

    /** Retain exact provider-returned rate-limit values; derive no capacity semantics here. */
    private Map<String, List<String>> rateLimitHeaders(HttpResponse<?> response) {
        Map<String, List<String>> retained = new LinkedHashMap<>();
        response.headers().map().forEach((name, values) -> {
            if (name.toLowerCase(Locale.ROOT).startsWith("x-ratelimit-")) {
                retained.put(name, List.copyOf(values));
            }
        });
        return retained;
    }

    // --- Normalization ---

    private List<MarketExpiration> normalizeExpirations(String responseBody) {
        // Parse the expirations.date array from Tradier JSON
        // Tradier shape: { "expirations": { "date": ["2026-07-24", "2026-08-21", ...] } }
        List<String> dates = extractDateArray(responseBody);
        if (dates.isEmpty()) return List.of();

        LocalDate today = LocalDate.now();
        List<MarketExpiration> result = new ArrayList<>();
        for (String dateStr : dates) {
            LocalDate expDate = LocalDate.parse(dateStr);
            int dte = (int) ChronoUnit.DAYS.between(today, expDate);
            result.add(new MarketExpiration(dateStr, dte));
        }
        return result;
    }

    private Map<String, Object> normalizeQuote(String responseBody, String symbol) {
        // Tradier shape: { "quotes": { "quote": { "last": 57.5, "close": 57.0, "description": "..." } } }
        double price = extractDouble(responseBody, "last");
        if (price == 0) price = extractDouble(responseBody, "close");

        String name = extractQuotedString(responseBody, "description");
        if (name == null || name.isBlank()) name = symbol.toUpperCase();

        return Map.of("price", price, "name", name);
    }

    private MarketChain normalizeChain(String responseBody, String symbol, String expiration, String name, double price) {
        // Tradier shape: { "options": { "option": [ { "strike": ..., "bid": ..., ... } ] } }
        List<MarketChain.OptionContract> puts = new ArrayList<>();
        List<MarketChain.OptionContract> calls = new ArrayList<>();

        List<Map<String, Object>> options = extractOptionsArray(responseBody);
        for (Map<String, Object> opt : options) {
            double strike = getDouble(opt, "strike");
            double bid = getDouble(opt, "bid");
            double ask = getDouble(opt, "ask");
            double delta = getNestedDouble(opt, "greeks", "delta");
            int openInterest = getInt(opt, "open_interest");
            int volume = getInt(opt, "volume");
            String optionType = (String) opt.get("option_type");

            MarketChain.OptionContract contract = new MarketChain.OptionContract(strike, bid, ask, delta, openInterest, volume);
            if ("put".equals(optionType)) puts.add(contract);
            else if ("call".equals(optionType)) calls.add(contract);
        }

        puts.sort(Comparator.comparingDouble(MarketChain.OptionContract::strike));
        calls.sort(Comparator.comparingDouble(MarketChain.OptionContract::strike));

        MarketChain.Underlying underlying = new MarketChain.Underlying(symbol.toUpperCase(), name, price);
        return new MarketChain(symbol.toUpperCase(), expiration, underlying, puts, calls);
    }

    // --- Minimal JSON parsing helpers ---
    // These handle the specific Tradier response shapes without a full JSON library dependency.

    private List<String> extractDateArray(String json) {
        // Find "date" array: "date":["2026-07-24","2026-08-21"]
        // Also handles "date": null or missing "expirations"
        List<String> dates = new ArrayList<>();
        int dateIdx = json.indexOf("\"date\"");
        if (dateIdx < 0) return dates;
        int bracketStart = json.indexOf('[', dateIdx);
        if (bracketStart < 0) return dates;
        int bracketEnd = json.indexOf(']', bracketStart);
        if (bracketEnd < 0) return dates;

        String arrayContent = json.substring(bracketStart + 1, bracketEnd);
        for (String part : arrayContent.split(",")) {
            String trimmed = part.trim().replace("\"", "");
            if (!trimmed.isEmpty() && trimmed.matches("\\d{4}-\\d{2}-\\d{2}")) {
                dates.add(trimmed);
            }
        }
        return dates;
    }

    private double extractDouble(String json, String key) {
        String pattern = "\"" + key + "\"";
        int idx = json.indexOf(pattern);
        if (idx < 0) return 0;
        int colonIdx = json.indexOf(':', idx + pattern.length());
        if (colonIdx < 0) return 0;
        int start = colonIdx + 1;
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '\t')) start++;
        if (start >= json.length() || json.charAt(start) == 'n') return 0; // null
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-')) end++;
        if (end == start) return 0;
        try {
            return Double.parseDouble(json.substring(start, end));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String extractQuotedString(String json, String key) {
        String pattern = "\"" + key + "\"";
        int idx = json.indexOf(pattern);
        if (idx < 0) return null;
        int colonIdx = json.indexOf(':', idx + pattern.length());
        if (colonIdx < 0) return null;
        int quoteStart = json.indexOf('"', colonIdx + 1);
        if (quoteStart < 0) return null;
        int quoteEnd = json.indexOf('"', quoteStart + 1);
        if (quoteEnd < 0) return null;
        return json.substring(quoteStart + 1, quoteEnd);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractOptionsArray(String json) {
        // Find "option":[ and parse each object
        List<Map<String, Object>> options = new ArrayList<>();
        int optionIdx = json.indexOf("\"option\"");
        if (optionIdx < 0) return options;
        int bracketStart = json.indexOf('[', optionIdx);
        if (bracketStart < 0) return options;

        // Parse individual option objects
        int depth = 0;
        int objStart = -1;
        for (int i = bracketStart + 1; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '{') {
                if (depth == 0) objStart = i;
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0 && objStart >= 0) {
                    String objJson = json.substring(objStart, i + 1);
                    options.add(parseOptionObject(objJson));
                    objStart = -1;
                }
            } else if (c == ']' && depth == 0) {
                break;
            }
        }
        return options;
    }

    private Map<String, Object> parseOptionObject(String json) {
        Map<String, Object> obj = new HashMap<>();
        obj.put("strike", extractDouble(json, "strike"));
        obj.put("bid", extractDouble(json, "bid"));
        obj.put("ask", extractDouble(json, "ask"));
        obj.put("open_interest", (int) extractDouble(json, "open_interest"));
        obj.put("volume", (int) extractDouble(json, "volume"));
        obj.put("option_type", extractQuotedString(json, "option_type"));

        // Nested greeks.delta
        int greeksIdx = json.indexOf("\"greeks\"");
        if (greeksIdx >= 0) {
            int braceStart = json.indexOf('{', greeksIdx);
            int braceEnd = json.indexOf('}', braceStart);
            if (braceStart >= 0 && braceEnd >= 0) {
                String greeksJson = json.substring(braceStart, braceEnd + 1);
                obj.put("greeks_delta", extractDouble(greeksJson, "delta"));
            }
        }
        return obj;
    }

    private double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) return n.doubleValue();
        return 0;
    }

    private int getInt(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) return n.intValue();
        return 0;
    }

    private double getNestedDouble(Map<String, Object> map, String outer, String inner) {
        Object val = map.get(outer + "_" + inner);
        if (val instanceof Number n) return n.doubleValue();
        return 0;
    }

    // --- Result types ---

    public record ExpirationResult(List<MarketExpiration> expirations, String retrievedAt, boolean cacheHit) {}
    public record ChainResult(MarketChain chain, String retrievedAt, boolean cacheHit) {}
}
