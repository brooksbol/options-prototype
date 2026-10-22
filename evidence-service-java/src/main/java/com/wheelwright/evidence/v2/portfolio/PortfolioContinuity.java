package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.v2.PositionSnapshot;
import java.sql.Connection;
import java.time.Instant;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Qualified observation reconciliation only. Inventory similarity never proves an economic occurrence. */
final class PortfolioContinuity {
 record Decision(Document previous,boolean withhold){}
 private final PortfolioRepository repo;
 PortfolioContinuity(PortfolioRepository repo){this.repo=repo;}
 Decision select(Connection connection,PositionSnapshot snapshot,List<ObjectNode> members)throws Exception{
  var incoming=index(members);if(incoming.isEmpty()||incoming.size()!=members.size())return new Decision(null,true);
  var compatible=new ArrayList<Document>();boolean activeScope=false,overlappingScope=false;
  for(var position:repo.list(connection,Kind.POSITION,Set.of(snapshot.account()))){
   if(!Objects.equals(position.account(),snapshot.account())||position.value().path("state").asText().equals("CLOSED")||position.value().at("/exposure/status").asText().equals("SUPERSEDED_INTERPRETATION"))continue;
   var construction=repo.get(connection,position.value().at("/currentConstruction/href").asText());if(construction.isEmpty())continue;
   var existing=index(PortfolioCurrentExposure.priorLeaves(repo,connection,position));if(Collections.disjoint(existing.keySet(),incoming.keySet()))continue;activeScope=true;if(!existing.keySet().equals(incoming.keySet())){overlappingScope=true;continue;}
   if(!position.value().path("state").asText().equals("UNRESOLVED")||existing.size()!=members.size())continue;
   boolean same=true;for(String key:incoming.keySet())same&=compatible(existing.get(key),incoming.get(key));
   if(same)compatible.add(position);
  }
  if(overlappingScope||compatible.size()!=1)return new Decision(null,activeScope);
  var previous=compatible.getFirst();
  // An old retained observation cannot replace the current source cut. No closure is inferred.
  if(previous.snapshot()!=null)try(var query=connection.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? AND snapshot_id=?")){
   query.setString(1,snapshot.account());query.setString(2,previous.snapshot());try(var rows=query.executeQuery()){if(rows.next()){
    var before=JSON.readValue(rows.getString(1),PositionSnapshot.class);int date=snapshot.evidenceDate().compareTo(before.evidenceDate());if(date<0||date==0&&Instant.parse(snapshot.recordedAt()).isBefore(Instant.parse(before.recordedAt())))return new Decision(null,true);
   }}
  }
  return new Decision(previous,false);
 }
 private static Map<String,ObjectNode> index(List<ObjectNode> leaves){var result=new LinkedHashMap<String,ObjectNode>();for(var leaf:leaves){String key=leaf.at("/allocation/inventory/key").asText();if(key.isBlank()||result.put(key,leaf)!=null)return Map.of();}return result;}
 private static boolean compatible(ObjectNode a,ObjectNode b){
  for(String field:List.of("kind","side","unit","currency","instrument"))if(!a.path(field).equals(b.path(field)))return false;
  if(number(a.path("quantity"))==null||number(b.path("quantity"))==null||number(a.path("quantity")).compareTo(number(b.path("quantity")))!=0)return false;
  for(String field:List.of("account","side","unit","currency","instrument","sourceUnit"))if(!a.at("/allocation/inventory/"+field).equals(b.at("/allocation/inventory/"+field)))return false;
  if(a.path("kind").asText().equals("OPTION"))for(String field:List.of("underlying","right","strike","expiration","multiplier","currency","exerciseStyle","settlement","adjustment","deliverable","payoffApplicability")){
   JsonNode left=a.path("terms").path(field),right=b.path("terms").path(field);if(!known(left)||!known(right))continue;
   if(Set.of("strike","multiplier").contains(field)){if(number(left)==null||number(right)==null||number(left).compareTo(number(right))!=0)return false;}else if(!left.equals(right))return false;
  }
  return true;
 }
 private static boolean known(JsonNode n){return !n.isMissingNode()&&!n.isNull()&&!(n.isTextual()&&(n.asText().isBlank()||n.asText().equals("UNKNOWN")))&&!(n.isArray()&&n.isEmpty());}
}
