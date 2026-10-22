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

/** Explicitly synthetic composed Model definitions, not additional accepted catalog families. */
class PortfolioNestedRecognitionTest {
 final JsonNode bundle;final Map<String,JsonNode> definitions=new LinkedHashMap<>();
 final PortfolioRecognition.Admission established=new PortfolioRecognition.Admission(true,true,true);
 final String childUri="/v2/constructions/models/CALL_BROKEN_WING_BUTTERFLY/versions/1";
 PortfolioNestedRecognitionTest()throws Exception{
  bundle=JSON.readTree(Files.readString(Path.of("../docs/reviews/api-v2-foundational-contract-2026-10-20/examples/resources.json")));
  var catalog=JSON.readTree(getClass().getResourceAsStream("/portfolio/construction-models.json"));for(var v:catalog.path("versions"))definitions.put(v.at("/self/href").asText(),v);
 }
 ObjectNode specimen(){
  var c=(ObjectNode)bundle.path("resources").path(bundle.at("/names/bwb").asText()).path("value").deepCopy();var recognition=(ObjectNode)c.path("recognition");recognition.put("status","UNCLASSIFIED").putNull("modelVersion");recognition.set("reasonCodes",array().add("SYNTHETIC_TEST_INPUT"));var group=(ObjectNode)c.path("composition");group.put("nodeId","wing");group.set("modelVersion",link(childUri));
  var extra=leaves(group).getFirst().deepCopy();extra.put("nodeId","EXTRA");extra.set("instrument",link("/v2/instruments/"+UUID.randomUUID()));((ObjectNode)extra.path("allocation")).set("holding",link("/v2/holdings/"+UUID.randomUUID()));((ObjectNode)extra.at("/allocation/inventory")).set("instrument",extra.path("instrument"));((ObjectNode)extra.at("/allocation/inventory")).set("holding",extra.at("/allocation/holding"));
  var root=obj().put("kind","GROUP").put("nodeId","ROOT").putNull("modelVersion");root.set("children",array().add(group).add(extra));c.set("composition",root);return c;
 }
 ObjectNode parent(){
  var model=obj().put("version","1").put("createdAt","2026-10-20T18:00:00Z").put("standing","CANDIDATE_NOT_PRODUCT_ACCEPTED");model.set("self",link("/v2/constructions/models/SYNTHETIC_NESTED/versions/1"));model.set("family",link("/v2/constructions/models/SYNTHETIC_NESTED"));
  var child=obj().put("name","WING").put("kind","MODEL").put("side","ANY").put("unit","PACKAGE").put("ratio","1").putNull("optionRight");child.set("modelVersion",link(childUri));var extra=obj().put("name","EXTRA").put("kind","OPTION").put("side","LONG").put("unit","CONTRACT").put("ratio","1").put("optionRight","CALL").putNull("modelVersion");model.set("roles",array().add(child).add(extra));var constraints=array();for(String kind:List.of("SAME_ACCOUNT","SAME_CURRENCY","SAME_UNDERLYING","SAME_EXPIRATION","COMPATIBLE_MULTIPLIERS","COMPATIBLE_DELIVERABLES","EVIDENCED_MEMBERSHIP")){var rule=obj().put("kind",kind).putNull("relation").putNull("ratio");rule.set("roles",array().add("WING").add("EXTRA"));constraints.add(rule);}model.set("constraints",constraints);model.set("valuation",definitions.get(childUri).path("valuation"));return model;
 }
 boolean matches(ObjectNode c,ObjectNode model){return PortfolioRecognition.matches(c,model,established,definitions);}
 @Test void nestedExactDefinitionResolvesWithoutChangingActualEconomicQuantities(){var c=specimen();var original=c.deepCopy();assertThat(matches(c,parent())).isTrue();assertThat(c).isEqualTo(original);var flattened=c.deepCopy();var group=obj().put("kind","GROUP").put("nodeId","flat");var children=array();leaves(c.path("composition")).forEach(x->children.add(x.deepCopy()));group.set("children",children);flattened.set("composition",group);var clock=Instant.parse("2026-10-20T18:00:00Z");assertThat(PortfolioMath.payoff(c,clock).path("geometry")).isEqualTo(PortfolioMath.payoff(flattened,clock).path("geometry"));}
 @Test void missingWrongAndNonVersionedChildDefinitionsDoNotValidate(){var c=specimen();var model=parent();var missing=new LinkedHashMap<>(definitions);missing.remove(childUri);assertThat(PortfolioRecognition.matches(c,model,established,missing)).isFalse();((ObjectNode)c.at("/composition/children/0")).set("modelVersion",link(childUri.replace("/1","/2")));assertThat(matches(c,model)).isFalse();c=specimen();((ObjectNode)c.at("/composition/children/0")).set("modelVersion",link("/v2/constructions/models/CALL_BROKEN_WING_BUTTERFLY"));assertThat(matches(c,model)).isFalse();}
 @Test void membershipAndCompatibilityAreNotInventedByRecursivePatternMatch(){for(String field:List.of("currency","account","expiration","multiplier","deliverable")){var c=specimen();var leaf=(ObjectNode)c.at("/composition/children/1");switch(field){case "currency"->leaf.put("currency","EUR");case "account"->((ObjectNode)leaf.at("/allocation/inventory")).set("account",link("/v2/accounts/acct_"+"b".repeat(32)));case "expiration"->((ObjectNode)leaf.path("terms")).put("expiration","2026-12-18");case "multiplier"->((ObjectNode)leaf.path("terms")).put("multiplier","10");default->((ObjectNode)leaf.path("terms")).put("adjustment","ADJUSTED");}assertThat(matches(c,parent())).as(field).isFalse();}assertThat(PortfolioRecognition.matches(specimen(),parent(),new PortfolioRecognition.Admission(false,true,true),definitions)).isFalse();}
 @Test void subtreeBoundariesAndChildStrikeRulesRemainBinding(){var c=specimen();((ObjectNode)c.at("/composition/children/0/children/2/terms")).put("strike","110");assertThat(matches(c,parent())).isFalse();var preserved=c.deepCopy();assertThat(PortfolioMath.payoff(c,Instant.now()).path("geometry").isObject()).isTrue();assertThat(c).isEqualTo(preserved);c=specimen();((ObjectNode)c.at("/composition/children/0")).set("modelVersion",link("/v2/constructions/models/IRON_CONDOR/versions/1"));assertThat(matches(c,parent())).isFalse();}
 @Test void flatParentCannotLaunderAnInvalidInlineModelLabel(){
  var c=specimen();((ArrayNode)c.at("/composition/children")).remove(1);((ObjectNode)c.at("/composition/children/0")).set("modelVersion",link("/v2/constructions/models/IRON_CONDOR/versions/1"));assertThat(PortfolioRecognition.matches(c,definitions.get(childUri),established,definitions)).isFalse();assertThat(PortfolioMath.payoff(c,Instant.now()).path("geometry").isObject()).isTrue();
 }
 @Test void packageRatiosAreExactIncludingFractionalCounts(){var c=specimen();var model=parent();((ObjectNode)c.at("/composition/children/1")).put("quantity","2");assertThat(matches(c,model)).isFalse();((ObjectNode)model.at("/roles/1")).put("ratio","2");assertThat(matches(c,model)).isTrue();
  c=specimen();model=parent();var child=(ObjectNode)definitions.get(childUri).deepCopy();String fractional=childUri.replace("/1","/fractional-3");child.set("self",link(fractional));child.put("version","fractional-3");for(var role:child.path("roles"))((ObjectNode)role).put("ratio",decimal(number(role.path("ratio")).multiply(new BigDecimal("3"))));definitions.put(fractional,child);((ObjectNode)c.at("/composition/children/0")).set("modelVersion",link(fractional));((ObjectNode)model.at("/roles/0")).set("modelVersion",link(fractional));((ObjectNode)model.at("/roles/1")).put("ratio","3");assertThat(matches(c,model)).isTrue();((ObjectNode)model.at("/roles/1")).put("ratio","3.0000000000000000000000000001");assertThat(matches(c,model)).isFalse();
 }
 @Test void duplicateOwnedNodesAndRecursiveDefinitionsNeverAcquireValidation(){var c=specimen();((ObjectNode)c.at("/composition/children/1")).put("nodeId","LOW");assertThat(matches(c,parent())).isFalse();c=specimen();var model=parent();var cyclic=(ObjectNode)definitions.get(childUri).deepCopy();cyclic.set("roles",array().add(model.at("/roles/0").deepCopy()));definitions.put(childUri,cyclic);assertThat(matches(c,model)).isFalse();}
}
