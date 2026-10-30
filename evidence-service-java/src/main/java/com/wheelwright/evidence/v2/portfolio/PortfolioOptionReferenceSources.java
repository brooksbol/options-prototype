package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.BrokerageArtifacts;
import java.math.*;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.time.*;
import java.util.*;
import java.util.regex.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Requested held series only, from backend-qualified compact-chain reference bytes.
 * Shares-per-contract is a deliverable count; it is never substituted for the price multiplier.
 * Shared Instrument provenance contains no private Account Artifact identifiers.
 */
public final class PortfolioOptionReferenceSources {
 private final PortfolioRepository repo;private final Map<String,String> bindings;
 public PortfolioOptionReferenceSources(PortfolioRepository repo){this(repo,null);}
 /** Backend-validated public series bindings; never supplied by a client. */
 PortfolioOptionReferenceSources(PortfolioRepository repo,Map<String,String> bindings){this.repo=repo;this.bindings=bindings==null?null:Map.copyOf(bindings);}
 private static final Pattern OCC=Pattern.compile("([A-Z0-9.]{1,6}) {0,5}(\\d{2})(\\d{2})(\\d{2})([CP])(\\d{8})");
 public void admit(Connection c,String account,String artifact,String underlying,Set<String> requested)throws Exception{
  byte[] bytes;try(var q=c.prepareStatement("SELECT a.payload FROM brokerage_artifact a JOIN brokerage_import i ON a.account=i.account AND a.artifact_id=i.artifact_id WHERE a.account=? AND a.artifact_id=? AND i.file_type='API_OPTION_CHAIN'")){q.setString(1,account);q.setString(2,artifact);try(var row=q.executeQuery()){if(!row.next())throw new IllegalArgumentException("backend-qualified reference original required");bytes=row.getBytes(1);}}
  var root=JSON.readTree(bytes);validate(root,underlying);var underlyingInstrument=repo.get(c,instrument(underlying)).orElseThrow(()->new IllegalArgumentException("requested underlying Instrument absent"));if(!underlyingInstrument.value().path("kind").asText().equals("EQUITY"))throw new IllegalArgumentException("unsupported underlying financial unit");var found=new HashMap<String,ObjectNode>();int index=0;
  for(var group:root.at("/data/items")){
   if(!group.path("underlying-symbol").asText().equals(underlying))throw new IllegalArgumentException("foreign reference underlying");
   var symbols=group.path("symbols");if(!symbols.isArray())throw new IllegalArgumentException("reference symbols required");
   var evidence=array().add(obj().put("kind","REFERENCE_SOURCE").put("provider","TASTYTRADE").put("reference","urn:wheelwright:tastytrade:option-chain:sha256:"+BrokerageArtifacts.sha(bytes)+":item:"+index++).putNull("observedAt").put("qualification","VERIFIED_REFERENCE"));
   for(var symbol:symbols){String series=symbol.asText();if(!requested.contains(series))continue;if(found.containsKey(series))throw new IllegalArgumentException("ambiguous reference series");var instrument=repo.get(c,instrument(series)).orElseThrow(()->new IllegalArgumentException("requested Instrument absent"));if(instrument.kind()!=Kind.INSTRUMENT||!instrument.value().path("kind").asText().equals("OPTION"))throw new IllegalArgumentException("requested Instrument is not option");
    var canonical=seriesTerms(series);String currency=instrument.value().path("currency").asText();if(bindings!=null&&group.hasNonNull("currency")&&!group.path("currency").asText().equals(currency))throw new IllegalArgumentException("chain currency conflict");if(!currency.matches("[A-Z]{3}")||!underlyingInstrument.value().path("currency").asText().equals(currency))throw new IllegalArgumentException("qualified common currency profile required");
    var terms=canonical.put("currency",currency).putNull("multiplier").put("exerciseStyle","UNKNOWN").put("settlement","UNKNOWN").put("adjustment",group.path("option-chain-type").asText().equals("Standard")?"STANDARD":Set.of("NonStandard","Adjusted").contains(group.path("option-chain-type").asText())?"ADJUSTED":"UNKNOWN").put("payoffApplicability","UNKNOWN").put("qualification","INCOMPLETE");terms.set("underlying",link(instrument(underlying)));terms.set("evidence",evidence.deepCopy());var deliverables=array();terms.set("deliverable",deliverables);
    if(!group.path("deliverables").isArray())throw new IllegalArgumentException("explicit reference deliverables required");
    for(var delivery:group.path("deliverables")){
     BigDecimal amount=amount(delivery.path("amount"));if(amount==null||amount.signum()<=0)throw new IllegalArgumentException("reported positive deliverable amount required");var d=obj().put("quantity",decimal(amount)).putNull("instrument").putNull("currency");
     if(delivery.path("deliverable-type").asText().equals("Shares")&&delivery.path("instrument-type").asText().equals("Equity")&&delivery.path("symbol").asText().equals(underlying)){d.put("kind","SHARES");d.set("instrument",link(instrument(underlying)));}
     else if(delivery.path("deliverable-type").asText().equals("Cash")){d.put("kind","CASH");String reportedCurrency=delivery.path("currency").asText();if(reportedCurrency.matches("[A-Z]{3}"))d.put("currency",reportedCurrency);}
     else d.put("kind","OTHER");deliverables.add(d);
    }
    if(deliverables.size()==1&&deliverables.get(0).path("kind").asText().equals("SHARES")){var reported=amount(group.path("shares-per-contract"));if(reported==null||reported.compareTo(number(deliverables.get(0).path("quantity")))!=0)throw new IllegalArgumentException("deliverable terms conflict");terms.put("settlement","PHYSICAL");}
    var value=instrument.value().deepCopy();var combined=PortfolioReferenceTerms.combine(value.path("option"),terms);value.set("option",combined);value.set("evidence",combined.path("evidence").deepCopy());value.set("warnings",PortfolioReferenceTerms.warnings(combined));found.put(series,value);
   }
  }
  if(found.size()!=requested.size())throw new IllegalArgumentException("requested reference subjects missing");
  for(var e:found.entrySet())repo.put(c,new Document(Kind.INSTRUMENT,instrument(e.getKey()),null,e.getValue(),null,e.getKey()));
 }
 static ObjectNode seriesTerms(String series){var m=OCC.matcher(series);if(!m.matches())throw new IllegalArgumentException("unsupported option series geometry");String expiration=LocalDate.of(2000+Integer.parseInt(m.group(2)),Integer.parseInt(m.group(3)),Integer.parseInt(m.group(4))).toString();return obj().put("right",m.group(5).equals("C")?"CALL":"PUT").put("strike",decimal(new BigDecimal(m.group(6)).movePointLeft(3))).put("expiration",expiration);}
 public static void validate(JsonNode root,String underlying){String context=root.path("context").asText();if(!underlying.matches("[A-Z][A-Z0-9.]{0,9}")||!root.at("/data/items").isArray()||!context.isBlank()&&!context.equals("/option-chains/{symbol}/compact")&&!context.equals("/option-chains/"+underlying+"/compact")||root.findValue("account-number")!=null||root.findValue("account_number")!=null||root.findValue("accounts")!=null)throw new IllegalArgumentException("unsupported compact reference source");}
 private static BigDecimal amount(JsonNode n){try{return n.isTextual()||n.isNumber()?new BigDecimal(n.asText()):null;}catch(NumberFormatException e){return null;}}
 private String instrument(String symbol){if(bindings!=null){var target=bindings.get(symbol);if(target==null)throw new IllegalArgumentException("unbound public reference subject");return target;}return "/v2/instruments/"+UUID.nameUUIDFromBytes(("instrument:TASTYTRADE:"+symbol).getBytes(StandardCharsets.UTF_8));}
}
