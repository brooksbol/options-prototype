/**
 * Moneyness Color Semantics
 *
 * Two functions live here:
 *
 * 1. `moneynessColor` (intent-aware, DISCRETE class) — the original mapping of
 *    moneyness state + position type to a CSS class suffix. Epistemic status:
 *    exploratory hypothesis, not ratified architecture. It is retained for reference
 *    but is NO LONGER the Operator Console's moneyness coloring path (see BUG-024).
 *    Its `call → neutral` branch was the conflation BUG-024 identified.
 *
 * 2. `moneynessGradedColor` (BUG-024, GRADED background) — the production moneyness
 *    coloring: intensity by distance from ATM, hue polarity by side/type, amber center.
 *    This is a strike-relative contract-state cognitive aid, not an economic-intent
 *    (favorable/unfavorable) judgment, and it participates in the same graded operator
 *    grammar as the Delta cell (distance-from-0.50).
 */

import type { PositionType } from "../portfolio/position-monitoring";
import { ATM_TOLERANCE, type MoneynessState } from "./moneyness-presentation";

export type MoneynessColorClass = "favorable" | "ambiguous" | "unfavorable" | "neutral";

/**
 * Determine the semantic color class for a position's moneyness.
 *
 * Returns a class suffix that maps to CSS:
 *   favorable   → green
 *   ambiguous   → yellow
 *   unfavorable → red
 *   neutral     → muted/secondary (no strong color signal)
 */
export function moneynessColor(type: PositionType, state: MoneynessState): MoneynessColorClass {
  if (state === "none") return "neutral";

  switch (type) {
    case "put":
      // Wheel intent: OTM = strike not reached, favorable; ITM = assignment approaching
      switch (state) {
        case "otm": return "favorable";
        case "atm": return "ambiguous";
        case "itm": return "unfavorable";
      }
      break;

    case "buy-write":
      // Disposition intent: ITM = designed exit approaching, favorable; OTM = not completing
      switch (state) {
        case "otm": return "unfavorable";
        case "atm": return "ambiguous";
        case "itm": return "favorable";
      }
      break;

    case "call":
      // Intent unknown: conventional CC doesn't necessarily reveal whether assignment is desirable.
      // Use neutral coloring — the operator needs other context (consequence, mission) to judge.
      return "neutral";
  }

  return "neutral";
}

/**
 * Graded moneyness color (BUG-024) — the moneyness analog of the existing graded
 * Delta cell. Color INTENSITY grades with distance from ATM; HUE (green/red) is set
 * by which side of the strike the position sits on, with the polarity mirrored between
 * put-side and call-side contracts. ATM is the shared amber center.
 *
 * Operator grammar (matches the Delta cell's distance-from-0.50 grading):
 *   - distance from ATM  → intensity (deep OTM/ITM = strong; near ATM = faint → amber)
 *   - position side/type → polarity
 *
 * Polarity (preserves existing CSP/BW meaning; adds the missing grading):
 *   - PUT/CSP:            OTM → green,  ITM → red
 *   - CALL/CC & BUY-WRITE: OTM → red,   ITM → green   (call-side; mirror of the put side)
 *
 * This is a contract-state cognitive aid (where is the underlying relative to strike, and
 * how far), not a claim that moneyness is intrinsically good/bad.
 *
 * `signedMoneyness`: normalized signed moneyness (negative = OTM, positive = ITM), the
 * same value used for the numeric label. Returns a CSS `rgba(...)` string, or `undefined`
 * when there is no usable observation (caller renders no background).
 */
export function moneynessGradedColor(
  type: PositionType,
  signedMoneyness: number | null,
): string | undefined {
  if (signedMoneyness == null) return undefined;

  const dist = Math.abs(signedMoneyness);

  // ATM band → amber (shared center, identical for every position type).
  if (dist <= ATM_TOLERANCE) {
    return `rgba(202, 138, 4, 0.22)`; // amber
  }

  // Intensity grades with distance from ATM. Saturates by ~15% away from strike so
  // "deep" OTM/ITM reads as strong/dark and near-ATM reads faint. Same shape family
  // (0.22 floor + quadratic ramp to 0.75) as the graded Delta cell — strengthened for
  // legibility on lower-contrast displays; semantics/polarity unchanged.
  const t = Math.min(1, (dist - ATM_TOLERANCE) / (0.15 - ATM_TOLERANCE));
  const intensity = 0.22 + t * t * 0.53;

  const isItm = signedMoneyness > 0;

  // Call-side (call, buy-write) mirrors the put side: ITM = green, OTM = red.
  const callSide = type === "call" || type === "buy-write";
  const green = callSide ? isItm : !isItm;

  return green
    ? `rgba(22, 163, 74, ${intensity.toFixed(3)})`  // green
    : `rgba(220, 38, 38, ${intensity.toFixed(3)})`; // red
}
