package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ObserveController lifecycle tests — the held-expiration declaration contract and
 * the empty-portfolio clear path (PR #19 review blocker).
 *
 * The controller depends only on SqliteEvidenceStore, so these run against an
 * in-memory store with no Spring context.
 */
class ObserveControllerTest {

    private SqliteEvidenceStore store;
    private ObserveController controller;

    @BeforeEach
    void setUp() throws Exception {
        store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("GDXJ", "SMH", "EWY"));
        controller = new ObserveController(store);
    }

    @AfterEach
    void tearDown() throws Exception {
        store.close();
    }

    private static Map<String, Object> heldPair(String symbol, String expiration) {
        return Map.of("symbol", symbol, "expiration", expiration);
    }

    @Nested
    @DisplayName("heldExpirations declaration lifecycle (present vs omitted)")
    class HeldExpirationLifecycle {

        @Test
        @DisplayName("present with pairs → replaces the held set")
        void presentPairsReplaces() throws Exception {
            controller.observe(Map.of(
                "symbols", List.of("GDXJ"),
                "heldExpirations", List.of(heldPair("GDXJ", "2026-09-11"))
            ));
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"));
        }

        @Test
        @DisplayName("OMITTED → leaves the existing held set UNCHANGED (does not clear)")
        void omittedLeavesUnchanged() throws Exception {
            // First declare a held expiration.
            controller.observe(Map.of(
                "symbols", List.of("GDXJ"),
                "heldExpirations", List.of(heldPair("GDXJ", "2026-09-11"))
            ));
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"));

            // A later request WITHOUT the heldExpirations field (e.g. older client or a
            // symbols-only update) must NOT erase the held demand.
            ResponseEntity<Map<String, Object>> resp = controller.observe(Map.of(
                "symbols", List.of("GDXJ", "SMH")
            ));
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"),
                "omitted heldExpirations must leave held demand intact");
            assertEquals(-1, resp.getBody().get("heldExpirations"),
                "omitted → sentinel -1 (not written)");
        }

        @Test
        @DisplayName("present as [] → explicitly clears the held set")
        void emptyListClears() throws Exception {
            controller.observe(Map.of(
                "symbols", List.of("GDXJ"),
                "heldExpirations", List.of(heldPair("GDXJ", "2026-09-11"))
            ));
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"));

            controller.observe(Map.of(
                "symbols", List.of("GDXJ"),
                "heldExpirations", List.of()
            ));
            assertEquals(List.of(), store.getHeldExpirations("GDXJ"),
                "explicit [] clears held demand");
        }
    }

    @Nested
    @DisplayName("empty-portfolio clear path")
    class EmptyPortfolioClear {

        @Test
        @DisplayName("symbols:[] + heldExpirations:[] clears monitored and held demand")
        void emptyDeclarationClearsBoth() throws Exception {
            controller.observe(Map.of(
                "symbols", List.of("GDXJ", "SMH"),
                "heldExpirations", List.of(heldPair("GDXJ", "2026-09-11"), heldPair("SMH", "2026-09-15"))
            ));
            assertFalse(store.getMonitoredSymbols().isEmpty());
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"));

            // Portfolio becomes empty — explicit clear declaration.
            ResponseEntity<Map<String, Object>> resp = controller.observe(Map.of(
                "symbols", List.of(),
                "heldExpirations", List.of()
            ));
            assertEquals(200, resp.getStatusCode().value(), "empty declaration is valid (not a 400)");
            assertTrue(store.getMonitoredSymbols().isEmpty(), "monitored set cleared");
            assertEquals(List.of(), store.getHeldExpirations("GDXJ"), "held demand cleared");
            assertEquals(List.of(), store.getHeldExpirations("SMH"), "held demand cleared");
        }

        @Test
        @DisplayName("missing 'symbols' entirely is a 400 bad request")
        void missingSymbolsIsBadRequest() throws Exception {
            ResponseEntity<Map<String, Object>> resp = controller.observe(Map.of(
                "heldExpirations", List.of()
            ));
            assertEquals(400, resp.getStatusCode().value());
        }
    }
}
