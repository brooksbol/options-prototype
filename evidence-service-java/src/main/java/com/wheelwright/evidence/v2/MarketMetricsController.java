package com.wheelwright.evidence.v2;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Read-only per-underlying volatility metrics — {@code GET /api/evidence/market-metrics?symbol=...}
 *
 * <p>INTERIM v1 capability. Serves tastytrade {@code /market-metrics} evidence
 * (IV Rank, IV Percentile, IV Index, 30-day historical vol, IV−HV30, with
 * methodology provenance and the provider observation timestamp) for the
 * Deployment surface. Strictly OBSERVATIONAL: the Decision Engine does not read
 * this, and these values never affect eligibility, posture, ranking, capital, or
 * execution recommendation.
 *
 * <p>Boundaries:
 * <ul>
 *   <li>Read/capture, not refresh of chain evidence. Independent of Tradier
 *       acquisition and the frozen snapshot-v1 contract.</li>
 *   <li>Credentials stay backend-only; the response is screened for secrets by
 *       {@link TastytradeClient} before it is ever returned.</li>
 *   <li>A short in-memory TTL cache bounds provider traffic so repeated table
 *       renders do not each trigger an upstream call. Freshness that the operator
 *       sees is governed by the provider's {@code ivUpdatedAt} observation time,
 *       NOT by this cache or by HTTP success.</li>
 *   <li>Failed refresh preserves the previously cached observation (served with
 *       its original age) rather than overwriting it with nothing.</li>
 *   <li>Requested symbols with no provider coverage are reported explicitly in
 *       {@code missing}; they are never fabricated as zero metrics.</li>
 * </ul>
 */
@RestController
public class MarketMetricsController {

    private final TastytradeClient client;

    /** Short cache TTL: metrics update on a slow (daily-ish) cadence; this only
     * suppresses repeated upstream calls within one operator session window. */
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);
    /** Conservative batch size for the comma-separated symbols= query. */
    private static final int BATCH = 100;

    private record Cached(MarketMetrics metrics, Instant storedAt) {}
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public MarketMetricsController(TastytradeClient client) {
        this.client = client;
    }

    @GetMapping("/api/evidence/market-metrics")
    public ResponseEntity<String> metrics(
            @RequestParam(name = "symbol", required = false) List<String> symbols
    ) {
        if (symbols == null || symbols.isEmpty()) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"At least one symbol parameter is required\"}");
        }
        if (!client.configured()) {
            // Fail closed, but don't error the page: honest "unavailable" with no data.
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"status\":\"unavailable\",\"metrics\":[],\"missing\":" + jsonArray(normalize(symbols)) + "}");
        }

        // Normalize + validate shape; silently drop malformed symbols (reported as missing).
        List<String> requested = normalize(symbols);
        List<String> valid = requested.stream().filter(s -> s.matches("[A-Z][A-Z0-9.]{0,9}")).toList();

        Instant now = Instant.now();
        Map<String, MarketMetrics> found = new LinkedHashMap<>();

        // Serve cache hits first; collect misses for a batched upstream fetch.
        List<String> misses = new ArrayList<>();
        for (String s : valid) {
            Cached c = cache.get(s);
            if (c != null && Duration.between(c.storedAt(), now).compareTo(CACHE_TTL) < 0) {
                found.put(s, c.metrics());
            } else {
                misses.add(s);
            }
        }

        if (!misses.isEmpty()) {
            for (int i = 0; i < misses.size(); i += BATCH) {
                List<String> batch = misses.subList(i, Math.min(i + BATCH, misses.size()));
                try {
                    byte[] body = client.marketMetrics(batch);
                    List<MarketMetrics> parsed = MarketMetrics.parse(body);
                    for (MarketMetrics m : parsed) {
                        cache.put(m.symbol(), new Cached(m, now));
                        found.put(m.symbol(), m);
                    }
                } catch (Exception e) {
                    // Failed refresh preserves prior successful observations: fall back to
                    // any still-cached (even if TTL-expired) value rather than dropping it.
                    for (String s : batch) {
                        Cached stale = cache.get(s);
                        if (stale != null) found.put(s, stale.metrics());
                    }
                }
            }
        }

        // Missing = requested-but-not-found (coverage gaps + malformed + failed-with-no-prior).
        List<String> missing = requested.stream().filter(s -> !found.containsKey(s)).toList();

        StringBuilder sb = new StringBuilder(256);
        sb.append("{\"status\":\"ok\",\"metrics\":[");
        boolean first = true;
        for (MarketMetrics m : found.values()) {
            if (!first) sb.append(",");
            first = false;
            appendMetrics(sb, m);
        }
        sb.append("],\"missing\":").append(jsonArray(missing)).append("}");

        return ResponseEntity.ok()
                .header("Cache-Control", "private, no-cache")
                .contentType(MediaType.APPLICATION_JSON)
                .body(sb.toString());
    }

    private static List<String> normalize(List<String> symbols) {
        return symbols.stream()
                .map(s -> s.toUpperCase(Locale.ROOT).trim())
                .filter(s -> !s.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    private static void appendMetrics(StringBuilder sb, MarketMetrics m) {
        sb.append("{");
        sb.append("\"symbol\":").append(jsonString(m.symbol())).append(",");
        sb.append("\"ivRank\":").append(num(m.ivRank())).append(",");
        sb.append("\"ivRankSource\":").append(jsonString(m.ivRankSource())).append(",");
        sb.append("\"ivRankTos\":").append(num(m.ivRankTos())).append(",");
        sb.append("\"ivRankTw\":").append(num(m.ivRankTw())).append(",");
        sb.append("\"ivPercentile\":").append(num(m.ivPercentile())).append(",");
        sb.append("\"ivIndex\":").append(num(m.ivIndex())).append(",");
        sb.append("\"historicalVolatility30\":").append(num(m.historicalVolatility30())).append(",");
        sb.append("\"ivHv30Difference\":").append(num(m.ivHv30Difference())).append(",");
        sb.append("\"ivUpdatedAt\":").append(jsonString(m.ivUpdatedAt()));
        sb.append("}");
    }

    /** Nullable number: provider absence → JSON null (never 0). Provider exact 0 → 0. */
    private static String num(Double v) {
        return v == null ? "null" : String.valueOf(v.doubleValue());
    }

    private static String jsonArray(List<String> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(jsonString(items.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    private static String jsonString(String value) {
        if (value == null) return "null";
        StringBuilder sb = new StringBuilder(value.length() + 2);
        sb.append('"');
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> sb.append(c);
            }
        }
        sb.append('"');
        return sb.toString();
    }
}
