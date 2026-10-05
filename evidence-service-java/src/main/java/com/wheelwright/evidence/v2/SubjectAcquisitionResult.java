package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * One terminal result per canonical requested subject (ratified OAS
 * {@code SubjectAcquisitionResult}), in request order.
 *
 * <p>Invariants enforced by the service and asserted here through the factory methods:
 * <ul>
 *   <li>Fulfilled ({@code NEWLY_ACQUIRED} / {@code REUSED}): {@code observation} non-null,
 *       {@code failure} absent, {@code priorRetained == false}.</li>
 *   <li>Unfulfilled: {@code failure} required with {@code failure.code == outcome};
 *       {@code observation} is retained prior canonical evidence when one exists, else null;
 *       {@code priorRetained} reflects whether such a prior exists. Retained prior evidence
 *       does NOT fulfill the failed request.</li>
 * </ul>
 */
public record SubjectAcquisitionResult(
        AcquireQuotesRequest.RequestedSubject subject,
        SubjectOutcome outcome,
        boolean fulfilled,
        // Required by the OAS and always serialized, as JSON null when there is no selected
        // observation (NON_NULL is deliberately NOT applied to this record so required
        // nullable fields are present).
        QuoteObservation observation,
        boolean priorRetained,
        @JsonInclude(JsonInclude.Include.NON_NULL) SubjectFailure failure
) {

    /** Per-subject failure detail (ratified OAS {@code SubjectFailure}). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SubjectFailure(SubjectOutcome code, boolean retryable, String detail) {}

    /** Build a fulfilled result ({@code NEWLY_ACQUIRED} or {@code REUSED}). */
    public static SubjectAcquisitionResult fulfilled(
            AcquireQuotesRequest.RequestedSubject subject,
            SubjectOutcome outcome,
            QuoteObservation observation) {
        if (!outcome.fulfilled()) {
            throw new IllegalArgumentException("fulfilled result requires a fulfilled outcome: " + outcome);
        }
        if (observation == null) {
            throw new IllegalArgumentException("fulfilled result requires a non-null observation");
        }
        return new SubjectAcquisitionResult(subject, outcome, true, observation, false, null);
    }

    /**
     * Build an unfulfilled result. {@code priorObservation} is the retained prior canonical
     * direct-quote evidence (or null if none); it never fulfills the request.
     */
    public static SubjectAcquisitionResult failed(
            AcquireQuotesRequest.RequestedSubject subject,
            SubjectOutcome outcome,
            QuoteObservation priorObservation,
            boolean retryable,
            String detail) {
        if (outcome.fulfilled()) {
            throw new IllegalArgumentException("failed result requires an unfulfilled outcome: " + outcome);
        }
        return new SubjectAcquisitionResult(
                subject,
                outcome,
                false,
                priorObservation,
                priorObservation != null,
                new SubjectFailure(outcome, retryable, detail));
    }
}
