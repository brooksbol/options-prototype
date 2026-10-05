package com.wheelwright.evidence.v2;

import java.util.List;

/**
 * Response body for a completed {@code POST /v2/quotes} operation (ratified OAS
 * {@code AcquireQuotesResponse}).
 *
 * <p>A normal {@code 200} carrying this body is emitted only after every requested subject
 * has a terminal result (contract §18). {@code 200} denotes a completed operation, not
 * fulfillment of every subject. {@code startedAt}/{@code completedAt} describe this request,
 * not market events or observation age.
 */
public record AcquireQuotesResponse(
        String requestId,
        AcquireQuotesRequest.Mode mode,
        String startedAt,
        String completedAt,
        List<SubjectAcquisitionResult> results
) {}
