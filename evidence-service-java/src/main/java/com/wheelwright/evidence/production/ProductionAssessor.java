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

        // Option-close (buy-to-close) lifecycle association (BUG-021). The backend is the SINGLE
        // authority: it produces one authoritative OptionCloseResult per executed BTC (recognized
        // outstanding RANGE before the close, matched/residual/excess, status) AND derives the
        // reconciliation issues from those results. The executed debit is never suppressed (it
        // remains period option economics via the decomposer); non-deterministic association only
        // affects visibility so the assessment cannot appear fully reconciled while a material
        // option-close lifecycle is unknown. The frontend RENDERS these results (ADR-016).
        List<OptionCloseResult> optionCloseResults =
            buildOptionCloseResultsAndIssues(assessed, allTransactions, issues);

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
            dispositionResults,
            optionCloseResults
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

    private static final java.util.Set<FidelityTransactionKind> OPTION_CLOSE_KINDS = java.util.EnumSet.of(
        FidelityTransactionKind.OPTION_BUY_TO_CLOSE_PUT,
        FidelityTransactionKind.OPTION_BUY_TO_CLOSE_CALL);
    private static final java.util.Set<FidelityTransactionKind> OPTION_OPEN_KINDS = java.util.EnumSet.of(
        FidelityTransactionKind.OPTION_SELL_TO_OPEN_PUT,
        FidelityTransactionKind.OPTION_SELL_TO_OPEN_CALL);

    /**
     * Raise reconciliation issues for option-close (buy-to-close) transactions in the period whose
     * recognized short lifecycle/quantity cannot be established (BUG-021 amendment).
     *
     * The executed closing debit is authoritative period option cash and is NOT suppressed here.
     * This method only preserves VISIBILITY of what remains unresolved so the assessment cannot
     * appear fully reconciled while a material option-close lifecycle is unknown. It distinguishes:
     *
     *   - missing executed cash            → the debit itself is unknown (component already BASIS_UNKNOWN);
     *   - insufficient contract identity   → no usable OCC contract key on the close row;
     *   - missing executed quantity        → cash known but retired quantity unknown (independent facts);
     *   - same-day ordering ambiguity      → a competing lifecycle event shares the date (fail closed);
     *   - no recognized opening obligation → no short obligation existed for this contract BEFORE this
     *                                        close (no prior opening, or already resolved/closed);
     *   - over-close                       → closed quantity exceeds recognized outstanding at that time.
     *
     * TEMPORAL correctness (BUG-021 second amendment): association is established from a
     * CHRONOLOGICAL exact-contract resolver (see resolveRecognizedOutstandingBefore) using only
     * defensible PRIOR evidence. A future opening can never validate an earlier close; a prior
     * terminal resolution (expiration/assignment) is consumed before a later close. This is NOT
     * total-contract-quantity reconciliation. It establishes association only at the
     * temporally-recognized-quantity level; it does not pair specific STO occurrences, invents no
     * lot allocation, and never manufactures intraday ordering from date-only evidence.
     */
    private List<OptionCloseResult> buildOptionCloseResultsAndIssues(
            List<AssessedEntry> assessed,
            List<NormalizedTransaction> allTransactions,
            List<ProductionAssessment.ReconciliationIssue> issues) {
        List<OptionCloseResult> results = new ArrayList<>();
        for (AssessedEntry entry : assessed) {
            if (!OPTION_CLOSE_KINDS.contains(entry.tx.kind())) {
                continue;
            }
            NormalizedTransaction btc = entry.tx;
            // Missing executed cash is signalled by the decomposer as an UNRESOLVED/BASIS_UNKNOWN
            // component; cash-known is independent of the lifecycle-association determination.
            boolean missingCash = entry.components.stream()
                .anyMatch(c -> c.type() == ComponentType.UNRESOLVED && c.confidence() == Confidence.BASIS_UNKNOWN);

            OptionCloseResult result = buildOptionCloseResult(btc, allTransactions, missingCash);
            results.add(result);

            // A single authority produces both the result and its reconciliation visibility: any
            // non-deterministic association raises an issue so the assessment cannot appear
            // FULLY_RECONCILED while a material option-close lifecycle is unknown. The executed
            // debit is never suppressed (it remains in period option economics via the decomposer).
            if (!result.isDeterministic()) {
                issues.add(new ProductionAssessment.ReconciliationIssue(
                    IssueType.OPTION_CLOSE_LIFECYCLE_UNRESOLVED,
                    "Option " + result.reason(),
                    null
                ));
            }
        }
        return results;
    }

    /** Terminal resolution events that consume recognized outstanding short quantity for a contract. */
    private static final java.util.Set<FidelityTransactionKind> OPTION_TERMINAL_RESOLUTION_KINDS =
        java.util.EnumSet.of(
            FidelityTransactionKind.ASSIGNMENT_NOTIFICATION,
            FidelityTransactionKind.EXPIRATION_NOTIFICATION);

    /**
     * Recognized-outstanding-before RANGE for an exact OCC contract, preserving uncertainty
     * (BUG-021 third amendment). {@code min}/{@code max} are inclusive non-negative contract counts.
     * {@code openingUncertain} marks that a prior opening carried an unknown quantity, so the upper
     * bound cannot be trusted (the true outstanding could be higher than {@code max}).
     * {@code sameDayOrderingAmbiguous} marks a same-day competing lifecycle event whose ordering is
     * not authoritatively established.
     */
    private record OutstandingRange(BigDecimal min, BigDecimal max,
                                    boolean openingUncertain,
                                    boolean sameDayOrderingAmbiguous) {}

    /**
     * Establish the recognized outstanding short-quantity RANGE for an exact OCC contract IMMEDIATELY
     * BEFORE the given buy-to-close, from defensible PRIOR evidence only (BUG-021 temporal +
     * uncertainty correctness). Uncertainty is preserved as state — an unknown historical quantity
     * is NEVER converted to zero consumption.
     *
     * Folding individual STRICTLY-PRIOR dated rows for the exact contract, chronologically:
     *   - prior sell-to-open, known q:        min += q; max += q
     *   - prior sell-to-open, unknown q:       min += 0; openingUncertain = true (upper bound untrusted)
     *   - prior BTC / terminal resolution, known q:   min = max(0, min−q); max = max(0, max−q)
     *   - prior BTC / terminal resolution, unknown q: min = 0 (could consume everything); max unchanged
     *     (could consume nothing) — THIS is the "unknown consumption ≠ zero" rule.
     *
     * Future events (dated after this BTC) have NO effect — a later opening can never validate an
     * earlier close.
     *
     * Same-day ordering: Fidelity evidence is date-granular. If any competing lifecycle event for
     * the SAME contract shares this BTC's date, ordering is material and unestablished, so
     * sameDayOrderingAmbiguous = true (occurrence sequence within a day is NOT authoritative broker
     * chronology). Same-day events are not folded as prior evidence.
     */
    private OutstandingRange resolveRecognizedOutstandingBefore(String occContractKey,
                                                                NormalizedTransaction btc,
                                                                List<NormalizedTransaction> allTransactions) {
        java.time.LocalDate btcDate = btc.date();

        boolean sameDayCompeting = allTransactions.stream()
            .filter(tx -> occContractKey.equals(optionContractKey(tx.symbol())))
            .filter(tx -> OPTION_OPEN_KINDS.contains(tx.kind())
                       || OPTION_CLOSE_KINDS.contains(tx.kind())
                       || OPTION_TERMINAL_RESOLUTION_KINDS.contains(tx.kind()))
            .filter(tx -> tx.date().isEqual(btcDate))
            .anyMatch(tx -> tx.assessmentOccurrenceId() != btc.assessmentOccurrenceId());

        List<NormalizedTransaction> contractEvents = allTransactions.stream()
            .filter(tx -> occContractKey.equals(optionContractKey(tx.symbol())))
            .filter(tx -> OPTION_OPEN_KINDS.contains(tx.kind())
                       || OPTION_CLOSE_KINDS.contains(tx.kind())
                       || OPTION_TERMINAL_RESOLUTION_KINDS.contains(tx.kind()))
            .toList();

        // Dates on which this contract has MORE THAN ONE lifecycle event — ordering within such a
        // date is not establishable from Fidelity date-only evidence.
        Map<java.time.LocalDate, Long> eventsPerDate = contractEvents.stream()
            .collect(Collectors.groupingBy(NormalizedTransaction::date, Collectors.counting()));

        List<NormalizedTransaction> priorEvents = contractEvents.stream()
            .filter(tx -> tx.date().isBefore(btcDate))
            .sorted(Comparator.comparing(NormalizedTransaction::date)
                .thenComparingInt(NormalizedTransaction::assessmentOccurrenceId))
            .toList();

        BigDecimal min = BigDecimal.ZERO;
        BigDecimal max = BigDecimal.ZERO;
        boolean openingUncertain = false;

        for (NormalizedTransaction ev : priorEvents) {
            boolean qtyKnown = ev.quantity() != null && ev.quantity().abs().compareTo(BigDecimal.ZERO) > 0;
            BigDecimal q = qtyKnown ? ev.quantity().abs() : null;
            // A prior event whose OWN date carries a competing lifecycle event has an unestablished
            // ordering: we cannot know how it interleaved with its same-day sibling(s), so its exact
            // effect on recognized outstanding is uncertain. It must NOT manufacture a definite
            // outstanding for a later close (same-day ambiguity propagates forward).
            boolean priorSameDayAmbiguous = eventsPerDate.getOrDefault(ev.date(), 0L) > 1;

            if (OPTION_OPEN_KINDS.contains(ev.kind())) {
                if (!qtyKnown) {
                    // Unknown opening quantity: cannot credit the upper bound reliably; mark uncertain.
                    openingUncertain = true;
                } else if (priorSameDayAmbiguous) {
                    // The opening happened, but its ordering vs same-day consumption is unknown. It
                    // could add up to q to outstanding (if it preceded a same-day consumer) — widen
                    // the upper bound but do not raise the guaranteed lower bound.
                    max = max.add(q);
                } else {
                    min = min.add(q);
                    max = max.add(q);
                }
            } else {
                // prior BTC or terminal resolution consumes recognized outstanding quantity
                if (!qtyKnown || priorSameDayAmbiguous) {
                    // Unknown consumption quantity OR an unestablished same-day ordering: it could
                    // have consumed anywhere in [0, max]. min drops to 0 (could consume everything);
                    // max unchanged (could have consumed nothing / been ordered after). NOT zero
                    // consumption, and NOT an exact subtraction.
                    min = BigDecimal.ZERO;
                } else {
                    min = min.subtract(q).max(BigDecimal.ZERO);
                    max = max.subtract(q).max(BigDecimal.ZERO);
                }
            }
        }
        return new OutstandingRange(min, max, openingUncertain, sameDayCompeting);
    }

    /**
     * Build the single authoritative lifecycle-association result for one executed buy-to-close.
     * This is the SOLE authority for matched/residual/excess/status (ADR-016); the frontend renders
     * it and must not recompute. Executed cash and executed quantity are preserved independently.
     */
    private OptionCloseResult buildOptionCloseResult(NormalizedTransaction btc,
                                                     List<NormalizedTransaction> allTransactions,
                                                     boolean missingCash) {
        String occ = optionContractKey(btc.symbol());
        String contractKey = describeContract(btc);
        String base = "close " + contractKey + " on " + btc.date();
        BigDecimal debit = btc.amount();
        BigDecimal qty = (btc.quantity() != null && btc.quantity().abs().compareTo(BigDecimal.ZERO) > 0)
            ? btc.quantity().abs() : null;
        BigDecimal z = BigDecimal.ZERO;

        // (a) Missing executed cash — the debit itself is unknown (component already BASIS_UNKNOWN).
        if (missingCash) {
            return unresolvedClose(btc, contractKey, debit, qty,
                base + ": executed closing debit unavailable — period option economics and retired obligation both undetermined");
        }
        // (b) Insufficient contract identity — cannot associate any recognized obligation.
        if (occ == null) {
            return unresolvedClose(btc, contractKey, debit, qty,
                "close on " + btc.date() + ": contract identity insufficient to associate a recognized short obligation — closing cash known, retired obligation unresolved");
        }
        // (c) Missing executed quantity — cash known, retired quantity unknown (independent facts).
        if (qty == null) {
            return unresolvedClose(btc, contractKey, debit, null,
                base + ": executed quantity unavailable — closing cash known, retired obligation quantity unresolved");
        }

        OutstandingRange r = resolveRecognizedOutstandingBefore(occ, btc, allTransactions);

        // (d) Same-day ordering ambiguity — fail closed; uncertainty is preserved in the range.
        if (r.sameDayOrderingAmbiguous()) {
            return new OptionCloseResult(btc.id(), contractKey, safeSymbol(btc), btc.date().toString(),
                btc.rawAction(), debit, qty, r.min(), r.max(), z, r.max().min(qty),
                r.min().subtract(qty).max(z), r.max(), z, OptionCloseResult.OptionCloseStatus.UNRESOLVED,
                base + ": a competing lifecycle event for this contract occurred the same day and Fidelity date-only evidence cannot establish ordering — retired obligation unresolved (closing cash known)");
        }

        BigDecimal min = r.min();
        BigDecimal max = r.max();

        // (e) No recognized outstanding under any admissible history (max == 0 and opening not
        //     understated by an unknown opening): nothing existed before this close to retire.
        if (max.compareTo(z) <= 0 && !r.openingUncertain()) {
            return new OptionCloseResult(btc.id(), contractKey, safeSymbol(btc), btc.date().toString(),
                btc.rawAction(), debit, qty, z, z, z, z, z, z, qty,
                OptionCloseResult.OptionCloseStatus.UNRESOLVED,
                base + " ($" + safeAbs(debit) + " debit): no recognized short obligation existed for this contract before this close (no prior opening, or already resolved) — closing cash known, retired obligation unresolved");
        }

        // If a prior opening quantity was unknown, the upper bound is untrusted → cannot conclude.
        if (r.openingUncertain()) {
            return new OptionCloseResult(btc.id(), contractKey, safeSymbol(btc), btc.date().toString(),
                btc.rawAction(), debit, qty, min, max, z, qty.min(max), z, max, z,
                OptionCloseResult.OptionCloseStatus.UNRESOLVED,
                base + ": a prior opening of this contract had an unavailable quantity, so recognized outstanding cannot be bounded — retired obligation unresolved (closing cash known)");
        }

        // Deterministic coverage: the whole range guarantees at least q outstanding (min ≥ q), so the
        // close is definitely COVERED. But "covered" is NOT the same claim as "the obligation is
        // completely retired". Complete retirement requires that NO residual can remain under any
        // admissible history — i.e. residualMax == 0 (equivalently max == q). When residualMax > 0
        // the residual is uncertain (e.g. outstanding [1,2], close 1 → residual [0,1]); that is a
        // covered close whose remaining obligation is unresolved, i.e. DETERMINISTIC_PARTIAL — never
        // DETERMINISTIC_COMPLETE.
        if (min.compareTo(qty) >= 0) {
            BigDecimal residualMin = min.subtract(qty);
            BigDecimal residualMax = max.subtract(qty);
            boolean completeRetirement = residualMax.compareTo(z) == 0; // no residual possible at all
            OptionCloseResult.OptionCloseStatus status = completeRetirement
                ? OptionCloseResult.OptionCloseStatus.DETERMINISTIC_COMPLETE
                : OptionCloseResult.OptionCloseStatus.DETERMINISTIC_PARTIAL;
            String residualDesc = residualMin.compareTo(residualMax) == 0
                ? residualMin.toPlainString()
                : residualMin.toPlainString() + ".." + residualMax.toPlainString();
            String reason = completeRetirement
                ? base + ": close retires " + qty.toPlainString()
                    + " and definitely leaves no residual — obligation fully retired"
                : base + ": covered close — " + qty.toPlainString() + " retired against recognized outstanding "
                    + (min.compareTo(max) == 0 ? min.toPlainString() : min.toPlainString() + ".." + max.toPlainString())
                    + "; residual (" + residualDesc + ") uncertain — not a complete retirement";
            return new OptionCloseResult(btc.id(), contractKey, safeSymbol(btc), btc.date().toString(),
                btc.rawAction(), debit, qty, min, max, qty, qty, residualMin, residualMax, z, status, reason);
        }

        // Definite over-close: even the maximum possible outstanding is below q.
        if (max.compareTo(qty) < 0) {
            BigDecimal excess = qty.subtract(max);
            return new OptionCloseResult(btc.id(), contractKey, safeSymbol(btc), btc.date().toString(),
                btc.rawAction(), debit, qty, min, max, min, max, z, z, excess,
                OptionCloseResult.OptionCloseStatus.OVER_CLOSE,
                base + ": closed quantity " + qty.toPlainString() + " exceeds the maximum recognized outstanding "
                    + max.toPlainString() + " at that time (over-close by at least " + excess.toPlainString()
                    + ") — matched portion associated, excess unresolved");
        }

        // q lies within [min, max]: history does not determine how much recognized obligation existed.
        return new OptionCloseResult(btc.id(), contractKey, safeSymbol(btc), btc.date().toString(),
            btc.rawAction(), debit, qty, min, max, min, qty.min(max), z, max.subtract(min), z,
            OptionCloseResult.OptionCloseStatus.UNRESOLVED,
            base + ": recognized outstanding before this close is uncertain (" + min.toPlainString() + ".."
                + max.toPlainString() + ") and the closed quantity " + qty.toPlainString()
                + " falls within that range — how much recognized obligation existed cannot be determined (closing cash known)");
    }

    private OptionCloseResult unresolvedClose(NormalizedTransaction btc, String contractKey,
                                              BigDecimal debit, BigDecimal qty, String reason) {
        BigDecimal z = BigDecimal.ZERO;
        return new OptionCloseResult(btc.id(), contractKey, safeSymbol(btc), btc.date().toString(),
            btc.rawAction(), debit, qty, z, z, z, z, z, z, z,
            OptionCloseResult.OptionCloseStatus.UNRESOLVED, reason);
    }

    private String safeSymbol(NormalizedTransaction tx) {
        return tx.symbol() != null ? tx.symbol().trim() : null;
    }

    /**
     * The normalized OCC contract key for association: the trimmed option symbol when it is a
     * usable contract identifier, else null. Fidelity option symbols look like "-EWY260821P150"
     * (a leading '-' with underlying + YYMMDD + P/C + strike). A bare equity ticker or empty
     * symbol is NOT a usable option-contract key.
     */
    private String optionContractKey(String symbol) {
        if (symbol == null) return null;
        String s = symbol.trim();
        if (s.isEmpty()) return null;
        // Require the OCC-ish shape: optional '-', underlying letters, 6 date digits, P/C, strike.
        return s.matches("^-?[A-Za-z]+\\d{6}[CPcp]\\d.*$") ? s : null;
    }

    private String describeContract(NormalizedTransaction tx) {
        String occ = optionContractKey(tx.symbol());
        return occ != null ? occ : (tx.symbol() != null ? tx.symbol().trim() : "(unknown contract)");
    }

    private String safeAbs(BigDecimal v) {
        return v != null ? v.abs().toPlainString() : "unknown";
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
