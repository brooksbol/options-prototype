package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.AccountDirectory;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Normalizes an already retained, request-qualified typed quote response.
 * The caller owns transport and request/source authority. Currency is explicit admission input,
 * never inferred from an amount or silently replaced by USD. No contract terms are invented.
 */
public final class PortfolioTastyMarketSources {
 private final PortfolioRepository repository;
 public PortfolioTastyMarketSources(PortfolioRepository repository){this.repository=repository;}
 public ArrayNode admit(Connection connection,AccountDirectory.Account account,String artifact,Map<String,String> currencies)throws Exception{
  var admissionWarnings=array();
  if(!account.brokerAssociation().broker().equals("TASTYTRADE"))throw new IllegalArgumentException("unsupported market source");
  byte[] bytes;String received;
  try(var q=connection.prepareStatement("SELECT payload,received_at FROM brokerage_artifact WHERE account=? AND artifact_id=?")){q.setString(1,account.id());q.setString(2,artifact);try(var row=q.executeQuery()){if(!row.next())throw new IllegalArgumentException("Account market original missing");bytes=row.getBytes(1);received=row.getString(2);}}
  var root=JSON.readTree(bytes);String context=root.path("context").asText();if(!context.isBlank()&&!context.equals("/market-data/by-type")||root.findValue("account-number")!=null||root.findValue("account_number")!=null||root.findValue("accounts")!=null)throw new IllegalArgumentException("unsupported market source scope");var items=root.at("/data/items");if(!items.isArray())throw new IllegalArgumentException("typed market response required");
  var symbols=new HashSet<String>();
  // Preflight before writes: a response position cannot substitute for requested subject identity.
  for(var raw:items){String symbol=raw.path("symbol").asText();if(!currencies.containsKey(symbol)||!symbols.add(symbol)||!Set.of("Equity","Equity Option").contains(raw.path("instrument-type").asText()))throw new IllegalArgumentException("unrequested, duplicate or unsupported market subject");String currency=currencies.get(symbol);if(currency!=null&&!currency.matches("[A-Z]{3}"))throw new IllegalArgumentException("explicit currency qualification required");var instrument=repository.get(connection,"/v2/instruments/"+id("instrument:TASTYTRADE:"+symbol)).orElseThrow(()->new IllegalArgumentException("requested Instrument must resolve before quote admission"));if(instrument.kind()!=Kind.INSTRUMENT||!instrument.value().path("kind").asText().equals(raw.path("instrument-type").asText().equals("Equity")?"EQUITY":"OPTION")||currency!=null&&!instrument.value().path("currency").asText().equals(currency))throw new IllegalArgumentException("market subject terms conflict");}
  if(symbols.size()!=currencies.size())admissionWarnings.add(warning("MARKET_OBSERVATION_MISSING","","Returned requested subjects remain independently inspectable.","Some requested subjects are absent; retained older observations are not a successful current refresh for those subjects."));
  int index=0;for(var raw:items){
   String symbol=raw.path("symbol").asText(),currency=currencies.get(symbol),instrumentUri="/v2/instruments/"+id("instrument:TASTYTRADE:"+symbol);
   var instrument=repository.get(connection,instrumentUri);if(instrument.isEmpty())throw new IllegalArgumentException("requested Instrument must resolve before quote admission");
   String clock=raw.path("updated-at").asText(null);boolean clockValid=false;if(clock!=null)try{Instant.parse(clock);clockValid=true;}catch(java.time.DateTimeException ignored){}
   var ref=source(account.id(),artifact,"/data/items/"+index,null,received,"TASTYTRADE");ref.put("requiredCapability","account.market.read:"+account.id());if(clockValid)ref.put("observedAt",clock).put("observationDate",Instant.parse(clock).atZone(java.time.ZoneOffset.UTC).toLocalDate().toString()).put("observationPrecision","INSTANT").put("timeAuthority","SOURCE");
   var evidence=array().add(ref);String guid=id("tasty-market:"+account.id()+":"+artifact+":"+index++),uri="/v2/market-observations/"+guid;
   if(repository.get(connection,uri).isPresent())continue;
   var observation=obj().put("id",guid).put("provider","TASTYTRADE").put("environment","PRODUCTION").put("receivedAt",received).put("session","UNKNOWN").put("freshness","UNKNOWN");observation.set("self",link(uri));observation.set("account",link("/v2/accounts/"+account.id()));observation.set("instrument",link(instrumentUri));if(clockValid)observation.put("observedAt",clock);else observation.putNull("observedAt");observation.set("evidence",evidence);var warnings=array();observation.set("warnings",warnings);
   for(String field:List.of("bid","ask","mid","mark")){
    BigDecimal amount=null;try{if(raw.path(field).isTextual()||raw.path(field).isNumber())amount=new BigDecimal(raw.path(field).asText());}catch(NumberFormatException ignored){}
    if(amount!=null&&amount.signum()>=0&&currency!=null){var metric=metric(amount,"PRICE",currency,clockValid?clock:null,"SOURCE_REPORTED_"+field.toUpperCase(Locale.ROOT),"QUALIFIED",evidence,"CURRENT_MARKET");metric.put("origin","BROKER_REPORTED");((ArrayNode)metric.path("assumptions")).add("Currency is supplied by the request's qualified Instrument/source profile, not reported by this quote amount. Receipt is not the source event time.");observation.set(field,metric);}
    else{var metric=unknown("PRICE",null,currency==null?"TERMS_UNAVAILABLE":"MARKET_OBSERVATION_MISSING");if(currency==null)metric.putNull("currency");else metric.put("currency",currency);observation.set(field,metric);}
   }
   var bid=number(observation.at("/bid/value"));var ask=number(observation.at("/ask/value"));var mid=number(observation.at("/mid/value"));
   if(bid!=null&&ask!=null&&mid!=null&&(bid.compareTo(ask)>0||mid.compareTo(bid)<0||mid.compareTo(ask)>0)){
    var conflict=unknown("PRICE",clockValid?clock:null,"SOURCE_CONFLICT").put("status","CONFLICT");if(currency==null)conflict.putNull("currency");else conflict.put("currency",currency);conflict.set("evidence",evidence);observation.set("mid",conflict);warnings.add(warning("SOURCE_CONFLICT","/mid","Individual reported bid/ask and original source remain inspectable.","Reported midpoint is inconsistent with the reported market; no repaired midpoint is invented."));
   }
   if(!clockValid)warnings.add(warning("MARKET_OBSERVATION_MISSING","/observedAt","Reported prices retain their source qualification.","A usable source event clock is missing; receipt cannot establish freshness."));
   if(currency==null)warnings.add(warning("TERMS_UNAVAILABLE","/mid","Original source prices remain inspectable.","Quote currency is not established by the admitted source profile."));
   repository.put(connection,new Document(Kind.MARKET_OBSERVATION,uri,account.id(),observation,null,artifact+":"+symbol));
  }return admissionWarnings;
 }
 private static String id(String text){return UUID.nameUUIDFromBytes(text.getBytes(StandardCharsets.UTF_8)).toString();}
}
