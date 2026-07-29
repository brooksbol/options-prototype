/**
 * Contingent Calls — Tests
 *
 * Proves:
 * 1. Portfolio short puts produce contingent call rows via PCS machinery
 * 2. Rows carry correct originating put provenance and basis
 * 3. Rows use strike-only basis (premium unavailable)
 * 4. Puts with no qualifying calls produce exclusion reasons
 * 5. PCS failure for one put doesn't prevent others from producing rows
 * 6. Factory helpers produce correct discriminated union shapes
 * 7. Contingent shares use absolute quantity × 100
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { computeContingentCalls } from "../../src/write-desk/contingent-calls";
import { executableRowFromCandidate, contingentRowFromOpportunity } from "../../src/write-desk/call-table-row";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DEFAULT_EXECUTION_POLICY } from "../../src/write-desk/execution-policy";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import type { OpenShortPut } from "../../src/write-desk/types";
import type { CallCandidate } from "../../src/write-desk/scan-orchestrator";

let testId = 0;

describe("computeContingentCalls", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });
  const policyInput = {
    contractSelection: DEFAULT_RECOMMENDATION_POLICY.contractSelection,
    executionAssessment: DEFAULT_EXECUTION_POLICY,
  };

  beforeEach(() => {
    testId++;
    env = `contingent-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateChain(symbol: string, calls: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>, underlyingPrice: number = 90.0, expDate: string = "2026-08-14") {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: expDate, dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, expDate);
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, expDate, {
      underlying: { symbol, name: `${symbol} Fund`, price: underlyingPrice },
      calls,
      puts: [],
    }));
  }

  const makePut = (underlying: string, strike: number, expiration: string = "2026-08-07", quantity: number = -1): OpenShortPut => ({
    symbol: `-${underlying}260807P${strike}`,
    underlying,
    strike,
    expiration,
    quantity,
  });

  // --- Test 1: Puts produce contingent rows ---

  it("produces contingent call rows from portfolio short puts", async () => {
    await populateChain("IGV", [
      { strike: 92, bid: 1.50, ask: 1.80, delta: 0.40, openInterest: 100, volume: 30 },
      { strike: 95, bid: 0.80, ask: 1.00, delta: 0.28, openInterest: 150, volume: 40 },
    ], 88.0);

    const result = await computeContingentCalls(
      [makePut("IGV", 90)],
      cache, cacheEnv(), policyInput
    );

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].availability).toBe("if-assigned");
    expect(result.rows[0].symbol).toBe("IGV");
    // Calls above basis $90: strike 92 and 95
    expect(result.rows.every(r => r.strike > 90)).toBe(true);
  });

  // --- Test 2: Rows carry correct provenance ---

  it("carries originating put provenance and conditioned basis", async () => {
    await populateChain("URA", [
      { strike: 42, bid: 0.60, ask: 0.80, delta: 0.30, openInterest: 80, volume: 20 },
    ], 39.0);

    const result = await computeContingentCalls(
      [makePut("URA", 40, "2026-08-07", -1)],
      cache, cacheEnv(), policyInput
    );

    expect(result.rows.length).toBe(1);
    const row = result.rows[0];
    expect(row.originatingPut.underlying).toBe("URA");
    expect(row.originatingPut.strike).toBe(40);
    expect(row.originatingPut.expiration).toBe("2026-08-07");
    expect(row.conditionedBasis).toBe(40); // Strike-only basis
    expect(row.basisSource).toBe("strike-only");
    expect(row.contingentShares).toBe(100); // 1 contract × 100
  });

  // --- Test 3: Strike-only basis ---

  it("uses put strike as conditioned basis (premium unavailable)", async () => {
    await populateChain("XLK", [
      { strike: 185, bid: 2.00, ask: 2.50, delta: 0.35, openInterest: 200, volume: 50 },
    ], 180.0);

    const result = await computeContingentCalls(
      [makePut("XLK", 181)],
      cache, cacheEnv(), policyInput
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].conditionedBasis).toBe(181);
    // Yield should be from basis $181, not from underlying $180
    expect(result.rows[0].yieldFromBasis).not.toBeNull();
  });

  // --- Test 4: Excluded puts reported ---

  it("reports puts with no qualifying calls as excluded", async () => {
    // No chain evidence for REMX
    const result = await computeContingentCalls(
      [makePut("REMX", 68)],
      cache, cacheEnv(), policyInput
    );

    expect(result.rows.length).toBe(0);
    expect(result.excludedPuts.length).toBe(1);
    expect(result.excludedPuts[0].underlying).toBe("REMX");
    expect(result.excludedPuts[0].reason).toContain("evidence");
  });

  // --- Test 5: Failure for one put doesn't block others ---

  it("processes remaining puts when one fails", async () => {
    // IGV has chain, REMX does not
    await populateChain("IGV", [
      { strike: 95, bid: 1.00, ask: 1.20, delta: 0.30, openInterest: 100, volume: 30 },
    ], 88.0);

    const result = await computeContingentCalls(
      [makePut("REMX", 68), makePut("IGV", 90)],
      cache, cacheEnv(), policyInput
    );

    // IGV produces rows; REMX is excluded
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].symbol).toBe("IGV");
    expect(result.excludedPuts.length).toBe(1);
    expect(result.excludedPuts[0].underlying).toBe("REMX");
  });

  // --- Test 6: Quantity absolute value ---

  it("uses absolute quantity for contingent shares", async () => {
    await populateChain("PSI", [
      { strike: 160, bid: 3.00, ask: 3.50, delta: 0.35, openInterest: 80, volume: 20 },
    ], 153.0);

    const result = await computeContingentCalls(
      [makePut("PSI", 155, "2026-08-21", -2)], // 2 short contracts
      cache, cacheEnv(), policyInput
    );

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].contingentShares).toBe(200); // abs(-2) × 100
  });
});

// --- Factory Helper Tests ---

describe("CallTableRow factory helpers", () => {

  it("executableRowFromCandidate produces available-now row", () => {
    const candidate: CallCandidate = {
      rank: 1,
      symbol: "XLE",
      expiration: "2026-08-14",
      dte: 21,
      strike: 60,
      delta: 0.30,
      bid: 1.20,
      ask: 1.40,
      mid: 1.30,
      spreadPercent: 15.4,
      openInterest: 300,
      volume: 80,
      freeShares: 200,
      maxContracts: 2,
      premiumPerContract: 130,
      yieldAnnualized: 38.9,
      assessment: { score: 75, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
      posture: "ACTIONABLE",
      strikeAbovePrice: true,
      underlyingPrice: 58.0,
      economics: null,
    };

    const row = executableRowFromCandidate(candidate);
    expect(row.availability).toBe("available-now");
    expect(row.symbol).toBe("XLE");
    expect(row.candidate).toBe(candidate);
    expect(row.posture).toBe("ACTIONABLE");
    expect(row.executionScore).toBe(75);
  });

  it("contingentRowFromOpportunity produces if-assigned row", () => {
    const opp = {
      expiration: "2026-08-14",
      dte: 21,
      strike: 95,
      delta: 0.30,
      bid: 1.00,
      ask: 1.20,
      mid: 1.10,
      spreadPercent: 18.2,
      openInterest: 100,
      volume: 30,
      yieldFromBasis: 21.3,
      strikeDistanceFromBasis: 5.0,
      aboveBasis: true,
      satisfiesPolicy: true,
      policyFailureReasons: [],
    };

    const row = contingentRowFromOpportunity(opp, {
      underlying: "IGV",
      strike: 90,
      expiration: "2026-08-07",
      quantity: -1,
    });

    expect(row.availability).toBe("if-assigned");
    expect(row.symbol).toBe("IGV");
    expect(row.strike).toBe(95);
    expect(row.conditionedBasis).toBe(90);
    expect(row.basisSource).toBe("strike-only");
    expect(row.contingentShares).toBe(100);
    expect(row.originatingPut.strike).toBe(90);
    expect(row.originatingPut.expiration).toBe("2026-08-07");
    expect(row.yieldFromBasis).toBe(21.3);
  });
});
