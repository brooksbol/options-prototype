/**
 * Terminal Outcomes Invariant Tests
 *
 * Proves that every symbol in the monitored universe maps to exactly one
 * terminal outcome, and the sum equals the universe total.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import type { TerminalOutcomes } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";

let testId = 0;

function sumOutcomes(o: TerminalOutcomes): number {
  return o.actionable + o.edge + o.wait + o.hardNo + o.noDeltaMatch + o.noDteMatch + o.nonOptionable + o.incomplete;
}

describe("terminal outcomes invariant", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `term-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateActionable(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      puts: [{ strike: 50, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
    }));
  }

  async function populateWait(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      puts: [{ strike: 30, bid: 0.30, ask: 0.50, delta: -0.25, openInterest: 5, volume: 0 }],
    }));
  }

  async function populateHardNo(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      // bid=0.05, ask=1.00 → spread ~180%, will be hard-no
      puts: [{ strike: 30, bid: 0.05, ask: 1.00, delta: -0.30, openInterest: 100, volume: 10 }],
    }));
  }

  async function populateNoDelta(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      // delta -0.80 is outside admissible range (0.15-0.50)
      puts: [{ strike: 30, bid: 5.00, ask: 5.20, delta: -0.80, openInterest: 500, volume: 100 }],
    }));
  }

  async function populateNoDte(symbol: string) {
    // Expiration at 90 DTE — outside eligible range (7-45)
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-10-15", dte: 90 }]));
  }

  async function populateAbsent(symbol: string) {
    const absKey = buildCacheKey("tradier", env, "absence", symbol);
    await cache.put(cache.createRecord(absKey, "absence", "tradier", env, symbol, null, { reason: "no expirations" }));
  }

  it("all outcomes sum to monitored universe (complete coverage)", async () => {
    await populateActionable("A1");
    await populateActionable("A2");
    await populateWait("W1");
    await populateHardNo("H1");
    await populateNoDelta("D1");
    await populateNoDte("T1");
    await populateAbsent("N1");
    await populateAbsent("N2");

    const result = await recommendPuts(
      ["A1", "A2", "W1", "H1", "D1", "T1", "N1", "N2"],
      500_000, cache, cacheEnv()
    );

    const o = result.funnel.outcomes;
    expect(sumOutcomes(o)).toBe(result.funnel.monitored);
    expect(result.funnel.monitored).toBe(8);
  });

  it("all outcomes sum to monitored with incomplete symbols", async () => {
    await populateActionable("A1");
    // MISS1 and MISS2 have no evidence at all → incomplete
    await populateAbsent("N1");

    const result = await recommendPuts(
      ["A1", "MISS1", "MISS2", "N1"],
      500_000, cache, cacheEnv()
    );

    const o = result.funnel.outcomes;
    expect(sumOutcomes(o)).toBe(4);
    expect(o.actionable).toBe(1);
    expect(o.nonOptionable).toBe(1);
    expect(o.incomplete).toBe(2);
  });

  it("each category is mutually exclusive", async () => {
    await populateActionable("ACT");
    await populateWait("WAIT");
    await populateHardNo("HARD");
    await populateNoDelta("DELTA");
    await populateNoDte("DTE");
    await populateAbsent("ABS");

    const result = await recommendPuts(
      ["ACT", "WAIT", "HARD", "DELTA", "DTE", "ABS", "PENDING"],
      500_000, cache, cacheEnv()
    );

    const o = result.funnel.outcomes;
    expect(o.actionable).toBe(1);
    expect(o.wait).toBe(1);
    expect(o.hardNo).toBe(1);
    expect(o.noDeltaMatch).toBe(1);
    expect(o.noDteMatch).toBe(1);
    expect(o.nonOptionable).toBe(1);
    expect(o.incomplete).toBe(1); // PENDING has no evidence
    expect(sumOutcomes(o)).toBe(7);
  });

  it("eligible equals actionable + edge", async () => {
    await populateActionable("A1");
    await populateActionable("A2");
    await populateActionable("A3");

    const result = await recommendPuts(["A1", "A2", "A3"], 500_000, cache, cacheEnv());
    const o = result.funnel.outcomes;
    expect(result.funnel.eligible).toBe(o.actionable + o.edge);
  });
});
