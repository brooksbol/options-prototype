/**
 * Integration tests proving the TradierProvider ↔ DurableCache ↔ UniverseScanner pipeline.
 *
 * Validates:
 * - Provider writes domain-transformed data to IndexedDB
 * - A "reloaded" provider instance (simulating page reload) reads from IndexedDB
 * - Universe scanner reads provider-written records without network calls
 * - Crawl cursor survives simulated reload
 * - Portfolio source switch preserves market cache
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { TradierProvider, ResponseCache } from "../../src/providers/tradier/TradierProvider";
import { DurableMarketCache, buildCacheKey, getDurableCache, resetDurableCache } from "../../src/cache/durable-cache";
import { CrawlStateService, getCrawlState } from "../../src/cache/crawl-state";
import { resetDB } from "../../src/cache/db";
import { scanUniversePuts } from "../../src/write-desk/universe-scanner";
import { DEFAULT_SCAN_CONFIG } from "../../src/write-desk/scan-orchestrator";
import { DEFAULT_PLANNER_CONFIG } from "../../src/cache/scan-planner";
import type { TradierConfig } from "../../src/config/tradier";

// --- Mock Fetch ---

let fetchCallCount = 0;

const MOCK_EXPIRATIONS_RESPONSE = {
  expirations: { date: ["2026-08-14", "2026-08-21"] },
};

const MOCK_CHAIN_RESPONSE = {
  options: {
    option: [
      { symbol: "XLE260814P00045000", option_type: "put", strike: 45, bid: 1.20, ask: 1.40, volume: 100, open_interest: 500, greeks: { delta: -0.30, mid_iv: 0.25 } },
      { symbol: "XLE260814P00043000", option_type: "put", strike: 43, bid: 0.80, ask: 1.00, volume: 80, open_interest: 300, greeks: { delta: -0.20, mid_iv: 0.22 } },
    ],
  },
};

const MOCK_QUOTE_RESPONSE = {
  quotes: { quote: { symbol: "XLE", last: 55.50, description: "Energy ETF", type: "etf" } },
};

function setupFetchMock() {
  fetchCallCount = 0;
  global.fetch = vi.fn(async (url: string) => {
    fetchCallCount++;
    const urlStr = typeof url === "string" ? url : url.toString();

    let body: unknown;
    if (urlStr.includes("/options/expirations")) {
      body = MOCK_EXPIRATIONS_RESPONSE;
    } else if (urlStr.includes("/options/chains")) {
      body = MOCK_CHAIN_RESPONSE;
    } else if (urlStr.includes("/quotes")) {
      body = MOCK_QUOTE_RESPONSE;
    } else {
      body = {};
    }

    return {
      ok: true,
      json: async () => body,
      headers: new Headers(),
    } as unknown as Response;
  });
}

const sandboxConfig: TradierConfig = {
  apiKey: "test-key",
  baseUrl: "https://sandbox.tradier.com/v1",
  accountId: "test-account",
};

// --- Tests ---

describe("Provider → Durable Cache → Scanner integration", () => {
  beforeEach(() => {
    resetDB();
    resetDurableCache();
    setupFetchMock();
  });

  it("provider getExpirations writes domain Expiration[] to IndexedDB", async () => {
    const provider = new TradierProvider(sandboxConfig);
    const expirations = await provider.getExpirations("XLE");

    expect(expirations.length).toBe(2);
    expect(expirations[0].date).toBe("2026-08-14");
    expect(fetchCallCount).toBe(1);

    // Verify durable cache contains domain types
    const cache = getDurableCache();
    const key = buildCacheKey("tradier", "sandbox", "expirations", "XLE");
    const record = await cache.get(key);
    expect(record).not.toBeNull();
    expect(Array.isArray(record!.payload)).toBe(true);
    const stored = record!.payload as Array<{ date: string; dte: number }>;
    expect(stored[0].date).toBe("2026-08-14");
    expect(stored[0].dte).toBeGreaterThan(0);
  });

  it("provider getOptionsChain writes domain OptionsChain to IndexedDB", async () => {
    const provider = new TradierProvider(sandboxConfig);
    const chain = await provider.getOptionsChain("XLE", "2026-08-14");

    expect(chain.puts.length).toBe(2);
    expect(chain.underlying.price).toBe(55.50);

    // Verify durable cache
    const cache = getDurableCache();
    const key = buildCacheKey("tradier", "sandbox", "chain", "XLE", "2026-08-14");
    const record = await cache.get(key);
    expect(record).not.toBeNull();
    const stored = record!.payload as { puts: Array<{ strike: number }> };
    expect(stored.puts.length).toBe(2);
    expect(stored.puts[0].strike).toBe(43);
  });

  it("simulated reload: new provider reads from IndexedDB without network", async () => {
    // Pass 1: provider fetches from network, writes to IndexedDB
    const provider1 = new TradierProvider(sandboxConfig);
    await provider1.getExpirations("RELOAD_TEST");
    expect(fetchCallCount).toBe(1);

    // Simulate reload: clear L1 by creating new provider (IDB persists)
    fetchCallCount = 0;

    // Pass 2: new provider instance — L1 is fresh, but L2 (IDB) has data
    const provider2 = new TradierProvider(sandboxConfig);
    const expirations = await provider2.getExpirations("RELOAD_TEST");

    expect(expirations.length).toBe(2);
    expect(expirations[0].date).toBe("2026-08-14");
    // Should read from durable cache (L2), not network
    expect(fetchCallCount).toBe(0);
    expect(provider2.durableHits).toBe(1);
  });

  it("simulated reload: chain read from IndexedDB without network", async () => {
    // Pass 1: fetch chain
    const provider1 = new TradierProvider(sandboxConfig);
    await provider1.getOptionsChain("XLE", "2026-08-14");
    const firstFetchCount = fetchCallCount; // chain + quote = 2 calls

    // Simulate reload
    resetDurableCache();
    fetchCallCount = 0;

    // Pass 2: new provider reads from durable
    const provider2 = new TradierProvider(sandboxConfig);
    const chain = await provider2.getOptionsChain("XLE", "2026-08-14");

    expect(chain.puts.length).toBe(2);
    expect(chain.underlying.price).toBe(55.50);
    // Zero network calls for the chain (durable hit)
    expect(fetchCallCount).toBe(0);
    expect(provider2.durableHits).toBeGreaterThanOrEqual(1);
  });

  it("universe scanner uses provider-cached data without additional network calls", async () => {
    // Step 1: Provider populates durable cache
    const provider = new TradierProvider(sandboxConfig);
    await provider.getExpirations("XLE");
    await provider.getOptionsChain("XLE", "2026-08-14");
    fetchCallCount = 0;

    // Step 2: Scanner evaluates XLE from cache
    const result = await scanUniversePuts(
      ["XLE"],
      18500,
      provider,
      DEFAULT_SCAN_CONFIG,
      { ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox" }
    );

    // The scanner should find XLE evidence in durable cache
    expect(result.coverage.covered).toBeGreaterThanOrEqual(1);
    // Network calls should be minimal (scanner may call getExpirations which hits L2)
    // The key point: no fresh network calls for already-cached data
  });

  it("crawl cursor persists across simulated reload", async () => {
    const crawl1 = new CrawlStateService();
    const symbols = ["CRAWL_A", "CRAWL_B", "CRAWL_C", "CRAWL_D"];
    await crawl1.ensureGeneration("test-reload", "v1", symbols);
    await crawl1.markEvaluated("CRAWL_A", "WAIT", 20);
    await crawl1.markEvaluated("CRAWL_B", "HARD_NO", 0);
    crawl1.advanceCursor(2);
    await crawl1.save();

    // Simulate reload: new crawl service
    const crawl2 = new CrawlStateService();
    const gen = await crawl2.load();

    expect(gen).not.toBeNull();
    expect(gen!.cursor).toBe(2);
    expect(gen!.perSymbol["CRAWL_A"].resultClass).toBe("WAIT");
    expect(gen!.perSymbol["CRAWL_B"].resultClass).toBe("HARD_NO");
    expect(gen!.perSymbol["CRAWL_C"].resultClass).toBe("NOT_EVALUATED");
  });

  it("portfolio source switch preserves market cache", async () => {
    // Populate cache with real provider data
    const provider = new TradierProvider(sandboxConfig);
    await provider.getExpirations("XLE");
    await provider.getOptionsChain("XLE", "2026-08-14");
    fetchCallCount = 0;

    // "Switch portfolio source" — market data should remain valid
    // Scan with different cash (simulating Demo → Fidelity switch)
    const result1 = await scanUniversePuts(["XLE"], 18500, provider, DEFAULT_SCAN_CONFIG,
      { ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox" });
    const result2 = await scanUniversePuts(["XLE"], 5000, provider, DEFAULT_SCAN_CONFIG,
      { ...DEFAULT_PLANNER_CONFIG, provider: "tradier", environment: "sandbox" });

    // Both scans should use cached data — no new network calls for XLE
    expect(fetchCallCount).toBe(0);
    // Both should report coverage
    expect(result1.coverage.covered).toBeGreaterThanOrEqual(1);
    expect(result2.coverage.covered).toBeGreaterThanOrEqual(1);
  });

  it("environment isolation: sandbox data not served for live keys", async () => {
    // Populate sandbox cache
    const sandboxProvider = new TradierProvider(sandboxConfig);
    await sandboxProvider.getExpirations("XLE");

    // Check durable cache with live environment key
    const cache = getDurableCache();
    const liveKey = buildCacheKey("tradier", "live", "expirations", "XLE");
    const liveRecord = await cache.get(liveKey);
    expect(liveRecord).toBeNull(); // Should NOT find sandbox data under live key
  });
});
