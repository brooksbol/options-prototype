package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.sun.net.httpserver.HttpServer;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.net.*;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Real OAuth/GET over loopback only, exact retained pages, atomic normalization and failed-refresh preservation. */
class PortfolioOrderAcquisitionTest {
 @TempDir Path directory;HttpServer server;ObjectMapper mapper=new ObjectMapper();JsonNode orders,groups;AtomicInteger groupReads=new AtomicInteger(),oauth=new AtomicInteger(),reads=new AtomicInteger();volatile int mode;volatile boolean credentials=true;
 final String token="synthetic-access-only",secret="synthetic-secret-only",refresh="synthetic-refresh-only";
 @BeforeEach void start()throws Exception{
  orders=mapper.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json"))).path("orders");
  groups=mapper.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json"))).path("complexOrders");
  server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/oauth/token",x->{oauth.incrementAndGet();var form=new String(x.getRequestBody().readAllBytes(),StandardCharsets.UTF_8);credentials&=x.getRequestMethod().equals("POST")&&form.contains("client_secret="+secret)&&form.contains("refresh_token="+refresh);var bytes=("{\"access_token\":\""+token+"\"}").getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,bytes.length);x.getResponseBody().write(bytes);x.close();});
  server.createContext("/accounts/TEST1234/orders",x->{reads.incrementAndGet();if(mode==4){byte[] unavailable="{\"error\":\"synthetic unavailable\"}".getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(503,unavailable.length);x.getResponseBody().write(unavailable);x.close();return;}credentials&=x.getRequestMethod().equals("GET")&&x.getRequestHeaders().getFirst("Authorization").equals("Bearer "+token);int offset=x.getRequestURI().getRawQuery().endsWith("=1")?1:0;int split=orders.size()/2;var items=mapper.createArrayNode();for(int i=offset==0?0:split;i<(offset==0?split:orders.size());i++)items.add(orders.get(i).deepCopy());var root=mapper.createObjectNode().put("context","/accounts/TEST1234/orders");root.set("data",mapper.createObjectNode().set("items",items));root.set("pagination",mapper.createObjectNode().put("total-pages",2).put("total-items",orders.size()).put("page-offset",offset));if(offset==1&&mode==1)((ObjectNode)items.get(0)).put("account-number","FOREIGN123");if(offset==1&&mode==2)root.put("unsafe",token);var bytes=mapper.writeValueAsBytes(root);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,bytes.length);x.getResponseBody().write(bytes);x.close();});
  server.createContext("/accounts/TEST1234/complex-orders",x->{groupReads.incrementAndGet();credentials&=x.getRequestMethod().equals("GET")&&x.getRequestHeaders().getFirst("Authorization").equals("Bearer "+token);var items=groups.deepCopy();if(mode==3)((ObjectNode)items.get(0).path("orders").get(0)).put("account-number","FOREIGN");var root=mapper.createObjectNode().put("context","/accounts/TEST1234/complex-orders");root.set("data",mapper.createObjectNode().set("items",items));root.set("pagination",mapper.createObjectNode().put("total-pages",1).put("total-items",groups.size()).put("page-offset",0));var bytes=mapper.writeValueAsBytes(root);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,bytes.length);x.getResponseBody().write(bytes);x.close();});server.start();
 }
 @AfterEach void stop(){server.stop(0);}
 TastytradeClient client(){return new TastytradeClient("synthetic-client-only",secret,refresh,URI.create("http://127.0.0.1:"+server.getAddress().getPort()),HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build());}
 @Test void completeScanAndReuseRetainOriginalsWithNoInventedAssociationsOrExposure()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("test.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("source","TASTYTRADE","TEST1234");var repo=new PortfolioRepository(db,mapper);var clock=Clock.fixed(Instant.parse("2026-10-20T18:00:00Z"),ZoneOffset.UTC);var capture=new PortfolioOrderAcquisition(repo,accounts,client(),true,Duration.ofSeconds(300),clock);
   capture.read(Set.of(account));assertThat(credentials).isTrue();assertThat(oauth.get()).isEqualTo(2);assertThat(reads.get()).isEqualTo(2);assertThat(groupReads.get()).isEqualTo(1);assertThat(repo.list(Kind.ORDER,Set.of(account))).hasSize(orders.size()).allSatisfy(o->{assertThat(o.value().path("observationCoverage").asText()).isEqualTo("COMPLETE_SUPPORTED_SCAN");assertThat(o.value().path("associations")).isEmpty();});assertThat(repo.list(Kind.POSITION,Set.of(account))).isEmpty();assertThat(repo.list(Kind.CONSTRUCTION,Set.of(account))).isEmpty();
   capture.read(Set.of(account));assertThat(oauth.get()).isEqualTo(2);new PortfolioOrderAcquisition(repo,accounts,client(),false,Duration.ZERO,clock).read(Set.of(account));assertThat(oauth.get()).isEqualTo(2);
   var original=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),mapper,new PositionReadService(db,mapper));try(var connection=repo.connection();var q=connection.createStatement();var rows=q.executeQuery("SELECT payload FROM brokerage_artifact")){int pages=0;while(rows.next()){byte[] bytes=rows.getBytes(1);assertThat(original.sourceScopes(account,"tastytrade-orders.json",bytes).established()).isTrue();assertThat(new String(bytes,StandardCharsets.UTF_8)).doesNotContain(token,secret,refresh);pages++;}assertThat(pages).isEqualTo(3);}
   var before=repo.list(Kind.ORDER,Set.of(account));mode=1;new PortfolioOrderAcquisition(repo,accounts,client(),true,Duration.ZERO,Clock.offset(clock,Duration.ofSeconds(1))).read(Set.of(account));assertThat(repo.list(Kind.ORDER,Set.of(account))).isEqualTo(before);try(var connection=repo.connection();var q=connection.createStatement();var rows=q.executeQuery("SELECT count(*) FROM brokerage_import WHERE status='REJECTED'")){assertThat(rows.getInt(1)).isEqualTo(2);}assertThat(new PortfolioReadService(repo,new PortfolioSources(repo,mapper,accounts)).sourceWarnings(Set.of(account))).isNotEmpty();
   mode=2;new PortfolioOrderAcquisition(repo,accounts,client(),true,Duration.ZERO,Clock.offset(clock,Duration.ofSeconds(2))).read(Set.of(account));try(var connection=repo.connection();var q=connection.createStatement();var rows=q.executeQuery("SELECT payload FROM brokerage_artifact")){while(rows.next())assertThat(new String(rows.getBytes(1),StandardCharsets.UTF_8)).doesNotContain(token,secret,refresh);}assertThat(repo.list(Kind.ORDER,Set.of(account))).isEqualTo(before);
  }
 }
 @Test void sourceFailureWithoutRetainableOriginalQualifiesSuccessfulReadsAndRespectsGrants()throws Exception{
  mode=4;try(var db=new SqliteEvidenceStore(directory.resolve("unavailable.sqlite3").toString())){var accounts=new AccountDirectory(db,"");String account=accounts.bind("synthetic","TASTYTRADE","TEST1234");var repo=new PortfolioRepository(db,mapper);var service=new PortfolioReadService(repo,new PortfolioSources(repo,mapper,accounts));service.orderAcquisition(new PortfolioOrderAcquisition(repo,accounts,client(),true,Duration.ZERO,Clock.systemUTC()));var auth=TestAuthentication.auth("orders=orders:account.orders.read:"+account+",position=position:account.positions.read:"+account);var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new PortfolioController(service,auth,accounts)).build();var response=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/v2/orders?accountId="+account+"&projection=expanded").header("Authorization","Bearer orders")).andReturn().getResponse();assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);var body=mapper.readTree(response.getContentAsString());assertThat(body.path("items")).isEmpty();assertThat(body.path("warnings").toString()).contains("SOURCE_CONFLICT").doesNotContain(token,secret,refresh,"TEST1234");int before=reads.get();var limited=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/v2/positions?accountId="+account).header("Authorization","Bearer position")).andReturn().getResponse();assertThat(limited.getStatus()).isEqualTo(200);assertThat(limited.getContentAsString()).doesNotContain("SOURCE_CONFLICT");assertThat(reads.get()).isEqualTo(before);assertThat(repo.list(Kind.ORDER,Set.of(account))).isEmpty();}
 }

}
