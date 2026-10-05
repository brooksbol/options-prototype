package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelwright.evidence.AcquisitionWorker;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.*;
import java.sql.SQLException;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/** LQ01-13,24-28: real SQLite + actual HTTP mapping, fail-fast upstream boundaries. */
@SpringBootTest(properties={"evidence.db.path=:memory:", "tradier.api-key=test-key",
    "wheelwright.v2.auth.tokens=read=reader:quote.read,acquire=acquirer:quote.acquire,force=forcer:quote.force"})
@AutoConfigureMockMvc
class HeldQuotesControllerTest {
    @Autowired MockMvc mvc;
    @Autowired SqliteEvidenceStore store;
    @MockitoBean DirectQuoteSource source;
    @MockitoBean AcquisitionWorker worker;
    @MockitoSpyBean TradierAdapter adapter;
    @Autowired ProviderAuthorityManager authority;
    final ObjectMapper mapper = new ObjectMapper();
    static final List<com.fasterxml.jackson.databind.JsonNode> SPECIMENS = new ArrayList<>();
    static final String ID = "ABCDEF00-1111-4111-8111-111111111111";

    @BeforeEach void reset() throws Exception {
        store.clearDirectQuotes();
        clearInvocations(source, worker, adapter);
        doThrow(new AssertionError("held read contacted provider")).when(adapter).getQuotes(anyList());
        doThrow(new AssertionError("held read contacted provider")).when(adapter).getQuotes(anyList(), any());
        doThrow(new AssertionError("held read acquired calendar")).when(adapter).getExpirations(anyString());
        doThrow(new AssertionError("held read acquired chain")).when(adapter).getOptionsChain(anyString(), anyString());
        doThrow(new AssertionError("held read contacted provider")).when(adapter).getIndexQuote(anyString());
        // A provider outage must be irrelevant: any attempted contact fails this test.
        doAnswer(invocation -> { throw new AssertionError("held read contacted quote source"); })
            .when(source).acquire(any(), any());
        doAnswer(invocation -> { throw new AssertionError("held read invoked worker"); })
            .when(worker).start(any());
    }
    @AfterEach void pure() { verifyNoInteractions(source, worker, adapter); }

    static SqliteEvidenceStore.DirectQuoteRow row(String symbol, String provider) {
        return new SqliteEvidenceStore.DirectQuoteRow(symbol, UUID.randomUUID().toString(), "ETF",
            "malformed omitted facts", provider, "SANDBOX", "omitted", "old", "CLOSED", null, null,
            "2001-01-01T00:00:00.123456789Z", "2001-01-01T00:00:01Z");
    }
    MvcResult read(String auth, String query) throws Exception {
        var req = get("/v2/quotes" + query).with(request -> {
            if (!query.isEmpty()) request.setQueryString(query.substring(1));
            return request;
        });
        if (auth != null) req.header("Authorization", auth);
        return mvc.perform(req).andReturn();
    }
    com.fasterxml.jackson.databind.JsonNode body(MvcResult r) throws Exception {
        var b = mapper.readTree(r.getResponse().getContentAsString());
        assertThat(r.getResponse().getHeader("X-Request-Id")).isEqualTo(b.path("requestId").asText());
        assertThat(r.getResponse().getHeader("Cache-Control")).isEqualTo("private, no-store");
        assertThat(r.getResponse().getHeader("ETag")).isNull();
        SPECIMENS.add(b);
        return b;
    }
    void problem(MvcResult r, int status, String code) throws Exception {
        assertThat(r.getResponse().getStatus()).isEqualTo(status);
        assertThat(r.getResponse().getContentType()).startsWith("application/problem+json");
        assertThat(body(r).path("code").asText()).isEqualTo(code);
        assertThat(body(r).has("items")).isFalse();
    }

    @Test void emptyAndUnenrolledOldForeignEnvironmentAndOmittedMalformedFacts() throws Exception {
        var empty = read("Bearer read", "");
        assertThat(empty.getResponse().getStatus()).isEqualTo(200);
        assertThat(body(empty).path("items").size()).isZero();
        store.setDirectQuote(row("SPY", "historical-provider"));
        var result = read("Bearer read", "");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        var item = body(result).path("items").get(0);
        assertThat(item.path("subject").path("symbol").asText()).isEqualTo("SPY");
        assertThat(item.path("provenance").path("receivedAt").asText()).isEqualTo("2001-01-01T00:00:00.123456789Z");
        assertThat(item.path("provenance").path("environment").asText()).isEqualTo("SANDBOX");
        assertThat(item.size()).isEqualTo(3);
        assertThat(item.path("provenance").size()).isEqualTo(4);
        specimens(empty, result);
    }

    @Test void legacyAndMembershipNotPromotedOrMutatedRetainedAndReplacementOrderedNoCap() throws Exception {
        store.setMonitoredSymbols(List.of("LEGACY"));
        store.addObservationDemand(List.of("LEGACY"));
        store.setChainForExpiration("LEGACY", "2026-10-09", "{}", "2000-01-01T00:00:00Z");
        store.setExpirations("LEGACY", "[]", "2000-01-01T00:00:00Z");
        var before = inventory();
        assertThat(body(read("Bearer read", "")).path("items").size()).isZero();
        assertThat(inventory()).isEqualTo(before);
        for (int i=35; i>=0; i--) store.setDirectQuote(row(String.format("S%02d", i), "old"));
        var prior = row("SPY", "prior"); store.setDirectQuote(prior);
        var first = body(read("Bearer read", "")).path("items");
        assertThat(first.size()).isEqualTo(37);
        assertThat(first.get(36).path("observationId").asText()).isEqualTo(prior.observationId());
        var successor = row("SPY", "successor"); store.setDirectQuote(successor);
        var r = mvc.perform(get("/v2/quotes").header("Authorization", "Bearer read")
            .header("If-None-Match", "anything")).andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        var items = body(r).path("items");
        assertThat(items.size()).isEqualTo(37);
        for (int i=0; i<36; i++) assertThat(items.get(i).path("subject").path("symbol").asText()).isEqualTo(String.format("S%02d",i));
        assertThat(items.get(36).path("observationId").asText()).isEqualTo(successor.observationId());
        assertThat(inventory()).isEqualTo(before);
    }

    // Compare every non-quote table, including worker bookkeeping and membership.
    Map<String,List<String>> inventory() throws Exception {
        var tables = new ArrayList<String>();
        try (var stmt=store.getConnection().createStatement(); var rs=stmt.executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name<>'direct_quote' ORDER BY name")) {
            while(rs.next()) tables.add(rs.getString(1));
        }
        var result = new TreeMap<String,List<String>>();
        for(var table:tables) try(var stmt=store.getConnection().createStatement(); var rs=stmt.executeQuery("SELECT * FROM \""+table+"\"")) {
            var rows=new ArrayList<String>();
            while(rs.next()) { var values=new ArrayList<String>(); for(int i=1;i<=rs.getMetaData().getColumnCount();i++) values.add(rs.getString(i)); rows.add(values.toString()); }
            Collections.sort(rows); result.put(table, rows);
        }
        return result;
    }

    @Test void failedAcquisitionRetainsPriorAndReadDoesNotReattempt() throws Exception {
        var prior = row("SPY", "prior"); store.setDirectQuote(prior);
        // Legitimate POST failure first, then reset spies at the causal GET boundary.
        var failed = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
            .post("/v2/quotes").header("Authorization", "Bearer acquire")
            .contentType("application/json").content("{\"subjects\":[{\"symbol\":\"SPY\"}]}"))
            .andReturn();
        assertThat(failed.getResponse().getStatus()).isEqualTo(200);
        assertThat(mapper.readTree(failed.getResponse().getContentAsString()).path("results").get(0).path("priorRetained").asBoolean()).isTrue();
        clearInvocations(source,worker,adapter);
        var held=body(read("Bearer read",""));
        assertThat(held.path("items").get(0).path("observationId").asText()).isEqualTo(prior.observationId());
    }

    @Test void suspendedProviderCannotAffectHeldRead() throws Exception {
        store.setDirectQuote(row("SPY", "prior"));
        authority.suspend();
        assertThat(read("Bearer read", "").getResponse().getStatus()).isEqualTo(200);
    }

    @Test void readGrantIndependentAuthBeforeValidation() throws Exception {
        assertThat(read("Bearer read", "").getResponse().getStatus()).isEqualTo(200);
        problem(read("Bearer acquire", "?bad=1"),403,"FORBIDDEN");
        problem(read("Bearer force", ""),403,"FORBIDDEN");
        var unauth=read(null,"?bad=1"); problem(unauth,401,"UNAUTHENTICATED");
        assertThat(unauth.getResponse().getHeader("WWW-Authenticate")).isEqualTo("Bearer");
        problem(read("Bearer invalid", ""),401,"UNAUTHENTICATED");
    }

    @Test void queriesBodyAndCorrelation() throws Exception {
        for(String query:List.of("?unknown=1", "?unknown=1&unknown=2", "?unknown", "?=", "?%78=1")) {
            var r=read("Bearer read",query); problem(r,422,"INVALID_REQUEST");
            assertThat(body(r).path("invalidParams").size()).isPositive();
        }
        var base=get("/v2/quotes").header("Authorization", "Bearer read");
        var echoed=mvc.perform(base.header("X-Request-Id"," "+ID+" ")).andReturn();
        assertThat(body(echoed).path("requestId").asText()).isEqualTo(ID);
        for(String[] ids:List.of(new String[]{"invalid"},new String[]{ID,ID})) {
            var r=mvc.perform(get("/v2/quotes").header("Authorization","Bearer read").header("X-Request-Id",(Object[])ids)).andReturn();
            problem(r,422,"INVALID_REQUEST");
            UUID.fromString(body(r).path("requestId").asText());
        }
        var blank=mvc.perform(get("/v2/quotes").header("Authorization","Bearer read").header("X-Request-Id"," ")).andReturn();
        assertThat(blank.getResponse().getStatus()).isEqualTo(200);
        problem(mvc.perform(get("/v2/quotes").header("Authorization","Bearer read").content(" ")).andReturn(),422,"INVALID_REQUEST");
    }

    @Test void malformedRequiredDataFailsWholeReadRatherThanPartial() throws Exception {
        store.setDirectQuote(row("AAA","good")); store.setDirectQuote(row("ZZZ","bad"));
        for(var pair:List.of(new String[]{"observation_id","bad"},new String[]{"security_type","OPTION"},
            new String[]{"provider",""},new String[]{"environment","UNKNOWN"},new String[]{"received_at","2001-02-30T00:00:00Z"},
            new String[]{"committed_at","not-a-clock"})) {
            store.setDirectQuote(row("ZZZ","bad"));
            try(var p=store.getConnection().prepareStatement("UPDATE direct_quote SET "+pair[0]+"=? WHERE symbol='ZZZ'")) {p.setString(1,pair[1]);p.executeUpdate();}
            problem(read("Bearer read",""),500,"INTERNAL_ERROR");
        }
        store.setDirectQuote(row("ZZZ","bad"));
        store.setDirectQuote(row("lowercase","source"));
        problem(read("Bearer read",""),500,"INTERNAL_ERROR");
    }

    @Test void unavailableAndEnumerationFailureAreNotEmpty() throws Exception {
        var failing=mock(SqliteEvidenceStore.class);
        when(failing.listHeldDirectQuotes()).thenThrow(new SQLException("private-storage-message"));
        var standalone=MockMvcBuilders.standaloneSetup(new HeldQuotesController(failing,new BearerAuthenticator("read=ro:quote.read"),mapper)).build();
        var r=standalone.perform(get("/v2/quotes").header("Authorization","Bearer read")).andReturn();
        problem(r,500,"INTERNAL_ERROR"); assertThat(r.getResponse().getContentAsString()).doesNotContain("private-storage-message");
        doReturn(new AbstractList<SqliteEvidenceStore.HeldDirectQuoteRow>() {
            public int size() { return 2; }
            public SqliteEvidenceStore.HeldDirectQuoteRow get(int index) {
                if(index>0) throw new IllegalStateException("failure after first item");
                return new SqliteEvidenceStore.HeldDirectQuoteRow(ID,"AAA","ETF","source","SANDBOX",
                    "2001-01-01T00:00:00Z","2001-01-01T00:00:01Z");
            }
        }).when(failing).listHeldDirectQuotes();
        problem(standalone.perform(get("/v2/quotes").header("Authorization","Bearer read")).andReturn(),500,"INTERNAL_ERROR");
        doThrow(new SqliteEvidenceStore.HeldReadUnavailableException(new SQLException())).when(failing).listHeldDirectQuotes();
        problem(standalone.perform(get("/v2/quotes").header("Authorization","Bearer read")).andReturn(),503,"CAPABILITY_UNAVAILABLE");
        var noAuth=MockMvcBuilders.standaloneSetup(new HeldQuotesController(failing,new BearerAuthenticator(""),mapper)).build();
        problem(noAuth.perform(get("/v2/quotes")).andReturn(),503,"CAPABILITY_UNAVAILABLE");
    }
    void specimens(MvcResult... results) throws Exception {
        for(var r:results) body(r);
    }
    @AfterAll static void writeSpecimens() throws Exception {
        Files.createDirectories(Path.of("build"));
        new ObjectMapper().writeValue(Path.of("build/held-quotes-oas-specimens.json").toFile(),SPECIMENS);
    }
}
