package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.AccountDirectory;
import java.math.BigDecimal;
import java.sql.Connection;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Narrow reuse of already admitted transaction evidence, not reconstruction of fills or Position membership.
 * Native transaction.order-id identifies its producing Order. Only a single exact reported fill/ledger
 * match can supply gross cash; missing/multiple/reversed matches remain unadmitted. No multiplier is inferred.
 */
public final class PortfolioFillEvidence {
 private final PortfolioRepository repository;
 public PortfolioFillEvidence(PortfolioRepository repository){this.repository=repository;}
 private record Row(JsonNode value,String transaction,String artifact,int row,String received){}
 public void refresh(Connection connection,AccountDirectory.Account owner)throws Exception {
  if(!owner.brokerAssociation().broker().equals("TASTYTRADE"))return;
  String account=owner.id();var rows=new ArrayList<Row>();var reversed=new HashSet<String>();
  try(var query=connection.prepareStatement("SELECT t.transaction_id,o.* FROM account_transaction t JOIN account_transaction_observation o ON o.account=t.account AND o.observation_id=t.current_observation_id WHERE t.account=?")){
   query.setString(1,account);try(var result=query.executeQuery()){while(result.next()){var value=JSON.readTree(result.getString("payload_json"));rows.add(new Row(value,result.getString("transaction_id"),result.getString("artifact_id"),result.getInt("source_row"),result.getString("received_at")));if(value.hasNonNull("reversesSourceId"))reversed.add(value.path("reversesSourceId").asText());}}
  }
  for(var document:repository.list(connection,Kind.ORDER,Set.of(account))){var order=document.value().deepCopy();int index=0;for(var leg:order.path("legs")){
   int legIndex=index++;if(!leg.path("fillsCoverage").asText().equals("COMPLETE_REPORTED")||leg.path("fills").size()!=1)continue;
   var fill=(ObjectNode)leg.path("fills").get(0);String pointer="/legs/"+legIndex+"/fills/0/cashFlow";resetDerivedAnnotation(fill,leg);var warnings=(ArrayNode)order.path("warnings");for(int i=warnings.size()-1;i>=0;i--){var warning=warnings.get(i);if(warning.path("affected").toString().contains(pointer)&&warning.path("establishedFacts").toString().contains("Reported fills and original transaction records remain independently inspectable."))warnings.remove(i);}if(!fill.path("executedAt").isTextual())continue;
   var instrument=repository.get(connection,leg.at("/instrument/href").asText());if(instrument.isEmpty())continue;String symbol=instrument.get().value().path("symbol").asText();
   var matches=rows.stream().filter(row->{var value=row.value();return value.path("kind").asText().equals("TRADE")&&value.path("orderId").asText().equals(order.at("/sourceIdentifier/identifier").asText())&&value.path("symbol").asText().equals(symbol)&&value.path("sourceAction").asText().toUpperCase(Locale.ROOT).replace(' ','_').equals(leg.path("action").asText())&&equal(value.path("quantity"),fill.path("quantity"))&&equal(value.path("price"),fill.path("price"))&&value.path("executedAt").isTextual()&&Instant.parse(value.path("executedAt").asText()).equals(Instant.parse(fill.path("executedAt").asText()));}).toList();
   if(matches.isEmpty())continue;
   if(matches.size()!=1){conflict(order,fill,pointer,"SOURCE_CONFLICT","Several retained ledger records match this one reported fill; no unique cash attribution is established.");continue;}
   var row=matches.getFirst();var value=row.value();if(value.hasNonNull("reversesSourceId")||reversed.contains(value.path("sourceTransactionId").asText())){conflict(order,fill,pointer,"SOURCE_CONFLICT","A known reversal prevents an unreversed cash attribution; no ledger lifecycle is reconstructed.");continue;}String currency=value.path("currency").asText();if(!currency.equals(fill.path("currency").asText())){conflict(order,fill,pointer,"MIXED_CURRENCY","Order price and transaction cash currencies are incompatible; no FX conversion is assumed.");continue;}
   var amount=number(value.path("value"));if(amount==null)continue;boolean buy=leg.path("action").asText().startsWith("BUY");if(amount.signum()!=0&&(buy?amount.signum()>0:amount.signum()<0)){conflict(order,fill,pointer,"SOURCE_CONFLICT","Transaction cash direction contradicts the reported fill action.");continue;}
   var previous=fill.path("cashFlow");if(established(previous)&&number(previous.path("value")).compareTo(amount)!=0){conflict(order,fill,pointer,"SOURCE_CONFLICT","Reported transaction value differs from price/quantity/multiplier evidence.");continue;}
   var evidence=array();for(var ev:fill.path("evidence"))evidence.add(ev);var source=source(account,row.artifact(),"/data/items/"+(row.row()-1),Instant.parse(value.path("executedAt").asText()).atOffset(java.time.ZoneOffset.UTC).toLocalDate().toString(),row.received(),"TASTYTRADE");source.put("requiredCapability","account.transactions.read:"+account).put("observedAt",value.path("executedAt").asText()).put("observationPrecision","INSTANT").put("timeAuthority","SOURCE");source.set("authorityRecord",link("/v2/accounts/"+account+"/transactions/"+row.transaction()));evidence.add(source);
   var cash=metric(amount,"MONEY",currency,value.path("executedAt").asText(),"BROKER_TRANSACTION_VALUE_FOR_UNIQUE_EXACT_REPORTED_FILL","QUALIFIED",evidence,"ORDER_EVIDENCE","DOCUMENTED_HISTORY");cash.put("origin","BROKER_REPORTED");((ArrayNode)cash.path("assumptions")).add("Native producing Order ID, symbol, action, quantity, price and execution instant agree for one reported fill. Gross before fees; no Position membership, multiplier, tax basis or history completeness is inferred.");fill.set("cashFlow",cash);
   var net=number(value.path("netCash"));if(net!=null&&value.path("estimatedFee").isBoolean()&&!value.path("estimatedFee").asBoolean()){
    var charge=amount.subtract(net);if(charge.signum()>=0){var fees=metric(charge,"MONEY",currency,value.path("executedAt").asText(),"REPORTED_GROSS_LESS_FINAL_REPORTED_NET","QUALIFIED",evidence,"ORDER_EVIDENCE","DOCUMENTED_HISTORY");((ArrayNode)fees.path("assumptions")).add("Explicitly non-estimated source net value after fees/commissions; this is a difference of reported cash totals, not an assumed zero or a tax-lot calculation.");fill.set("fees",fees);}
   }
  }repository.put(connection,new Document(document.kind(),document.uri(),document.account(),order,document.snapshot(),document.sourceKey()));}
 }
 private static void resetDerivedAnnotation(ObjectNode fill,JsonNode leg){
  var multiplier=number(fill.path("multiplier"));String unit=fill.path("priceUnit").asText();if(unit.equals("PER_CONTRACT"))multiplier=BigDecimal.ONE;
  var price=number(fill.path("price"));var quantity=number(fill.path("quantity"));BigDecimal amount=null;
  if(price!=null&&quantity!=null){if(unit.equals("TOTAL_LEG"))amount=price;else if(Set.of("PER_CONTRACT","PER_UNDERLYING_UNIT").contains(unit)&&multiplier!=null&&multiplier.signum()>0)amount=price.multiply(quantity).multiply(multiplier);}
  if(amount!=null)amount=amount.multiply(leg.path("action").asText().startsWith("BUY")?BigDecimal.ONE.negate():BigDecimal.ONE);
  fill.set("cashFlow",amount==null?unknown("MONEY",null,"TERMS_UNAVAILABLE"):metric(amount,"MONEY",fill.path("currency").asText(),fill.path("executedAt").asText(null),"REPORTED_FILL_PRICE_QUANTITY_MULTIPLIER","QUALIFIED",fill.path("evidence"),"ORDER_EVIDENCE"));
  fill.set("fees",unknown("MONEY",null,"HISTORY_INCOMPLETE"));
 }
 private static boolean equal(JsonNode a,JsonNode b){var x=number(a);var y=number(b);return x!=null&&y!=null&&x.compareTo(y)==0;}
 private static void conflict(ObjectNode order,ObjectNode fill,String pointer,String code,String reason){var cash=unknown("MONEY",null,code);cash.put("status","CONFLICT").put("method","UNRESOLVED_FILL_LEDGER_CONFLICT");fill.set("cashFlow",cash);fill.set("fees",unknown("MONEY",null,code));var warnings=(ArrayNode)order.path("warnings");for(var warning:warnings)if(warning.path("code").asText().equals(code)&&warning.path("affected").toString().contains(pointer))return;warnings.add(warning(code,pointer,"Reported fills and original transaction records remain independently inspectable.",reason));}
}
