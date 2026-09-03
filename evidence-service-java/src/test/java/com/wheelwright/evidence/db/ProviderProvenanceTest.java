package com.wheelwright.evidence.db;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER step 4: durable provenance/partitioning + subject-scoped selection.
 *
 * Proves migration 005 applied (environment/provenance_id columns exist), that writes
 * stamp truthful provider/environment provenance, that a degraded (sandbox) write is
 * tagged 'sandbox' — never silently promoted to production — and that legacy 3-arg
 * writes default to production provenance.
 */
class ProviderProvenanceTest {

    private static final String FUTURE_EXPIRATION =
        java.time.LocalDate.now(java.time.ZoneOffset.UTC).plusDays(21).toString();
    private static final String EXP_JSON =
        "[{\"date\":\"" + FUTURE_EXPIRATION + "\",\"dte\":21}]";
    private static String chainJson(String sym) {
        return "{\"symbol\":\"" + sym + "\",\"expiration\":\"" + FUTURE_EXPIRATION + "\","
            + "\"underlying\":{\"symbol\":\"" + sym + "\",\"name\":\"n\",\"price\":50.0},"
            + "\"puts\":[{\"strike\":48,\"bid\":1.0,\"ask\":1.1,\"delta\":-0.28,\"openInterest\":100,\"volume\":10}],"
            + "\"calls\":[]}";
    }

    private static String now() { return java.time.Instant.now().toString(); }

    @Test
    void legacyWritesDefaultToUnknownProvenanceNotInventedProduction() throws Exception {
        // Correction (PL-PROV-FAILOVER blocker #7): a legacy 3-arg write did NOT establish
        // provider authority through a lease, so its provenance is genuinely UNKNOWN. It must
        // NOT be asserted 'production' — that is the invention migration 006 corrects.
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE", EXP_JSON, now());   // legacy 3-arg
            store.setChain("XLE", chainJson("XLE"), now());  // legacy 3-arg

            Map<String, Object> ev = store.getEvidence("XLE");
            assertEquals("ready", ev.get("status"));
            assertEquals("unknown", ev.get("primaryChainEnvironment"),
                "legacy (non-lease) writes must record UNKNOWN provenance, never invented production");
        }
    }

    @Test
    void migration006RelabelsInventedProductionButPreservesGenuineProvenance() throws Exception {
        // Simulate the pre-006 state directly: one row that migration 005 invented as
        // 'production' with NO provenance_id (historical), and two genuinely-established rows
        // (production + sandbox) that DO carry a provenance_id. Migration 006 must relabel only
        // the invented one to 'unknown' and leave the genuine ones untouched.
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("AAA", "BBB", "CCC"));
            // Genuine production (lease provenance): expirations then chain.
            store.setExpirations("AAA", EXP_JSON, now(), "production", "production:1:1");
            store.setChain("AAA", chainJson("AAA"), now(), "production", "production:1:1");
            // Genuine sandbox (lease provenance).
            store.setExpirations("BBB", EXP_JSON, now(), "sandbox", "sandbox:2:1");
            store.setChain("BBB", chainJson("BBB"), now(), "sandbox", "sandbox:2:1");
            // Invented: force the 005 backfill signature (environment=production, provenance NULL).
            store.setExpirations("CCC", EXP_JSON, now(), "production", null);
            store.setChain("CCC", chainJson("CCC"), now(), "production", null);
            try (var st = store.getConnection().createStatement()) {
                st.executeUpdate("UPDATE evidence SET provenance_id = NULL WHERE symbol='CCC'");
            }

            // Apply the 006 correction (idempotent forward migration body).
            try (var st = store.getConnection().createStatement()) {
                st.executeUpdate(
                    "UPDATE evidence SET environment='unknown' WHERE provenance_id IS NULL AND environment='production'");
            }

            assertEquals("production", store.getEvidence("AAA").get("primaryChainEnvironment"),
                "genuine production provenance (with provenance_id) must be preserved");
            assertEquals("sandbox", store.getEvidence("BBB").get("primaryChainEnvironment"),
                "genuine sandbox provenance (with provenance_id) must be preserved");
            assertEquals("unknown", store.getEvidence("CCC").get("primaryChainEnvironment"),
                "invented production backfill (no provenance_id) must be corrected to unknown");
        }
    }

    @Test
    void degradedWriteIsTaggedSandboxNotProduction() throws Exception {
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            // Production acquisition first.
            store.setExpirations("XLE", EXP_JSON, now(), "production", "production:1:1");
            store.setChain("XLE", chainJson("XLE"), now(), "production", "production:1:1");
            assertEquals("production", store.getEvidence("XLE").get("primaryChainEnvironment"));

            // Failover: degraded (sandbox) acquisition overwrites — but MUST be tagged sandbox.
            store.setChain("XLE", chainJson("XLE"), now(), "sandbox", "sandbox:2:1");
            Map<String, Object> ev = store.getEvidence("XLE");
            assertEquals("sandbox", ev.get("primaryChainEnvironment"),
                "degraded write must be truthfully tagged sandbox — never silently promoted to production");

            // Failback: production overwrites again — tagged production.
            store.setChain("XLE", chainJson("XLE"), now(), "production", "production:3:1");
            assertEquals("production", store.getEvidence("XLE").get("primaryChainEnvironment"));
        }
    }

    @Test
    void provenanceColumnsExistAndAreQueryable() throws Exception {
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE", EXP_JSON, now(), "sandbox", "sandbox:1:1");
            // A direct column read proves migration 005 added the columns.
            try (var st = store.getConnection().createStatement();
                 var rs = st.executeQuery(
                     "SELECT environment, provenance_id FROM evidence WHERE symbol='XLE' AND evidence_type='expirations'")) {
                assertTrue(rs.next());
                assertEquals("sandbox", rs.getString("environment"));
                assertEquals("sandbox:1:1", rs.getString("provenance_id"));
            }
        }
    }
}
