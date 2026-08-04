/**
 * Position Monitoring — Domain Module
 *
 * Derives monitoring-specific facts from a PortfolioSnapshot.
 * Pure function. No React, no cache access, no side effects.
 *
 * Domain: Portfolio → Position Monitoring
 * Consumers: Operator Console presentation layer
 *
 * Produces MonitoredPosition[] with:
 * - Contract State (ADR-013 dimension 1)
 * - Encumbered capital (factual, from portfolio economics)
 * - DTE (derived from expiration - today)
 * - Valuation basis and provenance
 *
 * Does NOT produce: Decision Pressure, Economic Consequence, or health/attention signals.
 */

import type { PortfolioSnapshot, OpenShortPut, OpenShortCall, InventoryPosition } from "../write-desk/types";

// --- Types ---

export type PositionType = "put" | "call";

export type CapitalValuationBasis =
  | "strike"               // Puts: strike × 100 × quantity
  | "market-value-at-import"  // Calls: derived from imported market value
  | "unavailable";         // Cannot compute (missing economics)

export interface MonitoredPosition {
  /** Unique identifier for this position */
  id: string;
  /** Put or call */
  type: PositionType;
  /** Underlying symbol */
  underlying: string;
  /** Option strike price */
  strike: number;
  /** Expiration date (ISO string) */
  expiration: string;
  /** Days to expiration (from today) */
  dte: number;
  /** Number of contracts */
  quantity: number;
  /** Encumbered capital in dollars (null when not computable) */
  encumberedCapital: number | null;
  /** How the capital value was derived */
  capitalValuationBasis: CapitalValuationBasis;
  /** When the capital valuation was captured (snapshot date) */
  capitalAsOf: string | null;
}

// --- Computation ---

/**
 * Derive monitored positions from a portfolio snapshot.
 *
 * Computes DTE from today's date and encumbered capital from available economics.
 * Returns positions sorted by DTE ascending (nearest expiration first).
 */
export function deriveMonitoredPositions(
  snapshot: PortfolioSnapshot,
  today: Date = new Date()
): MonitoredPosition[] {
  const positions: MonitoredPosition[] = [];
  const todayMs = today.getTime();
  const todayDate = today.toISOString().split("T")[0];

  // Build inventory lookup for call capital derivation
  const inventoryBySymbol = new Map<string, InventoryPosition>();
  for (const inv of snapshot.inventory) {
    inventoryBySymbol.set(inv.symbol.toUpperCase(), inv);
  }

  // Process short puts
  for (const put of snapshot.existingPuts) {
    const dte = computeDte(put.expiration, todayMs);
    const encumberedCapital = put.strike * 100 * put.quantity;

    positions.push({
      id: `put-${put.underlying}-${put.strike}-${put.expiration}`,
      type: "put",
      underlying: put.underlying,
      strike: put.strike,
      expiration: put.expiration,
      dte,
      quantity: put.quantity,
      encumberedCapital,
      capitalValuationBasis: "strike",
      capitalAsOf: snapshot.snapshotDate,
    });
  }

  // Process short calls
  for (const call of snapshot.existingCalls) {
    const dte = computeDte(call.expiration, todayMs);
    const inv = inventoryBySymbol.get(call.underlying.toUpperCase());

    let encumberedCapital: number | null = null;
    let capitalValuationBasis: CapitalValuationBasis = "unavailable";
    let capitalAsOf: string | null = null;

    if (inv && inv.economics?.marketValue != null && inv.sharesOwned > 0) {
      // Derive per-share value from broker-reported market value
      const perShare = inv.economics.marketValue / inv.sharesOwned;
      encumberedCapital = perShare * 100 * call.quantity;
      capitalValuationBasis = "market-value-at-import";
      capitalAsOf = snapshot.snapshotDate;
    }

    positions.push({
      id: `call-${call.underlying}-${call.strike}-${call.expiration}`,
      type: "call",
      underlying: call.underlying,
      strike: call.strike,
      expiration: call.expiration,
      dte,
      quantity: call.quantity,
      encumberedCapital,
      capitalValuationBasis,
      capitalAsOf,
    });
  }

  // Sort by DTE ascending
  positions.sort((a, b) => a.dte - b.dte);

  return positions;
}

// --- Rung Grouping ---

export interface ExpirationRung {
  /** Expiration date (ISO string) */
  expiration: string;
  /** DTE for this expiration */
  dte: number;
  /** Positions in this rung */
  positions: MonitoredPosition[];
  /** Total encumbered capital in this rung (null values excluded from sum) */
  totalCapital: number;
  /** Number of positions with computable capital */
  capitalizedCount: number;
}

/**
 * Group monitored positions into expiration-native rungs.
 * One rung per distinct expiration date, ordered by DTE ascending.
 */
export function groupByExpiration(positions: MonitoredPosition[]): ExpirationRung[] {
  const rungMap = new Map<string, MonitoredPosition[]>();

  for (const pos of positions) {
    const existing = rungMap.get(pos.expiration);
    if (existing) {
      existing.push(pos);
    } else {
      rungMap.set(pos.expiration, [pos]);
    }
  }

  const rungs: ExpirationRung[] = [];
  for (const [expiration, rungPositions] of rungMap) {
    const dte = rungPositions[0].dte;
    const capitalizedPositions = rungPositions.filter(p => p.encumberedCapital != null);
    const totalCapital = capitalizedPositions.reduce((sum, p) => sum + p.encumberedCapital!, 0);

    rungs.push({
      expiration,
      dte,
      positions: rungPositions,
      totalCapital,
      capitalizedCount: capitalizedPositions.length,
    });
  }

  // Sort by DTE ascending
  rungs.sort((a, b) => a.dte - b.dte);

  return rungs;
}

// --- Helpers ---

function computeDte(expiration: string, todayMs: number): number {
  const expMs = new Date(expiration + "T16:00:00").getTime(); // Market close time
  return Math.max(0, Math.ceil((expMs - todayMs) / (1000 * 60 * 60 * 24)));
}
