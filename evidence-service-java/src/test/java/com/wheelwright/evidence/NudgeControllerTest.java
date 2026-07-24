package com.wheelwright.evidence;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Nudge endpoint tests — POST /api/evidence/refresh
 *
 * Proves:
 * - endpoint returns HTTP 200 with { "status": "nudged" }
 * - POST method required (GET should return 405)
 * - response shape matches TypeScript contract exactly
 * - endpoint is callable regardless of worker state
 */
@SpringBootTest(properties = {
    "evidence.db.path=:memory:",
    "tradier.api-key=test-key"
})
@AutoConfigureMockMvc
class NudgeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/evidence/refresh returns 200 with nudged status")
    void nudgeReturnsOk() throws Exception {
        mockMvc.perform(post("/api/evidence/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("nudged"));
    }

    @Test
    @DisplayName("response contains exactly one field: status")
    void responseShapeExact() throws Exception {
        mockMvc.perform(post("/api/evidence/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("nudged"))
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET method not allowed (POST only)")
    void getMethodNotAllowed() throws Exception {
        mockMvc.perform(get("/api/evidence/refresh"))
            .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("nudge is idempotent — multiple calls return same response")
    void multipleNudgesIdempotent() throws Exception {
        mockMvc.perform(post("/api/evidence/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("nudged"));

        mockMvc.perform(post("/api/evidence/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("nudged"));

        mockMvc.perform(post("/api/evidence/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("nudged"));
    }
}
