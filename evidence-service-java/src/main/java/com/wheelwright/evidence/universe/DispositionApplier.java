package com.wheelwright.evidence.universe;

import com.wheelwright.evidence.db.DatabaseManager;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Generation-29066 canonical-removal disposition applier — versioned, transactional, governed.
 *
 * <p>Applies (or rolls back) exactly the frozen {@code CANONICAL_REMOVE} cohort as a soft-removal
 * on the {@code symbols} table ({@code removed_at}). Consumes the validated machine-readable
 * disposition artifact ({@code data/universe/disposition-gen29066.csv}) as its sole authority; it
 * never recomputes or substitutes membership.
 *
 * <p><strong>Modes</strong>
 * <ul>
 *   <li><b>dry-run</b> (default): validate the artifact, query the DB read-only, prove exactly 340
 *       active removal matches and zero overlap with the 487/84 cohorts, report before/after
 *       counts, and make NO mutation.</li>
 *   <li><b>apply</b> (requires {@code --apply}): in one transaction, set {@code removed_at} for
 *       exactly the frozen 340 active removal symbols, assert exactly 340 affected rows, and
 *       commit only if every invariant holds (else rollback).</li>
 *   <li><b>rollback</b> ({@code --rollback}): symmetric — clear {@code removed_at} for exactly the
 *       frozen 340 in one transaction, assert the affected-row count, and commit only on match.</li>
 * </ul>
 *
 * <p><strong>Non-destructive.</strong> Never deletes symbol rows, evidence, or opportunity
 * history. The soft-removal preserves all keyed history. A backup of the DB is the operator's
 * prerequisite before apply (this tool reports the expectation; it does not delete anything).
 *
 * <p>This is an administrative data operation, not application runtime code — nothing in the
 * running appliance special-cases the 340 symbols; the scheduler simply reads the active universe
 * ({@code removed_at IS NULL}) at startup.
 */
public final class DispositionApplier {

    public enum Mode { DRY_RUN, APPLY, ROLLBACK }

    public record Result(
        Mode mode,
        String generation,
        String reportIdentity,
        String reportSha256,
        String timestamp,
        int canonicalRemoveCohort,   // 340 from artifact
        int weeklyCohort,            // 487 from artifact
        int protectedCohort,         // 84 from artifact
        int activeBefore,            // active-universe count before
        int matchedActiveRemovals,   // frozen-removal symbols currently active
        int overlapWithProtectedOrWeekly, // must be 0
        int affectedRows,            // rows changed (0 in dry-run)
        int activeAfter,             // active-universe count after (== before in dry-run)
        boolean mutated,
        List<String> problems        // non-empty => refused / rolled back
    ) {
        public boolean ok() { return problems.isEmpty(); }
    }

    private final UniverseDisposition disposition;

    public DispositionApplier(UniverseDisposition disposition) {
        this.disposition = disposition;
    }

    private static int activeCount(Connection conn) throws SQLException {
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM symbols WHERE removed_at IS NULL")) {
            return rs.next() ? rs.getInt(1) : -1;
        }
    }

    /** Count how many of {@code symbols} are currently active (removed_at IS NULL). */
    private static int matchActive(Connection conn, Set<String> symbols) throws SQLException {
        int n = 0;
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT 1 FROM symbols WHERE symbol = ? AND removed_at IS NULL")) {
            for (String s : symbols) {
                ps.setString(1, s);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) n++;
                }
            }
        }
        return n;
    }

    /** Count how many of {@code symbols} currently have a non-null removed_at. */
    private static int matchRemoved(Connection conn, Set<String> symbols) throws SQLException {
        int n = 0;
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT 1 FROM symbols WHERE symbol = ? AND removed_at IS NOT NULL")) {
            for (String s : symbols) {
                ps.setString(1, s);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) n++;
                }
            }
        }
        return n;
    }

    /**
     * Execute the requested mode against an open connection. Read-only for dry-run; single
     * transaction for apply/rollback. Returns a machine-readable result; on any invariant
     * violation, apply/rollback are refused/rolled back and {@code problems} is populated.
     */
    public Result run(Connection conn, Mode mode) throws SQLException {
        List<String> problems = new ArrayList<>();
        Set<String> remove = disposition.canonicalRemove();
        Set<String> weekly = disposition.weeklyRefresh();
        Set<String> protectedSet = disposition.normalProtected();
        String ts = Instant.now().toString();

        // Artifact invariants (already enforced by the validating loader; re-assert defensively).
        if (remove.size() != UniverseDisposition.EXPECTED_CANONICAL_REMOVE) {
            problems.add("CANONICAL_REMOVE cohort size " + remove.size() + " != " + UniverseDisposition.EXPECTED_CANONICAL_REMOVE);
        }
        if (weekly.size() != UniverseDisposition.EXPECTED_WEEKLY_REFRESH) {
            problems.add("WEEKLY_REFRESH cohort size " + weekly.size() + " != " + UniverseDisposition.EXPECTED_WEEKLY_REFRESH);
        }
        if (protectedSet.size() != UniverseDisposition.EXPECTED_NORMAL_PROTECTED) {
            problems.add("NORMAL_PROTECTED cohort size " + protectedSet.size() + " != " + UniverseDisposition.EXPECTED_NORMAL_PROTECTED);
        }

        // Cross-cohort overlap between removal and protected/weekly must be zero.
        int overlap = 0;
        for (String s : remove) {
            if (weekly.contains(s) || protectedSet.contains(s)) overlap++;
        }
        if (overlap != 0) {
            problems.add("removal cohort overlaps weekly/protected on " + overlap + " symbols");
        }

        int activeBefore = activeCount(conn);
        int matchedActiveRemovals = matchActive(conn, remove);
        int affected = 0;
        int activeAfter = activeBefore;
        boolean mutated = false;

        if (mode == Mode.DRY_RUN) {
            if (matchedActiveRemovals != UniverseDisposition.EXPECTED_CANONICAL_REMOVE) {
                problems.add("dry-run: active removal matches " + matchedActiveRemovals
                    + " != expected " + UniverseDisposition.EXPECTED_CANONICAL_REMOVE);
            }
            return new Result(mode, disposition.generation(), disposition.reportIdentity(),
                disposition.reportSha256(), ts, remove.size(), weekly.size(), protectedSet.size(),
                activeBefore, matchedActiveRemovals, overlap, 0, activeAfter, false, problems);
        }

        if (mode == Mode.APPLY) {
            if (matchedActiveRemovals != UniverseDisposition.EXPECTED_CANONICAL_REMOVE) {
                problems.add("apply refused: active removal matches " + matchedActiveRemovals
                    + " != expected " + UniverseDisposition.EXPECTED_CANONICAL_REMOVE);
            }
            if (!problems.isEmpty()) {
                return new Result(mode, disposition.generation(), disposition.reportIdentity(),
                    disposition.reportSha256(), ts, remove.size(), weekly.size(), protectedSet.size(),
                    activeBefore, matchedActiveRemovals, overlap, 0, activeAfter, false, problems);
            }
            boolean prevAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);
            try {
                affected = applyRemovals(conn, remove, ts);
                if (affected != UniverseDisposition.EXPECTED_CANONICAL_REMOVE) {
                    conn.rollback();
                    problems.add("apply rolled back: affected " + affected + " != 340");
                } else {
                    conn.commit();
                    mutated = true;
                }
            } catch (SQLException e) {
                conn.rollback();
                problems.add("apply rolled back on error: " + e.getMessage());
            } finally {
                conn.setAutoCommit(prevAutoCommit);
            }
        } else { // ROLLBACK
            int matchedRemoved = matchRemoved(conn, remove);
            boolean prevAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);
            try {
                affected = clearRemovals(conn, remove);
                if (affected != matchedRemoved) {
                    conn.rollback();
                    problems.add("rollback aborted: affected " + affected + " != removed-count " + matchedRemoved);
                } else {
                    conn.commit();
                    mutated = affected > 0;
                }
            } catch (SQLException e) {
                conn.rollback();
                problems.add("rollback aborted on error: " + e.getMessage());
            } finally {
                conn.setAutoCommit(prevAutoCommit);
            }
        }

        activeAfter = activeCount(conn);
        return new Result(mode, disposition.generation(), disposition.reportIdentity(),
            disposition.reportSha256(), ts, remove.size(), weekly.size(), protectedSet.size(),
            activeBefore, matchedActiveRemovals, overlap, affected, activeAfter, mutated, problems);
    }

    /** Set removed_at for exactly the active frozen removal symbols. Returns affected row count. */
    private static int applyRemovals(Connection conn, Set<String> remove, String ts) throws SQLException {
        int affected = 0;
        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE symbols SET removed_at = ? WHERE symbol = ? AND removed_at IS NULL")) {
            for (String s : remove) {
                ps.setString(1, ts);
                ps.setString(2, s);
                affected += ps.executeUpdate();
            }
        }
        return affected;
    }

    /** Clear removed_at for exactly the frozen removal symbols. Returns affected row count. */
    private static int clearRemovals(Connection conn, Set<String> remove) throws SQLException {
        int affected = 0;
        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE symbols SET removed_at = NULL WHERE symbol = ? AND removed_at IS NOT NULL")) {
            for (String s : remove) {
                ps.setString(1, s);
                affected += ps.executeUpdate();
            }
        }
        return affected;
    }

    private static String json(Result r) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"mode\": \"").append(r.mode()).append("\",\n");
        sb.append("  \"generation\": \"").append(r.generation()).append("\",\n");
        sb.append("  \"reportIdentity\": \"").append(r.reportIdentity()).append("\",\n");
        sb.append("  \"reportSha256\": \"").append(r.reportSha256()).append("\",\n");
        sb.append("  \"timestamp\": \"").append(r.timestamp()).append("\",\n");
        sb.append("  \"canonicalRemoveCohort\": ").append(r.canonicalRemoveCohort()).append(",\n");
        sb.append("  \"weeklyCohort\": ").append(r.weeklyCohort()).append(",\n");
        sb.append("  \"protectedCohort\": ").append(r.protectedCohort()).append(",\n");
        sb.append("  \"activeBefore\": ").append(r.activeBefore()).append(",\n");
        sb.append("  \"matchedActiveRemovals\": ").append(r.matchedActiveRemovals()).append(",\n");
        sb.append("  \"overlapWithProtectedOrWeekly\": ").append(r.overlapWithProtectedOrWeekly()).append(",\n");
        sb.append("  \"affectedRows\": ").append(r.affectedRows()).append(",\n");
        sb.append("  \"activeAfter\": ").append(r.activeAfter()).append(",\n");
        sb.append("  \"mutated\": ").append(r.mutated()).append(",\n");
        sb.append("  \"ok\": ").append(r.ok()).append(",\n");
        sb.append("  \"problems\": [");
        for (int i = 0; i < r.problems().size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("\"").append(r.problems().get(i).replace("\"", "\\\"")).append("\"");
        }
        sb.append("]\n}");
        return sb.toString();
    }

    /**
     * CLI entry point.
     *
     * <pre>
     *   DispositionApplier &lt;artifactCsvPath&gt; &lt;dbPath&gt; [--apply|--rollback]
     * </pre>
     * Default (no flag) is dry-run. Exit code 0 on success (ok), 1 on refusal / problems.
     */
    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: DispositionApplier <artifactCsvPath> <dbPath> [--apply|--rollback]");
            System.exit(2);
            return;
        }
        String artifactPath = args[0];
        String dbPath = args[1];
        Mode mode = Mode.DRY_RUN;
        for (int i = 2; i < args.length; i++) {
            if ("--apply".equals(args[i])) mode = Mode.APPLY;
            else if ("--rollback".equals(args[i])) mode = Mode.ROLLBACK;
        }

        UniverseDisposition disposition = UniverseDisposition.load(java.nio.file.Path.of(artifactPath));
        DispositionApplier applier = new DispositionApplier(disposition);

        if (mode != Mode.DRY_RUN) {
            System.err.println("[applier] " + mode + " mode — ensure a database backup exists before proceeding.");
        }

        try (Connection conn = DatabaseManager.open(dbPath)) {
            Result r = applier.run(conn, mode);
            System.out.println(json(r));
            System.exit(r.ok() ? 0 : 1);
        }
    }
}
