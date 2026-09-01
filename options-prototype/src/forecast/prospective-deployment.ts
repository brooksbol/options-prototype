/**
 * Prospective Deployment — V2 Continuation Estimate
 *
 * Estimates rough additional production if capital cycles again before
 * month-end, using recent actual deployment evidence.
 *
 * Architecture: docs/28-forecast-v2-exploration.md
 * Key insight: ADR-014 recognition-at-receipt means premium is produced
 * at the deployment event, not accrued over contract life.
 *
 * This is a stated pro-forma assumption, not a prediction:
 *   "If deployment continues at roughly recent productivity,
 *    and admissible opportunities remain available..."
 *
 * Algorithm:
 *   1. Extract recent sell-to-open events from Activity evidence
 *   2. Compute capital-weighted immediate yield (premium / capital)
 *   3. Check: is there calendar time between resolution and month-end?
 *   4. If yes: estimate = cycling_capital × recent_yield (rounded to $1K)
 *
 * The estimate is deliberately a single rough number rounded to nearest $1K.
 * Participation uncertainty is communicated through rounding and explicit
 * conditionality ("if capital cycles"), not through arbitrary fractions.
 *
 * Provisional policy parameters are explicitly marked and minimal.
 *
 * Pure function. No React, no side effects.
 */

import type { ActivityRow } from "../csv/fidelity/activityParser";

// --- Types ---

export interface DeploymentObservation {
  /** Trade date (ISO) */
  date: string;
  /** Underlying symbol */
  symbol: string;
  /** Option type */
  optionType: "PUT" | "CALL";
  /** Premium received (net of fees, positive) */
  premiumReceived: number;
  /** Capital deployed (strike × 100 × qty for puts; strike × 100 × qty proxy for calls) */
  capitalDeployed: number;
  /** Immediate yield: premium / capital */
  immediateYield: number;
}

export interface ProspectiveDeploymentOutlook {
  /** Whether conditions suggest another deployment is plausible before month-end */
  deploymentPlausible: boolean;
  /** Why or why not */
  plausibilityReason: string;

  /** Capital approaching resolution this month */
  cyclingCapital: number;

  /** Recent deployment observations used as evidence */
  recentDeployments: DeploymentObservation[];
  /** Number of deployments in the evidence window */
  evidenceCount: number;

  /** Recent immediate yield (capital-weighted across evidence) */
  recentYield: number | null;

  /**
   * Rough estimate of possible additional production, rounded to nearest $1K.
   * This is cycling_capital × recent_yield, rounded.
   * Participation uncertainty is inherent in the rounding — the operator
   * understands they won't deploy 100% of available capital.
   */
  roughEstimate: number;

  /** Explicit assumptions stated for operator inspection */
  assumptions: string[];
}

// --- Derivation ---

/**
 * Derive recent deployment observations from Activity rows.
 *
 * Extracts sell-to-open events, computes immediate yield per deployment.
 * Uses all available sell-to-open events (no arbitrary window limit).
 */
export function extractRecentDeployments(
  activityRows: ActivityRow[],
): DeploymentObservation[] {
  const deployments: DeploymentObservation[] = [];

  for (const row of activityRows) {
    if (row.eventType !== "sell_to_open") continue;
    if (!row.option) continue;
    if (row.amount == null || row.amount <= 0) continue;

    const qty = Math.abs(row.quantity);
    const premium = row.amount;

    // Capital deployed: strike × 100 × quantity (same proxy for puts and calls)
    const capitalDeployed = row.option.strike * 100 * qty;
    if (capitalDeployed <= 0) continue;

    deployments.push({
      date: row.date,
      symbol: row.option.underlying,
      optionType: row.option.type,
      premiumReceived: premium,
      capitalDeployed,
      immediateYield: premium / capitalDeployed,
    });
  }

  return deployments;
}

/**
 * Compute the capital-weighted immediate yield across deployment observations.
 */
export function computeRecentYield(deployments: DeploymentObservation[]): number | null {
  if (deployments.length === 0) return null;

  let totalPremium = 0;
  let totalCapital = 0;

  for (const d of deployments) {
    totalPremium += d.premiumReceived;
    totalCapital += d.capitalDeployed;
  }

  if (totalCapital === 0) return null;
  return totalPremium / totalCapital;
}

/**
 * Derive the prospective deployment outlook.
 *
 * @param activityRows Parsed Activity CSV (for recent deployment evidence)
 * @param cyclingCapital Capital resolving this month (from ProductionCapacity.resolvingThisMonth)
 * @param earliestResolutionDate ISO date of soonest resolution
 * @param monthEnd Last day of current month
 * @param today Override for testing
 */
export function deriveProspectiveDeployment(
  activityRows: ActivityRow[] | null,
  cyclingCapital: number,
  earliestResolutionDate: string | null,
  monthEnd: Date,
  _today: Date = new Date(),
): ProspectiveDeploymentOutlook {
  const assumptions: string[] = [];

  // --- Plausibility: is there calendar time after resolution? ---

  if (cyclingCapital <= 0) {
    return emptyOutlook(cyclingCapital, "No capital resolving this month");
  }

  if (!earliestResolutionDate) {
    return emptyOutlook(cyclingCapital, "No resolution date available");
  }

  const resolutionMs = new Date(earliestResolutionDate).getTime();
  const monthEndMs = monthEnd.getTime();
  const calendarDaysRemaining = Math.floor((monthEndMs - resolutionMs) / (1000 * 60 * 60 * 24));

  // Simple check: any calendar days between resolution and month-end?
  if (calendarDaysRemaining < 1) {
    return emptyOutlook(cyclingCapital, "Resolution occurs at or after month-end");
  }

  // --- Evidence extraction ---

  if (!activityRows || activityRows.length === 0) {
    return emptyOutlook(cyclingCapital, "No Activity evidence available");
  }

  const recentDeployments = extractRecentDeployments(activityRows);

  if (recentDeployments.length === 0) {
    return emptyOutlook(cyclingCapital, "No sell-to-open events found in Activity evidence");
  }

  const recentYield = computeRecentYield(recentDeployments);

  if (recentYield == null || recentYield <= 0) {
    return emptyOutlook(cyclingCapital, "Could not derive meaningful yield from deployment evidence");
  }

  // --- Estimate ---
  // Simple: cycling_capital × recent_yield, rounded to nearest $1K.
  // This deliberately overstates (assumes full participation) but rounding
  // communicates the imprecision. The operator knows their actual deployment
  // fraction from experience.

  const rawEstimate = cyclingCapital * recentYield;
  const roughEstimate = Math.round(rawEstimate / 1000) * 1000;

  assumptions.push("Capital cycles again before month-end");
  assumptions.push("Admissible opportunities remain available");
  assumptions.push(`Recent deployment productivity (~${(recentYield * 100).toFixed(1)}% immediate yield) continues`);

  return {
    deploymentPlausible: true,
    plausibilityReason: `${calendarDaysRemaining} days between resolution (${earliestResolutionDate}) and month-end`,
    cyclingCapital,
    recentDeployments,
    evidenceCount: recentDeployments.length,
    recentYield,
    roughEstimate,
    assumptions,
  };
}

// --- Internal ---

function emptyOutlook(cyclingCapital: number, reason: string): ProspectiveDeploymentOutlook {
  return {
    deploymentPlausible: false,
    plausibilityReason: reason,
    cyclingCapital,
    recentDeployments: [],
    evidenceCount: 0,
    recentYield: null,
    roughEstimate: 0,
    assumptions: [],
  };
}
