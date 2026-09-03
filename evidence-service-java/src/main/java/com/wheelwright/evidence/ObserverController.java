package com.wheelwright.evidence;

import com.wheelwright.evidence.provider.ObservationRecorder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Observer endpoint — the AUTHORITATIVE measurement plane (PL-PROV-FAILOVER observer
 * correction).
 *
 * <p>This is the plane an observer reads to reconstruct every acquisition attempt,
 * authority boundary, fencing outcome, and usable-evidence transition WITHOUT knowing
 * the provider implementation or the internal control-state machine. It is deliberately
 * distinct from {@code /api/status}, whose pacer projection is non-authoritative
 * diagnostics bound to fixed instances.
 *
 * <p>Cursor + epoch semantics: a consumer polls with {@code afterSequence} and merges
 * operation + control events by their shared monotonic sequence. If {@code recorderEpoch}
 * changes between polls, or the consumer's cursor falls below
 * {@code oldestRetainedOperationSequence}, the consumer knows a process/buffer
 * discontinuity occurred and must not assume continuity.
 *
 * <p>Provider-neutral: authority identity and any environment string in the payload are
 * OPAQUE provenance. Observer interpretation must not depend on them.
 */
@RestController
public class ObserverController {

    private final ObservationRecorder recorder;

    public ObserverController(ObservationRecorder recorder) {
        this.recorder = recorder;
    }

    /**
     * Read a page of the authoritative observation stream strictly after
     * {@code afterSequence}. Returns operation events + control events + cursor/epoch/
     * discontinuity metadata.
     */
    @GetMapping("/api/observer/observations")
    public ObservationRecorder.ObservationPage observations(
            @RequestParam(defaultValue = "0") long afterSequence,
            @RequestParam(defaultValue = "1000") int limit) {
        return recorder.page(afterSequence, limit);
    }
}
