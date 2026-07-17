/**
 * Candidate Universe — symbols the acquisition worker processes.
 *
 * With SQLite persistence, the canonical universe lives in the database.
 * On first run (empty database), the universe is seeded from the CSV.
 * On subsequent runs, the universe is read directly from the database.
 *
 * The CSV seed file is the source of truth for the canonical symbol list.
 * The database is the operational authority for what gets acquired.
 */

import type Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { importUniverseFromCsv, getDefaultSeedPath } from "./db/universe-import.js";

/**
 * Load the active universe from the database.
 * If the database has no symbols, import from the canonical seed CSV.
 */
export function loadUniverse(db: Database.Database): string[] {
  // Check if universe is already populated
  const count = (db.prepare("SELECT COUNT(*) as cnt FROM symbols WHERE removed_at IS NULL").get() as any).cnt;

  if (count === 0) {
    // First run: import from canonical seed
    const seedPath = getDefaultSeedPath();
    if (!existsSync(seedPath)) {
      console.warn("[universe] No seed file found and database is empty. Using minimal fallback.");
      return getFallbackUniverse(db);
    }

    console.log("[universe] Database empty. Importing canonical universe from seed CSV...");
    const result = importUniverseFromCsv(db, seedPath, "yahoo_merged_2026_07", "Yahoo Merged ETFs");
    console.log(`[universe] Imported ${result.totalInFile} symbols (${result.newSymbolsAdded} new) in ${result.durationMs}ms`);
  }

  // Read active symbols from database
  const rows = db.prepare("SELECT symbol FROM symbols WHERE removed_at IS NULL ORDER BY symbol").all() as any[];
  const symbols = rows.map((r: any) => r.symbol);
  console.log(`[universe] Loaded ${symbols.length} symbols from database`);
  return symbols;
}

function getFallbackUniverse(db: Database.Database): string[] {
  const fallback = ["XLE", "XLF", "XLK", "XLU", "XLP", "QQQ", "SPY", "IWM", "DIA", "GLD"];
  const now = new Date().toISOString();
  const insert = db.prepare("INSERT OR IGNORE INTO symbols (symbol, added_at) VALUES (?, ?)");
  const insertRes = db.prepare("INSERT OR IGNORE INTO symbol_resolution (symbol, resolution) VALUES (?, 'pending')");
  const tx = db.transaction(() => {
    for (const s of fallback) {
      insert.run(s, now);
      insertRes.run(s);
    }
  });
  tx();
  return fallback;
}
