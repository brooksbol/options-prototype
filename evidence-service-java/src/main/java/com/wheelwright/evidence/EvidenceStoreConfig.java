package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import com.wheelwright.evidence.db.UniverseLoader;
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
        return new ResponseCache();
    }

    @Bean
    public RequestPacer requestPacer(
            @Value("${tradier.requests-per-minute:119}") int requestsPerMinute) {
        // Exact local admission budget: never exceed this many Wheelwright-generated
        // request starts in any trailing 60 seconds. Production's documented market-data
        // allowance is 120/min; 119 represents the operator-authorized ~99% target.
        // Provider calls remain strictly single-flight. A 429 overrides local admission.
        return new RequestPacer(requestsPerMinute, 200);
    }

    @Bean
    public TradierAdapter tradierAdapter(
            @Value("${tradier.api-key:}") String apiKey,
            @Value("${tradier.base-url:https://sandbox.tradier.com/v1}") String baseUrl,
            ResponseCache cache,
            RequestPacer pacer) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "Tradier API key is required. Set TRADIER_API_KEY environment variable or tradier.api-key property. " +
                "The application cannot acquire market evidence without a valid provider credential.");
        }
        return new TradierAdapter(apiKey, baseUrl, cache, pacer);
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
            TradierAdapter adapter,
            SqliteEvidenceStore store,
            SessionGate sessionGate,
            SchedulerConfig config,
            Set<String> openingSet) {
        return new AcquisitionWorker(adapter, store, sessionGate, config, openingSet);
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
