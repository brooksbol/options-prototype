package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;

/** Controlled contract evidence, not real Fidelity terms. Adapted from the independent October29 falsifier. */
class PortfolioShareCallShapeTest {
 static final Instant now=Instant.parse("2026-10-29T16:00:00Z");
 static ObjectNode fixture(String shares,String multiplier,String calls){String u="/v2/instruments/11111111-1111-4111-8111-111111111111";var stock=obj().put("kind","LONG_SHARES").put("side","LONG").put("quantity",shares).put("unit","SHARE").put("currency","USD");stock.set("instrument",link(u));var call=obj().put("kind","OPTION").put("side","SHORT").put("quantity",calls).put("unit","CONTRACT").put("currency","USD");call.set("instrument",link("/v2/instruments/22222222-2222-4222-8222-222222222222"));var t=obj().put("qualification","QUALIFIED").put("payoffApplicability","STANDARD_EQUITY_INTRINSIC").put("adjustment","STANDARD").put("settlement","PHYSICAL").put("currency","USD").put("multiplier",multiplier).put("strike","10").put("right","CALL").put("expiration","2026-11-20");t.set("underlying",link(u));var d=obj().put("kind","SHARES").put("quantity",multiplier);d.set("instrument",link(u));t.set("deliverable",array().add(d));t.set("evidence",array());call.set("terms",t);for(var leaf:List.of(stock,call)){var a=obj();a.set("basis",unknown("MONEY",now.toString(),"BASIS_ATTRIBUTION_UNKNOWN"));a.set("inventory",obj().set("evidence",array()));leaf.set("allocation",a);leaf.set("economics",obj().set("fees",unknown("MONEY",now.toString(),"HISTORY_INCOMPLETE")));}var c=obj();c.set("composition",obj().put("kind","GROUP").set("children",array().add(stock).add(call)));c.set("evidence",array());return c;}

 @Test void knownContractTermsSupportTerminalCapWithoutOpeningBasisOrProfitClaims(){
  var c=fixture("100","100","1");var e=PortfolioMath.evaluate(c,Map.of(),now);var p=e.path("payoff");
  assertThat(p.path("status").asText()).isEqualTo("QUALIFIED");assertThat(p.at("/geometry/valueKind").asText()).isEqualTo("TERMINAL_VALUE");assertThat(p.at("/geometry/segments/0/slope").asText()).isEqualTo("100");assertThat(p.at("/geometry/segments/1/slope").asText()).isEqualTo("0");assertThat(p.at("/geometry/segments/1/intercept").asText()).isEqualTo("1000");assertThat(p.at("/geometry/breakEvenPrices")).isEmpty();assertThat(e.at("/openingCashFlow/value").isNull()).isTrue();assertThat(e.at("/grossUnrealizedPl/value").isNull()).isTrue();
 }
 @Test void exactEvidencedQuantityRatioControlsTheTailRatherThanACoveredCallTemplate(){
  for(var example:List.of(new String[]{"150","100","1","50"},new String[]{"50","100","1","-50"},new String[]{"100","50","2","0"})){
   var p=PortfolioMath.terminalPayoff(fixture(example[0],example[1],example[2]),now);assertThat(p.path("status").asText()).isEqualTo("QUALIFIED");assertThat(p.at("/geometry/segments/1/slope").asText()).isEqualTo(example[3]);
  }
 }
 @Test void missingTermsNeverAcquireACappedContractualShape(){
  for(String field:List.of("multiplier","deliverable","adjustment","settlement","payoffApplicability")){
   var c=fixture("100","100","1");var t=(ObjectNode)c.at("/composition/children/1/terms");if(field.equals("deliverable"))t.set(field,array());else t.putNull(field);var p=PortfolioMath.terminalPayoff(c,now);assertThat(p.path("status").asText()).as(field).isNotEqualTo("QUALIFIED");assertThat(p.path("geometry").isNull()).as(field).isTrue();
  }
 }
}
