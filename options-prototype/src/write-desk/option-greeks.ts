/**
 * option-greeks — shared, consumer-agnostic option-greek domain.
 *
 * This is the ONE home for what a greek observation means, when it is available,
 * and how it is presented. Any surface that displays greeks (Operator Console
 * today; the Deployment tables later) consumes THESE utilities rather than
 * recreating validity/formatting rules. There is no Console-specific greek logic.
 *
 * Governing principle (matches the backend nullability correction):
 *   The provider supplies FIVE independent observations. Wheelwright preserves
 *   five independent observations. Absence stays absence; a greek is a number
 *   only when the provider supplied a number. Field-level evidence remains
 *   field-level — one bad/absent greek does NOT invalidate the others. The whole
 *   set is rejected only for an independently justified provider-level condition
 *   (the known all-zero placeholder vector).
 */

/**
 * A single contract's greeks as carried in cached chain evidence. Each field is
 * `number | null | undefined`:
 *   - a number (incl. 0) → the provider supplied that value;
 *   - null                → the provider supplied explicit null (absence);
 *   - undefined           → the field was omitted (absence, e.g. pre-greek snapshot).
 * null and undefined are both treated as "unavailable"; only a real number is data.
 */
export interface RawContractGreeks {
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  rho?: number | null;
}

/**
 * Sanitized greeks for display: each field is either a finite number (available)
 * or null (unavailable). No sentinel numbers, no fabricated zeros.
 */
export interface OptionGreeks {
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  rho: number | null;
}

/** All-unavailable greeks (stable reference for empty/placeholder results). */
export const UNAVAILABLE_GREEKS: OptionGreeks = Object.freeze({
  delta: null, gamma: null, theta: null, vega: null, rho: null,
});

/** True when a value is a usable finite number (not null/undefined/NaN/Infinity). */
function isFiniteNumber(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v);
}

/**
 * Delta domain check. Delta has a mathematically defensible range: a single
 * option's delta lies within [-1, 1] (puts negative, calls positive). A value
 * outside that range is not a valid delta and is treated as unavailable.
 *
 * This bound applies ONLY to delta — it is the one greek with a universal
 * mathematical domain. Gamma/theta/vega/rho have no comparable simple universal
 * fixed ceiling (they scale with underlying, time, vol, and provider convention),
 * so we do NOT impose arbitrary numeric ceilings on them.
 */
export function isDeltaInDomain(delta: number): boolean {
  return delta >= -1 && delta <= 1;
}

/**
 * Whether a raw greek is a USABLE value for display.
 *
 * Product rule (per field): for provider-supplied greeks, `0.0` is treated as
 * UNAVAILABLE, not a legitimate observation. Rationale — near expiration the
 * provider's model (ORATS via Tradier) frequently returns exact `0.0` as a
 * degenerate/rounded placeholder rather than a computed sensitivity (observed:
 * COPX/UNG entire zero vectors; URA/BNO partial zeros). This feature shows the
 * operator *answers*, not provider placeholders, so a field is usable only when
 * it is a finite NONZERO number. null / missing / 0.0 / non-finite → unavailable.
 *
 * If a future need arises to present a meaningful calculated zero, that must be
 * an explicit, evidence-backed decision — not the default.
 */
function isUsableGreek(v: number | null | undefined): v is number {
  return isFiniteNumber(v) && v !== 0;
}

/**
 * Sanitize a contract's raw greeks into display-ready `OptionGreeks`.
 *
 * Purely FIELD-LEVEL (no set-level sentinel needed — per-field zero-is-unavailable
 * subsumes the old all-zero-vector placeholder case):
 *   - each secondary greek: usable iff finite AND nonzero; else null.
 *   - delta: usable iff finite AND nonzero AND within its [-1, 1] domain; else null.
 * A missing/invalid/zero value in one field never affects the others.
 *
 * No arbitrary numeric ceilings are applied to the secondary greeks — the only
 * rejections are absence, non-finite, zero, and (for delta) out-of-domain.
 */
export function sanitizeGreeks(raw: RawContractGreeks): OptionGreeks {
  return {
    delta: isUsableGreek(raw.delta) && isDeltaInDomain(raw.delta) ? raw.delta : null,
    gamma: isUsableGreek(raw.gamma) ? raw.gamma : null,
    theta: isUsableGreek(raw.theta) ? raw.theta : null,
    vega: isUsableGreek(raw.vega) ? raw.vega : null,
    rho: isUsableGreek(raw.rho) ? raw.rho : null,
  };
}

/** True when at least one greek is available. */
export function hasAnyGreek(g: OptionGreeks): boolean {
  return g.delta != null || g.gamma != null || g.theta != null || g.vega != null || g.rho != null;
}

/**
 * Present a greek value for display with ADAPTIVE precision.
 *
 * Unavailable (null) → em dash. Otherwise the value is a usable, finite NONZERO
 * number (sanitizeGreeks already nulled exact zeros). The honesty risk is that a
 * tiny-but-real value (e.g. delta 0.0001, vega 0.00004) rounds to "0.0000" at
 * fixed precision — which under our own rule reads as "no answer". To prevent
 * that, when the magnitude would round to zero at `digits`, we render a
 * threshold form ("<0.0001" / ">-0.0001") so a real value never displays as a
 * bare zero. Exact 0 is defensively shown as "—" (it should not reach here).
 */
export function formatGreek(value: number | null, digits = 4): string {
  if (value == null) return "—";
  if (value === 0) return "—"; // defensive: a genuine 0 is "unavailable" per the product rule
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) {
    // Real but sub-precision magnitude — show a threshold rather than a false zero.
    const threshold = Math.pow(10, -digits).toFixed(digits); // e.g. "0.0001"
    return value > 0 ? `<${threshold}` : `>-${threshold}`;
  }
  return value.toFixed(digits);
}

/**
 * Present the ABSOLUTE delta for surfaces that show delta magnitude (puts report
 * negative delta; a magnitude view compares put/call on one scale). Returns null
 * when delta is unavailable. Formatting/coloring stays with the surface; this only
 * supplies the magnitude value.
 */
export function absDeltaMagnitude(delta: number | null): number | null {
  return delta == null ? null : Math.abs(delta);
}
