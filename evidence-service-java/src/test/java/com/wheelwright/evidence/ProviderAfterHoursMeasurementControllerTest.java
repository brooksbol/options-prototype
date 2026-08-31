package com.wheelwright.evidence;

import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProviderAfterHoursMeasurementControllerTest {

    private final RequestPacer pacer = new RequestPacer(120, 20);

    @AfterEach
    void tearDown() {
        pacer.shutdown();
    }

    @Test
    void isBoundedAndDoesNotPersistOrCache() throws Exception {
        var adapter = new StubAdapter(pacer);
        var controller = new ProviderAfterHoursMeasurementController(adapter, pacer);

        var result = controller.run(3, "SPY");

        assertEquals(3, result.get("completed"));
        assertEquals(3, adapter.calls);
        assertFalse((Boolean) result.get("evidencePersisted"));
        assertFalse((Boolean) result.get("cacheMutated"));
        assertThrows(IllegalArgumentException.class, () -> controller.run(121, "SPY"));
    }

    private static final class StubAdapter extends TradierAdapter {
        int calls;

        StubAdapter(RequestPacer pacer) {
            super("test-key", "https://example.invalid", new ResponseCache(), pacer);
        }

        @Override
        public int measureUncachedQuote(String symbol) {
            calls++;
            return 42;
        }
    }
}
