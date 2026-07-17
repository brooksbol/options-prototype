/**
 * SqliteEvidenceStore Tests
 *
 * Proves:
 * 1. Behavioral equivalence with in-memory EvidenceStore (same ops → same snapshot)
 * 2. Restart recovery (write → close → reopen → identical snapshot)
 * 3. Failed refresh preserves last successful payload
 * 4. Absence as resolution outcome
 * 5. Work queue correctness
 * 6. Generation increments on publishSnapshot, not individual writes
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SqliteEvidenceStore } from "../src/db/sqlite-evidence-store.js";
import { EvidenceStore } from "../src/evidence-store.js";
import type { SymbolEvidence, EvidenceSnapshot } from "../src/evidence-store.js";
import type { MarketExpiration, MarketChain } from "../src/providers/tradier.js";
import { existsSync, unlinkSync } from "node:fs";

// --- Test fixtures ---

const EXPIRATIONS: MarketExpiration[] = [
  { date: "2026-08-03", dte: 21 },
  { date: "2026-08-10", dte: 28 },
];

const CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy Select Sector", price: 92.50 },
  puts: [{ strike: 88, bid: 1.50, ask: 1.70, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 95, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 }],
};

const NOW = "2026-07-16T14:30:00Z";

/** Normalize a snapshot for comparison (remove timing-dependent fields) */
function normalize(snap: EvidenceSnapshot): any {
  return {
    universe: snap.universe,
    coverage: snap.coverage,
    symbols: snap.symbols
      .map(s => ({
        symbol: s.symbol,
        status: s.status,
        expirations: s.expirations,
        primaryExpiration: s.primaryExpiration,
        chain: s.chain,
        failureCount: s.failureCount,
        failureReason: s.failureReason,
      }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol)),
  };
}

// --- Behavioral Equivalence ---

describe("SqliteEvidenceStore — behavioral equivalence", () => {
  let sqlite: SqliteEvidenceStore;
  let memory: EvidenceStore;

  beforeEach(() => {
    sqlite = new SqliteEvidenceStore(":memory:");
    memory = new EvidenceStore();
  });

  afterEach(() => {
    sqlite.close();
  });

  it("produces identical snapshot after initUniverse", () => {
    const symbols = ["XLE", "XLF", "NOOPT"];
    sqlite.initUniverse(symbols);
    memory.initUniverse(symbols);

    expect(normalize(sqlite.buildSnapshot())).toEqual(normalize(memory.buildSnapshot()));
  });

  it("produces identical snapshot after setExpirations (non-empty)", () => {
    const symbols = ["XLE", "XLF"];
    sqlite.initUniverse(symbols);
    memory.initUniverse(symbols);

    sqlite.setExpirations("XLE", EXPIRATIONS, NOW);
    memory.setExpirations("XLE", EXPIRATIONS, NOW);

    expect(normalize(sqlite.buildSnapshot())).toEqual(normalize(memory.buildSnapshot()));
  });

  it("produces identical snapshot after setExpirations (empty = absence)", () => {
    const symbols = ["NOOPT"];
    sqlite.initUniverse(symbols);
    memory.initUniverse(symbols);

    sqlite.setExpirations("NOOPT", [], NOW);
    memory.setExpirations("NOOPT", [], NOW);

    expect(normalize(sqlite.buildSnapshot())).toEqual(normalize(memory.buildSnapshot()));
  });

  it("produces identical snapshot after setChain", () => {
    const symbols = ["XLE"];
    sqlite.initUniverse(symbols);
    memory.initUniverse(symbols);

    sqlite.setExpirations("XLE", EXPIRATIONS, NOW);
    memory.setExpirations("XLE", EXPIRATIONS, NOW);
    sqlite.setChain("XLE", CHAIN, NOW);
    memory.setChain("XLE", CHAIN, NOW);

    expect(normalize(sqlite.buildSnapshot())).toEqual(normalize(memory.buildSnapshot()));
  });

  it("produces identical snapshot after setFailure", () => {
    const symbols = ["XLE"];
    sqlite.initUniverse(symbols);
    memory.initUniverse(symbols);

    sqlite.setFailure("XLE", "timeout");
    memory.setFailure("XLE", "timeout");

    expect(normalize(sqlite.buildSnapshot())).toEqual(normalize(memory.buildSnapshot()));
  });

  it("produces identical work queue", () => {
    const symbols = ["A", "B", "C", "D"];
    sqlite.initUniverse(symbols);
    memory.initUniverse(symbols);

    // A: expirations known (needs chain)
    sqlite.setExpirations("A", EXPIRATIONS, NOW);
    memory.setExpirations("A", EXPIRATIONS, NOW);

    // B: ready (no work)
    sqlite.setExpirations("B", EXPIRATIONS, NOW);
    memory.setExpirations("B", EXPIRATIONS, NOW);
    sqlite.setChain("B", { ...CHAIN, symbol: "B" }, NOW);
    memory.setChain("B", { ...CHAIN, symbol: "B" }, NOW);

    // C: absent (no work)
    sqlite.setExpirations("C", [], NOW);
    memory.setExpirations("C", [], NOW);

    // D: pending (needs work)

    const sqliteWork = sqlite.getWorkQueue().sort();
    const memoryWork = memory.getWorkQueue().sort();
    expect(sqliteWork).toEqual(memoryWork);
  });
});

// --- Restart Recovery ---

describe("SqliteEvidenceStore — restart recovery", () => {
  const TEMP_DB = "./data/test-restart.sqlite3";

  afterEach(() => {
    if (existsSync(TEMP_DB)) unlinkSync(TEMP_DB);
  });

  it("rebuilds identical snapshot after close and reopen", () => {
    // First instance: acquire evidence
    const store1 = new SqliteEvidenceStore(TEMP_DB);
    store1.initUniverse(["XLE", "XLF", "NOOPT"]);
    store1.setExpirations("XLE", EXPIRATIONS, NOW);
    store1.setChain("XLE", CHAIN, NOW);
    store1.setExpirations("NOOPT", [], NOW);
    store1.publishSnapshot();

    const before = normalize(store1.buildSnapshot());
    store1.close();

    // Second instance: reopen same file
    const store2 = new SqliteEvidenceStore(TEMP_DB);
    const after = normalize(store2.buildSnapshot());
    store2.close();

    expect(after).toEqual(before);
  });

  it("work queue reflects only genuinely pending symbols after restart", () => {
    const store1 = new SqliteEvidenceStore(TEMP_DB);
    store1.initUniverse(["DONE", "PARTIAL", "PENDING"]);
    store1.setExpirations("DONE", EXPIRATIONS, NOW);
    store1.setChain("DONE", CHAIN, NOW);
    store1.setExpirations("PARTIAL", EXPIRATIONS, NOW);
    // PENDING: no evidence
    store1.close();

    const store2 = new SqliteEvidenceStore(TEMP_DB);
    const queue = store2.getWorkQueue().sort();
    store2.close();

    // DONE should not be in the queue; PARTIAL and PENDING should
    expect(queue).toEqual(["PARTIAL", "PENDING"]);
    expect(queue).not.toContain("DONE");
  });
});

// --- Failed Refresh Preservation ---

describe("SqliteEvidenceStore — failed refresh preservation", () => {
  let store: SqliteEvidenceStore;

  beforeEach(() => {
    store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
  });

  afterEach(() => {
    store.close();
  });

  it("failure does not overwrite last successful evidence", () => {
    // Success first
    store.setExpirations("XLE", EXPIRATIONS, NOW);
    store.setChain("XLE", CHAIN, NOW);

    // Verify evidence exists
    const before = store.get("XLE");
    expect(before?.status).toBe("ready");
    expect(before?.chain).not.toBeNull();

    // Now fail — this should NOT destroy the chain data
    store.setFailure("XLE", "provider 503");

    const after = store.get("XLE");
    // Status may change but data must persist
    expect(after?.chain).toEqual(CHAIN);
    expect(after?.expirations).toEqual(EXPIRATIONS);
  });
});

// --- Generation Behavior ---

describe("SqliteEvidenceStore — generation", () => {
  let store: SqliteEvidenceStore;

  beforeEach(() => {
    store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE", "XLF"]);
  });

  afterEach(() => {
    store.close();
  });

  it("generation does not increment on individual writes", () => {
    const gen0 = store.generation;
    store.setExpirations("XLE", EXPIRATIONS, NOW);
    store.setChain("XLE", CHAIN, NOW);
    expect(store.generation).toBe(gen0); // unchanged
  });

  it("generation increments on publishSnapshot()", () => {
    const gen0 = store.generation;
    store.setExpirations("XLE", EXPIRATIONS, NOW);
    store.publishSnapshot();
    expect(store.generation).toBe(gen0 + 1);
  });
});
