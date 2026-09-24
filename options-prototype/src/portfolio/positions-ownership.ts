/**
 * Positions Ownership — authoritative aggregate share ownership from the Fidelity Positions
 * export (ADR-020).
 *
 * ARCHITECTURE (ADR-020 — Aggregate Share-Ownership Authority):
 *   - The Fidelity Positions export answers: "how many shares of this symbol does the
 *     brokerage report as owned?" It reports ONE aggregate equity line per symbol, and does
 *     NOT repeat shares across strategy views (unlike the Option Summary).
 *   - The Option Summary answers: "how Fidelity presents/associates those shares with
 *     strategies." Its per-strategy share rows are presentation, not an independent
 *     ownership count, and cannot distinguish additive lots from repeated strategy views
 *     (BUG-026).
 *   - Therefore, WHEN Positions evidence is available, it is the authoritative source for
 *     aggregate owned shares per symbol. Absent Positions, ownership derivation falls back
 *     to the conservative observed Option Summary behavior — it must NOT infer ownership
 *     from short-call geometry.
 *
 * This module performs NO reconciliation with Option Summary or Activity and computes no
 * encumbrance. It only projects the authoritative equity-ownership map. Encumbrance and
 * covered-call geometry remain the snapshot builder's responsibility.
 */

import type { HoldingRow } from "../csv/fidelity/positionsParser";

/**
 * Authoritative aggregate equity ownership per symbol (uppercased), derived from Positions.
 *
 * Fidelity Positions reports whole-share holdings as equity rows. A symbol normally appears
 * once, but if it appears on multiple equity rows (e.g. distinct account sub-lines) the
 * quantities are ADDITIVE — Positions does not repeat the same shares across strategy views
 * the way the Option Summary does. Summing equity rows is therefore correct here and is the
 * exact opposite of the Option Summary's MAX-collapse, which is why Positions resolves the
 * BUG-026 additive-vs-repeated ambiguity.
 *
 * Only whole-share equity holdings (>= 1 share) establish covered-call ownership. Fractional
 * positions (e.g. dividend-reinvested 69.829 shares) are still summed and reported; the
 * snapshot builder decides how to treat sub-100 lots.
 */
export function deriveOwnershipFromPositions(rows: HoldingRow[]): Map<string, number> {
  const ownership = new Map<string, number>();
  for (const row of rows) {
    if (row.assetClass !== "equity") continue;
    const symbol = (row.symbol || "").toUpperCase().trim();
    if (!symbol) continue;
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) continue;
    ownership.set(symbol, (ownership.get(symbol) ?? 0) + row.quantity);
  }
  return ownership;
}
