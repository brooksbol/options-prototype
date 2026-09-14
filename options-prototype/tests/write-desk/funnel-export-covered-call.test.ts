/**
 * Covered-call funnel-export membership tests (BUG-016).
 *
 * Covers spec test requirements:
 *  2. Covered calls emit exactly one record per governed inventory/evaluation unit.
 *  4. Grouping records reproduces the visible denominator exactly.
 *  5. Covered-call export preserves its actual terminal taxonomy (not the CSP taxonomy).
 * Addendum: sum of ALL terminal groups === eligiblePositions (governed denominator).
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendCalls } from "../../src/write-desk/recommend-calls";
import { DEFAULT_RECOMMENDATION_POLICY, type ExportContext } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import { deriveCounters } from "../../src/write-desk/funnel-export/funnel-export-types";
import type { InventoryPosition } from "../../src/write-desk/types";

let testId = 0;

const EXPORT_CTX: ExportContext = {
  evidenceGeneration: 12,
  policyVersion: "routine-csp-v1-provisional",
  sessionState: "CLOSED_CANONICAL",
  canonicalSessionDate: "2026-09-14",
  evidenceEnvironment: "production",
};

function holding(symbol: string, freeShares = 300): InventoryPosition {
  return {
    symbol,
    sharesOwned: freeShares,
    sharesEncumbered: 0,
    sharesFree: freeShares,
    maxAdditionalContracts: Math.floor(freeShares / 100),
    economics: null,
  };
}

describe("Covered-call funnel export — membership", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `cc-export-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateChain(symbol: string, calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>, price = 100) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-21", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-21");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-21", { underlying: { symbol, name: `${symbol} Fund`, price }, calls }));
  }

  it("no export result without export context", async () => {
    await populateChain("XLE", [{ strike: 105, bid: 1.2, ask: 1.4, delta: 0.3, openInterest: 300, volume: 80 }]);
    const result = await recommendCalls([holding("XLE")], cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);
    expect(result.exportResult).toBeUndefined();
  });

  it("emits exactly one record per governed eligible holding (test req 2)", async () => {
    await populateChain("XLE", [{ strike: 105, bid: 1.2, ask: 1.4, delta: 0.3, openInterest: 300, volume: 80 }]);
    // ORPH: eligible holding but NO cached expirations → noExpirations
    // FAR: expirations known but none in DTE range handled via separate chain absence
    const inventory = [holding("XLE"), holding("ORPH"), holding("NOCALL")];
    // NOCALL: has chain but no admissible-delta call → noQualifyingCall
    await populateChain("NOCALL", [{ strike: 105, bid: 1.2, ask: 1.4, delta: 0.02, openInterest: 300, volume: 80 }]);

    const result = await recommendCalls(inventory, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const ex = result.exportResult!;

    expect(ex.membership).toHaveLength(inventory.length);
    expect(ex.membership).toHaveLength(result.eligiblePositions);
    expect(ex.membership.every((r) => r.evaluationUnitType === "holding")).toBe(true);
    expect(ex.membership.every((r) => r.holdingOrLotId != null)).toBe(true);
    expect(new Set(ex.membership.map((r) => r.symbol)).size).toBe(inventory.length);
  });

  it("only holdings with call-writing capacity form the denominator", async () => {
    await populateChain("XLE", [{ strike: 105, bid: 1.2, ask: 1.4, delta: 0.3, openInterest: 300, volume: 80 }]);
    // SMALL has <100 free shares → maxAdditionalContracts 0 → NOT an eligible holding.
    const inventory = [holding("XLE", 300), holding("SMALL", 40)];
    const result = await recommendCalls(inventory, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const ex = result.exportResult!;
    expect(ex.membership).toHaveLength(1);
    expect(ex.membership[0].symbol).toBe("XLE");
  });

  it("uses covered-call taxonomy, not the CSP taxonomy (test req 5)", async () => {
    const inventory = [holding("ORPH")]; // no chain → noExpirations
    const result = await recommendCalls(inventory, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const outcomes = result.exportResult!.membership.map((r) => r.terminalOutcome);
    // A covered-call-specific outcome; NOT a CSP-only bucket like "nonOptionable".
    expect(outcomes).toContain("noExpirations");
  });

  it("sum of terminal groups equals eligiblePositions denominator (addendum + test req 4)", async () => {
    await populateChain("ACT", [{ strike: 105, bid: 1.2, ask: 1.4, delta: 0.3, openInterest: 300, volume: 80 }]);
    await populateChain("NOCALL", [{ strike: 105, bid: 1.2, ask: 1.4, delta: 0.02, openInterest: 300, volume: 80 }]);
    const inventory = [holding("ACT"), holding("NOCALL"), holding("ORPH")];

    const result = await recommendCalls(inventory, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const ex = result.exportResult!;
    const total = Object.values(deriveCounters(ex.membership)).reduce((s, n) => s + n, 0);

    expect(ex.denominator).toBe(result.eligiblePositions);
    expect(total).toBe(result.eligiblePositions);
    expect(total).toBe(inventory.length);
  });
});
