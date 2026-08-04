/**
 * Demo Portfolio Snapshot — Living Showcase Fixture
 *
 * Produces a rich, deterministic PortfolioSnapshot reflecting a realistic
 * weekly-deployment operating cadence within a 45-DTE horizon.
 *
 * Operating model:
 * - Contracts written Mondays, expire Fridays
 * - ~45 DTE maximum operating horizon
 * - ~12 positions per weekly expiration cohort
 * - Mix of puts and calls, large/medium/small capital
 *
 * Design principles:
 * - Test fixtures prove behavior. Demo fixtures showcase behavior.
 * - Expirations are actual upcoming Fridays (dynamic, avoids date rot).
 * - Capital variance within each rung forces 2D packing evaluation.
 * - Repeated underlyings create realistic multi-position scenarios.
 */

import type { PortfolioSnapshot, OpenShortPut, OpenShortCall, InventoryPosition } from "./types";

const DEMO_ID = "demo-portfolio-v3";

// --- Friday Expiration Generator ---

function getUpcomingFridays(count: number): string[] {
  const fridays: string[] = [];
  const d = new Date();
  // Advance to next Friday (or today if Friday)
  const dayOfWeek = d.getDay();
  const daysUntilFriday = dayOfWeek <= 5 ? (5 - dayOfWeek) : (5 + 7 - dayOfWeek);
  d.setDate(d.getDate() + (daysUntilFriday === 0 && d.getHours() >= 16 ? 7 : daysUntilFriday || 7));

  for (let i = 0; i < count; i++) {
    fridays.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return fridays;
}

// --- Symbol Pool ---

const SYMBOLS = {
  // Large-cap / liquid ETFs (calls and puts)
  large: ["XLE", "QQQ", "XLK", "IWM", "SPY", "GLD"],
  // Medium ETFs
  medium: ["GDX", "EEM", "XLF", "XLU", "ARKK", "IBB"],
  // Smaller / specialty
  small: ["URA", "REMX", "COPX", "SLV", "IGV", "PSI", "EWZ", "KWEB", "FXI", "GDXJ"],
};

export function createDemoSnapshot(): PortfolioSnapshot {
  const now = new Date().toISOString();
  const today = now.split("T")[0];
  const fridays = getUpcomingFridays(6);

  // --- Build Inventory (supports covered calls) ---
  const inventory: InventoryPosition[] = [
    inv("XLE", 600, 400, 55.93, 33558, 35580),
    inv("QQQ", 400, 400, 485.00, 194000, 195600),
    inv("XLK", 500, 300, 192.00, 96000, 97000),
    inv("IWM", 400, 200, 201.50, 80600, 81400),
    inv("SPY", 200, 200, 540.00, 108000, 109200),
    inv("GLD", 300, 200, 220.00, 66000, 66600),
    inv("GDX", 500, 300, 38.50, 19250, 19500),
    inv("EEM", 400, 200, 42.00, 16800, 17200),
    inv("XLF", 300, 100, 43.50, 13050, 13200),
    inv("XLU", 200, 100, 70.00, 14000, 14200),
    inv("ARKK", 200, 100, 52.00, 10400, 10600),
    inv("IBB", 200, 100, 135.00, 27000, 27400),
  ];

  // --- Deliberately concentrated distribution ---
  // Friday 1 (~4 DTE): DENSE — 18 positions. This is the stress case.
  // Friday 2 (~11 DTE): MODERATE — 10 positions.
  // Friday 3 (~18 DTE): SPARSE — 5 positions.
  // Friday 4 (~25 DTE): SPARSE — 3 positions.
  // (Fridays 5-6 unused — not every cohort is populated)

  const existingCalls: OpenShortCall[] = [
    // Friday 1 — DENSE (10 calls)
    call("XLE", 57, fridays[0], 2),
    call("QQQ", 510, fridays[0], 2),
    call("SPY", 555, fridays[0], 2),
    call("XLK", 198, fridays[0], 2),
    call("GLD", 225, fridays[0], 2),
    call("IWM", 208, fridays[0], 2),
    call("GDX", 40, fridays[0], 2),
    call("EEM", 44, fridays[0], 2),
    call("XLF", 45, fridays[0], 1),
    call("XLU", 72, fridays[0], 1),
    // Friday 2 — MODERATE (5 calls)
    call("XLE", 59, fridays[1], 2),
    call("QQQ", 515, fridays[1], 1),
    call("XLK", 200, fridays[1], 1),
    call("IWM", 210, fridays[1], 1),
    call("ARKK", 55, fridays[1], 1),
    // Friday 3 — SPARSE (2 calls)
    call("GDX", 41, fridays[2], 1),
    call("IBB", 140, fridays[2], 1),
    // Friday 4 — SPARSE (1 call)
    call("XLE", 60, fridays[3], 2),
  ];

  const existingPuts: OpenShortPut[] = [
    // Friday 1 — DENSE (8 puts, totaling 18 positions with the 10 calls above)
    put("URA", 38, fridays[0], 2),
    put("IGV", 85, fridays[0], 1),
    put("REMX", 62, fridays[0], 1),
    put("COPX", 40, fridays[0], 2),
    put("PSI", 148, fridays[0], 1),
    put("SLV", 27, fridays[0], 3),
    put("KWEB", 28, fridays[0], 2),
    put("EWZ", 30, fridays[0], 1),
    // Friday 2 — MODERATE (5 puts, totaling 10 with 5 calls)
    put("XLK", 185, fridays[1], 1),
    put("XLE", 53, fridays[1], 2),
    put("FXI", 32, fridays[1], 1),
    put("GDXJ", 42, fridays[1], 1),
    put("EWZ", 28, fridays[1], 1),
    // Friday 3 — SPARSE (3 puts, totaling 5 with 2 calls)
    put("URA", 36, fridays[2], 1),
    put("REMX", 60, fridays[2], 1),
    put("PSI", 145, fridays[2], 1),
    // Friday 4 — SPARSE (2 puts, totaling 3 with 1 call)
    put("COPX", 38, fridays[3], 1),
    put("SLV", 26, fridays[3], 1),
  ];

  return {
    id: DEMO_ID,
    source: { type: "demo", label: "Demo Portfolio" },
    accountId: "DEMO-001",
    snapshotDate: today,
    inventory,
    existingCalls,
    existingPuts,
    deployableCash: 45000,
    balanceContext: {
      availableToTrade: 45000,
      cashAndCredits: 65000,
      totalAccountValue: 520000,
      valueOfInvestments: 455000,
      availableToWithdraw: 45000,
    },
    provenance: {
      sourceType: "demo",
      sourceLabel: "Demo Portfolio",
      createdAt: now,
      accountId: "DEMO-001",
    },
    readiness: {
      status: "READY",
      optionSummaryLoaded: true,
      balancesLoaded: true,
      inventoryValid: true,
      cashStateValid: true,
      timestampsReconciled: true,
      timeSeparationMinutes: 0,
      warnings: [],
      blockReasons: [],
    },
  };
}

// --- Helpers ---

function inv(symbol: string, owned: number, encumbered: number, avgCost: number, costBasis: number, marketValue: number): InventoryPosition {
  const free = Math.max(0, owned - encumbered);
  return {
    symbol,
    sharesOwned: owned,
    sharesEncumbered: Math.min(encumbered, owned),
    sharesFree: free,
    maxAdditionalContracts: Math.floor(free / 100),
    economics: { averageCostPerShare: avgCost, costBasis, marketValue },
  };
}

function call(underlying: string, strike: number, expiration: string, quantity: number): OpenShortCall {
  return {
    symbol: `-${underlying}${expiration.replace(/-/g, "").slice(2)}C${strike}`,
    underlying,
    strike,
    expiration,
    quantity,
  };
}

function put(underlying: string, strike: number, expiration: string, quantity: number): OpenShortPut {
  return {
    symbol: `-${underlying}${expiration.replace(/-/g, "").slice(2)}P${strike}`,
    underlying,
    strike,
    expiration,
    quantity,
  };
}
