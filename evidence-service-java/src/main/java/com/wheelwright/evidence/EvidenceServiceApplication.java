package com.wheelwright.evidence;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Wheelwright Evidence Service — always-on evidence appliance.
 *
 * Owns:
 *   - Provider credential custody
 *   - Background evidence acquisition (self-scheduling, non-overlapping)
 *   - Durable evidence persistence (SQLite)
 *   - Snapshot publication with ETag/conditional HTTP
 *   - Session-aware acquisition gating
 */
@SpringBootApplication
public class EvidenceServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EvidenceServiceApplication.class, args);
    }
}
