package com.wheelwright.evidence.production;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests the ProductionAssessor — the orchestration layer that produces
 * the authoritative monthly production assessment from Fidelity data.
 */
class ProductionAssessorTest {

    private final FidelityActivityParser parser = new FidelityActivityParser();
    private final ProductionAssessor assessor = new ProductionAssessor();
    private List<FidelityActivityRow> fixtureRows;

    @BeforeEach
    void setUp() throws Exception {
        InputStream is = getClass().getResourceAsStream("/fixtures/fidelity-activity-july-2026.csv");
        fixtureRows = parser.parse(is);
    }

    // --- Period detection ---

    @Test
    @DisplayName("detects July 2026 as the last complete month from fixture")
    void detectsPeriod() {
        // Fixture has data through 08/03, so July is the last complete month
        YearMonth detected = assessor.detectPeriod(fixtureRows);
        assertEquals(YearMonth.of(2026, 7), detected);
    }

    // --- Known Cash Production ---

    @Test
    @DisplayName("July known production = option premium + SPAXX + Treasury discount")
    void julyKnownProduction() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));

        // Option premium: $3483.02
        // SPAXX: $142.11
        // Treasury discount: $61.80
        // Total known: $3686.93
        assertEquals(new BigDecimal("3686.93"), result.knownCashProduction());
    }

    @Test
    @DisplayName("production breakdown includes all known sources")
    void productionBreakdown() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));

        assertEquals(new BigDecimal("3483.02"), result.productionBreakdown().get(ProductionSource.OPTION_PREMIUM));
        assertEquals(new BigDecimal("142.11"), result.productionBreakdown().get(ProductionSource.MONEY_MARKET_INCOME));
        assertEquals(new BigDecimal("61.80"), result.productionBreakdown().get(ProductionSource.TREASURY_DISCOUNT));
        assertNull(result.productionBreakdown().get(ProductionSource.REALIZED_APPRECIATION));
        assertNull(result.productionBreakdown().get(ProductionSource.DIVIDEND));
    }

    // --- Unresolved Potential Production ---

    @Test
    @DisplayName("unresolved includes SPYI distribution + ACAT Treasury potential")
    void unresolvedPotential() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));

        // SPYI: $39.66 (character uncertain)
        // Treasury 912797TP2: $120.42 (basis unknown — $9000 redeemed - $8879.58 ACAT value)
        assertEquals(new BigDecimal("160.08"), result.unresolvedPotentialProduction());
    }

    // --- Realized Capital Erosion ---

    @Test
    @DisplayName("July has zero erosion (no dispositions below basis)")
    void julyZeroErosion() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        assertEquals(BigDecimal.ZERO, result.realizedCapitalErosion());
        assertTrue(result.erosionEvents().isEmpty());
    }

    // --- Reconciliation Status ---

    @Test
    @DisplayName("July status is PRODUCTION_UNCERTAIN due to unresolved items")
    void reconciliationStatus() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        assertEquals(ReconciliationStatus.PRODUCTION_UNCERTAIN, result.status());
    }

    @Test
    @DisplayName("reconciliation issues include distribution character and basis unknown")
    void reconciliationIssues() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));

        boolean hasDistributionIssue = result.issues().stream()
            .anyMatch(i -> i.type() == IssueType.DISTRIBUTION_CHARACTER_UNKNOWN);
        boolean hasBasisIssue = result.issues().stream()
            .anyMatch(i -> i.type() == IssueType.BASIS_UNKNOWN);

        assertTrue(hasDistributionIssue, "Should flag SPYI distribution character");
        assertTrue(hasBasisIssue, "Should flag Treasury ACAT basis");
    }

    // --- Period description ---

    @Test
    @DisplayName("period description is human-readable")
    void periodDescription() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        assertEquals("July 2026", result.periodDescription());
    }

    // --- Transaction summary ---

    @Test
    @DisplayName("transaction summary counts are positive and sum to period transaction count")
    void transactionSummary() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        var summary = result.transactionSummary();

        int total = summary.included() + summary.excluded() + summary.uncertain() + summary.notApplicable();
        assertTrue(total > 0);
        assertEquals(result.transactions().size(), total);
    }

    // --- Audit trail ---

    @Test
    @DisplayName("every period transaction appears in the audit trail with components")
    void auditTrail() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));

        for (var tx : result.transactions()) {
            assertNotNull(tx.id());
            assertNotNull(tx.date());
            assertNotNull(tx.role());
            assertFalse(tx.components().isEmpty(),
                "Every transaction must have at least one economic component: " + tx.action());
        }
    }

    // --- Source coverage ---

    @Test
    @DisplayName("requesting a month not covered by data produces SOURCE_INCOMPLETE")
    void sourceIncomplete() {
        // Request January 2026 — fixture starts in March
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 1));
        assertEquals(ReconciliationStatus.SOURCE_INCOMPLETE, result.status());
    }

    // --- No unclassified in fixture ---

    @Test
    @DisplayName("fixture produces no UNCLASSIFIED_ACTION issues")
    void noUnclassifiedIssues() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));

        boolean hasUnclassified = result.issues().stream()
            .anyMatch(i -> i.type() == IssueType.UNCLASSIFIED_ACTION);
        assertFalse(hasUnclassified, "Fixture should have no unclassified actions");
    }

    // --- Asymmetric invariants ---

    @Test
    @DisplayName("knownCashProduction is never negative")
    void knownProductionNonNegative() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        assertTrue(result.knownCashProduction().compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("realizedCapitalErosion is never negative")
    void erosionNonNegative() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        assertTrue(result.realizedCapitalErosion().compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("unresolvedPotentialProduction is never negative")
    void unresolvedNonNegative() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        assertTrue(result.unresolvedPotentialProduction().compareTo(BigDecimal.ZERO) >= 0);
    }
}
