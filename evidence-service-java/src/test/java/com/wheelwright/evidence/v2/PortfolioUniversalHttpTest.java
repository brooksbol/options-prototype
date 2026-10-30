package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.db.SqliteEvidenceStore;import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.*;import org.junit.jupiter.api.io.TempDir;import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;
import static org.assertj.core.api.Assertions.*;import static com.wheelwright.evidence.v2.portfolio.PortfolioJson.*;import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
class PortfolioUniversalHttpTest {
 @TempDir Path directory;
 @Test void sharedRouteEnforcesEachGrantAndSelectorsAndUsesControlledAgeClock()throws Exception{
  try(var db=new SqliteEvidenceStore(directory.resolve("http.sqlite3").toString())){
   var accounts=new AccountDirectory(db.getConnection().getMetaData().getURL());String a=accounts.bind("pine","A1"),b=accounts.bind("birch","B1");var artifacts=new BrokerageArtifacts(db.getConnection().getMetaData().getURL(),JSON,new PositionReadService(db,JSON));artifacts.ingest(a,"source.csv","POSITIONS",PositionsTest.csv("A1,Pine,Stocks,ABC,ABC shares,100,1000,0,Cash\n","Oct-05-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());
   var repo=new PortfolioRepository(db,JSON);var source=new PortfolioSources(repo,JSON,accounts);var reader=new PortfolioReadService(repo,source);var auth=new BearerAuthenticator(new UserDirectory(db,accounts),"reader=reader:account.read:"+a+"|account.positions.read:"+a+"|account.holdings.read:"+a+"|account.read:"+b);var inventory=new PortfolioTacticalInventory(repo,reader,accounts);var controller=new PortfolioController(reader,auth,accounts);controller.inventoryView(new TacticalInventoryController(inventory,auth,accounts,Clock.fixed(Instant.parse("2026-10-29T16:00:00Z"),ZoneOffset.UTC)));var mvc=MockMvcBuilders.standaloneSetup(controller).build();
   assertThat(mvc.perform(get("/v2/positions?view=inventory")).andReturn().getResponse().getStatus()).isEqualTo(401);
   var response=mvc.perform(get("/v2/positions?view=inventory").header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);var body=JSON.readTree(response.getContentAsString());assertThat(body.path("accounts")).hasSize(2);boolean denied=false;for(var account:body.path("accounts")){if(account.path("nickname").asText().equals("pine")){assertThat(account.at("/source/ageDays").asLong()).isEqualTo(24);assertThat(account.at("/items/0/title").asText()).isEqualTo("ABC");}else{assertThat(account.path("status").asText()).isEqualTo("FORBIDDEN");assertThat(account.path("items")).isEmpty();denied=true;}}assertThat(denied).isTrue();assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");
   for(String bad:List.of("view=inventory&limit=10","view=inventory&cursor=x","view=inventory&view=inventory","view=inventory&underlying=abc","view=inventory&state=OPEN"))assertThat(mvc.perform(get("/v2/positions?"+bad).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).as(bad).isEqualTo(422);
   assertThat(mvc.perform(get("/v2/positions?view=inventory&accountId=acct_"+"1".repeat(32)).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(403);
  }
 }
}
