/**
 * Portfolio Capital — V1 Derivation and Reconciliation
 *
 * Computes the Wheelwright-native Portfolio Capital quantity from a PortfolioSnapshot
 * and reconciles it against Fidelity's Total Account Value.
 *
 * V1 Formula:
 *   Portfolio Capital = Cash and Credits + Σ(Inventory Share Market Values)
 *
 * This counts what the portfolio OWNS. Open short-option obligations are excluded
 * from the capital-stock quantity and represented separately through encumbrance,
 * position state, consequence, and erosion/recovery.
 *
 * See: docs/foundations/portfolio-capital.md (canonical authority)
 *
 * Pure function. No side effects.
 */

import type { PortfolioSnapshot } from "../write-desk/types";

// --- Types ---

export interface PortfolioCapitalDerivation {
  /** V1 Portfolio Capital: totalAccountValue − aggregateShortOptionMTM */
  portfolioCapital: number;

  /** Fidelity Total Account Value (the broker's comprehensive total) */
  totalAccountValue: number;

  /** Aggregate short-option mark-to-market (negative liability, from Option Summary) */
  shortOptionMTM: number;

  /** Number of short option positions contributing to the MTM */
  shortOptionPositionCount: number;

  /** Derivation method used */
  method: "aggregate";
}

export interface FidelityReconciliation {
  /** Wheelwright Portfolio Capital (derived) */
  portfolioCapital: number;

  /** Fidelity Total Account Value (broker-reported) */
  fidelityTotalAccountValue: number;

  /** Short-option MTM adjustment (the one semantic correction Wheelwright applies) */
  shortOptionMTMAdjustment: number;

  /** What Fidelity Total includes (for operator understanding) */
  fidelityIncludes: string;

  /** What Wheelwright excludes (for operator understanding) */
  wheelwrightExcludes: string;
}

// --- Derivation ---

/**
 * Compute V1 Portfolio Capital from a PortfolioSnapshot.
 *
 * V1 Aggregate Formula:
 *   Portfolio Capital = Fidelity Total Account Value − aggregate short-option MTM
 *
 * Fidelity's Total Account Value already includes cash, SPAXX, equities, T-bills,
 * pending activity, and short-option MTM (as a negative liability). Wheelwright's
 * semantic adjustment adds back the option liability because open short-option
 * obligations do not reduce the capital stock.
 *
 * Returns null when insufficient evidence exists.
 */
export function derivePortfolioCapital(
  snapshot: PortfolioSnapshot,
): PortfolioCapitalDerivation | null {
  if (!snapshot.balanceContext) return null;

  const totalAccountValue = snapshot.balanceContext.totalAccountValue;
  const shortOptionMTM = snapshot.aggregateShortOptionMTM ?? 0;

  // Portfolio Capital = broker total − option liability (subtracting a negative = adding)
  const portfolioCapital = totalAccountValue - shortOptionMTM;

  return {
    portfolioCapital,
    totalAccountValue,
    shortOptionMTM,
    shortOptionPositionCount: (snapshot.existingCalls.length + snapshot.existingPuts.length),
    method: "aggregate",
  };
}

/**
 * Produce a reconciliation summary showing how Wheelwright's Portfolio Capital
 * relates to Fidelity's Total Account Value.
 *
 * The relationship is simple and transparent:
 *   Wheelwright PC = Fidelity Total + |short-option liability|
 *
 * Fidelity includes the option liability as a negative component in their total.
 * Wheelwright adds it back because obligations don't reduce capital stock.
 */
export function reconcileAgainstFidelity(
  snapshot: PortfolioSnapshot,
  derivation: PortfolioCapitalDerivation,
): FidelityReconciliation | null {
  if (!snapshot.balanceContext) return null;

  return {
    portfolioCapital: derivation.portfolioCapital,
    fidelityTotalAccountValue: derivation.totalAccountValue,
    shortOptionMTMAdjustment: -derivation.shortOptionMTM, // positive: the amount we add back
    fidelityIncludes: "cash, SPAXX, equities, T-bills, pending activity, short-option MTM liability",
    wheelwrightExcludes: "short-option MTM liability (obligations do not reduce capital stock)",
  };
}
