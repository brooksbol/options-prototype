/**
 * Database Connection — opens SQLite, applies pragmas, runs migrations.
 *
 * Configuration:
 *   EVIDENCE_DB_PATH env var (default: ./data/evidence.sqlite3)
 *   Use ":memory:" for tests.
 */

import Database from "better-sqlite3";
import { readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

const MIGRATIONS_DIR = resolve(dirname(new URL(import.meta.url).pathname), "migrations");

/**
 * Open (or create) the SQLite database, apply pragmas, and run pending migrations.
 */
export function openDatabase(dbPath?: string): Database.Database {
  const path = dbPath ?? process.env.EVIDENCE_DB_PATH ?? "./data/evidence.sqlite3";

  // Ensure directory exists for file-based databases
  if (path !== ":memory:") {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(path);

  // Pragmas
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run migrations
  runMigrations(db);

  return db;
}

/**
 * Apply numbered SQL migration files that haven't been applied yet.
 * Tracks applied migrations in a _migrations table.
 */
function runMigrations(db: Database.Database): void {
  // Create migrations tracking table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get applied migrations
  const applied = new Set(
    db.prepare("SELECT id FROM _migrations").all().map((row: any) => row.id)
  );

  // Get available migration files (sorted)
  if (!existsSync(MIGRATIONS_DIR)) return;

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");

    // Apply migration in a transaction
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (id, applied_at) VALUES (?, ?)").run(
        file,
        new Date().toISOString()
      );
    });

    applyMigration();
    console.log(`[db] Applied migration: ${file}`);
  }
}
