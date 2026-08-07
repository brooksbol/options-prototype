package com.wheelwright.evidence.production;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class EconomicDecomposerTest {

    private final FidelityActivityParser parser = new FidelityActivityParser();
    private final TransactionClassifier classifier = new TransactionClassifier();
    private final TreasuryBasisResolver treasuryResolver = new TreasuryBasisResolver();
    private final EconomicDecomposer decomposer = new EconomicDecomposer(treasuryResolver);
    private List<NormalizedTransaction> allTransactions;

    @BeforeEach
    void setUp() throws Exception {
        InputStream is = getClass().getResourceAsStream("/fixtures/fidelity-activity-july-2026.csv");
        List<FidelityActivityRow> rows = parser.parse(is);
        allTransactions = rows.stream()
            .map(row -> NormalizedTransaction.from(row, classifier.classify(row)))
            .toList();
    }

    private NormalizedTransaction findByKindAndSymbol(FidelityTransactionKind kind, String symbol) {
        return allTransactions.stream()
            .filter(tx -> tx.kind() == kind && tx.symbol().equals(symbol))
            .findFirst().orElseThrow(() -> new AssertionError("No " + kind + " for " + symbol));
    }

    private NormalizedTransaction findByKindAndDate(FidelityTransactionKind kind, String dateStr) {
        var date = java.time.LocalDate.parse(dateStr);
        return allTransactions.stream()
            .filter(tx -> tx.kind() == kind && tx.date().equals(date))
            .findFirst().orElseThrow(() -> new AssertionError("No " + kind + " on " + dateStr));
    }

    // --- Option premium tests ---

    @Test
    @DisplayName("option sell-to-open PUT → single PRODUCTION/OPTION_PREMIUM component")
    void optionPutPremium() {
        // PSI put: amount $1149.31
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.OPTION_SELL_TO_OPEN_PUT &&
                        t.rawAction().contains("PSI"))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        EconomicComponent c = components.get(0);
        assertEquals(ComponentType.PRODUCTION, c.type());
        assertEquals(ProductionSource.OPTION_PREMIUM, c.source());
        assertEquals(new BigDecimal("1149.31"), c.amount());
        assertEquals(Confidence.DETERMINISTIC, c.confidence());
    }

    @Test
    @DisplayName("option sell-to-open CALL → single PRODUCTION/OPTION_PREMIUM component")
    void optionCallPremium() {
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.OPTION_SELL_TO_OPEN_CALL)
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        assertEquals(ComponentType.PRODUCTION, components.get(0).type());
        assertEquals(ProductionSource.OPTION_PREMIUM, components.get(0).source());
        assertEquals(Confidence.DETERMINISTIC, components.get(0).confidence());
    }

    // --- Dividend tests ---

    @Test
    @DisplayName("SPAXX dividend → PRODUCTION/MONEY_MARKET_INCOME, DETERMINISTIC")
    void spaxxDividend() {
        // July 31 SPAXX dividend: $142.11
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.MONEY_MARKET_DIVIDEND &&
                        t.date().equals(java.time.LocalDate.of(2026, 7, 31)))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        EconomicComponent c = components.get(0);
        assertEquals(ComponentType.PRODUCTION, c.type());
        assertEquals(ProductionSource.MONEY_MARKET_INCOME, c.source());
        assertEquals(Confidence.DETERMINISTIC, c.confidence());
        assertEquals(new BigDecimal("142.11"), c.amount());
    }

    @Test
    @DisplayName("non-SPAXX dividend → PRODUCTION/DIVIDEND, CHARACTER_UNCERTAIN")
    void nonSpaxxDividend() {
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.DIVIDEND_RECEIVED &&
                        t.symbol().equals("SPYI"))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        EconomicComponent c = components.get(0);
        assertEquals(ComponentType.PRODUCTION, c.type());
        assertEquals(ProductionSource.DIVIDEND, c.source());
        assertEquals(Confidence.CHARACTER_UNCERTAIN, c.confidence());
        assertEquals(new BigDecimal("39.66"), c.amount());
    }

    // --- Treasury decomposition tests ---

    @Test
    @DisplayName("Treasury redemption with known basis → PRINCIPAL_MOVEMENT + PRODUCTION/TREASURY_DISCOUNT")
    void treasuryWithKnownBasis() {
        // 912797UR6: redeemed $2000, cost $1991.57, discount $8.43
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.TREASURY_REDEMPTION &&
                        t.symbol().equals("912797UR6"))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(2, components.size());

        EconomicComponent principal = components.stream()
            .filter(c -> c.type() == ComponentType.PRINCIPAL_MOVEMENT).findFirst().orElseThrow();
        assertEquals(new BigDecimal("1991.57"), principal.amount());

        EconomicComponent income = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION).findFirst().orElseThrow();
        assertEquals(ProductionSource.TREASURY_DISCOUNT, income.source());
        assertEquals(new BigDecimal("8.43"), income.amount());
        assertEquals(Confidence.DETERMINISTIC, income.confidence());
    }

    @Test
    @DisplayName("Treasury redemption with ACAT basis → PRINCIPAL_MOVEMENT with BASIS_UNKNOWN")
    void treasuryWithUnknownBasis() {
        // 912797TP2: ACAT transfer, basis unknown
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.TREASURY_REDEMPTION &&
                        t.symbol().equals("912797TP2"))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        EconomicComponent c = components.get(0);
        assertEquals(ComponentType.PRINCIPAL_MOVEMENT, c.type());
        assertEquals(Confidence.BASIS_UNKNOWN, c.confidence());
    }

    @Test
    @DisplayName("Treasury with partial lot (912797TN7) → correct discount after FIFO sale consumption")
    void treasuryPartialLot() {
        // 912797TN7: 2 lots purchased, 1 sold before maturity
        // Remaining lot cost: $995.77. Redeemed $1000. Discount: $4.23
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.TREASURY_REDEMPTION &&
                        t.symbol().equals("912797TN7"))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(2, components.size());

        EconomicComponent income = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION).findFirst().orElseThrow();
        assertEquals(ProductionSource.TREASURY_DISCOUNT, income.source());
        assertEquals(new BigDecimal("4.23"), income.amount());
    }

    // --- Disposition tests (asymmetric realization) ---

    @Test
    @DisplayName("assigned-call sale below basis → PRINCIPAL_MOVEMENT + CAPITAL_EROSION")
    void assignedCallBelowBasis() {
        // XLE: bought at $57.50 via put assignment (07/02), sold at $55 via call assignment (08/03)
        // Basis: $11500, proceeds: $10999.77, loss: $500.23
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE &&
                        t.symbol().equals("XLE"))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(2, components.size());

        EconomicComponent principal = components.stream()
            .filter(c -> c.type() == ComponentType.PRINCIPAL_MOVEMENT).findFirst().orElseThrow();
        assertEquals(new BigDecimal("10999.77"), principal.amount());

        EconomicComponent erosion = components.stream()
            .filter(c -> c.type() == ComponentType.CAPITAL_EROSION).findFirst().orElseThrow();
        assertEquals(new BigDecimal("500.23"), erosion.amount());
        assertEquals(Confidence.DETERMINISTIC, erosion.confidence());
    }

    @Test
    @DisplayName("T-bill sold before maturity above cost → PRINCIPAL_MOVEMENT + PRODUCTION/REALIZED_APPRECIATION")
    void tBillSoldAboveCost() {
        // 912797TN7 sold 05/05: proceeds $992.89, cost $990.85 (first lot FIFO), gain $2.04
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.ASSET_SALE &&
                        t.symbol().equals("912797TN7"))
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(2, components.size());

        EconomicComponent principal = components.stream()
            .filter(c -> c.type() == ComponentType.PRINCIPAL_MOVEMENT).findFirst().orElseThrow();
        assertEquals(new BigDecimal("990.85"), principal.amount());

        EconomicComponent gain = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION).findFirst().orElseThrow();
        assertEquals(ProductionSource.REALIZED_APPRECIATION, gain.source());
        assertEquals(new BigDecimal("2.04"), gain.amount());
        assertEquals(Confidence.DETERMINISTIC, gain.confidence());
    }

    // --- Principal movement tests ---

    @Test
    @DisplayName("deposit → PRINCIPAL_MOVEMENT")
    void deposit() {
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.EFT_DEPOSIT)
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        assertEquals(ComponentType.PRINCIPAL_MOVEMENT, components.get(0).type());
        assertEquals(new BigDecimal("33000"), components.get(0).amount());
    }

    @Test
    @DisplayName("withdrawal → PRINCIPAL_MOVEMENT")
    void withdrawal() {
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.EFT_WITHDRAWAL)
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        assertEquals(ComponentType.PRINCIPAL_MOVEMENT, components.get(0).type());
        assertEquals(new BigDecimal("2000"), components.get(0).amount());
    }

    // --- Lifecycle notification tests ---

    @Test
    @DisplayName("assignment notification → LIFECYCLE_NOTIFICATION with zero amount")
    void assignmentNotification() {
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.ASSIGNMENT_NOTIFICATION)
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        assertEquals(ComponentType.LIFECYCLE_NOTIFICATION, components.get(0).type());
        assertEquals(BigDecimal.ZERO, components.get(0).amount());
    }

    @Test
    @DisplayName("expiration notification → LIFECYCLE_NOTIFICATION with zero amount")
    void expirationNotification() {
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.EXPIRATION_NOTIFICATION)
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        assertEquals(ComponentType.LIFECYCLE_NOTIFICATION, components.get(0).type());
        assertEquals(BigDecimal.ZERO, components.get(0).amount());
    }

    // --- Reinvestment tests ---

    @Test
    @DisplayName("reinvestment → REINVESTMENT")
    void reinvestment() {
        NormalizedTransaction tx = allTransactions.stream()
            .filter(t -> t.kind() == FidelityTransactionKind.REINVESTMENT)
            .findFirst().orElseThrow();

        List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);

        assertEquals(1, components.size());
        assertEquals(ComponentType.REINVESTMENT, components.get(0).type());
    }

    // --- Asymmetric realization invariant ---

    @Test
    @DisplayName("PRODUCTION components always have non-negative amount")
    void productionNonNegative() {
        for (NormalizedTransaction tx : allTransactions) {
            List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);
            for (EconomicComponent c : components) {
                if (c.type() == ComponentType.PRODUCTION) {
                    assertTrue(c.amount().compareTo(BigDecimal.ZERO) >= 0,
                        "PRODUCTION amount must be >= 0 but was " + c.amount() +
                        " for tx: " + tx.rawAction());
                }
            }
        }
    }

    @Test
    @DisplayName("CAPITAL_EROSION components always have non-negative amount")
    void erosionNonNegative() {
        for (NormalizedTransaction tx : allTransactions) {
            List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);
            for (EconomicComponent c : components) {
                if (c.type() == ComponentType.CAPITAL_EROSION) {
                    assertTrue(c.amount().compareTo(BigDecimal.ZERO) >= 0,
                        "CAPITAL_EROSION amount must be >= 0 but was " + c.amount() +
                        " for tx: " + tx.rawAction());
                }
            }
        }
    }
}
