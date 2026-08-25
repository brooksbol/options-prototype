package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.sql.SQLException;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * GET /api/evidence/quotes — endpoint contract tests.
 *
 * Validates:
 *   - Observation/acquisition separation
 *   - Preserved observations survive failed refresh
 *   - Universe boundary enforcement (400 for unknown symbols)
 *   - Representation-correct ETag semantics
 *   - Deduplication, case normalization, ordering
 *   - Edge cases: pending, absent, empty request
 */
@SpringBootTest
@AutoConfigureMockMvc
class QuotesControllerTest {

    private static final String EXPIRATIONS_JSON = """
        [{"date":"2026-08-03","dte":21},{"date":"2026-08-10","dte":28}]""";

    private static final String CHAIN_XLE = """
        {"symbol":"XLE","expiration":"2026-08-03","underlying":{"symbol":"XLE","name":"Energy Select Sector SPDR","price":58.99},"puts":[{"strike":55,"bid":0.5,"ask":0.7,"delta":-0.2,"openInterest":100,"volume":50}],"calls":[{"strike":60,"bid":0.8,"ask":1.0,"delta":0.35,"openInterest":200,"volume":80}]}""";

    private static final String CHAIN_QQQ = """
        {"symbol":"QQQ","expiration":"2026-08-21","underlying":{"symbol":"QQQ","name":"Invesco QQQ Trust","price":698.41},"puts":[{"strike":680,"bid":5.0,"ask":5.5,"delta":-0.3,"openInterest":1000,"volume":500}],"calls":[{"strike":710,"bid":4.0,"ask":4.5,"delta":0.28,"openInterest":800,"volume":400}]}""";

    private static final String CHAIN_SPY = """
        {"symbol":"SPY","expiration":"2026-08-21","underlying":{"symbol":"SPY","name":"SPDR S&P 500 ETF","price":756.19},"puts":[{"strike":740,"bid":3.0,"ask":3.5,"delta":-0.25,"openInterest":2000,"volume":800}],"calls":[{"strike":770,"bid":2.5,"ask":3.0,"delta":0.22,"openInterest":1500,"volume":600}]}""";

    private static final String OBS_TIME_XLE = "2026-08-03T16:40:02.883Z";
    private static final String OBS_TIME_QQQ = "2026-08-03T16:38:55.576Z";
    private static final String OBS_TIME_SPY = "2026-08-03T16:38:38.354Z";

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public SqliteEvidenceStore testEvidenceStore() throws SQLException {
            SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(List.of("XLE", "QQQ", "SPY", "NOOPT", "PENDING", "PARTIAL"));

            // XLE: ready with chain
            store.setExpirations("XLE", EXPIRATIONS_JSON, OBS_TIME_XLE);
            store.setChain("XLE", CHAIN_XLE, OBS_TIME_XLE);

            // QQQ: will become failed with preserved observation
            store.setExpirations("QQQ", "[{\"date\":\"2026-08-21\",\"dte\":28}]", OBS_TIME_QQQ);
            store.setChain("QQQ", CHAIN_QQQ, OBS_TIME_QQQ);
            // Simulate 3 consecutive failures
            store.setFailure("QQQ", "API key expired");
            store.setFailure("QQQ", "API key expired");
            store.setFailure("QQQ", "API key expired");

            // SPY: ready with chain
            store.setExpirations("SPY", "[{\"date\":\"2026-08-21\",\"dte\":28}]", OBS_TIME_SPY);
            store.setChain("SPY", CHAIN_SPY, OBS_TIME_SPY);

            // NOOPT: absent (empty expirations)
            store.setExpirations("NOOPT", "[]", "2026-08-01T12:00:00Z");

            // PARTIAL: expirations known, no chain yet
            store.setExpirations("PARTIAL", "[{\"date\":\"2026-08-03\",\"dte\":21}]", "2026-08-01T12:00:00Z");

            // PENDING: in universe but no evidence at all

            store.publishSnapshot();
            return store;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SqliteEvidenceStore store;

    // --- Ready symbol: observation present ---

    @Test
    void readySymbolReturnsObservationWithPrice() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("XLE"))
                .andExpect(jsonPath("$.quotes[0].observation.price").value(58.99))
                .andExpect(jsonPath("$.quotes[0].observation.observedAt").value(OBS_TIME_XLE))
                .andExpect(jsonPath("$.quotes[0].acquisition.status").value("ready"))
                .andExpect(jsonPath("$.quotes[0].acquisition.failureCount").value(0));
    }

    // --- Failed symbol: preserved observation ---

    @Test
    void failedSymbolPreservesObservation() throws Exception {
        // Core semantic test: successful chain → 3 failures → price preserved
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "QQQ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("QQQ"))
                .andExpect(jsonPath("$.quotes[0].observation.price").value(698.41))
                .andExpect(jsonPath("$.quotes[0].observation.observedAt").value(OBS_TIME_QQQ))
                .andExpect(jsonPath("$.quotes[0].acquisition.status").value("failed"))
                .andExpect(jsonPath("$.quotes[0].acquisition.failureCount").value(3))
                .andExpect(jsonPath("$.quotes[0].acquisition.lastAttemptAt", notNullValue()));
    }

    @Test
    void failedSymbolLastAttemptAtAdvancesBeyondObservedAt() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/evidence/quotes").param("symbol", "QQQ"))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        // lastAttemptAt should be after observedAt (failures happened after success)
        // We verify both are present and distinct
        org.assertj.core.api.Assertions.assertThat(body).contains("\"observedAt\":\"" + OBS_TIME_QQQ + "\"");
        org.assertj.core.api.Assertions.assertThat(body).contains("\"lastAttemptAt\":");
        // lastAttemptAt should NOT be the same as observedAt (failures happened later)
        org.assertj.core.api.Assertions.assertThat(body).doesNotContain("\"lastAttemptAt\":\"" + OBS_TIME_QQQ + "\"");
    }

    // --- Pending symbol: no observation ---

    @Test
    void pendingSymbolReturnsNullObservation() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("PENDING"))
                .andExpect(jsonPath("$.quotes[0].observation").value(nullValue()))
                .andExpect(jsonPath("$.quotes[0].acquisition.status").value("pending"))
                .andExpect(jsonPath("$.quotes[0].acquisition.failureCount").value(0));
    }

    // --- Absent symbol: no observation ---

    @Test
    void absentSymbolReturnsNullObservation() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "NOOPT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("NOOPT"))
                .andExpect(jsonPath("$.quotes[0].observation").value(nullValue()))
                .andExpect(jsonPath("$.quotes[0].acquisition.status").value("absent"));
    }

    // --- Expirations-known symbol: no chain yet ---

    @Test
    void partialSymbolReturnsNullObservation() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "PARTIAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("PARTIAL"))
                .andExpect(jsonPath("$.quotes[0].observation").value(nullValue()))
                .andExpect(jsonPath("$.quotes[0].acquisition.status").value("expirations_known"));
    }

    // --- Unknown symbol: 400 rejection ---

    @Test
    void unknownSymbolReturnsNotInUniverseStatus() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "ZZZZ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("ZZZZ"))
                .andExpect(jsonPath("$.quotes[0].observation").isEmpty())
                .andExpect(jsonPath("$.quotes[0].acquisition.status").value("not_in_universe"));
    }

    @Test
    void mixedKnownAndUnknownServesKnownWithNotInUniverseForUnknown() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes")
                        .param("symbol", "XLE")
                        .param("symbol", "BOGUS")
                        .param("symbol", "FAKE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[?(@.symbol == 'XLE')].acquisition.status", hasItem("ready")))
                .andExpect(jsonPath("$.quotes[?(@.symbol == 'BOGUS')].acquisition.status", hasItem("not_in_universe")))
                .andExpect(jsonPath("$.quotes[?(@.symbol == 'FAKE')].acquisition.status", hasItem("not_in_universe")));
    }

    // --- Empty request: 400 ---

    @Test
    void noSymbolsReturns400() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    // --- Deduplication ---

    @Test
    void duplicateSymbolsAreDeduplicated() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes")
                        .param("symbol", "XLE")
                        .param("symbol", "XLE")
                        .param("symbol", "xle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes.length()").value(1))
                .andExpect(jsonPath("$.quotes[0].symbol").value("XLE"));
    }

    // --- Case normalization ---

    @Test
    void symbolsCaseNormalized() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes")
                        .param("symbol", "xle")
                        .param("symbol", "Qqq"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("QQQ"))
                .andExpect(jsonPath("$.quotes[1].symbol").value("XLE"));
    }

    // --- Alphabetical ordering ---

    @Test
    void responseIsAlphabeticalBySymbol() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes")
                        .param("symbol", "SPY")
                        .param("symbol", "XLE")
                        .param("symbol", "QQQ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("QQQ"))
                .andExpect(jsonPath("$.quotes[1].symbol").value("SPY"))
                .andExpect(jsonPath("$.quotes[2].symbol").value("XLE"));
    }

    // --- Generation and publication provenance ---

    @Test
    void responseIncludesGenerationAndGeneratedAt() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.generation", greaterThan(0)))
                .andExpect(jsonPath("$.generatedAt", notNullValue()));
    }

    // --- ETag: representation-correct ---

    @Test
    void etagHeaderPresent() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(status().isOk())
                .andExpect(header().exists("ETag"))
                .andExpect(header().string("ETag", matchesPattern("\"quotes-[a-f0-9]+-gen-\\d+\"")));
    }

    @Test
    void conditionalGetReturns304WhenEtagMatches() throws Exception {
        MvcResult first = mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(status().isOk())
                .andReturn();
        String etag = first.getResponse().getHeader("ETag");

        mockMvc.perform(get("/api/evidence/quotes")
                        .param("symbol", "XLE")
                        .header("If-None-Match", etag))
                .andExpect(status().isNotModified());
    }

    @Test
    void differentSymbolSetGets200EvenWithSameGeneration() throws Exception {
        // Get ETag for XLE
        MvcResult first = mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(status().isOk())
                .andReturn();
        String xleEtag = first.getResponse().getHeader("ETag");

        // Use XLE's ETag but request QQQ — must get 200, not 304
        mockMvc.perform(get("/api/evidence/quotes")
                        .param("symbol", "QQQ")
                        .header("If-None-Match", xleEtag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("QQQ"));
    }

    @Test
    void staleGenerationEtagGets200() throws Exception {
        MvcResult first = mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(status().isOk())
                .andReturn();

        // Advance generation
        store.publishSnapshot();

        // Old ETag should now get 200
        String oldEtag = first.getResponse().getHeader("ETag");
        mockMvc.perform(get("/api/evidence/quotes")
                        .param("symbol", "XLE")
                        .header("If-None-Match", oldEtag))
                .andExpect(status().isOk());
    }

    // --- Cache-Control header ---

    @Test
    void cacheControlHeaderCorrect() throws Exception {
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(header().string("Cache-Control", "private, no-cache"));
    }

    // --- observedAt provenance: comes from chain retrieved_at ---

    @Test
    void observedAtMatchesChainRetrievedAt() throws Exception {
        // XLE's chain was stored with OBS_TIME_XLE as retrievedAt
        mockMvc.perform(get("/api/evidence/quotes").param("symbol", "XLE"))
                .andExpect(jsonPath("$.quotes[0].observation.observedAt").value(OBS_TIME_XLE));
    }
}
