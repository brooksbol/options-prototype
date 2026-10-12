package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class MultiBrokerAccountsTest {
    @TempDir Path temp;
    final ObjectMapper mapper=new ObjectMapper();

    @Test void pairIdentityBootstrapRenameRestartAndAuthorization() throws Exception {
        String path=temp.resolve("accounts.sqlite3").toString(),f,t,namespace;
        try(var store=new SqliteEvidenceStore(path)) {
            var directory=new AccountDirectory(store,"pts=A1,tt1=TASTYTRADE:A1,zeros=TASTYTRADE:000a1");
            f=directory.list().stream().filter(a->a.alias().equals("pts")).findFirst().orElseThrow().id();
            t=directory.list().stream().filter(a->a.alias().equals("tt1")).findFirst().orElseThrow().id();
            namespace=directory.identityNamespace(t);
            assertThat(t).isNotEqualTo(f);
            assertThat(directory.bind("pts","A1")).isEqualTo(f);
            assertThat(directory.bind("tt1","TASTYTRADE","A1")).isEqualTo(t);
            assertThat(directory.list().stream().filter(a->a.alias().equals("zeros")).findFirst().orElseThrow().brokerAssociation().accountNumber()).isEqualTo("000a1");
            assertThatThrownBy(()->directory.bind("pts","TASTYTRADE","A1")).hasMessageContaining("conflicting");
            assertThatThrownBy(()->directory.bind("tt1","TASTYTRADE","OTHER")).hasMessageContaining("conflicting");
            assertThatThrownBy(()->directory.bind("bad","UNKNOWN","A1")).isInstanceOf(IllegalArgumentException.class);
            var auth=new BearerAuthenticator(new UserDirectory(store.getConnection().getMetaData().getURL()),
                "f=f:account.read:"+f+",t=t:account.read:"+t+",both=both:account.read:"+f+"|account.read:"+t+",admin=admin:users.admin");
            var mvc=MockMvcBuilders.standaloneSetup(new AccountsController(directory,auth,mapper)).build();
            for(var entry:Map.of("f",1,"t",1,"both",2,"admin",0).entrySet()) {
                var response=mvc.perform(get("/v2/accounts").header("Authorization","Bearer "+entry.getKey())).andReturn().getResponse();
                assertThat(response.getStatus()).isEqualTo(200);
                assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");
                var accounts=mapper.readTree(response.getContentAsString()).path("accounts");
                assertThat(accounts).hasSize(entry.getValue());
                if(entry.getKey().equals("t"))assertThat(accounts.get(0).path("brokerAssociation").path("broker").asText()).isEqualTo("TASTYTRADE");
            }
            for(String selector:List.of(t,"tt1"))assertThat(mvc.perform(get("/v2/accounts/"+selector).header("Authorization","Bearer f")).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/accounts/"+t).header("Authorization","Bearer admin")).andReturn().getResponse().getStatus()).isEqualTo(403);
            directory.rename(t,"trading","Trading");
            assertThat(auth.authenticate("Bearer t").orElseThrow().hasGrant("account.read:"+t)).isTrue();
        }
        try(var store=new SqliteEvidenceStore(path)) {
            var directory=new AccountDirectory(store,"pts=A1,tt1=TASTYTRADE:A1");
            assertThat(directory.bind("tt1","TASTYTRADE","A1")).isEqualTo(t);
            assertThat(directory.get(t).orElseThrow().alias()).isEqualTo("trading");
            assertThat(directory.get(t).orElseThrow().brokerAssociation().broker()).isEqualTo("TASTYTRADE");
            assertThat(directory.identityNamespace(t)).isEqualTo(namespace);
            assertThat(directory.bind("pts","A1")).isEqualTo(f);
        }
    }

    @Test void fidelitySourcesCannotResolveOrAdmitToTastytradeEvenWithCollidingReferences() throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("sources.sqlite3").toString())) {
            String url=store.getConnection().getMetaData().getURL();var directory=new AccountDirectory(url);
            // Register tastytrade first, so a first-row global lookup would be wrong.
            String ttA=directory.bind("tta","TASTYTRADE","A1"),ttB=directory.bind("ttb","TASTYTRADE","B2");
            String fA=directory.bind("fa","A1"),fB=directory.bind("fb","B2");
            var positions=new PositionReadService(store,mapper);var artifacts=new BrokerageArtifacts(url,mapper,positions);
            byte[] source=("Fidelity Investments - Option Summary A1\nSymbol,Strategy,Expiration & Strike,Quantity\nSPY,Other,Shares,1\nFidelity Investments - Option Summary B2,,,\nQQQ,PRIVATE-B,Shares,25\n").getBytes(StandardCharsets.UTF_8);
            assertThat(artifacts.sourceScopes(fA,"summary.csv",source).accountIds()).containsExactlyInAnyOrder(fA,fB);
            assertThat(artifacts.sourceScopes(ttA,"summary.csv",source).established()).isFalse();
            var auth=new BearerAuthenticator(new UserDirectory(url),"wrong=wrong:account.artifacts.read:"+fA+"|account.artifacts.read:"+ttB+",both=both:account.artifacts.read:"+fA+"|account.artifacts.read:"+fB);
            var mvc=MockMvcBuilders.standaloneSetup(new ArtifactsController(artifacts,auth,mapper)).build();
            String artifact=artifacts.ingest(fA,"summary.csv","OPTION_SUMMARY",source,"request").artifactId();
            assertThat(mvc.perform(get("/v2/artifacts/"+artifact+"/content").header("Authorization","Bearer wrong")).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get("/v2/artifacts/"+artifact+"/content").header("Authorization","Bearer both")).andReturn().getResponse().getContentAsByteArray()).containsExactly(source);
            byte[] csv=PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").getBytes(StandardCharsets.UTF_8);
            assertThat(artifacts.ingest(fA,"positions.csv","POSITIONS",csv,"request").status()).isEqualTo("ACCEPTED");
            var prior=positions.read(fA,"request",PositionsTest.NOW).orElseThrow().snapshotId();
            var rejected=artifacts.ingest(ttA,"positions.csv","POSITIONS",csv,"request");
            assertThat(rejected.status()).isEqualTo("REJECTED");
            assertThat(artifacts.content(ttA,rejected.artifactId()).orElseThrow()).containsExactly(csv);
            assertThat(artifacts.retry(ttA,rejected.artifactId(),null,null,"retry").status()).isEqualTo("REJECTED");
            assertThat(positions.read(ttA,"request",PositionsTest.NOW)).isEmpty();
            assertThat(positions.read(fA,"request",PositionsTest.NOW).orElseThrow().snapshotId()).isEqualTo(prior);
            for(String type:List.of("ACTIVITY","BALANCES","OPTION_SUMMARY"))
                assertThat(artifacts.ingest(ttA,"source.csv",type,source,"request").status()).isEqualTo("REJECTED");
        }
    }
}
