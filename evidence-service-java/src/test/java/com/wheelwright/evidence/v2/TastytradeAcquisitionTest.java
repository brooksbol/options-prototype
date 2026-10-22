package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class TastytradeAcquisitionTest {
    @TempDir Path temp;
    final ObjectMapper mapper=new ObjectMapper();
    static final String SECRET="fake-client-secret-never-publish",REFRESH="fake-refresh-never-publish",TOKEN="fake-access-never-publish";
    HttpServer server; AtomicInteger oauth=new AtomicInteger(),requests=new AtomicInteger();
    byte[] body; int status=200; boolean credentialsCorrect=true,redirect=false;
    @BeforeEach void start()throws Exception {
        body=Files.readAllBytes(Path.of("src/test/resources/tastytrade/xle-api.json"));
        server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/oauth/token",x->{
            oauth.incrementAndGet();
            var form=new String(x.getRequestBody().readAllBytes(),StandardCharsets.UTF_8);
            credentialsCorrect &= x.getRequestMethod().equals("POST")&&form.contains("client_secret="+SECRET)&&form.contains("refresh_token="+REFRESH);
            var b=("{\"access_token\":\""+TOKEN+"\",\"token_type\":\"Bearer\",\"expires_in\":900}").getBytes(StandardCharsets.UTF_8);
            x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,b.length);x.getResponseBody().write(b);x.close();
        });
        server.createContext("/accounts/TTTEST01/positions",x->{
            requests.incrementAndGet();credentialsCorrect &= ("Bearer "+TOKEN).equals(x.getRequestHeaders().getFirst("Authorization"))&&x.getRequestMethod().equals("GET")&&x.getRequestURI().getQuery()==null;
            x.getResponseHeaders().set("Content-Type","application/json");
            if(redirect)x.getResponseHeaders().set("Location","/must-not-follow");
            x.sendResponseHeaders(redirect?302:status,body.length);x.getResponseBody().write(body);x.close();
        });server.start();
    }
    @AfterEach void stop(){server.stop(0);}
    TastytradeClient client(){return new TastytradeClient("fake-client-id",SECRET,REFRESH,URI.create("http://127.0.0.1:"+server.getAddress().getPort()),HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build());}
    @Test void realOauthRetentionAtomicAdmissionFailureRecoveryRestartAndNoFalseEconomics()throws Exception {
        var file=temp.resolve("evidence.sqlite3").toString();String account,snapshot,artifact;
        try(var store=new SqliteEvidenceStore(file)) {
            var accounts=new AccountDirectory(store,"");account=accounts.bind("tt1","TASTYTRADE","TTTEST01");
            var positions=new PositionReadService(store,mapper);
            var service=new PositionAcquisition(store,accounts,positions,client());
            var result=service.acquire(account,"request");assertThat(result.status()).isEqualTo("ACCEPTED");
            snapshot=result.snapshotId();artifact=result.artifactId();assertThat(credentialsCorrect).isTrue();
            var read=positions.read(account,"request",Instant.parse("2026-10-11T12:00:00Z")).orElseThrow();
            Files.createDirectories(Path.of("build"));Files.writeString(Path.of("build/tastytrade-position-read-specimen.json"),mapper.writeValueAsString(positions.read(account,UUID.randomUUID().toString(),Instant.parse("2026-10-11T12:00:00Z")).orElseThrow()));
            assertThat(read.positions()).hasSize(4);assertThat(read.observation().interpretationVersion()).isEqualTo(TastytradeHoldings.VERSION);
            assertThat(read.positions()).allSatisfy(p->{assertThat(p.constituents()).hasSize(1);assertThat(p.openPl()).isNull();assertThat(p.marketValue()).isNull();assertThat(p.program()).isNull();});
            assertThat(read.positions().stream().map(p->p.constituents().getFirst().holding().quantity().intValue())).containsExactly(1,-1,-1,1);
            assertThat(read.positions().stream().map(p->p.constituents().getFirst().dte())).containsOnly(5L);
            var artifacts=new BrokerageArtifacts(store,mapper,positions,accounts);
            assertThat(artifacts.content(account,artifact).orElseThrow()).isEqualTo(body);
            assertThat(artifacts.sourceScopes(account,"tastytrade-positions.json",body).accountIds()).containsExactly(account);
            assertThat(artifacts.metadata(account,artifact).orElseThrow().contentType()).isEqualTo("application/json");
            // Same content is a new observation, not invented inventory change or duplicate artifacts.
            var repeat=service.acquire(account,"repeat");assertThat(repeat.artifactId()).isEqualTo(artifact);assertThat(repeat.snapshotId()).isNotEqualTo(snapshot);
            assertThat(positions.observations(Set.of(account),"catalog")).hasSize(2);
            assertThat(positions.read(account,snapshot,"historical",Instant.now()).orElseThrow().positions()).isEqualTo(
                positions.read(account,repeat.snapshotId(),"historical",Instant.now()).orElseThrow().positions());
            snapshot=repeat.snapshotId();
            body=new String(body,StandardCharsets.UTF_8).replace("TTTEST01","OTHERACCOUNT").getBytes(StandardCharsets.UTF_8);
            var rejected=service.acquire(account,"mismatch");assertThat(rejected.status()).isEqualTo("REJECTED");
            assertThat(artifacts.content(account,rejected.artifactId())).isPresent();
            assertThat(artifacts.sourceScopes(account,"tastytrade-positions.json",body).established()).isFalse();
            status=500;body=("{\"error\":\""+TOKEN+"\"}").getBytes(StandardCharsets.UTF_8);
            assertThat(service.acquire(account,"failed").status()).isEqualTo("FAILED");
            assertThat(positions.read(account,"read",Instant.now()).orElseThrow().snapshotId()).isEqualTo(snapshot);
            assertThat(positions.observations(Set.of(account),"catalog")).hasSize(2);
            var inventory=mapper.writeValueAsString(artifacts.inventory(account,"read"));
            assertThat(inventory).doesNotContain(SECRET,REFRESH,TOKEN);
            try(var q=store.getConnection().createStatement();var rs=q.executeQuery("SELECT count(*) FROM brokerage_artifact")){assertThat(rs.getInt(1)).isEqualTo(2);}
            // A confirmed complete empty response clears inventory, without claiming a historical close.
            status=200;body="{\"data\":{\"items\":[]}}".getBytes(StandardCharsets.UTF_8);
            var empty=service.acquire(account,"empty");assertThat(empty.status()).isEqualTo("ACCEPTED");
            assertThat(positions.read(account,"read",Instant.now()).orElseThrow().positions()).isEmpty();
            var catalog=positions.observations(Set.of(account),"catalog");
            assertThat(catalog).hasSize(3);
            assertThat(catalog).allSatisfy(s->{assertThat(s.observationContext().broker()).isEqualTo("TASTYTRADE");assertThat(s.observationContext().evidenceDateBasis()).isEqualTo("BACKEND_RECEIPT_UTC_DATE");assertThat(s.evidenceDate()).isEqualTo(s.observation().receivedAt().substring(0,10));assertThat(s.recordedAt()).isEqualTo(s.observation().receivedAt());});
            assertThat(catalog).filteredOn(s->s.snapshotId().equals(empty.snapshotId())).singleElement().satisfies(s->assertThat(s.holdingCount()).isZero());
            assertThat(positions.read(account,snapshot,"historical-after-empty",Instant.now()).orElseThrow().positions()).hasSize(4);
            assertThat(artifacts.sourceScopes(account,"tastytrade-positions.json",body).established()).isTrue();
        }
        try(var store=new SqliteEvidenceStore(file)){assertThat(new PositionReadService(store,mapper).read(account,"restart",Instant.now()).orElseThrow().positions()).isEmpty();}
    }
    @Test void csvAndApiFixturesAgreeOnlyOnObservedInventoryAndZeroRowsAreNotLifecycleFacts()throws Exception {
        var csv=FidelityPositions.csv(Files.readString(Path.of("src/test/resources/tastytrade/xle-2026-10-11.csv")));
        var expected=new TreeMap<String,String>();
        for(var row:csv)if(row.size()>8&&row.get(1).startsWith("XLE")){expected.put(row.get(1),row.get(3));assertThat(row.get(8)).isEqualTo("65.07");}
        try(var store=new SqliteEvidenceStore(temp.resolve("fixture.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");
            var observation=new PositionSnapshot.Observation("TASTYTRADE","PRODUCTION",UUID.randomUUID().toString(),"2026-10-11T12:00:00Z","2026-10-11T12:00:01Z",TastytradeHoldings.VERSION,"REQUESTED_ACCOUNT_FULL_HOLDINGS");
            var snapshot=TastytradeHoldings.parse(body,accounts.get(id).orElseThrow(),id,"artifact","a".repeat(64),observation);
            var actual=new TreeMap<String,String>();for(var h:snapshot.holdings())actual.put(h.contract(),h.quantity().toPlainString());assertThat(actual).isEqualTo(expected);
            body=new String(body,StandardCharsets.UTF_8).replace("\"quantity\": \"1\"","\"quantity\": \"0\"").getBytes(StandardCharsets.UTF_8);
            var zero=TastytradeHoldings.parse(body,accounts.get(id).orElseThrow(),id,"artifact","a".repeat(64),observation);
            assertThat(zero.holdings()).isEmpty();assertThat(zero.excludedNonPositionRows()).isEqualTo(4);
        }
    }
    @Test void snapshotAndAcceptedOutcomeRollbackTogetherOnStorageFailure()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("atomic.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var positions=new PositionReadService(store,mapper);
            var service=new PositionAcquisition(store,accounts,positions,client());var first=service.acquire(id,"first");
            try(var q=store.getConnection().createStatement()){q.execute("CREATE TRIGGER refuse_outcome BEFORE INSERT ON brokerage_position_acquisition BEGIN SELECT RAISE(ABORT,'test storage failure'); END");}
            body=new String(body,StandardCharsets.UTF_8).replace("\"quantity\": \"1\"","\"quantity\": \"2\"").getBytes(StandardCharsets.UTF_8);
            assertThatThrownBy(()->service.acquire(id,"blocked")).isInstanceOf(java.sql.SQLException.class);
            assertThat(positions.read(id,"read",Instant.now()).orElseThrow().snapshotId()).isEqualTo(first.snapshotId());
            try(var q=store.getConnection().createStatement();var rs=q.executeQuery("SELECT count(*) FROM account_position_snapshot")){assertThat(rs.getInt(1)).isEqualTo(1);}
            try(var q=store.getConnection().createStatement();var rs=q.executeQuery("SELECT count(*) FROM brokerage_artifact")){assertThat(rs.getInt(1)).isEqualTo(2);}
        }
    }
    @Test void strictParserRejectsAmbiguityAndPartialResultsAtomically()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("invalid.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var positions=new PositionReadService(store,mapper);
            var service=new PositionAcquisition(store,accounts,positions,client());
            var good=service.acquire(id,"good");String original=new String(body,StandardCharsets.UTF_8);
            var invalid=new ArrayList<String>();
            invalid.add(original.replaceFirst("\\\"quantity\\\": \\\"1\\\"","\"quantity\":\"1.5\""));
            invalid.add(original.replace("Equity Option","Future Option"));invalid.add(original.replace("261016P00059000","261032P00059000"));
            invalid.add(original.replace("2026-10-16T20:00:00Z","2026-10-17T20:00:00Z"));
            var tree=mapper.readTree(original);((com.fasterxml.jackson.databind.node.ArrayNode)tree.path("data").path("items")).add(tree.path("data").path("items").get(0));invalid.add(tree.toString());
            invalid.add(original.substring(0,original.lastIndexOf('}'))+",\"pagination\":{\"page-offset\":0,\"total-pages\":2}}");
            invalid.add("{\"data\":{},\"data\":{\"items\":[]}}");
            for(String s:invalid) {
                body=s.getBytes(StandardCharsets.UTF_8);assertThat(service.acquire(id,"invalid").status()).isIn("REJECTED","FAILED");
                assertThat(positions.read(id,"read",Instant.now()).orElseThrow().snapshotId()).isEqualTo(good.snapshotId());
            }
            body=("{\"data\":{\"items\":[]},\"access_token\":\"hidden\"}").getBytes(StandardCharsets.UTF_8);
            assertThat(service.acquire(id,"secret").status()).isEqualTo("FAILED");
            redirect=true;assertThat(service.acquire(id,"redirect").status()).isEqualTo("FAILED");
        }
    }
    @Test void modelAReadWriteQuoteAndOtherAccountDoNotImplyAcquisitionAndReadNeverAcquires()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("auth.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var other=accounts.bind("other","TASTYTRADE","TTTEST02");
            var users=new UserDirectory(store,accounts);
            var auth=new BearerAuthenticator(users,"reader=reader:account.read:"+id+"|account.positions.read:"+id+"|account.artifacts.write:"+id+"|quote.acquire,other=other:account.positions.acquire:"+other+",acquirer=acquirer:account.positions.acquire:"+id);
            var positions=new PositionReadService(store,mapper);var service=new PositionAcquisition(store,accounts,positions,client());
            var mvc=MockMvcBuilders.standaloneSetup(new PositionAcquisitionController(service,accounts,auth,mapper),new PositionsController(accounts,positions,auth,mapper),new ArtifactsController(new BrokerageArtifacts(store,mapper,positions,accounts),auth,mapper)).build();
            String path="/v2/position-acquisitions?accountId="+id;
            assertThat(mvc.perform(post(path)).andReturn().getResponse().getStatus()).isEqualTo(401);
            for(String token:List.of("reader","other"))assertThat(mvc.perform(post(path).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/positions").param("accountId",id).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(404);
            assertThat(oauth.get()).isZero();assertThat(requests.get()).isZero();
            assertThat(mvc.perform(post(path).header("Authorization","Bearer acquirer").content("{}")).andReturn().getResponse().getStatus()).isEqualTo(422);
            var response=mvc.perform(post(path).header("Authorization","Bearer acquirer")).andReturn().getResponse();
            assertThat(response.getStatus()).isEqualTo(200);assertThat(response.getContentAsString()).doesNotContain(SECRET,REFRESH,TOKEN);
            assertThat(mvc.perform(get("/v2/positions").param("accountId",id).header("Authorization","Bearer acquirer")).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/positions").param("accountId",id).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(200);
            String selected=mapper.readTree(response.getContentAsString()).path("snapshotId").asText();
            for(String query:List.of("&view=observations","&snapshotId="+selected))assertThat(mvc.perform(get("/v2/positions?accountId="+id+query).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(200);
            assertThat(requests.get()).isEqualTo(1);assertThat(oauth.get()).isEqualTo(2); // Separate read-only settled-cash attempt (404 in this fixture).
            String artifact=mapper.readTree(response.getContentAsString()).path("artifactId").asText();
            assertThat(mvc.perform(get("/v2/artifacts/"+artifact+"/content").header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(403);
            users.bootstrap("reader",Set.of("account.artifacts.read:"+id));
            var content=mvc.perform(get("/v2/artifacts/"+artifact+"/content").header("Authorization","Bearer reader")).andReturn().getResponse();
            assertThat(content.getStatus()).isEqualTo(200);assertThat(content.getContentType()).isEqualTo("application/json");assertThat(content.getContentAsByteArray()).isEqualTo(body);
            users.bootstrap("acquirer",Set.of());
            assertThat(mvc.perform(post(path).header("Authorization","Bearer acquirer")).andReturn().getResponse().getStatus()).isEqualTo(403);
        }
    }
}
