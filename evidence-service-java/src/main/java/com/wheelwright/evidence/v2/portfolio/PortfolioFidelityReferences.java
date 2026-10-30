package com.wheelwright.evidence.v2.portfolio;

import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.v2.*;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.*;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioRepository.*;

/** Principal-approved public contract references only. Never reads a brokerage Account upstream. */
@Component
public final class PortfolioFidelityReferences {
 private final PortfolioRepository repo;private final AccountDirectory accounts;private final TastytradeClient client;private final boolean enabled;private final Clock clock;
 private final Map<String,Object> locks=new ConcurrentHashMap<>();
 @Autowired public PortfolioFidelityReferences(PortfolioRepository repo,AccountDirectory accounts,TastytradeClient client,@Value("${wheelwright.portfolio.market.read-through-enabled:false}")boolean enabled){this(repo,accounts,client,enabled,Clock.systemUTC());}
 public PortfolioFidelityReferences(PortfolioRepository repo,AccountDirectory accounts,TastytradeClient client,boolean enabled,Clock clock){this.repo=repo;this.accounts=accounts;this.client=client;this.enabled=enabled;this.clock=clock;}
 public ArrayNode read(String account,String selectedUnderlying,BearerAuthenticator.Principal caller,long deadline)throws Exception{
  var warnings=array();if(!enabled||!client.configured()||!caller.hasGrant("market.read")||!caller.hasGrant("reference.read"))return warnings;
  for(String capability:List.of("account.read:","account.positions.read:","account.holdings.read:"))if(!caller.hasGrant(capability+account))return warnings;
  var owner=accounts.get(account);if(owner.isEmpty()||!owner.get().brokerAssociation().broker().equals("FIDELITY"))return warnings;
  var cut=new PortfolioSnapshots(repo).current(account);if(cut.isEmpty())return warnings;
  var groups=new TreeMap<String,Map<String,String>>();var bindings=new TreeMap<String,String>();int count=0;
  for(var holding:cut.get().holdings())if(holding.kind().equals("Options")){
   var source=obj();source.set("sourceInstrument",obj().put("identifier",holding.contract()));var identity=PortfolioInventoryIdentity.identify(source,holding,"FIDELITY");if(!identity.path("basis").asText().equals("FIDELITY_OPTION_CODE"))continue;
   var parsed=FidelityPositions.optionSymbol(holding.contract());if(selectedUnderlying!=null&&!selectedUnderlying.equals(parsed.underlying()))continue;
   String series;try{series=series(parsed);}catch(IllegalArgumentException e){warnings.add(unavailable("Some source option identities cannot be represented by the supported public reference profile."));continue;}
   String uri=instrument(holding.contract());var existing=repo.get(uri);if(existing.isEmpty()||!existing.get().value().path("kind").asText().equals("OPTION")||!existing.get().value().path("symbol").asText().equals(holding.contract()))continue;
   var previous=bindings.putIfAbsent(series,uri);if(previous!=null&&!previous.equals(uri)){warnings.add(unavailable("Ambiguous source contract identity; no reference binding selected."));return warnings;}
   bindings.put(parsed.underlying(),instrument(parsed.underlying()));groups.computeIfAbsent(parsed.underlying(),k->new TreeMap<>()).put(series,uri);if(previous==null)count++;
  }
  if(count>100||groups.size()>10){warnings.add(unavailable("Public contract-reference subject budget exceeded; narrow Account or underlying scope."));return warnings;}
  for(var entry:groups.entrySet())synchronized(locks.computeIfAbsent(entry.getKey(),k->new Object())){
   String root=entry.getKey();var requested=entry.getValue().keySet();restoreDefinitions(account,requested,bindings);if(fresh(root,entry.getValue().values()))continue;
   if(!budget(deadline)){warnings.add(unavailable("Public reference deadline reached; retained custody and prior terms remain available."));break;}
   try{
    var found=new HashSet<String>();
    try{byte[] bytes=client.optionDefinitions(new ArrayList<>(requested));found.addAll(definition(account,bytes,requested,false,bindings));}catch(Exception unsupportedBatch){/* Existing bounded provider single-contract fallback, never a trading endpoint. */}
    var missing=new TreeSet<>(requested);missing.removeAll(found);
    if(!missing.isEmpty()&&budget(deadline)){var failed=client.optionDefinitionFallback(new ArrayList<>(missing),(symbol,bytes)->definition(account,bytes,Set.of(symbol),true,bindings));if(!failed.isEmpty())warnings.add(unavailable("Some requested public definitions are unavailable; missing terms remain unknown."));}
    if(!budget(deadline)){warnings.add(unavailable("Public reference deadline reached before chain corroboration."));break;}
    byte[] bytes=client.compactOptionChain(root);String attempt=UUID.randomUUID().toString(),artifact=PortfolioMarketAcquisition.retainSource(repo,clock,account,attempt,bytes,"API_OPTION_CHAIN",filename(root));
    try(var c=repo.connection()){c.setAutoCommit(false);try{new PortfolioOptionReferenceSources(repo,bindings).admit(c,account,artifact,root,requested);PortfolioMarketAcquisition.finish(c,account,attempt,"ACCEPTED","Public contract reference source admitted; unknown individual terms remain unknown");c.commit();}catch(Exception e){c.rollback();try(var rejected=repo.connection()){PortfolioMarketAcquisition.finish(rejected,account,attempt,"REJECTED","Unsupported public contract reference; prior terms preserved");}throw e;}}
   }catch(Exception e){warnings.add(unavailable("Requested public contract definitions or deliverables unavailable; no missing terms invented."));}
  }
  return warnings;
 }
 private void restoreDefinitions(String account,Set<String> requested,Map<String,String> bindings)throws Exception{
  boolean missingProfile=false;for(String series:requested){var doc=repo.get(bindings.get(series));missingProfile|=doc.isPresent()&&!doc.get().value().at("/option/terminalSettlement").isObject();}if(!missingProfile)return;
  var artifacts=new ArrayList<String>();try(var c=repo.connection();var q=c.prepareStatement("SELECT DISTINCT i.artifact_id FROM brokerage_import i WHERE i.account=? AND i.status='ACCEPTED' AND i.original_filename='tastytrade-public-option-definition.json' ORDER BY i.imported_at DESC LIMIT 100")){q.setString(1,account);try(var rows=q.executeQuery()){while(rows.next())artifacts.add(rows.getString(1));}}
  for(String artifact:artifacts){String key="public-terminal-profile:v1:"+artifact+":"+UUID.nameUUIDFromBytes(String.join(",",new TreeSet<>(requested)).getBytes(StandardCharsets.UTF_8));try(var c=repo.connection()){if(repo.admitted(c,account,key))continue;c.setAutoCommit(false);try{new PortfolioOptionDefinitions(repo,bindings).admit(c,account,artifact,requested);repo.markAdmitted(c,account,key);c.commit();}catch(IllegalArgumentException notThisSubject){c.rollback();repo.markAdmitted(c,account,key);c.commit();}catch(Exception e){c.rollback();throw e;}}}
 }
 private Set<String> definition(String account,byte[] bytes,Set<String> requested,boolean single,Map<String,String> bindings)throws Exception{
  String attempt=UUID.randomUUID().toString(),artifact=PortfolioMarketAcquisition.retainSource(repo,clock,account,attempt,bytes,single?"API_OPTION_DEFINITION":"API_OPTION_DEFINITIONS","tastytrade-public-option-definition.json");
  try(var c=repo.connection()){c.setAutoCommit(false);try{var found=new PortfolioOptionDefinitions(repo,bindings).admit(c,account,artifact,requested);PortfolioMarketAcquisition.finish(c,account,attempt,"ACCEPTED","Public definition source admitted; not custody, opening or market quote evidence");c.commit();return found;}catch(Exception e){c.rollback();try(var rejected=repo.connection()){PortfolioMarketAcquisition.finish(rejected,account,attempt,"REJECTED","Unsupported public definition; prior reference preserved");}throw e;}}
 }
 private boolean fresh(String underlying,Collection<String> subjects)throws Exception{
  for(String uri:subjects){var i=repo.get(uri);if(i.isEmpty()||!i.get().value().path("option").isObject())return false;boolean definition=false,chain=false;for(var e:i.get().value().at("/option/evidence")){String ref=e.path("reference").asText();definition|=ref.contains(":option-definition:sha256:");chain|=ref.contains(":option-chain:sha256:");}if(!definition||!chain)return false;}
  try(var c=repo.connection();var q=c.prepareStatement("SELECT imported_at FROM brokerage_import WHERE file_type='API_OPTION_CHAIN' AND original_filename=? AND status='ACCEPTED' ORDER BY imported_at DESC,import_id DESC LIMIT 1")){q.setString(1,filename(underlying));try(var r=q.executeQuery()){if(!r.next())return false;var age=Duration.between(Instant.parse(r.getString(1)),clock.instant());return !age.isNegative()&&age.compareTo(Duration.ofDays(1))<0;}}
 }
 private static boolean budget(long deadline){return deadline-System.nanoTime()>=Duration.ofSeconds(10).toNanos();}
 private static String filename(String root){return "tastytrade-public-option-chain-"+root+".json";}
 static String series(FidelityPositions.OptionSymbol parsed){if(parsed.underlying().length()>6)throw new IllegalArgumentException();var strike=parsed.strike().movePointRight(3);String digits;try{digits=strike.toBigIntegerExact().toString();}catch(ArithmeticException e){throw new IllegalArgumentException();}if(digits.length()>8||strike.signum()<0)throw new IllegalArgumentException();return String.format(java.util.Locale.ROOT,"%-6s%s%s%08d",parsed.underlying(),parsed.expiration().format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd")),parsed.right().equals("CALL")?"C":"P",strike.toBigIntegerExact());}
 private static String instrument(String nativeId){return "/v2/instruments/"+UUID.nameUUIDFromBytes(("instrument:FIDELITY:"+nativeId).getBytes(StandardCharsets.UTF_8));}
 private static ObjectNode unavailable(String explanation){return warning("TERMS_UNAVAILABLE","/evaluation/payoff","Retained inventory, source dates and independently qualified facts remain inspectable.",explanation);}
}
