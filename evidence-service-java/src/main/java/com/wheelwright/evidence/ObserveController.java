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
        // Validate 'symbols' BEFORE any cast, so malformed input returns 400 rather than
        // escaping as a ClassCastException / 500:
        //   - missing or not a list        → 400
        //   - list with any non-string     → 400
        //   - valid string list (incl. []) → accepted (empty [] is the explicit clear
        //                                     declaration per the held-expiration lifecycle)
        Object rawSymbols = body.get("symbols");
        if (!(rawSymbols instanceof List<?> rawList)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request must include a 'symbols' array (may be empty to clear)"));
        }
        List<String> symbols = new ArrayList<>(rawList.size());
        for (Object member : rawList) {
            if (!(member instanceof String s)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "'symbols' must contain only strings"));
            }
            symbols.add(s);
        }

        // Held-expiration acquisition overlay (migration 007). Optional additive field:
        // { "heldExpirations": [ { "symbol": "GDXJ", "expiration": "2026-09-11" }, ... ] }.
        //
        // LIFECYCLE CONTRACT (present-vs-omitted is significant — do not conflate):
        //   - field OMITTED            → leave the existing held declaration UNCHANGED.
        //   - field present as []      → EXPLICITLY CLEAR the held set.
        //   - field present with pairs → atomically REPLACE the held set.
        //
        // ATOMICITY + STRICTNESS: the ENTIRE held payload is validated here, BEFORE any
        // store mutation below. Malformed present input (wrong top-level type, a non-object
        // member, or an incomplete/non-string pair) fails the whole request with 400 and
        // leaves BOTH monitored and held state unchanged. Held input is never partially
        // accepted — bad input must not silently erase or partially rewrite monitoring demand.
        boolean heldPresent = body.containsKey("heldExpirations");
        List<Map.Entry<String, String>> heldPairs = null;
        if (heldPresent) {
            Object rawHeld = body.get("heldExpirations");
            if (!(rawHeld instanceof List<?> heldList)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "'heldExpirations' must be an array"));
            }
            heldPairs = new ArrayList<>(heldList.size());
            for (Object item : heldList) {
                if (!(item instanceof Map<?, ?> m)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "each 'heldExpirations' entry must be an object with 'symbol' and 'expiration'"));
                }
                Object sym = m.get("symbol");
                Object exp = m.get("expiration");
                if (!(sym instanceof String s) || !(exp instanceof String e) || s.isBlank() || e.isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "each 'heldExpirations' entry must have non-empty string 'symbol' and 'expiration'"));
                }
                heldPairs.add(Map.entry(s.toUpperCase(), e.trim()));
            }
        }

        // ---- All validation passed. Mutations begin here (none run if validation failed). ----

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

        // Record the full posted set as the current monitored-position set (PL-EVID-01).
        // This atomically REPLACES the prior monitored set (closed positions stop being
        // monitored on the next declaration).
        store.setMonitoredSymbols(normalized);

        // Apply the held declaration only when present (omitted → unchanged). The payload
        // was fully validated above, so a present list is complete and safe to apply.
        int heldCount;
        if (heldPresent) {
            store.setHeldExpirations(heldPairs);
            heldCount = heldPairs.size();
        } else {
            heldCount = -1; // sentinel: omitted → unchanged (not written)
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("added", unknown);
        result.put("alreadyKnown", alreadyKnown);
        result.put("monitored", normalized.size());
        // -1 signals "heldExpirations omitted → existing held demand left unchanged".
        result.put("heldExpirations", heldCount);
        result.put("totalRequested", normalized.size());

        return ResponseEntity.ok(result);
    }
}
