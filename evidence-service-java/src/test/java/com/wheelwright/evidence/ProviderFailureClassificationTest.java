package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.ProviderError;
import com.wheelwright.evidence.provider.ProviderOutcome;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER constraint 3 regression: provider-WIDE unusability (first
 * classifier: confirmed HTTP 401) must be classified as provider unusability,
 * must survive exception wrapping (the primary-chain path wraps a ProviderError
 * in a RuntimeException), and must NEVER reach store.setFailure() / per-symbol
 * failure accounting (invariant I2 — provider availability != symbol quality).
 */
class ProviderFailureClassificationTest {

    private static final String FUTURE_EXPIRATION =
        java.time.LocalDate.now(ZoneOffset.UTC).plusDays(21).toString();
    private static final String EXPIRATIONS_JSON =
        "[{\"date\":\"" + FUTURE_EXPIRATION + "\",\"dte\":21}]";

    // Tuesday 11:00 ET — FULL acquisition posture.
    private static Clock marketClock() {
        return Clock.fixed(
            ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(),
            ZoneOffset.UTC);
    }

    // --- Layer 1: pure classifier ---

    @Test
    void directProviderError401IsProviderUnusable() {
        assertEquals(ProviderOutcome.PROVIDER_UNUSABLE,
            ProviderOutcome.classify(new ProviderError("Tradier returned 401", 401)));
    }

    @Test
    void wrapped401IsStillProviderUnusable() {
        // Mirrors AcquisitionWorker.acquireAllEligibleChains, which wraps a primary-chain
        // ProviderError in a RuntimeException.
        Throwable wrapped = new RuntimeException("Primary chain failed: XLE/2026-01-01",
            new ProviderError("Tradier returned 401", 401));
        assertEquals(ProviderOutcome.PROVIDER_UNUSABLE, ProviderOutcome.classify(wrapped));

        // Double-wrapped for good measure.
        Throwable doubleWrapped = new RuntimeException("cycle error", wrapped);
        assertEquals(ProviderOutcome.PROVIDER_UNUSABLE, ProviderOutcome.classify(doubleWrapped));
    }

    @Test
    void non401ProviderErrorsAreNotProviderUnusable() {
        // 429 is ordinary throttling (pacer backoff), NOT failover.
        assertEquals(ProviderOutcome.SYMBOL_QUALITY_FAILURE,
            ProviderOutcome.classify(new ProviderError("Rate limited", 429, 60000L)));
        // 500 / 503 are not the first (and only) demonstrated provider-unusable classifier.
        assertEquals(ProviderOutcome.SYMBOL_QUALITY_FAILURE,
            ProviderOutcome.classify(new ProviderError("Tradier returned 500", 500)));
        assertEquals(ProviderOutcome.SYMBOL_QUALITY_FAILURE,
            ProviderOutcome.classify(new ProviderError("queue full", 503)));
    }

    @Test
    void nonProviderExceptionsAreSymbolQualityFailures() {
        assertEquals(ProviderOutcome.SYMBOL_QUALITY_FAILURE,
            ProviderOutcome.classify(new RuntimeException("some parse error")));
        assertEquals(ProviderOutcome.SYMBOL_QUALITY_FAILURE,
            ProviderOutcome.classify(new java.io.IOException("network")));
    }

    // --- Layer 2: worker path — 401 must not contaminate symbol lifecycle ---

    /** Adapter that always fails with a direct HTTP 401 on the expirations path. */
    private static final class Direct401Adapter extends TradierAdapter {
        Direct401Adapter() { super("k", "https://localhost", new ResponseCache(), new RequestPacer(100, 10)); }
        @Override public TradierAdapter.ExpirationResult getExpirations(String symbol) {
            throw new ProviderError("Tradier returned 401", 401);
        }
        @Override public TradierAdapter.ChainResult getOptionsChain(String symbol, String expiration) {
            throw new ProviderError("Tradier returned 401", 401);
        }
    }

    @Test
    void providerWide401DoesNotCallSetFailureOnPendingSymbol() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("XLE")); // pending → expirations path → direct 401
        int failuresBefore = store.getEvidence("XLE") != null
            ? (int) store.getEvidence("XLE").get("failureCount") : 0;

        var worker = new AcquisitionWorker(new Direct401Adapter(), store,
            new SessionGate(marketClock()), workerConfig());
        worker.start(List.of("XLE"));
        try {
            // Allow several cycles: under the OLD behavior this would push failure_count
            // toward 3 and flip resolution='failed'. Under the fix it must stay clean.
            Thread.sleep(2500);
        } finally {
            worker.stop();
        }

        var ev = store.getEvidence("XLE");
        assertNotNull(ev);
        assertEquals(0, (int) ev.get("failureCount"),
            "provider-wide 401 must NOT increment per-symbol failure_count");
        assertNotEquals("failed", ev.get("status"),
            "provider-wide 401 must NOT flip symbol resolution to failed");
        assertTrue(worker.getProviderUnusableSignals() > 0,
            "provider-wide 401 must be recorded as a provider-availability signal");
        assertEquals(failuresBefore, 0);
        store.close();
    }

    @Test
    void wrapped401OnPrimaryChainDoesNotCallSetFailure() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("XLE"));
        // Put XLE into expirations_known so acquireAllEligibleChains runs and WRAPS the
        // primary-chain ProviderError(401) in a RuntimeException — the exact wrapping path.
        store.setExpirations("XLE", EXPIRATIONS_JSON, java.time.Instant.now().toString());

        var worker = new AcquisitionWorker(new Direct401Adapter(), store,
            new SessionGate(marketClock()), workerConfig());
        worker.start(List.of("XLE"));
        try {
            Thread.sleep(2500);
        } finally {
            worker.stop();
        }

        var ev = store.getEvidence("XLE");
        assertNotNull(ev);
        assertEquals(0, (int) ev.get("failureCount"),
            "wrapped provider-wide 401 must NOT increment per-symbol failure_count");
        assertNotEquals("failed", ev.get("status"),
            "wrapped provider-wide 401 must NOT flip symbol resolution to failed");
        assertTrue(worker.getProviderUnusableSignals() > 0,
            "wrapped provider-wide 401 must be recorded as a provider-availability signal");
        store.close();
    }

    private static SchedulerConfig workerConfig() {
        return new SchedulerConfig(
            25 * 60 * 1000L, 120 * 60 * 1000L, 6 * 60 * 60 * 1000L,
            10, 20, 5000L, 15 * 60 * 1000L, 5, 25 * 60 * 1000L);
    }
}
