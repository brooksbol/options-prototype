package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Resolves cost basis for Treasury bill redemptions by matching against prior
 * purchase and sale transactions with the same CUSIP.
 *
 * Uses chronological inventory tracking: purchases add to inventory, sales
 * remove from inventory. At each sale, the resolver checks whether the lot
 * assignment is deterministic from the evidence:
 *
 * - If only one lot existed at the time of a sale, that sale necessarily
 *   consumed that lot (DETERMINISTIC from chronology).
 * - If multiple lots existed at the time of a sale, and the sold quantity
 *   is less than total inventory, the resolver cannot determine which lot
 *   was consumed without a basis policy (FIFO, specific lot, etc.) that
 *   this system has not adopted.
 *
 * When lot-selection ambiguity exists, the result is UNRESOLVED rather than
 * silently applying an assumption.
 */
public class TreasuryBasisResolver {

    /**
     * Result of a Treasury basis resolution attempt.
     */
    public record BasisResult(
        BigDecimal totalCost,       // total cost of lots matched to redemption (null if unresolvable)
        BigDecimal quantity,        // face value matched
        boolean fullyResolved,      // true if all redeemed quantity has unambiguous basis
        String explanation
    ) {
        public static BasisResult resolved(BigDecimal cost, BigDecimal quantity, String explanation) {
            return new BasisResult(cost, quantity, true, explanation);
        }

        public static BasisResult unresolved(String explanation) {
            return new BasisResult(null, BigDecimal.ZERO, false, explanation);
        }
    }

    /**
     * Find the cost basis for a Treasury redemption by tracking chronological
     * inventory of purchases and sales for the same CUSIP.
     *
     * @param cusip            The CUSIP being redeemed
     * @param redeemedQty      The face value being redeemed (positive)
     * @param allTransactions  All normalized transactions (full history, chronological)
     * @param redemptionDate   The date of the redemption
     * @return BasisResult with total cost if deterministically resolvable
     */
    public BasisResult resolve(String cusip, BigDecimal redeemedQty,
                               List<NormalizedTransaction> allTransactions,
                               LocalDate redemptionDate) {

        // Find all purchases of this CUSIP before the redemption date (chronological)
        List<LotRecord> purchases = allTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.TREASURY_PURCHASE)
            .filter(tx -> cusip.equals(tx.symbol()))
            .filter(tx -> tx.date().isBefore(redemptionDate))
            .sorted(Comparator.comparing(NormalizedTransaction::date))
            .map(tx -> new LotRecord(tx.date(), tx.quantity().abs(), tx.amount().abs()))
            .toList();

        if (purchases.isEmpty()) {
            // Check for ACAT transfer
            boolean hasTransfer = allTransactions.stream()
                .filter(tx -> tx.kind() == FidelityTransactionKind.ACAT_TRANSFER)
                .anyMatch(tx -> cusip.equals(tx.symbol()));

            if (hasTransfer) {
                return BasisResult.unresolved(
                    "CUSIP " + cusip + " was received via ACAT transfer; cost basis unconfirmed");
            }
            return BasisResult.unresolved(
                "No purchase history found for CUSIP " + cusip + " in the provided data");
        }

        // Find all prior sales of this CUSIP (sold before maturity, before redemption date)
        List<SaleRecord> sales = allTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.ASSET_SALE)
            .filter(tx -> cusip.equals(tx.symbol()))
            .filter(tx -> tx.date().isBefore(redemptionDate))
            .sorted(Comparator.comparing(NormalizedTransaction::date))
            .map(tx -> new SaleRecord(tx.date(), tx.quantity().abs()))
            .toList();

        // Build chronological inventory and consume sales
        // At each sale, check whether lot assignment is deterministic
        List<LotRecord> inventory = new ArrayList<>(purchases);
        boolean ambiguous = false;

        for (SaleRecord sale : sales) {
            // Check: at the time of this sale, how many lots with remaining quantity existed?
            // (only lots purchased on or before the sale date)
            List<LotRecord> lotsAvailableAtSale = inventory.stream()
                .filter(lot -> !lot.purchaseDate.isAfter(sale.saleDate))
                .filter(lot -> lot.remainingQty.compareTo(BigDecimal.ZERO) > 0)
                .toList();

            BigDecimal totalAvailable = lotsAvailableAtSale.stream()
                .map(lot -> lot.remainingQty)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (sale.quantity.compareTo(totalAvailable) >= 0) {
                // Sale consumes ALL available inventory — unambiguous regardless of lot count
                for (LotRecord lot : inventory) {
                    if (!lot.purchaseDate.isAfter(sale.saleDate)) {
                        lot.remainingQty = BigDecimal.ZERO;
                    }
                }
            } else if (lotsAvailableAtSale.size() == 1) {
                // Only one lot available — sale necessarily consumes from it (partial or full)
                LotRecord onlyLot = lotsAvailableAtSale.get(0);
                onlyLot.remainingQty = onlyLot.remainingQty.subtract(sale.quantity);
            } else {
                // Multiple lots available, partial sale — AMBIGUOUS
                // We cannot determine which lot was consumed without a basis policy
                ambiguous = true;
                break;
            }
        }

        if (ambiguous) {
            return BasisResult.unresolved(
                "CUSIP " + cusip + ": lot-selection ambiguity — multiple lots held at time of " +
                "partial sale; cannot determine remaining basis without a basis-policy assumption");
        }

        // After consuming sales, calculate remaining inventory cost for the redemption
        BigDecimal matchedCost = BigDecimal.ZERO;
        BigDecimal matchedQty = BigDecimal.ZERO;
        BigDecimal remainingRedemption = redeemedQty;

        for (LotRecord lot : inventory) {
            if (lot.remainingQty.compareTo(BigDecimal.ZERO) <= 0) continue;
            if (remainingRedemption.compareTo(BigDecimal.ZERO) <= 0) break;

            // Cost per unit for this lot
            BigDecimal costPerUnit = lot.originalCost.divide(lot.originalQty, 10, RoundingMode.HALF_UP);

            if (remainingRedemption.compareTo(lot.remainingQty) >= 0) {
                // Consume entire remaining lot
                BigDecimal lotCost = costPerUnit.multiply(lot.remainingQty)
                    .setScale(2, RoundingMode.HALF_UP);
                matchedCost = matchedCost.add(lotCost);
                matchedQty = matchedQty.add(lot.remainingQty);
                remainingRedemption = remainingRedemption.subtract(lot.remainingQty);
            } else {
                // Partial lot consumption
                BigDecimal partialCost = costPerUnit.multiply(remainingRedemption)
                    .setScale(2, RoundingMode.HALF_UP);
                matchedCost = matchedCost.add(partialCost);
                matchedQty = matchedQty.add(remainingRedemption);
                remainingRedemption = BigDecimal.ZERO;
            }
        }

        if (matchedQty.compareTo(redeemedQty) >= 0) {
            return BasisResult.resolved(matchedCost, matchedQty,
                "Basis from " + purchases.size() + " purchase lot(s); " +
                sales.size() + " prior sale(s) consumed chronologically; total cost $" + matchedCost);
        } else {
            return BasisResult.unresolved(
                "CUSIP " + cusip + ": insufficient remaining inventory after sales to cover redemption");
        }
    }

    /**
     * Mutable lot record for tracking inventory consumption.
     */
    private static class LotRecord {
        final LocalDate purchaseDate;
        final BigDecimal originalQty;
        final BigDecimal originalCost;
        BigDecimal remainingQty;

        LotRecord(LocalDate purchaseDate, BigDecimal originalQty, BigDecimal originalCost) {
            this.purchaseDate = purchaseDate;
            this.originalQty = originalQty;
            this.originalCost = originalCost;
            this.remainingQty = originalQty;
        }
    }

    private record SaleRecord(LocalDate saleDate, BigDecimal quantity) {}
}
