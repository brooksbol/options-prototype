package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.v2.BearerAuthenticator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Composes the existing global quote owner. No provider client, quote cache or custody mutation. */
@Component
public final class PortfolioPublicMarket {
 private final String base;
 private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();
 public PortfolioPublicMarket(@Value("${wheelwright.portfolio.public-market.base-url:}")String base){
  if(!base.isBlank()){var u=URI.create(base);if(!"http".equals(u.getScheme())||!Set.of("127.0.0.1","localhost").contains(u.getHost())||u.getUserInfo()!=null||u.getQuery()!=null||u.getFragment()!=null||!Set.of("","/").contains(u.getPath()))throw new IllegalArgumentException("Trusted local market owner required");}
  this.base=base.replaceFirst("/$","");
 }
 public void apply(ObjectNode inventory,PortfolioRepository repo,BearerAuthenticator.Principal caller,String bearer,Instant now,long deadline)throws Exception{
  if(base.isBlank()||bearer==null||!bearer.startsWith("Bearer ")||!caller.hasGrant("quote.acquire")||!caller.hasGrant("market.read")||!caller.hasGrant("reference.read"))return;
  var subjects=new TreeMap<String,List<ObjectNode>>();
  for(var account:inventory.path("accounts"))for(var item:account.path("items")){
   var e=item.path("evaluation");if(!e.isObject())continue;var uri=e.at("/payoff/geometry/underlying/href").asText();var instrument=repo.get(uri);
   if(instrument.isEmpty())continue;var i=instrument.get().value();String symbol=i.path("symbol").asText();
   if(!i.path("kind").asText().equals("EQUITY")||!i.path("currency").asText().equals("USD")||!symbol.matches("[A-Z][A-Z0-9.]{0,9}"))continue;
   subjects.computeIfAbsent(symbol,k->new ArrayList<>()).add((ObjectNode)e);
  }
  if(subjects.isEmpty()||subjects.size()>100)return;
  String id=UUID.randomUUID().toString();var body=obj().put("mode","ORDINARY");var requested=array();subjects.keySet().forEach(s->requested.add(obj().put("symbol",s)));body.set("subjects",requested);
  try{
   var request=HttpRequest.newBuilder(URI.create(base+"/v2/quotes")).timeout(Duration.ofSeconds(20)).header("Authorization",bearer).header("X-Request-Id",id).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body))).build();
   var response=com.wheelwright.evidence.v2.BoundedHttp.receive(http,request,200000,Math.min(deadline,System.nanoTime()+Duration.ofSeconds(20).toNanos()));byte[] bytes=response.body();if(response.statusCode()!=200||bytes.length>200000||!response.headers().firstValue("Content-Type").orElse("").startsWith("application/json"))throw new IllegalStateException();
   var result=JSON.readTree(bytes);if(!id.equals(result.path("requestId").asText())||!result.path("results").isArray()||result.path("results").size()!=subjects.size())throw new IllegalStateException();
   var seen=new HashSet<String>();var qualified=new TreeMap<String,ObjectNode>();
   for(var r:result.path("results")){String symbol=r.at("/subject/symbol").asText();if(!subjects.containsKey(symbol)||!seen.add(symbol))throw new IllegalStateException();if(!r.path("fulfilled").asBoolean()||!Set.of("NEWLY_ACQUIRED","REUSED").contains(r.path("outcome").asText()))continue;
    var q=r.path("observation");if(!q.at("/subject/symbol").asText().equals(symbol)||!Set.of("EQUITY","ETF").contains(q.at("/subject/securityType").asText())||!q.at("/provenance/environment").asText().equals("PRODUCTION"))continue;
    var bid=q.at("/facts/bid");var ask=q.at("/facts/ask");BigDecimal b=bid.path("price").isNumber()?bid.path("price").decimalValue():null,a=ask.path("price").isNumber()?ask.path("price").decimalValue():null;if(b==null||a==null||b.signum()<=0||a.compareTo(b)<0)continue;
    Instant bt=Instant.parse(bid.path("sourceEventAt").asText()),at=Instant.parse(ask.path("sourceEventAt").asText());if(bt.isAfter(now.plusSeconds(60))||at.isAfter(now.plusSeconds(60)))continue;Instant event=bt.isBefore(at)?bt:at;
    String observation=q.path("observationId").asText();if(!observation.matches("[a-fA-F0-9-]{36}")||q.at("/provenance/provider").asText().isBlank())continue;
    var evidence=array().add(obj().put("kind","REFERENCE_SOURCE").put("provider",q.at("/provenance/provider").asText()).put("reference","urn:wheelwright:direct-quote:"+observation).put("observedAt",event.toString()).put("qualification","VERIFIED_REFERENCE"));
    var spot=metric(b.add(a).divide(BigDecimal.valueOf(2)),"PRICE","USD",event.toString(),"ARITHMETIC_BID_ASK_MIDPOINT","QUALIFIED",evidence,"CURRENT_MARKET");spot.put("receivedAt",q.at("/provenance/receivedAt").asText());spot.put("observationDate",event.atZone(ZoneOffset.UTC).toLocalDate().toString());qualified.put(symbol,spot);
   }
   for(var entry:qualified.entrySet())for(var evaluation:subjects.get(entry.getKey())){
    var previous=evaluation.path("spot");Instant event=Instant.parse(entry.getValue().path("asOf").asText());
    if(previous.hasNonNull("asOf")&&!event.isAfter(Instant.parse(previous.path("asOf").asText())))continue;
    // Same-day exact market evidence takes explicit precedence over a day-only import; no midnight event is invented.
    if(previous.hasNonNull("observationDate")&&event.atZone(ZoneOffset.UTC).toLocalDate().isBefore(LocalDate.parse(previous.path("observationDate").asText())))continue;
    evaluation.set("spot",entry.getValue().deepCopy());evaluation.put("spotRegion",PortfolioMath.spotRegion(evaluation));PortfolioPayoffPlot.apply(evaluation);
   }
   for(var account:inventory.path("accounts"))for(var item:account.path("items")){var clock=PortfolioMarketClock.qualify(item.path("evaluation"));if(!clock.isEmpty())((ObjectNode)item).set("marketClock",clock);}
   inventory.put("marketAcquisition",qualified.size()==subjects.size()?"COMPLETED":qualified.isEmpty()?"UNAVAILABLE":"PARTIAL");
  }catch(Exception unavailable){inventory.put("marketAcquisition","UNAVAILABLE");}
 }
}
