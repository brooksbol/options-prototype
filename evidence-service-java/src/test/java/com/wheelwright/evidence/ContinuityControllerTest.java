package com.wheelwright.evidence;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bounded continuity endpoint tests (ADR-022 / Doc 70). Verifies the backend-owned assessment
 * persists a durable, bitemporally-resolvable verdict and fails closed on unsafe evidence.
 */
@SpringBootTest(properties = {"evidence.db.path=:memory:", "tradier.api-key=test-key"})
@AutoConfigureMockMvc
class ContinuityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static String openingRow(String day) {
        return """
            {"runDate":"%s","action":"YOU SOLD OPENING TRANSACTION CALL",
             "description":"CALL (XLE) SELECT SECTOR SPDR OCT 16 26 $57.5 (100 SHS)","quantity":1}
            """.formatted(day);
    }

    private static String affirmativeBody() {
        return """
            {
              "brokerageAccountId":"acctC","underlying":"XLE","optionType":"CALL","strike":57.5,
              "expiration":"2026-10-16","openingQuantity":1,"openingDate":"2026-09-10",
              "historyCompleteThroughQuietDay":true,"quietDay":"2026-09-26",
              "positionsShortQuantityOnQuietDay":1,"positionsIdentifiesSeries":true,
              "historyRows":[ %s ]
            }
            """.formatted(openingRow("2026-09-10"));
    }

    @Test
    void assessAffirmativePersistsAndResolves() throws Exception {
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(affirmativeBody()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("assessed"))
            .andExpect(jsonPath("$.verdict").value("FULL_Q_INTACT_APPLICABLE"))
            .andExpect(jsonPath("$.affirmative").value(true))
            .andExpect(jsonPath("$.assessmentId").exists())
            .andExpect(jsonPath("$.evidenceHash").exists());

        // Durable + bitemporally resolvable at a future knowledge cutoff.
        mockMvc.perform(get("/api/continuity/resolve")
                .param("brokerageAccountId", "acctC").param("underlying", "XLE")
                .param("optionType", "CALL").param("strike", "57.5")
                .param("expiration", "2026-10-16")
                .param("effectiveAsOf", "2099-01-01T00:00:00Z")
                .param("knowledgeCutoff", "2099-01-01T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resolved").value(true))
            .andExpect(jsonPath("$.assessment.verdict").value("FULL_Q_INTACT_APPLICABLE"));
    }

    @Test
    void assessMissingCompletenessIsAuthorityMissingVerdict() throws Exception {
        String body = """
            {
              "brokerageAccountId":"acctC2","underlying":"XLE","optionType":"CALL","strike":57.5,
              "expiration":"2026-10-16","openingQuantity":1,"openingDate":"2026-09-10",
              "historyCompleteThroughQuietDay":false,
              "historyRows":[ %s ]
            }
            """.formatted(openingRow("2026-09-10"));
        // Missing completeness is a durable non-affirmative verdict (200), not a 4xx: the
        // Decision fails closed rather than inventing membership.
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verdict").value("AUTHORITY_MISSING"))
            .andExpect(jsonPath("$.affirmative").value(false));
    }

    @Test
    void assessIncompleteOpeningAnchorIsRejected() throws Exception {
        // Structurally incomplete opening anchor (missing openingQuantity) => 422 intake error.
        String body = """
            {"brokerageAccountId":"acctC3","underlying":"XLE","optionType":"CALL","strike":57.5,
             "expiration":"2026-10-16","openingDate":"2026-09-10","historyRows":[]}
            """;
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.missing").isArray());
    }

    @Test
    void resolveUnknownSeriesReturnsUnresolved() throws Exception {
        mockMvc.perform(get("/api/continuity/resolve")
                .param("brokerageAccountId", "nobody").param("underlying", "ZZZ")
                .param("optionType", "PUT").param("strike", "1.0")
                .param("expiration", "2026-01-01")
                .param("effectiveAsOf", "2099-01-01T00:00:00Z")
                .param("knowledgeCutoff", "2099-01-01T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resolved").value(false));
    }
}
