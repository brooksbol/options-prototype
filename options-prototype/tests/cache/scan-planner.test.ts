/**
 * Tests for the scan planner — cache-first evidence classification and refresh scheduling.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { CrawlStateService } from "../../src/cache/crawl-state";
import { resetDB } from "../../src/cache/db";
import { buildScanPlan, type ScanPlannerConfig } from "../../src/cache/scan-planner";

const SYMBOLS = ["SP_AAVM", "SP_ABFL", "SP_ACWI", "SP_XLE", "SP_XLF", "SP_GLD"];

let testId = 0;

describe("buildScanPlan", () => {
  let cache: DurableMarketCache;
  let crawl: CrawlStateService;
  let env: string;
  let config: ScanPlannerConfig;

  beforeEach(() => {
    testId++;
    env = `test-${testId}`;
    config = {
      provider: "tradier",
      environment: env,
      refreshBudget: 10,
      dteRange: { min: 7, max: 45 },
      prioritySymbols: ["SP_XLE", "SP_GLD"],
      quoteBatchSize: 20,
    };
    resetDB();
    cache = new DurableMarketCache();
    crawl = new CrawlStateService();
  });

  it("empty cache: all symbols classified MISSING", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);
    const plan = await buildScanPlan(SYMBOLS, cache, crawl, config);

    expect(plan.missing).toBe(SYMBOLS.length);
    expect(plan.rankableFromCache).toBe(0);
    expect(plan.coverageStatus).toBe("INCOMPLETE");
  });

  it("all symbols with fresh expirations: all FRESH", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // Populate cache with fresh expirations for all symbols
    for (const sym of SYMBOLS) {
      const key = buildCacheKey("tradier", env, "expirations", sym);
      const record = cache.createRecord(key, "expirations", "tradier", env, sym, null, [
        { date: "2026-08-14", dte: 31 },
      ]);
      await cache.put(record);
      // Also cache the primary chain so the symbol is fully rankable
      const chainKey = buildCacheKey("tradier", env, "chain", sym, "2026-08-14");
      await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, sym, "2026-08-14", { puts: [], calls: [] }));
    }

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, config);
    expect(plan.rankableFromCache).toBe(SYMBOLS.length);
    expect(plan.missing).toBe(0);
    expect(plan.coverageStatus).toBe("COMPLETE");
  });

  it("confirmed absence counts toward coverage", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // Some symbols have fresh expirations, some have confirmed absence
    for (const sym of SYMBOLS.slice(0, 3)) {
      const key = buildCacheKey("tradier", env, "expirations", sym);
      await cache.put(cache.createRecord(key, "expirations", "tradier", env, sym, null, []));
    }
    for (const sym of SYMBOLS.slice(3)) {
      const key = buildCacheKey("tradier", env, "absence", sym);
      await cache.put(cache.createRecord(key, "absence", "tradier", env, sym, null, { reason: "no options" }));
    }

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, config);
    expect(plan.rankableFromCache).toBe(3);
    expect(plan.confirmedAbsence).toBe(3);
    expect(plan.coverageStatus).toBe("COMPLETE");
  });

  it("refresh budget limits scheduled work", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);
    const limitedConfig = { ...config, refreshBudget: 2 };

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, limitedConfig);
    expect(plan.scheduledWork.length).toBeLessThanOrEqual(2);
    expect(plan.deferredCount).toBe(SYMBOLS.length - 2);
  });

  it("priority symbols get scheduled first", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);
    const limitedConfig = { ...config, refreshBudget: 3 };

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, limitedConfig);
    const scheduledSymbols = plan.scheduledWork.map((w) => w.symbol);

    // XLE and GLD are priority — should appear before AAVM
    const xleIdx = scheduledSymbols.indexOf("SP_XLE");
    const gldIdx = scheduledSymbols.indexOf("SP_GLD");
    const aavmIdx = scheduledSymbols.indexOf("SP_AAVM");

    expect(xleIdx).toBeLessThan(aavmIdx);
    expect(gldIdx).toBeLessThan(aavmIdx);
  });

  it("estimated calls are computed correctly", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, config);
    // All 6 symbols missing → 6 expiration calls needed
    expect(plan.estimatedCalls.expirations).toBe(Math.min(6, config.refreshBudget));
    expect(plan.estimatedCalls.quotes).toBe(0); // no quotes in the initial plan
    expect(plan.estimatedCalls.chains).toBe(0); // chains come after expirations
  });

  it("complete cached coverage can produce top-20 with zero refresh work", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // All have fresh expirations AND primary chains
    for (const sym of SYMBOLS) {
      const key = buildCacheKey("tradier", env, "expirations", sym);
      await cache.put(cache.createRecord(key, "expirations", "tradier", env, sym, null, [{ date: "2026-08-14", dte: 31 }]));
      const chainKey = buildCacheKey("tradier", env, "chain", sym, "2026-08-14");
      await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, sym, "2026-08-14", { puts: [], calls: [] }));
    }

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, config);
    expect(plan.scheduledWork.length).toBe(0);
    expect(plan.totalRefreshWork).toBe(0);
    expect(plan.coverageStatus).toBe("COMPLETE");
    expect(plan.estimatedCalls.expirations).toBe(0);
    expect(plan.estimatedCalls.chains).toBe(0);
    expect(plan.estimatedCalls.quotes).toBe(0);
  });

  it("mixed fresh and missing produces BUILDING status", async () => {
    await crawl.ensureGeneration("test", "v1", SYMBOLS);

    // Only some symbols have cache
    for (const sym of SYMBOLS.slice(0, 3)) {
      const key = buildCacheKey("tradier", env, "expirations", sym);
      await cache.put(cache.createRecord(key, "expirations", "tradier", env, sym, null, []));
    }

    const plan = await buildScanPlan(SYMBOLS, cache, crawl, config);
    expect(plan.coverageStatus).toBe("BUILDING");
    expect(plan.rankableFromCache).toBe(3);
    expect(plan.missing).toBe(3);
  });
});
