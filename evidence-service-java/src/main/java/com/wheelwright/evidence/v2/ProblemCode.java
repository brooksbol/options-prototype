package com.wheelwright.evidence.v2;

/**
 * Fixed request-wide error code/status pairs (ratified OAS {@code Problem.code}, contract §21).
 *
 * <p>Each code maps to exactly one HTTP status and a stable title. The problem {@code type}
 * is the stable URN {@code urn:wheelwright:problem:{lowercase-code}}.
 */
public enum ProblemCode {
    MALFORMED_REQUEST(400, "Malformed request"),
    UNAUTHENTICATED(401, "Unauthenticated"),
    FORBIDDEN(403, "Forbidden"),
    UNSUPPORTED_MEDIA_TYPE(415, "Unsupported media type"),
    INVALID_REQUEST(422, "Invalid request"),
    CAPABILITY_UNAVAILABLE(503, "Capability unavailable"),
    INTERNAL_ERROR(500, "Internal error");

    private final int status;
    private final String title;

    ProblemCode(int status, String title) {
        this.status = status;
        this.title = title;
    }

    public int status() {
        return status;
    }

    public String title() {
        return title;
    }

    /** Stable problem-type URN: {@code urn:wheelwright:problem:{lowercase-code}}. */
    public String typeUri() {
        return "urn:wheelwright:problem:" + name().toLowerCase(java.util.Locale.ROOT);
    }
}
