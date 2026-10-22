package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.v2.PositionSnapshot;
import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

/** Navigation of the existing retained observation owner, including empty successful snapshots. */
public final class PortfolioSnapshots {
 private final PortfolioRepository repository;
 public PortfolioSnapshots(PortfolioRepository repository){this.repository=repository;}
 public List<PositionSnapshot> retained(Set<String> accounts)throws Exception{
  var result=new ArrayList<PositionSnapshot>();try(var c=repository.connection();var query=c.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? ORDER BY evidence_date DESC,recorded_at DESC,snapshot_id DESC")){
   for(String account:new TreeSet<>(accounts)){query.setString(1,account);try(var rows=query.executeQuery()){while(rows.next())result.add(JSON.readValue(rows.getString(1),PositionSnapshot.class));}}
  }return List.copyOf(result);
 }
 public Optional<PositionSnapshot> current(String account)throws Exception{return retained(Set.of(account)).stream().findFirst();}
 public ObjectNode summary(PositionSnapshot snapshot)throws Exception{
  String broker=snapshot.observation()==null?"FIDELITY":snapshot.observation().broker();var n=obj().put("snapshotId",snapshot.snapshotId()).put("evidenceDate",snapshot.evidenceDate()).put("dateBasis",broker.equals("TASTYTRADE")?"BACKEND_RECEIPT_DAY":"SOURCE_EXPORT_DAY").put("recordedAt",snapshot.recordedAt()).put("source",broker).put("holdingCount",Math.max(snapshot.holdings().size(),repository.list(PortfolioRepository.Kind.HOLDING,Set.of(snapshot.account())).stream().filter(h->Objects.equals(h.snapshot(),snapshot.snapshotId())).count())).put("sourceSha256",snapshot.sourceSha256());n.set("account",link("/v2/accounts/"+snapshot.account()));n.set("holdings",link("/v2/holdings?accountId="+snapshot.account()+"&snapshotId="+java.net.URLEncoder.encode(snapshot.snapshotId(),java.nio.charset.StandardCharsets.UTF_8)));var evidence=array();if(snapshot.artifactId()!=null){var source=source(snapshot.account(),snapshot.artifactId(),broker.equals("TASTYTRADE")?"/data/items":"1",broker.equals("TASTYTRADE")?null:snapshot.evidenceDate(),snapshot.recordedAt(),broker);source.put("requiredCapability","account.holdings.read:"+snapshot.account());if(broker.equals("TASTYTRADE"))source.put("timeAuthority","BACKEND_RECEIPT");evidence.add(source);}if(snapshot.cashObservation()!=null){var cash=snapshot.cashObservation();if(cash.artifactId()!=null){var ref=source(snapshot.account(),cash.artifactId(),"/data/cash-balance",cash.observationDate(),cash.receivedAt(),"TASTYTRADE");ref.put("requiredCapability","account.holdings.read:"+snapshot.account());if(cash.observedAt()!=null)ref.put("observedAt",cash.observedAt()).put("observationPrecision","INSTANT").put("timeAuthority","SOURCE");evidence.add(ref);}}n.set("evidence",evidence);n.set("qualifications",array().add("Retained source observation; no complete brokerage history or financial-lifecycle assertion. Source date and backend receipt remain distinct."));if(snapshot.cashObservation()!=null)((com.fasterxml.jackson.databind.node.ArrayNode)n.path("qualifications")).add("Companion settled-cash observation: "+snapshot.cashObservation().status()+". Cash and securities have separate source/receipt clocks; no atomic brokerage cut, buying power or reservation established.");return n;
 }
}
