package com.wheelwright.evidence;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Governance-authoring boundary tests (Correction 1 / governance-abuse guard).
 *
 * Governance is an explicit authority-bearing act; the server rejects any attempt to author
 * a Context Version without explicit operator-governance authority or with malformed gates.
 */
@SpringBootTest(properties = {
    "evidence.db.path=:memory:",
    "tradier.api-key=test-key"
})
@AutoConfigureMockMvc
class GovernedContextControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static String draft(String provenance, String stance, String elig) {
        return """
            {
              "brokerageAccountId": "acctA",
              "governedScopeId": "scope1",
              "program": "assignment-centric-wheel",
              "configVersion": "1",
              "callAwayStance": "%s",
              "eligibilityGate": "%s",
              "interventionGate": "CLEAR",
              "noWriteGate": "CLEAR",
              "authorityProvenance": "%s",
              "effectiveFrom": "2026-09-05T00:00:00Z"
            }
            """.formatted(stance, elig, provenance);
    }

    @Test
    void acceptsExplicitOperatorGovernance() throws Exception {
        mockMvc.perform(post("/api/governed-context")
                .contentType(MediaType.APPLICATION_JSON)
                .content(draft("operator-governance", "accepted", "CLEAR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("recorded"))
            .andExpect(jsonPath("$.contextVersionId").exists());
    }

    @Test
    void rejectsNonOperatorGovernanceProvenance() throws Exception {
        // Attempt to author governance as broker-evidence (would let mechanical facts
        // masquerade as governance) — must be rejected.
        mockMvc.perform(post("/api/governed-context")
                .contentType(MediaType.APPLICATION_JSON)
                .content(draft("broker-evidence", "accepted", "CLEAR")))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.violations").isArray());
    }

    @Test
    void rejectsMalformedGate() throws Exception {
        mockMvc.perform(post("/api/governed-context")
                .contentType(MediaType.APPLICATION_JSON)
                .content(draft("operator-governance", "accepted", "CLEARISH")))
            .andExpect(status().isUnprocessableEntity());
    }
}
