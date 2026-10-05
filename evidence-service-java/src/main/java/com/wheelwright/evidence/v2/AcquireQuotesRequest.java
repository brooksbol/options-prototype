package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Request body for {@code POST /v2/quotes} (ratified OAS {@code AcquireQuotesRequest}).
 *
 * <p>{@code additionalProperties: false} at the request and subject level. Unknown request
 * properties MUST be rejected (contract §4) so clients cannot accidentally assume a new
 * policy override — enforced via {@code @JsonIgnoreProperties(ignoreUnknown = false)}, which
 * makes Jackson fail (surfaced as {@code 400 MALFORMED_REQUEST}) on unknown fields.
 *
 * <p>{@code mode} is optional and defaults to {@link Mode#ORDINARY}; {@code FORCE} is the
 * only override. Subject cardinality (1–30), canonical-uppercase duplicate detection, symbol
 * shape, and request-order preservation are validated semantically in the service, not here.
 */
@JsonIgnoreProperties(ignoreUnknown = false)
public record AcquireQuotesRequest(
        List<RequestedSubject> subjects,
        Mode mode
) {

    /** Acquisition intent. ORDINARY may reuse eligible held evidence; FORCE bypasses reuse. */
    public enum Mode { ORDINARY, FORCE }

    /** One requested subject (ratified OAS {@code RequestedSubject}). */
    @JsonIgnoreProperties(ignoreUnknown = false)
    public record RequestedSubject(String symbol) {}

    /** Effective mode, applying the ORDINARY default when none was supplied. */
    public Mode effectiveMode() {
        return mode == null ? Mode.ORDINARY : mode;
    }
}
