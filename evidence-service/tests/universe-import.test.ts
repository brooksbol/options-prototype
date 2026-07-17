/**
 * Universe Import Tests
 *
 * Proves:
 * 1. Import creates symbols and resolution rows
 * 2. Existing evidence survives import
 * 3. Existing timestamps survive import
 * 4. Existing snapshot generation remains valid
 * 5. New symbols begin pending
 * 6. Duplicate import is idempotent
 * 7. Restart after import preserves state
 * 8. Acquisition naturally targets only pending symbols
 * 9. Source membership tracked correctly
 */

import { describe, it, expect, afterEach } from "vitest";
import { openDatabase } from "../src/db/connection.js";
import { importUniverseFromCsv } from "../src/db/universe-import.js";
import { SqliteEvidenceStore } from "../src/db/sqlite-evidence-store.js";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { MarketExpiration, MarketChain } from "../src/providers/tradier.js";

const TEMP_DIR = "./data/test-import";
const TEMP_CSV = `${TEMP_DIR}/test-universe.csv`;
const TEMP_DB = `${TEMP_DIR}/test.sqlite3`;

const EXPIRATIONS: MarketExpiration[] = [{ date: "2026-08-03", dte: 21 }];
const CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy", price: 92.5 },
  puts: [{ strike: 88, bid: 1.5, ask: 1.7, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 95, bid: 1.2, ask: 1.4, delta: 0.32, openInterest: 300, volume: 80 }],
};

function writeCsv(symbols: string[]): void {
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });
  writeFileSync(TEMP_CSV, "ticker\n" + symbols.join("\n") + "\n");
}

function cleanup(): void {
  if (existsSync(TEMP_CSV)) unlinkSync(TEMP_CSV);
  if (existsSync(TEMP_DB)) unlinkSync(TEMP_DB);
}

afterEach(cleanup);

describe("universe import", () => {
  it("creates symbols and resolution rows for new symbols", () => {
    writeCsv(["XLE", "XLF", "SPY"]);
    const db = openDatabase(":memory:");

    const result = importUniverseFromCsv(db, TEMP_CSV, "test_source", "Test Source");

    expect(result.totalInFile).toBe(3);
    expect(result.newSymbolsAdded).toBe(3);
    expect(result.existingPreserved).toBe(0);

    // Verify rows exist
    const symbols = db.prepare("SELECT symbol FROM symbols ORDER BY symbol").all() as any[];
    expect(symbols.map(r => r.symbol)).toEqual(["SPY", "XLE", "XLF"]);

    // Verify resolutions are pending
    const resolutions = db.prepare("SELECT resolution FROM symbol_resolution").all() as any[];
    expect(resolutions.every(r => r.resolution === "pending")).toBe(true);

    db.close();
  });

  it("existing evidence survives import", () => {
    const store = new SqliteEvidenceStore(TEMP_DB);
    store.initUniverse(["XLE", "XLF"]);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-15T14:00:00Z");
    store.setChain("XLE", CHAIN, "2026-07-15T14:01:00Z");
    store.publishSnapshot();

    // Now import expanded universe that includes XLE + new symbols
    writeCsv(["XLE", "XLF", "SPY", "QQQ", "IWM"]);
    const db = store.getDb();
    const result = importUniverseFromCsv(db, TEMP_CSV, "expanded", "Expanded");

    expect(result.existingPreserved).toBe(2); // XLE, XLF
    expect(result.newSymbolsAdded).toBe(3); // SPY, QQQ, IWM

    // XLE evidence must be intact
    const xle = store.get("XLE");
    expect(xle?.status).toBe("ready");
    expect(xle?.chain).toEqual(CHAIN);
    expect(xle?.expirations).toEqual(EXPIRATIONS);

    store.close();
  });

  it("existing timestamps survive import", () => {
    const store = new SqliteEvidenceStore(TEMP_DB);
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-15T14:00:00Z");

    writeCsv(["XLE", "SPY"]);
    importUniverseFromCsv(store.getDb(), TEMP_CSV, "ts_test", "Timestamp Test");

    const xle = store.get("XLE");
    expect(xle?.retrievedAt).toBe("2026-07-15T14:00:00Z");

    store.close();
  });

  it("existing snapshot generation remains valid after import", () => {
    const store = new SqliteEvidenceStore(TEMP_DB);
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-15T14:00:00Z");
    store.publishSnapshot();
    const genBefore = store.generation;

    writeCsv(["XLE", "SPY", "QQQ"]);
    importUniverseFromCsv(store.getDb(), TEMP_CSV, "gen_test", "Gen Test");

    // Generation should NOT change from an import
    expect(store.generation).toBe(genBefore);

    store.close();
  });

  it("new symbols begin pending", () => {
    const store = new SqliteEvidenceStore(TEMP_DB);
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-15T14:00:00Z");
    store.setChain("XLE", CHAIN, "2026-07-15T14:01:00Z");

    writeCsv(["XLE", "SPY", "QQQ"]);
    importUniverseFromCsv(store.getDb(), TEMP_CSV, "pending_test", "Pending Test");

    const spy = store.get("SPY");
    expect(spy?.status).toBe("pending");
    expect(spy?.chain).toBeNull();
    expect(spy?.expirations).toBeNull();

    const qqq = store.get("QQQ");
    expect(qqq?.status).toBe("pending");

    store.close();
  });

  it("duplicate import is idempotent", () => {
    writeCsv(["XLE", "XLF", "SPY"]);
    const db = openDatabase(":memory:");

    const result1 = importUniverseFromCsv(db, TEMP_CSV, "idem", "Idempotent");
    const result2 = importUniverseFromCsv(db, TEMP_CSV, "idem", "Idempotent");

    expect(result1.newSymbolsAdded).toBe(3);
    expect(result2.newSymbolsAdded).toBe(0);
    expect(result2.existingPreserved).toBe(3);

    // No duplicate rows
    const count = (db.prepare("SELECT COUNT(*) as cnt FROM symbols").get() as any).cnt;
    expect(count).toBe(3);

    const memberCount = (db.prepare("SELECT COUNT(*) as cnt FROM symbol_membership").get() as any).cnt;
    expect(memberCount).toBe(3); // not 6

    db.close();
  });

  it("restart after import preserves state", () => {
    // Store 1: import and acquire some evidence
    const store1 = new SqliteEvidenceStore(TEMP_DB);
    store1.initUniverse(["XLE"]);
    store1.setExpirations("XLE", EXPIRATIONS, "2026-07-15T14:00:00Z");
    store1.setChain("XLE", CHAIN, "2026-07-15T14:01:00Z");

    writeCsv(["XLE", "SPY", "QQQ"]);
    importUniverseFromCsv(store1.getDb(), TEMP_CSV, "restart", "Restart Test");
    store1.publishSnapshot();
    store1.close();

    // Store 2: reopen — everything should persist
    const store2 = new SqliteEvidenceStore(TEMP_DB);
    const xle = store2.get("XLE");
    expect(xle?.status).toBe("ready");
    expect(xle?.chain).toEqual(CHAIN);

    const spy = store2.get("SPY");
    expect(spy?.status).toBe("pending");

    const symbols = store2.getDb().prepare("SELECT COUNT(*) as cnt FROM symbols").get() as any;
    expect(symbols.cnt).toBe(3);

    store2.close();
  });

  it("acquisition targets only pending symbols after import", () => {
    const store = new SqliteEvidenceStore(TEMP_DB);
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-15T14:00:00Z");
    store.setChain("XLE", CHAIN, "2026-07-15T14:01:00Z");

    writeCsv(["XLE", "SPY", "QQQ"]);
    importUniverseFromCsv(store.getDb(), TEMP_CSV, "queue", "Queue Test");

    // Re-init universe so store sees new symbols
    store.initUniverse(["XLE", "SPY", "QQQ"]);

    const queue = store.getWorkQueue();
    expect(queue).toContain("SPY");
    expect(queue).toContain("QQQ");
    expect(queue).not.toContain("XLE"); // already ready

    store.close();
  });

  it("source membership tracked correctly", () => {
    const db = openDatabase(":memory:");

    // First source: 3 symbols
    writeCsv(["XLE", "XLF", "SPY"]);
    importUniverseFromCsv(db, TEMP_CSV, "source_a", "Source A");

    // Second source: overlapping + new
    writeCsv(["XLE", "QQQ", "IWM"]);
    importUniverseFromCsv(db, TEMP_CSV, "source_b", "Source B");

    // XLE belongs to both
    const xleMembers = db.prepare(
      "SELECT source_id FROM symbol_membership WHERE symbol = 'XLE' ORDER BY source_id"
    ).all() as any[];
    expect(xleMembers.map(r => r.source_id)).toEqual(["source_a", "source_b"]);

    // QQQ belongs only to source_b
    const qqqMembers = db.prepare(
      "SELECT source_id FROM symbol_membership WHERE symbol = 'QQQ'"
    ).all() as any[];
    expect(qqqMembers.map(r => r.source_id)).toEqual(["source_b"]);

    // Can recover original source_a population
    const sourceA = db.prepare(
      "SELECT symbol FROM symbol_membership WHERE source_id = 'source_a' ORDER BY symbol"
    ).all() as any[];
    expect(sourceA.map(r => r.symbol)).toEqual(["SPY", "XLE", "XLF"]);

    db.close();
  });
});
