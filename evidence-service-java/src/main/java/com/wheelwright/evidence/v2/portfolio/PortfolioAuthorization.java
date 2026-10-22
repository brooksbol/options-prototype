package com.wheelwright.evidence.v2.portfolio;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.BearerAuthenticator.Principal;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
/** Field-level source authority. Restricted facts cannot survive as timestamps or geometry. */
public final class PortfolioAuthorization {
 private PortfolioAuthorization(){}
 public static String grant(PortfolioRepository.Kind k,String a){return switch(k){case POSITION,CONSTRUCTION->"account.positions.read:"+a;case HOLDING->"account.holdings.read:"+a;case ORDER->"account.orders.read:"+a;case AUDIT->"account.positions.audit.read:"+a;case INSTRUMENT,MODEL,MODEL_VERSION->"reference.read";case MARKET_OBSERVATION->"market.read";};}
 public static boolean canRead(Principal p,PortfolioRepository.Document d){return p.hasGrant(grant(d.kind(),d.account()))&&(d.kind()!=PortfolioRepository.Kind.MARKET_OBSERVATION||d.account()==null||p.hasGrant("account.market.read:"+d.account()));}
 public static ObjectNode project(PortfolioRepository.Document d,Principal p){
  if(!canRead(p,d))throw new SecurityException("resource access denied");var n=d.value().deepCopy();boolean orders=d.account()!=null&&p.hasGrant("account.orders.read:"+d.account());boolean basisPrivate=privateBasis(n,p);boolean comparisonPrivate=restrictedTree(n.at("/evaluation/economicComparison"),p);boolean lifecyclePrivate=restrictedTree(n.path("stateEvidence"),p);sanitize(n,p);
  if(d.kind()==PortfolioRepository.Kind.CONSTRUCTION&&n.at("/recognition/status").asText().equals("VALIDATED")&&n.at("/recognition/authority/status").asText().equals("UNRESOLVED")){
   var recognition=(ObjectNode)n.path("recognition");recognition.put("status","UNCLASSIFIED").putNull("modelVersion");recognition.set("candidateModels",array());recognition.set("reasonCodes",array().add("ACCESS_RESTRICTED"));((ArrayNode)n.path("warnings")).add(warning("ACCESS_RESTRICTED","/recognition","Authorized constituents remain inspectable.","Validated recognition requires association evidence outside this projection's source permissions."));
  }
  if(d.kind()==PortfolioRepository.Kind.POSITION){var e=(ObjectNode)n.path("evaluation");var warnings=(ArrayNode)n.path("warnings");
   if(lifecyclePrivate){var lifecycle=(ObjectNode)n.path("stateEvidence");lifecycle.putNull("establishedAt").put("establishedAtAccess","REDACTED");lifecycle.set("evidence",array().add(obj().put("kind","REDACTED").put("reason","INSUFFICIENT_PERMISSION")));warnings.add(warning("ACCESS_RESTRICTED","/stateEvidence/establishedAt","Authorized lifecycle assertion is retained.","Its source event clock requires additional source permissions."));}
   if(comparisonPrivate){e.remove("economicComparison");warnings.add(warning("ACCESS_RESTRICTED","/evaluation/economicComparison","Authorized current facts remain inspectable.","Historical detail and its source timestamps require additional source permissions."));}
   if(!orders){n.putNull("orders");if(n.path("included").isObject())((ObjectNode)n.get("included")).set("orders",array());
    var tl=(ObjectNode)e.path("timeline");var original=d.value().at("/evaluation/timeline");boolean independent=original.path("openingEvidence").size()>0&&allowed(original.path("openingEvidence"),p)&&!dependency(original.path("originalDays"),"ORDER_EVIDENCE");
    if(!independent&&!original.at("/originalDays/status").asText().equals("NOT_APPLICABLE")){tl.putNull("openedAt").put("openingAccess","REDACTED");tl.set("openingEvidence",array());redact((ObjectNode)tl.path("originalDays"));}
    var mg=(ObjectNode)e.path("management");boolean applicable=!mg.at("/profitTargetGrossPl/status").asText().equals("NOT_APPLICABLE")||!mg.at("/reportedStopThresholdGrossPl/status").asText().equals("NOT_APPLICABLE");if(applicable){mg.put("access","REDACTED").put("associationStatus","UNAVAILABLE").put("protectiveOrderEvidence","UNKNOWN").putNull("manualCheckpoint");mg.set("orders",array());mg.set("evidence",array());for(String k:List.of("profitTargetGrossPl","reportedStopThresholdGrossPl"))redact((ObjectNode)mg.path(k));
    warnings.add(warning("ACCESS_RESTRICTED","/evaluation","Authorized held facts remain inspectable.","Order-derived facts require their own Account grant."));}
   }
   if((basisPrivate||e.at("/openingCashFlow/status").asText().equals("REDACTED"))&&!e.at("/payoff/geometry/valueKind").asText().equals("TERMINAL_VALUE")){var pay=(ObjectNode)e.path("payoff");pay.put("status","REDACTED").putNull("geometry");pay.set("evidence",array());pay.set("assumptions",array());pay.set("warningCodes",array().add("ACCESS_RESTRICTED"));}
   if(e.at("/marketValue/status").asText().equals("REDACTED")||e.at("/estimatedClosingCashFlow/status").asText().equals("REDACTED")){e.putNull("oldestMaterialObservationAt").put("freshness","UNKNOWN");warnings.add(warning("ACCESS_RESTRICTED","/evaluation/marketValue","Authorized custody and contractual facts remain inspectable.","Market-dependent values and their source clocks require the applicable market permissions."));}
   if(!p.hasGrant("account.positions.audit.read:"+d.account()))n.putNull("audit");
  }
  if(d.kind()==PortfolioRepository.Kind.ORDER&&!p.hasGrant("account.positions.read:"+d.account())&&!n.path("associations").isEmpty()){n.set("associations",array());((ArrayNode)n.path("warnings")).add(warning("ACCESS_RESTRICTED","/associations","Authorized brokerage instruction and fills remain inspectable.","Wheelwright Position and Construction associations require their own Account capability."));}
  return n;
 }
 private static boolean dependency(JsonNode n,String d){for(var x:n.path("dependencies"))if(x.asText().equals(d))return true;return false;}
 private static boolean allowed(JsonNode es,Principal p){for(var e:es)if(e.path("kind").asText().equals("ACCOUNT_SOURCE")&&!p.hasGrant(e.path("requiredCapability").asText()))return false;return true;}
 private static boolean restricted(JsonNode n,Principal p){
  if(dependency(n,"CURRENT_MARKET")&&!p.hasGrant("market.read"))return true;
  for(var e:n.path("evidence"))if(e.path("kind").asText().equals("ACCOUNT_SOURCE")&&e.path("requiredCapability").asText().startsWith("account.market.read:")&&!p.hasGrant(e.path("requiredCapability").asText()))return true;
  for(var e:n.path("evidence"))if(e.path("kind").asText().equals("ACCOUNT_SOURCE")&&e.path("requiredCapability").asText().startsWith("account.orders.read:")&&!p.hasGrant(e.path("requiredCapability").asText()))return true;
  if(dependency(n,"ORDER_EVIDENCE")){boolean known=false;for(var e:n.path("evidence")){String a=e.at("/account/href").asText();if(!a.isEmpty()){known=true;if(!p.hasGrant("account.orders.read:"+a.substring(a.lastIndexOf('/')+1)))return true;}}if(!known)return true;}return false;
 }
 private static boolean restrictedTree(JsonNode n,Principal p){if(n.path("kind").asText().equals("ACCOUNT_SOURCE")&&(n.path("requiredCapability").asText().startsWith("account.orders.read:")||n.path("requiredCapability").asText().startsWith("account.market.read:"))&&!p.hasGrant(n.path("requiredCapability").asText()))return true;if(n.has("dependencies")&&restricted(n,p))return true;for(var child:n)if(restrictedTree(child,p))return true;return false;}
 private static boolean privateBasis(JsonNode n,Principal p){if(n.has("basis")&&n.path("basis").isObject()&&restricted(n.path("basis"),p))return true;for(var x:n)if(privateBasis(x,p))return true;return false;}
 public static void redact(ObjectNode m){m.putNull("value").putNull("asOf").put("status","REDACTED").put("origin","UNKNOWN").put("method","ACCESS_RESTRICTED");m.set("evidence",array());m.set("assumptions",array());m.set("dependencies",array());m.set("warningCodes",array().add("ACCESS_RESTRICTED"));}
 public static void sanitizeRepresentation(JsonNode n,Principal p){sanitize(n,p);}
 private static void sanitize(JsonNode n,Principal p){
  if(n.isObject()){var o=(ObjectNode)n;
   if(o.path("kind").asText().equals("ACCOUNT_SOURCE")&&(!p.hasGrant(o.path("requiredCapability").asText())||o.path("artifact").isObject()&&!p.hasGrant("account.artifacts.read:"+o.at("/account/href").asText().substring(o.at("/account/href").asText().lastIndexOf('/')+1)))){o.removeAll();o.put("kind","REDACTED").put("reason","INSUFFICIENT_PERMISSION");return;}
   if(o.has("value")&&o.has("dependencies")&&restricted(o,p)){redact(o);return;}
   if(o.has("claimId")&&o.has("subjects")&&!allowed(o.path("evidence"),p)){o.put("claimId","ACCESS_RESTRICTED").put("status","UNRESOLVED").put("basis","UNKNOWN").put("qualification","Restricted association evidence.");o.set("subjects",array());o.set("evidence",array());return;}
   var fields=new ArrayList<String>();o.fieldNames().forEachRemaining(fields::add);for(String f:fields)sanitize(o.get(f),p);
  }else if(n.isArray())for(var x:n)sanitize(x,p);
 }
}
