/**
 * Buy-Write Origin Classification Tests
 *
 * Proves the invariant: BW classification requires provenance evidence (same-day
 * share acquisition + call STO), not merely coincident portfolio state.
 *
 * Key acceptance criteria:
 * - Pre-existing shares + STO call + known basis → CALL (not BW)
 * - Simultaneous/matched share acquisition + STO call → BW
 * - Known basis alone does not imply BW
 * - Existing real EWY-style BW activity remains BW
 * - Puts are unaffected by origin logic
 */

import { describe, it, expect } from "vitest";
import { deriveMonitoredPositions } from "../../src/portfolio/position-monitoring";
import { projectActivityOverlay, parseCheckpoint } from "../../src/portfolio/activity-projection";
import { buildFidelitySnapshot, type FidelitySnapshotInput } from "../../src/write-desk/fidelity-snapshot";
import type { PortfolioSnapshot, OpenShortCall, OpenShortPut, InventoryPosition } from "../../src/write-desk/types";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";
import type { OptionSummaryRow } from "../../src/csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../../src/csv/fidelity/balancesParser";

// --- Helpers ---

function makeSnapshot(overrides?: {
  inventory?: InventoryPosition[];
  existingCalls?: OpenShortCall[];
  existingPuts?: OpenShortPut[];
}): PortfolioSnapshot {
  return {
    id: "test",
    source: { type: "fidelity", label: "Test" },
    accountId: "TEST",
    snapshotDate: "2026-08-19",
    inventory: overrides?.inventory ?? [],
    existingCalls: overrides?.existingCalls ?? [],
    existingPuts: overrides?.existingPuts ?? [],
    deployableCash: 50000,
    balanceContext: null,
    provenance: { sourceType: "fidelity", sourceLabel: "Test", createdAt: "2026-08-19T00:00:00Z" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
  };
}

function makeBalances(): ParsedBalances {
  return {
    availableToTrade: 50000,
    availableToTradeAllSettled: 50000,
    cashAndCredits: 50000,
    totalAccountValue: 200000,
    valueOfInvestments: 150000,
    availableToWithdraw: 50000,
    accountName: "Test",
    accountNumber: "TEST001",
    allRows: [],
  };
}

function makeSnapshotInput(rows: OptionSummaryRow[]): FidelitySnapshotInput {
  return {
    optionSummaryRows: rows,
    optionSummaryFilename: "test.csv",
    optionSummaryExportTimestamp: "08/18/2026",
    balances: makeBalances(),
    balancesFilename: "balances.csv",
    balancesExportTimestamp: "08/18/2026",
  };
}

const TODAY = new Date("2026-08-19T12:00:00Z");

// --- Tests ---

describe("buy-write origin classification", () => {

  describe("coincident state does NOT imply buy-write", () => {
    it("pre-existing shares + known basis + short call → CALL (not BW)", () => {
      // XLE: operator has held 400 shares for months, cost basis known, call written separately
      const snapshot = makeSnapshot({
        inventory: [{
          symbol: "XLE",
          sharesOwned: 400,
          sharesEncumbered: 200,
          sharesFree: 200,
          maxAdditionalContracts: 2,
          economics: { averageCostPerShare: 55.93, costBasis: 22372, marketValue: 24000 },
        }],
        existingCalls: [{
          symbol: "-XLE260822C60",
          underlying: "XLE",
          strike: 60,
          expiration: "2026-08-22",
          quantity: 2,
          brokerOptionBasis: -240,
          brokerOptionAverageCost: -1.20,
          // No origin field — default is null/undefined → CALL
        }],
      });

      const positions = deriveMonitoredPositions(snapshot, null, TODAY);
      const xleCall = positions.find(p => p.underlying === "XLE" && p.type !== "put");

      expect(xleCall).toBeDefined();
      expect(xleCall!.type).toBe("call");
    });

    it("known averageCostPerShare alone does not establish buy-write", () => {
      // Multiple symbols with shares + basis + calls, but no BW provenance
      const snapshot = makeSnapshot({
        inventory: [
          { symbol: "QQQ", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 485, costBasis: 97000, marketValue: 98000 } },
          { symbol: "GLD", sharesOwned: 300, sharesEncumbered: 200, sharesFree: 100, maxAdditionalContracts: 1, economics: { averageCostPerShare: 220, costBasis: 66000, marketValue: 67000 } },
        ],
        existingCalls: [
          { symbol: "-QQQ260822C510", underlying: "QQQ", strike: 510, expiration: "2026-08-22", quantity: 2, brokerOptionBasis: -500, brokerOptionAverageCost: -2.50 },
          { symbol: "-GLD260822C230", underlying: "GLD", strike: 230, expiration: "2026-08-22", quantity: 2, brokerOptionBasis: -300, brokerOptionAverageCost: -1.50 },
        ],
      });

      const positions = deriveMonitoredPositions(snapshot, null, TODAY);
      const calls = positions.filter(p => p.type !== "put");

      expect(calls).toHaveLength(2);
      for (const c of calls) {
        expect(c.type).toBe("call");
      }
    });
  });

  describe("proven same-day activity → buy-write", () => {
    it("EWY-style buy-write: same-day share purchase + call STO → BW", () => {
      // Base snapshot predates the buy-write (no EWY positions)
      const baseSnapshot = makeSnapshot({});

      const activity: ActivityRow[] = [
        {
          date: "2026-08-19",
          eventType: "shares_bought_direct",
          action: "YOU BOUGHT",
          symbol: "EWY",
          description: "ISHARES MSCI SOUTH KOREA ETF",
          quantity: 100,
          price: 179.29,
          commission: 0,
          fees: 0,
          amount: -17929,
          cashBalance: null,
          settlementDate: "2026-08-21",
          option: null,
          rawRow: [],
        },
        {
          date: "2026-08-19",
          eventType: "sell_to_open",
          action: "YOU SOLD OPENING TRANSACTION",
          symbol: "-EWY260904C185",
          description: "CALL (EWY) SEP 04 26 $185",
          quantity: -1,
          price: 7.50,
          commission: 0,
          fees: 0,
          amount: 750,
          cashBalance: null,
          settlementDate: "2026-08-20",
          option: { underlying: "EWY", expiration: "2026-09-04", strike: 185, type: "CALL" },
          rawRow: [],
        },
      ];

      const checkpoint = parseCheckpoint("08/18/2026");
      const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp);

      // The call should have origin "buy-write"
      const ewyCall = projected.existingCalls.find(c => c.underlying === "EWY");
      expect(ewyCall).toBeDefined();
      expect(ewyCall!.origin).toBe("buy-write");

      // Position monitoring should classify it as buy-write
      const positions = deriveMonitoredPositions(projected, null, TODAY);
      const ewyPos = positions.find(p => p.underlying === "EWY" && p.type !== "put");
      expect(ewyPos).toBeDefined();
      expect(ewyPos!.type).toBe("buy-write");
    });

    it("call STO without same-day share purchase → CALL (even with existing shares)", () => {
      // Shares already exist from a prior purchase (in base snapshot)
      const baseSnapshot = makeSnapshot({
        inventory: [{
          symbol: "XLE",
          sharesOwned: 200,
          sharesEncumbered: 0,
          sharesFree: 200,
          maxAdditionalContracts: 2,
          economics: { averageCostPerShare: 55, costBasis: 11000, marketValue: 12000 },
        }],
      });

      // Activity only has the call write, no same-day share purchase
      const activity: ActivityRow[] = [
        {
          date: "2026-08-19",
          eventType: "sell_to_open",
          action: "YOU SOLD OPENING TRANSACTION",
          symbol: "-XLE260905C60",
          description: "CALL (XLE) SEP 05 26 $60",
          quantity: -2,
          price: 1.10,
          commission: 0,
          fees: 0,
          amount: 220,
          cashBalance: null,
          settlementDate: "2026-08-20",
          option: { underlying: "XLE", expiration: "2026-09-05", strike: 60, type: "CALL" },
          rawRow: [],
        },
      ];

      const checkpoint = parseCheckpoint("08/18/2026");
      const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp);

      const xleCall = projected.existingCalls.find(c => c.underlying === "XLE");
      expect(xleCall).toBeDefined();
      expect(xleCall!.origin).toBeNull();

      // Position monitoring: should be "call" not "buy-write"
      const positions = deriveMonitoredPositions(projected, null, TODAY);
      const xlePos = positions.find(p => p.underlying === "XLE" && p.type !== "put");
      expect(xlePos).toBeDefined();
      expect(xlePos!.type).toBe("call");
    });
  });

  describe("puts are unaffected", () => {
    it("puts always classify as 'put' regardless of inventory state", () => {
      const snapshot = makeSnapshot({
        inventory: [{
          symbol: "URA",
          sharesOwned: 200,
          sharesEncumbered: 0,
          sharesFree: 200,
          maxAdditionalContracts: 2,
          economics: { averageCostPerShare: 30, costBasis: 6000, marketValue: 7000 },
        }],
        existingPuts: [{
          symbol: "-URA260822P35",
          underlying: "URA",
          strike: 35,
          expiration: "2026-08-22",
          quantity: 1,
          brokerOptionBasis: -80,
          brokerOptionAverageCost: -0.80,
        }],
      });

      const positions = deriveMonitoredPositions(snapshot, null, TODAY);
      const uraPut = positions.find(p => p.underlying === "URA");
      expect(uraPut).toBeDefined();
      expect(uraPut!.type).toBe("put");
    });
  });

  describe("Option Summary positions without Activity default to CALL", () => {
    it("Fidelity CoveredCall strategy label does not establish BW origin", () => {
      // This simulates the Fidelity import path: shares + calls with known basis
      // but no Activity History proving simultaneous acquisition.
      const rows: OptionSummaryRow[] = [
        {
          symbol: "XLK",
          description: "TECHNOLOGY SELECT SECT SPDR",
          strategy: "CoveredCall",
          positionType: "share",
          quantity: 200,
          bid: 195.00,
          ask: 195.10,
          costBasis: 38400,
          marketValue: 39000,
          averageCost: 192.00,
          totalGainLoss: 600,
          totalGainLossPercent: 1.56,
          last: 195.05,
          change: 0.50,
          changePercent: 0.26,
          marginRequirement: null,
          option: null,
          rawRow: [],
        },
        {
          symbol: "-XLK260822C200",
          description: "CALL (XLK) AUG 22 26 $200",
          strategy: "CoveredCall",
          positionType: "option",
          quantity: -2,
          bid: 1.20,
          ask: 1.50,
          costBasis: -280,
          marketValue: -300,
          averageCost: -1.40,
          totalGainLoss: -20,
          totalGainLossPercent: -7.14,
          last: 1.35,
          change: -0.10,
          changePercent: -6.90,
          marginRequirement: null,
          option: { underlying: "XLK", expiration: "2026-08-22", strike: 200, type: "CALL" },
          rawRow: [],
        },
      ];

      const snapshot = buildFidelitySnapshot(makeSnapshotInput(rows));
      const positions = deriveMonitoredPositions(snapshot, null, TODAY);
      const xlkPos = positions.find(p => p.underlying === "XLK" && p.type !== "put");

      expect(xlkPos).toBeDefined();
      expect(xlkPos!.type).toBe("call"); // NOT buy-write
    });
  });

  describe("BW origin enrichment from Activity onto existing Option Summary calls", () => {
    it("call in Option Summary + same-day purchase in Activity → BW (enrichment)", () => {
      // The call already exists from Option Summary (pre-checkpoint).
      // Activity proves it was a buy-write. The enrichment pass must tag it.
      const rows: OptionSummaryRow[] = [
        {
          symbol: "EWY",
          description: "ISHARES MSCI SOUTH KOREA ETF",
          strategy: "CoveredCall",
          positionType: "share",
          quantity: 100,
          bid: 181.00,
          ask: 181.20,
          costBasis: 17929,
          marketValue: 18100,
          averageCost: 179.29,
          totalGainLoss: 171,
          totalGainLossPercent: 0.95,
          last: 181.10,
          change: 0.30,
          changePercent: 0.17,
          marginRequirement: null,
          option: null,
          rawRow: [],
        },
        {
          symbol: "-EWY260904C185",
          description: "CALL (EWY) SEP 04 26 $185",
          strategy: "CoveredCall",
          positionType: "option",
          quantity: -1,
          bid: 5.00,
          ask: 5.50,
          costBasis: -750,
          marketValue: -525,
          averageCost: -7.50,
          totalGainLoss: 225,
          totalGainLossPercent: 30.00,
          last: 5.25,
          change: -0.20,
          changePercent: -3.67,
          marginRequirement: null,
          option: { underlying: "EWY", expiration: "2026-09-04", strike: 185, type: "CALL" },
          rawRow: [],
        },
      ];

      const baseSnapshot = buildFidelitySnapshot(makeSnapshotInput(rows));

      // Activity proves same-day share purchase + call STO (BEFORE the checkpoint)
      const activity: ActivityRow[] = [
        {
          date: "2026-08-15",
          eventType: "shares_bought_direct",
          action: "YOU BOUGHT",
          symbol: "EWY",
          description: "ISHARES MSCI SOUTH KOREA ETF",
          quantity: 100,
          price: 179.29,
          commission: 0,
          fees: 0,
          amount: -17929,
          cashBalance: null,
          settlementDate: "2026-08-17",
          option: null,
          rawRow: [],
        },
        {
          date: "2026-08-15",
          eventType: "sell_to_open",
          action: "YOU SOLD OPENING TRANSACTION",
          symbol: "-EWY260904C185",
          description: "CALL (EWY) SEP 04 26 $185",
          quantity: -1,
          price: 7.50,
          commission: 0,
          fees: 0,
          amount: 750,
          cashBalance: null,
          settlementDate: "2026-08-16",
          option: { underlying: "EWY", expiration: "2026-09-04", strike: 185, type: "CALL" },
          rawRow: [],
        },
      ];

      // Checkpoint is AFTER the buy-write date (Option Summary exported 08/18)
      const checkpoint = parseCheckpoint("08/18/2026");
      const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

      // The call should now have origin "buy-write" via enrichment
      const ewyCall = projected.existingCalls.find(c => c.underlying === "EWY");
      expect(ewyCall).toBeDefined();
      expect(ewyCall!.origin).toBe("buy-write");

      // Position monitoring should classify as buy-write
      const positions = deriveMonitoredPositions(projected, null, TODAY);
      const ewyPos = positions.find(p => p.underlying === "EWY" && p.type !== "put");
      expect(ewyPos).toBeDefined();
      expect(ewyPos!.type).toBe("buy-write");
    });

    it("call in Option Summary + NO same-day purchase → remains CALL", () => {
      // Call exists from Option Summary. Activity has the STO but no matching purchase.
      const rows: OptionSummaryRow[] = [
        {
          symbol: "XLE",
          description: "SELECT SECTOR SPDR ENERGY",
          strategy: "CoveredCall",
          positionType: "share",
          quantity: 200,
          bid: 59.00,
          ask: 59.10,
          costBasis: 11000,
          marketValue: 11800,
          averageCost: 55.00,
          totalGainLoss: 800,
          totalGainLossPercent: 7.27,
          last: 59.05,
          change: 0.10,
          changePercent: 0.17,
          marginRequirement: null,
          option: null,
          rawRow: [],
        },
        {
          symbol: "-XLE260905C60",
          description: "CALL (XLE) SEP 05 26 $60",
          strategy: "CoveredCall",
          positionType: "option",
          quantity: -2,
          bid: 0.90,
          ask: 1.10,
          costBasis: -220,
          marketValue: -200,
          averageCost: -1.10,
          totalGainLoss: 20,
          totalGainLossPercent: 9.09,
          last: 1.00,
          change: -0.05,
          changePercent: -4.76,
          marginRequirement: null,
          option: { underlying: "XLE", expiration: "2026-09-05", strike: 60, type: "CALL" },
          rawRow: [],
        },
      ];

      const baseSnapshot = buildFidelitySnapshot(makeSnapshotInput(rows));

      // Activity has only the call STO — shares were purchased months before
      const activity: ActivityRow[] = [
        {
          date: "2026-08-10",
          eventType: "sell_to_open",
          action: "YOU SOLD OPENING TRANSACTION",
          symbol: "-XLE260905C60",
          description: "CALL (XLE) SEP 05 26 $60",
          quantity: -2,
          price: 1.10,
          commission: 0,
          fees: 0,
          amount: 220,
          cashBalance: null,
          settlementDate: "2026-08-11",
          option: { underlying: "XLE", expiration: "2026-09-05", strike: 60, type: "CALL" },
          rawRow: [],
        },
      ];

      const checkpoint = parseCheckpoint("08/18/2026");
      const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

      // No BW origin — no same-day share purchase
      const xleCall = projected.existingCalls.find(c => c.underlying === "XLE");
      expect(xleCall).toBeDefined();
      expect(xleCall!.origin).not.toBe("buy-write");

      const positions = deriveMonitoredPositions(projected, null, TODAY);
      const xlePos = positions.find(p => p.underlying === "XLE" && p.type !== "put");
      expect(xlePos).toBeDefined();
      expect(xlePos!.type).toBe("call");
    });

    it("multiple calls: only the one with matching purchase becomes BW", () => {
      // Two calls on different underlyings from Option Summary.
      // Activity proves only one is a buy-write.
      const snapshot = makeSnapshot({
        inventory: [
          { symbol: "EWY", sharesOwned: 100, sharesEncumbered: 100, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 179, costBasis: 17900, marketValue: 18100 } },
          { symbol: "DBO", sharesOwned: 100, sharesEncumbered: 100, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 22, costBasis: 2200, marketValue: 2300 } },
        ],
        existingCalls: [
          { symbol: "-EWY260904C185", underlying: "EWY", strike: 185, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -750, brokerOptionAverageCost: -7.50 },
          { symbol: "-DBO260904C23", underlying: "DBO", strike: 23, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -50, brokerOptionAverageCost: -0.50 },
        ],
      });

      const activity: ActivityRow[] = [
        // EWY: same-day purchase + STO → BW
        { date: "2026-08-15", eventType: "shares_bought_direct", action: "YOU BOUGHT", symbol: "EWY", description: "", quantity: 100, price: 179, commission: 0, fees: 0, amount: -17900, cashBalance: null, settlementDate: "2026-08-17", option: null, rawRow: [] },
        { date: "2026-08-15", eventType: "sell_to_open", action: "YOU SOLD", symbol: "-EWY260904C185", description: "", quantity: -1, price: 7.50, commission: 0, fees: 0, amount: 750, cashBalance: null, settlementDate: "2026-08-16", option: { underlying: "EWY", expiration: "2026-09-04", strike: 185, type: "CALL" }, rawRow: [] },
        // DBO: STO only, shares were bought a month prior → CC
        { date: "2026-08-15", eventType: "sell_to_open", action: "YOU SOLD", symbol: "-DBO260904C23", description: "", quantity: -1, price: 0.50, commission: 0, fees: 0, amount: 50, cashBalance: null, settlementDate: "2026-08-16", option: { underlying: "DBO", expiration: "2026-09-04", strike: 23, type: "CALL" }, rawRow: [] },
      ];

      const checkpoint = parseCheckpoint("08/14/2026");
      const { snapshot: projected } = projectActivityOverlay(snapshot, activity, checkpoint.timestamp, checkpoint.precision);

      const positions = deriveMonitoredPositions(projected, null, TODAY);
      const ewy = positions.find(p => p.underlying === "EWY");
      const dbo = positions.find(p => p.underlying === "DBO");

      expect(ewy!.type).toBe("buy-write");
      expect(dbo!.type).toBe("call");
    });

    it("same underlying with different strikes preserves independent origin", () => {
      // Two calls on EWY at different strikes. Only one has BW provenance.
      const snapshot = makeSnapshot({
        inventory: [
          { symbol: "EWY", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 179, costBasis: 35800, marketValue: 36200 } },
        ],
        existingCalls: [
          { symbol: "-EWY260904C185", underlying: "EWY", strike: 185, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -750, brokerOptionAverageCost: -7.50 },
          { symbol: "-EWY260918C190", underlying: "EWY", strike: 190, expiration: "2026-09-18", quantity: 1, brokerOptionBasis: -400, brokerOptionAverageCost: -4.00 },
        ],
      });

      const activity: ActivityRow[] = [
        // First 100 shares + $185 call: same-day → BW
        { date: "2026-08-15", eventType: "shares_bought_direct", action: "YOU BOUGHT", symbol: "EWY", description: "", quantity: 100, price: 179, commission: 0, fees: 0, amount: -17900, cashBalance: null, settlementDate: "2026-08-17", option: null, rawRow: [] },
        { date: "2026-08-15", eventType: "sell_to_open", action: "YOU SOLD", symbol: "-EWY260904C185", description: "", quantity: -1, price: 7.50, commission: 0, fees: 0, amount: 750, cashBalance: null, settlementDate: "2026-08-16", option: { underlying: "EWY", expiration: "2026-09-04", strike: 185, type: "CALL" }, rawRow: [] },
        // Second 100 shares purchased a week earlier, $190 call written later → CC
        { date: "2026-08-08", eventType: "shares_bought_direct", action: "YOU BOUGHT", symbol: "EWY", description: "", quantity: 100, price: 178, commission: 0, fees: 0, amount: -17800, cashBalance: null, settlementDate: "2026-08-10", option: null, rawRow: [] },
        { date: "2026-08-12", eventType: "sell_to_open", action: "YOU SOLD", symbol: "-EWY260918C190", description: "", quantity: -1, price: 4.00, commission: 0, fees: 0, amount: 400, cashBalance: null, settlementDate: "2026-08-13", option: { underlying: "EWY", expiration: "2026-09-18", strike: 190, type: "CALL" }, rawRow: [] },
      ];

      const checkpoint = parseCheckpoint("08/07/2026");
      const { snapshot: projected } = projectActivityOverlay(snapshot, activity, checkpoint.timestamp, checkpoint.precision);

      const positions = deriveMonitoredPositions(projected, null, TODAY);
      const ewy185 = positions.find(p => p.underlying === "EWY" && p.strike === 185);
      const ewy190 = positions.find(p => p.underlying === "EWY" && p.strike === 190);

      expect(ewy185!.type).toBe("buy-write");
      expect(ewy190!.type).toBe("call");
    });
  });
});
