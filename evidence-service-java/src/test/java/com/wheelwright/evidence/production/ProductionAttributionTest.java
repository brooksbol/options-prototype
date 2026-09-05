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
            "purchase-" + symbol + "-" + date, -1,
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
            "assigned-put-buy-" + symbol + "-" + date, -1,
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
            "sale-" + symbol + "-" + date, -1,
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
            "assigned-call-sale-" + symbol + "-" + date, -1,
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
        assertEquals(0, production.amount().compareTo(new BigDecimal("500")));
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

    // --- Tests: Direct-purchase called-away basis resolution (Issue #3) ---

    @Test
    @DisplayName("Issue #3: single direct-purchase → covered call → call-away resolves basis (SLV-shaped)")
    void directPurchaseCalledAway_singleLot_resolvesBasis() {
        // SLV-shaped: 100 shares bought directly at $62.50, called away at $59.00 net $5,899.87
        var purchase = makePurchase("SLV", LocalDate.of(2026, 8, 24),
            new BigDecimal("6250"), new BigDecimal("100"));
        var sale = makeAssignedCallSale("SLV", LocalDate.of(2026, 9, 3),
            new BigDecimal("5899.87"), new BigDecimal("100"));
        var allTx = List.of(purchase, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        // Returned attributable principal
        EconomicComponent principal = components.stream()
            .filter(c -> c.type() == ComponentType.PRINCIPAL_MOVEMENT)
            .findFirst().orElse(null);
        assertNotNull(principal, "Direct-purchase call-away must return principal when basis resolvable");

        // Realized erosion: 6250 - 5899.87 = 350.13
        EconomicComponent erosion = components.stream()
            .filter(c -> c.type() == ComponentType.CAPITAL_EROSION)
            .findFirst().orElse(null);
        assertNotNull(erosion, "Sold below direct-purchase basis must produce CAPITAL_EROSION");
        assertEquals(new BigDecimal("350.13"), erosion.amount());

        // No BASIS_UNKNOWN component
        boolean hasUnknown = components.stream().anyMatch(c -> c.confidence() == Confidence.BASIS_UNKNOWN);
        assertFalse(hasUnknown, "Single unambiguous direct purchase must resolve, not BASIS_UNKNOWN");
    }

    @Test
    @DisplayName("Issue #3: direct-purchase above basis → REALIZED_APPRECIATION")
    void directPurchaseCalledAway_aboveBasis_isAppreciation() {
        // 100 shares bought directly at $50.00, called away at $55.00
        var purchase = makePurchase("ABC", LocalDate.of(2026, 8, 1),
            new BigDecimal("5000"), new BigDecimal("100"));
        var sale = makeAssignedCallSale("ABC", LocalDate.of(2026, 9, 4),
            new BigDecimal("5500"), new BigDecimal("100"));
        var allTx = List.of(purchase, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        EconomicComponent production = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION)
            .findFirst().orElse(null);
        assertNotNull(production, "Direct-purchase call-away above basis must produce PRODUCTION");
        assertEquals(ProductionSource.REALIZED_APPRECIATION, production.source());
        assertEquals(0, production.amount().compareTo(new BigDecimal("500")),
            "gain = 5500 - (50.00 x 100) = 500");
    }

    @Test
    @DisplayName("Issue #3: uniform-price multi direct purchases resolve (no lot ambiguity)")
    void directPurchaseCalledAway_uniformPrice_resolves() {
        // Two direct purchases at the SAME price $50.00 → attribution unambiguous per-share
        var buy1 = makePurchase("UNI", LocalDate.of(2026, 8, 1),
            new BigDecimal("5000"), new BigDecimal("100"));
        var buy2 = makePurchase("UNI", LocalDate.of(2026, 8, 2),
            new BigDecimal("5000"), new BigDecimal("100"));
        var sale = makeAssignedCallSale("UNI", LocalDate.of(2026, 9, 4),
            new BigDecimal("5300"), new BigDecimal("100"));
        var allTx = List.of(buy1, buy2, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        EconomicComponent production = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION)
            .findFirst().orElse(null);
        assertNotNull(production, "Uniform-price purchases must resolve basis (per-share × qty)");
        assertEquals(ProductionSource.REALIZED_APPRECIATION, production.source());
        // basis = 50.00 × 100 = 5000; gain = 5300 - 5000 = 300
        assertEquals(new BigDecimal("300.00"), production.amount());
    }

    @Test
    @DisplayName("Issue #3: BNO multi-price direct purchases → BASIS_UNKNOWN (refuse to invent lot allocation)")
    void directPurchaseCalledAway_multiPrice_isBasisUnknown() {
        // BNO-shaped: four direct purchases at DIFFERING prices; called away — attribution ambiguous.
        var buy1 = makePurchase("BNO", LocalDate.of(2026, 8, 12), new BigDecimal("5071"), new BigDecimal("100")); // 50.71
        var buy2 = makePurchase("BNO", LocalDate.of(2026, 8, 18), new BigDecimal("5213"), new BigDecimal("100")); // 52.13
        var buy3 = makePurchase("BNO", LocalDate.of(2026, 8, 24), new BigDecimal("5305"), new BigDecimal("100")); // 53.05
        var buy4 = makePurchase("BNO", LocalDate.of(2026, 8, 24), new BigDecimal("5309"), new BigDecimal("100")); // 53.09
        var sale = makeAssignedCallSale("BNO", LocalDate.of(2026, 9, 8),
            new BigDecimal("10799.77"), new BigDecimal("200")); // 200 called at $54
        var allTx = List.of(buy1, buy2, buy3, buy4, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        // Must remain BASIS_UNKNOWN — no invented FIFO/LIFO/latest attribution
        EconomicComponent unresolved = components.stream()
            .filter(c -> c.confidence() == Confidence.BASIS_UNKNOWN)
            .findFirst().orElse(null);
        assertNotNull(unresolved, "Differing-price direct purchases must remain BASIS_UNKNOWN");
        assertEquals(ComponentType.PRINCIPAL_MOVEMENT, unresolved.type());

        // Must NOT fabricate appreciation or erosion
        boolean hasProduction = components.stream().anyMatch(c -> c.type() == ComponentType.PRODUCTION);
        boolean hasErosion = components.stream().anyMatch(c -> c.type() == ComponentType.CAPITAL_EROSION);
        assertFalse(hasProduction, "Ambiguous basis must not fabricate realized appreciation");
        assertFalse(hasErosion, "Ambiguous basis must not fabricate realized erosion");
    }

    @Test
    @DisplayName("Issue #3: put-assignment basis still resolves and takes precedence (regression)")
    void putAssignmentBasis_stillResolves() {
        // Wheel path must be unchanged: put-assigned shares called away resolve via put-assignment basis.
        var putBuy = makeAssignmentPurchase("XLE", LocalDate.of(2026, 7, 2),
            new BigDecimal("5000"), new BigDecimal("100"));
        var sale = makeAssignedCallSale("XLE", LocalDate.of(2026, 8, 3),
            new BigDecimal("5500"), new BigDecimal("100"));
        var allTx = List.of(putBuy, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        EconomicComponent production = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION)
            .findFirst().orElse(null);
        assertNotNull(production, "Put-assignment basis path must remain intact");
        assertEquals(0, production.amount().compareTo(new BigDecimal("500")));
    }

    @Test
    @DisplayName("Issue #3 attribution-safety: acquired 50, disposed 100 → BASIS_UNKNOWN (insufficient inventory)")
    void directPurchase_insufficientQuantity_isBasisUnknown() {
        // Only 50 shares acquired; a 100-share call-away cannot be attributed.
        var buy = makePurchase("INS", LocalDate.of(2026, 8, 1),
            new BigDecimal("2500"), new BigDecimal("50"));
        var sale = makeAssignedCallSale("INS", LocalDate.of(2026, 9, 4),
            new BigDecimal("5500"), new BigDecimal("100"));
        var allTx = List.of(buy, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        EconomicComponent unresolved = components.stream()
            .filter(c -> c.confidence() == Confidence.BASIS_UNKNOWN).findFirst().orElse(null);
        assertNotNull(unresolved, "Insufficient acquired inventory must remain BASIS_UNKNOWN");
        boolean hasProduction = components.stream().anyMatch(c -> c.type() == ComponentType.PRODUCTION);
        boolean hasErosion = components.stream().anyMatch(c -> c.type() == ComponentType.CAPITAL_EROSION);
        assertFalse(hasProduction, "Insufficient inventory must not fabricate appreciation");
        assertFalse(hasErosion, "Insufficient inventory must not fabricate erosion");
    }

    @Test
    @DisplayName("Issue #3 attribution-safety: prior sale consumed inventory → BASIS_UNKNOWN (not reused)")
    void directPurchase_priorConsumption_isBasisUnknown() {
        // Acquire 100; a prior discretionary sale of 100 consumes it. A later 100-share
        // call-away has no proven non-consumed inventory → must remain BASIS_UNKNOWN.
        var buy = makePurchase("CON", LocalDate.of(2026, 8, 1),
            new BigDecimal("5000"), new BigDecimal("100"));
        var priorSale = makeDiscretionarySale("CON", LocalDate.of(2026, 8, 15),
            new BigDecimal("5200"), new BigDecimal("100"));
        var calledAway = makeAssignedCallSale("CON", LocalDate.of(2026, 9, 4),
            new BigDecimal("5300"), new BigDecimal("100"));
        var allTx = List.of(buy, priorSale, calledAway);

        List<EconomicComponent> components = decomposer.decompose(calledAway, allTx);

        EconomicComponent unresolved = components.stream()
            .filter(c -> c.confidence() == Confidence.BASIS_UNKNOWN).findFirst().orElse(null);
        assertNotNull(unresolved, "Prior-consumed inventory must not be reused as basis");
        boolean hasRealized = components.stream()
            .anyMatch(c -> c.type() == ComponentType.PRODUCTION || c.type() == ComponentType.CAPITAL_EROSION);
        assertFalse(hasRealized, "Consumed inventory must not fabricate realized economics");
    }

    @Test
    @DisplayName("Issue #3 attribution-safety: mixed put+direct at differing costs → BASIS_UNKNOWN")
    void mixedPutAndDirect_differingCost_isBasisUnknown() {
        // 100 shares via put assignment at $50, 100 shares direct at $53 → mixed cost.
        var putBuy = makeAssignmentPurchase("MIX", LocalDate.of(2026, 8, 1),
            new BigDecimal("5000"), new BigDecimal("100"));
        var directBuy = makePurchase("MIX", LocalDate.of(2026, 8, 10),
            new BigDecimal("5300"), new BigDecimal("100"));
        var calledAway = makeAssignedCallSale("MIX", LocalDate.of(2026, 9, 4),
            new BigDecimal("5400"), new BigDecimal("100"));
        var allTx = List.of(putBuy, directBuy, calledAway);

        List<EconomicComponent> components = decomposer.decompose(calledAway, allTx);

        EconomicComponent unresolved = components.stream()
            .filter(c -> c.confidence() == Confidence.BASIS_UNKNOWN).findFirst().orElse(null);
        assertNotNull(unresolved, "Mixed-cost inventory must remain BASIS_UNKNOWN");
        boolean hasRealized = components.stream()
            .anyMatch(c -> c.type() == ComponentType.PRODUCTION || c.type() == ComponentType.CAPITAL_EROSION);
        assertFalse(hasRealized, "Mixed-cost attribution must not fabricate realized economics");
    }

    @Test
    @DisplayName("Issue #3 attribution-safety: put-assigned 200, only 100 called away → basis is quantity-correct (not full 200)")
    void putAssigned_partialCallAway_quantityCorrectBasis() {
        // 200 shares put-assigned at $57.50 ($11,500). Only 100 called away at $55 ($5,499.xx).
        // Basis for the 100-share disposition must be $5,750 (57.50 × 100), NOT the full $11,500.
        var putBuy = makeAssignmentPurchase("PAR", LocalDate.of(2026, 8, 1),
            new BigDecimal("11500"), new BigDecimal("200"));
        var calledAway = makeAssignedCallSale("PAR", LocalDate.of(2026, 9, 4),
            new BigDecimal("5490"), new BigDecimal("100"));
        var allTx = List.of(putBuy, calledAway);

        List<EconomicComponent> components = decomposer.decompose(calledAway, allTx);

        // Sold below quantity-correct basis 5750 → erosion 5750 - 5490 = 260
        EconomicComponent erosion = components.stream()
            .filter(c -> c.type() == ComponentType.CAPITAL_EROSION).findFirst().orElse(null);
        assertNotNull(erosion, "Partial call-away must resolve against quantity-correct basis");
        assertEquals(0, erosion.amount().compareTo(new BigDecimal("260")),
            "basis = 57.50 x 100 = 5750; erosion = 5750 - 5490 = 260 (NOT full-200 over-attribution)");

        // The principal-movement (partial return of capital) must equal proceeds, not $11,500.
        EconomicComponent principal = components.stream()
            .filter(c -> c.type() == ComponentType.PRINCIPAL_MOVEMENT).findFirst().orElse(null);
        assertNotNull(principal);
        assertEquals(0, principal.amount().compareTo(new BigDecimal("5490")));
    }

    @Test
    @DisplayName("Issue #3 same-day: acquisition dated same day as disposition → BASIS_UNKNOWN (no intraday ordering)")
    void sameDayAcquisition_notAvailableInventory_isBasisUnknown() {
        // 100 shares bought the SAME day as the 100-share call-away. Absent authoritative
        // intraday ordering, the same-day purchase does not count as available inventory.
        var buy = makePurchase("SDA", LocalDate.of(2026, 9, 4),
            new BigDecimal("5000"), new BigDecimal("100"));
        var sale = makeAssignedCallSale("SDA", LocalDate.of(2026, 9, 4),
            new BigDecimal("5300"), new BigDecimal("100"));
        var allTx = List.of(buy, sale);

        List<EconomicComponent> components = decomposer.decompose(sale, allTx);

        EconomicComponent unresolved = components.stream()
            .filter(c -> c.confidence() == Confidence.BASIS_UNKNOWN).findFirst().orElse(null);
        assertNotNull(unresolved, "Same-day acquisition must not be treated as prior inventory");
        boolean hasRealized = components.stream()
            .anyMatch(c -> c.type() == ComponentType.PRODUCTION || c.type() == ComponentType.CAPITAL_EROSION);
        assertFalse(hasRealized, "Same-day acquisition must not fabricate realized economics");
    }

    @Test
    @DisplayName("Issue #3 same-day group (sufficient): 200 eligible before date, two same-day 100 call-aways → both resolve")
    void sameDayGroupSufficient_bothResolve() {
        // 200 shares acquired uniformly BEFORE the disposition date; two same-day 100-share
        // call-aways. Group total (200) is covered by opening inventory (200) → both resolve.
        var buy1 = makePurchase("SDG", LocalDate.of(2026, 8, 1), new BigDecimal("5000"), new BigDecimal("100")); // 50.00
        var buy2 = makePurchase("SDG", LocalDate.of(2026, 8, 2), new BigDecimal("5000"), new BigDecimal("100")); // 50.00
        // Two same-day call-aways, disambiguated by strike/price (55 and 56)
        var sale1 = makeAssignedCallSale("SDG", LocalDate.of(2026, 9, 4), new BigDecimal("5500"), new BigDecimal("100"));
        var sale2 = makeAssignedCallSale("SDG", LocalDate.of(2026, 9, 4), new BigDecimal("5600"), new BigDecimal("100"));
        var allTx = List.of(buy1, buy2, sale1, sale2);

        var c1 = decomposer.decompose(sale1, allTx);
        var c2 = decomposer.decompose(sale2, allTx);

        // Both resolve against basis 50.00 × 100 = 5000: sale1 gain 500, sale2 gain 600.
        EconomicComponent p1 = c1.stream().filter(c -> c.type() == ComponentType.PRODUCTION).findFirst().orElse(null);
        EconomicComponent p2 = c2.stream().filter(c -> c.type() == ComponentType.PRODUCTION).findFirst().orElse(null);
        assertNotNull(p1, "sale1 must resolve when same-day group is covered");
        assertNotNull(p2, "sale2 must resolve when same-day group is covered");
        assertEquals(0, p1.amount().compareTo(new BigDecimal("500")));
        assertEquals(0, p2.amount().compareTo(new BigDecimal("600")));
    }

    @Test
    @DisplayName("Issue #3 same-day group (insufficient): 100 eligible, two same-day 100 call-aways → neither resolves")
    void sameDayGroupInsufficient_neitherResolves() {
        // Only 100 shares acquired before the date; two same-day 100-share call-aways.
        // The group (200) exceeds opening inventory (100) → neither may reuse the same 100.
        var buy = makePurchase("SDI", LocalDate.of(2026, 8, 1), new BigDecimal("5000"), new BigDecimal("100"));
        var sale1 = makeAssignedCallSale("SDI", LocalDate.of(2026, 9, 4), new BigDecimal("5500"), new BigDecimal("100"));
        var sale2 = makeAssignedCallSale("SDI", LocalDate.of(2026, 9, 4), new BigDecimal("5600"), new BigDecimal("100"));
        var allTx = List.of(buy, sale1, sale2);

        var c1 = decomposer.decompose(sale1, allTx);
        var c2 = decomposer.decompose(sale2, allTx);

        boolean r1 = c1.stream().anyMatch(c -> c.type() == ComponentType.PRODUCTION || c.type() == ComponentType.CAPITAL_EROSION);
        boolean r2 = c2.stream().anyMatch(c -> c.type() == ComponentType.PRODUCTION || c.type() == ComponentType.CAPITAL_EROSION);
        assertFalse(r1, "sale1 must not reuse insufficient same-day-group inventory");
        assertFalse(r2, "sale2 must not reuse insufficient same-day-group inventory");
        assertTrue(c1.stream().anyMatch(c -> c.confidence() == Confidence.BASIS_UNKNOWN));
        assertTrue(c2.stream().anyMatch(c -> c.confidence() == Confidence.BASIS_UNKNOWN));
    }

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
        assertEquals(0, lifecycleProduction.compareTo(new BigDecimal("500")));

        // Zero production from discretionary sale
        BigDecimal discretionaryProduction = discretionaryComponents.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION)
            .map(EconomicComponent::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(BigDecimal.ZERO, discretionaryProduction,
            "Discretionary $8,830.26 gain must contribute ZERO to production");
    }
}
