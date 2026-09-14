package com.wheelwright.evidence.universe;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Machine-readable generation-29066 universe disposition — loader and independent validator.
 *
 * <p>This type reads the frozen disposition artifact ({@code data/universe/disposition-gen29066.csv})
 * and validates it <em>independently of the Markdown report</em>. It is the authoritative
 * machine-readable source for the generation-29066 servicing policy. Runtime code and tests
 * consume this loader; nothing parses the human-readable Markdown report.
 *
 * <p><strong>What this type is not.</strong> It does not change scheduler behavior, touch the
 * database, call the provider, or encode the 827-symbol membership in Java source. The membership
 * lives in the CSV data artifact; this loader merely reads and validates it. Loading and validating
 * the disposition performs zero provider calls and zero evidence mutation.
 *
 * <p><strong>Frozen policy.</strong> The cohorts are frozen from the generation-29066 analysis.
 * This loader never recomputes, refreshes, substitutes, or regenerates them. Validation fails
 * loudly ({@link DispositionValidationException}) on malformed data rather than silently repairing.
 */
public final class UniverseDisposition {

    /** Expected cohort sizes for generation 29066 (frozen). */
    public static final int EXPECTED_CANONICAL_REMOVE = 340;
    public static final int EXPECTED_WEEKLY_REFRESH = 487;
    public static final int EXPECTED_NORMAL_PROTECTED = 84;

    public static final String EXPECTED_GENERATION = "29066";
    public static final String EXPECTED_REPORT_IDENTITY = "wheelwright-universe-disposition-gen29066.md";

    /** The valid disposition values. Any other value is rejected. */
    public enum Disposition {
        CANONICAL_REMOVE,
        WEEKLY_REFRESH,
        NORMAL_PROTECTED
    }

    private static final String DEFAULT_PATH = "../data/universe/disposition-gen29066.csv";

    private static final List<String> REQUIRED_HEADERS = List.of(
        "symbol", "disposition", "evidence_generation", "effective_date",
        "report_identity", "report_sha256", "predicate_version", "disposition_reason"
    );

    private final Map<String, Disposition> bySymbol;
    private final Set<String> canonicalRemove;
    private final Set<String> weeklyRefresh;
    private final Set<String> normalProtected;
    private final String generation;
    private final String reportIdentity;
    private final String reportSha256;
    private final String predicateVersion;

    private UniverseDisposition(
            Map<String, Disposition> bySymbol,
            Set<String> canonicalRemove,
            Set<String> weeklyRefresh,
            Set<String> normalProtected,
            String generation,
            String reportIdentity,
            String reportSha256,
            String predicateVersion) {
        this.bySymbol = Collections.unmodifiableMap(bySymbol);
        this.canonicalRemove = Collections.unmodifiableSet(canonicalRemove);
        this.weeklyRefresh = Collections.unmodifiableSet(weeklyRefresh);
        this.normalProtected = Collections.unmodifiableSet(normalProtected);
        this.generation = generation;
        this.reportIdentity = reportIdentity;
        this.reportSha256 = reportSha256;
        this.predicateVersion = predicateVersion;
    }

    /** Load and validate from the default artifact path. */
    public static UniverseDisposition load() {
        return load(Path.of(DEFAULT_PATH));
    }

    /**
     * Load and validate the disposition artifact at an explicit path.
     *
     * @throws DispositionValidationException if the artifact is missing, malformed, or fails
     *         any structural or count invariant.
     */
    public static UniverseDisposition load(Path csvPath) {
        List<String> lines;
        try {
            lines = Files.readAllLines(csvPath);
        } catch (IOException e) {
            throw new DispositionValidationException(
                "Cannot read disposition artifact at " + csvPath + ": " + e.getMessage());
        }
        return parse(lines, csvPath.toString());
    }

    /** Parse and validate from raw CSV lines (used by tests and {@link #load(Path)}). */
    public static UniverseDisposition parse(List<String> lines, String source) {
        if (lines.isEmpty()) {
            throw new DispositionValidationException("Disposition artifact is empty: " + source);
        }

        List<String> header = splitCsv(lines.get(0));
        if (!header.equals(REQUIRED_HEADERS)) {
            throw new DispositionValidationException(
                "Disposition artifact header mismatch. Expected " + REQUIRED_HEADERS + " but got " + header);
        }

        Map<String, Disposition> bySymbol = new LinkedHashMap<>();
        Set<String> remove = new LinkedHashSet<>();
        Set<String> weekly = new LinkedHashSet<>();
        Set<String> protect = new LinkedHashSet<>();

        String generation = null;
        String reportIdentity = null;
        String reportSha256 = null;
        String predicateVersion = null;

        for (int i = 1; i < lines.size(); i++) {
            String raw = lines.get(i);
            if (raw.isBlank()) {
                continue;
            }
            List<String> cols = splitCsv(raw);
            if (cols.size() != REQUIRED_HEADERS.size()) {
                throw new DispositionValidationException(
                    "Row " + (i + 1) + " has " + cols.size() + " columns, expected "
                        + REQUIRED_HEADERS.size() + ": " + raw);
            }

            String symbol = cols.get(0).trim();
            String dispRaw = cols.get(1).trim();
            String gen = cols.get(2).trim();
            String reportId = cols.get(4).trim();
            String sha = cols.get(5).trim();
            String predicate = cols.get(6).trim();

            if (symbol.isEmpty()) {
                throw new DispositionValidationException("Row " + (i + 1) + " has an empty symbol");
            }

            // Provenance must be present and consistent on every record.
            if (gen.isEmpty()) {
                throw new DispositionValidationException("Row " + (i + 1) + " (" + symbol + ") is missing evidence_generation");
            }
            if (reportId.isEmpty()) {
                throw new DispositionValidationException("Row " + (i + 1) + " (" + symbol + ") is missing report_identity");
            }
            if (sha.isEmpty()) {
                throw new DispositionValidationException("Row " + (i + 1) + " (" + symbol + ") is missing report_sha256");
            }
            if (predicate.isEmpty()) {
                throw new DispositionValidationException("Row " + (i + 1) + " (" + symbol + ") is missing predicate_version");
            }

            Disposition disp;
            try {
                disp = Disposition.valueOf(dispRaw);
            } catch (IllegalArgumentException ex) {
                throw new DispositionValidationException(
                    "Row " + (i + 1) + " (" + symbol + ") has unknown disposition '" + dispRaw + "'");
            }

            if (bySymbol.containsKey(symbol)) {
                throw new DispositionValidationException(
                    "Symbol " + symbol + " appears more than once (duplicate or cross-cohort overlap)");
            }
            bySymbol.put(symbol, disp);
            switch (disp) {
                case CANONICAL_REMOVE -> remove.add(symbol);
                case WEEKLY_REFRESH -> weekly.add(symbol);
                case NORMAL_PROTECTED -> protect.add(symbol);
            }

            // Provenance must be uniform across the whole artifact.
            if (generation == null) {
                generation = gen;
                reportIdentity = reportId;
                reportSha256 = sha;
                predicateVersion = predicate;
            } else {
                if (!generation.equals(gen)) {
                    throw new DispositionValidationException(
                        "Inconsistent evidence_generation: '" + generation + "' vs '" + gen + "' at row " + (i + 1));
                }
                if (!reportIdentity.equals(reportId)) {
                    throw new DispositionValidationException(
                        "Inconsistent report_identity at row " + (i + 1));
                }
                if (!reportSha256.equals(sha)) {
                    throw new DispositionValidationException(
                        "Inconsistent report_sha256 at row " + (i + 1));
                }
            }
        }

        // Count invariants (independent of the Markdown report).
        if (remove.size() != EXPECTED_CANONICAL_REMOVE) {
            throw new DispositionValidationException(
                "CANONICAL_REMOVE count " + remove.size() + " != expected " + EXPECTED_CANONICAL_REMOVE);
        }
        if (weekly.size() != EXPECTED_WEEKLY_REFRESH) {
            throw new DispositionValidationException(
                "WEEKLY_REFRESH count " + weekly.size() + " != expected " + EXPECTED_WEEKLY_REFRESH);
        }
        if (protect.size() != EXPECTED_NORMAL_PROTECTED) {
            throw new DispositionValidationException(
                "NORMAL_PROTECTED count " + protect.size() + " != expected " + EXPECTED_NORMAL_PROTECTED);
        }

        // Generation provenance must match the frozen identity.
        if (!EXPECTED_GENERATION.equals(generation)) {
            throw new DispositionValidationException(
                "evidence_generation '" + generation + "' != expected '" + EXPECTED_GENERATION + "'");
        }
        if (!EXPECTED_REPORT_IDENTITY.equals(reportIdentity)) {
            throw new DispositionValidationException(
                "report_identity '" + reportIdentity + "' != expected '" + EXPECTED_REPORT_IDENTITY + "'");
        }

        return new UniverseDisposition(
            bySymbol, remove, weekly, protect,
            generation, reportIdentity, reportSha256, predicateVersion);
    }

    /**
     * Minimal RFC-4180-style CSV field splitter supporting double-quoted fields that may contain
     * commas and escaped quotes ({@code ""}).
     */
    private static List<String> splitCsv(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        cur.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    cur.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    fields.add(cur.toString());
                    cur.setLength(0);
                } else {
                    cur.append(c);
                }
            }
        }
        fields.add(cur.toString());
        return fields;
    }

    public Set<String> canonicalRemove() {
        return canonicalRemove;
    }

    public Set<String> weeklyRefresh() {
        return weeklyRefresh;
    }

    public Set<String> normalProtected() {
        return normalProtected;
    }

    public Disposition dispositionOf(String symbol) {
        return bySymbol.get(symbol);
    }

    public int totalSymbols() {
        return bySymbol.size();
    }

    public String generation() {
        return generation;
    }

    public String reportIdentity() {
        return reportIdentity;
    }

    public String reportSha256() {
        return reportSha256;
    }

    public String predicateVersion() {
        return predicateVersion;
    }

    /** Thrown when the disposition artifact is missing, malformed, or violates a frozen invariant. */
    public static final class DispositionValidationException extends RuntimeException {
        public DispositionValidationException(String message) {
            super(message);
        }
    }
}
