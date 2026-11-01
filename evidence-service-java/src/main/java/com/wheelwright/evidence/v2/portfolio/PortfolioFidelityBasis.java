package com.wheelwright.evidence.v2.portfolio;

import com.wheelwright.evidence.v2.*;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Source-reported whole-holding reference cost, never an opening/lifecycle association. */
public final class PortfolioFidelityBasis {
 private PortfolioFidelityBasis(){}
 public static Map<String,ObjectNode> read(Connection tx,PortfolioRepository repo,PositionSnapshot cut)throws Exception{
  var result=new HashMap<String,ObjectNode>();
  if(cut.observation()!=null||cut.artifactId()==null)return result;
  byte[] bytes;try(var q=tx.prepareStatement("SELECT payload FROM brokerage_artifact WHERE account=? AND artifact_id=?")){q.setString(1,cut.account());q.setString(2,cut.artifactId());try(var r=q.executeQuery()){if(!r.next())return result;bytes=r.getBytes(1);}}
  if(!BrokerageArtifacts.sha(bytes).equals(cut.sourceSha256()))return result;
  var rows=FidelityPositions.csv(new String(bytes,StandardCharsets.UTF_8).replaceFirst("^\uFEFF",""));if(rows.isEmpty())return result;var header=rows.getFirst();
  if(!header.containsAll(List.of("Account number","Symbol","Quantity","Type","Cost basis total")))return result;
  for(var h:repo.list(tx,Kind.HOLDING,Set.of(cut.account()))){
   if(!Objects.equals(h.snapshot(),cut.snapshotId()))continue;
   var original=cut.holdings().stream().filter(x->x.holdingId().equals(h.sourceKey())).findFirst();if(original.isEmpty())continue;
   var source=original.get();BigDecimal total=BigDecimal.ZERO,quantity=BigDecimal.ZERO;boolean valid=source.sourceRows().size()==1;
   for(int line:source.sourceRows()){
    if(line<2||line>rows.size()){valid=false;break;}var row=rows.get(line-1);
    if(row.size()<header.size()||!cell(header,row,"Account number").equals(cut.brokerAccount())||!cell(header,row,"Symbol").equals(source.contract())||!cell(header,row,"Type").equals(source.custody())){valid=false;break;}
    try{var q=FidelityPositions.number(cell(header,row,"Quantity"));var b=FidelityPositions.number(cell(header,row,"Cost basis total"));if(q==null||b==null||b.signum()<0||q.signum()!=source.quantity().signum()){valid=false;break;}quantity=quantity.add(q);total=total.add(b);}catch(IllegalArgumentException bad){valid=false;break;}
   }
   var value=h.value().deepCopy();var metric=unknown("MONEY",null,"BASIS_ATTRIBUTION_UNKNOWN");
   if(valid&&quantity.compareTo(source.quantity())==0&&quantity.signum()!=0){
    metric=metric(total,"MONEY","USD",null,"FIDELITY_REPORTED_WHOLE_HOLDING_COST_BASIS","QUALIFIED",(ArrayNode)value.path("evidence"),"HELD_INVENTORY");metric.put("origin","BROKER_REPORTED");
    ((ArrayNode)metric.path("assumptions")).add("Exact source Account, contract, custody, rows and whole quantity. Broker basis convention; not independently attributed opening cash, fee completeness, uninterrupted tenure or lifecycle P/L. Source export day is in evidence; no observation instant is invented.");
   }
   var facts=obj();facts.set("reportedCostBasis",metric);
   if(source.sourceRows().size()==1&&Set.of("Stocks","ETFs").contains(source.kind())&&header.contains("Last price")){
    try{var row=rows.get(source.sourceRows().getFirst()-1);var q=FidelityPositions.number(cell(header,row,"Quantity"));if(!cell(header,row,"Account number").equals(cut.brokerAccount())||!cell(header,row,"Symbol").equals(source.contract())||!cell(header,row,"Type").equals(source.custody())||q==null||q.compareTo(source.quantity())!=0)continue;var price=FidelityPositions.number(cell(header,row,"Last price"));if(price!=null&&price.signum()>0){var spot=metric(price,"PRICE","USD",null,"FIDELITY_POSITIONS_REPORTED_LAST_PRICE","QUALIFIED",(ArrayNode)value.path("evidence"),"HELD_INVENTORY");spot.put("origin","BROKER_REPORTED").put("observationDate",cut.evidenceDate());((ArrayNode)spot.path("warningCodes")).add("HISTORICAL_SOURCE_SPOT");((ArrayNode)spot.path("assumptions")).add("Source-reported last price at export-day precision; not a current quote or acquisition cost.");facts.set("reportedUnderlyingSpot",spot);}}catch(IllegalArgumentException unsupported){/* No repaired price. */}
   }
   result.put(h.sourceKey(),facts);
  }
  return result;
 }
 private static String cell(List<String> header,List<String> row,String name){return row.get(header.indexOf(name)).trim();}
}
