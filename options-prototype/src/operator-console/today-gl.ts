/**
 * today-gl — derive the broker-parity "Today's G/L $/%" for the Operator Console
 * position tables (Unencumbered Shares) and the DTE ladder (underlying daily move).
 *
 * SEMANTICS (BUG-020 — broker parity, honest, non-fabricated):
 *   - "Today's G/L" is measured against the PRIOR SESSION CLOSE (the provider's
 *     `prevclose`), exactly as Fidelity and other brokers report daily G/L —
 *     NOT against Wheelwright's first intraday observation of the day (the prior
 *     first-observation baseline excluded the open gap and could invert the sign).
 *   - It is the underlying's daily move, presented in dollars (scaled by share
 *     quantity for the position-level figure). It is market context, not a
 *     per-position option mark-to-market P/L (the Console has no option-mark
 *     history).
 *   - The prior close is carried as an additive nullable field on the quote
 *     observation. When it is absent (null) or non-positive, the daily figure is
 *     UNAVAILABLE — the caller renders "—", never a fabricated zero and never a
 *     wrong-baseline fallback. The $ and % share the same null condition and sign.
 */

/**
 * Format a signed dollar change for display: "+$0.42" / "-$1.07".
 * Returns "—" for null.
 */
export function formatTodayGl(change: number | null): string {
  if (change == null) return "—";
  const sign = change > 0 ? "+" : change < 0 ? "-" : "";
  return `${sign}$${Math.abs(change).toFixed(2)}`;
}

/**
 * Format a signed percent for display: "+1.24%" / "-0.83%".
 * Returns "—" for null.
 */
export function formatTodayGlPercent(pct: number | null): string {
  if (pct == null) return "—";
  const sign = pct > 0 ? "+" : pct < 0 ? "-" : "";
  return `${sign}${Math.abs(pct).toFixed(2)}%`;
}

/**
 * Combined single-cell form: "+$0.42 (+1.24%)".
 * When the change cannot be computed, returns "—". When the dollar move is
 * known but the percent is not (non-positive reference), the percent is omitted.
 */
export function formatTodayGlCombined(change: number | null, pct: number | null): string {
  if (change == null) return "—";
  const dollars = formatTodayGl(change);
  if (pct == null) return dollars;
  return `${dollars} (${formatTodayGlPercent(pct)})`;
}

/** Direction class suffix for red/green rendering. */
export function todayGlDirection(change: number | null): "up" | "down" | "flat" {
  if (change == null || change === 0) return "flat";
  return change > 0 ? "up" : "down";
}

// --- Broker-parity "Today's G/L" (prior-close baseline) ----------------------
//
// BUG-020: the operator-facing "Today's gain/loss $/%" columns must match the
// broker's daily G/L. The broker measures the day's move against the PRIOR
// SESSION CLOSE, not against Wheelwright's first intraday observation. The
// canonical derivation below is the single source of truth for those columns on
// BOTH the Unencumbered Shares table and the DTE ladder (underlying daily move),
// consumed identically by the on-screen tables and the CSV export.
//
//   Today's G/L $ (per share) = last − previousClose
//   Today's G/L $ (position)  = (last − previousClose) × quantity
//   Today's G/L %             = (last − previousClose) / previousClose × 100
//
// Honesty rules (persist facts; derive trust):
//   - previousClose is the provider's prior-session official close, carried as an
//     additive nullable field on the quote observation. When it is absent (null)
//     or non-positive, the daily figure is UNAVAILABLE — callers render a dash,
//     never a fabricated 0 and never a wrong-baseline fallback.
//   - The $ and % share the same null condition and sign by construction.

/** The prior-close inputs for one symbol's broker-parity Today's G/L. */
export interface TodayGlInputs {
  /** Current/last observed underlying price. */
  last: number | null | undefined;
  /** Provider prior-session official close. */
  previousClose: number | null | undefined;
}

/**
 * Per-share dollar move vs the prior session close: `last − previousClose`.
 * Returns null when either input is missing OR the prior close is non-positive
 * (an unusable baseline). This mirrors computeTodayGlPercent EXACTLY so the $ and
 * % columns always share one honesty rule — a non-positive prior close makes BOTH
 * unavailable, never a $ figure alongside a dashed %.
 */
export function computeTodayGlPerShare(inputs: TodayGlInputs): number | null {
  const { last, previousClose } = inputs;
  if (last == null || previousClose == null) return null;
  if (previousClose <= 0) return null;
  return last - previousClose;
}

/**
 * Position-level dollar G/L vs the prior session close, scaled by quantity
 * (fractional quantities supported): `(last − previousClose) × quantity`.
 * Returns null when the per-share move is unavailable.
 */
export function computeTodayGlDollar(inputs: TodayGlInputs, quantity: number): number | null {
  const perShare = computeTodayGlPerShare(inputs);
  if (perShare == null) return null;
  return perShare * quantity;
}

/**
 * Percent move vs the prior session close:
 * `(last − previousClose) / previousClose × 100`. Quantity-independent.
 * Returns null when inputs are missing or the prior close is non-positive —
 * the identical null condition as computeTodayGlPerShare, so $ and % agree.
 */
export function computeTodayGlPercent(inputs: TodayGlInputs): number | null {
  const { last, previousClose } = inputs;
  if (last == null || previousClose == null) return null;
  if (previousClose <= 0) return null;
  return ((last - previousClose) / previousClose) * 100;
}
