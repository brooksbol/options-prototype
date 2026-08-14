/**
 * Buy-Write Encumbrance Regression Test
 *
 * Proves the invariant: shares acquired via a buy-write (or any covered-call pairing)
 * are never available for additional call writing.
 *
 * Test case from production: EWY 100 shares + short 1 Sep 4 $182.50 call.
 * Correct state at every boundary:
 *   sharesOwned            = 100
 *   sharesEncumbered       = 100
 *   sharesFree             = 0
 *   maxAdditionalContracts = 0
 *   EWY must NOT appear as a covered-call candidate
 *
 * Exercises three ingestion scenarios:
 *   A. Option Summary alone (current export, contains both share + call)
 *   B. Option Summary (pre-buy-write) + Activity projection (both legs present)
 *   C. Option Summary (current) + Activity (same-day, both legs) — no double-counting
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { buildFidelitySnapshot, type FidelitySnapshotInput } from "../../src/write-desk/fidelity-snapshot";
import { projectActivityOverlay, parseCheckpoint } from "../../src/portfolio/activity-projection";
import { recommendCalls } from "../../src/write-desk/recommend-calls";
import { DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import type { OptionSummaryRow } from "../../src/csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../../src/csv/fidelity/balancesParser";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";

// --- Fixtures: EWY buy-write as observed in Fidelity exports ---

function ewyShareRow(): OptionSummaryRow {
  return {
    symbol: "EWY",
    description: "ISHARES MSCI SOUTH KOREA ETF",
    strategy: "CoveredCall",
    positionType: "share",
    quantity: 100,
    bid: 179.53,
    ask: 179.54,
    costBasis: 17929.00,
    marketValue: 17956.00,
    averageCost: 179.29,
    totalGainLoss: 27.00,
    totalGainLossPercent: 0.15,
    last: 179.56,
    change: 0.94,
    changePercent: 0.53,
    marginRequirement: 0,
    option: null,
    rawRow: [],
  };
}

function ewyCallRow(): OptionSummaryRow {
  return {
    symbol: "EWY",
    description: "ISHARES MSCI SOUTH KOREA ETF",
    strategy: "CoveredCall",
    positionType: "option",
    quantity: -1,
    bid: 6.20,
    ask: 7.90,
    costBasis: -760.32,
    marketValue: -790.00,
    averageCost: -7.60,
    totalGainLoss: -29.68,
    totalGainLossPercent: -3.90,
    last: 7.61,
    change: -5.89,
    changePercent: -43.63,
    marginRequirement: null,
    option: {
      underlying: "EWY",
      expiration: "2026-09-04",
      strike: 182.50,
      type: "CALL",
    },
    rawRow: [],
  };
}

function makeBalances(): ParsedBalances {
  return {
    availableToTrade: 1069.83,
    availableToTradeAllSettled: 1069.83,
    cashAndCredits: 1069.83,
    totalAccountValue: 50000,
    valueOfInvestments: 48930.17,
    availableToWithdraw: 1069.83,
    accountName: "Individual",
    accountNumber: "262761078",
    allRows: [{ label: "Available to Trade", amount: 1069.83, dayChange: null, isSubItem: false, rawRow: [] }],
  };
}

function makeSnapshotInput(optionSummaryRows: OptionSummaryRow[], exportTimestamp: string | null = "08/14/2026"): FidelitySnapshotInput {
  return {
    optionSummaryRows,
    optionSummaryFilename: "Option_Summary_2026-08-14.csv",
    optionSummaryExportTimestamp: exportTimestamp,
    balances: makeBalances(),
    balancesFilename: "Balances_2026-08-14.csv",
    balancesExportTimestamp: "08/14/2026",
  };
}

/** Activity rows representing the EWY buy-write on Aug 14 */
function ewyBuyWriteActivityRows(): ActivityRow[] {
  return [
    {
      date: "2026-08-14",
      eventType: "shares_bought_direct",
      action: "YOU BOUGHT",
      symbol: "EWY",
      description: "ISHARES MSCI SOUTH KOREA ETF",
      quantity: 100,
      price: 179.29,
      commission: 0,
      fees: 0,
      amount: -17929.00,
      cashBalance: null,
      settlementDate: "2026-08-18",
      option: null,
      rawRow: [],
    },
    {
      date: "2026-08-14",
      eventType: "sell_to_open",
      action: "YOU SOLD OPENING TRANSACTION",
      symbol: "-EWY260904C182.5",
      description: "CALL (EWY) ISHARES MSCI SOUTH KOREA SEP 04 26 $182.5",
      quantity: -1,
      price: 7.61,
      commission: 0,
      fees: 0,
      amount: 760.32,
      cashBalance: null,
      settlementDate: "2026-08-15",
      option: {
        underlying: "EWY",
        expiration: "2026-09-04",
        strike: 182.50,
        type: "CALL",
      },
      rawRow: [],
    },
  ];
}

// --- Invariant assertion helper ---

function assertEwyFullyEncumbered(label: string, inventory: { symbol: string; sharesOwned: number; sharesEncumbered: number; sharesFree: number; maxAdditionalContracts: number }[]) {
  const ewy = inventory.find(p => p.symbol === "EWY");
  expect(ewy, `${label}: EWY must be present in inventory`).toBeDefined();
  expect(ewy!.sharesOwned, `${label}: sharesOwned`).toBe(100);
  expect(ewy!.sharesEncumbered, `${label}: sharesEncumbered`).toBe(100);
  expect(ewy!.sharesFree, `${label}: sharesFree`).toBe(0);
  expect(ewy!.maxAdditionalContracts, `${label}: maxAdditionalContracts`).toBe(0);
}

// --- Tests ---

describe("buy-write encumbrance invariant", () => {

  describe("Scenario A: Option Summary alone (current export contains both share + call)", () => {
    it("derives EWY as fully encumbered from Option Summary", () => {
      const input = makeSnapshotInput([ewyShareRow(), ewyCallRow()]);
      const snapshot = buildFidelitySnapshot(input);

      assertEwyFullyEncumbered("deriveInventory", snapshot.inventory);

      // Existing calls must include the EWY Sep 4 $182.50 call
      const ewyCalls = snapshot.existingCalls.filter(c => c.underlying === "EWY");
      expect(ewyCalls.length).toBe(1);
      expect(ewyCalls[0].strike).toBe(182.50);
      expect(ewyCalls[0].expiration).toBe("2026-09-04");
      expect(ewyCalls[0].quantity).toBe(1);
    });
  });

  describe("Scenario B: Option Summary predates buy-write, Activity supplies both legs", () => {
    it("projects buy-write from Activity and produces fully encumbered EWY", () => {
      // Option Summary has no EWY (exported before the trade)
      const input = makeSnapshotInput([], "08/13/2026");
      const baseSnapshot = buildFidelitySnapshot(input);

      // EWY should not exist in base
      expect(baseSnapshot.inventory.find(p => p.symbol === "EWY")).toBeUndefined();

      // Project Activity containing the buy-write
      const checkpoint = parseCheckpoint("08/13/2026");
      const { snapshot: projected } = projectActivityOverlay(
        baseSnapshot,
        ewyBuyWriteActivityRows(),
        checkpoint.timestamp,
        checkpoint.precision,
      );

      assertEwyFullyEncumbered("post-projection", projected.inventory);

      // Existing calls must include the projected call
      const ewyCalls = projected.existingCalls.filter(c => c.underlying === "EWY");
      expect(ewyCalls.length).toBe(1);
      expect(ewyCalls[0].strike).toBe(182.50);
      expect(ewyCalls[0].expiration).toBe("2026-09-04");
    });
  });

  describe("Scenario C: Current Option Summary + same-day Activity (no double-counting)", () => {
    it("does not double-count when Option Summary and Activity both contain the buy-write", () => {
      // Option Summary already contains EWY (exported after the trade)
      const input = makeSnapshotInput([ewyShareRow(), ewyCallRow()], "08/14/2026");
      const baseSnapshot = buildFidelitySnapshot(input);

      // Base should already be correct
      assertEwyFullyEncumbered("base snapshot", baseSnapshot.inventory);

      // Project Activity from same day — both legs present
      const checkpoint = parseCheckpoint("08/14/2026");
      const { snapshot: projected } = projectActivityOverlay(
        baseSnapshot,
        ewyBuyWriteActivityRows(),
        checkpoint.timestamp,
        checkpoint.precision,
      );

      // After projection: must still be exactly 100/100/0 — no inflation
      assertEwyFullyEncumbered("post-projection (no double-count)", projected.inventory);

      // Must NOT have duplicate calls
      const ewyCalls = projected.existingCalls.filter(c => c.underlying === "EWY");
      expect(ewyCalls.length, "exactly one EWY short call").toBe(1);
    });
  });

  describe("call recommendation exclusion", () => {
    let cache: DurableMarketCache;

    beforeEach(() => {
      resetDB();
      resetDurableCache();
      cache = getDurableCache();
    });

    it("does not recommend a call for fully encumbered EWY", async () => {
      const input = makeSnapshotInput([ewyShareRow(), ewyCallRow()]);
      const snapshot = buildFidelitySnapshot(input);

      // Populate cache with EWY chain data (even if available, should not be recommended)
      const env = "test-env";
      const expKey = buildCacheKey("tradier", env, "expirations", "EWY");
      await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "EWY", null, [{ date: "2026-09-04", dte: 21 }]));
      const chainKey = buildCacheKey("tradier", env, "chain", "EWY", "2026-09-04");
      await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, "EWY", "2026-09-04", {
        underlying: { symbol: "EWY", name: "iShares MSCI South Korea ETF", price: 179.56 },
        calls: [
          { strike: 185, bid: 3.20, ask: 3.80, delta: 0.30, openInterest: 500, volume: 120 },
          { strike: 188, bid: 1.80, ask: 2.20, delta: 0.20, openInterest: 300, volume: 60 },
        ],
        puts: [],
      }));

      const result = await recommendCalls(
        snapshot.inventory,
        cache,
        { provider: "tradier", environment: env },
        DEFAULT_RECOMMENDATION_POLICY,
      );

      // EWY must not appear in candidates — it has zero free shares
      const ewyCandidates = result.candidates.filter(c => c.symbol === "EWY");
      expect(ewyCandidates.length, "EWY must not be a call candidate").toBe(0);
    });
  });

  describe("checkpoint provenance-precision policy", () => {
    it("date-only checkpoint: same-day activity does NOT project", () => {
      const checkpoint = parseCheckpoint("08/14/2026");
      expect(checkpoint.precision).toBe("day");

      const input = makeSnapshotInput([ewyShareRow(), ewyCallRow()], "08/14/2026");
      const baseSnapshot = buildFidelitySnapshot(input);

      const { snapshot: projected, projectedEventCount } = projectActivityOverlay(
        baseSnapshot,
        ewyBuyWriteActivityRows(), // same date: 2026-08-14
        checkpoint.timestamp,
        checkpoint.precision,
      );

      expect(projectedEventCount, "no events should project on same calendar day").toBe(0);
      assertEwyFullyEncumbered("day-precision same-day", projected.inventory);
    });

    it("date-only checkpoint: next-day activity DOES project", () => {
      // Checkpoint is Aug 13 (day precision), activity is Aug 14
      const checkpoint = parseCheckpoint("08/13/2026");
      expect(checkpoint.precision).toBe("day");

      const input = makeSnapshotInput([], "08/13/2026");
      const baseSnapshot = buildFidelitySnapshot(input);

      const { snapshot: projected, projectedEventCount } = projectActivityOverlay(
        baseSnapshot,
        ewyBuyWriteActivityRows(), // dated 2026-08-14
        checkpoint.timestamp,
        checkpoint.precision,
      );

      expect(projectedEventCount, "next-day events should project").toBe(2);
      assertEwyFullyEncumbered("day-precision next-day", projected.inventory);
    });

    it("intraday checkpoint: same-day activity after checkpoint time DOES project", () => {
      // Checkpoint at 2:00 PM, activity at 4:00 PM (end of day)
      const checkpoint = parseCheckpoint("Aug 14, 2026 2:00 PM ET");
      expect(checkpoint.precision).toBe("intraday");

      const input = makeSnapshotInput([], "Aug 14, 2026 2:00 PM ET");
      const baseSnapshot = buildFidelitySnapshot(input);

      const { snapshot: projected, projectedEventCount } = projectActivityOverlay(
        baseSnapshot,
        ewyBuyWriteActivityRows(),
        checkpoint.timestamp,
        checkpoint.precision,
      );

      expect(projectedEventCount, "activity after intraday checkpoint should project").toBe(2);
      assertEwyFullyEncumbered("intraday-precision same-day", projected.inventory);
    });

    it("null checkpoint: all activity projects (fallback)", () => {
      const checkpoint = parseCheckpoint(null);
      expect(checkpoint.precision).toBe("none");

      const input = makeSnapshotInput([], null);
      const baseSnapshot = buildFidelitySnapshot(input);

      const { snapshot: projected, projectedEventCount } = projectActivityOverlay(
        baseSnapshot,
        ewyBuyWriteActivityRows(),
        checkpoint.timestamp,
        checkpoint.precision,
      );

      expect(projectedEventCount, "all events project when no checkpoint").toBe(2);
      assertEwyFullyEncumbered("no-checkpoint fallback", projected.inventory);
    });
  });
});
