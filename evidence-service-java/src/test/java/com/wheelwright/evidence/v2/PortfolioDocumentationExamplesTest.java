package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Actual source decoder -> domain admission -> HTTP examples; all inputs explicitly synthetic/sanitized. */
class PortfolioDocumentationExamplesTest {
 @TempDir Path directory;
 MockMvc http(PortfolioRepository repo,PortfolioSources sources,AccountDirectory accounts,String account){
  var grants=List.of("account.positions.read:","account.holdings.read:","account.orders.read:","account.artifacts.read:","account.market.read:");var all=new ArrayList<String>(List.of("reference.read","market.read"));grants.forEach(g->all.add(g+account));
  return MockMvcBuilders.standaloneSetup(new PortfolioController(new PortfolioReadService(repo,sources),TestAuthentication.auth("owner=synthetic-documentation:"+String.join("|",all)),accounts)).build();
 }
 JsonNode capture(MockMvc mvc,String route,String name,String source)throws Exception {
  var response=mvc.perform(get(route).header("Authorization","Bearer owner")).andReturn().getResponse();assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);var body=JSON.readTree(response.getContentAsString());
  var record=obj().put("standing","SYNTHETIC_SOURCE_DERIVED_HTTP_NOT_LIVE_BROKERAGE_EVIDENCE").put("source",source).put("path",route).put("method","GET").put("status",200);record.set("body",body);var headers=obj();for(String header:List.of("Content-Type","Cache-Control","X-Request-Id"))headers.put(header,response.getHeader(header));record.set("headers",headers);
  var out=Path.of("build/product-conformance/examples");Files.createDirectories(out);Files.writeString(out.resolve(name+".json"),record.toPrettyString());return body;
 }
 PortfolioSourcePackageTest nativeFixture(String name)throws Exception {var f=new PortfolioSourcePackageTest();f.directory=Files.createDirectories(directory.resolve(name));f.setup();return f;}
 @Test void nativePackageHasExactCurrentMarkButNoInventedOpeningProfit()throws Exception {
  var f=nativeFixture("condor");try{
   f.nativeClosingPackageAndObservedInventoryEstablishFinancialScopeNotOpeningOccurrence();var held=f.selected("holdings","UNG");var symbols=new HashSet<String>();held.forEach(h->symbols.add(h.path("symbol").asText()));var quotes=array();for(var q:f.fixture.path("quotes"))if(symbols.contains(q.path("symbol").asText()))quotes.add(q.deepCopy());for(var q:f.fixture.path("spotQuotes"))if(q.path("symbol").asText().equals("UNG"))quotes.add(q.deepCopy());
   String artifact=f.retain(f.page(quotes,"/market-data/by-type"),"API_MARKET_DATA","synthetic-observed-market.json");var currencies=new HashMap<String,String>();quotes.forEach(q->currencies.put(q.path("symbol").asText(),"USD"));try(var c=f.repo.connection()){new PortfolioTastyMarketSources(f.repo).admit(c,f.accounts.get(f.account).orElseThrow(),artifact,currencies);}
   var mvc=http(f.repo,f.sources,f.accounts,f.account);var position=f.current().getFirst();String origin="scripts/fixtures/tt-live-economic-observed.json plus PortfolioSourcePackageTest declared standard reference supplement; no opening occurrence/history declaration";
   var body=capture(mvc,position.uri(),"iron-condor-position",origin);assertThat(body.path("state").asText()).isEqualTo("UNRESOLVED");assertThat(body.at("/evaluation/openingCashFlow/value").isNull()).isTrue();assertThat(body.at("/evaluation/grossUnrealizedPl/value").isNull()).isTrue();assertThat(body.at("/evaluation/payoff/geometry/valueKind").asText()).isEqualTo("TERMINAL_VALUE");
   BigDecimal expected=BigDecimal.ZERO;for(var h:held){JsonNode quote=null;for(var candidate:quotes)if(candidate.path("symbol").equals(h.path("symbol")))quote=candidate;assertThat(quote).isNotNull();BigDecimal midpoint=new BigDecimal(quote.path("bid").asText()).add(new BigDecimal(quote.path("ask").asText())).divide(BigDecimal.valueOf(2));BigDecimal size=new BigDecimal(h.path("quantity").asText()).multiply(BigDecimal.valueOf(100));expected=expected.add(midpoint.multiply(size).multiply(h.path("quantity-direction").asText().equals("Short")?BigDecimal.valueOf(-1):BigDecimal.ONE));}
   assertThat(number(body.at("/evaluation/marketValue/value"))).isEqualByComparingTo(expected);
   var evaluation=body.path("evaluation");JsonNode spotQuote=null;for(var q:f.fixture.path("spotQuotes"))if(q.path("symbol").asText().equals("UNG"))spotQuote=q;assertThat(spotQuote).isNotNull();assertThat(evaluation.at("/spot/asOf").asText()).isEqualTo(spotQuote.path("updated-at").asText());assertThat(number(evaluation.at("/spot/value"))).isEqualByComparingTo(number(spotQuote.path("mid")));assertThat(evaluation.path("freshness").asText()).isEqualTo("STALE");assertThat(evaluation.at("/timeline/openedAt").isNull()).isTrue();assertThat(evaluation.at("/timeline/originalDays/value").isNull()).isTrue();
   var zone=java.time.ZoneId.of("America/New_York");var expiry=java.time.Instant.parse(held.get(0).path("expires-at").asText()).atZone(zone).toLocalDate();var evaluated=java.time.Instant.parse(evaluation.path("evaluatedAt").asText()).atZone(zone).toLocalDate();assertThat(evaluation.at("/timeline/expiration").asText()).isEqualTo(expiry.toString());assertThat(number(evaluation.at("/timeline/remainingDays/value"))).isEqualByComparingTo(BigDecimal.valueOf(Math.max(0,java.time.temporal.ChronoUnit.DAYS.between(evaluated,expiry))));assertThat(evaluation.at("/range/kind").asText()).isEqualTo("PLATEAU");
   for(var point:evaluation.at("/payoff/geometry/boundaries")){BigDecimal price=number(point.path("price")),value=BigDecimal.ZERO;for(var h:held){String series=h.path("symbol").asText();BigDecimal strike=new BigDecimal(series.substring(series.length()-8)).movePointLeft(3);boolean put=h.path("symbol").asText().contains("P");BigDecimal intrinsic=(put?strike.subtract(price):price.subtract(strike)).max(BigDecimal.ZERO);value=value.add(intrinsic.multiply(new BigDecimal(h.path("quantity").asText())).multiply(number(h.path("multiplier"))).multiply(h.path("quantity-direction").asText().equals("Short")?BigDecimal.valueOf(-1):BigDecimal.ONE));}assertThat(number(point.path("value"))).isEqualByComparingTo(value);}

   var construction=capture(mvc,body.at("/currentConstruction/href").asText(),"iron-condor-construction",origin);assertThat(construction.at("/recognition/modelVersion/href").asText()).isEqualTo("/v2/constructions/models/IRON_CONDOR/versions/1");assertThat(leaves(construction.path("composition"))).hasSize(4);
   var collection=capture(mvc,"/v2/positions?projection=expanded&exposureStatus=OBSERVED&include=currentConstruction,orderSummaries","iron-condor-collection",origin);assertThat(collection.at("/items/0/included/orders")).hasSize(2);
   var orders=capture(mvc,"/v2/orders?positionId="+body.path("id").asText(),"working-closing-orders",origin);assertThat(orders.path("items")).hasSize(2);capture(mvc,orders.at("/items/0/self/href").asText(),"working-closing-order",origin);
  }finally{f.close();}
 }
 @Test void aggregateCoverageConflictIsSourceDerivedAndPropagated()throws Exception {
  var f=nativeFixture("coverage");try{
   f.competingCallsShareAggregateCoverageConflictWithoutInventingOwnedShareAssignment();var mvc=http(f.repo,f.sources,f.accounts,f.account);String origin="PortfolioSourcePackageTest:100 owned fungible UNG shares and two short calls, declared native-shaped terms; aggregate economic coverage only, no selected shares or broker reservation";
   var reconciliation=capture(mvc,"/v2/accounts/"+f.account+"/inventory-reconciliation","account-coverage-conflict",origin);assertThat(reconciliation.at("/coverageAssessments/0/eligibleQuantity").asText()).isEqualTo("100");assertThat(reconciliation.at("/coverageAssessments/0/requiredQuantity").asText()).isEqualTo("200");
   for(var p:f.current())if(leaves(f.construction(p).value().path("composition")).getFirst().path("kind").asText().equals("OPTION")){var body=capture(mvc,p.uri(),"position-coverage-conflict",origin);assertThat(body.path("warnings").toString()).contains("COVERAGE_INSUFFICIENT");assertThat(body.at("/evaluation/payoff/geometry").isNull()).isTrue();capture(mvc,body.at("/currentConstruction/href").asText(),"construction-coverage-conflict",origin);break;}
  }finally{f.close();}
 }
 @Test void simpleReportedProfitAndCurrentHistoricalCutsHaveSeparateMeaning()throws Exception {
  try(var db=new SqliteEvidenceStore(directory.resolve("simple.db").toString())){
   var accounts=new AccountDirectory(db,"");String account=accounts.bind("synthetic","A1");var repo=new PortfolioRepository(db,JSON);var sources=new PortfolioSources(repo,JSON,accounts);var old=new PositionReadService(db,JSON);var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,old);var mvc=http(repo,sources,accounts,account);String origin="Synthetic Fidelity positions CSV:SPY100 shares,current value10000,reported P/L250 onOct05; SPY75,current value7500,reported P/L125 onOct06. No opening transaction, basis or current quote supplied.";
   assertThat(artifacts.ingest(account,"synthetic-original.csv","POSITIONS",PositionsTest.csv("A1,Synthetic,Stocks,SPY,Shares,100,10000,250,Cash\n","Oct-05-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
   var initial=capture(mvc,"/v2/positions?projection=expanded&include=currentConstruction","simple-position-collection",origin);String uri=initial.at("/items/0/self/href").asText();var simple=capture(mvc,uri,"simple-position",origin);assertThat(simple.path("state").asText()).isEqualTo("UNRESOLVED");assertThat(number(simple.at("/evaluation/brokerReportedOpenPl/value"))).isEqualByComparingTo("250");assertThat(simple.at("/evaluation/grossUnrealizedPl/value").isNull()).isTrue();assertThat(simple.at("/evaluation/payoff/status").asText()).isEqualTo("UNSUPPORTED");assertThat(simple.at("/evaluation/payoff/geometry").isNull()).isTrue();
   assertThat(artifacts.ingest(account,"synthetic-later.csv","POSITIONS",PositionsTest.csv("A1,Synthetic,Stocks,SPY,Shares,75,7500,125,Cash\n","Oct-06-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString()).status()).isEqualTo("ACCEPTED");
   var current=capture(mvc,"/v2/holdings?accountId="+account,"current-holdings",origin);assertThat(current.path("items")).hasSize(1);assertThat(current.at("/items/0/quantity").asText()).isEqualTo("75");var catalog=capture(mvc,"/v2/holdings?accountId="+account+"&view=observations","holdings-snapshot-discovery",origin);assertThat(catalog.path("items")).hasSize(2);
   for(var cut:catalog.path("items"))if(cut.path("evidenceDate").asText().equals("2026-10-05")){var historical=capture(mvc,cut.at("/holdings/href").asText(),"historical-holdings",origin);assertThat(historical.at("/items/0/quantity").asText()).isEqualTo("100");assertThat(historical.at("/items/0/snapshotId")).isNotEqualTo(current.at("/items/0/snapshotId"));}
  }
 }
}
