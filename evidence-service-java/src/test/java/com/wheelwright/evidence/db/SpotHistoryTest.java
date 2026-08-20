package com.wheelwright.evidence.db;

import org.junit.jupiter.api.*;

import java.sql.*;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Spot History — proves temporal observation accumulation.
 *
 * Invariants:
 * 1. Each successful setChain() appends one spot_history row.
 * 2. Multiple acquisitions produce multiple rows (append-only, never overwritten).
 * 3. The persisted price matches the underlying.price from the chain JSON.
 * 4. The persisted observed_at matches the retrievedAt timestamp.
 * 5. Rows accumulate across multiple symbols independently.
 * 6. A chain with no extractable price does NOT produce a history row.
 */
class SpotHistoryTest {

    private static final String CHAIN_TEMPLATE = """
        {"symbol":"%s","expiration":"2026-08-22","underlying":{"symbol":"%s","name":"Test","price":%s},"puts":[],"calls":[]}""";

    private static final String EXPIRATIONS_JSON = """
        [{"date":"2026-08-22","dte":14}]""";

    private SqliteEvidenceStore store;

    @BeforeEach
    void setUp() throws Exception {
        store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("XLE", "EWY", "BNO"));
        // Advance all symbols to ready state with expirations
        store.setExpirations("XLE", EXPIRATIONS_JSON, "2026-08-19T09:30:00Z");
        store.setExpirations("EWY", EXPIRATIONS_JSON, "2026-08-19T09:30:00Z");
        store.setExpirations("BNO", EXPIRATIONS_JSON, "2026-08-19T09:30:00Z");
    }

    @AfterEach
    void tearDown() throws Exception {
        store.close();
    }

    @Test
    @DisplayName("setChain appends one spot_history row with correct price and timestamp")
    void singleAcquisitionAppendsOneRow() throws Exception {
        String chain = CHAIN_TEMPLATE.formatted("XLE", "XLE", "59.50");
        store.setChain("XLE", chain, "2026-08-19T14:00:00Z");

        List<SpotRow> history = queryHistory("XLE");
        assertEquals(1, history.size());
        assertEquals(59.50, history.get(0).price, 0.001);
        assertEquals("2026-08-19T14:00:00Z", history.get(0).observedAt);
    }

    @Test
    @DisplayName("multiple acquisitions accumulate rows (append-only)")
    void multipleAcquisitionsAccumulate() throws Exception {
        store.setChain("XLE", CHAIN_TEMPLATE.formatted("XLE", "XLE", "59.50"), "2026-08-19T14:00:00Z");
        store.setChain("XLE", CHAIN_TEMPLATE.formatted("XLE", "XLE", "59.80"), "2026-08-19T14:15:00Z");
        store.setChain("XLE", CHAIN_TEMPLATE.formatted("XLE", "XLE", "60.10"), "2026-08-19T14:30:00Z");

        List<SpotRow> history = queryHistory("XLE");
        assertEquals(3, history.size());
        assertEquals(59.50, history.get(0).price, 0.001);
        assertEquals(59.80, history.get(1).price, 0.001);
        assertEquals(60.10, history.get(2).price, 0.001);
    }

    @Test
    @DisplayName("different symbols accumulate independently")
    void independentSymbolAccumulation() throws Exception {
        store.setChain("XLE", CHAIN_TEMPLATE.formatted("XLE", "XLE", "59.50"), "2026-08-19T14:00:00Z");
        store.setChain("EWY", CHAIN_TEMPLATE.formatted("EWY", "EWY", "183.00"), "2026-08-19T14:00:00Z");
        store.setChain("XLE", CHAIN_TEMPLATE.formatted("XLE", "XLE", "59.80"), "2026-08-19T14:15:00Z");
        store.setChain("BNO", CHAIN_TEMPLATE.formatted("BNO", "BNO", "55.00"), "2026-08-19T14:15:00Z");

        assertEquals(2, queryHistory("XLE").size());
        assertEquals(1, queryHistory("EWY").size());
        assertEquals(1, queryHistory("BNO").size());
    }

    @Test
    @DisplayName("chain without extractable price does not produce history row")
    void noPriceNoHistoryRow() throws Exception {
        // Chain JSON without an "underlying" object
        String chainNoPrice = """
            {"symbol":"XLE","expiration":"2026-08-22","puts":[],"calls":[]}""";
        store.setChain("XLE", chainNoPrice, "2026-08-19T14:00:00Z");

        List<SpotRow> history = queryHistory("XLE");
        assertEquals(0, history.size());
    }

    @Test
    @DisplayName("spot_history survives alongside normal evidence UPSERT")
    void historyCoexistsWithEvidenceOverwrite() throws Exception {
        // First acquisition
        store.setChain("XLE", CHAIN_TEMPLATE.formatted("XLE", "XLE", "59.50"), "2026-08-19T14:00:00Z");
        // Second acquisition overwrites evidence but APPENDS history
        store.setChain("XLE", CHAIN_TEMPLATE.formatted("XLE", "XLE", "60.00"), "2026-08-19T14:15:00Z");

        // Evidence shows only latest
        var obs = store.getQuoteObservations(List.of("XLE"));
        assertEquals(1, obs.size());
        assertEquals(60.00, (Double) obs.get(0).get("price"), 0.001);

        // History has both
        List<SpotRow> history = queryHistory("XLE");
        assertEquals(2, history.size());
    }

    // --- Helper ---

    private List<SpotRow> queryHistory(String symbol) throws SQLException {
        try (PreparedStatement ps = store.getConnection().prepareStatement(
                "SELECT price, observed_at FROM spot_history WHERE symbol = ? ORDER BY observed_at ASC")) {
            ps.setString(1, symbol);
            try (ResultSet rs = ps.executeQuery()) {
                List<SpotRow> rows = new java.util.ArrayList<>();
                while (rs.next()) {
                    rows.add(new SpotRow(rs.getDouble("price"), rs.getString("observed_at")));
                }
                return rows;
            }
        }
    }

    record SpotRow(double price, String observedAt) {}
}
