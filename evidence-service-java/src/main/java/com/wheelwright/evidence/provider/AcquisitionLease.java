package com.wheelwright.evidence.provider;

/**
 * An immutable, atomically-acquired binding for one acquisition operation
 * (PL-PROV-FAILOVER constraint 2 — atomic acquisition lease).
 *
 * The provider-control layer hands out exactly one lease per acquisition, holding
 * together — as a single atomic snapshot — everything the operation and its
 * externally-meaningful consequences must agree on:
 *   - {@code authorityId} / {@code environment}: which provider produced the evidence;
 *   - {@code fenceEpoch}: the authority epoch the operation began under;
 *   - {@code provenanceId}: the provenance identity to stamp on any resulting evidence;
 *   - {@code adapter}: the exact adapter to make every provider call through.
 *
 * Adapter, epoch, and provenance must NEVER be read independently. Every provider
 * call and every externally-meaningful consequence (durable write, symbol lifecycle,
 * generation/publication, current-authority control decision, current-state
 * telemetry) must use and validate the SAME lease via
 * {@link ProviderAuthorityManager#validate(AcquisitionLease)}. A stale lease (its
 * epoch superseded by an authority transition) must affect none of those.
 */
public record AcquisitionLease(
    String authorityId,
    String environment,
    long fenceEpoch,
    String provenanceId,
    String operationId,
    TradierAdapter adapter
) {}
