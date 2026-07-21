/**
 * API Scenario: Session Gating
 *
 * Proves through HTTP that acquisition behavior is controlled by the session gate,
 * using an injected clock for deterministic results regardless of when tests run.
 *
 * Scenarios:
 *   1. Regular session (Tuesday 11:00 ET) → worker runs, telemetry populated
 *   2. Closed canonical (Tuesday 17:00 ET) → worker session_blocked, no telemetry
 *   3. Non-trading day (Saturday) → worker session_blocked
 *   4. Pre-market (Tuesday 08:00 ET) → worker session_blocked
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { createHarness, installProviderMock, resetProviderStub, httpGet, waitFor, type TestHarness } from "../api-harness.js";
import type { MarketExpiration, MarketChain } from "../../src/providers/tradier.js";

// --- Fixtures ---

const SESSION_DATE = "2026-07-21"; // Tuesday
const EXPIRATIONS: MarketExpiration[] = [{ date: "2026-08-03", dte: 21 }];

const QUALIFYING_CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy Select Sector", price: 58.0 },
  puts: [{ strike: 55, bid: 1.50, ask: 1.70, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 60, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 }],
};

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

/**
 * Create a fixed clock returning a specific ET time on a known date.
 * Accounts for EDT (UTC-4) in summer 2026.
 */
function fixedClock(dateStr: string, etHour: number, etMinute: number): () => Date {
  // EDT = UTC-4 in summer
  const utcHour = etHour + 4;
  const isoStr = `${dateStr}T${String(utcHour).padStart(2, "0")}:${String(etMinute).padStart(2, "0")}:00.000Z`;
  const date = new Date(isoStr);
  return () => date;
}

// --- Scenario ---

describe("API scenario: session gating (deterministic clock)", () => {
  let harness: TestHarness;

  beforeAll(() => {
    installProviderMock();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    resetProviderStub();
  });

  afterEach(async () => {
    if (harness) await harness.teardown();
  });

  it("regular session: worker acquires, telemetry populated", async () => {
    // Tuesday 2026-07-21 at 11:00 ET → regular session
    harness = await createHarness({
      sessionDate: SESSION_DATE,
      clock: fixedClock("2026-07-21", 11, 0),
    });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(20));
    store.setChain("XLE", { ...QUALIFYING_CHAIN, symbol: "XLE" }, minutesAgo(20));
    store.publishSnapshot();

    harness.startWorker();

    // Worker should run a cycle and populate telemetry
    await waitFor(async () => {
      const res = await httpGet(harness.baseUrl, "/api/status");
      return res.body.schedulerTelemetry?.lastAssessedAt != null;
    }, 3000);

    const { body } = await httpGet(harness.baseUrl, "/api/status");

    expect(body.scheduler.state).not.toBe("session_blocked");
    expect(["idle", "acquiring"]).toContain(body.scheduler.state);
    expect(body.schedulerTelemetry.sessionState).toBe("Regular session");
    expect(body.schedulerTelemetry.cycleCount).toBeGreaterThan(0);
  });

  it("closed session: worker blocked, no cycle runs", async () => {
    // Tuesday 2026-07-21 at 17:00 ET → market closed (past 16:15 drain)
    harness = await createHarness({
      sessionDate: SESSION_DATE,
      clock: fixedClock("2026-07-21", 17, 0),
    });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(20));
    store.setChain("XLE", { ...QUALIFYING_CHAIN, symbol: "XLE" }, minutesAgo(20));
    store.publishSnapshot();

    harness.startWorker();

    // Wait enough time for the cycle to have attempted
    await new Promise(r => setTimeout(r, 1500));

    const { body } = await httpGet(harness.baseUrl, "/api/status");

    expect(body.scheduler.state).toBe("session_blocked");
    // Telemetry should NOT have been populated (no cycle ran)
    expect(body.schedulerTelemetry.lastAssessedAt).toBeNull();
    expect(body.schedulerTelemetry.cycleCount).toBe(0);
  });

  it("non-trading day (Saturday): worker blocked", async () => {
    // Saturday 2026-07-19 at 11:00 ET → weekend
    harness = await createHarness({
      sessionDate: "2026-07-19",
      clock: fixedClock("2026-07-19", 11, 0),
    });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(20));
    store.setChain("XLE", { ...QUALIFYING_CHAIN, symbol: "XLE" }, minutesAgo(20));
    store.publishSnapshot();

    harness.startWorker();

    await new Promise(r => setTimeout(r, 1500));

    const { body } = await httpGet(harness.baseUrl, "/api/status");

    expect(body.scheduler.state).toBe("session_blocked");
    expect(body.schedulerTelemetry.lastAssessedAt).toBeNull();
  });

  it("pre-market (08:00 ET): worker blocked", async () => {
    // Tuesday 2026-07-21 at 08:00 ET → pre-market (before 09:30)
    harness = await createHarness({
      sessionDate: SESSION_DATE,
      clock: fixedClock("2026-07-21", 8, 0),
    });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(20));
    store.setChain("XLE", { ...QUALIFYING_CHAIN, symbol: "XLE" }, minutesAgo(20));
    store.publishSnapshot();

    harness.startWorker();

    await new Promise(r => setTimeout(r, 1500));

    const { body } = await httpGet(harness.baseUrl, "/api/status");

    expect(body.scheduler.state).toBe("session_blocked");
    expect(body.schedulerTelemetry.lastAssessedAt).toBeNull();
  });
});
