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

        // 'symbols' must be present and a list. An EMPTY list is now VALID: it is the
        // explicit "no positions" declaration (empty portfolio) that atomically clears
        // the monitored set — and, together with an explicit heldExpirations:[], clears
        // held-expiration demand. Only a missing/non-list 'symbols' is a bad request.
        if (!(body.get("symbols") instanceof List)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request must include a 'symbols' array (may be empty to clear)"));
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

        // Record the full posted set as the current monitored-position set (PL-EVID-01).
        // The observe demand from portfolio monitoring IS the "capital at risk" signal:
        // these symbols get a monitoring service obligation (a scheduler floor) so their
        // evidence stays current enough to monitor, independent of recommendation class.
        // This atomically REPLACES the prior monitored set (closed positions stop being
        // monitored on the next declaration). Newly-added unknown symbols become monitored
        // once they resolve to a chain; already-known symbols are marked monitored now.
        store.setMonitoredSymbols(normalized);

        // Held-expiration acquisition overlay (migration 007). Optional additive field:
        // { "heldExpirations": [ { "symbol": "GDXJ", "expiration": "2026-09-11" }, ... ] }.
        // These are the EXACT (symbol, expiration) pairs the operator currently holds. The
        // acquisition worker keeps their chains refreshed even below the 7-45 DTE window,
        // so held positions' greeks stay current.
        //
        // LIFECYCLE CONTRACT (present-vs-omitted is significant — do not conflate):
        //   - field OMITTED           → leave the existing held declaration UNCHANGED.
        //     An older client, a competing tab, or a request that only updates symbols
        //     must NOT silently erase current held-expiration monitoring demand.
        //   - field present as []     → EXPLICITLY CLEAR the held set (operator holds
        //     nothing, e.g. empty portfolio).
        //   - field present with pairs → atomically REPLACE the held set (a closed
        //     position stops being held on the next declaration).
        int heldCount;
        if (body.containsKey("heldExpirations")) {
            List<Map.Entry<String, String>> heldPairs = parseHeldExpirations(body.get("heldExpirations"));
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

    /**
     * Parse the optional {@code heldExpirations} payload into (symbol, expiration) pairs.
     * Accepts a list of objects each with "symbol" and "expiration" string fields.
     * Tolerant: null/missing → empty list; malformed entries are skipped.
     */
    private static List<Map.Entry<String, String>> parseHeldExpirations(Object raw) {
        List<Map.Entry<String, String>> pairs = new ArrayList<>();
        if (!(raw instanceof List<?> list)) return pairs;
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> m)) continue;
            Object sym = m.get("symbol");
            Object exp = m.get("expiration");
            if (sym instanceof String s && exp instanceof String e && !s.isBlank() && !e.isBlank()) {
                pairs.add(Map.entry(s.toUpperCase(), e.trim()));
            }
        }
        return pairs;
    }
}
