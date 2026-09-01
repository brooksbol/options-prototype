/**
 * PL-EVID-AGE — contingent-call provenance traverses all three layers:
 *   ConditionedCallChainEvidence → ConditionedCallOpportunity → ContingentCallRow
 *
 * This is the regression guard for the review finding that provenance was
 * discarded upstream and could not be set at the row factory alone.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { computeContingentCalls } from "../../src/write-desk/contingent-calls";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DEFAULT_EXECUTION_POLICY } from "../../src/write-desk/execution-policy";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import type { OpenShortPut } from "../../src/write-desk/types";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

let testId = 0;

describe("contingent-call Age provenance (3-layer)", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });
  const policyInput = {
    contractSelection: DEFAULT_RECOMMENDATION_POLICY.contractSelection,
    executionAssessment: DEFAULT_EXECUTION_POLICY,
  };
  const TTL_MS = 5_000_000_000_000;
  const PROVENANCE: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: 1_756_744_200_000 };

  beforeEach(() => {
    testId++;
    env = `contingent-age-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  const makePut = (underlying: string, strike: number): OpenShortPut => ({
    symbol: `-${underlying}260807P${strike}`,
    underlying,
    strike,
    expiration: "2026-08-07",
    quantity: -1,
  });

  it("carries chain-acquired provenance onto contingent rows", async () => {
    const symbol = "IGV";
    const expDate = "2026-08-14";
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: expDate, dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    await cache.put(cache.createRecord(
      chainKey, "chain", "tradier", env, symbol, expDate,
      { underlying: { symbol, name: `${symbol} Fund`, price: 88.0 }, calls: [
        { strike: 92, bid: 1.50, ask: 1.80, delta: 0.40, openInterest: 100, volume: 30 },
        { strike: 95, bid: 0.80, ask: 1.00, delta: 0.28, openInterest: 150, volume: 40 },
      ], puts: [] },
      TTL_MS,
      PROVENANCE,
    ));

    const result = await computeContingentCalls([makePut(symbol, 90)], cache, cacheEnv(), policyInput);

    expect(result.rows.length).toBeGreaterThan(0);
    for (const row of result.rows) {
      expect(row.evidenceProvenance).toEqual(PROVENANCE);
      // Non-reconstruction guard.
      if (row.evidenceProvenance?.kind === "chain-acquired") {
        expect(row.evidenceProvenance.acquiredAtMs).not.toBe(TTL_MS);
      }
    }
  });
});
