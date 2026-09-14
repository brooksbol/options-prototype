package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.universe.UniverseDisposition;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Blocker 3 — explicit disposition configuration must FAIL CLOSED.
 *
 * When {@code universe.disposition.path} is explicitly configured, a missing / unreadable /
 * malformed / invalid artifact must abort startup rather than silently disabling weekly cadence.
 *
 * The fail-closed guarantee lives in {@code EvidenceStoreConfig.WorkerStarter.start()}, which loads
 * the disposition OUTSIDE its worker-start try/catch and does not catch the validating loader's
 * exception. These tests assert the underlying validating loader ({@link UniverseDisposition#load})
 * throws on the representative failure modes; that exception is what propagates out of startup.
 */
class DispositionFailClosedTest {

    @Test
    @DisplayName("nonexistent configured disposition artifact throws (fail closed)")
    void nonexistentArtifactThrows() {
        assertThrows(UniverseDisposition.DispositionValidationException.class,
            () -> UniverseDisposition.load(Path.of("/tmp/gen29066-does-not-exist-" + System.nanoTime() + ".csv")));
    }

    @Test
    @DisplayName("readable artifact with wrong cohort counts throws (fail closed)")
    void wrongCountsThrows(@org.junit.jupiter.api.io.TempDir Path tmp) throws Exception {
        Path bad = tmp.resolve("bad-disposition.csv");
        // Valid header + provenance, but only ONE CANONICAL_REMOVE row (not 340/487/84).
        String header = "symbol,disposition,evidence_generation,effective_date,"
            + "report_identity,report_sha256,predicate_version,disposition_reason";
        String row = "AADR,CANONICAL_REMOVE,29066,2026-09-14,"
            + "wheelwright-universe-disposition-gen29066.md,"
            + "eb540354ef87f794d0f7c5052cb84dd4cb7ac2e5e9c7b4dd78713d5700eda49e,gen29066-v1,reason";
        Files.writeString(bad, header + "\n" + row + "\n");

        var ex = assertThrows(UniverseDisposition.DispositionValidationException.class,
            () -> UniverseDisposition.load(bad));
        assertTrue(ex.getMessage().contains("CANONICAL_REMOVE count"),
            "must fail on cohort-count validation, not silently disable");
    }

    @Test
    @DisplayName("startup path installs the cohort on a VALID artifact (positive control)")
    void validArtifactInstallsCohort() throws Exception {
        // The real persisted artifact validates to 340/487/84 and installs cleanly.
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            var disp = UniverseDisposition.load(Path.of("../data/universe/disposition-gen29066.csv"));
            store.setWeeklyRefreshCohort(disp.weeklyRefresh());
            assertEquals(487, store.getWeeklyRefreshCohort().size());
        }
    }
}
