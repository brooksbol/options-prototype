package com.wheelwright.evidence.v2;

/**
 * The ratified terminal per-subject outcome vocabulary (OAS {@code SubjectAcquisitionResult.outcome}).
 *
 * <p>Only {@link #NEWLY_ACQUIRED} and {@link #REUSED} are fulfilled (contract §16). Every
 * other outcome is a failure whose {@code failure.code} equals the outcome.
 */
public enum SubjectOutcome {
    /** Subject-verified evidence acquired, fenced, durably accepted, and visible before response. */
    NEWLY_ACQUIRED(true),
    /** Ordinary-policy-eligible held evidence satisfied the request without upstream contact. */
    REUSED(true),
    /** Provider did not return a matching subject in an otherwise completed response. */
    UNMATCHED(false),
    /** Requested identity is outside this capability or cannot be served by the provider. */
    UNSUPPORTED_SUBJECT(false),
    /** Provider could not be contacted after the operation started. */
    UPSTREAM_UNAVAILABLE(false),
    /** Effective policy prohibits provider contact for this unresolved subject. */
    CONTACT_NOT_PERMITTED(false),
    /** No upstream call was admitted. */
    ADMISSION_REJECTED(false),
    /** The upstream acquisition attempt failed. */
    UPSTREAM_FAILED(false),
    /** Upstream evidence did not satisfy the canonical price-bearing predicate. */
    INVALID_UPSTREAM_EVIDENCE(false),
    /** Acquisition authority was superseded; evidence could not be committed as current. */
    AUTHORITY_SUPERSEDED(false),
    /** Subject-verified evidence could not be durably accepted into held state. */
    ACCEPTANCE_FAILED(false);

    private final boolean fulfilled;

    SubjectOutcome(boolean fulfilled) {
        this.fulfilled = fulfilled;
    }

    public boolean fulfilled() {
        return fulfilled;
    }
}
