package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** The accepted tt credit-spread/condor close policy; not a general rule for debit structures. */
final class PortfolioPackageValuation {
 private PortfolioPackageValuation(){}
 record MarkValue(BigDecimal amount,ArrayNode evidence){}
 static boolean creditSpreadFamily(List<ObjectNode> nodes){
  if(nodes.size()!=2&&nodes.size()!=4||nodes.stream().anyMatch(n->!n.path("kind").asText().equals("OPTION")))return false;
  JsonNode first=nodes.getFirst();var styles=new HashSet<String>();
  for(var n:nodes){var t=n.path("terms");if(!PortfolioRecognition.standardTerms(t)||!t.path("payoffApplicability").asText().equals("STANDARD_EQUITY_INTRINSIC")||!Set.of("ESTABLISHED","QUALIFIED").contains(t.path("qualification").asText())||!n.path("currency").equals(first.path("currency"))||!t.path("underlying").equals(first.path("terms").path("underlying"))||!t.path("expiration").equals(first.path("terms").path("expiration"))||!t.path("deliverable").equals(first.path("terms").path("deliverable"))||number(n.path("quantity")).compareTo(number(first.path("quantity")))!=0||number(t.path("multiplier")).compareTo(number(first.path("terms").path("multiplier")))!=0)return false;if(!t.path("exerciseStyle").asText().equals("UNKNOWN"))styles.add(t.path("exerciseStyle").asText());}
  if(styles.size()>1)return false;var puts=nodes.stream().filter(n->n.at("/terms/right").asText().equals("PUT")).toList();var calls=nodes.stream().filter(n->n.at("/terms/right").asText().equals("CALL")).toList();
  if(nodes.size()==2)return puts.size()==2?vertical(puts,true):calls.size()==2&&vertical(calls,false);
  if(puts.size()!=2||calls.size()!=2||!vertical(puts,true)||!vertical(calls,false))return false;return strike(shortLeg(puts)).compareTo(strike(shortLeg(calls)))<=0;
 }
 private static boolean vertical(List<ObjectNode> nodes,boolean put){if(nodes.size()!=2)return false;var longs=nodes.stream().filter(n->n.path("side").asText().equals("LONG")).toList();var shorts=nodes.stream().filter(n->n.path("side").asText().equals("SHORT")).toList();return longs.size()==1&&shorts.size()==1&&(put?strike(longs.getFirst()).compareTo(strike(shorts.getFirst()))<0:strike(shorts.getFirst()).compareTo(strike(longs.getFirst()))<0);}
 private static ObjectNode shortLeg(List<ObjectNode> nodes){return nodes.stream().filter(n->n.path("side").asText().equals("SHORT")).findFirst().orElseThrow();}
 private static BigDecimal strike(JsonNode node){return number(node.at("/terms/strike"));}
 static Optional<MarkValue> marks(List<ObjectNode> nodes,Map<String,ObjectNode> observations,String currency){
  BigDecimal sum=BigDecimal.ZERO;var evidence=array();
  for(var n:nodes){var q=observations.get(n.at("/instrument/href").asText());if(q==null)return Optional.empty();var mark=q.path("mark");var bid=number(q.at("/bid/value"));var ask=number(q.at("/ask/value"));var value=number(mark.path("value"));if(!established(mark)||!mark.path("unit").asText().equals("PRICE")||!mark.path("currency").asText().equals(currency)||bid==null||ask==null||value==null||value.signum()<0||bid.compareTo(ask)>0||value.compareTo(bid)<0||value.compareTo(ask)>0||!mark.path("asOf").equals(q.at("/mid/asOf")))return Optional.empty();
   int sign=n.path("side").asText().equals("LONG")?1:-1;sum=sum.add(value.multiply(number(n.path("quantity"))).multiply(number(n.at("/terms/multiplier"))).multiply(BigDecimal.valueOf(sign)));for(var ref:mark.path("evidence"))evidence.add(ref.deepCopy());
  }return sum.signum()<=0?Optional.of(new MarkValue(sum,evidence)):Optional.empty();
 }
}
