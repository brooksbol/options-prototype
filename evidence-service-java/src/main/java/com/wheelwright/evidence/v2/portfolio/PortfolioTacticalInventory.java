package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Latest source-cut inventory plus existing tactical Positions. Display contexts never become lifecycle entities. */
@Service
public final class PortfolioTacticalInventory {
 private final PortfolioRepository repo;private final PortfolioReadService reader;private final AccountDirectory accounts;
 public PortfolioTacticalInventory(PortfolioRepository repo,PortfolioReadService reader,AccountDirectory accounts){this.repo=repo;this.reader=reader;this.accounts=accounts;}
 public ObjectNode read(String accountId,String underlying,String requestId,BearerAuthenticator.Principal caller,Instant now)throws Exception{
  var selected=accounts.list().stream().filter(a->caller.hasGrant("account.read:"+a.id())).filter(a->accountId==null||accountId.equals(a.id())).toList();
  if(selected.size()>100)throw new IllegalStateException("Account inventory capacity");
  var result=obj().put("representation","TACTICAL_POSITION_INVENTORY").put("requestId",requestId).put("evaluatedAt",now.toString()).put("currentCustody","NOT_ESTABLISHED");if(underlying==null)result.putNull("underlying");else result.put("underlying",underlying);
  long referenceDeadline=System.nanoTime()+Duration.ofSeconds(25).toNanos();var outputs=array();for(var account:selected){var out=obj().put("nickname",account.alias()).put("broker",account.brokerAssociation().broker()).put("status","FORBIDDEN").put("readComplete",false);out.set("account",link("/v2/accounts/"+account.id()));out.set("items",array());out.set("warnings",array());
   if(caller.hasGrant("account.holdings.read:"+account.id())&&caller.hasGrant("account.positions.read:"+account.id())){
    reader.synchronize(Set.of(account.id()));var cut=new PortfolioSnapshots(repo).current(account.id());
    if(cut.isEmpty())out.put("status","NO_RETAINED_CUSTODY").put("readComplete",true);
    else {var referenceWarnings=reader.synchronizePublicReferences(account.id(),underlying,caller,referenceDeadline);reader.synchronize(Set.of(account.id()));populate(out,account,cut.get(),underlying,caller,now);((ArrayNode)out.path("warnings")).addAll(referenceWarnings);}
   }outputs.add(out);
  }
  result.set("accounts",outputs);result.put("selectionComplete",java.util.stream.StreamSupport.stream(outputs.spliterator(),false).allMatch(a->a.path("readComplete").asBoolean()));
  result.put("qualification","Latest retained custody by Account, not live holdings. Compatible inventory groups are display contexts, not opening packages, governed quantities, cash security or lifecycle continuity. Market clocks never renew custody."+(underlying==null?"":" Underlying selection includes resolved source subjects only; unknown identities cannot establish absence."));
  if(JSON.writeValueAsBytes(result).length>100000)throw new IllegalStateException("Complete tactical inventory exceeds100000 bytes; narrow Account scope");return result;
 }
 private void populate(ObjectNode out,AccountDirectory.Account account,PositionSnapshot cut,String underlying,BearerAuthenticator.Principal caller,Instant now)throws Exception{
  String id=account.id();var scope=Set.of(id);var holdings=reader.page(Kind.HOLDING,scope,Map.of("snapshotId",cut.snapshotId()),"",false,200);
  if(holdings.size()>200){out.put("status","CAPACITY_UNAVAILABLE");return;}
  // Existing read-through is invoked only under its unchanged source grants/policy.
  var acquisitionWarnings=array();if(caller.hasGrant("account.orders.read:"+id))acquisitionWarnings.addAll(reader.synchronizeOrders(scope));reader.synchronize(scope);
  var positions=reader.page(Kind.POSITION,scope,Map.of("exposureStatus","OBSERVED"),"",false,200);
  if(positions.size()>200){out.put("status","CAPACITY_UNAVAILABLE");return;}
  var current=positions.stream().filter(p->Objects.equals(p.value().at("/exposure/sourceSnapshotId").asText(),cut.snapshotId())).toList();
  if(caller.hasGrant("market.read")&&caller.hasGrant("account.market.read:"+id))acquisitionWarnings.addAll(reader.synchronizeMarket(scope,current));reader.synchronize(scope);
  positions=reader.page(Kind.POSITION,scope,Map.of("exposureStatus","OBSERVED"),"",false,200);
  if(positions.size()>200){out.put("status","CAPACITY_UNAVAILABLE");return;}
  current=positions.stream().filter(p->Objects.equals(p.value().at("/exposure/sourceSnapshotId").asText(),cut.snapshotId())).toList();
  if(!new PortfolioSnapshots(repo).current(id).orElseThrow().snapshotId().equals(cut.snapshotId())){out.put("status","SOURCE_CHANGED");return;}
  var context=new PortfolioReadService.ReadContext();var sourceByKey=new HashMap<String,PositionSnapshot.Constituent>();for(var h:cut.holdings())sourceByKey.put(h.holdingId(),h);
  var rows=new LinkedHashMap<String,ObjectNode>();var leavesByHolding=new HashMap<String,ObjectNode>();var documents=new HashMap<String,Document>();
  for(var d:holdings){var h=reader.read(d,caller,now,context);h.set("identity",PortfolioInventoryIdentity.identify(h,sourceByKey.get(d.sourceKey()),account.brokerAssociation().broker()));rows.put(d.uri(),h);documents.put(d.uri(),d);}
  var reconciliation=reader.reconciliation(id,now);var balances=new HashMap<String,JsonNode>();for(var b:reconciliation.path("balances"))balances.put(b.at("/inventory/holding/href").asText(),b);
  var candidates=new LinkedHashMap<Document,List<String>>();var demand=new HashMap<String,Integer>();
  for(var p:current){var construction=repo.get(p.value().at("/currentConstruction/href").asText());if(construction.isEmpty())continue;var ls=leaves(construction.get().value().path("composition"));var claims=new ArrayList<String>();boolean exact=!ls.isEmpty();
   for(var l:ls){String ref=l.at("/allocation/holding/href").asText();var h=rows.get(ref);if(h==null||!exactQuantity(l,h)){exact=false;continue;}leavesByHolding.putIfAbsent(ref,l.deepCopy());claims.add(ref);}
   if(exact&&new HashSet<>(claims).size()==ls.size()&&ls.size()>1&&claims.stream().allMatch(ref->uniqueWholeAllocation(balances.get(ref),rows.get(ref),construction.get().uri()))){candidates.put(p,claims);claims.forEach(h->demand.merge(h,1,Integer::sum));}
  }
  var units=array();var used=new HashSet<String>();
  for(var entry:candidates.entrySet())if(entry.getValue().stream().allMatch(h->demand.get(h)==1)){
   var p=reader.tactical(entry.getKey(),caller,now,context);if(!entry.getValue().stream().allMatch(h->Objects.equals(documents.get(h).snapshot(),cut.snapshotId())))continue;
   p.set("sourceHoldings",refs(entry.getValue()));p.set("custody",obj().put("snapshotId",cut.snapshotId()));p.put("variant","OPTION_STRUCTURE");p.put("inventoryBasis","SOURCE_ASSOCIATED_POSITION");var marketClock=PortfolioMarketClock.qualify(p.path("evaluation"));if(!marketClock.isEmpty())p.set("marketClock",marketClock);
   if(matches(p,underlying))units.add(p);used.addAll(entry.getValue());
  }
  var groups=new TreeMap<String,List<ObjectNode>>();
  for(var row:rows.entrySet())if(!used.contains(row.getKey())){
   var h=row.getValue();String symbol=h.at("/identity/underlyingSymbol").asText("");String key=!symbol.isBlank()?"SYMBOL:"+symbol:h.at("/identity/variant").asText().equals("TREASURY_BILL")?"TREASURY_BILLS":"ROW:"+row.getKey();
   groups.computeIfAbsent(key,k->new ArrayList<>()).add(h);
  }
  for(var group:groups.values()){
   var unit=inventoryUnit(id,cut,group,leavesByHolding,reconciliation,caller,now,context);if(matches(unit,underlying))units.add(unit);
  }
  out.put("status","READ").put("readComplete",true);out.set("source",source(cut,holdings,now));out.set("items",units);var warnings=reader.holdingsWarnings(scope,null);warnings.addAll(acquisitionWarnings);out.set("warnings",warnings);
  if(!new PortfolioSnapshots(repo).current(id).orElseThrow().snapshotId().equals(cut.snapshotId())){out.put("status","SOURCE_CHANGED").put("readComplete",false);out.set("items",array());return;}
  // Every selected source row is displayed exactly once, irrespective of age, zero quantity or unresolved lifecycle.
  out.put("sourceHoldingCount",holdings.size());int represented=0;for(var unit:units)represented+=unit.path("sourceHoldings").size();out.put("representedHoldingCount",represented);
 }
 private ObjectNode inventoryUnit(String account,PositionSnapshot cut,List<ObjectNode> rows,Map<String,ObjectNode> existingLeaves,JsonNode reconciliation,BearerAuthenticator.Principal caller,Instant now,PortfolioReadService.ReadContext context)throws Exception{
  var n=obj().put("representation","TACTICAL_INVENTORY_GROUP").put("inventoryBasis","COMPATIBLE_SOURCE_INVENTORY").put("state","UNRESOLVED");n.set("account",link("/v2/accounts/"+account));var parts=array();var refs=array();var composition=obj().put("kind","GROUP").put("nodeId","INVENTORY_CONTEXT");var children=array();boolean evaluable=true;
  var symbols=new TreeSet<String>();boolean shares=false,shortCalls=false,termConflict=false;String variant=rows.getFirst().at("/identity/variant").asText("OTHER");
  for(var h:rows){String uri=h.at("/self/href").asText();refs.add(link(uri));var part=obj();for(String f:List.of("quantity","side","unit","sourceUnit"))if(h.has(f))part.set(f,h.path(f));part.set("holding",h.path("self"));var identity=h.path("identity").deepCopy();((ObjectNode)identity).remove(List.of("description","terms"));var emptyKeys=new ArrayList<String>();identity.fieldNames().forEachRemaining(k->{if(identity.path(k).isNull())emptyKeys.add(k);});((ObjectNode)identity).remove(emptyKeys);part.set("identity",identity);
   if(Set.of("SHARES","CASH","MONEY_MARKET").contains(h.at("/identity/variant").asText()))part.set("reportedMarketValue",compactMetric(h.path("reportedMarketValue")));
   if(cut.observation()!=null)for(String f:List.of("observedAt","observationDate","receivedAt"))if(h.hasNonNull(f))part.set(f,h.path(f));
   String symbol=h.at("/identity/underlyingSymbol").asText("");if(!symbol.isBlank())symbols.add(symbol);String kind=h.at("/identity/variant").asText();shares|=kind.equals("SHARES");var leaf=existingLeaves.get(uri);if(leaf==null){leaf=fallbackLeaf(h,now);if(caller.hasGrant("reference.read")&&leaf.path("kind").asText().equals("OPTION")){var reference=repo.get(h.at("/instrument/href").asText());if(reference.isPresent()&&reference.get().value().path("option").isObject()){leaf.set("terms",reference.get().value().path("option").deepCopy());var subject=repo.get(leaf.at("/terms/underlying/href").asText());if(subject.isPresent())((ObjectNode)leaf.path("terms")).put("underlyingSymbol",subject.get().value().path("symbol").asText());}}}else leaf=leaf.deepCopy();
   // A display compatibility context never inherits lifecycle-attributed entry costs from a fallback Position.
   ((ObjectNode)leaf.path("allocation")).set("basis",unknown("MONEY",now.toString(),"BASIS_ATTRIBUTION_UNKNOWN"));
   if(h.at("/identity/terms").isObject()){var terms=(ObjectNode)leaf.path("terms");if(terms.hasNonNull("underlyingSymbol")&&!terms.path("underlyingSymbol").asText().equals(symbol))termConflict=true;for(String f:List.of("right","strike","expiration")){var next=h.at("/identity/terms/"+f);var before=terms.path(f);boolean known=!before.isMissingNode()&&!before.isNull()&&!before.asText().equals("UNKNOWN");if(known&&(f.equals("strike")?number(before).compareTo(number(next))!=0:!before.equals(next)))termConflict=true;terms.set(f,next);}terms.put("underlyingSymbol",symbol);if(termConflict)terms.put("qualification","CONFLICT").put("payoffApplicability","UNKNOWN");}
   if(h.at("/identity/basis").asText().equals("CONFLICTING_SOURCE_IDENTITY")){termConflict=true;if(leaf.path("terms").isObject())((ObjectNode)leaf.path("terms")).put("qualification","CONFLICT").put("payoffApplicability","UNKNOWN");}
   if(!caller.hasGrant("reference.read")&&leaf.path("terms").isObject())((ObjectNode)leaf.path("terms")).remove("terminalSettlement");
   if(leaf.path("terms").isObject())part.set("terms",compactTerms(leaf.path("terms")));shortCalls|=h.path("side").asText().equals("SHORT")&&part.at("/terms/right").asText().equals("CALL");
   if(number(h.path("quantity"))==null)evaluable=false;children.add(leaf);parts.add(part);
  }
  if(shares&&shortCalls)variant="SHARES_AND_CALLS";else if(rows.size()>1&&variant.equals("OPTION"))variant="OPTIONS_CONTEXT";else if(rows.size()>1&&variant.equals("TREASURY_BILL"))variant="TREASURY_BILLS";
  n.put("variant",variant);String title=symbols.isEmpty()?rows.getFirst().at("/identity/label").asText("Instrument identity unavailable"):String.join(" / ",symbols);if(variant.equals("TREASURY_BILLS"))title="US Treasury bills";n.put("title",title);
  var subjects=array();for(String s:symbols)subjects.add(obj().put("symbol",s).put("identityBasis","BROKER_SOURCE_IDENTITY"));n.set("underlyings",subjects);n.set("constituents",parts);n.set("sourceHoldings",refs);n.set("custody",obj().put("snapshotId",cut.snapshotId()));
  String name=switch(variant){case "SHARES_AND_CALLS"->"Shares + short calls";case "SHARES"->"Shares";case "OPTION"->optionLabel(parts.get(0));case "OPTIONS_CONTEXT"->"Options · association unresolved";case "TREASURY_BILLS","TREASURY_BILL"->"Treasury bills";case "MONEY_MARKET"->"Cash fund · reported value";case "CASH"->"Reported cash";default->"Reported instrument";};
  n.set("structure",obj().put("name",name).put("status",rows.size()>1?"COMPATIBLE_INVENTORY":"OBSERVED_INVENTORY").set("authority",obj().put("basis","ACCOUNT_AND_SOURCE_CUT_COMPATIBILITY").put("status","QUALIFIED").put("qualification","Compatible source inventory only; trade lifecycle and coverage unverified.")));
  var coverage=array();var sourceUris=new HashSet<String>();for(var ref:refs)sourceUris.add(ref.path("href").asText());
  for(var assessment:reconciliation.path("coverageAssessments"))if(assessment.path("unit").asText().equals("SHARE")){boolean relevant=false;for(var support:assessment.path("supportHoldings"))if(sourceUris.contains(support.path("href").asText()))relevant=true;if(relevant){var copied=obj();for(String f:List.of("status","unit","eligibleQuantity","requiredQuantity","reservationStatus","selection"))if(assessment.has(f))copied.set(f,assessment.path(f));copied.put("qualification","Aggregate reported shares against observed supported calls only; not a reserved lot, available shares, verified lifecycle or complete current Account assertion.");coverage.add(copied);}}
  if(!coverage.isEmpty())n.set("shareCoverage",coverage);
  composition.set("children",children);var construction=obj();construction.set("composition",composition);construction.set("evidence",array());
  n.set("evaluation",evaluable?compactEvaluation(reader.inventoryEvaluation(account,construction,caller,now,context)):obj().put("evaluatedAt",now.toString()));n.set("warningCodes",termConflict?array().add("ASSOCIATION_UNRESOLVED").add("INCOMPATIBLE_CONTRACT_TERMS"):array().add("ASSOCIATION_UNRESOLVED"));
  if(caller.hasGrant("reference.read"))PortfolioMoneyness.apply((ObjectNode)n.path("evaluation"),construction);
  var strikeMarkers=array();for(var part:parts)if(part.path("terms").isObject()&&!part.at("/terms/qualification").asText().equals("CONFLICT")&&part.at("/terms/strike").isTextual())strikeMarkers.add(obj().put("strike",part.at("/terms/strike").asText()).put("right",part.at("/terms/right").asText()).put("side",part.path("side").asText()).put("expiration",part.at("/terms/expiration").asText()));n.set("strikeConfiguration",strikeMarkers);var marketClock=PortfolioMarketClock.qualify(n.path("evaluation"));if(!marketClock.isEmpty())n.set("marketClock",marketClock);
  return n;
 }
 private static ObjectNode compactMetric(JsonNode source){var n=obj();for(String f:List.of("value","unit","currency","status","origin","method","asOf","assumptions","warningCodes"))if(source.has(f))n.set(f,source.path(f));return n;}
 private static ObjectNode compactEvaluation(ObjectNode e){
  var n=obj();n.set("evaluatedAt",e.path("evaluatedAt"));
  for(String name:List.of("spot","marketValue"))if(established(e.path(name))){var m=obj();for(String f:List.of("value","unit","currency","status","origin","asOf","method","assumptions","warningCodes"))if(e.path(name).has(f))m.set(f,e.path(name).path(f));n.set(name,m);}
  if(established(e.at("/timeline/remainingDays"))){var t=obj();for(String f:List.of("expiration","calendarZone"))t.set(f,e.path("timeline").path(f));t.set("remainingDays",compactMetric(e.at("/timeline/remainingDays")));n.set("timeline",t);}
  if(e.at("/payoff/status").asText().equals("QUALIFIED")){var p=obj();for(String f:List.of("status","geometry","warningCodes"))p.set(f,e.path("payoff").path(f));n.set("payoff",p);var range=obj();for(String f:List.of("status","kind","lower","upper","currency","warningCodes"))range.set(f,e.path("range").path(f));n.set("range",range);n.put("spotRegion",PortfolioMath.spotRegion(e));PortfolioPayoffPlot.apply(n);}
  if(n.has("spot")||n.has("marketValue")){n.set("freshness",e.path("freshness"));n.set("oldestMaterialObservationAt",e.path("oldestMaterialObservationAt"));}return n;
 }
 private static ObjectNode fallbackLeaf(ObjectNode h,Instant now){
  String variant=h.at("/identity/variant").asText();String kind=variant.equals("SHARES")&&h.path("side").asText().equals("LONG")?"LONG_SHARES":variant.equals("OPTION")?"OPTION":variant.equals("CASH")?"CASH":"OTHER";
  var n=obj().put("nodeId",h.path("id").asText()).put("kind",kind).put("side",h.path("side").asText()).put("unit",h.path("unit").asText());n.set("quantity",h.path("quantity"));n.set("instrument",h.path("instrument"));n.set("currency",h.at("/reportedMarketValue/currency"));var allocation=obj();allocation.set("basis",unknown("MONEY",now.toString(),"BASIS_ATTRIBUTION_UNKNOWN"));allocation.set("inventory",obj().set("evidence",h.path("evidence")));n.set("allocation",allocation);n.set("economics",obj().set("fees",unknown("MONEY",now.toString(),"HISTORY_INCOMPLETE")));
  if(kind.equals("OPTION")){var terms=obj().put("qualification","INCOMPLETE").put("payoffApplicability","UNKNOWN");terms.set("currency",h.at("/reportedMarketValue/currency"));terms.set("evidence",h.path("evidence"));n.set("terms",terms);}return n;
 }
 private static ObjectNode compactTerms(JsonNode t){var n=obj();for(String f:List.of("underlyingSymbol","right","strike","expiration","currency","multiplier","qualification","adjustment","settlement","terminalSettlement"))if(t.has(f)){if(f.equals("terminalSettlement")){var compact=((ObjectNode)t.path(f)).deepCopy();compact.remove("evidence");n.set(f,compact);}else n.set(f,t.path(f));}return n;}
 private static String optionLabel(JsonNode p){String right=p.at("/terms/right").asText();return (p.path("side").asText().equals("SHORT")?"Short ":"Long ")+(right.equals("PUT")?"put":right.equals("CALL")?"call":"option");}
 private static boolean exactQuantity(JsonNode leaf,JsonNode holding){var a=number(leaf.path("quantity"));var b=number(holding.path("quantity"));return a!=null&&b!=null&&a.compareTo(b)==0&&leaf.path("side").equals(holding.path("side"))&&leaf.path("unit").equals(holding.path("unit"))&&leaf.path("instrument").equals(holding.path("instrument"))&&leaf.at("/allocation/inventory/account").equals(holding.path("account"));}
 private static boolean uniqueWholeAllocation(JsonNode balance,JsonNode holding,String construction){if(balance==null||!balance.path("status").asText().equals("RECONCILED")||number(balance.path("allocated"))==null||number(holding.path("quantity"))==null||number(balance.path("allocated")).compareTo(number(holding.path("quantity")))!=0||number(balance.path("residual"))==null||number(balance.path("residual")).signum()!=0)return false;return balance.path("currentConstructions").size()==1&&balance.at("/currentConstructions/0/href").asText().equals(construction);}
 private static ArrayNode refs(List<String> values){var result=array();values.forEach(v->result.add(link(v)));return result;}
 private static boolean matches(JsonNode item,String symbol){if(symbol==null)return true;for(var s:item.path("underlyings"))if(s.path("symbol").asText().equals(symbol))return true;for(var s:item.path("constituents"))if(s.path("symbol").asText().equals(symbol)||s.at("/identity/symbol").asText().equals(symbol))return true;return false;}
 private static ObjectNode source(PositionSnapshot cut,List<Document> holdings,Instant now){var n=obj().put("snapshotId",cut.snapshotId()).put("receivedAt",cut.recordedAt()).put("currentness","NOT_ESTABLISHED").put("dateBasis",cut.observation()==null?"SOURCE_EXPORT_DAY":"BACKEND_RECEIPT_DAY");if(cut.observation()==null){n.put("observationDate",cut.evidenceDate());long age=ChronoUnit.DAYS.between(LocalDate.parse(cut.evidenceDate()),now.atZone(ZoneId.of("America/New_York")).toLocalDate());if(age<0)n.putNull("ageDays").put("sourceClockWarning","FUTURE_SOURCE_DAY");else n.put("ageDays",age);n.put("ageReferenceZone","America/New_York");}else n.putNull("observationDate").putNull("ageDays");n.put("coverage",cut.excludedNonPositionRows()>0||cut.cashObservation()!=null&&!cut.cashObservation().status().equals("OBSERVED")||holdings.stream().anyMatch(h->!h.value().path("snapshotCoverage").asText().equals("COMPLETE_REPORTED"))?"PARTIAL":"COMPLETE_REPORTED");return n;}
}
