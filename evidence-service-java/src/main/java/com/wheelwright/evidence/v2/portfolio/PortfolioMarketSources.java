package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Projects existing accepted direct-quote evidence. Never contacts a source or changes its clocks. */
@Component
public final class PortfolioMarketSources {
 private final PortfolioRepository repository;
 public PortfolioMarketSources(PortfolioRepository repository){this.repository=repository;}
 public void refresh(Connection c)throws Exception {
  try(var query=c.prepareStatement("SELECT * FROM direct_quote ORDER BY symbol");var row=query.executeQuery()){
   while(row.next()){
    String symbol=row.getString("symbol"),provider=row.getString("provider"),environment=row.getString("environment"),sourceId=row.getString("observation_id");
    String instrumentId=UUID.nameUUIDFromBytes(("instrument:"+provider+":"+symbol).getBytes(StandardCharsets.UTF_8)).toString(),instrumentUri="/v2/instruments/"+instrumentId;
    var facts=JSON.readTree(row.getString("facts_json"));var evidence=array().add(obj().put("kind","REFERENCE_SOURCE").put("provider",provider).put("reference","urn:wheelwright:direct-quote:"+sourceId).putNull("observedAt").put("qualification","VERIFIED_REFERENCE"));
    var instrument=obj().put("id",instrumentId).put("kind",Set.of("EQUITY","ETF").contains(row.getString("security_type"))?"EQUITY":"OTHER").put("symbol",symbol).put("currency","USD").putNull("option");instrument.set("self",link(instrumentUri));instrument.set("brokerAliases",array().add(obj().put("broker",provider).put("environment",environment).put("identifier",symbol)));instrument.set("evidence",evidence);instrument.set("warnings",array());repository.put(c,new Document(Kind.INSTRUMENT,instrumentUri,null,instrument,null,sourceId));
    String observationId=UUID.nameUUIDFromBytes(("direct-quote-projection:"+sourceId).getBytes(StandardCharsets.UTF_8)).toString(),uri="/v2/market-observations/"+observationId;if(repository.get(c,uri).isPresent())continue;
    var observation=obj().put("id",observationId).putNull("account").putNull("observedAt").put("receivedAt",row.getString("received_at")).put("provider",provider).put("environment",environment).put("session",switch(row.getString("acquisition_phase")){case "REGULAR_USABLE"->"OPEN";case "CLOSED","POST_MARKET"->"CLOSED";case "PRE_MARKET"->"PREMARKET";default->"UNKNOWN";}).put("freshness","UNKNOWN");observation.set("self",link(uri));observation.set("instrument",link(instrumentUri));observation.set("evidence",evidence);observation.set("warnings",array());
    for(String field:List.of("bid","ask")){var fact=facts.path(field);var value=fact.get("price");var at=fact.path("sourceEventAt");if(value!=null&&value.isNumber()){var metric=metric(value.decimalValue(),"PRICE","USD",at.isTextual()?at.asText():null,"SOURCE_REPORTED_"+field.toUpperCase(Locale.ROOT),"QUALIFIED",evidence,"CURRENT_MARKET");metric.put("origin","BROKER_REPORTED");observation.set(field,metric);}else observation.set(field,unknown("PRICE",null,"MARKET_OBSERVATION_MISSING"));}
    var last=facts.path("last");if(last.path("price").isNumber()){var metric=metric(last.path("price").decimalValue(),"PRICE","USD",last.path("sourceEventAt").isTextual()?last.path("sourceEventAt").asText():null,"SOURCE_REPORTED_LAST_TRADE","QUALIFIED",evidence,"CURRENT_MARKET");metric.put("origin","BROKER_REPORTED");observation.set("mark",metric);}else observation.set("mark",unknown("PRICE",null,"MARKET_OBSERVATION_MISSING"));
    var bid=number(observation.at("/bid/value"));var ask=number(observation.at("/ask/value"));String time=null;
    if(bid!=null&&ask!=null&&bid.signum()>=0&&ask.compareTo(bid)>=0){String a=observation.at("/bid/asOf").asText(null),b=observation.at("/ask/asOf").asText(null);if(a!=null&&b!=null)time=Instant.parse(a).isBefore(Instant.parse(b))?a:b;observation.set("mid",metric(bid.add(ask).divide(BigDecimal.valueOf(2)),"PRICE","USD",time,"ARITHMETIC_BID_ASK_MIDPOINT","QUALIFIED",evidence,"CURRENT_MARKET"));}else observation.set("mid",unknown("PRICE",null,"MARKET_OBSERVATION_MISSING"));
    if(time!=null)observation.put("observedAt",time);else ((com.fasterxml.jackson.databind.node.ArrayNode)observation.get("warnings")).add(warning("MARKET_OBSERVATION_MISSING","/observedAt","Reported quote facts retain their individual source clocks.","A complete material quote timestamp is unavailable; receipt is not substituted."));
    // Freshness is evaluated at read time; immutable source state makes no current-at-every-read claim.
    repository.put(c,new Document(Kind.MARKET_OBSERVATION,uri,null,observation,null,sourceId));
   }
  }
 }
}
