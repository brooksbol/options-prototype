/**
 * API Scenario: Failed-Refresh Preservation
 *
 * Proves through HTTP that a failed acquisition attempt does NOT destroy
 * prior successful evidence:
 *   1. Symbol has ready evidence (chain data visible in snapshot)
 *   2. A subsequent failure is recorded
 *   3. The snapshot still serves the prior successful chain data
 *   4. The symbol's status reflects the failure without data loss
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { createHarness, installProviderMock, resetProviderStub, httpGet, type TestHarness } from "../api-harness.js";
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

describe("API scenario: failed-refresh preservation", () => {
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

  it("single failure does not destroy prior ready evidence", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(10));
    store.setChain("XLE", CHAIN, minutesAgo(10));
    store.publishSnapshot();

    // Verify ready state via HTTP
    const before = await httpGet(harness.baseUrl, "/api/evidence/snapshot");
    const xleBefore = before.body.symbols.find((s: any) => s.symbol === "XLE");
    expect(xleBefore.status).toBe("ready");
    expect(xleBefore.chain).not.toBeNull();
    expect(xleBefore.chain.puts.length).toBeGreaterThan(0);

    // Record a failure (simulates a failed refresh attempt)
    store.setFailure("XLE", "provider timeout");
    store.publishSnapshot();

    // Verify via HTTP: chain data still served despite failure
    const after = await httpGet(harness.baseUrl, "/api/evidence/snapshot");
    const xleAfter = after.body.symbols.find((s: any) => s.symbol === "XLE");

    // Evidence NOT destroyed — chain still present
    expect(xleAfter.chain).not.toBeNull();
    expect(xleAfter.chain.puts.length).toBeGreaterThan(0);
    expect(xleAfter.chain.puts[0].strike).toBe(55);

    // Status remains ready (single failure doesn't change status to failed)
    expect(xleAfter.status).toBe("ready");
  });

  it("three failures move to failed status but preserve chain data", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(10));
    store.setChain("XLE", CHAIN, minutesAgo(10));
    store.publishSnapshot();

    // Exhaust retries
    store.setFailure("XLE", "timeout 1");
    store.setFailure("XLE", "timeout 2");
    store.setFailure("XLE", "timeout 3");
    store.publishSnapshot();

    // Verify via HTTP
    const result = await httpGet(harness.baseUrl, "/api/evidence/snapshot");
    const xle = result.body.symbols.find((s: any) => s.symbol === "XLE");

    // Status moved to failed
    expect(xle.status).toBe("failed");

    // But chain data is PRESERVED — not nulled out
    expect(xle.chain).not.toBeNull();
    expect(xle.chain.puts.length).toBeGreaterThan(0);
  });

  it("successful refresh after failure restores ready status", async () => {
    harness = await createHarness({ sessionDate: SESSION_DATE });
    const { store } = harness;

    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(20));
    store.setChain("XLE", CHAIN, minutesAgo(20));

    // Record failures
    store.setFailure("XLE", "timeout 1");
    store.setFailure("XLE", "timeout 2");
    store.publishSnapshot();

    // Successful refresh with new data
    const newChain: MarketChain = {
      ...CHAIN,
      underlying: { ...CHAIN.underlying, price: 59.5 },
    };
    store.setChain("XLE", newChain, minutesAgo(1));
    store.publishSnapshot();

    // Verify via HTTP
    const result = await httpGet(harness.baseUrl, "/api/evidence/snapshot");
    const xle = result.body.symbols.find((s: any) => s.symbol === "XLE");

    expect(xle.status).toBe("ready");
    expect(xle.chain).not.toBeNull();
    expect(xle.chain.underlying.price).toBe(59.5);
  });
});
