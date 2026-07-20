package com.wheelwright.evidence;

import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.SQLException;

/**
 * Configures the SqliteEvidenceStore as a Spring-managed singleton bean.
 * Database path is read from application.properties.
 */
@Configuration
public class EvidenceStoreConfig {

    @Bean
    public SqliteEvidenceStore sqliteEvidenceStore(
            @Value("${evidence.db.path:./data/evidence.sqlite3}") String dbPath) throws SQLException {
        return new SqliteEvidenceStore(dbPath);
    }
}
