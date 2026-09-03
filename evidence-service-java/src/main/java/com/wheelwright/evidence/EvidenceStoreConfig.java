package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.UniverseLoader;
import com.wheelwright.evidence.provider.ProviderAuthority;
import com.wheelwright.evidence.provider.ProviderAuthorityManager;
import com.wheelwright.evidence.provider.RequestPacer;
import com.wheelwright.evidence.provider.ResponseCache;
import com.wheelwright.evidence.provider.TradierAdapter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.sql.SQLException;
import java.time.Clock;
import java.util.List;
import java.util.Set;

/**
 * Spring configuration — wires the evidence service components.
 */
@Configuration
public class EvidenceStoreConfig {

    @Bean
    public SqliteEvidenceStore sqliteEvidenceStore(
            @Value("${evidence.db.path:./data/evidence.sqlite3}") String dbPath) throws SQLException {
        return new SqliteEvidenceStore(dbPath);
    }

    @Bean
    public ResponseCache responseCache() {
        // The PRODUCTION authority's isolated cache. Retained as a distinct bean for
        // existing consumers (StatusController cache stats). The sandbox authority owns
        // its own separate ResponseCache (constructed in providerAuthorityManager),
        // so cached responses never cross provider-authority boundaries (invariant I6).
        return new ResponseCache();
    }

    @Bean
    public RequestPacer requestPacer(
            @Value("${tradier.requests-per-minute:119}") int requestsPerMinute) {
        // The PRODUCTION authority's isolated pacer. Exact local admission budget:
        // never exceed this many Wheelwright-generated request starts in any trailing
        // 60 seconds. Production's documented market-data allowance is 120/min; 119 is
        // the operator-authorized ~99% target. Single-flight; 429 overrides admission.
        // The sandbox authority owns its own separate pacer (invariant I8).
        return new RequestPacer(requestsPerMinute, 200);
    }

    @Bean
    public TradierAdapter tradierAdapter(
            @Value("${tradier.api-key:}") String apiKey,
            @Value("${tradier.base-url:https://sandbox.tradier.com/v1}") String baseUrl,
            ResponseCache cache,
            RequestPacer pacer) {
        // PRODUCTION authority adapter. Credential is required for the primary
        // (production) authority — the appliance cannot acquire authoritative evidence
        // without it. (Sandbox is optional; its absence only disables degraded mode.)
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "Tradier API key is required. Set TRADIER_API_KEY environment variable or tradier.api-key property. " +
                "The application cannot acquire market evidence without a valid provider credential.");
        }
        return new TradierAdapter(apiKey, baseUrl, cache, pacer);
    }

    /**
     * Provider-authority manager (PL-PROV-FAILOVER Layer 1). Holds the required
     * production authority and an OPTIONAL sandbox authority, each with its own
     * isolated adapter + cache + pacer. Sandbox is constructed ONLY when distinct
     * sandbox credentials are supplied via configuration
     * ({@code tradier.sandbox.api-key} / {@code tradier.sandbox.base-url}); absent
     * sandbox creds mean degraded mode is unavailable (SUSPENDED-capable only) — NOT
     * a startup failure. No commented-.env parsing; credentials are never logged.
     *
     * NOTE (step 2): the manager exists and is isolation-correct, but nothing switches
     * the active authority at runtime yet. No sandbox durable write is possible until
     * the atomic lease (step 3), provenance/partitioning (step 4), and provenance-bearing
     * representation (step 5) are complete.
     */
    /**
     * The unified, append-only authoritative observer (PL-PROV-FAILOVER observer
     * correction). One process-wide instance shared by every provider authority/pacer
     * and the authority manager. This is the authoritative measurement plane; the
     * /api/status pacer projection remains non-authoritative diagnostics.
     */
    @Bean
    public com.wheelwright.evidence.provider.ObservationRecorder observationRecorder() {
        return new com.wheelwright.evidence.provider.ObservationRecorder();
    }

    @Bean
    public ProviderAuthorityManager providerAuthorityManager(
            TradierAdapter productionAdapter,
            com.wheelwright.evidence.provider.ObservationRecorder observationRecorder,
            @Value("${tradier.requests-per-minute:119}") int requestsPerMinute,
            @Value("${tradier.base-url:https://sandbox.tradier.com/v1}") String productionBaseUrl,
            @Value("${tradier.sandbox.api-key:}") String sandboxApiKey,
            @Value("${tradier.sandbox.base-url:}") String sandboxBaseUrl) {

        ProviderAuthority prod = new ProviderAuthority(
            "prod", deriveEnvironment(productionBaseUrl),
            productionAdapter, productionAdapter.cache(), productionAdapter.pacer());

        ProviderAuthority sandbox = null;
        if (sandboxApiKey != null && !sandboxApiKey.isBlank()
                && sandboxBaseUrl != null && !sandboxBaseUrl.isBlank()) {
            // Sandbox authority gets its OWN isolated cache + pacer (never shared with prod).
            ResponseCache sandboxCache = new ResponseCache();
            RequestPacer sandboxPacer = new RequestPacer(requestsPerMinute, 200);
            TradierAdapter sandboxAdapter =
                new TradierAdapter(sandboxApiKey, sandboxBaseUrl, sandboxCache, sandboxPacer);
            sandbox = new ProviderAuthority(
                "sandbox", deriveEnvironment(sandboxBaseUrl),
                sandboxAdapter, sandboxCache, sandboxPacer);
            System.out.println("[provider] Sandbox authority configured — degraded mode available.");
        } else {
            System.out.println("[provider] No sandbox credentials — degraded mode unavailable (SUSPENDED-capable only).");
        }

        return new ProviderAuthorityManager(prod, sandbox, observationRecorder);
    }

    /** Derive the true provider environment label from the base-url (no secrets). */
    static String deriveEnvironment(String baseUrl) {
        if (baseUrl == null) return "unknown";
        String u = baseUrl.toLowerCase();
        if (u.contains("sandbox.tradier.com")) return "sandbox";
        if (u.contains("api.tradier.com")) return "production";
        return "unknown";
    }

    @Bean
    public Set<String> openingSet() {
        return OpeningSetLoader.load();
    }

    @Bean
    public SessionGate sessionGate() {
        return new SessionGate(Clock.systemUTC());
    }

    @Bean
    public SchedulerConfig schedulerConfig() {
        return SchedulerConfig.DEFAULT;
    }

    @Bean
    public AcquisitionWorker acquisitionWorker(
            ProviderAuthorityManager providerAuthorityManager,
            SqliteEvidenceStore store,
            SessionGate sessionGate,
            SchedulerConfig config,
            Set<String> openingSet) {
        return new AcquisitionWorker(providerAuthorityManager, store, sessionGate, config, openingSet);
    }

    /**
     * Start the worker after all beans are wired.
     */
    @Bean
    public WorkerStarter workerStarter(
            AcquisitionWorker worker,
            SqliteEvidenceStore store,
            @Value("${universe.seed.path:./data/seeds/yahoo-merged-etf-tickers.csv}") String seedPath) {
        return new WorkerStarter(worker, store, seedPath);
    }

    static class WorkerStarter {
        private final AcquisitionWorker worker;
        private final SqliteEvidenceStore store;
        private final String seedPath;

        WorkerStarter(AcquisitionWorker worker, SqliteEvidenceStore store, String seedPath) {
            this.worker = worker;
            this.store = store;
            this.seedPath = seedPath;
        }

        @PostConstruct
        public void start() {
            try {
                List<String> universe = UniverseLoader.loadUniverse(store.getConnection(), seedPath);
                worker.start(universe);
            } catch (Exception e) {
                System.err.println("[startup] Failed to start worker: " + e.getMessage());
            }
        }
    }
}
