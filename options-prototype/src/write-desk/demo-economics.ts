/**
 * Demo Position Economics — Synthetic opening transaction data.
 *
 * Provides plausible premium received, fees, and opening dates for
 * demo positions so the position-detail modal can showcase the full
 * intended UX including economics and assignment consequences.
 *
 * These values are internally consistent and realistic:
 * - Premium levels reflect typical short option income
 * - Higher-priced underlyings command higher absolute premiums
 * - Near-term expirations have lower premiums (less time value)
 * - Fees are realistic brokerage transaction costs
 *
 * Architecture:
 *   This data represents what Activity History ingestion would eventually
 *   supply for real positions. It is explicitly demo-only and must not
 *   appear for Fidelity-imported portfolios.
 */

import type { DemoPositionEconomics } from "../portfolio/position-detail";

/**
 * Lookup demo economics by position ID (e.g., "put-XLE-53-2026-08-14").
 * Returns null for positions without synthetic economics.
 */
export function getDemoEconomics(positionId: string): DemoPositionEconomics | null {
  return DEMO_ECONOMICS.get(positionId) ?? null;
}

// --- Synthetic Economics Data ---
// Keyed by the position ID pattern from position-monitoring:
//   put-{underlying}-{strike}-{expiration}
//   call-{underlying}-{strike}-{expiration}
//
// We use a function to generate these dynamically based on the upcoming Fridays
// so they don't rot when expiration dates shift.

function buildDemoEconomics(): Map<string, DemoPositionEconomics> {
  const m = new Map<string, DemoPositionEconomics>();

  // We don't have access to the exact Friday dates at module load time
  // (they depend on today). Instead, we'll use a pattern that matches
  // any expiration for a given underlying/strike/type combination.
  // The lookup function will try the full ID first.

  // For the demo, we provide economics for representative positions.
  // The position-detail builder will be called with actual position IDs
  // at render time — we generate the lookup lazily.

  return m;
}

/**
 * Generate demo economics for a position based on its characteristics.
 * Produces plausible values without requiring exact expiration date knowledge.
 */
export function generateDemoEconomics(
  type: "put" | "call",
  underlying: string,
  strike: number,
  quantity: number,
  dte: number,
): DemoPositionEconomics {
  // Premium scales with strike price and time to expiration
  // Typical short option premium: 1-4% of strike for 2-4 week expirations
  const timeMultiplier = Math.max(0.5, Math.min(2.0, dte / 21)); // normalize around 21 DTE
  const basePremiumPct = type === "put" ? 0.025 : 0.020; // puts slightly richer
  const premiumPerContract = strike * basePremiumPct * timeMultiplier;

  // Round to nearest $0.05 for realism
  const roundedPremium = Math.round(premiumPerContract * 20) / 20;

  // Fees: $0.65 per contract (common brokerage fee structure)
  const fees = 0.65 * quantity;

  // Opened approximately (DTE + a few days) ago on a Monday
  const openedDaysAgo = dte + 3; // written the Monday before this expiration week
  const openDate = new Date();
  openDate.setDate(openDate.getDate() - openedDaysAgo);
  // Snap to previous Monday
  const dow = openDate.getDay();
  const daysToMonday = dow === 0 ? 1 : dow === 1 ? 0 : dow - 1;
  openDate.setDate(openDate.getDate() - (dow - 1 + (dow === 0 ? 6 : 0)));
  const openedAt = openDate.toISOString().split("T")[0];

  // For calls: cost basis is the inventory avgCost from demo snapshot
  const costBasisLookup: Record<string, number> = {
    XLE: 55.93, QQQ: 485.00, XLK: 192.00, IWM: 201.50,
    SPY: 540.00, GLD: 220.00, GDX: 38.50, EEM: 42.00,
    XLF: 43.50, XLU: 70.00, ARKK: 52.00, IBB: 135.00,
  };

  return {
    premiumPerContract: roundedPremium,
    fees,
    openedAt,
    ...(type === "call" && costBasisLookup[underlying] != null
      ? { costBasisPerShare: costBasisLookup[underlying] }
      : {}),
  };
}

// Static map — unused for now since we generate dynamically
const DEMO_ECONOMICS = buildDemoEconomics();
