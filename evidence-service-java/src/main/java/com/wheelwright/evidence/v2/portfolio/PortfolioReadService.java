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
 public ArrayNode synchronizeOrders(Set<String> scope)throws Exception{return orderAcquisition==null?array():orderAcquisition.read(scope);}
 private PortfolioMarketAcquisition marketAcquisition;
 @org.springframework.beans.factory.annotation.Autowired(required=false)
 public void marketAcquisition(PortfolioMarketAcquisition acquisition){this.marketAcquisition=acquisition;}
 public ArrayNode synchronizeMarket(Set<String> scope)throws Exception{return marketAcquisition==null?array():marketAcquisition.read(scope);}
 public ArrayNode synchronizeMarket(Set<String> scope,List<Document> members)throws Exception{
  if(marketAcquisition==null)return array();var positions=new TreeMap<String,Set<String>>();for(var member:members)if(member.kind()==Kind.POSITION&&member.account()!=null)positions.computeIfAbsent(member.account(),k->new TreeSet<>()).add(member.uri());
  return marketAcquisition.read(scope,marketSubjects(members),positions);
 }
 public Map<String,Set<String>> marketSubjects(List<Document> page)throws Exception {
  var subjects=new TreeMap<String,Set<String>>();for(var d:page){if(d.account()==null)continue;var selected=subjects.computeIfAbsent(d.account(),k->new TreeSet<>());
   if(d.kind()==Kind.MARKET_OBSERVATION){if(d.value().at("/instrument/href").isTextual())selected.add(d.value().at("/instrument/href").asText());}
   else if(d.kind()==Kind.POSITION&&!d.value().path("state").asText().equals("CLOSED")){
    var c=repo.get(d.value().at("/currentConstruction/href").asText());if(c.isPresent())for(var leaf:leaves(c.get().value().path("composition"))){for(var uri:List.of(leaf.at("/instrument/href"),leaf.at("/terms/underlying/href")))if(uri.isTextual())selected.add(uri.asText());}
   }
  }return subjects;
 }


 public ArrayNode sourceWarnings(Set<String> scope)throws Exception{
  var result=array();try(var connection=repo.connection()){for(String account:scope)try(var query=connection.prepareStatement("SELECT status,original_filename FROM brokerage_import WHERE account=? AND file_type='API_ORDERS' ORDER BY imported_at DESC,import_id DESC")){query.setString(1,account);var seen=new HashSet<String>();try(var rows=query.executeQuery()){while(rows.next()){String family=rows.getString(2).startsWith("tastytrade-complex-orders-")?"complex":"instructions";if(!seen.add(family))continue;if(!rows.getString(1).equals("ACCEPTED"))result.add(warning("SOURCE_CONFLICT","/items","Prior independently admitted brokerage instructions remain inspectable.",family.equals("complex")?"Latest retained complex parent/child corroboration was not admitted; group-dependent conclusions remain incomplete.":"Latest retained brokerage instruction scan was not completely admitted; current source completeness is unknown."));}}}}return result;
 }
 public void synchronize(Set<String> scope)throws Exception {sources.refresh(scope);}
 public List<Document> list(Kind kind,Set<String> scope)throws Exception{return repo.list(kind,scope);}
 public Optional<Document> find(String uri)throws Exception{return repo.get(uri);}
 /** Request-local only: never shares private projections or stale reconciliation across callers/requests. */
 public static final class ReadContext {
  final Map<String,ObjectNode> reconciliations=new HashMap<>();
  final Map<String,List<Document>> orders=new HashMap<>();
  final Map<String,Map<String,ObjectNode>> observations=new HashMap<>();
  final Map<String,Set<String>> orderArtifacts=new HashMap<>();
  final Map<String,ArrayNode> sourceWarnings=new HashMap<>();
 }
 public Map<String,String> latestHoldings(Set<String> scope)throws Exception {
  var cuts=new TreeMap<String,String>();for(String account:scope){var cut=new PortfolioSnapshots(repo).current(account);if(cut.isPresent())cuts.put(account,cut.get().snapshotId());}return cuts;
 }
 public ArrayNode holdingsWarnings(Set<String> scope,String selectedSnapshot)throws Exception {
  var result=array();for(String account:scope){
   var owner=new PortfolioSnapshots(repo);var cut=selectedSnapshot==null?owner.current(account):owner.find(account,selectedSnapshot);
   if(cut.isPresent()&&(cut.get().excludedNonPositionRows()>0||cut.get().cashObservation()!=null&&!cut.get().cashObservation().status().equals("OBSERVED")))result.add(warning("HOLDING_RECONCILIATION_CONFLICT","/items","Retained reported custody rows and their source snapshot remain inspectable.","The selected cut has unsupported rows or incomplete companion cash evidence; an empty or successful response does not establish complete Account financial truth."));
   if(selectedSnapshot==null)try(var c=repo.connection();var q=c.prepareStatement("SELECT status FROM brokerage_position_acquisition WHERE account=? ORDER BY completed_at DESC,acquisition_id DESC LIMIT 1")){
    q.setString(1,account);try(var row=q.executeQuery()){if(row.next()&&!row.getString(1).equals("ACCEPTED"))result.add(warning("SOURCE_CONFLICT","/items","The prior admitted holdings cut and original clocks remain inspectable.","The latest brokerage holdings acquisition failed or was rejected; retained prior evidence does not fulfill that refresh."));}
   }
   if(selectedSnapshot==null)try(var c=repo.connection();var q=c.prepareStatement("SELECT status FROM brokerage_import WHERE account=? AND file_type='POSITIONS' ORDER BY imported_at DESC,import_id DESC LIMIT 1")){
    q.setString(1,account);try(var row=q.executeQuery()){if(row.next()&&!row.getString(1).equals("ACCEPTED"))result.add(warning("SOURCE_CONFLICT","/items","The last independently admitted snapshot remains retained and readable with its original clocks.","The latest retained positions acquisition/import was not admitted. These rows are retained prior evidence, not a successful refresh or a complete current brokerage assertion."));}
   }
  }return result;
 }
 public List<Document> page(Kind kind,Set<String> scope,Map<String,String> filters,String after,boolean descending,int limit)throws Exception {
  Map<String,String> cuts=kind==Kind.HOLDING&&!filters.containsKey("snapshotId")?latestHoldings(scope):null;
  return repo.page(kind,scope,filters,cuts,after,descending,limit);
 }
 private ObjectNode reconciliation(String account,Instant now,ReadContext context)throws Exception {
  if(!context.reconciliations.containsKey(account))context.reconciliations.put(account,reconciliation(account,now));return context.reconciliations.get(account);
 }
 private ArrayNode sourceWarnings(String account,ReadContext context)throws Exception {
  if(!context.sourceWarnings.containsKey(account))context.sourceWarnings.put(account,sourceWarnings(Set.of(account)));return context.sourceWarnings.get(account).deepCopy();
 }
 private List<Document> orders(String account,ReadContext context)throws Exception {
  if(!context.orders.containsKey(account))context.orders.put(account,repo.list(Kind.ORDER,Set.of(account)));return context.orders.get(account);
 }
 private Set<String> orderArtifacts(String account,ReadContext context)throws Exception {
  if(!context.orderArtifacts.containsKey(account))context.orderArtifacts.put(account,currentOrderArtifacts(account));return context.orderArtifacts.get(account);
 }
 private Map<String,ObjectNode> observations(String account,Instant now,ReadContext context)throws Exception {
  if(!context.observations.containsKey(account)){
   var values=new HashMap<String,ObjectNode>();var session=PortfolioSessionEvidence.read(repo,account,now);
   for(var m:repo.list(Kind.MARKET_OBSERVATION,Set.of(account)))values.merge(m.value().at("/instrument/href").asText(),PortfolioSessionEvidence.qualify(scopedObservation(m),now,session),(a,b)->Instant.parse(a.path("receivedAt").asText()).compareTo(Instant.parse(b.path("receivedAt").asText()))>=0?a:b);
   context.observations.put(account,values);
  }return context.observations.get(account);
 }
 public ObjectNode read(Document d,Principal p,Instant now)throws Exception {return read(d,p,now,new ReadContext());}
 public ObjectNode read(Document d,Principal p,Instant now,ReadContext context)throws Exception {
  ObjectNode n=d.value().deepCopy();if(d.kind()==Kind.POSITION&&n.path("state").asText().equals("CLOSED"))n.remove("exposure");
  if(d.kind()==Kind.POSITION){n.set("orders",link("/v2/orders?positionId="+n.path("id").asText()));var c=repo.get(n.at("/currentConstruction/href").asText()).orElseThrow();var observations=observations(d.account(),now,context);
   n.set("evaluation",PortfolioMath.evaluate(c.value(),observations,now));if(d.value().at("/evaluation/historicalMarketValue").isObject())((ObjectNode)n.get("evaluation")).set("historicalMarketValue",d.value().at("/evaluation/historicalMarketValue").deepCopy());PortfolioOrderEvaluation.apply(n,c.value(),orders(d.account(),context),now,orderArtifacts(d.account(),context));if(p.hasGrant("account.orders.read:"+d.account()))for(var sourceWarning:sourceWarnings(d.account(),context)){((ObjectNode)sourceWarning).set("affected",array().add("/evaluation/management"));((ArrayNode)n.path("warnings")).add(sourceWarning);}if(d.value().at("/evaluation/economicComparison").isObject()){
    var retained=d.value().at("/evaluation/economicComparison");var original=repo.get(retained.at("/original/construction/href").asText());if(original.isPresent()&&Objects.equals(original.get().account(),d.account())&&original.get().value().path("position").equals(c.value().path("position")))((ObjectNode)n.get("evaluation")).set("economicComparison",PortfolioEconomicHistory.compare(original.get().value(),c.value(),retained.path("cumulative"),now));else ((ArrayNode)n.get("warnings")).add(warning("HISTORY_INCOMPLETE","/evaluation/economicComparison","Current constituent facts remain inspectable.","Retained original terms do not resolve in this Position and Account scope."));
   }if(!n.path("state").asText().equals("CLOSED"))propagate(n,reconciliation(d.account(),now,context),c.value());PortfolioCurrentExposure.qualifyEvaluation(n,now);PortfolioSources.qualify(n);
  }
  if(d.kind()==Kind.CONSTRUCTION){var parent=repo.get(n.at("/position/href").asText());if(parent.isPresent()&&parent.get().value().at("/currentConstruction/href").asText().equals(d.uri())&&!parent.get().value().path("state").asText().equals("CLOSED"))qualifyConstruction(n,reconciliation(d.account(),now,context));}
  if(d.kind()==Kind.MARKET_OBSERVATION)n=PortfolioSessionEvidence.qualify(n,now,d.account()==null?Optional.empty():PortfolioSessionEvidence.read(repo,d.account(),now));
  if(d.kind()==Kind.ORDER&&!PortfolioOrderEvaluation.currentInstruction(n,orderArtifacts(d.account(),context))&&!Set.of("FILLED","CANCELED","EXPIRED","REJECTED").contains(n.path("status").asText()))((ArrayNode)n.path("warnings")).add(warning("SOURCE_CONFLICT","/status","Last reported instruction and source times remain inspectable; absence does not prove cancellation, expiration or a fill.","This retained active-status record is not present in the latest admitted bounded instruction scan. Current working state is unconfirmed."));
  if(d.kind()==Kind.ORDER)for(var warning:sourceWarnings(d.account(),context)){((ObjectNode)warning).set("affected",array().add(""));((ArrayNode)n.get("warnings")).add(warning);}
  return PortfolioAuthorization.project(new Document(d.kind(),d.uri(),d.account(),n,d.snapshot(),d.sourceKey()),p);
 }
 private Set<String> currentOrderArtifacts(String account)throws Exception{try(var tx=repo.connection()){return PortfolioPackageEvidence.latestArtifacts(tx,account,false);}}
 /** Preserve the retained resource's Account boundary even when its underlying reference source is shared. */
 private static ObjectNode scopedObservation(Document document){
  var observation=document.value().deepCopy();if(document.account()==null)return observation;
  var ref=obj().put("kind","ACCOUNT_SOURCE").putNull("artifact").put("recordKey",document.uri()).put("provider",observation.path("provider").asText()).put("environment",observation.path("environment").asText()).put("requiredCapability","account.market.read:"+document.account()).put("receivedAt",observation.path("receivedAt").asText());
  ref.set("account",link("/v2/accounts/"+document.account()));ref.set("authorityRecord",link(document.uri()));ref.set("locator",obj().put("kind","BACKEND_ASSERTION").put("value",document.uri()));ref.set("observedAt",observation.path("observedAt"));boolean clock=observation.path("observedAt").isTextual();ref.put("observationPrecision",clock?"INSTANT":"UNKNOWN").put("timeAuthority",clock?"SOURCE":"UNKNOWN");if(clock)ref.put("observationDate",observation.path("observedAt").asText().substring(0,10));else ref.putNull("observationDate");
  for(String field:List.of("bid","ask","mid","mark"))if(observation.path(field).isObject()){var metric=(ObjectNode)observation.get(field);((ArrayNode)metric.path("evidence")).add(ref);var deps=(ArrayNode)metric.path("dependencies");boolean present=false;for(var d:deps)if(d.asText().equals("CURRENT_MARKET"))present=true;if(!present)deps.add("CURRENT_MARKET");}
  return observation;
 }
 public ObjectNode expand(Document d,Principal p,Instant now,Set<String> includes)throws Exception {return expand(d,p,now,includes,new ReadContext());}
 public ObjectNode expand(Document d,Principal p,Instant now,Set<String> includes,ReadContext context)throws Exception {
  var n=read(d,p,now,context);if(!Set.of(Kind.POSITION,Kind.CONSTRUCTION).contains(d.kind())||includes.isEmpty())return n;
  var included=obj();var warnings=(ArrayNode)n.get("warnings");var c=d.kind()==Kind.CONSTRUCTION?Optional.of(d):repo.get(n.at("/currentConstruction/href").asText());
  if(c.isPresent()&&(includes.contains("currentConstruction")||includes.contains("constituents")))included.set("construction",read(c.get(),p,now,context));
  if(includes.contains("modelVersion")&&c.isPresent()){
   var versions=array();String uri=c.get().value().at("/recognition/modelVersion/href").asText();
   if(!uri.isBlank()){var model=repo.get(uri);if(model.isPresent()&&PortfolioAuthorization.canRead(p,model.get()))versions.add(read(model.get(),p,now,context));else warnings.add(warning("ACCESS_RESTRICTED","/included/modelVersions","Authorized composition facts retained.","Requested reference expansion requires its own grant."));}included.set("modelVersions",versions);
  }
  if(includes.contains("holdingSummaries")&&c.isPresent()){
   var holdings=array();var seen=new HashSet<String>();
   if(p.hasGrant("account.holdings.read:"+d.account())){for(var leaf:leaves(c.get().value().path("composition"))){String uri=leaf.at("/allocation/holding/href").asText();if(seen.add(uri)){var holding=repo.get(uri);if(holding.isPresent()&&PortfolioAuthorization.canRead(p,holding.get()))holdings.add(read(holding.get(),p,now,context));}}}
   else warnings.add(warning("ACCESS_RESTRICTED","/included/holdings","Authorized composition retained.","Holdings expansion requires its own grant."));included.set("holdings",holdings);
  }
  if(includes.contains("orderSummaries")){
   var orders=array();String position=d.kind()==Kind.POSITION?d.uri():n.at("/position/href").asText(),construction=c.map(Document::uri).orElse("");
   if(p.hasGrant("account.orders.read:"+d.account())){for(var order:orders(d.account(),context))for(var association:order.value().path("associations"))if(Set.of(position,construction).contains(association.at("/target/href").asText())){orders.add(read(order,p,now,context));break;}}
   else warnings.add(warning("ACCESS_RESTRICTED","/included/orders","Authorized composition retained.","Order expansion requires its own grant."));included.set("orders",orders);
  }
  n.set("included",included);return n;
 }
 public ObjectNode tactical(Document d,Principal p,Instant now,ReadContext context)throws Exception {
  var expanded=expand(d,p,now,Set.of("currentConstruction","holdingSummaries"),context);var names=new HashMap<String,String>();var standings=new HashMap<String,String>();
  if(p.hasGrant("reference.read")){
   var c=expanded.at("/included/construction");var uris=new TreeSet<String>();
   for(var leaf:leaves(c.path("composition")))for(String pointer:List.of("/instrument/href","/terms/underlying/href"))if(leaf.at(pointer).isTextual())uris.add(leaf.at(pointer).asText());
   String model=c.at("/recognition/modelVersion/href").asText();if(!model.isBlank())uris.add(model);
   for(String uri:uris){var resource=repo.get(uri);if(resource.isEmpty()||!PortfolioAuthorization.canRead(p,resource.get()))continue;var v=read(resource.get(),p,now,context);if(v.path("standing").isTextual())standings.put(uri,v.path("standing").asText());if(v.path("symbol").isTextual())names.put(uri,v.path("symbol").asText());else if(v.at("/family/href").isTextual()){var family=repo.get(v.at("/family/href").asText());if(family.isPresent()&&PortfolioAuthorization.canRead(p,family.get()))names.put(uri,family.get().value().path("name").asText());}}
  }return PortfolioTactical.project(expanded,names,standings);
 }
 public ObjectNode reconciliation(String account,Instant now)throws Exception{return new PortfolioReconciliation(repo).calculate(account,now);}
 /** Global contradictions qualify affected results without deleting broker-reported facts. */
 static void propagate(ObjectNode position,ObjectNode reconciliation,JsonNode constructionValue){
  String uri=position.at("/self/href").asText(),construction=position.at("/currentConstruction/href").asText();var affected=array();String code=null;
  for(var balance:reconciliation.path("balances"))if(Set.of("OVERALLOCATED","UNKNOWN").contains(balance.path("status").asText()))for(var c:balance.path("currentConstructions"))if(c.path("href").asText().equals(construction)){affectedHolding(affected,balance.at("/inventory/holding/href").asText());code=balance.path("status").asText().equals("OVERALLOCATED")?"INVENTORY_OVERALLOCATED":"HOLDING_RECONCILIATION_CONFLICT";}
  boolean represented=false;for(var balance:reconciliation.path("balances"))for(var current:balance.path("currentConstructions"))if(current.path("href").asText().equals(construction))represented=true;
  var resolvedHoldings=new HashSet<String>();for(var balance:reconciliation.path("balances"))for(var current:balance.path("currentConstructions"))if(current.path("href").asText().equals(construction))resolvedHoldings.add(balance.at("/inventory/holding/href").asText());
  boolean completeAllocation=true;for(var leaf:leaves(constructionValue.path("composition"))){String holding=leaf.at("/allocation/holding/href").asText();if(holding.isBlank()||!resolvedHoldings.contains(holding)){completeAllocation=false;affectedHolding(affected,holding);}}
  if(code==null&&(!represented||!completeAllocation))code="HOLDING_RECONCILIATION_CONFLICT";
  // Conservation and fungible support are different predicates. Coverage is not an
  // input to contract geometry, source marks, attributed entry or instruction dates.
  if(code==null){
   ((ObjectNode)position.path("allocation")).put("status","RECONCILED");
   for(var assessment:reconciliation.path("coverageAssessments"))if(!assessment.path("status").asText().equals("SUFFICIENT"))for(var obligation:assessment.path("obligations"))if(obligation.path("href").asText().equals(uri)){
    String coverageCode=assessment.path("status").asText().equals("INSUFFICIENT")?"COVERAGE_INSUFFICIENT":"ASSOCIATION_UNRESOLVED";
    var w=warning(coverageCode,"/allocation","Independently reconciled constituents and their qualified financial observations remain inspectable.","Aggregate support is insufficient or unknown; this does not establish cash security, reservation, margin permission, or invalidate independently established contractual/market facts.");
    w.set("affected",array().add("/currentConstruction"));((ArrayNode)position.path("warnings")).add(w);
   }return;
  }
  boolean conflict=Set.of("INVENTORY_OVERALLOCATED","COVERAGE_INSUFFICIENT").contains(code);String status=conflict?"CONFLICT":"INCOMPLETE";var allocation=(ObjectNode)position.path("allocation");allocation.put("status",conflict?"CONFLICT":"UNKNOWN");allocation.set("affectedHoldingIds",affected);
  var evaluation=(ObjectNode)position.path("evaluation");var targets=array();
  for(String field:List.of("marketValue","grossUnrealizedPl","netUnrealizedPl","openingCashFlow","estimatedClosingCashFlow","brokerReportedOpenPl")){if(!evaluation.path(field).isObject())continue;var m=(ObjectNode)evaluation.path(field);m.put("status",status);m.putNull("value");m.set("warningCodes",array().add(code));targets.add("/evaluation/"+field);}
  var management=(ObjectNode)evaluation.path("management");for(String field:List.of("profitTargetGrossPl","reportedStopThresholdGrossPl")){var metric=(ObjectNode)management.path(field);if(!metric.path("status").asText().equals("NOT_APPLICABLE")){metric.put("status",status).putNull("value");metric.set("warningCodes",array().add(code));targets.add("/evaluation/management/"+field);}}if(management.path("manualCheckpoint").isObject()){((ObjectNode)management.path("manualCheckpoint")).put("qualification",status);targets.add("/evaluation/management/manualCheckpoint");}
  if(evaluation.path("economicComparison").isObject()){var comparison=(ObjectNode)evaluation.path("economicComparison");var current=(ObjectNode)comparison.path("current");for(String field:List.of("openingCashFlow","shareAcquisitionBasis","paidOptionPremium","protectionStrike","lossFloorGrossPl")){var metric=(ObjectNode)current.path(field);if(!metric.path("status").asText().equals("NOT_APPLICABLE")){metric.put("status",status).putNull("value");metric.set("warningCodes",array().add(code));}}if(current.path("protectionStatus").asText().equals("CURRENT_CONTRACTUAL"))current.put("protectionStatus","UNKNOWN");((ArrayNode)comparison.path("warnings")).add(warning(code,"/current","Documented historical original terms and cumulative source records remain inspectable.","Current allocation/coverage is not established; retained contractual terms are not proof of current protective applicability."));targets.add("/evaluation/economicComparison/current");}
  var payoff=(ObjectNode)evaluation.path("payoff");payoff.put("status",status).putNull("geometry");payoff.set("warningCodes",array().add(code));targets.add("/evaluation/payoff");var range=(ObjectNode)evaluation.path("range");range.put("status",status).put("kind","UNAVAILABLE").putNull("lower").putNull("upper");range.set("warningCodes",array().add(code));targets.add("/evaluation/range");
  var w=warning(code,"/allocation","Broker-reported custody facts remain independently inspectable.","Account-wide competing allocations or coverage invalidate dependent conclusions.");w.set("affected",targets);((ArrayNode)position.get("warnings")).add(w);
 }
 private static void affectedHolding(ArrayNode affected,String uri){if(!uri.startsWith("/v2/holdings/"))return;String id=uri.substring("/v2/holdings/".length());for(var existing:affected)if(existing.asText().equals(id))return;affected.add(id);}
 /** Request-time global qualifications; retained immutable composition/source records are not rewritten. */
 static void qualifyConstruction(ObjectNode construction,ObjectNode reconciliation){
  String uri=construction.at("/self/href").asText(),position=construction.at("/position/href").asText();
  var byHolding=new HashMap<String,JsonNode>();for(var balance:reconciliation.path("balances"))for(var current:balance.path("currentConstructions"))if(current.path("href").asText().equals(uri))byHolding.put(balance.at("/inventory/holding/href").asText(),balance);
  for(var leaf:leaves(construction.path("composition"))){var allocation=(ObjectNode)leaf.path("allocation");var balance=byHolding.get(allocation.at("/holding/href").asText());String status=balance==null?"UNKNOWN":balance.path("status").asText().equals("OVERALLOCATED")?"CONFLICT":balance.path("status").asText().equals("RECONCILED")?"RECONCILED":"UNKNOWN";allocation.put("globalStatus",status);
   if(status.equals("CONFLICT")){var basis=(ObjectNode)allocation.path("basis");if(established(basis)){basis.put("status","CONFLICT").putNull("value");basis.set("warningCodes",array().add("INVENTORY_OVERALLOCATED"));}((ArrayNode)construction.path("warnings")).add(warning("INVENTORY_OVERALLOCATED","/composition","Source custody and immutable composition remain inspectable.","Current Account allocations conflict; this constituent cannot establish exclusive owned allocation or dependent attributed cost."));}
  }
  boolean unknown=leaves(construction.path("composition")).stream().anyMatch(leaf->leaf.at("/allocation/globalStatus").asText().equals("UNKNOWN"));
  if(unknown){
   for(var relation:construction.path("relationships"))if(relation.path("kind").asText().equals("ECONOMIC_COVERAGE")){((ObjectNode)relation).put("status","INCOMPLETE");((ObjectNode)relation.path("authority")).put("status","UNRESOLVED").put("qualification","Current Account allocation scope is incomplete; coverage is not independently established.");}
   ((ArrayNode)construction.path("warnings")).add(warning("HOLDING_RECONCILIATION_CONFLICT","/composition","Retained source constituents and Model-version bindings remain inspectable.","Current Account-wide ownership reconciliation is not complete; dependent allocation and coverage conclusions remain unknown."));
  }
  for(var assessment:reconciliation.path("coverageAssessments"))if(!assessment.path("status").asText().equals("SUFFICIENT"))for(var obligation:assessment.path("obligations"))if(obligation.path("href").asText().equals(position)){
   boolean conflict=assessment.path("status").asText().equals("INSUFFICIENT");String code=conflict?"COVERAGE_INSUFFICIENT":"ASSOCIATION_UNRESOLVED";
   for(var relation:construction.path("relationships"))if(relation.path("kind").asText().equals("ECONOMIC_COVERAGE")){((ObjectNode)relation).put("status",conflict?"CONFLICT":"INCOMPLETE");var authority=(ObjectNode)relation.path("authority");authority.put("status","UNRESOLVED").put("qualification","Current Account-wide coverage is insufficient or incomplete. Requested quantities remain known; no broker reservation is established.");}
   ((ArrayNode)construction.path("warnings")).add(warning(code,"/relationships","Owned custody quantities, required quantities and immutable Model-version references remain inspectable.","Retained structural recognition is not proof of sufficient current Account-wide coverage."));break;
  }
 }
 public ArrayNode snapshots(Set<String> scope)throws Exception {var result=array();var snapshots=new PortfolioSnapshots(repo);for(var snapshot:snapshots.retained(scope))result.add(snapshots.summary(snapshot));return result;}
 public ArrayNode snapshotPage(Set<String> scope,String after,boolean descending,int limit)throws Exception {
  var snapshots=new PortfolioSnapshots(repo);var result=array();var page=snapshots.page(scope,after,descending,limit);
  for(int i=0;i<page.size();i++){var snapshot=page.get(i);if(i==limit){var lookahead=obj().put("snapshotId",snapshot.snapshotId());lookahead.set("account",link("/v2/accounts/"+snapshot.account()));lookahead.set("holdings",link("/v2/holdings?accountId="+snapshot.account()));result.add(lookahead);}else result.add(snapshots.summary(snapshot));}return result;
 }
 public boolean snapshotExists(String account,String id)throws Exception{return new PortfolioSnapshots(repo).exists(account,id);}
}
