package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** BUG-036: original-byte authority is independent of retention and processing success. */
class OriginalSourceAuthorizationTest {
    SqliteEvidenceStore store;
    BrokerageArtifacts artifacts;
    PositionReadService positions;
    String a,b;
    MockMvc mvc;
    final ObjectMapper mapper=new ObjectMapper();
    @BeforeEach void open() throws Exception {
        store=new SqliteEvidenceStore(":memory:");
        String url=store.getConnection().getMetaData().getURL();
        var accounts=new AccountDirectory(url);a=accounts.bind("a","A1");b=accounts.bind("b","B2");
        positions=new PositionReadService(store,mapper);artifacts=new BrokerageArtifacts(url,mapper,positions);
        var auth=new BearerAuthenticator(new UserDirectory(url),
                "writer=writer:account.artifacts.write:"+a+",reader=reader:account.artifacts.read:"+a
                +",both=both:account.artifacts.read:"+a+"|account.artifacts.read:"+b
                +",admin=admin:users.admin|account.artifacts.read:"+a+"|account.artifacts.read:"+b);
        mvc=MockMvcBuilders.standaloneSetup(new ArtifactsController(artifacts,auth,mapper)).build();
    }
    @AfterEach void close() throws Exception {store.close();}
    byte[] bytes(String value) {return value.getBytes(StandardCharsets.UTF_8);}
    String upload(byte[] original,String filename,String type) throws Exception {
        var response=mvc.perform(post("/v2/artifacts?accountId="+a).header("Authorization","Bearer writer")
                .header("Content-Disposition","attachment; filename="+filename).header("X-Brokerage-File-Type",type)
                .contentType("text/csv").content(original)).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        return mapper.readTree(response.getContentAsString()).path("artifactId").asText();
    }
    void denied(String id,String token) throws Exception {
        var response=mvc.perform(get("/v2/artifacts/"+id+"/content").header("Authorization","Bearer "+token)).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).startsWith("application/problem+json");
        assertThat(response.getContentAsString()).doesNotContain("PRIVATE-B","B2","Unregistered");
        assertThat(response.getHeader("Cache-Control")).isEqualTo("private, no-store");
    }
    void retrieved(String id,String token,byte[] original) throws Exception {
        var response=mvc.perform(get("/v2/artifacts/"+id+"/content").header("Authorization","Bearer "+token)).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getContentAsByteArray()).containsExactly(original);
    }
    @Test void unknownScopeFailsClosedDespiteRetentionRetryFilenameAndAdministrator() throws Exception {
        String[] unknown={
                " Account number,Account name\nA1,Visible\nB2,PRIVATE-B\n",
                "unrecognized\nB2,PRIVATE-B\n",
                PositionsTest.csv("A1,Visible,ETFs,SPY,shares,1,100,0,Cash\n,PRIVATE-B,ETFs,QQQ,shares,1,100,0,Cash\n","Oct-05-2026"),
                PositionsTest.csv("A1,Visible,ETFs,SPY,shares,1,100,0,Cash\nB2,PRIVATE-B\n","Oct-05-2026"),
                PositionsTest.csv("A1,Visible,ETFs,SPY,shares,1,100,0,Cash\nC3,Unregistered,ETFs,QQQ,shares,1,100,0,Cash\n","Oct-05-2026"),
                PositionsTest.csv("A1,Visible,ETFs,SPY,shares,1,100,0,Cash\n","Oct-05-2026")+"B2,PRIVATE-B,ETFs,QQQ,shares,1,100,0,Cash\n",
                PositionsTest.HEADER+"A1,Visible,ETFs,SPY,shares,1,100,0,Cash\nB2,\"PRIVATE-B",
                "Account number,Account name,Run Date,Action,Symbol,Amount ($)\nB2,PRIVATE-B,10/05/2026,BUY,QQQ,1\n"
        };
        for(String source:unknown) {
            byte[] original=bytes(source);
            String id=upload(original,"History_for_Account_A1.csv","POSITIONS");
            assertThat(artifacts.content(a,id).orElseThrow()).containsExactly(original);
            for(String token:List.of("reader","both","admin"))denied(id,token);
            artifacts.ingest(a,"Balances_for_Account_A1.csv","BALANCES",original,"repeat");
            artifacts.retry(a,id,null,null,"retry");
            assertThat(artifacts.content(a,id).orElseThrow()).containsExactly(original);
            denied(id,"both");
        }
        byte[] valid=bytes(PositionsTest.csv("A1,Visible,ETFs,SPY,shares,1,100,0,Cash\n","Oct-05-2026"));
        byte[] invalid=Arrays.copyOf(valid,valid.length+1);invalid[invalid.length-1]=(byte)0xff;
        String id=upload(invalid,"positions.csv","POSITIONS");
        assertThat(artifacts.metadata(a,id).orElseThrow().imports().getFirst().status()).isEqualTo("REJECTED");
        assertThat(artifacts.content(a,id).orElseThrow()).containsExactly(invalid);denied(id,"both");
    }
    @Test void mixedScopeUsesCsvFieldsAndDoesNotRequireFinancialAdmission() throws Exception {
        String body="A1,Visible,ETFs,SPY,shares,1,100,0,Cash\nB2,PRIVATE-B,ETFs,QQQ,shares,1,100,0,Cash\n";
        for(String source:List.of(PositionsTest.csv(body,"Oct-05-2026"),
                "\uFEFF"+PositionsTest.csv(body,"Oct-05-2026").replace("\n","\r\n"),
                PositionsTest.csv(body,"Oct-05-2026").replace("Account number,","\"Account number\",").replace("B2,","\" B2 \","),
                " "+PositionsTest.csv(body,"Oct-05-2026"),PositionsTest.csv(body,"not-a-date"))) {
            byte[] original=bytes(source);String id=upload(original,"positions.csv","POSITIONS");
            var scope=artifacts.sourceScopes(a,"positions.csv",original);
            assertThat(scope.established()).isTrue();assertThat(scope.accountIds()).containsExactlyInAnyOrder(a,b);
            denied(id,"reader");retrieved(id,"both",original);
        }
        byte[] single=bytes(PositionsTest.csv("A1,Visible,ETFs,SPY,\"shares, note\nB2,not an account row\",1,100,0,Cash\n","Oct-05-2026"));
        String id=upload(single,"positions.csv","POSITIONS");
        assertThat(artifacts.sourceScopes(a,"positions.csv",single).accountIds()).containsExactly(a);
        retrieved(id,"reader",single);
    }
    @Test void filenameAttributedFormatsNeedContentEnvelopeAndPreserveRejectedRetrieval() throws Exception {
        String[][] sources={
                {"History_for_Account_A1.csv","ACTIVITY","Run Date,Action,Symbol,Amount ($)\nnot-a-date,BUY,SPY,not-an-amount\n"},
                {"Balances_for_Account_A1.csv","BALANCES","Balance,Day change\nCash,not-an-amount\n"},
                {"summary.csv","OPTION_SUMMARY","Fidelity Investments - Option Summary A1\nQuote data as of unknown\nSymbol,Description,Strategy,Expiration & Strike,Quantity\nSPY,SPY,Other,Shares,not-a-quantity\n"}
        };
        for(String[] source:sources) {
            byte[] original=bytes(source[2]);String id=upload(original,source[0],source[1]);
            assertThat(artifacts.sourceScopes(a,source[0],original).established()).isTrue();
            retrieved(id,"reader",original);
        }
        String mixed="Fidelity Investments - Option Summary A1\nFidelity Investments - Option Summary B2\nSymbol,Strategy,Expiration & Strike,Quantity\nQQQ,Other,Shares,1\n";
        String id=upload(bytes(mixed),"summary.csv","OPTION_SUMMARY");
        assertThat(artifacts.metadata(a,id).orElseThrow().imports().getFirst().status()).isEqualTo("REJECTED");
        denied(id,"reader");retrieved(id,"both",bytes(mixed));
    }
    @Test void accountSectionsCannotBecomeOrdinaryRowsThroughPaddingOrColumnPlacement() throws Exception {
        for(String section:List.of("Fidelity Investments - Option Summary B2,,,",
                "\"Fidelity Investments - Option Summary B2\",,,",
                ",Fidelity Investments - Option Summary B2,,",
                " ,\"Fidelity Investments - Option Summary B2\", , ")) {
            byte[] original=bytes("Fidelity Investments - Option Summary A1\n"
                    +"Symbol,Strategy,Expiration & Strike,Quantity\nSPY,Other,Shares,1\n"
                    +section+"\nQQQ,PRIVATE-B,Shares,25\n");
            String id=upload(original,"summary.csv","OPTION_SUMMARY");
            var scope=artifacts.sourceScopes(a,"summary.csv",original);
            assertThat(scope.established()).isTrue();
            assertThat(scope.accountIds()).containsExactlyInAnyOrder(a,b);
            assertThat(artifacts.metadata(a,id).orElseThrow().imports().getFirst().status()).isEqualTo("REJECTED");
            denied(id,"reader");retrieved(id,"both",original);
            artifacts.retry(a,id,null,null,"retry");denied(id,"reader");
        }
    }
    @Test void ambiguousSectionMarkersCannotHideInDataQuoteMetadataOrFooters() throws Exception {
        String prefix="Fidelity Investments - Option Summary A1\nSymbol,Strategy,Expiration & Strike,Quantity\nSPY,Other,Shares,1\n";
        for(String row:List.of("Fidelity Investments - Option Summary B2,PRIVATE-B,Shares,25",
                "QQQ,Fidelity Investments - Option Summary B2,Shares,25",
                "Fidelity Investments - Option Summary B2 unknown,,,",
                "Fidelity Investments - Option Summary ,,,",
                "Quote data as of Fidelity Investments - Option Summary B2",
                "Date downloaded Fidelity Investments - Option Summary B2")) {
            byte[] original=bytes(prefix+row+"\n");
            String id=upload(original,"summary.csv","OPTION_SUMMARY");
            assertThat(artifacts.sourceScopes(a,"summary.csv",original).established()).isFalse();
            for(String token:List.of("reader","both","admin"))denied(id,token);
            assertThat(artifacts.content(a,id).orElseThrow()).containsExactly(original);
        }
        byte[] trailing=bytes(prefix+"Date downloaded Oct-05-2026\nFidelity Investments - Option Summary B2,,,\n");
        String id=upload(trailing,"summary.csv","OPTION_SUMMARY");
        denied(id,"reader");denied(id,"both");
    }
}
