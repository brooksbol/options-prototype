package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Narrow physical-exercise rights. Never establishes a premium quote multiplier, basis or P/L. */
final class PortfolioTerminalSettlement {
 private PortfolioTerminalSettlement(){}
 static final String PROFILE="OCC_US_STANDARD_PHYSICAL_EQUITY_100";
 static final String SPEC="https://www.theocc.com/clearance-and-settlement/clearing/equity-options-product-specifications";
 static void declared(ObjectNode terms,JsonNode raw,JsonNode definitionEvidence){
  // Positive profile match, not a default100 or an inference from held quantities.
  if(!raw.path("option-chain-type").asText().equals("Standard")||!raw.path("instrument-type").asText().equals("Equity Option")||!raw.path("exercise-style").asText().equals("American")||!raw.path("root-symbol").equals(raw.path("underlying-symbol"))||!terms.path("currency").asText().equals("USD")||sourceNumber(raw.path("shares-per-contract"))==null||sourceNumber(raw.path("shares-per-contract")).compareTo(new BigDecimal("100"))!=0||sourceNumber(raw.path("strike-price"))==null||sourceNumber(raw.path("strike-price")).compareTo(number(terms.path("strike")))!=0)return;
  var t=obj().put("status","INCOMPLETE").put("profile",PROFILE).put("exerciseQuantity","100").put("currency","USD").put("strikeUnit","CURRENCY_PER_UNDERLYING_SHARE").put("consideration","STRIKE_TIMES_EXERCISE_QUANTITY").put("method","REPORTED_STANDARD_OPTION_WITH_OCC_EXERCISE_SPECIFICATION");
  t.set("evidence",array().add(definitionEvidence.deepCopy()).add(obj().put("kind","REFERENCE_SOURCE").put("provider","OCC").put("reference",SPEC).putNull("observedAt").put("qualification","VERIFIED_REFERENCE")));terms.set("terminalSettlement",t);
 }
 static void qualify(ObjectNode terms){
  if(!terms.path("terminalSettlement").isObject())return;var t=(ObjectNode)terms.path("terminalSettlement");t.put("status",terms.path("qualification").asText().equals("CONFLICT")?"CONFLICT":"INCOMPLETE");
  if(valid(terms,false)){t.put("status","QUALIFIED");for(var e:terms.path("evidence")){if(!e.path("kind").asText().equals("REFERENCE_SOURCE"))continue;boolean exists=false;for(var prior:t.path("evidence"))exists|=prior.equals(e);if(!exists)((com.fasterxml.jackson.databind.node.ArrayNode)t.path("evidence")).add(e.deepCopy());}}
 }
 static BigDecimal quantity(JsonNode terms){return valid(terms,true)?number(terms.at("/terminalSettlement/exerciseQuantity")):null;}
 private static boolean validDate(JsonNode value){if(!value.isTextual())return false;try{java.time.LocalDate.parse(value.asText());return true;}catch(java.time.DateTimeException e){return false;}}
 private static BigDecimal sourceNumber(JsonNode value){try{return value.isNumber()||value.isTextual()?new BigDecimal(value.asText()):null;}catch(NumberFormatException e){return null;}}
 private static boolean valid(JsonNode terms,boolean requireQualified){
  var t=terms.path("terminalSettlement");if(!t.path("profile").asText().equals(PROFILE)||requireQualified&&!t.path("status").asText().equals("QUALIFIED")||terms.path("qualification").asText().equals("CONFLICT")||!terms.path("adjustment").asText().equals("STANDARD")||!terms.path("settlement").asText().equals("PHYSICAL")||!terms.path("exerciseStyle").asText().equals("AMERICAN")||!terms.path("currency").asText().equals("USD")||!terms.path("currency").equals(t.path("currency"))||!t.path("strikeUnit").asText().equals("CURRENCY_PER_UNDERLYING_SHARE")||!t.path("consideration").asText().equals("STRIKE_TIMES_EXERCISE_QUANTITY")||!java.util.Set.of("CALL","PUT").contains(terms.path("right").asText())||number(terms.path("strike"))==null||number(terms.path("strike")).signum()<0||!validDate(terms.path("expiration")))return false;
  var ds=terms.path("deliverable");var d=ds.path(0);var q=number(d.path("quantity"));if(ds.size()!=1||!d.path("kind").asText().equals("SHARES")||!d.path("instrument").equals(terms.path("underlying"))||(!terms.at("/underlying/href").isTextual()||terms.at("/underlying/href").asText().isBlank())||q==null||q.compareTo(new BigDecimal("100"))!=0||number(t.path("exerciseQuantity"))==null||q.compareTo(number(t.path("exerciseQuantity")))!=0)return false;
  var m=number(terms.path("multiplier"));if(m!=null&&m.compareTo(q)!=0)return false;
  boolean definition=false,chain=false,spec=false;for(var e:terms.path("evidence")){String r=e.path("reference").asText();if(e.path("kind").asText().equals("REFERENCE_SOURCE")&&e.path("provider").asText().equals("TASTYTRADE")&&e.path("qualification").asText().equals("VERIFIED_REFERENCE")){definition|=r.matches("urn:wheelwright:tastytrade:option-definition:sha256:[a-f0-9]{64}:item:[0-9]+");chain|=r.matches("urn:wheelwright:tastytrade:option-chain:sha256:[a-f0-9]{64}:item:[0-9]+");}}for(var e:t.path("evidence"))spec|=e.path("kind").asText().equals("REFERENCE_SOURCE")&&e.path("provider").asText().equals("OCC")&&e.path("qualification").asText().equals("VERIFIED_REFERENCE")&&e.path("reference").asText().equals(SPEC);
  return definition&&chain&&spec;
 }
}
