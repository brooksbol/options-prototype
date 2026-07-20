package com.wheelwright.evidence.db;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Database lifecycle management: open, apply pragmas, run migrations.
 *
 * Mirrors the TypeScript connection.ts behavior:
 *   - WAL journal mode
 *   - Foreign keys enabled
 *   - Numbered SQL migration files applied idempotently
 *   - _migrations table tracks applied migrations
 */
public class DatabaseManager {

    private static final String MIGRATIONS_PATH = "db/migrations/";

    /**
     * Open a SQLite database, apply pragmas, and run pending migrations.
     */
    public static Connection open(String dbPath) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);

        // Pragmas
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA journal_mode = WAL");
            stmt.execute("PRAGMA foreign_keys = ON");
        }

        // Run migrations
        runMigrations(conn);

        return conn;
    }

    private static void runMigrations(Connection conn) throws SQLException {
        // Create migrations tracking table
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS _migrations (
                    id TEXT PRIMARY KEY,
                    applied_at TEXT NOT NULL
                )
            """);
        }

        // Get applied migrations
        List<String> applied = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id FROM _migrations")) {
            while (rs.next()) {
                applied.add(rs.getString("id"));
            }
        }

        // Get available migration files
        List<String> available = listMigrationFiles();

        for (String file : available) {
            if (applied.contains(file)) continue;

            String sql = readMigrationFile(file);

            // Apply migration in a transaction
            conn.setAutoCommit(false);
            try (Statement stmt = conn.createStatement()) {
                // SQLite JDBC requires executing each statement individually
                for (String statement : splitStatements(sql)) {
                    if (!statement.isBlank()) {
                        stmt.execute(statement);
                    }
                }
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO _migrations (id, applied_at) VALUES (?, ?)")) {
                    ps.setString(1, file);
                    ps.setString(2, Instant.now().toString());
                    ps.executeUpdate();
                }
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private static List<String> listMigrationFiles() {
        // Known migration files — add new entries here as migrations are created
        String[] known = {"001_initial.sql"};
        List<String> files = new ArrayList<>();
        for (String f : known) {
            if (DatabaseManager.class.getClassLoader().getResource(MIGRATIONS_PATH + f) != null) {
                files.add(f);
            }
        }
        files.sort(String::compareTo);
        return files;
    }

    private static String readMigrationFile(String filename) {
        String path = MIGRATIONS_PATH + filename;
        try (InputStream is = DatabaseManager.class.getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                throw new IllegalStateException("Migration file not found: " + path);
            }
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read migration: " + path, e);
        }
    }

    /**
     * Split SQL text into individual statements on semicolons.
     * Strips comments (lines starting with --).
     */
    private static List<String> splitStatements(String sql) {
        List<String> statements = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String line : sql.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("--") || trimmed.isEmpty()) continue;
            current.append(line).append("\n");
            if (trimmed.endsWith(";")) {
                statements.add(current.toString().trim());
                current.setLength(0);
            }
        }
        if (!current.isEmpty()) {
            String remainder = current.toString().trim();
            if (!remainder.isEmpty()) statements.add(remainder);
        }
        return statements;
    }
}
