package com.wheelwright.evidence.db;

import com.wheelwright.evidence.SchedulerConfig;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

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
    private int upstreamCalls = 0;
    private int cacheHits = 0;
    private String sessionDateOverride = null;

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

        // Determine if absent or partial (or preserve ready)
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

            // Preserve ready resolution when the symbol already has usable chain evidence
            // for the selected primary expiration. This prevents expirations-only refresh
            // cycles from regressing ready symbols to partial unnecessarily.
            // A chain is "usable" when: (a) a row exists for this expiration, (b) it has
            // data (non-null), and (c) its last attempt was successful (not failed/stale).
            Map<String, String> currentResolution = getResolution(symbol);
            boolean isCurrentlyReady = currentResolution != null && "ready".equals(currentResolution.get("resolution"));

            if (isCurrentlyReady && primary != null && hasUsableChain(symbol, primary)) {
                // Preserve ready — only update session metadata and primary expiration
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE symbol_resolution SET resolved_at = ?, session_date = ?, primary_expiration = ? WHERE symbol = ?")) {
                    ps.setString(1, retrievedAt);
                    ps.setString(2, sessionDate);
                    ps.setString(3, primary);
                    ps.setString(4, symbol);
                    ps.executeUpdate();
                }
            } else {
                // Regress to partial — chain acquisition needed
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
    }

    /**
     * Record chain evidence for a symbol at an explicit expiration.
     * Used by multi-expiration acquisition to store secondary chains
     * without affecting symbol resolution state.
     */
    public void setChainForExpiration(String symbol, String expiration, String chainJson, String retrievedAt) throws SQLException {
        Map<String, String> resolution = getResolution(symbol);
        if (resolution == null) return;

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

        // Append spot observation to history
        Double price = extractUnderlyingPrice(chainJson);
        if (price != null) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO spot_history (symbol, price, observed_at) VALUES (?, ?, ?)")) {
                ps.setString(1, symbol);
                ps.setDouble(2, price);
                ps.setString(3, retrievedAt);
                ps.executeUpdate();
            }
        }
    }

    /**
     * Get all stored chain evidence rows for a symbol (all expirations).
     * Returns a list of maps, each containing: expiration, data, retrievedAt.
     */
    public List<Map<String, String>> getAllChains(String symbol) throws SQLException {
        List<Map<String, String>> chains = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT expiration, data, retrieved_at FROM evidence WHERE symbol = ? AND evidence_type = 'chain' AND data IS NOT NULL ORDER BY expiration")) {
            ps.setString(1, symbol);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, String> chain = new LinkedHashMap<>();
                    chain.put("expiration", rs.getString("expiration"));
                    chain.put("data", rs.getString("data"));
                    chain.put("retrievedAt", rs.getString("retrieved_at"));
                    chains.add(chain);
                }
            }
        }
        return chains;
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

        // Append spot observation to history (temporal evidence accumulation).
        // Extracts underlying.price from the chain JSON — same method used by QuotesController.
        Double price = extractUnderlyingPrice(chainJson);
        if (price != null) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO spot_history (symbol, price, observed_at) VALUES (?, ?, ?)")) {
                ps.setString(1, symbol);
                ps.setDouble(2, price);
                ps.setString(3, retrievedAt);
                ps.executeUpdate();
            }
        }
    }

    // --- Spot History Query ---

    /**
     * Get historical spot observations for the given symbols since a timestamp.
     *
     * Returns a map of symbol → list of {price, observedAt} ordered by time ascending.
     * Only returns observations at or after the 'since' timestamp.
     */
    public Map<String, List<Map<String, Object>>> getSpotHistory(List<String> symbols, String since) throws SQLException {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        for (String symbol : symbols) {
            result.put(symbol, new ArrayList<>());
        }

        // Build IN clause
        String placeholders = symbols.stream().map(s -> "?").collect(Collectors.joining(","));
        String sql = "SELECT symbol, price, observed_at FROM spot_history WHERE symbol IN (" + placeholders + ") AND observed_at >= ? ORDER BY symbol, observed_at ASC";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            int idx = 1;
            for (String symbol : symbols) {
                ps.setString(idx++, symbol);
            }
            ps.setString(idx, since);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String sym = rs.getString("symbol");
                    List<Map<String, Object>> list = result.get(sym);
                    if (list != null) {
                        Map<String, Object> obs = new LinkedHashMap<>();
                        obs.put("price", rs.getDouble("price"));
                        obs.put("observedAt", rs.getString("observed_at"));
                        list.add(obs);
                    }
                }
            }
        }
        return result;
    }

    /**
     * Record a failure. Does NOT overwrite last successful data/retrieved_at.
     */
    public void setFailure(String symbol, String reason) throws SQLException {
        Map<String, String> resolution = getResolution(symbol);
        if (resolution == null) return;

        String now = Instant.now().toString();
        String sessionDate = currentSessionDate();
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

        // Mark failed if threshold reached or re-confirmed; update session_date
        // to record the epoch of the most recent failure attempt.
        // For recovery probes: this advances session_date to today, suppressing
        // further probes this session. For same-session progression: session_date
        // is already today (set by prior successful resolution), so this is a no-op.
        int newCount = (existingFailureCount >= 0 ? existingFailureCount : 0) + 1;
        if (newCount >= 3) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE symbol_resolution SET resolution = 'failed', session_date = ? WHERE symbol = ?")) {
                ps.setString(1, sessionDate);
                ps.setString(2, symbol);
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

        // Get chain evidence (primary expiration — backward compatible)
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

        // Get ALL chains for multi-expiration surface publication
        List<Map<String, String>> allChains = getAllChains(symbol);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("symbol", symbol);
        result.put("status", status);
        result.put("expirations", expirationsData);
        result.put("primaryExpiration", primaryExpiration);
        result.put("chain", chainData);
        result.put("chains", allChains);
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

    // --- Selective Quote Observations ---

    /**
     * Check whether all given symbols exist in the canonical universe.
     * Returns the list of symbols NOT found (empty if all valid).
     */
    public List<String> findUnknownSymbols(List<String> symbols) throws SQLException {
        List<String> unknown = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT 1 FROM symbols WHERE symbol = ? AND removed_at IS NULL")) {
            for (String symbol : symbols) {
                ps.setString(1, symbol);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        unknown.add(symbol);
                    }
                }
                ps.clearParameters();
            }
        }
        return unknown;
    }

    /**
     * Get quote observations for specific symbols.
     *
     * Returns a list of maps, one per symbol, each containing:
     * - symbol: uppercase ticker
     * - price: Double or null (from chain.underlying.price in stored chain JSON)
     * - observedAt: String or null (chain row retrieved_at — when price was successfully observed)
     * - status: String (resolution mapped to snapshot vocabulary)
     * - lastAttemptAt: String or null (chain row last_attempt_at)
     * - failureCount: int (chain row failure_count)
     *
     * Observation fields (price, observedAt) come from the chain evidence row
     * matching the symbol's primary expiration. A failed acquisition preserves
     * the prior successful observation.
     *
     * Caller must ensure all symbols are in the canonical universe.
     */
    public List<Map<String, Object>> getQuoteObservations(List<String> symbols) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();

        for (String symbol : symbols) {
            Map<String, String> resolution = getResolution(symbol);
            if (resolution == null) continue;

            String status = mapResolutionToStatus(resolution.get("resolution"));
            String primaryExpiration = resolution.get("primary_expiration");

            Double price = null;
            String observedAt = null;
            String lastAttemptAt = null;
            int failureCount = 0;

            // Query chain evidence row for primary expiration
            if (primaryExpiration != null) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT data, retrieved_at, last_attempt_at, failure_count FROM evidence WHERE symbol = ? AND evidence_type = 'chain' AND expiration = ?")) {
                    ps.setString(1, symbol);
                    ps.setString(2, primaryExpiration);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            String chainJson = rs.getString("data");
                            observedAt = rs.getString("retrieved_at");
                            lastAttemptAt = rs.getString("last_attempt_at");
                            failureCount = rs.getInt("failure_count");

                            // Extract underlying.price from chain JSON
                            if (chainJson != null) {
                                price = extractUnderlyingPrice(chainJson);
                            }
                        }
                    }
                }
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("symbol", symbol);
            entry.put("price", price);
            entry.put("observedAt", observedAt);
            entry.put("status", status);
            entry.put("lastAttemptAt", lastAttemptAt);
            entry.put("failureCount", failureCount);
            results.add(entry);
        }

        return results;
    }

    /**
     * Extract "underlying.price" from a chain JSON blob.
     * Minimal parsing — finds "underlying":{..."price":<number>...}
     */
    private static Double extractUnderlyingPrice(String chainJson) {
        // Find "underlying": then "price": within that object
        int underlyingIdx = chainJson.indexOf("\"underlying\"");
        if (underlyingIdx < 0) return null;

        int priceIdx = chainJson.indexOf("\"price\"", underlyingIdx);
        if (priceIdx < 0) return null;

        // Find the colon after "price"
        int colonIdx = chainJson.indexOf(':', priceIdx + 7);
        if (colonIdx < 0) return null;

        // Extract the number
        int start = colonIdx + 1;
        while (start < chainJson.length() && Character.isWhitespace(chainJson.charAt(start))) start++;

        int end = start;
        while (end < chainJson.length()) {
            char c = chainJson.charAt(end);
            if (c == ',' || c == '}' || c == ']' || Character.isWhitespace(c)) break;
            end++;
        }

        if (end <= start) return null;
        try {
            return Double.parseDouble(chainJson.substring(start, end));
        } catch (NumberFormatException e) {
            return null;
        }
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

    /**
     * Get the underlying connection (for universe import operations).
     */
    public Connection getConnection() {
        return conn;
    }

    // --- Scheduler Support ---

    /**
     * Record upstream call / cache hit metrics (process-lifetime counters).
     */
    public void recordMetrics(int upstream, int cacheHit) {
        this.upstreamCalls += upstream;
        this.cacheHits += cacheHit;
    }

    public int getUpstreamCalls() { return upstreamCalls; }
    public int getCacheHits() { return cacheHits; }

    /**
     * Get the prioritized work queue for the tiered scheduler.
     *
     * Returns symbols ordered by urgency class:
     *   Class A: Ready symbols with qualifying puts AND stale chain (> target)
     *   Class B: Ready symbols without qualifying puts AND past max age, OR prior-epoch non-qualifying
     *   Class C: Lifecycle work (pending, partial, current-epoch retriable failed)
     *   Class D: Absent symbols from prior epoch
     *
     * Prior-epoch failed symbols receive one recovery probe per new session.
     * If the probe succeeds, normal lifecycle restores them. If it fails,
     * session_date is updated to today, suppressing further probes this session.
     */
    public List<PrioritizedWorkItem> getPrioritizedWorkQueue(SchedulerConfig config) throws SQLException {
        return getPrioritizedWorkQueue(config, currentSessionDate());
    }

    public List<PrioritizedWorkItem> getPrioritizedWorkQueue(SchedulerConfig config, String sessionDate) throws SQLException {
        long now = System.currentTimeMillis();
        List<PrioritizedWorkItem> results = new ArrayList<>();

        // Get all ready symbols with their evidence timestamps
        try (PreparedStatement ps = conn.prepareStatement("""
                SELECT sr.symbol, sr.session_date, sr.primary_expiration,
                  (SELECT retrieved_at FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_retrieved_at,
                  (SELECT retrieved_at FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'expirations' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as exp_retrieved_at,
                  (SELECT data FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_data,
                  (SELECT expiration FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_expiration
                FROM symbol_resolution sr
                WHERE sr.resolution = 'ready'
            """)) {
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String symbol = rs.getString("symbol");
                    String symSessionDate = rs.getString("session_date");
                    String chainRetrievedAt = rs.getString("chain_retrieved_at");
                    String expRetrievedAt = rs.getString("exp_retrieved_at");
                    String chainData = rs.getString("chain_data");
                    String chainExpiration = rs.getString("chain_expiration");

                    boolean isPriorEpoch = symSessionDate == null || !symSessionDate.equals(sessionDate);
                    long chainAge = chainRetrievedAt != null
                        ? now - java.time.Instant.parse(chainRetrievedAt).toEpochMilli()
                        : Long.MAX_VALUE;
                    long expAge = expRetrievedAt != null
                        ? now - java.time.Instant.parse(expRetrievedAt).toEpochMilli()
                        : Long.MAX_VALUE;

                    // Skip fresh current-epoch symbols
                    if (!isPriorEpoch && chainAge < config.chainFreshnessTargetMs()) {
                        continue;
                    }

                    boolean isPlausiblyVisible = classifyFromChain(chainData, chainExpiration);
                    boolean needsExpirations = expAge > config.expirationFreshnessMs();

                    if (isPlausiblyVisible) {
                        results.add(new PrioritizedWorkItem(symbol, "A", chainAge, needsExpirations, isPriorEpoch));
                    } else if (chainAge >= config.chainMaxAgeMs() || isPriorEpoch) {
                        results.add(new PrioritizedWorkItem(symbol, "B", chainAge, needsExpirations, isPriorEpoch));
                    }
                    // Otherwise: background but within max age — skip
                }
            }
        }

        // Add absent symbols from prior epoch (Class D)
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT symbol FROM symbol_resolution WHERE resolution = 'absent' AND (session_date IS NULL OR session_date != ?)")) {
            ps.setString(1, sessionDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(new PrioritizedWorkItem(rs.getString("symbol"), "D", Long.MAX_VALUE, true, true));
                }
            }
        }

        // Add lifecycle work (Class C): pending, partial, current-epoch retriable failed,
        // AND prior-epoch failed symbols eligible for one recovery probe per new session.
        try (PreparedStatement ps = conn.prepareStatement("""
                SELECT sr.symbol FROM symbol_resolution sr
                WHERE sr.resolution IN ('pending', 'partial')
                   OR (sr.resolution = 'failed' AND sr.session_date = ? AND (
                     SELECT failure_count FROM evidence e
                     WHERE e.symbol = sr.symbol
                     ORDER BY e.last_attempt_at DESC LIMIT 1
                   ) < 3)
                   OR (sr.resolution = 'failed' AND (sr.session_date IS NULL OR sr.session_date != ?))
            """)) {
            ps.setString(1, sessionDate);
            ps.setString(2, sessionDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(new PrioritizedWorkItem(rs.getString("symbol"), "C", Long.MAX_VALUE, true, false));
                }
            }
        }

        // Sort by urgency
        results.sort((a, b) -> {
            boolean aIsA = "A".equals(a.urgencyClass());
            boolean bIsA = "A".equals(b.urgencyClass());
            if (aIsA && !bIsA) return -1;
            if (!aIsA && bIsA) return 1;

            boolean aIsBPastMax = "B".equals(a.urgencyClass()) && a.chainAgeMs() >= config.chainMaxAgeMs();
            boolean bIsBPastMax = "B".equals(b.urgencyClass()) && b.chainAgeMs() >= config.chainMaxAgeMs();
            if (aIsBPastMax && !bIsBPastMax && !bIsA) return -1;
            if (bIsBPastMax && !aIsBPastMax && !aIsA) return 1;

            if (a.urgencyClass().equals(b.urgencyClass())) {
                return Long.compare(b.chainAgeMs(), a.chainAgeMs()); // oldest first
            }

            int classOrder = classOrder(a.urgencyClass()) - classOrder(b.urgencyClass());
            return classOrder;
        });

        return results;
    }

    /**
     * Get the total classified population by urgency class.
     * Unlike getPrioritizedWorkQueue (which returns only actionable work),
     * this counts ALL symbols that belong to a service class regardless of freshness.
     */
    public ClassifiedPopulation getClassifiedPopulation() throws SQLException {
        return getClassifiedPopulation(currentSessionDate());
    }

    public ClassifiedPopulation getClassifiedPopulation(String sessionDate) throws SQLException {
        int classA = 0, classB = 0, classC = 0, classD = 0;

        // Count ready symbols by A/B classification
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("""
                SELECT
                  (SELECT data FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_data,
                  (SELECT expiration FROM evidence e WHERE e.symbol = sr.symbol AND e.evidence_type = 'chain' AND e.data IS NOT NULL ORDER BY e.retrieved_at DESC LIMIT 1) as chain_expiration
                FROM symbol_resolution sr
                WHERE sr.resolution = 'ready'
             """)) {
            while (rs.next()) {
                if (classifyFromChain(rs.getString("chain_data"), rs.getString("chain_expiration"))) {
                    classA++;
                } else {
                    classB++;
                }
            }
        }

        // Absent prior-epoch (Class D)
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT COUNT(*) FROM symbol_resolution WHERE resolution = 'absent' AND (session_date IS NULL OR session_date != ?)")) {
            ps.setString(1, sessionDate);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) classD = rs.getInt(1);
            }
        }

        // Lifecycle (Class C): pending, partial, current-epoch retriable failed, prior-epoch failed
        try (PreparedStatement ps = conn.prepareStatement("""
                SELECT COUNT(*) FROM symbol_resolution sr
                WHERE sr.resolution IN ('pending', 'partial')
                   OR (sr.resolution = 'failed' AND sr.session_date = ? AND (
                     SELECT failure_count FROM evidence e
                     WHERE e.symbol = sr.symbol
                     ORDER BY e.last_attempt_at DESC LIMIT 1
                   ) < 3)
                   OR (sr.resolution = 'failed' AND (sr.session_date IS NULL OR sr.session_date != ?))
            """)) {
            ps.setString(1, sessionDate);
            ps.setString(2, sessionDate);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) classC = rs.getInt(1);
            }
        }

        return new ClassifiedPopulation(classA, classB, classC, classD);
    }

    /**
     * Classify a symbol as plausibly visible from its persisted chain data.
     *
     * A symbol is plausibly visible if it has at least one put contract where
     * ALL of the following hold on the SAME contract:
     *   - Chain DTE in [7, 45]
     *   - |delta| in [0.15, 0.50]
     *   - bid > 0
     *   - openInterest > 0
     *
     * Each contract is evaluated atomically — qualifying attributes distributed
     * across different contracts do NOT produce a Class A classification.
     */
    public boolean classifyFromChain(String chainDataJson, String chainExpiration) {
        if (chainDataJson == null || chainExpiration == null) return false;

        // Check DTE from the expiration date
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate expDate = java.time.LocalDate.parse(chainExpiration);
            long dte = java.time.temporal.ChronoUnit.DAYS.between(today, expDate);
            if (dte < 7 || dte > 45) return false;
        } catch (Exception e) {
            return false;
        }

        // Extract each put contract object and evaluate atomically
        List<String> putObjects = extractPutContractObjects(chainDataJson);
        for (String contractJson : putObjects) {
            if (isQualifyingPut(contractJson)) return true;
        }

        return false;
    }

    /**
     * Extract individual put contract JSON objects from the chain data.
     * Returns the raw JSON string of each object within the "puts" array.
     */
    private List<String> extractPutContractObjects(String chainJson) {
        List<String> objects = new ArrayList<>();
        int putsIdx = chainJson.indexOf("\"puts\"");
        if (putsIdx < 0) return objects;
        int arrayStart = chainJson.indexOf('[', putsIdx);
        if (arrayStart < 0) return objects;

        // Walk the array, tracking brace depth to extract top-level objects
        int depth = 0;
        int objStart = -1;
        for (int i = arrayStart; i < chainJson.length(); i++) {
            char c = chainJson.charAt(i);
            if (c == '[' && depth == 0) { depth++; continue; }
            if (c == '{') {
                if (depth == 1) objStart = i;
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 1 && objStart >= 0) {
                    objects.add(chainJson.substring(objStart, i + 1));
                    objStart = -1;
                }
            } else if (c == ']' && depth == 1) {
                break;
            }
        }
        return objects;
    }

    /**
     * Evaluate a single put contract for qualification.
     * ALL criteria must be met on THIS contract (atomic evaluation):
     *   bid > 0 AND |delta| in [0.15, 0.50] AND openInterest > 0
     */
    private boolean isQualifyingPut(String contractJson) {
        // Parse all fields from this contract object
        double bid = extractFieldValue(contractJson, "bid");
        if (bid <= 0) return false;

        double delta = extractFieldValue(contractJson, "delta");
        double absDelta = Math.abs(delta);
        if (absDelta < 0.15 || absDelta > 0.50) return false;

        double oi = extractFieldValue(contractJson, "openInterest");
        if (oi <= 0) return false;

        return true;
    }

    /**
     * Extract a numeric field value from a flat JSON object string.
     * Handles: positive/negative integers and decimals, null values.
     * Only searches for top-level keys (no nested object traversal).
     *
     * The contract JSON is always flat: {"strike":55,"bid":1.50,"delta":-0.28,...}
     */
    private double extractFieldValue(String json, String key) {
        // Search for "key": pattern — must be preceded by { or , (top-level)
        String pattern = "\"" + key + "\":";
        int idx = json.indexOf(pattern);
        if (idx < 0) return 0;

        int start = idx + pattern.length();
        // Skip whitespace
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '\t')) start++;
        if (start >= json.length()) return 0;
        // Handle null
        if (json.charAt(start) == 'n') return 0;

        // Parse number (may start with -)
        int end = start;
        if (end < json.length() && json.charAt(end) == '-') end++;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.')) end++;
        if (end == start) return 0;

        try {
            return Double.parseDouble(json.substring(start, end));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static int classOrder(String urgencyClass) {
        return switch (urgencyClass) {
            case "A" -> 0;
            case "B" -> 1;
            case "C" -> 2;
            case "D" -> 3;
            default -> 4;
        };
    }

    // --- Records ---

    public record PrioritizedWorkItem(String symbol, String urgencyClass, long chainAgeMs, boolean needsExpirations, boolean isPriorEpoch) {}
    public record ClassifiedPopulation(int classA, int classB, int classC, int classD) {}

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

    /**
     * Check whether a usable (successful, non-null data) chain evidence row exists
     * for the given symbol and expiration. Used to determine whether an expirations
     * refresh should preserve ready resolution or regress to partial.
     *
     * A chain is "usable" when:
     * - A row exists for (symbol, 'chain', expiration)
     * - The row has non-null data
     * - The last attempt_result is 'success' (not 'failure')
     */
    private boolean hasUsableChain(String symbol, String expiration) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT 1 FROM evidence WHERE symbol = ? AND evidence_type = 'chain' AND expiration = ? AND data IS NOT NULL AND attempt_result = 'success'")) {
            ps.setString(1, symbol);
            ps.setString(2, expiration);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
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
    public static String sessionDateFor(Instant instant) {
        return instant.toString().split("T")[0];
    }

    private String currentSessionDate() {
        if (sessionDateOverride != null) return sessionDateOverride;
        return sessionDateFor(Instant.now());
    }

    /**
     * Override the session date for testing. Pass null to restore default behavior.
     *
     * Test seam: allows deterministic epoch control in tests that verify
     * multi-session lifecycle behavior (e.g., recovery probes, prior-epoch
     * classification). Not intended for production use.
     */
    public void setSessionDateOverride(String sessionDate) {
        this.sessionDateOverride = sessionDate;
    }

    /**
     * Get all eligible expirations within the observation window (7-45 DTE).
     * Returns expiration date strings sorted by DTE ascending.
     * Used by multi-expiration acquisition to identify secondary chains to acquire.
     */
    public static List<String> getEligibleExpirations(String expirationsJson) {
        if (expirationsJson == null || expirationsJson.equals("[]")) return List.of();

        record Exp(String date, int dte) {}
        List<Exp> expirations = new ArrayList<>();

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

        final int MIN_DTE = 7;
        final int MAX_DTE = 45;

        return expirations.stream()
            .filter(e -> e.dte >= MIN_DTE && e.dte <= MAX_DTE)
            .sorted(Comparator.comparingInt(Exp::dte))
            .map(Exp::date)
            .toList();
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

    // --- Opening-Relevant Evidence Experiment support ---

    /**
     * Get symbols whose expirations are stale (older than the given threshold).
     * Used during EXPIRATIONS_ONLY posture to pre-refresh reference data.
     *
     * Returns symbols that are 'ready' or 'absent' with expiration evidence
     * older than freshnessThresholdMs, ordered by age (oldest first).
     */
    public List<String> getSymbolsNeedingExpirationRefresh(long freshnessThresholdMs) throws SQLException {
        long now = System.currentTimeMillis();
        List<Map.Entry<String, Long>> results = new ArrayList<>();

        try (PreparedStatement ps = conn.prepareStatement("""
                SELECT sr.symbol,
                  (SELECT retrieved_at FROM evidence e
                   WHERE e.symbol = sr.symbol AND e.evidence_type = 'expirations' AND e.data IS NOT NULL
                   ORDER BY e.retrieved_at DESC LIMIT 1) as exp_retrieved_at
                FROM symbol_resolution sr
                WHERE sr.resolution IN ('ready', 'absent', 'partial')
            """)) {
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String symbol = rs.getString("symbol");
                    String expRetrievedAt = rs.getString("exp_retrieved_at");

                    long expAge = expRetrievedAt != null
                        ? now - Instant.parse(expRetrievedAt).toEpochMilli()
                        : Long.MAX_VALUE;

                    if (expAge > freshnessThresholdMs) {
                        results.add(Map.entry(symbol, expAge));
                    }
                }
            }
        }

        // Sort by age descending (oldest/most stale first)
        results.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));
        return results.stream().map(Map.Entry::getKey).collect(Collectors.toList());
    }

    /**
     * Count how many symbols in the given set have current-session chain evidence.
     * "Current session" means the chain's session_date matches the given sessionDate.
     *
     * Used for opening-set hydration tracking.
     */
    public int countCurrentSessionChains(Set<String> symbols, String sessionDate) throws SQLException {
        if (symbols.isEmpty()) return 0;

        int count = 0;
        // Use individual lookups to avoid large IN clauses
        try (PreparedStatement ps = conn.prepareStatement("""
                SELECT COUNT(*) FROM evidence e
                WHERE e.symbol = ? AND e.evidence_type = 'chain'
                  AND e.data IS NOT NULL AND e.session_date = ?
            """)) {
            for (String symbol : symbols) {
                ps.setString(1, symbol);
                ps.setString(2, sessionDate);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        count++;
                    }
                }
            }
        }
        return count;
    }
}
