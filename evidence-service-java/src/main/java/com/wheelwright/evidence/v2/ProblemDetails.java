package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * RFC 9457 problem detail (ratified OAS {@code Problem}, media type
 * {@code application/problem+json}).
 *
 * <p>{@code type} is the stable URN {@code urn:wheelwright:problem:{lowercase-code}};
 * {@code title} is stable text; {@code detail} may vary and must be safe to expose (no
 * provider credentials or raw provider payloads). {@code requestId} correlates the response
 * and logs; it is not an idempotency key.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemDetails(
        String type,
        String title,
        int status,
        String code,
        String detail,
        String instance,
        String requestId,
        List<InvalidParam> invalidParams
) {

    /** One invalid request parameter (ratified OAS {@code Problem.invalidParams[]}). */
    public record InvalidParam(String name, String reason) {}

    public static ProblemDetails of(ProblemCode code, String requestId, String detail) {
        return new ProblemDetails(
                code.typeUri(), code.title(), code.status(), code.name(),
                detail, null, requestId, null);
    }

    public static ProblemDetails of(ProblemCode code, String requestId, String detail,
                                    List<InvalidParam> invalidParams) {
        return new ProblemDetails(
                code.typeUri(), code.title(), code.status(), code.name(),
                detail, null, requestId,
                invalidParams == null || invalidParams.isEmpty() ? null : invalidParams);
    }
}
