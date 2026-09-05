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

            case ASSIGNED_CALL_STOCK_SALE -> decomposeLifecycleDisposition(tx, allTransactions);

            // General asset transactions — discretionary sales have no lifecycle attribution
            case ASSET_SALE -> decomposePortfolioSale(tx, allTransactions);

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

    /**
     * Decompose a lifecycle-attributed disposition (e.g., shares called away via assignment).
     *
     * Gains are PRODUCTION/REALIZED_APPRECIATION — the appreciation is causally attributable
     * to the Wheelwright strategy that managed these shares through their lifecycle.
     * Losses are CAPITAL_EROSION — the strategy resolution consumed principal.
     */
    private List<EconomicComponent> decomposeLifecycleDisposition(NormalizedTransaction tx,
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
     * Decompose a discretionary portfolio sale (ASSET_SALE).
     *
     * Discretionary sales have no Wheelwright lifecycle attribution. Regardless of
     * whether the sale produces a gain or loss, the entire proceeds are a principal
     * movement (capital converted from equity form to cash form). The gain or loss
     * is a portfolio-level observation, not Wheelwright production or strategy erosion.
     *
     * This enforces the domain rule: Production is economic gain causally attributable
     * to a Wheelwright strategy lifecycle. Realization alone is not sufficient.
     *
     * Note: this intentionally does not distinguish returned basis from non-attributed
     * realized gain/loss. If portfolio-performance decomposition becomes a requirement,
     * introduce a dedicated PORTFOLIO_REALIZATION component type rather than
     * reclassifying these amounts as production.
     */
    private List<EconomicComponent> decomposePortfolioSale(NormalizedTransaction tx,
                                                            List<NormalizedTransaction> allTransactions) {
        BigDecimal proceeds = tx.amount(); // positive (cash received from sale)

        return List.of(
            new EconomicComponent(tx.id(), ComponentType.PRINCIPAL_MOVEMENT, null,
                proceeds, Confidence.DETERMINISTIC,
                "Portfolio sale of " + tx.symbol() + " at $" + tx.price() +
                "/share — no Wheelwright lifecycle attribution; proceeds are principal movement")
        );
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

        // For assigned-call sales, resolve basis from prior acquisitions with strict
        // attribution safety (Issue #3 + adversarial correction). Attribution — not merely
        // arithmetic — must be provable: a UNIQUE, SUFFICIENT, NON-CONSUMED acquisition
        // relationship. Otherwise return null so the disposition stays BASIS_UNKNOWN.
        if (saleTx.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE) {
            return resolveAttributableBasis(symbol, saleQty, saleTx, allTransactions);
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

    /**
     * Resolve acquisition basis for a called-away disposition with attribution safety.
     *
     * This is deliberately conservative and refuses to invent any lot-allocation convention
     * (no FIFO/LIFO/latest-purchase/symbol-level allocation, no lot engine). It resolves a
     * basis ONLY when the evidence proves a unique, sufficient, non-consumed acquisition
     * relationship for the disposed shares:
     *
     *   1. Consider prior acquisitions of the symbol STRICTLY BEFORE the disposition date, of BOTH
     *      kinds: ASSIGNED_PUT_STOCK_PURCHASE (wheel) and ASSET_PURCHASE (direct). Same-day
     *      acquisitions are excluded absent authoritative intraday ordering.
     *   2. Require a SINGLE acquisition source of cost. Concretely: every prior acquisition
     *      row (across both kinds) must carry the SAME per-share net acquisition cash. If
     *      acquisitions differ in per-share cost, attribution to the disposed shares would
     *      require a lot convention -> BASIS_UNKNOWN.
     *   3. Require SUFFICIENT, NON-CONSUMED, DATE-ELIGIBLE inventory. Because Fidelity
     *      evidence is date-oriented and we deliberately do NOT infer intraday ordering:
     *        - Eligible acquisition inventory comes only from acquisitions dated STRICTLY
     *          BEFORE the disposition date (acquisitionDate < dispositionDate). Same-day
     *          acquisitions are NOT counted as available inventory absent authoritative
     *          ordering evidence.
     *        - Opening eligible inventory for the date = (eligible acquisitions before date)
     *          − (all dispositions before date).
     *        - Same-day dispositions are evaluated COLLECTIVELY: the whole same-day
     *          disposition group (all ASSET_SALE + ASSIGNED_CALL_STOCK_SALE of this symbol
     *          on this date) must be covered by opening eligible inventory. If the group
     *          total exceeds opening eligible inventory, NO same-day disposition may claim
     *          the cost — two same-day sales must not each independently consume the same
     *          shares. We do not choose which one wins.
     *
     * Cost semantics: per-share attributable acquisition cash = |amount| / |quantity|
     * (proportional net Fidelity cash for the eligible attributable shares), not raw
     * execution price and not a tax-lot/universal accounting basis. It is economically
     * symmetric with net disposition proceeds and degrades correctly if acquisition
     * commissions/fees ever appear. Basis returned = perShareCash × disposedQty.
     *
     * Returns null when basis cannot be defensibly established.
     */
    private BigDecimal resolveAttributableBasis(String symbol,
                                                BigDecimal saleQty,
                                                NormalizedTransaction saleTx,
                                                List<NormalizedTransaction> allTransactions) {
        if (saleQty == null || saleQty.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        // Eligible acquisitions: STRICTLY BEFORE the disposition date (no same-day inventory,
        // no inferred intraday ordering). Both wheel and direct acquisitions count.
        List<NormalizedTransaction> eligibleAcquisitions = allTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.ASSET_PURCHASE
                       || tx.kind() == FidelityTransactionKind.ASSIGNED_PUT_STOCK_PURCHASE)
            .filter(tx -> symbol.equals(tx.symbol()))
            .filter(tx -> tx.date().isBefore(saleTx.date()))
            .filter(tx -> tx.quantity() != null && tx.quantity().abs().compareTo(BigDecimal.ZERO) > 0)
            .filter(tx -> tx.amount() != null)
            .toList();

        if (eligibleAcquisitions.isEmpty()) {
            return null; // no date-eligible acquisition evidence -> BASIS_UNKNOWN
        }

        // Single cost source: identical per-share attributable cash across ALL eligible acquisitions.
        BigDecimal firstPerShare = perShareNetCash(eligibleAcquisitions.get(0));
        if (firstPerShare == null) {
            return null;
        }
        boolean uniformCost = eligibleAcquisitions.stream()
            .allMatch(tx -> {
                BigDecimal ps = perShareNetCash(tx);
                return ps != null && ps.compareTo(firstPerShare) == 0;
            });
        if (!uniformCost) {
            return null; // mixed acquisition costs -> attribution ambiguous -> BASIS_UNKNOWN
        }

        // Opening eligible inventory for the disposition date =
        //   eligible acquisitions (strictly before) − dispositions strictly before the date.
        BigDecimal totalEligibleAcquired = eligibleAcquisitions.stream()
            .map(tx -> tx.quantity().abs())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dispositionsBeforeDate = allTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.ASSET_SALE
                       || tx.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE)
            .filter(tx -> symbol.equals(tx.symbol()))
            .filter(tx -> tx.date().isBefore(saleTx.date()))
            .filter(tx -> tx.quantity() != null)
            .map(tx -> tx.quantity().abs())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal openingEligibleInventory = totalEligibleAcquired.subtract(dispositionsBeforeDate);

        // Same-day disposition GROUP: all dispositions of this symbol on the disposition date
        // (including this one). The group as a whole must be covered — no same-day sale may
        // independently reuse the same opening inventory.
        BigDecimal sameDayGroupDisposition = allTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.ASSET_SALE
                       || tx.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE)
            .filter(tx -> symbol.equals(tx.symbol()))
            .filter(tx -> tx.date().isEqual(saleTx.date()))
            .filter(tx -> tx.quantity() != null)
            .map(tx -> tx.quantity().abs())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (openingEligibleInventory.compareTo(sameDayGroupDisposition) < 0) {
            // The same-day disposition group is not fully covered by proven opening inventory.
            // Refuse to attribute any of them rather than let sales reuse the same shares.
            return null; // BASIS_UNKNOWN
        }

        // Attribution safe: unique per-share cost; same-day group fully covered by
        // date-eligible, non-consumed opening inventory.
        // Basis is a cash quantity — normalize to cents (scale 2), symmetric with proceeds.
        return firstPerShare.multiply(saleQty).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Per-share NET acquisition cash for an acquisition row: |amount| / |quantity|.
     * Uses actual net cash (symmetric with net disposition proceeds), not execution price.
     * Returns null when quantity is missing/zero.
     */
    private BigDecimal perShareNetCash(NormalizedTransaction acquisition) {
        if (acquisition.quantity() == null || acquisition.quantity().abs().compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        if (acquisition.amount() == null) {
            return null;
        }
        return acquisition.amount().abs()
            .divide(acquisition.quantity().abs(), 6, java.math.RoundingMode.HALF_UP);
    }
}
