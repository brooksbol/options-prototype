package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

/** Retained source decoder tests using explicitly synthetic captured-shape fixtures, not live trading. */
class PortfolioOrderEvidenceTest {
 @TempDir Path temp;
 @Test void normalizedOrdersPreserveReportedInstructionsAndFillsWithoutCreatingExposure()throws Exception{
  var json=new ObjectMapper();try(var db=new SqliteEvidenceStore(temp.resolve("orders.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("source","TASTYTRADE","TEST1234");var repository=new PortfolioRepository(db,json);var source=json.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json")));var root=json.createObjectNode();root.put("context","/accounts/TEST1234/orders");root.set("data",json.createObjectNode().set("items",source.get("orders")));root.set("pagination",json.createObjectNode().put("total-pages",1).put("page-offset",0).put("total-items",source.path("orders").size()));byte[] bytes=json.writeValueAsBytes(root);String artifact=UUID.randomUUID().toString(),received="2026-10-14T19:21:00Z";
   try(var c=repository.connection()){c.setAutoCommit(false);try(var q=c.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,artifact);q.setString(3,BrokerageArtifacts.sha(bytes));q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,received);q.executeUpdate();}new PortfolioOrderSources(repository).admit(c,accounts.get(account).orElseThrow(),artifact,true);new PortfolioOrderSources(repository).reconcileGroups(c,account);c.commit();}
   var orders=repository.list(PortfolioRepository.Kind.ORDER,Set.of(account));assertThat(orders).hasSize(source.path("orders").size());assertThat(repository.list(PortfolioRepository.Kind.POSITION,Set.of(account))).isEmpty();assertThat(repository.list(PortfolioRepository.Kind.CONSTRUCTION,Set.of(account))).isEmpty();assertThat(orders).allSatisfy(o->{assertThat(o.value().path("associations")).isEmpty();assertThat(o.value().path("observationCoverage").asText()).isEqualTo("COMPLETE_SUPPORTED_SCAN");});int working=0,filled=0;
   for(var order:orders){String parent=order.value().path("brokerGroupId").asText("");if(parent.isBlank()){assertThat(order.value().path("relatedOrders")).isEmpty();continue;}var expected=new TreeSet<String>();for(var group:source.path("complexOrders"))if(group.path("id").asText().equals(parent)){for(var child:group.path("orders"))if(!child.path("id").asText().equals(order.sourceKey()))expected.add(child.path("id").asText());if(group.path("trigger-order").isObject()&&!group.at("/trigger-order/id").asText().equals(order.sourceKey()))expected.add(group.at("/trigger-order/id").asText());}var actual=new TreeSet<String>();for(var ref:order.value().path("relatedOrders")){var peer=repository.get(ref.path("href").asText()).orElseThrow();assertThat(peer.account()).isEqualTo(account);actual.add(peer.sourceKey());}assertThat(actual).as(parent+"/"+order.sourceKey()).isEqualTo(expected);}

   var output=Path.of("build/portfolio-responses");Files.createDirectories(output);for(var order:orders){if(order.value().path("status").asText().equals("WORKING")){working++;for(var leg:order.value().path("legs"))assertThat(leg.path("fills")).isEmpty();}if(order.value().path("status").asText().equals("FILLED")){filled++;for(var leg:order.value().path("legs")){assertThat(leg.path("fills").size()).isGreaterThan(0);for(var fill:leg.path("fills")){assertThat(fill.path("executedAt").isTextual()).isTrue();Instant.parse(fill.path("executedAt").asText());assertThat(fill.path("priceUnit").asText()).isEqualTo("PER_UNDERLYING_UNIT");assertThat(fill.at("/cashFlow/value").isNull()).isTrue();}}}var capture=json.createObjectNode().put("path",order.uri()).put("caller","normalized-source-test");capture.set("body",order.value());Files.writeString(output.resolve(UUID.randomUUID()+".json"),capture.toString());}assertThat(working).isGreaterThan(0);assertThat(filled).isGreaterThan(0);
   try(var c=repository.connection()){assertThatThrownBy(()->new PortfolioOrderSources(repository).admit(c,accounts.get(accounts.bind("other","TASTYTRADE","OTHER123")).orElseThrow(),artifact,true)).isInstanceOf(IllegalArgumentException.class);}
  }
 }
 @Test void unsupportedInstrumentCannotAcquireEquityIdentityOrInventedMultiplier()throws Exception{
  var json=new ObjectMapper();try(var db=new SqliteEvidenceStore(temp.resolve("unsupported.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("source","TASTYTRADE","TEST1234");var repository=new PortfolioRepository(db,json);
   for(String instrumentType:List.of("Future","Future Option","Cryptocurrency","")){
    var source=json.readTree(Files.readString(Path.of("../scripts/fixtures/tt-live-economic-observed.json")));var items=source.path("orders").deepCopy();((ObjectNode)items.get(items.size()-1).path("legs").get(0)).put("instrument-type",instrumentType);
    var page=json.createObjectNode();page.set("data",json.createObjectNode().set("items",items));byte[] bytes=json.writeValueAsBytes(page);String artifact=UUID.randomUUID().toString();
    try(var c=repository.connection()){
     try(var q=c.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,artifact);q.setString(3,BrokerageArtifacts.sha(bytes));q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,"2026-10-14T19:21:00Z");q.executeUpdate();}
     assertThatThrownBy(()->new PortfolioOrderSources(repository).admit(c,accounts.get(account).orElseThrow(),artifact,false)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("unsupported Order instrument");
    }
    assertThat(repository.list(PortfolioRepository.Kind.ORDER,Set.of(account))).isEmpty();assertThat(repository.list(PortfolioRepository.Kind.INSTRUMENT,Set.of(account))).isEmpty();
   }
  }
 }

}
