package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates the full production assessment pipeline:
 * parse → classify → normalize → decompose → aggregate → reconcile.
 *
 * Produces a ProductionAssessment containing the authoritative monthly production
 * figure with full audit trail, reconciliation status, and economic decomposition.
 */
public class ProductionAssessor {

    private final TransactionClassifier classifier = new TransactionClassifier();
    private final TreasuryBasisResolver treasuryResolver = new TreasuryBasisResolver();
    private final EconomicDecomposer decomposer = new EconomicDecomposer(treasuryResolver);

    /**
     * Assess production for a specific period from parsed Fidelity activity rows.
     *
     * @param rows   Parsed Fidelity rows (chronological order)
     * @param period The target month (e.g., 2026-07)
     * @return Complete production assessment
     */
    public ProductionAssessment assess(List<FidelityActivityRow> rows, YearMonth period) {
        // 1. Classify and normalize all transactions (full history, for basis resolution)
        List<NormalizedTransaction> allTransactions = rows.stream()
            .map(row -> NormalizedTransaction.from(row, classifier.classify(row)))
            .toList();

        // 2. Filter to target period for assessment (but use full history for basis)
        LocalDate periodStart = period.atDay(1);
        LocalDate periodEnd = period.atEndOfMonth();

        List<NormalizedTransaction> periodTransactions = allTransactions.stream()
            .filter(tx -> !tx.date().isBefore(periodStart) && !tx.date().isAfter(periodEnd))
            .toList();

        // 3. Decompose each period transaction
        List<AssessedEntry> assessed = periodTransactions.stream()
            .map(tx -> {
                List<EconomicComponent> components = decomposer.decompose(tx, allTransactions);
                return new AssessedEntry(tx, components);
            })
            .toList();

        // 4. Aggregate production, erosion, and unresolved
        BigDecimal knownProduction = BigDecimal.ZERO;
        BigDecimal unresolvedPotential = BigDecimal.ZERO;
        BigDecimal erosion = BigDecimal.ZERO;
        Map<ProductionSource, BigDecimal> breakdown = new EnumMap<>(ProductionSource.class);
        List<ProductionAssessment.ErosionEvent> erosionEvents = new ArrayList<>();
        List<ProductionAssessment.ReconciliationIssue> issues = new ArrayList<>();

        for (AssessedEntry entry : assessed) {
            for (EconomicComponent c : entry.components) {
                if (c.type() == ComponentType.PRODUCTION) {
                    if (c.confidence() == Confidence.DETERMINISTIC || c.confidence() == Confidence.HIGH_CONFIDENCE) {
                        knownProduction = knownProduction.add(c.amount());
                        breakdown.merge(c.source(), c.amount(), BigDecimal::add);
                    } else {
                        // CHARACTER_UNCERTAIN or BASIS_UNKNOWN
                        unresolvedPotential = unresolvedPotential.add(c.amount());
                    }
                } else if (c.type() == ComponentType.CAPITAL_EROSION) {
                    erosion = erosion.add(c.amount());
                    erosionEvents.add(new ProductionAssessment.ErosionEvent(
                        entry.tx.date().toString(),
                        entry.tx.symbol(),
                        c.amount(),
                        c.derivation()
                    ));
                }
            }
        }

        // 5. Reconciliation assessment
        // Check period coverage
        if (!coversPeriod(allTransactions, period)) {
            issues.add(new ProductionAssessment.ReconciliationIssue(
                IssueType.INCOMPLETE_PERIOD_COVERAGE,
                "Source data may not cover the full month of " + formatPeriod(period),
                null
            ));
        }

        // Check for unclassified actions in period
        List<NormalizedTransaction> unclassifiedInPeriod = periodTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.UNCLASSIFIED)
            .toList();
        for (NormalizedTransaction tx : unclassifiedInPeriod) {
            issues.add(new ProductionAssessment.ReconciliationIssue(
                IssueType.UNCLASSIFIED_ACTION,
                "Unrecognized action: " + tx.rawAction(),
                tx.amount() != null ? tx.amount().abs() : null
            ));
        }

        // Check for basis-unknown components
        for (AssessedEntry entry : assessed) {
            for (EconomicComponent c : entry.components) {
                if (c.confidence() == Confidence.BASIS_UNKNOWN && c.type() == ComponentType.PRINCIPAL_MOVEMENT) {
                    // Treasury with unknown basis — potential unresolved income
                    BigDecimal potential = computeUnresolvedTreasuryPotential(entry.tx, allTransactions);
                    if (potential != null && potential.compareTo(BigDecimal.ZERO) > 0) {
                        issues.add(new ProductionAssessment.ReconciliationIssue(
                            IssueType.BASIS_UNKNOWN,
                            "Treasury " + entry.tx.symbol() + ": basis unconfirmed (ACAT transfer); " +
                            "potential discount income $" + potential,
                            potential
                        ));
                        unresolvedPotential = unresolvedPotential.add(potential);
                    }
                }
            }
        }

        // Check for character-uncertain distributions
        for (AssessedEntry entry : assessed) {
            for (EconomicComponent c : entry.components) {
                if (c.confidence() == Confidence.CHARACTER_UNCERTAIN) {
                    issues.add(new ProductionAssessment.ReconciliationIssue(
                        IssueType.DISTRIBUTION_CHARACTER_UNKNOWN,
                        entry.tx.symbol() + " distribution ($" + c.amount() +
                        "): character unconfirmed — may contain return of capital",
                        c.amount()
                    ));
                }
            }
        }

        ReconciliationStatus status = determineStatus(issues);

        // 6. Build transaction summary and full audit trail
        int included = 0, excluded = 0, uncertain = 0, notApplicable = 0;
        List<ProductionAssessment.AssessedTransaction> txList = new ArrayList<>();

        for (AssessedEntry entry : assessed) {
            String role = determineRole(entry.components);
            switch (role) {
                case "INCLUDED" -> included++;
                case "EXCLUDED" -> excluded++;
                case "UNCERTAIN" -> uncertain++;
                case "NOT_APPLICABLE" -> notApplicable++;
            }
            txList.add(new ProductionAssessment.AssessedTransaction(
                entry.tx.id(),
                entry.tx.date().toString(),
                entry.tx.rawAction(),
                entry.tx.symbol(),
                entry.tx.amount(),
                role,
                entry.components
            ));
        }

        return new ProductionAssessment(
            period,
            formatPeriod(period),
            status,
            issues,
            knownProduction,
            unresolvedPotential,
            erosion,
            computeNetStrategyResult(breakdown, erosion),
            breakdown,
            erosionEvents,
            new ProductionAssessment.TransactionSummary(included, excluded, uncertain, notApplicable),
            txList
        );
    }

    /**
     * Determine the most recent complete calendar month in the data.
     */
    public YearMonth detectPeriod(List<FidelityActivityRow> rows) {
        if (rows.isEmpty()) return YearMonth.now().minusMonths(1);

        // Find the latest date in the data
        LocalDate latest = rows.stream()
            .map(FidelityActivityRow::runDate)
            .max(Comparator.naturalOrder())
            .orElse(LocalDate.now());

        // The last complete month is the month before the latest date's month
        // (unless the latest date is the last day of its month)
        YearMonth latestMonth = YearMonth.from(latest);
        if (latest.equals(latestMonth.atEndOfMonth())) {
            return latestMonth; // the latest month is complete
        }
        return latestMonth.minusMonths(1);
    }

    private boolean coversPeriod(List<NormalizedTransaction> transactions, YearMonth period) {
        LocalDate periodStart = period.atDay(1);
        LocalDate periodEnd = period.atEndOfMonth();

        // Check: does the data contain at least one transaction on or before the period start
        // AND at least one on or after the period end?
        boolean hasEarlyEnough = transactions.stream()
            .anyMatch(tx -> !tx.date().isAfter(periodStart));
        boolean hasLateEnough = transactions.stream()
            .anyMatch(tx -> !tx.date().isBefore(periodEnd));

        return hasEarlyEnough && hasLateEnough;
    }

    private BigDecimal computeUnresolvedTreasuryPotential(NormalizedTransaction redemption,
                                                           List<NormalizedTransaction> allTransactions) {
        // For ACAT-transferred Treasuries: potential = redemption amount - ACAT transfer value
        return allTransactions.stream()
            .filter(tx -> tx.kind() == FidelityTransactionKind.ACAT_TRANSFER)
            .filter(tx -> redemption.symbol().equals(tx.symbol()))
            .findFirst()
            .map(tx -> redemption.amount().subtract(tx.amount()))
            .orElse(null);
    }

    private ReconciliationStatus determineStatus(List<ProductionAssessment.ReconciliationIssue> issues) {
        if (issues.isEmpty()) return ReconciliationStatus.FULLY_RECONCILED;
        boolean hasIncomplete = issues.stream()
            .anyMatch(i -> i.type() == IssueType.INCOMPLETE_PERIOD_COVERAGE);
        if (hasIncomplete) return ReconciliationStatus.SOURCE_INCOMPLETE;
        return ReconciliationStatus.PRODUCTION_UNCERTAIN;
    }

    private String determineRole(List<EconomicComponent> components) {
        boolean hasProduction = components.stream()
            .anyMatch(c -> c.type() == ComponentType.PRODUCTION &&
                          (c.confidence() == Confidence.DETERMINISTIC || c.confidence() == Confidence.HIGH_CONFIDENCE));
        boolean hasUncertain = components.stream()
            .anyMatch(c -> c.confidence() == Confidence.CHARACTER_UNCERTAIN ||
                          c.confidence() == Confidence.BASIS_UNKNOWN);
        boolean hasErosion = components.stream()
            .anyMatch(c -> c.type() == ComponentType.CAPITAL_EROSION);
        boolean isLifecycle = components.stream()
            .allMatch(c -> c.type() == ComponentType.LIFECYCLE_NOTIFICATION);

        if (isLifecycle) return "NOT_APPLICABLE";
        if (hasProduction || hasErosion) return "INCLUDED";
        if (hasUncertain) return "UNCERTAIN";
        return "EXCLUDED";
    }

    private String formatPeriod(YearMonth period) {
        return period.getMonth().getDisplayName(TextStyle.FULL, Locale.US) + " " + period.getYear();
    }

    private record AssessedEntry(NormalizedTransaction tx, List<EconomicComponent> components) {}

    /**
     * Compute Net Strategy Result: the net realized economic contribution of the
     * options strategy engine.
     *
     * Only OPTION_PREMIUM and REALIZED_APPRECIATION are strategy-attributable production.
     * Structural income (MONEY_MARKET_INCOME, TREASURY_DISCOUNT, DIVIDEND) is excluded
     * because it is not a consequence of options strategy decisions.
     */
    private BigDecimal computeNetStrategyResult(Map<ProductionSource, BigDecimal> breakdown, BigDecimal erosion) {
        BigDecimal strategyProduction = breakdown.getOrDefault(ProductionSource.OPTION_PREMIUM, BigDecimal.ZERO)
            .add(breakdown.getOrDefault(ProductionSource.REALIZED_APPRECIATION, BigDecimal.ZERO));
        return strategyProduction.subtract(erosion);
    }
}
