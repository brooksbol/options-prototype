package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.core.StreamReadFeature;
import java.math.BigDecimal;
import java.sql.*;
import java.time.*;
import java.util.*;
import static com.wheelwright.evidence.v2.StructuralModel.*;

/** Pure retained-source qualification. Equity Option/100 alone is never physical eligibility. */
final class ContractEvidence {
    private static final ObjectMapper JSON=JsonMapper.builder().enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
            .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).build();
    private static final Set<String> US_MARKETS=Set.of("XNYS","XNAS","ARCX","XASE","BATS","EDGX","IEXG");
    record Facts(Fact<Terms> terms,Fact<Underlying> underlying,Instant expiresAt,List<Evidence> evidence) {}
    record Source(String id,String artifact,String hash,byte[] bytes,String recordedAt) {}
    static JsonNode document(byte[] bytes)throws Exception {
        if(bytes==null||bytes.length>BrokerageArtifacts.MAX_BYTES)throw new IllegalArgumentException("source unavailable");
        return JSON.readTree(bytes);
    }
    static Facts missing(String reason){return new Facts(Fact.unknown(reason),Fact.unknown(reason),null,List.of());}
    static Facts read(Connection c,PositionSnapshot snapshot,PositionSnapshot.Constituent h)throws Exception {
        var rows=new ArrayList<Source[]>();
        try(var q=c.prepareStatement("""
                SELECT e.observation_id,e.recorded_at,o.artifact_id AS oid,o.sha256 AS ohash,o.payload AS obytes,
                  u.artifact_id AS uid,u.sha256 AS uhash,u.payload AS ubytes
                FROM position_contract_evidence e
                LEFT JOIN brokerage_artifact o ON o.account=e.account AND o.artifact_id=e.option_artifact_id
                LEFT JOIN brokerage_artifact u ON u.account=e.account AND u.artifact_id=e.underlying_artifact_id
                WHERE e.account=? AND e.snapshot_id=? AND e.holding_id=? AND e.option_artifact_id IS NOT NULL
                ORDER BY e.recorded_at DESC,e.rowid DESC
                """)) {
            q.setString(1,snapshot.account());q.setString(2,snapshot.snapshotId());q.setString(3,h.holdingId());
            try(var rs=q.executeQuery()){while(rs.next()) {
                String id=rs.getString("observation_id"),time=rs.getString("recorded_at");
                rows.add(new Source[]{new Source(id+":option",rs.getString("oid"),rs.getString("ohash"),rs.getBytes("obytes"),time),
                    new Source(id+":underlying",rs.getString("uid"),rs.getString("uhash"),rs.getBytes("ubytes"),time)});
                if(rows.size()>10000)throw new SQLException("contract evidence capacity");
            }}
        }
        if(rows.isEmpty())return missing("NO_RETAINED_CONTRACT_DEFINITION");
        var first=rows.getFirst();
        if(first[1].bytes()==null) {
            // A failed repeated acquisition may reuse an unchanged earlier source. Changed partial source cannot.
            for(var pair:rows)if(Objects.equals(pair[0].hash(),first[0].hash())&&pair[1].bytes()!=null)return qualify(h,pair[0],pair[1]);
        }
        return qualify(h,first[0],first[1]);
    }
    static Facts qualify(PositionSnapshot.Constituent h,Source option,Source underlying) {
        var evidence=new ArrayList<Evidence>();
        for(var source:List.of(option,underlying))if(source.bytes()!=null)evidence.add(new Evidence(source.id(),"CONTRACT_TERMS",source.id(),source.artifact(),source.hash(),List.of(),null,null,source.recordedAt(),null,null));
        List<String> refs=evidence.stream().map(Evidence::evidenceId).toList();Instant expires=null;
        try {
            if(option.bytes()==null||!BrokerageArtifacts.sha(option.bytes()).equals(option.hash())||underlying.bytes()!=null&&!BrokerageArtifacts.sha(underlying.bytes()).equals(underlying.hash()))return unavailable("CONFLICTING","SOURCE_HASH_MISMATCH",refs,evidence,null);
            var id=OptionIdentity.of(h);var root=document(option.bytes()).path("data");
            var actual=OptionIdentity.of(root.path("symbol").asText(),root.path("expiration-date").asText());
            if(id==null||!id.equals(actual)||!root.path("instrument-type").asText().equals("Equity Option")||!root.path("underlying-symbol").asText().equals(id.root())||!root.path("option-type").asText().equals(id.right())||new BigDecimal(root.path("strike-price").asText()).compareTo(id.strike())!=0)
                return unavailable("CONFLICTING","CONTRACT_IDENTITY_CONFLICT",refs,evidence,null);
            if(root.hasNonNull("expires-at")) {
                var instant=OffsetDateTime.parse(root.path("expires-at").asText());
                if(!instant.toLocalDate().toString().equals(id.expiration()))return unavailable("CONFLICTING","EXPIRATION_CONFLICT",refs,evidence,null);
                expires=instant.toInstant();
            }
            if(underlying.bytes()==null)return unavailable("UNKNOWN","PHYSICAL_PRODUCT_CLASSIFICATION_MISSING",refs,evidence,expires);
            var equity=document(underlying.bytes()).path("data");
            if(!equity.path("symbol").asText().equals(id.root())||!equity.path("instrument-type").asText().equals("Equity"))return unavailable("CONFLICTING","UNDERLYING_IDENTITY_CONFLICT",refs,evidence,expires);
            if(!equity.path("is-index").isBoolean())return unavailable("UNKNOWN","PHYSICAL_PRODUCT_CLASSIFICATION_MISSING",refs,evidence,expires);
            if(equity.path("is-index").asBoolean())return unavailable("UNSUPPORTED","CASH_INDEX_PRODUCT",refs,evidence,expires);
            if(equity.path("instrument-sub-type").asText().equalsIgnoreCase("Index"))return unavailable("CONFLICTING","PHYSICAL_PRODUCT_CLASSIFICATION_CONFLICT",refs,evidence,expires);
            if(!US_MARKETS.contains(equity.path("listed-market").asText()))return unavailable("UNKNOWN","US_EQUITY_PRODUCT_NOT_ESTABLISHED",refs,evidence,expires);
            if(root.path("settlement-type").asText().equalsIgnoreCase("Cash")||root.path("settlement-type").asText().equalsIgnoreCase("Cash Settled"))return unavailable("CONFLICTING","SETTLEMENT_CLASSIFICATION_CONFLICT",refs,evidence,expires);
            var qualifiedUnderlying=Fact.known(new Underlying(id.root(),"USD"),refs);
            if(!root.path("option-chain-type").asText().equals("Standard")||!root.path("shares-per-contract").isIntegralNumber()||!root.path("shares-per-contract").bigIntegerValue().equals(java.math.BigInteger.valueOf(100))||!id.root().matches("[A-Z.]+"))
                return new Facts(Fact.unavailable("UNSUPPORTED","NONSTANDARD_DELIVERABLE_NOT_ADMITTED",refs),qualifiedUnderlying,expires,List.copyOf(evidence));
            var terms=new Terms(id.toString(),id.root(),id.expiration(),id.right().equals("C")?"CALL":"PUT",id.strike().toPlainString(),"100","100","0",id.strike().multiply(new BigDecimal("100")).toPlainString(),"USD","STANDARD","PHYSICAL_SINGLE_UNDERLYING");
            return new Facts(Fact.known(terms,refs),qualifiedUnderlying,expires,List.copyOf(evidence));
        }catch(Exception e){return unavailable("UNKNOWN","CONTRACT_DEFINITION_UNINTERPRETABLE",refs,evidence,expires);}
    }
    private static Facts unavailable(String status,String reason,List<String> refs,List<Evidence> evidence,Instant expires) {
        return new Facts(Fact.unavailable(status,reason,refs),Fact.unavailable(status,reason,refs),expires,List.copyOf(evidence));
    }
}
