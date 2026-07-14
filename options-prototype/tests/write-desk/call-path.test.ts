/**
 * Tests for the covered-call scan path.
 *
 * Validates:
 * - Only positions with >= 100 free shares are scanned
 * - Encumbered positions produce no candidates
 * - Sub-100 positions produce no candidates
 * - Call candidates use correct inventory context
 */

import { describe, it, expect } from "vitest";
import { scanCalls, type CallInventoryItem } from "../../src/write-desk/scan-orchestrator";
import type { InventoryPosition } from "../../src/write-desk/types";
import type { MarketDataProvider } from "../../src/domain/provider";
import type { Expiration, OptionsChain } from "../../src/domain/types";

// --- Mock Provider ---

function makeMockProvider(hasChain: boolean): MarketDataProvider {
  const exp: Expiration = { date: "2026-08-14", dte: 31 };
  const chain: OptionsChain = {
    underlying: { symbol: "XLE", name: "Energy ETF", price: 90 },
    expiration: exp,
    calls: hasChain ? [
      { type: "CALL", strike: 95, bid: 1.20, ask: 1.40, delta: 0.30, openInterest: 500, volume: 100 },
      { type: "CALL", strike: 97, bid: 0.80, ask: 1.00, delta: 0.20, openInterest: 300, volume: 80 },
    ] : [],
    puts: [],
  };

  return {
    getUnderlyings: async () => [],
    getQuotes: async () => new Map(),
    getExpirations: async () => [exp],
    getOptionsChain: async () => chain,
    getCacheStats: () => ({ hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null }),
  };
}

// --- Tests ---

describe("scanCalls", () => {
  it("produces candidate for position with free shares", async () => {
    const inventory: InventoryPosition[] = [
      { symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1 },
    ];

    const result = await scanCalls(inventory, makeMockProvider(true));
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].symbol).toBe("XLE");
    expect(result.candidates[0].freeShares).toBe(100);
    expect(result.candidates[0].maxContracts).toBe(1);
    expect(result.candidates[0].posture).toBeDefined();
  });

  it("reports fully encumbered positions as unavailable", async () => {
    const inventory: InventoryPosition[] = [
      { symbol: "QQQ", sharesOwned: 300, sharesEncumbered: 300, sharesFree: 0, maxAdditionalContracts: 0 },
    ];

    const result = await scanCalls(inventory, makeMockProvider(true));
    expect(result.candidates.length).toBe(0);
    const item = result.inventory.find((i) => i.symbol === "QQQ");
    expect(item).toBeDefined();
    expect(item!.reason).toBe("Fully encumbered");
  });

  it("reports sub-100 positions as below lot size", async () => {
    const inventory: InventoryPosition[] = [
      { symbol: "IWM", sharesOwned: 75, sharesEncumbered: 0, sharesFree: 75, maxAdditionalContracts: 0 },
    ];

    const result = await scanCalls(inventory, makeMockProvider(true));
    expect(result.candidates.length).toBe(0);
    const item = result.inventory.find((i) => i.symbol === "IWM");
    expect(item).toBeDefined();
    expect(item!.reason).toContain("below 1 lot");
  });

  it("Fidelity XLE scenario: 400 owned, 400 encumbered = no capacity", async () => {
    const inventory: InventoryPosition[] = [
      { symbol: "XLE", sharesOwned: 400, sharesEncumbered: 400, sharesFree: 0, maxAdditionalContracts: 0 },
    ];

    const result = await scanCalls(inventory, makeMockProvider(true));
    expect(result.candidates.length).toBe(0);
    const item = result.inventory.find((i) => i.symbol === "XLE");
    expect(item!.reason).toBe("Fully encumbered");
  });

  it("Demo XLE scenario: 200 owned, 100 encumbered = 1 contract", async () => {
    const inventory: InventoryPosition[] = [
      { symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100, maxAdditionalContracts: 1 },
    ];

    const result = await scanCalls(inventory, makeMockProvider(true));
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].maxContracts).toBe(1);
    expect(result.candidates[0].strike).toBeGreaterThan(0);
  });

  it("no-capacity result is valid operational outcome", async () => {
    const inventory: InventoryPosition[] = [
      { symbol: "QQQ", sharesOwned: 300, sharesEncumbered: 300, sharesFree: 0, maxAdditionalContracts: 0 },
      { symbol: "SPYI", sharesOwned: 50, sharesEncumbered: 0, sharesFree: 50, maxAdditionalContracts: 0 },
    ];

    const result = await scanCalls(inventory, makeMockProvider(true));
    expect(result.candidates.length).toBe(0);
    // All positions accounted for
    expect(result.inventory.length).toBe(2);
    expect(result.inventory.every((i) => i.reason !== null)).toBe(true);
  });
});
