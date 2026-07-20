package com.wheelwright.evidence.db;

import java.sql.*;
import java.time.Instant;
import java.util.*;

/**
 * SQLite-backed evidence store — durable persistence for the evidence appliance.
 *
 * Reproduces the behavioral semantics of the TypeScript SqliteEvidenceStore:
 *   - Failed refresh preserves last successful payload
 *   - Absence is a resolution outcome (empty expirations)
 *   - Generation increments on publishSnapshot(), not individual writes
 *   - No freshness/staleness stored — derived from facts at query time
 *   - Primary expiration selected as nearest to 21 DTE within 7-45 range
 */
public class SqliteEvidenceStore implements AutoCloseable {

    private final Connection conn;

    public SqliteEvidenceStore(String dbPath) throws SQLException {
        this.conn = DatabaseManager.open(dbPath);
    }

    // --- Universe ---

    /**
     * Initialize universe symbols. Idempotent — only adds symbols not already present.
     */
    public void initUniverse(List<String> symbols) throws SQLException {
        String now = Instant.now().toString();
        conn.setAutoCommit(false);
        try (PreparedStatement insertSymbol = conn.prepareStatement(
                    "INSERT OR IGNORE INTO symbols (symbol, added_at) VALUES (?, ?)");
             PreparedStatement insertResolution = conn.prepareStatement(
                    "INSERT OR IGNORE INTO symbol_resolution (symbol, resolution) VALUES (?, 'pending')")) {
            for (String symbol : symbols) {
                insertSymbol.setString(1, symbol);
                insertSymbol.setString(2, now);
                insertSymbol.executeUpdate();

                insertResolution.setString(1, symbol);
                insertResolution.executeUpdate();
            }
            conn.commit();
        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }

    // --- Evidence Recording ---

    /**
     * Record expirations for a symbol. Empty expirations = absence.
     */
    public void setExpirations(String symbol, String expirationsJson, String retrievedAt) throws SQLException {
        if (getResolution(symbol) == null) return;

        String sessionDate = currentSessionDate();

        // Upsert evidence row
        try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO evidence (symbol, evidence_type, expiration, data, retrieved_at, session_date, last_attempt_at, attempt_result, failure_count)
                VALUES (?, 'expirations', '', ?, ?, ?, ?, 'success', 0)
                ON CONFLICT(symbol, evidence_type, expiration) DO UPDATE SET
                    data = excluded.data,
                    retrieved_at = excluded.retrieved_at,
                    session_date = excluded.session_date,
                    last_attempt_at = excluded.last_attempt_at,
                    attempt_result = 'success',
                    failure_count = 0,
                    failure_reason = NULL
            """)) {
            ps.setString(1, symbol);
            ps.setString(2, expirationsJson);
            ps.setString(3, retrievedAt);
            ps.setString(4, sessionDate);
            ps.setString(5, retrievedAt);
            ps.executeUpdate();
        }

        // Determine if absent or partial
        boolean isEmpty = expirationsJson.equals("[]");

        if (isEmpty) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE symbol_resolution SET resolution = 'absent', resolved_at = ?, session_date = ?, primary_expiration = NULL WHERE symbol = ?")) {
                ps.setString(1, retrievedAt);
                ps.setString(2, sessionDate);
                ps.setString(3, symbol);
                ps.executeUpdate();
            }
        } else {
            String primary = selectPrimaryExpiration(expirationsJson);
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE symbol_resolution SET resolution = 'partial', resolved_at = ?, session_date = ?, primary_expiration = ? WHERE symbol = ?")) {
                ps.setString(1, retrievedAt);
                ps.setString(2, sessionDate);
                ps.setString(3, primary);
                ps.setString(4, symbol);
                ps.executeUpdate();
            }
        }
    }

    /**
     * Record chain evidence for a symbol.
     */
    public void setChain(String symbol, String chainJson, String retrievedAt) throws SQLException {
        Map<String, String> resolution = getResolution(symbol);
        if (resolution == null) return;

        String expiration = resolution.getOrDefault("primary_expiration", "");
        String sessionDate = currentSessionDate();

        try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO evidence (symbol, evidence_type, expiration, data, retrieved_at, session_date, last_attempt_at, attempt_result, failure_count)
                VALUES (?, 'chain', ?, ?, ?, ?, ?, 'success', 0)
                ON CONFLICT(symbol, evidence_type, expiration) DO UPDATE SET
                    data = excluded.data,
                    retrieved_at = excluded.retrieved_at,
                    session_date = excluded.session_date,
                    last_attempt_at = excluded.last_attempt_at,
                    attempt_result = 'success',
                    failure_count = 0,
                    failure_reason = NULL
            """)) {
            ps.setString(1, symbol);
            ps.setString(2, expiration);
            ps.setString(3, chainJson);
            ps.setString(4, retrievedAt);
            ps.setString(5, sessionDate);
            ps.setString(6, retrievedAt);
            ps.executeUpdate();
        }

        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE symbol_resolution SET resolution = 'ready', resolved_at = ?, session_date = ? WHERE symbol = ?")) {
            ps.setString(1, retrievedAt);
            ps.setString(2, sessionDate);
            ps.setString(3, symbol);
            ps.executeUpdate();
        }
    }

    /**
     * Record a failure. Does NOT overwrite last successful data/retrieved_at.
     */
    public void setFailure(String symbol, String reason) throws SQLException {
        Map<String, String> resolution = getResolution(symbol);
        if (resolution == null) return;

        String now = Instant.now().toString();
        String resolutionStatus = resolution.get("resolution");
        String currentType = "pending".equals(resolutionStatus) ? "expirations" : "chain";
        String expiration = "chain".equals(currentType)
            ? resolution.getOrDefault("primary_expiration", "")
            : "";

        // Check if evidence row exists
        int existingFailureCount = -1;
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT failure_count FROM evidence WHERE symbol = ? AND evidence_type = ? AND expiration = ?")) {
            ps.setString(1, symbol);
            ps.setString(2, currentType);
            ps.setString(3, expiration);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    existingFailureCount = rs.getInt("failure_count");
                }
            }
        }

        if (existingFailureCount >= 0) {
            // Update existing row — do NOT touch data or retrieved_at
            try (PreparedStatement ps = conn.prepareStatement("""
                    UPDATE evidence SET
                        last_attempt_at = ?,
                        attempt_result = 'failure',
                        failure_count = failure_count + 1,
                        failure_reason = ?
                    WHERE symbol = ? AND evidence_type = ? AND expiration = ?
                """)) {
                ps.setString(1, now);
                ps.setString(2, reason);
                ps.setString(3, symbol);
                ps.setString(4, currentType);
                ps.setString(5, expiration);
                ps.executeUpdate();
            }
        } else {
            // No evidence row yet — create with failure state and no data
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO evidence (symbol, evidence_type, expiration, last_attempt_at, attempt_result, failure_count, failure_reason) VALUES (?, ?, ?, ?, 'failure', 1, ?)")) {
                ps.setString(1, symbol);
                ps.setString(2, currentType);
                ps.setString(3, expiration);
                ps.setString(4, now);
                ps.setString(5, reason);
                ps.executeUpdate();
            }
        }

        // Mark failed if threshold reached
        int newCount = (existingFailureCount >= 0 ? existingFailureCount : 0) + 1;
        if (newCount >= 3) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE symbol_resolution SET resolution = 'failed' WHERE symbol = ?")) {
                ps.setString(1, symbol);
                ps.executeUpdate();
            }
        }
    }

    // --- Queries ---

    /**
     * Get a symbol's current evidence.
     */
    public Map<String, Object> getEvidence(String symbol) throws SQLException {
        Map<String, String> resolution = getResolution(symbol);
        if (resolution == null) return null;

        String status = mapResolutionToStatus(resolution.get("resolution"));
        String primaryExpiration = resolution.get("primary_expiration");

        // Get expirations evidence
        String expirationsData = null;
        String retrievedAt = null;
        int failureCount = 0;
        String failureReason = null;
        String lastAttemptAt = null;

        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT data, retrieved_at, failure_count, failure_reason, last_attempt_at FROM evidence WHERE symbol = ? AND evidence_type = 'expirations'")) {
            ps.setString(1, symbol);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    expirationsData = rs.getString("data");
                    retrievedAt = rs.getString("retrieved_at");
                    failureCount = rs.getInt("failure_count");
                    failureReason = rs.getString("failure_reason");
                    lastAttemptAt = rs.getString("last_attempt_at");
                }
            }
        }

        // Get chain evidence
        String chainData = null;
        String chainRetrievedAt = null;
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT data, retrieved_at FROM evidence WHERE symbol = ? AND evidence_type = 'chain' AND expiration = ?")) {
            ps.setString(1, symbol);
            ps.setString(2, primaryExpiration != null ? primaryExpiration : "");
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    chainData = rs.getString("data");
                    chainRetrievedAt = rs.getString("retrieved_at");
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("symbol", symbol);
        result.put("status", status);
        result.put("expirations", expirationsData);
        result.put("primaryExpiration", primaryExpiration);
        result.put("chain", chainData);
        result.put("retrievedAt", chainRetrievedAt != null ? chainRetrievedAt : retrievedAt);
        result.put("failureReason", failureReason);
        result.put("failureCount", failureCount);
        result.put("lastAttemptAt", lastAttemptAt);
        return result;
    }

    /**
     * Get symbols that need acquisition work.
     */
    public List<String> getWorkQueue() throws SQLException {
        List<String> work = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("""
                SELECT sr.symbol FROM symbol_resolution sr
                WHERE sr.resolution IN ('pending', 'partial')
                   OR (sr.resolution = 'failed' AND (
                     SELECT failure_count FROM evidence e
                     WHERE e.symbol = sr.symbol
                     ORDER BY e.last_attempt_at DESC LIMIT 1
                   ) < 3)
             """)) {
            while (rs.next()) {
                work.add(rs.getString("symbol"));
            }
        }
        return work;
    }

    /**
     * Get coverage counts by resolution status.
     */
    public Map<String, Integer> getCoverage() throws SQLException {
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("ready", 0);
        counts.put("absent", 0);
        counts.put("expirationsKnown", 0);
        counts.put("pending", 0);
        counts.put("failed", 0);

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                "SELECT resolution, COUNT(*) as cnt FROM symbol_resolution GROUP BY resolution")) {
            while (rs.next()) {
                String res = rs.getString("resolution");
                int cnt = rs.getInt("cnt");
                switch (res) {
                    case "ready" -> counts.put("ready", cnt);
                    case "absent" -> counts.put("absent", cnt);
                    case "partial" -> counts.put("expirationsKnown", cnt);
                    case "pending" -> counts.put("pending", cnt);
                    case "failed" -> counts.put("failed", cnt);
                }
            }
        }
        return counts;
    }

    // --- Snapshot ---

    /**
     * Get the current generation number.
     */
    public int getGeneration() throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT generation FROM snapshot_state WHERE id = 1")) {
            return rs.next() ? rs.getInt("generation") : 0;
        }
    }

    /**
     * Get the last publication timestamp.
     */
    public String getGeneratedAt() throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT published_at FROM snapshot_state WHERE id = 1")) {
            if (rs.next()) {
                String val = rs.getString("published_at");
                return val != null ? val : Instant.now().toString();
            }
            return Instant.now().toString();
        }
    }

    /**
     * Publish the snapshot: increment generation.
     */
    public void publishSnapshot() throws SQLException {
        String now = Instant.now().toString();
        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE snapshot_state SET generation = generation + 1, published_at = ? WHERE id = 1")) {
            ps.setString(1, now);
            ps.executeUpdate();
        }
    }

    /**
     * Get the ETag for conditional HTTP.
     */
    public String getETag() throws SQLException {
        return "\"gen-" + getGeneration() + "\"";
    }

    /**
     * Get all active symbols.
     */
    public List<String> getAllSymbols() throws SQLException {
        List<String> symbols = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT symbol FROM symbols WHERE removed_at IS NULL")) {
            while (rs.next()) {
                symbols.add(rs.getString("symbol"));
            }
        }
        return symbols;
    }

    @Override
    public void close() throws SQLException {
        if (conn != null && !conn.isClosed()) {
            conn.close();
        }
    }

    // --- Private helpers ---

    private Map<String, String> getResolution(String symbol) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM symbol_resolution WHERE symbol = ?")) {
            ps.setString(1, symbol);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Map<String, String> result = new HashMap<>();
                result.put("symbol", rs.getString("symbol"));
                result.put("resolution", rs.getString("resolution"));
                result.put("primary_expiration", rs.getString("primary_expiration"));
                result.put("resolved_at", rs.getString("resolved_at"));
                result.put("session_date", rs.getString("session_date"));
                return result;
            }
        }
    }

    private String mapResolutionToStatus(String resolution) {
        return switch (resolution) {
            case "ready" -> "ready";
            case "absent" -> "absent";
            case "partial" -> "expirations_known";
            case "pending" -> "pending";
            case "failed" -> "failed";
            default -> "pending";
        };
    }

    /**
     * Compute the session date from a given instant.
     * Behavioral parity with TypeScript: new Date().toISOString().split("T")[0]
     * This is the UTC date, not the Eastern Time date.
     */
    static String sessionDateFor(Instant instant) {
        return instant.toString().split("T")[0];
    }

    private String currentSessionDate() {
        return sessionDateFor(Instant.now());
    }

    /**
     * Select primary expiration: nearest to 21 DTE within 7-45 range.
     * Falls back to nearest-to-21 overall if no eligible expirations.
     *
     * Input is a JSON array string like: [{"date":"2026-08-03","dte":21},...]
     */
    static String selectPrimaryExpiration(String expirationsJson) {
        // Minimal JSON parsing for [{date, dte}, ...] without external library
        if (expirationsJson == null || expirationsJson.equals("[]")) return null;

        record Exp(String date, int dte) {}
        List<Exp> expirations = new ArrayList<>();

        // Parse simple JSON array of objects with "date" and "dte" fields
        String content = expirationsJson.trim();
        if (content.startsWith("[")) content = content.substring(1);
        if (content.endsWith("]")) content = content.substring(0, content.length() - 1);

        for (String obj : splitJsonObjects(content)) {
            String date = extractJsonString(obj, "date");
            int dte = extractJsonInt(obj, "dte");
            if (date != null && dte >= 0) {
                expirations.add(new Exp(date, dte));
            }
        }

        if (expirations.isEmpty()) return null;

        final int TARGET_DTE = 21;
        final int MIN_DTE = 7;
        final int MAX_DTE = 45;

        List<Exp> eligible = expirations.stream()
            .filter(e -> e.dte >= MIN_DTE && e.dte <= MAX_DTE)
            .toList();

        List<Exp> candidates = eligible.isEmpty() ? expirations : eligible;

        return candidates.stream()
            .min(Comparator.comparingInt(e -> Math.abs(e.dte - TARGET_DTE)))
            .map(Exp::date)
            .orElse(null);
    }

    // --- Minimal JSON helpers (avoid external dependency for simple structures) ---

    private static List<String> splitJsonObjects(String content) {
        List<String> objects = new ArrayList<>();
        int depth = 0;
        int start = -1;
        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '{') {
                if (depth == 0) start = i;
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0 && start >= 0) {
                    objects.add(content.substring(start, i + 1));
                    start = -1;
                }
            }
        }
        return objects;
    }

    private static String extractJsonString(String json, String key) {
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

    private static int extractJsonInt(String json, String key) {
        String pattern = "\"" + key + "\"";
        int idx = json.indexOf(pattern);
        if (idx < 0) return -1;
        int colonIdx = json.indexOf(':', idx + pattern.length());
        if (colonIdx < 0) return -1;
        int start = colonIdx + 1;
        while (start < json.length() && json.charAt(start) == ' ') start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
        if (end == start) return -1;
        try {
            return Integer.parseInt(json.substring(start, end));
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}
