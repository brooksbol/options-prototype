package com.wheelwright.evidence.v2;

import java.math.BigDecimal;
import java.util.List;

/** Snapshot-bound read model. Identities denote observed inventory, never lifecycle continuity. */
public record PositionSnapshot(String account, String brokerAccount, String accountName,
        String snapshotId, String evidenceDate, String recordedAt, String sourceFile,
        String sourceSha256, String artifactId, List<Constituent> holdings,
        List<Association> associations, int excludedNonPositionRows, Observation observation) {
    public record Observation(String broker, String environment, String acquisitionId, String startedAt,
            String receivedAt, String interpretationVersion, String sourceScope) {}
    public PositionSnapshot(String account,String brokerAccount,String accountName,String snapshotId,String evidenceDate,String recordedAt,
            String sourceFile,String sourceSha256,String artifactId,List<Constituent> holdings,List<Association> associations,int excludedNonPositionRows) {
        this(account,brokerAccount,accountName,snapshotId,evidenceDate,recordedAt,sourceFile,sourceSha256,artifactId,holdings,associations,excludedNonPositionRows,null);
    }
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
    public record ObservationContext(String broker, String evidenceDateBasis, String evidenceDatePrecision) {}
    public static ObservationContext context(PositionSnapshot s) {
        return s.observation() == null ? new ObservationContext("FIDELITY", "FIDELITY_EXPORT_DATE", "DAY")
                : new ObservationContext("TASTYTRADE", "BACKEND_RECEIPT_UTC_DATE", "DAY");
    }
    public static List<String> observationQualifications(PositionSnapshot s) {
        return List.of(
            "Catalog order is deterministic display order, not established brokerage chronology; same-date observations need not have an established intraday order.",
            "Retained inventory observations do not establish lifecycle events, managed Position continuity or complete brokerage history.",
            s.observation() == null
                ? "Evidence date is the Fidelity export day, with day precision; exact brokerage observation time is unknown. recordedAt is assigned before admission, not a separate commit timestamp."
                : "Evidence date is the UTC response receipt day. startedAt and receivedAt bound backend acquisition, not an atomic brokerage observation or event time. recordedAt equals receipt time, not a separate commit timestamp.");
    }
    public record ObservationSummary(String requestId, String accountId, String accountName, String snapshotId,
            String evidenceDate, String recordedAt, String sourceFile, String sourceSha256, String artifactId,
            int holdingCount, Observation observation, ObservationContext observationContext, List<String> qualifications) {
        static ObservationSummary of(PositionSnapshot s, String requestId) {
            return new ObservationSummary(requestId, s.account(), s.accountName(), s.snapshotId(), s.evidenceDate(),
                    s.recordedAt(), s.sourceFile(), s.sourceSha256(), s.artifactId(), s.holdings().size(), s.observation(),
                    context(s), observationQualifications(s));
        }
    }
    public record Read(String requestId, String accountId, String accountName, String snapshotId,
            String evidenceDate, String recordedAt, String sourceFile, String sourceSha256, String artifactId,
            String evaluatedAt, int excludedNonPositionRows, List<Position> positions,
            String workingOrderCoverage, List<String> qualifications, Observation observation, ObservationContext observationContext, String evaluationBasis) {}
}
