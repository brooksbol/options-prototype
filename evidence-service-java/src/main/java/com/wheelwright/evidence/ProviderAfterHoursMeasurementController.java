package com.wheelwright.evidence;

import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Explicitly enabled, bounded provider-path measurement harness.
 *
 * It bypasses normal acquisition and persistence while exercising the real
 * Tradier HTTP path and RequestPacer admission controller. It is absent from
 * the application unless the operator opts in at process start.
 */
@RestController
@ConditionalOnProperty(
    name = "measurement.after-hours-provider-test-enabled",
    havingValue = "true")
public class ProviderAfterHoursMeasurementController {

    static final int MAX_REQUESTS = 120;

    private final TradierAdapter adapter;
    private final RequestPacer pacer;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public ProviderAfterHoursMeasurementController(TradierAdapter adapter, RequestPacer pacer) {
        this.adapter = adapter;
        this.pacer = pacer;
    }

    @PostMapping("/api/measurement/after-hours-provider-run")
    public Map<String, Object> run(
            @RequestParam(defaultValue = "120") int requests,
            @RequestParam(defaultValue = "SPY") String symbol) throws Exception {
        if (requests < 1 || requests > MAX_REQUESTS) {
            throw new IllegalArgumentException("requests must be between 1 and " + MAX_REQUESTS);
        }
        if (!running.compareAndSet(false, true)) {
            throw new MeasurementAlreadyRunningException();
        }

        Instant startedAt = Instant.now();
        long startedNs = System.nanoTime();
        int completed = 0;
        long responseCharacters = 0;
        try {
            for (int i = 0; i < requests; i++) {
                responseCharacters += adapter.measureUncachedQuote(symbol);
                completed++;
            }

            long durationMs = (System.nanoTime() - startedNs) / 1_000_000L;
            var state = pacer.getState();
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("status", "complete");
            result.put("startedAt", startedAt.toString());
            result.put("completedAt", Instant.now().toString());
            result.put("symbol", symbol.toUpperCase());
            result.put("requested", requests);
            result.put("completed", completed);
            result.put("durationMs", durationMs);
            result.put("responseCharactersDiscarded", responseCharacters);
            result.put("requestLimit", state.requestLimit());
            result.put("windowMs", state.windowMs());
            result.put("startsInWindow", state.startsInWindow());
            result.put("nextAdmissionInMs", state.nextAdmissionInMs());
            result.put("evidencePersisted", false);
            result.put("cacheMutated", false);
            return result;
        } finally {
            running.set(false);
        }
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    static class MeasurementAlreadyRunningException extends RuntimeException {
        MeasurementAlreadyRunningException() {
            super("an after-hours provider measurement is already running");
        }
    }
}
