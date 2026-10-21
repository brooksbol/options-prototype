package com.wheelwright.evidence.v2;

import com.sun.net.httpserver.HttpServer;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.net.*;
import java.net.http.HttpClient;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Actual source-normalizer/service/HTTP/grant integration, loopback provider only. */
class PortfolioMarketReadThroughTest {
 @TempDir Path directory;
 @Test void authorizedCollectionReusesOneTypedRequestAndFailedRefreshPreservesPriorFacts()throws Exception{
  var fixture=JSON.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json")));var holding=fixture.path("holdings").get(0);String symbol=holding.path("symbol").asText();var quoteItems=array();for(var q:fixture.path("quotes"))if(q.path("symbol").asText().equals(symbol))quoteItems.add(q);for(var q:fixture.path("spotQuotes"))if(q.path("symbol").asText().equals("XLF"))quoteItems.add(q);assertThat(quoteItems).hasSize(2);var response=obj();response.set("data",obj().set("items",quoteItems));byte[] responseBytes=JSON.writeValueAsBytes(response);
  var calls=new AtomicInteger();var fail=new AtomicBoolean();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/oauth/token",x->{byte[] b="{\"access_token\":\"synthetic-access\"}".getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(200,b.length);x.getResponseBody().write(b);x.close();});
  server.createContext("/market-data/by-type",x->{calls.incrementAndGet();x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(fail.get()?503:200,responseBytes.length);x.getResponseBody().write(responseBytes);x.close();});server.start();
  try(var db=new SqliteEvidenceStore(directory.resolve("runtime.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("tt","TASTYTRADE","TEST1234");var repo=new PortfolioRepository(db,JSON);String artifact=UUID.randomUUID().toString();var root=obj();root.set("data",obj().set("items",array().add(holding)));byte[] original=JSON.writeValueAsBytes(root);String at="2026-10-14T19:21:00Z";
   try(var c=repo.connection();var q=c.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,artifact);q.setString(3,BrokerageArtifacts.sha(original));q.setString(4,"application/json");q.setInt(5,original.length);q.setBytes(6,original);q.setString(7,at);q.executeUpdate();}
   var snapshot=TastytradeHoldings.parse(original,accounts.get(account).orElseThrow(),account,artifact,BrokerageArtifacts.sha(original),new PositionSnapshot.Observation("TASTYTRADE","PRODUCTION",UUID.randomUUID().toString(),at,at,"synthetic-admission-test","ACCOUNT_POSITIONS"));new PositionReadService(db,JSON).admit(snapshot);
   var sources=new PortfolioSources(repo,JSON,accounts);var reads=new PortfolioReadService(repo,sources);var client=new TastytradeClient("synthetic-client","synthetic-secret","synthetic-refresh",URI.create("http://127.0.0.1:"+server.getAddress().getPort()),HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build());var clock=Clock.fixed(Instant.parse(at),ZoneOffset.UTC);var acquisition=new PortfolioMarketAcquisition(repo,accounts,client,true,Duration.ofSeconds(30),clock);reads.marketAcquisition(acquisition);
   var auth=TestAuthentication.auth("owner=user:account.positions.read:"+account+"|account.market.read:"+account+"|market.read|reference.read,restricted=restricted:account.positions.read:"+account+",source=source-user:account.artifacts.read:"+account);var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(db,JSON));var mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(reads,auth,accounts),new ArtifactsController(artifacts,auth,JSON)).build();
   var restricted=mvc.perform(get("/v2/positions?projection=expanded").header("Authorization","Bearer restricted")).andReturn().getResponse();assertThat(restricted.getStatus()).isEqualTo(200);assertThat(calls).hasValue(0);
   var admitted=mvc.perform(get("/v2/positions?projection=expanded").header("Authorization","Bearer owner")).andReturn().getResponse();assertThat(admitted.getStatus()).isEqualTo(200);assertThat(calls).hasValue(1);var body=JSON.readTree(admitted.getContentAsString());assertThat(body.path("items")).hasSize(1);assertThat(body.at("/items/0/evaluation/marketValue/value").isTextual()).isTrue();assertThat(repo.list(Kind.MARKET_OBSERVATION,Set.of(account))).hasSize(2);
   reads.marketAcquisition(new PortfolioMarketAcquisition(repo,accounts,client,true,Duration.ZERO,clock));String observationUri=repo.list(Kind.MARKET_OBSERVATION,Set.of(account)).getFirst().uri();assertThat(mvc.perform(get(observationUri).header("Authorization","Bearer owner")).andReturn().getResponse().getStatus()).isEqualTo(200);assertThat(mvc.perform(get("/v2/positions/"+UUID.randomUUID()).header("Authorization","Bearer owner")).andReturn().getResponse().getStatus()).isEqualTo(404);assertThat(calls).hasValue(1);reads.marketAcquisition(acquisition);
   String marketArtifact=repo.list(Kind.MARKET_OBSERVATION,Set.of(account)).getFirst().value().at("/evidence/0/artifact/href").asText();var originalRead=mvc.perform(get(marketArtifact+"/content").header("Authorization","Bearer source")).andReturn().getResponse();assertThat(originalRead.getStatus()).isEqualTo(200);assertThat(originalRead.getContentAsByteArray()).isEqualTo(responseBytes);assertThat(mvc.perform(get(marketArtifact+"/content").header("Authorization","Bearer restricted")).andReturn().getResponse().getStatus()).isEqualTo(403);
   var forged=response.deepCopy().put("context","/market-data/by-type");byte[] forgedBytes=JSON.writeValueAsBytes(forged);assertThat(artifacts.sourceScopes(account,"forged.json",forgedBytes).established()).isFalse();assertThatThrownBy(()->artifacts.ingest(account,"forged.json","API_MARKET_DATA",forgedBytes,UUID.randomUUID().toString())).isInstanceOf(IllegalArgumentException.class);assertThat(artifacts.sourceScopes(account,"forged.json",forgedBytes).established()).isFalse();
   mvc.perform(get("/v2/positions?projection=summary").header("Authorization","Bearer owner")).andReturn();assertThat(calls).hasValue(1);var before=repo.list(Kind.MARKET_OBSERVATION,Set.of(account));fail.set(true);reads.marketAcquisition(new PortfolioMarketAcquisition(repo,accounts,client,true,Duration.ZERO,Clock.offset(clock,Duration.ofSeconds(1))));var failed=mvc.perform(get("/v2/positions?projection=expanded").header("Authorization","Bearer owner")).andReturn().getResponse();assertThat(failed.getStatus()).isEqualTo(200);assertThat(JSON.readTree(failed.getContentAsString()).path("warnings").toString()).contains("MARKET_OBSERVATION_MISSING");assertThat(repo.list(Kind.MARKET_OBSERVATION,Set.of(account))).isEqualTo(before);
   var privateRead=mvc.perform(get("/v2/positions?projection=expanded").header("Authorization","Bearer restricted")).andReturn().getResponse();assertThat(JSON.readTree(privateRead.getContentAsString()).at("/items/0/evaluation/marketValue/status").asText()).isEqualTo("REDACTED");assertThat(calls).hasValue(2);
  }finally{server.stop(0);}
 }
}
