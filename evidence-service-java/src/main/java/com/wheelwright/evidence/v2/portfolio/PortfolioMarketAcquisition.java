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
    references(account,options,warnings);session(account,warnings);
   }catch(Exception e){try(var connection=repository.connection()){if(artifact!=null)finish(connection,account,attempt,"REJECTED","Market source unavailable or unsupported; prior admitted observations preserved");warnings.add(PortfolioJson.warning("MARKET_OBSERVATION_MISSING","","Prior admitted custody and source observations remain inspectable.","Current requested market refresh failed or exceeded its source budget; no source response or successful import is manufactured."));}}
  }return warnings;
 }
 private boolean fresh(String account)throws Exception{
  try(var c=repository.connection();var q=c.prepareStatement("SELECT imported_at,status,result FROM brokerage_import WHERE account=? AND file_type='API_MARKET_DATA' AND imported_at=(SELECT max(imported_at) FROM brokerage_import WHERE account=? AND file_type='API_MARKET_DATA')")){
   q.setString(1,account);q.setString(2,account);try(var r=q.executeQuery()){String at=null;while(r.next()){if(!r.getString("status").equals("ACCEPTED")||!r.getString("result").equals(COMPLETE))return false;at=r.getString("imported_at");}if(at==null)return false;var age=Duration.between(Instant.parse(at),clock.instant());return !age.isNegative()&&age.compareTo(reuse)<0;}
  }
 }
 private void references(String account,List<String> options,com.fasterxml.jackson.databind.node.ArrayNode warnings)throws Exception{
  var groups=new TreeMap<String,Set<String>>();var referenceFreshness=new HashMap<String,Boolean>();var cut=new PortfolioSnapshots(repository).current(account);if(cut.isEmpty())return;
  for(var p:repository.list(Kind.POSITION,Set.of(account)))if(!p.value().path("state").asText().equals("CLOSED")&&Objects.equals(p.snapshot(),cut.get().snapshotId())){
   var construction=repository.get(p.value().at("/currentConstruction/href").asText());if(construction.isEmpty())continue;
   for(var leaf:PortfolioJson.leaves(construction.get().value().path("composition")))if(leaf.path("kind").asText().equals("OPTION")){
    var subject=repository.get(leaf.at("/instrument/href").asText());var underlying=repository.get(leaf.at("/terms/underlying/href").asText());if(subject.isEmpty()||underlying.isEmpty())continue;
    String series=subject.get().value().path("symbol").asText(),symbol=underlying.get().value().path("symbol").asText();if(!referenceFreshness.containsKey(symbol))referenceFreshness.put(symbol,referenceFresh(account,symbol));if(subject.get().value().path("option").isObject()&&referenceFreshness.get(symbol))continue;if(options.contains(series))groups.computeIfAbsent(symbol,k->new TreeSet<>()).add(series);
   }
  }
  var definitionSubjects=new TreeSet<String>();groups.entrySet().stream().limit(10).forEach(group->definitionSubjects.addAll(group.getValue()));
  int budget=10;for(var group:groups.entrySet()){
   if(--budget<0){warnings.add(PortfolioJson.warning("TERMS_UNAVAILABLE","/evaluation/payoff","Admitted contract references remain inspectable.","Reference source request budget reached; later reads can obtain remaining held-series terms. No omitted terms are manufactured."));break;}
   String attempt=UUID.randomUUID().toString(),artifact=null;
   try{byte[] bytes=client.compactOptionChain(group.getKey());artifact=retain(account,attempt,bytes,"API_OPTION_CHAIN","tastytrade-option-chain-"+group.getKey()+".json");
    try(var c=repository.connection()){c.setAutoCommit(false);try{new PortfolioOptionReferenceSources(repository).admit(c,account,artifact,group.getKey(),group.getValue());new PortfolioReferenceEnrichment(repository).apply(c,account,clock.instant());finish(c,account,attempt,"ACCEPTED","Requested held-series reference terms normalized; price multipliers and custody remain independent source facts");c.commit();}catch(Exception e){c.rollback();throw e;}}
   }catch(Exception e){if(artifact!=null)try(var c=repository.connection()){finish(c,account,attempt,"REJECTED","Unsupported or unavailable reference terms; prior evidence preserved");}warnings.add(PortfolioJson.warning("TERMS_UNAVAILABLE","/evaluation/payoff","Reported custody and prior qualified contract references remain inspectable.","Requested held-series reference acquisition is unavailable or unsupported; exact economics remain limited by known terms."));}
  }
  if(!definitionSubjects.isEmpty())definitions(account,definitionSubjects,warnings);
 }
 private void definitions(String account,Set<String> requested,com.fasterxml.jackson.databind.node.ArrayNode warnings)throws Exception{
  try{byte[] bytes=client.optionDefinitions(new ArrayList<>(requested));var found=definition(account,bytes,requested,null);if(found.size()!=requested.size())warnings.add(PortfolioJson.warning("TERMS_UNAVAILABLE","/evaluation/payoff","Returned contract definitions remain inspectable.","Some requested definitions were absent; no missing exercise or contract terms are invented."));}
  catch(Exception batchUnavailable){
   try{var failed=client.optionDefinitionFallback(new ArrayList<>(requested),(symbol,bytes)->definition(account,bytes,Set.of(symbol),symbol));if(!failed.isEmpty())warnings.add(PortfolioJson.warning("TERMS_UNAVAILABLE","/evaluation/payoff","Successfully admitted individual definitions and custody remain inspectable.","Some bounded single-contract fallback reads failed; their missing terms remain unknown."));}
   catch(Exception unavailable){warnings.add(PortfolioJson.warning("TERMS_UNAVAILABLE","/evaluation/payoff","Prior independently established contract terms remain inspectable.","Batch and bounded fallback definition acquisition are unavailable; no unsupported contract fields are manufactured."));}
  }
 }
 private Set<String> definition(String account,byte[] bytes,Set<String> requested,String symbol)throws Exception{
  String attempt=UUID.randomUUID().toString(),artifact=retain(account,attempt,bytes,symbol==null?"API_OPTION_DEFINITIONS":"API_OPTION_DEFINITION",symbol==null?"tastytrade-option-definitions.json":"tastytrade-option-definition.json");
  try(var c=repository.connection()){c.setAutoCommit(false);try{var found=new PortfolioOptionDefinitions(repository).admit(c,account,artifact,requested);new PortfolioReferenceEnrichment(repository).apply(c,account,clock.instant());finish(c,account,attempt,"ACCEPTED",found.size()==requested.size()?"All requested definition subjects returned; individual missing fields retain qualifications":"Partial definition subjects returned; not complete reference evidence");c.commit();return found;}catch(Exception e){c.rollback();try(var rejected=repository.connection()){finish(rejected,account,attempt,"REJECTED","Unsupported definition source; prior reference facts preserved");}throw e;}}
 }
 private boolean referenceFresh(String account,String underlying)throws Exception{
  try(var c=repository.connection();var q=c.prepareStatement("SELECT status,imported_at FROM brokerage_import WHERE account=? AND file_type='API_OPTION_CHAIN' AND original_filename=? ORDER BY imported_at DESC,import_id DESC LIMIT 1")){q.setString(1,account);q.setString(2,"tastytrade-option-chain-"+underlying+".json");try(var row=q.executeQuery()){if(!row.next()||!row.getString("status").equals("ACCEPTED"))return false;var age=Duration.between(Instant.parse(row.getString("imported_at")),clock.instant());return !age.isNegative()&&age.compareTo(Duration.ofDays(1))<0;}}
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
