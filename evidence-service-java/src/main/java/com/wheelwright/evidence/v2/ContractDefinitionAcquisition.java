package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.Instant;
import java.util.*;

/** Explicit native definitions/positive underlying classification; no monitoring read-through. */
@Component
public class ContractDefinitionAcquisition {
    record SubjectResult(String holdingId,String status,String artifactId,String reason) {}
    record Result(String requestId,String accountId,String acquisitionId,String mode,String snapshotId,String startedAt,String completedAt,List<SubjectResult> results,String coverage) {}
    private final PositionAssociations store;private final ObjectMapper json;private final TastytradeClient client;
    @org.springframework.beans.factory.annotation.Autowired
    public ContractDefinitionAcquisition(SqliteEvidenceStore db,ObjectMapper json,TastytradeClient client)throws SQLException {
        this(db.getConnection().getMetaData().getURL(),json,client);
    }
    ContractDefinitionAcquisition(String url,ObjectMapper json,TastytradeClient client){this.store=new PositionAssociations(url,json);this.json=json;this.client=client;}
    public boolean configured(){return client.configured();}
    public synchronized Result acquire(String account,String snapshotId,String request)throws Exception {
        PositionSnapshot snapshot;try(var c=store.connect(true)){snapshot=store.snapshot(c,account,snapshotId);}if(snapshot==null)throw new NoSuchElementException();
        String attempt=UUID.randomUUID().toString(),started=Instant.now().toString();
        var options=snapshot.holdings().stream().filter(h->h.kind().equals("Options")&&h.quantity().signum()!=0).toList();
        var subjects=new ArrayList<TastytradeClient.DefinitionSubject>();var unsupported=new HashSet<String>();
        for(var h:options) {
            var id=OptionIdentity.of(h);String nativeSymbol=null;
            try{if(id!=null)nativeSymbol=id.nativeSymbol();}catch(ArithmeticException ignored){/* no guessing unrepresentable native strike */}
            if(nativeSymbol==null||id.root().length()>6){unsupported.add(h.holdingId());continue;}
            if(subjects.size()<100)subjects.add(new TastytradeClient.DefinitionSubject(h.holdingId(),nativeSymbol,id.root()));
        }
        var retained=new HashMap<String,String[]>();long[] bytes={0};Set<String> attempted=Set.of();boolean upstreamFailed=false;
        try {
            attempted=client.contractDefinitions(subjects,(subject,kind,payload)->{
                bytes[0]+=payload.length;if(bytes[0]>BrokerageArtifacts.MAX_BYTES)return;
                var pair=retained.computeIfAbsent(subject.holdingId(),k->new String[2]);pair[kind.equals("OPTION")?0:1]=retain(account,attempt,kind,payload);
            });
        }catch(SQLException e){throw e;}catch(Exception e){upstreamFailed=true;}
        var results=new ArrayList<SubjectResult>();
        for(var h:options) {
            var pair=retained.get(h.holdingId());
            if(pair==null){results.add(new SubjectResult(h.holdingId(),unsupported.contains(h.holdingId())?"UNSUPPORTED":upstreamFailed||attempted.contains(h.holdingId())?"UNAVAILABLE":"NOT_ATTEMPTED",null,unsupported.contains(h.holdingId())?"CONTRACT_IDENTITY_UNSUPPORTED":"SOURCE_UNAVAILABLE_OR_BUDGET_EXHAUSTED"));continue;}
            String observation=UUID.randomUUID().toString();
            try(var c=store.connect(false);var q=c.prepareStatement("INSERT INTO position_contract_evidence VALUES (?,?,?,?,?,?,?,?)")) {
                q.setString(1,account);q.setString(2,snapshotId);q.setString(3,h.holdingId());q.setString(4,observation);q.setString(5,attempt);q.setString(6,pair[0]);q.setString(7,pair[1]);q.setString(8,Instant.now().toString());q.executeUpdate();
            }
            ContractEvidence.Facts facts;try(var c=store.connect(true)){facts=ContractEvidence.read(c,snapshot,h);}
            String status=facts.terms().status();
            results.add(new SubjectResult(h.holdingId(),status.equals("ESTABLISHED")?"ADMITTED":status.equals("UNKNOWN")?"UNAVAILABLE":status,pair[0],status.equals("ESTABLISHED")?null:facts.terms().reasons().getFirst()));
        }
        var result=new Result(request,account,attempt,"contract-terms",snapshotId,started,Instant.now().toString(),List.copyOf(results),results.stream().allMatch(r->r.status().equals("ADMITTED"))?"COMPLETE":"INCOMPLETE");
        try(var c=store.connect(false);var q=c.prepareStatement("INSERT INTO position_contract_acquisition VALUES (?,?,?)")){q.setString(1,account);q.setString(2,attempt);q.setString(3,json.writeValueAsString(result));q.executeUpdate();}
        return result;
    }
    private String retain(String account,String attempt,String kind,byte[] bytes)throws Exception {
        String hash=BrokerageArtifacts.sha(bytes),artifact=UUID.nameUUIDFromBytes((account+"|"+hash).getBytes(StandardCharsets.UTF_8)).toString(),received=Instant.now().toString();
        try(var c=store.connect(false)) {
            c.setAutoCommit(false);
            try {
                try(var q=c.prepareStatement("SELECT artifact_id FROM brokerage_artifact WHERE account=? AND sha256=?")){q.setString(1,account);q.setString(2,hash);try(var rs=q.executeQuery()){if(rs.next())artifact=rs.getString(1);}}
                try(var q=c.prepareStatement("INSERT OR IGNORE INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,artifact);q.setString(3,hash);q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,received);q.executeUpdate();}
                try(var q=c.prepareStatement("INSERT INTO brokerage_import VALUES (?,?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,UUID.randomUUID().toString());q.setString(3,artifact);q.setString(4,kind.equals("OPTION")?"option-definition.json":"underlying-definition.json");q.setString(5,kind.equals("OPTION")?"API_OPTION_DEFINITION":"API_UNDERLYING_DEFINITION");q.setString(6,received);q.setString(7,"ACCEPTED");q.setString(8,"Retained native definition. Domain qualification evaluated separately; acquisition "+attempt);q.executeUpdate();}
                c.commit();return artifact;
            }catch(Exception e){c.rollback();throw e;}
        }
    }
}
