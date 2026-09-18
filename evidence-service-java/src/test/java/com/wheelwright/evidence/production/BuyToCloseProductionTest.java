package com.wheelwright.evidence.production;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * BUG-021 — Buy-to-close (BTC) option is classified as a generic asset purchase
 * (CAPITAL_DEPLOYMENT) rather than closure of an existing short-option obligation.
 *
 * These specimens drive the FULL Production path (classify → decompose → assess) so the
 * repaired behavior is observed through the same result the Production HTTP response and the
 * Production CSV export serialize — the earliest usable integrated observation point.
 *
 * POSITIVE specimen: an unambiguous short-put lifecycle STO → BTC. The BTC closing debit must
 * reduce net realized OPTION_PREMIUM (netted against recognized premium) and must NOT be booked
 * as CAPITAL_DEPLOYMENT against the OCC symbol.
 *
 * NEGATIVE control: a genuine equity purchase remains ASSET_PURCHASE → CAPITAL_DEPLOYMENT and is
 * NOT reclassified merely because BUG-021 was repaired.
 */
class BuyToCloseProductionTest {

    private final TransactionClassifier classifier = new TransactionClassifier();
    private final TreasuryBasisResolver treasuryResolver = new TreasuryBasisResolver();
    private final EconomicDecomposer decomposer = new EconomicDecomposer(treasuryResolver);
    private final ProductionAssessor assessor = new ProductionAssessor();

    // --- Row builders (mirror the Fidelity Activity CSV shape used elsewhere) ---

    /** Sell-to-open PUT: premium received (positive net amount, quantity negative = sold). */
    private FidelityActivityRow stoPut(LocalDate date, String occSymbol, String contractDesc, BigDecimal premium) {
        return new FidelityActivityRow(
            date,
            "YOU SOLD OPENING TRANSACTION " + contractDesc + " (Cash)",
            occSymbol, contractDesc, "Cash",
            null, new BigDecimal("-1"), new BigDecimal("0.65"), new BigDecimal("0.03"), null,
            premium, null, date.plusDays(1)
        );
    }

    /** Buy-to-close PUT: closing debit paid (negative net amount, quantity positive = bought). */
    private FidelityActivityRow btcPut(LocalDate date, String occSymbol, String contractDesc, BigDecimal debit) {
        return new FidelityActivityRow(
            date,
            "YOU BOUGHT CLOSING TRANSACTION " + contractDesc + " (Cash)",
            occSymbol, contractDesc, "Cash",
            null, new BigDecimal("1"), new BigDecimal("0.65"), new BigDecimal("0.01"), null,
            debit, null, date.plusDays(1)
        );
    }

    /** Genuine equity purchase (negative control). */
    private FidelityActivityRow equityPurchase(LocalDate date, String symbol, BigDecimal cash, BigDecimal qty) {
        return new FidelityActivityRow(
            date,
            "YOU BOUGHT " + symbol + " SOME EQUITY (Cash)",
            symbol, symbol + " SOME EQUITY", "Cash",
            cash.abs().divide(qty, 2, java.math.RoundingMode.HALF_UP), qty, null, null, null,
            cash, null, date.plusDays(1)
        );
    }

    // ---- Classification ----

    @Test
    @DisplayName("BTC PUT → OPTION_BUY_TO_CLOSE_PUT (not ASSET_PURCHASE)")
    void classifiesBtcPut() {
        FidelityActivityRow row = btcPut(LocalDate.of(2026, 7, 20),
            " -EWY260821P150", "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)", new BigDecimal("-40.66"));
        assertEquals(FidelityTransactionKind.OPTION_BUY_TO_CLOSE_PUT, classifier.classify(row));
    }

    @Test
    @DisplayName("BTC CALL → OPTION_BUY_TO_CLOSE_CALL (not ASSET_PURCHASE)")
    void classifiesBtcCall() {
        FidelityActivityRow row = new FidelityActivityRow(
            LocalDate.of(2026, 7, 20),
            "YOU BOUGHT CLOSING TRANSACTION CALL (XLE) ENERGY SELECT SECTOR AUG 21 26 $90 (100 SHS) (Cash)",
            " -XLE260821C90", "CALL (XLE) ENERGY SELECT SECTOR AUG 21 26 $90 (100 SHS)", "Cash",
            null, new BigDecimal("1"), new BigDecimal("0.65"), new BigDecimal("0.01"), null,
            new BigDecimal("-25.10"), null, LocalDate.of(2026, 7, 21)
        );
        assertEquals(FidelityTransactionKind.OPTION_BUY_TO_CLOSE_CALL, classifier.classify(row));
    }

    @Test
    @DisplayName("genuine equity purchase still → ASSET_PURCHASE (negative control classification)")
    void equityPurchaseStillAssetPurchase() {
        FidelityActivityRow row = equityPurchase(LocalDate.of(2026, 7, 15), "SPYI",
            new BigDecimal("-3955.67"), new BigDecimal("74"));
        assertEquals(FidelityTransactionKind.ASSET_PURCHASE, classifier.classify(row));
    }

    // ---- Decomposition ----

    @Test
    @DisplayName("BTC decomposes to a signed OPTION_PREMIUM reduction, never CAPITAL_DEPLOYMENT")
    void btcDecomposesToPremiumReduction() {
        NormalizedTransaction btc = NormalizedTransaction.from(
            btcPut(LocalDate.of(2026, 7, 20),
                " -EWY260821P150", "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)", new BigDecimal("-40.66")),
            FidelityTransactionKind.OPTION_BUY_TO_CLOSE_PUT);

        List<EconomicComponent> components = decomposer.decompose(btc, List.of(btc));

        assertEquals(1, components.size());
        EconomicComponent c = components.get(0);
        assertEquals(ComponentType.PRODUCTION, c.type());
        assertEquals(ProductionSource.OPTION_PREMIUM, c.source());
        assertEquals(0, c.amount().compareTo(new BigDecimal("-40.66")),
            "closing debit is carried as a signed (negative) OPTION_PREMIUM reduction");
        assertEquals(Confidence.DETERMINISTIC, c.confidence());
        assertFalse(components.stream().anyMatch(x -> x.type() == ComponentType.CAPITAL_DEPLOYMENT),
            "a BTC must never be CAPITAL_DEPLOYMENT");
    }

    @Test
    @DisplayName("fail closed: BTC with no authoritative closing debit → UNRESOLVED/BASIS_UNKNOWN")
    void btcWithoutAmountFailsClosed() {
        NormalizedTransaction btc = NormalizedTransaction.from(
            new FidelityActivityRow(
                LocalDate.of(2026, 7, 20),
                "YOU BOUGHT CLOSING TRANSACTION PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS) (Cash)",
                " -EWY260821P150", "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)", "Cash",
                null, new BigDecimal("1"), null, null, null,
                null, null, LocalDate.of(2026, 7, 21)),
            FidelityTransactionKind.OPTION_BUY_TO_CLOSE_PUT);

        List<EconomicComponent> components = decomposer.decompose(btc, List.of(btc));

        assertEquals(1, components.size());
        assertEquals(ComponentType.UNRESOLVED, components.get(0).type());
        assertEquals(Confidence.BASIS_UNKNOWN, components.get(0).confidence());
    }

    // ---- Integrated Production path (earliest usable observation) ----

    @Test
    @DisplayName("POSITIVE specimen: STO→BTC nets the closing debit against recognized premium through Production")
    void positiveLifecycleNetsThroughProduction() {
        String occ = " -EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        List<FidelityActivityRow> rows = new ArrayList<>();
        rows.add(stoPut(LocalDate.of(2026, 7, 5), occ, desc, new BigDecimal("150.00")));  // credit +150
        rows.add(btcPut(LocalDate.of(2026, 7, 20), occ, desc, new BigDecimal("-40.00"))); // debit  -40

        ProductionAssessment a = assessor.assess(rows, YearMonth.of(2026, 7));

        // Net realized option premium = 150 - 40 = 110 (netted at the OPTION_PREMIUM source level).
        assertEquals(0, a.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("110.00")), "net OPTION_PREMIUM must be 150 - 40 = 110");
        assertEquals(0, a.knownCashProduction().compareTo(new BigDecimal("110.00")),
            "known cash production reflects the net premium");
        assertEquals(0, a.netStrategyResult().compareTo(new BigDecimal("110.00")),
            "Net Strategy Result reflects the closing debit");

        // No CAPITAL_DEPLOYMENT component anywhere for the BTC row.
        boolean anyCapitalDeployment = a.transactions().stream()
            .flatMap(t -> t.components().stream())
            .anyMatch(c -> c.type() == ComponentType.CAPITAL_DEPLOYMENT);
        assertFalse(anyCapitalDeployment, "BTC must not appear as CAPITAL_DEPLOYMENT in the assessment");

        // Both option rows are economically INCLUDED (option-close is not a separate lifecycle asset).
        assertEquals(2, a.transactionSummary().included(), "STO and BTC are both included option economics");
    }

    @Test
    @DisplayName("PRE-FIX contrast: net premium is strictly lower than gross opening premium")
    void closingDebitLowersNetPremiumVersusGross() {
        String occ = " -EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";

        // Gross opening premium only (as pre-fix accounting would have counted premium).
        ProductionAssessment openOnly = assessor.assess(
            List.of(stoPut(LocalDate.of(2026, 7, 5), occ, desc, new BigDecimal("150.00"))),
            YearMonth.of(2026, 7));

        // Opening + close (repaired behavior).
        ProductionAssessment withClose = assessor.assess(
            List.of(stoPut(LocalDate.of(2026, 7, 5), occ, desc, new BigDecimal("150.00")),
                    btcPut(LocalDate.of(2026, 7, 20), occ, desc, new BigDecimal("-40.00"))),
            YearMonth.of(2026, 7));

        assertEquals(0, openOnly.netStrategyResult().compareTo(new BigDecimal("150.00")));
        assertEquals(0, withClose.netStrategyResult().compareTo(new BigDecimal("110.00")));
        assertTrue(withClose.netStrategyResult().compareTo(openOnly.netStrategyResult()) < 0,
            "closing debit must reduce net strategy result relative to gross opening premium");
    }

    @Test
    @DisplayName("NEGATIVE control: genuine equity purchase stays CAPITAL_DEPLOYMENT, unaffected by BUG-021 repair")
    void negativeControlStaysCapitalDeployment() {
        List<FidelityActivityRow> rows = new ArrayList<>();
        // Provide period coverage endpoints plus a genuine equity purchase.
        rows.add(stoPut(LocalDate.of(2026, 7, 1), " -GSG260821P32",
            "PUT (GSG) ISHARES S&P GSCI AUG 21 26 $32 (100 SHS)", new BigDecimal("112.34")));
        rows.add(equityPurchase(LocalDate.of(2026, 7, 15), "SPYI", new BigDecimal("-3955.67"), new BigDecimal("74")));
        rows.add(stoPut(LocalDate.of(2026, 7, 31), " -BNO260814P50",
            "PUT (BNO) UNITED STS BRENT OIL AUG 14 26 $50 (100 SHS)", new BigDecimal("326.34")));

        ProductionAssessment a = assessor.assess(rows, YearMonth.of(2026, 7));

        // The equity purchase must be CAPITAL_DEPLOYMENT (unchanged), and its |amount| preserved.
        boolean equityIsCapitalDeployment = a.transactions().stream()
            .filter(t -> "SPYI".equals(t.symbol()))
            .flatMap(t -> t.components().stream())
            .anyMatch(c -> c.type() == ComponentType.CAPITAL_DEPLOYMENT
                && c.amount().compareTo(new BigDecimal("3955.67")) == 0);
        assertTrue(equityIsCapitalDeployment,
            "genuine equity purchase must remain CAPITAL_DEPLOYMENT at its full cash amount");

        // The equity purchase must NOT contribute to option premium.
        assertEquals(0, a.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("438.68")),
            "OPTION_PREMIUM should be the two STO credits only (112.34 + 326.34), not the equity buy");
    }

    @Test
    @DisplayName("regression: STO alone is unchanged (gross premium recognized once)")
    void stoAloneUnchanged() {
        ProductionAssessment a = assessor.assess(
            List.of(stoPut(LocalDate.of(2026, 7, 5), " -EWY260821P150",
                "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)", new BigDecimal("150.00"))),
            YearMonth.of(2026, 7));
        assertEquals(0, a.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("150.00")));
        assertEquals(0, a.netStrategyResult().compareTo(new BigDecimal("150.00")));
    }

    // ---- Amendment: recognized-lifecycle association / quantity reconciliation visibility ----
    //
    // The executed BTC debit is always known period option economics. These specimens assert that
    // the RECOGNIZED short lifecycle/quantity association is separately reconciled and made visible:
    // a materially unresolved option-close must NOT yield FULLY_RECONCILED with no issue, while a
    // close fully covered by a recognized opening raises no issue.

    /** Period-spanning boundary rows (unrelated contracts) so coverage issues don't mask the BTC test. */
    private List<FidelityActivityRow> withCoverage(List<FidelityActivityRow> mid) {
        List<FidelityActivityRow> rows = new ArrayList<>();
        rows.add(stoPut(LocalDate.of(2026, 7, 1), " -GSG260821P32",
            "PUT (GSG) ISHARES S&P GSCI AUG 21 26 $32 (100 SHS)", new BigDecimal("50.00")));
        rows.addAll(mid);
        rows.add(stoPut(LocalDate.of(2026, 7, 31), " -BNO260814P50",
            "PUT (BNO) UNITED STS BRENT OIL AUG 14 26 $50 (100 SHS)", new BigDecimal("50.00")));
        return rows;
    }

    private boolean hasOptionCloseUnresolvedIssue(ProductionAssessment a) {
        return a.issues().stream().anyMatch(i -> i.type() == IssueType.OPTION_CLOSE_LIFECYCLE_UNRESOLVED);
    }

    @Test
    @DisplayName("matched close (STO qty 1 → BTC qty 1) raises NO lifecycle issue; known cash preserved")
    void matchedCloseNoIssue() {
        String occ = " -EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoPut(LocalDate.of(2026, 7, 5), occ, desc, new BigDecimal("150.00")),
            btcPut(LocalDate.of(2026, 7, 20), occ, desc, new BigDecimal("-40.00")))),
            YearMonth.of(2026, 7));
        assertFalse(hasOptionCloseUnresolvedIssue(a),
            "a close fully covered by a recognized opening must not be flagged unresolved");
    }

    @Test
    @DisplayName("partial close (STO qty 2 → BTC qty 1) raises NO lifecycle issue (covered by recognized open)")
    void partialCloseNoIssue() {
        String occ = " -EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        // Two STO fills (qty 2 total), one BTC (qty 1) → partial retirement, fully covered.
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoPut(LocalDate.of(2026, 7, 5), occ, desc, new BigDecimal("150.00")),
            stoPut(LocalDate.of(2026, 7, 6), occ, desc, new BigDecimal("150.00")),
            btcPut(LocalDate.of(2026, 7, 20), occ, desc, new BigDecimal("-40.00")))),
            YearMonth.of(2026, 7));
        assertFalse(hasOptionCloseUnresolvedIssue(a),
            "partial close within recognized opened quantity is covered — no unresolved issue");
    }

    @Test
    @DisplayName("unmatched close (BTC with no recognized opening) raises a lifecycle issue; NOT fully reconciled; cash still known")
    void unmatchedCloseRaisesIssue() {
        String occ = " -EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            btcPut(LocalDate.of(2026, 7, 20), occ, desc, new BigDecimal("-40.00")))),
            YearMonth.of(2026, 7));
        assertTrue(hasOptionCloseUnresolvedIssue(a),
            "an unmatched BTC (no recognized opening) must raise an option-close lifecycle issue");
        assertNotEquals(ReconciliationStatus.FULLY_RECONCILED, a.status(),
            "an unresolved option-close must not yield FULLY_RECONCILED");
        // The executed debit is still known period option economics (not suppressed).
        assertEquals(0, a.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("60.00")),
            "unmatched BTC debit still nets into known option premium (50 + 50 - 40 = 60)");
    }

    @Test
    @DisplayName("over-close (STO qty 1 → BTC qty 2) raises a lifecycle issue for the excess")
    void overCloseRaisesIssue() {
        String occ = " -EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        // One STO (qty 1), two BTC (qty 2 total) → over-close by 1.
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoPut(LocalDate.of(2026, 7, 5), occ, desc, new BigDecimal("150.00")),
            btcPut(LocalDate.of(2026, 7, 18), occ, desc, new BigDecimal("-40.00")),
            btcPut(LocalDate.of(2026, 7, 20), occ, desc, new BigDecimal("-30.00")))),
            YearMonth.of(2026, 7));
        assertTrue(hasOptionCloseUnresolvedIssue(a),
            "closing more contracts than were recognized as opened must raise a lifecycle issue");
        assertNotEquals(ReconciliationStatus.FULLY_RECONCILED, a.status());
    }

    @Test
    @DisplayName("missing-cash BTC raises a lifecycle issue AND is not FULLY_RECONCILED (propagation gap repaired)")
    void missingCashRaisesIssueAndNotReconciled() {
        String occ = " -EWY260821P150";
        String desc = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";
        FidelityActivityRow btcNoCash = new FidelityActivityRow(
            LocalDate.of(2026, 7, 20),
            "YOU BOUGHT CLOSING TRANSACTION " + desc + " (Cash)",
            occ, desc, "Cash",
            null, new BigDecimal("1"), null, null, null,
            null, null, LocalDate.of(2026, 7, 21));
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoPut(LocalDate.of(2026, 7, 5), occ, desc, new BigDecimal("150.00")),
            btcNoCash)),
            YearMonth.of(2026, 7));
        assertTrue(hasOptionCloseUnresolvedIssue(a),
            "a BTC with no authoritative closing debit must raise a lifecycle issue");
        assertNotEquals(ReconciliationStatus.FULLY_RECONCILED, a.status(),
            "missing-cash BTC must not silently produce FULLY_RECONCILED");
    }

    // ---- Amendment 2: temporal + per-event correctness ----

    /** Parameterized STO (signed sold quantity negative). */
    private FidelityActivityRow stoQ(LocalDate date, String occSymbol, String desc, BigDecimal premium, int qty) {
        return new FidelityActivityRow(date, "YOU SOLD OPENING TRANSACTION " + desc + " (Cash)",
            occSymbol, desc, "Cash", null, new BigDecimal(-Math.abs(qty)), new BigDecimal("0.65"),
            new BigDecimal("0.03"), null, premium, null, date.plusDays(1));
    }

    /** Parameterized BTC (bought quantity positive). */
    private FidelityActivityRow btcQ(LocalDate date, String occSymbol, String desc, BigDecimal debit, int qty) {
        return new FidelityActivityRow(date, "YOU BOUGHT CLOSING TRANSACTION " + desc + " (Cash)",
            occSymbol, desc, "Cash", null, new BigDecimal(Math.abs(qty)), new BigDecimal("0.65"),
            new BigDecimal("0.01"), null, debit, null, date.plusDays(1));
    }

    /** Expiration notification (terminal resolution; $0 cash, positive contracts resolved). */
    private FidelityActivityRow expiredPut(LocalDate date, String occSymbol, String desc, int qty) {
        return new FidelityActivityRow(date, "EXPIRED " + desc + " as of " + date + " (Cash)",
            occSymbol, desc, "Cash", null, new BigDecimal(Math.abs(qty)), null, null, null,
            BigDecimal.ZERO, null, null);
    }

    private static final String EWY = " -EWY260821P150";
    private static final String EWY_DESC = "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150 (100 SHS)";

    @Test
    @DisplayName("temporal: a FUTURE STO does not validate an earlier BTC (BTC Jul 20, STO Jul 25)")
    void futureOpeningDoesNotValidateEarlierClose() {
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 1),
            stoQ(LocalDate.of(2026, 7, 25), EWY, EWY_DESC, new BigDecimal("150.00"), 1))),
            YearMonth.of(2026, 7));
        assertTrue(hasOptionCloseUnresolvedIssue(a),
            "a close preceding its only opening has no recognized outstanding obligation — must be unresolved");
        // The executed debit is still known (nets into OPTION_PREMIUM): coverage 50+50 + STO 150 - 40 = 210.
        assertEquals(0, a.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("210.00")), "executed BTC debit remains known period option economics");
    }

    @Test
    @DisplayName("temporal: a prior terminal resolution is consumed before a later close (STO, EXPIRED, then BTC)")
    void priorResolutionConsumedBeforeLaterClose() {
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 5), EWY, EWY_DESC, new BigDecimal("150.00"), 1),
            expiredPut(LocalDate.of(2026, 7, 10), EWY, EWY_DESC, 1),   // outstanding → 0
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 1))),
            YearMonth.of(2026, 7));
        assertTrue(hasOptionCloseUnresolvedIssue(a),
            "a close after the obligation was already resolved must not claim retirement — unresolved");
    }

    @Test
    @DisplayName("temporal: same-day competing lifecycle event fails closed (ordering not established)")
    void sameDayOrderingFailsClosed() {
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 5), EWY, EWY_DESC, new BigDecimal("150.00"), 1),
            expiredPut(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, 1),   // same day as the close
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 1))),
            YearMonth.of(2026, 7));
        assertTrue(hasOptionCloseUnresolvedIssue(a),
            "same-day competing lifecycle event makes ordering ambiguous — must fail closed");
    }

    @Test
    @DisplayName("temporal: two sequential partial closes fully covered by a prior opening raise NO issue")
    void sequentialPartialClosesCovered() {
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 1), EWY, EWY_DESC, new BigDecimal("300.00"), 2), // opened 2
            btcQ(LocalDate.of(2026, 7, 10), EWY, EWY_DESC, new BigDecimal("-40.00"), 1), // 2 → 1
            btcQ(LocalDate.of(2026, 7, 16), EWY, EWY_DESC, new BigDecimal("-30.00"), 1))), // 1 → 0
            YearMonth.of(2026, 7));
        assertFalse(hasOptionCloseUnresolvedIssue(a),
            "both closes are covered by the chronologically-recognized outstanding quantity (2→1→0)");
    }

    @Test
    @DisplayName("cross-month: an August close is assessed in August even though a July close preceded it")
    void crossMonthLaterCloseAssessedInOwnMonth() {
        List<FidelityActivityRow> rows = new ArrayList<>();
        // Coverage for August plus the lifecycle spanning July→August.
        rows.add(stoQ(LocalDate.of(2026, 8, 1), " -GSG260821P32",
            "PUT (GSG) ISHARES S&P GSCI AUG 21 26 $32 (100 SHS)", new BigDecimal("50.00"), 1));
        rows.add(stoQ(LocalDate.of(2026, 7, 1), EWY, EWY_DESC, new BigDecimal("300.00"), 2));
        rows.add(btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 1)); // July close
        rows.add(btcQ(LocalDate.of(2026, 8, 20), EWY, EWY_DESC, new BigDecimal("-30.00"), 1)); // August close
        rows.add(stoQ(LocalDate.of(2026, 8, 31), " -BNO260814P50",
            "PUT (BNO) UNITED STS BRENT OIL AUG 14 26 $50 (100 SHS)", new BigDecimal("50.00"), 1));

        ProductionAssessment aug = assessor.assess(rows, YearMonth.of(2026, 8));
        // The August close (−30) must be present in August's option economics; it cannot be absorbed
        // by the earlier July close. August OPTION_PREMIUM = 50 (GSG) + 50 (BNO) − 30 (BTC) = 70.
        assertEquals(0, aug.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("70.00")),
            "the August close debit must appear in August, not be absorbed by the July close");
        // And it is covered by the recognized outstanding (2 opened, 1 closed in July → 1 outstanding).
        assertFalse(hasOptionCloseUnresolvedIssue(aug),
            "the August close is covered by the chronologically-recognized remaining outstanding quantity");
    }

    @Test
    @DisplayName("missing quantity: cash known, retired quantity unresolved (independent facts)")
    void missingQuantityRaisesIssueButKeepsCash() {
        FidelityActivityRow btcNoQty = new FidelityActivityRow(
            LocalDate.of(2026, 7, 20), "YOU BOUGHT CLOSING TRANSACTION " + EWY_DESC + " (Cash)",
            EWY, EWY_DESC, "Cash", null, null, new BigDecimal("0.65"), new BigDecimal("0.01"), null,
            new BigDecimal("-40.00"), null, LocalDate.of(2026, 7, 21));
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 5), EWY, EWY_DESC, new BigDecimal("150.00"), 1),
            btcNoQty)),
            YearMonth.of(2026, 7));
        assertTrue(hasOptionCloseUnresolvedIssue(a),
            "a BTC with authoritative cash but no quantity must raise a lifecycle issue");
        assertNotEquals(ReconciliationStatus.FULLY_RECONCILED, a.status());
        // Executed debit still known: 50 + 50 + 150 − 40 = 210.
        assertEquals(0, a.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("210.00")), "executed debit remains known even when quantity is unresolved");
    }

    // ---- Amendment 3: range-based uncertainty + authoritative OptionCloseResult ----

    /** The authoritative option-close result for the latest-dated close of a contract in the assessment. */
    private OptionCloseResult closeResultFor(ProductionAssessment a, String occ) {
        return a.optionCloseResults().stream()
            .filter(r -> occ.trim().equals(r.contractKey()))
            .reduce((first, second) -> second) // last by list order (assessment/date order)
            .orElseThrow(() -> new AssertionError("no OptionCloseResult for " + occ));
    }

    /** Buy-to-close with an explicit unavailable (null) quantity but known cash. */
    private FidelityActivityRow btcNoQty(LocalDate date, String occSymbol, String desc, BigDecimal debit) {
        return new FidelityActivityRow(date, "YOU BOUGHT CLOSING TRANSACTION " + desc + " (Cash)",
            occSymbol, desc, "Cash", null, null, new BigDecimal("0.65"), new BigDecimal("0.01"), null,
            debit, null, date.plusDays(1));
    }

    /** Assignment notification (terminal resolution; $0 cash, positive contracts). */
    private FidelityActivityRow assignedPut(LocalDate date, String occSymbol, String desc, int qty) {
        return new FidelityActivityRow(date, "ASSIGNED as of " + date + " " + desc + " (Cash)",
            occSymbol, desc, "Cash", null, new BigDecimal(Math.abs(qty)), null, null, null,
            BigDecimal.ZERO, null, null);
    }

    @Test
    @DisplayName("range: prior UNKNOWN-quantity BTC contaminates a later close (STO2, BTC?, BTC2 → UNRESOLVED, not deterministic)")
    void priorUnknownQuantityBtcContaminatesLater() {
        // STO 2 opens; a middle BTC with known cash but UNKNOWN quantity could have consumed 0..2;
        // a later BTC of quantity 2 therefore cannot be deterministically covered.
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 3), EWY, EWY_DESC, new BigDecimal("300.00"), 2),
            btcNoQty(LocalDate.of(2026, 7, 10), EWY, EWY_DESC, new BigDecimal("-20.00")),
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 2))),
            YearMonth.of(2026, 7));
        OptionCloseResult later = closeResultFor(a, EWY);
        assertEquals(OptionCloseResult.OptionCloseStatus.UNRESOLVED, later.status(),
            "unknown prior consumption widens outstanding to [0,2]; q=2 within range → UNRESOLVED, not deterministic");
        // Range preserved, not collapsed to zero: outstanding-before is [0,2].
        assertEquals(0, later.outstandingBeforeMin().compareTo(BigDecimal.ZERO));
        assertEquals(0, later.outstandingBeforeMax().compareTo(new BigDecimal("2")));
        assertTrue(hasOptionCloseUnresolvedIssue(a));
    }

    @Test
    @DisplayName("range: unknown TERMINAL quantity before a close leaves association UNRESOLVED")
    void unknownTerminalQuantityContaminatesClose() {
        // STO 2; an assignment of UNKNOWN quantity could have consumed 0..2; a later BTC of 2 is
        // therefore not deterministically covered.
        FidelityActivityRow assignUnknown = new FidelityActivityRow(
            LocalDate.of(2026, 7, 10), "ASSIGNED as of 2026-07-10 " + EWY_DESC + " (Cash)",
            EWY, EWY_DESC, "Cash", null, null, null, null, null, BigDecimal.ZERO, null, null);
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 3), EWY, EWY_DESC, new BigDecimal("300.00"), 2),
            assignUnknown,
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 2))),
            YearMonth.of(2026, 7));
        OptionCloseResult r = closeResultFor(a, EWY);
        assertEquals(OptionCloseResult.OptionCloseStatus.UNRESOLVED, r.status(),
            "unknown terminal quantity widens outstanding; the later close is not deterministic");
        assertTrue(hasOptionCloseUnresolvedIssue(a));
    }

    @Test
    @DisplayName("range: PARTIAL assignment then BTC of the residual is DETERMINISTIC")
    void partialAssignmentThenBtcResidualDeterministic() {
        // STO 2; assignment of 1 (known) leaves exactly 1 recognized outstanding; BTC 1 retires it.
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 3), EWY, EWY_DESC, new BigDecimal("300.00"), 2),
            assignedPut(LocalDate.of(2026, 7, 10), EWY, EWY_DESC, 1),
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 1))),
            YearMonth.of(2026, 7));
        OptionCloseResult r = closeResultFor(a, EWY);
        assertTrue(r.isDeterministic(),
            "partial assignment leaves exactly 1 outstanding; BTC 1 deterministically retires it");
        assertEquals(0, r.outstandingBeforeMin().compareTo(BigDecimal.ONE));
        assertEquals(0, r.outstandingBeforeMax().compareTo(BigDecimal.ONE));
        assertFalse(hasOptionCloseUnresolvedIssue(a),
            "a deterministic residual close raises no lifecycle issue");
    }

    @Test
    @DisplayName("range: over-close is not validated by a LATER opening (STO1, BTC2, later STO1 → OVER_CLOSE)")
    void overCloseNotValidatedByLaterOpening() {
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 3), EWY, EWY_DESC, new BigDecimal("150.00"), 1),
            btcQ(LocalDate.of(2026, 7, 10), EWY, EWY_DESC, new BigDecimal("-40.00"), 2),
            stoQ(LocalDate.of(2026, 7, 25), EWY, EWY_DESC, new BigDecimal("150.00"), 1))),
            YearMonth.of(2026, 7));
        // The BTC on Jul 10 saw only 1 outstanding; the Jul 25 opening cannot retroactively cover it.
        OptionCloseResult r = a.optionCloseResults().stream()
            .filter(x -> EWY.trim().equals(x.contractKey()))
            .findFirst().orElseThrow();
        assertEquals(OptionCloseResult.OptionCloseStatus.OVER_CLOSE, r.status(),
            "closed 2 against 1 recognized outstanding; later opening must not validate it");
        assertEquals(0, r.excessUnmatched().compareTo(BigDecimal.ONE), "excess of 1 is guaranteed unmatched");
    }

    @Test
    @DisplayName("range: q within the uncertainty range is UNRESOLVED (not silently deterministic)")
    void closeWithinUncertaintyRangeUnresolved() {
        // STO 2; a prior unknown-qty BTC widens outstanding to [0,2]; a later BTC of 1 lies within
        // [0,2] (could be covered or not) → UNRESOLVED.
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 3), EWY, EWY_DESC, new BigDecimal("300.00"), 2),
            btcNoQty(LocalDate.of(2026, 7, 10), EWY, EWY_DESC, new BigDecimal("-20.00")),
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 1))),
            YearMonth.of(2026, 7));
        OptionCloseResult later = closeResultFor(a, EWY);
        assertEquals(OptionCloseResult.OptionCloseStatus.UNRESOLVED, later.status(),
            "q=1 lies within outstanding range [0,2] → cannot determine → UNRESOLVED");
    }

    @Test
    @DisplayName("range: a clean STO1 → BTC1 is DETERMINISTIC_COMPLETE with matched=1, residual=0")
    void cleanCompleteHasExactMatched() {
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 5), EWY, EWY_DESC, new BigDecimal("150.00"), 1),
            btcQ(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00"), 1))),
            YearMonth.of(2026, 7));
        OptionCloseResult r = closeResultFor(a, EWY);
        assertEquals(OptionCloseResult.OptionCloseStatus.DETERMINISTIC_COMPLETE, r.status());
        assertEquals(0, r.matchedMin().compareTo(BigDecimal.ONE));
        assertEquals(0, r.matchedMax().compareTo(BigDecimal.ONE));
        assertEquals(0, r.residualMax().compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("NEGATIVE SPECIMEN (BUG-021 record): STO 2 → BTC quantity UNAVAILABLE / −$40 — closedQuantity is null (opening qty NOT substituted), cash kept, UNRESOLVED")
    void negativeSpecimenUnknownBtcQuantityBackend() {
        // Durable BUG-021 negative specimen at the BACKEND authority boundary: an opening of qty 2,
        // then a buy-to-close whose executed quantity is UNAVAILABLE. The authoritative
        // OptionCloseResult must keep the executed cash, leave closedQuantity NULL (unknown), and
        // NEVER substitute the opening quantity (2) as the observed closed quantity. Status
        // UNRESOLVED because a quantity-unknown close cannot be deterministically associated.
        ProductionAssessment a = assessor.assess(withCoverage(List.of(
            stoQ(LocalDate.of(2026, 7, 5), EWY, EWY_DESC, new BigDecimal("300.00"), 2),
            btcNoQty(LocalDate.of(2026, 7, 20), EWY, EWY_DESC, new BigDecimal("-40.00")))),
            YearMonth.of(2026, 7));
        OptionCloseResult r = closeResultFor(a, EWY);
        assertEquals(OptionCloseResult.OptionCloseStatus.UNRESOLVED, r.status(),
            "a quantity-unavailable close cannot be deterministically associated");
        // Executed quantity is UNKNOWN — null, and specifically NOT the opening quantity 2.
        assertNull(r.closedQuantity(), "executed BTC quantity is unavailable → closedQuantity must be null, never the opening quantity");
        // Executed cash remains known/visible.
        assertNotNull(r.executedDebit());
        assertEquals(0, r.executedDebit().compareTo(new BigDecimal("-40.00")), "closing cash stays visible");
        // Cash still nets into known period option premium (coverage 50+50 + STO 300 − 40 = 360).
        assertEquals(0, a.productionBreakdown().getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .compareTo(new BigDecimal("360.00")), "executed debit remains known even when quantity is unresolved");
        // The unresolved close must not silently reconcile.
        assertTrue(hasOptionCloseUnresolvedIssue(a));
        assertNotEquals(ReconciliationStatus.FULLY_RECONCILED, a.status());
    }
}
