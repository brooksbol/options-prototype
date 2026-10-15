package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.file.Path;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class MarketEvidenceSubjectsTest {
    @TempDir Path temp;
    final ObjectMapper json=new ObjectMapper();
    static final String USER="usr_"+"a".repeat(32);
    static String request(){return UUID.randomUUID().toString();}
    void admit(PositionReadService positions,String account,String broker,String symbol,String date)throws Exception {
        String csv=PositionsTest.csv(broker+",Test,ETFs,"+symbol+",Shares,2,100,--,Cash\n"+broker+",Test,Options,-"+symbol+"261120P90,Put,-1,-5,--,Cash\n",date);
        positions.admit(FidelityPositions.parse(account,broker,"synthetic.csv",csv,"2026-10-15T18:00:00Z",List.of()));
    }
    @Test void latestHoldingsUnionMonitoringDeduplicatesAndExcludesClosedAndUnauthorized()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("subjects.db").toString())) {
            var accounts=new AccountDirectory(store,"");String a=accounts.bind("one","FIDELITY","SYNTH01"),b=accounts.bind("two","FIDELITY","SYNTH02");
            var positions=new PositionReadService(store,json);admit(positions,a,"SYNTH01","SPY","Oct-14-2026");admit(positions,b,"SYNTH02","HIDDEN","Oct-14-2026");
            store.initUniverse(List.of("EWZ","SPY","NOTMONITORED"));store.setMonitoredSymbols(List.of("EWZ","SPY"));
            var selector=new MarketEvidenceSubjects(store,accounts,positions,USER);var caller=new BearerAuthenticator.Principal(USER,Set.of("account.positions.read:"+a));
            var first=selector.select(caller,request());assertThat(first.complete()).isTrue();assertThat(first.subjects().stream().map(MarketEvidenceSubjects.Subject::symbol)).containsExactly("EWZ","SPY");
            assertThat(first.subjects().get(1).sources()).containsExactly("HOLDINGS","MONITORING");assertThat(json.writeValueAsString(first)).doesNotContain("HIDDEN",b);
            store.setMonitoredSymbols(List.of("EWZ"));admit(positions,a,"SYNTH01","QQQ","Oct-15-2026");
            var later=selector.select(caller,request());assertThat(later.subjects().stream().map(MarketEvidenceSubjects.Subject::symbol)).containsExactly("EWZ","QQQ");
            assertThat(later.coverage().getFirst().snapshotId()).isNotEqualTo(first.coverage().getFirst().snapshotId());
        }
    }
    @Test void unboundMonitoringAndMissingHoldingsAreIncompleteNotEmptyAndAdjustedRootIsUnresolved()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("coverage.db").toString())) {
            var accounts=new AccountDirectory(store,"");String a=accounts.bind("one","FIDELITY","SYNTH01");var positions=new PositionReadService(store,json);
            var caller=new BearerAuthenticator.Principal(USER,Set.of("account.positions.read:"+a));store.initUniverse(List.of("EWZ"));store.setMonitoredSymbols(List.of("EWZ"));
            var unbound=new MarketEvidenceSubjects(store,accounts,positions,"").select(caller,request());assertThat(unbound.complete()).isFalse();assertThat(unbound.subjects()).isEmpty();assertThat(unbound.coverage()).allSatisfy(c->assertThat(c.status()).isEqualTo("UNAVAILABLE"));
            admit(positions,a,"SYNTH01","ETHA1","Oct-15-2026");var selected=new MarketEvidenceSubjects(store,accounts,positions,USER).select(caller,request());
            assertThat(selected.complete()).isFalse();assertThat(selected.coverage().getFirst().qualifications()).anyMatch(s->s.contains("Underlying identity unresolved"));
            var hidden=new MarketEvidenceSubjects(store,accounts,positions,"usr_"+"b".repeat(32)).select(new BearerAuthenticator.Principal(USER,Set.of()),request());assertThat(hidden.complete()).isTrue();assertThat(hidden.subjects()).isEmpty();assertThat(hidden.coverage().getFirst().status()).isEqualTo("NOT_AUTHORIZED");
        }
    }
    @Test void emptyScopeIsNoOpAndControllerEnforcesUserAndQuoteScopeWithoutAcquisition()throws Exception {
        try(var store=new SqliteEvidenceStore(temp.resolve("auth.db").toString())) {
            var accounts=new AccountDirectory(store,"");var positions=new PositionReadService(store,json);var selector=new MarketEvidenceSubjects(store,accounts,positions,"");
            var auth=new BearerAuthenticator(new UserDirectory(store,accounts),"allowed=one:quote.acquire,denied=two:quote.read,admin=three:users.admin");
            var mvc=MockMvcBuilders.standaloneSetup(new MarketEvidenceSubjectsController(selector,auth,json)).build();String path="/v2/market-evidence-subjects";
            assertThat(mvc.perform(get(path)).andReturn().getResponse().getStatus()).isEqualTo(401);
            for(String token:List.of("denied","admin"))assertThat(mvc.perform(get(path).header("Authorization","Bearer "+token)).andReturn().getResponse().getStatus()).isEqualTo(403);
            assertThat(mvc.perform(get(path).queryParam("accountId","any").header("Authorization","Bearer allowed")).andReturn().getResponse().getStatus()).isEqualTo(422);
            var result=mvc.perform(get(path).header("Authorization","Bearer allowed")).andReturn().getResponse();assertThat(result.getStatus()).isEqualTo(200);assertThat(result.getHeader("Cache-Control")).isEqualTo("private, no-store");
            var d=json.readTree(result.getContentAsString());assertThat(d.path("complete").asBoolean()).isTrue();assertThat(d.path("subjects").size()).isZero();
        }
    }
}
