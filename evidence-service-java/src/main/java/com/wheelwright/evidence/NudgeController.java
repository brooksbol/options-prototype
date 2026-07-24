package com.wheelwright.evidence;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Nudge endpoint — POST /api/evidence/refresh
 *
 * Triggers an immediate acquisition cycle assessment. The worker cancels its
 * idle timer and runs the next cycle without waiting for the standard 30s delay.
 *
 * Behavioral parity with TypeScript main.ts nudge endpoint:
 *   - Always returns { "status": "nudged" } with HTTP 200
 *   - Delegates to worker.nudge() which is a no-op if already running or blocked
 *   - No rate limiting, authentication, or debounce (post-parity concern)
 */
@RestController
public class NudgeController {

    private final AcquisitionWorker worker;

    public NudgeController(AcquisitionWorker worker) {
        this.worker = worker;
    }

    @PostMapping("/api/evidence/refresh")
    public Map<String, String> refresh() {
        worker.nudge();
        return Map.of("status", "nudged");
    }
}
