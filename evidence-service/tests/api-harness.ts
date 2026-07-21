/**
 * API Component Test Harness
 *
 * Starts the real evidence-service application on an ephemeral port with:
 *   - A fresh temporary SQLite database
 *   - Controlled session date
 *   - Stubbed external provider (global fetch intercepted)
 *   - Full express app with all routes and middleware
 *
 * Tests interact ONLY through HTTP after startup. No internal method inspection.
 *
 * Boundary:
 *   - The harness seeds state by calling store methods BEFORE the worker starts.
 *     This represents "database state at process start" — equivalent to loading a
 *     pre-existing SQLite file. It is not reaching into internals during operation.
 *   - Once the worker is started, all assertions are HTTP-only.
 *   - The provider boundary is stubbed at the global `fetch` level — the adapter's
 *     HTTP calls are intercepted, not the adapter itself.
 */

import express from "express";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { SqliteEvidenceStore } from "../src/db/sqlite-evidence-store.js";
import { AcquisitionWorker, type SchedulerConfig, DEFAULT_SCHEDULER_CONFIG, _setWorkerForTest } from "../src/acquisition-worker.js";
import { _setStoreForTest } from "../src/evidence-store.js";
import type { ServiceConfig } from "../src/config.js";
import { statusRouter } from "../src/routes/status.js";
import { snapshotRouter } from "../src/routes/snapshot.js";
import { vi } from "vitest";

// --- Types ---

export interface HarnessOptions {
  /** Override session date for the store (ISO date string, e.g. "2026-07-21") */
  sessionDate?: string;
  /** Scheduler config overrides */
  schedulerConfig?: Partial<SchedulerConfig>;
  /** Injectable clock for deterministic session-gate testing (default: real clock) */
  clock?: () => Date;
  /** Whether to auto-start the worker (default: false — lets tests seed state first) */
  autoStartWorker?: boolean;
}

export interface TestHarness {
  /** Base URL for HTTP requests (e.g. "http://127.0.0.1:54321") */
  baseUrl: string;
  /** The store instance — use ONLY for pre-start seeding, not post-start inspection */
  store: SqliteEvidenceStore;
  /** The worker instance — use ONLY for start/stop lifecycle control */
  worker: AcquisitionWorker;
  /** Start the acquisition worker (call after seeding state) */
  startWorker: () => void;
  /** Stop the worker and close the server */
  teardown: () => Promise<void>;
  /** Path to the temporary database file */
  dbPath: string;
}

// --- Provider Stub ---

export interface ProviderStub {
  expirations: Record<string, { date: string; dte?: number }[]>;
  chains: Record<string, any>;
  quotes: Record<string, { price: number; name: string }>;
}

const DEFAULT_PROVIDER_STUB: ProviderStub = {
  expirations: {},
  chains: {},
  quotes: {},
};

let activeStub: ProviderStub = { ...DEFAULT_PROVIDER_STUB };

export function setProviderStub(stub: Partial<ProviderStub>): void {
  activeStub = { ...DEFAULT_PROVIDER_STUB, ...stub };
}

export function resetProviderStub(): void {
  activeStub = { ...DEFAULT_PROVIDER_STUB };
}

/**
 * Install the global fetch mock that intercepts Tradier API calls.
 */
export function installProviderMock(): void {
  vi.stubGlobal("fetch", vi.fn(async (url: string, _opts?: any) => {
    if (url.includes("/options/expirations")) {
      const match = url.match(/symbol=([^&]+)/);
      const symbol = match?.[1]?.toUpperCase() ?? "";
      const exps = activeStub.expirations[symbol];
      if (!exps || exps.length === 0) {
        return mockResponse({ expirations: { date: null } });
      }
      return mockResponse({ expirations: { date: exps.map(e => e.date) } });
    }

    if (url.includes("/options/chains")) {
      const symbolMatch = url.match(/symbol=([^&]+)/);
      const expMatch = url.match(/expiration=([^&]+)/);
      const symbol = symbolMatch?.[1]?.toUpperCase() ?? "";
      const exp = expMatch?.[1] ?? "";
      const key = `${symbol}:${exp}`;
      const chain = activeStub.chains[key];
      return mockResponse(chain ?? { options: { option: [] } });
    }

    if (url.includes("/markets/quotes")) {
      const match = url.match(/symbols=([^&]+)/);
      const symbol = match?.[1]?.toUpperCase() ?? "";
      const quote = activeStub.quotes[symbol];
      return mockResponse({
        quotes: { quote: { symbol, last: quote?.price ?? 50.0, description: quote?.name ?? symbol } },
      });
    }

    return mockResponse({});
  }));
}

function mockResponse(data: any) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    headers: new Map(),
  };
}

// --- Harness Factory ---

/**
 * Create a test harness instance.
 *
 * Lifecycle:
 * 1. createHarness() — creates DB, injects store/worker into singletons, starts server
 * 2. Seed state via harness.store (pre-start seeding = "loading existing DB")
 * 3. harness.startWorker() — begins acquisition cycles
 * 4. Make HTTP assertions via harness.baseUrl
 * 5. harness.teardown() — stops worker, closes server, restores singletons, removes temp DB
 */
export async function createHarness(options: HarnessOptions = {}): Promise<TestHarness> {
  const tmpDir = mkdtempSync(join(tmpdir(), "evidence-test-"));
  const dbPath = join(tmpDir, "evidence.sqlite3");

  // Create store on the temp database
  const store = new SqliteEvidenceStore(dbPath);

  if (options.sessionDate) {
    store.setSessionDateOverride(options.sessionDate);
  }

  // Inject store into the singleton so routes and worker find it
  _setStoreForTest(store);

  const config: ServiceConfig = {
    tradierApiKey: "test-stub-key",
    tradierBaseUrl: "https://sandbox.tradier.com/v1",
    port: 0,
  };

  const schedulerConfig: SchedulerConfig = {
    ...DEFAULT_SCHEDULER_CONFIG,
    ...options.schedulerConfig,
  };

  // Create worker (its constructor calls getEvidenceStore() which now returns our store)
  const clock = options.clock ?? (() => new Date());
  const worker = new AcquisitionWorker(config, schedulerConfig, clock);

  // Inject worker into singleton so status route finds it
  _setWorkerForTest(worker);

  // Build express app
  const app = express();
  app.set("etag", false);
  app.use("/api/evidence", snapshotRouter());
  app.use("/api", statusRouter(config));
  app.post("/api/evidence/refresh", (_req, res) => {
    worker.nudge();
    res.json({ status: "nudged" });
  });

  // Start server on ephemeral port
  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  const startWorker = () => {
    // Disable automatic universe seeding — tests provide their own universe via initUniverse
    const originalSeedPath = process.env.UNIVERSE_SEED_PATH;
    process.env.UNIVERSE_SEED_PATH = "";
    worker.start();
    // Restore (other code paths should not be affected within this process)
    if (originalSeedPath === undefined) {
      delete process.env.UNIVERSE_SEED_PATH;
    } else {
      process.env.UNIVERSE_SEED_PATH = originalSeedPath;
    }
  };

  if (options.autoStartWorker) {
    startWorker();
  }

  const teardown = async () => {
    try {
      worker.stop();
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      store.close();
    } finally {
      // Unconditional singleton reset — prevents state leakage even on test failure
      _setStoreForTest(null);
      _setWorkerForTest(null);
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  };

  return { baseUrl, store, worker, startWorker, teardown, dbPath };
}

// --- HTTP Helpers ---

/** Use node:http to make requests (avoids conflict with global fetch mock) */
import { request as httpRequest } from "node:http";

export async function httpGet(baseUrl: string, path: string, headers?: Record<string, string>): Promise<{
  status: number;
  body: any;
  headers: Record<string, string>;
}> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = httpRequest(url, { method: "GET", headers: headers ?? {} }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const responseHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(res.headers)) {
          if (value) responseHeaders[key] = Array.isArray(value) ? value[0] : value;
        }
        if (res.statusCode === 304) {
          resolve({ status: 304, body: null, headers: responseHeaders });
        } else {
          try {
            resolve({ status: res.statusCode ?? 200, body: JSON.parse(data), headers: responseHeaders });
          } catch {
            resolve({ status: res.statusCode ?? 200, body: data, headers: responseHeaders });
          }
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

export async function httpPost(baseUrl: string, path: string): Promise<{
  status: number;
  body: any;
}> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = httpRequest(url, { method: "POST" }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode ?? 200, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode ?? 200, body: data });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}
