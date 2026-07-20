package com.wheelwright.evidence.provider;

/**
 * Error from a market-data provider call.
 * Carries HTTP status code and optional retry guidance.
 */
public class ProviderError extends RuntimeException {

    private final int statusCode;
    private final Long retryAfterMs;

    public ProviderError(String message, int statusCode) {
        this(message, statusCode, null);
    }

    public ProviderError(String message, int statusCode, Long retryAfterMs) {
        super(message);
        this.statusCode = statusCode;
        this.retryAfterMs = retryAfterMs;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public Long getRetryAfterMs() {
        return retryAfterMs;
    }
}
