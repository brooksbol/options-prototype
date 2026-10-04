package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Monitored-membership read endpoint — GET /api/evidence/monitored
 *
 * Smallest truthful public read of the backend's LAST DECLARED MONITORED SYMBOLS
 * (PL-CLI-01 bare-fetch experiment). The backend already owns this fact internally
 * via {@link SqliteEvidenceStore#getMonitoredSymbols()} (the symbols with a
 * non-null monitored_at, declared atomically through POST /api/evidence/observe).
 * Until now that membership had no public read capability: {@code /api/status}
 * exposes monitored-position COUNTS (total/current/degraded), not membership, and
 * the evidence snapshot represents a wider universe. An independent client could
 * therefore not truthfully learn the monitored set without inferring it from
 * counts, snapshots, or browser state — which it must not do.
 *
 * This is an ADDITIVE, compatible read. It does not change the snapshot contract,
 * introduce an API version, acquire evidence, or mutate state.
 *
 * SEMANTIC BOUNDARY (deliberate, load-bearing honesty):
 *   These are the LAST DECLARED monitored symbols. They are NOT asserted to be
 *   current exposure, current holdings, portfolio symbols, currently traded
 *   symbols, or brokerage positions. "Monitored" means "last declared, via the
 *   observe overlay, as worth keeping observed." Membership is replaced atomically
 *   on the next declaration; a symbol stops being monitored when a later
 *   declaration omits it. This endpoint reports membership only — it does not
 *   report freshness, coverage, or acquisition state (those remain in
 *   /api/status and /api/evidence/quotes).
 */
@RestController
public class MonitoredController {

    private final SqliteEvidenceStore store;

    public MonitoredController(SqliteEvidenceStore store) {
        this.store = store;
    }

    @GetMapping("/api/evidence/monitored")
    public ResponseEntity<Map<String, Object>> monitored() throws SQLException {
        List<String> symbols = store.getMonitoredSymbols();

        Map<String, Object> body = new LinkedHashMap<>();
        // The literal last-declared monitored membership (uppercase, store-sorted).
        body.put("symbols", symbols);
        // Count is derivable from the list; included so a consumer that only needs
        // the size need not count, and so the list and count can never silently drift.
        body.put("count", symbols.size());
        // Explicit, machine-visible semantic so no consumer upgrades membership into
        // exposure/holdings/positions. Matches the Javadoc boundary above.
        body.put("meaning", "last declared monitored symbols");
        return ResponseEntity.ok()
                .header("Cache-Control", "private, no-cache")
                .body(body);
    }
}
