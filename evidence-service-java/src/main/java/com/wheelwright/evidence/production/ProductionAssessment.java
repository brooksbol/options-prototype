package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

/**
 * The authoritative result of a monthly production assessment.
 *
 * This is the complete backend response — no consumer should need to
 * reproduce accounting logic to interpret or extend this result.
 */
public record ProductionAssessment(
    YearMonth period,
    String periodDescription,
    ReconciliationStatus status,
    List<ReconciliationIssue> issues,

    /** Sum of DETERMINISTIC + HIGH_CONFIDENCE PRODUCTION components in the period */
    BigDecimal knownCashProduction,

    /** Sum of CHARACTER_UNCERTAIN + BASIS_UNKNOWN PRODUCTION components that COULD be production */
    BigDecimal unresolvedPotentialProduction,

    /** Sum of CAPITAL_EROSION components in the period (realized losses) */
    BigDecimal realizedCapitalErosion,

    /**
     * Net Strategy Result: the net realized economic contribution of the options
     * strategy engine during this period.
     *
     * = (OPTION_PREMIUM + REALIZED_APPRECIATION) − CAPITAL_EROSION
     *
     * Excludes structural income (MONEY_MARKET_INCOME, TREASURY_DISCOUNT, DIVIDEND)
     * because those are not consequences of options strategy decisions. This isolates
     * the strategy engine's contribution from portfolio-wide productive activity.
     */
    BigDecimal netStrategyResult,

    /** Known production decomposed by source */
    Map<ProductionSource, BigDecimal> productionBreakdown,

    /** Erosion events with detail */
    List<ErosionEvent> erosionEvents,

    /** Transaction counts by role */
    TransactionSummary transactionSummary,

    /** Full audit trail — every transaction with its economic decomposition */
    List<AssessedTransaction> transactions
) {
    public record ReconciliationIssue(
        IssueType type,
        String description,
        BigDecimal potentialImpact   // nullable — quantified when possible
    ) {}

    public record ErosionEvent(
        String date,
        String symbol,
        BigDecimal amount,
        String description
    ) {}

    public record TransactionSummary(
        int included,
        int excluded,
        int uncertain,
        int notApplicable
    ) {}

    public record AssessedTransaction(
        String id,
        String date,
        String action,
        String symbol,
        BigDecimal amount,
        String role,          // INCLUDED, EXCLUDED, UNCERTAIN, NOT_APPLICABLE
        List<EconomicComponent> components
    ) {}
}
