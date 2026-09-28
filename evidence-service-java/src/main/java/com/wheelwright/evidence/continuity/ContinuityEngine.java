package com.wheelwright.evidence.continuity;

import com.wheelwright.evidence.production.FidelityActivityRow;
import com.wheelwright.evidence.production.FidelityTransactionKind;
import com.wheelwright.evidence.production.TransactionClassifier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Bounded option-obligation continuity engine (ADR-022 / Doc 70 accepted Solution Design).
 *
 * Pure and deterministic. Given an opening-anchored whole-quantity cohort, all raw History
 * rows in the admitted interval, an accepted completeness premise through a quiet endpoint
 * day, and a Positions observation on that day, it decides whether the ENTIRE original Q
 * remains currently applicable — or fails closed with an explicit blocker.
 *
 * It is NOT a general brokerage lifecycle model. It answers only the narrow whole-Q lane and
 * refuses everything else (Doc 70 §3/§6). It never invents completeness, intraday ordering,
 * or an endpoint holdings timestamp.
 *
 * Ratified boundaries enforced here (Doc 70 §2/§4/§5/§6/§8, ADR-022 §3/§4):
 *   - Every potentially option-affecting raw row in the target series must be semantically
 *     admitted or the assessment fails closed. Unsupported/uninterpretable option-affecting
 *     rows (transfers, corrections, reversals, UNCLASSIFIED touching the series) block.
 *   - STO → BTC → identical STO replacement does not inherit membership: any reduction of the
 *     governed Q ends its intact applicability; a later same-series opening is not the cohort.
 *   - Assignment/expiration reduce the option obligation; assignment companion share-delivery
 *     rows never double-reduce option quantity.
 *   - Additional same-series openings never join the cohort; the governed Q may remain a
 *     proper subset of a larger aggregate ONLY if no admissible event could have reduced it.
 *   - A reduction after governed and ungoverned quantity mixed, whose allocation is ambiguous,
 *     is POLICY_UNDEFINED (partial/residual is unratified), never a false affirmative.
 *   - Temporal admission is daily/conservative: an explicit economic date controls; ordinary
 *     completed STO/BTC without one may use Run Date only as a conservative envelope; CSV row
 *     order and Settlement Date never establish intraday order. If required ordering cannot be
 *     established, fail closed.
 *   - Positive endpoint reconciliation requires a QUIET day P: no admitted target-series event
 *     may occur during P, so quantity is constant across P and the observed Positions quantity
 *     reconciles to the daily Decision cut without asserting a holdings timestamp.
 */
public class ContinuityEngine {

    /** Current admission/interpretation rule version (Doc 70 §4/§7). Bump on semantic change. */
    public static final String ADMISSION_RULE_VERSION = "continuity-admission-v1";

    private final TransactionClassifier classifier = new TransactionClassifier();

    public ContinuityAssessment assess(ContinuityInputs in) {
        List<String> blockers = new ArrayList<>();
        String evidenceHash = EvidenceHash.of(in);

        // --- 0. Structural preconditions (authority-bearing inputs). ---
        if (in.openingQuantity() <= 0 || in.openingDate() == null
                || in.underlying() == null || in.optionType() == null || in.expiration() == null) {
            blockers.add("opening-anchor-incomplete");
            return fail(ContinuityVerdict.AUTHORITY_MISSING, in, null, blockers, evidenceHash);
        }
        if (!in.historyCompleteThroughQuietDay() || in.quietDay() == null) {
            // No accepted completeness premise: cannot assert nothing reduced Q. AUTHORITY_MISSING
            // (a required authority-bearing assertion is absent), not a guess.
            blockers.add("accepted-completeness-missing");
            return fail(ContinuityVerdict.AUTHORITY_MISSING, in, null, blockers, evidenceHash);
        }
        if (in.quietDay().isBefore(in.openingDate())) {
            blockers.add("quiet-day-before-opening");
            return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, null, blockers, evidenceHash);
        }

        // --- 1. Exhaustive semantic admission of every potentially target-affecting row. ---
        // A row is "target-affecting" if it could change the option quantity of THIS series.
        // We must interpret each such row or fail closed (Doc 70 §2). We evaluate within the
        // admitted interval [openingDate, end of quietDay] using the conservative daily envelope.
        int governedReduction = 0;     // contracts of the ORIGINAL cohort provably reduced
        int laterSameSeriesOpen = 0;   // contracts opened later in the same series (never join)
        int openingEvidenceQty = 0;    // admitted STO contracts on the opening day (opening evidence)
        boolean sawOpeningAnchor = false;
        // Admitted aggregate short position for the series across the interval (opening + later
        // opens - reductions). Defect 2: the endpoint must reconcile against THIS, not observed>=Q.
        int admittedNetShort = 0;

        for (FidelityActivityRow row : in.historyRows()) {
            if (!isTargetSeries(row, in)) {
                // Not this series. It cannot affect this option obligation, so it is admitted
                // as irrelevant regardless of its kind (Doc 70 §2 "proven-irrelevant retains a
                // reason"). Share-delivery companions are handled below via kind, not here.
                continue;
            }

            // Temporal admission: establish that this row falls within the admitted interval
            // using a conservative daily envelope. If we cannot place it on/after opening and
            // on/before quietDay, fail closed rather than infer ordering (Doc 70 §4).
            LocalDate econDay = economicDay(row);
            if (econDay == null) {
                blockers.add("row-temporal-unadmissible:" + safeAction(row));
                return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, null, blockers, evidenceHash);
            }
            if (econDay.isBefore(in.openingDate()) || econDay.isAfter(in.quietDay())) {
                // Outside the admitted interval for this assessment; not consumed.
                continue;
            }

            FidelityTransactionKind kind = classifier.classify(toProdRow(row));
            int qty = absContracts(row);

            switch (kind) {
                case OPTION_SELL_TO_OPEN_CALL, OPTION_SELL_TO_OPEN_PUT -> {
                    admittedNetShort += qty;
                    if (econDay.isEqual(in.openingDate()) && !sawOpeningAnchor && qty >= in.openingQuantity()) {
                        // The opening anchor itself (or the bounded opening set): admitted opening
                        // EVIDENCE establishing the explicitly quantified cohort (Defect 1). Consume once.
                        sawOpeningAnchor = true;
                        openingEvidenceQty = qty;
                        int extra = qty - in.openingQuantity();
                        if (extra > 0) laterSameSeriesOpen += extra;
                    } else {
                        // A later same-series opening. It NEVER joins the governed cohort
                        // (ADR-022 §4). Recorded only to detect mixing for allocation ambiguity.
                        laterSameSeriesOpen += qty;
                    }
                }
                case OPTION_BUY_TO_CLOSE_CALL, OPTION_BUY_TO_CLOSE_PUT -> {
                    // A reduction of the short obligation. If governed and ungoverned quantity
                    // have mixed, allocation between them is ambiguous => POLICY_UNDEFINED
                    // (Doc 70 §3/§6, ADR-022 §4). Otherwise it reduces the governed cohort.
                    admittedNetShort -= qty;
                    if (laterSameSeriesOpen > 0) {
                        blockers.add("ambiguous-reduction-after-mixing");
                        return fail(ContinuityVerdict.POLICY_UNDEFINED, in, null, blockers, evidenceHash);
                    }
                    governedReduction += qty;
                }
                case ASSIGNMENT_NOTIFICATION, EXPIRATION_NOTIFICATION -> {
                    // Assignment/expiration reduces the option obligation exactly once. The
                    // companion share-delivery row (ASSIGNED_*_STOCK_*) is a different series
                    // (equity) and is filtered by isTargetSeries, so it cannot double-reduce.
                    int reduced = (qty > 0 ? qty : in.openingQuantity());
                    admittedNetShort -= reduced;
                    if (laterSameSeriesOpen > 0) {
                        blockers.add("ambiguous-reduction-after-mixing");
                        return fail(ContinuityVerdict.POLICY_UNDEFINED, in, null, blockers, evidenceHash);
                    }
                    governedReduction += reduced;
                }
                case ASSIGNED_PUT_STOCK_PURCHASE, ASSIGNED_CALL_STOCK_SALE -> {
                    // Companion share flow. These are equity rows; if one is mis-tagged to the
                    // option series it must NOT reduce option quantity (Doc 70 §2). Treated as
                    // admitted-irrelevant to the OPTION obligation count.
                }
                case TRANSFER_OUT, ACAT_TRANSFER, UNCLASSIFIED -> {
                    // A potentially option-affecting row we cannot interpret as a bounded
                    // lifecycle reduction (transfer/correction/reversal/unknown). Paired
                    // net-zero effects cannot be detected by endpoint reconciliation, so this
                    // MUST fail closed (Doc 70 §2 counterexample), never be treated as generic
                    // cash movement or netted away.
                    blockers.add("unsupported-option-affecting-row:" + kind);
                    return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, null, blockers, evidenceHash);
                }
                default -> {
                    // Any other kind on the target series is unexpected; fail closed rather
                    // than assume it is irrelevant to the option obligation.
                    blockers.add("unexpected-target-series-kind:" + kind);
                    return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, null, blockers, evidenceHash);
                }
            }
        }

        // --- 2. Quiet-day requirement for the endpoint reconciliation (Doc 70 §5). ---
        // P is quiet iff no admitted target-series event occurred ON quietDay. If any did,
        // quantity is not provably constant across P; use a later observation or fail closed.
        boolean quietDayHadEvent = in.historyRows().stream()
            .filter(r -> isTargetSeries(r, in))
            .map(this::economicDay)
            .anyMatch(d -> d != null && d.isEqual(in.quietDay()));
        if (quietDayHadEvent) {
            blockers.add("endpoint-day-not-quiet");
            return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, null, blockers, evidenceHash);
        }

        // --- 3. Governed-cohort survival (ADR-022 §4). ---
        int survivingGoverned = in.openingQuantity() - governedReduction;
        if (survivingGoverned <= 0) {
            // The original obligation is authoritatively exhausted. Identical reopening does
            // not revive it (ADR-022 §4). Known-negative economic result.
            blockers.add("original-obligation-exhausted");
            return new ContinuityAssessment(ContinuityVerdict.EXHAUSTED, in.openingQuantity(), 0,
                List.copyOf(blockers), ADMISSION_RULE_VERSION, true, iso(in.quietDay()), evidenceHash);
        }
        if (survivingGoverned < in.openingQuantity()) {
            // A known partial survivor of the entire attached Q. Residual Program applicability
            // is unratified (ADR-022 §4, Doc 70 §8). POLICY_UNDEFINED — not a false affirmative.
            blockers.add("partial-survivor-residual-membership-undefined");
            return new ContinuityAssessment(ContinuityVerdict.POLICY_UNDEFINED, in.openingQuantity(),
                survivingGoverned, List.copyOf(blockers), ADMISSION_RULE_VERSION, true, iso(in.quietDay()), evidenceHash);
        }

        // --- 4. Admitted opening evidence is REQUIRED for an affirmative (Defect 1). ---
        // The affirmative lane must rest on admitted opening EVIDENCE establishing the explicitly
        // quantified opening-anchored cohort — a caller-supplied openingQuantity is not evidence.
        // Absent an admitted opening STO on the opening day establishing >= Q, fail closed.
        if (!sawOpeningAnchor || openingEvidenceQty < in.openingQuantity()) {
            blockers.add("opening-evidence-missing");
            return fail(ContinuityVerdict.AUTHORITY_MISSING, in, survivingGoverned, blockers, evidenceHash);
        }

        // --- 5. Positive endpoint reconciliation against the ADMITTED aggregate (Defect 2). ---
        // Full governed Q is provably untouched by admitted rows. The Positions observation on
        // the quiet day must exist, identify the series, and reconcile EXACTLY to the admitted
        // aggregate net short position (opening + later opens - reductions). Merely observing
        // "short >= governed Q" is insufficient: an admitted STO 1 + STO 1 with Positions short 1
        // proves an off-record reduction happened, contradicting accepted completeness — fail
        // closed rather than affirm (Doc 70 §5/§6, ADR-022 §3).
        if (in.positionsShortQuantityOnQuietDay() == null || !in.positionsIdentifiesSeries()) {
            blockers.add("endpoint-observation-missing");
            return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, survivingGoverned, blockers, evidenceHash);
        }
        int observed = in.positionsShortQuantityOnQuietDay();
        if (observed != admittedNetShort) {
            // The endpoint disagrees with the admitted lifecycle. Under accepted completeness
            // this is impossible for a truthful record, so an off-record event must exist:
            // fail closed rather than affirm on observed >= Q.
            blockers.add("endpoint-aggregate-mismatch");
            return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, survivingGoverned, blockers, evidenceHash);
        }
        if (admittedNetShort < in.openingQuantity()) {
            // Defensive: the reconciled aggregate cannot even hold the governed Q intact.
            blockers.add("endpoint-quantity-incompatible");
            return fail(ContinuityVerdict.EVIDENCE_INSUFFICIENT, in, survivingGoverned, blockers, evidenceHash);
        }

        // Affirmative whole-Q-intact lane (Doc 70 §6). The completeness/endpoint contract covers
        // through the quiet day, which is therefore the covered-through boundary (Defect 4).
        return new ContinuityAssessment(ContinuityVerdict.FULL_Q_INTACT_APPLICABLE, in.openingQuantity(),
            in.openingQuantity(), List.of(), ADMISSION_RULE_VERSION, true, iso(in.quietDay()), evidenceHash);
    }

    // --- helpers ---

    private ContinuityAssessment fail(ContinuityVerdict v, ContinuityInputs in, Integer reconciled,
                                      List<String> blockers, String evidenceHash) {
        return new ContinuityAssessment(v, in.openingQuantity(), reconciled, List.copyOf(blockers),
            ADMISSION_RULE_VERSION, in.historyCompleteThroughQuietDay(),
            in.quietDay() == null ? null : iso(in.quietDay()), evidenceHash);
    }

    /** True when the row's option contract matches the assessed series exactly. */
    private boolean isTargetSeries(FidelityActivityRow row, ContinuityInputs in) {
        ParsedSeries s = ParsedSeries.fromRow(row);
        if (s == null) return false;
        return s.underlying.equalsIgnoreCase(in.underlying())
            && s.optionType.equalsIgnoreCase(in.optionType())
            && s.expiration.equals(in.expiration())
            && Math.abs(s.strike - in.strike()) < 0.0001;
    }

    /**
     * Conservative daily economic envelope (Doc 70 §4). The explicit economic "as of" date
     * CONTROLS when present (e.g. "ASSIGNED as of 09/20/2026" with Run Date 09/28/2026 lands on
     * 09/20 and therefore affects a 09/26 Decision cut). Otherwise Run Date is used only as the
     * bounded conservative daily envelope (never asserted equal to trade/execution time).
     * Returns null when no admissible day can be established (caller fails closed). CSV order and
     * Settlement Date never establish intraday order — we only ever compare at day granularity.
     */
    private LocalDate economicDay(FidelityActivityRow row) {
        LocalDate asOf = ParsedSeries.asOfDate(row);
        if (asOf != null) return asOf; // explicit economic "as of" date controls (Doc 70 §4)
        return row.runDate();           // bounded fallback for ordinary completed retail rows
    }

    private int absContracts(FidelityActivityRow row) {
        BigDecimal q = row.quantity();
        if (q == null) return 0;
        return Math.abs(q.intValue());
    }

    private String safeAction(FidelityActivityRow row) {
        String a = row.action();
        return a == null ? "" : (a.length() > 40 ? a.substring(0, 40) : a);
    }

    private com.wheelwright.evidence.production.FidelityActivityRow toProdRow(FidelityActivityRow r) {
        return r; // already the production row type
    }

    private static String iso(LocalDate d) {
        return d == null ? null : d.toString();
    }
}
