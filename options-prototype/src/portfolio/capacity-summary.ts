/**
 * Capacity Summary — Pure Derivation Module
 *
 * Derives portfolio capacity and exposure facts from already-computed
 * position monitoring data and the portfolio snapshot.
 *
 * All values are directly interpretable facts — no synthetic ratios,
 * no heterogeneous aggregates, no composite metrics.
 *
 * Invariant dependency: groupByExpiration() returns rungs sorted by DTE
 * ascending (contractual — enforced by explicit sort in position-monitoring.ts).
 * The "nearest rung" is therefore rungs[0].
 */

import type { MonitoredPosition } from "./position-monitoring";
import type { ExpirationRung } from "./position-monitoring";
import type { PortfolioSnapshot } from "../write-desk/types";

// --- Types ---

export interface NearestRungExposure {
  /** Expiration date (ISO string) */
  expiration: string;
  /** Days to expiration */
  dte: number;
  /** Sum of put obligations in this rung (strike-based) */
  putExposure: number;
  /** Sum of covered equity in this rung (market-value-at-import) */
  callExposure: number;
  /** Total position count in this rung */
  positionCount: number;
}

export interface CallCapacityEntry {
  symbol: string;
  sharesFree: number;
  additionalLots: number;
}

export interface CapacitySummary {
  // --- Put side ---

  /** Total short-put assignment obligation: Σ(strike × 100 × qty). Strike-based. */
  putObligations: number;
  /** Number of short put positions */
  putPositionCount: number;

  // --- Call side ---

  /** Total market value of shares backing short calls (at import time) */
  coveredEquity: number;
  /** Number of short call positions with computable market-value-at-import */
  callPositionCount: number;
  /** Number of short call positions where capital valuation is unavailable */
  callsWithoutValuation: number;

  // --- Cash ---

  /** Fidelity Available to Trade (All Settled) — residual put-writing headroom. Null when balances unavailable. */
  deployableCash: number | null;

  // --- Nearest rung ---

  /** Exposure in the nearest expiration rung (lowest DTE), disaggregated. Null when no positions exist. */
  nearestRung: NearestRungExposure | null;

  // --- Call-writing capacity ---

  /** Per-symbol free shares and additional call lots (only symbols with free capacity) */
  callCapacity: CallCapacityEntry[];
  /** Total free 100-share lots across all symbols (secondary summary) */
  totalFreeLots: number;

  // --- Provenance ---

  /** Portfolio snapshot date (ISO string). Null when snapshot has no date. */
  snapshotDate: string | null;
}

// --- Derivation ---

/**
 * Derive the capacity summary from position monitoring output and the portfolio snapshot.
 *
 * This function consumes already-derived MonitoredPosition[] and ExpirationRung[]
 * (from deriveMonitoredPositions + groupByExpiration) plus the raw snapshot for
 * cash and inventory facts not carried on positions.
 *
 * Pure function. No side effects.
 */
export function deriveCapacitySummary(
  positions: MonitoredPosition[],
  rungs: ExpirationRung[],
  snapshot: PortfolioSnapshot,
): CapacitySummary {
  // --- Put obligations ---
  let putObligations = 0;
  let putPositionCount = 0;

  for (const pos of positions) {
    if (pos.type === "put") {
      putObligations += pos.encumberedCapital ?? 0;
      putPositionCount++;
    }
  }

  // --- Covered equity ---
  let coveredEquity = 0;
  let callPositionCount = 0;
  let callsWithoutValuation = 0;

  for (const pos of positions) {
    if (pos.type === "call") {
      if (pos.capitalValuationBasis === "market-value-at-import" && pos.encumberedCapital != null) {
        coveredEquity += pos.encumberedCapital;
        callPositionCount++;
      } else {
        callsWithoutValuation++;
      }
    }
  }

  // --- Deployable cash ---
  const deployableCash = snapshot.deployableCash;

  // --- Nearest rung ---
  // Invariant: rungs are sorted by DTE ascending. rungs[0] is nearest.
  let nearestRung: NearestRungExposure | null = null;

  if (rungs.length > 0) {
    const first = rungs[0];
    let putExposure = 0;
    let callExposure = 0;

    for (const pos of first.positions) {
      if (pos.type === "put") {
        putExposure += pos.encumberedCapital ?? 0;
      } else if (pos.type === "call" && pos.capitalValuationBasis === "market-value-at-import" && pos.encumberedCapital != null) {
        callExposure += pos.encumberedCapital;
      }
    }

    nearestRung = {
      expiration: first.expiration,
      dte: first.dte,
      putExposure,
      callExposure,
      positionCount: first.positions.length,
    };
  }

  // --- Call-writing capacity ---
  const callCapacity: CallCapacityEntry[] = [];

  for (const inv of snapshot.inventory) {
    if (inv.sharesFree > 0 && inv.maxAdditionalContracts > 0) {
      callCapacity.push({
        symbol: inv.symbol,
        sharesFree: inv.sharesFree,
        additionalLots: inv.maxAdditionalContracts,
      });
    }
  }

  // Sort by lots descending for presentation priority
  callCapacity.sort((a, b) => b.additionalLots - a.additionalLots);

  const totalFreeLots = callCapacity.reduce((sum, entry) => sum + entry.additionalLots, 0);

  return {
    putObligations,
    putPositionCount,
    coveredEquity,
    callPositionCount,
    callsWithoutValuation,
    deployableCash,
    nearestRung,
    callCapacity,
    totalFreeLots,
    snapshotDate: snapshot.snapshotDate,
  };
}
