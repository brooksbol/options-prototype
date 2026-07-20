package com.wheelwright.evidence.provider;

/**
 * Application-owned expiration representation.
 * Normalized from provider-specific response shapes.
 */
public record MarketExpiration(String date, int dte) {}
