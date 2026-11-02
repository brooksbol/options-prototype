package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.*;
import com.wheelwright.evidence.v2.portfolio.*;
import com.sun.net.httpserver.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.net.*;import java.net.http.*;import java.time.*;import java.util.*;import java.util.concurrent.atomic.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Raw loopback providers -> existing acquirers/admission -> public controllers. No finished DTO injection. */
public class ArchitecturalRecoveryFitnessTest {
 @TempDir Path directory; static String quoteResult;
 public static final class Rig implements AutoCloseable {
  public final SqliteEvidenceStore db;final PortfolioRepository repo;final PortfolioTacticalInventory inventory;final MockMvc api;
  final HttpServer provider,market,account;final AtomicInteger quotes=new AtomicInteger(),balances=new AtomicInteger(),securities=new AtomicInteger();
  double bid=11,ask=13;boolean fail=false;String event=Instant.now().minusSeconds(10).truncatedTo(java.time.temporal.ChronoUnit.MILLIS).toString(),balanceEvent=Instant.now().minusSeconds(10).toString(),type="etf";final String fid,tt;
  public Rig(Path directory)throws Exception{
   db=new SqliteEvidenceStore(directory.resolve("fitness-"+UUID.randomUUID()+".sqlite3").toString());var accounts=new AccountDirectory(db,"");fid=accounts.bind("pine","FIDELITY","A1");tt=accounts.bind("orchard","TASTYTRADE","T1");
   var artifacts=new BrokerageArtifacts(db,JSON,new PositionReadService(db,JSON),accounts);
   String csv="Account number,Account name,Investment type,Symbol,Description,Quantity,Current value,Total gain/loss dollar,Type,Cost basis total,Average cost basis,Last price\nA1,Pine,ETFs,ABC,ABC shares,100,800,-100,Cash,900,9,8\nA1,Pine,Options,-ABC261120C10,Call,-1,-20,0,Cash,20,0.2,0.2\nDate downloaded Oct-27-2026 at 12:15 p.m. ET\n";
   assertThat(artifacts.ingest(fid,"source.csv","POSITIONS",csv.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
   AccountBalancesTest.retain(db,tt,AccountBalancesTest.source("T1"),"API_BALANCES","tastytrade-balances.json");
   provider=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
   provider.createContext("/",x->{String path=x.getRequestURI().getPath(),body="{}";int status=200;
    if(path.equals("/v1/markets/quotes")){quotes.incrementAndGet();body="{\"quotes\":{\"quote\":{\"symbol\":\"ABC\",\"type\":\""+type+"\",\"bid\":"+bid+",\"ask\":"+ask+",\"bid_date\":"+Instant.parse(event).toEpochMilli()+",\"ask_date\":"+Instant.parse(event).toEpochMilli()+"}}}";if(fail)status=503;}
    else if(path.equals("/oauth/token"))body="{\"access_token\":\"synthetic\"}";
    else if(path.equals("/accounts/T1/balances")){balances.incrementAndGet();body=AccountBalancesTest.source("T1").replace("1000.01","2994.17").replace("2026-10-26T13:20:00Z",balanceEvent);if(fail)status=503;}
    else if(path.equals("/accounts/T1/positions")){securities.incrementAndGet();status=503;}
    else if(path.equals("/instruments/equity-options"))body="{\"data\":{\"items\":[{\"symbol\":\"ABC   261120C00010000\",\"root-symbol\":\"ABC\",\"underlying-symbol\":\"ABC\",\"instrument-type\":\"Equity Option\",\"exercise-style\":\"American\",\"strike-price\":\"10\",\"option-type\":\"C\",\"expiration-date\":\"2026-11-20\",\"option-chain-type\":\"Standard\",\"shares-per-contract\":100,\"currency\":\"USD\"}]}}";
    else if(path.equals("/option-chains/ABC/compact"))body="{\"data\":{\"items\":[{\"underlying-symbol\":\"ABC\",\"option-chain-type\":\"Standard\",\"shares-per-contract\":100,\"symbols\":[\"ABC   261120C00010000\"],\"deliverables\":[{\"deliverable-type\":\"Shares\",\"instrument-type\":\"Equity\",\"symbol\":\"ABC\",\"amount\":100}]}]}}";
    else status=404;send(x,status,body);
   });provider.start();String upstream="http://127.0.0.1:"+provider.getAddress().getPort();
   var client=new TastytradeClient("synthetic","synthetic","synthetic",URI.create(upstream),HttpClient.newHttpClient());
   String grants="quote.acquire|quote.read|market.read|reference.read|account.read:"+fid+"|account.positions.read:"+fid+"|account.holdings.read:"+fid+"|account.artifacts.read:"+fid+"|account.read:"+tt+"|account.artifacts.read:"+tt+"|account.positions.acquire:"+tt;
   var auth=TestAuthentication.auth("owner=user:"+grants+",denied=restricted:account.read:"+fid+"|account.positions.read:"+fid+"|account.holdings.read:"+fid+"|reference.read|market.read,reader=reader:account.read:"+tt+"|account.artifacts.read:"+tt);
   var cache=new com.wheelwright.evidence.provider.ResponseCache();var pacer=new RequestPacer(119,1);var adapter=new TradierAdapter("synthetic",upstream+"/v1",cache,pacer);var manager=new ProviderAuthorityManager(new ProviderAuthority("prod","production",adapter,cache,pacer),null);manager.markSingleAuthorityActiveForLegacy();var policy=new QuoteAcquisitionPolicy(60,true,true);
   var direct=new DirectQuoteService(new TradierDirectQuoteSource(manager,policy),manager,db,policy);var quoteMvc=MockMvcBuilders.standaloneSetup(new V2QuotesController(direct,auth)).build();
   market=serve(quoteMvc);
   repo=new PortfolioRepository(db,JSON);var sources=new PortfolioSources(repo,JSON,accounts);var reader=new PortfolioReadService(repo,sources);reader.fidelityReferences(new PortfolioFidelityReferences(repo,accounts,client,true,Clock.systemUTC()));
   inventory=new PortfolioTacticalInventory(repo,reader,accounts);inventory.publicMarket(new PortfolioPublicMarket("http://127.0.0.1:"+market.getAddress().getPort()));
   var balance=new AccountBalanceObservations(db,artifacts,accounts);balance.acquisition(new PositionAcquisition(db,accounts,new PositionReadService(db,JSON),client));
   var positions=new PortfolioController(reader,auth,accounts);positions.inventoryView(new TacticalInventoryController(inventory,auth,accounts));api=MockMvcBuilders.standaloneSetup(new AccountsController(accounts,auth,JSON),positions,new AccountBalancesController(accounts,balance,auth,JSON)).build();account=serve(api);
  }
  public String base(){return "http://127.0.0.1:"+account.getAddress().getPort();}
  com.fasterxml.jackson.databind.JsonNode positions(String token)throws Exception{return JSON.readTree(api.perform(get("/v2/positions?view=inventory&accountId="+fid+"&underlying=ABC").header("Authorization","Bearer "+token)).andReturn().getResponse().getContentAsString());}
  com.fasterxml.jackson.databind.JsonNode balance(String token,String extra)throws Exception{return JSON.readTree(api.perform(get("/v2/account-balance-observations?selection=latest-source&accountId="+tt+extra).header("Authorization","Bearer "+token)).andReturn().getResponse().getContentAsString());}
  public void close(){account.stop(0);market.stop(0);provider.stop(0);try{db.close();}catch(Exception e){throw new IllegalStateException(e);}}
 }
 static HttpServer serve(MockMvc mvc)throws Exception{var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);server.createContext("/",x->{try{var request=request(org.springframework.http.HttpMethod.valueOf(x.getRequestMethod()),x.getRequestURI());x.getRequestHeaders().forEach((k,v)->request.header(k,v.toArray()));request.content(x.getRequestBody().readAllBytes());var result=mvc.perform(request).andReturn().getResponse();for(String header:result.getHeaderNames())if(!header.equalsIgnoreCase("Content-Length"))x.getResponseHeaders().put(header,new java.util.ArrayList<>(result.getHeaders(header)));if(x.getRequestMethod().equals("POST"))quoteResult=result.getContentAsString();send(x,result.getStatus(),result.getContentAsString());}catch(Exception e){send(x,500,"{}");}});server.start();return server;}
 static void send(HttpExchange x,int status,String body)throws java.io.IOException{byte[] bytes=body.getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json");x.sendResponseHeaders(status,bytes.length);try(var out=x.getResponseBody()){out.write(bytes);}}
 @Test void olderNonNullFidelitySpotIsReplacedThroughGlobalAcquisitionWithoutRenewingCustody()throws Exception{try(var r=new Rig(directory)){var result=r.positions("owner");assertThat(r.quotes.get()).isEqualTo(1);assertThat(quoteResult).contains("NEWLY_ACQUIRED");assertThat(result.at("/accounts/0/source/observationDate").asText()).isEqualTo("2026-10-27");var e=result.at("/accounts/0/items/0/evaluation");assertThat(e.at("/spot/value").asText()).as(result.toString()).isEqualTo("12");assertThat(e.at("/spot/asOf").asText()).isEqualTo(Instant.parse(r.event).toString());assertThat(e.at("/payoff/geometry/spotPoint/price").asText()).isEqualTo("12");assertThat(e.has("grossUnrealizedPl")).isFalse();r.positions("owner");assertThat(r.quotes.get()).isEqualTo(1);}}
 @Test void quoteDenialAndProviderFailureCannotInventCurrentSpot()throws Exception{try(var r=new Rig(directory)){var denied=r.positions("denied");assertThat(r.quotes.get()).isZero();assertThat(denied.at("/accounts/0/items/0/evaluation/spot/value").asText()).isNotEqualTo("12");r.fail=true;var failed=r.positions("owner");assertThat(failed.at("/accounts/0/items/0/evaluation/spot/value").asText()).isNotEqualTo("12");}}
 @Test void newlyReceivedOldMarketEventDoesNotReplaceNewerSourceDay()throws Exception{try(var r=new Rig(directory)){r.event="2026-10-19T15:00:00Z";var result=r.positions("owner");assertThat(result.at("/accounts/0/items/0/evaluation/spot/value").asText()).isEqualTo("8");}}
 @Test void operationalBalanceAcquiresAndReusesWithoutSecuritiesRefresh()throws Exception{try(var r=new Rig(directory)){var result=r.balance("owner","");assertThat(r.balances.get()).isEqualTo(1);assertThat(r.securities.get()).isZero();assertThat(result.path("acquisition").path("status").asText()).isEqualTo("ACQUIRED");assertThat(result.at("/observations/0/source/observedAt").asText()).isEqualTo(r.balanceEvent);assertThat(result.at("/observations/0/fields").toString()).contains("2994.17");r.balance("owner","");assertThat(r.balances.get()).isEqualTo(1);}}
 @Test void retainedOrDeniedBalanceReadsDoNotAcquireAndFailurePreservesSuccess()throws Exception{try(var r=new Rig(directory)){r.balance("reader","");r.balance("owner","&sourceAtOrAfter=2026-01-01T00:00:00Z");assertThat(r.balances.get()).isZero();r.fail=true;var failed=r.balance("owner","");assertThat(failed.at("/acquisition/status").asText()).isEqualTo("FAILED");assertThat(failed.path("observations")).hasSize(1);assertThat(failed.at("/observations/0/source/observedAt").asText()).isEqualTo("2026-10-26T13:20:00Z");}}
 @Test void wrongSecurityTypeAndCrossedQuoteCannotBindToEquity()throws Exception{for(boolean crossed:List.of(false,true))try(var r=new Rig(directory)){if(crossed)r.ask=10;else r.type="index";var result=r.positions("owner");assertThat(result.at("/accounts/0/items/0/evaluation/spot/value").asText()).isEqualTo("8");}}
 @Test void acquiredOldBalanceEventDoesNotBecomeNewMarketTime()throws Exception{try(var r=new Rig(directory)){r.balanceEvent="2026-10-19T15:00:00Z";var result=r.balance("owner","");assertThat(r.balances.get()).isEqualTo(1);assertThat(result.path("currentness").asText()).isEqualTo("NOT_ESTABLISHED");assertThat(result.at("/observations/0/source/observedAt").asText()).isEqualTo("2026-10-26T13:20:00Z");}}
 static String sourceBase;
 @org.springframework.boot.test.context.TestConfiguration static class ProviderBoundary {
  @org.springframework.context.annotation.Bean @org.springframework.context.annotation.Primary TastytradeClient controlledProvider(){return new TastytradeClient("synthetic","synthetic","synthetic",URI.create(sourceBase),HttpClient.newHttpClient());}
 }
 @Test void productionBootstrapWiresAndExecutesBothCapabilities()throws Exception{try(var r=new Rig(directory)){
  r.positions("owner");sourceBase="http://127.0.0.1:"+r.provider.getAddress().getPort();
  assertThat(((org.sqlite.SQLiteConnection)r.db.getConnection()).getDatabase().backup("main",directory.resolve("production.sqlite3").toString(),null)).isZero();
  var app=new org.springframework.boot.SpringApplication(com.wheelwright.evidence.EvidenceServiceApplication.class,ProviderBoundary.class);
  String grants="quote.acquire|market.read|reference.read|account.read:"+r.fid+"|account.positions.read:"+r.fid+"|account.holdings.read:"+r.fid+"|account.artifacts.read:"+r.fid+"|account.read:"+r.tt+"|account.artifacts.read:"+r.tt+"|account.positions.acquire:"+r.tt;
  try(var context=(org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext)app.run("--spring.config.location=optional:file:"+directory.resolve("absent.properties"),"--server.address=127.0.0.1","--server.port=0","--evidence.db.path="+directory.resolve("production.sqlite3"),"--universe.seed.path=","--universe.disposition.path=","--tradier.api-key=synthetic","--tradier.base-url="+sourceBase+"/v1","--tradier.sandbox.api-key=","--wheelwright.tastytrade.client-id=","--wheelwright.tastytrade.client-secret=","--wheelwright.tastytrade.refresh-token=","--wheelwright.portfolio.public-market.base-url=http://127.0.0.1:"+r.market.getAddress().getPort(),"--wheelwright.portfolio.market.reuse-seconds=77","--wheelwright.portfolio.orders.read-through-enabled=false","--wheelwright.portfolio.market.read-through-enabled=false","--wheelwright.history.read-through-enabled=false","--wheelwright.v2.auth.tokens=owner=user:"+grants,"--spring.main.banner-mode=off","--logging.level.root=ERROR")){
   // Production component scanning and actual setter injection, not manually populated collaborators.
   assertThat(org.springframework.test.util.ReflectionTestUtils.getField(context.getBean(PortfolioTacticalInventory.class),"publicMarket")).isSameAs(context.getBean(PortfolioPublicMarket.class));
   assertThat(org.springframework.test.util.ReflectionTestUtils.getField(context.getBean(AccountBalanceObservations.class),"acquisition")).isSameAs(context.getBean(PositionAcquisition.class));
   assertThat(org.springframework.test.util.ReflectionTestUtils.getField(context.getBean(AccountBalanceObservations.class),"reuseSeconds")).isEqualTo(77L);
   String base="http://127.0.0.1:"+context.getWebServer().getPort();var http=HttpClient.newHttpClient();
   var positionResponse=http.send(HttpRequest.newBuilder(URI.create(base+"/v2/positions?view=inventory&accountId="+r.fid+"&underlying=ABC")).header("Authorization","Bearer owner").GET().build(),HttpResponse.BodyHandlers.ofString());assertThat(positionResponse.statusCode()).as(positionResponse.body()).isEqualTo(200);var output=JSON.readTree(positionResponse.body());assertThat(output.at("/accounts/0/items/0/evaluation/spot/value").asText()).isEqualTo("12");assertThat(output.at("/accounts/0/source/observationDate").asText()).isEqualTo("2026-10-27");
   var balanceResponse=http.send(HttpRequest.newBuilder(URI.create(base+"/v2/account-balance-observations?selection=latest-source&accountId="+r.tt)).header("Authorization","Bearer owner").GET().build(),HttpResponse.BodyHandlers.ofString());assertThat(balanceResponse.statusCode()).isEqualTo(200);assertThat(JSON.readTree(balanceResponse.body()).at("/acquisition/status").asText()).isEqualTo("ACQUIRED");assertThat(r.balances.get()).isEqualTo(1);assertThat(r.securities.get()).isZero();

  }
 }}
 @Test void boundedTransportCancelsStalledBody()throws Exception{
  var slow=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);slow.createContext("/",x->{try{x.sendResponseHeaders(200,2);Thread.sleep(1500);x.getResponseBody().write("{}".getBytes());}catch(Exception ignored){}finally{x.close();}});slow.start();
  try{long start=System.nanoTime();var request=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+slow.getAddress().getPort())).build();assertThatThrownBy(()->BoundedHttp.receive(HttpClient.newHttpClient(),request,100,System.nanoTime()+Duration.ofMillis(200).toNanos())).isInstanceOf(java.util.concurrent.TimeoutException.class);assertThat(Duration.ofNanos(System.nanoTime()-start)).isLessThan(Duration.ofSeconds(1));}finally{slow.stop(0);}
 }
 public static void main(String[] args)throws Exception{Path ready=Path.of(args[0]);Files.createDirectories(ready.getParent());var rig=new Rig(ready.getParent());Runtime.getRuntime().addShutdownHook(new Thread(rig::close));Files.writeString(ready,JSON.writeValueAsString(Map.of("base",rig.base(),"token","owner","provider","RAW_LOOPBACK_ONLY")));new java.util.concurrent.CountDownLatch(1).await();}
}
