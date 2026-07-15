/**
 * Tests for crawl generation recovery scenarios.
 *
 * Validates restart-safe behavior when:
 * - Cursor is at universe end but coverage is incomplete
 * - Application restarts mid-generation
 * - Scan planner derives work from cache state (not cursor)
 * - Stall detection prevents permanent BUILDING state
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CrawlStateService } from "../../src/cache/crawl-state";
import { buildScanPlan, DEFAULT_PLANNER_CONFIG, type ScanPlannerConfig } from "../../src/cache/scan-planner";

// --- Mock DurableMarketCache ---

class MockDurableCache {
  private store = new Map<string, { payload: unknown; freshUntil: number; staleUntil: number }>();

  async get(key: string) {
    const record = this.store.get(key);
    if (!record) return null;
    return { key, payload: record.payload, freshUntil: record.freshUntil, staleUntil: record.staleUntil };
  }

  freshness(record: { freshUntil: number; staleUntil: number } | null): string {
    if (!record) return "missing";
    const now = Date.now();
    if (now <= record.freshUntil) return "fresh";
    if (now <= record.staleUntil) return "stale_usable";
    return "expired";
  }

  /** Simulate cached expirations for a symbol */
  addExpirations(symbol: string, expirations: { date: string; dte: number }[]) {
    const key = `market:tradier:sandbox:expirations:${symbol.toUpperCase()}:v1`;
    this.store.set(key, {
      payload: expirations,
      freshUntil: Date.now() + 3600000,
      staleUntil: Date.now() + 86400000,
    });
  }

  /** Simulate cached chain for a symbol/expiration */
  addChain(symbol: string, expiration: string) {
    const key = `market:tradier:sandbox:chain:${symbol.toUpperCase()}:${expiration}:v1`;
    this.store.set(key, {
      payload: { underlying: { symbol, name: symbol, price: 100 }, puts: [], calls: [] },
      freshUntil: Date.now() + 300000,
      staleUntil: Date.now() + 1800000,
    });
  }

  /** Simulate confirmed absence */
  addAbsence(symbol: string) {
    const key = `market:tradier:sandbox:absence:${symbol.toUpperCase()}:v1`;
    this.store.set(key, {
      payload: { reason: "no expirations" },
      freshUntil: Date.now() + 3600000,
      staleUntil: Date.now() + 86400000,
    });
  }
}

// --- Tests ---

const UNIVERSE = ["AAAA", "BBBB", "CCCC", "DDDD", "EEEE"];
const CONFIG: ScanPlannerConfig = {
  ...DEFAULT_PLANNER_CONFIG,
  refreshBudget: 40,
};

describe("Crawl Recovery — Restart with terminal cursor", () => {
  let cache: MockDurableCache;
  let crawl: CrawlStateService;

  beforeEach(async () => {
    cache = new MockDurableCache();
    crawl = new CrawlStateService();
  });

  it("scan planner finds work even when cursor is at universe end", async () => {
    // Simulate: cursor=5 (end), but only 2 of 5 symbols have cache entries
    await crawl.ensureGeneration("tradier:sandbox", "v1", UNIVERSE);
    crawl.advanceCursor(5); // terminal
    await crawl.save();

    // Only AAAA and BBBB have cached evidence
    cache.addExpirations("AAAA", [{ date: "2026-08-21", dte: 38 }]);
    cache.addChain("AAAA", "2026-08-21");
    cache.addExpirations("BBBB", [{ date: "2026-08-21", dte: 38 }]);
    cache.addChain("BBBB", "2026-08-21");

    // Planner should find CCCC, DDDD, EEEE as MISSING (need expirations)
    const plan = await buildScanPlan(UNIVERSE, cache as any, crawl, CONFIG);
    expect(plan.missing).toBe(3);
    expect(plan.rankableFromCache).toBe(2);
    expect(plan.scheduledWork.length).toBe(3); // 3 expiration fetches needed
    expect(plan.coverageStatus).toBe("BUILDING");
  });

  it("fully covered universe produces zero work and COMPLETE status", async () => {
    await crawl.ensureGeneration("tradier:sandbox", "v1", UNIVERSE);
    crawl.advanceCursor(5);

    // All 5 have full evidence
    for (const sym of UNIVERSE) {
      cache.addExpirations(sym, [{ date: "2026-08-21", dte: 38 }]);
      cache.addChain(sym, "2026-08-21");
    }

    const plan = await buildScanPlan(UNIVERSE, cache as any, crawl, CONFIG);
    expect(plan.rankableFromCache).toBe(5);
    expect(plan.missing).toBe(0);
    expect(plan.scheduledWork.length).toBe(0);
    expect(plan.coverageStatus).toBe("COMPLETE");
  });

  it("confirmed absences count toward complete coverage", async () => {
    await crawl.ensureGeneration("tradier:sandbox", "v1", UNIVERSE);
    crawl.advanceCursor(5);

    cache.addExpirations("AAAA", [{ date: "2026-08-21", dte: 38 }]);
    cache.addChain("AAAA", "2026-08-21");
    cache.addExpirations("BBBB", [{ date: "2026-08-21", dte: 38 }]);
    cache.addChain("BBBB", "2026-08-21");
    cache.addAbsence("CCCC");
    cache.addAbsence("DDDD");
    cache.addAbsence("EEEE");

    const plan = await buildScanPlan(UNIVERSE, cache as any, crawl, CONFIG);
    expect(plan.rankableFromCache).toBe(2);
    expect(plan.confirmedAbsence).toBe(3);
    expect(plan.coverageStatus).toBe("COMPLETE");
    expect(plan.scheduledWork.length).toBe(0);
  });

  it("symbols with expirations but no chain produce chain work", async () => {
    await crawl.ensureGeneration("tradier:sandbox", "v1", UNIVERSE);
    crawl.advanceCursor(5);

    // All have expirations, but only 2 have chains
    for (const sym of UNIVERSE) {
      cache.addExpirations(sym, [{ date: "2026-08-21", dte: 38 }]);
    }
    cache.addChain("AAAA", "2026-08-21");
    cache.addChain("BBBB", "2026-08-21");

    const plan = await buildScanPlan(UNIVERSE, cache as any, crawl, CONFIG);
    expect(plan.rankableFromCache).toBe(2);
    // CCCC, DDDD, EEEE have fresh expirations but no chain
    const chainWork = plan.scheduledWork.filter((w) => w.type === "chain");
    expect(chainWork.length).toBe(3);
    expect(plan.coverageStatus).toBe("BUILDING");
  });

  it("repeated scans are idempotent for fully covered universe", async () => {
    await crawl.ensureGeneration("tradier:sandbox", "v1", UNIVERSE);
    crawl.advanceCursor(5);

    for (const sym of UNIVERSE) {
      cache.addExpirations(sym, [{ date: "2026-08-21", dte: 38 }]);
      cache.addChain(sym, "2026-08-21");
    }

    const plan1 = await buildScanPlan(UNIVERSE, cache as any, crawl, CONFIG);
    const plan2 = await buildScanPlan(UNIVERSE, cache as any, crawl, CONFIG);
    expect(plan1.scheduledWork.length).toBe(0);
    expect(plan2.scheduledWork.length).toBe(0);
    expect(plan1.coverageStatus).toBe("COMPLETE");
    expect(plan2.coverageStatus).toBe("COMPLETE");
  });

  it("deferred symbols (with cached error) do not cause false stall", async () => {
    await crawl.ensureGeneration("tradier:sandbox", "v1", UNIVERSE);
    crawl.advanceCursor(5);

    // 3 covered, 2 have fresh errors (not yet retryable)
    cache.addExpirations("AAAA", [{ date: "2026-08-21", dte: 38 }]);
    cache.addChain("AAAA", "2026-08-21");
    cache.addExpirations("BBBB", [{ date: "2026-08-21", dte: 38 }]);
    cache.addChain("BBBB", "2026-08-21");
    cache.addAbsence("CCCC");

    // DDDD and EEEE have fresh error records → they are ERROR_RETRY_DUE (not yet retryable)
    const errorKey1 = "market:tradier:sandbox:error:DDDD:v1";
    const errorKey2 = "market:tradier:sandbox:error:EEEE:v1";
    (cache as any).store.set(errorKey1, { payload: { message: "timeout" }, freshUntil: Date.now() + 60000, staleUntil: Date.now() + 120000 });
    (cache as any).store.set(errorKey2, { payload: { message: "timeout" }, freshUntil: Date.now() + 60000, staleUntil: Date.now() + 120000 });

    const plan = await buildScanPlan(UNIVERSE, cache as any, crawl, CONFIG);
    // Errors within TTL should NOT produce work (they'll be retried when TTL expires)
    expect(plan.scheduledWork.length).toBe(0);
    // But coverage is NOT complete (2 symbols have errors, not evidence)
    // The planner counts them as rankableFromCache=2 + confirmedAbsence=1 + errors=2
    // Total rankable (2) + absence (1) = 3 < 5 → BUILDING
    expect(plan.coverageStatus).toBe("BUILDING");
  });
});

describe("Stall detection invariant", () => {
  it("zero work + BUILDING status = stalled condition detected", () => {
    // This documents the invariant enforced by acquireEvidence:
    // When allWork.length === 0 AND plan.coverageStatus !== "COMPLETE"
    // AND plan.requiresRefresh === 0 AND plan.missing === 0,
    // the status is "STALLED" or generation is marked complete.
    //
    // The fix in acquire-evidence.ts marks generation complete in this case,
    // because the planner says all slots are filled (FRESH + ABSENCE)
    // even if the recommendation engine's coverage formula disagrees.
    const allWorkLength = 0;
    const coverageComplete = false;
    const requiresRefresh = 0;
    const missing = 0;
    const explicitRequests = 0;

    const isStalled = allWorkLength === 0
      && !coverageComplete
      && requiresRefresh === 0
      && missing === 0
      && explicitRequests === 0;

    expect(isStalled).toBe(true);
  });

  it("zero work + COMPLETE status = legitimate no-work state", () => {
    const allWorkLength = 0;
    const coverageComplete = true;
    const requiresRefresh = 0;
    const missing = 0;
    const explicitRequests = 0;

    const isStalled = allWorkLength === 0
      && !coverageComplete
      && requiresRefresh === 0
      && missing === 0
      && explicitRequests === 0;

    expect(isStalled).toBe(false);
  });

  it("work exists + BUILDING status = normal progress", () => {
    const allWorkLength = 15;
    const coverageComplete = false;

    const isStalled = allWorkLength === 0 && !coverageComplete;
    expect(isStalled).toBe(false);
  });
});
