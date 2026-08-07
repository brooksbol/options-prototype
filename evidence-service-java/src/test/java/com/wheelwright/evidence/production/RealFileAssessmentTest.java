package com.wheelwright.evidence.production;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.io.FileInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/**
 * Observation run against the complete original Fidelity Activity History export.
 *
 * This is NOT a regression test — it observes and reports what the assessor
 * produces from the full unmodified export. Run manually with:
 *   -DrunRealFile=true -DrealFilePath=/path/to/History-for-Account.csv
 *
 * The purpose is to verify that the machinery survives the complete messy
 * export and to observe the actual July production figure.
 */
@EnabledIfSystemProperty(named = "runRealFile", matches = "true")
class RealFileAssessmentTest {

    @Test
    @DisplayName("assess July 2026 from complete original Fidelity export")
    void assessRealFile() throws Exception {
        String path = System.getProperty("realFilePath");
        if (path == null || path.isBlank()) {
            throw new IllegalStateException("Set -DrealFilePath=/path/to/file.csv");
        }

        FidelityActivityParser parser = new FidelityActivityParser();
        ProductionAssessor assessor = new ProductionAssessor();

        List<FidelityActivityRow> rows;
        try (InputStream is = new FileInputStream(path)) {
            rows = parser.parse(is);
        }

        System.out.println("=== REAL FILE ASSESSMENT ===");
        System.out.println("Rows parsed: " + rows.size());
        System.out.println("Date range: " + rows.get(0).runDate() + " to " + rows.get(rows.size() - 1).runDate());

        ProductionAssessment result = assessor.assess(rows, YearMonth.of(2026, 7));

        System.out.println("\n--- July 2026 Production Assessment ---");
        System.out.println("Status: " + result.status());
        System.out.println("Known Cash Production: $" + result.knownCashProduction());
        System.out.println("Unresolved Potential:  $" + result.unresolvedPotentialProduction());
        System.out.println("Realized Erosion:      $" + result.realizedCapitalErosion());

        System.out.println("\nBreakdown:");
        result.productionBreakdown().forEach((source, amount) ->
            System.out.println("  " + source + ": $" + amount));

        System.out.println("\nReconciliation Issues (" + result.issues().size() + "):");
        for (var issue : result.issues()) {
            System.out.println("  [" + issue.type() + "] " + issue.description() +
                (issue.potentialImpact() != null ? " ($" + issue.potentialImpact() + ")" : ""));
        }

        if (!result.erosionEvents().isEmpty()) {
            System.out.println("\nErosion Events:");
            for (var event : result.erosionEvents()) {
                System.out.println("  " + event.date() + " " + event.symbol() + ": $" + event.amount() +
                    " — " + event.description());
            }
        }

        System.out.println("\nTransaction Summary:");
        System.out.println("  Included: " + result.transactionSummary().included());
        System.out.println("  Excluded: " + result.transactionSummary().excluded());
        System.out.println("  Uncertain: " + result.transactionSummary().uncertain());
        System.out.println("  Not applicable: " + result.transactionSummary().notApplicable());

        // Report any unclassified
        var unclassified = result.transactions().stream()
            .filter(t -> t.components().stream().anyMatch(c -> c.type() == ComponentType.UNRESOLVED &&
                c.derivation().startsWith("Unclassified")))
            .toList();
        if (!unclassified.isEmpty()) {
            System.out.println("\nUNCLASSIFIED ACTIONS (" + unclassified.size() + "):");
            for (var tx : unclassified) {
                System.out.println("  " + tx.date() + ": " + tx.action());
            }
        }

        System.out.println("\n=== END ===");
    }
}
