package com.wheelwright.evidence.v2.portfolio;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.*;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;import java.time.*;import java.net.*;import java.util.*;import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
class PortfolioObservedMarketTest {
 @TempDir Path directory;
 @Test void sourceIdentityReceiptClockPermissionsAndMissingEvidenceRemainIndependent()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("observed.sqlite3").toString())){
   new AccountDirectory(db.getConnection().getMetaData().getURL());var repo=new PortfolioRepository(db,JSON);
   String uri="/v2/instruments/"+UUID.randomUUID();try(var c=repo.connection()){repo.put(c,new PortfolioRepository.Document(PortfolioRepository.Kind.INSTRUMENT,uri,null,obj().put("id",uri.substring(uri.lastIndexOf("/")+1)).put("kind","EQUITY").put("symbol","ABC").put("currency","USD").set("self",link(uri)),null,null));}
   var receipt="2026-11-02T16:00:00Z";var observation=obj().put("price",9).put("observedAt",receipt);var payload=obj().set("quotes",array().add(obj().put("symbol","ABC").set("observation",observation)));
   var response=new AtomicReference<com.fasterxml.jackson.databind.JsonNode>(payload);var reads=new AtomicInteger();
   var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);server.createContext("/api/evidence/quotes",x->{reads.incrementAndGet();assertThat(x.getRequestMethod()).isEqualTo("GET");assertThat(x.getRequestURI().getQuery()).isEqualTo("symbol=ABC");var bytes=JSON.writeValueAsBytes(response.get());x.getResponseHeaders().add("Content-Type","application/json");x.sendResponseHeaders(200,bytes.length);x.getResponseBody().write(bytes);x.close();});server.start();
   try{
    var source=new PortfolioObservedMarket("http://127.0.0.1:"+server.getAddress().getPort());var caller=new BearerAuthenticator.Principal("reader",Set.of("market.read","reference.read"));var now=Instant.parse("2026-11-02T16:01:00Z");
    java.util.function.Supplier<com.fasterxml.jackson.databind.node.ObjectNode> evaluation=()->{var e=obj();e.set("payoff",obj().set("geometry",obj().set("underlying",link(uri))));return e;};
    var context=new PortfolioReadService.ReadContext();var e=evaluation.get();source.apply(e,repo,caller,now,context);assertThat(e.at("/spot/value").asText()).isEqualTo("9");assertThat(e.at("/spot/asOf").isNull()).isTrue();assertThat(e.at("/spot/receivedAt").asText()).isEqualTo(receipt);assertThat(e.has("grossUnrealizedPl")).isFalse();source.apply(evaluation.get(),repo,caller,now,context);assertThat(reads.get()).isEqualTo(1);
    for(var grants:List.of(Set.of("market.read"),Set.of("reference.read"),Set.<String>of())){var denied=evaluation.get();source.apply(denied,repo,new BearerAuthenticator.Principal("denied",grants),now,new PortfolioReadService.ReadContext());assertThat(denied.has("spot")).isFalse();}assertThat(reads.get()).isEqualTo(1);
    var known=evaluation.get();known.set("spot",metric(new java.math.BigDecimal("10"),"PRICE","USD",now.toString(),"ARITHMETIC_BID_ASK_MIDPOINT","QUALIFIED",array()));source.apply(known,repo,caller,now,new PortfolioReadService.ReadContext());assertThat(known.at("/spot/value").asText()).isEqualTo("10");assertThat(reads.get()).isEqualTo(1);
    for(var bad:List.<com.fasterxml.jackson.databind.JsonNode>of(obj().set("quotes",array()),obj().set("quotes",array().add(obj().put("symbol","OTHER").set("observation",observation))),obj().set("quotes",array().add(obj().put("symbol","ABC").set("observation",obj().put("price",0).put("observedAt",receipt)))),obj().set("quotes",array().add(obj().put("symbol","ABC").set("observation",obj().put("price",9)))),obj().set("quotes",array().add(obj().put("symbol","ABC").set("observation",obj().put("price",9).put("observedAt","2027-01-01T00:00:00Z")))))){
     response.set(bad);var missing=evaluation.get();source.apply(missing,repo,caller,now,new PortfolioReadService.ReadContext());assertThat(missing.has("spot")).isFalse();
    }
    assertThatThrownBy(()->new PortfolioObservedMarket("https://external.example")).isInstanceOf(IllegalArgumentException.class);
   }finally{server.stop(0);}
  }
 }
}
