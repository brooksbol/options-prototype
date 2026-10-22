package com.wheelwright.evidence.v2.portfolio;

import com.wheelwright.evidence.v2.PositionSnapshot;
import com.fasterxml.jackson.databind.node.*;
import java.sql.Connection;
import java.time.Instant;
import java.util.*;
import java.nio.charset.StandardCharsets;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** The balances original owns cash evidence. Securities rows, buying power and fund NAV do not. */
final class PortfolioCashCustody {
 private final PortfolioRepository repository;private final PortfolioSources sources;
 PortfolioCashCustody(PortfolioRepository repository,PortfolioSources sources){this.repository=repository;this.sources=sources;}
 void admit(Connection connection,PositionSnapshot snapshot)throws Exception{
  var cash=snapshot.cashObservation();if(cash==null||!Set.of("OBSERVED","INCOMPLETE").contains(cash.status()))return;
  String key="settled-cash:"+cash.currency(),id=UUID.nameUUIDFromBytes((snapshot.account()+":"+snapshot.snapshotId()+":"+key).getBytes(StandardCharsets.UTF_8)).toString(),uri="/v2/holdings/"+id,now=Instant.now().toString();
  var source=source(snapshot.account(),cash.artifactId(),"/data/cash-balance",cash.observationDate(),cash.receivedAt(),"TASTYTRADE");source.put("requiredCapability","account.holdings.read:"+snapshot.account());
  if(cash.observedAt()!=null)source.put("observedAt",cash.observedAt()).put("observationPrecision","INSTANT").put("timeAuthority","SOURCE");
  var evidence=array().add(source);var amount=cash.balance();String side=amount==null?"UNKNOWN":amount.signum()<0?"SHORT":"LONG";
  var holding=obj().put("id",id).put("snapshotId",snapshot.snapshotId()).put("snapshotCoverage",amount==null?"PARTIAL":"COMPLETE_REPORTED").put("side",side).put("unit","MONEY").put("kind","CASH").putNull("instrument");if(amount==null)holding.putNull("quantity");else holding.put("quantity",decimal(amount.abs()));holding.set("self",link(uri));holding.set("account",link("/v2/accounts/"+snapshot.account()));holding.set("sourceInstrument",obj().put("broker","TASTYTRADE").put("environment","PRODUCTION").put("identifier",cash.currency()));holding.put("receivedAt",cash.receivedAt());holding.put("observedAt",cash.observedAt());holding.put("observationDate",cash.observationDate());holding.set("evidence",evidence);
  var value=metric(amount,"MONEY",cash.currency(),cash.observedAt(),"BROKER_REPORTED_SETTLED_CASH_BALANCE","QUALIFIED",evidence);value.put("origin",amount==null?"UNKNOWN":"BROKER_REPORTED");if(amount==null){value.put("status","INCOMPLETE");((ArrayNode)value.path("warningCodes")).add("TERMS_UNAVAILABLE");}((ArrayNode)value.path("assumptions")).add("Reported settled cash only; no buying power, withdrawal availability, broker reservation or atomic securities/cash observation asserted.");holding.set("reportedMarketValue",value);holding.set("reportedOpenPl",na("MONEY",null));holding.set("reportedCapitalRequirement",unknown("MONEY",null,"TERMS_UNAVAILABLE"));
  var warnings=array();if(amount==null)warnings.add(warning("HOLDING_RECONCILIATION_CONFLICT","/quantity","Reported source and currency remain inspectable.","No settled cash amount was reported. Buying power cannot substitute."));if(amount!=null&&amount.signum()<0)warnings.add(warning("TERMS_UNAVAILABLE","/quantity","Negative settled cash balance remains inspectable as a SHORT custody observation.","No positive owned-cash Construction, margin feature or available collateral is inferred."));warnings.add(warning("ASSOCIATION_UNRESOLVED","/snapshotId","Reported settled cash remains independently inspectable.","A repeated balance observation does not establish economic occurrence continuity, cash movements or reserved collateral."));holding.set("warnings",warnings);repository.put(connection,new Document(Kind.HOLDING,uri,snapshot.account(),holding,snapshot.snapshotId(),key));
  if(amount==null||amount.signum()<=0)return;
  var inventory=obj().put("key",key).put("side","LONG").put("quantity",decimal(amount)).put("unit","MONEY").put("currency",cash.currency()).putNull("instrument");inventory.set("account",holding.path("account"));inventory.set("holding",link(uri));inventory.set("evidence",evidence);
  var allocation=obj().put("quantity",decimal(amount)).put("basisMethod","BROKER_ATTRIBUTED").put("availability","UNKNOWN").put("globalStatus","UNKNOWN");allocation.set("inventory",inventory);allocation.set("holding",link(uri));allocation.set("basis",metric(amount,"MONEY",cash.currency(),cash.observedAt(),"CASH_PRINCIPAL","QUALIFIED",evidence));allocation.set("authority",PortfolioSources.authority(snapshot.account(),"allocation:"+id,"BROKER_HOLDING_OBSERVATION","QUALIFIED",evidence,List.of(uri),"Settled owned cash quantity; neither reserved collateral nor unrestricted buying power."));
  var leaf=obj().put("nodeId",key).put("kind","CASH").putNull("instrument").put("side","LONG").put("quantity",decimal(amount)).put("unit","MONEY").put("currency",cash.currency());leaf.set("allocation",allocation);var economics=obj();economics.set("openingCashFlow",na("MONEY",null));economics.set("reportedMarketValue",value);economics.set("reportedOpenPl",holding.path("reportedOpenPl"));economics.set("reportedCapitalRequirement",holding.path("reportedCapitalRequirement"));economics.set("fees",unknown("MONEY",null,"HISTORY_INCOMPLETE"));leaf.set("economics",economics);sources.position(connection,snapshot,List.of(leaf),key,now);
 }
}
