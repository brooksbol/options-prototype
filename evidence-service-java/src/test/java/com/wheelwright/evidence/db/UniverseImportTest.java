package com.wheelwright.evidence.db;

import org.junit.jupiter.api.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Universe Import Tests — mirrors TypeScript universe-import.test.ts.
 *
 * Proves:
 * 1. Import creates symbols and resolution rows
 * 2. Existing evidence survives import
 * 3. Existing timestamps survive import
 * 4. Existing snapshot generation remains valid
 * 5. New symbols begin pending
 * 6. Duplicate import is idempotent
 * 7. Restart after import preserves state
 * 8. Acquisition targets only pending symbols after import
 * 9. Source membership tracked correctly
 * 10. Disabled seed path produces fallback or empty behavior
 */
class UniverseImportTest {

    private static final Path TEMP_DIR = Path.of("./build/test-import");
    private static final Path TEMP_CSV = TEMP_DIR.resolve("test-universe.csv");
    private static final String TEMP_DB = TEMP_DIR.resolve("test.sqlite3").toString();

    @BeforeEach
    void setup() throws IOException {
        Files.createDirectories(TEMP_DIR);
    }

    @AfterEach
    void cleanup() throws IOException {
        if (Files.exists(TEMP_CSV)) Files.delete(TEMP_CSV);
        Path dbFile = Path.of(TEMP_DB);
        if (Files.exists(dbFile)) Files.delete(dbFile);
        // Also clean WAL/SHM files
        Path wal = Path.of(TEMP_DB + "-wal");
        Path shm = Path.of(TEMP_DB + "-shm");
        if (Files.exists(wal)) Files.delete(wal);
        if (Files.exists(shm)) Files.delete(shm);
    }

    private void writeCsv(String... symbols) throws IOException {
        StringBuilder sb = new StringBuilder("ticker\n");
        for (String s : symbols) sb.append(s).append("\n");
        Files.writeString(TEMP_CSV, sb.toString());
    }

    private Connection openMemoryDb() throws SQLException {
        return DatabaseManager.open(":memory:");
    }

    @Test
    @DisplayName("creates symbols and resolution rows for new symbols")
    void createsSymbolsAndResolutions() throws Exception {
        writeCsv("XLE", "XLF", "SPY");
        Connection conn = openMemoryDb();

        var result = UniverseImport.importFromCsv(conn, TEMP_CSV, "test_source", "Test Source");

        assertEquals(3, result.totalInFile());
        assertEquals(3, result.newSymbolsAdded());
        assertEquals(0, result.existingPreserved());

        // Verify rows exist
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT symbol FROM symbols ORDER BY symbol")) {
            List<String> symbols = new java.util.ArrayList<>();
            while (rs.next()) symbols.add(rs.getString("symbol"));
            assertEquals(List.of("SPY", "XLE", "XLF"), symbols);
        }

        // Verify resolutions are pending
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT resolution FROM symbol_resolution")) {
            while (rs.next()) {
                assertEquals("pending", rs.getString("resolution"));
            }
        }

        conn.close();
    }

    @Test
    @DisplayName("existing evidence survives import")
    void existingEvidenceSurvives() throws Exception {
        SqliteEvidenceStore store = new SqliteEvidenceStore(TEMP_DB);
        store.initUniverse(List.of("XLE", "XLF"));
        store.setExpirations("XLE", "[{\"date\":\"2026-08-03\",\"dte\":21}]", "2026-07-15T14:00:00Z");
        store.setChain("XLE", "{\"puts\":[{\"strike\":55}],\"calls\":[]}", "2026-07-15T14:01:00Z");
        store.publishSnapshot();

        writeCsv("XLE", "XLF", "SPY", "QQQ", "IWM");

        // Get the underlying connection for import
        Connection conn = store.getConnection();
        var result = UniverseImport.importFromCsv(conn, TEMP_CSV, "expanded", "Expanded");

        assertEquals(2, result.existingPreserved()); // XLE, XLF
        assertEquals(3, result.newSymbolsAdded()); // SPY, QQQ, IWM

        // XLE evidence must be intact
        var xle = store.getEvidence("XLE");
        assertNotNull(xle);
        assertEquals("ready", xle.get("status"));
        assertNotNull(xle.get("chain"));

        store.close();
    }

    @Test
    @DisplayName("existing timestamps survive import")
    void existingTimestampsSurvive() throws Exception {
        SqliteEvidenceStore store = new SqliteEvidenceStore(TEMP_DB);
        store.initUniverse(List.of("XLE"));
        store.setExpirations("XLE", "[{\"date\":\"2026-08-03\",\"dte\":21}]", "2026-07-15T14:00:00Z");

        writeCsv("XLE", "SPY");

        Connection conn = store.getConnection();
        UniverseImport.importFromCsv(conn, TEMP_CSV, "ts_test", "Timestamp Test");

        var xle = store.getEvidence("XLE");
        assertEquals("2026-07-15T14:00:00Z", xle.get("retrievedAt"));

        store.close();
    }

    @Test
    @DisplayName("existing snapshot generation remains valid after import")
    void generationPreserved() throws Exception {
        SqliteEvidenceStore store = new SqliteEvidenceStore(TEMP_DB);
        store.initUniverse(List.of("XLE"));
        store.setExpirations("XLE", "[{\"date\":\"2026-08-03\",\"dte\":21}]", "2026-07-15T14:00:00Z");
        store.publishSnapshot();
        int genBefore = store.getGeneration();

        writeCsv("XLE", "SPY", "QQQ");
        Connection conn = store.getConnection();
        UniverseImport.importFromCsv(conn, TEMP_CSV, "gen_test", "Gen Test");

        // Generation should NOT change from an import
        assertEquals(genBefore, store.getGeneration());

        store.close();
    }

    @Test
    @DisplayName("new symbols begin pending")
    void newSymbolsPending() throws Exception {
        SqliteEvidenceStore store = new SqliteEvidenceStore(TEMP_DB);
        store.initUniverse(List.of("XLE"));
        store.setExpirations("XLE", "[{\"date\":\"2026-08-03\",\"dte\":21}]", "2026-07-15T14:00:00Z");
        store.setChain("XLE", "{\"puts\":[],\"calls\":[]}", "2026-07-15T14:01:00Z");

        writeCsv("XLE", "SPY", "QQQ");
        Connection conn = store.getConnection();
        UniverseImport.importFromCsv(conn, TEMP_CSV, "pending_test", "Pending Test");

        // Re-init so store sees new symbols
        store.initUniverse(List.of("XLE", "SPY", "QQQ"));

        var spy = store.getEvidence("SPY");
        assertEquals("pending", spy.get("status"));
        assertNull(spy.get("chain"));

        var qqq = store.getEvidence("QQQ");
        assertEquals("pending", qqq.get("status"));

        store.close();
    }

    @Test
    @DisplayName("duplicate import is idempotent")
    void duplicateIdempotent() throws Exception {
        writeCsv("XLE", "XLF", "SPY");
        Connection conn = openMemoryDb();

        var result1 = UniverseImport.importFromCsv(conn, TEMP_CSV, "idem", "Idempotent");
        var result2 = UniverseImport.importFromCsv(conn, TEMP_CSV, "idem", "Idempotent");

        assertEquals(3, result1.newSymbolsAdded());
        assertEquals(0, result2.newSymbolsAdded());
        assertEquals(3, result2.existingPreserved());

        // No duplicate rows
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM symbols")) {
            rs.next();
            assertEquals(3, rs.getInt(1));
        }

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM symbol_membership")) {
            rs.next();
            assertEquals(3, rs.getInt(1)); // not 6
        }

        conn.close();
    }

    @Test
    @DisplayName("restart after import preserves state")
    void restartPreserves() throws Exception {
        // Store 1: import and acquire some evidence
        SqliteEvidenceStore store1 = new SqliteEvidenceStore(TEMP_DB);
        store1.initUniverse(List.of("XLE"));
        store1.setExpirations("XLE", "[{\"date\":\"2026-08-03\",\"dte\":21}]", "2026-07-15T14:00:00Z");
        store1.setChain("XLE", "{\"puts\":[{\"strike\":55}],\"calls\":[]}", "2026-07-15T14:01:00Z");

        writeCsv("XLE", "SPY", "QQQ");
        UniverseImport.importFromCsv(store1.getConnection(), TEMP_CSV, "restart", "Restart Test");
        store1.publishSnapshot();
        store1.close();

        // Store 2: reopen — everything should persist
        SqliteEvidenceStore store2 = new SqliteEvidenceStore(TEMP_DB);
        var xle = store2.getEvidence("XLE");
        assertEquals("ready", xle.get("status"));
        assertNotNull(xle.get("chain"));

        var spy = store2.getEvidence("SPY");
        assertEquals("pending", spy.get("status"));

        try (Statement stmt = store2.getConnection().createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM symbols")) {
            rs.next();
            assertEquals(3, rs.getInt(1));
        }

        store2.close();
    }

    @Test
    @DisplayName("acquisition targets only pending symbols after import")
    void acquisitionTargetsPending() throws Exception {
        SqliteEvidenceStore store = new SqliteEvidenceStore(TEMP_DB);
        store.initUniverse(List.of("XLE"));
        store.setExpirations("XLE", "[{\"date\":\"2026-08-03\",\"dte\":21}]", "2026-07-15T14:00:00Z");
        store.setChain("XLE", "{\"puts\":[],\"calls\":[]}", "2026-07-15T14:01:00Z");

        writeCsv("XLE", "SPY", "QQQ");
        UniverseImport.importFromCsv(store.getConnection(), TEMP_CSV, "queue", "Queue Test");
        store.initUniverse(List.of("XLE", "SPY", "QQQ"));

        List<String> queue = store.getWorkQueue();
        assertTrue(queue.contains("SPY"));
        assertTrue(queue.contains("QQQ"));
        assertFalse(queue.contains("XLE")); // already ready

        store.close();
    }

    @Test
    @DisplayName("source membership tracked correctly")
    void sourceMembership() throws Exception {
        Connection conn = openMemoryDb();

        // First source: 3 symbols
        writeCsv("XLE", "XLF", "SPY");
        UniverseImport.importFromCsv(conn, TEMP_CSV, "source_a", "Source A");

        // Second source: overlapping + new
        writeCsv("XLE", "QQQ", "IWM");
        UniverseImport.importFromCsv(conn, TEMP_CSV, "source_b", "Source B");

        // XLE belongs to both
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT source_id FROM symbol_membership WHERE symbol = 'XLE' ORDER BY source_id")) {
            try (ResultSet rs = ps.executeQuery()) {
                List<String> sources = new java.util.ArrayList<>();
                while (rs.next()) sources.add(rs.getString("source_id"));
                assertEquals(List.of("source_a", "source_b"), sources);
            }
        }

        // QQQ belongs only to source_b
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT source_id FROM symbol_membership WHERE symbol = 'QQQ'")) {
            try (ResultSet rs = ps.executeQuery()) {
                List<String> sources = new java.util.ArrayList<>();
                while (rs.next()) sources.add(rs.getString("source_id"));
                assertEquals(List.of("source_b"), sources);
            }
        }

        // Can recover original source_a population
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT symbol FROM symbol_membership WHERE source_id = 'source_a' ORDER BY symbol")) {
            try (ResultSet rs = ps.executeQuery()) {
                List<String> symbols = new java.util.ArrayList<>();
                while (rs.next()) symbols.add(rs.getString("symbol"));
                assertEquals(List.of("SPY", "XLE", "XLF"), symbols);
            }
        }

        conn.close();
    }

    @Test
    @DisplayName("disabled seed path (empty) skips import and uses fallback")
    void disabledSeedUseFallback() throws Exception {
        Connection conn = openMemoryDb();

        // With no seed and empty DB, loadUniverse with null seed should produce fallback
        List<String> symbols = UniverseLoader.loadUniverse(conn, "");
        assertEquals(10, symbols.size()); // fallback universe size
        assertTrue(symbols.contains("XLE"));
        assertTrue(symbols.contains("SPY"));

        conn.close();
    }

    @Test
    @DisplayName("missing seed file with existing symbols returns DB symbols")
    void missingSeedWithExistingSymbols() throws Exception {
        SqliteEvidenceStore store = new SqliteEvidenceStore(TEMP_DB);
        store.initUniverse(List.of("XLE", "XLF", "SPY"));
        Connection conn = store.getConnection();

        // Load with a non-existent seed path — should just return what's in DB
        List<String> symbols = UniverseLoader.loadUniverse(conn, "/nonexistent/path.csv");
        assertEquals(3, symbols.size());
        assertTrue(symbols.contains("XLE"));

        store.close();
    }
}
