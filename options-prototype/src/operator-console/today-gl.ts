/**
 * today-gl — derive the underlying's intraday dollar move ("Today's G/L $")
 * for the Operator Console position tables.
 *
 * SEMANTICS (honest, non-fabricated):
 *   - This is the UNDERLYING's per-share dollar change over the most recent
 *     session day present in the spot-observation series — NOT a position
 *     mark-to-market P/L (the Console has no per-position option-mark history).
 *     It is market context, presented in dollars, matching the operator's
 *     preferred "Today's gain/loss $" wording.
 *   - "Today" is defined as the calendar date (UTC) of the LATEST observation in
 *     the series, not wall-clock now. This is correct for a sealed/closed session
 *     (the newest data is the last trading day) and deliberately avoids folding
 *     multiple days together (cf. BUG-015 moneyness-sparkline multi-day folding).
 *   - Returns null when the latest day has fewer than two distinct observation
 *     moments (no intraday reference to measure against) — the caller renders
 *     "—" rather than a fabricated zero.
 *
 * Input is the same SpotObservation[] series the moneyness sparkline consumes.
 * Callers should pass the already-deduplicated observation moments so that the
 * multi-expiration duplicate rows (one identical spot per eligible expiration per
 * cycle) do not masquerade as separate moments.
 */

import type { SpotObservation } from "../evidence/use-spot-history";

/** UTC calendar date key (YYYY-MM-DD) for an ISO timestamp. */
function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Compute the underlying's dollar change over the latest session day present in
 * `moments`. `moments` MUST be chronologically ascending observation moments
 * (as returned by the history API and deduplicated by deduplicateObservations).
 *
 * Returns the signed per-share dollar change (latestPrice − firstPriceOfLatestDay),
 * or null when it cannot be computed honestly.
 */
export function computeTodayUnderlyingChange(moments: SpotObservation[] | undefined | null): number | null {
  if (!moments || moments.length < 2) return null;

  const latest = moments[moments.length - 1];
  const latestDay = dateKey(latest.observedAt);

  // Earliest observation that shares the latest day.
  let firstOfDay: SpotObservation | null = null;
  for (const m of moments) {
    if (dateKey(m.observedAt) === latestDay) {
      firstOfDay = m;
      break;
    }
  }

  // Need at least two DISTINCT moments on the latest day to have an intraday
  // reference. If the only same-day moment is the latest itself, there is no
  // "today's move" to report.
  if (!firstOfDay || firstOfDay === latest) return null;
  if (firstOfDay.observedAt === latest.observedAt) return null;

  return latest.price - firstOfDay.price;
}

/**
 * Percent form of the same latest-session move: (latest − firstOfDay) / firstOfDay * 100.
 * Uses the identical latest-day isolation and ≥2-same-day-moment rule as
 * computeTodayUnderlyingChange, so the $ and % columns are always consistent
 * (same sign, same null condition). Returns null when it cannot be computed
 * honestly (or the reference price is non-positive).
 */
export function computeTodayUnderlyingChangePercent(moments: SpotObservation[] | undefined | null): number | null {
  if (!moments || moments.length < 2) return null;

  const latest = moments[moments.length - 1];
  const latestDay = dateKey(latest.observedAt);

  let firstOfDay: SpotObservation | null = null;
  for (const m of moments) {
    if (dateKey(m.observedAt) === latestDay) {
      firstOfDay = m;
      break;
    }
  }

  if (!firstOfDay || firstOfDay === latest) return null;
  if (firstOfDay.observedAt === latest.observedAt) return null;
  if (firstOfDay.price <= 0) return null;

  return ((latest.price - firstOfDay.price) / firstOfDay.price) * 100;
}

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
