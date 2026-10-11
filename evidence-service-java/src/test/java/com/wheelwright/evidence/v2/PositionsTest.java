package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class PositionsTest {
    @Test void downloadDateAcceptsBrokerFooterWithOrWithoutAt() {
        var original=csv(BODY,"Oct-05-2026");
        var expected=FidelityPositions.parse(ACCOUNT,"A1","positions.csv",original,NOW.toString(),List.of());
        var alternate=FidelityPositions.parse(ACCOUNT,"A1","positions.csv",original.replace(" at "," "),NOW.toString(),List.of());
        assertThat(alternate.evidenceDate()).isEqualTo(expected.evidenceDate());
        assertThat(alternate.holdings()).isEqualTo(expected.holdings());
    }
    static final String ACCOUNT="acct_11111111111111111111111111111111";
    static final String OTHER="acct_22222222222222222222222222222222";
    @TempDir Path temp;
    static final Instant NOW = Instant.parse("2026-10-11T12:00:00Z");
    static final String HEADER = "Account number,Account name,Investment type,Symbol,Description,Quantity,Current value,Total gain/loss dollar,Type\n";
    static String csv(String body, String day) { return HEADER + body + "\n\"Date downloaded " + day + " at 3:48 p.m ET\"\n"; }
    static final String BODY = "A1,Test PTS,ETFs,SPY,SPY shares,100,50000,20,Cash\n" +
            "A1,Test PTS,ETFs,SPY,SPY shares,50,25000,10,Margin\n" +
            "A1,Test PTS,Options,-SPY261016C550,SPY call,-1,-100,--,Cash\n" +
            "A1,Test PTS,Options,-SPY261016C560,SPY call,1,50,4,Cash\n" +
            "A1,Test PTS,Cash,SPAXX**,Cash,,4000,,Cash\n" +
            "B2,Sawdust,ETFs,QQQ,Other account,99,9999,999,Cash\n";
    PositionSnapshot snapshot() { return FidelityPositions.parse(ACCOUNT, "A1", "positions.csv", csv(BODY, "Oct-05-2026"), NOW.toString(), List.of()); }

    @Test void realParsingAndAccountIsolationAndIncompleteAggregation() {
        var s = snapshot();
        assertThat(s.holdings()).hasSize(4); assertThat(s.excludedNonPositionRows()).isEqualTo(1);
        assertThat(s.holdings()).noneMatch(h -> h.contract().equals("QQQ"));
        var r = PositionReadService.project(s, UUID.randomUUID().toString(), NOW);
        assertThat(r.positions()).hasSize(4);
        assertThat(r.positions().getFirst().shareEquivalentDelta()).isEqualByComparingTo("100");
        var option = r.positions().get(2);
        assertThat(option.openPl()).isNull(); assertThat(option.constituents().getFirst().dte()).isEqualTo(5);
        assertThat(option.constituents().getFirst().state()).contains("obligation");
        assertThat(r.workingOrderCoverage()).isEqualTo("UNKNOWN");
    }
    @Test void multiLegAssociationNeverDuplicatesInventoryOrInfersProgram() {
        var s = snapshot();
        var association = new PositionSnapshot.Association("position-aaaaaaaaaaaaaaaaaaaaaaaa", "Explicit call spread",
                s.holdings().subList(2, 4).stream().map(PositionSnapshot.Constituent::holdingId).toList(), null, "operator specimen");
        var grouped = FidelityPositions.parse(ACCOUNT, "A1", "positions.csv", csv(BODY, "Oct-05-2026"), NOW.toString(), List.of(association));
        var r = PositionReadService.project(grouped, "id", NOW);
        assertThat(r.positions()).hasSize(3);
        assertThat(r.positions().getFirst().constituents()).hasSize(2);
        assertThat(r.positions().getFirst().marketValue()).isEqualByComparingTo("-50");
        assertThat(r.positions().getFirst().openPl()).isNull();
        assertThat(r.positions().getFirst().program()).isNull();
        assertThat(r.positions().stream().flatMap(p -> p.constituents().stream()).map(l -> l.holding().holdingId())).doesNotHaveDuplicates().hasSize(4);
        assertThatThrownBy(() -> FidelityPositions.parse(ACCOUNT, "A1", "p.csv", csv(BODY, "Oct-05-2026"), NOW.toString(), List.of(association, association)))
                .isInstanceOf(IllegalArgumentException.class);
        var other = new PositionSnapshot.Association("position-bbbbbbbbbbbbbbbbbbbbbbbb", "Other", association.holdingIds(), "Wheel", "operator");
        assertThatThrownBy(() -> FidelityPositions.parse(ACCOUNT, "A1", "p.csv", csv(BODY, "Oct-05-2026"), NOW.toString(), List.of(association, other)))
                .hasMessageContaining("multiply allocated");
    }
    @Test void additiveRowsAndGapsAndPastExpiryAndMalformedEvidence() {
        var text = csv(BODY + "A1,Test PTS,ETFs,SPY,SPY shares,20,10000,--,Cash\n", "Oct-05-2026");
        var s = FidelityPositions.parse(ACCOUNT, "A1", "p.csv", text, NOW.toString(), List.of());
        assertThat(s.holdings().getFirst().quantity()).isEqualByComparingTo("120");
        assertThat(s.holdings().getFirst().openPl()).isNull();
        var r = PositionReadService.project(s, "id", Instant.parse("2026-10-17T12:00:00Z"));
        assertThat(r.positions().get(2).constituents().getFirst().state()).contains("resolution unknown");
        assertThatThrownBy(() -> FidelityPositions.parse(ACCOUNT, "WRONG", "p.csv", text, NOW.toString(), List.of())).hasMessageContaining("requested broker account");
        assertThatThrownBy(() -> FidelityPositions.parse(ACCOUNT, "A1", "p.csv", HEADER + "A1,broken\n", NOW.toString(), List.of())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> FidelityPositions.csv("\"unterminated")).isInstanceOf(IllegalArgumentException.class);
        assertThat(FidelityPositions.csv("a,\"b,c\",\"line\nnext\"\r\n").getFirst()).containsExactly("a", "b,c", "line\nnext");
    }
    @Test void retainedSnapshotsSurviveRestartIdempotentOlderUploadCannotReplaceAndNoLedgerMutation() throws Exception {
        var path = temp.resolve("evidence.sqlite3").toString(); var mapper = new ObjectMapper();
        try (var store = new SqliteEvidenceStore(path)) {
            var service = new PositionReadService(store, mapper);
            assertThat(service.admit(snapshot())).isTrue(); assertThat(service.admit(snapshot())).isFalse();
            var older = FidelityPositions.parse(ACCOUNT, "A1", "older.csv", csv(BODY, "Sep-28-2026"), NOW.plusSeconds(1).toString(), List.of());
            assertThat(service.admit(older)).isTrue();
            assertThat(service.read(ACCOUNT, "id", NOW).orElseThrow().snapshotId()).isEqualTo(snapshot().snapshotId());
            assertThat(service.read(OTHER, "id", NOW)).isEmpty();
            try (var q = store.getConnection().createStatement(); var rs = q.executeQuery("SELECT COUNT(*) FROM account_position_snapshot")) { assertThat(rs.getInt(1)).isEqualTo(2); }
            var rebound = FidelityPositions.parse(ACCOUNT, "B2", "other.csv", csv(BODY, "Oct-05-2026"), NOW.toString(), List.of());
            assertThatThrownBy(() -> service.admit(rebound)).hasMessageContaining("already bound");
        }
        try (var store = new SqliteEvidenceStore(path)) {
            assertThat(new PositionReadService(store, mapper).read(ACCOUNT, "id", NOW).orElseThrow().positions()).hasSize(4);
        }
    }
    @Test void httpBoundaryAuthenticatesThenAuthorizesExactAccountBeforeStorage() throws Exception {
        var mapper = new ObjectMapper();
        var service = org.mockito.Mockito.mock(PositionReadService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new PositionsController(org.mockito.Mockito.mock(AccountDirectory.class), service,
                TestAuthentication.auth("pts-token=reader:account.positions.read:acct_11111111111111111111111111111111,quote-token=quote-reader:quote.read"), mapper)).build();
        for (String token : List.of("pts-token", "quote-token")) {
            var r = mvc.perform(get("/v2/positions?accountId=acct_22222222222222222222222222222222").header("Authorization", "Bearer " + token)).andReturn().getResponse();
            assertThat(r.getStatus()).isEqualTo(403);
        }
        assertThat(mvc.perform(get("/v2/positions?accountId=acct_11111111111111111111111111111111")).andReturn().getResponse().getStatus()).isEqualTo(401);
        org.mockito.Mockito.verifyNoInteractions(service);
        assertThat(mvc.perform(get("/v2/positions?accountId=acct_11111111111111111111111111111111&refresh=true").header("Authorization", "Bearer pts-token")).andReturn().getResponse().getStatus()).isEqualTo(422);
        assertThat(mvc.perform(get("/v2/positions?accountId=acct_11111111111111111111111111111111").header("Authorization", "Bearer pts-token").content("{}")).andReturn().getResponse().getStatus()).isEqualTo(422);
        org.mockito.Mockito.verifyNoInteractions(service);
        org.mockito.Mockito.when(service.read(org.mockito.ArgumentMatchers.eq(ACCOUNT), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());
        var r = mvc.perform(get("/v2/positions?accountId=acct_11111111111111111111111111111111").header("Authorization", "Bearer pts-token")).andReturn().getResponse();
        assertThat(r.getStatus()).isEqualTo(404); assertThat(r.getHeader("Cache-Control")).isEqualTo("private, no-store");
        assertThat(mapper.readTree(r.getContentAsString()).path("requestId").asText()).isEqualTo(r.getHeader("X-Request-Id"));
    }
    @Test void realHttpReadReturnsCommittedBackendEvidence() throws Exception {
        try (var store = new SqliteEvidenceStore(temp.resolve("live.sqlite3").toString())) {
            var mapper = new ObjectMapper(); var service = new PositionReadService(store, mapper); service.admit(snapshot());
            var mvc = MockMvcBuilders.standaloneSetup(new PositionsController(org.mockito.Mockito.mock(AccountDirectory.class), service,
                    TestAuthentication.auth("read=reader:account.positions.read:acct_11111111111111111111111111111111"), mapper)).build();
            var r = mvc.perform(get("/v2/positions?accountId=acct_11111111111111111111111111111111").header("Authorization", "Bearer read")).andReturn().getResponse();
            assertThat(r.getStatus()).isEqualTo(200);
            var json = mapper.readTree(r.getContentAsString()).path("snapshots").get(0);
            assertThat(json.path("positions").size()).isEqualTo(4);
            assertThat(json.path("sourceSha256").asText()).isEqualTo(snapshot().sourceSha256());
            assertThat(json.has("rawCsv")).isFalse(); assertThat(json.has("brokerAccount")).isFalse();
            java.nio.file.Files.writeString(Path.of("build/position-read-specimen.json"), json.toString());
        }
    }
}
