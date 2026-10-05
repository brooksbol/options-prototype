package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.SqliteEvidenceStore.HeldDirectQuoteRow;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

/** Frozen held-discovery summary: original identity and receipt/commit clocks only. */
public record HeldQuoteDiscoveryItem(String observationId, ResolvedSubject subject,
                                      DiscoveryProvenance provenance) {
    private static final Pattern UUID = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    private static final Pattern SYMBOL = Pattern.compile("[A-Z^][A-Z0-9.^/_-]{0,31}");
    private static final Pattern UTC = Pattern.compile(
            "[0-9]{4}-[0-9]{2}-[0-9]{2}[Tt][0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?Z");

    public record DiscoveryProvenance(String provider, QuoteProvenance.Environment environment,
                                      String receivedAt, String committedAt) {}

    static boolean validUuid(String value) { return value != null && UUID.matcher(value).matches(); }

    static HeldQuoteDiscoveryItem from(HeldDirectQuoteRow row) {
        if (!validUuid(row.observationId()) || row.symbol() == null ||
                !SYMBOL.matcher(row.symbol()).matches() ||
                row.provider() == null || row.provider().isEmpty()) {
            throw new IllegalArgumentException("invalid required discovery data");
        }
        validateTime(row.receivedAt());
        validateTime(row.committedAt());
        // Unknown values fail the complete read; no acquisition-service fallback.
        return new HeldQuoteDiscoveryItem(row.observationId(),
                new ResolvedSubject(row.symbol(), ResolvedSubject.SecurityType.valueOf(row.securityType())),
                new DiscoveryProvenance(row.provider(), QuoteProvenance.Environment.valueOf(row.environment()),
                        row.receivedAt(), row.committedAt()));
    }

    private static void validateTime(String value) {
        if (value == null || !UTC.matcher(value).matches())
            throw new IllegalArgumentException("invalid discovery clock");
        // Validate calendar/time without losing any stored fractional precision on the wire.
        LocalDateTime.parse(value.substring(0, value.length() - 1).replace('t', 'T')
                .replaceFirst("(\\.[0-9]{9})[0-9]+$", "$1"));
    }
}
