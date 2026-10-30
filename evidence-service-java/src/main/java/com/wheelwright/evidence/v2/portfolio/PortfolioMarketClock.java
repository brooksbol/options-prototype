package com.wheelwright.evidence.v2.portfolio;
import com.fasterxml.jackson.databind.JsonNode;import com.fasterxml.jackson.databind.node.ObjectNode;import java.time.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
/** Market observation age and existing policy state, never a custody clock or freshness-policy change. */
public final class PortfolioMarketClock {
 private PortfolioMarketClock(){}
 public static ObjectNode qualify(JsonNode evaluation){
  var n=obj();String source=evaluation.path("oldestMaterialObservationAt").asText("");String basis="OLDEST_MATERIAL_MARKET_OBSERVATION";
  if(source.isBlank()&&established(evaluation.path("spot"))){source=evaluation.at("/spot/asOf").asText("");basis="SPOT_OBSERVATION";}
  if(source.isBlank())return n;try{var now=Instant.parse(evaluation.path("evaluatedAt").asText());var observed=Instant.parse(source);n.put("sourceAt",source).put("basis",basis).put("policyState",evaluation.path("freshness").asText("UNKNOWN"));if(observed.isAfter(now))n.putNull("ageSeconds");else n.put("ageSeconds",Duration.between(observed,now).getSeconds());}catch(java.time.DateTimeException invalid){}return n;
 }
}
