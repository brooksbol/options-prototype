package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.BearerAuthenticator.Principal;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.*;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Application-owned current interpretations, resource navigation and Account-wide reconciliation. */
@Service
public final class PortfolioReadService {
 private final PortfolioRepository repo;private final PortfolioSources sources;
 public PortfolioReadService(PortfolioRepository repo,PortfolioSources sources){this.repo=repo;this.sources=sources;}
 private PortfolioOrderAcquisition orderAcquisition;
 @org.springframework.beans.factory.annotation.Autowired(required=false)
 public void orderAcquisition(PortfolioOrderAcquisition acquisition){this.orderAcquisition=acquisition;}
 public void synchronizeOrders(Set<String> scope)throws Exception{if(orderAcquisition!=null)orderAcquisition.read(scope);}
 private PortfolioMarketAcquisition marketAcquisition;
 @org.springframework.beans.factory.annotation.Autowired(required=false)
 public void marketAcquisition(PortfolioMarketAcquisition acquisition){this.marketAcquisition=acquisition;}
 public ArrayNode synchronizeMarket(Set<String> scope)throws Exception{return marketAcquisition==null?array():marketAcquisition.read(scope);}

 public ArrayNode sourceWarnings(Set<String> scope)throws Exception{
  var result=array();try(var connection=repo.connection()){for(String account:scope)try(var query=connection.prepareStatement("SELECT status FROM brokerage_import WHERE account=? AND file_type='API_ORDERS' ORDER BY imported_at DESC,import_id DESC LIMIT 1")){query.setString(1,account);try(var row=query.executeQuery()){if(row.next()&&!row.getString(1).equals("ACCEPTED"))result.add(warning("SOURCE_CONFLICT","/items","Prior admitted Order evidence remains inspectable.","The most recent retained Order scan was not completely admitted; current source completeness is unknown."));}}}return result;
 }
 public void synchronize(Set<String> scope)throws Exception {sources.refresh(scope);}
 public List<Document> list(Kind kind,Set<String> scope)throws Exception{return repo.list(kind,scope);}
 public Optional<Document> find(String uri)throws Exception{return repo.get(uri);}
 public ObjectNode read(Document d,Principal p,Instant now)throws Exception {
  ObjectNode n=d.value().deepCopy();
  if(d.kind()==Kind.POSITION){var c=repo.get(n.at("/currentConstruction/href").asText()).orElseThrow();var observations=new HashMap<String,ObjectNode>();for(var m:repo.list(Kind.MARKET_OBSERVATION,Set.of(d.account())))observations.merge(m.value().at("/instrument/href").asText(),scopedObservation(m),(a,b)->a.path("receivedAt").asText().compareTo(b.path("receivedAt").asText())>=0?a:b);
   n.set("evaluation",PortfolioMath.evaluate(c.value(),observations,now));if(d.value().at("/evaluation/historicalMarketValue").isObject())((ObjectNode)n.get("evaluation")).set("historicalMarketValue",d.value().at("/evaluation/historicalMarketValue").deepCopy());PortfolioOrderEvaluation.apply(n,c.value(),repo.list(Kind.ORDER,Set.of(d.account())),now);if(d.value().at("/evaluation/economicComparison").isObject()){
    var retained=d.value().at("/evaluation/economicComparison");var original=repo.get(retained.at("/original/construction/href").asText());if(original.isPresent()&&Objects.equals(original.get().account(),d.account())&&original.get().value().path("position").equals(c.value().path("position")))((ObjectNode)n.get("evaluation")).set("economicComparison",PortfolioEconomicHistory.compare(original.get().value(),c.value(),retained.path("cumulative"),now));else ((ArrayNode)n.get("warnings")).add(warning("HISTORY_INCOMPLETE","/evaluation/economicComparison","Current constituent facts remain inspectable.","Retained original terms do not resolve in this Position and Account scope."));
   }if(!n.path("state").asText().equals("CLOSED"))propagate(n,reconciliation(d.account(),now));PortfolioSources.qualify(n);
  }
  if(d.kind()==Kind.ORDER)for(var warning:sourceWarnings(Set.of(d.account())))((ArrayNode)n.get("warnings")).add(warning);
  return PortfolioAuthorization.project(new Document(d.kind(),d.uri(),d.account(),n,d.snapshot(),d.sourceKey()),p);
 }
 /** Preserve the retained resource's Account boundary even when its underlying reference source is shared. */
 private static ObjectNode scopedObservation(Document document){
  var observation=document.value().deepCopy();if(document.account()==null)return observation;
  var ref=obj().put("kind","ACCOUNT_SOURCE").putNull("artifact").put("recordKey",document.uri()).put("provider",observation.path("provider").asText()).put("environment",observation.path("environment").asText()).put("requiredCapability","account.market.read:"+document.account()).put("receivedAt",observation.path("receivedAt").asText());
  ref.set("account",link("/v2/accounts/"+document.account()));ref.set("authorityRecord",link(document.uri()));ref.set("locator",obj().put("kind","BACKEND_ASSERTION").put("value",document.uri()));ref.set("observedAt",observation.path("observedAt"));boolean clock=observation.path("observedAt").isTextual();ref.put("observationPrecision",clock?"INSTANT":"UNKNOWN").put("timeAuthority",clock?"SOURCE":"UNKNOWN");if(clock)ref.put("observationDate",observation.path("observedAt").asText().substring(0,10));else ref.putNull("observationDate");
  for(String field:List.of("bid","ask","mid","mark"))if(observation.path(field).isObject()){var metric=(ObjectNode)observation.get(field);((ArrayNode)metric.path("evidence")).add(ref);var deps=(ArrayNode)metric.path("dependencies");boolean present=false;for(var d:deps)if(d.asText().equals("CURRENT_MARKET"))present=true;if(!present)deps.add("CURRENT_MARKET");}
  return observation;
 }
 public ObjectNode expand(Document d,Principal p,Instant now,Set<String> includes)throws Exception {
  var n=read(d,p,now);if(!Set.of(Kind.POSITION,Kind.CONSTRUCTION).contains(d.kind())||includes.isEmpty())return n;
  var included=obj();var warnings=(ArrayNode)n.get("warnings");var c=d.kind()==Kind.CONSTRUCTION?Optional.of(d):repo.get(n.at("/currentConstruction/href").asText());
  if(c.isPresent()&&(includes.contains("currentConstruction")||includes.contains("constituents")))included.set("construction",read(c.get(),p,now));
  if(includes.contains("modelVersion")&&c.isPresent()){
   var versions=array();String uri=c.get().value().at("/recognition/modelVersion/href").asText();
   if(!uri.isBlank()){var model=repo.get(uri);if(model.isPresent()&&PortfolioAuthorization.canRead(p,model.get()))versions.add(read(model.get(),p,now));else warnings.add(warning("ACCESS_RESTRICTED","/included/modelVersions","Authorized composition facts retained.","Requested reference expansion requires its own grant."));}included.set("modelVersions",versions);
  }
  if(includes.contains("holdingSummaries")&&c.isPresent()){
   var holdings=array();var seen=new HashSet<String>();
   if(p.hasGrant("account.holdings.read:"+d.account())){for(var leaf:leaves(c.get().value().path("composition"))){String uri=leaf.at("/allocation/holding/href").asText();if(seen.add(uri)){var holding=repo.get(uri);if(holding.isPresent()&&PortfolioAuthorization.canRead(p,holding.get()))holdings.add(read(holding.get(),p,now));}}}
   else warnings.add(warning("ACCESS_RESTRICTED","/included/holdings","Authorized composition retained.","Holdings expansion requires its own grant."));included.set("holdings",holdings);
  }
  if(includes.contains("orderSummaries")){
   var orders=array();String position=d.kind()==Kind.POSITION?d.uri():n.at("/position/href").asText(),construction=c.map(Document::uri).orElse("");
   if(p.hasGrant("account.orders.read:"+d.account())){for(var order:repo.list(Kind.ORDER,Set.of(d.account())))for(var association:order.value().path("associations"))if(Set.of(position,construction).contains(association.at("/target/href").asText())){orders.add(read(order,p,now));break;}}
   else warnings.add(warning("ACCESS_RESTRICTED","/included/orders","Authorized composition retained.","Order expansion requires its own grant."));included.set("orders",orders);
  }
  n.set("included",included);return n;
 }
 public ObjectNode reconciliation(String account,Instant now)throws Exception{return new PortfolioReconciliation(repo).calculate(account,now);}
 /** Global contradictions qualify affected results without deleting broker-reported facts. */
 static void propagate(ObjectNode position,ObjectNode reconciliation){
  String uri=position.at("/self/href").asText(),construction=position.at("/currentConstruction/href").asText();var affected=array();String code=null;
  for(var balance:reconciliation.path("balances"))if(Set.of("OVERALLOCATED","UNKNOWN").contains(balance.path("status").asText()))for(var c:balance.path("currentConstructions"))if(c.path("href").asText().equals(construction)){affected.add(balance.at("/inventory/holding/href").asText());code=balance.path("status").asText().equals("OVERALLOCATED")?"INVENTORY_OVERALLOCATED":"HOLDING_RECONCILIATION_CONFLICT";}
  for(var assessment:reconciliation.path("coverageAssessments"))if(!assessment.path("status").asText().equals("SUFFICIENT"))for(var obligation:assessment.path("obligations"))if(obligation.path("href").asText().equals(uri)){affected.add(assessment.at("/supportHolding/href").asText());if(code==null)code=assessment.path("status").asText().equals("INSUFFICIENT")?"COVERAGE_INSUFFICIENT":"ASSOCIATION_UNRESOLVED";}
  if(code==null)return;boolean conflict=Set.of("INVENTORY_OVERALLOCATED","COVERAGE_INSUFFICIENT").contains(code);String status=conflict?"CONFLICT":"INCOMPLETE";var allocation=(ObjectNode)position.path("allocation");allocation.put("status",conflict?"CONFLICT":"UNKNOWN");allocation.set("affectedHoldingIds",affected);
  var evaluation=(ObjectNode)position.path("evaluation");var targets=array();
  for(String field:List.of("marketValue","grossUnrealizedPl","netUnrealizedPl","openingCashFlow","estimatedClosingCashFlow","brokerReportedOpenPl")){if(!evaluation.path(field).isObject())continue;var m=(ObjectNode)evaluation.path(field);m.put("status",status);m.putNull("value");m.set("warningCodes",array().add(code));targets.add("/evaluation/"+field);}
  var payoff=(ObjectNode)evaluation.path("payoff");payoff.put("status",status).putNull("geometry");payoff.set("warningCodes",array().add(code));targets.add("/evaluation/payoff");var range=(ObjectNode)evaluation.path("range");range.put("status",status).put("kind","UNAVAILABLE").putNull("lower").putNull("upper");range.set("warningCodes",array().add(code));targets.add("/evaluation/range");
  var w=warning(code,"/allocation","Broker-reported custody facts remain independently inspectable.","Account-wide competing allocations or coverage invalidate dependent conclusions.");w.set("affected",targets);((ArrayNode)position.get("warnings")).add(w);
 }
 public ArrayNode snapshots(Set<String> scope)throws Exception {var result=array();var snapshots=new PortfolioSnapshots(repo);for(var snapshot:snapshots.retained(scope))result.add(snapshots.summary(snapshot));return result;}
 public boolean snapshotExists(String account,String id)throws Exception{return new PortfolioSnapshots(repo).retained(Set.of(account)).stream().anyMatch(s->s.snapshotId().equals(id));}
}
