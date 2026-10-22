package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Declarative Model applicability. Pattern compatibility never proves composition membership. */
public final class PortfolioRecognition {
 private PortfolioRecognition(){}
 public record Admission(boolean membershipEstablished,boolean economicCoverageEstablished,boolean coordinatedOpeningEstablished) {}
 public static boolean matches(ObjectNode construction,JsonNode version,Admission admission){
  var nodes=leaves(construction.path("composition"));if(nodes.size()!=version.path("roles").size())return false;
  var roles=new ArrayList<JsonNode>();version.path("roles").forEach(roles::add);
  // Twelve leaves is an engineering budget, not a financial refusal: larger trees remain unclassified.
  if(nodes.size()>12)return false;return bind(construction,version,admission,roles,nodes,0,new LinkedHashMap<>(),new HashSet<>(),new int[]{0});
 }
 private static boolean bind(ObjectNode c,JsonNode model,Admission a,List<JsonNode> roles,List<ObjectNode> nodes,int index,Map<String,ObjectNode> binding,Set<String> used,int[] attempts){
  if(++attempts[0]>10000)return false;if(index==roles.size())return constraints(c,model,a,binding);
  var role=roles.get(index);for(var node:nodes){String id=node.path("nodeId").asText();if(used.contains(id)||!role.path("kind").asText().equals(node.path("kind").asText())||!role.path("unit").asText().equals(node.path("unit").asText())||!role.path("side").asText().equals("ANY")&&!role.path("side").asText().equals(node.path("side").asText()))continue;
   if(role.path("kind").asText().equals("OPTION")&&!role.path("optionRight").asText().equals(node.at("/terms/right").asText()))continue;used.add(id);binding.put(role.path("name").asText(),node);if(bind(c,model,a,roles,nodes,index+1,binding,used,attempts))return true;used.remove(id);binding.remove(role.path("name").asText());}return false;
 }
 private static boolean constraints(ObjectNode c,JsonNode model,Admission a,Map<String,ObjectNode> bound){
  try{
   BigDecimal packageSize=null;for(var role:model.path("roles"))if(role.path("kind").asText().equals("OPTION")){var node=bound.get(role.path("name").asText());var quantity=number(node.get("quantity"));var ratio=number(role.get("ratio"));var size=quantity.divide(ratio);if(packageSize!=null&&packageSize.compareTo(size)!=0)return false;packageSize=size;}
   for(var constraint:model.path("constraints")){
    var nodes=new ArrayList<ObjectNode>();for(var r:constraint.path("roles")){var n=bound.get(r.asText());if(n==null)return false;nodes.add(n);}
    var options=nodes.stream().filter(n->n.path("kind").asText().equals("OPTION")).toList();
    switch(constraint.path("kind").asText()){
     case "SAME_ACCOUNT"->{if(!same(nodes,"/allocation/inventory/account/href",false))return false;}
     case "SAME_CURRENCY"->{if(!same(nodes,"/currency",false)||options.stream().anyMatch(n->!n.path("currency").equals(n.at("/terms/currency"))))return false;}
     case "SAME_UNDERLYING"->{if(!same(options,"/terms/underlying/href",false))return false;}
     case "SAME_EXPIRATION"->{if(!same(options,"/terms/expiration",false))return false;}
     case "COMPATIBLE_MULTIPLIERS"->{if(!same(options,"/terms/multiplier",true))return false;}
     case "COMPATIBLE_DELIVERABLES"->{if(!same(options,"/terms/deliverable",false)||!same(options,"/terms/adjustment",false)||!same(options,"/terms/settlement",false)||options.stream().anyMatch(n->!Set.of("ESTABLISHED","QUALIFIED").contains(n.at("/terms/qualification").asText())||!standardTerms(n.path("terms"))))return false;}
     case "STRIKE_ORDER"->{for(int i=1;i<options.size();i++){int cmp=number(options.get(i-1).at("/terms/strike")).compareTo(number(options.get(i).at("/terms/strike")));if(constraint.path("relation").asText().equals("LE")?cmp>0:constraint.path("relation").asText().equals("EQ")?cmp!=0:cmp>=0)return false;}}
     case "UNEQUAL_WING_WIDTHS","EQUAL_WING_WIDTHS"->{if(options.size()!=3)return false;var left=number(options.get(1).at("/terms/strike")).subtract(number(options.get(0).at("/terms/strike")));var right=number(options.get(2).at("/terms/strike")).subtract(number(options.get(1).at("/terms/strike")));if(left.signum()<=0||right.signum()<=0||left.compareTo(right)==0==constraint.path("kind").asText().equals("UNEQUAL_WING_WIDTHS"))return false;}
     case "EVIDENCED_MEMBERSHIP"->{if(!a.membershipEstablished())return false;}
     case "COORDINATED_OPENING"->{if(!a.coordinatedOpeningEstablished())return false;}
     case "EVIDENCED_COVERAGE"->{if(!a.economicCoverageEstablished()||nodes.size()!=2)return false;var support=nodes.get(0);var option=nodes.get(1);var required=number(option.path("quantity")).multiply(number(option.at("/terms/multiplier")));if(support.path("kind").asText().equals("CASH"))required=required.multiply(number(option.at("/terms/strike")));else if(!support.at("/instrument/href").equals(option.at("/terms/underlying/href")))return false;if(number(support.path("quantity")).compareTo(required)<0)return false;}
     case "QUANTITY_RATIO"->{if(nodes.size()!=2||number(nodes.get(0).path("quantity")).compareTo(number(nodes.get(1).path("quantity")).multiply(number(constraint.path("ratio"))))!=0)return false;}
     default->{return false;} // Unsupported constraints never silently pass.
    }
   }return true;
  }catch(ArithmeticException|NullPointerException|IllegalArgumentException ex){return false;}
 }
 static boolean standardTerms(JsonNode terms){
  var multiplier=number(terms.path("multiplier"));var quantity=number(terms.at("/deliverable/0/quantity"));
  return terms.path("payoffApplicability").asText().equals("STANDARD_EQUITY_INTRINSIC")&&terms.path("adjustment").asText().equals("STANDARD")&&terms.path("settlement").asText().equals("PHYSICAL")&&terms.path("deliverable").size()==1&&multiplier!=null&&multiplier.signum()>0&&quantity!=null&&quantity.compareTo(multiplier)==0&&terms.at("/deliverable/0/kind").asText().equals("SHARES")&&terms.at("/deliverable/0/instrument/href").equals(terms.at("/underlying/href"))&&!terms.at("/underlying/href").asText().isBlank();
 }
 private static boolean same(List<ObjectNode> nodes,String pointer,boolean numeric){JsonNode first=null;for(var node:nodes){var value=node.at(pointer);if(value.isMissingNode()||value.isNull()||value.isTextual()&&(value.asText().isBlank()||value.asText().equals("UNKNOWN")))return false;if(first!=null&&(numeric?number(first).compareTo(number(value))!=0:!first.equals(value)))return false;first=value;}return true;}
}
