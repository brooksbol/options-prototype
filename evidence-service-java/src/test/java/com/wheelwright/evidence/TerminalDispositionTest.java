package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.provider.MarketChain;
import com.wheelwright.evidence.provider.MarketExpiration;
import com.wheelwright.evidence.provider.ObservationRecorder;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PL-PROV-FAILOVER review-4 #2: EVERY acquisition logical-operation exit path produces EXACTLY
 * ONE honest terminal disposition. Drives the real worker path per symbol and asserts each
 * lease's logical operation records exactly one LOGICAL_OUTCOME with the expected outcome.
 */
class TerminalDispositionTest {

    private static final String FUT =
        java.time.LocalDate.now(ZoneOffset.UTC).plusDays(21).toString();

    private static Clock marketClock() {
        return Clock.fixed(ZonedDateTime.of(2026, 7, 21, 15, 0, 0, 0, ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
    }

    private static SchedulerConfig config() {
        return new SchedulerConfig(25*60*1000L, 120*60*1000L, 6*60*60*1000L, 10, 20, 5000L, 15*60*1000L, 5, 25*60*1000L);
    }

    private static MarketChain usableChain(String s) {
        return new MarketChain(s, FUT, new MarketChain.Underlying(s, s, 50.0),
            List.of(new MarketChain.OptionContract(48, 1.0, 1.1, -0.28, 100, 10)), List.of());
    }

    /** Read the single terminal outcome per logical operation id, asserting exactly one each. */
    private static Map<String, List<String>> terminalsByLogicalOp(ObservationRecorder rec) {
        return rec.page(0, 1_000_000).events().stream()
            .filter(e -> e.recordType().equals(ObservationRecorder.RecordType.LOGICAL_OUTCOME.name()))
            .filter(e -> e.logicalOperationId() != null && e.logicalOperationId().startsWith("acq-"))
            .collect(Collectors.groupingBy(ObservationRecorder.Event::logicalOperationId,
                Collectors.mapping(ObservationRecorder.Event::logicalOutcome, Collectors.toList())));
    }

    private static AcquisitionWorker worker(TradierAdapter adapter, SqliteEvidenceStore store) {
        return new AcquisitionWorker(adapter, store, new SessionGate(marketClock()), config());
    }

    private static void runOnce(AcquisitionWorker w, List<String> universe) throws Exception {
        w.start(universe);
        try { Thread.sleep(1500); } finally { w.stop(); }
    }

    @Test
    void committedWhenPrimaryChainUsable() throws Exception {
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            var adapter = new TradierAdapter("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)) {
                @Override public ExpirationResult getExpirations(String s) {
                    return new ExpirationResult(List.of(new MarketExpiration(FUT, 21)), Instant.now().toString(), false);
                }
                @Override public ChainResult getOptionsChain(String s, String e) {
                    return new ChainResult(usableChain(s), Instant.now().toString(), false);
                }
            };
            var w = worker(adapter, store);
            var rec = observerOf(w);
            runOnce(w, List.of("XLE"));
            var terminals = terminalsByLogicalOp(rec);
            assertFalse(terminals.isEmpty());
            terminals.forEach((op, outs) -> assertEquals(1, outs.size(), op + " must have exactly one terminal"));
            assertTrue(terminals.values().stream().flatMap(List::stream).allMatch("ACQUISITION_COMMITTED"::equals),
                "usable primary chain -> COMMITTED");
        }
    }

    @Test
    void noUsableEvidenceWhenAbsent() throws Exception {
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            var adapter = new TradierAdapter("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)) {
                @Override public ExpirationResult getExpirations(String s) {
                    return new ExpirationResult(List.of(), Instant.now().toString(), false); // absent
                }
            };
            var w = worker(adapter, store);
            var rec = observerOf(w);
            runOnce(w, List.of("XLE"));
            var terminals = terminalsByLogicalOp(rec);
            assertFalse(terminals.isEmpty());
            terminals.forEach((op, outs) -> assertEquals(1, outs.size(), op + " exactly one terminal"));
            assertTrue(terminals.values().stream().flatMap(List::stream)
                .allMatch("ACQUISITION_NO_USABLE_EVIDENCE"::equals), "absent -> NO_USABLE_EVIDENCE");
        }
    }

    @Test
    void providerUnusableTerminalOn401() throws Exception {
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            var adapter = new TradierAdapter("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)) {
                @Override public ExpirationResult getExpirations(String s) { throw new ProviderError("401", 401); }
            };
            var w = worker(adapter, store);
            var rec = observerOf(w);
            runOnce(w, List.of("XLE"));
            var terminals = terminalsByLogicalOp(rec);
            assertFalse(terminals.isEmpty());
            terminals.forEach((op, outs) -> assertEquals(1, outs.size(), op + " exactly one terminal"));
            assertTrue(terminals.values().stream().flatMap(List::stream)
                .allMatch("ACQUISITION_PROVIDER_UNUSABLE"::equals), "401 -> PROVIDER_UNUSABLE terminal");
        }
    }

    @Test
    void rejectedOnPerSymbolQualityFailure() throws Exception {
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            var adapter = new TradierAdapter("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)) {
                @Override public ExpirationResult getExpirations(String s) {
                    throw new RuntimeException("malformed payload"); // non-provider -> SYMBOL_QUALITY_FAILURE
                }
            };
            var w = worker(adapter, store);
            var rec = observerOf(w);
            runOnce(w, List.of("XLE"));
            var terminals = terminalsByLogicalOp(rec);
            assertFalse(terminals.isEmpty());
            terminals.forEach((op, outs) -> assertEquals(1, outs.size(), op + " exactly one terminal"));
            assertTrue(terminals.values().stream().flatMap(List::stream)
                .allMatch("ACQUISITION_REJECTED"::equals), "quality failure -> REJECTED");
        }
    }

    // --- review-5 #3: persistence failure vs fencing distinction ---

    @Test
    void persistenceFailedWhenWriteThrowsWhileLeaseCurrent() throws Exception {
        // A per-subject quality failure whose failure-RECORDING durable write itself throws
        // (SQLite/write exception) while the lease is CURRENT must terminate PERSISTENCE_FAILED,
        // never FENCED (fencing means a stale lease; here the lease is current and the write failed).
        var store = new SqliteEvidenceStore(":memory:") {
            @Override public void setFailure(String symbol, String reason) throws java.sql.SQLException {
                throw new java.sql.SQLException("simulated write failure");
            }
        };
        try (store) {
            store.initUniverse(List.of("XLE"));
            var adapter = new TradierAdapter("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)) {
                @Override public ExpirationResult getExpirations(String s) {
                    throw new RuntimeException("malformed payload"); // SYMBOL_QUALITY_FAILURE
                }
            };
            var w = worker(adapter, store);
            var rec = observerOf(w);
            runOnce(w, List.of("XLE"));
            var terminals = terminalsByLogicalOp(rec);
            assertFalse(terminals.isEmpty());
            terminals.forEach((op, outs) -> assertEquals(1, outs.size(), op + " exactly one terminal"));
            assertTrue(terminals.values().stream().flatMap(List::stream)
                .allMatch("ACQUISITION_PERSISTENCE_FAILED"::equals),
                "current-lease write exception -> PERSISTENCE_FAILED, never FENCED");
        }
    }

    @Test
    void fencedWhenLeaseGoesStaleMidQualityFailure() throws Exception {
        // A per-subject quality failure whose guarded failure-write is discarded because the
        // lease went stale (a transition landed mid-op) must terminate FENCED, not REJECTED and
        // not PERSISTENCE_FAILED. Use a manager-based worker with a sandbox so a transition is
        // possible, and an adapter that transitions the manager during getExpirations then throws
        // a quality failure.
        try (var store = new SqliteEvidenceStore(":memory:")) {
            store.initUniverse(List.of("XLE"));
            final ProviderAuthorityManager[] ref = new ProviderAuthorityManager[1];
            var mutating = new TradierAdapter("k", "https://api.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)) {
                @Override public ExpirationResult getExpirations(String s) {
                    ref[0].activateDegraded(); // fence the in-flight production lease
                    throw new RuntimeException("malformed payload"); // then a quality failure
                }
            };
            var prod = new ProviderAuthority("prod", "production", mutating, mutating.cache(), mutating.pacer());
            var sbx = new ProviderAuthority("sandbox", "sandbox",
                new TradierAdapter("k", "https://sandbox.tradier.com/v1", new ResponseCache(), new RequestPacer(100, 10)),
                new ResponseCache(), new RequestPacer(100, 10));
            var mgr = new ProviderAuthorityManager(prod, sbx);
            ref[0] = mgr;
            // Production starts PRODUCTION_UNVERIFIED (PL-PROV-FAILOVER): ordinary acquisition is
            // gated until the control plane establishes production. Establish it directly so this
            // test can exercise the acquisition path (and its mid-op fencing) — the concern under
            // test is stale-lease terminal disposition, not startup verification.
            assertTrue(mgr.establishProductionVerified());
            var w = new AcquisitionWorker(mgr, store, new SessionGate(marketClock()), config(), java.util.Collections.emptySet());
            runOnce(w, List.of("XLE"));
            var terminals = terminalsByLogicalOp(rec(mgr));
            // At least one acquisition of XLE happened; the fenced one terminates FENCED.
            assertFalse(terminals.isEmpty());
            terminals.forEach((op, outs) -> assertEquals(1, outs.size(), op + " exactly one terminal"));
            assertTrue(terminals.values().stream().flatMap(List::stream)
                .anyMatch("ACQUISITION_FENCED"::equals),
                "stale-lease quality failure -> FENCED (not PERSISTENCE_FAILED)");
            assertTrue(terminals.values().stream().flatMap(List::stream)
                .noneMatch("ACQUISITION_PERSISTENCE_FAILED"::equals),
                "a fenced write must not be mislabeled as a persistence failure");
        }
    }

    private static ObservationRecorder rec(ProviderAuthorityManager mgr) { return mgr.observer(); }

    // Access the worker's shared observer via its synthesized single-authority manager. The
    // adapter-based worker ctor builds a manager whose observer is the shared recorder.
    private static ObservationRecorder observerOf(AcquisitionWorker w) {
        return w.providerManagerForTesting().observer();
    }
}
