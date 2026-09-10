package com.wheelwright.evidence;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.hamcrest.Matchers.in;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Forced-acquisition endpoint tests — POST /api/evidence/refresh
 *
 * The endpoint now runs an operator-forced one-shot acquisition (PL-OPS-08) via
 * AcquisitionWorker.forceAcquireOnce(), replacing the former worker.nudge() delegation.
 *
 * Proves:
 * - endpoint returns HTTP 200 with the honest forced-acquisition disposition
 * - outcome is one of the defined ForceOutcome values
 * - the honest historical-recovery limitation flag is present and false
 * - POST method required (GET should return 405)
 *
 * Note: in this integration context the provider authority is not established (test key,
 * in-memory db), so the outcome is typically PROVIDER_UNAVAILABLE or NOT_RUNNING — either
 * way the endpoint reports it honestly rather than fabricating success.
 */
@SpringBootTest(properties = {
    "evidence.db.path=:memory:",
    "tradier.api-key=test-key"
})
@AutoConfigureMockMvc
class NudgeControllerTest {

    private static final Set<String> VALID_OUTCOMES =
        Set.of("ACQUIRED", "NOT_RUNNING", "PROVIDER_UNAVAILABLE", "INTERRUPTED");

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/evidence/refresh returns 200 with an honest forced-acquisition outcome")
    void refreshReturnsOk() throws Exception {
        mockMvc.perform(post("/api/evidence/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outcome").value(is(in(VALID_OUTCOMES))))
            .andExpect(jsonPath("$.recoversHistory").value(false));
    }

    @Test
    @DisplayName("response exposes the forced-acquisition disposition fields")
    void responseShape() throws Exception {
        mockMvc.perform(post("/api/evidence/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outcome").exists())
            .andExpect(jsonPath("$.symbolsAcquired").exists())
            .andExpect(jsonPath("$.workQueueDepth").exists())
            .andExpect(jsonPath("$.generation").exists())
            .andExpect(jsonPath("$.sessionPosture").exists())
            // Honest limitation: this control never reconstructs missed history.
            .andExpect(jsonPath("$.recoversHistory").value(false));
    }

    @Test
    @DisplayName("GET method not allowed (POST only)")
    void getMethodNotAllowed() throws Exception {
        mockMvc.perform(get("/api/evidence/refresh"))
            .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("repeated calls remain safe and honest")
    void multipleCallsSafe() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/evidence/refresh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value(is(in(VALID_OUTCOMES))))
                .andExpect(jsonPath("$.recoversHistory").value(false));
        }
    }
}
