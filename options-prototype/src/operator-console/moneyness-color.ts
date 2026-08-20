/**
 * Moneyness Color Semantics — Intent-Aware
 *
 * Maps moneyness state + position type to a CSS class suffix for coloring.
 *
 * This is NOT a universal OTM=green / ITM=red rule.
 * The interpretation depends on what the strategy implies about intent:
 *
 *   PUT (wheel intent): OTM = favorable (green), ATM = ambiguous (yellow), ITM = assignment path (red)
 *   BW (disposition intent): ITM = cycle completing (green), ATM = ambiguous (yellow), OTM = not completing (red)
 *   CC (intent unknown): neutral — moneyness alone doesn't reveal whether call-away is desirable
 *
 * Epistemic status: Exploratory hypothesis, not ratified architecture.
 * Preserved as the narrowest truthful mapping currently supportable.
 */

import type { PositionType } from "../portfolio/position-monitoring";
import type { MoneynessState } from "./moneyness-presentation";

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
