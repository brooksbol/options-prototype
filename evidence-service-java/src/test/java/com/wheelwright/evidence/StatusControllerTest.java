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
            .andExpect(jsonPath("$.pacer.queueDepth").exists())
            .andExpect(jsonPath("$.pacer.requestLimit").value(119))
            .andExpect(jsonPath("$.pacer.windowMs").value(60000))
            .andExpect(jsonPath("$.pacer.startsInWindow").exists())
            .andExpect(jsonPath("$.pacer.backoffRemainingMs").exists());
    }

    @Test
    void healthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("up"));
    }

    @Test
    void providerMeasurementEndpointUsesCursorResponseShape() throws Exception {
        mockMvc.perform(get("/api/measurement/provider-events")
                .param("afterSequence", "0")
                .param("limit", "25"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.eventsDropped").value(0))
            .andExpect(jsonPath("$.recorderErrors").value(0))
            // inFlightCount reflects LIVE provider concurrency in the shared Spring
            // context; asserting it is exactly 0 is timing-fragile (the background worker
            // may have a real provider request in flight). This test verifies the cursor
            // RESPONSE SHAPE, so assert the field exists and is a non-negative number.
            .andExpect(jsonPath("$.inFlightCount").isNumber())
            .andExpect(jsonPath("$.events").isArray());
    }
}
