package com.wheelwright.evidence.db;

import org.junit.jupiter.api.*;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Structural classification tests for classifyFromChain.
 *
 * Proves:
 * - Each put contract is evaluated atomically
 * - Qualifying attributes distributed across SEPARATE contracts do NOT qualify
 * - All four criteria must be met on the SAME contract
 * - Edge cases: empty puts, null chain, DTE boundaries
 */
class ClassifyFromChainTest {

    private SqliteEvidenceStore store;

    /** Expiration that produces DTE=21 from today */
    private String validExpiration() {
        return LocalDate.now().plusDays(21).toString();
    }

    /** Expiration that produces DTE=3 (too short) */
    private String tooSoonExpiration() {
        return LocalDate.now().plusDays(3).toString();
    }

    /** Expiration that produces DTE=50 (too far) */
    private String tooFarExpiration() {
        return LocalDate.now().plusDays(50).toString();
    }

    @BeforeEach
    void setup() throws SQLException {
        store = new SqliteEvidenceStore(":memory:");
    }

    @AfterEach
    void teardown() throws SQLException {
        store.close();
    }

    // --- Positive cases ---

    @Test
    @DisplayName("single qualifying put contract → Class A")
    void singleQualifyingPut() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.28,"openInterest":520,"volume":110}""");
        assertTrue(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("multiple puts, one qualifying → Class A")
    void multipleOnlyOneQualifies() {
        String chain = chainWith("""
            {"strike":50,"bid":0,"ask":0.05,"delta":-0.10,"openInterest":0,"volume":0},\
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.28,"openInterest":520,"volume":110}""");
        assertTrue(store.classifyFromChain(chain, validExpiration()));
    }

    // --- Adversarial: distributed attributes across contracts ---

    @Test
    @DisplayName("ADVERSARIAL: qualifying bid on contract 1, qualifying delta on contract 2 → NOT Class A")
    void distributedBidAndDelta() {
        // Contract 1: good bid (1.50), but delta too low (0.05) and OI=0
        // Contract 2: good delta (-0.28), but bid=0
        // Neither contract alone satisfies all criteria
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.05,"openInterest":0,"volume":0},\
            {"strike":60,"bid":0,"ask":0.10,"delta":-0.28,"openInterest":520,"volume":50}""");
        assertFalse(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("ADVERSARIAL: qualifying delta+OI on contract 1, qualifying bid on contract 2 → NOT Class A")
    void distributedDeltaOiAndBid() {
        // Contract 1: good delta (-0.25) and good OI (100), but bid=0
        // Contract 2: good bid (2.00), but delta too low (-0.05) and OI=0
        String chain = chainWith("""
            {"strike":55,"bid":0,"ask":0.10,"delta":-0.25,"openInterest":100,"volume":10},\
            {"strike":60,"bid":2.00,"ask":2.30,"delta":-0.05,"openInterest":0,"volume":0}""");
        assertFalse(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("ADVERSARIAL: qualifying bid+delta on contract 1, qualifying OI on contract 2 → NOT Class A")
    void distributedBidDeltaAndOi() {
        // Contract 1: good bid (1.50) and good delta (-0.28), but OI=0
        // Contract 2: good OI (500), but bid=0 and delta too low
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.28,"openInterest":0,"volume":0},\
            {"strike":60,"bid":0,"ask":0.05,"delta":-0.08,"openInterest":500,"volume":100}""");
        assertFalse(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("ADVERSARIAL: each contract has exactly one qualifying attribute → NOT Class A")
    void eachContractOnlyOneQualifying() {
        // Contract 1: only bid qualifies (delta too low, OI=0)
        // Contract 2: only delta qualifies (bid=0, OI=0)
        // Contract 3: only OI qualifies (bid=0, delta too low)
        String chain = chainWith("""
            {"strike":50,"bid":1.50,"ask":1.70,"delta":-0.05,"openInterest":0,"volume":0},\
            {"strike":55,"bid":0,"ask":0.10,"delta":-0.28,"openInterest":0,"volume":0},\
            {"strike":60,"bid":0,"ask":0.05,"delta":-0.05,"openInterest":500,"volume":100}""");
        assertFalse(store.classifyFromChain(chain, validExpiration()));
    }

    // --- Negative cases: boundary conditions ---

    @Test
    @DisplayName("null chain data → not Class A")
    void nullChainData() {
        assertFalse(store.classifyFromChain(null, validExpiration()));
    }

    @Test
    @DisplayName("null expiration → not Class A")
    void nullExpiration() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.28,"openInterest":520,"volume":110}""");
        assertFalse(store.classifyFromChain(chain, null));
    }

    @Test
    @DisplayName("DTE too short (< 7) → not Class A")
    void dteTooShort() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.28,"openInterest":520,"volume":110}""");
        assertFalse(store.classifyFromChain(chain, tooSoonExpiration()));
    }

    @Test
    @DisplayName("DTE too far (> 45) → not Class A")
    void dteTooFar() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.28,"openInterest":520,"volume":110}""");
        assertFalse(store.classifyFromChain(chain, tooFarExpiration()));
    }

    @Test
    @DisplayName("empty puts array → not Class A")
    void emptyPuts() {
        String chain = "{\"puts\":[],\"calls\":[]}";
        assertFalse(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("delta exactly at boundary 0.15 → qualifies")
    void deltaAtLowerBoundary() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.15,"openInterest":100,"volume":10}""");
        assertTrue(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("delta exactly at boundary 0.50 → qualifies")
    void deltaAtUpperBoundary() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.50,"openInterest":100,"volume":10}""");
        assertTrue(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("delta just outside boundary 0.14 → does not qualify")
    void deltaBelowLowerBoundary() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.14,"openInterest":100,"volume":10}""");
        assertFalse(store.classifyFromChain(chain, validExpiration()));
    }

    @Test
    @DisplayName("delta just outside boundary 0.51 → does not qualify")
    void deltaAboveUpperBoundary() {
        String chain = chainWith("""
            {"strike":55,"bid":1.50,"ask":1.70,"delta":-0.51,"openInterest":100,"volume":10}""");
        assertFalse(store.classifyFromChain(chain, validExpiration()));
    }

    // --- Helper ---

    private String chainWith(String putsContent) {
        return "{\"puts\":[" + putsContent + "],\"calls\":[]}";
    }
}
