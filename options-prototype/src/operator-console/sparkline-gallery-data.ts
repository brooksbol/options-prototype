/**
 * Sparkline Gallery — Representative Contract Histories
 *
 * Deterministic moneyness trajectories covering every meaningful scenario.
 * Used to compare visualization treatments against identical data.
 *
 * Each scenario is a named MoneynessPoint[] array plus context metadata
 * (position type, strike, description of what the history represents).
 */

import type { MoneynessPoint } from "./moneyness-history";
import type { PositionType } from "../portfolio/position-monitoring";

export interface GalleryScenario {
  id: string;
  label: string;
  description: string;
  type: PositionType;
  underlying: string;
  strike: number;
  currentMoneyness: number;
  points: MoneynessPoint[];
}

/** Generate evenly spaced points from a moneyness value array */
function pts(values: number[]): MoneynessPoint[] {
  return values.map((m, i) => ({ t: i / (values.length - 1), moneyness: m }));
}

/**
 * Seven representative contract histories covering all meaningful moneyness states.
 */
export const GALLERY_SCENARIOS: GalleryScenario[] = [
  {
    id: "otm-stable",
    label: "PUT OTM — stable",
    description: "Comfortably OTM put, underlying well above strike. No drama.",
    type: "put",
    underlying: "PSI",
    strike: 145,
    currentMoneyness: -0.069,
    points: pts([
      -0.055, -0.058, -0.052, -0.060, -0.063, -0.057, -0.061, -0.064, -0.059, -0.062,
      -0.066, -0.063, -0.060, -0.065, -0.067, -0.063, -0.061, -0.064, -0.068, -0.065,
      -0.063, -0.066, -0.069, -0.067, -0.070, -0.069,
    ]),
  },
  {
    id: "itm-stable",
    label: "CALL ITM — stable",
    description: "Covered call clearly ITM. Underlying above strike throughout.",
    type: "call",
    underlying: "QQQ",
    strike: 515,
    currentMoneyness: 0.019,
    points: pts([
      0.012, 0.014, 0.016, 0.013, 0.015, 0.018, 0.016, 0.014, 0.017, 0.019,
      0.016, 0.018, 0.020, 0.017, 0.019, 0.021, 0.018, 0.020, 0.017, 0.019,
      0.021, 0.018, 0.020, 0.019, 0.018, 0.019,
    ]),
  },
  {
    id: "approaching-strike",
    label: "PUT approaching strike",
    description: "Put was OTM, underlying drifting down toward strike. Tension building.",
    type: "put",
    underlying: "URA",
    strike: 35,
    currentMoneyness: 0.014,
    points: pts([
      -0.08, -0.075, -0.07, -0.065, -0.06, -0.055, -0.05, -0.045, -0.04, -0.035,
      -0.03, -0.025, -0.02, -0.018, -0.015, -0.012, -0.008, -0.005, -0.002, 0.001,
      0.003, 0.005, 0.008, 0.010, 0.012, 0.014,
    ]),
  },
  {
    id: "moving-away",
    label: "CALL moving away from strike",
    description: "Call was near ATM, underlying falling away. Assignment becoming unlikely.",
    type: "call",
    underlying: "XLF",
    strike: 46,
    currentMoneyness: -0.017,
    points: pts([
      0.005, 0.003, 0.001, -0.001, -0.002, -0.004, -0.003, -0.005, -0.006, -0.007,
      -0.006, -0.008, -0.009, -0.010, -0.009, -0.011, -0.012, -0.011, -0.013, -0.014,
      -0.013, -0.015, -0.014, -0.016, -0.015, -0.017,
    ]),
  },
  {
    id: "cross-otm-to-itm",
    label: "BW crossing OTM → ITM",
    description: "Buy-write was OTM, underlying rallied through strike. Disposition approaching.",
    type: "buy-write",
    underlying: "BNO",
    strike: 54,
    currentMoneyness: 0.019,
    points: pts([
      -0.035, -0.030, -0.025, -0.022, -0.018, -0.015, -0.012, -0.008, -0.005, -0.003,
      -0.001, 0.002, 0.004, 0.006, 0.005, 0.008, 0.010, 0.012, 0.011, 0.014,
      0.013, 0.015, 0.016, 0.017, 0.018, 0.019,
    ]),
  },
  {
    id: "cross-itm-to-otm",
    label: "PUT crossing ITM → OTM",
    description: "Put was ITM (underlying below strike), then underlying recovered above strike.",
    type: "put",
    underlying: "COPX",
    strike: 38,
    currentMoneyness: -0.047,
    points: pts([
      0.025, 0.022, 0.020, 0.018, 0.015, 0.012, 0.010, 0.008, 0.005, 0.003,
      0.001, -0.002, -0.005, -0.008, -0.012, -0.015, -0.018, -0.022, -0.025, -0.028,
      -0.032, -0.035, -0.038, -0.042, -0.045, -0.047,
    ]),
  },
  {
    id: "flat",
    label: "CALL nearly flat",
    description: "Underlying barely moved. Moneyness essentially unchanged all session.",
    type: "call",
    underlying: "SPY",
    strike: 560,
    currentMoneyness: -0.004,
    points: pts([
      -0.003, -0.004, -0.003, -0.004, -0.003, -0.004, -0.005, -0.004, -0.003, -0.004,
      -0.005, -0.004, -0.003, -0.004, -0.005, -0.004, -0.003, -0.004, -0.003, -0.004,
      -0.005, -0.004, -0.003, -0.004, -0.005, -0.004,
    ]),
  },
];
