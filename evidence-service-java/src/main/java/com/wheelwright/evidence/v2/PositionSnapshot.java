package com.wheelwright.evidence.v2;

import java.math.BigDecimal;
import java.util.List;

/** Snapshot-bound read model. Identities denote observed inventory, never lifecycle continuity. */
public record PositionSnapshot(String account, String brokerAccount, String accountName,
        String snapshotId, String evidenceDate, String recordedAt, String sourceFile,
        String sourceSha256, String artifactId, List<Constituent> holdings,
        List<Association> associations, int excludedNonPositionRows) {
    public record Constituent(String holdingId, String contract, String description, String kind,
            String custody, BigDecimal quantity, BigDecimal openPl, BigDecimal marketValue,
            BigDecimal bid, BigDecimal ask, String expiration, List<Integer> sourceRows) {}
    /** Explicit operator association, bound to this admitted snapshot, not inferred from Program. */
    public record Association(String positionId, String label, List<String> holdingIds,
            String program, String authority) {}
    public record Position(String positionId, String label, String identityBasis,
            String program, String associationAuthority, BigDecimal openPl, BigDecimal marketValue,
            BigDecimal shareEquivalentDelta, BigDecimal capitalRequirement, List<Leg> constituents, List<String> qualifications) {}
    public record MarketEvidence(String artifactId, String sourceFile, String sourceSha256, String evidenceDate, List<Integer> sourceRows) {}
    public record Leg(Constituent holding, Long dte, BigDecimal shareEquivalentDelta, String state,
            BigDecimal capitalRequirement, MarketEvidence marketEvidence) {}
    public record Read(String requestId, String accountId, String accountName, String snapshotId,
            String evidenceDate, String recordedAt, String sourceFile, String sourceSha256, String artifactId,
            String evaluatedAt, int excludedNonPositionRows, List<Position> positions,
            String workingOrderCoverage, List<String> qualifications) {}
}
