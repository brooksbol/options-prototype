/**
 * Universe Import — loads the canonical ETF universe from a CSV seed file
 * into the SQLite database.
 *
 * Idempotent: running multiple times does not duplicate rows or reset evidence.
 * Existing symbols retain all evidence, resolution state, and timestamps.
 * New symbols are created as pending with no evidence.
 *
 * Source membership is tracked via the symbol_membership junction table.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type Database from "better-sqlite3";

export interface ImportResult {
  sourceId: string;
  sourceName: string;
  totalInFile: number;
  existingPreserved: number;
  newSymbolsAdded: number;
  alreadyMember: number;
  membershipAdded: number;
  durationMs: number;
}

/**
 * Import a CSV universe seed into the database.
 *
 * @param db - open SQLite database
 * @param csvPath - path to CSV file (header row: "ticker", then one symbol per line)
 * @param sourceId - unique source identifier (e.g., "yahoo_merged_2026_07")
 * @param sourceName - human-readable name (e.g., "Yahoo Merged ETFs")
 */
export function importUniverseFromCsv(
  db: Database.Database,
  csvPath: string,
  sourceId: string,
  sourceName: string
): ImportResult {
  const start = Date.now();

  // Parse CSV
  const content = readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Skip header
  const header = lines[0].toLowerCase();
  const tickers = header === "ticker" ? lines.slice(1) : lines;

  // Deduplicate
  const symbols = [...new Set(tickers.filter(s => s.length > 0 && s.length < 10))];
  const now = new Date().toISOString();

  // Prepared statements
  const insertSymbol = db.prepare(
    "INSERT OR IGNORE INTO symbols (symbol, added_at) VALUES (?, ?)"
  );
  const insertResolution = db.prepare(
    "INSERT OR IGNORE INTO symbol_resolution (symbol, resolution) VALUES (?, 'pending')"
  );
  const upsertSource = db.prepare(`
    INSERT INTO universe_sources (id, name, imported_at, symbol_count)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      imported_at = excluded.imported_at,
      symbol_count = excluded.symbol_count
  `);
  const insertMembership = db.prepare(
    "INSERT OR IGNORE INTO symbol_membership (symbol, source_id) VALUES (?, ?)"
  );
  const countExisting = db.prepare(
    "SELECT COUNT(*) as cnt FROM symbols WHERE symbol = ?"
  );

  let existingPreserved = 0;
  let newSymbolsAdded = 0;
  let alreadyMember = 0;
  let membershipAdded = 0;

  const runImport = db.transaction(() => {
    // Register the source
    upsertSource.run(sourceId, sourceName, now, symbols.length);

    for (const symbol of symbols) {
      // Check if symbol already exists
      const existing = (countExisting.get(symbol) as any)?.cnt > 0;

      if (existing) {
        existingPreserved++;
      } else {
        insertSymbol.run(symbol, now);
        insertResolution.run(symbol);
        newSymbolsAdded++;
      }

      // Add membership (idempotent)
      const memberResult = insertMembership.run(symbol, sourceId);
      if (memberResult.changes > 0) {
        membershipAdded++;
      } else {
        alreadyMember++;
      }
    }
  });

  runImport();

  return {
    sourceId,
    sourceName,
    totalInFile: symbols.length,
    existingPreserved,
    newSymbolsAdded,
    alreadyMember,
    membershipAdded,
    durationMs: Date.now() - start,
  };
}

/**
 * Get the default seed CSV path.
 * Respects UNIVERSE_SEED_PATH env var for deployment and test control.
 * Set to empty string to disable automatic seeding.
 */
export function getDefaultSeedPath(): string {
  const envPath = process.env.UNIVERSE_SEED_PATH;
  if (envPath !== undefined) return envPath; // empty string = disable seeding
  return resolve(process.cwd(), "data/seeds/yahoo-merged-etf-tickers.csv");
}
