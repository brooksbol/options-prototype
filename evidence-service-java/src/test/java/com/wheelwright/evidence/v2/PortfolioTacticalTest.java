package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class PortfolioTacticalTest {
 @TempDir Path directory;
 @Test void nativeCondorProjectionKeepsAllFourLegsAndUnknownEconomicsAndRespectsPermissions()throws Exception {
  var h=new PortfolioSourcePackageTest();h.directory=directory;h.setup();try{
   var held=h.selected("holdings","UNG");h.holdings(held);h.references(held,false);h.orders(false);
   var full=new BearerAuthenticator.Principal("full",Set.of("account.positions.read:"+h.account,"account.holdings.read:"+h.account,"account.orders.read:"+h.account,"account.artifacts.read:"+h.account,"market.read","account.market.read:"+h.account,"reference.read"));
   var reader=new PortfolioReadService(h.repo,h.sources);var row=reader.tactical(h.current().getFirst(),full,Instant.parse("2026-10-29T16:00:00Z"),new PortfolioReadService.ReadContext());
   assertThat(row.path("representation").asText()).isEqualTo("TACTICAL_POSITION");assertThat(row.at("/structure/name").asText()).isEqualTo("IRON CONDOR");assertThat(row.path("constituents")).hasSize(4);assertThat(row.at("/evaluation/payoff/geometry/boundaries")).hasSize(4);assertThat(row.at("/evaluation/payoff/geometry/valueKind").asText()).isEqualTo("TERMINAL_VALUE");assertThat(row.at("/evaluation/timeline/remainingDays/value").asText()).isEqualTo("29");assertThat(row.at("/evaluation/openingCashFlow/value").isNull()).isTrue();
   for(var legacy:List.of(obj().putNull("exposure"),obj().set("exposure",obj().putNull("status"))))assertThat(PortfolioTactical.project(legacy,Map.of(),Map.of()).has("exposure")).isFalse();
   assertThat(row.path("exposure").has("evidence")).isFalse();for(var constituent:row.path("constituents"))assertThat(constituent.path("terms").has("evidence")).isFalse();assertThat(row.at("/evaluation/spot").has("asOf")).isFalse();
   var restricted=new BearerAuthenticator.Principal("restricted",Set.of("account.positions.read:"+h.account,"account.holdings.read:"+h.account,"reference.read"));var hidden=reader.tactical(h.current().getFirst(),restricted,Instant.parse("2026-10-29T16:00:00Z"),new PortfolioReadService.ReadContext());assertThat(hidden.at("/structure/status").asText()).isEqualTo("UNCLASSIFIED");assertThat(hidden.at("/evaluation/management/profitTargetGrossPl/value").isNull()).isTrue();assertThat(hidden.at("/evaluation/timeline/openedAt").isNull()).isTrue();
   var response=obj().put("projection","tactical");response.set("items",array().add(row));response.putNull("next");response.set("warnings",array());var sample=obj();sample.set("account",obj().put("nickname","fixture"));sample.set("evidence",response);Files.createDirectories(Path.of("build/reports/tactical"));Files.writeString(Path.of("build/reports/tactical/condor.json"),JSON.writeValueAsString(sample));
   var auth=new BearerAuthenticator(new UserDirectory(h.db,h.accounts),"reader=reader:account.positions.read:"+h.account+",account.holdings.read:"+h.account+",reference.read");var mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(reader,auth,h.accounts)).build();
   var http=mvc.perform(get("/v2/positions?accountId="+h.account+"&projection=tactical&exposureStatus=OBSERVED,UNKNOWN,RETAINED&limit=1").header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(http.getStatus()).isEqualTo(200);var body=JSON.readTree(http.getContentAsString());assertThat(body.path("items")).hasSize(1);assertThat(body.at("/items/0/representation").asText()).isEqualTo("TACTICAL_POSITION");
   for(String query:List.of("projection=tactical&include=currentConstruction","projection=tactical&exposureStatus=OBSERVED,OBSERVED","projection=tactical&exposureStatus=OBSERVED,BOGUS"))assertThat(mvc.perform(get("/v2/positions?accountId="+h.account+"&"+query).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
  }finally{h.close();}
 }
 @Test void compactionPreservesKnownMetricQualificationsAndRemovesRepeatedEvidenceOnly() {
  var p=obj();var e=obj();p.set("evaluation",e);var known=obj().put("value","12.345").put("unit","PRICE").put("currency","USD").put("status","QUALIFIED").put("origin","OBSERVED").put("method","SOURCE_PRICE").put("asOf","2026-10-29T15:30:00Z");known.set("warningCodes",array().add("STALE_MARKET_OBSERVATION"));known.set("assumptions",array().add("BROKER_QUOTE"));known.set("evidence",array().add(obj().put("private-detail","only-on-demand")));e.set("spot",known);
  var actual=PortfolioTactical.project(p,Map.of(),Map.of()).at("/evaluation/spot");for(String field:List.of("value","unit","currency","status","origin","method","asOf","warningCodes","assumptions"))assertThat(actual.path(field)).isEqualTo(known.path(field));assertThat(actual.has("evidence")).isFalse();assertThat(known.has("evidence")).isTrue();
 }
 @Test void catalogOnlyAdditionReconsidersAnOldUnclassifiedPackageExactlyOnce()throws Exception {
  var h=new PortfolioSourcePackageTest();h.directory=directory;h.setup();try{
   byte[] bytes=Files.readAllBytes(Path.of("src/main/resources/portfolio/construction-models.json"));var old=(ObjectNode)JSON.readTree(bytes);for(String field:List.of("families","versions")){var entries=(ArrayNode)old.path(field);for(int i=entries.size()-1;i>=0;i--)if(entries.get(i).toString().contains("BULL_PUT_VERTICAL")||entries.get(i).toString().contains("BEAR_CALL_VERTICAL"))entries.remove(i);}
   h.sources=new PortfolioSources(h.repo,JSON,h.accounts,JSON.writeValueAsBytes(old));var puts=array();for(var leg:h.selected("holdings","UNG"))if(leg.path("symbol").asText().contains("P000"))puts.add(leg);assertThat(puts).hasSize(2);h.holdings(puts);h.references(puts,false);
   var closing=(ObjectNode)h.selected("orders","UNG").get(1).deepCopy();closing.put("id","native-put-vertical");closing.remove("complex-order-id");var legs=array();for(var leg:closing.path("legs"))if(leg.path("symbol").asText().contains("P000"))legs.add(leg.deepCopy());closing.set("legs",legs);h.retain(h.page(array().add(closing),"/accounts/TEST1234/orders"),"API_ORDERS","native-vertical.json");h.sources.refresh(Set.of(h.account));var position=h.current().getFirst();var before=h.construction(position);String frozen=before.value().toString();assertThat(before.value().at("/recognition/status").asText()).isEqualTo("UNCLASSIFIED");int count=h.repo.list(Kind.CONSTRUCTION,Set.of(h.account)).size();
   h.sources=new PortfolioSources(h.repo,JSON,h.accounts,bytes);h.sources.refresh(Set.of(h.account));var after=h.construction(h.current().getFirst());assertThat(after.uri()).isNotEqualTo(before.uri());assertThat(after.value().at("/predecessor/href").asText()).isEqualTo(before.uri());assertThat(after.value().at("/recognition/modelVersion/href").asText()).isEqualTo("/v2/constructions/models/BULL_PUT_VERTICAL/versions/1");assertThat(h.repo.get(before.uri()).orElseThrow().value().toString()).isEqualTo(frozen);assertThat(h.repo.list(Kind.CONSTRUCTION,Set.of(h.account))).hasSize(count+1);
   h.sources.refresh(Set.of(h.account));assertThat(h.construction(h.current().getFirst()).uri()).isEqualTo(after.uri());assertThat(h.repo.list(Kind.CONSTRUCTION,Set.of(h.account))).hasSize(count+1);
  }finally{h.close();}
 }
 @Test void monitoringOrSelectorIncludesLegacyUnknownBeforePaginationAndKeepsAccountIsolation()throws Exception {
  var h=new PortfolioSourcePackageTest();h.directory=directory;h.setup();try{
   String foreign=h.accounts.bind("foreign","TASTYTRADE","FOREIGN1234");
   try(var c=h.repo.connection();var q=c.prepareStatement("INSERT INTO portfolio_resource(uri,kind,account_id,payload_json,source_snapshot,source_key,recorded_at) VALUES (?,'POSITION',?,?,NULL,'fixture','2026-10-29T00:00:00Z')")){
    String[] statuses={"ZERO_OBSERVED","OBSERVED","UNKNOWN","RETAINED",null,null,null,"OBSERVED"};
    String[] states={"UNRESOLVED","UNRESOLVED","OPEN","UNRESOLVED","OPEN","UNRESOLVED","CLOSED","OPEN"};
    for(int i=0;i<statuses.length;i++){var value=obj().put("state",states[i]);if(statuses[i]!=null)value.set("exposure",obj().put("status",statuses[i]));q.setString(1,"/v2/positions/fixture-"+i);q.setString(2,i==7?foreign:h.account);q.setString(3,JSON.writeValueAsString(value));q.executeUpdate();}
   }
   var filter=Map.of("exposureStatus","OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED");var first=h.repo.page(Kind.POSITION,Set.of(h.account),filter,null,"",false,2);assertThat(first.stream().map(Document::uri)).containsExactly("/v2/positions/fixture-1","/v2/positions/fixture-2","/v2/positions/fixture-3");
   var rest=h.repo.page(Kind.POSITION,Set.of(h.account),filter,null,first.get(1).uri(),false,10);assertThat(rest.stream().map(Document::uri)).containsExactly("/v2/positions/fixture-3","/v2/positions/fixture-4","/v2/positions/fixture-5");assertThat(rest.get(1).value().has("exposure")).isFalse();
   assertThat(h.repo.page(Kind.POSITION,Set.of(h.account),Map.of(),null,"",false,20)).hasSize(7);
  }finally{h.close();}
 }

 @Test void marketReferencesUseMembershipReselectedAfterNativeOrderGrouping()throws Exception {
  var h=new PortfolioSourcePackageTest();h.directory=directory;h.setup();try{
   var held=h.selected("holdings","UNG");h.holdings(held);h.references(held,false);assertThat(h.current()).hasSize(4);
   var reader=new PortfolioReadService(h.repo,h.sources);var orders=org.mockito.Mockito.mock(PortfolioOrderAcquisition.class);org.mockito.Mockito.when(orders.read(org.mockito.ArgumentMatchers.anySet())).thenAnswer(call->{h.orders(false);return array();});reader.orderAcquisition(orders);
   var selected=new java.util.concurrent.atomic.AtomicReference<Map<String,Set<String>>>();var market=org.mockito.Mockito.mock(PortfolioMarketAcquisition.class);org.mockito.Mockito.when(market.read(org.mockito.ArgumentMatchers.anySet(),org.mockito.ArgumentMatchers.anyMap(),org.mockito.ArgumentMatchers.anyMap())).thenAnswer(call->{selected.set(call.getArgument(2));return array();});reader.marketAcquisition(market);
   var auth=new BearerAuthenticator(new UserDirectory(h.db,h.accounts),"reader=reader:account.positions.read:"+h.account+",account.holdings.read:"+h.account+",account.orders.read:"+h.account+",account.market.read:"+h.account+",market.read,reference.read");var mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(reader,auth,h.accounts)).build();
   var response=mvc.perform(get("/v2/positions?accountId="+h.account+"&projection=tactical&exposureStatus=OBSERVED,UNKNOWN,RETAINED,UNRECORDED_NONCLOSED&limit=5").header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);assertThat(h.current()).hasSize(1);assertThat(selected.get().get(h.account)).containsExactly(h.current().getFirst().uri());
  }finally{h.close();}
 }

 @Test void exactTacticalItemKeepsDefaultAndIsolation()throws Exception {
  var h=new PortfolioSourcePackageTest();h.directory=directory;h.setup();try{
   var held=h.selected("holdings","UNG");h.holdings(held);h.references(held,false);h.orders(false);
   var reader=new PortfolioReadService(h.repo,h.sources);
   var acquisition=org.mockito.Mockito.mock(PortfolioOrderAcquisition.class);org.mockito.Mockito.when(acquisition.read(org.mockito.ArgumentMatchers.anySet())).thenReturn(array().add(obj().put("code","ORDER_ACQUISITION_FAILED").put("message","Retained instruction evidence only").set("affected",array().add("/evaluation/management"))));reader.orderAcquisition(acquisition);
   var auth=new BearerAuthenticator(new UserDirectory(h.db,h.accounts),"reader=reader:account.positions.read:"+h.account+"|account.holdings.read:"+h.account+"|account.orders.read:"+h.account+"|reference.read,outsider=outsider:reference.read");
   var mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(reader,auth,h.accounts)).build();String uri=h.current().getFirst().uri();
   var response=mvc.perform(get(uri+"?projection=tactical").header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);
   var item=JSON.readTree(response.getContentAsString());assertThat(item.at("/self/href").asText()).isEqualTo(uri);assertThat(item.path("representation").asText()).isEqualTo("TACTICAL_POSITION");assertThat(item.has("included")).isFalse();assertThat(item.has("sourceIdentifiers")).isFalse();assertThat(item.path("constituents")).hasSize(4);assertThat(item.path("warningCodes").toString()).contains("ORDER_ACQUISITION_FAILED");assertThat(item.path("warnings").toString()).contains("ORDER_ACQUISITION_FAILED");
   var plain=mvc.perform(get(uri).header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(plain.getStatus()).isEqualTo(200);assertThat(JSON.readTree(plain.getContentAsString()).has("representation")).isFalse();
   assertThat(mvc.perform(get(uri+"?projection=tactical").header("Authorization","Bearer outsider")).andReturn().getResponse().getStatus()).isEqualTo(404);
   for(String query:List.of("projection=expanded","projection=summary","projection=tactical&include=currentConstruction","projection=tactical&cursor=x","projection=tactical&accountId="+h.account,"projection=tactical&projection=tactical"))assertThat(mvc.perform(get(uri+"?"+query).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).as(query).isEqualTo(422);
  }finally{h.close();}
 }

}
