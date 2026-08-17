/**
 * Current-Month Production — Domain Derivation Module
 *
 * Derives current-month production facts from:
 *   - Backend production assessment (known production, unresolved, erosion)
 *   - Live portfolio snapshot (in-flight option positions, capital)
 *   - Position monitoring (expiry rungs, capital by rung)
 *
 * Pure functions. No React, no side effects.
 *
 * Domain concepts:
 *   Known Production — actually realized this month (backend authoritative)
 *   Forecast Production — known + expected-to-realize (in-flight positions expiring this month)
 *   Unresolved — amounts that cannot yet be classified
 *   Production Capacity — capital available for additional deployment
 *
 * Explicit exclusions from forecast:
 *   - Hypothetical future deployments
 *   - Linear extrapolation of premium
 *   - Assumed redeployment of released capital
 *   - Statistical projections based on historical cadence
 */

import type { PortfolioSnapshot, OpenShortPut, OpenShortCall } from "../write-desk/types";
import type { ProductionAssessmentResponse } from "./production-types";
import type { ExpirationRung } from "../portfolio/position-monitoring";

// --- Types ---

export interface InFlightPosition {
  type: "put" | "call" | "buy-write";
  underlying: string;
  strike: number;
  expiration: string;
  dte: number;
  quantity: number;
  /** Premium credit already received (positive = credit). Null when unknown. */
  premiumCredit: number | null;
  /** Whether this position expires within the current month */
  expiresThisMonth: boolean;
}

export interface ProductionCapacity {
  /** Capital currently deployable (from portfolio snapshot) */
  deployableNow: number | null;
  /** Capital in positions resolving within the current month (outcome determines form, not guaranteed cash) */
  resolvingThisMonth: number;
  /** Positions resolving this month, by rung */
  resolvingRungs: CapacityRung[];
  /** Capital associated with positions resolving beyond current month end */
  beyondMonthEnd: number;
  /** Rungs beyond month end */
  beyondRungs: CapacityRung[];
}

export interface CapacityRung {
  expiration: string;
  dte: number;
  totalCapital: number;
  positionCount: number;
}

export interface ForecastComposition {
  /** Known production from backend assessment */
  knownProduction: number;
  /** Total forecast — equals known production (premium is recognized at receipt, not at expiry) */
  forecastTotal: number;
  /** Number of positions resolving this month (risk context, not additional production) */
  resolvingPositionCount: number;
  /** Total premium on positions resolving this month (already included in known production) */
  resolvingPremium: number;
  /** Positions where premium is unknown */
  unknownPremiumCount: number;
}

export interface CurrentMonthProductionSummary {
  /** Calendar month being assessed */
  month: string;
  monthLabel: string;
  /** Known production (factual, from backend) — all sources */
  knownProduction: number;
  /** Production source breakdown (from backend) */
  productionBreakdown: Record<string, number>;
  /**
   * Net Strategy Result: options-strategy-attributable production minus lifecycle erosion.
   * = (OPTION_PREMIUM + REALIZED_APPRECIATION) − CAPITAL_EROSION
   *
   * Excludes structural income (SPAXX, Treasury discount, dividends) because those
   * are not consequences of options strategy decisions. This isolates the net economic
   * contribution of the strategy engine itself.
   *
   * Null when no assessment is available.
   */
  netStrategyResult: number | null;
  /** Forecast composition (known + in-flight) */
  forecast: ForecastComposition;
  /** Unresolved amounts */
  unresolvedProduction: number;
  /** Realized capital erosion */
  capitalErosion: number;
  /** In-flight positions (this month + beyond) */
  inFlightPositions: InFlightPosition[];
  /** Production capacity */
  capacity: ProductionCapacity;
  /** Evidence context */
  evidenceContext: EvidenceContext;
  /** Reconciliation issues from backend */
  reconciliationIssues: ProductionAssessmentResponse["reconciliationIssues"];
  /** Reconciliation status */
  reconciliationStatus: string;
}

export interface EvidenceContext {
  /** Current month name */
  currentMonth: string;
  /** Today's date ISO */
  today: string;
  /** Days elapsed in current month */
  daysElapsed: number;
  /** Days remaining in current month */
  daysRemaining: number;
  /** Total days in current month */
  totalDays: number;
  /** Latest Fidelity Activity evidence date */
  activityEvidenceThrough: string | null;
  /** Portfolio snapshot date */
  snapshotDate: string | null;
}

// --- Derivation ---

/**
 * Derive the current-month production summary from backend assessment + live portfolio.
 *
 * @param assessment Backend production assessment for the current month (may be null if backend unavailable)
 * @param snapshot Live portfolio snapshot
 * @param rungs Expiry rungs from position monitoring
 * @param today Override for testing
 */
export function deriveCurrentMonthProduction(
  assessment: ProductionAssessmentResponse | null,
  snapshot: PortfolioSnapshot | null,
  rungs: ExpirationRung[],
  today: Date = new Date(),
): CurrentMonthProductionSummary {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // last day of current month
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Evidence context
  const totalDays = monthEnd.getDate();
  const daysElapsed = today.getDate();
  const daysRemaining = totalDays - daysElapsed;

  const evidenceContext: EvidenceContext = {
    currentMonth: monthLabel,
    today: today.toISOString().slice(0, 10),
    daysElapsed,
    daysRemaining,
    totalDays,
    activityEvidenceThrough: null, // populated from assessment period if available
    snapshotDate: snapshot?.snapshotDate ?? null,
  };

  // Known production from backend
  const knownProduction = assessment?.knownCashProduction ?? 0;
  const productionBreakdown = assessment?.productionBreakdown ?? {};
  const unresolvedProduction = assessment?.unresolvedPotentialProduction ?? 0;
  const capitalErosion = assessment?.realizedCapitalErosion ?? 0;
  const reconciliationIssues = assessment?.reconciliationIssues ?? [];
  const reconciliationStatus = assessment?.reconciliationStatus ?? "SOURCE_INCOMPLETE";

  // Net Strategy Result: authoritative from backend.
  // = (OPTION_PREMIUM + REALIZED_APPRECIATION) − CAPITAL_EROSION
  // Excludes structural income. See ProductionAssessor.computeNetStrategyResult().
  const netStrategyResult: number | null = assessment?.netStrategyResult ?? null;

  // In-flight positions: derive from snapshot (these provide risk context, not additional production)
  const inFlightPositions = deriveInFlightPositions(snapshot, today, monthEnd);

  // Forecast: known production IS the forecast.
  // Premium is recognized at receipt (sell-to-open), not at contract expiry.
  // Open positions represent obligation/risk, not additional income.
  const thisMonthPositions = inFlightPositions.filter(p => p.expiresThisMonth);
  const resolvingPremium = thisMonthPositions
    .filter(p => p.premiumCredit != null)
    .reduce((sum, p) => sum + p.premiumCredit!, 0);
  const unknownPremiumCount = thisMonthPositions.filter(p => p.premiumCredit === null).length;

  const forecast: ForecastComposition = {
    knownProduction,
    forecastTotal: knownProduction,
    resolvingPositionCount: thisMonthPositions.length,
    resolvingPremium,
    unknownPremiumCount,
  };

  // Production capacity from expiry rungs
  const capacity = deriveProductionCapacity(snapshot, rungs, monthEnd);

  return {
    month: monthStr,
    monthLabel,
    knownProduction,
    productionBreakdown,
    netStrategyResult,
    forecast,
    unresolvedProduction,
    capitalErosion,
    inFlightPositions,
    capacity,
    evidenceContext,
    reconciliationIssues,
    reconciliationStatus,
  };
}

// --- Internal Derivation ---

function deriveInFlightPositions(
  snapshot: PortfolioSnapshot | null,
  today: Date,
  monthEnd: Date,
): InFlightPosition[] {
  if (!snapshot) return [];

  const positions: InFlightPosition[] = [];
  const todayMs = today.getTime();
  const monthEndMs = monthEnd.getTime();

  // Build inventory lookup for buy-write classification
  const inventoryBySymbol = new Map<string, { sharesOwned: number; averageCostPerShare: number | null }>();
  for (const inv of snapshot.inventory) {
    inventoryBySymbol.set(inv.symbol.toUpperCase(), {
      sharesOwned: inv.sharesOwned,
      averageCostPerShare: inv.economics?.averageCostPerShare ?? null,
    });
  }

  for (const put of snapshot.existingPuts) {
    const expMs = new Date(put.expiration).getTime();
    const dte = Math.max(0, Math.ceil((expMs - todayMs) / 86_400_000));
    const expiresThisMonth = expMs <= monthEndMs;

    // Premium credit: brokerOptionBasis is negative for credits (Fidelity convention)
    const premiumCredit = put.brokerOptionBasis != null
      ? Math.abs(put.brokerOptionBasis)
      : null;

    positions.push({
      type: "put",
      underlying: put.underlying,
      strike: put.strike,
      expiration: put.expiration,
      dte,
      quantity: put.quantity,
      premiumCredit,
      expiresThisMonth,
    });
  }

  for (const call of snapshot.existingCalls) {
    const expMs = new Date(call.expiration).getTime();
    const dte = Math.max(0, Math.ceil((expMs - todayMs) / 86_400_000));
    const expiresThisMonth = expMs <= monthEndMs;

    const premiumCredit = call.brokerOptionBasis != null
      ? Math.abs(call.brokerOptionBasis)
      : null;

    // Classify as buy-write if operator owns 100+ shares with known cost basis
    const inv = inventoryBySymbol.get(call.underlying.toUpperCase());
    const isBuyWrite = inv != null && inv.sharesOwned >= 100 && inv.averageCostPerShare != null;

    positions.push({
      type: isBuyWrite ? "buy-write" : "call",
      underlying: call.underlying,
      strike: call.strike,
      expiration: call.expiration,
      dte,
      quantity: call.quantity,
      premiumCredit,
      expiresThisMonth,
    });
  }

  // Sort by DTE ascending
  positions.sort((a, b) => a.dte - b.dte);
  return positions;
}

function deriveProductionCapacity(
  snapshot: PortfolioSnapshot | null,
  rungs: ExpirationRung[],
  monthEnd: Date,
): ProductionCapacity {
  const monthEndMs = monthEnd.getTime();

  const resolvingRungs: CapacityRung[] = [];
  const beyondRungs: CapacityRung[] = [];
  let resolvingThisMonth = 0;
  let beyondMonthEnd = 0;

  for (const rung of rungs) {
    const expMs = new Date(rung.expiration).getTime();
    const entry: CapacityRung = {
      expiration: rung.expiration,
      dte: rung.dte,
      totalCapital: rung.totalCapital,
      positionCount: rung.positions.length,
    };

    if (expMs <= monthEndMs) {
      resolvingRungs.push(entry);
      resolvingThisMonth += rung.totalCapital;
    } else {
      beyondRungs.push(entry);
      beyondMonthEnd += rung.totalCapital;
    }
  }

  return {
    deployableNow: snapshot?.deployableCash ?? null,
    resolvingThisMonth,
    resolvingRungs,
    beyondMonthEnd,
    beyondRungs,
  };
}
