package com.wheelwright.evidence;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Forced-acquisition endpoint — POST /api/evidence/refresh
 *
 * Operator-forced one-shot evidence acquisition (PL-OPS-08 bounded recovery control).
 *
 * Runs exactly one full acquisition cycle immediately over the currently relevant work
 * queue, through the existing provider/cache/persistence paths, DELIBERATELY BYPASSING
 * the scheduler's due-time and market-session gating for this single operator-requested
 * cycle. This is the recovery action after an outage/forgotten restart: "acquire the
 * best current evidence Wheelwright can acquire now," including after hours.
 *
 * It does NOT change the scheduler, reopen continuous observation, weaken automatic
 * session policy, or fabricate historical points. Acquired evidence retains its real
 * timestamps and provider/session provenance, so after-hours evidence is never mistaken
 * for an observation captured during a missing interval. It does NOT reconstruct a prior
 * gap — that remains deferred PL-OPS-08 work.
 *
 * Historical note: this endpoint previously delegated to worker.nudge(), which only
 * pulled DUE work forward within an already-valid session and was a deterministic no-op
 * once the session gate closed. That solved a different, smaller problem and was not the
 * requested recovery control; it has been replaced by forceAcquireOnce().
 *
 * Targeted variant: when one or more {@code symbol} query parameters are supplied
 * (POST /api/evidence/refresh?symbol=BNO&symbol=COPX), the endpoint re-observes EXACTLY
 * those symbols regardless of their freshness — the operator-console "Refresh evidence
 * now" for the positions on screen. It bypasses the freshness/due gate and session gate
 * but goes through the identical provider/persistence/pacing path, so the re-observed
 * evidence carries its real timestamp and provenance (nothing fabricated). With no
 * {@code symbol} params the endpoint keeps its original whole-cycle behavior.
 *
 * POST (not GET) because this is a side-effecting operation: it drives provider
 * acquisition, mutates the evidence store, and advances the snapshot generation. GET is
 * reserved for the safe, cacheable read of the result (GET /api/evidence/quotes).
 */
@RestController
public class NudgeController {

    private final AcquisitionWorker worker;

    public NudgeController(AcquisitionWorker worker) {
        this.worker = worker;
    }

    @PostMapping("/api/evidence/refresh")
    public Map<String, Object> refresh(
            @RequestParam(name = "symbol", required = false) List<String> symbols) {
        // Targeted refresh when symbols are supplied; otherwise the original whole-cycle force.
        boolean targeted = symbols != null && !symbols.isEmpty();
        AcquisitionWorker.ForcedAcquisitionResult result = targeted
                ? worker.forceAcquireSymbols(symbols)
                : worker.forceAcquireOnce();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("outcome", result.outcome().name());          // ACQUIRED | NOT_RUNNING | PROVIDER_UNAVAILABLE | INTERRUPTED | NOT_COMPLETED
        // Load-bearing honesty: true ONLY when the forced operation actually finished.
        // A bounded-wait timeout or an escaped error yields completed=false (outcome
        // NOT_COMPLETED), so no consumer may read "ACQUIRED" as "the work completed".
        body.put("completed", result.completed());
        body.put("symbolsAcquired", result.symbolsAcquired());  // store-mutation delta this cycle (NOT a per-requested-symbol count)
        body.put("workQueueDepth", result.workQueueDepth());    // relevant work still outstanding after the cycle
        body.put("generation", result.generation());            // snapshot generation after the cycle
        body.put("sessionPosture", result.sessionPosture());    // real posture (e.g. BLOCKED) — bypassed, but reported
        body.put("targeted", targeted);                         // true when scoped to explicit symbols
        // Explicit, honest limitation so no consumer treats this as historical recovery.
        body.put("recoversHistory", false);

        // Per-requested-symbol result for a TARGETED refresh (PL-OPS-09): for each
        // requested symbol, whether Wheelwright holds its requested price AFTER the
        // operation completed. Only emitted when the operation actually completed; on a
        // non-completed targeted refresh the backend certifies nothing per symbol, so the
        // array is empty. The held flag uses the SAME gate as GET /api/evidence/quotes
        // (shared held-observation determination). It does NOT assert new acquisition,
        // freshness, independent quote age, or trade suitability — a preserved prior price
        // legitimately satisfies "held". That provenance boundary stays owned by
        // ADR-015 / PL-EVID-AGE.
        if (targeted) {
            List<Map<String, Object>> perSymbol = new java.util.ArrayList<>();
            for (AcquisitionWorker.PerSymbolRefreshResult r : result.perSymbol()) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("symbol", r.symbol());
                // Two independent facts: (1) this invocation's acquisition outcome, and
                // (2) whether Wheelwright holds the requested price after completion. A
                // failed attempt can coexist with heldPrice=true (preserved prior price);
                // a held price never implies this invocation acquired anything.
                entry.put("acquisitionOutcome", r.acquisitionOutcome());
                entry.put("heldPrice", r.heldPrice());
                perSymbol.add(entry);
            }
            body.put("perSymbol", perSymbol);
        }
        return body;
    }
}
