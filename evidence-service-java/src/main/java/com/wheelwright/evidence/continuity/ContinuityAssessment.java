package com.wheelwright.evidence.continuity;

import java.util.List;

/**
 * The immutable result of a bounded continuity assessment (ADR-022 / Doc 70).
 *
 * Carries the verdict, an ordered human/audit blocker list, the reconciled quantity when
 * determinable, and the exact evidence contract that a Decision pins for replay (Doc 70 §7):
 * the admission-rule version, accepted completeness premise, quiet day, opening anchor, and
 * a deterministic content hash of the admitted evidence. Later corrections can change a
 * FUTURE assessment without rewriting an earlier Decision's pinned picture.
 */
public record ContinuityAssessment(
    ContinuityVerdict verdict,
    /** Governed whole quantity Q that the assessment was about. */
    int openingQuantity,
    /** Reconciled surviving quantity of the governed cohort when determinable; else null. */
    Integer reconciledQuantity,
    /** Ordered blocker/reason keys explaining a non-affirmative verdict (empty when affirmative). */
    List<String> blockers,
    /** Admission/interpretation rule version consumed (Doc 70 §4/§7). */
    String admissionRuleVersion,
    /** Whether the accepted completeness premise was present (Doc 70 §5/§7). */
    boolean acceptedCompleteness,
    /** The quiet endpoint day P used (ISO date string) or null. */
    String quietDay,
    /** Deterministic content hash of the admitted evidence contract (replay integrity). */
    String evidenceHash
) {
    /** True only for the affirmative whole-Q-intact lane. */
    public boolean isAffirmative() {
        return verdict == ContinuityVerdict.FULL_Q_INTACT_APPLICABLE;
    }
}
