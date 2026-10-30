package com.wheelwright.evidence.v2.portfolio;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Set;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
/** Descriptive per-contract comparison. Consumes already authorized terms and spot; never regime or basis. */
public final class PortfolioMoneyness {
 private PortfolioMoneyness(){}
 public static void apply(ObjectNode evaluation,JsonNode construction){
  evaluation.remove("moneyness");var legs=array();var spot=evaluation.path("spot");
  for(var leaf:leaves(construction.path("composition")))if(leaf.path("kind").asText().equals("OPTION")){
   var t=leaf.path("terms");var strike=number(t.path("strike"));
   boolean full=t.path("payoffApplicability").asText().equals("STANDARD_EQUITY_INTRINSIC")&&t.path("adjustment").asText().equals("STANDARD")&&t.path("settlement").asText().equals("PHYSICAL")&&t.path("deliverable").size()==1&&t.at("/deliverable/0/kind").asText().equals("SHARES")&&t.at("/deliverable/0/instrument").equals(t.path("underlying"))&&number(t.path("multiplier"))!=null&&number(t.at("/deliverable/0/quantity"))!=null&&number(t.path("multiplier")).signum()>0&&number(t.path("multiplier")).compareTo(number(t.at("/deliverable/0/quantity")))==0;
   boolean supported=!t.path("qualification").asText().equals("CONFLICT")&&(full||PortfolioTerminalSettlement.quantity(t)!=null)&&strike!=null&&strike.signum()>=0&&Set.of("CALL","PUT").contains(t.path("right").asText())&&t.at("/underlying/href").isTextual()&&!t.at("/underlying/href").asText().isBlank()&&t.path("currency").asText().matches("[A-Z]{3}");
   var leg=obj().put("nodeId",leaf.path("nodeId").asText()).put("status",supported?"QUALIFIED":"UNAVAILABLE").put("right",Set.of("CALL","PUT").contains(t.path("right").asText())?t.path("right").asText():"UNKNOWN").put("observedState","UNAVAILABLE").putNull("spotAsOf");leg.set("strike",t.path("strike").isMissingNode()?com.fasterxml.jackson.databind.node.NullNode.instance:t.path("strike"));leg.set("spotWarningCodes",array());
   if(supported){boolean call=t.path("right").asText().equals("CALL");leg.put("below",call?"OTM":"ITM").put("at","AT_STRIKE").put("above",call?"ITM":"OTM");
    // The evaluator's spot must refer to this single common underlying, not another leg's asset.
    var roots=new java.util.HashSet<String>();for(var x:leaves(construction.path("composition"))){String root=x.path("kind").asText().equals("OPTION")?x.at("/terms/underlying/href").asText():x.path("kind").asText().equals("LONG_SHARES")?x.at("/instrument/href").asText():"";if(!root.isBlank())roots.add(root);}
    if(roots.size()==1&&roots.contains(t.at("/underlying/href").asText())&&established(spot)&&spot.path("unit").asText().equals("PRICE")&&spot.path("currency").equals(t.path("currency"))&&number(spot.path("value"))!=null&&number(spot.path("value")).signum()>0&&qualifiedClock(evaluation,spot)){
     int cmp=number(spot.path("value")).compareTo(strike);leg.put("observedState",cmp==0?"AT_STRIKE":cmp<0?leg.path("below").asText():leg.path("above").asText());leg.set("spotAsOf",spot.path("asOf"));leg.set("spotWarningCodes",spot.path("warningCodes").deepCopy());
    }
   }legs.add(leg);
  }
  if(!legs.isEmpty()){var m=obj().put("method","EXACT_STRIKE_COMPARISON");m.set("legs",legs);evaluation.set("moneyness",m);}
 }
 static boolean qualifiedClock(JsonNode evaluation,JsonNode spot){try{return !java.time.Instant.parse(spot.path("asOf").asText()).isAfter(java.time.Instant.parse(evaluation.path("evaluatedAt").asText()).plusSeconds(60));}catch(java.time.DateTimeException invalid){return false;}}
}
