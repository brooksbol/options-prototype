package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.*;

/**
 * Observation demand endpoint — POST /api/evidence/observe
 *
 * Accepts a generic set of symbols that should become observable by the
 * Evidence Appliance. Symbols are added to the acquisition population
 * without any semantic knowledge of WHY they need observation.
 *
 * This is the bridge between consumer-driven observation demand and the
 * backend's acquisition population. The backend does not know whether the
 * demand originates from portfolio monitoring, recommendation scanning, or
 * any other consumer. It simply ensures the requested symbols are in the
 * observable set and will be acquired by the normal scheduling machinery.
 *
 * Idempotent: requesting already-known symbols is a no-op for those symbols.
 * New symbols enter as 'pending' and follow the normal lifecycle:
 * pending → expirations → partial → ready (with spot_history accumulating).
 */
@RestController
public class ObserveController {

    private final SqliteEvidenceStore store;

    public ObserveController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @PostMapping("/api/evidence/observe")
    public ResponseEntity<Map<String, Object>> observe(@RequestBody Map<String, Object> body) throws SQLException {
        @SuppressWarnings("unchecked")
        List<String> symbols = (List<String>) body.get("symbols");

        if (symbols == null || symbols.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request must include a non-empty 'symbols' array"));
        }

        // Normalize
        List<String> normalized = symbols.stream()
                .map(String::toUpperCase)
                .distinct()
                .sorted()
                .toList();

        // Determine which are already known
        List<String> unknown = store.findUnknownSymbols(normalized);
        List<String> alreadyKnown = normalized.stream()
                .filter(s -> !unknown.contains(s))
                .toList();

        // Add unknown symbols to the observable population as observation-demand only.
        // These are acquirable (AcquisitionWorker services them) but NOT recommendation-eligible
        // (not included in the published snapshot symbol list used by the recommendation engine).
        if (!unknown.isEmpty()) {
            store.addObservationDemand(unknown);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("added", unknown);
        result.put("alreadyKnown", alreadyKnown);
        result.put("totalRequested", normalized.size());

        return ResponseEntity.ok(result);
    }
}
