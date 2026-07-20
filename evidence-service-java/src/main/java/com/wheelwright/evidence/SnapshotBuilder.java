package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * Builds the frozen v1 evidence snapshot JSON from persisted state.
 *
 * Field names, nesting, null handling, and ordering exactly match
 * the TypeScript implementation and docs/contracts/evidence-snapshot-v1.md.
 *
 * This class produces raw JSON to avoid any framework-introduced
 * field ordering or null-handling differences.
 */
public class SnapshotBuilder {

    /**
     * Build the complete snapshot JSON string from the evidence store.
     */
    public static String buildSnapshotJson(SqliteEvidenceStore store) throws SQLException {
        int generation = store.getGeneration();
        String generatedAt = store.getGeneratedAt();
        List<String> allSymbols = store.getAllSymbols();
        Map<String, Integer> coverage = store.getCoverage();

        StringBuilder sb = new StringBuilder(4096);
        sb.append("{");
        sb.append("\"apiVersion\":\"1\",");
        sb.append("\"generation\":").append(generation).append(",");
        sb.append("\"generatedAt\":").append(jsonString(generatedAt)).append(",");
        sb.append("\"universe\":").append(allSymbols.size()).append(",");

        // Coverage
        sb.append("\"coverage\":{");
        sb.append("\"ready\":").append(coverage.getOrDefault("ready", 0)).append(",");
        sb.append("\"absent\":").append(coverage.getOrDefault("absent", 0)).append(",");
        sb.append("\"expirationsKnown\":").append(coverage.getOrDefault("expirationsKnown", 0)).append(",");
        sb.append("\"pending\":").append(coverage.getOrDefault("pending", 0)).append(",");
        sb.append("\"failed\":").append(coverage.getOrDefault("failed", 0));
        sb.append("},");

        // Symbols array
        sb.append("\"symbols\":[");
        boolean first = true;
        for (String symbol : allSymbols) {
            Map<String, Object> ev = store.getEvidence(symbol);
            if (ev == null) continue;
            if (!first) sb.append(",");
            first = false;
            appendSymbolEvidence(sb, ev);
        }
        sb.append("],");

        // Telemetry (process-lifetime counters — zero until acquisition worker is active)
        sb.append("\"telemetry\":{");
        sb.append("\"symbolsChangedThisGeneration\":0,");
        sb.append("\"upstreamCalls\":0,");
        sb.append("\"cacheHits\":0");
        sb.append("}");

        sb.append("}");
        return sb.toString();
    }

    private static void appendSymbolEvidence(StringBuilder sb, Map<String, Object> ev) {
        sb.append("{");
        sb.append("\"symbol\":").append(jsonString((String) ev.get("symbol"))).append(",");
        sb.append("\"status\":").append(jsonString((String) ev.get("status"))).append(",");

        // expirations: parsed JSON array or null
        String expirationsData = (String) ev.get("expirations");
        if (expirationsData != null && !expirationsData.isEmpty()) {
            sb.append("\"expirations\":").append(expirationsData).append(",");
        } else {
            sb.append("\"expirations\":null,");
        }

        // primaryExpiration: string or null
        String primaryExp = (String) ev.get("primaryExpiration");
        if (primaryExp != null) {
            sb.append("\"primaryExpiration\":").append(jsonString(primaryExp)).append(",");
        } else {
            sb.append("\"primaryExpiration\":null,");
        }

        // chain: parsed JSON object or null
        String chainData = (String) ev.get("chain");
        if (chainData != null && !chainData.isEmpty()) {
            sb.append("\"chain\":").append(chainData).append(",");
        } else {
            sb.append("\"chain\":null,");
        }

        // retrievedAt: string or null
        String retrievedAt = (String) ev.get("retrievedAt");
        if (retrievedAt != null) {
            sb.append("\"retrievedAt\":").append(jsonString(retrievedAt)).append(",");
        } else {
            sb.append("\"retrievedAt\":null,");
        }

        // failureReason: string or null
        String failureReason = (String) ev.get("failureReason");
        if (failureReason != null) {
            sb.append("\"failureReason\":").append(jsonString(failureReason)).append(",");
        } else {
            sb.append("\"failureReason\":null,");
        }

        // failureCount: integer
        int failureCount = (Integer) ev.get("failureCount");
        sb.append("\"failureCount\":").append(failureCount).append(",");

        // lastAttemptAt: string or null
        String lastAttemptAt = (String) ev.get("lastAttemptAt");
        if (lastAttemptAt != null) {
            sb.append("\"lastAttemptAt\":").append(jsonString(lastAttemptAt));
        } else {
            sb.append("\"lastAttemptAt\":null");
        }

        sb.append("}");
    }

    /**
     * Produce a JSON-safe quoted string, escaping necessary characters.
     */
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
