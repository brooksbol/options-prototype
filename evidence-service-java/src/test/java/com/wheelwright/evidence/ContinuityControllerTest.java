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
 * Bounded continuity endpoint tests (ADR-022 / Doc 70 + REJECT remediation). Verifies the
 * backend-owned assessment persists a durable, bitemporally-resolvable, scope-bound,
 * coverage-gated verdict and fails closed on unsafe evidence.
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

    /** Affirmative body: admitted opening evidence + bound scope + matching endpoint. */
    private static String affirmativeBody() {
        return """
            {
              "brokerageAccountId":"acctC","governedScopeId":"scope_c","underlying":"XLE","optionType":"CALL","strike":57.5,
              "expiration":"2026-10-16","openingQuantity":1,"openingDate":"2026-09-10",
              "historyCompleteThroughQuietDay":true,"quietDay":"2026-09-26",
              "positionsShortQuantityOnQuietDay":1,"positionsIdentifiesSeries":true,
              "historyRows":[ %s ]
            }
            """.formatted(openingRow("2026-09-10"));
    }

    @Test
    void assessAffirmativePersistsAndResolvesWithinCoverageAndScope() throws Exception {
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(affirmativeBody()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verdict").value("FULL_Q_INTACT_APPLICABLE"))
            .andExpect(jsonPath("$.affirmative").value(true))
            .andExpect(jsonPath("$.coveredThrough").value("2026-09-26"))
            .andExpect(jsonPath("$.governedScopeId").value("scope_c"));

        // Resolves at a cut within coverage, bound to the same scope.
        mockMvc.perform(get("/api/continuity/resolve")
                .param("brokerageAccountId", "acctC").param("governedScopeId", "scope_c")
                .param("underlying", "XLE").param("optionType", "CALL").param("strike", "57.5")
                .param("expiration", "2026-10-16")
                .param("effectiveAsOf", "2026-09-26T00:00:00Z")
                .param("knowledgeCutoff", "2099-01-01T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resolved").value(true))
            .andExpect(jsonPath("$.assessment.verdict").value("FULL_Q_INTACT_APPLICABLE"));
    }

    @Test
    void defect5_affirmativeWithoutScopeIsDowngraded() throws Exception {
        // No governedScopeId => an otherwise-affirmative assessment must not be bindable.
        String body = """
            {
              "brokerageAccountId":"acctNS","underlying":"XLE","optionType":"CALL","strike":57.5,
              "expiration":"2026-10-16","openingQuantity":1,"openingDate":"2026-09-10",
              "historyCompleteThroughQuietDay":true,"quietDay":"2026-09-26",
              "positionsShortQuantityOnQuietDay":1,"positionsIdentifiesSeries":true,
              "historyRows":[ %s ]
            }
            """.formatted(openingRow("2026-09-10"));
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verdict").value("EVIDENCE_INSUFFICIENT"))
            .andExpect(jsonPath("$.affirmative").value(false))
            .andExpect(jsonPath("$.blockers", org.hamcrest.Matchers.hasItem("governance-scope-binding-missing")));
    }

    @Test
    void defect4_laterDecisionCutBeyondCoverageDoesNotResolve() throws Exception {
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(affirmativeBody()))
            .andExpect(status().isOk());
        // A Decision cut of 2026-09-27 is beyond covered_through (2026-09-26) — not resolvable.
        mockMvc.perform(get("/api/continuity/resolve")
                .param("brokerageAccountId", "acctC").param("governedScopeId", "scope_c")
                .param("underlying", "XLE").param("optionType", "CALL").param("strike", "57.5")
                .param("expiration", "2026-10-16")
                .param("effectiveAsOf", "2026-09-27T00:00:00Z")
                .param("knowledgeCutoff", "2099-01-01T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resolved").value(false));
    }

    @Test
    void defect5_resolveWithDifferentScopeDoesNotMatch() throws Exception {
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(affirmativeBody()))
            .andExpect(status().isOk());
        // A different scope on the same series must not resolve (series geometry != identity).
        mockMvc.perform(get("/api/continuity/resolve")
                .param("brokerageAccountId", "acctC").param("governedScopeId", "scope_other")
                .param("underlying", "XLE").param("optionType", "CALL").param("strike", "57.5")
                .param("expiration", "2026-10-16")
                .param("effectiveAsOf", "2026-09-26T00:00:00Z")
                .param("knowledgeCutoff", "2099-01-01T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resolved").value(false));
    }

    @Test
    void defect2_admittedSto1Sto1WithShort1DoesNotAffirm() throws Exception {
        String body = """
            {
              "brokerageAccountId":"acctAgg","governedScopeId":"scope_agg","underlying":"XLE","optionType":"CALL","strike":57.5,
              "expiration":"2026-10-16","openingQuantity":1,"openingDate":"2026-09-10",
              "historyCompleteThroughQuietDay":true,"quietDay":"2026-09-26",
              "positionsShortQuantityOnQuietDay":1,"positionsIdentifiesSeries":true,
              "historyRows":[ %s, {"runDate":"2026-09-11","action":"YOU SOLD OPENING TRANSACTION CALL","description":"CALL (XLE) SELECT SECTOR SPDR OCT 16 26 $57.5 (100 SHS)","quantity":1} ]
            }
            """.formatted(openingRow("2026-09-10"));
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.affirmative").value(false))
            .andExpect(jsonPath("$.blockers", org.hamcrest.Matchers.hasItem("endpoint-aggregate-mismatch")));
    }

    @Test
    void assessMissingCompletenessIsAuthorityMissingVerdict() throws Exception {
        String body = """
            {
              "brokerageAccountId":"acctC2","governedScopeId":"scope_c2","underlying":"XLE","optionType":"CALL","strike":57.5,
              "expiration":"2026-10-16","openingQuantity":1,"openingDate":"2026-09-10",
              "historyCompleteThroughQuietDay":false,
              "historyRows":[ %s ]
            }
            """.formatted(openingRow("2026-09-10"));
        mockMvc.perform(post("/api/continuity/assess")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verdict").value("AUTHORITY_MISSING"))
            .andExpect(jsonPath("$.affirmative").value(false));
    }

    @Test
    void assessIncompleteOpeningAnchorIsRejected() throws Exception {
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
    void resolveUnknownScopeReturnsUnresolved() throws Exception {
        mockMvc.perform(get("/api/continuity/resolve")
                .param("brokerageAccountId", "nobody").param("governedScopeId", "scope_x")
                .param("underlying", "ZZZ").param("optionType", "PUT").param("strike", "1.0")
                .param("expiration", "2026-01-01")
                .param("effectiveAsOf", "2099-01-01T00:00:00Z")
                .param("knowledgeCutoff", "2099-01-01T00:00:00Z"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resolved").value(false));
    }
}
