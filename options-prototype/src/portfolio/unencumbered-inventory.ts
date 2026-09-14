/**
 * Unencumbered Inventory — Pure Projection (PL-ELIG V1)
 *
 * Projects standalone free-share inventory from a PortfolioSnapshot for the
 * Operator Console's "Unencumbered Shares" region. This is a presentation-layer
 * projection over already-derived facts — it introduces NO new accounting and does
 * NOT re-derive encumbrance. It reads:
 *   - InventoryPosition.sharesFree / .maxAdditionalContracts (from deriveInventory)
 *   - snapshot.existingCalls (open short-call geometry, for warnings only)
 *   - snapshot.provenance (Option Summary provenance, for warnings only)
 *
 * Epistemic contract (canonical: docs/parking-lot-8.md §PL-ELIG — Unencumbered
 * Shares on the Operator Console):
 *   - Free Shares are snapshot-derived from observed Fidelity Option Summary
 *     ownership and open short-call geometry. The computation is deterministic;
 *     the underlying ownership evidence is NOT universally authoritative/complete.
 *   - Missing inventory evidence is NOT equivalent to zero shares owned.
 *   - The existing encumbrance clamp (sharesEncumbered = min(Σcalls×100, owned))
 *     is safety behavior, NOT proof that ownership evidence and call geometry
 *     reconcile.
 *   - Geometry analysis operates over the UNION of inventory symbols and open-call
 *     underlyings; observedSharesOwned is nullable (null = evidence unavailable).
 *   - Geometry warnings are independent of free-share rows.
 *
 * Pure function. No side effects.
 */

import type { PortfolioSnapshot } from "../write-desk/types";

// --- Types ---

/** One standalone free-share inventory row. Never carries owned/encumbered quantities. */
export interface UnencumberedInventoryRow {
  symbol: string;
  /** = InventoryPosition.sharesFree (NEVER sharesOwned). */
  freeShares: number;
  /** = InventoryPosition.maxAdditionalContracts = floor(sharesFree / 100). */
  freeLots: number;
}

/** Option Summary provenance carried onto a geometry warning (share inventory only). */
export interface InventoryWarningProvenance {
  optionSummaryFilename?: string;
  optionSummaryExportTimestamp?: string;
  optionSummaryParsedAt?: string;
}

/**
 * An ownership-vs-call-geometry disagreement. A property of the inventory
 * evidence, NOT of any visible free-share row.
 */
export interface InventoryGeometryWarning {
  symbol: string;
  /** null = ownership evidence unavailable (no inventory record for this underlying). */
  observedSharesOwned: number | null;
  /** Σ |openCall.quantity| × 100 for this underlying (pre-clamp). */
  rawCallRequiredShares: number;
  provenance: InventoryWarningProvenance;
  /** Non-normative, descriptive only. */
  explanation: string;
}

export interface UnencumberedInventoryResult {
  rows: UnencumberedInventoryRow[];
  geometryWarnings: InventoryGeometryWarning[];
}

// --- Derivation ---

const SHARES_PER_CONTRACT = 100;

/**
 * Derive the standalone free-share inventory projection from a PortfolioSnapshot.
 *
 * Rows: one per InventoryPosition with sharesFree > 0 (odd lots included; a row
 * with freeLots = 0 is legitimate and visible).
 *
 * Geometry warnings: computed over the union of inventory symbols and open-call
 * underlyings. Emitted when either an open-call underlying has no inventory
 * ownership record (observedSharesOwned = null) OR raw call-required shares exceed
 * observed ownership.
 */
export function deriveUnencumberedInventory(snapshot: PortfolioSnapshot): UnencumberedInventoryResult {
  // --- Rows: free-share inventory, sorted by symbol (deterministic) ---
  const rows: UnencumberedInventoryRow[] = snapshot.inventory
    .filter((inv) => inv.sharesFree > 0)
    .map((inv) => ({
      symbol: inv.symbol,
      freeShares: inv.sharesFree,
      freeLots: inv.maxAdditionalContracts,
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  // --- Geometry: raw call-required shares per underlying (pre-clamp) ---
  const rawCallRequiredByUnderlying = new Map<string, number>();
  for (const call of snapshot.existingCalls) {
    const key = call.underlying.toUpperCase();
    const required = Math.abs(call.quantity) * SHARES_PER_CONTRACT;
    rawCallRequiredByUnderlying.set(key, (rawCallRequiredByUnderlying.get(key) ?? 0) + required);
  }

  // Observed ownership per symbol (from inventory evidence). Absence is meaningful.
  const observedOwnedBySymbol = new Map<string, number>();
  for (const inv of snapshot.inventory) {
    observedOwnedBySymbol.set(inv.symbol.toUpperCase(), inv.sharesOwned);
  }

  const provenance = warningProvenance(snapshot);

  // Union domain: every symbol that either has an inventory record OR has open calls.
  const unionSymbols = new Set<string>([
    ...observedOwnedBySymbol.keys(),
    ...rawCallRequiredByUnderlying.keys(),
  ]);

  const geometryWarnings: InventoryGeometryWarning[] = [];
  for (const symbol of unionSymbols) {
    const rawCallRequiredShares = rawCallRequiredByUnderlying.get(symbol) ?? 0;
    // No open calls for this symbol → no geometry disagreement possible.
    if (rawCallRequiredShares === 0) continue;

    const hasInventory = observedOwnedBySymbol.has(symbol);
    const observedSharesOwned = hasInventory ? observedOwnedBySymbol.get(symbol)! : null;

    if (!hasInventory) {
      // Case 1: open calls but no ownership record → ownership evidence unavailable.
      // MUST NOT be silently converted to zero shares owned.
      geometryWarnings.push({
        symbol,
        observedSharesOwned: null,
        rawCallRequiredShares,
        provenance,
        explanation:
          `Open short calls require ${rawCallRequiredShares} shares of ${symbol}, ` +
          `but no share-ownership record was observed for ${symbol}. ` +
          `Ownership evidence is unavailable — this is not evidence of zero shares.`,
      });
    } else if (rawCallRequiredShares > (observedSharesOwned as number)) {
      // Case 2: raw call-required shares exceed observed ownership → disagreement.
      // The encumbrance clamp hides this in the free-share display; surface it here.
      geometryWarnings.push({
        symbol,
        observedSharesOwned,
        rawCallRequiredShares,
        provenance,
        explanation:
          `Open short calls require ${rawCallRequiredShares} shares of ${symbol}, ` +
          `but only ${observedSharesOwned} shares were observed as owned. ` +
          `Observed ownership and open-call geometry do not reconcile.`,
      });
    }
  }

  geometryWarnings.sort((a, b) => a.symbol.localeCompare(b.symbol));

  return { rows, geometryWarnings };
}

/** Extract Option Summary provenance ONLY (never balances; never snapshotDate). */
function warningProvenance(snapshot: PortfolioSnapshot): InventoryWarningProvenance {
  const p = snapshot.provenance;
  return {
    optionSummaryFilename: p?.optionSummaryFilename,
    optionSummaryExportTimestamp: p?.optionSummaryExportTimestamp,
    optionSummaryParsedAt: p?.optionSummaryParsedAt,
  };
}
