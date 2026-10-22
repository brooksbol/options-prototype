package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Source-shaped synthetic custody/Orders; association is explicitly UNKNOWN, never broker-proven. */
class PortfolioAssociationFilterTest {
 @TempDir Path directory;SqliteEvidenceStore db;PortfolioRepository repo;String account;Document position,construction,order;MockMvc mvc;
 @BeforeEach void setup()throws Exception{
  db=new SqliteEvidenceStore(directory.resolve("filter.db").toString());var accounts=new AccountDirectory(db,"");account=accounts.bind("test","TASTYTRADE","TEST1234");var client=mock(TastytradeClient.class);
  when(client.holdings("TEST1234")).thenReturn(Files.readString(Path.of("src/test/resources/tastytrade/xle-api.json")).replace("TTTEST01","TEST1234").getBytes(StandardCharsets.UTF_8));when(client.settledCashBalance("TEST1234")).thenThrow(new IllegalStateException("cash not supplied by this synthetic fixture"));new PositionAcquisition(db,accounts,new PositionReadService(db,JSON),client).acquire(account,UUID.randomUUID().toString());repo=new PortfolioRepository(db,JSON);
  var nativeOrders=JSON.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json"))).path("orders");var page=obj();page.set("data",obj().set("items",nativeOrders));byte[] bytes=JSON.writeValueAsBytes(page);String artifact=UUID.randomUUID().toString();
  try(var c=repo.connection()){
   try(var q=c.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,artifact);q.setString(3,BrokerageArtifacts.sha(bytes));q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,"2026-10-14T19:21:00Z");q.executeUpdate();}
   new PortfolioOrderSources(repo).admit(c,accounts.get(account).orElseThrow(),artifact,false);
  }
  var sources=new PortfolioSources(repo,JSON,accounts);sources.refresh(Set.of(account));position=repo.list(Kind.POSITION,Set.of(account)).getFirst();construction=repo.get(position.value().at("/currentConstruction/href").asText()).orElseThrow();order=repo.list(Kind.ORDER,Set.of(account)).getFirst();
  var auth=TestAuthentication.auth("orders=orders:account.orders.read:"+account+",both=both:account.orders.read:"+account+"|account.positions.read:"+account+"|account.holdings.read:"+account);mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(new PortfolioReadService(repo,sources),auth,accounts)).build();
 }
 @AfterEach void close()throws Exception{db.close();}
 void candidate(Document target)throws Exception{
  var association=obj().put("targetKind",target.kind().name()).put("status","UNKNOWN");association.set("target",link(target.uri()));association.set("nodeIds",array());association.set("evidence",array());association.set("authority",PortfolioSources.authority(account,"synthetic-possible-link","UNKNOWN","UNRESOLVED",array(),List.of(),"Synthetic unresolved relationship used solely to test filtering, not financial attribution."));var value=order.value().deepCopy();value.set("associations",array().add(association));try(var c=repo.connection()){repo.put(c,new Document(Kind.ORDER,order.uri(),account,value,null,order.sourceKey()));}
 }
 @Test void repeatedSourceDoesNotAcquireOpeningEvidenceAndReportsAdmissionMultiplicity()throws Exception{
  int before=repo.list(Kind.POSITION,Set.of(account)).size();var accounts=new AccountDirectory(db,"");var client=mock(TastytradeClient.class);when(client.holdings("TEST1234")).thenReturn(Files.readString(Path.of("src/test/resources/tastytrade/xle-api.json")).replace("TTTEST01","TEST1234").getBytes(StandardCharsets.UTF_8));when(client.settledCashBalance("TEST1234")).thenThrow(new IllegalStateException("cash not supplied"));new PositionAcquisition(db,accounts,new PositionReadService(db,JSON),client).acquire(account,UUID.randomUUID().toString());new PortfolioSources(repo,JSON,accounts).refresh(Set.of(account));var positions=repo.list(Kind.POSITION,Set.of(account));
  assertThat(positions).allSatisfy(p->{assertThat(p.value().path("state").asText()).isEqualTo("UNRESOLVED");assertThat(p.value().at("/evaluation/timeline/openedAt").isNull()).isTrue();});
  var report=obj().put("standing","OBSERVED_SOURCE_ADMISSION_BEHAVIOR_NOT_PRODUCT_ACCEPTANCE").put("initialPositionResources",before).put("afterIdenticalSourceCapture",positions.size()).put("retainedSnapshots",new PortfolioSnapshots(repo).retained(Set.of(account)).size()).put("newOpeningEvidence",false).put("question","A new GUID on every source cut is not independently established economic occurrence identity. Series-only continuity would likewise need a scoped association rule; do not settle ASSIM-0002 through a test expectation.");Files.createDirectories(Path.of("build"));Files.writeString(Path.of("build/portfolio-source-admission.json"),report.toPrettyString());
 }
 @Test void brokerGroupFilteringPagesRetainedPeersWithoutPositionPermission()throws Exception{
  var input=JSON.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json")));var group=input.path("complexOrders").get(0);String id=group.path("id").asText();var expected=new TreeSet<String>();group.path("orders").forEach(o->expected.add(o.path("id").asText()));if(group.path("trigger-order").isObject())expected.add(group.at("/trigger-order/id").asText());var found=new TreeSet<String>();String path="/v2/orders?accountId="+account+"&brokerGroupId="+id+"&projection=expanded&limit=1";
  while(path!=null){var response=mvc.perform(get(path).header("Authorization","Bearer orders")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);var body=JSON.readTree(response.getContentAsString());assertThat(body.path("items")).hasSize(1);var item=body.path("items").get(0);assertThat(item.path("brokerGroupId").asText()).isEqualTo(id);assertThat(item.path("associations")).isEmpty();assertThat(found.add(item.at("/sourceIdentifier/identifier").asText())).isTrue();path=body.path("next").isNull()?null:body.at("/next/href").asText();}assertThat(found).isEqualTo(expected);
  assertThat(mvc.perform(get("/v2/orders").param("brokerGroupId"," ").header("Authorization","Bearer orders")).andReturn().getResponse().getStatus()).isEqualTo(422);
 }
 @Test void orderOnlyReaderCannotProbePrivatePositionThroughCollectionFilter()throws Exception{
  candidate(position);String id=position.value().path("id").asText();var direct=mvc.perform(get(position.uri()).header("Authorization","Bearer orders")).andReturn().getResponse();assertThat(direct.getStatus()).isEqualTo(404);
  for(String projection:List.of("uri","summary","expanded")){
   var response=mvc.perform(get("/v2/orders").param("positionId",id).param("projection",projection).header("Authorization","Bearer orders")).andReturn().getResponse();assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(404);assertThat(response.getContentAsString()).doesNotContain(order.value().path("id").asText(),id);
  }
 }
 @Test void authorizedFilterFollowsConstructionToItsPositionWithoutPromotingUnknownAssociation()throws Exception{
  for(var target:List.of(position,construction)){
   candidate(target);var response=mvc.perform(get("/v2/orders").param("positionId",position.value().path("id").asText()).param("projection","expanded").header("Authorization","Bearer both")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);var body=JSON.readTree(response.getContentAsString());assertThat(body.path("items")).hasSize(1);assertThat(body.at("/items/0/associations/0/status").asText()).isEqualTo("UNKNOWN");
  }
 }
}
