package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Provenance of a canonical direct-quote observation (ratified OAS {@code QuoteProvenance}).
 *
 * <p>Preserves provider/environment identity, acquisition identity, authority/fencing
 * identity, acquisition phase/session context, and the distinct Wheelwright clocks
 * ({@code receivedAt}, {@code committedAt}). It carries NO credential or raw authority
 * secret (contract §9, §20).
 *
 * <p>A reused or retained observation keeps its original provenance and clocks unchanged
 * (Doc 76 §21.3): provenance timestamps are never refreshed merely because the observation
 * is returned again in a later request.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuoteProvenance(
        String provider,
        Environment environment,
        String acquisitionId,
        String authorityEpoch,
        AcquisitionPhase acquisitionPhase,
        String regularSessionDate,
        String feedIdentity,
        String receivedAt,
        String committedAt
) {

    /** Provider data environment (NOT client deployment environment). */
    public enum Environment { PRODUCTION, SANDBOX }

    /**
     * Wheelwright classification at upstream contact. Not a provider event time and not an
     * evidence-admissibility verdict (contract §8, §9).
     */
    public enum AcquisitionPhase { REGULAR_USABLE, PRE_MARKET, POST_MARKET, CLOSED, UNKNOWN }
}
