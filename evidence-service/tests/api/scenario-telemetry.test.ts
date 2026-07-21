/**
 * API Scenario: Mixed Scheduler Population — Telemetry Semantics
 *
 * Proves through HTTP that the published telemetry shows:
 *   eligible = total classified population per class
 *   due = currently actionable work (subset of eligible)
 *
 * Arrangement: seed deterministic symbol histories before worker start.
 * Assertion: query /api/status and verify the published telemetry.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { createHarness, installProviderMock, resetProviderStub, httpGet, waitFor, type TestHarness } from "../api-harness.js";
import type { MarketExpiration, MarketChain } from "../../src/providers/tradier.js";

// --- Fixtures ---

const SESSION_DATE = "2026-07-21";
const PRIOR_SESSION = "2026-07-18";

const EXPIRATIONS: MarketExpiration[] = [{ date: "2026-08-03", dte: 21 }];

const QUALIFYING_CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy Select Sector", price: 58.0 },
  puts: [{ strike: 55, bid: 1.50, ask: 1.70, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 60, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 }],
};

const NONQUALIFYING_CHAIN: MarketChain = {
  symbol: "BG",
  expiration: "2026-08-03",
  underlying: { symbol: "BG", name: "Background ETF", price: 10.0 },
  puts: [{ strike: 9, bid: 0, ask: 0.05, delta: -0.10, openInterest: 0, volume: 0 }],
  calls: [],
};

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// --- Scenario ---

describe("API scenario: mixed population telemetry", () => {
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

  it("eligible and due diverge for fresh vs stale Class A symbols", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["FRESH_A", "STALE_A"]);
    store.setExpirations("FRESH_A", EXPIRATIONS, minutesAgo(5));
    store.setChain("FRESH_A", { ...QUALIFYING_CHAIN, symbol: "FRESH_A" }, minutesAgo(5));
    store.setExpirations("STALE_A", EXPIRATIONS, minutesAgo(20));
    store.setChain("STALE_A", { ...QUALIFYING_CHAIN, symbol: "STALE_A" }, minutesAgo(20));
    store.publishSnapshot();

    harness.startWorker();

    await waitFor(async () => {
      const res = await httpGet(harness.baseUrl, "/api/status");
      return res.body.schedulerTelemetry?.lastAssessedAt != null;
    }, 3000);

    const { body } = await httpGet(harness.baseUrl, "/api/status");
    const telemetry = body.schedulerTelemetry;

    expect(telemetry.eligible.classA).toBe(2);
    expect(telemetry.due.classA).toBe(1);
    expect(telemetry.eligible.classA).toBeGreaterThan(telemetry.due.classA);
  });

  it("eligible and due diverge for fresh vs stale Class B symbols", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["FRESH_B", "STALE_B"]);
    store.setExpirations("FRESH_B", EXPIRATIONS, minutesAgo(60));
    store.setChain("FRESH_B", { ...NONQUALIFYING_CHAIN, symbol: "FRESH_B" }, minutesAgo(60));
    store.setExpirations("STALE_B", EXPIRATIONS, hoursAgo(3));
    store.setChain("STALE_B", { ...NONQUALIFYING_CHAIN, symbol: "STALE_B" }, hoursAgo(3));
    store.publishSnapshot();

    harness.startWorker();

    await waitFor(async () => {
      const res = await httpGet(harness.baseUrl, "/api/status");
      return res.body.schedulerTelemetry?.lastAssessedAt != null;
    }, 3000);

    const { body } = await httpGet(harness.baseUrl, "/api/status");
    const telemetry = body.schedulerTelemetry;

    expect(telemetry.eligible.classB).toBe(2);
    expect(telemetry.due.classB).toBe(1);
    expect(telemetry.eligible.classB).toBeGreaterThan(telemetry.due.classB);
  });

  it("pending symbols appear as Class C in both eligible and due", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["PENDING1", "PENDING2"]);
    store.publishSnapshot();

    harness.startWorker();

    await waitFor(async () => {
      const res = await httpGet(harness.baseUrl, "/api/status");
      return res.body.schedulerTelemetry?.lastAssessedAt != null;
    }, 3000);

    const { body } = await httpGet(harness.baseUrl, "/api/status");
    const telemetry = body.schedulerTelemetry;

    expect(telemetry.eligible.classC).toBe(2);
    expect(telemetry.due.classC).toBe(2);
  });

  it("prior-epoch absent symbols appear as Class D in both eligible and due", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["ABSENT1"]);
    store.setSessionDateOverride(PRIOR_SESSION);
    store.setExpirations("ABSENT1", [], "2026-07-18T14:00:00Z");
    store.setSessionDateOverride(SESSION_DATE);
    store.publishSnapshot();

    harness.startWorker();

    await waitFor(async () => {
      const res = await httpGet(harness.baseUrl, "/api/status");
      return res.body.schedulerTelemetry?.lastAssessedAt != null;
    }, 3000);

    const { body } = await httpGet(harness.baseUrl, "/api/status");
    const telemetry = body.schedulerTelemetry;

    expect(telemetry.eligible.classD).toBe(1);
    expect(telemetry.due.classD).toBe(1);
  });

  it("mixed population: eligible and due diverge across all classes", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["FRESH_A", "STALE_A", "FRESH_B", "STALE_B", "PENDING", "PRIOR_ABSENT"]);

    store.setExpirations("FRESH_A", EXPIRATIONS, minutesAgo(5));
    store.setChain("FRESH_A", { ...QUALIFYING_CHAIN, symbol: "FRESH_A" }, minutesAgo(5));
    store.setExpirations("STALE_A", EXPIRATIONS, minutesAgo(20));
    store.setChain("STALE_A", { ...QUALIFYING_CHAIN, symbol: "STALE_A" }, minutesAgo(20));
    store.setExpirations("FRESH_B", EXPIRATIONS, minutesAgo(60));
    store.setChain("FRESH_B", { ...NONQUALIFYING_CHAIN, symbol: "FRESH_B" }, minutesAgo(60));
    store.setExpirations("STALE_B", EXPIRATIONS, hoursAgo(3));
    store.setChain("STALE_B", { ...NONQUALIFYING_CHAIN, symbol: "STALE_B" }, hoursAgo(3));

    store.setSessionDateOverride(PRIOR_SESSION);
    store.setExpirations("PRIOR_ABSENT", [], "2026-07-18T14:00:00Z");
    store.setSessionDateOverride(SESSION_DATE);

    store.publishSnapshot();
    harness.startWorker();

    await waitFor(async () => {
      const res = await httpGet(harness.baseUrl, "/api/status");
      return res.body.schedulerTelemetry?.lastAssessedAt != null;
    }, 3000);

    const { body } = await httpGet(harness.baseUrl, "/api/status");
    const telemetry = body.schedulerTelemetry;

    expect(telemetry.eligible.classA).toBe(2);
    expect(telemetry.eligible.classB).toBe(2);
    expect(telemetry.eligible.classC).toBe(1);
    expect(telemetry.eligible.classD).toBe(1);

    expect(telemetry.due.classA).toBe(1);
    expect(telemetry.due.classB).toBe(1);
    expect(telemetry.due.classC).toBe(1);
    expect(telemetry.due.classD).toBe(1);

    expect(telemetry.eligible.classA).toBeGreaterThan(telemetry.due.classA);
    expect(telemetry.eligible.classB).toBeGreaterThan(telemetry.due.classB);
  });

  it("current-session absent and retry-exhausted excluded from telemetry", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["ABSENT_TODAY", "EXHAUSTED", "VISIBLE_A"]);

    store.setExpirations("ABSENT_TODAY", [], minutesAgo(30));
    store.setExpirations("EXHAUSTED", EXPIRATIONS, minutesAgo(30));
    store.setFailure("EXHAUSTED", "e1");
    store.setFailure("EXHAUSTED", "e2");
    store.setFailure("EXHAUSTED", "e3");
    store.setExpirations("VISIBLE_A", EXPIRATIONS, minutesAgo(5));
    store.setChain("VISIBLE_A", { ...QUALIFYING_CHAIN, symbol: "VISIBLE_A" }, minutesAgo(5));

    store.publishSnapshot();
    harness.startWorker();

    await waitFor(async () => {
      const res = await httpGet(harness.baseUrl, "/api/status");
      return res.body.schedulerTelemetry?.lastAssessedAt != null;
    }, 3000);

    const { body } = await httpGet(harness.baseUrl, "/api/status");
    const telemetry = body.schedulerTelemetry;

    const totalEligible = telemetry.eligible.classA + telemetry.eligible.classB +
      telemetry.eligible.classC + telemetry.eligible.classD;
    expect(totalEligible).toBe(1);
    expect(telemetry.eligible.classA).toBe(1);
  });
});
