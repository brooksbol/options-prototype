package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class PortfolioContractIntegrationTest {
 @TempDir Path temp;
 ObjectMapper mapper=new ObjectMapper();SqliteEvidenceStore db;String account;PortfolioRepository repository;PortfolioReadService reads;MockMvc mvc;
 @BeforeEach void setup()throws Exception {
  db=new SqliteEvidenceStore(temp.resolve("isolated.sqlite3").toString());var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());account=accounts.bind("test","A1");var old=new PositionReadService(db,mapper);var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),mapper,old);var imported=artifacts.ingest(account,"positions.csv","POSITIONS",PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").getBytes(java.nio.charset.StandardCharsets.UTF_8),UUID.randomUUID().toString());assertThat(imported.status()).isEqualTo("ACCEPTED");
  repository=new PortfolioRepository(db,mapper);var sources=new PortfolioSources(repository,mapper,accounts);reads=new PortfolioReadService(repository,sources);
  var auth=TestAuthentication.auth("owner=user:account.read:"+account+"|account.positions.read:"+account+"|account.holdings.read:"+account+"|account.orders.read:"+account+"|account.positions.audit.read:"+account+"|account.artifacts.read:"+account+"|reference.read|market.read,position=position-user:account.positions.read:"+account+",none=none-user:quote.read");mvc=MockMvcBuilders.standaloneSetup(new PortfolioController(reads,auth,accounts)).build();
 }
 @AfterEach void close()throws Exception{db.close();}
 JsonNode getJson(String path,String user,int status)throws Exception{var response=mvc.perform(get(path).header("Authorization","Bearer "+user)).andReturn().getResponse();assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(status);assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");var parsed=mapper.readTree(response.getContentAsString());if(status==200){var output=Path.of("build/portfolio-responses");java.nio.file.Files.createDirectories(output);var record=mapper.createObjectNode().put("path",path).put("caller",user);record.set("body",parsed);java.nio.file.Files.writeString(output.resolve(UUID.randomUUID()+".json"),record.toString());}return parsed;}
 @Test void resourcesDerivedFromAdmittedSourceSurviveReopenWithoutSourceMutation()throws Exception {
  var collection=getJson("/v2/positions?projection=expanded","owner",200);assertThat(collection.path("items").size()).isGreaterThan(0);String uri=collection.path("items").get(0).at("/self/href").asText();String id=collection.path("items").get(0).path("id").asText();UUID.fromString(id);getJson(uri,"owner",200);getJson(uri,"none",404);getJson("/v2/holdings?view=observations","owner",200);var again=getJson("/v2/positions?projection=expanded","owner",200);assertThat(again.path("items").get(0).path("id").asText()).isEqualTo(id);
 }
 @Test void allResourceCollectionsArePresentAndGrantBoundariesApply()throws Exception {
  for(String path:List.of("/v2/positions","/v2/constructions","/v2/constructions/models","/v2/orders","/v2/instruments","/v2/market-observations","/v2/holdings"))getJson(path,"owner",200);
  getJson("/v2/holdings?accountId="+account,"position",403);getJson("/v2/positions?accountId="+account,"none",403);getJson("/v2/instruments","none",403);getJson("/v2/accounts/"+account+"/inventory-reconciliation","owner",200);
 }
 @Test void projectionAndCursorRetainQualificationAndRejectChanges()throws Exception {
  var first=getJson("/v2/positions?projection=summary&limit=1","owner",200);assertThat(first.path("items").size()).isEqualTo(1);var item=first.path("items").get(0);assertThat(item.has("warnings")).isTrue();assertThat(item.has("evaluation")).isTrue();if(!first.path("next").isNull()){String next=first.at("/next/href").asText();getJson(next,"owner",200);getJson(next,"position",422);getJson(next+"&extra=1","owner",422);}
 }
 @Test void closureAndImmutableHistoryAreEnforcedInThePersistedRepository()throws Exception {
  getJson("/v2/positions","owner",200);var original=repository.list(PortfolioRepository.Kind.CONSTRUCTION,Set.of(account)).getFirst();var position=repository.get(original.value().at("/position/href").asText()).orElseThrow();
  try(var tx=repository.connection()){
   var mutated=original.value().deepCopy();mutated.put("createdAt","2026-01-01T00:00:00Z");assertThatThrownBy(()->repository.put(tx,new PortfolioRepository.Document(original.kind(),original.uri(),account,mutated,original.snapshot(),original.sourceKey()))).hasMessageContaining("immutable");
   var model=repository.get("/v2/constructions/models/COVERED_CALL/versions/1").orElseThrow();var changed=model.value().deepCopy();changed.put("name","mutated");assertThatThrownBy(()->repository.put(tx,new PortfolioRepository.Document(model.kind(),model.uri(),null,changed,null,null))).hasMessageContaining("immutable");
   var second=original.value().deepCopy();String id=UUID.randomUUID().toString(),uri="/v2/constructions/"+id;second.put("id",id).put("changeKind","EVIDENCE_REINTERPRETATION").put("predecessorStatus","KNOWN");second.set("self",PortfolioJson.link(uri));second.set("predecessor",original.value().path("self"));repository.put(tx,new PortfolioRepository.Document(original.kind(),uri,account,second,original.snapshot(),original.sourceKey()));var updated=position.value().deepCopy();updated.set("currentConstruction",PortfolioJson.link(uri));repository.put(tx,new PortfolioRepository.Document(position.kind(),position.uri(),account,updated,position.snapshot(),position.sourceKey()));
   var skipped=second.deepCopy();String sid=UUID.randomUUID().toString(),suri="/v2/constructions/"+sid;skipped.put("id",sid);skipped.set("self",PortfolioJson.link(suri));assertThatThrownBy(()->repository.put(tx,new PortfolioRepository.Document(original.kind(),suri,account,skipped,original.snapshot(),original.sourceKey()))).hasMessageContaining("immediate");
   var terminal=second.deepCopy();String tid=UUID.randomUUID().toString(),turi="/v2/constructions/"+tid;terminal.put("id",tid).put("changeKind","EXPOSURE_CHANGE");terminal.set("self",PortfolioJson.link(turi));terminal.set("predecessor",second.path("self"));((com.fasterxml.jackson.databind.node.ObjectNode)terminal.get("composition")).set("children",PortfolioJson.array());repository.put(tx,new PortfolioRepository.Document(original.kind(),turi,account,terminal,original.snapshot(),original.sourceKey()));
   var closed=updated.deepCopy();closed.put("state","CLOSED");closed.set("currentConstruction",PortfolioJson.link(turi));assertThatThrownBy(()->repository.put(tx,new PortfolioRepository.Document(position.kind(),position.uri(),account,closed,position.snapshot(),position.sourceKey()))).hasMessageContaining("closure evidence");((com.fasterxml.jackson.databind.node.ObjectNode)closed.get("stateEvidence")).put("status","ESTABLISHED").put("completeness","SCOPED_ACCEPTED").put("establishedAt","2026-10-20T18:00:00Z");repository.put(tx,new PortfolioRepository.Document(position.kind(),position.uri(),account,closed,position.snapshot(),position.sourceKey()));assertThatThrownBy(()->repository.put(tx,new PortfolioRepository.Document(position.kind(),position.uri(),account,updated,position.snapshot(),position.sourceKey()))).hasMessageContaining("terminal");
  }
  assertThat(getJson(position.uri(),"owner",200).path("state").asText()).isEqualTo("CLOSED");assertThat(getJson(position.uri()+"/audit?projection=expanded","owner",200).path("items").size()).isEqualTo(3);
 }
 @Test void constructionProjectionHasAuthorizedTypedExpansions()throws Exception {
  var full=getJson("/v2/constructions?projection=expanded&include=constituents,modelVersion,holdingSummaries,orderSummaries","owner",200);assertThat(full.path("items")).isNotEmpty();for(var item:full.path("items")){assertThat(item.at("/included/construction/self")).isEqualTo(item.path("self"));assertThat(item.at("/included/holdings")).isNotEmpty();}
  var limited=getJson("/v2/constructions?projection=expanded&include=holdingSummaries,orderSummaries","position",200);for(var item:limited.path("items")){assertThat(item.at("/included/holdings")).isEmpty();assertThat(item.at("/included/orders")).isEmpty();assertThat(item.path("warnings").toString()).contains("ACCESS_RESTRICTED");}
 }
 @Test void invalidSelectorsDoNotAdmitEvidenceAndUnknownAuditIsConcealed()throws Exception {
  assertThat(repository.list(PortfolioRepository.Kind.POSITION,Set.of(account))).isEmpty();getJson("/v2/positions?projection=invalid","owner",422);getJson("/v2/positions?limit=0","owner",422);getJson("/v2/market-observations?instrumentId=invalid","owner",422);getJson("/v2/positions/bad-id/audit","owner",422);assertThat(repository.list(PortfolioRepository.Kind.POSITION,Set.of(account))).isEmpty();getJson("/v2/positions/"+UUID.randomUUID()+"/audit","owner",404);
 }
 @Test void invalidGetAndMissingVersionsUseStructuredProblems()throws Exception {
  getJson("/v2/positions?limit=0","owner",422);getJson("/v2/positions?unknown=1","owner",422);getJson("/v2/positions?state=REVIVED","owner",422);getJson("/v2/constructions/models/COVERED_CALL/versions/unknown","owner",404);getJson("/v2/constructions/models/COVERED_CALL/versions/1","owner",200);
 }
 @Test void orderDependentCashFlowIsRedactedIncludingAsOfAcrossProjections()throws Exception {
  getJson("/v2/positions","owner",200);var original=repository.list(PortfolioRepository.Kind.CONSTRUCTION,Set.of(account)).stream().filter(d->PortfolioJson.leaves(d.value().path("composition")).getFirst().path("kind").asText().equals("LONG_SHARES")).findFirst().orElseThrow();var position=repository.get(original.value().at("/position/href").asText()).orElseThrow();var c=original.value().deepCopy();String cid=UUID.randomUUID().toString(),curi="/v2/constructions/"+cid;c.put("id",cid).put("changeKind","EVIDENCE_REINTERPRETATION");c.set("self",PortfolioJson.link(curi));c.set("predecessor",original.value().path("self"));var leaf=PortfolioJson.leaves(c.path("composition")).getFirst();var basis=(com.fasterxml.jackson.databind.node.ObjectNode)leaf.at("/allocation/basis");basis.put("value","25").put("status","QUALIFIED").put("method","SYNTHETIC_ORDER_QUALIFIED_SECURITY_SPECIMEN");basis.set("dependencies",PortfolioJson.array().add("ORDER_EVIDENCE"));var source=PortfolioJson.source(account,UUID.randomUUID().toString(),"/fills/0","2026-10-05","2026-10-05T12:34:56Z","SYNTHETIC");source.put("requiredCapability","account.orders.read:"+account);basis.set("evidence",PortfolioJson.array().add(source));((com.fasterxml.jackson.databind.node.ObjectNode)leaf.get("allocation")).put("basisMethod","BROKER_ATTRIBUTED");var updated=position.value().deepCopy();updated.set("currentConstruction",PortfolioJson.link(curi));try(var tx=repository.connection()){tx.setAutoCommit(false);repository.put(tx,new PortfolioRepository.Document(PortfolioRepository.Kind.CONSTRUCTION,curi,account,c,position.snapshot(),position.sourceKey()));repository.put(tx,new PortfolioRepository.Document(position.kind(),position.uri(),account,updated,position.snapshot(),position.sourceKey()));tx.commit();}
  var authorized=getJson(position.uri(),"owner",200);assertThat(authorized.at("/evaluation/openingCashFlow/value").isNull()).isFalse();
  var restricted=getJson(position.uri(),"position",200);assertThat(restricted.at("/evaluation/openingCashFlow/status").asText()).isEqualTo("REDACTED");assertThat(restricted.at("/evaluation/openingCashFlow/asOf").isNull()).isTrue();assertThat(restricted.toString()).doesNotContain("2026-10-05T12:34:56Z");
  for(String projection:List.of("summary","expanded")){var result=getJson("/v2/positions?projection="+projection,"position",200);var match=new java.util.ArrayList<JsonNode>();result.path("items").forEach(n->{if(n.path("id").equals(updated.path("id")))match.add(n);});assertThat(match).hasSize(1);assertThat(match.getFirst().at("/evaluation/openingCashFlow/asOf").isNull()).isTrue();assertThat(match.getFirst().at("/evaluation/openingCashFlow/value").isNull()).isTrue();}
 }
}
