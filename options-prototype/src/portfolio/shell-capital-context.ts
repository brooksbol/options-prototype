/**
 * Shell Capital Context — lightweight derivation for persistent header display.
 *
 * Computes the capital-state triad (Portfolio Capital, Deployable Cash, Encumbered Capital)
 * from the PortfolioSnapshot alone, without requiring evidence observations.
 *
 * This is intentionally simpler than the Console's full capacity-summary derivation.
 * It exists so the Application Shell can show the triad independently of which surface
 * is active and without depending on observation-store subscription.
 *
 * See: docs/journal/project-journal.md — "Persistent Portfolio Context: Convergence Decision"
 */

import type { PortfolioSnapshot } from "../write-desk/types";
import { derivePortfolioCapital, type PortfolioCapitalDerivation } from "./portfolio-capital";

// --- Types ---

export interface ShellCapitalContext {
  /** V1 Portfolio Capital (null when insufficient evidence) */
  portfolioCapital: number | null;

  /** Deployable cash — Fidelity "Available to Trade (All Settled)" */
  deployableCash: number | null;

  /** Total encumbered capital: put obligations + covered equity */
  encumberedCapital: number;

  /** Position count (puts + calls/BW) */
  positionCount: number;
}

// --- Derivation ---

/**
 * Derive the shell capital context from a PortfolioSnapshot.
 *
 * Encumbered capital is computed directly from the snapshot's position lists:
 *   - Puts: Σ(strike × 100 × quantity) — strike-based obligation
 *   - Calls/BW: Σ(marketValue / sharesOwned × 100 × quantity) — import-time equity value
 *
 * These do not require live evidence observations.
 */
export function deriveShellCapitalContext(snapshot: PortfolioSnapshot): ShellCapitalContext {
  // Portfolio Capital (V1 aggregate formula)
  const pcDerivation: PortfolioCapitalDerivation | null = derivePortfolioCapital(snapshot);
  const portfolioCapital = pcDerivation?.portfolioCapital ?? null;

  // Deployable Cash
  const deployableCash = snapshot.deployableCash;

  // Encumbered Capital — puts
  let putObligations = 0;
  for (const put of snapshot.existingPuts) {
    putObligations += put.strike * 100 * put.quantity;
  }

  // Encumbered Capital — calls/BW (market-value-at-import basis)
  let coveredEquity = 0;
  const inventoryBySymbol = new Map(
    snapshot.inventory.map(inv => [inv.symbol.toUpperCase(), inv])
  );

  for (const call of snapshot.existingCalls) {
    const inv = inventoryBySymbol.get(call.underlying.toUpperCase());
    if (inv?.economics?.marketValue && inv.sharesOwned > 0) {
      const perShare = inv.economics.marketValue / inv.sharesOwned;
      coveredEquity += perShare * 100 * call.quantity;
    }
  }

  const encumberedCapital = putObligations + coveredEquity;

  // Position count
  const positionCount = snapshot.existingPuts.length + snapshot.existingCalls.length;

  return {
    portfolioCapital,
    deployableCash,
    encumberedCapital,
    positionCount,
  };
}
