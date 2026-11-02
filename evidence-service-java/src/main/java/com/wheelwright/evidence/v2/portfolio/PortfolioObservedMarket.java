package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.v2.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Read-only reuse of the existing appliance's retained underlying observation.
 * Its legacy observedAt is chain receipt time, never an exchange event clock. */
@Component
public final class PortfolioObservedMarket {
 private final String base;
 private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofMillis(500)).followRedirects(HttpClient.Redirect.NEVER).build();
 public PortfolioObservedMarket(@Value("${wheelwright.portfolio.observed-market.base-url:}")String base){
  if(!base.isBlank()){var u=URI.create(base);if(!u.getScheme().equals("http")||!java.util.Set.of("127.0.0.1","localhost").contains(u.getHost())||u.getUserInfo()!=null||u.getQuery()!=null||u.getFragment()!=null||!java.util.Set.of("","/").contains(u.getPath()))throw new IllegalArgumentException("Local retained-market source required");}
  this.base=base.replaceFirst("/$","");
 }
 public void apply(ObjectNode evaluation,PortfolioRepository repo,BearerAuthenticator.Principal caller,Instant now,PortfolioReadService.ReadContext context)throws Exception{
  if(base.isEmpty()||established(evaluation.path("spot"))||!caller.hasGrant("market.read")||!caller.hasGrant("reference.read"))return;
  String uri=evaluation.at("/payoff/geometry/underlying/href").asText();var instrument=repo.get(uri);if(instrument.isEmpty()||!instrument.get().value().path("kind").asText().equals("EQUITY")||!instrument.get().value().path("currency").asText().equals("USD"))return;
  String symbol=instrument.get().value().path("symbol").asText();if(!symbol.matches("[A-Z0-9^][A-Z0-9.^/-]{0,31}"))return;
  if(!context.observedSpots.containsKey(symbol))context.observedSpots.put(symbol,read(symbol,now,context));
  var spot=context.observedSpots.get(symbol);if(spot!=null)evaluation.set("spot",spot.deepCopy());
 }
 private ObjectNode read(String symbol,Instant now,PortfolioReadService.ReadContext context){
  long remaining=(context.observedMarketDeadline-System.nanoTime())/1000000;if(remaining<=0)return null;
  try{
   var request=HttpRequest.newBuilder(URI.create(base+"/api/evidence/quotes?symbol="+URLEncoder.encode(symbol,StandardCharsets.UTF_8))).timeout(Duration.ofMillis(Math.min(1000,remaining))).GET().build();
   var response=http.send(request,HttpResponse.BodyHandlers.ofByteArray());if(response.statusCode()!=200||response.body().length>20000||!response.headers().firstValue("Content-Type").orElse("").startsWith("application/json"))return null;
   var rows=JSON.readTree(response.body()).path("quotes");if(rows.size()!=1||!rows.get(0).path("symbol").asText().equals(symbol))return null;
   var observation=rows.get(0).path("observation");var price=observation.path("price");if(!price.isNumber()||price.decimalValue().signum()<=0||!observation.path("observedAt").isTextual())return null;
   String received=observation.path("observedAt").asText();if(Instant.parse(received).isAfter(now.plusSeconds(60)))return null;
   var evidence=array().add(obj().put("kind","REFERENCE_SOURCE").put("provider","WHEELWRIGHT").put("reference","urn:wheelwright:retained-underlying:"+symbol+":"+BrokerageArtifacts.sha(observation.toString().getBytes(StandardCharsets.UTF_8))).putNull("observedAt").put("qualification","VERIFIED_REFERENCE"));
   var metric=metric(price.decimalValue(),"PRICE","USD",null,"RETAINED_APPLIANCE_UNDERLYING_LAST_PRICE","QUALIFIED",evidence,"CURRENT_MARKET");metric.put("receivedAt",received);
   ((com.fasterxml.jackson.databind.node.ArrayNode)metric.path("assumptions")).add("Existing appliance underlying last-price observation. receivedAt is chain receipt time; source event time is unavailable. Not a bid/ask midpoint, option mark or current position P/L.");
   return metric;
  }catch(Exception unavailable){return null;}
 }
}
