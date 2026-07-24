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
    public RequestPacer requestPacer() {
        return new RequestPacer();
    }

    @Bean
    public TradierAdapter tradierAdapter(
            @Value("${tradier.api-key:}") String apiKey,
            @Value("${tradier.base-url:https://sandbox.tradier.com/v1}") String baseUrl,
            ResponseCache cache,
            RequestPacer pacer) {
        return new TradierAdapter(apiKey, baseUrl, cache, pacer);
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
            SchedulerConfig config) {
        return new AcquisitionWorker(adapter, store, sessionGate, config);
    }

    /**
     * Start the worker after all beans are wired.
     */
    @Bean
    public WorkerStarter workerStarter(AcquisitionWorker worker, SqliteEvidenceStore store) {
        return new WorkerStarter(worker, store);
    }

    static class WorkerStarter {
        private final AcquisitionWorker worker;
        private final SqliteEvidenceStore store;

        WorkerStarter(AcquisitionWorker worker, SqliteEvidenceStore store) {
            this.worker = worker;
            this.store = store;
        }

        @PostConstruct
        public void start() {
            try {
                List<String> universe = UniverseLoader.loadUniverse(store.getConnection());
                worker.start(universe);
            } catch (Exception e) {
                System.err.println("[startup] Failed to start worker: " + e.getMessage());
            }
        }
    }
}
