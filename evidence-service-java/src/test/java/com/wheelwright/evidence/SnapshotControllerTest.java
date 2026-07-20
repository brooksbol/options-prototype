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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Snapshot endpoint contract tests.
 *
 * Verifies behavioral parity with TypeScript snapshot route:
 *   - Exact v1 contract fields and structure
 *   - ETag generation and conditional HTTP
 *   - 200 OK and 304 Not Modified
 *   - Correct handling of all evidence states
 *   - Response headers
 */
@SpringBootTest
@AutoConfigureMockMvc
class SnapshotControllerTest {

    private static final String EXPIRATIONS_JSON = """
        [{"date":"2026-08-03","dte":21},{"date":"2026-08-10","dte":28}]""";

    private static final String CHAIN_JSON = """
        {"symbol":"XLE","expiration":"2026-08-03","underlying":{"symbol":"XLE","name":"Energy Select Sector","price":92.5},"puts":[{"strike":88,"bid":1.5,"ask":1.7,"delta":-0.28,"openInterest":520,"volume":110}],"calls":[{"strike":95,"bid":1.2,"ask":1.4,"delta":0.32,"openInterest":300,"volume":80}]}""";

    private static final String NOW = "2026-07-16T14:30:00Z";

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public SqliteEvidenceStore testEvidenceStore() throws SQLException {
            SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:");
            store.initUniverse(java.util.List.of("XLE", "NOOPT", "PENDING", "PARTIAL"));
            store.setExpirations("XLE", EXPIRATIONS_JSON, NOW);
            store.setChain("XLE", CHAIN_JSON, NOW);
            store.setExpirations("NOOPT", "[]", NOW);
            store.setExpirations("PARTIAL", "[{\"date\":\"2026-08-03\",\"dte\":21}]", NOW);
            // PENDING: no evidence
            store.publishSnapshot();
            return store;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SqliteEvidenceStore store;

    // --- Contract Shape ---

    @Test
    void returnsApiVersion1() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.apiVersion").value("1"));
    }

    @Test
    void hasAllRequiredTopLevelFields() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.apiVersion").exists())
            .andExpect(jsonPath("$.generation").exists())
            .andExpect(jsonPath("$.generatedAt").exists())
            .andExpect(jsonPath("$.universe").exists())
            .andExpect(jsonPath("$.coverage").exists())
            .andExpect(jsonPath("$.symbols").exists())
            .andExpect(jsonPath("$.telemetry").exists());
    }

    @Test
    void generationIsPositiveIntegerAfterPublication() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.generation").isNumber())
            .andExpect(jsonPath("$.generation", greaterThan(0)));
    }

    @Test
    void generatedAtIsIso8601() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.generatedAt", matchesPattern("^\\d{4}-\\d{2}-\\d{2}T.*")));
    }

    @Test
    void universeIsCorrectCount() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.universe").value(4));
    }

    // --- Coverage ---

    @Test
    void coverageHasAllRequiredFields() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.coverage.ready").value(1))
            .andExpect(jsonPath("$.coverage.absent").value(1))
            .andExpect(jsonPath("$.coverage.expirationsKnown").value(1))
            .andExpect(jsonPath("$.coverage.pending").value(1))
            .andExpect(jsonPath("$.coverage.failed").value(0));
    }

    // --- Symbol Evidence ---

    @Test
    void readySymbolHasChainWithApplicationOwnedStructure() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].status", contains("ready")))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].chain").exists())
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].chain.underlying.symbol", contains("XLE")))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].chain.underlying.name", contains("Energy Select Sector")))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].chain.underlying.price", contains(92.5)))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].chain.puts[0].strike", contains(88)))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].chain.puts[0].bid", contains(1.5)))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'XLE')].chain.puts[0].openInterest", contains(520)));
    }

    @Test
    void absentSymbolHasNullChain() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'NOOPT')].status", contains("absent")))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'NOOPT')].chain", contains(nullValue())));
    }

    @Test
    void pendingSymbolHasNullFields() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'PENDING')].status", contains("pending")))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'PENDING')].expirations", contains(nullValue())))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'PENDING')].chain", contains(nullValue())))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'PENDING')].primaryExpiration", contains(nullValue())));
    }

    @Test
    void partialSymbolHasExpirationsButNoChain() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'PARTIAL')].status", contains("expirations_known")))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'PARTIAL')].chain", contains(nullValue())))
            .andExpect(jsonPath("$.symbols[?(@.symbol == 'PARTIAL')].primaryExpiration", contains("2026-08-03")));
    }

    @Test
    void eachSymbolHasRequiredFields() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.symbols[*].symbol").exists())
            .andExpect(jsonPath("$.symbols[*].status").exists())
            .andExpect(jsonPath("$.symbols.length()").value(4));
    }

    // --- Telemetry ---

    @Test
    void telemetryHasRequiredFields() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(jsonPath("$.telemetry.symbolsChangedThisGeneration").isNumber())
            .andExpect(jsonPath("$.telemetry.upstreamCalls").isNumber())
            .andExpect(jsonPath("$.telemetry.cacheHits").isNumber());
    }

    // --- ETag and Conditional HTTP ---

    @Test
    void etagHeaderPresent() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(header().exists("ETag"))
            .andExpect(header().string("ETag", matchesPattern("\"gen-\\d+\"")));
    }

    @Test
    void cacheControlHeaderCorrect() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(header().string("Cache-Control", "private, no-cache"));
    }

    @Test
    void xGenerationHeaderPresent() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(header().exists("X-Generation"));
    }

    @Test
    void xPayloadBytesHeaderPresent() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(header().exists("X-Payload-Bytes"));
    }

    @Test
    void conditionalGetReturns304WhenEtagMatches() throws Exception {
        // First request to get the ETag
        MvcResult first = mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(status().isOk())
            .andReturn();
        String etag = first.getResponse().getHeader("ETag");

        // Second request with matching If-None-Match
        mockMvc.perform(get("/api/evidence/snapshot")
                .header("If-None-Match", etag))
            .andExpect(status().isNotModified());
    }

    @Test
    void conditionalGetReturns200WhenEtagDoesNotMatch() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot")
                .header("If-None-Match", "\"gen-999999\""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.apiVersion").value("1"));
    }

    @Test
    void weakValidatorPrefixIsNormalized() throws Exception {
        MvcResult first = mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(status().isOk())
            .andReturn();
        String etag = first.getResponse().getHeader("ETag");

        // Send with W/ prefix — should still match
        mockMvc.perform(get("/api/evidence/snapshot")
                .header("If-None-Match", "W/" + etag))
            .andExpect(status().isNotModified());
    }

    // --- Response content type ---

    @Test
    void contentTypeIsJson() throws Exception {
        mockMvc.perform(get("/api/evidence/snapshot"))
            .andExpect(content().contentTypeCompatibleWith("application/json"));
    }
}
