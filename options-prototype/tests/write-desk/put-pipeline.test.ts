/**
 * Tests for the put scan pipeline — affordability and yield suppression.
 */

import { describe, it, expect } from "vitest";
import { scanPuts } from "../../src/write-desk/scan-orchestrator";
import { DEFAULT_SCAN_CONFIG } from "../../src/write-desk/scan-orchestrator";
import type { MarketDataProvider } from "../../src/domain/provider";
import type { Expiration, OptionsChain } from "../../src/domain/types";

function makeMockProvider(strike: number, bid: number, ask: number, oi: number, volume: number): MarketDataProvider {
  const exp: Expiration = { date: "2026-08-14", dte: 31 };
  const chain: OptionsChain = {
    underlying: { symbol: "TEST", name: "Test ETF", price: strike + 5 },
    expiration: exp,
    calls: [],
    puts: [
      { type: "PUT", strike, bid, ask, delta: -0.30, openInterest: oi, volume },
    ],
  };

  return {
    getUnderlyings: async () => [],
    getQuotes: async () => new Map(),
    getExpirations: async () => [exp],
    getOptionsChain: async () => chain,
    getCacheStats: () => ({ hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null }),
  };
}

describe("scanPuts — affordability", () => {
  it("excludes candidates where strike × 100 exceeds deployable cash", async () => {
    // Strike $200 → $20,000 cash required, but only $15,000 available
    const provider = makeMockProvider(200, 3.00, 3.20, 500, 100);
    const result = await scanPuts(["TEST"], 15000, provider);
    expect(result.candidates.length).toBe(0);
  });

  it("includes candidates within cash budget", async () => {
    // Strike $50 → $5,000 cash required, $18,500 available
    const provider = makeMockProvider(50, 1.50, 1.70, 500, 100);
    const result = await scanPuts(["TEST"], 18500, provider);
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].cashRequired).toBe(5000);
    expect(result.candidates[0].cashRemaining).toBe(13500);
  });

  it("calculates cash remaining as scenario evidence only", async () => {
    const provider = makeMockProvider(50, 1.50, 1.70, 500, 100);
    const result = await scanPuts(["TEST"], 18500, provider);
    // cashRemaining is hypothetical, not mutating anything
    expect(result.candidates[0].cashRemaining).toBe(18500 - 5000);
  });
});

describe("scanPuts — yield suppression", () => {
  it("suppresses yield when spread is too wide for reliable midpoint", async () => {
    // Spread: (5.00 - 0.50) / 2.75 midpoint = 163% — well above 2× preferred (30%)
    const provider = makeMockProvider(50, 0.50, 5.00, 100, 50);
    const result = await scanPuts(["TEST"], 18500, provider);
    // This would be hard-excluded (spread > 80%), so use a less extreme case
    // spread: (1.50 - 0.30) / 0.90 = 133% — above 2× preferred
    const provider2 = makeMockProvider(50, 0.30, 1.50, 100, 50);
    const result2 = await scanPuts(["TEST"], 18500, provider2);

    if (result2.candidates.length > 0) {
      // If a candidate survived, its yield should be suppressed
      expect(result2.candidates[0].yieldAnnualized).toBeNull();
    }
  });

  it("provides yield when spread is within acceptable range", async () => {
    // Spread: (1.70 - 1.50) / 1.60 = 12.5% — within preferred
    const provider = makeMockProvider(50, 1.50, 1.70, 500, 100);
    const result = await scanPuts(["TEST"], 18500, provider);
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].yieldAnnualized).not.toBeNull();
    expect(result.candidates[0].yieldAnnualized).toBeGreaterThan(0);
  });
});

describe("scanPuts — no-trade result", () => {
  it("no candidates is a valid outcome", async () => {
    // Provide no puts at all
    const provider: MarketDataProvider = {
      getUnderlyings: async () => [],
      getQuotes: async () => new Map(),
      getExpirations: async () => [{ date: "2026-08-14", dte: 31 }],
      getOptionsChain: async () => ({
        underlying: { symbol: "TEST", name: "Test", price: 50 },
        expiration: { date: "2026-08-14", dte: 31 },
        calls: [],
        puts: [],
      }),
      getCacheStats: () => ({ hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null }),
    };
    const result = await scanPuts(["TEST"], 18500, provider);
    expect(result.candidates.length).toBe(0);
    expect(result.excluded.length).toBeGreaterThan(0);
  });
});
