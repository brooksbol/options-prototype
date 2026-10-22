package com.wheelwright.evidence.v2.portfolio;

import com.wheelwright.evidence.v2.*;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Preserves identifiable source custody rows outside the legacy numeric inventory profile.
 * A sweep-fund value is not its missing share quantity, currency principal or buying power.
 * Unknown units never become a SourceInventory allocation or a fabricated Construction.
 */
public final class PortfolioFidelityAdditionalCustody {
 private final PortfolioRepository repository;
 public PortfolioFidelityAdditionalCustody(PortfolioRepository repository){this.repository=repository;}
 public void admit(Connection connection,PositionSnapshot snapshot)throws Exception{
  if(snapshot.observation()!=null||snapshot.artifactId()==null||snapshot.excludedNonPositionRows()==0)return;
  byte[] bytes;String received;try(var q=connection.prepareStatement("SELECT payload,received_at FROM brokerage_artifact WHERE account=? AND artifact_id=?")){q.setString(1,snapshot.account());q.setString(2,snapshot.artifactId());try(var r=q.executeQuery()){if(!r.next())throw new IllegalArgumentException("original source missing");bytes=r.getBytes(1);received=r.getString(2);}}
  var rows=FidelityPositions.csv(new String(bytes,StandardCharsets.UTF_8).replaceFirst("^\\uFEFF",""));if(rows.isEmpty())throw new IllegalArgumentException("source header missing");var header=rows.getFirst();
  for(int row=1;row<rows.size();row++){
   var cells=rows.get(row);if(cells.size()<header.size()||!cells.getFirst().trim().equals(snapshot.brokerAccount()))continue;
   String category=cell(header,cells,"Investment type"),symbol=cell(header,cells,"Symbol");if(category.isBlank()||symbol.isBlank())continue;
   BigDecimal quantity=value(cell(header,cells,"Quantity"));if(quantity!=null&&!category.equals("Cash"))continue;
   String instrumentId=id("instrument:FIDELITY:"+symbol),instrumentUri="/v2/instruments/"+instrumentId;
   if(repository.get(connection,instrumentUri).isEmpty()){var instrument=obj().put("id",instrumentId).put("kind",category.equals("Options")?"OPTION":Set.of("Stocks","ETFs").contains(category)?"EQUITY":"OTHER").put("symbol",symbol).put("currency","USD").putNull("option");instrument.set("self",link(instrumentUri));instrument.set("brokerAliases",array().add(obj().put("broker","FIDELITY").put("environment","PRODUCTION").put("identifier",symbol)));instrument.set("evidence",array());instrument.set("warnings",array());repository.put(connection,new Document(Kind.INSTRUMENT,instrumentUri,null,instrument,null,symbol));}
   String guid=id("additional-custody:"+snapshot.account()+":"+snapshot.snapshotId()+":"+row),uri="/v2/holdings/"+guid;
   var source=source(snapshot.account(),snapshot.artifactId(),Integer.toString(row+1),snapshot.evidenceDate(),received,"FIDELITY");source.put("requiredCapability","account.holdings.read:"+snapshot.account());var evidence=array().add(source);
   String unit=category.equals("Options")?"CONTRACT":Set.of("Stocks","ETFs").contains(category)?"SHARE":"SOURCE_UNIT";
   var holding=obj().put("id",guid).put("kind","SECURITY").put("snapshotId",snapshot.snapshotId()).put("snapshotCoverage","PARTIAL").put("side",quantity==null?"UNKNOWN":quantity.signum()<0?"SHORT":"LONG").put("unit",unit).putNull("observedAt").put("observationDate",snapshot.evidenceDate()).put("receivedAt",received);if(quantity==null)holding.putNull("quantity");else holding.put("quantity",decimal(quantity.abs()));if(unit.equals("SOURCE_UNIT"))holding.put("sourceUnit","Broker category "+category+"; currency principal and fungible unit identity are not established.");holding.set("self",link(uri));holding.set("account",link("/v2/accounts/"+snapshot.account()));holding.set("instrument",link(instrumentUri));holding.set("sourceInstrument",obj().put("broker","FIDELITY").put("environment","PRODUCTION").put("identifier",symbol));holding.set("evidence",evidence);
   holding.set("reportedMarketValue",reported(cell(header,cells,"Current value"),evidence,"BROKER_REPORTED_MARKET_VALUE_UNQUANTIFIED_OR_UNCLASSIFIED_UNITS"));holding.set("reportedOpenPl",reported(cell(header,cells,"Total gain/loss dollar"),evidence,"BROKER_REPORTED_PL_UNVERIFIED_DIALECT"));holding.set("reportedCapitalRequirement",unknown("MONEY",null,"TERMS_UNAVAILABLE"));
   var warning=warning("TERMS_UNAVAILABLE","/quantity","Reported instrument identity, source date and separately reported monetary figures remain inspectable.","Source quantity or unit meaning is missing. Reported dollar value is not substituted for units, cash principal, reservation or buying power.");var affected=array();if(quantity==null)affected.add("/quantity");if(unit.equals("SOURCE_UNIT"))affected.add("/unit");warning.set("affected",affected);warning.set("evidence",evidence);var remediation=obj().put("action","IMPORT_SOURCE").put("description","Provide a broker report with held quantity and unit/currency meaning. Re-importing a value-only report cannot establish units or cash availability.").put("requiredGrant","account.artifacts.write:"+snapshot.account());remediation.set("capability",link("/v2/artifacts"));warning.set("remediation",array().add(remediation));var warnings=array().add(warning);for(String field:List.of("reportedMarketValue","reportedOpenPl"))if(holding.path(field).path("status").asText().equals("CONFLICT"))warnings.add(warning("SOURCE_CONFLICT","/"+field,"Original source tokens and independently reported custody facts remain inspectable.","The reported numeric token is not supported; no repaired or guessed financial amount is admitted."));holding.set("warnings",warnings);repository.put(connection,new Document(Kind.HOLDING,uri,snapshot.account(),holding,snapshot.snapshotId(),"unclassified-row:"+(row+1)));
  }
 }
 private static String cell(List<String> header,List<String> row,String name){int index=header.indexOf(name);if(index<0||index>=row.size())throw new IllegalArgumentException("source columns missing");return row.get(index).trim();}
 private static BigDecimal value(String text){try{return FidelityPositions.number(text);}catch(IllegalArgumentException invalid){return null;}}
 private static ObjectNode reported(String text,ArrayNode evidence,String method){BigDecimal value=value(text);if(value==null){boolean missing=text.isBlank()||text.equals("--");var unknown=unknown("MONEY",null,missing?"BROKER_EVALUATION_BASIS_UNVERIFIED":"SOURCE_CONFLICT");if(!missing){unknown.put("status","CONFLICT").put("method","UNSUPPORTED_SOURCE_NUMBER");unknown.set("evidence",evidence);}return unknown;}var metric=metric(value,"MONEY","USD",null,method,"QUALIFIED",evidence,"HELD_INVENTORY");metric.put("origin","BROKER_REPORTED");((ArrayNode)metric.path("assumptions")).add("Existing supported Fidelity USD export profile; source day precision only. Reported money does not establish unit quantity or currency-cash ownership.");return metric;}
 private static String id(String text){return UUID.nameUUIDFromBytes(text.getBytes(StandardCharsets.UTF_8)).toString();}
}
