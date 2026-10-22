package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Finite declarative applicability. Caller-owned source predicates are not inferred by pattern matching. */
public final class PortfolioRecognition {
 private PortfolioRecognition(){}
 public record Admission(boolean membershipEstablished,boolean economicCoverageEstablished,boolean coordinatedOpeningEstablished) {}
 /** Exact rational package count: comparisons never round a fractional package. */
 private record Quantity(BigDecimal numerator,BigDecimal denominator){
  Quantity divided(BigDecimal ratio){return new Quantity(numerator,denominator.multiply(ratio));}
  boolean equalsQuantity(Quantity other){return numerator.multiply(other.denominator).compareTo(other.numerator.multiply(denominator))==0;}
  Quantity multiplied(BigDecimal ratio){return new Quantity(numerator.multiply(ratio),denominator);}
 }
 private record Binding(ObjectNode node,Quantity quantity,List<ObjectNode> descendants){}
 private record Match(Quantity packages,List<ObjectNode> orderedLeaves){}
 public static boolean matches(ObjectNode construction,JsonNode version,Admission admission){return matches(construction,version,admission,Map.of());}
 /** Nested definitions resolve by exact immutable URI. Missing/unsupported definitions remain unclassified. */
 public static boolean matches(ObjectNode construction,JsonNode version,Admission admission,Map<String,? extends JsonNode> definitions){
  try{return match(construction.path("composition"),version,admission,definitions,Set.of(),new int[]{0})!=null;}
  catch(ArithmeticException|NullPointerException|IllegalArgumentException e){return false;}
 }
 private static Match match(JsonNode composition,JsonNode version,Admission admission,Map<String,? extends JsonNode> definitions,Set<String> ancestors,int[] attempts){
  if(++attempts[0]>10000)return null;String uri=version.at("/self/href").asText();if(!uri.matches("/v2/constructions/models/[^/?#]+/versions/(?!latest$)[^/?#]+")||ancestors.contains(uri))return null;
  var nodes=new ArrayList<ObjectNode>();if(!tree(composition,nodes,new HashSet<>(),0)||nodes.size()>256)return null;
  var owned=leaves(composition);if(owned.isEmpty()||owned.size()>12)return null;
  var roles=new ArrayList<JsonNode>();var names=new HashSet<String>();for(var role:version.path("roles")){if(role.path("name").asText().isBlank()||!names.add(role.path("name").asText())||number(role.path("ratio")).signum()<=0)return null;roles.add(role);}if(roles.isEmpty())return null;
  // An inline label is not a license to ignore an incompatible or missing exact child definition.
  for(var node:nodes)if(node.path("kind").asText().equals("GROUP")&&node.path("modelVersion").isObject()){
   String childUri=node.at("/modelVersion/href").asText();if(node==composition&&childUri.equals(uri))continue;
   var child=definitions.get(childUri);if(child==null||!child.at("/self/href").asText().equals(childUri)||match(node,child,admission,definitions,ancestors,attempts)==null)return null;
  }
  var stack=new HashSet<>(ancestors);stack.add(uri);nodes.removeIf(n->n==composition);
  // Leaf-only Models bind transitively; MODEL roles bind an explicit, disjoint inline subtree.
  if(roles.stream().noneMatch(r->r.path("kind").asText().equals("MODEL")))nodes=new ArrayList<>(owned);
  return bind(version,admission,definitions,stack,roles,nodes,0,new LinkedHashMap<>(),new HashSet<>(),owned.size(),attempts);
 }
 private static boolean tree(JsonNode node,List<ObjectNode> nodes,Set<String> ids,int depth){
  if(depth>16||!node.isObject()||node.path("nodeId").asText().isBlank()||!ids.add(node.path("nodeId").asText()))return false;nodes.add((ObjectNode)node);if(nodes.size()>256)return false;
  if(node.path("kind").asText().equals("GROUP")){if(!node.path("children").isArray())return false;for(var child:node.path("children"))if(!tree(child,nodes,ids,depth+1))return false;}return true;
 }
 private static Match bind(JsonNode model,Admission a,Map<String,? extends JsonNode> definitions,Set<String> stack,List<JsonNode> roles,List<ObjectNode> nodes,int index,Map<String,Binding> bound,Set<String> used,int total,int[] attempts){
  if(++attempts[0]>10000)return null;
  if(index==roles.size()){
   if(used.size()!=total||!constraints(model,a,bound))return null;
   Quantity packages=null;var ordered=new ArrayList<ObjectNode>();
   for(var role:roles){var binding=bound.get(role.path("name").asText());ordered.addAll(binding.descendants());if(Set.of("OPTION","MODEL").contains(role.path("kind").asText())){var size=binding.quantity().divided(number(role.path("ratio")));if(packages!=null&&!packages.equalsQuantity(size))return null;packages=size;}}
   if(packages==null&&roles.size()==1)packages=bound.get(roles.getFirst().path("name").asText()).quantity().divided(number(roles.getFirst().path("ratio")));
   return new Match(packages,List.copyOf(ordered));
  }
  var role=roles.get(index);for(var node:nodes){Binding binding;
   if(role.path("kind").asText().equals("MODEL")){
    String uri=role.at("/modelVersion/href").asText();var child=definitions.get(uri);
    if(!node.path("kind").asText().equals("GROUP")||!node.at("/modelVersion/href").asText().equals(uri)||child==null||!child.at("/self/href").asText().equals(uri)||!role.path("unit").asText().equals("PACKAGE")||!Set.of("ANY","LONG").contains(role.path("side").asText()))continue;
    var matched=match(node,child,a,definitions,stack,attempts);if(matched==null||matched.packages()==null)continue;binding=new Binding(node,matched.packages(),matched.orderedLeaves());
   }else{
    if(!role.path("kind").equals(node.path("kind"))||!role.path("unit").equals(node.path("unit"))||!role.path("side").asText().equals("ANY")&&!role.path("side").equals(node.path("side")))continue;
    if(role.path("kind").asText().equals("OPTION")&&!role.path("optionRight").asText().equals(node.at("/terms/right").asText()))continue;
    var quantity=number(node.path("quantity"));if(quantity==null||quantity.signum()<=0)continue;binding=new Binding(node,new Quantity(quantity,BigDecimal.ONE),List.of(node));
   }
   var claimed=new HashSet<String>();binding.descendants().forEach(n->claimed.add(n.path("nodeId").asText()));if(claimed.isEmpty()||!Collections.disjoint(used,claimed))continue;
   used.addAll(claimed);bound.put(role.path("name").asText(),binding);var found=bind(model,a,definitions,stack,roles,nodes,index+1,bound,used,total,attempts);if(found!=null)return found;used.removeAll(claimed);bound.remove(role.path("name").asText());
  }return null;
 }
 private static boolean constraints(JsonNode model,Admission a,Map<String,Binding> bound){
  for(var constraint:model.path("constraints")){
   var bindings=new ArrayList<Binding>();var nodes=new ArrayList<ObjectNode>();for(var r:constraint.path("roles")){var b=bound.get(r.asText());if(b==null)return false;bindings.add(b);nodes.addAll(b.descendants());}
   var options=nodes.stream().filter(n->n.path("kind").asText().equals("OPTION")).toList();
   switch(constraint.path("kind").asText()){
    case "SAME_ACCOUNT"->{if(!same(nodes,"/allocation/inventory/account/href",false))return false;}
    case "SAME_CURRENCY"->{if(!same(nodes,"/currency",false)||options.stream().anyMatch(n->!n.path("currency").equals(n.at("/terms/currency"))))return false;}
    case "SAME_UNDERLYING"->{if(!same(options,"/terms/underlying/href",false))return false;}
    case "SAME_EXPIRATION"->{if(!same(options,"/terms/expiration",false))return false;}
    case "COMPATIBLE_MULTIPLIERS"->{if(!same(options,"/terms/multiplier",true))return false;}
    case "COMPATIBLE_DELIVERABLES"->{if(!same(options,"/terms/deliverable",false)||!same(options,"/terms/adjustment",false)||!same(options,"/terms/settlement",false)||options.stream().anyMatch(n->!Set.of("ESTABLISHED","QUALIFIED").contains(n.at("/terms/qualification").asText())||!standardTerms(n.path("terms"))))return false;}
    case "STRIKE_ORDER"->{for(int i=1;i<options.size();i++){int cmp=number(options.get(i-1).at("/terms/strike")).compareTo(number(options.get(i).at("/terms/strike")));if(constraint.path("relation").asText().equals("LE")?cmp>0:constraint.path("relation").asText().equals("EQ")?cmp!=0:!constraint.path("relation").asText().equals("LT")||cmp>=0)return false;}}
    case "UNEQUAL_WING_WIDTHS","EQUAL_WING_WIDTHS"->{if(options.size()!=3)return false;var left=number(options.get(1).at("/terms/strike")).subtract(number(options.get(0).at("/terms/strike")));var right=number(options.get(2).at("/terms/strike")).subtract(number(options.get(1).at("/terms/strike")));if(left.signum()<=0||right.signum()<=0||left.compareTo(right)==0==constraint.path("kind").asText().equals("UNEQUAL_WING_WIDTHS"))return false;}
    case "EVIDENCED_MEMBERSHIP"->{if(!a.membershipEstablished())return false;}
    case "COORDINATED_OPENING"->{if(!a.coordinatedOpeningEstablished())return false;}
    case "EVIDENCED_COVERAGE"->{if(!a.economicCoverageEstablished()||nodes.size()!=2)return false;var support=nodes.get(0);var option=nodes.get(1);if(!option.path("kind").asText().equals("OPTION")||!option.path("side").asText().equals("SHORT")||!Set.of("CASH","LONG_SHARES").contains(support.path("kind").asText())||!support.path("side").asText().equals("LONG")||!standardTerms(option.path("terms")))return false;var required=number(option.path("quantity")).multiply(number(option.at("/terms/multiplier")));if(support.path("kind").asText().equals("CASH")){if(!option.at("/terms/right").asText().equals("PUT"))return false;required=required.multiply(number(option.at("/terms/strike")));}else if(!option.at("/terms/right").asText().equals("CALL")||!support.at("/instrument/href").equals(option.at("/terms/underlying/href")))return false;if(number(support.path("quantity")).compareTo(required)<0)return false;}
    case "QUANTITY_RATIO"->{var ratio=number(constraint.path("ratio"));if(bindings.size()!=2||ratio==null||ratio.signum()<=0||!bindings.get(0).quantity().equalsQuantity(bindings.get(1).quantity().multiplied(ratio)))return false;}
    default->{return false;}
   }
  }return true;
 }
 static boolean standardTerms(JsonNode terms){
  var multiplier=number(terms.path("multiplier"));var quantity=number(terms.at("/deliverable/0/quantity"));
  return terms.path("payoffApplicability").asText().equals("STANDARD_EQUITY_INTRINSIC")&&terms.path("adjustment").asText().equals("STANDARD")&&terms.path("settlement").asText().equals("PHYSICAL")&&terms.path("deliverable").size()==1&&multiplier!=null&&multiplier.signum()>0&&quantity!=null&&quantity.compareTo(multiplier)==0&&terms.at("/deliverable/0/kind").asText().equals("SHARES")&&terms.at("/deliverable/0/instrument/href").equals(terms.at("/underlying/href"))&&!terms.at("/underlying/href").asText().isBlank();
 }
 private static boolean same(List<ObjectNode> nodes,String pointer,boolean numeric){JsonNode first=null;for(var node:nodes){var value=node.at(pointer);if(value.isMissingNode()||value.isNull()||value.isTextual()&&(value.asText().isBlank()||value.asText().equals("UNKNOWN")))return false;if(first!=null&&(numeric?number(first).compareTo(number(value))!=0:!first.equals(value)))return false;first=value;}return true;}
}
