/**
 * API Scenario: Snapshot Contract and ETag/304 Behavior
 *
 * Proves through HTTP:
 *   1. GET /api/evidence/snapshot returns the v1 contract shape
 *   2. Response includes ETag header
 *   3. Subsequent request with If-None-Match returns 304 (no body)
 *   4. After evidence changes (new generation), stale ETag gets 200 with new data
 *   5. Coverage fields reflect actual symbol states
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { createHarness, installProviderMock, resetProviderStub, setProviderStub, httpGet, waitFor, type TestHarness } from "../api-harness.js";
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

describe("API scenario: snapshot contract and ETag", () => {
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

  it("snapshot response has v1 contract shape", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["XLE", "NOOPT"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(5));
    store.setChain("XLE", CHAIN, minutesAgo(5));
    store.setExpirations("NOOPT", [], minutesAgo(5));
    store.publishSnapshot();

    const { status, body } = await httpGet(harness.baseUrl, "/api/evidence/snapshot");

    expect(status).toBe(200);
    expect(body.apiVersion).toBe("1");
    expect(body).toHaveProperty("generation");
    expect(body).toHaveProperty("generatedAt");
    expect(body).toHaveProperty("universe");
    expect(body).toHaveProperty("coverage");
    expect(body).toHaveProperty("symbols");

    // Coverage structure
    expect(body.coverage).toHaveProperty("ready");
    expect(body.coverage).toHaveProperty("absent");
    expect(body.coverage).toHaveProperty("pending");
    expect(body.coverage).toHaveProperty("failed");

    // Symbol evidence structure
    const xle = body.symbols.find((s: any) => s.symbol === "XLE");
    expect(xle).toBeDefined();
    expect(xle.status).toBe("ready");
    expect(xle.chain).not.toBeNull();

    const noopt = body.symbols.find((s: any) => s.symbol === "NOOPT");
    expect(noopt).toBeDefined();
    expect(noopt.status).toBe("absent");
    expect(noopt.chain).toBeNull();
  });

  it("response includes ETag header", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(5));
    store.setChain("XLE", CHAIN, minutesAgo(5));
    store.publishSnapshot();

    const { headers } = await httpGet(harness.baseUrl, "/api/evidence/snapshot");

    expect(headers["etag"]).toBeDefined();
    expect(headers["etag"]).toMatch(/^"gen-\d+"$/);
  });

  it("conditional request with matching ETag returns 304", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(5));
    store.setChain("XLE", CHAIN, minutesAgo(5));
    store.publishSnapshot();

    // First request to get the ETag
    const first = await httpGet(harness.baseUrl, "/api/evidence/snapshot");
    expect(first.status).toBe(200);
    const etag = first.headers["etag"];
    expect(etag).toBeDefined();

    // Second request with If-None-Match
    const second = await httpGet(harness.baseUrl, "/api/evidence/snapshot", {
      "If-None-Match": etag,
    });

    expect(second.status).toBe(304);
    expect(second.body).toBeNull();
  });

  it("new generation after evidence change produces new ETag and 200", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["XLE", "SPY"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(5));
    store.setChain("XLE", CHAIN, minutesAgo(5));
    store.publishSnapshot();

    // Get initial ETag
    const first = await httpGet(harness.baseUrl, "/api/evidence/snapshot");
    const oldEtag = first.headers["etag"];
    const oldGen = first.body.generation;

    // Advance evidence state — add SPY data and publish
    store.setExpirations("SPY", EXPIRATIONS, minutesAgo(1));
    store.setChain("SPY", { ...CHAIN, symbol: "SPY" }, minutesAgo(1));
    store.publishSnapshot();

    // Request with stale ETag should get 200 (not 304)
    const second = await httpGet(harness.baseUrl, "/api/evidence/snapshot", {
      "If-None-Match": oldEtag,
    });

    expect(second.status).toBe(200);
    expect(second.body.generation).toBeGreaterThan(oldGen);
    expect(second.headers["etag"]).not.toBe(oldEtag);

    // New data should include SPY
    const spy = second.body.symbols.find((s: any) => s.symbol === "SPY");
    expect(spy).toBeDefined();
    expect(spy.status).toBe("ready");
  });

  it("coverage reflects actual symbol state counts", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["READY1", "READY2", "ABSENT1", "PENDING1", "PENDING2", "PENDING3"]);
    store.setExpirations("READY1", EXPIRATIONS, minutesAgo(5));
    store.setChain("READY1", { ...CHAIN, symbol: "READY1" }, minutesAgo(5));
    store.setExpirations("READY2", EXPIRATIONS, minutesAgo(5));
    store.setChain("READY2", { ...CHAIN, symbol: "READY2" }, minutesAgo(5));
    store.setExpirations("ABSENT1", [], minutesAgo(5));
    // PENDING1, PENDING2, PENDING3 remain pending
    store.publishSnapshot();

    const { body } = await httpGet(harness.baseUrl, "/api/evidence/snapshot");

    expect(body.universe).toBe(6);
    expect(body.coverage.ready).toBe(2);
    expect(body.coverage.absent).toBe(1);
    expect(body.coverage.pending).toBe(3);
    expect(body.coverage.failed).toBe(0);
  });
});
