package com.wheelwright.evidence.production;

/**
 * Classifies a FidelityActivityRow into a typed FidelityTransactionKind.
 *
 * Pattern-matches the Action field against empirically observed Fidelity patterns.
 * Unknown actions produce UNCLASSIFIED — never throws on unfamiliar input.
 *
 * This is structural classification only. It identifies WHAT the Fidelity row
 * represents in terms of transaction type. It does NOT determine economic meaning
 * (production vs erosion vs principal) — that is the EconomicDecomposer's job.
 */
public class TransactionClassifier {

    /**
     * Classify a Fidelity activity row by its action pattern.
     *
     * @return the most specific FidelityTransactionKind; UNCLASSIFIED for unknown patterns
     */
    public FidelityTransactionKind classify(FidelityActivityRow row) {
        String action = row.action();

        // Option opening transactions (premium received)
        if (action.startsWith("YOU SOLD OPENING TRANSACTION PUT")) {
            return FidelityTransactionKind.OPTION_SELL_TO_OPEN_PUT;
        }
        if (action.startsWith("YOU SOLD OPENING TRANSACTION CALL")) {
            return FidelityTransactionKind.OPTION_SELL_TO_OPEN_CALL;
        }

        // Dividend/distribution events
        if (action.startsWith("DIVIDEND RECEIVED")) {
            if (isSpaxx(row)) {
                return FidelityTransactionKind.MONEY_MARKET_DIVIDEND;
            }
            return FidelityTransactionKind.DIVIDEND_RECEIVED;
        }

        // Treasury events
        if (action.startsWith("REDEMPTION PAYOUT") && isTreasury(row)) {
            return FidelityTransactionKind.TREASURY_REDEMPTION;
        }
        if (action.startsWith("YOU BOUGHT") && isTreasury(row)) {
            return FidelityTransactionKind.TREASURY_PURCHASE;
        }

        // Assignment-related stock flows
        if (action.startsWith("YOU BOUGHT ASSIGNED PUTS")) {
            return FidelityTransactionKind.ASSIGNED_PUT_STOCK_PURCHASE;
        }
        if (action.startsWith("YOU SOLD ASSIGNED CALLS")) {
            return FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE;
        }

        // Principal movements
        if (action.startsWith("Electronic Funds Transfer Received")) {
            return FidelityTransactionKind.EFT_DEPOSIT;
        }
        if (action.startsWith("Electronic Funds Transfer Paid")) {
            return FidelityTransactionKind.EFT_WITHDRAWAL;
        }
        if (action.startsWith("WIRE TRANSFER")) {
            return FidelityTransactionKind.WIRE_DEPOSIT;
        }
        if (action.startsWith("TRANSFERRED TO")) {
            return FidelityTransactionKind.TRANSFER_OUT;
        }
        if (action.startsWith("TRANSFER OF ASSETS")) {
            return FidelityTransactionKind.ACAT_TRANSFER;
        }

        // Lifecycle notifications
        if (action.startsWith("ASSIGNED as of")) {
            return FidelityTransactionKind.ASSIGNMENT_NOTIFICATION;
        }
        if (action.startsWith("EXPIRED")) {
            return FidelityTransactionKind.EXPIRATION_NOTIFICATION;
        }

        // Reinvestment
        if (action.startsWith("REINVESTMENT")) {
            return FidelityTransactionKind.REINVESTMENT;
        }

        // General asset transactions (must come AFTER more specific patterns above)
        if (action.startsWith("YOU BOUGHT")) {
            return FidelityTransactionKind.ASSET_PURCHASE;
        }
        if (action.startsWith("YOU SOLD")) {
            return FidelityTransactionKind.ASSET_SALE;
        }

        return FidelityTransactionKind.UNCLASSIFIED;
    }

    private boolean isSpaxx(FidelityActivityRow row) {
        return "SPAXX".equals(row.symbol().trim());
    }

    private boolean isTreasury(FidelityActivityRow row) {
        String desc = row.description();
        if (desc != null && desc.toUpperCase().contains("UNITED STATES TREAS")) {
            return true;
        }
        // CUSIPs starting with 912797 are US Treasury bills
        String symbol = row.symbol().trim();
        return symbol.matches("^912797[A-Z0-9]+$");
    }
}
