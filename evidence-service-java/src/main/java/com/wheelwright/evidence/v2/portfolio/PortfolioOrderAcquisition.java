package com.wheelwright.evidence.v2.portfolio;

import com.wheelwright.evidence.v2.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Bounded domain read-through, composed from existing OAuth, Artifact and import owners.
 * No new public operation/job identity. Server policy is denied by default; no live reads in tests.
 */
@Component
public final class PortfolioOrderAcquisition {
 private final PortfolioRepository repository;private final AccountDirectory accounts;private final TastytradeClient client;private final boolean enabled;private final Duration reuse;private final Clock clock;
 private final ConcurrentHashMap<String,Object> locks=new ConcurrentHashMap<>();
 @Autowired public PortfolioOrderAcquisition(PortfolioRepository repository,AccountDirectory accounts,TastytradeClient client,
   @Value("${wheelwright.portfolio.orders.read-through-enabled:false}")boolean enabled,
   @Value("${wheelwright.portfolio.orders.reuse-seconds:300}")long seconds){this(repository,accounts,client,enabled,Duration.ofSeconds(seconds),Clock.systemUTC());}
 public PortfolioOrderAcquisition(PortfolioRepository repository,AccountDirectory accounts,TastytradeClient client,boolean enabled,Duration reuse,Clock clock){if(reuse.isNegative()||reuse.compareTo(Duration.ofDays(1))>0)throw new IllegalArgumentException("invalid reuse policy");this.repository=repository;this.accounts=accounts;this.client=client;this.enabled=enabled;this.reuse=reuse;this.clock=clock;}
 public void read(Set<String> scope)throws Exception {
  if(!enabled||!client.configured())return;
  for(String account:new TreeSet<>(scope))synchronized(locks.computeIfAbsent(account,k->new Object())){
   var owner=accounts.get(account);if(owner.isEmpty()||!owner.get().brokerAssociation().broker().equals("TASTYTRADE")||fresh(account))continue;
   String attempt=UUID.randomUUID().toString();var artifacts=new ArrayList<String>();
   try{
    client.orders(owner.get().brokerAssociation().accountNumber(),(offset,bytes)->artifacts.add(retain(account,attempt,offset,bytes)));
    try(var connection=repository.connection()){
     connection.setAutoCommit(false);try{
      var decoder=new PortfolioOrderSources(repository);for(String artifact:artifacts)decoder.admit(connection,owner.get(),artifact,false);
      var observedIds=new HashSet<String>();for(String artifact:artifacts)try(var query=connection.prepareStatement("SELECT payload FROM brokerage_artifact WHERE account=? AND artifact_id=?")){query.setString(1,account);query.setString(2,artifact);try(var rows=query.executeQuery()){if(!rows.next())throw new IllegalStateException();for(var order:PortfolioJson.JSON.readTree(rows.getBytes(1)).at("/data/items"))observedIds.add(order.path("id").asText());}}
      try(var query=connection.prepareStatement("SELECT uri FROM portfolio_resource WHERE kind='ORDER' AND account_id=?")){query.setString(1,account);try(var rows=query.executeQuery()){var uris=new ArrayList<String>();while(rows.next())uris.add(rows.getString(1));for(String uri:uris){var order=repository.get(connection,uri).orElseThrow();if(observedIds.contains(order.value().at("/sourceIdentifier/identifier").asText())){var value=order.value().deepCopy();value.put("observationCoverage","COMPLETE_SUPPORTED_SCAN");repository.put(connection,new Document(Kind.ORDER,uri,account,value,null,order.sourceKey()));}}}}
      for(String artifact:artifacts)if(!repository.admitted(connection,account,"orders:"+artifact))repository.markAdmitted(connection,account,"orders:"+artifact);
      finish(connection,account,attempt,"ACCEPTED","Complete bounded Order scan admitted; no lifetime or atomic brokerage snapshot claim");connection.commit();
     }catch(Exception e){connection.rollback();throw e;}
    }
   }catch(Exception e){try(var connection=repository.connection()){finish(connection,account,attempt,"REJECTED","Order scan unavailable or unsupported; prior admitted observations preserved");}}
  }
 }
 private boolean fresh(String account)throws Exception{
  try(var connection=repository.connection();var query=connection.prepareStatement("SELECT max(imported_at) FROM brokerage_import WHERE account=? AND file_type='API_ORDERS' AND status='ACCEPTED'")){query.setString(1,account);try(var row=query.executeQuery()){row.next();String at=row.getString(1);if(at==null)return false;var elapsed=Duration.between(Instant.parse(at),clock.instant());return !elapsed.isNegative()&&elapsed.compareTo(reuse)<0;}}
 }
 private String retain(String account,String attempt,int offset,byte[] bytes)throws Exception{
  String hash=BrokerageArtifacts.sha(bytes),artifact=UUID.randomUUID().toString(),received=clock.instant().toString();
  try(var connection=repository.connection()){
   connection.setAutoCommit(false);try{
    try(var query=connection.prepareStatement("SELECT artifact_id FROM brokerage_artifact WHERE account=? AND sha256=?")){query.setString(1,account);query.setString(2,hash);try(var row=query.executeQuery()){if(row.next())artifact=row.getString(1);}}
    try(var query=connection.prepareStatement("INSERT OR IGNORE INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){query.setString(1,account);query.setString(2,artifact);query.setString(3,hash);query.setString(4,"application/json");query.setInt(5,bytes.length);query.setBytes(6,bytes);query.setString(7,received);query.executeUpdate();}
    try(var query=connection.prepareStatement("INSERT INTO brokerage_import VALUES (?,?,?,?,?,?,'PENDING','Original Order page retained; complete scan admission pending')")){query.setString(1,account);query.setString(2,attempt+"-"+offset);query.setString(3,artifact);query.setString(4,"tastytrade-orders-"+offset+".json");query.setString(5,"API_ORDERS");query.setString(6,received);query.executeUpdate();}
    connection.commit();return artifact;
   }catch(Exception e){connection.rollback();throw e;}
  }
 }
 private void finish(Connection connection,String account,String attempt,String status,String result)throws SQLException{try(var query=connection.prepareStatement("UPDATE brokerage_import SET status=?,result=? WHERE account=? AND import_id LIKE ?")){query.setString(1,status);query.setString(2,result);query.setString(3,account);query.setString(4,attempt+"-%");query.executeUpdate();}}
}
