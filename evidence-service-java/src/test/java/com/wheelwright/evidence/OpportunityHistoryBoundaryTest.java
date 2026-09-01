package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.SqliteEvidenceStore.SurfaceObservationRecord;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end HTTP-boundary test for PL-DEPLOY-02-DEF01.
 *
 * These tests POST REAL frontend-shaped JSON (nested `winner` object, field names matching
 * the frontend WinnerEconomics interface exactly) through the actual controller, then read
 * the persisted row back independently via the store bean. Direct persistence tests are
 * insufficient for this defect — the failure was specifically the frontend->backend wire
 * shape (nested `winner` vs flat `bestX`), so verification MUST cross the HTTP boundary.
 */
@SpringBootTest(properties = {
    "evidence.db.path=:memory:",
    "tradier.api-key=test-key"
})
@AutoConfigureMockMvc
class OpportunityHistoryBoundaryTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SqliteEvidenceStore store;

    /** Real frontend-shaped batch JSON: nested winner, exact frontend key names. */
    private static String batchJson(String epochId, String surfaceObs) {
        return """
            {
              "epoch": {
                "epochId": "%s",
                "startedAt": "2026-09-02T13:35:00.000Z",
                "policyVersion": "routine-csp-v1-provisional",
                "evidenceGeneration": 21000,
                "sessionDate": "2026-09-02",
                "sessionPosture": "REGULAR_OBSERVATION",
                "provider": "tradier",
                "environment": "production",
                "symbolsEvaluated": 1,
                "emitter": "browser"
              },
              "symbolObservations": [
                {"observationId": "sy_%s", "epochId": "%s", "symbol": "XLE",
                 "symbolState": "HAS_EVALUABLE_SURFACES", "observedAt": "2026-09-02T13:35:01.000Z"}
              ],
              "surfaceObservations": [%s]
            }
            """.formatted(epochId, epochId, epochId, surfaceObs);
    }

    private static String qualifyingSurface(String obsId, String epochId, String state, String posture) {
        return """
            {
              "observationId": "%s",
              "epochId": "%s",
              "symbol": "XLE",
              "expiration": "2026-09-18",
              "dte": 21,
              "strategy": "csp",
              "evaluationState": "%s",
              "chainRetrievedAt": "2026-09-02T13:34:55.000Z",
              "observedAt": "2026-09-02T13:35:01.000Z",
              "winner": {
                "delta": -0.28,
                "strike": 88.0,
                "mid": 1.30,
                "spreadPercent": 3.5,
                "openInterest": 520,
                "volume": 110,
                "yieldAnnualized": 24.7,
                "posture": "%s"
              }
            }
            """.formatted(obsId, epochId, state, posture);
    }

    private static String nonWinnerSurface(String obsId, String epochId, String state) {
        return """
            {
              "observationId": "%s",
              "epochId": "%s",
              "symbol": "XLE",
              "expiration": "2026-09-18",
              "dte": 21,
              "strategy": "csp",
              "evaluationState": "%s",
              "chainRetrievedAt": "2026-09-02T13:34:55.000Z",
              "observedAt": "2026-09-02T13:35:01.000Z",
              "winner": null
            }
            """.formatted(obsId, epochId, state);
    }

    @Test
    void qualifiedActionablePersistsAllWinnerEconomicsAcrossHttpBoundary() throws Exception {
        String obsId = "so_actionable_1";
        mockMvc.perform(post("/api/opportunity-history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(batchJson("ep_act", qualifyingSurface(obsId, "ep_act", "QUALIFIED_ACTIONABLE", "ACTIONABLE"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("recorded"))
            .andExpect(jsonPath("$.surfaceObservations").value(1));

        SurfaceObservationRecord rec = store.getSurfaceObservation(obsId);
        assertThat(rec).isNotNull();
        assertThat(rec.evaluationState()).isEqualTo("QUALIFIED_ACTIONABLE");
        // The eight economics fields that were silently dropped before the repair:
        assertThat(rec.bestDelta()).isEqualTo(-0.28);
        assertThat(rec.bestStrike()).isEqualTo(88.0);
        assertThat(rec.bestMid()).isEqualTo(1.30);
        assertThat(rec.bestSpreadPct()).isEqualTo(3.5);
        assertThat(rec.bestOpenInterest()).isEqualTo(520);
        assertThat(rec.bestVolume()).isEqualTo(110);
        assertThat(rec.bestYieldAnnual()).isEqualTo(24.7);
        assertThat(rec.bestPosture()).isEqualTo("ACTIONABLE");
    }

    @Test
    void qualifiedEdgeEvaluatedWaitAndWideSpreadAllPersistEconomics() throws Exception {
        record Case(String obsId, String epoch, String state, String posture) {}
        var cases = new Case[] {
            new Case("so_edge_1", "ep_edge", "QUALIFIED_EDGE", "EDGE"),
            new Case("so_wait_1", "ep_wait", "EVALUATED_WAIT", "WAIT"),
            new Case("so_wide_1", "ep_wide", "EVALUATED_WIDE_SPREAD", "WAIT"),
        };
        for (Case c : cases) {
            mockMvc.perform(post("/api/opportunity-history")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(batchJson(c.epoch(), qualifyingSurface(c.obsId(), c.epoch(), c.state(), c.posture()))))
                .andExpect(status().isOk());
            SurfaceObservationRecord rec = store.getSurfaceObservation(c.obsId());
            assertThat(rec).as("state %s persisted", c.state()).isNotNull();
            assertThat(rec.evaluationState()).isEqualTo(c.state());
            assertThat(rec.bestDelta()).isEqualTo(-0.28);
            assertThat(rec.bestMid()).isEqualTo(1.30);
            assertThat(rec.bestYieldAnnual()).isEqualTo(24.7);
            assertThat(rec.bestPosture()).isEqualTo(c.posture());
        }
    }

    @Test
    void nonWinnerStatePersistsNullEconomics() throws Exception {
        String obsId = "so_nodelta_1";
        mockMvc.perform(post("/api/opportunity-history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(batchJson("ep_nw", nonWinnerSurface(obsId, "ep_nw", "EVALUATED_NO_DELTA_MATCH"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.surfaceObservations").value(1));

        SurfaceObservationRecord rec = store.getSurfaceObservation(obsId);
        assertThat(rec).isNotNull();
        assertThat(rec.evaluationState()).isEqualTo("EVALUATED_NO_DELTA_MATCH");
        assertThat(rec.bestDelta()).isNull();
        assertThat(rec.bestStrike()).isNull();
        assertThat(rec.bestMid()).isNull();
        assertThat(rec.bestSpreadPct()).isNull();
        assertThat(rec.bestOpenInterest()).isNull();
        assertThat(rec.bestVolume()).isNull();
        assertThat(rec.bestYieldAnnual()).isNull();
        assertThat(rec.bestPosture()).isNull();
    }

    @Test
    void winnerRequiredStateWithMissingEconomicsIsRejectedNotSilentlyStored() throws Exception {
        String obsId = "so_bad_1";
        // QUALIFIED_ACTIONABLE requires winner economics, but winner is null -> governed rejection.
        mockMvc.perform(post("/api/opportunity-history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(batchJson("ep_bad", nonWinnerSurface(obsId, "ep_bad", "QUALIFIED_ACTIONABLE"))))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.error").value("winner-required state missing winner economics"))
            .andExpect(jsonPath("$.evaluationState").value("QUALIFIED_ACTIONABLE"));

        // The invariant: it must NOT have been durably stored as a complete row.
        assertThat(store.getSurfaceObservation(obsId)).isNull();
    }

    @Test
    void winnerRequiredStateWithIncompleteEconomicsIsRejected() throws Exception {
        String obsId = "so_incomplete_1";
        // winner present but missing yieldAnnualized and posture -> incomplete -> rejected.
        String surface = """
            {
              "observationId": "%s",
              "epochId": "ep_inc",
              "symbol": "XLE",
              "expiration": "2026-09-18",
              "dte": 21,
              "strategy": "csp",
              "evaluationState": "QUALIFIED_ACTIONABLE",
              "chainRetrievedAt": "2026-09-02T13:34:55.000Z",
              "observedAt": "2026-09-02T13:35:01.000Z",
              "winner": { "delta": -0.28, "strike": 88.0, "mid": 1.30, "spreadPercent": 3.5,
                          "openInterest": 520, "volume": 110 }
            }
            """.formatted(obsId);
        mockMvc.perform(post("/api/opportunity-history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(batchJson("ep_inc", surface)))
            .andExpect(status().isUnprocessableEntity());
        assertThat(store.getSurfaceObservation(obsId)).isNull();
    }

    @Test
    void duplicateEmissionIsIdempotentAndPreservesEconomics() throws Exception {
        String obsId = "so_idem_1";
        String content = batchJson("ep_idem", qualifyingSurface(obsId, "ep_idem", "QUALIFIED_ACTIONABLE", "ACTIONABLE"));
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/opportunity-history")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(content))
                .andExpect(status().isOk());
        }
        // Exactly one durable row; economics intact.
        SurfaceObservationRecord rec = store.getSurfaceObservation(obsId);
        assertThat(rec).isNotNull();
        assertThat(rec.bestDelta()).isEqualTo(-0.28);
        assertThat(rec.bestPosture()).isEqualTo("ACTIONABLE");
    }
}
