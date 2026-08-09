/**
 * Consequence Summary — Rung-Level Aggregation
 *
 * Aggregates per-position assignment consequences for the nearest
 * expiration rung to provide a portfolio-level consequence overview.
 *
 * Design invariants:
 * - Appreciation and erosion are shown separately (never netted)
 * - Premium is a separate component (not merged with appreciation)
 * - Aggregates consume outputs from assignment-consequence.ts (no reimplementation)
 * - Positions without computable economics are counted but not fabricated
 *
 * Pure function. No React, no side effects.
 */

import type { MonitoredPosition } from "./position-monitoring";
import type { ExpirationRung } from "./position-monitoring";
import type { InventoryPosition, PortfolioSnapshot } from "../write-desk/types";
import {
  type OptionBasisInput,
  type CallAssignmentConsequence,
  type PutAssignmentConsequence,
  deriveCallAssignmentConsequence,
  derivePutAssignmentConsequence,
} from "./assignment-consequence";

// --- Types ---

export interface CallConsequenceAggregate {
  /** Total appreciation across calls where strike > basis (positive) */
  totalAppreciation: number;
  /** Number of call positions contributing to appreciation */
  appreciationCount: number;
  /** Total erosion across calls where strike < basis (negative, shown as absolute) */
  totalErosion: number;
  /** Number of call positions contributing to erosion */
  erosionCount: number;
  /** Total premium credit across all calls with option basis */
  totalPremium: number;
  /** Number of call positions with computable premium */
  premiumCount: number;
  /** Number of call positions where appreciation/erosion could not be determined */
  indeterminateCount: number;
}

export interface PutConsequenceAggregate {
  /** Total cash consumed if all puts are assigned */
  totalCashToEquity: number;
  /** Number of put positions */
  putCount: number;
  /** Total premium credit across all puts with option basis */
  totalPremium: number;
  /** Number of put positions with computable premium */
  premiumCount: number;
}

export interface NearestConsequenceSummary {
  /** Expiration date of the nearest rung */
  expiration: string;
  /** DTE of the nearest rung */
  dte: number;
  /** Aggregated call consequences (null if no calls in rung) */
  calls: CallConsequenceAggregate | null;
  /** Aggregated put consequences (null if no puts in rung) */
  puts: PutConsequenceAggregate | null;
}

// --- Derivation ---

/**
 * Derive the nearest-rung consequence summary by aggregating per-position
 * consequences from the canonical assignment-consequence model.
 *
 * Invariant dependency: rungs are sorted by DTE ascending (contractual from
 * groupByExpiration). The nearest rung is rungs[0].
 *
 * Returns null when no positions exist.
 */
export function deriveNearestConsequenceSummary(
  rungs: ExpirationRung[],
  snapshot: PortfolioSnapshot,
): NearestConsequenceSummary | null {
  if (rungs.length === 0) return null;

  const nearestRung = rungs[0];
  const positions = nearestRung.positions;

  if (positions.length === 0) return null;

  // Build inventory lookup
  const inventoryBySymbol = new Map<string, InventoryPosition>();
  for (const inv of snapshot.inventory) {
    inventoryBySymbol.set(inv.symbol.toUpperCase(), inv);
  }

  // Aggregate calls
  const callPositions = positions.filter(p => p.type === "call");
  let calls: CallConsequenceAggregate | null = null;

  if (callPositions.length > 0) {
    let totalAppreciation = 0;
    let appreciationCount = 0;
    let totalErosion = 0;
    let erosionCount = 0;
    let totalPremium = 0;
    let premiumCount = 0;
    let indeterminateCount = 0;

    for (const pos of callPositions) {
      const inventory = inventoryBySymbol.get(pos.underlying.toUpperCase()) ?? null;
      const optionBasis = resolveOptionBasis(pos, snapshot);
      const consequence = deriveCallAssignmentConsequence(pos, inventory, optionBasis);

      // Appreciation/erosion
      if (consequence.totalAppreciationOrErosion.value != null) {
        const val = consequence.totalAppreciationOrErosion.value;
        if (val >= 0) {
          totalAppreciation += val;
          appreciationCount++;
        } else {
          totalErosion += Math.abs(val);
          erosionCount++;
        }
      } else {
        indeterminateCount++;
      }

      // Premium
      if (consequence.premiumCredit.value != null) {
        totalPremium += consequence.premiumCredit.value;
        premiumCount++;
      }
    }

    calls = {
      totalAppreciation,
      appreciationCount,
      totalErosion,
      erosionCount,
      totalPremium,
      premiumCount,
      indeterminateCount,
    };
  }

  // Aggregate puts
  const putPositions = positions.filter(p => p.type === "put");
  let puts: PutConsequenceAggregate | null = null;

  if (putPositions.length > 0) {
    let totalCashToEquity = 0;
    let totalPremium = 0;
    let premiumCount = 0;

    for (const pos of putPositions) {
      const inventory = inventoryBySymbol.get(pos.underlying.toUpperCase()) ?? null;
      const optionBasis = resolveOptionBasis(pos, snapshot);
      const consequence = derivePutAssignmentConsequence(pos, inventory, optionBasis);

      totalCashToEquity += consequence.cashConsumed;

      if (consequence.premiumCredit.value != null) {
        totalPremium += consequence.premiumCredit.value;
        premiumCount++;
      }
    }

    puts = {
      totalCashToEquity,
      putCount: putPositions.length,
      totalPremium,
      premiumCount,
    };
  }

  return {
    expiration: nearestRung.expiration,
    dte: nearestRung.dte,
    calls,
    puts,
  };
}

// --- Internal ---

/**
 * Resolve option basis input for a position from the snapshot.
 */
function resolveOptionBasis(position: MonitoredPosition, snapshot: PortfolioSnapshot): OptionBasisInput {
  if (position.type === "call") {
    const match = snapshot.existingCalls.find(
      c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
        && c.strike === position.strike
        && c.expiration === position.expiration
    );
    return {
      brokerOptionBasis: match?.brokerOptionBasis ?? null,
      brokerOptionAverageCost: match?.brokerOptionAverageCost ?? null,
    };
  } else {
    const match = snapshot.existingPuts.find(
      p => p.underlying.toUpperCase() === position.underlying.toUpperCase()
        && p.strike === position.strike
        && p.expiration === position.expiration
    );
    return {
      brokerOptionBasis: match?.brokerOptionBasis ?? null,
      brokerOptionAverageCost: match?.brokerOptionAverageCost ?? null,
    };
  }
}
