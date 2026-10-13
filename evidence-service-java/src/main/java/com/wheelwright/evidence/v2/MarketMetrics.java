package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;

import java.util.ArrayList;
import java.util.List;

/**
 * Per-underlying volatility metrics observed from tastytrade {@code /market-metrics}.
 *
 * <p>INTERIM v1 scope. These are OBSERVATIONAL evidence for the Deployment surface
 * (CSV export + on-screen columns). They are NEVER an input to candidate
 * eligibility, posture, ranking, capital allocation, or execution recommendation.
 * Wheelwright's Decision Engine does not consume them.
 *
 * <p>Measurement-identity discipline (do not collapse):
 * <ul>
 *   <li>{@code ivRank} is tastytrade's headline {@code implied-volatility-index-rank},
 *       carried VERBATIM in the provider's 0..1 scale (presentation layer multiplies
 *       by 100). {@code ivRankSource} is the provider's methodology identifier
 *       ({@code implied-volatility-index-rank-source}, e.g. {@code tos}).</li>
 *   <li>{@code ivRankTos} and {@code ivRankTw} are the two DISTINCT provider
 *       methodology values ({@code tos-implied-volatility-index-rank} /
 *       {@code tw-implied-volatility-index-rank}). They are never averaged, and one
 *       is never silently substituted for the other.</li>
 *   <li>{@code ivPercentile} is {@code implied-volatility-percentile} (0..1).</li>
 *   <li>{@code ivIndex} is {@code implied-volatility-index} (the underlying's current
 *       implied-volatility level).</li>
 *   <li>{@code historicalVolatility30} is {@code historical-volatility-30-day}
 *       (realized vol).</li>
 *   <li>{@code ivHv30Difference} is {@code iv-hv-30-day-difference} (implied minus
 *       realized). Context only — NOT proof that options are mispriced.</li>
 *   <li>{@code ivUpdatedAt} is {@code implied-volatility-updated-at}, the provider
 *       observation time preserved VERBATIM. Freshness is governed by this
 *       timestamp, never by the success of the HTTP request.</li>
 * </ul>
 *
 * <p>Absence discipline: every numeric field is {@link Double} (nullable). Provider
 * absence (field omitted, explicit null, or unparseable) is {@code null}, never 0.
 * A provider exact {@code 0.0} is preserved as {@code 0.0}.
 */
public record MarketMetrics(
        String symbol,
        Double ivRank,
        String ivRankSource,
        Double ivRankTos,
        Double ivRankTw,
        Double ivPercentile,
        Double ivIndex,
        Double historicalVolatility30,
        Double ivHv30Difference,
        String ivUpdatedAt
) {
    private static final ObjectMapper JSON = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    /**
     * Parse the tastytrade {@code /market-metrics} response body into one
     * {@link MarketMetrics} per returned item. Unknown/absent fields become null;
     * a missing symbol simply does not appear in the result (missing symbols are
     * reported separately by the caller, never fabricated as zero metrics).
     *
     * The response shape is {@code { "data": { "items": [ { ... }, ... ] } }}.
     */
    public static List<MarketMetrics> parse(byte[] body) throws Exception {
        JsonNode root = JSON.readTree(body);
        JsonNode items = root.path("data").path("items");
        List<MarketMetrics> out = new ArrayList<>();
        if (!items.isArray()) return out;
        for (JsonNode it : items) {
            String symbol = text(it, "symbol");
            if (symbol == null || symbol.isBlank()) continue;
            out.add(new MarketMetrics(
                    symbol.toUpperCase(java.util.Locale.ROOT),
                    num(it, "implied-volatility-index-rank"),
                    text(it, "implied-volatility-index-rank-source"),
                    num(it, "tos-implied-volatility-index-rank"),
                    num(it, "tw-implied-volatility-index-rank"),
                    num(it, "implied-volatility-percentile"),
                    num(it, "implied-volatility-index"),
                    num(it, "historical-volatility-30-day"),
                    num(it, "iv-hv-30-day-difference"),
                    text(it, "implied-volatility-updated-at")
            ));
        }
        return out;
    }

    /**
     * Coerce a provider field to {@code Double} preserving provider exact zero and
     * mapping absence/null/unparseable/non-finite to {@code null}. tastytrade emits
     * these values as JSON numbers OR numeric strings; both are accepted.
     */
    private static Double num(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) return null;
        double d;
        if (v.isNumber()) {
            d = v.doubleValue();
        } else if (v.isTextual()) {
            try {
                d = Double.parseDouble(v.textValue().trim());
            } catch (NumberFormatException e) {
                return null;
            }
        } else {
            return null;
        }
        return Double.isFinite(d) ? d : null;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v != null && v.isTextual()) ? v.textValue() : null;
    }
}
