/**
 * Engineering probe data — controlled experiments for the domain engine.
 *
 * These are not production data. They are not provider data.
 * They are engineering fixtures: datasets designed to exercise specific
 * behaviors of the reasoning subsystem.
 *
 * Each scenario is a named set of contracts with a description of
 * what it tests. The Engineering Laboratory consumes these; it does not own them.
 *
 * Future scenarios can be added here without modifying the laboratory itself.
 */

import type { OptionContract } from "../domain/types";

export interface ProbeScenario {
  name: string;
  description: string;
  underlyingPrice: number;
  dte: number;
  contracts: OptionContract[];
}

/**
 * Normal market: 10 CALL contracts around ATM for SPY ~$545.
 * Realistic deltas, tight spreads, monotonic delta decay.
 * Tests: basic matching, mid calculation, moneyness classification.
 */
export const NORMAL_MARKET: ProbeScenario = {
  name: "Normal Market",
  description: "10 CALL contracts around ATM. Realistic deltas, tight spreads.",
  underlyingPrice: 545.2,
  dte: 14,
  contracts: [
    { type: "CALL", strike: 540, bid: 6.80, ask: 7.00, delta: 0.62, openInterest: 12400, volume: 3200 },
    { type: "CALL", strike: 541, bid: 6.10, ask: 6.30, delta: 0.58, openInterest: 8900, volume: 2100 },
    { type: "CALL", strike: 542, bid: 5.40, ask: 5.60, delta: 0.54, openInterest: 9200, volume: 2400 },
    { type: "CALL", strike: 543, bid: 4.80, ask: 5.00, delta: 0.50, openInterest: 11000, volume: 2800 },
    { type: "CALL", strike: 544, bid: 4.20, ask: 4.40, delta: 0.45, openInterest: 10500, volume: 2600 },
    { type: "CALL", strike: 545, bid: 3.60, ask: 3.80, delta: 0.41, openInterest: 15200, volume: 4100 },
    { type: "CALL", strike: 546, bid: 3.10, ask: 3.30, delta: 0.37, openInterest: 9800, volume: 2300 },
    { type: "CALL", strike: 547, bid: 2.60, ask: 2.80, delta: 0.32, openInterest: 8400, volume: 1900 },
    { type: "CALL", strike: 548, bid: 2.15, ask: 2.35, delta: 0.28, openInterest: 7600, volume: 1700 },
    { type: "CALL", strike: 549, bid: 1.75, ask: 1.95, delta: 0.24, openInterest: 6900, volume: 1400 },
  ],
};

/**
 * Tie scenario: two contracts equidistant from common target deltas.
 * Tests: tie-breaker policy is actually invoked and produces observable difference.
 */
export const TIE_SCENARIO: ProbeScenario = {
  name: "Tie Scenario",
  description: "Two contracts equidistant from 0.30 delta. Tests tie-breaker policy.",
  underlyingPrice: 545.0,
  dte: 14,
  contracts: [
    { type: "CALL", strike: 543, bid: 4.90, ask: 5.10, delta: 0.52, openInterest: 5000, volume: 1200 },
    { type: "CALL", strike: 545, bid: 3.60, ask: 3.80, delta: 0.35, openInterest: 8000, volume: 2000 },
    { type: "CALL", strike: 547, bid: 2.50, ask: 2.70, delta: 0.25, openInterest: 7000, volume: 1800 },
    { type: "CALL", strike: 550, bid: 1.40, ask: 1.60, delta: 0.15, openInterest: 4000, volume: 900 },
  ],
};

/**
 * Deep OTM: contracts far from the money with low deltas.
 * Tests: low premium, high yield sensitivity, far OTM moneyness.
 */
export const DEEP_OTM: ProbeScenario = {
  name: "Deep OTM",
  description: "Far out-of-the-money contracts. Low delta, low premium.",
  underlyingPrice: 545.0,
  dte: 7,
  contracts: [
    { type: "CALL", strike: 555, bid: 0.18, ask: 0.22, delta: 0.08, openInterest: 22000, volume: 5500 },
    { type: "CALL", strike: 556, bid: 0.12, ask: 0.16, delta: 0.06, openInterest: 18000, volume: 4200 },
    { type: "CALL", strike: 557, bid: 0.08, ask: 0.12, delta: 0.04, openInterest: 15000, volume: 3100 },
    { type: "CALL", strike: 558, bid: 0.04, ask: 0.08, delta: 0.03, openInterest: 12000, volume: 2000 },
    { type: "CALL", strike: 560, bid: 0.02, ask: 0.05, delta: 0.01, openInterest: 8000, volume: 1200 },
  ],
};

/**
 * All available probe scenarios.
 */
export const ALL_SCENARIOS: ProbeScenario[] = [
  NORMAL_MARKET,
  TIE_SCENARIO,
  DEEP_OTM,
];
