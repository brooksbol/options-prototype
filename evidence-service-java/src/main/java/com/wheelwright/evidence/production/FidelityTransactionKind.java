package com.wheelwright.evidence.production;

/**
 * Typed classification of Fidelity Activity History action patterns.
 *
 * Each member corresponds to an empirically observed Fidelity action pattern.
 * UNCLASSIFIED captures any action not matching a known pattern — it must never
 * throw or be silently dropped.
 *
 * This enum represents structural transaction classification only.
 * Economic meaning (production, erosion, principal) is determined by the
 * EconomicDecomposer in a subsequent layer.
 */
public enum FidelityTransactionKind {

    // Option premium events
    OPTION_SELL_TO_OPEN_PUT,
    OPTION_SELL_TO_OPEN_CALL,

    // Dividend/distribution events
    MONEY_MARKET_DIVIDEND,      // SPAXX specifically
    DIVIDEND_RECEIVED,          // other fund distributions

    // Treasury events
    TREASURY_REDEMPTION,
    TREASURY_PURCHASE,

    // Principal movements
    EFT_DEPOSIT,
    EFT_WITHDRAWAL,
    WIRE_DEPOSIT,
    TRANSFER_OUT,
    ACAT_TRANSFER,

    // Assignment-related stock flows
    ASSIGNED_PUT_STOCK_PURCHASE,
    ASSIGNED_CALL_STOCK_SALE,

    // General asset transactions
    ASSET_PURCHASE,
    ASSET_SALE,

    // Lifecycle notifications ($0 cash impact)
    ASSIGNMENT_NOTIFICATION,
    EXPIRATION_NOTIFICATION,

    // Reinvestment
    REINVESTMENT,

    // Unknown — must remain first-class
    UNCLASSIFIED
}
