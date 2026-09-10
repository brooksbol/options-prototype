package com.wheelwright.evidence;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
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
 */
@RestController
public class NudgeController {

    private final AcquisitionWorker worker;

    public NudgeController(AcquisitionWorker worker) {
        this.worker = worker;
    }

    @PostMapping("/api/evidence/refresh")
    public Map<String, Object> refresh() {
        AcquisitionWorker.ForcedAcquisitionResult result = worker.forceAcquireOnce();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("outcome", result.outcome().name());          // ACQUIRED | NOT_RUNNING | PROVIDER_UNAVAILABLE | INTERRUPTED
        body.put("symbolsAcquired", result.symbolsAcquired());  // how many symbols this forced cycle acquired
        body.put("workQueueDepth", result.workQueueDepth());    // relevant work still outstanding after the cycle
        body.put("generation", result.generation());            // snapshot generation after the cycle
        body.put("sessionPosture", result.sessionPosture());    // real posture (e.g. BLOCKED) — bypassed, but reported
        // Explicit, honest limitation so no consumer treats this as historical recovery.
        body.put("recoversHistory", false);
        return body;
    }
}
