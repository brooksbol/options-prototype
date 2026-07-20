package com.wheelwright.evidence;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Health and status endpoints.
 * Verifies the service is running and configured.
 */
@RestController
public class StatusController {

    @GetMapping("/api/status")
    public Map<String, Object> status() {
        return Map.of(
            "status", "ok",
            "service", "evidence-service-java",
            "apiVersion", "1"
        );
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "up");
    }
}
