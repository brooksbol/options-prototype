package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.node.*;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;
import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;
import static org.assertj.core.api.Assertions.*;

/** Controlled public definitions/chain, actual CSV/source admission and native backend evaluator. */
class PortfolioFidelityReferenceTest {
 @TempDir Path directory;
 final class Client extends TastytradeClient {
  int definitions,chains;String series="ABC   261120C00010000";String strike="10",root="ABC",chainType="Standard",currency="USD";int shares=100;boolean fail=false;
  Client(){super("synthetic-id","synthetic-secret","synthetic-refresh");}
  @Override public byte[] optionDefinitions(List<String> subjects)throws Exception{definitions++;series=subjects.getFirst();if(fail)throw new IllegalStateException();var raw=obj().put("symbol",subjects.getFirst()).put("root-symbol",root).put("underlying-symbol",root).put("instrument-type","Equity Option").put("exercise-style","American").put("strike-price",strike).put("option-type","C").put("expiration-date","2026-11-20").put("option-chain-type",chainType).put("shares-per-contract",shares).put("currency",currency);var body=obj();body.set("data",obj().set("items",array().add(raw)));return JSON.writeValueAsBytes(body);}
  @Override public Set<String> optionDefinitionFallback(List<String> subjects,OptionDefinitionSink sink){return Set.copyOf(subjects);}
  @Override public byte[] compactOptionChain(String symbol)throws Exception{chains++;if(fail)throw new IllegalStateException();var group=obj().put("underlying-symbol",root).put("option-chain-type",chainType).put("shares-per-contract",shares);group.set("symbols",array().add(series));group.set("deliverables",array().add(obj().put("deliverable-type","Shares").put("instrument-type","Equity").put("symbol",root).put("amount",shares)));var body=obj();body.set("data",obj().set("items",array().add(group)));return JSON.writeValueAsBytes(body);}
 }
 final class Rig implements AutoCloseable {
  final SqliteEvidenceStore db;final AccountDirectory accounts;final PortfolioRepository repo;final PortfolioReadService reader;final PortfolioTacticalInventory inventory;final Client client=new Client();final String account;Instant now=Instant.parse("2026-10-29T16:00:00Z");
  Rig()throws Exception{db=new SqliteEvidenceStore(directory.resolve(UUID.randomUUID()+".sqlite3").toString());accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());account=accounts.bind("pine","A1");var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(db,JSON));String csv=PositionsTest.csv("A1,Pine,ETFs,ABC,ABC fund,100,1000,0,Cash\nA1,Pine,Options,-ABC261120C10,CALL (ABC) ABC NOV 20 26 $10,-1,-20,0,Cash\n","Oct-27-2026");artifacts.ingest(account,"source.csv","POSITIONS",csv.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());repo=new PortfolioRepository(db,JSON);reader=new PortfolioReadService(repo,new PortfolioSources(repo,JSON,accounts));reader.fidelityReferences(new PortfolioFidelityReferences(repo,accounts,client,true,Clock.fixed(now,ZoneOffset.UTC)));inventory=new PortfolioTacticalInventory(repo,reader,accounts);}
  BearerAuthenticator.Principal caller(boolean reference,boolean market){var grants=new HashSet<>(Set.of("account.read:"+account,"account.positions.read:"+account,"account.holdings.read:"+account));if(reference)grants.add("reference.read");if(market)grants.add("market.read");return new BearerAuthenticator.Principal("reader",grants);}
  ObjectNode read(boolean ref,boolean market)throws Exception{return inventory.read(account,"ABC","test",caller(ref,market),now);}
  public void close()throws Exception{db.close();}
 }
 @Test void requestTriggeredPublicTermsEnableOnlyTerminalGeometryAndAreReused()throws Exception{try(var r=new Rig()){var first=r.read(true,true);var unit=first.at("/accounts/0/items/0");assertThat(unit.at("/evaluation/payoff/status").asText()).as(first.toString()).isEqualTo("QUALIFIED");assertThat(unit.at("/evaluation/payoff/geometry/valueKind").asText()).isEqualTo("TERMINAL_VALUE");assertThat(unit.at("/evaluation/payoff/geometry/segments/1/slope").asText()).isEqualTo("0");assertThat(unit.at("/evaluation/payoff/geometry/breakEvenPrices")).isEmpty();assertThat(unit.at("/evaluation/openingCashFlow").isMissingNode()).isTrue();assertThat(unit.at("/evaluation/grossUnrealizedPl").isMissingNode()).isTrue();assertThat(unit.path("state").asText()).isEqualTo("UNRESOLVED");assertThat(first.at("/accounts/0/source/observationDate").asText()).isEqualTo("2026-10-27");int termCount=0;for(var part:unit.path("constituents"))if(part.path("terms").isObject()){termCount++;assertThat(part.at("/terms/multiplier").isNull()).isTrue();assertThat(part.at("/terms/qualification").asText()).isEqualTo("INCOMPLETE");assertThat(part.at("/terms/terminalSettlement/status").asText()).isEqualTo("QUALIFIED");}assertThat(termCount).isEqualTo(1);assertThat(unit.at("/evaluation/moneyness/legs/0/status").asText()).isEqualTo("QUALIFIED");assertThat(unit.at("/evaluation/moneyness/legs/0/observedState").asText()).isEqualTo("UNAVAILABLE");assertThat(r.client.definitions).isEqualTo(1);assertThat(r.client.chains).isEqualTo(1);r.read(true,true);assertThat(r.client.definitions).isEqualTo(1);assertThat(r.client.chains).isEqualTo(1);}}
 @Test void grantsAndUnderlyingSelectionPreventUnauthorizedOrUnneededProviderCalls()throws Exception{try(var r=new Rig()){r.read(false,true);r.read(true,false);r.inventory.read(r.account,"OTHER","test",r.caller(true,true),r.now);assertThat(r.client.definitions).isZero();assertThat(r.client.chains).isZero();}}
 @Test void unsupportedReferenceOrFailedProviderPreservesCustodyWithoutInventingShape()throws Exception{for(String mode:List.of("adjusted","wrongRoot","wrongStrike","non100","wrongCurrency","unavailable"))try(var r=new Rig()){switch(mode){case "adjusted"->r.client.chainType="Adjusted";case "wrongRoot"->r.client.root="OTHER";case "wrongStrike"->r.client.strike="11";case "non100"->r.client.shares=50;case "wrongCurrency"->r.client.currency="EUR";default->r.client.fail=true;}var result=r.read(true,true);assertThat(result.at("/accounts/0/representedHoldingCount").asInt()).as(mode).isEqualTo(2);assertThat(result.at("/accounts/0/items/0/evaluation/payoff/geometry").isMissingNode()).as(mode).isTrue();}}
 @Test void publicReferenceReuseExpiresOnlyWhenAnotherRequestArrives()throws Exception{try(var r=new Rig()){r.read(true,true);assertThat(r.client.definitions).isEqualTo(1);r.now=r.now.plus(Duration.ofHours(25));assertThat(r.client.definitions).isEqualTo(1);r.reader.fidelityReferences(new PortfolioFidelityReferences(r.repo,r.accounts,r.client,true,Clock.fixed(r.now,ZoneOffset.UTC)));r.read(true,true);assertThat(r.client.definitions).isEqualTo(2);assertThat(r.client.chains).isEqualTo(2);}}

 @Test void retainedTerminalReferenceIsNotDisclosedOrUsedWithoutReferencePermission()throws Exception{try(var r=new Rig()){r.read(true,true);var without=r.read(false,true);assertThat(without.at("/accounts/0/items/0/evaluation/payoff/geometry").isMissingNode()).isTrue();assertThat(without.at("/accounts/0/items/0/evaluation/moneyness").isMissingNode()).isTrue();for(var part:without.at("/accounts/0/items/0/constituents"))assertThat(part.at("/terms/terminalSettlement").isMissingNode()).isTrue();var withoutMarket=r.read(true,false);assertThat(withoutMarket.at("/accounts/0/items/0/evaluation/payoff/status").asText()).isEqualTo("QUALIFIED");assertThat(r.client.definitions).isEqualTo(1);}}

 @Test void anotherAccountsNewChainDoesNotRenewAnOlderExactSeries()throws Exception{try(var r=new Rig()){
  r.read(true,true);assertThat(r.client.definitions).isEqualTo(1);
  r.now=r.now.plus(Duration.ofHours(48));r.reader.fidelityReferences(new PortfolioFidelityReferences(r.repo,r.accounts,r.client,true,Clock.fixed(r.now,ZoneOffset.UTC)));
  String other=r.accounts.bind("other","A2");var artifacts=new BrokerageArtifacts(r.db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(r.db,JSON));String csv=PositionsTest.csv("A2,Other,ETFs,ABC,ABC fund,100,2000,0,Cash\nA2,Other,Options,-ABC261120C20,CALL (ABC) ABC NOV 20 26 $20,-1,-20,0,Cash\n","Oct-29-2026");artifacts.ingest(other,"other.csv","POSITIONS",csv.getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());
  var principal=new BearerAuthenticator.Principal("reader",Set.of("account.read:"+other,"account.positions.read:"+other,"account.holdings.read:"+other,"reference.read","market.read"));r.client.strike="20";r.inventory.read(other,"ABC","test",principal,r.now);assertThat(r.client.definitions).isEqualTo(2);
  r.client.strike="10";r.read(true,true);assertThat(r.client.definitions).isEqualTo(3);assertThat(r.client.chains).isEqualTo(3);
  // A financially unchanged reacquisition has a fresh exact-series receipt even if current DTO evidence is idempotent.
  r.read(true,true);assertThat(r.client.definitions).isEqualTo(3);assertThat(r.client.chains).isEqualTo(3);
 }}

 @Test void incompleteOrIncompatibleAcquisitionReceiptsNeverExtendExactSeriesReuse()throws Exception{
  for(String mode:List.of("legacy","missingSeries","wrongRoot","wrongArtifact","wrongHash","wrongType","wrongProfile","futureReceipt","futureImport","malformedClock","failed"))try(var r=new Rig()){
   r.read(true,true);assertThat(r.client.definitions).isEqualTo(1);
   try(var c=r.repo.connection();var q=c.prepareStatement("SELECT import_id,result FROM brokerage_import WHERE file_type='API_OPTION_CHAIN'");var rows=q.executeQuery()){
    assertThat(rows.next()).isTrue();String id=rows.getString(1);var result=(ObjectNode)JSON.readTree(rows.getString(2));var receipt=(ObjectNode)result.path("publicReferences");
    switch(mode){case "missingSeries"->receipt.set("series",array());case "wrongRoot"->receipt.put("root","OTHER");case "wrongArtifact"->receipt.put("sourceArtifact","foreign");case "wrongHash"->receipt.put("sourceSha256","0".repeat(64));case "wrongType"->receipt.put("sourceType","API_OPTION_DEFINITION");case "wrongProfile"->receipt.put("bindingProfileVersion",2);case "futureReceipt"->receipt.put("acquiredAt",r.now.plusSeconds(1).toString());case "malformedClock"->receipt.put("acquiredAt","unknown");default->{}}
    try(var update=c.prepareStatement("UPDATE brokerage_import SET result=?,status=?,imported_at=? WHERE import_id=?")){update.setString(1,mode.equals("legacy")?"Legacy sentence":JSON.writeValueAsString(result));update.setString(2,mode.equals("failed")?"REJECTED":"ACCEPTED");update.setString(3,(mode.equals("futureImport")?r.now.plusSeconds(1):r.now).toString());update.setString(4,id);update.executeUpdate();}
   }
   r.read(true,true);assertThat(r.client.definitions).as(mode).isEqualTo(2);assertThat(r.client.chains).as(mode).isEqualTo(2);
  }
 }

}
