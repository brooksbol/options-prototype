package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Spot history endpoint — GET /api/evidence/history
 *
 * Returns truthful persisted spot observations for requested symbols.
 * No interpolation, no fabrication. Returns only what was actually observed.
 *
 * Query params:
 *   symbol (repeated) — one or more underlying symbols
 *   since (optional) — ISO-8601 timestamp; defaults to start of current session (~09:30 ET today)
 *
 * Response shape:
 *   { "histories": { "XLE": [{ "price": 64.56, "observedAt": "..." }, ...], ... } }
 *
 * Empty arrays are returned for symbols with no observations in the requested window.
 */
@RestController
public class HistoryController {

    private final SqliteEvidenceStore store;

    public HistoryController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @GetMapping("/api/evidence/history")
    public ResponseEntity<String> history(
            @RequestParam(name = "symbol", required = false) List<String> symbols,
            @RequestParam(name = "since", required = false) String since
    ) throws SQLException {

        if (symbols == null || symbols.isEmpty()) {
            return ResponseEntity.badRequest()
                    .header("Content-Type", "application/json")
                    .body("{\"error\":\"At least one symbol parameter is required\"}");
        }

        // Normalize symbols
        List<String> normalized = symbols.stream()
                .map(String::toUpperCase)
                .distinct()
                .sorted()
                .toList();

        // Default 'since' to ~12 hours ago (covers current session generously)
        String sinceValue = since != null ? since : Instant.now().minus(12, ChronoUnit.HOURS).toString();

        Map<String, List<Map<String, Object>>> histories = store.getSpotHistory(normalized, sinceValue);

        // Build JSON response
        String payload = buildResponseJson(histories);

        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .header("Cache-Control", "private, max-age=30")
                .body(payload);
    }

    /**
     * Bulk spot history — GET /api/evidence/history/all
     *
     * Returns ALL spot observations for ALL symbols since a timestamp.
     * Designed for consumers that need the full universe history (e.g., Kreature Field).
     * No symbol list required — returns everything in one response.
     *
     * Query params:
     *   since (optional) — ISO-8601 timestamp; defaults to ~14 hours ago
     *
     * Response shape: same as /api/evidence/history
     *   { "histories": { "XLE": [{ "price": 64.56, "observedAt": "..." }, ...], ... } }
     */
    @GetMapping("/api/evidence/history/all")
    public ResponseEntity<String> historyAll(
            @RequestParam(name = "since", required = false) String since
    ) throws SQLException {
        String sinceValue = since != null ? since : Instant.now().minus(14, ChronoUnit.HOURS).toString();

        Map<String, List<Map<String, Object>>> histories = store.getAllSpotHistory(sinceValue);

        String payload = buildResponseJson(histories);

        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .header("Cache-Control", "private, max-age=30")
                .body(payload);
    }

    private static String buildResponseJson(Map<String, List<Map<String, Object>>> histories) {
        StringBuilder sb = new StringBuilder(512);
        sb.append("{\"histories\":{");

        boolean firstSymbol = true;
        for (Map.Entry<String, List<Map<String, Object>>> entry : histories.entrySet()) {
            if (!firstSymbol) sb.append(",");
            firstSymbol = false;

            sb.append("\"").append(entry.getKey()).append("\":[");
            boolean firstObs = true;
            for (Map<String, Object> obs : entry.getValue()) {
                if (!firstObs) sb.append(",");
                firstObs = false;
                sb.append("{\"price\":").append(obs.get("price"));
                sb.append(",\"observedAt\":\"").append(obs.get("observedAt")).append("\"}");
            }
            sb.append("]");
        }

        sb.append("}}");
        return sb.toString();
    }
}
