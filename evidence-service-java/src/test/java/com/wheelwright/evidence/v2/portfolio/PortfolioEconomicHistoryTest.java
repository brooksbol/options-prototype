package com.wheelwright.evidence.v2.portfolio;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;

class PortfolioEconomicHistoryTest {
 @Test void threePrincipalSpecimensComputeDocumentedEconomicsWithoutTaxOrRealizedAttributionInvention()throws Exception{
  var b=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/resources.json")));var cases=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/economic-history.json"))).path("comparisons");
  for(String name:List.of("covered-call-ten-rolls","successive-protective-puts","leaps-maturity")){
   var source=cases.path(name);var original=(ObjectNode)b.path("resources").path(source.at("/original/construction/href").asText()).path("value");var current=(ObjectNode)b.path("resources").path(source.at("/current/construction/href").asText()).path("value");var result=PortfolioEconomicHistory.compare(original,current,source.path("cumulative"),Instant.parse("2026-10-20T18:00:00Z"));BigDecimal net=BigDecimal.ZERO;for(var event:source.at("/cumulative/events"))net=net.add(number(event.at("/openingCashFlow/value"))).add(number(event.at("/closingCashFlow/value"))).subtract(number(event.at("/fee/value")));assertThat(number(result.at("/cumulative/netDocumentedOptionCashFlow/value"))).isEqualByComparingTo(net);
   for(String key:List.of("openingPremiumsReceived","openingPremiumsPaid","closingCashFlows","fees","replacementCostsPaid","economicBreakevenPerShare"))if(!source.at("/cumulative/"+key+"/value").isNull())assertThat(number(result.at("/cumulative/"+key+"/value"))).as(name+":"+key).isEqualByComparingTo(number(source.at("/cumulative/"+key+"/value")));
   assertThat(result.at("/cumulative/brokerTaxBasis/value").isNull()).isTrue();assertThat(result.at("/cumulative/realizedNetPl/value").isNull()).isTrue(); // Source fixture supplies no broker-reported attribution predicate.
   if(name.equals("successive-protective-puts")){assertThat(result.at("/original/protectionStatus").asText()).isEqualTo("HISTORICAL_ONLY");assertThat(result.at("/current/protectionStatus").asText()).isEqualTo("CURRENT_CONTRACTUAL");assertThat(result.at("/original/protectionStrike/value")).isNotEqualTo(result.at("/current/protectionStrike/value"));}
   if(name.equals("leaps-maturity"))assertThat(result.at("/current/rights").asText()).isEqualTo("RIGHT_TO_BUY_SHARES");
   var partial=(ObjectNode)source.path("cumulative").deepCopy();partial.put("historyStatus","PARTIAL");var incomplete=PortfolioEconomicHistory.compare(original,current,partial,Instant.now());assertThat(incomplete.at("/cumulative/economicBreakevenPerShare/value").isNull()).isTrue();assertThat(incomplete.at("/cumulative/netDocumentedOptionCashFlow/warningCodes/0").asText()).isEqualTo("HISTORY_INCOMPLETE");
   var out=Path.of("build/portfolio-responses");Files.createDirectories(out);var capture=obj().put("path","economic-comparison").put("schema","EconomicComparison");capture.set("body",result);Files.writeString(out.resolve(UUID.randomUUID()+".json"),capture.toString());
  }
 }
 @Test void adjustedUnknownOrDifferentCurrencyPutCannotEstablishCurrentShareProtection()throws Exception{
  var b=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/resources.json")));var history=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/economic-history.json"))).at("/comparisons/successive-protective-puts");var original=(ObjectNode)b.path("resources").path(history.at("/original/construction/href").asText()).path("value");
  for(String defect:List.of("adjusted","currency","deliverable","unverified")){var current=(ObjectNode)b.path("resources").path(history.at("/current/construction/href").asText()).path("value").deepCopy();var put=leaves(current.path("composition")).stream().filter(n->n.path("kind").asText().equals("OPTION")).findFirst().orElseThrow();var terms=(ObjectNode)put.path("terms");switch(defect){case "adjusted"->terms.put("adjustment","ADJUSTED");case "currency"->{put.put("currency","EUR");terms.put("currency","EUR");}case "deliverable"->terms.set("deliverable",array());default->terms.put("qualification","INCOMPLETE");}var result=PortfolioEconomicHistory.compare(original,current,history.path("cumulative"),Instant.parse("2026-10-20T18:00:00Z"));assertThat(result.at("/current/protectionStatus").asText()).as(defect).isEqualTo("UNKNOWN");assertThat(result.at("/current/lossFloorGrossPl/value").isNull()).isTrue();assertThat(result.at("/current/optionTerms/0")).isEqualTo(terms);assertThat(result.at("/original/protectionStatus").asText()).isEqualTo("HISTORICAL_ONLY");}
 }

 @Test void historyNeverAddsPricesAsDollarsOrNegativeBasisAsPaidInvestment()throws Exception{
  var b=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/resources.json")));var source=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/economic-history.json"))).at("/comparisons/covered-call-ten-rolls");for(String defect:List.of("cashUnit","feeUnit","basisUnit","negativeBasis")){var original=(ObjectNode)b.path("resources").path(source.at("/original/construction/href").asText()).path("value").deepCopy();var current=(ObjectNode)b.path("resources").path(source.at("/current/construction/href").asText()).path("value");var history=(ObjectNode)source.path("cumulative").deepCopy();if(defect.equals("cashUnit"))((ObjectNode)history.at("/events/0/openingCashFlow")).put("unit","PRICE");else if(defect.equals("feeUnit"))((ObjectNode)history.at("/events/0/fee")).put("unit","PRICE");else{var share=leaves(original.path("composition")).stream().filter(n->n.path("kind").asText().equals("LONG_SHARES")).findFirst().orElseThrow();var basis=(ObjectNode)share.at("/allocation/basis");if(defect.equals("basisUnit"))basis.put("unit","PRICE");else basis.put("value","-1");}var result=PortfolioEconomicHistory.compare(original,current,history,Instant.parse("2026-10-20T18:00:00Z"));assertThat(result.at("/cumulative/economicBreakevenPerShare/value").isNull()).as(defect).isTrue();if(defect.endsWith("Unit")&&!defect.equals("basisUnit"))assertThat(result.at("/cumulative/netDocumentedOptionCashFlow/value").isNull()).isTrue();else assertThat(result.at("/original/shareAcquisitionBasis/value").isNull()).isTrue();}
 }

}
