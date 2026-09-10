/**
 * Refresh-scope selection for the Cash Deployment "Refresh top opportunities" control
 * (PL-OPS-09 consumer).
 *
 * Pure, display-relative scope: given the rows IN THE OPERATOR'S CURRENT SORT/FILTER ORDER,
 * take the first N, extract their underlying symbols, uppercase, and deduplicate — hard-capped
 * at N unique symbols. It makes no claim of canonical/best ranking; it faithfully names "the
 * opportunities at the head of the view the operator is using." Multiple rows for one underlying
 * (e.g. a CSP and a buy-write on the same symbol) collapse to one symbol, so N rows yield <= N
 * unique symbols — never more.
 *
 * The N cap is applied to ROWS before dedupe (bounded working set), and the unique-symbol result
 * is inherently <= N, keeping the provider request bounded regardless of row duplication.
 */

/** Default v0 window: first 30 rows under the current sort. */
export const REFRESH_TOP_N = 30;

/** Minimal row shape needed for scope selection (any object carrying an underlying symbol). */
export interface RefreshScopeRow {
  symbol: string;
}

/**
 * Select the deduped, uppercased underlying symbols for the first {@link n} rows of
 * {@link rowsInCurrentOrder} (which must already reflect the operator's current sort/filter).
 */
export function selectRefreshTopSymbols(
  rowsInCurrentOrder: readonly RefreshScopeRow[],
  n: number = REFRESH_TOP_N,
): string[] {
  const cap = Math.max(0, Math.floor(n));
  const seen = new Set<string>();
  for (const row of rowsInCurrentOrder.slice(0, cap)) {
    const sym = row.symbol?.trim().toUpperCase();
    if (sym) seen.add(sym);
  }
  return [...seen];
}
