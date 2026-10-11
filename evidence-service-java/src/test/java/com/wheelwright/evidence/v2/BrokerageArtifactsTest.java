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
import static org.mockito.Mockito.*;

class BrokerageArtifactsTest {
    @TempDir Path temp;
    String pts,sawdust;
    BearerAuthenticator auth(String config) { return TestAuthentication.auth(config.replace(":pts",":"+pts).replace(":sawdust",":"+sawdust)); }
    SqliteEvidenceStore store; BrokerageArtifacts artifacts; PositionReadService positions;
    final ObjectMapper mapper = new ObjectMapper();
    @BeforeEach void open() throws Exception {
        store = new SqliteEvidenceStore(temp.resolve("evidence.sqlite3").toString());
        positions = new PositionReadService(store, mapper);
        artifacts = new BrokerageArtifacts(store.getConnection().getMetaData().getURL(), mapper, positions);
        pts=artifacts.bindAccount("pts", "A1"); sawdust=artifacts.bindAccount("sawdust", "B2");
    }
    @AfterEach void close() throws Exception { store.close(); }
    byte[] bytes(String s) { return s.getBytes(StandardCharsets.UTF_8); }
    @Test void exactBytesDuplicateIdentityNamesAndFailureRetention() throws Exception {
        var csv = bytes("\uFEFF" + PositionsTest.csv(PositionsTest.BODY, "Oct-05-2026").replace("\n", "\r\n"));
        var a = artifacts.ingest(pts, "download.csv", "POSITIONS", csv, "id");
        assertThat(a.status()).isEqualTo("ACCEPTED");
        assertThat(artifacts.content(pts, a.artifactId()).orElseThrow()).containsExactly(csv);
        var again = artifacts.ingest(pts, "renamed.csv", "POSITIONS", csv, "id");
        assertThat(again.artifactId()).isEqualTo(a.artifactId()); assertThat(again.newlyPersisted()).isFalse();
        assertThat(artifacts.metadata(pts, a.artifactId()).orElseThrow().imports()).extracting(BrokerageArtifacts.Attempt::originalFilename)
                .containsExactly("download.csv", "renamed.csv");
        var bad = artifacts.ingest(pts, "download.csv", "POSITIONS", bytes("broken\r\n"), "id");
        assertThat(bad.status()).isEqualTo("REJECTED"); assertThat(bad.artifactId()).isNotEqualTo(a.artifactId());
        assertThat(artifacts.content(pts, bad.artifactId()).orElseThrow()).containsExactly(bytes("broken\r\n"));
        assertThat(positions.read(pts, "id", PositionsTest.NOW).orElseThrow().artifactId()).isEqualTo(a.artifactId());
        var retry = artifacts.retry(pts, bad.artifactId(), null, null, "id");
        assertThat(retry.newlyPersisted()).isFalse(); assertThat(retry.status()).isEqualTo("REJECTED");
        assertThat(artifacts.inventory(pts, "id").artifacts()).hasSize(2);
        assertThat(artifacts.metadata(sawdust, a.artifactId())).isEmpty();
        assertThat(artifacts.content(sawdust, a.artifactId())).isEmpty();
    }
    @Test void overlappingHistoryExtendsObservationsAndRetainsEverySourceRow() throws Exception {
        String header = "Run Date,Action,Symbol,Amount ($)\n";
        String row = "10/01/2026,YOU BOUGHT,SPY,-100\n";
        var first = artifacts.ingest(pts, "History_for_Account_A1.csv", "ACTIVITY", bytes(header + row + row), "id");
        assertThat(first.status()).isEqualTo("ACCEPTED"); assertThat(first.result()).contains("added=2");
        var overlap = artifacts.ingest(pts, "History_for_Account_A1-2.csv", "ACTIVITY", bytes(header + row + row + "10/02/2026,DIVIDEND,SPY,5\n"), "id");
        assertThat(overlap.status()).isEqualTo("ACCEPTED"); assertThat(overlap.result()).contains("added=1", "matches=2", "coverage UNKNOWN");
        artifacts.ingest(pts, "History_for_Account_A1-3.csv", "ACTIVITY", bytes(header + "10-03-2026,YOU SOLD,SPY,100\n"), "id");
        try (var q = store.getConnection().createStatement(); var rs = q.executeQuery("SELECT COUNT(*) FROM brokerage_ledger_observation")) {
            assertThat(rs.getInt(1)).isEqualTo(4);
        }
        // A valid prefix followed by malformed date rolls back all newly parsed rows, not the original artifact.
        var malformed = artifacts.ingest(pts, "History_for_Account_A1-4.csv", "ACTIVITY", bytes(header + "10/04/2026,YOU SOLD,SPY,99\nnot-a-date,BAD,SPY,0\n"), "id");
        assertThat(malformed.status()).isEqualTo("REJECTED");
        try (var q = store.getConnection().createStatement(); var rs = q.executeQuery("SELECT COUNT(*) FROM brokerage_ledger_observation")) { assertThat(rs.getInt(1)).isEqualTo(4); }
        assertThat(artifacts.inventory(pts, "id").artifacts()).hasSize(4);
    }
    @Test void collectionAuthorizationPrecedesEvidenceStorage() throws Exception {
        var mock=mock(BrokerageArtifacts.class);
        var mvc=MockMvcBuilders.standaloneSetup(new ArtifactsController(mock,auth("read=reader:account.artifacts.read:pts,write=writer:account.artifacts.write:pts"),mapper)).build();
        assertThat(mvc.perform(get("/v2/artifacts?accountId="+sawdust).header("Authorization","Bearer read")).andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mvc.perform(post("/v2/artifacts?accountId="+sawdust).header("Authorization","Bearer write")).andReturn().getResponse().getStatus()).isEqualTo(403);
        for(String path:List.of("/v2/artifacts","/v2/artifacts/id","/v2/artifacts/id/content"))
            assertThat(mvc.perform(get(path)).andReturn().getResponse().getStatus()).isEqualTo(401);
        verifyNoInteractions(mock);
    }
    @Test void contentApiReturnsOriginalBytesAndWrongAccountCannotRetrieve() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new ArtifactsController(artifacts,
                auth("read=reader:account.artifacts.read:pts|account.artifacts.read:sawdust,write=writer:account.artifacts.write:pts,other=other:account.artifacts.read:sawdust"), mapper)).build();
        byte[] original = bytes("malformed\r\n");
        var response = mvc.perform(post("/v2/artifacts?accountId="+pts).header("Authorization", "Bearer write")
                .header("Content-Disposition", "attachment; filename*=UTF-8''source%20%281%29.csv").header("X-Brokerage-File-Type", "POSITIONS")
                .contentType("text/csv").content(original)).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        var json = mapper.readTree(response.getContentAsString()); assertThat(json.path("status").asText()).isEqualTo("REJECTED");
        String id = json.path("artifactId").asText();
        assertThat(artifacts.metadata(pts, id).orElseThrow().imports().getFirst().originalFilename()).isEqualTo("source (1).csv");
        var content = mvc.perform(get("/v2/artifacts/" + id + "/content").header("Authorization", "Bearer read")).andReturn().getResponse();
        assertThat(content.getContentAsByteArray()).containsExactly(original);
        assertThat(content.getHeader("Cache-Control")).isEqualTo("private, no-store");
        assertThat(mvc.perform(get("/v2/artifacts/" + id + "/content").header("Authorization", "Bearer other")).andReturn().getResponse().getStatus()).isEqualTo(403);
    }
    @Test void summarySuppliesSameDayQuoteFactsAndAdjustedRequirementWithoutCountingShares() throws Exception {
        String body = PositionsTest.BODY + "A1,Test PTS,ETFs,ETHA,Adjusted shares,66,3600,-5,Cash\n" +
                "A1,Test PTS,Options,-ETHA1261016C20.5,Adjusted call,-2,-16,120,Cash\n";
        artifacts.ingest(pts, "positions.csv", "POSITIONS", bytes(PositionsTest.csv(body, "Oct-05-2026")), "id");
        String summary = "Fidelity Investments - Option Summary A1\nQuote data as of 10/05/2026.\n" +
                "Symbol,Description,Strategy,Expiration & Strike,Quantity,Bid,Ask,Margin requirements\n" +
                "SPY,SPY,Covered Call,Shares,100,499.50,500.00,0\n" +
                "SPY,SPY,Other,Shares,100,499.50,500.00,0\n" +
                "ETHA1,ETHA,Covered Call,Shares (ETHA),66,56.27,56.33,0\n" +
                "ETHA1,Adjusted call,Covered Call,ETHA1 OCT 16 2026 $20.50 CALL (ADJ),-2,--,--,40.86\n";
        var source = artifacts.ingest(pts, "summary.csv", "OPTION_SUMMARY", bytes(summary), "id");
        assertThat(source.status()).isEqualTo("ACCEPTED");
        var read = positions.read(pts, "id", PositionsTest.NOW).orElseThrow();
        assertThat(read.positions()).hasSize(6);
        var shares = read.positions().getFirst().constituents().getFirst();
        assertThat(shares.holding().quantity()).isEqualByComparingTo("100");
        assertThat(shares.holding().bid()).isEqualByComparingTo("499.50");
        assertThat(shares.marketEvidence().sourceRows()).hasSize(2);
        var adjusted = read.positions().getLast();
        assertThat(adjusted.capitalRequirement()).isEqualByComparingTo("40.86");
        assertThat(adjusted.shareEquivalentDelta()).isNull();
        assertThat(adjusted.constituents().getFirst().marketEvidence().artifactId()).isEqualTo(source.artifactId());
        assertThat(adjusted.constituents().getFirst().holding().bid()).isNull();
        assertThat(adjusted.program()).isNull();
        var old = summary.replace("10/05/2026", "10/04/2026").replace("499.50", "1.00");
        artifacts.ingest(pts, "older-summary.csv", "OPTION_SUMMARY", bytes(old), "id");
        assertThat(positions.read(pts, "id", PositionsTest.NOW).orElseThrow().positions().getFirst().constituents().getFirst().holding().bid()).isEqualByComparingTo("499.50");
    }
    @Test void originalMultiAccountSourceCannotLeakThroughSingleAccountReadGrant() throws Exception {
        var a = artifacts.ingest(pts, "positions.csv", "POSITIONS", bytes(PositionsTest.csv(PositionsTest.BODY, "Oct-05-2026")), "id");
        var mvc = MockMvcBuilders.standaloneSetup(new ArtifactsController(artifacts,
                auth("pts=reader:account.artifacts.read:pts|account.artifacts.write:pts,both=both-reader:account.artifacts.read:pts|account.artifacts.read:sawdust"), mapper)).build();
        assertThat(mvc.perform(get("/v2/artifacts/"+a.artifactId()+"/content").header("Authorization","Bearer pts")).andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mvc.perform(get("/v2/artifacts/"+a.artifactId()+"/content").header("Authorization","Bearer both")).andReturn().getResponse().getStatus()).isEqualTo(200);
        assertThat(mvc.perform(post("/v2/artifacts?accountId="+pts).header("Authorization","Bearer pts").header("Content-Disposition","attachment; filename=positions.csv")
                .header("X-Brokerage-File-Type","POSITIONS").contentType("text/csv").content(bytes(PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026")))).andReturn().getResponse().getStatus()).isEqualTo(200);
        String quoted = PositionsTest.csv(PositionsTest.BODY,"Oct-05-2026").replace("Account number,", "\"Account number\",").replace("B2,", "\" B2 \",");
        var retained = artifacts.ingest(pts, "quoted.csv", "POSITIONS", bytes(quoted), "id");
        assertThat(retained.status()).isEqualTo("ACCEPTED");
        assertThat(mvc.perform(get("/v2/artifacts/"+retained.artifactId()+"/content").header("Authorization","Bearer pts")).andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mvc.perform(get("/v2/artifacts/"+retained.artifactId()+"/content").header("Authorization","Bearer both")).andReturn().getResponse().getStatus()).isEqualTo(200);
    }

    @Test void targetOnlyImportAndRetryRetainMixedOriginalWithoutGrantingOtherAccountAccess() throws Exception {
        byte[] original=bytes(PositionsTest.csv(PositionsTest.BODY+"C3,Unregistered,ETFs,SECRET,Other account,999,999,99,Cash\n","Oct-05-2026"));
        var mvc=MockMvcBuilders.standaloneSetup(new ArtifactsController(artifacts,
                auth("target=target:account.artifacts.write:pts|account.artifacts.read:pts,other=other:account.artifacts.write:sawdust,both=both:account.artifacts.read:pts|account.artifacts.read:sawdust"),mapper)).build();
        var response=mvc.perform(post("/v2/artifacts?accountId="+pts).header("Authorization","Bearer target")
                .header("Content-Disposition","attachment; filename=mixed.csv").header("X-Brokerage-File-Type","POSITIONS")
                .contentType("text/csv").content(original)).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        var result=mapper.readTree(response.getContentAsString());
        assertThat(result.path("status").asText()).isEqualTo("ACCEPTED");
        String id=result.path("artifactId").asText();
        assertThat(artifacts.content(pts,id).orElseThrow()).containsExactly(original);
        assertThat(positions.read(sawdust,"id",PositionsTest.NOW)).isEmpty();
        var target=positions.read(pts,"id",PositionsTest.NOW).orElseThrow();
        assertThat(mapper.writeValueAsString(target)).doesNotContain("SECRET","Unregistered","C3","Test Sawdust");
        assertThat(mvc.perform(post("/v2/artifacts/"+id+"/imports").header("Authorization","Bearer target")).andReturn().getResponse().getStatus()).isEqualTo(200);
        assertThat(mvc.perform(post("/v2/artifacts/"+id+"/imports").header("Authorization","Bearer other")).andReturn().getResponse().getStatus()).isEqualTo(403);
        for(String token:List.of("target","both"))
            assertThat(mvc.perform(get("/v2/artifacts/"+id+"/content").header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mvc.perform(post("/v2/artifacts?accountId="+sawdust).header("Authorization","Bearer target")
                .header("Content-Disposition","attachment; filename=mixed.csv").header("X-Brokerage-File-Type","POSITIONS")
                .contentType("text/csv").content(original)).andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(artifacts.inventory(sawdust,"id").artifacts()).isEmpty();
    }

    @Test void mixedSummaryWithoutRowLevelAccountAttributionIsRetainedButNotAdmitted() throws Exception {
        String summary="Fidelity Investments - Option Summary A1\nFidelity Investments - Option Summary B2\n"+
                "Symbol,Description,Strategy,Expiration & Strike,Quantity\nSECRET,Other,Other,Shares,999\n";
        var result=artifacts.ingest(pts,"mixed-summary.csv","OPTION_SUMMARY",bytes(summary),"id");
        assertThat(result.status()).isEqualTo("REJECTED");
        assertThat(artifacts.content(pts,result.artifactId()).orElseThrow()).containsExactly(bytes(summary));
        try(var q=store.getConnection().createStatement();var rows=q.executeQuery("SELECT COUNT(*) FROM brokerage_evidence_row")) {
            assertThat(rows.getInt(1)).isZero();
        }
    }
}
