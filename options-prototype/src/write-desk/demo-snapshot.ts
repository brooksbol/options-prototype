/**
 * Demo Portfolio Snapshot — Product Validation Instrument
 *
 * Produces a deterministic PortfolioSnapshot that deliberately exercises
 * every strategy Wheelwright currently supports:
 *   - Cash-secured PUTs
 *   - Conventional covered CALLs (shares held, call written separately — no BW provenance)
 *   - Buy-Writes (shares acquired and call written simultaneously — origin: "buy-write")
 *
 * Design principles:
 *   - Test fixtures prove behavior. Demo fixtures showcase behavior.
 *   - Every supported strategy must have intentional examples.
 *   - No strategy appears accidentally via runtime inference.
 *   - Strikes are expressed RELATIVE to a reference price, avoiding temporal rot.
 *   - The portfolio represents a coherent operator scenario.
 *   - Opening Demo next month should still show an intentionally composed portfolio.
 *
 * Temporal rot resistance:
 *   Strikes are computed as offsets from fixed "reference prices" that represent
 *   the operator's entry economics. The moneyness displayed depends on live Evidence
 *   prices (from the backend), but the portfolio structure itself (strikes, basis,
 *   expiration geometry) remains internally consistent regardless of market drift.
 *   When no Evidence is available, moneyness shows "—" rather than stale values.
 *
 * Expiration geometry:
 *   Uses upcoming Fridays (dynamic) so DTE is always fresh and realistic.
 *
 * Scale (v5 — B4):
 *   ~36 positions across 5 expiration weeks, 20+ underlyings, multiple quantities >1,
 *   several underlyings with multiple strikes or expirations. Enough density that
 *   vertical scrolling is unavoidable in any regime.
 */

import type { PortfolioSnapshot, OpenShortPut, OpenShortCall, InventoryPosition } from "./types";

const DEMO_ID = "demo-portfolio-v5";

// --- Friday Expiration Generator ---

function getUpcomingFridays(count: number): string[] {
  const fridays: string[] = [];
  const d = new Date();
  const dayOfWeek = d.getDay();
  const daysUntilFriday = dayOfWeek <= 5 ? (5 - dayOfWeek) : (5 + 7 - dayOfWeek);
  d.setDate(d.getDate() + (daysUntilFriday === 0 && d.getHours() >= 16 ? 7 : daysUntilFriday || 7));

  for (let i = 0; i < count; i++) {
    fridays.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return fridays;
}

// --- Scenario Spot Prices ---
// These define the "current market state" for the demo scenario.
// Designed to produce intentional, representative moneyness relationships.
// This map is exported so the observation layer can use it instead of polling live Evidence.

export const DEMO_SPOT_PRICES: Record<string, number> = {
  // CC underlyings — spots that create varied moneyness against their call strikes
  XLE: 59.50,   // vs $60 strike → call slightly OTM (~0.8%)
  QQQ: 525.00,  // vs $515 strike → call clearly ITM (~1.9%)
  SPY: 558.00,  // vs $560 strike → call slightly OTM (~0.4%)
  XLF: 45.20,   // vs $46 strike → call OTM (~1.7%)
  XLU: 73.50,   // vs $75 strike → call OTM (~2.0%)
  IWM: 220.00,  // vs $215 strike → call ITM (~2.3%)
  DIA: 395.00,  // vs $400 strike → call OTM (~1.3%)
  VTI: 265.00,  // vs $268 strike → call OTM (~1.1%)

  // BW underlyings — spots relative to BW strikes
  EWY: 183.00,  // vs $187 strike → BW OTM (~2.1%)
  GDXJ: 46.80,  // vs $47 strike → BW near ATM (~0.4%)
  BNO: 55.00,   // vs $54 strike → BW ITM (~1.9%)
  XBI: 98.00,   // vs $100 strike → BW OTM (~2.0%)
  KWEB: 33.50,  // vs $34 strike → BW near ATM (~1.5%)

  // PUT underlyings — spots relative to put strikes
  URA: 34.50,   // vs $35 strike → put near ATM (1.4% from strike)
  REMX: 58.00,  // vs $60 strike → put OTM (~3.3%)
  PSI: 155.00,  // vs $145 strike → put comfortably OTM (~6.9%)
  SLV: 29.50,   // vs $27 strike → put comfortably OTM (~9.3%)
  COPX: 39.80,  // vs $38 strike → put OTM (~4.7%)
  IGV: 90.00,   // vs $85 strike → put OTM (~5.9%)
  GDX: 40.50,   // vs $39 strike → put OTM (~3.8%)
  EWZ: 31.00,   // vs $28 strike → put OTM (~10.7%)
  XME: 55.50,   // vs $54 strike → put OTM (~2.8%)
  ARKK: 52.00,  // vs $50 strike → put OTM (~4.0%)
  JETS: 22.50,  // vs $21 strike → put OTM (~7.1%)
  LIT: 44.00,   // vs $42 strike → put OTM (~4.8%)
  HACK: 68.00,  // vs $65 strike → put OTM (~4.6%)
  TAN: 48.50,   // vs $46 strike → put OTM (~5.4%)
};

// --- Reference Prices ---
// Represent the operator's economic reality at entry time.
// Strikes are computed relative to these for internal consistency.

const REF = {
  // Large-cap (covered calls — long-held positions)
  XLE: 58,
  QQQ: 500,
  SPY: 550,
  IWM: 208,
  DIA: 388,
  VTI: 260,

  // Medium (covered calls)
  XLF: 44,
  XLU: 72,

  // Buy-writes (acquired recently)
  EWY: 180,
  GDXJ: 45,
  BNO: 52,
  XBI: 95,
  KWEB: 32,

  // Put targets (CSP universe)
  URA: 32,
  REMX: 55,
  PSI: 150,
  COPX: 38,
  SLV: 28,
  IGV: 88,
  GDX: 39,
  EWZ: 30,
  XME: 52,
  ARKK: 48,
  JETS: 20,
  LIT: 41,
  HACK: 64,
  TAN: 45,
};

export function createDemoSnapshot(): PortfolioSnapshot {
  const now = new Date().toISOString();
  const today = now.split("T")[0];
  const fridays = getUpcomingFridays(5);

  // --- Inventory ---
  // Long-held positions (covered calls): known basis, shares predate calls
  // Buy-write positions: recently acquired, origin marked on calls
  const inventory: InventoryPosition[] = [
    // CC positions — long-held equity, operator later writes calls
    inv("XLE", 500, 400, REF.XLE - 3, (REF.XLE - 3) * 500, REF.XLE * 500),
    inv("QQQ", 200, 200, REF.QQQ - 20, (REF.QQQ - 20) * 200, REF.QQQ * 200),
    inv("SPY", 300, 200, REF.SPY - 15, (REF.SPY - 15) * 300, REF.SPY * 300),
    inv("XLF", 200, 200, REF.XLF - 2, (REF.XLF - 2) * 200, REF.XLF * 200),
    inv("XLU", 100, 100, REF.XLU - 4, (REF.XLU - 4) * 100, REF.XLU * 100),
    inv("IWM", 200, 200, REF.IWM - 8, (REF.IWM - 8) * 200, REF.IWM * 200),
    inv("DIA", 100, 100, REF.DIA - 12, (REF.DIA - 12) * 100, REF.DIA * 100),
    inv("VTI", 200, 200, REF.VTI - 6, (REF.VTI - 6) * 200, REF.VTI * 200),

    // BW positions — acquired and encumbered simultaneously
    inv("EWY", 100, 100, REF.EWY, REF.EWY * 100, REF.EWY * 100),
    inv("GDXJ", 200, 200, REF.GDXJ, REF.GDXJ * 200, REF.GDXJ * 200),
    inv("BNO", 100, 100, REF.BNO, REF.BNO * 100, REF.BNO * 100),
    inv("XBI", 200, 200, REF.XBI, REF.XBI * 200, REF.XBI * 200),
    inv("KWEB", 300, 300, REF.KWEB, REF.KWEB * 300, REF.KWEB * 300),
  ];

  // --- Covered Calls (conventional — no origin, classified as CALL) ---
  const existingCalls: OpenShortCall[] = [
    // Friday 1 — nearest expiration (stress: approaching resolution)
    cc("XLE", REF.XLE + 2, fridays[0], 2),        // $60 strike
    cc("QQQ", REF.QQQ + 15, fridays[0], 2),       // $515 strike
    cc("SPY", REF.SPY + 10, fridays[0], 2),       // $560 strike, qty 2

    // Friday 2 — moderate DTE
    cc("XLF", REF.XLF + 2, fridays[1], 2),        // $46 strike
    cc("XLU", REF.XLU + 3, fridays[1], 1),        // $75 strike
    cc("IWM", REF.IWM + 7, fridays[1], 2),        // $215 strike
    cc("DIA", REF.DIA + 12, fridays[1], 1),       // $400 strike

    // Friday 3 — further out
    cc("VTI", REF.VTI + 8, fridays[2], 2),        // $268 strike
    cc("XLE", REF.XLE + 4, fridays[2], 2),        // $62 strike — same underlying, different exp/strike

    // --- Buy-Writes (origin: "buy-write") ---
    // Friday 1
    bw("BNO", REF.BNO + 2, fridays[0], 1),        // $54 strike
    bw("KWEB", REF.KWEB + 2, fridays[0], 3),      // $34 strike, qty 3

    // Friday 2
    bw("EWY", REF.EWY + 7, fridays[1], 1),        // $187 strike
    bw("XBI", REF.XBI + 5, fridays[1], 2),        // $100 strike

    // Friday 3
    bw("GDXJ", REF.GDXJ + 2, fridays[2], 2),     // $47 strike
  ];

  // --- Cash-Secured Puts ---
  const existingPuts: OpenShortPut[] = [
    // Friday 1 — dense, approaching resolution
    csp("URA", REF.URA + 3, fridays[0], 2),       // $35 strike
    csp("REMX", REF.REMX + 5, fridays[0], 1),     // $60 strike
    csp("PSI", REF.PSI - 5, fridays[0], 1),       // $145 strike — large capital
    csp("SLV", REF.SLV - 1, fridays[0], 3),       // $27 strike, qty 3
    csp("COPX", REF.COPX, fridays[0], 2),         // $38 strike
    csp("XME", REF.XME + 2, fridays[0], 1),       // $54 strike

    // Friday 2 — moderate DTE
    csp("IGV", REF.IGV - 3, fridays[1], 1),       // $85 strike
    csp("GDX", REF.GDX, fridays[1], 2),           // $39 strike
    csp("EWZ", REF.EWZ - 2, fridays[1], 1),       // $28 strike
    csp("ARKK", REF.ARKK + 2, fridays[1], 2),     // $50 strike
    csp("JETS", REF.JETS + 1, fridays[1], 3),     // $21 strike, qty 3
    csp("URA", REF.URA, fridays[1], 1),            // $32 strike — same underlying, different exp

    // Friday 3 — further out
    csp("REMX", REF.REMX, fridays[2], 1),         // $55 strike — same underlying, different exp
    csp("LIT", REF.LIT + 1, fridays[2], 2),       // $42 strike
    csp("HACK", REF.HACK + 1, fridays[2], 1),     // $65 strike
    csp("COPX", REF.COPX - 2, fridays[2], 2),     // $36 strike — same underlying, lower strike

    // Friday 4 — even further
    csp("TAN", REF.TAN + 1, fridays[3], 2),       // $46 strike
    csp("GDX", REF.GDX - 2, fridays[3], 1),       // $37 strike — same underlying
    csp("SLV", REF.SLV - 2, fridays[3], 2),       // $26 strike — same underlying, lower strike
    csp("XME", REF.XME, fridays[3], 1),           // $52 strike — same underlying, different exp

    // Friday 5 — most distant
    csp("URA", REF.URA - 1, fridays[4], 2),       // $31 strike — same underlying, 3rd expiration
    csp("ARKK", REF.ARKK, fridays[4], 1),         // $48 strike — same underlying
  ];

  return {
    id: DEMO_ID,
    source: { type: "demo", label: "Demo Portfolio" },
    accountId: "DEMO-001",
    snapshotDate: today,
    inventory,
    existingCalls,
    existingPuts,
    deployableCash: 55000,
    aggregateShortOptionMTM: -8500, // synthetic: approximate demo option liability
    balanceContext: {
      availableToTrade: 55000,
      cashAndCredits: 85000,
      totalAccountValue: 420000,
      valueOfInvestments: 335000,
      availableToWithdraw: 55000,
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

function inv(
  symbol: string,
  owned: number,
  encumbered: number,
  avgCost: number,
  costBasis: number,
  marketValue: number,
): InventoryPosition {
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

/** Conventional covered call — no BW provenance */
function cc(underlying: string, strike: number, expiration: string, quantity: number): OpenShortCall {
  const syntheticPremium = Math.round(strike * 0.018 * 100) / 100;
  return {
    symbol: `-${underlying}${expiration.replace(/-/g, "").slice(2)}C${strike}`,
    underlying,
    strike,
    expiration,
    quantity,
    brokerOptionBasis: -(syntheticPremium * 100 * quantity),
    brokerOptionAverageCost: -syntheticPremium,
    // No origin — truthfully unknown, defaults to "call"
  };
}

/** Buy-write — proven same-day acquisition + call */
function bw(underlying: string, strike: number, expiration: string, quantity: number): OpenShortCall {
  const syntheticPremium = Math.round(strike * 0.022 * 100) / 100;
  // Synthetic acquisition price: strike - $1.50 (typical BW has slight appreciation built in)
  const acquisitionPrice = strike - 1.50;
  return {
    symbol: `-${underlying}${expiration.replace(/-/g, "").slice(2)}C${strike}`,
    underlying,
    strike,
    expiration,
    quantity,
    brokerOptionBasis: -(syntheticPremium * 100 * quantity),
    brokerOptionAverageCost: -syntheticPremium,
    origin: "buy-write",
    acquisitionBasis: {
      pricePerShare: acquisitionPrice,
      shares: quantity * 100,
      date: expiration.replace(/-\d{2}$/, "-01"), // synthetic: approximate entry date
      confidence: "unique",
    },
  };
}

/** Cash-secured put */
function csp(underlying: string, strike: number, expiration: string, quantity: number): OpenShortPut {
  const syntheticPremium = Math.round(strike * 0.025 * 100) / 100;
  return {
    symbol: `-${underlying}${expiration.replace(/-/g, "").slice(2)}P${strike}`,
    underlying,
    strike,
    expiration,
    quantity,
    brokerOptionBasis: -(syntheticPremium * 100 * quantity),
    brokerOptionAverageCost: -syntheticPremium,
  };
}
