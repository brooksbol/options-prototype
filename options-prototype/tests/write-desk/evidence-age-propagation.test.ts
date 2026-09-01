/**
 * PL-EVID-AGE — provenance propagation through the recommendation engines.
 *
 * Proves the engines COPY the chain record's operator-facing evidenceProvenance
 * onto each row, and do NOT reconstruct Age from the generic cache TTL
 * timestamp (retrievedAt). To prove non-reconstruction we deliberately set the
 * cache TTL timestamp and the operator-facing provenance to DIFFERENT values;
 * the row must carry the provenance value, never the TTL value.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { recommendCalls } from "../../src/write-desk/recommend-calls";
import { recommendBuyWrites } from "../../src/write-desk/recommend-buy-writes";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";
import type { InventoryPosition } from "../../src/write-desk/types";

let testId = 0;

describe("PL-EVID-AGE provenance propagation", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  // Distinct values so a row copying provenance can never be confused with one
  // reconstructing age from the TTL timestamp.
  const TTL_MS = 5_000_000_000_000;
  const PROVENANCE: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: 1_756_744_200_000 };

  beforeEach(() => {
    testId++;
    env = `age-prop-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populatePut(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(
      chainKey, "chain", "tradier", env, symbol, "2026-08-03",
      { underlying: { symbol, name: `${symbol} Fund`, price: 100 }, puts: [{ strike: 95, bid: 1.5, ask: 1.7, delta: -0.30, openInterest: 500, volume: 100 }], calls: [{ strike: 105, bid: 1.2, ask: 1.4, delta: 0.30, openInterest: 400, volume: 80 }] },
      TTL_MS,       // generic cache TTL timestamp
      PROVENANCE,   // operator-facing provenance — deliberately different
    ));
  }

  it("recommendPuts copies chain provenance (not the TTL timestamp)", async () => {
    await populatePut("XLE");
    const result = await recommendPuts(["XLE"], 100000, cache, cacheEnv());
    expect(result.candidates.length).toBeGreaterThan(0);
    const row = result.candidates[0];
    expect(row.evidenceProvenance).toEqual(PROVENANCE);
    // Non-reconstruction guard: must not equal the TTL timestamp.
    if (row.evidenceProvenance?.kind === "chain-acquired") {
      expect(row.evidenceProvenance.acquiredAtMs).not.toBe(TTL_MS);
    }
  });

  it("recommendCalls copies chain provenance", async () => {
    await populatePut("XLE");
    const inventory: InventoryPosition[] = [{
      symbol: "XLE", sharesOwned: 200, sharesEncumbered: 100, sharesFree: 100,
      maxAdditionalContracts: 1, economics: null,
    }];
    const result = await recommendCalls(inventory, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);
    const all = [...result.candidates, ...result.waitCandidates];
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].evidenceProvenance).toEqual(PROVENANCE);
  });

  it("recommendBuyWrites copies chain provenance", async () => {
    await populatePut("XLE");
    const result = await recommendBuyWrites(["XLE"], 100000, cache, cacheEnv(), DEFAULT_RECOMMENDATION_POLICY);
    const all = [...result.candidates, ...result.waitCandidates, ...result.wideSpreadCandidates];
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].evidenceProvenance).toEqual(PROVENANCE);
  });

  it("rows are unavailable when the chain record has no provenance (no silent fallback)", async () => {
    const symbol = "XLF";
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    // Chain has a TTL timestamp but NO evidenceProvenance — Age must be unavailable.
    await cache.put(cache.createRecord(
      chainKey, "chain", "tradier", env, symbol, "2026-08-03",
      { underlying: { symbol, name: `${symbol} Fund`, price: 100 }, puts: [{ strike: 95, bid: 1.5, ask: 1.7, delta: -0.30, openInterest: 500, volume: 100 }] },
      TTL_MS,
      // no provenance arg
    ));
    const result = await recommendPuts([symbol], 100000, cache, cacheEnv());
    expect(result.candidates.length).toBeGreaterThan(0);
    const prov = result.candidates[0].evidenceProvenance;
    expect(prov === undefined || prov.kind === "unavailable").toBe(true);
  });
});
