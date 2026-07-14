/**
 * Tests proving primary-chain acquisition scheduling.
 *
 * Validates that the planner:
 * - Schedules chain work items when expirations exist but primary chain is missing
 * - Does NOT schedule chain work when primary chain is already cached
 * - Uses the PrimaryExpirationPolicy to determine which chain to fetch
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { CrawlStateService } from "../../src/cache/crawl-state";
import { resetDB } from "../../src/cache/db";
import { buildScanPlan, type ScanPlannerConfig } from "../../src/cache/scan-planner";

const SYMBOLS = ["PC_XLE", "PC_XLF"];

let testId = 0;

describe("Primary chain scheduling", () => {
  let cache: DurableMarketCache;
  let crawl: CrawlStateService;
  let env: string;
  let config: ScanPlannerConfig;

  beforeEach(() => {
    testId++;
    env = `pc-test-${testId}`;
    resetDB();
    cache = new DurableMarketCache();
    crawl = new CrawlStateService();
    config = {
      provider: "tradier",
      environment: env,
      refreshBudget: 10,
      dteRange: { min: 7, max: 45 },
      prioritySymbols: [],
      quoteBatchSize: 20,
    };
  });

  it("symbol with fresh expirations but no chain → schedules chain work", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // Populate fresh expirations (includes a 21 DTE expiration)
    const expKey = buildCacheKey("tradier", env, "expirations", "PC_XLE");
    const record = cache.createRecord(expKey, "expirations", "tradier", env, "PC_XLE", null, [
      { date: "2026-07-20", dte: 7 },
      { date: "2026-08-03", dte: 21 },
      { date: "2026-08-17", dte: 35 },
    ]);
    await cache.put(record);

    // Verify the record is readable and fresh
    const check = await cache.get(expKey);
    expect(check).not.toBeNull();
    expect(cache.freshness(check!)).toBe("fresh");

    const plan = await buildScanPlan(["PC_XLE"], cache, crawl, config);

    // Should schedule a chain fetch
    const chainWork = plan.scheduledWork.filter((w) => w.type === "chain");
    expect(chainWork.length).toBe(1);
    expect(chainWork[0].symbol).toBe("PC_XLE");
    expect(chainWork[0].expiration).toBe("2026-08-03"); // nearest to target 21 DTE
  });

  it("symbol with fresh expirations AND cached primary chain → no work needed", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // Populate fresh expirations
    const expKey = buildCacheKey("tradier", env, "expirations", "PC_XLF");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "PC_XLF", null, [
      { date: "2026-08-03", dte: 21 },
    ]));

    // Populate cached chain for that expiration
    const chainKey = buildCacheKey("tradier", env, "chain", "PC_XLF", "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "PC_XLF", "2026-08-03", {
      puts: [{ type: "PUT", strike: 45, bid: 1.0, ask: 1.2, delta: -0.30, openInterest: 100, volume: 50 }],
    }));

    const plan = await buildScanPlan(["PC_XLF"], cache, crawl, config);

    // No work needed — both expirations and chain are cached
    expect(plan.scheduledWork.length).toBe(0);
    expect(plan.rankableFromCache).toBe(1);
  });

  it("symbol with no expirations → schedules expiration work (not chain)", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // No cache for PC_XLE
    const plan = await buildScanPlan(["PC_XLE"], cache, crawl, config);

    const expWork = plan.scheduledWork.filter((w) => w.type === "expirations");
    const chainWork = plan.scheduledWork.filter((w) => w.type === "chain");
    expect(expWork.length).toBe(1);
    expect(chainWork.length).toBe(0);
  });

  it("uses PrimaryExpirationPolicy to pick the nearest-to-21-DTE chain", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // Expirations: 10, 28, 42 DTE. Nearest to 21 is 28 (distance 7 vs 10's distance 11 and 42's distance 21)
    const expKey = buildCacheKey("tradier", env, "expirations", "PC_XLE");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "PC_XLE", null, [
      { date: "2026-07-23", dte: 10 },
      { date: "2026-08-10", dte: 28 },
      { date: "2026-08-24", dte: 42 },
    ]));

    const plan = await buildScanPlan(["PC_XLE"], cache, crawl, config);
    const chainWork = plan.scheduledWork.filter((w) => w.type === "chain");
    expect(chainWork.length).toBe(1);
    // Should select 28 DTE (nearest to 21)
    expect(chainWork[0].expiration).toBe("2026-08-10");
  });

  it("estimated calls correctly counts chain requests", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // Two symbols with expirations but no chains
    for (const sym of SYMBOLS) {
      const expKey = buildCacheKey("tradier", env, "expirations", sym);
      await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, sym, null, [
        { date: "2026-08-03", dte: 21 },
      ]));
    }

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, config);
    expect(plan.estimatedCalls.chains).toBe(2);
    expect(plan.estimatedCalls.expirations).toBe(0);
  });
});
