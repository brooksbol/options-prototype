package com.wheelwright.evidence.db;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Universe Loader — loads symbols from the database on startup, importing
 * the canonical seed CSV if configured.
 *
 * Behavioral parity with TypeScript universe.ts:
 *   - Respects UNIVERSE_SEED_PATH env var (empty = disable seeding)
 *   - Default seed path: ./data/seeds/yahoo-merged-etf-tickers.csv
 *   - Seed import is idempotent (won't duplicate or reset)
 *   - If no seed and DB is empty, uses a minimal fallback universe
 *   - Returns the active symbol list from the database
 */
public class UniverseLoader {

    private static final String DEFAULT_SEED_PATH = "./data/seeds/yahoo-merged-etf-tickers.csv";
    private static final String DEFAULT_SOURCE_ID = "yahoo_merged_2026_07";
    private static final String DEFAULT_SOURCE_NAME = "Yahoo Merged ETFs";

    private static final List<String> FALLBACK_UNIVERSE = List.of(
        "XLE", "XLF", "XLK", "XLU", "XLP", "QQQ", "SPY", "IWM", "DIA", "GLD"
    );

    /**
     * Load the universe from the database, importing the seed CSV if configured.
     *
     * @param conn open SQLite connection
     * @return list of active symbols
     */
    public static List<String> loadUniverse(Connection conn) throws SQLException {
        return loadUniverse(conn, getDefaultSeedPath());
    }

    /**
     * Load the universe from the database with an explicit seed path.
     *
     * @param conn open SQLite connection
     * @param seedPath path to seed CSV, or null/empty to disable seeding
     * @return list of active symbols
     */
    public static List<String> loadUniverse(Connection conn, String seedPath) throws SQLException {
        // Import seed if configured and file exists
        if (seedPath != null && !seedPath.isEmpty()) {
            Path path = Path.of(seedPath);
            if (Files.exists(path)) {
                try {
                    var result = UniverseImport.importFromCsv(conn, path, DEFAULT_SOURCE_ID, DEFAULT_SOURCE_NAME);
                    if (result.newSymbolsAdded() > 0) {
                        System.out.printf("[universe] Imported %d new symbols from canonical seed (%d total in file, %d preserved)%n",
                            result.newSymbolsAdded(), result.totalInFile(), result.existingPreserved());
                    }
                } catch (IOException e) {
                    System.err.println("[universe] Failed to read seed CSV: " + e.getMessage());
                }
            } else {
                // Seed configured but not found — check if DB has symbols
                if (getSymbolCount(conn) == 0) {
                    System.err.println("[universe] No seed file found and database is empty. Using minimal fallback.");
                    return initFallbackUniverse(conn);
                }
            }
        } else {
            // Seeding explicitly disabled (UNIVERSE_SEED_PATH="")
            if (getSymbolCount(conn) == 0) {
                // Empty DB with seeding disabled — use fallback
                return initFallbackUniverse(conn);
            }
        }

        // Read active symbols from database
        return getActiveSymbols(conn);
    }

    /**
     * Get the default seed CSV path.
     * Respects UNIVERSE_SEED_PATH env var for deployment and test control.
     * Set to empty string to disable automatic seeding.
     */
    public static String getDefaultSeedPath() {
        String envPath = System.getenv("UNIVERSE_SEED_PATH");
        if (envPath != null) return envPath; // empty string = disable seeding
        return DEFAULT_SEED_PATH;
    }

    // --- Private helpers ---

    private static int getSymbolCount(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM symbols WHERE removed_at IS NULL")) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    private static List<String> getActiveSymbols(Connection conn) throws SQLException {
        List<String> symbols = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT symbol FROM symbols WHERE removed_at IS NULL ORDER BY symbol")) {
            while (rs.next()) {
                symbols.add(rs.getString("symbol"));
            }
        }
        System.out.printf("[universe] Loaded %d symbols from database%n", symbols.size());
        return symbols;
    }

    private static List<String> initFallbackUniverse(Connection conn) throws SQLException {
        String now = java.time.Instant.now().toString();
        boolean wasAutoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try (var insertSym = conn.prepareStatement("INSERT OR IGNORE INTO symbols (symbol, added_at) VALUES (?, ?)");
             var insertRes = conn.prepareStatement("INSERT OR IGNORE INTO symbol_resolution (symbol, resolution) VALUES (?, 'pending')")) {
            for (String symbol : FALLBACK_UNIVERSE) {
                insertSym.setString(1, symbol);
                insertSym.setString(2, now);
                insertSym.executeUpdate();
                insertRes.setString(1, symbol);
                insertRes.executeUpdate();
            }
            conn.commit();
        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(wasAutoCommit);
        }
        return new ArrayList<>(FALLBACK_UNIVERSE);
    }
}
