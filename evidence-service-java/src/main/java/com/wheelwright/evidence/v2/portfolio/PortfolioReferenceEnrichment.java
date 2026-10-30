package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.sql.Connection;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** New immutable interpretation of unchanged custody, not an inferred opening/closing or association. */
public final class PortfolioReferenceEnrichment {
 private final PortfolioRepository repo;
 public PortfolioReferenceEnrichment(PortfolioRepository repo){this.repo=repo;}
 public void apply(Connection c,String account,Instant now)throws Exception{
  var latest=new PortfolioSnapshots(repo).current(account);if(latest.isEmpty())return;var definitions=new LinkedHashMap<String,JsonNode>();for(var model:repo.list(c,Kind.MODEL_VERSION,Set.of()))definitions.put(model.uri(),model.value());
  for(var position:repo.list(c,Kind.POSITION,Set.of(account))){
   if(position.value().path("state").asText().equals("CLOSED")||!Objects.equals(position.snapshot(),latest.get().snapshotId()))continue;
   var old=repo.get(c,position.value().at("/currentConstruction/href").asText()).orElseThrow();var value=old.value().deepCopy();boolean changed=false;
   for(var leaf:leaves(value.path("composition")))if(leaf.path("kind").asText().equals("OPTION")){
    var instrument=repo.get(c,leaf.at("/instrument/href").asText());if(instrument.isEmpty()||!instrument.get().value().path("option").isObject())continue;
    var reference=instrument.get().value().path("option");var before=(ObjectNode)leaf.path("terms");var after=before.deepCopy();boolean conflict=reference.path("qualification").asText().equals("CONFLICT");
    for(String field:List.of("underlying","right","strike","expiration","currency","multiplier","exerciseStyle","settlement","adjustment","deliverable","terminalSettlement")){
     var next=reference.path(field);var previous=before.path(field);if(!known(next))continue;
     if(known(previous)&&!equal(field,next,previous)){conflict=true;continue;}after.set(field,next.deepCopy());
    }
    var multiplier=number(after.path("multiplier"));var delivered=number(after.at("/deliverable/0/quantity"));boolean standard=!conflict&&after.path("adjustment").asText().equals("STANDARD")&&after.path("settlement").asText().equals("PHYSICAL")&&after.path("deliverable").size()==1&&after.at("/deliverable/0/kind").asText().equals("SHARES")&&after.at("/deliverable/0/instrument/href").equals(after.at("/underlying/href"))&&multiplier!=null&&multiplier.signum()>0&&delivered!=null&&multiplier.compareTo(delivered)==0&&known(after.path("underlying"))&&known(after.path("expiration"))&&known(after.path("strike"))&&Set.of("CALL","PUT").contains(after.path("right").asText());
    after.put("qualification",conflict?"CONFLICT":standard?"QUALIFIED":"INCOMPLETE").put("payoffApplicability",standard?"STANDARD_EQUITY_INTRINSIC":after.path("adjustment").asText().equals("ADJUSTED")?"EXPLICIT_DELIVERABLE_REQUIRED":"UNKNOWN");
    if(!withoutEvidence(after).equals(withoutEvidence(before))){for(var ref:reference.path("evidence"))((ArrayNode)after.path("evidence")).add(ref.deepCopy());PortfolioTerminalSettlement.qualify(after);leaf.set("terms",after);changed=true;if(conflict)((ArrayNode)value.path("warnings")).add(warning("INCOMPATIBLE_CONTRACT_TERMS","/composition","Original custody terms and independently reported reference terms remain inspectable.","Conflicting contract terms cannot acquire a validated named structure or exact payoff by source precedence."));}
   }
   if(!changed)continue;
   String guid=UUID.randomUUID().toString(),uri="/v2/constructions/"+guid;value.put("id",guid).put("createdAt",now.toString()).put("changeKind","EVIDENCE_REINTERPRETATION").put("predecessorStatus","KNOWN");value.set("self",link(uri));value.set("predecessor",link(old.uri()));
   // Reference facts do not create new membership, broker reservation or Order association claims.
   if(value.at("/recognition/status").asText().equals("VALIDATED")){
    var model=repo.get(c,value.at("/recognition/modelVersion/href").asText());
    if(model.isEmpty()||!PortfolioRecognition.matches(value,model.get().value(),new PortfolioRecognition.Admission(false,false,false),definitions)){var recognition=(ObjectNode)value.path("recognition");var candidates=(ArrayNode)recognition.path("candidateModels");if(recognition.path("modelVersion").isObject())candidates.add(recognition.path("modelVersion").deepCopy());recognition.put("status","UNCLASSIFIED").putNull("modelVersion");recognition.set("reasonCodes",array().add("UNCLASSIFIED_CONSTRUCTION"));((ArrayNode)value.path("warnings")).add(warning("UNCLASSIFIED_CONSTRUCTION","/recognition","Actual constituents and historical exact Model references remain inspectable.","Reference reinterpretation does not independently prove required named-structure associations."));}
   }
   repo.put(c,new Document(Kind.CONSTRUCTION,uri,account,value,old.snapshot(),old.sourceKey()));var p=position.value().deepCopy();p.set("currentConstruction",link(uri));var evaluation=PortfolioMath.evaluate(value,Map.of(),now);if(p.at("/evaluation/economicComparison").isObject())evaluation.set("economicComparison",p.at("/evaluation/economicComparison").deepCopy());p.set("evaluation",evaluation);PortfolioSources.qualify(p);repo.put(c,new Document(Kind.POSITION,position.uri(),account,p,position.snapshot(),position.sourceKey()));
  }
 }
 private static ObjectNode withoutEvidence(ObjectNode node){var value=node.deepCopy();value.remove("evidence");return value;}
 private static boolean known(JsonNode n){return !n.isMissingNode()&&!n.isNull()&&!(n.isTextual()&&(n.asText().isBlank()||n.asText().equals("UNKNOWN")))&&!(n.isArray()&&n.isEmpty());}
 private static boolean equal(String field,JsonNode a,JsonNode b){if(field.equals("terminalSettlement"))return PortfolioReferenceTerms.equivalent(field,a,b);if(Set.of("strike","multiplier").contains(field))return number(a).compareTo(number(b))==0;return a.equals(b);}
}
