package com.wheelwright.evidence;

import java.sql.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Multi-Expiration Observation Surface Analysis
 *
 * EXPERIMENTAL SPIKE — reads the SQLite evidence database after a multi-expiration
 * acquisition session and produces a per-expiration opportunity surface.
 *
 * For each weekly-capable symbol, outputs one best-within-expiration candidate row
 * per observed expiration using existing contract-selection semantics (delta proximity).
 *
 * Does NOT rank across expirations. Does NOT declare a "winner."
 * Preserves expiration identity for observational analysis.
 *
 * Usage:
 *   ./gradlew run --args="analyze-surface [--csv]"
 *   or: java -cp build/libs/... com.wheelwright.evidence.MultiExpirationSurfaceAnalysis [--csv]
 */
public class MultiExpirationSurfaceAnalysis {

    // --- Configuration (matching existing Wheelwright policy) ---
    private static final double TARGET_DELTA = 0.30;
    private static final double ADMISSIBLE_DELTA_MIN = 0.15;
    private static final double ADMISSIBLE_DELTA_MAX = 0.50;
    private static final int MIN_DTE = 7;
    private static final int MAX_DTE = 45;

    // --- Surface Row ---
    record SurfaceRow(
        String symbol, String expiration, int dte, String strategy,
        double strike, double delta, double bid, double ask, double midpoint,
        double premiumDollars, double premiumPerDay, double annualizedYield,
        double capitalRequired, double executionScore, String posture,
        double spreadPercent, int openInterest, int volume,
        double underlyingPrice, String retrievedAt
    ) {}

    public static void main(String[] args) {
        String dbPath = "data/evidence.sqlite3";
        boolean csvMode = Arrays.asList(args).contains("--csv");

        // Allow explicit db path
        for (String arg : args) {
            if (arg.startsWith("--db=")) {
                dbPath = arg.substring(5);
            }
        }

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath)) {
            conn.setAutoCommit(false);
            runAnalysis(conn, csvMode);
        } catch (SQLException e) {
            System.err.println("Cannot open database at " + dbPath);
            System.err.println("Run the backend with multi-expiration acquisition first.");
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }

    private static void runAnalysis(Connection conn, boolean csvMode) throws SQLException {
        // Find symbols with multiple chain rows
        List<SymbolChainCount> multiChainSymbols = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("""
                 SELECT symbol, COUNT(*) as chain_count
                 FROM evidence
                 WHERE evidence_type = 'chain' AND data IS NOT NULL
                 GROUP BY symbol
                 HAVING COUNT(*) > 1
                 ORDER BY symbol
             """)) {
            while (rs.next()) {
                multiChainSymbols.add(new SymbolChainCount(rs.getString("symbol"), rs.getInt("chain_count")));
            }
        }

        if (multiChainSymbols.isEmpty()) {
            System.err.println("No symbols with multiple chain records found.");
            System.err.println("Run the backend with multi-expiration acquisition during a market session first.");
            System.exit(1);
        }

        int totalChains = multiChainSymbols.stream().mapToInt(SymbolChainCount::count).sum();
        System.err.printf("Found %d symbols with multi-expiration data (%d total chains)%n",
            multiChainSymbols.size(), totalChains);

        // Build expiration DTE map
        Map<String, List<ExpEntry>> expirationMap = loadExpirations(conn);

        // Build surface
        List<SurfaceRow> surface = new ArrayList<>();
        LocalDate today = LocalDate.now();

        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT expiration, data, retrieved_at FROM evidence WHERE symbol = ? AND evidence_type = 'chain' AND data IS NOT NULL ORDER BY expiration")) {

            for (SymbolChainCount sym : multiChainSymbols) {
                ps.setString(1, sym.symbol());
                try (ResultSet rs = ps.executeQuery()) {
                    List<ExpEntry> symbolExps = expirationMap.getOrDefault(sym.symbol(), List.of());

                    while (rs.next()) {
                        String expiration = rs.getString("expiration");
                        String chainJson = rs.getString("data");
                        String retrievedAt = rs.getString("retrieved_at");

                        // Compute DTE
                        int dte = computeDte(expiration, symbolExps, today);
                        if (dte < MIN_DTE || dte > MAX_DTE) continue;

                        // Parse chain
                        double underlyingPrice = extractDouble(chainJson, "price");
                        List<ContractData> puts = extractContracts(chainJson, "puts");
                        List<ContractData> calls = extractContracts(chainJson, "calls");

                        // CSP: best put at this expiration
                        ContractData bestPut = selectBest(puts, "puts");
                        if (bestPut != null) {
                            surface.add(buildRow(sym.symbol(), expiration, dte, "CSP",
                                bestPut, bestPut.strike, underlyingPrice, retrievedAt));
                        }

                        // CC: best call at this expiration
                        ContractData bestCall = selectBest(calls, "calls");
                        if (bestCall != null) {
                            surface.add(buildRow(sym.symbol(), expiration, dte, "CC",
                                bestCall, underlyingPrice, underlyingPrice, retrievedAt));
                        }
                    }
                }
            }
        }

        // Output
        if (csvMode) {
            outputCsv(surface);
        } else {
            outputSummary(surface, multiChainSymbols);
        }
    }

    private static SurfaceRow buildRow(String symbol, String expiration, int dte, String strategy,
                                        ContractData contract, double collateral, double underlyingPrice, String retrievedAt) {
        double mid = (contract.bid + contract.ask) / 2.0;
        double spread = contract.ask - contract.bid;
        double spreadPct = mid > 0 ? (spread / mid) * 100 : 100;
        double capitalReq = collateral * 100;
        double premDollars = mid * 100;
        double premPerDay = dte > 0 ? premDollars / dte : 0;
        double annYield = dte > 0 && collateral > 0 ? (mid / collateral) * (365.0 / dte) * 100 : 0;
        double execScore = executionScore(spreadPct, contract.openInterest, contract.volume);
        String post = posture(execScore, contract.bid, contract.openInterest, spreadPct);

        double absDelta = strategy.equals("CSP") ? Math.abs(contract.delta) : contract.delta;

        return new SurfaceRow(symbol, expiration, dte, strategy,
            contract.strike, absDelta, contract.bid, contract.ask, mid,
            premDollars, premPerDay, annYield, capitalReq, execScore, post,
            spreadPct, contract.openInterest, contract.volume, underlyingPrice, retrievedAt);
    }

    private static ContractData selectBest(List<ContractData> contracts, String side) {
        List<ContractData> admissible = new ArrayList<>();
        for (ContractData c : contracts) {
            double d = side.equals("puts") ? Math.abs(c.delta) : c.delta;
            if (d >= ADMISSIBLE_DELTA_MIN && d <= ADMISSIBLE_DELTA_MAX && c.bid > 0) {
                admissible.add(c);
            }
        }
        if (admissible.isEmpty()) return null;

        // Select nearest to target delta
        admissible.sort((a, b) -> {
            double dA = Math.abs((side.equals("puts") ? Math.abs(a.delta) : a.delta) - TARGET_DELTA);
            double dB = Math.abs((side.equals("puts") ? Math.abs(b.delta) : b.delta) - TARGET_DELTA);
            return Double.compare(dA, dB);
        });

        return admissible.get(0);
    }

    private static double executionScore(double spreadPct, int oi, int volume) {
        double spreadScore = Math.max(0, Math.min(100, 100 - spreadPct * 10));
        double oiScore = Math.min(100, (oi / 500.0) * 100);
        double volScore = Math.min(100, (volume / 200.0) * 100);
        return spreadScore * 0.5 + oiScore * 0.3 + volScore * 0.2;
    }

    private static String posture(double score, double bid, int oi, double spreadPct) {
        if (bid <= 0) return "HARD_NO_ZERO_BID";
        if (oi == 0) return "HARD_NO_ZERO_OI";
        if (spreadPct > 33) return "WIDE_SPREAD";
        if (score >= 55) return "ACTIONABLE";
        if (score >= 35) return "EDGE";
        return "WAIT";
    }

    private static int computeDte(String expiration, List<ExpEntry> symbolExps, LocalDate today) {
        // Always compute DTE from today to ensure current-day accuracy.
        // Do NOT use pre-stored dte values from the expirations list because
        // those were computed relative to the acquisition date, not today.
        try {
            LocalDate expDate = LocalDate.parse(expiration);
            return (int) ChronoUnit.DAYS.between(today, expDate);
        } catch (Exception e) {
            return -1;
        }
    }

    // --- Output ---

    private static void outputCsv(List<SurfaceRow> surface) {
        System.out.println("Symbol,Expiration,DTE,Strategy,Strike,Delta,Bid,Ask,Midpoint,PremiumDollars," +
            "PremiumPerDay,AnnualizedYield,CapitalRequired,ExecutionScore,Posture,SpreadPct,OpenInterest,Volume,UnderlyingPrice,RetrievedAt");
        for (SurfaceRow r : surface) {
            System.out.printf("%s,%s,%d,%s,%.2f,%.3f,%.2f,%.2f,%.3f,%.2f,%.2f,%.1f,%.0f,%.1f,%s,%.1f,%d,%d,%.2f,%s%n",
                r.symbol, r.expiration, r.dte, r.strategy,
                r.strike, r.delta, r.bid, r.ask, r.midpoint,
                r.premiumDollars, r.premiumPerDay, r.annualizedYield,
                r.capitalRequired, r.executionScore, r.posture,
                r.spreadPercent, r.openInterest, r.volume,
                r.underlyingPrice, r.retrievedAt);
        }
    }

    private static void outputSummary(List<SurfaceRow> surface, List<SymbolChainCount> multiChainSymbols) {
        System.out.println("═══ MULTI-EXPIRATION OBSERVATION SURFACE ═══\n");
        System.out.printf("Symbols with multi-expiration data: %d%n", multiChainSymbols.size());
        System.out.printf("Total surface rows: %d%n", surface.size());
        System.out.printf("  CSP rows: %d%n", surface.stream().filter(r -> r.strategy.equals("CSP")).count());
        System.out.printf("  CC rows: %d%n", surface.stream().filter(r -> r.strategy.equals("CC")).count());
        System.out.println();

        // Group by symbol
        Map<String, List<SurfaceRow>> bySymbol = new LinkedHashMap<>();
        for (SurfaceRow r : surface) {
            bySymbol.computeIfAbsent(r.symbol, k -> new ArrayList<>()).add(r);
        }

        // Show representative CSP surfaces (first 10 symbols with >1 CSP row)
        int shown = 0;
        for (var entry : bySymbol.entrySet()) {
            if (shown >= 10) break;
            List<SurfaceRow> cspRows = entry.getValue().stream()
                .filter(r -> r.strategy.equals("CSP"))
                .sorted(Comparator.comparingInt(SurfaceRow::dte))
                .toList();
            if (cspRows.size() < 2) continue;

            System.out.printf("─── %s (%d expirations, underlying $%.2f) ───%n",
                entry.getKey(), cspRows.size(), cspRows.get(0).underlyingPrice);
            System.out.printf("%-5s %-8s %-6s %-7s %-7s %-8s %-7s %-7s %-6s %-12s %-7s %-7s %-6s%n",
                "DTE", "Strike", "Δ", "Bid", "Mid", "$/con", "$/day", "Ann%", "Exec", "Posture", "Sprd%", "OI", "Vol");

            for (SurfaceRow r : cspRows) {
                System.out.printf("%-5d $%-7.0f %-6.2f $%-6.2f $%-6.2f $%-7.0f $%-6.1f %-7.1f %-6.0f %-12s %-7.1f %-7d %-6d%n",
                    r.dte, r.strike, r.delta, r.bid, r.midpoint,
                    r.premiumDollars, r.premiumPerDay, r.annualizedYield,
                    r.executionScore, r.posture, r.spreadPercent,
                    r.openInterest, r.volume);
            }
            System.out.println();
            shown++;
        }

        // Temporal integrity check — measures span across DISTINCT chain retrievals per symbol
        System.out.println("─── TEMPORAL INTEGRITY ───");
        int multiChecked = 0;
        int singleChecked = 0;
        for (var entry : bySymbol.entrySet()) {
            List<SurfaceRow> rows = entry.getValue();
            // Deduplicate by expiration to get distinct chain retrieval timestamps
            Map<String, Long> expToTime = new LinkedHashMap<>();
            for (SurfaceRow r : rows) {
                if (!expToTime.containsKey(r.expiration)) {
                    expToTime.put(r.expiration, parseTimestamp(r.retrievedAt));
                }
            }
            int distinctChains = expToTime.size();
            if (distinctChains >= 2 && multiChecked < 10) {
                long minTime = expToTime.values().stream().mapToLong(Long::longValue).min().orElse(0);
                long maxTime = expToTime.values().stream().mapToLong(Long::longValue).max().orElse(0);
                double spanSec = (maxTime - minTime) / 1000.0;
                String label = spanSec < 60 ? String.format("%.1fs", spanSec)
                    : spanSec < 3600 ? String.format("%.1f min", spanSec / 60)
                    : String.format("%.1f hours", spanSec / 3600);
                System.out.printf("  %s: %d distinct chains, span %s between first and last retrieval%n",
                    entry.getKey(), distinctChains, label);
                multiChecked++;
            } else if (distinctChains < 2) {
                singleChecked++;
            }
        }
        if (singleChecked > 0) {
            System.out.printf("  (%d symbols have only 1 chain in DTE window — no span measurable)%n", singleChecked);
        }
        if (multiChecked == 0) {
            System.out.println("  No symbols have multiple contemporaneous chains yet.");
            System.out.println("  Run the backend during a market session to acquire multi-expiration data.");
        }
    }

    private static long parseTimestamp(String ts) {
        if (ts == null) return 0;
        try {
            return java.time.Instant.parse(ts).toEpochMilli();
        } catch (Exception e) {
            return 0;
        }
    }

    // --- JSON parsing (minimal, matching existing store helpers) ---

    record ExpEntry(String date, int dte) {}
    record SymbolChainCount(String symbol, int count) {}
    record ContractData(double strike, double bid, double ask, double delta, int openInterest, int volume) {}

    private static Map<String, List<ExpEntry>> loadExpirations(Connection conn) throws SQLException {
        Map<String, List<ExpEntry>> map = new HashMap<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                 "SELECT symbol, data FROM evidence WHERE evidence_type = 'expirations' AND data IS NOT NULL")) {
            while (rs.next()) {
                String symbol = rs.getString("symbol");
                String json = rs.getString("data");
                List<ExpEntry> exps = parseExpirations(json);
                if (!exps.isEmpty()) map.put(symbol, exps);
            }
        }
        return map;
    }

    private static List<ExpEntry> parseExpirations(String json) {
        List<ExpEntry> result = new ArrayList<>();
        if (json == null || json.equals("[]")) return result;

        String content = json.trim();
        if (content.startsWith("[")) content = content.substring(1);
        if (content.endsWith("]")) content = content.substring(0, content.length() - 1);

        for (String obj : splitObjects(content)) {
            String date = extractString(obj, "date");
            int dte = extractInt(obj, "dte");
            if (date != null && dte >= 0) result.add(new ExpEntry(date, dte));
        }
        return result;
    }

    private static List<ContractData> extractContracts(String chainJson, String arrayKey) {
        List<ContractData> contracts = new ArrayList<>();
        int keyIdx = chainJson.indexOf("\"" + arrayKey + "\"");
        if (keyIdx < 0) return contracts;
        int arrayStart = chainJson.indexOf('[', keyIdx);
        if (arrayStart < 0) return contracts;

        // Find matching ]
        int depth = 0;
        int arrayEnd = -1;
        for (int i = arrayStart; i < chainJson.length(); i++) {
            char c = chainJson.charAt(i);
            if (c == '[') depth++;
            else if (c == ']') {
                depth--;
                if (depth == 0) { arrayEnd = i; break; }
            }
        }
        if (arrayEnd < 0) return contracts;

        String arrayContent = chainJson.substring(arrayStart + 1, arrayEnd);
        for (String obj : splitObjects(arrayContent)) {
            double strike = extractDoubleField(obj, "strike");
            double bid = extractDoubleField(obj, "bid");
            double ask = extractDoubleField(obj, "ask");
            double delta = extractDoubleField(obj, "delta");
            int oi = extractInt(obj, "openInterest");
            int volume = extractInt(obj, "volume");
            contracts.add(new ContractData(strike, bid, ask, delta, oi, volume));
        }
        return contracts;
    }

    private static double extractDouble(String json, String key) {
        return extractDoubleField(json, key);
    }

    private static double extractDoubleField(String json, String key) {
        String pattern = "\"" + key + "\":";
        int idx = json.indexOf(pattern);
        if (idx < 0) return 0;
        int start = idx + pattern.length();
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '\t')) start++;
        if (start >= json.length()) return 0;
        if (json.charAt(start) == 'n') return 0; // null

        int end = start;
        if (end < json.length() && json.charAt(end) == '-') end++;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.')) end++;
        if (end == start) return 0;
        try { return Double.parseDouble(json.substring(start, end)); }
        catch (NumberFormatException e) { return 0; }
    }

    private static String extractString(String json, String key) {
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

    private static int extractInt(String json, String key) {
        double d = extractDoubleField(json, key);
        return (int) d;
    }

    private static List<String> splitObjects(String content) {
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
}
