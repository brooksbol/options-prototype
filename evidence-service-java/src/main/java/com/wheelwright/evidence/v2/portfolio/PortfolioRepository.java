package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.time.Instant;
import java.util.*;

/** Finite foundational-domain persistence. Source bytes/snapshots remain in their existing owners. */
@Component
public final class PortfolioRepository {
    public enum Kind { POSITION,CONSTRUCTION,MODEL,MODEL_VERSION,ORDER,INSTRUMENT,HOLDING,MARKET_OBSERVATION,AUDIT }
    public record Document(Kind kind,String uri,String account,ObjectNode value,String snapshot,String sourceKey) {}
    private final String url;
    private final ObjectMapper mapper;
    @org.springframework.beans.factory.annotation.Autowired
    public PortfolioRepository(SqliteEvidenceStore store,ObjectMapper mapper)throws SQLException { this(store.getConnection().getMetaData().getURL(),mapper); }
    public PortfolioRepository(String url,ObjectMapper mapper){this.url=url;this.mapper=mapper;}
    public Connection connection()throws SQLException{var c=DriverManager.getConnection(url);try(var q=c.createStatement()){q.execute("PRAGMA foreign_keys=ON");q.execute("PRAGMA busy_timeout=5000");}return c;}
    public Optional<Document> get(String uri)throws Exception {
        try(var c=connection()){return get(c,uri);}
    }
    public Optional<Document> get(Connection c,String uri)throws Exception {
        try(var q=c.prepareStatement("SELECT * FROM portfolio_resource WHERE uri=?")) {
            q.setString(1,uri);try(var r=q.executeQuery()){return r.next()?Optional.of(row(r)):Optional.empty();}
        }
    }
    private Document row(ResultSet r)throws Exception {return new Document(Kind.valueOf(r.getString("kind")),r.getString("uri"),r.getString("account_id"),(ObjectNode)mapper.readTree(r.getString("payload_json")),r.getString("source_snapshot"),r.getString("source_key"));}
    public List<Document> list(Kind kind,Set<String> accounts)throws Exception {
        try(var connection=connection()){return list(connection,kind,accounts);}
    }
    public List<Document> list(Connection connection,Kind kind,Set<String> accounts)throws Exception {
        var scope=new TreeSet<>(accounts);
        String predicate=scope.isEmpty()?"account_id IS NULL":"(account_id IS NULL OR account_id IN ("+String.join(",",Collections.nCopies(scope.size(),"?"))+") )";
        try(var q=connection.prepareStatement("SELECT * FROM portfolio_resource WHERE kind=? AND "+predicate+" ORDER BY uri")) {
            q.setString(1,kind.name());int parameter=2;for(String account:scope)q.setString(parameter++,account);var out=new ArrayList<Document>();
            try(var rs=q.executeQuery()){while(rs.next())out.add(row(rs));}
            return List.copyOf(out);
        }
    }
    /** Internal normalized admission; callers must own source interpretation and the transaction. */
    public void put(Connection c,Document d)throws Exception {
        validate(d);
        validateReferences(c,d,d.value());
        if(d.kind()==Kind.CONSTRUCTION){
            String predecessor=d.value().at("/predecessor/href").asText();
            if(!predecessor.isBlank()){
                var previous=get(c,predecessor).orElseThrow(()->new IllegalArgumentException("predecessor must resolve"));
                if(previous.kind()!=Kind.CONSTRUCTION||!Objects.equals(previous.account(),d.account())||!previous.value().path("position").equals(d.value().path("position")))throw new IllegalArgumentException("predecessor scope mismatch");
                var position=get(c,d.value().at("/position/href").asText());
                if(position.isPresent()&&!position.get().value().at("/currentConstruction/href").asText().equals(predecessor))throw new IllegalArgumentException("predecessor must be immediate current instance");
            }
        }
        if(d.kind()==Kind.POSITION){var bound=get(c,d.value().at("/currentConstruction/href").asText()).orElseThrow(()->new IllegalArgumentException("current Construction missing"));if(bound.kind()!=Kind.CONSTRUCTION||!Objects.equals(bound.account(),d.account())||!bound.value().at("/position/href").asText().equals(d.uri()))throw new IllegalArgumentException("current Construction scope mismatch");if(d.value().path("state").asText().equals("CLOSED")&&!PortfolioJson.leaves(bound.value().path("composition")).isEmpty())throw new IllegalArgumentException("closed Position must have empty held composition");}
        var old=get(c,d.uri());
        if(old.isPresent()) {
            var before=old.get();
            if(!Objects.equals(before.account(),d.account())||before.kind()!=d.kind())throw new IllegalArgumentException("resource scope is immutable");
            if(before.value().equals(d.value()))return;
            if(Set.of(Kind.CONSTRUCTION,Kind.MODEL_VERSION,Kind.HOLDING,Kind.AUDIT,Kind.MARKET_OBSERVATION).contains(d.kind()))throw new IllegalArgumentException("immutable resource changed");
            if(d.kind()==Kind.POSITION&&before.value().path("state").asText().equals("CLOSED")&&!d.value().path("state").asText().equals("CLOSED"))throw new IllegalArgumentException("CLOSED is terminal");
        }
        try(var q=c.prepareStatement("INSERT INTO portfolio_resource(uri,kind,account_id,payload_json,source_snapshot,source_key,recorded_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(uri) DO UPDATE SET payload_json=excluded.payload_json,source_snapshot=excluded.source_snapshot,source_key=excluded.source_key,recorded_at=excluded.recorded_at")) {
            q.setString(1,d.uri());q.setString(2,d.kind().name());q.setString(3,d.account());q.setString(4,mapper.writeValueAsString(d.value()));q.setString(5,d.snapshot());q.setString(6,d.sourceKey());q.setString(7,Instant.now().toString());q.executeUpdate();
        }
        if(d.kind()==Kind.POSITION)audit(c,old.orElse(null),d);
    }
    private void audit(Connection c,Document before,Document after)throws Exception {
        String id=UUID.randomUUID().toString(),uri=after.uri()+"/audit/"+id;var n=PortfolioJson.obj().put("id",id).put("recordedAt",Instant.now().toString()).put("kind",before==null||!before.value().path("state").equals(after.value().path("state"))?"STATE_ASSERTION":!before.value().path("currentConstruction").equals(after.value().path("currentConstruction"))?"CONSTRUCTION_REFERENCE_CHANGED":"EVIDENCE_CORRECTION");n.set("self",PortfolioJson.link(uri));n.set("account",after.value().path("account"));n.set("position",after.value().path("self"));if(before==null){n.putNull("beforeState");n.putNull("beforeConstruction");}else{n.set("beforeState",before.value().path("state"));n.set("beforeConstruction",before.value().path("currentConstruction"));}n.set("afterState",after.value().path("state"));n.set("afterConstruction",after.value().path("currentConstruction"));n.set("evidence",after.value().path("stateEvidence").path("evidence"));n.set("warnings",PortfolioJson.array());put(c,new Document(Kind.AUDIT,uri,after.account(),n,after.snapshot(),after.sourceKey()));
    }
    public boolean admitted(Connection c,String account,String snapshot)throws SQLException {
        try(var q=c.prepareStatement("SELECT 1 FROM portfolio_admission WHERE account_id=? AND snapshot_id=?")){q.setString(1,account);q.setString(2,snapshot);try(var r=q.executeQuery()){return r.next();}}
    }
    public void markAdmitted(Connection c,String account,String snapshot)throws SQLException {
        try(var q=c.prepareStatement("INSERT INTO portfolio_admission VALUES (?,?,?)")){q.setString(1,account);q.setString(2,snapshot);q.setString(3,Instant.now().toString());q.executeUpdate();}
    }
    private void validateReferences(Connection c,Document d,JsonNode n)throws Exception {
        if(n.isObject()&&n.path("kind").asText().equals("ACCOUNT_SOURCE")){
            if(d.account()==null||!n.at("/account/href").asText().equals("/v2/accounts/"+d.account()))throw new IllegalArgumentException("source evidence Account scope mismatch");
            String artifact=n.at("/artifact/href").asText();if(!artifact.isBlank()){
                if(!artifact.matches("/v2/artifacts/[0-9a-fA-F-]{36}"))throw new IllegalArgumentException("canonical Artifact evidence required");
                try(var query=c.prepareStatement("SELECT account FROM brokerage_artifact WHERE artifact_id=?")){query.setString(1,artifact.substring("/v2/artifacts/".length()));try(var row=query.executeQuery()){if(!row.next()||!row.getString(1).equals(d.account()))throw new IllegalArgumentException("source Artifact must resolve in Account scope");}}
                try(var query=c.prepareStatement("SELECT 1 FROM brokerage_import WHERE account=? AND artifact_id=? AND file_type='API_ORDERS' LIMIT 1")){query.setString(1,d.account());query.setString(2,artifact.substring("/v2/artifacts/".length()));try(var row=query.executeQuery()){if(row.next()&&!n.path("requiredCapability").asText().equals("account.orders.read:"+d.account()))throw new IllegalArgumentException("Order source capability required");}}
            }
        }
        if(n.isObject()&&n.has("href")){
            String href=n.path("href").asText();
            if(d.account()!=null&&href.startsWith("/v2/accounts/")&&!href.equals("/v2/accounts/"+d.account())&&!href.startsWith("/v2/accounts/"+d.account()+"/"))throw new IllegalArgumentException("cross-Account reference");
            if(href.contains("/models/")&&href.contains("/versions/")){var version=get(c,href);if((version.isEmpty()&&!href.equals(d.uri())&&d.kind()!=Kind.MODEL)||version.isPresent()&&version.get().kind()!=Kind.MODEL_VERSION)throw new IllegalArgumentException("exact Model version must resolve");}
            var target=get(c,href);if(target.isPresent()&&target.get().account()!=null&&!Objects.equals(d.account(),target.get().account()))throw new IllegalArgumentException("private resource scope mismatch");
        }
        for(var child:n)if(child.isContainerNode())validateReferences(c,d,child);
    }
    private void validate(Document d) {
        if(!d.uri().equals(d.value().path("self").path("href").asText())||!d.uri().startsWith("/v2/"))throw new IllegalArgumentException("canonical self required");
        if(Set.of(Kind.POSITION,Kind.CONSTRUCTION,Kind.ORDER,Kind.INSTRUMENT,Kind.HOLDING,Kind.MARKET_OBSERVATION,Kind.AUDIT).contains(d.kind())){
            String id=d.value().path("id").asText();UUID.fromString(id);
            String prefix=switch(d.kind()){case POSITION->"/v2/positions/";case CONSTRUCTION->"/v2/constructions/";case ORDER->"/v2/orders/";case INSTRUMENT->"/v2/instruments/";case HOLDING->"/v2/holdings/";case MARKET_OBSERVATION->"/v2/market-observations/";case AUDIT->d.value().at("/position/href").asText()+"/audit/";default->throw new IllegalStateException();};
            if(!d.uri().equals(prefix+id))throw new IllegalArgumentException("resource kind and GUID must match URI");
        }
        if(d.account()!=null&&!d.value().path("account").path("href").asText().equals("/v2/accounts/"+d.account()))throw new IllegalArgumentException("Account scope mismatch");
        if(d.kind()==Kind.POSITION) {
            UUID.fromString(d.value().path("id").asText());
            if(!Set.of("OPEN","CLOSED","UNRESOLVED").contains(d.value().path("state").asText()))throw new IllegalArgumentException("invalid Position state");
            if(d.value().path("state").asText().equals("CLOSED")&&(!d.value().at("/stateEvidence/status").asText().equals("ESTABLISHED")||!d.value().at("/stateEvidence/completeness").asText().equals("SCOPED_ACCEPTED")))throw new IllegalArgumentException("closure evidence required");
            if(d.value().path("state").asText().equals("CLOSED")){var at=d.value().at("/stateEvidence/establishedAt");if(!at.isTextual()||Instant.parse(at.asText()).isAfter(Instant.now())||d.value().at("/stateEvidence/evidence").isEmpty())throw new IllegalArgumentException("scoped closure time and evidence required");}
        }
        if(d.kind()==Kind.MODEL_VERSION&&!d.uri().matches("/v2/constructions/models/[^/?#]+/versions/(?!latest$)[^/?#]+"))throw new IllegalArgumentException("exact Model version required");
        if(d.kind()==Kind.INSTRUMENT&&containsPrivateEvidence(d.value()))throw new IllegalArgumentException("shared reference contains private provenance");
    }
    private boolean containsPrivateEvidence(JsonNode n){if(n.isObject()&&n.path("kind").asText().equals("ACCOUNT_SOURCE"))return true;for(var x:n)if(containsPrivateEvidence(x))return true;return false;}
}
