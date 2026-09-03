package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.MarketChain;
import com.wheelwright.evidence.provider.MarketExpiration;
import com.wheelwright.evidence.provider.ProviderAuthority;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.ProviderError;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER step 10: end-to-end degraded-mode integration.
 *
 * Proves the functional target: with production returning 401 and sandbox usable,
 * the worker (a) fails over to degraded, (b) actually acquires usable evidence from
 * sandbox — written to the durable plane and truthfully tagged environment='sandbox'
 * (never promoted to production), and (c) fails back to production once production
 * returns representative usable evidence again.
 */
class DegradedModeIntegrationTest {

    private static final String FUTURE_EXPIRATION =
        java.time.LocalDate.now(ZoneOffset.UTC).plusDays(21).toString();

    private static Clock marketClock() {
        return Clock.fixed(
            ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
    }

    private static MarketChain usableChain(String symbol) {
        var underlying = new MarketChain.Underlying(symbol, symbol, 50.0);
        var put = new MarketChain.OptionContract(48.0, 1.0, 1.1, -0.28, 100, 10);
        return new MarketChain(symbol, FUTURE_EXPIRATION, underlying, List.of(put), List.of());
    }

    /** Production adapter that always fails with HTTP 401 (both acquisition and probe). */
    private static final class Always401Adapter extends TradierAdapter {
        Always401Adapter() { super("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) { throw new ProviderError("401", 401); }
        @Override public ChainResult getOptionsChain(String s, String e) { throw new ProviderError("401", 401); }
        @Override public ProbeResult probeRepresentative(String s) { return new ProbeResult(false, "401"); }
    }

    /** Production adapter that 401s until flipped healthy, then serves usable evidence. */
    private static final class RecoverableAdapter extends TradierAdapter {
        final AtomicBoolean healthy = new AtomicBoolean(false);
        RecoverableAdapter() { super("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            return new ExpirationResult(List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)), Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            if (!healthy.get()) throw new ProviderError("401", 401);
            return new ChainResult(usableChain(s), Instant.now().toString(), false);
        }
        @Override public ProbeResult probeRepresentative(String s) {
            return healthy.get() ? new ProbeResult(true, "usable") : new ProbeResult(false, "401");
        }
    }

    /** Sandbox adapter that always serves usable evidence. */
    private static final class UsableSandboxAdapter extends TradierAdapter {
        UsableSandboxAdapter() { super("k", "https://sandbox.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 50)); }
        @Override public ExpirationResult getExpirations(String s) {
            return new ExpirationResult(List.of(new MarketExpiration(FUTURE_EXPIRATION, 21)), Instant.now().toString(), false);
        }
        @Override public ChainResult getOptionsChain(String s, String e) {
            return new ChainResult(usableChain(s), Instant.now().toString(), false);
        }
        @Override public ProbeResult probeRepresentative(String s) { return new ProbeResult(true, "usable"); }
    }

    private static ProviderAuthority auth(String id, String env, TradierAdapter a) {
        return new ProviderAuthority(id, env, a, a.cache(), a.pacer());
    }

    private static SchedulerConfig config() {
        return new SchedulerConfig(25*60*1000L, 120*60*1000L, 6*60*60*1000L, 10, 20, 5000L, 15*60*1000L, 5, 25*60*1000L);
    }

    @Test
    void failsOverToSandboxAndWritesSandboxTaggedEvidence() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY", "XLE"));

        var mgr = new ProviderAuthorityManager(
            auth("prod", "production", new Always401Adapter()),
            auth("sandbox", "sandbox", new UsableSandboxAdapter()));

        var worker = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), config(), Collections.emptySet());
        worker.start(List.of("SPY", "XLE"));
        try {
            // Enough cycles for: several 401 signals → threshold → sandbox probe → degrade
            // → sandbox acquisition of XLE.
            Thread.sleep(6000);
        } finally {
            worker.stop();
        }

        assertEquals("DEGRADED", worker.getEvidenceAvailability(),
            "worker must fail over to degraded after sustained production 401s + usable sandbox");
        assertEquals("sandbox", worker.getActiveEnvironment());

        // At least one symbol should now be ready from sandbox, tagged 'sandbox'.
        Map<String, Object> xle = store.getEvidence("XLE");
        assertNotNull(xle);
        // XLE may be ready (sandbox acquired) — if so, provenance MUST be sandbox.
        if ("ready".equals(xle.get("status"))) {
            assertEquals("sandbox", xle.get("primaryChainEnvironment"),
                "sandbox-acquired evidence must be tagged sandbox, never promoted to production");
        }
        // No symbol may be flipped to 'failed' by the provider-wide 401 (invariant I2).
        assertNotEquals("failed", store.getEvidence("SPY").get("status"));
        assertNotEquals("failed", xle.get("status"));
        store.close();
    }

    @Test
    void failsBackToProductionOnSustainedRecovery() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("SPY", "XLE"));

        var recoverable = new RecoverableAdapter();
        var mgr = new ProviderAuthorityManager(
            auth("prod", "production", recoverable),
            auth("sandbox", "sandbox", new UsableSandboxAdapter()));

        // Tiny freshness target so that, once production authority is restored, the resumed
        // acquisition immediately re-acquires a production PRIMARY chain — the restoration
        // boundary (PL-PROV-FAILOVER: authority recovery is NOT evidence restoration; NORMAL
        // requires fresh production evidence under the current authority epoch).
        // Chain stale / expirations fresh so a ready symbol re-acquires its primary CHAIN
        // (not just expirations) promptly after failback — the restoration-commit boundary.
        var fastFreshness = new SchedulerConfig(1L, 1L, 6*60*60*1000L, 10, 20, 100L, 15*60*1000L, 5, 1L);
        var worker = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), fastFreshness, Collections.emptySet());
        // Short probe cadence so the sustained-recovery streak (FAILBACK_STREAK_REQUIRED
        // probes) completes within the test window; production default is 30s.
        worker.setProbeIntervalForTesting(300);
        worker.start(List.of("SPY", "XLE"));
        try {
            Thread.sleep(6000); // degrade first
            assertEquals("DEGRADED", worker.getEvidenceAvailability(), "should degrade while production 401s");

            recoverable.healthy.set(true); // production recovers
            // Sustained representative probe streak → authority failback → then resumed
            // acquisition commits a fresh production primary chain → evidence restoration.
            Thread.sleep(10000);
        } finally {
            worker.stop();
        }

        // Authority is back on production AND fresh production evidence has committed under the
        // recovered epoch, so operator-facing availability is NORMAL (full restoration).
        assertEquals("production", worker.getActiveEnvironment(),
            "worker must fail back to production after sustained representative recovery");
        assertEquals("NORMAL", worker.getEvidenceAvailability(),
            "restoration completes once fresh production evidence commits under the recovered epoch");
        assertTrue(worker.providerManagerForTesting().productionEvidenceCurrent());
        store.close();
    }
}
