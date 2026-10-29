package com.wheelwright.evidence.v2.portfolio;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;
/** Controlled claim predicates, not a new source-admission or lifecycle algorithm. */
class SharedTacticalClaimsTest {
 @Test void tenClaimSpecimensKeepIndependentFactsAndOnlyAdmittedEntry()throws Exception {
  var f=new TacticalFieldDependenciesTest();
  for(String specimen:List.of("unique-historical-opening","close-identical-reopen","partial-reduction","multiple-historical-openings","missing-opening","reported-basis-unknown-origin","missing-marks","market-unknown-entry","unassociated-management","established-whole-quantity")){
   var c=f.fixture.creditConstruction();var children=array();for(var leaf:leaves(c.path("composition")))if(leaf.at("/terms/right").asText().equals("PUT"))children.add(leaf);((ObjectNode)c.path("composition")).set("children",children);
   var opening=f.fixture.order(c,true);var closing=f.fixture.order(c,false);var alternate=f.fixture.order(c,true);var closed=f.fixture.order(c,false);boolean admitted=specimen.equals("established-whole-quantity")||specimen.equals("missing-marks");
   if(!admitted)opening.value().set("associations",array());
   if(specimen.equals("partial-reduction"))for(var leaf:children)((ObjectNode)leaf).put("quantity","0.5");
   if(specimen.equals("unassociated-management"))closing.value().set("associations",array());
   f.clearBasis(c);var p=f.position(c);var quotes=specimen.equals("missing-marks")?Map.<String,ObjectNode>of():f.quotes(c);p.set("evaluation",PortfolioMath.evaluate(c,quotes,f.fixture.now));
   var orders=new ArrayList<com.wheelwright.evidence.v2.portfolio.PortfolioRepository.Document>();if(!specimen.equals("missing-opening"))orders.add(opening);orders.add(closing);
   // Counterexamples have no admitted current-origin predicate; historical records cannot supply it.
   if(specimen.equals("multiple-historical-openings")||specimen.equals("close-identical-reopen")){var other=alternate;other.value().set("associations",array());if(specimen.equals("close-identical-reopen")){closed.value().put("status","FILLED");closed.value().set("associations",array());for(int i=0;i<closed.value().path("legs").size();i++){var leg=(ObjectNode)closed.value().path("legs").get(i);var fill=(ObjectNode)opening.value().at("/legs/"+i+"/fills/0").deepCopy();fill.put("executedAt","2026-10-06T14:00:00Z");leg.set("fills",array().add(fill));leg.set("filledQuantity",opening.value().path("legs").get(i).path("filledQuantity").deepCopy());}orders.add(closed);for(var leg:other.value().path("legs"))for(var fill:leg.path("fills"))((ObjectNode)fill).put("executedAt","2026-10-07T14:00:00Z");}orders.add(other);}
   if(specimen.equals("reported-basis-unknown-origin"))for(var leaf:children)((ObjectNode)leaf).set("brokerSourceOnly",obj().put("average-open-price","2.00").put("cost-effect","Credit"));
   PortfolioOrderEvaluation.apply(p,c,orders,f.fixture.now);PortfolioReadService.propagate(p,f.coverage(c,p),c);
   var expanded=p.deepCopy();expanded.set("included",obj().set("construction",c));var dto=PortfolioTactical.project(expanded,Map.of(),Map.of());
   assertThat(dto.at("/evaluation/payoff/geometry").isObject()).as(specimen).isTrue();assertThat(dto.at("/evaluation/timeline/remainingDays/value").isNull()).as(specimen).isFalse();
   assertThat(dto.at("/evaluation/openingCashFlow/value").isNull()).as(specimen).isEqualTo(!admitted);
   assertThat(dto.at("/evaluation/grossUnrealizedPl/value").isNull()).as(specimen).isEqualTo(!admitted||specimen.equals("missing-marks"));
   if(!admitted)assertThat(dto.at("/evaluation/timeline/openedAt").isNull()).as(specimen).isTrue();
   assertThat(dto.at("/evaluation/spot/value").isNull()).as(specimen).isEqualTo(specimen.equals("missing-marks"));
  }
 }
}
