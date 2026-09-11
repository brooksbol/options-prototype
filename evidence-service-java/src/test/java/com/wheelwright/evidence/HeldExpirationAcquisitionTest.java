package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.MarketChain;
import com.wheelwright.evidence.provider.MarketExpiration;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Held-expiration acquisition regression test (migration 007 / PR #19 review blocker #4).
 *
 * Proves the WORKER actually acquires a HELD expiration that sits BELOW the normal 7-45 DTE
 * Deployment eligibility window — and that an UNRELATED non-held sub-7-DTE expiration is NOT
 * acquired. Runtime CSV evidence is useful acceptance, but this locks the behavior in an
 * automated regression.
 */
class HeldExpirationAcquisitionTest {

    // Three expirations for the symbol:
    //   - IN_WINDOW (21 DTE): normal eligible expiration (acquired by base eligibility)
    //   - HELD_NEAR (3 DTE):  BELOW the 7-DTE window; acquired ONLY because it is held
    //   - UNHELD_NEAR (2 DTE): BELOW the window and NOT held; must remain excluded
    private static final String IN_WINDOW   = LocalDate.now(ZoneOffset.UTC).plusDays(21).toString();
    private static final String HELD_NEAR   = LocalDate.now(ZoneOffset.UTC).plusDays(3).toString();
    private static final String UNHELD_NEAR = LocalDate.now(ZoneOffset.UTC).plusDays(2).toString();

    /** Regular observation — acquisition is FULL. */
    private static Clock marketClock() {
        return Clock.fixed(ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
    }

    private static SchedulerConfig config() {
        return new SchedulerConfig(25*60*1000L, 120*60*1000L, 6*60*60*1000L, 10, 20, 5000L, 15*60*1000L, 5, 25*60*1000L);
    }

    private static MarketChain chainFor(String symbol, String expiration) {
        return new MarketChain(symbol, expiration, new MarketChain.Underlying(symbol, symbol, 50.0),
            List.of(new MarketChain.OptionContract(48, 1.0, 1.1, -0.28, 0.02, -0.01, 0.03, 0.01, 100, 10)),
            List.of());
    }

    /**
     * Fake adapter listing all three expirations and recording which expirations were
     * actually fetched via getOptionsChain.
     */
    private static final class RecordingAdapter extends TradierAdapter {
        final Set<String> fetchedExpirations = ConcurrentHashMap.newKeySet();
        RecordingAdapter() { super("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(1000, 20)); }

        @Override public ExpirationResult getExpirations(String symbol) {
            return new ExpirationResult(List.of(
                new MarketExpiration(HELD_NEAR, 3),
                new MarketExpiration(UNHELD_NEAR, 2),
                new MarketExpiration(IN_WINDOW, 21)
            ), Instant.now().toString(), false);
        }

        @Override public ChainResult getOptionsChain(String symbol, String expiration) {
            fetchedExpirations.add(expiration);
            return new ChainResult(chainFor(symbol, expiration), Instant.now().toString(), false);
        }
    }

    private static void runOnce(AcquisitionWorker w, List<String> universe) throws Exception {
        w.start(universe);
        try { Thread.sleep(1500); } finally { w.stop(); }
    }

    @Test
    void acquiresHeldSubWindowExpirationButNotUnheldSubWindow() throws Exception {
        try (SqliteEvidenceStore store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("GDXJ"));
            // Operator holds the 3-DTE expiration (below the 7-45 window).
            store.setHeldExpirations(List.of(Map.entry("GDXJ", HELD_NEAR)));

            var adapter = new RecordingAdapter();
            var worker = new AcquisitionWorker(adapter, store, new SessionGate(marketClock()), config());

            runOnce(worker, List.of("GDXJ"));

            // The in-window expiration is acquired by normal eligibility.
            assertTrue(adapter.fetchedExpirations.contains(IN_WINDOW),
                "in-window (21 DTE) expiration must be acquired");

            // The HELD sub-window expiration must be acquired because it is held, even though
            // it is below the 7-DTE eligibility window (this is the migration-007 behavior).
            assertTrue(adapter.fetchedExpirations.contains(HELD_NEAR),
                "held sub-7-DTE expiration must be acquired via the held-expiration overlay");

            // The UNHELD sub-window expiration must NOT be acquired.
            assertFalse(adapter.fetchedExpirations.contains(UNHELD_NEAR),
                "unrelated non-held sub-7-DTE expiration must remain excluded");

            // Persistence: the held sub-window chain is stored; the unheld one is not.
            Set<String> persistedExpirations = store.getAllChains("GDXJ").stream()
                .map(m -> m.get("expiration"))
                .collect(java.util.stream.Collectors.toSet());
            assertTrue(persistedExpirations.contains(HELD_NEAR),
                "held sub-window chain must be persisted");
            assertTrue(persistedExpirations.contains(IN_WINDOW),
                "in-window chain must be persisted");
            assertFalse(persistedExpirations.contains(UNHELD_NEAR),
                "unrelated non-held sub-window chain must not be persisted");
        }
    }
}
