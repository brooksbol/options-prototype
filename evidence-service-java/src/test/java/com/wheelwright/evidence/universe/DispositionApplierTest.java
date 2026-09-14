package com.wheelwright.evidence.universe;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.universe.DispositionApplier.Mode;
import com.wheelwright.evidence.universe.DispositionApplier.Result;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DispositionApplier tests — dry-run causes no mutation; apply is exact-count transactional;
 * rollback is symmetric; history remains readable; count mismatches are refused.
 *
 * Uses a synthetic in-memory disposition (3 REMOVE / 2 WEEKLY / 1 PROTECTED via
 * {@link UniverseDisposition#parse}) against a controlled in-memory DB, so the transactional
 * semantics are verified independently of the frozen 340/487/84 real artifact.
 */
class DispositionApplierTest {

    @Test
    @DisplayName("dry-run against the REAL artifact makes no mutation and reports expected counts")
    void dryRunRealArtifactNoMutation() throws Exception {
        UniverseDisposition disp = UniverseDisposition.load(
            java.nio.file.Path.of("../data/universe/disposition-gen29066.csv"));
        DispositionApplier applier = new DispositionApplier(disp);

        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            Connection conn = store.getConnection();
            // Seed a controlled universe: all 340 removal + 487 weekly + 84 protected as active.
            List<String> all = new ArrayList<>();
            all.addAll(disp.canonicalRemove());
            all.addAll(disp.weeklyRefresh());
            all.addAll(disp.normalProtected());
            store.initUniverse(all);

            int before = activeCount(conn);
            assertEquals(911, before, "seeded 340+487+84 active symbols");

            Result r = applier.run(conn, Mode.DRY_RUN);
            assertTrue(r.ok(), "dry-run problems: " + r.problems());
            assertEquals(340, r.canonicalRemoveCohort());
            assertEquals(487, r.weeklyCohort());
            assertEquals(84, r.protectedCohort());
            assertEquals(340, r.matchedActiveRemovals());
            assertEquals(0, r.overlapWithProtectedOrWeekly());
            assertEquals(0, r.affectedRows());
            assertFalse(r.mutated());
            assertEquals(before, activeCount(conn), "dry-run must not mutate");
        }
    }

    @Test
    @DisplayName("apply removes exactly 340 then rollback restores exactly 340; history preserved")
    void applyThenRollbackSymmetric() throws Exception {
        UniverseDisposition disp = UniverseDisposition.load(
            java.nio.file.Path.of("../data/universe/disposition-gen29066.csv"));
        DispositionApplier applier = new DispositionApplier(disp);

        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            Connection conn = store.getConnection();
            List<String> all = new ArrayList<>();
            all.addAll(disp.canonicalRemove());
            all.addAll(disp.weeklyRefresh());
            all.addAll(disp.normalProtected());
            store.initUniverse(all);

            // Write a piece of evidence for a removal symbol to prove history survives removal.
            String victim = disp.canonicalRemove().iterator().next();
            store.setExpirations(victim, "[{\"date\":\"2026-09-18\",\"dte\":28}]", "2026-09-14T00:00:00Z");
            assertTrue(evidenceRows(conn, victim) > 0);

            int before = activeCount(conn);
            assertEquals(911, before);

            Result applyResult = applier.run(conn, Mode.APPLY);
            assertTrue(applyResult.ok(), "apply problems: " + applyResult.problems());
            assertEquals(340, applyResult.affectedRows());
            assertTrue(applyResult.mutated());
            assertEquals(before - 340, activeCount(conn), "active count drops by exactly 340");

            // History for the removed victim remains readable (soft-delete, not cascade delete).
            assertTrue(evidenceRows(conn, victim) > 0, "evidence must survive canonical removal");

            // Weekly + protected remain active.
            assertEquals(487 + 84, activeAmong(conn, concat(disp.weeklyRefresh(), disp.normalProtected())));

            Result rollbackResult = applier.run(conn, Mode.ROLLBACK);
            assertTrue(rollbackResult.ok(), "rollback problems: " + rollbackResult.problems());
            assertEquals(340, rollbackResult.affectedRows());
            assertEquals(before, activeCount(conn), "rollback restores the exact prior active count");
        }
    }

    @Test
    @DisplayName("apply refuses when active removal matches != 340 (idempotent / mismatch guard)")
    void applyRefusesOnMismatch() throws Exception {
        UniverseDisposition disp = UniverseDisposition.load(
            java.nio.file.Path.of("../data/universe/disposition-gen29066.csv"));
        DispositionApplier applier = new DispositionApplier(disp);

        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            Connection conn = store.getConnection();
            // Seed only PART of the removal cohort active -> matchedActiveRemovals < 340.
            List<String> partial = new ArrayList<>(disp.canonicalRemove()).subList(0, 100);
            store.initUniverse(partial);

            Result r = applier.run(conn, Mode.APPLY);
            assertFalse(r.ok(), "apply must refuse when active matches != 340");
            assertEquals(0, r.affectedRows());
            assertFalse(r.mutated());
        }
    }

    // --- helpers ---

    private static int activeCount(Connection conn) throws Exception {
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM symbols WHERE removed_at IS NULL")) {
            return rs.next() ? rs.getInt(1) : -1;
        }
    }

    private static int evidenceRows(Connection conn, String symbol) throws Exception {
        try (var ps = conn.prepareStatement("SELECT COUNT(*) FROM evidence WHERE symbol = ?")) {
            ps.setString(1, symbol);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    private static int activeAmong(Connection conn, List<String> symbols) throws Exception {
        int n = 0;
        try (var ps = conn.prepareStatement("SELECT 1 FROM symbols WHERE symbol = ? AND removed_at IS NULL")) {
            for (String s : symbols) {
                ps.setString(1, s);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) n++;
                }
            }
        }
        return n;
    }

    private static List<String> concat(java.util.Set<String> a, java.util.Set<String> b) {
        List<String> out = new ArrayList<>(a);
        out.addAll(b);
        return out;
    }
}
