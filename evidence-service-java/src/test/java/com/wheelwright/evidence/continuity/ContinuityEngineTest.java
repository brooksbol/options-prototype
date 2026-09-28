package com.wheelwright.evidence.continuity;

import com.wheelwright.evidence.production.FidelityActivityRow;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Adversarial acceptance for the bounded continuity engine (ADR-022 / Doc 70).
 *
 * Each test encodes a ratified counterexample or boundary. The engine must produce the
 * fail-closed / non-affirmative outcome for every unsafe case and the affirmative whole-Q
 * lane only for the exact supported path.
 */
class ContinuityEngineTest {

    private final ContinuityEngine engine = new ContinuityEngine();

    private static final String ACCT = "acctZ";
    private static final String UND = "XLE";
    private static final String TYPE = "CALL";
    private static final double STRIKE = 57.5;
    private static final LocalDate EXP = LocalDate.parse("2026-10-16");
    private static final LocalDate OPEN = LocalDate.parse("2026-09-10");
    private static final LocalDate QUIET = LocalDate.parse("2026-09-26");

    /** A raw History row for THIS series with the given action/qty on a given day. */
    private static FidelityActivityRow seriesRow(String action, int qty, LocalDate day) {
        String desc = "CALL (XLE) SELECT SECTOR SPDR OCT 16 26 $57.5 (100 SHS)";
        return new FidelityActivityRow(day, action, " -XLE...", desc, "Cash",
            null, BigDecimal.valueOf(qty), null, null, null, BigDecimal.ZERO, null, day);
    }

    private static FidelityActivityRow otherRow(String action, String desc, int qty, LocalDate day) {
        return new FidelityActivityRow(day, action, "SPY", desc, "Cash",
            null, BigDecimal.valueOf(qty), null, null, null, BigDecimal.ZERO, null, day);
    }

    /** Small fluent builder local to the test for readability. */
    static final class InputsB {
        String acct = ACCT, und = UND, type = TYPE, openingDate = OPEN.toString();
        double strike = STRIKE;
        LocalDate exp = EXP, quiet = QUIET;
        int q = 1;
        boolean complete = true, posSeries = true;
        Integer posQty = 1;
        List<FidelityActivityRow> rows = List.of();
        ContinuityInputs build() {
            return new ContinuityInputs(acct, und, type, strike, exp, q, LocalDate.parse(openingDate),
                complete, quiet, rows, posQty, posSeries, ContinuityEngine.ADMISSION_RULE_VERSION);
        }
    }

    @Test
    void affirmative_wholeQ_intact_supported_lane() {
        InputsB b = new InputsB();
        b.rows = List.of(seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.FULL_Q_INTACT_APPLICABLE, a.verdict());
        assertTrue(a.isAffirmative());
        assertEquals(1, a.reconciledQuantity());
        assertTrue(a.blockers().isEmpty());
    }

    @Test
    void stoThenBtcThenIdenticalSto_doesNotInherit() {
        // short 1 -> BTC 1 -> identical STO 1. The governed cohort's original 1 was reduced;
        // the replacement is a later same-series opening that never joins. Full-Q not intact.
        InputsB b = new InputsB();
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("YOU BOUGHT CLOSING TRANSACTION CALL", 1, OPEN.plusDays(2)),
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN.plusDays(3)));
        ContinuityAssessment a = engine.assess(b.build());
        assertNotEquals(ContinuityVerdict.FULL_Q_INTACT_APPLICABLE, a.verdict());
        // The original obligation is exhausted by the BTC (before any mixing occurred).
        assertEquals(ContinuityVerdict.EXHAUSTED, a.verdict());
    }

    @Test
    void ambiguousReductionAfterMixing_isPolicyUndefined() {
        // Q=1 opening, then an additional ungoverned STO 1 (mix), then a BTC 1 whose allocation
        // between governed and ungoverned is ambiguous => POLICY_UNDEFINED (never affirmative).
        InputsB b = new InputsB();
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN.plusDays(1)),
            seriesRow("YOU BOUGHT CLOSING TRANSACTION CALL", 1, OPEN.plusDays(2)));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.POLICY_UNDEFINED, a.verdict());
        assertTrue(a.blockers().contains("ambiguous-reduction-after-mixing"));
    }

    @Test
    void additionalUngovernedOpening_withNoReduction_stillAffirmative() {
        // Q=1 governed; an extra ungoverned STO 1 exists but nothing reduced the governed 1,
        // and Positions shows short 2 (>= Q). The governed subset is provably intact.
        InputsB b = new InputsB();
        b.posQty = 2;
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN.plusDays(1)));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.FULL_Q_INTACT_APPLICABLE, a.verdict());
    }

    @Test
    void assignmentReducesExactlyOnce_exhausts() {
        InputsB b = new InputsB();
        b.posQty = 0;
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("ASSIGNED as of 09/20/2026", 1, OPEN.plusDays(10)));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.EXHAUSTED, a.verdict());
    }

    @Test
    void assignmentCompanionShareRow_doesNotDoubleReduce() {
        // The ASSIGNED option notification reduces the obligation once; a companion equity
        // "YOU SOLD ASSIGNED CALLS" row (different series/equity) must NOT reduce it again.
        InputsB b = new InputsB();
        b.q = 1; b.posQty = 0;
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("ASSIGNED as of 09/20/2026", 1, OPEN.plusDays(10)),
            otherRow("YOU SOLD ASSIGNED CALLS", "XLE SELECT SECTOR SPDR", 100, OPEN.plusDays(10)));
        ContinuityAssessment a = engine.assess(b.build());
        // Exactly one reduction of a Q=1 cohort => exhausted, not an over-reduction error.
        assertEquals(ContinuityVerdict.EXHAUSTED, a.verdict());
    }

    @Test
    void unsupportedOptionAffectingRow_transferOut_failsClosed() {
        // A transfer-out on the target series is uninterpretable as a bounded reduction and
        // MUST fail closed (paired net-zero transfers cannot be caught by endpoint recon).
        InputsB b = new InputsB();
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("TRANSFERRED TO brokerage", 1, OPEN.plusDays(4)));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.EVIDENCE_INSUFFICIENT, a.verdict());
        assertTrue(a.blockers().stream().anyMatch(x -> x.startsWith("unsupported-option-affecting-row")));
    }

    @Test
    void acatTransferOnSeries_failsClosed() {
        InputsB b = new InputsB();
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("TRANSFER OF ASSETS incoming", 1, OPEN.plusDays(4)));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.EVIDENCE_INSUFFICIENT, a.verdict());
    }

    @Test
    void missingCompleteness_isAuthorityMissing() {
        InputsB b = new InputsB();
        b.complete = false;
        b.rows = List.of(seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.AUTHORITY_MISSING, a.verdict());
    }

    @Test
    void nonQuietEndpointDay_failsClosed() {
        // An admitted target-series event ON the quiet day means quantity is not provably
        // constant across P => EVIDENCE_INSUFFICIENT (use a later observation or fail closed).
        InputsB b = new InputsB();
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, QUIET)); // event on P
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.EVIDENCE_INSUFFICIENT, a.verdict());
        assertTrue(a.blockers().contains("endpoint-day-not-quiet"));
    }

    @Test
    void missingEndpointObservation_failsClosed() {
        InputsB b = new InputsB();
        b.posQty = null;
        b.rows = List.of(seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.EVIDENCE_INSUFFICIENT, a.verdict());
        assertTrue(a.blockers().contains("endpoint-observation-missing"));
    }

    @Test
    void endpointQuantityBelowAdmittedAggregate_failsClosed() {
        // Admitted opening STO 2 (net short 2) but Positions shows only 1 with no admitted
        // reduction — the endpoint disagrees with the admitted aggregate (an off-record event
        // must exist). Fails closed on endpoint-aggregate-mismatch.
        InputsB b = new InputsB();
        b.q = 2; b.posQty = 1;
        b.rows = List.of(seriesRow("YOU SOLD OPENING TRANSACTION CALL", 2, OPEN));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.EVIDENCE_INSUFFICIENT, a.verdict());
        assertTrue(a.blockers().contains("endpoint-aggregate-mismatch"));
    }

    @Test
    void partialSurvivor_isPolicyUndefined() {
        // Q=2, one contract reduced (BTC 1) before any mixing => known partial survivor (1),
        // residual membership unratified => POLICY_UNDEFINED.
        InputsB b = new InputsB();
        b.q = 2; b.posQty = 1;
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 2, OPEN),
            seriesRow("YOU BOUGHT CLOSING TRANSACTION CALL", 1, OPEN.plusDays(3)));
        ContinuityAssessment a = engine.assess(b.build());
        assertEquals(ContinuityVerdict.POLICY_UNDEFINED, a.verdict());
        assertEquals(1, a.reconciledQuantity());
        assertTrue(a.blockers().contains("partial-survivor-residual-membership-undefined"));
    }

    // --- REJECT remediation regressions (exact review counterexamples) ---

    @Test
    void defect1_noOpeningEvidence_cannotAffirm() {
        // Caller-supplied openingQuantity WITHOUT an admitted opening STO row must not affirm.
        InputsB b = new InputsB();
        b.rows = List.of(); // no opening evidence at all
        ContinuityAssessment a = engine.assess(b.build());
        assertNotEquals(ContinuityVerdict.FULL_Q_INTACT_APPLICABLE, a.verdict());
        assertEquals(ContinuityVerdict.AUTHORITY_MISSING, a.verdict());
        assertTrue(a.blockers().contains("opening-evidence-missing"));
    }

    @Test
    void defect2_admittedSto1Sto1WithShort1_mustNotAffirm() {
        // Admitted STO 1 (opening) + STO 1 (later), Positions short 1. Old code affirmed on
        // observed >= Q; now it must fail closed because observed (1) != admitted aggregate (2):
        // an off-record reduction must have occurred, contradicting accepted completeness.
        InputsB b = new InputsB();
        b.posQty = 1;
        b.rows = List.of(
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN),
            seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN.plusDays(1)));
        ContinuityAssessment a = engine.assess(b.build());
        assertNotEquals(ContinuityVerdict.FULL_Q_INTACT_APPLICABLE, a.verdict());
        assertEquals(ContinuityVerdict.EVIDENCE_INSUFFICIENT, a.verdict());
        assertTrue(a.blockers().contains("endpoint-aggregate-mismatch"));
    }

    @Test
    void defect3_assignedAsOfEarlierDate_affectsEarlierDecisionCut() {
        // ASSIGNED "as of 2026-09-20" with Run Date 2026-09-28 must land on 09-20 and therefore
        // reduce the obligation within a quiet-day-09-26 assessment (economic as-of controls).
        FidelityActivityRow assignedAsOf = new FidelityActivityRow(
            LocalDate.parse("2026-09-28"), // Run Date LATER than the as-of
            "ASSIGNED as of 09/20/2026",
            " -XLE...", "CALL (XLE) SELECT SECTOR SPDR OCT 16 26 $57.5 (100 SHS)", "Cash",
            null, java.math.BigDecimal.valueOf(1), null, null, null, java.math.BigDecimal.ZERO, null,
            LocalDate.parse("2026-09-28"));
        InputsB b = new InputsB();
        b.posQty = 0;
        b.rows = List.of(seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN), assignedAsOf);
        ContinuityAssessment a = engine.assess(b.build());
        // The as-of-09-20 assignment reduced the Q=1 cohort => exhausted at the 09-26 cut.
        assertEquals(ContinuityVerdict.EXHAUSTED, a.verdict());
    }

    @Test
    void evidenceHash_isDeterministicAndInputSensitive() {
        InputsB b = new InputsB();
        b.rows = List.of(seriesRow("YOU SOLD OPENING TRANSACTION CALL", 1, OPEN));
        String h1 = engine.assess(b.build()).evidenceHash();
        String h2 = engine.assess(b.build()).evidenceHash();
        assertEquals(h1, h2, "same inputs => same evidence hash (replay integrity)");
        InputsB b2 = new InputsB();
        b2.q = 2; b2.posQty = 2;
        b2.rows = List.of(seriesRow("YOU SOLD OPENING TRANSACTION CALL", 2, OPEN));
        assertNotEquals(h1, engine.assess(b2.build()).evidenceHash(), "changed inputs => changed hash");
    }
}
