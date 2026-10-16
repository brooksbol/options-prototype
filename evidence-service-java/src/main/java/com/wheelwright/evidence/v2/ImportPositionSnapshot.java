package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.DatabaseManager;
import java.nio.file.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Operator-run backend admission utility. Does not touch Account Ledger or prior snapshots. */
public final class ImportPositionSnapshot {
    private ImportPositionSnapshot() {}
    public static void main(String[] args) throws Exception {
        if (args.length < 4 || args.length > 6) throw new IllegalArgumentException(
                "usage: ImportPositionSnapshot <db> <account-alias> <broker-account> <Positions.csv> [explicit-associations.json] [retained-option-instruments.json]");
        var mapper = new ObjectMapper();
        List<PositionSnapshot.Association> associations = args.length >= 5
                ? mapper.readValue(Files.readString(Path.of(args[4])), new TypeReference<>() {}) : List.of();
        var path = Path.of(args[3]);
        try (var conn = DatabaseManager.open(args[0])) {
            var service = new PositionReadService(conn.getMetaData().getURL(), mapper);
            var artifacts = new BrokerageArtifacts(conn.getMetaData().getURL(), mapper, service);
            String accountId = artifacts.bindAccount(args[1], args[2]);
            var result = artifacts.ingest(accountId, path.getFileName().toString(), "POSITIONS", Files.readAllBytes(path), UUID.randomUUID().toString());
            if ((!associations.isEmpty() || args.length==6) && result.status().equals("ACCEPTED")) {
                var s = FidelityPositions.parse(accountId, args[2], path.getFileName().toString(), Files.readString(path), Instant.now().toString(), associations, new AccountDirectory(conn.getMetaData().getURL()).identityNamespace(accountId));
                PositionSnapshot.InstrumentEvidence terms=null;
                if(args.length==6) {
                    var file=Path.of(args[5]);String payload=Files.readString(file);
                    terms=new PositionSnapshot.InstrumentEvidence(file.getFileName().toString(),FidelityPositions.digest(payload),payload);
                    if(OptionContractTerms.read(terms).isEmpty())throw new IllegalArgumentException("no admissible instrument terms in retained source");
                }
                String snapshotId=terms==null?s.snapshotId():FidelityPositions.digest(s.snapshotId()+"|"+terms.sha256());
                service.admit(new PositionSnapshot(s.account(), s.brokerAccount(), s.accountName(), snapshotId, s.evidenceDate(), s.recordedAt(), s.sourceFile(),
                        s.sourceSha256(), result.artifactId(), s.holdings(), s.associations(), s.excludedNonPositionRows(),s.observation(),terms));
            }
            System.out.println(mapper.writeValueAsString(result));
            if (!result.status().equals("ACCEPTED")) throw new IllegalStateException("source retained; processing failed");
        }
    }
}
