package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Finite reference-source composition. Missing fields do not erase independently known facts. */
final class PortfolioReferenceTerms {
 private PortfolioReferenceTerms(){}
 static ObjectNode combine(JsonNode previous,ObjectNode next){
  boolean novel=next.path("qualification").asText().equals("CONFLICT")&&!previous.path("qualification").asText().equals("CONFLICT");boolean anyPrevious=false;
  for(String field:List.of("underlying","right","strike","currency","expiration","multiplier","exerciseStyle","settlement","adjustment","deliverable")){anyPrevious|=known(previous.path(field));if(known(next.path(field))&&(!known(previous.path(field))||!equivalent(field,previous.path(field),next.path(field))))novel=true;}
  // Retained attempts record repeated observations; current resources need not accumulate
  // another provenance copy when no independently known financial fact changes.
  if(anyPrevious&&!novel)return (ObjectNode)previous.deepCopy();
  var value=next.deepCopy();boolean conflict=previous.path("qualification").asText().equals("CONFLICT")||next.path("qualification").asText().equals("CONFLICT");boolean usedPrevious=false;
  for(String field:List.of("underlying","right","strike","currency","expiration","multiplier","exerciseStyle","settlement","adjustment","deliverable")){
   var old=previous.path(field);var current=value.path(field);if(!known(current)&&known(old)){value.set(field,old.deepCopy());usedPrevious=true;}
   else if(known(old)&&known(current)&&!equivalent(field,old,current)){conflict=true;usedPrevious=true;}
  }
  var evidence=(ArrayNode)value.path("evidence");if(usedPrevious)for(var ref:previous.path("evidence")){boolean found=false;for(var existing:evidence)if(existing.equals(ref))found=true;if(!found)evidence.add(ref.deepCopy());}
  var multiplier=number(value.path("multiplier"));var delivered=number(value.at("/deliverable/0/quantity"));boolean standard=!conflict&&value.path("adjustment").asText().equals("STANDARD")&&value.path("settlement").asText().equals("PHYSICAL")&&value.path("deliverable").size()==1&&value.at("/deliverable/0/kind").asText().equals("SHARES")&&value.at("/deliverable/0/instrument/href").equals(value.at("/underlying/href"))&&multiplier!=null&&multiplier.signum()>0&&delivered!=null&&multiplier.compareTo(delivered)==0&&known(value.path("underlying"))&&known(value.path("strike"))&&known(value.path("currency"))&&known(value.path("expiration"))&&Set.of("CALL","PUT").contains(value.path("right").asText());
  value.put("qualification",conflict?"CONFLICT":standard?"QUALIFIED":"INCOMPLETE").put("payoffApplicability",standard?"STANDARD_EQUITY_INTRINSIC":value.path("adjustment").asText().equals("ADJUSTED")?"EXPLICIT_DELIVERABLE_REQUIRED":"UNKNOWN");return value;
 }
 static boolean known(JsonNode n){return !n.isMissingNode()&&!n.isNull()&&!(n.isTextual()&&(n.asText().isBlank()||n.asText().equals("UNKNOWN")))&&!(n.isArray()&&n.isEmpty());}
 private static boolean equivalent(String field,JsonNode a,JsonNode b){if(Set.of("strike","multiplier").contains(field))return number(a).compareTo(number(b))==0;if(field.equals("deliverable"))return canonicalDeliverables(a).equals(canonicalDeliverables(b));return a.equals(b);}
 private static JsonNode canonicalDeliverables(JsonNode node){var normalized=node.deepCopy();for(var item:normalized)if(item.isObject()&&number(item.path("quantity"))!=null)((ObjectNode)item).put("quantity",decimal(number(item.path("quantity"))));return normalized;}
 static ArrayNode warnings(ObjectNode terms){var warnings=array();if(terms.path("qualification").asText().equals("CONFLICT"))warnings.add(warning("SOURCE_CONFLICT","/option","Individual source references remain inspectable.","Reported reference terms conflict; source precedence is not invented and exact interpretation remains unavailable."));else if(terms.path("multiplier").isNull()||terms.path("exerciseStyle").asText().equals("UNKNOWN")||terms.path("deliverable").isEmpty())warnings.add(warning("TERMS_UNAVAILABLE","/option","Independently reported option terms remain inspectable.","Missing fields retain their explicit qualifications. Deliverable share counts do not establish a price multiplier, and AM/PM settlement timing does not establish exercise style."));return warnings;}
}
