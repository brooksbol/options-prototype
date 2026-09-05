package com.wheelwright.evidence.production;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Establishes the authoritative disposition→episode association GLOBALLY and one-to-one.
 *
 * A called-away stock sale (ASSIGNED_CALL_STOCK_SALE) is associated with the option contract
 * activity (grouped by its OCC option symbol) that produced it. This is an AUTHORITATIVE SEMANTIC
 * ASSOCIATION CLAIM owned by Production, established from evidence and never re-derived downstream.
 * It is NOT object, contract, episode, or lifecycle identity (ADR-016).
 *
 * Why group-wide rather than per-sale: resolving each sale independently can hand the same
 * episode to two different sales (and cannot aggregate several notification rows for one OCC
 * episode into a single larger sale). Correctness therefore requires solving the whole relevant
 * group at once and enforcing a one-to-one relationship with a UNIQUE global solution.
 *
 * Grouping key: (underlying, broker run date). Run date is used conservatively as a
 * PROCESSING-DATE correlation constraint — it is NOT an assertion that the run date is the
 * economic event date. Fidelity emits the assignment notification and the called-away stock
 * sale with the same run date; that is the only cheap, authoritative co-occurrence signal.
 *
 * Algorithm per group:
 *   1. Episode demand: aggregate CALL ASSIGNMENT_NOTIFICATION rows by exact OCC symbol; each
 *      distinct OCC episode demands (Σ contracts × 100) assigned shares.
 *   2. Disposition supply: the ASSIGNED_CALL_STOCK_SALE rows, each with its share quantity.
 *   3. One-to-one solve by quantity compatibility: count perfect matchings (bijections) in which
 *      every matched (episode, sale) pair has equal share quantity. If EXACTLY ONE such perfect
 *      matching exists, emit it (each sale → its episode's OCC key). If zero or more than one,
 *      the group is ambiguous/inconsistent → all sales in the group are UNRESOLVED (null).
 *
 * No FIFO/LIFO/latest, no first-match, no price-as-strike, no row-order, no intraday inference,
 * no arbitrary tie-breaking. Quantity is the only association evidence used.
 *
 * Result: a map from disposition (sale) assessment-local assessmentOccurrenceId to
 * contractActivityKey. Absent means the association could not be uniquely established. Every emitted
 * non-null contractActivityKey is unique WITHIN a group (guaranteed by the bijection). It is NOT
 * guaranteed unique ACROSS groups: the same OCC symbol can legitimately appear in two
 * independently-resolvable groups on different run dates. Because contractActivityKey is the
 * frontend-addressable association key, assessment-wide uniqueness is enforced by the caller
 * ({@code ProductionAssessor}) after solving — a key claimed by more than one disposition across
 * groups is demoted to UNRESOLVED rather than allowed to collide (ADR-016: no silently
 * competing/overwriting authoritative association).
 */
public class DispositionAssociator {

    private static final Pattern OCC_PATTERN = Pattern.compile("^-?([A-Z]+)\\d{6}([CP])\\d");

    /**
     * Upper bound on the number of sales in a single (underlying, run-date) group the matcher will
     * attempt to solve. Realistic groups are a handful of episodes. Beyond this, association is
     * treated as unsafe and left UNRESOLVED rather than enumerated. This is a safety bound, not an
     * optimization project.
     */
    private static final int MAX_GROUP_SIZE = 8;

    /**
     * Establishes disposition→episode associations.
     *
     * Keyed by the sale's ASSESSMENT-LOCAL {@code assessmentOccurrenceId} (not the collision-prone
     * content fingerprint {@code NormalizedTransaction.id}) so two exact-duplicate sale rows remain
     * distinct to bookkeeping and neither overwrites the other (ADR-016). Only uniquely resolved
     * associations are present; absence means the association could not be uniquely established.
     */
    public Map<Integer, String> associate(List<NormalizedTransaction> allTransactions) {
        // saleAssessmentOccurrenceId -> contractActivityKey (only unique, resolved associations present)
        Map<Integer, String> associations = new HashMap<>();

        // Partition sales and notifications into (underlying|runDate) groups.
        Map<String, List<NormalizedTransaction>> saleGroups = new LinkedHashMap<>();
        Map<String, List<NormalizedTransaction>> noteGroups = new LinkedHashMap<>();

        for (NormalizedTransaction tx : allTransactions) {
            if (tx.kind() == FidelityTransactionKind.ASSIGNED_CALL_STOCK_SALE) {
                saleGroups.computeIfAbsent(groupKey(tx.symbol(), tx.date()), k -> new ArrayList<>()).add(tx);
            } else if (tx.kind() == FidelityTransactionKind.ASSIGNMENT_NOTIFICATION
                    && "CALL".equals(occRight(tx.symbol()))) {
                String underlying = occUnderlying(tx.symbol());
                if (underlying != null) {
                    noteGroups.computeIfAbsent(groupKey(underlying, tx.date()), k -> new ArrayList<>()).add(tx);
                }
            }
        }

        for (Map.Entry<String, List<NormalizedTransaction>> e : saleGroups.entrySet()) {
            solveGroup(e.getValue(), noteGroups.getOrDefault(e.getKey(), List.of()), associations);
        }
        return associations;
    }

    private void solveGroup(List<NormalizedTransaction> sales,
                            List<NormalizedTransaction> notifications,
                            Map<Integer, String> associations) {
        if (sales.isEmpty()) return;

        // Contract-activity demand: aggregate contracts by exact OCC key → shares (contracts × 100).
        Map<String, BigDecimal> contractActivityShares = new LinkedHashMap<>();
        for (NormalizedTransaction n : notifications) {
            if (n.quantity() == null) continue;
            String key = n.symbol().trim();
            contractActivityShares.merge(key, n.quantity().abs().multiply(new BigDecimal("100")), BigDecimal::add);
        }
        if (contractActivityShares.isEmpty()) return; // no contract activity → all sales remain unresolved

        List<String> contractActivityKeys = new ArrayList<>(contractActivityShares.keySet());
        List<BigDecimal> episodeQty = new ArrayList<>();
        for (String k : contractActivityKeys) episodeQty.add(contractActivityShares.get(k));

        List<BigDecimal> saleQty = new ArrayList<>();
        for (NormalizedTransaction s : sales) {
            saleQty.add(s.quantity() != null ? s.quantity().abs() : BigDecimal.valueOf(-1));
        }

        // A one-to-one association requires equal cardinality; otherwise no perfect matching.
        if (contractActivityKeys.size() != sales.size()) {
            return; // group unresolved
        }

        int n = sales.size();

        // Safety guard: association only needs the zero / one / many distinction. Group sizes are
        // realistically a handful. If a malformed or unexpectedly large group appears, do not
        // attempt an expensive enumeration — preserve uncertainty (leave the group unresolved)
        // rather than manufacture an answer. (The matcher itself also short-circuits at the second
        // solution; this bounds the worst case before enumeration begins.)
        if (n > MAX_GROUP_SIZE) {
            return; // group unresolved — too large to solve safely
        }
        // Count perfect matchings where episode[i] pairs with sale[perm[i]] and quantities match.
        // Capture the single solution if exactly one exists. Group sizes are tiny (<= a handful).
        int[] perm = new int[n];
        boolean[] used = new boolean[n];
        int[] solutionCount = {0};
        int[] soleSolution = new int[n]; // contract-activity index -> sale index, for the unique solution

        countMatchings(0, n, episodeQty, saleQty, perm, used, solutionCount, soleSolution);

        if (solutionCount[0] == 1) {
            for (int ei = 0; ei < n; ei++) {
                int saleAssessmentOccurrenceId = sales.get(soleSolution[ei]).assessmentOccurrenceId();
                associations.put(saleAssessmentOccurrenceId, contractActivityKeys.get(ei));
            }
        }
        // 0 or >1 valid global solutions → leave the whole group unresolved (nothing added).
    }

    /** Backtracking count of quantity-consistent bijections; records the unique solution. */
    private void countMatchings(int ei, int n,
                                List<BigDecimal> episodeQty, List<BigDecimal> saleQty,
                                int[] perm, boolean[] used,
                                int[] solutionCount, int[] soleSolution) {
        if (solutionCount[0] > 1) return; // short-circuit: ambiguity already proven
        if (ei == n) {
            solutionCount[0]++;
            if (solutionCount[0] == 1) System.arraycopy(perm, 0, soleSolution, 0, n);
            return;
        }
        for (int si = 0; si < n; si++) {
            if (used[si]) continue;
            if (episodeQty.get(ei).compareTo(saleQty.get(si)) != 0) continue; // quantity must match
            used[si] = true;
            perm[ei] = si;
            countMatchings(ei + 1, n, episodeQty, saleQty, perm, used, solutionCount, soleSolution);
            used[si] = false;
        }
    }

    private String groupKey(String underlying, LocalDate runDate) {
        return underlying.toUpperCase() + "|" + runDate;
    }

    /** Underlying ticker from an OCC option symbol like "-XLE260731C55" → "XLE"; null if not OCC. */
    private String occUnderlying(String occSymbol) {
        if (occSymbol == null) return null;
        Matcher m = OCC_PATTERN.matcher(occSymbol.trim());
        return m.find() ? m.group(1) : null;
    }

    /** Option right (CALL/PUT) from an OCC option symbol; null if not OCC. */
    private String occRight(String occSymbol) {
        if (occSymbol == null) return null;
        Matcher m = OCC_PATTERN.matcher(occSymbol.trim());
        if (!m.find()) return null;
        return "C".equals(m.group(2)) ? "CALL" : "PUT";
    }
}
