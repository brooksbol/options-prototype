package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.*;
import org.springframework.stereotype.Component;
import java.math.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.regex.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Reuses admitted sources. No provider calls, inferred openings, fake executions or lost holdings. */
@Component
public final class PortfolioSources {
 private final PortfolioRepository repository;private final ObjectMapper mapper;private final AccountDirectory accounts;
 public PortfolioSources(PortfolioRepository repository,ObjectMapper mapper,AccountDirectory accounts){this.repository=repository;this.mapper=mapper;this.accounts=accounts;}
 public synchronized void refresh(Set<String> scope)throws Exception {
  try(var c=repository.connection()){
   c.setAutoCommit(false);
   try{
    var source=getClass().getResourceAsStream("/portfolio/construction-models.json");if(source==null)throw new IllegalStateException("Model catalog absent");var catalog=mapper.readTree(source);
    for(var n:catalog.path("families"))repository.put(c,new Document(Kind.MODEL,n.at("/self/href").asText(),null,(ObjectNode)n,null,null));
    for(var n:catalog.path("versions"))repository.put(c,new Document(Kind.MODEL_VERSION,n.at("/self/href").asText(),null,(ObjectNode)n,null,null));
    for(String account:new TreeSet<>(scope)){
     var owner=accounts.get(account);if(owner.isEmpty())continue;
     try(var q=c.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? ORDER BY evidence_date,recorded_at,snapshot_id")){
      q.setString(1,account);try(var r=q.executeQuery()){while(r.next()){
       var snapshot=mapper.readValue(r.getString(1),PositionSnapshot.class);String additional="fidelity-additional-custody:v1:"+snapshot.snapshotId();if(snapshot.observation()==null&&!repository.admitted(c,account,additional)){new PortfolioFidelityAdditionalCustody(repository).admit(c,snapshot);repository.markAdmitted(c,account,additional);}if(repository.admitted(c,account,snapshot.snapshotId()))continue;
       admit(c,snapshot,owner.get());repository.markAdmitted(c,account,snapshot.snapshotId());
      }}
     }
     try(var oq=c.prepareStatement("SELECT DISTINCT a.artifact_id,a.received_at FROM brokerage_artifact a JOIN brokerage_import i ON a.account=i.account AND a.artifact_id=i.artifact_id WHERE a.account=? AND i.file_type='API_ORDERS' AND i.status='ACCEPTED' ORDER BY a.received_at,a.artifact_id")){oq.setString(1,account);try(var orders=oq.executeQuery()){while(orders.next()){String artifact=orders.getString("artifact_id"),admission="orders:"+artifact;if(!repository.admitted(c,account,admission)){new PortfolioOrderSources(repository).admit(c,owner.get(),artifact,true);repository.markAdmitted(c,account,admission);}}}}
     new PortfolioFillEvidence(repository).refresh(c,owner.get());new PortfolioReferenceEnrichment(repository).apply(c,account,Instant.now());
    }new PortfolioMarketSources(repository).refresh(c);c.commit();
   }catch(Exception e){c.rollback();throw e;}
  }
 }
 private void admit(java.sql.Connection c,PositionSnapshot snapshot,AccountDirectory.Account account)throws Exception {
  var holds=new LinkedHashMap<String,ObjectNode>();var leaves=new LinkedHashMap<String,ObjectNode>();var broker=account.brokerAssociation().broker();String now=Instant.now().toString();
  var market=snapshot.observation()==null?PositionMarketEvidence.read(c,snapshot,mapper):Map.<String,PositionMarketEvidence.Facts>of();
  for(var h:snapshot.holdings()){
   boolean option=h.kind().equals("Options"),shares=Set.of("Stocks","ETFs").contains(h.kind()),cash=h.kind().equals("Cash");
   String unit=option?"CONTRACT":shares?"SHARE":cash?"MONEY":"SOURCE_UNIT",side=h.quantity().signum()<0?"SHORT":"LONG";
   String instrumentId=id("instrument:"+broker+":"+h.contract());String instrumentUri="/v2/instruments/"+instrumentId;
   var instrument=obj().put("id",instrumentId).put("kind",option?"OPTION":shares?"EQUITY":"OTHER").put("symbol",h.contract()).put("currency","USD");instrument.set("self",link(instrumentUri));instrument.set("brokerAliases",array().add(obj().put("broker",broker).put("environment","PRODUCTION").put("identifier",h.contract())));instrument.set("evidence",array());instrument.set("warnings",array());instrument.putNull("option");
   ObjectNode terms=null;if(option){terms=partialTerms(h);enrichReportedTerms(c,snapshot,h,terms);/* Account-supplied terms remain private on constituents. */}
   if(repository.get(c,instrumentUri).isEmpty())repository.put(c,new Document(Kind.INSTRUMENT,instrumentUri,null,instrument,null,h.contract()));
   String holdId=id("holding:"+snapshot.account()+":"+snapshot.snapshotId()+":"+h.holdingId());String holdUri="/v2/holdings/"+holdId;
   var es=array();if(snapshot.artifactId()!=null)for(int row:h.sourceRows()){var evidence=source(snapshot.account(),snapshot.artifactId(),broker.equals("TASTYTRADE")?"/data/items/"+(row-1):Integer.toString(row),broker.equals("TASTYTRADE")?null:snapshot.evidenceDate(),snapshot.recordedAt(),broker);evidence.put("requiredCapability","account.holdings.read:"+snapshot.account());if(broker.equals("TASTYTRADE"))evidence.put("timeAuthority","BACKEND_RECEIPT");es.add(evidence);}
   var holding=obj().put("id",holdId).put("snapshotId",snapshot.snapshotId()).put("snapshotCoverage",snapshot.observation()==null&&snapshot.excludedNonPositionRows()>0?"PARTIAL":"COMPLETE_REPORTED").put("side",side).put("quantity",decimal(h.quantity().abs())).put("unit",unit).put("kind",cash?"CASH":"SECURITY");holding.set("self",link(holdUri));holding.set("account",link("/v2/accounts/"+snapshot.account()));if(cash)holding.putNull("instrument");else holding.set("instrument",link(instrumentUri));holding.set("sourceInstrument",obj().put("broker",broker).put("environment","PRODUCTION").put("identifier",h.contract()));holding.putNull("observedAt");if(broker.equals("TASTYTRADE"))holding.putNull("observationDate");else holding.put("observationDate",snapshot.evidenceDate());holding.put("receivedAt",snapshot.recordedAt());holding.set("evidence",es);holding.set("warnings",snapshot.observation()==null&&snapshot.excludedNonPositionRows()>0?array().add(warning("TERMS_UNAVAILABLE","/snapshotCoverage","Supported reported custody rows remain inspectable with their originals.","Some source rows are outside the admitted quantity profile; do not infer complete Account financial truth.")):array());
   if(unit.equals("SOURCE_UNIT"))holding.put("sourceUnit",h.kind()+" / source quantity, unit unspecified");
   holding.set("reportedMarketValue",reported(h.marketValue(),null,es,"BROKER_REPORTED_MARKET_VALUE"));holding.set("reportedOpenPl",reported(h.openPl(),null,es,"BROKER_REPORTED_PL_UNVERIFIED_DIALECT"));holding.set("reportedCapitalRequirement",unknown("MONEY",now,"TERMS_UNAVAILABLE"));
   // Reuse the accepted same-export-day Option Summary dialect. A reported requirement
   // is neither a derived margin feature nor broker-reserved cash. Never attribute an
   // aggregate figure to multiple custody rows or to a different quantity.
   var quote=market.get(h.contract());
   if(option&&quote!=null&&quote.requirement()!=null&&quote.requirement().signum()>=0&&quote.reportedQuantity()!=null&&quote.reportedQuantity().compareTo(h.quantity())==0&&snapshot.holdings().stream().filter(other->other.contract().equals(h.contract())).count()==1){
    var capitalEvidence=array();String received;try(var q=c.prepareStatement("SELECT received_at FROM brokerage_artifact WHERE account=? AND artifact_id=?")){q.setString(1,snapshot.account());q.setString(2,quote.provenance().artifactId());try(var rows=q.executeQuery()){if(!rows.next())throw new IllegalArgumentException("capital original missing");received=rows.getString(1);}}
    for(int row:quote.provenance().sourceRows()){var ref=source(snapshot.account(),quote.provenance().artifactId(),Integer.toString(row),quote.provenance().evidenceDate(),received,"FIDELITY");ref.put("requiredCapability","account.holdings.read:"+snapshot.account());capitalEvidence.add(ref);}
    var capital=reported(quote.requirement(),null,capitalEvidence,"FIDELITY_OPTION_SUMMARY_REPORTED_REQUIREMENT_SAME_DAY_EXACT_QUANTITY");((ArrayNode)capital.path("assumptions")).add("Source-labeled capital requirement only. Same export day and exact observed quantity; no intraday timestamp, margin calculation, reservation, allocation or buying power claim.");holding.set("reportedCapitalRequirement",capital);
   }
   repository.put(c,new Document(Kind.HOLDING,holdUri,snapshot.account(),holding,snapshot.snapshotId(),h.holdingId()));holds.put(h.holdingId(),holding);
   var leaf=obj().put("nodeId",h.holdingId()).put("kind",cash?"CASH":shares&&side.equals("LONG")?"LONG_SHARES":option?"OPTION":"OTHER").put("side",side).put("quantity",decimal(h.quantity().abs())).put("unit",unit).put("currency","USD");
   leaf.set("instrument",link(instrumentUri));if(cash)leaf.remove("instrument");if(option)leaf.set("terms",terms.deepCopy().set("evidence",es.deepCopy()));if(leaf.path("kind").asText().equals("OTHER")){leaf.put("sourceUnit",unit).put("unit","SOURCE_UNIT");}
   var inventory=obj().put("key",h.holdingId()).put("side",side).put("quantity",decimal(h.quantity().abs())).put("unit",unit);inventory.set("account",link("/v2/accounts/"+snapshot.account()));inventory.set("instrument",cash?NullNode.instance:link(instrumentUri));if(unit.equals("MONEY"))inventory.put("currency","USD");else inventory.putNull("currency");if(unit.equals("SOURCE_UNIT"))inventory.put("sourceUnit",h.kind()+" / source quantity, unit unspecified");inventory.set("evidence",es);inventory.set("holding",link(holdUri));
   var allocation=obj().put("quantity",decimal(h.quantity().abs())).put("basisMethod",cash?"BROKER_ATTRIBUTED":"UNKNOWN").put("availability","UNKNOWN").put("globalStatus","UNKNOWN");allocation.set("inventory",inventory);allocation.set("holding",link(holdUri));allocation.set("basis",cash?metric(h.quantity().abs(),"MONEY","USD",now,"CASH_PRINCIPAL","QUALIFIED",es):unknown("MONEY",now,"BASIS_ATTRIBUTION_UNKNOWN"));allocation.set("authority",authority(snapshot.account(),"allocation:"+holdId,"BROKER_HOLDING_OBSERVATION","QUALIFIED",es,List.of(holdUri),"Observed custody quantity; economic occurrence continuity and discretionary basis are not established."));leaf.set("allocation",allocation);
   var econ=obj();econ.set("openingCashFlow",cash?na("MONEY",now):unknown("MONEY",now,"OPENING_FILLS_UNAVAILABLE"));econ.set("reportedMarketValue",holding.get("reportedMarketValue"));econ.set("reportedOpenPl",holding.get("reportedOpenPl"));econ.set("reportedCapitalRequirement",holding.get("reportedCapitalRequirement"));econ.set("fees",unknown("MONEY",now,"HISTORY_INCOMPLETE"));leaf.set("economics",econ);if(h.quantity().signum()!=0)leaves.put(h.holdingId(),leaf);
  }
  // Existing explicit snapshot associations are evidence of this composition only, never a Program or universal lifecycle rule.
  var assigned=new HashSet<String>();
  for(var association:snapshot.associations()){
   var members=new ArrayList<ObjectNode>();for(String h:association.holdingIds()){var leaf=leaves.get(h);if(leaf==null||!assigned.add(h))throw new IllegalArgumentException("unsupported or duplicate association");members.add(leaf);}
   position(c,snapshot,members,association.positionId(),now);
  }
  for(var entry:leaves.entrySet())if(!assigned.contains(entry.getKey()))position(c,snapshot,List.of(entry.getValue()),entry.getKey(),now);
 }
 private void position(java.sql.Connection connection,PositionSnapshot snapshot,List<ObjectNode> members,String sourceKey,String now)throws Exception {
  // Generated identity is persisted independently. Source series remains an attribute, not the UUID.
  String guid=UUID.randomUUID().toString(),uri="/v2/positions/"+guid,cid=UUID.randomUUID().toString(),curi="/v2/constructions/"+cid;var es=array();for(var leaf:members)for(var ev:leaf.at("/allocation/inventory/evidence"))es.add(ev);
  var c=obj().put("id",cid).put("createdAt",now).put("changeKind","INITIAL").putNull("predecessor");c.set("self",link(curi));c.set("account",link("/v2/accounts/"+snapshot.account()));c.set("position",link(uri));var group=obj().put("kind","GROUP").put("nodeId","ROOT").putNull("modelVersion");var children=array();members.forEach(children::add);group.set("children",children);c.set("composition",group);
  var recognition=obj().put("status","UNCLASSIFIED").putNull("modelVersion");recognition.set("candidateModels",array());recognition.set("reasonCodes",array().add("UNCLASSIFIED_CONSTRUCTION"));recognition.set("evidence",es);recognition.set("authority",authority(snapshot.account(),cid,"BROKER_HOLDING_OBSERVATION","QUALIFIED",es,List.of(curi),"Unclassified constituent preservation; no broker package allocation or continuity asserted."));c.set("recognition",recognition);c.set("relationships",array());c.set("evidence",es);c.set("warnings",array().add(warning("UNCLASSIFIED_CONSTRUCTION","/recognition","Held constituents retained.","Named composition and authoritative occurrence continuity are not established.")));
  if(members.size()==1&&!es.isEmpty())for(var model:mapper.readTree(getClass().getResourceAsStream("/portfolio/construction-models.json")).path("versions"))if(PortfolioRecognition.matches(c,model,new PortfolioRecognition.Admission(false,false,false))){recognition.put("status","VALIDATED");recognition.set("modelVersion",model.path("self"));recognition.set("reasonCodes",array());c.set("warnings",array());break;}
  repository.put(connection,new Document(Kind.CONSTRUCTION,curi,snapshot.account(),c,snapshot.snapshotId(),sourceKey));
  var p=obj().put("id",guid).put("state","UNRESOLVED");p.set("self",link(uri));p.set("account",link("/v2/accounts/"+snapshot.account()));p.set("currentConstruction",link(curi));var sourceIdentifiers=array();var sourceSeries=new TreeSet<String>();for(var member:members)for(var holding:snapshot.holdings())if(holding.holdingId().equals(member.path("nodeId").asText()))sourceSeries.add(holding.contract());for(String series:sourceSeries)sourceIdentifiers.add(obj().put("broker",snapshot.observation()==null?"FIDELITY":snapshot.observation().broker()).put("environment","PRODUCTION").put("identifier",series));p.set("sourceIdentifiers",sourceIdentifiers);p.putNull("orders");p.set("audit",link(uri+"/audit"));var state=obj().put("status","UNRESOLVED").putNull("establishedAt").put("completeness","UNKNOWN");state.set("evidence",es);p.set("stateEvidence",state);
  var alloc=obj().put("status","UNKNOWN");alloc.set("reconciliation",link("/v2/accounts/"+snapshot.account()+"/inventory-reconciliation"));alloc.set("holdingSnapshotIds",array().add(snapshot.snapshotId()));alloc.set("affectedHoldingIds",array());alloc.set("evidence",es);p.set("allocation",alloc);p.set("evaluation",PortfolioMath.evaluate(c,Map.of(),Instant.parse(now)));p.set("warnings",array());qualify(p);repository.put(connection,new Document(Kind.POSITION,uri,snapshot.account(),p,snapshot.snapshotId(),sourceKey));
 }
 public static void qualify(ObjectNode position){
  var targets=new TreeMap<String,Set<String>>();collect(position.path("evaluation"),"/evaluation",targets);var warnings=(ArrayNode)position.path("warnings");var present=new HashSet<String>();for(var warning:warnings)present.add(warning.path("code").asText());for(var entry:targets.entrySet())if(present.add(entry.getKey())){var w=warning(entry.getKey(),"/evaluation","Authorized source constituents and separately reported financial facts remain inspectable.","The identified result retains its evidence qualification.");var affected=array();entry.getValue().forEach(affected::add);w.set("affected",affected);var remediation=obj().put("action",switch(entry.getKey()){case "INVENTORY_OVERALLOCATED","HOLDING_RECONCILIATION_CONFLICT","COVERAGE_INSUFFICIENT"->"RECONCILE_ALLOCATIONS";case "ASSOCIATION_UNRESOLVED","AMBIGUOUS_ORDER_ASSOCIATION"->"REVIEW_ASSOCIATION";case "TERMS_UNAVAILABLE","INCOMPATIBLE_CONTRACT_TERMS"->"SUPPLY_TERMS";case "STALE_MARKET_OBSERVATION","MARKET_OBSERVATION_MISSING"->"REFRESH_SOURCE";case "OPENING_FILLS_UNAVAILABLE","HISTORICAL_OPTION_QUOTE_MISSING","HISTORY_INCOMPLETE","BASIS_ATTRIBUTION_UNKNOWN"->"IMPORT_SOURCE";default->"NO_KNOWN_REMEDY";}).put("description",switch(entry.getKey()){case "HISTORICAL_OPTION_QUOTE_MISSING"->"Provide the required historical observation; a current quote cannot replace it.";case "OPENING_FILLS_UNAVAILABLE","HISTORY_INCOMPLETE","BASIS_ATTRIBUTION_UNKNOWN"->"Supply supported historical activity and documented cost attribution; holdings or current marks do not establish missing events.";case "ASSOCIATION_UNRESOLVED","AMBIGUOUS_ORDER_ASSOCIATION"->"Inspect existing brokerage evidence; structural similarity alone does not prove the relationship.";case "INVENTORY_OVERALLOCATED","HOLDING_RECONCILIATION_CONFLICT","COVERAGE_INSUFFICIENT"->"Inspect Account reconciliation and refresh source evidence. Agreement with source quantities may indicate a backend allocation defect.";case "TERMS_UNAVAILABLE","INCOMPATIBLE_CONTRACT_TERMS"->"Supply authoritative contract terms, including multiplier, currency and deliverable.";case "STALE_MARKET_OBSERVATION","MARKET_OBSERVATION_MISSING"->"Obtain a newer authorized observation for this instrument; refresh cannot create historical evidence.";default->"No supported source or calculation remedy is currently established.";}).putNull("capability").putNull("requiredGrant");w.set("remediation",array().add(remediation));warnings.add(w);}
 }
 private static void collect(JsonNode node,String pointer,Map<String,Set<String>> targets){for(var code:node.path("warningCodes"))targets.computeIfAbsent(code.asText(),key->new TreeSet<>()).add(pointer);if(node.isObject()){var fields=node.fields();while(fields.hasNext()){var field=fields.next();if(field.getValue().isContainerNode())collect(field.getValue(),pointer+"/"+field.getKey().replace("~","~0").replace("/","~1"),targets);}}else if(node.isArray())for(int i=0;i<node.size();i++)if(node.get(i).isContainerNode())collect(node.get(i),pointer+"/"+i,targets);}
 private ObjectNode reported(BigDecimal amount,String at,ArrayNode evidence,String method){if(amount==null||evidence.isEmpty())return unknown("MONEY",at,"BROKER_EVALUATION_BASIS_UNVERIFIED");var m=metric(amount,"MONEY","USD",at,method,"QUALIFIED",evidence);m.put("origin","BROKER_REPORTED");return m;}
 private ObjectNode partialTerms(PositionSnapshot.Constituent h){
  var t=obj().putNull("underlying").put("right","UNKNOWN").putNull("strike").put("currency","USD");if(h.expiration()==null)t.putNull("expiration");else t.put("expiration",h.expiration());t.putNull("multiplier").put("exerciseStyle","UNKNOWN").put("settlement","UNKNOWN").put("adjustment","UNKNOWN").put("payoffApplicability","UNKNOWN").put("qualification","INCOMPLETE");t.set("deliverable",array());t.set("evidence",array());var match=Pattern.compile(".*?(\\d{6})([CP])(\\d+(?:\\.\\d+)?)$").matcher(h.contract().strip());if(match.matches()){t.put("right",match.group(2).equals("C")?"CALL":"PUT");var strike=new BigDecimal(match.group(3));if(!h.contract().startsWith("-"))strike=strike.movePointLeft(3);t.put("strike",decimal(strike));}return t;
 }
 private void enrichReportedTerms(java.sql.Connection connection,PositionSnapshot snapshot,PositionSnapshot.Constituent holding,ObjectNode terms)throws Exception {
  if(snapshot.observation()==null||!snapshot.observation().broker().equals("TASTYTRADE")||snapshot.artifactId()==null)return;
  try(var q=connection.prepareStatement("SELECT payload FROM brokerage_artifact WHERE account=? AND artifact_id=?")){
   q.setString(1,snapshot.account());q.setString(2,snapshot.artifactId());try(var rows=q.executeQuery()){if(!rows.next())throw new IllegalArgumentException("original source missing");var root=JSON.readTree(rows.getBytes(1));for(var raw:root.at("/data/items"))if(raw.path("symbol").asText().equals(holding.contract())&&raw.path("account-number").asText().equals(snapshot.brokerAccount())){
    if(raw.path("multiplier").isNumber()||raw.path("multiplier").isTextual()){var multiplier=new BigDecimal(raw.path("multiplier").asText());if(multiplier.signum()>0)terms.put("multiplier",decimal(multiplier));}
    String underlying=raw.path("underlying-symbol").asText();if(!underlying.isBlank()){
     String guid=id("instrument:TASTYTRADE:"+underlying),uri="/v2/instruments/"+guid;var instrument=obj().put("id",guid).put("kind","EQUITY").put("symbol",underlying).put("currency","USD").putNull("option");instrument.set("self",link(uri));instrument.set("brokerAliases",array().add(obj().put("broker","TASTYTRADE").put("environment",snapshot.observation().environment()).put("identifier",underlying)));instrument.set("evidence",array());instrument.set("warnings",array());if(repository.get(connection,uri).isEmpty())repository.put(connection,new Document(Kind.INSTRUMENT,uri,null,instrument,null,underlying));terms.set("underlying",link(uri));
    }
   }}
  }
 }
 public static ObjectNode authority(String account,String claim,String basis,String status,JsonNode evidence,List<String> subjects,String qualification){var a=obj().put("claimId",claim).put("basis",basis).put("status",status).put("qualification",qualification);a.set("account",link("/v2/accounts/"+account));var ss=array();subjects.forEach(h->ss.add(link(h)));a.set("subjects",ss);a.set("evidence",evidence.deepCopy());return a;}
 private static String id(String key){return UUID.nameUUIDFromBytes(key.getBytes(StandardCharsets.UTF_8)).toString();}
}
