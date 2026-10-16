package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.util.*;
import java.time.Instant;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class StructuralLivePreviewTest {
    @TempDir Path temp;
    @Test void integratedFixtureUsesAcceptedServicesAndAuthorizedRetainedHttpOnly()throws Exception{
        var json=new ObjectMapper();try(var store=new SqliteEvidenceStore(temp.resolve("preview.sqlite").toString())){
            var accounts=new AccountDirectory(store,"");String fidelity=accounts.bind("demo-fidelity","FIDELITY","SYNTHETIC01"),tasty=accounts.bind("demo-tasty","TASTYTRADE","SYNTHETIC02");
            var positions=new PositionReadService(store,json);StructuralLivePreview.seed(store,accounts,positions);
            var auth=new BearerAuthenticator(new UserDirectory(store,accounts),"test-reader=read:account.read:"+fidelity+"|account.read:"+tasty+"|account.positions.read:"+fidelity+"|account.positions.read:"+tasty+",one=one:account.positions.read:"+fidelity);
            var mvc=MockMvcBuilders.standaloneSetup(new PositionsController(accounts,positions,auth,json),new AccountsController(accounts,auth,json)).build();
            var response=mvc.perform(get("/v2/positions").param("view","option-structure").header("Authorization","Bearer test-reader")).andReturn().getResponse();assertThat(response.getStatus()).isEqualTo(200);
            var data=json.readTree(response.getContentAsString());assertThat(data.path("accounts")).hasSize(2);int rows=0,condors=0;for(var a:data.path("accounts"))for(var p:a.path("structures")){rows++;if(p.path("strategy").path("value").path("kind").asText().equals("IRON_CONDOR"))condors++;}assertThat(rows).isEqualTo(7);assertThat(condors).isEqualTo(2);
            var denied=mvc.perform(get("/v2/positions").param("view","option-structure").param("accountId",tasty).header("Authorization","Bearer one")).andReturn().getResponse();assertThat(denied.getStatus()).isEqualTo(403);
            var scoped=mvc.perform(get("/v2/positions").param("view","option-structure").header("Authorization","Bearer one")).andReturn().getResponse();assertThat(json.readTree(scoped.getContentAsString()).path("accounts")).hasSize(1);
            Files.createDirectories(Path.of("build"));Files.writeString(Path.of("build/structural-live-preview.json"),response.getContentAsString());
            var metadata=mvc.perform(get("/v2/accounts").header("Authorization","Bearer test-reader")).andReturn().getResponse();Files.writeString(Path.of("build/structural-live-accounts.json"),metadata.getContentAsString());
        }
    }
}
