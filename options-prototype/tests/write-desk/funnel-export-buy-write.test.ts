/**
 * Buy-write funnel-export membership tests (BUG-016), plus cross-cutting
 * export-behavior invariants.
 *
 * Covers spec test requirements:
 *  3. Buy-writes emit exactly one record per governed evaluation unit.
 *  4. Grouping records reproduces the visible outcomes exactly.
 *  5. Buy-write export preserves its actual terminal taxonomy (incl strategyUnfit).
 *  8. Producing the export result performs no evidence mutation (pure over cache).
 *  9. A distinct Decision run produces a distinct atomic result without mixing records.
 * 10. (run-level) A rerun produces a new run id; membership belongs to one run only.
 * 11. Empty/incomplete results are not exportable as if complete.
 * Addendum: sum of ALL terminal groups === universeSize (governed denominator).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { recommendBuyWrites } from "../../src/write-desk/recommend-buy-writes";
import { DEFAULT_RECOMMENDATION_POLICY, type ExportContext } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import { deriveCounters, buildDecisionExportResult } from "../../src/write-desk/funnel-export/funnel-export-types";
import { downloadFunnelCsv } from "../../src/write-desk/funnel-export/funnel-csv";

let testId = 0;

const EXPORT_CTX: ExportContext = {
  evidenceGeneration: 3,
  policyVersion: "routine-csp-v1-provisional",
  sessionState: "CLOSED_CANONICAL",
  canonicalSessionDate: "2026-09-14",
  evidenceEnvironment: "production",
};

describe("Buy-write funnel export — membership", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `bw-export-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateChain(symbol: string, calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>, price = 58) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-21", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-21");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-21", { underlying: { symbol, name: `${symbol} Fund`, price }, calls, puts: [] }));
  }
  async function populateAbsent(symbol: string) {
    const absKey = buildCacheKey("tradier", env, "absence", symbol);
    await cache.put(cache.createRecord(absKey, "absence", "tradier", env, symbol, null, { reason: "no expirations" }));
  }

  it("emits exactly one record per evaluated symbol; sum === universeSize (test req 3, addendum)", async () => {
    await populateChain("XLE", [{ strike: 60, bid: 1.2, ask: 1.4, delta: 0.32, openInterest: 300, volume: 80 }], 58);
    await populateAbsent("BOND");
    // UNFIT: executable contract but strike <= price → strategyUnfit
    await populateChain("UNFIT", [{ strike: 55, bid: 1.2, ask: 1.4, delta: 0.35, openInterest: 300, volume: 80 }], 58);
    const symbols = ["XLE", "BOND", "UNFIT", "PENDING"];

    const result = await recommendBuyWrites(symbols, 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const ex = result.exportResult!;

    expect(ex.membership).toHaveLength(symbols.length);
    expect(ex.membership.every((r) => r.evaluationUnitType === "evaluated_symbol")).toBe(true);
    expect(new Set(ex.membership.map((r) => r.symbol)).size).toBe(symbols.length);

    const total = Object.values(deriveCounters(ex.membership)).reduce((s, n) => s + n, 0);
    expect(ex.denominator).toBe(result.universeSize);
    expect(total).toBe(result.universeSize);
    expect(total).toBe(symbols.length);
  });

  it("visible outcomes is exactly deriveCounters(membership) — single accounting authority (test req 3)", async () => {
    await populateChain("XLE", [{ strike: 60, bid: 1.2, ask: 1.4, delta: 0.32, openInterest: 300, volume: 80 }], 58);
    await populateAbsent("BOND");
    await populateChain("UNFIT", [{ strike: 55, bid: 1.2, ask: 1.4, delta: 0.35, openInterest: 300, volume: 80 }], 58);
    const symbols = ["XLE", "BOND", "UNFIT", "PENDING"];

    const result = await recommendBuyWrites(symbols, 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const derived = deriveCounters(result.exportResult!.membership);
    const o = result.outcomes;

    for (const key of Object.keys(o) as (keyof typeof o)[]) {
      expect(o[key]).toBe(derived[key] ?? 0);
    }
    for (const key of Object.keys(derived)) {
      expect(o).toHaveProperty(key);
    }
  });

  it("copies exact provenance into the actionable record; blank when unavailable (test req 11/12)", async () => {
    // Keep the record FRESH (default retrievedAt); provenance's acquiredAtMs is
    // independent of freshness TTL and is what must be copied into the record.
    const acquiredMs = Date.parse("2026-09-14T14:16:00.000Z");
    const expKey = buildCacheKey("tradier", env, "expirations", "XLE");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "XLE", null, [{ date: "2026-08-21", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "XLE", "2026-08-21");
    await cache.put(cache.createRecord(
      chainKey, "chain", "tradier", env, "XLE", "2026-08-21",
      { underlying: { symbol: "XLE", name: "XLE Fund", price: 58 }, calls: [{ strike: 60, bid: 1.2, ask: 1.4, delta: 0.32, openInterest: 300, volume: 80 }], puts: [] },
      undefined, { kind: "chain-acquired", acquiredAtMs: acquiredMs },
    ));
    await populateAbsent("BOND");

    const result = await recommendBuyWrites(["XLE", "BOND"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const m = result.exportResult!.membership;
    const xle = m.find((r) => r.symbol === "XLE")!;
    const bond = m.find((r) => r.symbol === "BOND")!;

    expect(["actionable", "edge", "wait"]).toContain(xle.terminalOutcome);
    expect(xle.evidenceRetrievedAt).toBe(new Date(acquiredMs).toISOString());
    expect(bond.terminalOutcome).toBe("nonOptionable");
    expect(bond.evidenceRetrievedAt).toBeNull();
  });

  it("grouping reproduces outcomes exactly and preserves strategyUnfit taxonomy (test req 4, 5)", async () => {
    await populateChain("XLE", [{ strike: 60, bid: 1.2, ask: 1.4, delta: 0.32, openInterest: 300, volume: 80 }], 58);
    await populateAbsent("BOND");
    await populateChain("UNFIT", [{ strike: 55, bid: 1.2, ask: 1.4, delta: 0.35, openInterest: 300, volume: 80 }], 58);
    const symbols = ["XLE", "BOND", "UNFIT", "PENDING"];

    const result = await recommendBuyWrites(symbols, 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const derived = deriveCounters(result.exportResult!.membership);
    const o = result.outcomes;

    expect(derived.actionable ?? 0).toBe(o.actionable);
    expect(derived.edge ?? 0).toBe(o.edge);
    expect(derived.wait ?? 0).toBe(o.wait);
    expect(derived.hardNoZeroBid ?? 0).toBe(o.hardNoZeroBid);
    expect(derived.hardNoZeroOI ?? 0).toBe(o.hardNoZeroOI);
    expect(derived.hardNoWideSpread ?? 0).toBe(o.hardNoWideSpread);
    expect(derived.noDeltaMatch ?? 0).toBe(o.noDeltaMatch);
    expect(derived.noDteMatch ?? 0).toBe(o.noDteMatch);
    expect(derived.nonOptionable ?? 0).toBe(o.nonOptionable);
    expect(derived.incomplete ?? 0).toBe(o.incomplete);
    // Buy-write-specific outcome preserved (not folded into a CSP bucket).
    expect(derived.strategyUnfit ?? 0).toBe(o.strategyUnfit);
    expect(o.strategyUnfit).toBeGreaterThan(0);
  });

  it("producing the export result does not mutate evidence (test req 8)", async () => {
    await populateChain("XLE", [{ strike: 60, bid: 1.2, ask: 1.4, delta: 0.32, openInterest: 300, volume: 80 }], 58);
    const putSpy = vi.spyOn(cache, "put");
    const delSpy = vi.spyOn(cache, "delete");

    await recommendBuyWrites(["XLE"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });

    // The engine only reads the cache to compute recommendations; export assembly
    // is pure. No writes/deletes to the durable evidence store.
    expect(putSpy).not.toHaveBeenCalled();
    expect(delSpy).not.toHaveBeenCalled();
  });

  it("distinct Decision runs produce distinct atomic results without mixing records (test req 9, 10)", async () => {
    await populateChain("XLE", [{ strike: 60, bid: 1.2, ask: 1.4, delta: 0.32, openInterest: 300, volume: 80 }], 58);

    const run1 = await recommendBuyWrites(["XLE"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });
    const run2 = await recommendBuyWrites(["XLE"], 500_000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY, { exportContext: EXPORT_CTX });

    // Each run mints its own run id — export does not reuse a prior id.
    expect(run1.exportResult!.metadata.decisionRunId).not.toBe(run2.exportResult!.metadata.decisionRunId);
    // Membership arrays are independent objects (no shared mutation / mixing).
    expect(run1.exportResult!.membership).not.toBe(run2.exportResult!.membership);
    expect(run1.exportResult!.membership).toHaveLength(1);
    expect(run2.exportResult!.membership).toHaveLength(1);
  });
});

describe("Export guard — incomplete/empty results (test req 11)", () => {
  it("downloadFunnelCsv does nothing for a null or empty-membership result", () => {
    // No membership → not exportable as if complete. Guarded before any DOM work.
    const createSpy = vi.spyOn(document, "createElement");

    downloadFunnelCsv(null);
    const empty = buildDecisionExportResult(
      {
        strategy: "buy_write",
        decisionRunId: "buy_write-genna-na-1-0",
        evaluatedAt: "2026-09-14T00:00:00.000Z",
        evidenceGeneration: null,
        policyVersion: "v",
        sessionState: "CLOSED_CANONICAL",
        canonicalSessionDate: null,
        evidenceEnvironment: "unknown",
      },
      [],
    );
    downloadFunnelCsv(empty);

    // No anchor element was created for either guarded case.
    expect(createSpy).not.toHaveBeenCalledWith("a");
    createSpy.mockRestore();
  });
});
