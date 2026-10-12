package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class TastytradeDisclosureTest {
    @TempDir Path temp;
    final ObjectMapper json=new ObjectMapper();
    byte[] fixture()throws Exception{return Files.readAllBytes(Path.of("src/test/resources/tastytrade/xle-api.json"));}
    ObjectNode tree()throws Exception{return (ObjectNode)json.readTree(fixture());}
    @Test void supportedWholeEnvelopeAndEmptyInventoryRemainDisclosable()throws Exception {
        var root=tree();
        root.put("context","/accounts/TTTEST01/positions");
        var page=root.putObject("pagination");
        for(String key:List.of("per-page","page-offset","item-offset","total-items","total-pages","current-item-count"))page.put(key,0);
        ((ObjectNode)root.path("data").path("items").get(0)).put("average-open-price","0.18").put("is-frozen",false);
        assertThat(TastytradeHoldings.sourceAccount(json.writeValueAsBytes(root),"TTTEST01")).isTrue();
        assertThat(TastytradeHoldings.sourceAccount("{\"data\":{\"items\":[]}}".getBytes(StandardCharsets.UTF_8),"TTTEST01")).isTrue();
        for(String malformed:List.of("{\"data\":{\"items\":[{}]}}", "{\"data\":{\"items\":[{\"account-number\":\"TTTEST01\"}]}}"))
            assertThat(TastytradeHoldings.sourceAccount(malformed.getBytes(StandardCharsets.UTF_8),"TTTEST01")).isFalse();
        // Even structurally recognized bytes need durable backend acquisition provenance.
        try(var store=new SqliteEvidenceStore(temp.resolve("unretained.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");
            var artifacts=new BrokerageArtifacts(store,json,new PositionReadService(store,json),accounts);
            assertThat(artifacts.sourceScopes(id,"tastytrade-positions.json",fixture()).established()).isFalse();
        }
    }
    @Test void completeDocumentUnknownsDenyOriginalDisclosureWithoutDiscardingHoldings()throws Exception {
        var cases=new LinkedHashMap<String,byte[]>();
        var root=tree();((ObjectNode)root.path("data")).putObject("related-account").put("account-number","FOREIGN9").put("balance","FOREIGN_PRIVATE_MARKER");
        cases.put("data sibling",json.writeValueAsBytes(root));
        root=tree();root.put("owner-note","FOREIGN_PRIVATE_MARKER");cases.put("top level scalar",json.writeValueAsBytes(root));
        root=tree();root.putArray("other-accounts").addObject().put("account-number","FOREIGN9");cases.put("alternate array",json.writeValueAsBytes(root));
        root=tree();((ObjectNode)root.path("data").path("items").get(0)).putObject("close-price").put("account-number","FOREIGN9");cases.put("nested known field",json.writeValueAsBytes(root));
        root=tree();((ObjectNode)root.path("data").path("items").get(0)).putArray("related").addObject().put("account-number","FOREIGN9");cases.put("nested item array",json.writeValueAsBytes(root));
        root=tree();((ObjectNode)root.path("data").path("items").get(0)).put("close-price","{\"account-number\":\"FOREIGN9\"}");cases.put("encoded content in numeric field",json.writeValueAsBytes(root));
        root=tree();((ObjectNode)root.path("data").path("items").get(0)).put("is-frozen","FOREIGN_PRIVATE_MARKER");cases.put("unrecognized boolean value",json.writeValueAsBytes(root));
        root=tree();root.put("context","/accounts/FOREIGN9/positions");cases.put("foreign context",json.writeValueAsBytes(root));
        root=tree();root.putObject("pagination").put("total-pages",1).put("page-offset",0).putObject("other").put("account-number","FOREIGN9");cases.put("pagination extension",json.writeValueAsBytes(root));
        root=tree();((ObjectNode)root.path("data")).putObject("related-account").put("account-number","FOREIGN9");
        ((ObjectNode)root.path("data").path("items").get(0)).put("quantity","1.5");cases.put("rejected retained",json.writeValueAsBytes(root));
        cases.put("duplicate keys","{\"data\":{\"items\":[]},\"data\":{\"items\":[]}}".getBytes(StandardCharsets.UTF_8));
        cases.put("malformed","{\"data\":".getBytes(StandardCharsets.UTF_8));
        try(var store=new SqliteEvidenceStore(temp.resolve("disclosure.db").toString())) {
            var accounts=new AccountDirectory(store,"");var id=accounts.bind("tt1","TASTYTRADE","TTTEST01");var foreign=accounts.bind("other","TASTYTRADE","FOREIGN9");
            var users=new UserDirectory(store,accounts);
            var auth=new BearerAuthenticator(users,"owner=owner:account.artifacts.read:"+id+",all=all:account.artifacts.read:"+id+"|account.artifacts.read:"+foreign);
            var positions=new PositionReadService(store,json);var client=mock(TastytradeClient.class);
            var service=new PositionAcquisition(store,accounts,positions,client);
            var artifacts=new BrokerageArtifacts(store,json,positions,accounts);
            var mvc=MockMvcBuilders.standaloneSetup(new ArtifactsController(artifacts,auth,json)).build();
            when(client.holdings("TTTEST01")).thenReturn(fixture());
            var good=service.acquire(id,"valid");assertThat(good.status()).isEqualTo("ACCEPTED");
            var valid=mvc.perform(get("/v2/artifacts/"+good.artifactId()+"/content").header("Authorization","Bearer owner")).andReturn().getResponse();
            assertThat(valid.getStatus()).isEqualTo(200);assertThat(valid.getContentAsByteArray()).isEqualTo(fixture());
            for(var sample:cases.entrySet()) {
                when(client.holdings("TTTEST01")).thenReturn(sample.getValue());
                var result=service.acquire(id,sample.getKey());
                assertThat(result.artifactId()).as(sample.getKey()).isNotNull();
                boolean rejected=Set.of("rejected retained","duplicate keys","malformed").contains(sample.getKey());
                assertThat(result.status()).as(sample.getKey()).isEqualTo(rejected?"REJECTED":"ACCEPTED");
                assertThat(artifacts.content(id,result.artifactId()).orElseThrow()).isEqualTo(sample.getValue());
                assertThat(artifacts.sourceScopes(id,"tastytrade-positions.json",sample.getValue()).established()).as(sample.getKey()).isFalse();
                for(String token:List.of("owner","all")) {
                    var response=mvc.perform(get("/v2/artifacts/"+result.artifactId()+"/content").header("Authorization","Bearer "+token)).andReturn().getResponse();
                    assertThat(response.getStatus()).as(sample.getKey()+" "+token).isEqualTo(403);
                    assertThat(response.getContentAsString()).doesNotContain("FOREIGN_PRIVATE_MARKER","FOREIGN9");
                }
            }
        }
    }
}
