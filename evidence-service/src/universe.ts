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
 * Always ensures the canonical seed CSV is imported (idempotent).
 */
export function loadUniverse(db: Database.Database): string[] {
  // Always import the canonical seed (idempotent — won't duplicate or reset)
  const seedPath = getDefaultSeedPath();
  if (existsSync(seedPath)) {
    const result = importUniverseFromCsv(db, seedPath, "yahoo_merged_2026_07", "Yahoo Merged ETFs");
    if (result.newSymbolsAdded > 0) {
      console.log(`[universe] Imported ${result.newSymbolsAdded} new symbols from canonical seed (${result.totalInFile} total in file, ${result.existingPreserved} preserved)`);
    }
  } else {
    // No seed file — check if DB has symbols
    const count = (db.prepare("SELECT COUNT(*) as cnt FROM symbols WHERE removed_at IS NULL").get() as any).cnt;
    if (count === 0) {
      console.warn("[universe] No seed file found and database is empty. Using minimal fallback.");
      return getFallbackUniverse(db);
    }
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
