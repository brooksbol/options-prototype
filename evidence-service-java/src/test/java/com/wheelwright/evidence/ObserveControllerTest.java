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

    @Nested
    @DisplayName("malformed request validation (400, never 500/ClassCastException)")
    class MalformedRequestValidation {

        @Test
        @DisplayName("'symbols' as a bare string is a 400 (not a ClassCastException)")
        void symbolsAsStringIsBadRequest() {
            // A bare string is not a list. Must be rejected cleanly, not cast-and-crash.
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("symbols", "GDXJ");
            assertDoesNotThrow(() -> {
                ResponseEntity<Map<String, Object>> resp = controller.observe(body);
                assertEquals(400, resp.getStatusCode().value());
            });
        }

        @Test
        @DisplayName("'symbols' list with non-string members is a 400 (not a ClassCastException)")
        void symbolsWithNonStringMembersIsBadRequest() {
            // Mixed member types must be rejected before the toUpperCase() map.
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("symbols", java.util.Arrays.asList("GDXJ", 42, true));
            assertDoesNotThrow(() -> {
                ResponseEntity<Map<String, Object>> resp = controller.observe(body);
                assertEquals(400, resp.getStatusCode().value());
            });
        }
    }

    @Nested
    @DisplayName("held-expiration validation is strict and ATOMIC (malformed → 400, no state mutation)")
    class HeldExpirationAtomicValidation {

        /** Seed a known-good monitored + held state, then assert a malformed request leaves it intact. */
        private void seedKnownState() throws Exception {
            controller.observe(Map.of(
                "symbols", List.of("GDXJ", "SMH"),
                "heldExpirations", List.of(heldPair("GDXJ", "2026-09-11"))
            ));
            assertEquals(List.of("GDXJ", "SMH"), store.getMonitoredSymbols());
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"));
        }

        private void assertStateUnchanged() throws Exception {
            assertEquals(List.of("GDXJ", "SMH"), store.getMonitoredSymbols(),
                "monitored set must be unchanged after a rejected request");
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"),
                "held set must be unchanged after a rejected request");
        }

        @Test
        @DisplayName("'heldExpirations' as a bare string → 400, no state mutation")
        void heldAsStringIsBadRequestNoMutation() throws Exception {
            seedKnownState();
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("symbols", List.of("NEWSYM")); // would change monitored IF applied
            body.put("heldExpirations", "bad");
            ResponseEntity<Map<String, Object>> resp = controller.observe(body);
            assertEquals(400, resp.getStatusCode().value());
            assertStateUnchanged();
        }

        @Test
        @DisplayName("malformed held member (non-object) → 400, no state mutation")
        void malformedMemberIsBadRequestNoMutation() throws Exception {
            seedKnownState();
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("symbols", List.of("NEWSYM"));
            body.put("heldExpirations", java.util.Arrays.asList("not-an-object"));
            ResponseEntity<Map<String, Object>> resp = controller.observe(body);
            assertEquals(400, resp.getStatusCode().value());
            assertStateUnchanged();
        }

        @Test
        @DisplayName("incomplete pair (missing 'expiration') → 400, no state mutation")
        void incompletePairIsBadRequestNoMutation() throws Exception {
            seedKnownState();
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("symbols", List.of("NEWSYM"));
            body.put("heldExpirations", List.of(Map.of("symbol", "GDXJ")));
            ResponseEntity<Map<String, Object>> resp = controller.observe(body);
            assertEquals(400, resp.getStatusCode().value());
            assertStateUnchanged();
        }

        @Test
        @DisplayName("mixed valid + invalid members → 400, NO partial replacement")
        void mixedValidInvalidIsBadRequestNoPartialReplace() throws Exception {
            seedKnownState();
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("symbols", List.of("NEWSYM"));
            // First entry is valid; second is malformed. The whole request must fail with no
            // partial application — the original held set must remain exactly as seeded.
            body.put("heldExpirations", java.util.Arrays.asList(
                heldPair("WEAT", "2026-10-16"),
                Map.of("symbol", "SLV") // incomplete
            ));
            ResponseEntity<Map<String, Object>> resp = controller.observe(body);
            assertEquals(400, resp.getStatusCode().value());
            assertStateUnchanged();
            assertEquals(List.of(), store.getHeldExpirations("WEAT"),
                "the valid member of a rejected mixed list must NOT be partially applied");
        }

        @Test
        @DisplayName("non-string pair field (numeric expiration) → 400, no state mutation")
        void nonStringPairFieldIsBadRequestNoMutation() throws Exception {
            seedKnownState();
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("symbols", List.of("NEWSYM"));
            // 'expiration' is a number, not a string → must be rejected (instanceof guard).
            Map<String, Object> badPair = new java.util.HashMap<>();
            badPair.put("symbol", "GDXJ");
            badPair.put("expiration", 20260911);
            body.put("heldExpirations", java.util.List.of(badPair));
            ResponseEntity<Map<String, Object>> resp = controller.observe(body);
            assertEquals(400, resp.getStatusCode().value());
            assertStateUnchanged();
        }

        @Test
        @DisplayName("blank / whitespace-only pair fields → 400, no state mutation")
        void blankPairFieldsAreBadRequestNoMutation() throws Exception {
            seedKnownState();
            // Blank symbol.
            Map<String, Object> blankSymbol = new java.util.HashMap<>();
            blankSymbol.put("symbols", List.of("NEWSYM"));
            blankSymbol.put("heldExpirations", List.of(heldPair("   ", "2026-09-11")));
            ResponseEntity<Map<String, Object>> r1 = controller.observe(blankSymbol);
            assertEquals(400, r1.getStatusCode().value());
            assertStateUnchanged();

            // Whitespace-only expiration.
            Map<String, Object> blankExp = new java.util.HashMap<>();
            blankExp.put("symbols", List.of("NEWSYM"));
            blankExp.put("heldExpirations", List.of(heldPair("GDXJ", "  ")));
            ResponseEntity<Map<String, Object>> r2 = controller.observe(blankExp);
            assertEquals(400, r2.getStatusCode().value());
            assertStateUnchanged();
        }

        @Test
        @DisplayName("valid [] still clears; omitted still leaves unchanged")
        void validEmptyClearsAndOmittedLeavesUnchanged() throws Exception {
            seedKnownState();

            // omitted → unchanged
            controller.observe(Map.of("symbols", List.of("GDXJ", "SMH")));
            assertEquals(List.of("2026-09-11"), store.getHeldExpirations("GDXJ"),
                "omitted heldExpirations leaves held demand intact");

            // valid [] → clears
            controller.observe(Map.of("symbols", List.of("GDXJ", "SMH"), "heldExpirations", List.of()));
            assertEquals(List.of(), store.getHeldExpirations("GDXJ"), "explicit [] clears");
        }
    }
}
