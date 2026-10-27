package com.wheelwright.evidence.v2;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.v2.portfolio.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
class OptionInventoryTest {
 @TempDir Path temp;
 @Test void allRowsAndBackendCountsPreserveConstructionUnknownAndDeniedScopes()throws Exception {
  try(var db=new SqliteEvidenceStore(temp.resolve("inventory.db").toString())) {
   var mapper=new ObjectMapper();var accounts=new AccountDirectory(db,"");
   var artifacts=new BrokerageArtifacts(db,mapper,new PositionReadService(db,mapper),accounts);var ids=new ArrayList<String>();
   for(int n=0;n<3;n++) {
    String broker="SYNTHETIC0"+n,id=accounts.bind("fixture"+n,"FIDELITY",broker);ids.add(id);
    String body=broker+",Fixture,Options,-ALFA261120P10,Put,-1,--,--,Cash\n";
    if(n>0)body+=broker+",Fixture,Options,-ZETA261120P20,Put,-1,--,--,Cash\n";
    if(n==2)body+=broker+",Fixture,Options,-ZETA261120P19,Long put,1,--,--,Cash\n";
    artifacts.ingest(id,"positions.csv","POSITIONS",PositionsTest.csv(body,"Oct-27-2026").getBytes(StandardCharsets.UTF_8),UUID.randomUUID().toString());
   }
   String grants=ids.stream().map(id->"account.read:"+id+"|account.holdings.read:"+id).collect(java.util.stream.Collectors.joining("|"));
   var auth=new BearerAuthenticator(new UserDirectory(db,accounts),"reader=reader:"+grants+",limited=limited:account.read:"+ids.get(0)+"|account.read:"+ids.get(1)+"|account.holdings.read:"+ids.get(0));
   var repo=new PortfolioRepository(db,mapper);var reader=new OptionInventoryReader(repo,new PortfolioSources(repo,mapper,accounts),accounts);
   var result=reader.read(null,"PUT","SHORT","request",auth.authenticate("Bearer reader").orElseThrow());
   assertThat(result.accounts()).hasSize(3);assertThat(result.counts().shortPutContracts()).isEqualByComparingTo("5");assertThat(result.counts().selectedInventoryComplete()).isTrue();assertThat(result.counts().cashSecuredPutContracts()).isNull();
   assertThat(result.accounts().stream().flatMap(a->a.options().stream())).hasSize(5).allSatisfy(r->{assertThat(r.right()).isEqualTo("PUT");assertThat(r.side()).isEqualTo("SHORT");assertThat(r.source().sourceRows()).isNotEmpty();assertThat(r.constructionStatus()).isEqualTo("NOT_ESTABLISHED_BY_CUSTODY");});
   var last=result.accounts().stream().filter(a->a.accountId().equals(ids.get(2))).findFirst().orElseThrow();var zeta=last.options().stream().filter(r->r.underlyingSymbol().equals("ZETA")).findFirst().orElseThrow();assertThat(zeta.relatedLongOptions()).hasSize(1);assertThat(zeta.relatedLongOptions().getFirst().associationStatus()).isEqualTo("CONTEXT_ONLY_NOT_CONSTRUCTION_MEMBERSHIP");
   assertThat(result.accounts().stream().filter(a->a.accountId().equals(ids.get(1))).findFirst().orElseThrow().options()).allSatisfy(r->assertThat(r.relatedLongOptions()).isEmpty());
   var partial=reader.read(null,"PUT","SHORT","request",auth.authenticate("Bearer limited").orElseThrow());assertThat(partial.counts().selectedInventoryComplete()).isFalse();assertThat(partial.accounts()).anySatisfy(a->{assertThat(a.status()).isEqualTo("FORBIDDEN");assertThat(a.readComplete()).isFalse();});
   var mvc=MockMvcBuilders.standaloneSetup(new OptionInventoryController(reader,accounts,auth,mapper)).build();
   var response=mvc.perform(get("/v2/option-inventory?right=PUT&side=SHORT").header("Authorization","Bearer reader")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");assertThat(response.getContentAsString()).doesNotContain("SYNTHETIC");
   java.nio.file.Files.createDirectories(Path.of("build/reports/option-inventory"));java.nio.file.Files.writeString(Path.of("build/reports/option-inventory/filtered.json"),response.getContentAsString());
   for(String query:List.of("?right=bad","?right=PUT&right=CALL","?unknown=1"))assertThat(mvc.perform(get("/v2/option-inventory"+query).header("Authorization","Bearer reader")).andReturn().getResponse().getStatus()).isEqualTo(422);
   assertThat(mvc.perform(get("/v2/option-inventory")).andReturn().getResponse().getStatus()).isEqualTo(401);
   assertThat(mvc.perform(get("/v2/option-inventory?accountId="+ids.get(2)).header("Authorization","Bearer limited")).andReturn().getResponse().getStatus()).isEqualTo(403);
  }
 }
}
