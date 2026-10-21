package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Interprets previously admitted associations; it never creates an association from matching legs.
 * Source producers remain responsible for proving the declared association predicate under ADR-016.
 * Scope, subjects, directions, quantities and reported fill completeness are independently checked here.
 */
public final class PortfolioOrderEvaluation {
 private PortfolioOrderEvaluation(){}
 public static void apply(ObjectNode position,ObjectNode construction,List<Document> orders,Instant now){
  var evaluation=(ObjectNode)position.path("evaluation");
  String account=position.at("/account/href").asText(),positionUri=position.at("/self/href").asText(),constructionUri=construction.at("/self/href").asText();
  var options=leaves(construction.path("composition")).stream().filter(n->n.path("kind").asText().equals("OPTION")).toList();
  if(options.isEmpty())return;
  var associated=new ArrayList<ObjectNode>();
  for(var document:orders){var order=document.value();if(!order.path("account").equals(position.path("account")))continue;
   for(var association:order.path("associations"))if(admitted(association,order,account,positionUri,constructionUri)){associated.add(order);break;}
  }
  var opening=associated.stream().filter(o->o.path("status").asText().equals("FILLED")&&matches(o,options,true)).toList();
  if(opening.size()==1){
   var order=opening.getFirst();var fills=opening(order,options,now);
   if(fills!=null){var timeline=(ObjectNode)evaluation.path("timeline");timeline.put("openedAt",fills.lastFill().toString()).put("openingAccess","VISIBLE");timeline.set("openingEvidence",fills.evidence());
    String expiration=timeline.path("expiration").asText(null);if(expiration!=null){long days=ChronoUnit.DAYS.between(fills.lastFill().atZone(ZoneId.of("America/New_York")).toLocalDate(),LocalDate.parse(expiration));if(days>=0)timeline.set("originalDays",metric(BigDecimal.valueOf(days),"DAY",null,fills.lastFill().toString(),"NY_CALENDAR_FROM_FINAL_VERIFIED_FILL","QUALIFIED",fills.evidence(),"ORDER_EVIDENCE"));else{timeline.putNull("openedAt").put("openingAccess","UNKNOWN");timeline.set("openingEvidence",array());timeline.set("originalDays",unknown("DAY",null,"OPENING_FILLS_UNAVAILABLE"));}}
    // A call fill does not establish the share acquisition cost of a Covered Call.
    if(options.size()==leaves(construction.path("composition")).size()&&fills.cash()!=null){String currency=fills.currency();evaluation.set("openingCashFlow",metric(fills.cash(),"MONEY",currency,fills.lastFill().toString(),"SIGNED_REPORTED_OPENING_FILLS","QUALIFIED",fills.evidence(),"ORDER_EVIDENCE","OPENING_CASH_FLOW"));
     var closing=evaluation.path("estimatedClosingCashFlow");var evidence=fills.evidence().deepCopy();for(var ev:closing.path("evidence"))evidence.add(ev);
     if(established(closing)&&closing.path("currency").asText().equals(currency)){var gross=fills.cash().add(number(closing.path("value")));evaluation.set("grossUnrealizedPl",metric(gross,"MONEY",currency,now.toString(),"REPORTED_OPENING_PLUS_CURRENT_LIQUIDATION","QUALIFIED",evidence,"ORDER_EVIDENCE","OPENING_CASH_FLOW","CURRENT_MARKET"));if(fills.fees()!=null)evaluation.set("netUnrealizedPl",metric(gross.subtract(fills.fees()),"MONEY",currency,now.toString(),"GROSS_LESS_REPORTED_OPENING_FEES","QUALIFIED",evidence,"ORDER_EVIDENCE","OPENING_CASH_FLOW","CURRENT_MARKET"));else evaluation.set("netUnrealizedPl",unknown("MONEY",now.toString(),"HISTORY_INCOMPLETE"));}
     if(fills.fees()!=null)evaluation.set("fees",metric(fills.fees(),"MONEY",currency,fills.lastFill().toString(),"REPORTED_OPENING_FEES","QUALIFIED",fills.evidence(),"ORDER_EVIDENCE"));
     var financial=construction.deepCopy();for(var leaf:leaves(financial.path("composition"))){var basis=fills.bases().get(leaf.at("/instrument/href").asText());if(basis!=null)((ObjectNode)leaf.path("allocation")).set("basis",metric(basis,"MONEY",currency,fills.lastFill().toString(),"REPORTED_OPENING_FILL_COST_MAGNITUDE","QUALIFIED",fills.evidence(),"ORDER_EVIDENCE"));}var geometry=PortfolioMath.evaluate(financial,Map.of(),now);evaluation.set("payoff",geometry.path("payoff"));evaluation.set("range",geometry.path("range"));
    }
   }
  }
  var working=associated.stream().filter(o->o.path("status").asText().equals("WORKING")&&matches(o,options,false)&&unfilled(o)).toList();
  var management=(ObjectNode)evaluation.path("management");var links=array();var evidence=array();for(var order:working){links.add(order.path("self"));for(var ev:order.path("evidence"))evidence.add(ev);}management.set("orders",links);management.set("evidence",evidence);
  var targets=working.stream().filter(o->o.path("orderType").asText().equals("LIMIT")).toList();var stops=working.stream().filter(o->o.path("orderType").asText().equals("STOP_LIMIT")).toList();
  boolean ambiguous=targets.size()>1||stops.size()>1;management.put("associationStatus",ambiguous?"AMBIGUOUS":working.isEmpty()?"UNAVAILABLE":"ESTABLISHED");management.put("protectiveOrderEvidence",stops.size()==1?"PRESENT":"UNKNOWN");management.set("warningCodes",ambiguous?array().add("AMBIGUOUS_ORDER_ASSOCIATION"):working.isEmpty()?array().add("ASSOCIATION_UNRESOLVED"):array());
  if(!ambiguous&&targets.size()==1)management.set("profitTargetGrossPl",objective(evaluation,targets.getFirst(),"limitPrice",now));
  if(!ambiguous&&stops.size()==1)management.set("reportedStopThresholdGrossPl",objective(evaluation,stops.getFirst(),"stopTrigger",now));
  // Missing stops remain UNKNOWN: a list of associated Orders is not proof of a complete current broker scan.
  // GTD is retained on the Order. A manual checkpoint additionally requires the accepted convention's group/receipt proof.
 }
 private static boolean admitted(JsonNode a,JsonNode order,String account,String position,String construction){
  String target=a.at("/target/href").asText();if(!Set.of(position,construction).contains(target)||!a.path("status").asText().equals("ESTABLISHED"))return false;
  if(!a.path("targetKind").asText().equals(target.equals(position)?"POSITION":"CONSTRUCTION"))return false;
  var authority=a.path("authority");if(!authority.path("status").asText().equals("ESTABLISHED")||!Set.of("BROKER_EXPLICIT_ORDER_LINK","RECONCILED_DOCUMENTED_ACTIVITY").contains(authority.path("basis").asText())||!authority.at("/account/href").asText().equals(account)||authority.path("evidence").isEmpty()||a.path("evidence").isEmpty())return false;
  var subjects=new HashSet<String>();authority.path("subjects").forEach(s->subjects.add(s.path("href").asText()));if(!subjects.contains(target)||!subjects.contains(order.at("/self/href").asText()))return false;
  boolean scoped=false;for(var e:a.path("evidence"))if(e.path("kind").asText().equals("ACCOUNT_SOURCE")){if(!e.at("/account/href").asText().equals(account)||!e.path("requiredCapability").asText().equals("account.orders.read:"+account.substring(account.lastIndexOf('/')+1)))return false;scoped=true;}return scoped;
 }
 private static boolean matches(JsonNode order,List<ObjectNode> options,boolean opening){
  if(order.path("legs").size()!=options.size())return false;var used=new HashSet<String>();for(var option:options){String uri=option.at("/instrument/href").asText();if(!used.add(uri))return false;JsonNode matched=null;for(var leg:order.path("legs"))if(leg.at("/instrument/href").asText().equals(uri)){if(matched!=null)return false;matched=leg;}if(matched==null)return false;var quantity=number(matched.path("requestedQuantity"));if(quantity==null||quantity.compareTo(number(option.path("quantity")))!=0)return false;String expected=option.path("side").asText().equals("LONG")?(opening?"BUY_TO_OPEN":"SELL_TO_CLOSE"):(opening?"SELL_TO_OPEN":"BUY_TO_CLOSE");if(!matched.path("action").asText().equals(expected))return false;}return true;
 }
 private static boolean unfilled(JsonNode order){for(var leg:order.path("legs"))if(!established(leg.path("filledQuantity"))||number(leg.at("/filledQuantity/value")).signum()!=0||!leg.path("fills").isEmpty())return false;return true;}
 private record Opening(Instant lastFill,BigDecimal cash,BigDecimal fees,String currency,ArrayNode evidence,Map<String,BigDecimal> bases){}
 private static Opening opening(JsonNode order,List<ObjectNode> options,Instant now){
  Instant latest=null;BigDecimal total=BigDecimal.ZERO,fees=BigDecimal.ZERO;String currency=null;boolean cashKnown=true,feesKnown=true;var evidence=array();var bases=new HashMap<String,BigDecimal>();
  for(var leg:order.path("legs")){if(!leg.path("fillsCoverage").asText().equals("COMPLETE_REPORTED")||leg.path("fills").isEmpty())return null;var count=BigDecimal.ZERO;var cost=BigDecimal.ZERO;boolean legKnown=true;String uri=leg.at("/instrument/href").asText();var terms=options.stream().filter(o->o.at("/instrument/href").asText().equals(uri)).findFirst().orElseThrow().path("terms");
   for(var fill:leg.path("fills")){var quantity=number(fill.path("quantity"));var price=number(fill.path("price"));if(quantity==null||quantity.signum()<=0||price==null||price.signum()<0||!fill.path("executedAt").isTextual()||fill.path("evidence").isEmpty())return null;var time=Instant.parse(fill.path("executedAt").asText());if(time.isAfter(now))return null;if(latest==null||time.isAfter(latest))latest=time;count=count.add(quantity);for(var ev:fill.path("evidence"))evidence.add(ev);
    String unit=fill.path("priceUnit").asText();var multiplier=number(fill.path("multiplier"));if(unit.equals("PER_CONTRACT"))multiplier=BigDecimal.ONE;else if(!unit.equals("PER_UNDERLYING_UNIT"))multiplier=null;var reportedTerm=number(terms.path("multiplier"));if(multiplier==null||multiplier.signum()<=0||unit.equals("PER_UNDERLYING_UNIT")&&reportedTerm!=null&&multiplier.compareTo(reportedTerm)!=0)legKnown=false;else cost=cost.add(quantity.multiply(price).multiply(multiplier));
    String denomination=fill.path("currency").asText();if(currency==null)currency=denomination;else if(!currency.equals(denomination))cashKnown=false;if(!denomination.equals(terms.path("currency").asText()))cashKnown=false;
    var fee=fill.path("fees");if(established(fee)&&fee.path("currency").asText().equals(denomination)&&number(fee.path("value")).signum()>=0)fees=fees.add(number(fee.path("value")));else feesKnown=false;
   }
   if(count.compareTo(number(leg.path("requestedQuantity")))!=0)return null;if(legKnown){bases.put(uri,cost);total=total.add(cost.multiply(leg.path("action").asText().startsWith("BUY")?BigDecimal.ONE.negate():BigDecimal.ONE));}else cashKnown=false;
  }
  return latest==null?null:new Opening(latest,cashKnown?total:null,feesKnown?fees:null,currency,evidence,bases);
 }
 private static ObjectNode objective(ObjectNode evaluation,JsonNode order,String field,Instant now){
  var opening=evaluation.path("openingCashFlow");var price=order.path(field);if(!established(opening)||!established(price)||!price.path("currency").equals(opening.path("currency")))return unknown("MONEY",now.toString(),"OPENING_FILLS_UNAVAILABLE");
  var convention=order.path("priceConvention");var multiplier=number(convention.path("multiplier"));var quantity=number(convention.path("packageQuantity"));BigDecimal magnitude=number(price.path("value"));switch(convention.path("unit").asText()){
   case "PER_UNDERLYING_UNIT"->{if(multiplier==null||quantity==null)return unknown("MONEY",now.toString(),"TERMS_UNAVAILABLE");magnitude=magnitude.multiply(multiplier).multiply(quantity);}
   case "PER_CONTRACT"->{if(quantity==null)return unknown("MONEY",now.toString(),"TERMS_UNAVAILABLE");magnitude=magnitude.multiply(quantity);}
   case "PACKAGE_TOTAL"->{}default->{return unknown("MONEY",now.toString(),"TERMS_UNAVAILABLE");}
  }
  String effect=order.path("priceEffect").asText();if(!Set.of("CREDIT","DEBIT").contains(effect))return unknown("MONEY",now.toString(),"TERMS_UNAVAILABLE");var evidence=array();for(var ev:opening.path("evidence"))evidence.add(ev);for(var ev:order.path("evidence"))evidence.add(ev);return metric(number(opening.path("value")).add(magnitude.multiply(effect.equals("DEBIT")?BigDecimal.ONE.negate():BigDecimal.ONE)),"MONEY",opening.path("currency").asText(),now.toString(),field.equals("stopTrigger")?"REPORTED_TRIGGER_GROSS_THRESHOLD_NOT_EXECUTION_RESULT":"OPENING_PLUS_SIGNED_CLOSING_LIMIT","QUALIFIED",evidence,"ORDER_EVIDENCE","OPENING_CASH_FLOW");
 }
}
