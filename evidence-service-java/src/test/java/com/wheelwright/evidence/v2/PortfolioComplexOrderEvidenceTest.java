package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Native-shaped sanitized fixture corroboration, no live source guarantee or Position association. */
class PortfolioComplexOrderEvidenceTest {
 @TempDir Path temp;SqliteEvidenceStore db;PortfolioRepository repo;AccountDirectory accounts;String account;JsonNode fixture;
 @BeforeEach void setup()throws Exception{db=new SqliteEvidenceStore(temp.resolve("complex.db").toString());repo=new PortfolioRepository(db,JSON);accounts=new AccountDirectory(db,"");account=accounts.bind("synthetic","TASTYTRADE","TEST1234");fixture=JSON.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json")));try(var connection=repo.connection()){new PortfolioOrderSources(repo).admit(connection,accounts.get(account).orElseThrow(),retain(fixture.path("orders"),"orders"),true);}}
 @AfterEach void close()throws Exception{db.close();}
 String retain(JsonNode items,String family)throws Exception{String id=UUID.randomUUID().toString();var raw=obj().put("context","/accounts/TEST1234/"+family);raw.set("data",obj().set("items",items));byte[] bytes=JSON.writeValueAsBytes(raw);try(var c=repo.connection();var q=c.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,id);q.setString(3,BrokerageArtifacts.sha(bytes));q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,"2026-10-14T19:21:00Z");q.executeUpdate();}return id;}
 void admit(JsonNode groups)throws Exception{try(var c=repo.connection()){new PortfolioComplexOrderEvidence(repo).admit(c,accounts.get(account).orElseThrow(),retain(groups,"complex-orders"));}}
 @Test void nativeParentChildrenCorroborateInstructionsWithoutCreatingExposure()throws Exception{
  int before=repo.list(Kind.ORDER,Set.of(account)).size();admit(fixture.path("complexOrders"));int qualified=0;for(var order:repo.list(Kind.ORDER,Set.of(account))){if(!order.value().has("brokerGroupAuthority"))continue;assertThat(order.value().at("/brokerGroupAuthority/status").asText()).as(order.sourceKey()).isEqualTo("QUALIFIED");assertThat(order.value().at("/brokerGroupAuthority/basis").asText()).isEqualTo("BROKER_PACKAGE_RECORD");assertThat(order.value().path("associations")).isEmpty();assertThat(order.value().at("/brokerGroupStructure/status").asText()).isIn("QUALIFIED","INCOMPLETE");assertThat(order.value().at("/brokerGroupStructure/qualification").asText()).contains("Not current-held origin");assertThat(order.value().at("/brokerGroupStructure/childOrders").isArray()).isTrue();qualified++;}assertThat(qualified).isGreaterThan(0);assertThat(repo.list(Kind.ORDER,Set.of(account))).hasSize(before);assertThat(repo.list(Kind.POSITION,Set.of(account))).isEmpty();assertThat(repo.list(Kind.CONSTRUCTION,Set.of(account))).isEmpty();
 }
 @Test void contradictoryChildPriceRemainsUnresolvedAndForeignChildPageIsAtomic()throws Exception{
  var changed=fixture.path("complexOrders").deepCopy();var child=(ObjectNode)changed.get(0).path("orders").get(0);String sourceId=child.path("id").asText();child.put("price","999");admit(changed);var order=repo.list(Kind.ORDER,Set.of(account)).stream().filter(o->o.sourceKey().equals(sourceId)).findFirst().orElseThrow();assertThat(order.value().at("/brokerGroupAuthority/status").asText()).isEqualTo("UNRESOLVED");assertThat(order.value().path("warnings").toString()).contains("SOURCE_CONFLICT");assertThat(order.value().at("/limitPrice/value").asText()).isNotEqualTo("999");assertThat(order.value().at("/brokerGroupStructure/status").asText()).isEqualTo("CONFLICT");assertThat(order.value().path("associations")).isEmpty();
  var before=repo.list(Kind.ORDER,Set.of(account));var foreign=fixture.path("complexOrders").deepCopy();((ObjectNode)foreign.get(foreign.size()-1).path("orders").get(0)).put("account-number","OTHER");assertThatThrownBy(()->admit(foreign)).hasMessageContaining("scope");assertThat(repo.list(Kind.ORDER,Set.of(account))).isEqualTo(before);
 }
 @Test void explicitTriggerAndChildrenRemainNavigableWithoutAnOpeningAssociation()throws Exception{
  admit(fixture.path("complexOrders"));int triggers=0;
  for(var group:fixture.path("complexOrders"))if(group.path("trigger-order").isObject()){
   String nativeId=group.at("/trigger-order/id").asText();var trigger=repo.list(Kind.ORDER,Set.of(account)).stream().filter(o->o.sourceKey().equals(nativeId)).findFirst();if(trigger.isEmpty())continue;triggers++;
   var v=trigger.get().value();assertThat(v.at("/brokerGroupStructure/role").asText()).isEqualTo("TRIGGER");assertThat(v.at("/brokerGroupStructure/triggerOrder/href").asText()).isEqualTo(trigger.get().uri());assertThat(v.at("/brokerGroupStructure/groupId").asText()).isEqualTo(group.path("id").asText());assertThat(v.path("associations")).isEmpty();
   for(var child:group.path("orders")){var doc=repo.list(Kind.ORDER,Set.of(account)).stream().filter(o->o.sourceKey().equals(child.path("id").asText())).findFirst();if(doc.isEmpty())continue;assertThat(doc.get().value().at("/brokerGroupStructure/triggerOrder/href").asText()).isEqualTo(trigger.get().uri());assertThat(doc.get().value().at("/brokerGroupStructure/role").asText()).isEqualTo("CHILD");}
  }assertThat(triggers).isPositive();
 }
}
