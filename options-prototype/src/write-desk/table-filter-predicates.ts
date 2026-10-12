/**
 * Deployment table filter predicates (pure).
 *
 * Pure, side-effect-free row predicates for the covered-call and buy-write
 * candidate tables. Extracted so the filter semantics are unit-testable in
 * isolation from the WriteDesk component. The Puts table keeps its existing
 * inline predicate; these mirror its symbol/DTE/capital semantics for the two
 * tables brought to parity (option C).
 *
 * Conventions (match the existing Puts filter):
 * - Symbol terms are comma/space separated, trimmed, upper-cased, non-empty.
 *   A row matches when ANY term is a case-insensitive substring of its symbol.
 *   An empty term list matches every row (no symbol filter active).
 * - Numeric bounds are inclusive; a null bound means "no bound".
 */

/** Parse a raw symbol-filter string into normalized match terms. */
export function parseSymbolTerms(raw: string): string[] {
  return raw.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
}

/** True when the symbol matches any term, or no terms are active. */
export function symbolMatches(symbol: string, terms: string[]): boolean {
  return terms.length === 0 || terms.some((t) => symbol.toUpperCase().includes(t));
}

/** Inclusive numeric range check with nullable bounds. */
export function withinBounds(value: number, min: number | null, max: number | null): boolean {
  return (min == null || value >= min) && (max == null || value <= max);
}

/**
 * Covered-call row predicate (honest subset: symbol + DTE). Calls monetize
 * already-held shares, so no cash-outlay (capital) or affordability dimension
 * applies. Operates on the fields shared by executable and contingent rows.
 */
export function callRowMatches(
  row: { symbol: string; dte: number },
  filters: { symbolTerms: string[]; dteMin: number | null; dteMax: number | null },
): boolean {
  return (
    withinBounds(row.dte, filters.dteMin, filters.dteMax) &&
    symbolMatches(row.symbol, filters.symbolTerms)
  );
}

/**
 * Buy-write row predicate (symbol + DTE + capital), mirroring the Puts filter.
 * Capital dimension for buy-writes is capitalRequired (underlyingPrice × 100 —
 * the share purchase cost).
 */
export function buyWriteRowMatches(
  row: { symbol: string; dte: number; capitalRequired: number },
  filters: {
    symbolTerms: string[];
    dteMin: number | null;
    dteMax: number | null;
    capitalMin: number | null;
    capitalMax: number | null;
  },
): boolean {
  return (
    withinBounds(row.dte, filters.dteMin, filters.dteMax) &&
    withinBounds(row.capitalRequired, filters.capitalMin, filters.capitalMax) &&
    symbolMatches(row.symbol, filters.symbolTerms)
  );
}
