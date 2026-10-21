package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.AccountDirectory;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Normalizes retained broker instructions. No submission, fabricated fills or holdings mutation. */
public final class PortfolioOrderSources {
 private final PortfolioRepository repository;
 public PortfolioOrderSources(PortfolioRepository repository){this.repository=repository;}
 /** Called only on already retained Account-qualified source pages. Scope and source are verified again. */
 public void admit(Connection c,AccountDirectory.Account account,String artifact,boolean completeScan)throws Exception {
  String received;byte[] bytes;
  try(var q=c.prepareStatement("SELECT payload,received_at FROM brokerage_artifact WHERE account=? AND artifact_id=?")){q.setString(1,account.id());q.setString(2,artifact);try(var r=q.executeQuery()){if(!r.next())throw new IllegalArgumentException("Account source missing");bytes=r.getBytes(1);received=r.getString(2);}}
  if(!account.brokerAssociation().broker().equals("TASTYTRADE"))throw new IllegalArgumentException("unsupported Order source");
  var root=JSON.readTree(bytes);if(!root.at("/data/items").isArray())throw new IllegalArgumentException("Order page required");
  String context=root.path("context").asText();if(!context.isEmpty()&&!context.equals("/accounts/"+account.brokerAssociation().accountNumber()+"/orders"))throw new IllegalArgumentException("Order source scope mismatch");
  int pageCount=root.at("/data/items").size();var pagination=root.path("pagination");completeScan=completeScan&&pagination.path("total-pages").asInt(-1)<=1&&pagination.path("total-pages").asInt(-1)>=0&&pagination.path("page-offset").asInt(-1)==0&&pagination.path("total-items").asInt(-1)==pageCount;
  int index=0;for(var raw:root.at("/data/items")){
   if(!raw.path("account-number").asText().equals(account.brokerAssociation().accountNumber())||raw.path("id").isMissingNode()||!raw.path("legs").isArray()||raw.path("legs").isEmpty())throw new IllegalArgumentException("unsupported or unscoped Order");
   String sourceId=raw.path("id").asText(),guid=id(account.id()+":TASTYTRADE:order:"+sourceId),uri="/v2/orders/"+guid;var source=source(account.id(),artifact,"/data/items/"+index++,null,received,"TASTYTRADE");source.put("requiredCapability","account.orders.read:"+account.id());var evidence=array().add(source);
   String reported=raw.path("status").asText("Unknown");String status=switch(reported){case "Live","Received","Routed","In Flight","Contingent"->"WORKING";case "Partially Filled"->"PARTIALLY_FILLED";case "Filled"->"FILLED";case "Cancelled","Canceled"->"CANCELED";case "Expired"->"EXPIRED";case "Rejected"->"REJECTED";default->"UNKNOWN";};
   var order=obj().put("id",guid).put("sourceStatus",reported).put("status",status).putNull("observedAt").put("observationCoverage",completeScan?"COMPLETE_SUPPORTED_SCAN":"PARTIAL");order.set("self",link(uri));order.set("account",link("/v2/accounts/"+account.id()));order.set("sourceIdentifier",obj().put("broker","TASTYTRADE").put("environment","PRODUCTION").put("identifier",sourceId));if(raw.hasNonNull("complex-order-id"))order.put("brokerGroupId",raw.path("complex-order-id").asText());else order.putNull("brokerGroupId");order.set("relatedOrders",array());
   String type=switch(raw.path("order-type").asText()){case "Limit"->"LIMIT";case "Stop Limit"->"STOP_LIMIT";case "Market"->"MARKET";default->"OTHER";};order.put("orderType",type);String tif=raw.path("time-in-force").asText();order.put("timeInForce",Set.of("DAY","GTC","GTD").contains(tif)?tif:"UNKNOWN");String gtd=raw.path("gtc-date").asText();if(tif.equals("GTD")&&gtd.matches("\\d{4}-\\d{2}-\\d{2}"))order.put("gtdDate",gtd);else order.putNull("gtdDate");String effect=raw.path("price-effect").asText().toUpperCase(Locale.ROOT);order.put("priceEffect",Set.of("DEBIT","CREDIT").contains(effect)?effect:"UNKNOWN");
   order.set("limitPrice",price(raw.path("price"),received,evidence,"SOURCE_REPORTED_INSTRUCTION_LIMIT"));order.set("stopTrigger",type.equals("STOP_LIMIT")?price(raw.path("stop-trigger"),received,evidence,"SOURCE_REPORTED_TRIGGER_NOT_EXECUTION_PRICE"):na("PRICE",received));
   var legs=array();BigDecimal packageQuantity=decimalNode(raw.path("size")),commonMultiplier=null;boolean multiplierKnown=true;
   for(var rawLeg:raw.path("legs")){
    String symbol=rawLeg.path("symbol").asText(),instrumentId=id("instrument:TASTYTRADE:"+symbol),instrumentUri="/v2/instruments/"+instrumentId;String action=switch(rawLeg.path("action").asText()){case "Buy to Open"->"BUY_TO_OPEN";case "Sell to Open"->"SELL_TO_OPEN";case "Buy to Close"->"BUY_TO_CLOSE";case "Sell to Close"->"SELL_TO_CLOSE";case "Buy"->"BUY";case "Sell"->"SELL";default->"UNKNOWN";};if(action.equals("UNKNOWN")||symbol.isBlank())throw new IllegalArgumentException("unsupported Order leg");
    var instrument=repository.get(c,instrumentUri);if(instrument.isEmpty()){var reference=obj().put("id",instrumentId).put("kind",rawLeg.path("instrument-type").asText().equals("Equity Option")?"OPTION":"EQUITY").put("symbol",symbol).put("currency","USD").putNull("option");reference.set("self",link(instrumentUri));reference.set("brokerAliases",array().add(obj().put("broker","TASTYTRADE").put("environment","PRODUCTION").put("identifier",symbol)));reference.set("evidence",array());reference.set("warnings",array());repository.put(c,new Document(Kind.INSTRUMENT,instrumentUri,null,reference,null,symbol));}
    BigDecimal quantity=decimalNode(rawLeg.path("quantity"));if(quantity==null||quantity.signum()<=0)throw new IllegalArgumentException("invalid requested quantity");
    boolean option=rawLeg.path("instrument-type").asText().equals("Equity Option");BigDecimal multiplier=option?decimalNode(rawLeg.path("multiplier")):BigDecimal.ONE;if(multiplier==null){multiplierKnown=false;}else if(commonMultiplier==null)commonMultiplier=multiplier;else if(commonMultiplier.compareTo(multiplier)!=0)multiplierKnown=false;
    var leg=obj().put("action",action).put("requestedQuantity",decimal(quantity));leg.set("instrument",link(instrumentUri));var fills=array();var total=BigDecimal.ZERO;boolean fillsKnown=rawLeg.path("fills").isArray();
    for(var rawFill:rawLeg.path("fills")){
     var count=decimalNode(rawFill.path("quantity"));var fillPrice=decimalNode(rawFill.path("fill-price"));if(count==null||count.signum()<=0||fillPrice==null||fillPrice.signum()<0)throw new IllegalArgumentException("invalid reported fill");total=total.add(count);var fill=obj().put("quantity",decimal(count)).put("price",decimal(fillPrice)).put("currency","USD").put("priceUnit",option?"PER_UNDERLYING_UNIT":"PER_UNDERLYING_UNIT");if(rawFill.hasNonNull("fill-id"))fill.put("sourceId",rawFill.path("fill-id").asText());else fill.putNull("sourceId");if(multiplier==null)fill.putNull("multiplier");else fill.put("multiplier",decimal(multiplier));String time=rawFill.path("filled-at").asText();if(time.isBlank())fill.putNull("executedAt");else{Instant.parse(time);fill.put("executedAt",time);}fill.set("evidence",evidence);var cash=multiplier==null?unknown("MONEY",received,"TERMS_UNAVAILABLE"):metric(fillPrice.multiply(count).multiply(multiplier).multiply(action.startsWith("BUY")?BigDecimal.ONE.negate():BigDecimal.ONE),"MONEY","USD",time.isBlank()?null:time,"REPORTED_FILL_PRICE_QUANTITY_MULTIPLIER","QUALIFIED",evidence,"ORDER_EVIDENCE");fill.set("cashFlow",cash);fill.set("fees",unknown("MONEY",received,"HISTORY_INCOMPLETE"));fills.add(fill);
    }
    if(total.compareTo(quantity)>0)throw new IllegalArgumentException("fills exceed requested quantity");if(status.equals("FILLED")&&total.compareTo(quantity)!=0)fillsKnown=false;
    leg.set("filledQuantity",fillsKnown?metric(total,option?"CONTRACT":"SHARE",null,received,"OBSERVED_REPORTED_FILL_SUM","QUALIFIED",evidence,"ORDER_EVIDENCE"):unknown(option?"CONTRACT":"SHARE",received,"OPENING_FILLS_UNAVAILABLE"));leg.put("fillsCoverage",fillsKnown?"COMPLETE_REPORTED":"UNKNOWN");leg.set("fills",fills);legs.add(leg);
   }
   order.set("legs",legs);var convention=obj().put("unit","PER_UNDERLYING_UNIT");if(multiplierKnown&&commonMultiplier!=null)convention.put("multiplier",decimal(commonMultiplier));else convention.putNull("multiplier");if(packageQuantity==null||packageQuantity.signum()<=0)convention.putNull("packageQuantity");else convention.put("packageQuantity",decimal(packageQuantity));order.set("priceConvention",convention);var prior=repository.get(c,uri);order.set("associations",prior.filter(p->p.kind()==Kind.ORDER&&p.value().path("sourceIdentifier").equals(order.path("sourceIdentifier"))&&p.value().path("account").equals(order.path("account"))). <JsonNode>map(p->p.value().path("associations").deepCopy()).orElseGet(PortfolioJson::array));order.set("evidence",evidence);order.set("warnings",array().add(warning("ASSOCIATION_UNRESOLVED","/associations","Broker instruction and reported fills remain inspectable.","Holdings similarity alone does not establish a Position or Construction association.")));repository.put(c,new Document(Kind.ORDER,uri,account.id(),order,null,sourceId));
  }
 }
 private static ObjectNode price(JsonNode node,String received,ArrayNode evidence,String method){var value=decimalNode(node);if(value==null)return unknown("PRICE",received,"TERMS_UNAVAILABLE");if(value.signum()<0)throw new IllegalArgumentException("unsigned instruction price required");var price=metric(value,"PRICE","USD",received,method,"QUALIFIED",evidence,"ORDER_EVIDENCE");price.put("origin","BROKER_REPORTED");return price;}
 private static BigDecimal decimalNode(JsonNode n){return n.isNumber()||n.isTextual()?new BigDecimal(n.asText()):null;}
 private static String id(String value){return UUID.nameUUIDFromBytes(value.getBytes(StandardCharsets.UTF_8)).toString();}
}
