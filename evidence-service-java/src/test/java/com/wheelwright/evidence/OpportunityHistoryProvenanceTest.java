package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER blocker #6 (review 2): opportunity-history provenance must follow the
 * EVIDENCE the Decision evaluated, NOT the provider authority active at POST ingestion time.
 *
 * The controller resolves the persisted epoch's environment via
 * {@link SqliteEvidenceStore#environmentForGeneration(Integer)} — from durable evidence
 * facts — rather than stamping the current control-plane authority.
 */
class OpportunityHistoryProvenanceTest {

    private static final String FUTURE_EXPIRATION =
        java.time.LocalDate.now(java.time.ZoneOffset.UTC).plusDays(21).toString();

    private static String chainJson(String sym) {
        return "{\"symbol\":\"" + sym + "\",\"expiration\":\"" + FUTURE_EXPIRATION + "\","
            + "\"underlying\":{\"symbol\":\"" + sym + "\",\"name\":\"n\",\"price\":50.0},"
            + "\"puts\":[{\"strike\":48,\"bid\":1.0,\"ask\":1.1,\"delta\":-0.28,\"openInterest\":100,\"volume\":10}],"
            + "\"calls\":[]}";
    }

    private static String now() { return java.time.Instant.now().toString(); }

    private static OpportunityHistoryController.BatchRequest batch(String epochId, int generation) {
        var body = new OpportunityHistoryController.BatchRequest();
        var e = new OpportunityHistoryController.EpochDto();
        e.epochId = epochId;
        e.startedAt = now();
        e.policyVersion = "routine-csp-v1";
        e.evidenceGeneration = generation;
        e.sessionDate = "2026-08-28";
        e.sessionPosture = "FULL";
        e.provider = "appliance";
        e.environment = "CLIENT_SUPPLIED_SHOULD_BE_IGNORED"; // backend must not trust this
        e.symbolsEvaluated = 1;
        e.emitter = "browser";
        body.epoch = e;
        body.symbolObservations = List.of();
        body.surfaceObservations = List.of();
        return body;
    }

    private static String persistedEnvironment(SqliteEvidenceStore store, String epochId) throws Exception {
        try (var st = store.getConnection().createStatement();
             var rs = st.executeQuery(
                 "SELECT environment FROM evaluation_epoch WHERE epoch_id = '" + epochId + "'")) {
            assertTrue(rs.next(), "epoch must be persisted");
            return rs.getString("environment");
        }
    }

    private static String persistedProvider(SqliteEvidenceStore store, String epochId) throws Exception {
        try (var st = store.getConnection().createStatement();
             var rs = st.executeQuery(
                 "SELECT provider FROM evaluation_epoch WHERE epoch_id = '" + epochId + "'")) {
            assertTrue(rs.next(), "epoch must be persisted");
            return rs.getString("provider");
        }
    }

    @Test
    void clientSuppliedProviderIsNotPersistedAsProvenance() throws Exception {
        // Review-5 #2: the client-asserted provider identity is untrusted provenance. It must be
        // backend-established 'unknown' — never persisted as-sent — just like environment.
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            var controller = new OpportunityHistoryController(store);
            // batch(...) sets epoch.provider = "appliance" (client-asserted).
            var response = controller.append(batch("ep_prov", 1));
            assertEquals(200, response.getStatusCodeValue());
            assertEquals("unknown", persistedProvider(store, "ep_prov"),
                "client-supplied provider must NOT be persisted as provenance");
            assertNotEquals("appliance", persistedProvider(store, "ep_prov"),
                "one half of an untrusted provenance pair must not survive");
            assertEquals("unknown", persistedEnvironment(store, "ep_prov"));
        }
    }

    @Test
    void provenanceIsNotManufacturedFromCurrentTable_persistsUnknown() throws Exception {
        // Review-3 #6: even when current evidence is sandbox at the cited generation, the
        // backend must NOT manufacture "sandbox" by inferring from the mutable current table.
        // Until exact per-subject/per-chain retrieval provenance is carried with the Decision
        // result, the honest persisted value is "unknown" — never inferred, never client-trusted.
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE",
                "[{\"date\":\"" + FUTURE_EXPIRATION + "\",\"dte\":21}]", now(), "sandbox", "sandbox:1:1");
            store.setChain("XLE", chainJson("XLE"), now(), "sandbox", "sandbox:1:1");
            store.publishSnapshot();
            int generationDecisionEvaluated = store.getGeneration();

            var controller = new OpportunityHistoryController(store);
            var response = controller.append(batch("ep_A", generationDecisionEvaluated));
            assertEquals(200, response.getStatusCodeValue());

            String persisted = persistedEnvironment(store, "ep_A");
            assertEquals("unknown", persisted,
                "provenance must be honest 'unknown' — never manufactured from the current mutable table");
            assertNotEquals("CLIENT_SUPPLIED_SHOULD_BE_IGNORED", persisted,
                "backend must not trust the client-asserted environment");
            assertNotEquals("sandbox", persisted,
                "backend must not infer a global epoch environment from current state");
        }
    }

    @Test
    void olderGenerationAlsoPersistsUnknown() throws Exception {
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            store.setExpirations("XLE",
                "[{\"date\":\"" + FUTURE_EXPIRATION + "\",\"dte\":21}]", now(), "sandbox", "sandbox:1:1");
            store.setChain("XLE", chainJson("XLE"), now(), "sandbox", "sandbox:1:1");
            store.publishSnapshot();
            store.publishSnapshot();

            var controller = new OpportunityHistoryController(store);
            var response = controller.append(batch("ep_old", 1));
            assertEquals(200, response.getStatusCodeValue());
            assertEquals("unknown", persistedEnvironment(store, "ep_old"),
                "older generation provenance is honest 'unknown'");
        }
    }
}
