package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.AccountDirectory;
import java.sql.Connection;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Corroborates existing brokerage instructions against actual reported parent/child records.
 * No new Order, Position, reservation, OCO execution guarantee or lifecycle association. */
public final class PortfolioComplexOrderEvidence {
 private final PortfolioRepository repo;
 public PortfolioComplexOrderEvidence(PortfolioRepository repo){this.repo=repo;}
 public void admit(Connection connection,AccountDirectory.Account account,String artifact)throws Exception{
  byte[] bytes;String received;try(var q=connection.prepareStatement("SELECT payload,received_at FROM brokerage_artifact WHERE account=? AND artifact_id=?")){q.setString(1,account.id());q.setString(2,artifact);try(var rows=q.executeQuery()){if(!rows.next())throw new IllegalArgumentException("complex original missing");bytes=rows.getBytes(1);received=rows.getString(2);}}
  var root=JSON.readTree(bytes);String context=root.path("context").asText(),scope=account.brokerAssociation().accountNumber();if(!account.brokerAssociation().broker().equals("TASTYTRADE")||!root.at("/data/items").isArray()||!context.isBlank()&&!context.equals("/accounts/"+scope+"/complex-orders"))throw new IllegalArgumentException("unsupported complex source");
  var pending=new ArrayList<Document>();int index=0;var seen=new HashSet<String>();
  for(var group:root.at("/data/items")){
   String id=group.path("id").asText();if(id.isBlank()||!group.path("account-number").asText().equals(scope)||!Set.of("OCO","OTOCO").contains(group.path("type").asText())||!group.path("orders").isArray())throw new IllegalArgumentException("unsupported complex group");
   if(group.path("type").asText().equals("OCO")&&group.path("trigger-order").isObject())throw new IllegalArgumentException("OCO cannot report a trigger");
   var children=new ArrayList<JsonNode>();group.path("orders").forEach(children::add);if(group.path("trigger-order").isObject())children.add(group.path("trigger-order"));
   for(var child:children){String childId=child.path("id").asText();if(childId.isBlank()||!child.path("account-number").asText().equals(scope)||!seen.add(childId))throw new IllegalArgumentException("ambiguous complex child scope");
    String uri="/v2/orders/"+UUID.nameUUIDFromBytes((account.id()+":TASTYTRADE:order:"+childId).getBytes(java.nio.charset.StandardCharsets.UTF_8));var document=repo.get(connection,uri);if(document.isEmpty())continue;var order=document.get();if(order.kind()!=Kind.ORDER||!Objects.equals(order.account(),account.id()))throw new IllegalArgumentException("complex child target scope");
    var raw=reportedOrder(connection,order);boolean agrees=raw!=null&&sameInstruction(raw,child)&&(!order.value().hasNonNull("brokerGroupId")||order.value().path("brokerGroupId").asText().equals(id));
    var evidence=array().add(source(account.id(),artifact,"/data/items/"+index,null,received,"TASTYTRADE").put("requiredCapability","account.orders.read:"+account.id()));var value=order.value().deepCopy();value.set("brokerGroupAuthority",PortfolioSources.authority(account.id(),"complex:"+id+":"+childId,"BROKER_PACKAGE_RECORD",agrees?"QUALIFIED":"UNRESOLVED",evidence,List.of(uri),agrees?"Native "+group.path("type").asText()+" parent/child record agrees with the independently retained instruction. Historical corroboration only; no current atomic group, execution guarantee or Position membership asserted.":"Parent/child and independently retained instruction do not agree; group-dependent conclusions remain unsupported."));
    if(agrees)value.put("brokerGroupId",id);
    {
     var structure=obj().put("groupId",id).put("type",group.path("type").asText()).put("role",group.path("trigger-order").path("id").asText().equals(childId)?"TRIGGER":"CHILD");
     var members=array();int missing=0;
     for(var component:group.path("orders")){String member=orderUri(account.id(),component.path("id").asText());if(repo.get(connection,member).filter(d->d.kind()==Kind.ORDER&&Objects.equals(d.account(),account.id())).isPresent())members.add(link(member));else missing++;}
     structure.set("childOrders",members);String triggerId=group.path("trigger-order").path("id").asText();
     if(triggerId.isBlank()){structure.putNull("triggerOrder");if(group.path("type").asText().equals("OTOCO"))missing++;}else{String trigger=orderUri(account.id(),triggerId);if(repo.get(connection,trigger).filter(d->d.kind()==Kind.ORDER&&Objects.equals(d.account(),account.id())).isPresent())structure.set("triggerOrder",link(trigger));else{structure.putNull("triggerOrder");missing++;}}
     structure.put("missingMemberCount",missing).put("status",!agrees?"CONFLICT":missing==0?"QUALIFIED":"INCOMPLETE");
     structure.put("qualification","Native historical instruction relationship only. Not current-held origin, governance, uninterrupted custody, reservation or execution guarantee.");value.set("brokerGroupStructure",structure);
    }
    if(!agrees) if(!value.path("warnings").toString().contains("Complex-child instruction scope or terms conflict"))((ArrayNode)value.path("warnings")).add(warning("SOURCE_CONFLICT","/brokerGroupAuthority","The separately retained brokerage instruction and group originals remain inspectable.","Complex-child instruction scope or terms conflict; no group-dependent manual checkpoint is established."));pending.add(new Document(Kind.ORDER,uri,account.id(),value,order.snapshot(),order.sourceKey()));
   }index++;
  }
  for(var document:pending)repo.put(connection,document);
 }
 private static String orderUri(String account,String id){return "/v2/orders/"+UUID.nameUUIDFromBytes((account+":TASTYTRADE:order:"+id).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
 private JsonNode reportedOrder(Connection connection,Document order)throws Exception{
  for(var ref:order.value().path("evidence")){String artifact=ref.at("/artifact/href").asText(),pointer=ref.at("/locator/value").asText();if(!ref.path("kind").asText().equals("ACCOUNT_SOURCE")||!ref.at("/account/href").asText().equals("/v2/accounts/"+order.account())||!pointer.matches("/data/items/[0-9]+")||!artifact.startsWith("/v2/artifacts/"))continue;
   try(var q=connection.prepareStatement("SELECT payload FROM brokerage_artifact WHERE account=? AND artifact_id=?")){q.setString(1,order.account());q.setString(2,artifact.substring("/v2/artifacts/".length()));try(var rows=q.executeQuery()){if(rows.next()){var raw=JSON.readTree(rows.getBytes(1)).at(pointer);if(raw.path("id").asText().equals(order.sourceKey()))return raw;}}}
  }return null;
 }
 private static boolean sameInstruction(JsonNode a,JsonNode b){
  for(String field:List.of("status","order-type","price-effect","time-in-force","gtc-date"))if(!a.path(field).equals(b.path(field)))return false;
  for(String field:List.of("price","stop-trigger")){var left=decimalNode(a.path(field));var right=decimalNode(b.path(field));if(left==null||right==null){if(!a.path(field).equals(b.path(field)))return false;}else if(left.compareTo(right)!=0)return false;}
  var left=legs(a);var right=legs(b);return left!=null&&right!=null&&left.equals(right);
 }
 private static java.math.BigDecimal decimalNode(JsonNode node){return node.isNumber()||node.isTextual()?new java.math.BigDecimal(node.asText()):null;}
 private static List<String> legs(JsonNode order){var result=new ArrayList<String>();for(var leg:order.path("legs")){var quantity=decimalNode(leg.path("quantity"));if(quantity==null||quantity.signum()<=0)return null;result.add(leg.path("symbol").asText()+"|"+leg.path("instrument-type").asText()+"|"+leg.path("action").asText()+"|"+quantity.stripTrailingZeros().toPlainString());}Collections.sort(result);return result;}
}
