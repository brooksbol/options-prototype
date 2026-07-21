/**
 * API Scenario: Persistence Across Restart
 *
 * Proves through HTTP that evidence survives a service restart:
 *   1. Seed evidence, publish, verify via HTTP
 *   2. Teardown (simulates process stop)
 *   3. Restart with the same database file
 *   4. Verify snapshot still contains the evidence via HTTP
 *   5. Generation is preserved (SQLite persistence)
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createHarness, installProviderMock, resetProviderStub, httpGet, type TestHarness } from "../api-harness.js";
import { SqliteEvidenceStore } from "../../src/db/sqlite-evidence-store.js";
import { AcquisitionWorker, DEFAULT_SCHEDULER_CONFIG, _setWorkerForTest } from "../../src/acquisition-worker.js";
import { _setStoreForTest } from "../../src/evidence-store.js";
import { statusRouter } from "../../src/routes/status.js";
import { snapshotRouter } from "../../src/routes/snapshot.js";
import express from "express";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import type { MarketExpiration, MarketChain } from "../../src/providers/tradier.js";

// --- Fixtures ---

const SESSION_DATE = "2026-07-21";
const EXPIRATIONS: MarketExpiration[] = [{ date: "2026-08-03", dte: 21 }];

const CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy Select Sector", price: 58.0 },
  puts: [{ strike: 55, bid: 1.50, ask: 1.70, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 60, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 }],
};

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

// --- Scenario ---

describe("API scenario: persistence across restart", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "evidence-restart-"));
  const dbPath = join(tmpDir, "evidence.sqlite3");

  beforeAll(() => {
    installProviderMock();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    resetProviderStub();
    _setStoreForTest(null);
    _setWorkerForTest(null);
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it("evidence and generation survive restart with same database", async () => {
    // --- Phase 1: Initial run, seed evidence, publish ---
    const store1 = new SqliteEvidenceStore(dbPath);
    store1.setSessionDateOverride(SESSION_DATE);
    store1.initUniverse(["XLE", "NOOPT", "PENDING1"]);
    store1.setExpirations("XLE", EXPIRATIONS, minutesAgo(5));
    store1.setChain("XLE", CHAIN, minutesAgo(5));
    store1.setExpirations("NOOPT", [], minutesAgo(5));
    store1.publishSnapshot();

    _setStoreForTest(store1);
    const config1 = { tradierApiKey: "test", tradierBaseUrl: "https://sandbox.tradier.com/v1", port: 0 };
    const worker1 = new AcquisitionWorker(config1, DEFAULT_SCHEDULER_CONFIG);
    _setWorkerForTest(worker1);

    const app1 = express();
    app1.set("etag", false);
    app1.use("/api/evidence", snapshotRouter());
    app1.use("/api", statusRouter(config1));

    const server1 = createServer(app1);
    await new Promise<void>(r => server1.listen(0, "127.0.0.1", r));
    const addr1 = server1.address() as { port: number };
    const baseUrl1 = `http://127.0.0.1:${addr1.port}`;

    // Verify initial state via HTTP
    const initial = await httpGet(baseUrl1, "/api/evidence/snapshot");
    expect(initial.status).toBe(200);
    expect(initial.body.universe).toBe(3);
    expect(initial.body.coverage.ready).toBe(1);
    expect(initial.body.coverage.absent).toBe(1);
    expect(initial.body.coverage.pending).toBe(1);
    const gen1 = initial.body.generation;
    expect(gen1).toBeGreaterThan(0);

    const xle1 = initial.body.symbols.find((s: any) => s.symbol === "XLE");
    expect(xle1.status).toBe("ready");
    expect(xle1.chain).not.toBeNull();

    // --- Phase 2: Shutdown (simulate process stop) ---
    worker1.stop();
    await new Promise<void>((resolve, reject) => server1.close(err => err ? reject(err) : resolve()));
    store1.close();

    // --- Phase 3: Restart with same database file ---
    const store2 = new SqliteEvidenceStore(dbPath);
    store2.setSessionDateOverride(SESSION_DATE);

    _setStoreForTest(store2);
    const config2 = { tradierApiKey: "test", tradierBaseUrl: "https://sandbox.tradier.com/v1", port: 0 };
    const worker2 = new AcquisitionWorker(config2, DEFAULT_SCHEDULER_CONFIG);
    _setWorkerForTest(worker2);

    const app2 = express();
    app2.set("etag", false);
    app2.use("/api/evidence", snapshotRouter());
    app2.use("/api", statusRouter(config2));

    const server2 = createServer(app2);
    await new Promise<void>(r => server2.listen(0, "127.0.0.1", r));
    const addr2 = server2.address() as { port: number };
    const baseUrl2 = `http://127.0.0.1:${addr2.port}`;

    // --- Phase 4: Verify via HTTP that evidence survived ---
    const restarted = await httpGet(baseUrl2, "/api/evidence/snapshot");
    expect(restarted.status).toBe(200);
    expect(restarted.body.universe).toBe(3);
    expect(restarted.body.coverage.ready).toBe(1);
    expect(restarted.body.coverage.absent).toBe(1);
    expect(restarted.body.coverage.pending).toBe(1);

    // Generation preserved
    expect(restarted.body.generation).toBe(gen1);

    // Evidence data preserved
    const xle2 = restarted.body.symbols.find((s: any) => s.symbol === "XLE");
    expect(xle2.status).toBe("ready");
    expect(xle2.chain).not.toBeNull();
    expect(xle2.chain.puts.length).toBeGreaterThan(0);

    const noopt2 = restarted.body.symbols.find((s: any) => s.symbol === "NOOPT");
    expect(noopt2.status).toBe("absent");

    // ETag matches same generation
    expect(restarted.headers["etag"]).toBe(initial.headers["etag"]);

    // Cleanup
    worker2.stop();
    await new Promise<void>((resolve, reject) => server2.close(err => err ? reject(err) : resolve()));
    store2.close();
  });
});
