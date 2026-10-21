package com.wheelwright.evidence.v2.portfolio;

import com.wheelwright.evidence.v2.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;
import java.sql.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Bounded read-through for already admitted Account subjects. No live test requests or writes to brokerage. */
@Component
public final class PortfolioMarketAcquisition {
 private static final String COMPLETE="All requested quote subjects returned; session and reference completeness remain separately qualified";
 private final PortfolioRepository repository;private final AccountDirectory accounts;private final TastytradeClient client;private final boolean enabled;private final Clock clock;private final Duration reuse;
 private final ConcurrentHashMap<String,Object> locks=new ConcurrentHashMap<>();
 @Autowired public PortfolioMarketAcquisition(PortfolioRepository repository,AccountDirectory accounts,TastytradeClient client,@Value("${wheelwright.portfolio.market.read-through-enabled:false}")boolean enabled,@Value("${wheelwright.portfolio.market.reuse-seconds:30}")long seconds){this(repository,accounts,client,enabled,Duration.ofSeconds(seconds),Clock.systemUTC());}
 public PortfolioMarketAcquisition(PortfolioRepository repository,AccountDirectory accounts,TastytradeClient client,boolean enabled,Duration reuse,Clock clock){if(reuse.isNegative()||reuse.compareTo(Duration.ofDays(1))>0)throw new IllegalArgumentException("invalid market reuse policy");this.repository=repository;this.accounts=accounts;this.client=client;this.enabled=enabled;this.reuse=reuse;this.clock=clock;}
 public com.fasterxml.jackson.databind.node.ArrayNode read(Set<String> scope)throws Exception{
  var warnings=PortfolioJson.array();if(!enabled||!client.configured())return warnings;
  for(String account:new TreeSet<>(scope))synchronized(locks.computeIfAbsent(account,k->new Object())){
   var owner=accounts.get(account);if(owner.isEmpty()||!owner.get().brokerAssociation().broker().equals("TASTYTRADE")||fresh(account))continue;
   var currencies=new TreeMap<String,String>();var equity=new ArrayList<String>();var options=new ArrayList<String>();
   var cut=new PortfolioSnapshots(repository).current(account);if(cut.isEmpty())continue;
   var subjects=new TreeSet<String>();for(var h:repository.list(Kind.HOLDING,Set.of(account)))if(Objects.equals(h.snapshot(),cut.get().snapshotId())&&h.value().path("instrument").isObject())subjects.add(h.value().at("/instrument/href").asText());
   for(var p:repository.list(Kind.POSITION,Set.of(account)))if(!p.value().path("state").asText().equals("CLOSED")&&Objects.equals(p.snapshot(),cut.get().snapshotId())){var construction=repository.get(p.value().at("/currentConstruction/href").asText());if(construction.isPresent())for(var leaf:PortfolioJson.leaves(construction.get().value().path("composition")))if(leaf.at("/terms/underlying/href").isTextual())subjects.add(leaf.at("/terms/underlying/href").asText());}
   for(String uri:subjects){var instrument=repository.get(uri);if(instrument.isEmpty())continue;var value=instrument.get().value();String kind=value.path("kind").asText();if(!Set.of("EQUITY","OPTION").contains(kind))continue;for(var alias:value.path("brokerAliases"))if(alias.path("broker").asText().equals("TASTYTRADE")&&alias.path("environment").asText().equals("PRODUCTION")){String symbol=alias.path("identifier").asText();if(!currencies.containsKey(symbol)){currencies.put(symbol,value.path("currency").isTextual()?value.path("currency").asText():null);(kind.equals("OPTION")?options:equity).add(symbol);}break;}}
   if(currencies.isEmpty())continue;
   String attempt=UUID.randomUUID().toString();String artifact=null;
   try{
    // One accepted typed request is bounded to100 subjects. Exceeding the source budget is a
    // qualified failed refresh, never success with an arbitrarily truncated Account.
    byte[] bytes=client.marketData(equity,options);artifact=retain(account,attempt,bytes);
    try(var connection=repository.connection()){connection.setAutoCommit(false);try{var admissionWarnings=new PortfolioTastyMarketSources(repository).admit(connection,owner.get(),artifact,currencies);warnings.addAll(admissionWarnings);finish(connection,account,attempt,"ACCEPTED",admissionWarnings.isEmpty()?COMPLETE:"Partial requested quote subjects returned; missing subjects are not a successful refresh");connection.commit();}catch(Exception e){connection.rollback();throw e;}}
    session(account,warnings);
   }catch(Exception e){try(var connection=repository.connection()){if(artifact!=null)finish(connection,account,attempt,"REJECTED","Market source unavailable or unsupported; prior admitted observations preserved");warnings.add(PortfolioJson.warning("MARKET_OBSERVATION_MISSING","","Prior admitted custody and source observations remain inspectable.","Current requested market refresh failed or exceeded its source budget; no source response or successful import is manufactured."));}}
  }return warnings;
 }
 private boolean fresh(String account)throws Exception{
  try(var c=repository.connection();var q=c.prepareStatement("SELECT imported_at,status,result FROM brokerage_import WHERE account=? AND file_type='API_MARKET_DATA' AND imported_at=(SELECT max(imported_at) FROM brokerage_import WHERE account=? AND file_type='API_MARKET_DATA')")){
   q.setString(1,account);q.setString(2,account);try(var r=q.executeQuery()){String at=null;while(r.next()){if(!r.getString("status").equals("ACCEPTED")||!r.getString("result").equals(COMPLETE))return false;at=r.getString("imported_at");}if(at==null)return false;var age=Duration.between(Instant.parse(at),clock.instant());return !age.isNegative()&&age.compareTo(reuse)<0;}
  }
 }
 private void session(String account,com.fasterxml.jackson.databind.node.ArrayNode warnings)throws Exception{
  String attempt=UUID.randomUUID().toString();String artifact=null;
  try{byte[] bytes=client.equitySession();artifact=retain(account,attempt,bytes,"API_MARKET_SESSION","tastytrade-equity-session.json");PortfolioSessionEvidence.validate(bytes);try(var c=repository.connection()){finish(c,account,attempt,"ACCEPTED","Current broker equities session context; not a historical quote or an exchange calendar guarantee");}}
  catch(Exception e){if(artifact!=null)try(var c=repository.connection()){finish(c,account,attempt,"REJECTED","Session source unavailable or unsupported; no retained-session eligibility established");}warnings.add(PortfolioJson.warning("MARKET_OBSERVATION_MISSING","/evaluation/freshness","Source quote values and their own event clocks remain independently inspectable.","Current broker session refresh is unavailable; without usable recent context, old prices cannot acquire completed-session retention."));}
 }
 private String retain(String account,String attempt,byte[] bytes)throws Exception{return retain(account,attempt,bytes,"API_MARKET_DATA","tastytrade-market-data.json");}
 private String retain(String account,String attempt,byte[] bytes,String type,String filename)throws Exception{String artifact=UUID.randomUUID().toString(),hash=BrokerageArtifacts.sha(bytes),received=clock.instant().toString();try(var c=repository.connection()){c.setAutoCommit(false);try{try(var q=c.prepareStatement("SELECT artifact_id FROM brokerage_artifact WHERE account=? AND sha256=?")){q.setString(1,account);q.setString(2,hash);try(var r=q.executeQuery()){if(r.next())artifact=r.getString(1);}}try(var q=c.prepareStatement("INSERT OR IGNORE INTO brokerage_artifact VALUES (?,?,?,?,?,?,?)")){q.setString(1,account);q.setString(2,artifact);q.setString(3,hash);q.setString(4,"application/json");q.setInt(5,bytes.length);q.setBytes(6,bytes);q.setString(7,received);q.executeUpdate();}try(var q=c.prepareStatement("INSERT INTO brokerage_import VALUES (?,?,?,?,?,?,'PENDING','Retained market source pending normalization')")){q.setString(1,account);q.setString(2,attempt);q.setString(3,artifact);q.setString(4,filename);q.setString(5,type);q.setString(6,received);q.executeUpdate();}c.commit();return artifact;}catch(Exception e){c.rollback();throw e;}}}
 private void finish(Connection c,String account,String attempt,String status,String result)throws SQLException{try(var q=c.prepareStatement("UPDATE brokerage_import SET status=?,result=? WHERE account=? AND import_id=?")){q.setString(1,status);q.setString(2,result);q.setString(3,account);q.setString(4,attempt);q.executeUpdate();}}
}
