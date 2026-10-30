package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;
import static org.assertj.core.api.Assertions.*;import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;

class PortfolioUniversalInventoryTest {
 @TempDir Path directory;
 @Test void staleFidelityInventoryRetainsSourceIdentityGroupingAndEveryQuantityWithoutPretendingTradeMembership()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("inventory.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String a=accounts.bind("pine","A1"),b=accounts.bind("birch","B1");var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(db,JSON));
   String body="A1,Pine,ETFs,ABC,ABC fund,100,1200,200,Margin\nA1,Pine,Options,-ABC261120C10,CALL (ABC) ABC NOV 20 26 $10,-1,-20,10,Margin\nA1,Pine,Bonds/Fixed income,912797AAA,US TREASURY BILL DUE 10/20/2026,1000,1000,0,Cash\nA1,Pine,Cash,SPAXX**,Money market,,12.34,0,Cash\n";
   artifacts.ingest(a,"old.csv","POSITIONS",PositionsTest.csv("A1,Pine,Options,-OLD260101P1,Old option,-1,1,0,Cash\n","Oct-04-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());
   artifacts.ingest(a,"source.csv","POSITIONS",PositionsTest.csv(body,"Oct-05-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());var repo=new PortfolioRepository(db,JSON);var sources=new PortfolioSources(repo,JSON,accounts);var reader=new PortfolioReadService(repo,sources);var service=new PortfolioTacticalInventory(repo,reader,accounts);
   var caller=new BearerAuthenticator.Principal("reader",Set.of("account.read:"+a,"account.read:"+b,"account.positions.read:"+a,"account.holdings.read:"+a,"reference.read"));
   for(var now:List.of("2026-10-05T16:00:00Z","2026-10-08T16:00:00Z","2026-10-29T16:00:00Z")){
    var result=service.read(null,null,"test",caller,Instant.parse(now));assertThat(result.path("accounts")).hasSize(2);var pine=result.path("accounts").get(0);if(!pine.path("nickname").asText().equals("pine"))pine=result.path("accounts").get(1);assertThat(pine.path("status").asText()).isEqualTo("READ");assertThat(pine.path("sourceHoldingCount").asInt()).isEqualTo(4);assertThat(pine.path("representedHoldingCount")).isEqualTo(pine.path("sourceHoldingCount"));assertThat(pine.at("/source/observationDate").asText()).isEqualTo("2026-10-05");assertThat(pine.path("items")).hasSize(3);assertThat(pine.toString()).doesNotContain("-OLD260101P1");
    var group=pine.path("items").get(0);for(var item:pine.path("items"))if(item.path("title").asText().equals("ABC"))group=item;
    assertThat(group.path("variant").asText()).isEqualTo("SHARES_AND_CALLS");assertThat(group.path("constituents")).hasSize(2);assertThat(group.at("/structure/status").asText()).isEqualTo("COMPATIBLE_INVENTORY");assertThat(group.path("strikeConfiguration")).hasSize(1);assertThat(group.at("/strikeConfiguration/0/strike").asText()).isEqualTo("10");assertThat(group.at("/evaluation/payoff/geometry").isMissingNode()).isTrue();assertThat(group.has("self")).isFalse();assertThat(group.toString()).doesNotContain("COVERED_CALL","CSP","openingCashFlow");
   }
   var filtered=service.read(a,"ABC","test",caller,Instant.parse("2026-10-29T16:00:00Z"));assertThat(filtered.path("accounts")).hasSize(1);assertThat(filtered.at("/accounts/0/items")).hasSize(1);
  }
 }
 @Test void sameCutNativePackageRetainsExactlyTheExistingTacticalFinancialMeaning()throws Exception{
  var h=new PortfolioSourcePackageTest();h.directory=directory;h.setup();try{
   var held=h.selected("holdings","UNG");h.holdings(held);h.references(held,false);h.orders(false);var caller=new BearerAuthenticator.Principal("reader",Set.of("account.read:"+h.account,"account.positions.read:"+h.account,"account.holdings.read:"+h.account,"account.orders.read:"+h.account,"account.artifacts.read:"+h.account,"reference.read","market.read","account.market.read:"+h.account));var reader=new PortfolioReadService(h.repo,h.sources);var now=Instant.parse("2026-10-29T16:00:00Z");var expected=reader.tactical(h.current().getFirst(),caller,now,new PortfolioReadService.ReadContext());var result=new PortfolioTacticalInventory(h.repo,reader,h.accounts).read(h.account,null,"test",caller,now);assertThat(result.at("/accounts/0/items")).hasSize(1);var actual=result.at("/accounts/0/items/0");for(var key:List.of("id","currentConstruction","structure","constituents","evaluation"))assertThat(actual.path(key)).as(key).isEqualTo(expected.path(key));assertThat(result.at("/accounts/0/representedHoldingCount")).isEqualTo(result.at("/accounts/0/sourceHoldingCount"));
  }finally{h.close();}
 }
 @Test void badOrAdjustedSourceIdentityNeverInventsStandardTermsOrTicker(){
  for(String contract:List.of("-ABC261332C10","-ABC1261120C10","OPAQUE001","-.261120C10")){
   var h=obj();h.set("sourceInstrument",obj().put("identifier",contract));var s=new PositionSnapshot.Constituent("h",contract,"CALL (ABC) ABC NOV 20 26 $10","Options","Cash",java.math.BigDecimal.ONE,null,null,null,null,null,List.of(1));var identity=PortfolioInventoryIdentity.identify(h,s,"FIDELITY");assertThat(identity.path("underlyingSymbol").isNull()).isTrue();assertThat(identity.has("terms")).isFalse();
  }
 }
 @Test void competingWholeAllocationsCannotDuplicateCustodyOrSmuggleOpeningBasisIntoFallback()throws Exception{
  var h=new PortfolioSourcePackageTest();h.directory=directory;h.setup();try{
   var held=h.selected("holdings","UNG");h.holdings(held);h.references(held,false);h.orders(false);var original=h.current().getFirst();var c=h.construction(original);String pId=UUID.randomUUID().toString(),cId=UUID.randomUUID().toString(),pUri="/v2/positions/"+pId,cUri="/v2/constructions/"+cId;var pv=original.value().deepCopy();pv.put("id",pId);pv.set("self",link(pUri));pv.set("currentConstruction",link(cUri));var cv=c.value().deepCopy();cv.put("id",cId);cv.set("self",link(cUri));cv.set("position",link(pUri));
   try(var tx=h.repo.connection()){h.repo.put(tx,new PortfolioRepository.Document(PortfolioRepository.Kind.CONSTRUCTION,cUri,h.account,cv,c.snapshot(),"competing"));h.repo.put(tx,new PortfolioRepository.Document(PortfolioRepository.Kind.POSITION,pUri,h.account,pv,original.snapshot(),"competing"));}
   var caller=new BearerAuthenticator.Principal("reader",Set.of("account.read:"+h.account,"account.positions.read:"+h.account,"account.holdings.read:"+h.account,"account.orders.read:"+h.account,"account.artifacts.read:"+h.account,"reference.read","market.read","account.market.read:"+h.account));var reader=new PortfolioReadService(h.repo,h.sources);var result=new PortfolioTacticalInventory(h.repo,reader,h.accounts).read(h.account,null,"test",caller,Instant.parse("2026-10-29T16:00:00Z"));var a=result.at("/accounts/0");assertThat(a.path("sourceHoldingCount").asInt()).isEqualTo(4);assertThat(a.path("representedHoldingCount").asInt()).isEqualTo(4);var seen=new HashSet<String>();for(var unit:a.path("items")){assertThat(unit.path("representation").asText()).isEqualTo("TACTICAL_INVENTORY_GROUP");assertThat(unit.at("/evaluation/openingCashFlow").isMissingNode()).isTrue();assertThat(unit.at("/evaluation/grossUnrealizedPl").isMissingNode()).isTrue();for(var ref:unit.path("sourceHoldings"))assertThat(seen.add(ref.path("href").asText())).isTrue();}assertThat(seen).hasSize(4);
  }finally{h.close();}
 }
 @Test void distinctSameSymbolCustodyQuantitiesRemainSeparateAndExpiredRetainedContractsSurvive()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("lots.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("pine","A1");var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(db,JSON));String body="A1,Pine,ETFs,ABC,ABC fund,100,1000,0,Cash\nA1,Pine,ETFs,ABC,ABC fund,150,1500,0,Margin\nA1,Pine,Options,-ABC261001C10,CALL (ABC) ABC OCT 1 26 $10,-1,-10,0,Margin\n";artifacts.ingest(account,"source.csv","POSITIONS",PositionsTest.csv(body,"Oct-05-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());var repo=new PortfolioRepository(db,JSON);var source=new PortfolioSources(repo,JSON,accounts);var reader=new PortfolioReadService(repo,source);var caller=new BearerAuthenticator.Principal("reader",Set.of("account.read:"+account,"account.positions.read:"+account,"account.holdings.read:"+account));var result=new PortfolioTacticalInventory(repo,reader,accounts).read(account,null,"test",caller,Instant.parse("2026-10-29T16:00:00Z"));assertThat(result.at("/accounts/0/items")).hasSize(1);var unit=result.at("/accounts/0/items/0");assertThat(unit.path("constituents")).hasSize(3);var quantities=new HashSet<String>();for(var part:unit.path("constituents"))quantities.add(part.path("quantity").asText());assertThat(quantities).containsExactlyInAnyOrder("100","150","1");assertThat(unit.at("/evaluation/timeline/remainingDays/value").asText()).isEqualTo("0");assertThat(unit.at("/evaluation/timeline/expiration").asText()).isEqualTo("2026-10-01");assertThat(unit.has("self")).isFalse();
  }
 }

 @Test void conflictingSourceDescriptionDoesNotCreateContractGeometry()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("conflict.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String account=accounts.bind("pine","A1");var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(db,JSON));
   artifacts.ingest(account,"source.csv","POSITIONS",PositionsTest.csv("A1,Pine,Options,-ABC261120C10,CALL (XYZ) XYZ NOV 20 26 $10,-1,-20,0,Cash\n","Oct-05-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());var repo=new PortfolioRepository(db,JSON);var reader=new PortfolioReadService(repo,new PortfolioSources(repo,JSON,accounts));var caller=new BearerAuthenticator.Principal("reader",Set.of("account.read:"+account,"account.positions.read:"+account,"account.holdings.read:"+account,"reference.read"));var result=new PortfolioTacticalInventory(repo,reader,accounts).read(account,null,"test",caller,Instant.parse("2026-10-29T16:00:00Z"));var unit=result.at("/accounts/0/items/0");assertThat(unit.path("strikeConfiguration")).isEmpty();assertThat(unit.path("warningCodes").toString()).contains("INCOMPATIBLE_CONTRACT_TERMS");assertThat(unit.at("/evaluation/payoff/geometry").isMissingNode()).isTrue();assertThat(result.at("/accounts/0/representedHoldingCount").asInt()).isEqualTo(1);
  }
 }

}
