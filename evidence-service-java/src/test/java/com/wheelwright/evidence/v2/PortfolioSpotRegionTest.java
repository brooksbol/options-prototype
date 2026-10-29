package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.v2.portfolio.*;
import com.fasterxml.jackson.databind.node.*;
import org.junit.jupiter.api.Test;
import java.util.*;import java.time.*;import java.math.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;
class PortfolioSpotRegionTest {
 ObjectNode evaluated(boolean inverse){
  var c=obj();var comp=obj().put("kind","GROUP").put("nodeId","root");var children=array();
  String[] sides=inverse?new String[]{"SHORT","LONG","LONG","SHORT"}:new String[]{"LONG","SHORT","SHORT","LONG"};String[] rights={"PUT","PUT","CALL","CALL"};int[] strikes={90,95,105,110};
  for(int i=0;i<4;i++){
   var leaf=obj().put("nodeId","n"+i).put("kind","OPTION").put("unit","CONTRACT").put("quantity","1").put("side",sides[i]).put("currency","USD");leaf.set("instrument",link("/v2/instruments/opt"+i));
   var terms=obj().put("right",rights[i]).put("strike",""+strikes[i]).put("expiration","2026-11-20").put("currency","USD").put("qualification","QUALIFIED").put("payoffApplicability","STANDARD_EQUITY_INTRINSIC").put("adjustment","STANDARD").put("settlement","PHYSICAL").put("multiplier","100");terms.set("underlying",link("/v2/instruments/underlying"));var deliver=obj().put("kind","SHARES").put("quantity","100");deliver.set("instrument",link("/v2/instruments/underlying"));terms.set("deliverable",array().add(deliver));terms.set("evidence",array());leaf.set("terms",terms);
   var allocation=obj();allocation.set("basis",metric(new BigDecimal(sides[i].equals("LONG")?"75":"25"),"MONEY","USD",null,"CONTROLLED_FIXTURE","QUALIFIED",array()));var inventory=obj();inventory.set("account",link("/v2/accounts/synthetic"));inventory.set("evidence",array());allocation.set("inventory",inventory);leaf.set("allocation",allocation);children.add(leaf);
  }
  comp.set("children",children);c.set("composition",comp);c.set("evidence",array());return PortfolioMath.evaluate(c,Map.of(),Instant.parse("2026-10-29T16:00:00Z"));
 }
 void spot(ObjectNode e,String price){e.set("spot",metric(new BigDecimal(price),"PRICE","USD",null,"CONTROLLED_FIXTURE","QUALIFIED",array()));}
 @Test void inverseCondorActualEvaluationCannotAcquireCreditStructureColors(){var e=evaluated(true);assertThat(e.at("/payoff/geometry/valueKind").asText()).isEqualTo("GROSS_PL");assertThat(e.at("/payoff/geometry/segments/0/intercept").asText()).isEqualTo("400");for(String price:List.of("85","93","100","107","115")){spot(e,price);assertThat(PortfolioMath.spotRegion(e)).isEqualTo("UNAVAILABLE");}assertThat(e.at("/payoff/geometry/boundaries")).hasSize(4);}
 @Test void qualifiedMaximumPlateauClassifiesRelativeContractualRegionsNotActualProfit(){var e=evaluated(false);spot(e,"100");assertThat(PortfolioMath.spotRegion(e)).isEqualTo("NEUTRAL_PLATEAU");spot(e,"93");assertThat(PortfolioMath.spotRegion(e)).isEqualTo("TRANSITION");for(String price:List.of("85","115")){spot(e,price);assertThat(PortfolioMath.spotRegion(e)).isEqualTo("ADVERSE_TAIL");}((ObjectNode)e.path("spot")).put("unit","MONEY");assertThat(PortfolioMath.spotRegion(e)).isEqualTo("UNAVAILABLE");}
}
