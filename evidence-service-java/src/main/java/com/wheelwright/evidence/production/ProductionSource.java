package com.wheelwright.evidence.production;

/**
 * The specific source of cash production. Only meaningful when ComponentType is PRODUCTION.
 *
 * Each member corresponds to an empirically observed income source.
 * No catch-all "OTHER" — unknown income patterns remain UNRESOLVED at the ComponentType level.
 */
public enum ProductionSource {

    /** Net premium from sell-to-open option transactions */
    OPTION_PREMIUM,

    /** SPAXX money-market fund distributions (structurally income) */
    MONEY_MARKET_INCOME,

    /** Fund/equity distributions whose character is uncertain (may contain ROC) */
    DIVIDEND,

    /** T-bill discount income (redemption at par minus purchase price) */
    TREASURY_DISCOUNT,

    /** Realized positive appreciation on asset dispositions above basis */
    REALIZED_APPRECIATION
}
