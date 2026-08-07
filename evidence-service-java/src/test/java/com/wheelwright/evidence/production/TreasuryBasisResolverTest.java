package com.wheelwright.evidence.production;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TreasuryBasisResolverTest {

    private final FidelityActivityParser parser = new FidelityActivityParser();
    private final TransactionClassifier classifier = new TransactionClassifier();
    private final TreasuryBasisResolver resolver = new TreasuryBasisResolver();
    private List<NormalizedTransaction> allTransactions;

    @BeforeEach
    void setUp() throws Exception {
        InputStream is = getClass().getResourceAsStream("/fixtures/fidelity-activity-july-2026.csv");
        List<FidelityActivityRow> rows = parser.parse(is);
        allTransactions = rows.stream()
            .map(row -> NormalizedTransaction.from(row, classifier.classify(row)))
            .toList();
    }

    @Test
    @DisplayName("resolves basis for CUSIP with two purchases (912797UR6)")
    void resolvesTwoLotBasis() {
        // 912797UR6: purchased $994.38 (05/28) + $997.19 (06/25) = $1991.57
        // Redeemed $2000 on 07/28
        var result = resolver.resolve("912797UR6", new BigDecimal("2000"),
            allTransactions, LocalDate.of(2026, 7, 28));

        assertTrue(result.fullyResolved());
        assertEquals(new BigDecimal("1991.57"), result.totalCost());
    }

    @Test
    @DisplayName("resolves basis for CUSIP with matching total (912797UP0)")
    void resolvesThreeLotBasis() {
        // 912797UP0: purchased $994.38 (05/14, qty 1000) + $1994.41 (06/11, qty 2000) = $2988.79
        // Redeemed $3000 on 07/14
        var result = resolver.resolve("912797UP0", new BigDecimal("3000"),
            allTransactions, LocalDate.of(2026, 7, 14));

        assertTrue(result.fullyResolved());
        assertEquals(new BigDecimal("2988.79"), result.totalCost());
    }

    @Test
    @DisplayName("resolves basis for CUSIP 912797UN5 (two lots, $3000 redeemed)")
    void resolvesUN5() {
        // 912797UN5: purchased $994.41 (05/07, qty 1000) + $1994.38 (06/04, qty 2000) = $2988.79
        // Redeemed $3000 on 07/07
        var result = resolver.resolve("912797UN5", new BigDecimal("3000"),
            allTransactions, LocalDate.of(2026, 7, 7));

        assertTrue(result.fullyResolved());
        assertEquals(new BigDecimal("2988.79"), result.totalCost());
    }

    @Test
    @DisplayName("handles partial redemption when lot was sold before maturity (912797TN7)")
    void handlesPartialWithPriorSale() {
        // 912797TN7: purchased $990.85 (04/13, qty 1000) + $995.77 (06/02, qty 1000)
        // Sold $1000 on 05/05 (before maturity) — consumes the first lot
        // Redeemed $1000 on 07/16 — should match remaining lot ($995.77)
        var result = resolver.resolve("912797TN7", new BigDecimal("1000"),
            allTransactions, LocalDate.of(2026, 7, 16));

        assertTrue(result.fullyResolved());
        assertEquals(new BigDecimal("995.77"), result.totalCost());
    }

    @Test
    @DisplayName("returns unresolved for ACAT-transferred CUSIP (912797TP2)")
    void unresolvedForAcatTransfer() {
        // 912797TP2: transferred via ACAT on 03/09, no purchase in history
        // Redeemed $9000 on 07/23
        var result = resolver.resolve("912797TP2", new BigDecimal("9000"),
            allTransactions, LocalDate.of(2026, 7, 23));

        assertFalse(result.fullyResolved());
        assertNull(result.totalCost());
        assertTrue(result.explanation().contains("ACAT"));
    }

    @Test
    @DisplayName("returns unresolved for CUSIP with no purchase history")
    void unresolvedForMissingHistory() {
        var result = resolver.resolve("UNKNOWN_CUSIP", new BigDecimal("1000"),
            allTransactions, LocalDate.of(2026, 7, 15));

        assertFalse(result.fullyResolved());
        assertNull(result.totalCost());
    }

    @Test
    @DisplayName("returns unresolved when multiple lots exist at time of partial sale (ambiguous)")
    void unresolvedForAmbiguousLotSelection() {
        // Construct a scenario: two lots purchased before a partial sale
        // Buy $1000 at 99.0 on day 1
        // Buy $1000 at 99.5 on day 2
        // Sell $1000 on day 3 (which lot? AMBIGUOUS)
        // Redeem $1000 on day 4
        var syntheticTransactions = List.of(
            new NormalizedTransaction("t1", LocalDate.of(2026, 6, 1), null,
                FidelityTransactionKind.TREASURY_PURCHASE, "YOU BOUGHT...", "TESTCUSIP", "Test T-bill",
                new BigDecimal("-990.00"), null, null, new BigDecimal("99.00"), new BigDecimal("1000")),
            new NormalizedTransaction("t2", LocalDate.of(2026, 6, 5), null,
                FidelityTransactionKind.TREASURY_PURCHASE, "YOU BOUGHT...", "TESTCUSIP", "Test T-bill",
                new BigDecimal("-995.00"), null, null, new BigDecimal("99.50"), new BigDecimal("1000")),
            new NormalizedTransaction("t3", LocalDate.of(2026, 6, 10), null,
                FidelityTransactionKind.ASSET_SALE, "YOU SOLD...", "TESTCUSIP", "Test T-bill",
                new BigDecimal("996.00"), null, null, new BigDecimal("99.60"), new BigDecimal("-1000")),
            new NormalizedTransaction("t4", LocalDate.of(2026, 7, 1), null,
                FidelityTransactionKind.TREASURY_REDEMPTION, "REDEMPTION PAYOUT...", "TESTCUSIP", "Test T-bill",
                new BigDecimal("1000.00"), null, null, new BigDecimal("1"), new BigDecimal("-1000"))
        );

        var result = resolver.resolve("TESTCUSIP", new BigDecimal("1000"),
            syntheticTransactions, LocalDate.of(2026, 7, 1));

        assertFalse(result.fullyResolved(),
            "Should be unresolved: two lots existed when partial sale occurred — lot selection is ambiguous");
        assertNull(result.totalCost());
        assertTrue(result.explanation().contains("ambiguity"),
            "Explanation should mention lot-selection ambiguity");
    }

    @Test
    @DisplayName("resolves when sale consumes ALL available inventory (no ambiguity)")
    void resolvedWhenSaleConsumesAll() {
        // Buy $1000 at 99.0 on day 1
        // Buy $1000 at 99.5 on day 2
        // Sell $2000 on day 3 (consumes everything — no ambiguity)
        // Buy $1000 at 99.7 on day 4
        // Redeem $1000 on day 5
        var syntheticTransactions = List.of(
            new NormalizedTransaction("t1", LocalDate.of(2026, 6, 1), null,
                FidelityTransactionKind.TREASURY_PURCHASE, "YOU BOUGHT...", "TESTCUSIP2", "Test T-bill",
                new BigDecimal("-990.00"), null, null, new BigDecimal("99.00"), new BigDecimal("1000")),
            new NormalizedTransaction("t2", LocalDate.of(2026, 6, 5), null,
                FidelityTransactionKind.TREASURY_PURCHASE, "YOU BOUGHT...", "TESTCUSIP2", "Test T-bill",
                new BigDecimal("-995.00"), null, null, new BigDecimal("99.50"), new BigDecimal("1000")),
            new NormalizedTransaction("t3", LocalDate.of(2026, 6, 10), null,
                FidelityTransactionKind.ASSET_SALE, "YOU SOLD...", "TESTCUSIP2", "Test T-bill",
                new BigDecimal("1996.00"), null, null, new BigDecimal("99.80"), new BigDecimal("-2000")),
            new NormalizedTransaction("t4", LocalDate.of(2026, 6, 15), null,
                FidelityTransactionKind.TREASURY_PURCHASE, "YOU BOUGHT...", "TESTCUSIP2", "Test T-bill",
                new BigDecimal("-997.00"), null, null, new BigDecimal("99.70"), new BigDecimal("1000")),
            new NormalizedTransaction("t5", LocalDate.of(2026, 7, 1), null,
                FidelityTransactionKind.TREASURY_REDEMPTION, "REDEMPTION PAYOUT...", "TESTCUSIP2", "Test T-bill",
                new BigDecimal("1000.00"), null, null, new BigDecimal("1"), new BigDecimal("-1000"))
        );

        var result = resolver.resolve("TESTCUSIP2", new BigDecimal("1000"),
            syntheticTransactions, LocalDate.of(2026, 7, 1));

        assertTrue(result.fullyResolved(),
            "Should be resolved: prior sale consumed ALL inventory, so remaining lot is unambiguous");
        assertEquals(new BigDecimal("997.00"), result.totalCost());
    }

    @Test
    @DisplayName("resolves single-lot basis (912797RF6)")
    void resolvesSingleLot() {
        // 912797RF6: purchased $990.81 (04/06, qty 1000)
        // Redeemed $1000 on 07/09
        var result = resolver.resolve("912797RF6", new BigDecimal("1000"),
            allTransactions, LocalDate.of(2026, 7, 9));

        assertTrue(result.fullyResolved());
        assertEquals(new BigDecimal("990.81"), result.totalCost());
    }

    @Test
    @DisplayName("resolves basis for 912797TF4 (single lot)")
    void resolvesTF4() {
        // 912797TF4: purchased $990.85 (03/30, qty 1000)
        // Redeemed $1000 on 07/02
        var result = resolver.resolve("912797TF4", new BigDecimal("1000"),
            allTransactions, LocalDate.of(2026, 7, 2));

        assertTrue(result.fullyResolved());
        assertEquals(new BigDecimal("990.85"), result.totalCost());
    }
}
