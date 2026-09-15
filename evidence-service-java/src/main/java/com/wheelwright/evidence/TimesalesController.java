package com.wheelwright.evidence;

import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Intraday timesales endpoint — GET /api/evidence/timesales?symbol=...&symbol=...
 *
 * Serves intraday bar series (close + time) for the requested underlyings, used to
 * derive HIGH-RESOLUTION moneyness sparklines on the Operator Console (spot series ×
 * fixed strike — the strike never moves, only spot does, so one timesales call gives
 * a full-day smooth curve).
 *
 * <p>Appliance-sourced, architecture-clean: the browser makes NO provider calls. This
 * fetches through the active provider authority + pacer (rate-limit compliance,
 * credential custody), with a per-symbol short server-side TTL so many positions /
 * clients cannot spray the provider. NOT persisted (a live market-context read, not
 * observed evidence written to spot_history) and NOT part of the frozen snapshot
 * contract.
 *
 * <p>Response: { "generatedAt": "...", "series": { "COPX": [{ "close": 85.1, "time":
 * "2026-09-15T09:30:00" }, ...], ... } }. Empty array for a symbol with no data
 * (off-hours / provider) — never fabricated.
 */
@RestController
public class TimesalesController {

    private static final long TTL_MS = 60_000;
    private static final int MAX_SYMBOLS = 40; // guard against unbounded fan-out

    private record Cached(String barsJson, long atMs) {}
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    private final ProviderAuthorityManager providerManager;

    public TimesalesController(ProviderAuthorityManager providerManager) {
        this.providerManager = providerManager;
    }

    @GetMapping("/api/evidence/timesales")
    public ResponseEntity<String> timesales(
            @RequestParam(name = "symbol", required = false) List<String> symbols) {
        if (symbols == null || symbols.isEmpty()) {
            return ResponseEntity.badRequest()
                    .header("Content-Type", "application/json")
                    .body("{\"error\":\"at least one 'symbol' is required\"}");
        }

        // Normalize: uppercase, dedupe, cap.
        List<String> normalized = symbols.stream()
                .map(s -> s.toUpperCase().trim())
                .filter(s -> !s.isBlank())
                .distinct()
                .limit(MAX_SYMBOLS)
                .toList();

        TradierAdapter adapter = providerManager.active().adapter();
        String today = LocalDate.now(ZoneId.of("America/New_York")).toString();
        String start = today + " 09:30";
        String end = today + " 16:00";
        long now = System.currentTimeMillis();

        StringBuilder sb = new StringBuilder();
        sb.append("{\"generatedAt\":").append(jsonString(Instant.now().toString())).append(",\"series\":{");
        boolean first = true;
        for (String symbol : normalized) {
            if (!first) sb.append(",");
            first = false;
            sb.append(jsonString(symbol)).append(":").append(barsForSymbol(adapter, symbol, start, end, now));
        }
        sb.append("}}");

        return ResponseEntity.ok().header("Content-Type", "application/json").body(sb.toString());
    }

    /** Per-symbol cached bars JSON array. On any provider condition → "[]" (honest empty). */
    private String barsForSymbol(TradierAdapter adapter, String symbol, String start, String end, long now) {
        Cached c = cache.get(symbol);
        if (c != null && (now - c.atMs()) < TTL_MS) {
            return c.barsJson();
        }
        String barsJson;
        try {
            List<TradierAdapter.IntradayBar> bars = adapter.getIntradayBars(symbol, "5min", start, end).bars();
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < bars.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("{\"close\":").append(bars.get(i).close())
                  .append(",\"time\":").append(jsonString(bars.get(i).time())).append("}");
            }
            sb.append("]");
            barsJson = sb.toString();
        } catch (Exception e) {
            barsJson = "[]";
        }
        cache.put(symbol, new Cached(barsJson, now));
        return barsJson;
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
