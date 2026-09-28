package com.wheelwright.evidence.db;

import com.wheelwright.evidence.db.SqliteEvidenceStore.ContinuityAssessmentRecord;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Durable continuity-assessment store tests (ADR-022 / Doc 70 + remediation):
 * append-only idempotency, ADR-019 bitemporal anti-hindsight, Decision-cut coverage
 * (Defect 4), and governed-scope binding (Defect 5).
 */
class ContinuityStoreTest {

    private static final String SCOPE = "scope_abc";

    private static ContinuityAssessmentRecord rec(
            String id, String verdict, String effectiveFrom, String recordedAt, String coveredThrough) {
        return new ContinuityAssessmentRecord(id, "acctZ", SCOPE, "XLE", "CALL", 57.5, "2026-10-16",
            1, verdict, verdict.equals("FULL_Q_INTACT_APPLICABLE") ? 1 : null, "[]",
            "continuity-admission-v1", true, "2026-09-26", coveredThrough, "ceh_x", effectiveFrom, recordedAt);
    }

    @Test
    void idempotentAppendAndBitemporalResolveWithinCoverage() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.appendContinuityAssessment(rec("a1", "FULL_Q_INTACT_APPLICABLE",
                "2026-09-26T00:00:00Z", "2026-09-27T00:00:00Z", "2026-09-26"));
            store.appendContinuityAssessment(rec("a1", "FULL_Q_INTACT_APPLICABLE",
                "2026-09-26T00:00:00Z", "2026-09-27T00:00:00Z", "2026-09-26"));
            assertEquals(1, store.getGovernedDecisionCounts().get("continuityAssessments"));

            // A later correction recorded 09-29 changes the verdict for the same series/scope/cut.
            store.appendContinuityAssessment(rec("a2", "POLICY_UNDEFINED",
                "2026-09-26T00:00:00Z", "2026-09-29T00:00:00Z", "2026-09-26"));

            // Decision cut ON the covered day (09-26); knowledge cutoff 09-28 must NOT see 09-29.
            ContinuityAssessmentRecord asOf28 = store.resolveContinuityAssessment(
                "acctZ", SCOPE, "XLE", "CALL", 57.5, "2026-10-16",
                "2026-09-26T00:00:00Z", "2026-09-28T00:00:00Z");
            assertNotNull(asOf28);
            assertEquals("FULL_Q_INTACT_APPLICABLE", asOf28.verdict(),
                "anti-hindsight: later-recorded correction must not enter an earlier knowledge cutoff");

            // Knowledge cutoff 09-30 sees the correction.
            ContinuityAssessmentRecord asOf30 = store.resolveContinuityAssessment(
                "acctZ", SCOPE, "XLE", "CALL", 57.5, "2026-10-16",
                "2026-09-26T00:00:00Z", "2026-09-30T00:00:00Z");
            assertNotNull(asOf30);
            assertEquals("POLICY_UNDEFINED", asOf30.verdict());
        }
    }

    @Test
    void decisionCutBeyondCoverageResolvesNull_Defect4() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            // Assessment covers through 2026-09-26.
            store.appendContinuityAssessment(rec("a1", "FULL_Q_INTACT_APPLICABLE",
                "2026-09-26T00:00:00Z", "2026-09-27T00:00:00Z", "2026-09-26"));
            // A Decision cut of 2026-09-27 is BEYOND covered_through — must not resolve.
            assertNull(store.resolveContinuityAssessment(
                "acctZ", SCOPE, "XLE", "CALL", 57.5, "2026-10-16",
                "2026-09-27T00:00:00Z", "2099-01-01T00:00:00Z"),
                "a Sep-26 assessment must not satisfy a later Decision cut (Defect 4)");
            // A Decision cut ON the covered day resolves.
            assertNotNull(store.resolveContinuityAssessment(
                "acctZ", SCOPE, "XLE", "CALL", 57.5, "2026-10-16",
                "2026-09-26T00:00:00Z", "2099-01-01T00:00:00Z"));
        }
    }

    @Test
    void resolveRequiresGovernedScope_Defect5() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.appendContinuityAssessment(rec("a1", "FULL_Q_INTACT_APPLICABLE",
                "2026-09-26T00:00:00Z", "2026-09-27T00:00:00Z", "2026-09-26"));
            // Blank scope => null (cannot bind by series alone).
            assertNull(store.resolveContinuityAssessment(
                "acctZ", "", "XLE", "CALL", 57.5, "2026-10-16",
                "2026-09-26T00:00:00Z", "2099-01-01T00:00:00Z"));
            // A DIFFERENT scope on the same series => null (no cross-scope match).
            assertNull(store.resolveContinuityAssessment(
                "acctZ", "scope_other", "XLE", "CALL", 57.5, "2026-10-16",
                "2026-09-26T00:00:00Z", "2099-01-01T00:00:00Z"));
            // The bound scope resolves.
            assertNotNull(store.resolveContinuityAssessment(
                "acctZ", SCOPE, "XLE", "CALL", 57.5, "2026-10-16",
                "2026-09-26T00:00:00Z", "2099-01-01T00:00:00Z"));
        }
    }

    @Test
    void unknownSeriesResolvesNull() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            assertNull(store.resolveContinuityAssessment(
                "acctZ", SCOPE, "ZZZ", "PUT", 1.0, "2026-01-01",
                "2099-01-01T00:00:00Z", "2099-01-01T00:00:00Z"));
        }
    }
}
