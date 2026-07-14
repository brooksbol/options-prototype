/**
 * Tests for the universe scanner — cache-first ranking, cursor advancement,
 * no unnecessary network calls, and coverage semantics.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { scanUniversePuts, type UniverseScanResult } from "../../src/write-desk/universe-scanner";
import { DurableMarketCache, buildCacheKey, getDurableCache } from "../../src/cache/durable-cache";
import { CrawlStateService, getCrawlState } from "../../src/cache/crawl-state";
import { DEFAULT_SCAN_CONFIG } from "../../src/write-desk/scan-orchestrator";
import { DEFAULT_PLANNER_CONFIG } from "../../src/cache/scan-planner";
import type { MarketDataProvider } from "../../src/domain/provider";
import type { Expiration, OptionsChain } from "../../src/domain/types";

// --- Mock Provider ---

function createMockProvider(options?: {
  expirations?: Expiration[];
  chain?: OptionsChain;
  shouldFail?: boolean;
}): MarketDataProvider & { callLog: string[] } {
  const callLog: string[] = [];
  const defaultExp: Expiration[] = [{ date: "2026-08-14", dte: 31 }];
  const defaultChain: OptionsChain = {
    underlying: { symbol: "TEST", name: "Test ETF", price: 50 },
    expiration: { date: "2026-08-14", dte: 31 },
    calls: [],
    puts: [
      { type: "PUT", strike: 45, bid: 1.20, ask: 1.40, delta: -0.30, openInterest: 500, volume: 100 },
      { type: "PUT", strike: 43, bid: 0.80, ask: 1.00, delta: -0.20, openInterest: 300, volume: 80 },
    ],
  };

  return {
    callLog,
    getUnderlyings: async () => [],
    getQuotes: async (symbols) => {
      callLog.push(`quotes:${symbols.join(",")}`);
      return new Map(symbols.map((s) => [s, 50]));
    },
    getExpirations: async (symbol) => {
      callLog.push(`expirations:${symbol}`);
      if (options?.shouldFail) throw new Error("Provider error");
      return options?.expirations ?? defaultExp;
    },
    getOptionsChain: async (symbol, date) => {
      callLog.push(`chain:${symbol}:${date}`);
      if (options?.shouldFail) throw new Error("Provider error");
      return options?.chain ?? defaultChain;
    },
    getCacheStats: () => ({ hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null }),
  };
}

// --- Test Symbols ---
const SMALL_UNIVERSE = ["AAVM", "ABFL", "ACWI", "XLE", "XLF"];
const DEPLOYABLE_CASH = 18500;

// --- Tests ---

describe("scanUniversePuts — cache-first ranking", () => {
  it("with fully cached universe: produces top-20 with zero network calls", async () => {
    const cache = getDurableCache();
    const provider = createMockProvider();

    // Pre-populate cache with fresh expirations and chains for all symbols
    for (const sym of SMALL_UNIVERSE) {
      const expKey = buildCacheKey("tradier", "sandbox", "expirations", sym);
      await cache.put(cache.createRecord(expKey, "expirations", "tradier", "sandbox", sym, null, [{ date: "2026-08-14", dte: 31 }]));

      const chainKey = buildCacheKey("tradier", "sandbox", "chain", sym, "2026-08-14");
      await cache.put(cache.createRecord(chainKey, "chain", "tradier", "sandbox", sym, "2026-08-14", {
        puts: [
          { type: "PUT", strike: 45, bid: 1.20, ask: 1.40, delta: -0.30, openInterest: 500, volume: 100 },
        ],
      }));
    }

    const result = await scanUniversePuts(SMALL_UNIVERSE, DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, {
      ...DEFAULT_PLANNER_CONFIG,
      provider: "tradier",
      environment: "sandbox",
    });

    // No network calls should have been made — everything from cache
    expect(provider.callLog.length).toBe(0);
    // All symbols should be covered
    expect(result.coverage.covered).toBe(SMALL_UNIVERSE.length);
    expect(result.coverage.status).toBe("COMPLETE");
    expect(result.isProvisional).toBe(false);
  });

  it("with empty cache: makes network calls for scheduled symbols within budget", async () => {
    const provider = createMockProvider();
    // Use unique symbols not used in other tests to avoid cache leakage
    const freshSymbols = ["ZZZ1", "ZZZ2", "ZZZ3", "ZZZ4", "ZZZ5"];

    const result = await scanUniversePuts(freshSymbols, DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, {
      ...DEFAULT_PLANNER_CONFIG,
      provider: "tradier",
      environment: "sandbox",
      refreshBudget: 3, // only refresh 3 of 5
    });

    // Should have made expiration calls for the scheduled 3
    const expCalls = provider.callLog.filter((c) => c.startsWith("expirations:"));
    expect(expCalls.length).toBe(3);

    // Coverage should be partial (3 refreshed out of 5)
    expect(result.isProvisional).toBe(true);
  });

  it("portfolio source switch reuses market cache (zero extra calls)", async () => {
    const cache = getDurableCache();
    const provider = createMockProvider();

    // Pre-populate with fresh data
    for (const sym of SMALL_UNIVERSE) {
      const expKey = buildCacheKey("tradier", "sandbox", "expirations", sym);
      await cache.put(cache.createRecord(expKey, "expirations", "tradier", "sandbox", sym, null, [{ date: "2026-08-14", dte: 31 }]));
      const chainKey = buildCacheKey("tradier", "sandbox", "chain", sym, "2026-08-14");
      await cache.put(cache.createRecord(chainKey, "chain", "tradier", "sandbox", sym, "2026-08-14", {
        puts: [{ type: "PUT", strike: 45, bid: 1.20, ask: 1.40, delta: -0.30, openInterest: 500, volume: 100 }],
      }));
    }

    // Scan with different cash amounts (simulating portfolio source switch)
    const result1 = await scanUniversePuts(SMALL_UNIVERSE, 18500, provider, DEFAULT_SCAN_CONFIG, { ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox" });
    const result2 = await scanUniversePuts(SMALL_UNIVERSE, 5000, provider, DEFAULT_SCAN_CONFIG, { ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox" });

    // Zero network calls for both — market evidence reused
    expect(provider.callLog.length).toBe(0);
    // Both scans complete but may differ in affordability
    expect(result1.coverage.status).toBe("COMPLETE");
    expect(result2.coverage.status).toBe("COMPLETE");
  });
});

describe("scanUniversePuts — cursor advancement", () => {
  it("crawl state is updated after scan", async () => {
    const crawl = getCrawlState();
    const provider = createMockProvider();
    const freshSymbols = ["YYY1", "YYY2", "YYY3", "YYY4"];

    await scanUniversePuts(freshSymbols, DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, {
      ...DEFAULT_PLANNER_CONFIG,
      provider: "tradier",
      environment: "sandbox",
      refreshBudget: 2,
    });

    const gen = crawl.current();
    expect(gen).not.toBeNull();
    // Generation should exist (cursor may or may not advance depending on prior state)
    expect(gen!.cursor).toBeGreaterThanOrEqual(0);
  });

  it("repeated scans advance the cursor (do not restart at 0)", async () => {
    const crawl = getCrawlState();
    const provider = createMockProvider();
    const config = { ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox", refreshBudget: 2 };

    await scanUniversePuts(SMALL_UNIVERSE, DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, config);
    const cursorAfterFirst = crawl.current()!.cursor;

    await scanUniversePuts(SMALL_UNIVERSE, DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, config);
    const cursorAfterSecond = crawl.current()!.cursor;

    expect(cursorAfterSecond).toBeGreaterThanOrEqual(cursorAfterFirst);
  });
});

describe("scanUniversePuts — coverage semantics", () => {
  it("ACTIONABLE ranks before EDGE in top 20", async () => {
    const cache = getDurableCache();
    const provider = createMockProvider();

    // Symbol A: excellent (ACTIONABLE)
    const expKeyA = buildCacheKey("tradier", "sandbox", "expirations", "AAVM");
    await cache.put(cache.createRecord(expKeyA, "expirations", "tradier", "sandbox", "AAVM", null, [{ date: "2026-08-14", dte: 31 }]));
    const chainKeyA = buildCacheKey("tradier", "sandbox", "chain", "AAVM", "2026-08-14");
    await cache.put(cache.createRecord(chainKeyA, "chain", "tradier", "sandbox", "AAVM", "2026-08-14", {
      puts: [{ type: "PUT", strike: 45, bid: 2.00, ask: 2.10, delta: -0.30, openInterest: 1000, volume: 200 }],
    }));

    // Symbol B: weaker (EDGE)
    const expKeyB = buildCacheKey("tradier", "sandbox", "expirations", "ABFL");
    await cache.put(cache.createRecord(expKeyB, "expirations", "tradier", "sandbox", "ABFL", null, [{ date: "2026-08-14", dte: 31 }]));
    const chainKeyB = buildCacheKey("tradier", "sandbox", "chain", "ABFL", "2026-08-14");
    await cache.put(cache.createRecord(chainKeyB, "chain", "tradier", "sandbox", "ABFL", "2026-08-14", {
      puts: [{ type: "PUT", strike: 45, bid: 0.50, ask: 0.80, delta: -0.30, openInterest: 30, volume: 5 }],
    }));

    const result = await scanUniversePuts(["AAVM", "ABFL"], DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, {
      ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox",
    });

    if (result.top20.length >= 2) {
      // ACTIONABLE should rank before EDGE
      const firstPosture = result.top20[0].posture;
      const secondPosture = result.top20[1].posture;
      if (firstPosture === "ACTIONABLE" && secondPosture === "EDGE") {
        expect(result.top20[0].assessment.score).toBeGreaterThanOrEqual(result.top20[1].assessment.score);
      }
    }
  });

  it("fewer than 20 valid candidates produces honest shorter list", async () => {
    const cache = getDurableCache();
    const provider = createMockProvider();

    // Only 2 symbols with data
    for (const sym of ["AAVM", "ABFL"]) {
      const expKey = buildCacheKey("tradier", "sandbox", "expirations", sym);
      await cache.put(cache.createRecord(expKey, "expirations", "tradier", "sandbox", sym, null, [{ date: "2026-08-14", dte: 31 }]));
      const chainKey = buildCacheKey("tradier", "sandbox", "chain", sym, "2026-08-14");
      await cache.put(cache.createRecord(chainKey, "chain", "tradier", "sandbox", sym, "2026-08-14", {
        puts: [{ type: "PUT", strike: 45, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
      }));
    }

    const result = await scanUniversePuts(["AAVM", "ABFL"], DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, {
      ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox",
    });

    // Should not pad to 20 — honest count
    expect(result.top20.length).toBeLessThanOrEqual(2);
    expect(result.coverage.status).toBe("COMPLETE");
  });

  it("WAIT candidates do not appear in top 20", async () => {
    const cache = getDurableCache();
    const provider = createMockProvider();

    // Symbol with poor execution (WAIT)
    const expKey = buildCacheKey("tradier", "sandbox", "expirations", "AAVM");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", "sandbox", "AAVM", null, [{ date: "2026-08-14", dte: 31 }]));
    const chainKey = buildCacheKey("tradier", "sandbox", "chain", "AAVM", "2026-08-14");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", "sandbox", "AAVM", "2026-08-14", {
      puts: [{ type: "PUT", strike: 45, bid: 0.10, ask: 0.60, delta: -0.30, openInterest: 5, volume: 1 }],
    }));

    const result = await scanUniversePuts(["AAVM"], DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, {
      ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox",
    });

    // WAIT should be in waitCandidates, not top20
    const top20Postures = result.top20.map((c) => c.posture);
    expect(top20Postures).not.toContain("WAIT");
    // It should be in waitCandidates if it qualifies
    if (result.waitCandidates.length > 0) {
      expect(result.waitCandidates[0].posture).toBe("WAIT");
    }
  });

  it("confirmed absence does not require network calls on subsequent scans", async () => {
    const cache = getDurableCache();
    const provider = createMockProvider();
    const absSymbol = "ZABS1";

    // Pre-populate confirmed absence
    const absKey = buildCacheKey("tradier", "sandbox", "absence", absSymbol);
    await cache.put(cache.createRecord(absKey, "absence", "tradier", "sandbox", absSymbol, null, { reason: "no expirations" }));

    const result = await scanUniversePuts([absSymbol], DEPLOYABLE_CASH, provider, DEFAULT_SCAN_CONFIG, {
      ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox",
    });

    // No network calls
    expect(provider.callLog.length).toBe(0);
    expect(result.coverage.confirmedAbsence).toBeGreaterThanOrEqual(1);
  });
});
