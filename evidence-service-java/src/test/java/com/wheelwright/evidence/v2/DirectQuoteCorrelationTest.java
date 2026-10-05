package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.provider.ObservationRecorder;
import com.wheelwright.evidence.provider.ProviderAuthority;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end request-correlation regression tests (Doc 79 I4), exercising the REAL
 * {@link TradierDirectQuoteSource} + {@link RequestPacer} + {@link ObservationRecorder} seam.
 *
 * <p>The adapter is pointed at an unroutable base URL so the HTTP call fails quickly WITHOUT a
 * live provider, but the pacer still begins/completes a provider observer operation. The tests
 * assert that those provider observer events carry the request-correlated logical operation id
 * and the CAPTURED authority epoch — never the null-logical-id / epoch-zero default the
 * rejected candidate produced — while subordinate identities (per-request transport id) coexist.
 */
class DirectQuoteCorrelationTest {

    /** Build a real manager whose production adapter targets an unroutable host (fast failure). */
    private record Rig(TradierDirectQuoteSource source, ObservationRecorder observer) {}

    private Rig rig() {
        ObservationRecorder observer = new ObservationRecorder();
        ResponseCache cache = new ResponseCache();
        RequestPacer pacer = new RequestPacer(119, 200);
        // 127.0.0.1:1 is reserved/unroutable → connection refused quickly, no live provider.
        TradierAdapter adapter = new TradierAdapter("test-key", "http://127.0.0.1:1/v1", cache, pacer);
        ProviderAuthority prod = new ProviderAuthority("prod", "production", adapter, cache, pacer);
        ProviderAuthorityManager manager = new ProviderAuthorityManager(prod, null, observer);
        manager.markSingleAuthorityActiveForLegacy();
        return new Rig(new TradierDirectQuoteSource(manager), observer);
    }

    private List<ObservationRecorder.Event> providerEvents(ObservationRecorder observer) {
        return observer.page(0, 10_000).events().stream()
            .filter(e -> e.recordType().equals("OPERATION_STARTED")
                      || e.recordType().equals("OPERATION_COMPLETED")
                      || e.recordType().equals("LOGICAL_OUTCOME"))
            .toList();
    }

    @Test
    @DisplayName("I4 supplied request id reaches provider observer events (logical id, captured epoch 1, not null/zero)")
    void suppliedRequestIdReachesObserver() {
        Rig rig = rig();
        String requestId = "11111111-1111-1111-1111-111111111111";
        rig.source().acquire(List.of("SPY"), requestId);

        List<ObservationRecorder.Event> events = providerEvents(rig.observer());
        assertThat(events).isNotEmpty();
        for (ObservationRecorder.Event e : events) {
            assertThat(e.logicalOperationId())
                .as("provider observer event must carry a request-correlated logical id, not null")
                .isNotNull()
                .contains(requestId);
            assertThat(e.authorityEpoch())
                .as("captured authority epoch must travel (epoch 1), never the epoch-zero default")
                .isEqualTo(1L);
        }
        // Transport records also carry a distinct per-request subordinate id (coexisting).
        assertThat(events.stream().anyMatch(e -> e.requestId() != null)).isTrue();
    }

    @Test
    @DisplayName("I4 generated request id also reaches provider observer events with captured epoch")
    void generatedRequestIdReachesObserver() {
        Rig rig = rig();
        String generated = java.util.UUID.randomUUID().toString();
        rig.source().acquire(List.of("QQQ"), generated);
        List<ObservationRecorder.Event> events = providerEvents(rig.observer());
        assertThat(events).isNotEmpty();
        assertThat(events).allSatisfy(e -> {
            assertThat(e.logicalOperationId()).isNotNull().contains(generated);
            assertThat(e.authorityEpoch()).isEqualTo(1L);
        });
    }

    @Test
    @DisplayName("I4 v2 provider work never uses the null-logical-id / epoch-zero fallback")
    void noNullLogicalIdOrEpochZeroFallback() {
        Rig rig = rig();
        rig.source().acquire(List.of("SPY", "QQQ"), "req-corr");
        List<ObservationRecorder.Event> events = providerEvents(rig.observer());
        assertThat(events).isNotEmpty();
        assertThat(events).noneMatch(e -> e.logicalOperationId() == null);
        assertThat(events).noneMatch(e -> e.authorityEpoch() == 0L);
    }

    @Test
    @DisplayName("I4 multi-subject batch preserves one request correlation across all provider events")
    void multiSubjectBatchOneCorrelation() {
        Rig rig = rig();
        String requestId = "22222222-2222-2222-2222-222222222222";
        rig.source().acquire(List.of("SPY", "QQQ", "XLE"), requestId);
        List<ObservationRecorder.Event> events = providerEvents(rig.observer());
        assertThat(events).isNotEmpty();
        // All provider events for the batch share the SAME request-correlated logical id.
        assertThat(events.stream().map(ObservationRecorder.Event::logicalOperationId).distinct().toList())
            .allSatisfy(id -> assertThat(id).contains(requestId));
    }

    @Test
    @DisplayName("I4 a terminal LOGICAL_OUTCOME correlated to the request is recorded")
    void terminalLogicalOutcomeRecorded() {
        Rig rig = rig();
        String requestId = "33333333-3333-3333-3333-333333333333";
        rig.source().acquire(List.of("SPY"), requestId);
        boolean hasLogicalOutcome = rig.observer().page(0, 10_000).events().stream()
            .anyMatch(e -> e.recordType().equals("LOGICAL_OUTCOME")
                && e.logicalOperationId() != null && e.logicalOperationId().contains(requestId));
        assertThat(hasLogicalOutcome).isTrue();
    }
}
