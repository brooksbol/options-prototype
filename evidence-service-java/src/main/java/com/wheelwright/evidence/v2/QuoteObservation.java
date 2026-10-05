package com.wheelwright.evidence.v2;

/**
 * A canonical direct-quote observation (ratified OAS {@code QuoteObservation}).
 *
 * <p>An observation is evidence of what a source reported. It is NOT itself a freshness
 * verdict, reuse verdict, or downstream evidence-admissibility verdict (Doc 76 §21.1). It
 * carries a stable Wheelwright {@code observationId}, the resolved {@code subject}, the
 * source-reported {@code facts}, and separate {@code provenance}.
 *
 * <p>Observation identity is the {@code observationId}, never inferred from numeric
 * equality: a forced upstream acquisition returning unchanged numeric values still produces
 * a new accepted observation (contract §6).
 */
public record QuoteObservation(
        String observationId,
        ResolvedSubject subject,
        QuoteFacts facts,
        QuoteProvenance provenance
) {}
