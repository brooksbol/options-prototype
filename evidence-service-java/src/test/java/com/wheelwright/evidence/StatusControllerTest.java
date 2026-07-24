package com.wheelwright.evidence;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Verifies health and status endpoints respond correctly.
 * Updated for full scheduler/telemetry response shape.
 */
@SpringBootTest(properties = {
    "evidence.db.path=:memory:",
    "tradier.api-key=test-key"
})
@AutoConfigureMockMvc
class StatusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void statusEndpointReturnsOk() throws Exception {
        mockMvc.perform(get("/api/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"))
            .andExpect(jsonPath("$.provider").value("tradier"))
            .andExpect(jsonPath("$.scheduler.state").exists())
            .andExpect(jsonPath("$.schedulerTelemetry.sessionState").exists())
            .andExpect(jsonPath("$.evidence.generation").exists())
            .andExpect(jsonPath("$.pacer.queueDepth").exists());
    }

    @Test
    void healthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("up"));
    }
}
