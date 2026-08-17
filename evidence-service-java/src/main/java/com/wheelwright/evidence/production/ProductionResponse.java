package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * JSON response DTO for the production assessment endpoint.
 *
 * This is the complete response — any consumer (React, CLI, mobile, test harness)
 * receives the same authoritative answer without reproducing accounting logic.
 */
public record ProductionResponse(
    String period,
    String periodDescription,
    String reconciliationStatus,
    List<IssueDto> reconciliationIssues,
    BigDecimal knownCashProduction,
    BigDecimal unresolvedPotentialProduction,
    BigDecimal realizedCapitalErosion,
    BigDecimal netStrategyResult,
    Map<String, BigDecimal> productionBreakdown,
    List<ErosionEventDto> erosionEvents,
    SummaryDto transactionSummary,
    List<TransactionDto> transactions
) {
    public record IssueDto(String type, String description, BigDecimal potentialImpact) {}
    public record ErosionEventDto(String date, String symbol, BigDecimal amount, String description) {}
    public record SummaryDto(int included, int excluded, int uncertain, int notApplicable) {}
    public record TransactionDto(
        String id, String date, String action, String symbol, BigDecimal amount,
        String role, List<ComponentDto> components
    ) {}
    public record ComponentDto(
        String type, String source, BigDecimal amount, String confidence, String derivation
    ) {}
}
