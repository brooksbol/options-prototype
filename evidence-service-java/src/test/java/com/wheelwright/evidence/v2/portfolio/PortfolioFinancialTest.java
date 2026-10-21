package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.junit.jupiter.api.Test;
import java.math.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;

/** Independent leg-by-leg specimens against the production piecewise evaluator. Offline only. */
class PortfolioFinancialTest {
 final JsonNode bundle;
 PortfolioFinancialTest()throws Exception {bundle=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/resources.json")));}
 ObjectNode construction(String name){return (ObjectNode)bundle.path("resources").path(bundle.at("/names/"+name).asText()).path("value").deepCopy();}
 BigDecimal direct(ObjectNode c,BigDecimal spot){BigDecimal sum=BigDecimal.ZERO;for(var leaf:leaves(c.get("composition"))){var quantity=number(leaf.get("quantity"));var basis=number(leaf.at("/allocation/basis/value"));BigDecimal held=switch(leaf.path("kind").asText()){
  case "CASH"->quantity;
  case "LONG_SHARES"->quantity.multiply(spot);
  default->{var strike=number(leaf.at("/terms/strike"));var intrinsic=leaf.at("/terms/right").asText().equals("CALL")?spot.subtract(strike):strike.subtract(spot);yield intrinsic.max(BigDecimal.ZERO).multiply(quantity).multiply(number(leaf.at("/terms/multiplier")));}
 };sum=sum.add(held.subtract(basis).multiply(leaf.path("side").asText().equals("LONG")?BigDecimal.ONE:BigDecimal.ONE.negate()));}return sum;}
 @Test void everySupportedGeometryEqualsIndependentConstituentEconomics() {
  int compositions=0,cases=0;for(var resource:bundle.path("resources")){if(!resource.path("schema").asText().equals("Construction"))continue;var c=(ObjectNode)resource.path("value");var result=PortfolioMath.payoff(c,Instant.parse("2026-10-20T18:00:00Z"));if(result.path("geometry").isNull())continue;compositions++;
   for(int spot=0;spot<=250;spot++){var price=BigDecimal.valueOf(spot);var segment=new ArrayList<JsonNode>();for(var s:result.at("/geometry/segments"))if(price.compareTo(number(s.path("lower")))>=0&&(s.path("upper").isNull()||price.compareTo(number(s.path("upper")))<0))segment.add(s);assertThat(segment).hasSize(1);var s=segment.getFirst();assertThat(number(s.path("slope")).multiply(price).add(number(s.path("intercept")))).isEqualByComparingTo(direct(c,price));cases++;}
  }assertThat(compositions).isGreaterThan(5);assertThat(cases).isGreaterThan(1500);
 }
 @Test void unequalBrokenWingTailsRemainUnequalAndApexIsNotPlateau(){var c=construction("bwb");var p=PortfolioMath.payoff(c,Instant.now());assertThat(p.path("geometry").isObject()).isTrue();var segments=p.at("/geometry/segments");assertThat(segments.get(0).path("intercept").asText()).isNotEqualTo(segments.get(segments.size()-1).path("intercept").asText());assertThat(PortfolioMath.evaluate(c,Map.of(),Instant.now()).at("/range/kind").asText()).isEqualTo("UNAVAILABLE");}
 @Test void adjustedMixedCurrencyAndMixedExpiryNeverAcquireExactPayoff(){for(String mutation:List.of("currency","expiration","deliverable")){var c=construction("bwb");var x=leaves(c.get("composition")).getFirst();switch(mutation){case "currency"->x.put("currency","EUR");case "expiration"->((ObjectNode)x.get("terms")).put("expiration","2026-12-18");default->((ObjectNode)x.get("terms")).put("adjustment","ADJUSTED");}assertThat(PortfolioMath.payoff(c,Instant.now()).path("geometry").isNull()).isTrue();}}
 @Test void longDebitOpeningFlowAndMissingFeesAreNeverCreditProfit(){var c=construction("bwb");var e=PortfolioMath.evaluate(c,Map.of(),Instant.now());assertThat(number(e.at("/openingCashFlow/value"))).isNegative();assertThat(e.at("/grossUnrealizedPl/value").isNull()).isTrue();assertThat(e.at("/netUnrealizedPl/value").isNull()).isTrue();}
 @Test void knownExpiryDteUsesNyCalendarAndNeverOpeningReceipt(){var c=construction("bwb");var e=PortfolioMath.evaluate(c,Map.of(),Instant.parse("2026-10-21T01:00:00Z"));var expiry=LocalDate.parse(leaves(c.get("composition")).getFirst().at("/terms/expiration").asText());assertThat(number(e.at("/timeline/remainingDays/value"))).isEqualByComparingTo(BigDecimal.valueOf(Math.max(0,java.time.temporal.ChronoUnit.DAYS.between(LocalDate.of(2026,10,20),expiry))));assertThat(e.at("/timeline/openedAt").isNull()).isTrue();assertThat(e.at("/timeline/originalDays/value").isNull()).isTrue();}
 @Test void brokenWingRejectsSymmetricWingsAndUnprovenMembership()throws Exception {var c=construction("bwb");var model=bundle.path("resources").path(c.at("/recognition/modelVersion/href").asText()).path("value");assertThat(PortfolioRecognition.matches(c,model,new PortfolioRecognition.Admission(true,true,true))).isTrue();assertThat(PortfolioRecognition.matches(c,model,new PortfolioRecognition.Admission(false,true,true))).isFalse();var leaves=leaves(c.get("composition"));((ObjectNode)leaves.get(2).get("terms")).put("strike","110");assertThat(PortfolioRecognition.matches(c,model,new PortfolioRecognition.Admission(true,true,true))).isFalse();}
 @Test void incompatibleMultiplierOrDeliverableNeverValidatesNamedStructure(){for(String field:List.of("multiplier","deliverable","currency")){var c=construction("bwb");var model=bundle.path("resources").path(c.at("/recognition/modelVersion/href").asText()).path("value");var t=(ObjectNode)leaves(c.get("composition")).getFirst().get("terms");if(field.equals("deliverable"))((ObjectNode)t.path(field).get(0)).put("quantity","10");else t.put(field,field.equals("currency")?"EUR":"10");assertThat(PortfolioRecognition.matches(c,model,new PortfolioRecognition.Admission(true,true,true))).isFalse();}}
 @Test void matchingButEconomicallyInvalidTermsAcrossEveryLegDoNotAcquireAName(){for(String defect:List.of("deliverable","underlying","adjustment")){var c=construction("bwb");var model=bundle.path("resources").path(c.at("/recognition/modelVersion/href").asText()).path("value");for(var x:leaves(c.path("composition"))){var terms=(ObjectNode)x.get("terms");switch(defect){case "deliverable"->((ObjectNode)terms.at("/deliverable/0")).put("quantity","10");case "underlying"->((ObjectNode)terms.at("/deliverable/0")).set("instrument",link("/v2/instruments/00000000-0000-0000-0000-000000000001"));default->terms.put("adjustment","ADJUSTED");}}assertThat(PortfolioRecognition.matches(c,model,new PortfolioRecognition.Admission(true,true,true))).as(defect).isFalse();}}
 @Test void spotUsesEquityMidWithItsOwnClockAndNeverSubstitutesLastTrade(){
  var c=construction("bwb");var now=Instant.parse("2026-10-20T18:00:00Z");String at="2026-10-20T17:59:00Z";String underlying=leaves(c.path("composition")).getFirst().at("/terms/underlying/href").asText();
  var observation=obj();observation.set("bid",metric(new BigDecimal("99"),"PRICE","USD",at,"SOURCE_BID","QUALIFIED",array()));observation.set("ask",metric(new BigDecimal("101"),"PRICE","USD",at,"SOURCE_ASK","QUALIFIED",array()));observation.set("mid",metric(new BigDecimal("100"),"PRICE","USD",at,"SOURCE_MID","QUALIFIED",array()));observation.set("mark",metric(new BigDecimal("900"),"PRICE","USD","2026-10-20T18:00:00Z","LAST_TRADE","QUALIFIED",array()));
  var result=PortfolioMath.evaluate(c,Map.of(underlying,observation),now);assertThat(result.at("/spot/value").asText()).isEqualTo("100");assertThat(result.at("/spot/asOf").asText()).isEqualTo(at);assertThat(result.at("/spot/method").asText()).isEqualTo("SOURCE_MID");
  for(String defect:List.of("missing","future","crossed","outside","zero")){var invalid=observation.deepCopy();switch(defect){case "missing"->invalid.set("mid",unknown("PRICE",null,"MARKET_OBSERVATION_MISSING"));case "future"->((ObjectNode)invalid.get("mid")).put("asOf","2026-10-20T18:01:01Z");case "crossed"->((ObjectNode)invalid.get("bid")).put("value","102");case "outside"->((ObjectNode)invalid.get("mid")).put("value","105");default->((ObjectNode)invalid.get("mid")).put("value","0");}assertThat(PortfolioMath.evaluate(c,Map.of(underlying,invalid),now).at("/spot/value").isNull()).as(defect).isTrue();}
 }
}
