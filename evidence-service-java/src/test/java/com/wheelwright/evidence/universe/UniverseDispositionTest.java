package com.wheelwright.evidence.universe;

import com.wheelwright.evidence.universe.UniverseDisposition.Disposition;
import com.wheelwright.evidence.universe.UniverseDisposition.DispositionValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Generation-29066 universe disposition artifact — validation tests.
 *
 * <p>Proves the machine-readable artifact validates <em>independently of the Markdown report</em>
 * to exactly 340 / 487 / 84, that malformed data is rejected loudly, and that loading performs
 * no provider call and no database access (the loader has no such collaborators — it reads a CSV).
 */
class UniverseDispositionTest {

    /** The real persisted artifact, relative to the module working directory. */
    private static final Path ARTIFACT = Path.of("../data/universe/disposition-gen29066.csv");

    private static final String HEADER =
        "symbol,disposition,evidence_generation,effective_date,"
        + "report_identity,report_sha256,predicate_version,disposition_reason";

    private static final String REPORT_ID = "wheelwright-universe-disposition-gen29066.md";
    private static final String SHA = "eb540354ef87f794d0f7c5052cb84dd4cb7ac2e5e9c7b4dd78713d5700eda49e";

    private static String row(String symbol, String disposition) {
        return String.join(",",
            symbol, disposition, "29066", "2026-09-14",
            REPORT_ID, SHA, "gen29066-v1", "\"reason, with comma\"");
    }

    // ── Real artifact ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Real persisted artifact")
    class RealArtifact {

        @Test
        @DisplayName("loads and validates to exactly 340 / 487 / 84")
        void exactCounts() {
            UniverseDisposition d = UniverseDisposition.load(ARTIFACT);
            assertEquals(340, d.canonicalRemove().size(), "CANONICAL_REMOVE");
            assertEquals(487, d.weeklyRefresh().size(), "WEEKLY_REFRESH");
            assertEquals(84, d.normalProtected().size(), "NORMAL_PROTECTED");
            assertEquals(911, d.totalSymbols(), "total distinct symbols");
        }

        @Test
        @DisplayName("cohorts are disjoint (no symbol in two cohorts)")
        void disjointCohorts() {
            UniverseDisposition d = UniverseDisposition.load(ARTIFACT);
            var remove = d.canonicalRemove();
            var weekly = d.weeklyRefresh();
            var protect = d.normalProtected();
            assertTrue(disjoint(remove, weekly), "remove ∩ weekly must be empty");
            assertTrue(disjoint(remove, protect), "remove ∩ protect must be empty");
            assertTrue(disjoint(weekly, protect), "weekly ∩ protect must be empty");
        }

        @Test
        @DisplayName("dedup union of remove+weekly is 827")
        void unionRemovedFromRoutineServicing() {
            UniverseDisposition d = UniverseDisposition.load(ARTIFACT);
            var union = new java.util.HashSet<>(d.canonicalRemove());
            union.addAll(d.weeklyRefresh());
            assertEquals(827, union.size());
        }

        @Test
        @DisplayName("carries generation-29066 identity and report checksum on the artifact")
        void carriesProvenance() {
            UniverseDisposition d = UniverseDisposition.load(ARTIFACT);
            assertEquals("29066", d.generation());
            assertEquals(REPORT_ID, d.reportIdentity());
            assertEquals(SHA, d.reportSha256());
            assertEquals("gen29066-v1", d.predicateVersion());
        }

        @Test
        @DisplayName("the persisted human-readable report checksum matches the artifact's recorded report_sha256")
        void reportChecksumMatchesArtifact() throws Exception {
            UniverseDisposition d = UniverseDisposition.load(ARTIFACT);
            Path report = Path.of("../docs/universe/disposition/wheelwright-universe-disposition-gen29066.md");
            byte[] bytes = Files.readAllBytes(report);
            String actual = sha256(bytes);
            assertEquals(d.reportSha256(), actual,
                "persisted Markdown report checksum must equal the artifact's report_sha256 (shared gen-29066 identity)");
        }

        @Test
        @DisplayName("dispositionOf returns the right cohort for representative symbols")
        void dispositionLookup() {
            UniverseDisposition d = UniverseDisposition.load(ARTIFACT);
            assertEquals(Disposition.CANONICAL_REMOVE, d.dispositionOf("AADR"));
            assertEquals(Disposition.WEEKLY_REFRESH, d.dispositionOf("ABFL"));
            assertEquals(Disposition.NORMAL_PROTECTED, d.dispositionOf("AIA"));
            assertNull(d.dispositionOf("SPY"), "unlisted symbol has no disposition");
        }
    }

    // ── Malformed rejection ──────────────────────────────────────────────────

    @Nested
    @DisplayName("Malformed artifacts are rejected loudly")
    class Rejection {

        @Test
        @DisplayName("duplicate symbol within a cohort is rejected")
        void duplicateSymbol() {
            List<String> lines = new ArrayList<>();
            lines.add(HEADER);
            lines.add(row("AADR", "CANONICAL_REMOVE"));
            lines.add(row("AADR", "CANONICAL_REMOVE"));
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("more than once"));
        }

        @Test
        @DisplayName("cross-cohort overlap (same symbol, two dispositions) is rejected")
        void crossCohortOverlap() {
            List<String> lines = new ArrayList<>();
            lines.add(HEADER);
            lines.add(row("AADR", "CANONICAL_REMOVE"));
            lines.add(row("AADR", "WEEKLY_REFRESH"));
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("more than once"));
        }

        @Test
        @DisplayName("unknown disposition value is rejected")
        void unknownDisposition() {
            List<String> lines = new ArrayList<>();
            lines.add(HEADER);
            lines.add(row("AADR", "DORMANT"));
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("unknown disposition"));
        }

        @Test
        @DisplayName("missing evidence_generation provenance is rejected")
        void missingGeneration() {
            List<String> lines = new ArrayList<>();
            lines.add(HEADER);
            lines.add(String.join(",",
                "AADR", "CANONICAL_REMOVE", "", "2026-09-14",
                REPORT_ID, SHA, "gen29066-v1", "reason"));
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("evidence_generation"));
        }

        @Test
        @DisplayName("missing report_identity is rejected")
        void missingReportIdentity() {
            List<String> lines = new ArrayList<>();
            lines.add(HEADER);
            lines.add(String.join(",",
                "AADR", "CANONICAL_REMOVE", "29066", "2026-09-14",
                "", SHA, "gen29066-v1", "reason"));
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("report_identity"));
        }

        @Test
        @DisplayName("wrong count (accidental omission) is rejected")
        void wrongCount() {
            List<String> lines = new ArrayList<>();
            lines.add(HEADER);
            lines.add(row("AADR", "CANONICAL_REMOVE")); // only 1 remove, not 340
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("CANONICAL_REMOVE count"));
        }

        @Test
        @DisplayName("header mismatch is rejected")
        void headerMismatch() {
            List<String> lines = new ArrayList<>();
            lines.add("symbol,disposition"); // truncated header
            lines.add(row("AADR", "CANONICAL_REMOVE"));
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("header mismatch"));
        }

        @Test
        @DisplayName("inconsistent generation across rows is rejected")
        void inconsistentGeneration() {
            List<String> lines = new ArrayList<>();
            lines.add(HEADER);
            lines.add(row("AADR", "CANONICAL_REMOVE"));
            lines.add(String.join(",",
                "AAVM", "CANONICAL_REMOVE", "99999", "2026-09-14",
                REPORT_ID, SHA, "gen29066-v1", "reason"));
            var ex = assertThrows(DispositionValidationException.class,
                () -> UniverseDisposition.parse(lines, "test"));
            assertTrue(ex.getMessage().contains("Inconsistent evidence_generation"));
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static boolean disjoint(java.util.Set<String> a, java.util.Set<String> b) {
        for (String s : a) {
            if (b.contains(s)) {
                return false;
            }
        }
        return true;
    }

    private static String sha256(byte[] bytes) throws Exception {
        var md = java.security.MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
