package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Production source decoder -> financial interpretation; historical multiplier/membership explicitly synthetic. */
class PortfolioManagementParityTest {
 @TempDir Path temp;
 String instrument(String symbol){return "/v2/instruments/"+UUID.nameUUIDFromBytes(("instrument:TASTYTRADE:"+symbol).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
 void replaceLinks(JsonNode n,Map<String,String> links){if(n.isObject()&&n.path("href").isTextual()&&links.containsKey(n.path("href").asText()))((ObjectNode)n).put("href",links.get(n.path("href").asText()));for(var child:n)if(child.isContainerNode())replaceLinks(child,links);}
 String retain(PortfolioRepository repo,String account,JsonNode items,String family)throws Exception{String id=UUID.randomUUID().toString();var page=obj().put("context","/accounts/5WX01234/"+family);page.set("data",obj().set("items",items));byte[] bytes=JSON.writeValueAsBytes(page);try(var c=repo.connection();var q=c.prepareStatement("INSERT INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,id);q.setString(3,BrokerageArtifacts.sha(bytes));q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,"2026-10-13T19:00:30Z");q.executeUpdate();}return id;}
 @Test void actualNormalizedInstructionsYieldSourceDerivedDollarCoordinatesAndQualifiedUnknownStop()throws Exception{
  var replay=new PortfolioMarkParityTest();var source=replay.source;var now=Instant.parse(source.path("now").asText());try(var db=new SqliteEvidenceStore(temp.resolve("management.db").toString())){var repo=new PortfolioRepository(db,JSON);var accounts=new AccountDirectory(db,"");String account=accounts.bind("synthetic","TASTYTRADE","5WX01234");var c=replay.construction();String cid=UUID.randomUUID().toString(),curi="/v2/constructions/"+cid,puri="/v2/positions/"+UUID.randomUUID();c.set("self",link(curi));c.set("position",link(puri));c.set("account",link("/v2/accounts/"+account));
   var links=new HashMap<String,String>();for(var h:source.path("holdings"))links.put(replay.instrument(h.path("symbol").asText()),instrument(h.path("symbol").asText()));links.put(replay.instrument("UNG"),instrument("UNG"));replaceLinks(c,links);var observations=new HashMap<String,ObjectNode>();replay.observations().forEach((key,value)->observations.put(links.getOrDefault(key,key),value));
   // The source fixture declares standard terms and package membership. Add those explicit
   // synthetic OPENING historical multiplier, package size and zero-fill working-instruction declarations
   // to native-shaped Orders. The minimal generated specimen omits these full-feed fields;
   // they are not claimed as independently reported by the observed BUG-040 quote source.
   var rawOrders=source.path("orders").deepCopy();for(var n:rawOrders){var raw=(ObjectNode)n;raw.put("account-number","5WX01234").put("size",source.path("holdings").get(0).path("quantity").asText());for(var leg:raw.path("legs")){var value=(ObjectNode)leg;value.put("instrument-type","Equity Option");if(!raw.path("status").asText().equals("Filled"))value.set("fills",array());if(raw.path("status").asText().equals("Filled"))for(var contract:source.path("contracts"))if(contract.path("symbol").equals(value.path("symbol")))value.put("multiplier",contract.path("multiplier").asText());}}
   var rawGroups=source.path("complexOrders").deepCopy();for(var n:rawGroups){var group=(ObjectNode)n;group.put("account-number","5WX01234");for(var child:group.path("orders"))for(var raw:rawOrders)if(raw.path("id").equals(child.path("id"))){((ObjectNode)raw).put("complex-order-id",group.path("id").asText());((ObjectNode)child).removeAll();((ObjectNode)child).setAll((ObjectNode)raw.deepCopy());}}
   try(var tx=repo.connection()){new PortfolioOrderSources(repo).admit(tx,accounts.get(account).orElseThrow(),retain(repo,account,rawOrders,"orders"),false);new PortfolioComplexOrderEvidence(repo).admit(tx,accounts.get(account).orElseThrow(),retain(repo,account,rawGroups,"complex-orders"));}
   var orders=new ArrayList<Document>();for(var order:repo.list(Kind.ORDER,Set.of(account))){var value=order.value().deepCopy();var evidence=value.path("evidence");var association=obj().put("targetKind","CONSTRUCTION").put("status","ESTABLISHED");association.set("target",link(curi));association.set("nodeIds",array());association.set("evidence",evidence);association.set("authority",PortfolioSources.authority(account,"synthetic-declared-membership","RECONCILED_DOCUMENTED_ACTIVITY","ESTABLISHED",evidence,List.of(order.uri(),curi),"Explicit synthetic admitted package membership; source Orders and holdings alone do not prove this predicate."));value.set("associations",array().add(association));orders.add(new Document(Kind.ORDER,order.uri(),account,value,null,order.sourceKey()));}
   var p=obj();p.set("self",link(puri));p.set("account",link("/v2/accounts/"+account));p.set("warnings",array());p.set("evaluation",PortfolioMath.evaluate(c,observations,now));PortfolioOrderEvaluation.apply(p,c,orders,now);assertThat(p.at("/evaluation/management/profitTargetGrossPl/value").isTextual()).as(p.at("/evaluation/management").toString()).isTrue();assertThat(p.at("/evaluation/management/reportedStopThresholdGrossPl/value").isNull()).isTrue();assertThat(p.at("/evaluation/management/manualCheckpoint").isNull()).isTrue();assertThat(p.at("/evaluation/management/orders")).hasSize(2);assertThat(p.at("/evaluation/timeline/openedAt").isTextual()).isTrue();assertThat(p.at("/evaluation/netUnrealizedPl/value").isNull()).isTrue();
   Files.createDirectories(Path.of("build/portfolio-mark-parity"));Files.writeString(Path.of("build/portfolio-mark-parity/management-evaluation.json"),p.path("evaluation").toPrettyString());
   Files.createDirectories(Path.of("build/portfolio-responses"));var capture=obj().put("path","urn:synthetic:normalized-management-evaluation").put("schema","Evaluation").put("caller","production-source-decoder-evaluator-synthetic-membership");capture.set("body",p.path("evaluation"));Files.writeString(Path.of("build/portfolio-responses/management-evaluation.json"),capture.toString());
   var restricted=PortfolioAuthorization.project(new Document(Kind.POSITION,puri,account,p,null,null),new BearerAuthenticator.Principal("synthetic-position-reader",Set.of("account.positions.read:"+account)));assertThat(restricted.at("/evaluation/timeline/openedAt").isNull()).isTrue();assertThat(restricted.at("/evaluation/timeline/originalDays/asOf").isNull()).isTrue();assertThat(restricted.at("/evaluation/management/orders")).isEmpty();assertThat(restricted.at("/evaluation/management/profitTargetGrossPl/value").isNull()).isTrue();
  }
 }
}
