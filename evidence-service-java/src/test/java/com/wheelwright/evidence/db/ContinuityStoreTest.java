package com.wheelwright.evidence.db;

import com.wheelwright.evidence.db.SqliteEvidenceStore.ContinuityAssessmentRecord;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Durable continuity-assessment store tests (ADR-022 / Doc 70): append-only idempotency and
 * ADR-019 bitemporal anti-hindsight (a later-recorded correction never enters an earlier
 * Decision's knowledge cutoff).
 */
class ContinuityStoreTest {

    private static ContinuityAssessmentRecord rec(String id, String verdict, String effectiveFrom, String recordedAt) {
        return new ContinuityAssessmentRecord(id, "acctZ", null, "XLE", "CALL", 57.5, "2026-10-16",
            1, verdict, verdict.equals("FULL_Q_INTACT_APPLICABLE") ? 1 : null, "[]",
            "continuity-admission-v1", true, "2026-09-26", "ceh_x", effectiveFrom, recordedAt);
    }

    @Test
    void idempotentAppendAndBitemporalResolve() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            // Original assessment recorded 09-27.
            store.appendContinuityAssessment(rec("a1", "FULL_Q_INTACT_APPLICABLE",
                "2026-09-26T00:00:00Z", "2026-09-27T00:00:00Z"));
            // Idempotent repeat: same id, no second row.
            store.appendContinuityAssessment(rec("a1", "FULL_Q_INTACT_APPLICABLE",
                "2026-09-26T00:00:00Z", "2026-09-27T00:00:00Z"));
            assertEquals(1, store.getGovernedDecisionCounts().get("continuityAssessments"));

            // A later correction recorded 09-29 changes the verdict for the same series/cut.
            store.appendContinuityAssessment(rec("a2", "POLICY_UNDEFINED",
                "2026-09-26T00:00:00Z", "2026-09-29T00:00:00Z"));

            // A Decision whose knowledge cutoff is 09-28 must NOT see the 09-29 correction.
            ContinuityAssessmentRecord asOf28 = store.resolveContinuityAssessment(
                "acctZ", "XLE", "CALL", 57.5, "2026-10-16",
                "2099-01-01T00:00:00Z", "2026-09-28T00:00:00Z");
            assertNotNull(asOf28);
            assertEquals("FULL_Q_INTACT_APPLICABLE", asOf28.verdict(),
                "anti-hindsight: later-recorded correction must not enter an earlier knowledge cutoff");

            // A later Decision (cutoff 09-30) sees the correction.
            ContinuityAssessmentRecord asOf30 = store.resolveContinuityAssessment(
                "acctZ", "XLE", "CALL", 57.5, "2026-10-16",
                "2099-01-01T00:00:00Z", "2026-09-30T00:00:00Z");
            assertNotNull(asOf30);
            assertEquals("POLICY_UNDEFINED", asOf30.verdict());
        }
    }

    @Test
    void unknownSeriesResolvesNull() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            assertNull(store.resolveContinuityAssessment(
                "acctZ", "ZZZ", "PUT", 1.0, "2026-01-01",
                "2099-01-01T00:00:00Z", "2099-01-01T00:00:00Z"));
        }
    }
}
