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

    // --- Net Strategy Result ---

    @Test
    @DisplayName("netStrategyResult equals option premium when no appreciation or erosion")
    void netStrategyResultPremiumOnly() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        // July: premium $3483.02, no realized appreciation, no erosion
        // Net Strategy Result = $3483.02 - $0 = $3483.02
        assertEquals(new BigDecimal("3483.02"), result.netStrategyResult());
    }

    @Test
    @DisplayName("INVARIANT: netStrategyResult excludes MONEY_MARKET_INCOME")
    void netStrategyResultExcludesSpaxx() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        // July knownProduction = $3686.93 (includes $142.11 SPAXX + $61.80 Treasury)
        // Net Strategy Result must be less than knownCashProduction
        assertTrue(result.netStrategyResult().compareTo(result.knownCashProduction()) < 0,
            "Net Strategy Result must exclude structural income");
        // Specifically: $3686.93 - $142.11 (SPAXX) - $61.80 (Treasury) = $3483.02
        assertEquals(new BigDecimal("3483.02"), result.netStrategyResult());
    }

    @Test
    @DisplayName("INVARIANT: netStrategyResult excludes TREASURY_DISCOUNT")
    void netStrategyResultExcludesTreasury() {
        ProductionAssessment result = assessor.assess(fixtureRows, YearMonth.of(2026, 7));
        BigDecimal treasuryDiscount = result.productionBreakdown().get(ProductionSource.TREASURY_DISCOUNT);
        assertNotNull(treasuryDiscount);
        // If we added Treasury to netStrategyResult, it would be higher
        assertTrue(result.netStrategyResult().compareTo(
            result.netStrategyResult().add(treasuryDiscount)) < 0,
            "Treasury discount must not be included in Net Strategy Result");
    }

    // --- Issue #12: unresolved called-away basis must make reconciliation visibly uncertain ---

    private FidelityActivityRow row(java.time.LocalDate date, FidelityTransactionKind kindHintUnusedForParser,
                                    String action, String symbol, BigDecimal price, BigDecimal qty, BigDecimal amount) {
        // NOTE: ProductionAssessor classifies from the action text via TransactionClassifier;
        // the kind hint is not used here. Action text must match real Fidelity patterns.
        return new FidelityActivityRow(
            date, action, symbol, symbol + " description", "Cash",
            price, qty, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
            amount, null, date);
    }

    /**
     * A CALL assignment notification row. Its symbol column is the OCC option symbol, which is
     * the episode identity the backend attaches to a DispositionResult. contracts = quantity.
     */
    private FidelityActivityRow assignmentNote(java.time.LocalDate date, String underlying,
                                               int strike, String occExp, int contracts) {
        String occ = " -" + underlying + occExp + "C" + strike;
        String action = "ASSIGNED as of " + date + " CALL (" + underlying + ") ... $" + strike;
        return new FidelityActivityRow(
            date, action, occ, "CALL (" + underlying + ")", "Cash",
            null, new BigDecimal(contracts), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
            BigDecimal.ZERO, null, date);
    }

    @Test
    @DisplayName("Issue #12: BNO-shaped ambiguous called-away basis → BASIS_UNKNOWN issue + PRODUCTION_UNCERTAIN, cash total not treated as fully reconciled")
    void unresolvedCalledAwayBasis_makesReconciliationVisiblyUncertain() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 2);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30); // ensure full-period coverage bookend

        // Two direct BNO purchases at DIFFERING prices (ambiguous attribution)
        var buy1 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("50.71"), new BigDecimal("100"), new BigDecimal("-5071"));
        var buy2 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("53.09"), new BigDecimal("100"), new BigDecimal("-5309"));
        // Called away: 200 shares at $54 net proceeds
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-02-26 BNO", "BNO",
            new BigDecimal("54"), new BigDecimal("-200"), new BigDecimal("10799.77"));
        // Period bookend so coverage is not flagged incomplete
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX",
            null, BigDecimal.ZERO, new BigDecimal("1.00"));

        var rows = List.of(buy1, buy2, sale, bookend);
        ProductionAssessment result = assessor.assess(rows, YearMonth.of(2026, 9));

        // A BASIS_UNKNOWN reconciliation issue must be raised for the disposition
        boolean hasBasisIssue = result.issues().stream()
            .anyMatch(i -> i.type() == IssueType.BASIS_UNKNOWN
                && i.description().contains("BNO")
                && i.description().toLowerCase().contains("called-away"));
        assertTrue(hasBasisIssue, "Unresolved called-away basis must raise a BASIS_UNKNOWN reconciliation issue");

        // Status must reflect uncertainty — not FULLY_RECONCILED
        assertEquals(ReconciliationStatus.PRODUCTION_UNCERTAIN, result.status(),
            "Unresolved realized economics must not present as fully reconciled");

        // No fabricated realized appreciation/erosion from the ambiguous disposition
        assertEquals(BigDecimal.ZERO, result.realizedCapitalErosion(),
            "Ambiguous basis must not fabricate erosion");
        assertNull(result.productionBreakdown().get(ProductionSource.REALIZED_APPRECIATION),
            "Ambiguous basis must not fabricate realized appreciation");
    }

    // --- Backend-authoritative DispositionResult (semantic ownership) ---

    @Test
    @DisplayName("DispositionResult: BNO multi-disposition — each associates to its own episode (distinct episodeKey); economics independent")
    void dispositionResults_bnoMultiDisposition_distinctAndIndependent() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Four BNO direct purchases at DIFFERING prices → acquisition economics ambiguous.
        var b1 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("50.71"), new BigDecimal("100"), new BigDecimal("-5071"));
        var b2 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("52.13"), new BigDecimal("100"), new BigDecimal("-5213"));
        var b3 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("53.05"), new BigDecimal("100"), new BigDecimal("-5305"));
        var b4 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("53.09"), new BigDecimal("100"), new BigDecimal("-5309"));
        // Assignment notifications establish the episode association: $51×1 and $54×2.
        var n51 = assignmentNote(d2, "BNO", 51, "260904", 1);
        var n54 = assignmentNote(d2, "BNO", 54, "260904", 2);
        // Two same-day called-away dispositions: 100 @ $51 and 200 @ $54.
        var s51 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 BNO", "BNO", new BigDecimal("51"), new BigDecimal("-100"), new BigDecimal("5099.89"));
        var s54 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 BNO", "BNO", new BigDecimal("54"), new BigDecimal("-200"), new BigDecimal("10799.77"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(b1, b2, b3, b4, n51, n54, s51, s54, bookend), YearMonth.of(2026, 9));

        List<DispositionResult> disps = result.dispositionResults();
        assertEquals(2, disps.size(), "each called-away disposition gets its own result");

        DispositionResult r51 = disps.stream().filter(d -> d.quantity().compareTo(new BigDecimal("100")) == 0).findFirst().orElseThrow();
        DispositionResult r54 = disps.stream().filter(d -> d.quantity().compareTo(new BigDecimal("200")) == 0).findFirst().orElseThrow();

        // Association: distinct backend-established episode keys — never cross-assigned.
        assertEquals("-BNO260904C51", r51.contractActivityKey());
        assertEquals("-BNO260904C54", r54.contractActivityKey());
        assertNotEquals(r51.contractActivityKey(), r54.contractActivityKey());

        // Net proceeds are distinct and exact per disposition.
        assertEquals(0, r51.netSaleProceeds().compareTo(new BigDecimal("5099.89")));
        assertEquals(0, r54.netSaleProceeds().compareTo(new BigDecimal("10799.77")));

        // Acquisition economics are ambiguous (multi-price) → PARTIAL, no fabricated cash/gain/loss.
        assertEquals(DispositionResult.DispositionEconomicState.PARTIAL, r51.state());
        assertEquals(DispositionResult.DispositionEconomicState.PARTIAL, r54.state());
        assertNull(r51.attributableAcquisitionCash());
        assertNull(r54.realizedAppreciation());
        assertNull(r54.realizedErosion());
    }

    @Test
    @DisplayName("DispositionResult: two identical same-day assignments (same qty) → association UNRESOLVED, not cross-assigned")
    void dispositionResults_identicalSameDayAssignments_unresolvedAssociation() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Two DISTINCT assigned calls at the SAME strike/qty on the same day (e.g. two separate
        // 100-share $50 calls). The two 100-share sales cannot be uniquely attributed to a
        // specific notification — association must be UNRESOLVED, never guessed.
        var buy = row(d1, null, "YOU BOUGHT DUP", "DUP", new BigDecimal("45"), new BigDecimal("200"), new BigDecimal("-9000"));
        var n1 = assignmentNote(d2, "DUP", 50, "260904", 1);
        var n2 = assignmentNote(d2, "DUP", 50, "260904", 1);
        var s1 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 DUP", "DUP", new BigDecimal("50"), new BigDecimal("-100"), new BigDecimal("5000"));
        var s2 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 DUP", "DUP", new BigDecimal("50"), new BigDecimal("-100"), new BigDecimal("5000"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, n1, n2, s1, s2, bookend), YearMonth.of(2026, 9));

        // Both dispositions: association not unique → UNRESOLVED, no episodeKey, no economics.
        for (DispositionResult r : result.dispositionResults()) {
            assertNull(r.contractActivityKey(), "ambiguous same-day identical assignments must not be cross-assigned");
            assertEquals(DispositionResult.DispositionEconomicState.UNRESOLVED, r.state());
            assertNull(r.realizedAppreciation());
            assertNull(r.realizedErosion());
        }
    }

    @Test
    @DisplayName("DispositionResult: two notification rows for SAME OCC key + one 200-share sale → ONE valid association")
    void dispositionResults_repeatedNotifications_singleLargerSale_oneAssociation() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Two notification ROWS for the same OCC episode (1 contract each) = one 200-share episode.
        var buy = row(d1, null, "YOU BOUGHT AGG", "AGG", new BigDecimal("50"), new BigDecimal("200"), new BigDecimal("-10000"));
        var n1 = assignmentNote(d2, "AGG", 55, "260904", 1);
        var n2 = assignmentNote(d2, "AGG", 55, "260904", 1);
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 AGG", "AGG", new BigDecimal("55"), new BigDecimal("-200"), new BigDecimal("11000"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, n1, n2, sale, bookend), YearMonth.of(2026, 9));

        assertEquals(1, result.dispositionResults().size());
        DispositionResult r = result.dispositionResults().get(0);
        // Two same-OCC notification rows aggregate into ONE 200-share episode, uniquely matching the 200-share sale.
        assertEquals("-AGG260904C55", r.contractActivityKey());
        assertEquals(DispositionResult.DispositionEconomicState.RESOLVED, r.state());
        assertEquals(0, r.attributableAcquisitionCash().compareTo(new BigDecimal("10000")));
        assertEquals(0, r.realizedAppreciation().compareTo(new BigDecimal("1000")));
    }

    @Test
    @DisplayName("DispositionResult: multiple episodes + sales with a UNIQUE global solution → each associated exactly once")
    void dispositionResults_uniqueGlobalSolution() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Episode A = 100 shares ($50 strike), Episode B = 200 shares ($60 strike);
        // sale X = 100, sale Y = 200 → unique bijection by quantity.
        var buy = row(d1, null, "YOU BOUGHT GLB", "GLB", new BigDecimal("40"), new BigDecimal("300"), new BigDecimal("-12000"));
        var nA = assignmentNote(d2, "GLB", 50, "260904", 1);
        var nB = assignmentNote(d2, "GLB", 60, "260904", 2);
        var sX = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 GLB", "GLB", new BigDecimal("50"), new BigDecimal("-100"), new BigDecimal("5000"));
        var sY = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 GLB", "GLB", new BigDecimal("60"), new BigDecimal("-200"), new BigDecimal("12000"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, nA, nB, sX, sY, bookend), YearMonth.of(2026, 9));

        var r100 = result.dispositionResults().stream().filter(d -> d.quantity().compareTo(new BigDecimal("100")) == 0).findFirst().orElseThrow();
        var r200 = result.dispositionResults().stream().filter(d -> d.quantity().compareTo(new BigDecimal("200")) == 0).findFirst().orElseThrow();
        assertEquals("-GLB260904C50", r100.contractActivityKey());
        assertEquals("-GLB260904C60", r200.contractActivityKey());
        assertNotEquals(r100.contractActivityKey(), r200.contractActivityKey());
    }

    @Test
    @DisplayName("DispositionResult: multiple VALID global solutions (indistinguishable) → all affected associations UNRESOLVED")
    void dispositionResults_multipleValidSolutions_allUnresolved() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Two DISTINCT OCC episodes, each 100 shares, and two indistinguishable 100-share sales.
        // Two valid bijections exist → ambiguous → all unresolved (no deterministic permutation pick).
        var buy = row(d1, null, "YOU BOUGHT AMB", "AMB", new BigDecimal("40"), new BigDecimal("200"), new BigDecimal("-8000"));
        var nA = assignmentNote(d2, "AMB", 50, "260904", 1);
        var nB = assignmentNote(d2, "AMB", 55, "260904", 1);
        var s1 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 AMB", "AMB", new BigDecimal("52"), new BigDecimal("-100"), new BigDecimal("5200"));
        var s2 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 AMB", "AMB", new BigDecimal("52"), new BigDecimal("-100"), new BigDecimal("5200"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, nA, nB, s1, s2, bookend), YearMonth.of(2026, 9));

        for (DispositionResult r : result.dispositionResults()) {
            assertNull(r.contractActivityKey(), "multiple valid global solutions must not be resolved to a guessed mapping");
            assertEquals(DispositionResult.DispositionEconomicState.UNRESOLVED, r.state());
        }
    }

    @Test
    @DisplayName("DispositionResult: zero-gain/zero-loss disposition is RESOLVED (not PARTIAL)")
    void dispositionResults_zeroResult_resolved() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Bought 100 @ $55 net $5,500; called away 100 @ $55 net $5,500 → exactly zero result.
        var buy = row(d1, null, "YOU BOUGHT ZER", "ZER", new BigDecimal("55"), new BigDecimal("100"), new BigDecimal("-5500"));
        var note = assignmentNote(d2, "ZER", 55, "260904", 1);
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 ZER", "ZER", new BigDecimal("55"), new BigDecimal("-100"), new BigDecimal("5500"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, note, sale, bookend), YearMonth.of(2026, 9));

        DispositionResult r = result.dispositionResults().get(0);
        assertEquals("-ZER260904C55", r.contractActivityKey());
        // Knowledge/completeness invariant: association + known acquisition economics + zero g/l → RESOLVED.
        assertEquals(DispositionResult.DispositionEconomicState.RESOLVED, r.state());
        assertEquals(0, r.attributableAcquisitionCash().compareTo(new BigDecimal("5500")));
        // Sign-based: neither positive appreciation nor positive erosion component exists.
        assertNull(r.realizedAppreciation());
        assertNull(r.realizedErosion());
    }

    @Test
    @DisplayName("DispositionResult: all emitted non-null episodeKeys are globally unique within the assessment")
    void dispositionResults_episodeKeysGloballyUnique() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        var buy = row(d1, null, "YOU BOUGHT UNQ", "UNQ", new BigDecimal("40"), new BigDecimal("300"), new BigDecimal("-12000"));
        var nA = assignmentNote(d2, "UNQ", 50, "260904", 1);
        var nB = assignmentNote(d2, "UNQ", 60, "260904", 2);
        var sX = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 UNQ", "UNQ", new BigDecimal("50"), new BigDecimal("-100"), new BigDecimal("5000"));
        var sY = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 UNQ", "UNQ", new BigDecimal("60"), new BigDecimal("-200"), new BigDecimal("12000"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, nA, nB, sX, sY, bookend), YearMonth.of(2026, 9));

        List<String> keys = result.dispositionResults().stream()
            .map(DispositionResult::contractActivityKey).filter(java.util.Objects::nonNull).toList();
        assertEquals(keys.size(), keys.stream().distinct().count(), "no episodeKey may be emitted twice");
    }

    @Test
    @DisplayName("DispositionResult: no matching assignment notification → association UNRESOLVED")
    void dispositionResults_noNotification_unresolvedAssociation() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        var buy = row(d1, null, "YOU BOUGHT NON", "NON", new BigDecimal("50"), new BigDecimal("100"), new BigDecimal("-5000"));
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 NON", "NON", new BigDecimal("55"), new BigDecimal("-100"), new BigDecimal("5500"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, sale, bookend), YearMonth.of(2026, 9));

        DispositionResult r = result.dispositionResults().get(0);
        assertNull(r.contractActivityKey());
        assertEquals(DispositionResult.DispositionEconomicState.UNRESOLVED, r.state());
    }

    @Test
    @DisplayName("DispositionResult: episodeKey maps to exactly one result; no result attaches to two episodes")
    void dispositionResults_episodeKeyUniqueMapping() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        var b1 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("50.71"), new BigDecimal("100"), new BigDecimal("-5071"));
        var b2 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("52.13"), new BigDecimal("100"), new BigDecimal("-5213"));
        var b3 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("53.05"), new BigDecimal("100"), new BigDecimal("-5305"));
        var b4 = row(d1, null, "YOU BOUGHT BNO", "BNO", new BigDecimal("53.09"), new BigDecimal("100"), new BigDecimal("-5309"));
        var n51 = assignmentNote(d2, "BNO", 51, "260904", 1);
        var n54 = assignmentNote(d2, "BNO", 54, "260904", 2);
        var s51 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 BNO", "BNO", new BigDecimal("51"), new BigDecimal("-100"), new BigDecimal("5099.89"));
        var s54 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 BNO", "BNO", new BigDecimal("54"), new BigDecimal("-200"), new BigDecimal("10799.77"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(b1, b2, b3, b4, n51, n54, s51, s54, bookend), YearMonth.of(2026, 9));

        java.util.Map<String, Long> byKey = result.dispositionResults().stream()
            .filter(d -> d.contractActivityKey() != null)
            .collect(java.util.stream.Collectors.groupingBy(DispositionResult::contractActivityKey, java.util.stream.Collectors.counting()));
        byKey.forEach((k, count) -> assertEquals(1L, count, "episodeKey " + k + " must map to exactly one result"));
        assertEquals(2, byKey.size(), "two distinct episode keys");
    }

    @Test
    @DisplayName("DispositionResult: simple direct-purchase call-away resolves with appreciation/erosion + attributable cash + provenance identifies evidence")
    void dispositionResults_simpleDirectPurchase_resolved() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        var buy = row(d1, null, "YOU BOUGHT SLV", "SLV", new BigDecimal("62.50"), new BigDecimal("100"), new BigDecimal("-6250"));
        var note = assignmentNote(d2, "SLV", 59, "260904", 1);
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 SLV", "SLV", new BigDecimal("59"), new BigDecimal("-100"), new BigDecimal("5899.87"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, note, sale, bookend), YearMonth.of(2026, 9));

        assertEquals(1, result.dispositionResults().size());
        DispositionResult r = result.dispositionResults().get(0);
        assertEquals("-SLV260904C59", r.contractActivityKey());
        assertEquals(DispositionResult.DispositionEconomicState.RESOLVED, r.state());
        assertEquals(0, r.netSaleProceeds().compareTo(new BigDecimal("5899.87")));
        assertEquals(0, r.attributableAcquisitionCash().compareTo(new BigDecimal("6250.00")));
        assertEquals(0, r.realizedErosion().compareTo(new BigDecimal("350.13")));
        assertNull(r.realizedAppreciation());
        // Provenance identifies evidence (dispositionFingerprint + association), not just prose.
        assertTrue(r.provenance().contains(r.dispositionFingerprint()), "provenance must carry the dispositionFingerprint");
        assertTrue(r.provenance().contains("-SLV260904C59"), "provenance must carry the association key");
    }

    @Test
    @DisplayName("DispositionResult: put-assigned partial call-away uses quantity-correct attributable cash (no whole-lot over-attribution)")
    void dispositionResults_putAssignedPartial_quantityCorrect() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // 200 shares via put assignment @ $57.50; only 100 called away @ $54.90 net $5,490.
        var putBuy = row(d1, null, "YOU BOUGHT ASSIGNED PUTS AS OF 09-01-26 PAR", "PAR", new BigDecimal("57.5"), new BigDecimal("200"), new BigDecimal("-11500"));
        var note = assignmentNote(d2, "PAR", 55, "260904", 1);
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 PAR", "PAR", new BigDecimal("54.9"), new BigDecimal("-100"), new BigDecimal("5490"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(putBuy, note, sale, bookend), YearMonth.of(2026, 9));

        DispositionResult r = result.dispositionResults().get(0);
        assertEquals("-PAR260904C55", r.contractActivityKey());
        assertEquals(DispositionResult.DispositionEconomicState.RESOLVED, r.state());
        // attributable cash = 57.50 × 100 = 5750, NOT the full 11500.
        assertEquals(0, r.attributableAcquisitionCash().compareTo(new BigDecimal("5750")));
        assertEquals(0, r.realizedErosion().compareTo(new BigDecimal("260")));
    }

    @Test
    @DisplayName("DispositionResult: same-day group with a direct sale + a call-away, insufficient inventory → call-away PARTIAL (association still established)")
    void dispositionResults_sameDayGroupWithDirectSale_insufficient_partial() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Only 100 eligible shares before the date; same-day group = 100 (direct sale) + 100 (call-away) = 200 > 100.
        var buy = row(d1, null, "YOU BOUGHT MIX", "MIX", new BigDecimal("50"), new BigDecimal("100"), new BigDecimal("-5000"));
        var note = assignmentNote(d2, "MIX", 53, "260904", 1);
        var directSale = row(d2, null, "YOU SOLD MIX", "MIX", new BigDecimal("52"), new BigDecimal("-100"), new BigDecimal("5200"));
        var calledAway = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 MIX", "MIX", new BigDecimal("53"), new BigDecimal("-100"), new BigDecimal("5300"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, note, directSale, calledAway, bookend), YearMonth.of(2026, 9));

        DispositionResult r = result.dispositionResults().stream()
            .filter(d -> d.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE).findFirst().orElseThrow();
        // Association established (unique notification) but acquisition economics unresolved.
        assertEquals("-MIX260904C53", r.contractActivityKey());
        assertEquals(DispositionResult.DispositionEconomicState.PARTIAL, r.state(),
            "insufficient same-day group inventory → acquisition economics unresolved");
        assertNull(r.realizedAppreciation());
        assertNull(r.realizedErosion());
        // Proceeds are still known precisely.
        assertEquals(0, r.netSaleProceeds().compareTo(new BigDecimal("5300")));
    }

    @Test
    @DisplayName("DispositionResult: bad acquisition evidence (zero quantity) cannot become usable economics")
    void dispositionResults_badAcquisitionEvidence_unresolved() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Acquisition row with zero quantity — unusable for per-share attribution.
        var badBuy = row(d1, null, "YOU BOUGHT BAD", "BAD", new BigDecimal("50"), BigDecimal.ZERO, new BigDecimal("-5000"));
        var note = assignmentNote(d2, "BAD", 55, "260904", 1);
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 BAD", "BAD", new BigDecimal("55"), new BigDecimal("-100"), new BigDecimal("5500"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(badBuy, note, sale, bookend), YearMonth.of(2026, 9));

        DispositionResult r = result.dispositionResults().get(0);
        // Association established; acquisition economics unusable → PARTIAL, no fabricated cash.
        assertEquals("-BAD260904C55", r.contractActivityKey());
        assertEquals(DispositionResult.DispositionEconomicState.PARTIAL, r.state());
        assertNull(r.attributableAcquisitionCash());
    }

    @Test
    @DisplayName("Issue #12: resolvable direct-purchase called-away does NOT raise a basis-unknown issue")
    void resolvableCalledAwayBasis_noBasisUnknownIssue() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 2);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Single unambiguous direct purchase → resolvable
        var buy = row(d1, null, "YOU BOUGHT SLV", "SLV", new BigDecimal("62.50"), new BigDecimal("100"), new BigDecimal("-6250"));
        var sale = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-02-26 SLV", "SLV",
            new BigDecimal("59"), new BigDecimal("-100"), new BigDecimal("5899.87"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX",
            null, BigDecimal.ZERO, new BigDecimal("1.00"));

        var rows = List.of(buy, sale, bookend);
        ProductionAssessment result = assessor.assess(rows, YearMonth.of(2026, 9));

        boolean hasCalledAwayBasisIssue = result.issues().stream()
            .anyMatch(i -> i.type() == IssueType.BASIS_UNKNOWN
                && i.description().toLowerCase().contains("called-away"));
        assertFalse(hasCalledAwayBasisIssue,
            "Resolvable single-lot direct-purchase basis must not raise a called-away basis-unknown issue");

        // Erosion 6250 - 5899.87 = 350.13 recognized
        assertEquals(new BigDecimal("350.13"), result.realizedCapitalErosion());
    }

    // --- ADR-016 corrections: occurrence identity (#1) and assessment-wide key uniqueness (#2) ---

    @Test
    @DisplayName("ADR-016 #1: two called-away sales with an IDENTICAL content fingerprint remain distinct — neither disposition overwrites the other")
    void dispositionResults_identicalFingerprint_notOverwritten() {
        java.time.LocalDate d1 = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate d2 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // Two sale rows with the SAME runDate|action|symbol|amount → the same NormalizedTransaction.id
        // content fingerprint. Two indistinguishable same-strike/qty episodes make the association
        // ambiguous (UNRESOLVED), but the point under test is that BOTH occurrences survive as
        // distinct disposition results — the collision-prone fingerprint is not used as a map key,
        // so neither sale silently overwrites the other.
        var buy = row(d1, null, "YOU BOUGHT COL", "COL", new BigDecimal("45"), new BigDecimal("200"), new BigDecimal("-9000"));
        var n1 = assignmentNote(d2, "COL", 50, "260904", 1);
        var n2 = assignmentNote(d2, "COL", 50, "260904", 1);
        var s1 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 COL", "COL", new BigDecimal("50"), new BigDecimal("-100"), new BigDecimal("5000"));
        var s2 = row(d2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 COL", "COL", new BigDecimal("50"), new BigDecimal("-100"), new BigDecimal("5000"));
        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, n1, n2, s1, s2, bookend), YearMonth.of(2026, 9));

        // Confirm the two sale rows genuinely share the same content fingerprint (the collision the
        // correction defends against): their dispositionFingerprint (= NormalizedTransaction.id) is identical.
        List<DispositionResult> disps = result.dispositionResults();
        assertEquals(2, disps.size(), "both fingerprint-colliding sale occurrences must produce their own result (no overwrite)");
        assertEquals(disps.get(0).dispositionFingerprint(), disps.get(1).dispositionFingerprint(),
            "the two occurrences deliberately share the same content fingerprint id");
        // Both remain UNRESOLVED (indistinguishable episodes) — but crucially both are PRESENT.
        for (DispositionResult r : disps) {
            assertNull(r.contractActivityKey());
            assertEquals(DispositionResult.DispositionEconomicState.UNRESOLVED, r.state());
        }
    }

    @Test
    @DisplayName("ADR-016 #2: same OCC key in two independently-resolvable groups on different run dates → no duplicate authoritative key; both demoted to UNRESOLVED")
    void dispositionResults_sameOccAcrossRunDates_noDuplicateAuthoritativeKey() {
        java.time.LocalDate buyDate = java.time.LocalDate.of(2026, 9, 1);
        java.time.LocalDate day1 = java.time.LocalDate.of(2026, 9, 8);
        java.time.LocalDate day2 = java.time.LocalDate.of(2026, 9, 15);
        java.time.LocalDate d3 = java.time.LocalDate.of(2026, 9, 30);

        // The SAME OCC contract (-DUP260904C55) appears in two separate run-date groups, each of
        // which would resolve on its own (one 100-share episode + one 100-share sale per date). If
        // emitted verbatim, the frontend-addressable episodeKey would be duplicated → last-write-wins.
        // Assessment-wide uniqueness (ADR-016) demotes ALL claimants of the duplicated key to UNRESOLVED.
        var buy = row(buyDate, null, "YOU BOUGHT DUP", "DUP", new BigDecimal("50"), new BigDecimal("200"), new BigDecimal("-10000"));

        var n1 = assignmentNote(day1, "DUP", 55, "260904", 1);
        var s1 = row(day1, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 DUP", "DUP", new BigDecimal("55"), new BigDecimal("-100"), new BigDecimal("5500"));

        var n2 = assignmentNote(day2, "DUP", 55, "260904", 1);
        var s2 = row(day2, null, "YOU SOLD ASSIGNED CALLS AS OF 09-04-26 DUP", "DUP", new BigDecimal("55"), new BigDecimal("-100"), new BigDecimal("5500"));

        var bookend = row(d3, null, "DIVIDEND RECEIVED FIDELITY GOVERNMENT MONEY MARKET (SPAXX)", "SPAXX", null, BigDecimal.ZERO, new BigDecimal("1.00"));

        ProductionAssessment result = assessor.assess(List.of(buy, n1, s1, n2, s2, bookend), YearMonth.of(2026, 9));

        List<DispositionResult> disps = result.dispositionResults();
        assertEquals(2, disps.size());
        // No non-null episodeKey survives (the shared key was claimed twice across groups).
        List<String> nonNullKeys = disps.stream().map(DispositionResult::contractActivityKey).filter(java.util.Objects::nonNull).toList();
        assertTrue(nonNullKeys.isEmpty(), "a key claimed across two groups must not survive as an authoritative association");
        // Assessment-wide uniqueness invariant holds trivially (no duplicates because none emitted).
        assertEquals(nonNullKeys.size(), nonNullKeys.stream().distinct().count());
        for (DispositionResult r : disps) {
            assertEquals(DispositionResult.DispositionEconomicState.UNRESOLVED, r.state(),
                "both dispositions claiming the duplicated key are conservatively unresolved");
        }
    }
}
