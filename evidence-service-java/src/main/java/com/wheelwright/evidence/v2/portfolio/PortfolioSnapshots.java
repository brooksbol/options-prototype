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
 public Optional<PositionSnapshot> current(String account)throws Exception {
  // Compare source receipt instants exactly, without parsing every historical payload
  // or relying on lexicographic RFC3339 spelling for fractions/offsets.
  String selected=null;java.time.Instant latest=null;
  try(var c=repository.connection();var q=c.prepareStatement("SELECT snapshot_id,recorded_at FROM account_position_snapshot WHERE account=? AND evidence_date=(SELECT max(evidence_date) FROM account_position_snapshot WHERE account=?)")){
   q.setString(1,account);q.setString(2,account);try(var rows=q.executeQuery()){while(rows.next()){String id=rows.getString(1);var at=java.time.Instant.parse(rows.getString(2));if(latest==null||at.isAfter(latest)||at.equals(latest)&&id.compareTo(selected)>0){selected=id;latest=at;}}}
   if(selected==null)return Optional.empty();try(var detail=c.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? AND snapshot_id=?")){detail.setString(1,account);detail.setString(2,selected);try(var row=detail.executeQuery()){return row.next()?Optional.of(JSON.readValue(row.getString(1),PositionSnapshot.class)):Optional.empty();}}
  }
 }
 public Optional<PositionSnapshot> find(String account,String id)throws Exception {
  try(var c=repository.connection();var q=c.prepareStatement("SELECT payload_json FROM account_position_snapshot WHERE account=? AND snapshot_id=?")){q.setString(1,account);q.setString(2,id);try(var row=q.executeQuery()){return row.next()?Optional.of(JSON.readValue(row.getString(1),PositionSnapshot.class)):Optional.empty();}}
 }
 public boolean exists(String account,String id)throws Exception {
  try(var c=repository.connection();var q=c.prepareStatement("SELECT 1 FROM account_position_snapshot WHERE account=? AND snapshot_id=?")){q.setString(1,account);q.setString(2,id);try(var row=q.executeQuery()){return row.next();}}
 }
 public List<PositionSnapshot> page(Set<String> accounts,String after,boolean descending,int limit)throws Exception {
  if(accounts.isEmpty())return List.of();var sorted=new TreeSet<>(accounts);String key="account||':'||snapshot_id";
  String sql="SELECT payload_json FROM account_position_snapshot WHERE account IN ("+String.join(",",Collections.nCopies(sorted.size(),"?"))+")"+(after.isEmpty()?"":" AND "+key+(descending?"<?":">?"))+" ORDER BY "+key+(descending?" DESC":" ASC")+" LIMIT ?";
  try(var c=repository.connection();var q=c.prepareStatement(sql)){int i=1;for(String account:sorted)q.setString(i++,account);if(!after.isEmpty())q.setString(i++,after);q.setInt(i,limit+1);var out=new ArrayList<PositionSnapshot>();try(var rows=q.executeQuery()){while(rows.next())out.add(JSON.readValue(rows.getString(1),PositionSnapshot.class));}return List.copyOf(out);}
 }
 private long holdingCount(PositionSnapshot snapshot)throws Exception {
  try(var c=repository.connection();var q=c.prepareStatement("SELECT count(*) FROM portfolio_resource WHERE kind='HOLDING' AND account_id=? AND source_snapshot=?")){q.setString(1,snapshot.account());q.setString(2,snapshot.snapshotId());try(var row=q.executeQuery()){return row.next()?Math.max(snapshot.holdings().size(),row.getLong(1)):snapshot.holdings().size();}}
 }
 public ObjectNode summary(PositionSnapshot snapshot)throws Exception{
  String broker=snapshot.observation()==null?"FIDELITY":snapshot.observation().broker();var n=obj().put("snapshotId",snapshot.snapshotId()).put("evidenceDate",snapshot.evidenceDate()).put("dateBasis",broker.equals("TASTYTRADE")?"BACKEND_RECEIPT_DAY":"SOURCE_EXPORT_DAY").put("recordedAt",snapshot.recordedAt()).put("source",broker).put("holdingCount",holdingCount(snapshot)).put("sourceSha256",snapshot.sourceSha256());n.set("account",link("/v2/accounts/"+snapshot.account()));n.set("holdings",link("/v2/holdings?accountId="+snapshot.account()+"&snapshotId="+java.net.URLEncoder.encode(snapshot.snapshotId(),java.nio.charset.StandardCharsets.UTF_8)));var evidence=array();if(snapshot.artifactId()!=null){var source=source(snapshot.account(),snapshot.artifactId(),broker.equals("TASTYTRADE")?"/data/items":"1",broker.equals("TASTYTRADE")?null:snapshot.evidenceDate(),snapshot.recordedAt(),broker);source.put("requiredCapability","account.holdings.read:"+snapshot.account());if(broker.equals("TASTYTRADE"))source.put("timeAuthority","BACKEND_RECEIPT");evidence.add(source);}if(snapshot.cashObservation()!=null){var cash=snapshot.cashObservation();if(cash.artifactId()!=null){var ref=source(snapshot.account(),cash.artifactId(),"/data/cash-balance",cash.observationDate(),cash.receivedAt(),"TASTYTRADE");ref.put("requiredCapability","account.holdings.read:"+snapshot.account());if(cash.observedAt()!=null)ref.put("observedAt",cash.observedAt()).put("observationPrecision","INSTANT").put("timeAuthority","SOURCE");evidence.add(ref);}}n.set("evidence",evidence);n.set("qualifications",array().add("Retained source observation; no complete brokerage history or financial-lifecycle assertion. Source date and backend receipt remain distinct."));if(snapshot.cashObservation()!=null)((com.fasterxml.jackson.databind.node.ArrayNode)n.path("qualifications")).add("Companion settled-cash observation: "+snapshot.cashObservation().status()+". Cash and securities have separate source/receipt clocks; no atomic brokerage cut, buying power or reservation established.");return n;
 }
}
