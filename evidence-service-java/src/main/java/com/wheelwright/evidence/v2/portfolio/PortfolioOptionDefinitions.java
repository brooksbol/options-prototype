package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.BrokerageArtifacts;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Native requested option definitions. Contract fields are not Order, custody or execution evidence. */
public final class PortfolioOptionDefinitions {
 private final PortfolioRepository repo;private final Map<String,String> bindings;
 public PortfolioOptionDefinitions(PortfolioRepository repo){this(repo,null);}
 /** Backend-validated public series bindings; never supplied by a client. */
 PortfolioOptionDefinitions(PortfolioRepository repo,Map<String,String> bindings){this.repo=repo;this.bindings=bindings==null?null:Map.copyOf(bindings);}
 public Set<String> admit(Connection c,String account,String artifact,Set<String> requested)throws Exception{
  byte[] bytes;boolean single;try(var q=c.prepareStatement("SELECT a.payload,i.file_type FROM brokerage_artifact a JOIN brokerage_import i ON a.account=i.account AND a.artifact_id=i.artifact_id WHERE a.account=? AND a.artifact_id=? AND i.file_type IN ('API_OPTION_DEFINITIONS','API_OPTION_DEFINITION')")){q.setString(1,account);q.setString(2,artifact);try(var row=q.executeQuery()){if(!row.next())throw new IllegalArgumentException("backend-qualified option definition required");bytes=row.getBytes(1);single=row.getString(2).equals("API_OPTION_DEFINITION");}}
  var root=JSON.readTree(bytes);var items=items(root,single);var found=new TreeMap<String,Document>();var underlyings=new TreeMap<String,Document>();int index=0;
  for(var raw:items){String series=raw.path("symbol").asText();if(!requested.contains(series)||found.containsKey(series)||!raw.path("instrument-type").asText().equals("Equity Option"))throw new IllegalArgumentException("unrequested, duplicate or unsupported definition");
   var existing=repo.get(c,instrument(series)).orElseThrow(()->new IllegalArgumentException("requested option Instrument absent"));if(!existing.value().path("kind").asText().equals("OPTION"))throw new IllegalArgumentException("option definition subject mismatch");var canonical=PortfolioOptionReferenceSources.seriesTerms(series);
   if(raw.hasNonNull("strike-price")&&new java.math.BigDecimal(raw.path("strike-price").asText()).compareTo(number(canonical.path("strike")))!=0||raw.hasNonNull("expiration-date")&&!raw.path("expiration-date").asText().equals(canonical.path("expiration").asText())||raw.hasNonNull("option-type")&&!raw.path("option-type").asText().equals(canonical.path("right").asText().equals("CALL")?"C":"P"))throw new IllegalArgumentException("reported definition contradicts its option series");
   String currency=existing.value().path("currency").asText();if(bindings!=null&&raw.hasNonNull("currency")&&!raw.path("currency").asText().equals(currency))throw new IllegalArgumentException("definition currency conflict");if(bindings!=null&&raw.hasNonNull("root-symbol")&&!raw.path("root-symbol").asText().equals(series.substring(0,series.length()-15).strip()))throw new IllegalArgumentException("definition root conflict");if(!currency.matches("[A-Z]{3}"))throw new IllegalArgumentException("qualified currency profile required");String underlying=raw.path("underlying-symbol").asText();if(bindings!=null&&!series.substring(0,series.length()-15).strip().equals(underlying))throw new IllegalArgumentException("definition underlying contradicts bound series");var terms=canonical.put("currency",currency).putNull("multiplier").put("exerciseStyle",switch(raw.path("exercise-style").asText()){case "American"->"AMERICAN";case "European"->"EUROPEAN";default->"UNKNOWN";}).put("settlement","UNKNOWN").put("adjustment",raw.path("option-chain-type").asText().equals("Standard")?"STANDARD":Set.of("Adjusted","NonStandard").contains(raw.path("option-chain-type").asText())?"ADJUSTED":"UNKNOWN").put("payoffApplicability","UNKNOWN").put("qualification","INCOMPLETE");terms.set("deliverable",array());terms.putNull("underlying");
   if(!underlying.isBlank()){
    if(!underlying.matches("[A-Z][A-Z0-9.]{0,9}"))throw new IllegalArgumentException("unsupported underlying reference");String uri=instrument(underlying);var prior=repo.get(c,uri);if(prior.isPresent()&&(!prior.get().value().path("kind").asText().equals("EQUITY")||!prior.get().value().path("currency").asText().equals(currency)))throw new IllegalArgumentException("underlying currency or unit conflict");terms.set("underlying",link(uri));
    if(prior.isEmpty()){String id=uri.substring(uri.lastIndexOf('/')+1);var value=obj().put("id",id).put("kind","EQUITY").put("symbol",underlying).put("currency",currency).putNull("option");value.set("self",link(uri));value.set("brokerAliases",array().add(obj().put("broker","TASTYTRADE").put("environment","PRODUCTION").put("identifier",underlying)));value.set("evidence",array());value.set("warnings",array());underlyings.put(uri,new Document(Kind.INSTRUMENT,uri,null,value,null,underlying));}
   }
   if(raw.hasNonNull("shares-per-contract")){
    var reported=new java.math.BigDecimal(raw.path("shares-per-contract").asText());if(reported.signum()<=0)throw new IllegalArgumentException("positive reported deliverable share count required");
    java.math.BigDecimal knownShares=null;for(var delivery:existing.value().at("/option/deliverable"))if(delivery.path("kind").asText().equals("SHARES")&&delivery.path("instrument").equals(terms.path("underlying")))knownShares=(knownShares==null?java.math.BigDecimal.ZERO:knownShares).add(number(delivery.path("quantity")));
    if(knownShares!=null&&reported.compareTo(knownShares)!=0)terms.put("qualification","CONFLICT");
   }
   var ref=obj().put("kind","REFERENCE_SOURCE").put("provider","TASTYTRADE").put("reference","urn:wheelwright:tastytrade:option-definition:sha256:"+BrokerageArtifacts.sha(bytes)+":item:"+index++).putNull("observedAt").put("qualification","VERIFIED_REFERENCE");terms.set("evidence",array().add(ref));if(bindings!=null)PortfolioTerminalSettlement.declared(terms,raw,ref);var combined=PortfolioReferenceTerms.combine(existing.value().path("option"),terms);var value=existing.value().deepCopy();value.set("option",combined);value.set("evidence",combined.path("evidence").deepCopy());value.set("warnings",PortfolioReferenceTerms.warnings(combined));found.put(series,new Document(Kind.INSTRUMENT,existing.uri(),null,value,null,series));
  }
  for(var value:underlyings.values())repo.put(c,value);for(var value:found.values())repo.put(c,value);return Set.copyOf(found.keySet());
 }
 public static ArrayNode items(JsonNode root,boolean single){
  if(root.findValue("account-number")!=null||root.findValue("account_number")!=null||root.findValue("accounts")!=null)throw new IllegalArgumentException("private scope in reference response");String context=root.path("context").asText();
  if(single){if(!root.path("data").isObject()||!context.isBlank()&&!context.startsWith("/instruments/equity-options/"))throw new IllegalArgumentException("single option definition required");return array().add(root.path("data"));}
  if(!root.at("/data/items").isArray()||!context.isBlank()&&!context.equals("/instruments/equity-options"))throw new IllegalArgumentException("batch option definitions required");return (ArrayNode)root.at("/data/items");
 }
 private String instrument(String symbol){if(bindings!=null){var target=bindings.get(symbol);if(target==null)throw new IllegalArgumentException("unbound public reference subject");return target;}return "/v2/instruments/"+UUID.nameUUIDFromBytes(("instrument:TASTYTRADE:"+symbol).getBytes(StandardCharsets.UTF_8));}
}
