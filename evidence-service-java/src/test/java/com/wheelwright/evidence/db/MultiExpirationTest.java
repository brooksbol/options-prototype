package com.wheelwright.evidence.db;

import org.junit.jupiter.api.*;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Multi-expiration spike tests — verifies that:
 * 1. getEligibleExpirations correctly identifies weekly-capable symbols
 * 2. setChainForExpiration stores chains at explicit expirations without affecting resolution
 * 3. getAllChains retrieves all stored chains for a symbol
 * 4. getEvidence includes chains list when multiple chains exist
 * 5. Normal single-chain behavior is unaffected for monthly-only symbols
 */
class MultiExpirationTest {

    private static final String NOW = "2026-08-21T14:30:00Z";

    // Weekly-capable: 6 eligible expirations within 7-45 DTE
    private static final String WEEKLY_EXPIRATIONS = """
        [{"date":"2026-08-28","dte":7},{"date":"2026-09-04","dte":14},{"date":"2026-09-11","dte":21},{"date":"2026-09-18","dte":28},{"date":"2026-09-25","dte":35},{"date":"2026-10-02","dte":42}]""";

    // Monthly-only: 1 eligible expiration within 7-45 DTE
    private static final String MONTHLY_EXPIRATIONS = """
        [{"date":"2026-09-18","dte":28}]""";

    private static final String CHAIN_TEMPLATE = """
        {"symbol":"%s","expiration":"%s","underlying":{"symbol":"%s","name":"Test","price":100.0},"puts":[{"strike":95,"bid":1.5,"ask":1.7,"delta":-0.28,"openInterest":520,"volume":110}],"calls":[{"strike":105,"bid":1.2,"ask":1.4,"delta":0.32,"openInterest":300,"volume":80}]}""";

    private static String chainFor(String symbol, String expiration) {
        return String.format(CHAIN_TEMPLATE, symbol, expiration, symbol);
    }

    // --- getEligibleExpirations ---

    @Nested
    class EligibleExpirations {

        @Test
        void returnsAllExpirationsWithin7to45Dte() {
            List<String> eligible = SqliteEvidenceStore.getEligibleExpirations(WEEKLY_EXPIRATIONS);
            assertEquals(6, eligible.size());
            assertEquals("2026-08-28", eligible.get(0)); // 7 DTE — ascending
            assertEquals("2026-10-02", eligible.get(5)); // 42 DTE
        }

        @Test
        void returnsOneForMonthlyOnlySymbol() {
            List<String> eligible = SqliteEvidenceStore.getEligibleExpirations(MONTHLY_EXPIRATIONS);
            assertEquals(1, eligible.size());
            assertEquals("2026-09-18", eligible.get(0));
        }

        @Test
        void excludesExpirationsOutsideRange() {
            String json = """
                [{"date":"2026-08-22","dte":1},{"date":"2026-09-11","dte":21},{"date":"2026-11-20","dte":91}]""";
            List<String> eligible = SqliteEvidenceStore.getEligibleExpirations(json);
            assertEquals(1, eligible.size());
            assertEquals("2026-09-11", eligible.get(0));
        }

        @Test
        void returnsEmptyForNullOrEmptyJson() {
            assertEquals(List.of(), SqliteEvidenceStore.getEligibleExpirations(null));
            assertEquals(List.of(), SqliteEvidenceStore.getEligibleExpirations("[]"));
        }
    }

    // --- setChainForExpiration ---

    @Nested
    class SetChainForExpiration {

        @Test
        void storesChainAtExplicitExpirationWithoutAffectingResolution() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("SPY"));
                store.setExpirations("SPY", WEEKLY_EXPIRATIONS, NOW);

                // Primary chain sets resolution to 'ready'
                store.setChain("SPY", chainFor("SPY", "2026-09-11"), NOW);
                Map<String, Object> ev = store.getEvidence("SPY");
                assertEquals("ready", ev.get("status"));
                assertEquals("2026-09-11", ev.get("primaryExpiration"));

                // Secondary chain at different expiration — resolution unchanged
                store.setChainForExpiration("SPY", "2026-08-28", chainFor("SPY", "2026-08-28"), NOW);
                ev = store.getEvidence("SPY");
                assertEquals("ready", ev.get("status"));
                assertEquals("2026-09-11", ev.get("primaryExpiration")); // Unchanged
            }
        }

        @Test
        void multipleSecondaryChainsDontCorruptStorage() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("QQQ"));
                store.setExpirations("QQQ", WEEKLY_EXPIRATIONS, NOW);
                store.setChain("QQQ", chainFor("QQQ", "2026-09-11"), NOW);

                // Store 5 secondary chains
                store.setChainForExpiration("QQQ", "2026-08-28", chainFor("QQQ", "2026-08-28"), NOW);
                store.setChainForExpiration("QQQ", "2026-09-04", chainFor("QQQ", "2026-09-04"), NOW);
                store.setChainForExpiration("QQQ", "2026-09-18", chainFor("QQQ", "2026-09-18"), NOW);
                store.setChainForExpiration("QQQ", "2026-09-25", chainFor("QQQ", "2026-09-25"), NOW);
                store.setChainForExpiration("QQQ", "2026-10-02", chainFor("QQQ", "2026-10-02"), NOW);

                // Verify all 6 chains exist
                List<Map<String, String>> chains = store.getAllChains("QQQ");
                assertEquals(6, chains.size());

                // Primary still resolves correctly
                Map<String, Object> ev = store.getEvidence("QQQ");
                assertEquals("ready", ev.get("status"));
                assertEquals("2026-09-11", ev.get("primaryExpiration"));
                assertNotNull(ev.get("chain")); // Primary chain accessible
            }
        }
    }

    // --- getAllChains ---

    @Nested
    class GetAllChains {

        @Test
        void returnsAllStoredChainsOrderedByExpiration() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("IWM"));
                store.setExpirations("IWM", WEEKLY_EXPIRATIONS, NOW);
                store.setChain("IWM", chainFor("IWM", "2026-09-11"), NOW);
                store.setChainForExpiration("IWM", "2026-08-28", chainFor("IWM", "2026-08-28"), NOW);
                store.setChainForExpiration("IWM", "2026-09-25", chainFor("IWM", "2026-09-25"), NOW);

                List<Map<String, String>> chains = store.getAllChains("IWM");
                assertEquals(3, chains.size());
                assertEquals("2026-08-28", chains.get(0).get("expiration"));
                assertEquals("2026-09-11", chains.get(1).get("expiration"));
                assertEquals("2026-09-25", chains.get(2).get("expiration"));

                // Each chain has data and retrievedAt
                for (Map<String, String> chain : chains) {
                    assertNotNull(chain.get("data"));
                    assertNotNull(chain.get("retrievedAt"));
                }
            }
        }

        @Test
        void returnsEmptyForSymbolWithNoChains() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("XYZ"));
                List<Map<String, String>> chains = store.getAllChains("XYZ");
                assertEquals(0, chains.size());
            }
        }
    }

    // --- getEvidence includes all chains (production multi-expiration surface) ---

    @Nested
    class GetEvidenceWithChains {

        @Test
        void getEvidenceIncludesAllChainsForMultiExpirationSymbol() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("SPY"));
                store.setExpirations("SPY", WEEKLY_EXPIRATIONS, NOW);
                store.setChain("SPY", chainFor("SPY", "2026-09-11"), NOW);
                store.setChainForExpiration("SPY", "2026-08-28", chainFor("SPY", "2026-08-28"), NOW);
                store.setChainForExpiration("SPY", "2026-09-04", chainFor("SPY", "2026-09-04"), NOW);

                Map<String, Object> ev = store.getEvidence("SPY");

                // Primary chain accessible via backward-compatible "chain" field
                assertNotNull(ev.get("chain"));

                // All chains accessible via "chains" field
                @SuppressWarnings("unchecked")
                List<Map<String, String>> chains = (List<Map<String, String>>) ev.get("chains");
                assertNotNull(chains);
                assertEquals(3, chains.size());
            }
        }

        @Test
        void getEvidenceIncludesSingleChainForMonthlyOnlySymbol() throws Exception {
            try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
                store.initUniverse(List.of("ARKK"));
                store.setExpirations("ARKK", MONTHLY_EXPIRATIONS, NOW);
                store.setChain("ARKK", chainFor("ARKK", "2026-09-18"), NOW);

                Map<String, Object> ev = store.getEvidence("ARKK");

                assertNotNull(ev.get("chain"));
                @SuppressWarnings("unchecked")
                List<Map<String, String>> chains = (List<Map<String, String>>) ev.get("chains");
                assertNotNull(chains);
                assertEquals(1, chains.size());
            }
        }
    }
}
