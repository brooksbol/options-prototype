package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Selective quote observations endpoint — GET /api/evidence/quotes
 *
 * Read-only projection of currently-held underlying price observations.
 * No acquisition side effects. Does not trigger refreshes or priority changes.
 *
 * Observation and acquisition state are explicitly separated:
 * - observation: the price fact we hold (preserved across failed refreshes)
 * - acquisition: current state of the acquisition machinery
 *
 * Symbols outside the canonical universe are rejected with 400.
 */
@RestController
public class QuotesController {

    private final SqliteEvidenceStore store;

    public QuotesController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @GetMapping("/api/evidence/quotes")
    public ResponseEntity<String> quotes(
            @RequestParam(name = "symbol", required = false) List<String> symbols,
            HttpServletRequest request
    ) throws SQLException {

        // Validate: at least one symbol required
        if (symbols == null || symbols.isEmpty()) {
            return ResponseEntity.badRequest()
                    .header("Content-Type", "application/json")
                    .body("{\"error\":\"At least one symbol parameter is required\"}");
        }

        // Normalize: uppercase, deduplicate, sort
        List<String> normalized = symbols.stream()
                .map(String::toUpperCase)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // Validate: all symbols must be in canonical universe
        List<String> unknown = store.findUnknownSymbols(normalized);
        if (!unknown.isEmpty()) {
            StringBuilder errBody = new StringBuilder();
            errBody.append("{\"error\":\"Symbols not in universe\",\"unknownSymbols\":[");
            for (int i = 0; i < unknown.size(); i++) {
                if (i > 0) errBody.append(",");
                errBody.append("\"").append(unknown.get(i)).append("\"");
            }
            errBody.append("]}");
            return ResponseEntity.badRequest()
                    .header("Content-Type", "application/json")
                    .body(errBody.toString());
        }

        // Compute representation-correct ETag
        int generation = store.getGeneration();
        String fingerprint = computeSymbolFingerprint(normalized);
        String etag = "\"quotes-" + fingerprint + "-gen-" + generation + "\"";

        // Conditional HTTP: If-None-Match
        String clientETag = request.getHeader("If-None-Match");
        if (clientETag != null) {
            String normalizedClient = clientETag.replaceFirst("^W/", "").trim();
            String normalizedCurrent = etag.replaceFirst("^W/", "").trim();
            if (normalizedClient.equals(normalizedCurrent)) {
                return ResponseEntity.status(304)
                        .header("ETag", etag)
                        .build();
            }
        }

        // Query observations
        String generatedAt = store.getGeneratedAt();
        List<Map<String, Object>> observations = store.getQuoteObservations(normalized);

        // Build JSON response
        String payload = buildResponseJson(generation, generatedAt, observations);

        return ResponseEntity.ok()
                .header("ETag", etag)
                .header("Cache-Control", "private, no-cache")
                .header("Content-Type", "application/json")
                .body(payload);
    }

    /**
     * Build the JSON response with explicit observation/acquisition separation.
     */
    private static String buildResponseJson(int generation, String generatedAt, List<Map<String, Object>> observations) {
        StringBuilder sb = new StringBuilder(512);
        sb.append("{");
        sb.append("\"generation\":").append(generation).append(",");
        sb.append("\"generatedAt\":").append(jsonString(generatedAt)).append(",");
        sb.append("\"quotes\":[");

        boolean first = true;
        for (Map<String, Object> obs : observations) {
            if (!first) sb.append(",");
            first = false;

            sb.append("{");
            sb.append("\"symbol\":").append(jsonString((String) obs.get("symbol"))).append(",");

            // Observation: price + observedAt (null when no successful chain exists)
            Double price = (Double) obs.get("price");
            String observedAt = (String) obs.get("observedAt");
            if (price != null && observedAt != null) {
                sb.append("\"observation\":{");
                sb.append("\"price\":").append(price).append(",");
                sb.append("\"observedAt\":").append(jsonString(observedAt));
                sb.append("},");
            } else {
                sb.append("\"observation\":null,");
            }

            // Acquisition: status + attempt metadata
            sb.append("\"acquisition\":{");
            sb.append("\"status\":").append(jsonString((String) obs.get("status"))).append(",");
            sb.append("\"lastAttemptAt\":").append(jsonString((String) obs.get("lastAttemptAt"))).append(",");
            sb.append("\"failureCount\":").append(obs.get("failureCount"));
            sb.append("}");

            sb.append("}");
        }

        sb.append("]}");
        return sb.toString();
    }

    /**
     * Compute a stable fingerprint of the normalized symbol set for ETag identity.
     * Uses first 8 hex characters of SHA-256 over the sorted, joined symbol list.
     */
    private static String computeSymbolFingerprint(List<String> sortedSymbols) {
        String joined = String.join(",", sortedSymbols);
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(joined.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < 4; i++) {
                hex.append(String.format("%02x", hash[i]));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is always available in Java
            throw new RuntimeException(e);
        }
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
