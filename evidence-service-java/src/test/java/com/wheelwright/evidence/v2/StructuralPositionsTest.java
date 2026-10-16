package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class StructuralPositionsTest {
    @TempDir Path temp;
    final ObjectMapper json=new ObjectMapper();
    static final Instant NOW=Instant.parse("2026-10-14T19:21:15.312Z");
    class Provider extends TastytradeClient {
        final JsonNode captured;int calls;boolean index=false,missing=false,conflicting=false,fail=false;JsonNode shares=null;
        Provider()throws Exception {super("fake-id","fake-secret","fake-refresh",URI.create("http://127.0.0.1:1"),HttpClient.newHttpClient());captured=json.readTree(Files.readString(Path.of("src/test/resources/structural/recorded-xle.json")));}
        @Override public byte[] holdings(String account)throws Exception {
            calls++;var root=json.createObjectNode();var items=root.putObject("data").putArray("items");for(var x:captured.path("holdings"))items.add(x.path("record"));return json.writeValueAsBytes(root);
        }
        @Override public Set<String> contractDefinitions(List<DefinitionSubject> subjects,DefinitionSink sink)throws Exception {
            calls++;if(fail)throw new IllegalStateException("synthetic provider failure");var attempted=new HashSet<String>();
            for(var subject:subjects) {
                attempted.add(subject.holdingId());var option=json.createObjectNode();
                for(var item:captured.path("instruments"))if(item.path("record").path("symbol").asText().equals(subject.symbol()))option.set("data",item.path("record").deepCopy());
                if(shares!=null){if(shares.isMissingNode())((ObjectNode)option.path("data")).remove("shares-per-contract");else ((ObjectNode)option.path("data")).set("shares-per-contract",shares);}
                sink.accept(subject,"OPTION",json.writeValueAsBytes(option));
                var underlying=json.createObjectNode();var equity=underlying.putObject("data");equity.put("symbol","XLE");equity.put("instrument-type","Equity");equity.put("listed-market","ARCX");if(!missing)equity.put("is-index",index);if(conflicting)equity.put("instrument-sub-type","Index");
                sink.accept(subject,"UNDERLYING",json.writeValueAsBytes(underlying));
            }return attempted;
        }
    }
    class Fixture implements AutoCloseable {
        final SqliteEvidenceStore db;final AccountDirectory accounts;final PositionReadService positions;final PositionAssociations associations;final Provider provider;final ContractDefinitionAcquisition definitions;final MockMvc mvc;final String account;String snapshot;
        Fixture()throws Exception {this(false);}
        Fixture(boolean fidelity)throws Exception {
            db=new SqliteEvidenceStore(temp.resolve(UUID.randomUUID()+".sqlite").toString());accounts=new AccountDirectory(db,"");account=fidelity?accounts.bind("pts","FIDELITY","A1"):accounts.bind("tt1","TASTYTRADE","TEST1234");
            positions=new PositionReadService(db,json);associations=new PositionAssociations(db,json);provider=new Provider();var holdings=new PositionAcquisition(db,accounts,positions,provider);definitions=new ContractDefinitionAcquisition(db,json,provider);
            var auth=new BearerAuthenticator(new UserDirectory(db,accounts),"writer=operator:account.positions.read:"+account+"|account.positions.acquire:"+account+"|account.positions.associate:"+account+",reader=reader:account.positions.read:"+account+",other=other:quote.read");
            mvc=MockMvcBuilders.standaloneSetup(new PositionsController(accounts,positions,auth,json,Clock.fixed(NOW,ZoneOffset.UTC)),new PositionAssociationsController(associations,auth,json),new PositionAcquisitionController(holdings,accounts,auth,json,definitions),new ArtifactsController(new BrokerageArtifacts(db,json,positions,accounts),auth,json)).build();
            if(fidelity) {
                var source=PositionsTest.HEADER+"A1,Test,Options,-XLE261016P59,put,1,10,0,Cash\nA1,Test,Options,-XLE261016P59.5,put,-1,-10,0,Cash\nA1,Test,Options,-XLE261016C64.5,call,-1,-10,0,Cash\nA1,Test,Options,-XLE261016C65,call,1,10,0,Cash\n\"Date downloaded Oct-14-2026 at 3:48 p.m ET\"\n";
                var imported=new BrokerageArtifacts(db,json,positions,accounts).ingest(account,"Positions.csv","POSITIONS",source.getBytes(java.nio.charset.StandardCharsets.UTF_8),"fixture");assertThat(imported.status()).isEqualTo("ACCEPTED");snapshot=positions.read(account,"fixture",NOW).orElseThrow().snapshotId();
            }else {
                var r=mvc.perform(post("/v2/position-acquisitions").param("accountId",account).header("Authorization","Bearer writer")).andReturn().getResponse();assertThat(r.getStatus()).isEqualTo(200);snapshot=json.readTree(r.getContentAsString()).path("snapshotId").asText();
            }
        }
        JsonNode acquireTerms()throws Exception {
            var r=mvc.perform(post("/v2/position-acquisitions").param("accountId",account).param("snapshotId",snapshot).param("mode","contract-terms").header("Authorization","Bearer writer")).andReturn().getResponse();assertThat(r.getStatus()).isEqualTo(200);return json.readTree(r.getContentAsString());
        }
        ObjectNode assertion()throws Exception {
            var b=json.createObjectNode();b.put("accountId",account);b.put("snapshotId",snapshot);b.put("submissionId",UUID.randomUUID().toString());b.put("action","ASSERT");b.putNull("supersedesAssociationId");b.put("declaration","THESE_ALLOCATIONS_FORM_ONE_CURRENT_MANAGED_OPTION_POSITION");var a=b.putArray("allocations");
            for(var p:positions.read(account,"inventory",NOW).orElseThrow().positions())for(var h:p.constituents()){var x=a.addObject();x.put("holdingId",h.holding().holdingId());x.put("signedQuantity",h.holding().quantity().toBigIntegerExact().toString());}return b;
        }
        JsonNode structure()throws Exception {
            var r=mvc.perform(get("/v2/positions").param("view","option-structure").header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(r.getStatus()).isEqualTo(200);assertThat(r.getHeader("Cache-Control")).isEqualTo("private, no-store");return json.readTree(r.getContentAsString());
        }
        @Override public void close()throws Exception{db.close();}
    }
    @Test void affirmativeHttpSpecimen()throws Exception {
        try(var f=new Fixture()) {
            assertThat(f.acquireTerms().path("coverage").asText()).isEqualTo("COMPLETE");
            var created=f.mvc.perform(post("/v2/position-associations").contentType("application/json").content(json.writeValueAsBytes(f.assertion())).header("Authorization","Bearer writer")).andReturn().getResponse();assertThat(created.getStatus()).isEqualTo(201);assertThat(created.getHeader("Location")).startsWith("/v2/position-associations/");
            int calls=f.provider.calls;var response=f.structure();var rows=response.path("accounts").get(0).path("structures");assertThat(rows).hasSize(1);var p=rows.get(0);
            assertThat(p.path("membership").path("status").asText()).isEqualTo("ESTABLISHED");assertThat(p.path("strategy").path("value").path("kind").asText()).isEqualTo("IRON_CONDOR");assertThat(p.path("units").path("value").asText()).isEqualTo("1");
            assertThat(p.path("payoff").path("status").asText()).isEqualTo("ESTABLISHED");assertThat(p.path("payoff").path("value").path("knots")).hasSize(5);assertThat(p.path("payoff").path("value").path("knots").get(0).path("terminalValue").path("numerator").asText()).isEqualTo("-50");
            assertThat(p.path("range").path("value").path("lower").asText()).isEqualTo("59.5");assertThat(p.path("identity").path("status").asText()).isEqualTo("UNKNOWN");assertThat(p.path("openingFillAt").path("value").isNull()).isTrue();assertThat(f.provider.calls).isEqualTo(calls);
            Files.createDirectories(Path.of("build"));Files.writeString(Path.of("build/structural-position-specimen.json"),response.toPrettyString());
            assertThat(f.positions.read(f.account,"old",NOW).orElseThrow().positions()).hasSize(4);
        }
    }
    @Test void matchingUnassociatedContractsNeverGroupAndUnsupportedProductNeverGetsPayoff()throws Exception {
        try(var f=new Fixture()) {
            f.acquireTerms();var rows=f.structure().path("accounts").get(0).path("structures");assertThat(rows).hasSize(4);for(var p:rows)assertThat(p.path("membership").path("status").asText()).isEqualTo("UNKNOWN");
            f.provider.index=true;assertThat(f.acquireTerms().path("coverage").asText()).isEqualTo("INCOMPLETE");
            for(var p:f.structure().path("accounts").get(0).path("structures")){assertThat(p.path("payoff").path("value").isNull()).isTrue();assertThat(p.path("constituents").get(0).path("terms").path("status").asText()).isEqualTo("UNSUPPORTED");}
        }
    }

    String databaseContents(SqliteEvidenceStore db)throws Exception {
        var tables=new ArrayList<String>();try(var q=db.getConnection().createStatement();var r=q.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")){while(r.next())tables.add(r.getString(1));}
        var contents=new StringBuilder();for(var table:tables){contents.append(table);try(var q=db.getConnection().createStatement();var r=q.executeQuery("SELECT * FROM \""+table+"\" ORDER BY rowid")){while(r.next()){var row=new ArrayList<Object>();for(int i=1;i<=r.getMetaData().getColumnCount();i++)row.add(r.getObject(i));contents.append(Arrays.deepToString(row.toArray()));}}}return contents.toString();
    }
    int postAssertion(Fixture f,ObjectNode body,String token)throws Exception{return f.mvc.perform(post("/v2/position-associations").contentType("application/json").content(json.writeValueAsBytes(body)).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus();}
    void syntheticSnapshot(Fixture f,int multiplier,boolean duplicate)throws Exception {
        PositionSnapshot previous;try(var c=f.associations.connect(true)){previous=f.associations.snapshot(c,f.account,f.snapshot);}
        var held=new ArrayList<PositionSnapshot.Constituent>();for(var h:previous.holdings())held.add(new PositionSnapshot.Constituent(h.holdingId(),h.contract(),h.description(),h.kind(),h.custody(),h.quantity().multiply(new java.math.BigDecimal(multiplier)),null,null,null,null,h.expiration(),h.sourceRows()));
        if(duplicate){var h=held.getFirst();held.add(new PositionSnapshot.Constituent("holding-"+FidelityPositions.digest("synthetic-equivalent-custody"),h.contract(),h.description(),h.kind(),"SYNTHETIC_SECOND_CUSTODY",h.quantity(),null,null,null,null,h.expiration(),List.of(5)));}
        f.snapshot="synthetic-snapshot-"+UUID.randomUUID();var time=Instant.now().plusSeconds(1).toString();
        f.positions.admit(new PositionSnapshot(f.account,previous.brokerAccount(),"Synthetic quantity specimen",f.snapshot,previous.evidenceDate(),time,"synthetic-quantity.json",FidelityPositions.digest(json.writeValueAsString(held)),null,List.copyOf(held),List.of(),0,previous.observation()));
    }
    @Test void retainedGetIsPureAndAccountIsolationPreservesArtifactConfidentiality()throws Exception {
        try(var f=new Fixture()) {
            var acquisition=f.acquireTerms();assertThat(postAssertion(f,f.assertion(),"writer")).isEqualTo(201);
            String before=databaseContents(f.db);int calls=f.provider.calls;f.structure();assertThat(databaseContents(f.db)).isEqualTo(before);assertThat(f.provider.calls).isEqualTo(calls);
            for(String path:List.of("/v2/positions?accountId="+f.account+"&view=option-structure","/v2/position-acquisitions?accountId="+f.account+"&snapshotId="+f.snapshot+"&mode=contract-terms")) {
                var r=path.contains("acquisitions")?f.mvc.perform(post(path).header("Authorization","Bearer other")):f.mvc.perform(get(path).header("Authorization","Bearer other"));assertThat(r.andReturn().getResponse().getStatus()).isEqualTo(403);
            }
            String artifact=acquisition.path("results").get(0).path("artifactId").asText();assertThat(f.mvc.perform(get("/v2/artifacts/"+artifact+"/content").header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(postAssertion(f,f.assertion(),"reader")).isEqualTo(403);assertThat(databaseContents(f.db)).isEqualTo(before);
        }
    }
    @Test void partialAllocationTwoCondorsAndDuplicateOrOverlappingClaims()throws Exception {
        try(var f=new Fixture()) {
            syntheticSnapshot(f,3,false);f.acquireTerms();var one=f.assertion();for(var a:one.path("allocations"))((ObjectNode)a).put("signedQuantity",a.path("signedQuantity").asText().startsWith("-")?"-2":"2");
            assertThat(postAssertion(f,one,"writer")).isEqualTo(201);var over=one.deepCopy();over.put("submissionId",UUID.randomUUID().toString());String before=databaseContents(f.db);assertThat(postAssertion(f,over,"writer")).isEqualTo(422);assertThat(databaseContents(f.db)).isEqualTo(before);
            var second=f.assertion();for(var a:second.path("allocations"))((ObjectNode)a).put("signedQuantity",a.path("signedQuantity").asText().startsWith("-")?"-1":"1");assertThat(postAssertion(f,second,"writer")).isEqualTo(201);
            var rows=f.structure().path("accounts").get(0).path("structures");assertThat(rows).hasSize(2);var units=new HashSet<String>();for(var row:rows){units.add(row.path("units").path("value").asText());assertThat(row.path("strategy").path("value").path("kind").asText()).isEqualTo("IRON_CONDOR");}assertThat(units).containsExactlyInAnyOrder("1","2");
            var duplicate=f.assertion();((ArrayNode)duplicate.path("allocations")).add(duplicate.path("allocations").get(0).deepCopy());assertThat(postAssertion(f,duplicate,"writer")).isEqualTo(422);
        }
    }
    @Test void equivalentHoldingsWithholdUnitsAndStrategyWithoutLosingQuantities()throws Exception {
        try(var f=new Fixture()) {
            syntheticSnapshot(f,1,true);f.acquireTerms();assertThat(postAssertion(f,f.assertion(),"writer")).isEqualTo(201);var p=f.structure().path("accounts").get(0).path("structures").get(0);
            assertThat(p.path("constituents")).hasSize(5);assertThat(p.path("units").path("status").asText()).isEqualTo("UNKNOWN");assertThat(p.path("strategy").path("value").isNull()).isTrue();assertThat(p.path("payoff").path("status").asText()).isEqualTo("ESTABLISHED");
        }
    }
    @Test void missingConflictingClassificationAndFailedAcquisitionPreserveEvidence()throws Exception {
        try(var f=new Fixture()) {
            f.acquireTerms();var before=f.structure().path("accounts").get(0).path("structures");f.provider.fail=true;assertThat(f.acquireTerms().path("coverage").asText()).isEqualTo("INCOMPLETE");assertThat(f.structure().path("accounts").get(0).path("structures")).isEqualTo(before);
            f.provider.fail=false;f.provider.missing=true;f.acquireTerms();for(var p:f.structure().path("accounts").get(0).path("structures"))assertThat(p.path("payoff").path("value").isNull()).isTrue();
            f.provider.missing=false;f.provider.conflicting=true;f.acquireTerms();for(var p:f.structure().path("accounts").get(0).path("structures"))assertThat(p.path("constituents").get(0).path("terms").path("status").asText()).isEqualTo("CONFLICTING");
        }
    }
    @Test void fidelityActivityImportStructuralReadDoesNotNeedHistoryMaterialization()throws Exception {
        try(var f=new Fixture(true)) {
            var source="Run Date,Action,Symbol,Amount ($)\n10/14/2026,YOU SOLD,-XLE261016C64.5,10.00\n";
            var imported=new BrokerageArtifacts(f.db,json,f.positions,f.accounts).ingest(f.account,"History_for_Account_A1.csv","ACTIVITY",source.getBytes(java.nio.charset.StandardCharsets.UTF_8),"fixture");assertThat(imported.status()).isEqualTo("ACCEPTED");
            String before=databaseContents(f.db);int calls=f.provider.calls;var a=f.structure().path("accounts").get(0);assertThat(a.path("qualifications").toString()).contains("RETAINED_FIDELITY_ACTIVITY_OBSERVATIONS=1");assertThat(databaseContents(f.db)).isEqualTo(before);assertThat(f.provider.calls).isEqualTo(calls);
            try(var q=f.db.getConnection().createStatement();var r=q.executeQuery("SELECT count(*) FROM account_transaction")){assertThat(r.getInt(1)).isZero();}
        }
    }
    @Test void exactRetryAfterNewSnapshotAndImmutableWithdrawal()throws Exception {
        try(var f=new Fixture()) {
            f.acquireTerms();var body=f.assertion();var created=f.mvc.perform(post("/v2/position-associations").contentType("application/json").content(json.writeValueAsBytes(body)).header("Authorization","Bearer writer").header("X-Request-Id"," 11111111-1111-4111-8111-111111111111 ")).andReturn().getResponse();assertThat(created.getStatus()).isEqualTo(201);assertThat(created.getHeader("X-Request-Id")).isEqualTo("11111111-1111-4111-8111-111111111111");
            String id=json.readTree(created.getContentAsString()).path("association").path("associationId").asText();
            var withdrawal=body.deepCopy();withdrawal.put("submissionId",UUID.randomUUID().toString());withdrawal.put("action","WITHDRAW");withdrawal.put("supersedesAssociationId",id);withdrawal.put("declaration","WITHDRAW_CURRENT_MEMBERSHIP_ASSERTION");withdrawal.set("allocations",json.createArrayNode());assertThat(postAssertion(f,withdrawal,"writer")).isEqualTo(201);assertThat(f.structure().path("accounts").get(0).path("structures")).hasSize(4);
            syntheticSnapshot(f,1,false);assertThat(postAssertion(f,body,"writer")).isEqualTo(200);assertThat(f.mvc.perform(get("/v2/position-associations/"+id).header("Authorization","Bearer other")).andReturn().getResponse().getStatus()).isEqualTo(403);
        }
    }
    @Test void overflowDeliverableAndRequiredNullableFieldAreNotAdmitted()throws Exception {
        try(var f=new Fixture()) {
            f.acquireTerms();var body=f.assertion();String untouched=databaseContents(f.db);body.remove("supersedesAssociationId");assertThat(postAssertion(f,body,"writer")).isEqualTo(422);
            for(JsonNode wrong:List.of(json.getNodeFactory().numberNode(3),json.getNodeFactory().textNode("not-a-uuid"))){body.set("supersedesAssociationId",wrong);assertThat(postAssertion(f,body,"writer")).isEqualTo(422);}
            body.putNull("supersedesAssociationId");body.put("unrecognized",true);assertThat(postAssertion(f,body,"writer")).isEqualTo(422);assertThat(databaseContents(f.db)).isEqualTo(untouched);
            for(var bad:List.of(json.getNodeFactory().numberNode(new java.math.BigInteger("4294967396")),json.getNodeFactory().numberNode(-100),json.getNodeFactory().numberNode(new java.math.BigDecimal("100.5")),MissingNode.getInstance(),NullNode.getInstance(),json.getNodeFactory().textNode("100"))){
            f.provider.shares=bad;assertThat(f.acquireTerms().path("coverage").asText()).isEqualTo("INCOMPLETE");
            for(var row:f.structure().path("accounts").get(0).path("structures")){assertThat(row.path("constituents").get(0).path("terms").path("status").asText()).isEqualTo("UNSUPPORTED");assertThat(row.path("payoff").path("value").isNull()).isTrue();}
            }
        }
    }
    @Test void creditVerticalsExposeQualifiedShortStrikeHalfLines()throws Exception {
        try(var f=new Fixture()) {
            f.acquireTerms();for(String right:List.of("P","C")) {
                var body=f.assertion();var subset=json.createArrayNode();for(var allocation:body.path("allocations")) {
                    var h=f.positions.read(f.account,"lookup",NOW).orElseThrow().positions().stream().flatMap(p->p.constituents().stream()).map(x->x.holding()).filter(x->x.holdingId().equals(allocation.path("holdingId").asText())).findFirst().orElseThrow();
                    if(OptionIdentity.of(h).right().equals(right))subset.add(allocation);
                }
                body.set("allocations",subset);assertThat(postAssertion(f,body,"writer")).isEqualTo(201);
            }
            var response=f.structure();Files.writeString(Path.of("build/structural-vertical-specimen.json"),response.toPrettyString());var rows=response.path("accounts").get(0).path("structures");assertThat(rows).hasSize(2);
            for(var row:rows){boolean put=row.path("strategy").path("value").path("kind").asText().equals("PUT_CREDIT_VERTICAL");assertThat(row.path("range").path("value").path("kind").asText()).isEqualTo("SHORT_STRIKE_HALF_LINE");assertThat(row.path("range").path("value").path("boundary").asText()).isEqualTo(put?"59.5":"64.5");assertThat(row.path("range").path("value").path("direction").asText()).isEqualTo(put?"AT_OR_ABOVE":"AT_OR_BELOW");}
        }
    }
    @Test void fractionalFidelityOptionObservationIsPreservedWithoutFinancialConclusions()throws Exception {
        try(var f=new Fixture(true)) {
            var source=PositionsTest.HEADER+"A1,Test,Options,-XLE261016P59,put,0.5,10,0,Cash\nA1,Test,Options,-XLE261016C65,call,1,10,0,Cash\n\"Date downloaded Oct-15-2026 at 3:48 p.m ET\"\n";
            assertThat(new BrokerageArtifacts(f.db,json,f.positions,f.accounts).ingest(f.account,"Positions.csv","POSITIONS",source.getBytes(java.nio.charset.StandardCharsets.UTF_8),"fractional").status()).isEqualTo("ACCEPTED");
            f.snapshot=f.positions.read(f.account,"new",NOW).orElseThrow().snapshotId();f.acquireTerms();
            String second=f.accounts.bind("second","FIDELITY","A2");var secondSource=PositionsTest.HEADER+"A2,Test,Options,-XLE261016C65,call,1,10,0,Cash\n\"Date downloaded Oct-15-2026 at 3:48 p.m ET\"\n";
            new BrokerageArtifacts(f.db,json,f.positions,f.accounts).ingest(second,"Positions.csv","POSITIONS",secondSource.getBytes(java.nio.charset.StandardCharsets.UTF_8),"second");String secondSnapshot=f.positions.read(second,"read",NOW).orElseThrow().snapshotId();f.definitions.acquire(second,secondSnapshot,"test");new UserDirectory(f.db,f.accounts).bootstrap("reader",Set.of("account.positions.read:"+f.account,"account.positions.read:"+second));
            String before=databaseContents(f.db);var response=f.structure();assertThat(databaseContents(f.db)).isEqualTo(before);assertThat(response.path("accounts")).hasSize(2);JsonNode row=null;int knownPayoffs=0;for(var a:response.path("accounts"))for(var x:a.path("structures")){if(x.path("constituents").get(0).path("signedQuantity").isNull())row=x;else if(x.path("payoff").path("status").asText().equals("ESTABLISHED"))knownPayoffs++;}assertThat(knownPayoffs).isEqualTo(2);assertThat(row).isNotNull();var leg=row.path("constituents").get(0);
            assertThat(leg.path("signedQuantity").isNull()).isTrue();assertThat(leg.path("observedHoldingQuantity").asText()).isEqualTo("0.5");assertThat(leg.path("quantityReasons").toString()).contains("NON_WHOLE_OBSERVED_OPTION_QUANTITY");
            for(String fact:List.of("payoff","units","strategy"))assertThat(row.path(fact).path("value").isNull()).isTrue();
            Files.writeString(Path.of("build/structural-fractional-specimen.json"),response.toPrettyString());
        }
    }

}
