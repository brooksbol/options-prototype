package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Transforms classified NormalizedTransactions into economic components.
 *
 * This is the layer that assigns economic meaning:
 * - Option premium → PRODUCTION
 * - SPAXX dividends → PRODUCTION (DETERMINISTIC)
 * - Other dividends → PRODUCTION (CHARACTER_UNCERTAIN)
 * - Treasury redemption → split into PRINCIPAL_MOVEMENT + PRODUCTION/TREASURY_DISCOUNT
 * - Dispositions → PRINCIPAL_MOVEMENT + PRODUCTION/REALIZED_APPRECIATION or CAPITAL_EROSION
 * - Deposits/withdrawals → PRINCIPAL_MOVEMENT
 * - Purchases → CAPITAL_DEPLOYMENT
 * - Lifecycle events → LIFECYCLE_NOTIFICATION
 *
 * Implements asymmetric realization: gains are PRODUCTION, losses are CAPITAL_EROSION.
 */
public class EconomicDecomposer {

    private final TreasuryBasisResolver treasuryResolver;

    public EconomicDecomposer(TreasuryBasisResolver treasuryResolver) {
        this.treasuryResolver = treasuryResolver;
    }

    /**
     * Decompose a single normalized transaction into its economic components.
     *
     * @param tx              The transaction to decompose
     * @param allTransactions All transactions in the dataset (for basis resolution)
     * @return One or more economic components
     */
    public List<EconomicComponent> decompose(NormalizedTransaction tx, List<NormalizedTransaction> allTransactions) {
        return switch (tx.kind()) {
            // Option premium — entire net amount is production
            case OPTION_SELL_TO_OPEN_PUT, OPTION_SELL_TO_OPEN_CALL -> List.of(
                new EconomicComponent(tx.id(), ComponentType.PRODUCTION, ProductionSource.OPTION_PREMIUM,
                    tx.amount(), Confidence.DETERMINISTIC,
                    "Option premium received: " + tx.rawAction())
            );

            // SPAXX money market — structurally income
            case MONEY_MARKET_DIVIDEND -> List.of(
                new EconomicComponent(tx.id(), ComponentType.PRODUCTION, ProductionSource.MONEY_MARKET_INCOME,
                    tx.amount(), Confidence.DETERMINISTIC,
                    "SPAXX money-market income")
            );

            // Other fund distributions — character uncertain
            case DIVIDEND_RECEIVED -> List.of(
                new EconomicComponent(tx.id(), ComponentType.PRODUCTION, ProductionSource.DIVIDEND,
                    tx.amount(), Confidence.CHARACTER_UNCERTAIN,
                    "Distribution character (income vs return of capital) not determinable from Activity History")
            );

            // Treasury redemption — split into principal + discount
            case TREASURY_REDEMPTION -> decomposeTreasuryRedemption(tx, allTransactions);

            // Assignment-related stock flows
            case ASSIGNED_PUT_STOCK_PURCHASE -> List.of(
                new EconomicComponent(tx.id(), ComponentType.CAPITAL_DEPLOYMENT, null,
                    tx.amount().abs(), Confidence.DETERMINISTIC,
                    "Share acquisition via put assignment at $" + tx.price() + "/share")
            );

            case ASSIGNED_CALL_STOCK_SALE -> decomposeDisposition(tx, allTransactions);

            // General asset transactions
            case ASSET_SALE -> decomposeDisposition(tx, allTransactions);

            case ASSET_PURCHASE, TREASURY_PURCHASE -> List.of(
                new EconomicComponent(tx.id(), ComponentType.CAPITAL_DEPLOYMENT, null,
                    tx.amount().abs(), Confidence.DETERMINISTIC,
                    "Asset purchase: " + tx.symbol())
            );

            // Principal movements
            case EFT_DEPOSIT, WIRE_DEPOSIT -> List.of(
                new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                    tx.amount().abs(), Confidence.DETERMINISTIC,
                    "External deposit")
            );

            case EFT_WITHDRAWAL -> List.of(
                new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                    tx.amount().abs(), Confidence.DETERMINISTIC,
                    "External withdrawal")
            );

            case TRANSFER_OUT -> List.of(
                new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                    tx.amount().abs(), Confidence.DETERMINISTIC,
                    "Internal transfer out")
            );

            case ACAT_TRANSFER -> List.of(
                new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                    tx.amount() != null ? tx.amount().abs() : BigDecimal.ZERO, Confidence.DETERMINISTIC,
                    "Account transfer (ACAT)")
            );

            // Lifecycle notifications — $0 impact
            case ASSIGNMENT_NOTIFICATION, EXPIRATION_NOTIFICATION -> List.of(
                new EconomicComponent(tx.id(), ComponentType.LIFECYCLE_NOTIFICATION, null,
                    BigDecimal.ZERO, Confidence.DETERMINISTIC,
                    "Lifecycle event: " + tx.rawAction())
            );

            // Reinvestment
            case REINVESTMENT -> List.of(
                new EconomicComponent(tx.id(), ComponentType.REINVESTMENT, null,
                    tx.amount().abs(), Confidence.DETERMINISTIC,
                    "Automated reinvestment of income")
            );

            // Unknown
            case UNCLASSIFIED -> List.of(
                new EconomicComponent(tx.id(), ComponentType.UNRESOLVED, null,
                    tx.amount() != null ? tx.amount().abs() : BigDecimal.ZERO, Confidence.BASIS_UNKNOWN,
                    "Unclassified Fidelity action: " + tx.rawAction())
            );
        };
    }

    private List<EconomicComponent> decomposeTreasuryRedemption(NormalizedTransaction tx,
                                                                 List<NormalizedTransaction> allTransactions) {
        String cusip = tx.symbol();
        BigDecimal redemptionAmount = tx.amount(); // positive (cash received)
        BigDecimal redeemedQuantity = tx.quantity().abs(); // face value redeemed

        TreasuryBasisResolver.BasisResult basis = treasuryResolver.resolve(
            cusip, redeemedQuantity, allTransactions, tx.date());

        if (basis.fullyResolved()) {
            BigDecimal discountIncome = redemptionAmount.subtract(basis.totalCost());
            List<EconomicComponent> components = new ArrayList<>();

            // Principal return
            components.add(new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                basis.totalCost(), Confidence.DETERMINISTIC,
                "Treasury principal returned: cost basis $" + basis.totalCost()));

            // Discount income (production)
            if (discountIncome.compareTo(BigDecimal.ZERO) > 0) {
                components.add(new EconomicComponent(tx.id(), ComponentType.PRODUCTION,
                    ProductionSource.TREASURY_DISCOUNT, discountIncome, Confidence.DETERMINISTIC,
                    "Treasury discount: $" + redemptionAmount + " redeemed - $" + basis.totalCost() +
                    " cost = $" + discountIncome + " income. " + basis.explanation()));
            }

            return components;
        } else {
            // Cannot determine basis — entire amount is unresolved
            return List.of(
                new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                    redemptionAmount, Confidence.BASIS_UNKNOWN,
                    "Treasury redeemed at par; " + basis.explanation())
            );
        }
    }

    private List<EconomicComponent> decomposeDisposition(NormalizedTransaction tx,
                                                          List<NormalizedTransaction> allTransactions) {
        BigDecimal proceeds = tx.amount(); // positive (cash received from sale)

        // Try to find basis from prior acquisition
        BigDecimal basis = findDispositionBasis(tx, allTransactions);

        if (basis == null) {
            // Cannot determine gain/loss — treat as unresolved
            return List.of(
                new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                    proceeds, Confidence.BASIS_UNKNOWN,
                    "Disposition of " + tx.symbol() + "; cost basis unavailable — gain/loss undetermined")
            );
        }

        BigDecimal gainOrLoss = proceeds.subtract(basis);
        List<EconomicComponent> components = new ArrayList<>();

        if (gainOrLoss.compareTo(BigDecimal.ZERO) > 0) {
            // Sold above basis: principal return + realized appreciation
            components.add(new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                basis, Confidence.DETERMINISTIC,
                "Return of capital deployed: $" + basis));
            components.add(new EconomicComponent(tx.id(), ComponentType.PRODUCTION,
                ProductionSource.REALIZED_APPRECIATION, gainOrLoss, Confidence.DETERMINISTIC,
                "Realized appreciation: sold at $" + tx.price() + " vs basis; gain $" + gainOrLoss));
        } else if (gainOrLoss.compareTo(BigDecimal.ZERO) < 0) {
            // Sold below basis: partial principal return + capital erosion
            components.add(new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                proceeds, Confidence.DETERMINISTIC,
                "Partial return of capital (sold below basis)"));
            components.add(new EconomicComponent(tx.id(), ComponentType.CAPITAL_EROSION, null,
                gainOrLoss.abs(), Confidence.DETERMINISTIC,
                "Realized loss: sold at $" + tx.price() + " vs basis; loss $" + gainOrLoss.abs()));
        } else {
            // Sold at basis: pure principal return
            components.add(new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                proceeds, Confidence.DETERMINISTIC,
                "Return of capital at basis"));
        }

        return components;
    }

    /**
     * Find cost basis for a disposition by looking at prior acquisitions.
     *
     * For assigned-call sales: basis comes from the most recent ASSIGNED_PUT_STOCK_PURCHASE
     * of the same symbol (the put assignment that created the shares).
     *
     * For general asset sales: basis from prior ASSET_PURCHASE of the same symbol.
     *
     * Returns null if basis cannot be determined.
     */
    private BigDecimal findDispositionBasis(NormalizedTransaction saleTx,
                                            List<NormalizedTransaction> allTransactions) {
        String symbol = saleTx.symbol();
        BigDecimal saleQty = saleTx.quantity().abs();

        // For assigned-call sales, look for the put-assignment stock purchase
        if (saleTx.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE) {
            // Find the most recent ASSIGNED_PUT_STOCK_PURCHASE for this symbol before the sale
            return allTransactions.stream()
                .filter(tx -> tx.kind() == FidelityTransactionKind.ASSIGNED_PUT_STOCK_PURCHASE)
                .filter(tx -> symbol.equals(tx.symbol()))
                .filter(tx -> tx.date().isBefore(saleTx.date()) || tx.date().isEqual(saleTx.date()))
                .filter(tx -> tx.quantity().abs().compareTo(saleQty) >= 0)
                .reduce((a, b) -> b) // last one (most recent, since list is chronological)
                .map(tx -> tx.amount().abs()) // basis = what was paid for the shares
                .orElse(null);
        }

        // For general asset sales, look for prior purchases
        // (simplified: most recent purchase of same symbol with matching quantity)
        return allTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.ASSET_PURCHASE ||
                         tx.kind() == FidelityTransactionKind.TREASURY_PURCHASE)
            .filter(tx -> symbol.equals(tx.symbol()))
            .filter(tx -> tx.date().isBefore(saleTx.date()))
            .reduce((a, b) -> b) // most recent
            .map(tx -> tx.amount().abs())
            .orElse(null);
    }
}
