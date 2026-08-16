package com.wheelwright.evidence.production;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Production Attribution Regression Tests.
 *
 * Proves the domain invariant: Production is economic gain causally attributable
 * to a Wheelwright strategy lifecycle. Realization alone is not sufficient.
 *
 * Rules:
 *   - Option premium from Wheelwright contracts → PRODUCTION
 *   - Appreciation realized via covered-call assignment (ASSIGNED_CALL_STOCK_SALE)
 *     above basis → PRODUCTION/REALIZED_APPRECIATION
 *   - Discretionary stock sale (ASSET_SALE) above basis → NOT PRODUCTION
 *   - Discretionary stock sale below basis → NOT PRODUCTION (and not CAPITAL_EROSION
 *     in the Wheelwright sense — it's a portfolio loss, not a strategy loss)
 *   - The same disposition logic must not conflate lifecycle-attributed realization
 *     with generic portfolio realization
 */
class ProductionAttributionTest {

    private final TreasuryBasisResolver treasuryResolver = new TreasuryBasisResolver();
    private final EconomicDecomposer decomposer = new EconomicDecomposer(treasuryResolver);

    // --- Helpers ---

    private NormalizedTransaction makePurchase(String symbol, LocalDate date, BigDecimal totalCost, BigDecimal qty) {
        return new NormalizedTransaction(
            "purchase-" + symbol + "-" + date,
            date, date.plusDays(2),
            FidelityTransactionKind.ASSET_PURCHASE,
            "YOU BOUGHT " + symbol,
            symbol, symbol + " description",
            totalCost.negate(), // purchases are negative cash
            BigDecimal.ZERO, BigDecimal.ZERO,
            totalCost.divide(qty, 2, java.math.RoundingMode.HALF_UP), // price per share
            qty
        );
    }

    private NormalizedTransaction makeAssignmentPurchase(String symbol, LocalDate date, BigDecimal totalCost, BigDecimal qty) {
        return new NormalizedTransaction(
            "assigned-put-buy-" + symbol + "-" + date,
            date, date.plusDays(2),
            FidelityTransactionKind.ASSIGNED_PUT_STOCK_PURCHASE,
            "YOU BOUGHT ASSIGNED PUTS AS OF " + date + " " + symbol,
            symbol, symbol + " description",
            totalCost.negate(),
            BigDecimal.ZERO, BigDecimal.ZERO,
            totalCost.divide(qty, 2, java.math.RoundingMode.HALF_UP),
            qty
        );
    }

    private NormalizedTransaction makeDiscretionarySale(String symbol, LocalDate date, BigDecimal proceeds, BigDecimal qty) {
        return new NormalizedTransaction(
            "sale-" + symbol + "-" + date,
            date, date.plusDays(2),
            FidelityTransactionKind.ASSET_SALE,
            "YOU SOLD " + symbol,
            symbol, symbol + " description",
            proceeds,
            BigDecimal.ZERO, BigDecimal.ZERO,
            proceeds.divide(qty, 2, java.math.RoundingMode.HALF_UP),
            qty.negate()
        );
    }

    private NormalizedTransaction makeAssignedCallSale(String symbol, LocalDate date, BigDecimal proceeds, BigDecimal qty) {
        return new NormalizedTransaction(
            "assigned-call-sale-" + symbol + "-" + date,
            date, date.plusDays(2),
            FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE,
            "YOU SOLD ASSIGNED CALLS AS OF " + date + " " + symbol,
            symbol, symbol + " description",
            proceeds,
            BigDecimal.ZERO, BigDecimal.ZERO,
            proceeds.divide(qty, 2, java.math.RoundingMode.HALF_UP),
            qty.negate()
        );
    }

    // --- Tests: Assigned-call sale (Wheelwright lifecycle) ---

    @Test
    @DisplayName("assigned-call sale above basis → PRODUCTION/REALIZED_APPRECIATION (lifecycle attribution)")
    void assignedCallAboveBasis_isProduction() {
        // Shares acquired at $50/share via put assignment, called away at $55/share
        var purchase = makeAssignmentPurchase("XLE", LocalDate.of(2026, 7, 2),
            new BigDecimal("5000"), new BigDecimal("100"));
        var sale = makeAssignedCallSale("XLE", LocalDate.of(2026, 8, 3),
            new BigDecimal("5500"), new BigDecimal("100"));
        var allTx = List.of(purchase, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        // Should produce: PRINCIPAL_MOVEMENT (basis return) + PRODUCTION/REALIZED_APPRECIATION (gain)
        EconomicComponent production = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION)
            .findFirst().orElse(null);

        assertNotNull(production, "Assigned-call sale above basis must produce PRODUCTION");
        assertEquals(ProductionSource.REALIZED_APPRECIATION, production.source());
        assertEquals(new BigDecimal("500"), production.amount());
        assertEquals(Confidence.DETERMINISTIC, production.confidence());
    }

    @Test
    @DisplayName("assigned-call sale below basis → CAPITAL_EROSION (lifecycle loss)")
    void assignedCallBelowBasis_isErosion() {
        // Shares acquired at $57.50/share via put assignment, called away at $55/share
        var purchase = makeAssignmentPurchase("XLE", LocalDate.of(2026, 7, 2),
            new BigDecimal("11500"), new BigDecimal("200"));
        var sale = makeAssignedCallSale("XLE", LocalDate.of(2026, 8, 3),
            new BigDecimal("10999.77"), new BigDecimal("200"));
        var allTx = List.of(purchase, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        EconomicComponent erosion = components.stream()
            .filter(c -> c.type() == ComponentType.CAPITAL_EROSION)
            .findFirst().orElse(null);

        assertNotNull(erosion, "Assigned-call sale below basis must produce CAPITAL_EROSION");
        assertEquals(new BigDecimal("500.23"), erosion.amount());

        // Must NOT produce any PRODUCTION component
        boolean hasProduction = components.stream().anyMatch(c -> c.type() == ComponentType.PRODUCTION);
        assertFalse(hasProduction, "Assigned-call sale below basis must NOT produce PRODUCTION");
    }

    // --- Tests: Discretionary stock sale (NOT Wheelwright lifecycle) ---

    @Test
    @DisplayName("discretionary stock sale above basis → NOT PRODUCTION")
    void discretionarySaleAboveBasis_isNotProduction() {
        // QQQM bought at $200, sold at $220 — pure portfolio realization, not Wheelwright
        var purchase = makePurchase("QQQM", LocalDate.of(2026, 3, 15),
            new BigDecimal("20000"), new BigDecimal("100"));
        var sale = makeDiscretionarySale("QQQM", LocalDate.of(2026, 8, 10),
            new BigDecimal("22000"), new BigDecimal("100"));
        var allTx = List.of(purchase, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        // Must NOT produce any PRODUCTION component
        boolean hasProduction = components.stream().anyMatch(c -> c.type() == ComponentType.PRODUCTION);
        assertFalse(hasProduction,
            "Discretionary stock sale must NOT contribute to Production regardless of gain");

        // Should still record the principal return
        boolean hasPrincipal = components.stream().anyMatch(c -> c.type() == ComponentType.PRINCIPAL_MOVEMENT);
        assertTrue(hasPrincipal, "Sale should produce a PRINCIPAL_MOVEMENT for returned capital");
    }

    @Test
    @DisplayName("discretionary stock sale below basis → NOT CAPITAL_EROSION (not a strategy loss)")
    void discretionarySaleBelowBasis_isNotErosion() {
        // VOO bought at $500, sold at $480 — discretionary loss
        var purchase = makePurchase("VOO", LocalDate.of(2026, 1, 10),
            new BigDecimal("50000"), new BigDecimal("100"));
        var sale = makeDiscretionarySale("VOO", LocalDate.of(2026, 8, 12),
            new BigDecimal("48000"), new BigDecimal("100"));
        var allTx = List.of(purchase, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        // Must NOT produce CAPITAL_EROSION (that's reserved for Wheelwright strategy losses)
        boolean hasErosion = components.stream().anyMatch(c -> c.type() == ComponentType.CAPITAL_EROSION);
        assertFalse(hasErosion,
            "Discretionary stock sale loss is NOT Wheelwright CAPITAL_EROSION");

        // Must NOT produce PRODUCTION
        boolean hasProduction = components.stream().anyMatch(c -> c.type() == ComponentType.PRODUCTION);
        assertFalse(hasProduction,
            "Discretionary stock sale must NOT produce PRODUCTION");
    }

    @Test
    @DisplayName("discretionary sale at basis → only PRINCIPAL_MOVEMENT")
    void discretionarySaleAtBasis_onlyPrincipal() {
        var purchase = makePurchase("RSP", LocalDate.of(2026, 5, 1),
            new BigDecimal("10000"), new BigDecimal("50"));
        var sale = makeDiscretionarySale("RSP", LocalDate.of(2026, 8, 5),
            new BigDecimal("10000"), new BigDecimal("50"));
        var allTx = List.of(purchase, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        assertEquals(1, components.size());
        assertEquals(ComponentType.PRINCIPAL_MOVEMENT, components.get(0).type());
    }

    // --- Tests: Production aggregation invariant ---

    @Test
    @DisplayName("month with both lifecycle and discretionary sales — only lifecycle contributes to production")
    void mixedMonth_onlyLifecycleCountsAsProduction() {
        // Lifecycle: shares from put assignment, called away above basis
        var assignmentBuy = makeAssignmentPurchase("XLE", LocalDate.of(2026, 7, 2),
            new BigDecimal("5000"), new BigDecimal("100"));
        var assignedSale = makeAssignedCallSale("XLE", LocalDate.of(2026, 8, 3),
            new BigDecimal("5500"), new BigDecimal("100"));

        // Discretionary: regular stock sold at profit
        var stockBuy = makePurchase("QQQM", LocalDate.of(2026, 3, 15),
            new BigDecimal("20000"), new BigDecimal("100"));
        var stockSale = makeDiscretionarySale("QQQM", LocalDate.of(2026, 8, 10),
            new BigDecimal("28830.26"), new BigDecimal("100"));

        var allTx = List.of(assignmentBuy, assignedSale, stockBuy, stockSale);

        // Decompose both sales
        var lifecycleComponents = decomposer.decompose(assignedSale, allTx);
        var discretionaryComponents = decomposer.decompose(stockSale, allTx);

        // Total production from lifecycle sale
        BigDecimal lifecycleProduction = lifecycleComponents.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION)
            .map(EconomicComponent::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("500"), lifecycleProduction);

        // Zero production from discretionary sale
        BigDecimal discretionaryProduction = discretionaryComponents.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION)
            .map(EconomicComponent::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(BigDecimal.ZERO, discretionaryProduction,
            "Discretionary $8,830.26 gain must contribute ZERO to production");
    }
}
