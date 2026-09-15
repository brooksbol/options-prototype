package com.wheelwright.evidence;

import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Markets glance endpoint — GET /api/markets
 *
 * Serves broad market-index context (value + broker-computed daily change + an
 * intraday price series for a sparkline) for the operator header "Markets" card.
 *
 * <p>Appliance-sourced, architecture-clean: the browser makes NO provider calls.
 * This endpoint fetches through the SAME active provider authority + pacer as all
 * other acquisition, so it inherits rate-limit compliance and credential custody.
 * It is read-through with a short server-side TTL so the frontend's 30s poll (across
 * clients) cannot spray the provider.
 *
 * <p>Index selection: SPX (S&P 500) and NDX (Nasdaq 100) — real cash-index symbols
 * Tradier's production plan serves. The daily change/percent come straight from the
 * provider quote (vs prior close), and the sparkline from real intraday timesales
 * bars — neither reconstructed nor fabricated. Symbols with no data yield null fields
 * (the card renders "—"), never invented values.
 *
 * <p>NOT part of the frozen evidence-snapshot contract; a distinct market-context read.
 */
@RestController
public class MarketsController {

    /** Fixed index set for the header glance (label + provider symbol). */
    private static final List<String[]> INDICES = List.of(
        new String[] {"$DJI", "Dow Jones"},
        new String[] {"SPX", "S&P 500"},
        new String[] {"NDX", "Nasdaq 100"}
    );

    /** Short server-side cache so repeated frontend polls don't re-hit the provider. */
    private static final long TTL_MS = 60_000;
    private final AtomicReference<Cached> cache = new AtomicReference<>(null);

    private record Cached(String json, long atMs) {}

    private final ProviderAuthorityManager providerManager;

    public MarketsController(ProviderAuthorityManager providerManager) {
        this.providerManager = providerManager;
    }

    @GetMapping("/api/markets")
    public ResponseEntity<String> markets() {
        Cached c = cache.get();
        long now = System.currentTimeMillis();
        if (c != null && (now - c.atMs()) < TTL_MS) {
            return ResponseEntity.ok().header("Content-Type", "application/json").body(c.json());
        }

        String json = buildPayload();
        cache.set(new Cached(json, now));
        return ResponseEntity.ok().header("Content-Type", "application/json").body(json);
    }

    private String buildPayload() {
        TradierAdapter adapter = providerManager.active().adapter();

        // Current-session intraday window (ET). Tradier accepts "YYYY-MM-DD HH:MM".
        String today = LocalDate.now(ZoneId.of("America/New_York")).toString();
        String start = today + " 09:30";
        String end = today + " 16:00";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"generatedAt\":").append(jsonString(Instant.now().toString())).append(",\"indices\":[");

        boolean first = true;
        for (String[] idx : INDICES) {
            String symbol = idx[0];
            String label = idx[1];
            if (!first) sb.append(",");
            first = false;
            sb.append(buildIndex(adapter, symbol, label, start, end));
        }
        sb.append("]}");
        return sb.toString();
    }

    private String buildIndex(TradierAdapter adapter, String symbol, String label, String start, String end) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("symbol", symbol);
        row.put("label", label);

        // Quote: value + broker-computed daily change. On any provider condition, emit
        // nulls (the card shows "—") rather than fabricating a value.
        try {
            TradierAdapter.IndexQuote q = adapter.getIndexQuote(symbol);
            row.put("last", q.last() != 0 ? q.last() : null);
            row.put("change", q.change());
            row.put("changePercent", q.changePercent());
            row.put("prevClose", q.prevClose() != 0 ? q.prevClose() : null);
            row.put("observedAt", q.retrievedAt());
        } catch (Exception e) {
            row.put("last", null);
            row.put("change", null);
            row.put("changePercent", null);
            row.put("prevClose", null);
            row.put("observedAt", null);
        }

        // Intraday series for the sparkline. Empty when unavailable (off-hours / provider).
        List<Double> series;
        try {
            series = adapter.getIntradaySeries(symbol, "5min", start, end).prices();
        } catch (Exception e) {
            series = List.of();
        }
        row.put("intraday", series);

        return toJson(row);
    }

    // --- minimal JSON emit (no dependency; mirrors other controllers' style) ---

    @SuppressWarnings("unchecked")
    private String toJson(Map<String, Object> row) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : row.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append(jsonString(e.getKey())).append(":");
            Object v = e.getValue();
            if (v == null) {
                sb.append("null");
            } else if (v instanceof String s) {
                sb.append(jsonString(s));
            } else if (v instanceof List<?> list) {
                sb.append("[");
                for (int i = 0; i < list.size(); i++) {
                    if (i > 0) sb.append(",");
                    sb.append(list.get(i));
                }
                sb.append("]");
            } else {
                sb.append(v); // numbers
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private static String jsonString(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> sb.append(c);
            }
        }
        return sb.append("\"").toString();
    }
}
