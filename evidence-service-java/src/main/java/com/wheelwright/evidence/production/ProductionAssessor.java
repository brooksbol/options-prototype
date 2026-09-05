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
    private final DispositionAssociator associator = new DispositionAssociator();

    /**
     * Assess production for a specific period from parsed Fidelity activity rows.
     *
     * @param rows   Parsed Fidelity rows (chronological order)
     * @param period The target month (e.g., 2026-07)
     * @return Complete production assessment
     */
    public ProductionAssessment assess(List<FidelityActivityRow> rows, YearMonth period) {
        // 1. Classify and normalize all transactions (full history, for basis resolution).
        //    Assign an ASSESSMENT-LOCAL occurrence identity (monotonic sequence) so downstream
        //    association bookkeeping can distinguish exact transaction occurrences without relying
        //    on the collision-prone content fingerprint (NormalizedTransaction.id). This id is not
        //    durable, not persisted, not lifecycle identity, and asserts no economic ordering — it
        //    only makes occurrences distinguishable within this one assessment (ADR-016).
        List<NormalizedTransaction> allTransactions = new ArrayList<>(rows.size());
        int occurrenceSeq = 0;
        for (FidelityActivityRow row : rows) {
            allTransactions.add(
                NormalizedTransaction.from(row, classifier.classify(row)).withAssessmentOccurrenceId(occurrenceSeq++)
            );
        }

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
                    if (entry.tx.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE) {
                        // Issue #12: a called-away disposition whose acquisition basis cannot be
                        // established leaves realized appreciation/erosion undetermined. This must
                        // make the assessment visibly uncertain — a reconciled cash total must not
                        // conceal unresolved lifecycle economics. It is NOT a period-coverage or
                        // classification failure; it is an economic-reconciliation uncertainty.
                        issues.add(new ProductionAssessment.ReconciliationIssue(
                            IssueType.BASIS_UNKNOWN,
                            entry.tx.symbol() + " called-away disposition ($" + c.amount() +
                            "): acquisition basis unresolved — realized appreciation/erosion undetermined",
                            null
                        ));
                    } else {
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

        // 7. Backend-authoritative per-disposition results (semantic owner of realized
        //    disposition economics). Built for each realized disposition in the period from
        //    its already-computed economic components — no duplicate attribution logic.
        // Establish disposition→contract-activity association GLOBALLY and one-to-one over the whole
        // relevant group before interpreting any single disposition (see DispositionAssociator).
        // Keyed by assessment-local assessmentOccurrenceId, not the collision-prone fingerprint id.
        Map<Integer, String> contractActivityAssociations = associator.associate(allTransactions);

        // ASSESSMENT-WIDE association-key uniqueness (ADR-016). The per-group solver guarantees a
        // one-to-one matching WITHIN a group, but the same OCC contractActivityKey can legitimately
        // arise in two independently-resolvable groups on different run dates. contractActivityKey is
        // the single frontend-addressable association key; if it were emitted twice, a downstream
        // keyed lookup would silently resolve to one arbitrary result (last-write-wins) — a
        // competing/overwritten authoritative association. We do NOT manufacture a stronger (e.g.
        // run-date-suffixed) identifier to force uniqueness; instead any contractActivityKey claimed
        // by more than one disposition across the whole assessment is conservatively demoted to
        // UNRESOLVED for ALL affected dispositions (symmetric — no first-writer survivor).
        Map<String, Long> keyClaims = contractActivityAssociations.values().stream()
            .collect(Collectors.groupingBy(k -> k, Collectors.counting()));
        Set<String> ambiguousKeys = keyClaims.entrySet().stream()
            .filter(e -> e.getValue() > 1)
            .map(Map.Entry::getKey)
            .collect(Collectors.toSet());

        List<DispositionResult> dispositionResults = new ArrayList<>();
        for (AssessedEntry entry : assessed) {
            if (entry.tx.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE) {
                String contractActivityKey = contractActivityAssociations.get(entry.tx.assessmentOccurrenceId());
                if (contractActivityKey != null && ambiguousKeys.contains(contractActivityKey)) {
                    // Same authoritative key claimed by multiple dispositions across groups →
                    // no unique authoritative association survives. Preserve uncertainty.
                    contractActivityKey = null;
                }
                dispositionResults.add(buildDispositionResult(entry.tx, entry.components, contractActivityKey));
            }
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
            txList,
            dispositionResults
        );
    }

    /**
     * Build the authoritative disposition result for a realized called-away disposition from
     * its already-computed economic components. This composes existing decomposition output;
     * it does not re-run attribution. The frontend consumes this instead of correlating raw
     * events and economics itself.
     */
    private DispositionResult buildDispositionResult(NormalizedTransaction tx,
                                                     List<EconomicComponent> components,
                                                     String contractActivityKey) {
        BigDecimal netProceeds = tx.amount(); // actual Fidelity net cash for the sale
        BigDecimal quantity = tx.quantity() != null ? tx.quantity().abs() : null;
        BigDecimal salePrice = tx.price();

        // (A) ASSOCIATION — established GLOBALLY (one-to-one) by DispositionAssociator, not here.
        //     contractActivityKey = OCC contract/activity grouping key of the assigned call (matches
        //     the consumer's grouping key exactly). Null when the association could not be uniquely
        //     established.
        if (contractActivityKey == null) {
            // Association itself cannot be uniquely established → UNRESOLVED. Do not attach realized
            // economics to an ambiguous/absent contract-activity grouping. Preserve known raw facts.
            return new DispositionResult(
                tx.id(), null, tx.symbol(), tx.date().toString(), tx.rawAction(), tx.kind(),
                quantity, salePrice, netProceeds, null, null, null,
                DispositionResult.DispositionEconomicState.UNRESOLVED,
                "assoc=unresolved; dispositionFingerprint=" + tx.id()
                    + "; reason=no unique authoritative assigned-call association for " + tx.symbol()
                    + " on " + tx.date() + " (absent/ambiguous notification, or key not unique across the assessment)"
            );
        }

        // (B) ECONOMICS — association is established; interpret realized economics.
        EconomicComponent appreciation = components.stream()
            .filter(c -> c.type() == ComponentType.PRODUCTION && c.source() == ProductionSource.REALIZED_APPRECIATION)
            .findFirst().orElse(null);
        EconomicComponent erosion = components.stream()
            .filter(c -> c.type() == ComponentType.CAPITAL_EROSION)
            .findFirst().orElse(null);
        boolean basisUnknown = components.stream()
            .anyMatch(c -> c.confidence() == Confidence.BASIS_UNKNOWN);

        BigDecimal appreciationAmt = appreciation != null ? appreciation.amount() : null;
        BigDecimal erosionAmt = erosion != null ? erosion.amount() : null;

        BigDecimal attributableCash = null;
        String provenance;
        DispositionResult.DispositionEconomicState state;

        String base = "assoc=" + contractActivityKey + "; dispositionFingerprint=" + tx.id();
        if (netProceeds == null) {
            state = DispositionResult.DispositionEconomicState.UNRESOLVED;
            provenance = base + "; net sale proceeds unavailable from Fidelity Activity evidence.";
        } else if (appreciation != null) {
            attributableCash = netProceeds.subtract(appreciationAmt);
            state = DispositionResult.DispositionEconomicState.RESOLVED;
            provenance = base + "; realized appreciation from attributable acquisition cash. " + appreciation.derivation();
        } else if (erosion != null) {
            attributableCash = netProceeds.add(erosionAmt);
            state = DispositionResult.DispositionEconomicState.RESOLVED;
            provenance = base + "; realized erosion from attributable acquisition cash. " + erosion.derivation();
        } else if (basisUnknown) {
            state = DispositionResult.DispositionEconomicState.PARTIAL;
            provenance = base + "; net sale proceeds known; attributable acquisition economics unresolved (BASIS_UNKNOWN).";
        } else {
            state = DispositionResult.DispositionEconomicState.RESOLVED;
            attributableCash = netProceeds;
            provenance = base + "; proceeds returned at attributable acquisition cash (no gain/loss).";
        }

        return new DispositionResult(
            tx.id(), contractActivityKey, tx.symbol(), tx.date().toString(), tx.rawAction(), tx.kind(),
            quantity, salePrice, netProceeds, attributableCash,
            appreciationAmt, erosionAmt, state, provenance
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
