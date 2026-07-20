package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.sql.SQLException;

/**
 * Snapshot endpoint — GET /api/evidence/snapshot
 *
 * Serves the current evidence state with conditional HTTP support (ETag / 304).
 * Behavioral parity with TypeScript routes/snapshot.ts.
 *
 * Contract: docs/contracts/evidence-snapshot-v1.md
 */
@RestController
public class SnapshotController {

    private final SqliteEvidenceStore store;

    public SnapshotController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @GetMapping("/api/evidence/snapshot")
    public ResponseEntity<String> snapshot(HttpServletRequest request, HttpServletResponse response)
            throws SQLException {

        String currentETag = store.getETag();

        // Conditional: If-None-Match (robust comparison — handle weak validators)
        String clientETag = request.getHeader("If-None-Match");
        if (clientETag != null) {
            String normalizedClient = clientETag.replaceFirst("^W/", "").trim();
            String normalizedCurrent = currentETag.replaceFirst("^W/", "").trim();
            if (normalizedClient.equals(normalizedCurrent)) {
                return ResponseEntity.status(304)
                    .eTag(currentETag)
                    .build();
            }
        }

        // Build snapshot JSON
        String payload = SnapshotBuilder.buildSnapshotJson(store);
        int payloadBytes = payload.getBytes(StandardCharsets.UTF_8).length;

        return ResponseEntity.ok()
            .header("ETag", currentETag)
            .header("Cache-Control", "private, no-cache")
            .header("Content-Type", "application/json")
            .header("X-Payload-Bytes", String.valueOf(payloadBytes))
            .header("X-Generation", String.valueOf(store.getGeneration()))
            .body(payload);
    }
}
