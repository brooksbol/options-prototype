package com.wheelwright.evidence.production;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class TransactionClassifierTest {

    private final FidelityActivityParser parser = new FidelityActivityParser();
    private final TransactionClassifier classifier = new TransactionClassifier();

    private List<FidelityActivityRow> parseFixture() throws Exception {
        InputStream is = getClass().getResourceAsStream("/fixtures/fidelity-activity-july-2026.csv");
        assertNotNull(is, "Fixture file must exist");
        return parser.parse(is);
    }

    // --- Classification of each observed pattern ---

    @Test
    @DisplayName("sell-to-open PUT → OPTION_SELL_TO_OPEN_PUT")
    void classifiesPutSellToOpen() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("YOU SOLD OPENING TRANSACTION PUT"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.OPTION_SELL_TO_OPEN_PUT, classifier.classify(row));
    }

    @Test
    @DisplayName("sell-to-open CALL → OPTION_SELL_TO_OPEN_CALL")
    void classifiesCallSellToOpen() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("YOU SOLD OPENING TRANSACTION CALL"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.OPTION_SELL_TO_OPEN_CALL, classifier.classify(row));
    }

    @Test
    @DisplayName("SPAXX dividend → MONEY_MARKET_DIVIDEND")
    void classifiesSpaxxDividend() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("DIVIDEND RECEIVED") && r.symbol().trim().equals("SPAXX"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.MONEY_MARKET_DIVIDEND, classifier.classify(row));
    }

    @Test
    @DisplayName("non-SPAXX dividend → DIVIDEND_RECEIVED")
    void classifiesOtherDividend() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("DIVIDEND RECEIVED") && r.symbol().trim().equals("SPYI"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.DIVIDEND_RECEIVED, classifier.classify(row));
    }

    @Test
    @DisplayName("Treasury redemption → TREASURY_REDEMPTION")
    void classifiesTreasuryRedemption() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("REDEMPTION PAYOUT") && r.symbol().trim().startsWith("912797"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.TREASURY_REDEMPTION, classifier.classify(row));
    }

    @Test
    @DisplayName("Treasury purchase → TREASURY_PURCHASE")
    void classifiesTreasuryPurchase() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("YOU BOUGHT") && r.symbol().trim().startsWith("912797"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.TREASURY_PURCHASE, classifier.classify(row));
    }

    @Test
    @DisplayName("EFT deposit → EFT_DEPOSIT")
    void classifiesEftDeposit() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("Electronic Funds Transfer Received"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.EFT_DEPOSIT, classifier.classify(row));
    }

    @Test
    @DisplayName("EFT withdrawal → EFT_WITHDRAWAL")
    void classifiesEftWithdrawal() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("Electronic Funds Transfer Paid"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.EFT_WITHDRAWAL, classifier.classify(row));
    }

    @Test
    @DisplayName("ACAT transfer → ACAT_TRANSFER")
    void classifiesAcatTransfer() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("TRANSFER OF ASSETS"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.ACAT_TRANSFER, classifier.classify(row));
    }

    @Test
    @DisplayName("assigned put stock purchase → ASSIGNED_PUT_STOCK_PURCHASE")
    void classifiesAssignedPutPurchase() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("YOU BOUGHT ASSIGNED PUTS"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.ASSIGNED_PUT_STOCK_PURCHASE, classifier.classify(row));
    }

    @Test
    @DisplayName("assigned call stock sale → ASSIGNED_CALL_STOCK_SALE")
    void classifiesAssignedCallSale() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("YOU SOLD ASSIGNED CALLS"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE, classifier.classify(row));
    }

    @Test
    @DisplayName("assignment notification → ASSIGNMENT_NOTIFICATION")
    void classifiesAssignmentNotification() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("ASSIGNED as of"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.ASSIGNMENT_NOTIFICATION, classifier.classify(row));
    }

    @Test
    @DisplayName("expiration notification → EXPIRATION_NOTIFICATION")
    void classifiesExpirationNotification() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("EXPIRED"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.EXPIRATION_NOTIFICATION, classifier.classify(row));
    }

    @Test
    @DisplayName("reinvestment → REINVESTMENT")
    void classifiesReinvestment() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("REINVESTMENT"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.REINVESTMENT, classifier.classify(row));
    }

    @Test
    @DisplayName("equity sale (non-assigned, non-treasury) → ASSET_SALE")
    void classifiesAssetSale() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        // SPYI sale: "YOU SOLD NEOS ETF TRUST..."
        FidelityActivityRow row = rows.stream()
            .filter(r -> r.action().startsWith("YOU SOLD") &&
                        !r.action().contains("OPENING TRANSACTION") &&
                        !r.action().contains("ASSIGNED CALLS") &&
                        r.symbol().trim().equals("SPYI"))
            .findFirst().orElseThrow();
        assertEquals(FidelityTransactionKind.ASSET_SALE, classifier.classify(row));
    }

    @Test
    @DisplayName("equity purchase (non-assigned, non-treasury) → ASSET_PURCHASE")
    void classifiesAssetPurchase() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        // Look for a non-treasury, non-assigned purchase — the fixture has Treasury purchases
        // We need a fixture row for non-treasury purchase. The fixture may not have one.
        // Use a synthetic row instead.
        FidelityActivityRow synth = new FidelityActivityRow(
            java.time.LocalDate.of(2026, 7, 15),
            "YOU BOUGHT NEOS ETF TRUST NEOS S&P 500 HI (SPYI) (Cash)",
            "SPYI", "NEOS ETF TRUST NEOS S&P 500 HI", "Cash",
            new java.math.BigDecimal("53.46"), new java.math.BigDecimal("74"),
            null, null, null,
            new java.math.BigDecimal("-3955.67"), null, null
        );
        assertEquals(FidelityTransactionKind.ASSET_PURCHASE, classifier.classify(synth));
    }

    // --- Unknown action handling ---

    @Test
    @DisplayName("unknown action produces UNCLASSIFIED, never throws")
    void unknownActionDoesNotThrow() {
        FidelityActivityRow unknown = new FidelityActivityRow(
            java.time.LocalDate.of(2026, 7, 15),
            "SOME COMPLETELY UNKNOWN FIDELITY ACTION (Cash)",
            "XYZ", "Unknown instrument", "Cash",
            null, java.math.BigDecimal.ZERO,
            null, null, null,
            new java.math.BigDecimal("42.00"), null, null
        );
        assertEquals(FidelityTransactionKind.UNCLASSIFIED, classifier.classify(unknown));
    }

    // --- Coverage: all fixture rows should be classified (no UNCLASSIFIED in known data) ---

    @Test
    @DisplayName("all fixture rows are classified (no UNCLASSIFIED in known test data)")
    void noUnclassifiedInFixture() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        List<FidelityActivityRow> unclassified = rows.stream()
            .filter(r -> classifier.classify(r) == FidelityTransactionKind.UNCLASSIFIED)
            .toList();
        assertTrue(unclassified.isEmpty(),
            "Expected no UNCLASSIFIED rows in fixture, but found: " +
            unclassified.stream().map(FidelityActivityRow::action).collect(Collectors.joining("; ")));
    }

    // --- Classification priority: more specific patterns match before general ones ---

    @Test
    @DisplayName("assigned-call sale takes priority over general asset sale")
    void assignedCallPriorityOverAssetSale() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        // "YOU SOLD ASSIGNED CALLS" should NOT match ASSET_SALE
        List<FidelityActivityRow> assignedCallRows = rows.stream()
            .filter(r -> r.action().startsWith("YOU SOLD ASSIGNED CALLS"))
            .toList();
        assertFalse(assignedCallRows.isEmpty());
        for (FidelityActivityRow row : assignedCallRows) {
            assertEquals(FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE, classifier.classify(row));
        }
    }

    @Test
    @DisplayName("Treasury purchase takes priority over general asset purchase")
    void treasuryPurchasePriority() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        List<FidelityActivityRow> treasuryBuys = rows.stream()
            .filter(r -> r.action().startsWith("YOU BOUGHT") && r.symbol().trim().startsWith("912797"))
            .toList();
        assertFalse(treasuryBuys.isEmpty());
        for (FidelityActivityRow row : treasuryBuys) {
            assertEquals(FidelityTransactionKind.TREASURY_PURCHASE, classifier.classify(row));
        }
    }
}
