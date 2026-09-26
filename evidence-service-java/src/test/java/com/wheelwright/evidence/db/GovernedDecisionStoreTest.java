package com.wheelwright.evidence.db;

import com.wheelwright.evidence.db.SqliteEvidenceStore.GovernedContextVersionRecord;
import com.wheelwright.evidence.db.SqliteEvidenceStore.GovernedDecisionRecord;
import com.wheelwright.evidence.db.SqliteEvidenceStore.SubjectScopeAssociationRecord;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Governed Decision plane (migration 010) persistence tests.
 *
 * Proves: immutable append + idempotency, bitemporal context resolution (anti-hindsight),
 * account/scope partitioning, versioning/supersession, association resolution with no
 * ticker fallback, and Decision retrieval for replay.
 */
class GovernedDecisionStoreTest {

    private static GovernedContextVersionRecord ctx(
            String id, String acct, String scope, int version, String supersedes,
            String stance, String elig, String interv, String noWrite,
            String effectiveFrom, String recordedAt) {
        return new GovernedContextVersionRecord(
            id, acct, scope, version, supersedes, "assignment-centric-wheel", "1",
            stance, elig, interv, noWrite, "operator-governance", effectiveFrom, recordedAt);
    }

    @Test
    @DisplayName("context version append is immutable + idempotent")
    void contextAppendIdempotent() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            var c = ctx("ctx_1", "acctA", "scope1", 1, null, "accepted", "CLEAR", "CLEAR", "CLEAR",
                "2026-09-01T00:00:00Z", "2026-09-01T00:00:01Z");
            store.appendGovernedContextVersion(c);
            // Re-append same id -> no duplicate, original preserved.
            store.appendGovernedContextVersion(ctx("ctx_1", "acctA", "scope1", 1, null, "unknown",
                "UNKNOWN", "UNKNOWN", "UNKNOWN", "2026-09-01T00:00:00Z", "2099-01-01T00:00:00Z"));
            Map<String, Integer> counts = store.getGovernedDecisionCounts();
            assertEquals(1, counts.get("contextVersions"));
            var read = store.getGovernedContextVersion("ctx_1");
            assertNotNull(read);
            assertEquals("accepted", read.callAwayStance(), "original immutable content preserved");
        }
    }

    @Test
    @DisplayName("bitemporal resolve honors effective AND recorded knowledge cutoff (anti-hindsight)")
    void bitemporalResolve() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            // v1 effective 09-01, recorded 09-01.
            store.appendGovernedContextVersion(ctx("ctx_v1", "acctA", "scope1", 1, null, "accepted",
                "CLEAR", "CLEAR", "CLEAR", "2026-09-01T00:00:00Z", "2026-09-01T00:00:00Z"));
            // v2 effective 08-01 (BACKDATED) but recorded 09-10 (later).
            store.appendGovernedContextVersion(ctx("ctx_v2", "acctA", "scope1", 2, "ctx_v1", "unknown",
                "UNKNOWN", "UNKNOWN", "UNKNOWN", "2026-08-01T00:00:00Z", "2026-09-10T00:00:00Z"));

            // As-of a 09-05 decision, knowledge cutoff 09-05: the backdated v2 recorded 09-10 must
            // NOT be visible; only v1 qualifies.
            var resolved = store.resolveGovernedContext("acctA", "scope1",
                "2026-09-05T00:00:00Z", "2026-09-05T00:00:00Z");
            assertNotNull(resolved);
            assertEquals("ctx_v1", resolved.contextVersionId(),
                "backdated later-recorded version cannot masquerade as contemporaneously known");
        }
    }

    @Test
    @DisplayName("resolve is account+scope partitioned")
    void partitioned() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.appendGovernedContextVersion(ctx("ctx_a", "acctA", "scope1", 1, null, "accepted",
                "CLEAR", "CLEAR", "CLEAR", "2026-09-01T00:00:00Z", "2026-09-01T00:00:00Z"));
            assertNull(store.resolveGovernedContext("acctB", "scope1",
                "2026-09-05T00:00:00Z", "2026-09-05T00:00:00Z"), "other account sees nothing");
            assertNull(store.resolveGovernedContext("acctA", "scopeX",
                "2026-09-05T00:00:00Z", "2026-09-05T00:00:00Z"), "other scope sees nothing");
        }
    }

    @Test
    @DisplayName("association resolves explicitly; absent subject returns null (no ticker fallback)")
    void associationResolve() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            assertNull(store.resolveSubjectScope("acctA", "shares-GDXJ", "2026-09-05T00:00:00Z"));
            store.appendSubjectScopeAssociation(new SubjectScopeAssociationRecord(
                "assoc_1", "acctA", "shares-GDXJ", "scope1", "operator-governance",
                "2026-09-01T00:00:00Z", "2026-09-01T00:00:00Z"));
            var a = store.resolveSubjectScope("acctA", "shares-GDXJ", "2026-09-05T00:00:00Z");
            assertNotNull(a);
            assertEquals("scope1", a.governedScopeId());
            // A different subject id is never associated by symbol similarity.
            assertNull(store.resolveSubjectScope("acctA", "shares-OTHER", "2026-09-05T00:00:00Z"));
        }
    }

    @Test
    @DisplayName("decision append is immutable + idempotent + retrievable")
    void decisionAppend() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.appendGovernedContextVersion(ctx("ctx_1", "acctA", "scope1", 1, null, "accepted",
                "CLEAR", "CLEAR", "CLEAR", "2026-09-01T00:00:00Z", "2026-09-01T00:00:00Z"));
            var d = new GovernedDecisionRecord(
                "dec_1", "acctA", "scope1", "covered-call", "call-GDXJ-30-2026-10-17", "GDXJ",
                "ctx_1", "DOC65-RULE-1-LET-RESOLVE", "wheel-covered-call", "1",
                "LET_RESOLVE", "[]", "[]", "{\"k\":1}", "db_abc",
                "2026-09-05T14:00:00Z", "2026-09-05T14:00:01Z");
            store.appendGovernedDecision(d);
            store.appendGovernedDecision(d); // idempotent
            assertEquals(1, store.getGovernedDecisionCounts().get("decisions"));
            var read = store.getGovernedDecision("dec_1");
            assertNotNull(read);
            assertEquals("LET_RESOLVE", read.recommendation());
            assertEquals(1, store.getGovernedDecisionsForSubject("acctA", "call-GDXJ-30-2026-10-17").size());
        }
    }
}
