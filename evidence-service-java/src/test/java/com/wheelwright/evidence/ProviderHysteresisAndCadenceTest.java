package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.ProviderError;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER correction blockers:
 *  - #8 provider-unusable hysteresis is SUSTAINED/CONSECUTIVE and RESETS on a
 *    representative (successful) acquisition — isolated/interleaved 401s never
 *    accumulate into a spurious failover.
 *  - #9 secondary-chain provider-WIDE failures route through provider control
 *    (provider-unusable signal), not per-symbol lifecycle.
 *  - #10 recovery-probe cadence is EXPLICIT and deterministically testable.
 */
class ProviderHysteresisAndCadenceTest {

    private static final String FUTURE_EXPIRATION =
        java.time.LocalDate.now(ZoneOffset.UTC).plusDays(21).toString();
    // Two eligible expirations so acquireAllEligibleChains has a PRIMARY + one SECONDARY.
    private static final String TWO_EXPIRATIONS_JSON =
        "[{\"date\":\"" + FUTURE_EXPIRATION + "\",\"dte\":21},"
      + "{\"date\":\"" + java.time.LocalDate.now(ZoneOffset.UTC).plusDays(28) + "\",\"dte\":28}]";

    private static Clock marketClock() {
        return Clock.fixed(
            ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(),
            ZoneOffset.UTC);
    }

    private static SchedulerConfig workerConfig() {
        return new SchedulerConfig(
            25 * 60 * 1000L, 120 * 60 * 1000L, 6 * 60 * 60 * 1000L,
            10, 20, 5000L, 15 * 60 * 1000L, 5, 25 * 60 * 1000L);
    }

    // --- #10: explicit recovery-probe cadence ---

    @Test
    void recoveryProbeCadenceIsExplicitAndDeterministic() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("XLE"));
        var worker = new AcquisitionWorker(
            new TradierAdapter("k", "https://localhost", new ResponseCache(), new RequestPacer(100, 10)),
            store, new SessionGate(marketClock()), workerConfig());

        AtomicLong fakeNanos = new AtomicLong(0);
        worker.setProbeClockForTesting(fakeNanos::get);

        long intervalMs = worker.providerProbeIntervalMsForTesting();
        long intervalNanos = intervalMs * 1_000_000L;

        // Never probed yet → due immediately regardless of clock.
        assertTrue(worker.recoveryProbeDue(), "first probe is always due");

        // Mark a probe at t = 1s.
        long probeAt = 1_000_000_000L;
        fakeNanos.set(probeAt);
        worker.setLastProbeAtNanosForTesting(probeAt);

        // Immediately after: NOT due.
        assertFalse(worker.recoveryProbeDue(), "not due immediately after a probe");

        // Just before the interval elapses: still NOT due.
        fakeNanos.set(probeAt + intervalNanos - 1_000_000L); // 1ms short
        assertFalse(worker.recoveryProbeDue(), "not due 1ms before the interval elapses");

        // Exactly at the interval: due.
        fakeNanos.set(probeAt + intervalNanos);
        assertTrue(worker.recoveryProbeDue(), "due exactly at the configured interval");

        // Well past the interval: due.
        fakeNanos.set(probeAt + intervalNanos * 3);
        assertTrue(worker.recoveryProbeDue(), "due after the interval");

        store.close();
    }

    // --- #9: secondary-chain provider-wide failure routes to provider control ---

    /**
     * Adapter whose PRIMARY chain succeeds but a SECONDARY expiration returns HTTP 401.
     * The old behavior swallowed this as a per-expiration skip; the fix must record it as
     * a provider-unusable signal (provider-wide condition surfacing on a secondary chain).
     */
    private static final class SecondaryChain401Adapter extends TradierAdapter {
        private final String primary;
        SecondaryChain401Adapter(String primary) {
            super("k", "https://localhost", new ResponseCache(), new RequestPacer(100, 10));
            this.primary = primary;
        }
        @Override public ChainResult getOptionsChain(String symbol, String expiration) {
            if (expiration.equals(primary)) {
                var underlying = new com.wheelwright.evidence.provider.MarketChain.Underlying(symbol, symbol, 100.0);
                var contract = new com.wheelwright.evidence.provider.MarketChain.OptionContract(100.0, 1.0, 1.1, -0.30, 10, 5);
                var chain = new com.wheelwright.evidence.provider.MarketChain(
                    symbol, expiration, underlying, List.of(contract), List.of(contract));
                return new ChainResult(chain, java.time.Instant.now().toString(), false);
            }
            // Secondary expiration → provider-wide 401.
            throw new ProviderError("Tradier returned 401", 401);
        }
    }

    @Test
    void secondaryChainProviderWideFailureBecomesProviderSignalNotSymbolFailure() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        store.initUniverse(List.of("XLE"));
        // expirations_known with TWO eligible expirations → acquireAllEligibleChains runs
        // primary (succeeds) then a secondary (401).
        store.setExpirations("XLE", TWO_EXPIRATIONS_JSON, java.time.Instant.now().toString());

        var worker = new AcquisitionWorker(
            new SecondaryChain401Adapter(FUTURE_EXPIRATION), store,
            new SessionGate(marketClock()), workerConfig());
        worker.start(List.of("XLE"));
        try {
            Thread.sleep(2000);
        } finally {
            worker.stop();
        }

        var ev = store.getEvidence("XLE");
        assertNotNull(ev);
        // Primary committed → symbol advanced to ready; secondary 401 must NOT flip it failed.
        assertNotEquals("failed", ev.get("status"),
            "secondary-chain provider-wide 401 must not contaminate symbol lifecycle");
        assertEquals(0, (int) ev.get("failureCount"),
            "secondary-chain provider-wide 401 must not increment per-symbol failure_count");
        assertTrue(worker.getProviderUnusableSignals() > 0,
            "secondary-chain provider-wide 401 must be recorded as a provider-availability signal");
        store.close();
    }

    // --- #8: hysteresis resets on representative success ---

    @Test
    void consecutiveUnusableResetsOnSuccessfulAcquisition() throws Exception {
        var store = new SqliteEvidenceStore(":memory:");
        // Two symbols: one always 401 (provider-unusable), one that succeeds. Interleaving
        // their acquisition should keep the consecutive counter from ever reaching the
        // degrade threshold, because each success resets it.
        store.initUniverse(List.of("AAA", "BBB"));

        var flakyAdapter = new TradierAdapter("k", "https://localhost", new ResponseCache(), new RequestPacer(100, 10)) {
            @Override public ExpirationResult getExpirations(String symbol) {
                if ("AAA".equals(symbol)) {
                    throw new ProviderError("Tradier returned 401", 401); // provider-unusable
                }
                // BBB resolves to an eligible expiration (success path).
                return new ExpirationResult(
                    List.of(new com.wheelwright.evidence.provider.MarketExpiration(FUTURE_EXPIRATION, 21)),
                    java.time.Instant.now().toString(), false);
            }
            @Override public ChainResult getOptionsChain(String symbol, String expiration) {
                var underlying = new com.wheelwright.evidence.provider.MarketChain.Underlying(symbol, symbol, 100.0);
                var contract = new com.wheelwright.evidence.provider.MarketChain.OptionContract(100.0, 1.0, 1.1, -0.30, 10, 5);
                var chain = new com.wheelwright.evidence.provider.MarketChain(
                    symbol, expiration, underlying, List.of(contract), List.of(contract));
                return new ChainResult(chain, java.time.Instant.now().toString(), false);
            }
        };

        var worker = new AcquisitionWorker(flakyAdapter, store,
            new SessionGate(marketClock()), workerConfig());
        worker.start(List.of("AAA", "BBB"));
        try {
            Thread.sleep(2500);
        } finally {
            worker.stop();
        }

        // BBB must have committed successfully at least once (proves the success path ran
        // and therefore reset the consecutive counter between AAA failures).
        var bbb = store.getEvidence("BBB");
        assertNotNull(bbb);
        assertNotEquals("failed", bbb.get("status"));
        // The consecutive-unusable run must stay strictly below the degrade threshold (5),
        // because interleaved successes keep resetting it. Cumulative signals may be > 0.
        assertTrue(worker.consecutiveProviderUnusableForTesting() < 5,
            "interleaved successes must keep the consecutive-unusable run below the degrade threshold; was "
                + worker.consecutiveProviderUnusableForTesting());
        assertTrue(worker.getProviderUnusableSignals() > 0,
            "cumulative provider-unusable telemetry still records the AAA 401s");
        store.close();
    }
}
