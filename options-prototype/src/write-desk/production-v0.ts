/**
 * Production v0 — Experimental Cross-Entry Production Rate
 *
 * STATUS: Provisional operational experiment. Not ratified recommendation policy.
 *         Not a learned model. Explicitly a hypothesis for falsification.
 *
 * Formula:
 *   CSP:       experimentalCycleProduction = premiumReceived
 *   Buy-Write: experimentalCycleProduction = premiumReceived + delta × appreciationIfCalled
 *
 *   ProductionV0 = experimentalCycleProduction / capitalDeployed × 30 / DTE
 *
 * Interpretation:
 *   Experimental monthly production rate per dollar of deployed capital.
 *
 * Explicit assumptions:
 *   1. Delta is used as a realization proxy, not asserted as assignment probability.
 *   2. Buy-Write appreciation is conditional (only realized if called away).
 *   3. Buy-Write downside while shares remain owned is NOT modeled.
 *   4. Execution quality remains a gate / independent evidence, not a production multiplier.
 *   5. Governance and affordability remain gates (filtered before scoring).
 *   6. This is NOT a prediction of realized return.
 *
 * Epistemic placement: Operational Interpretation
 *   Synthesizes Level 1 evidence (premium, delta, appreciation, capital, DTE)
 *   through an explicitly stated interpretive hypothesis.
 */

import type { PutCandidate } from "./scan-orchestrator";
import type { BuyWriteCandidate } from "./recommend-buy-writes";

// --- Production v0 Result ---

export interface ProductionV0Decomposition {
  /** "csp" or "buy-write" */
  entryMechanism: "csp" | "buy-write";
  /** Premium received in dollars (mid × 100) */
  premiumDollars: number;
  /** Conditional appreciation in dollars (signed; zero for CSP) */
  appreciationDollars: number;
  /** Delta used as realization proxy (0 for CSP since premium is certain) */
  deltaProxy: number;
  /** Delta-weighted appreciation: delta × appreciationDollars */
  conditionalAppreciationContribution: number;
  /** Total experimental cycle production in dollars */
  experimentalCycleProduction: number;
  /** Capital deployed in dollars */
  capitalDeployed: number;
  /** DTE of the deployment */
  dte: number;
  /** Raw cycle production rate (before monthly normalization) */
  cycleRate: number;
  /** Production v0: monthly production rate (× 30/DTE) as percentage */
  productionV0: number;
}

// --- Cross-Entry Row (display projection) ---

export interface CrossEntryRow {
  entryMechanism: "csp" | "buy-write";
  symbol: string;
  expiration: string;
  dte: number;
  strike: number;
  delta: number;
  /** Annualized premium yield (for sanity-check column) */
  premiumYieldAnnualized: number;
  /** Production v0 monthly rate */
  productionV0: number;
  /** Full decomposition */
  decomposition: ProductionV0Decomposition;
  /** Capital required */
  capitalRequired: number;
  /** Cash remaining after deployment */
  cashRemaining: number;
  /** Execution quality score */
  executionScore: number;
  /** Posture */
  posture: string;
  /** Reference to original candidate (for drawer dispatch) */
  originalPut: PutCandidate | null;
  originalBuyWrite: BuyWriteCandidate | null;
}

// --- Computation ---

/**
 * Compute Production v0 for a Cash-Secured Put candidate.
 */
export function computeProductionV0ForCSP(candidate: PutCandidate): ProductionV0Decomposition {
  const premiumDollars = candidate.mid * 100;
  const capitalDeployed = candidate.cashRequired;
  const dte = candidate.dte;

  const experimentalCycleProduction = premiumDollars;
  const cycleRate = capitalDeployed > 0 ? experimentalCycleProduction / capitalDeployed : 0;
  const productionV0 = dte > 0 ? cycleRate * (30 / dte) * 100 : 0;

  return {
    entryMechanism: "csp",
    premiumDollars,
    appreciationDollars: 0,
    deltaProxy: 0,
    conditionalAppreciationContribution: 0,
    experimentalCycleProduction,
    capitalDeployed,
    dte,
    cycleRate,
    productionV0,
  };
}

/**
 * Compute Production v0 for a Buy-Write candidate.
 *
 * appreciationIfCalled = (callStrike - acquisitionPrice) × 100
 * This is signed: negative when strike < price (capital erosion on call-away branch).
 */
export function computeProductionV0ForBuyWrite(candidate: BuyWriteCandidate): ProductionV0Decomposition {
  const premiumDollars = candidate.mid * 100;
  const appreciationDollars = (candidate.strike - candidate.underlyingPrice) * 100;
  const deltaProxy = candidate.delta;
  const conditionalAppreciationContribution = deltaProxy * appreciationDollars;

  const experimentalCycleProduction = premiumDollars + conditionalAppreciationContribution;
  const capitalDeployed = candidate.capitalRequired;
  const dte = candidate.dte;

  const cycleRate = capitalDeployed > 0 ? experimentalCycleProduction / capitalDeployed : 0;
  const productionV0 = dte > 0 ? cycleRate * (30 / dte) * 100 : 0;

  return {
    entryMechanism: "buy-write",
    premiumDollars,
    appreciationDollars,
    deltaProxy,
    conditionalAppreciationContribution,
    experimentalCycleProduction,
    capitalDeployed,
    dte,
    cycleRate,
    productionV0,
  };
}

// --- Cross-Entry Projection ---

/**
 * Build a unified cross-entry row list from CSP and Buy-Write candidates.
 *
 * Filters: ACTIONABLE + EDGE only, affordable only, governance authorized/review only.
 * Returns the FULL eligible population sorted by Production v0 (descending).
 * Display truncation (maxRows) is a presentation concern applied after active UI sort.
 */
export function buildCrossEntryRows(
  putCandidates: PutCandidate[],
  buyWriteCandidates: BuyWriteCandidate[],
): CrossEntryRow[] {
  const rows: CrossEntryRow[] = [];

  // CSP candidates — ACTIONABLE + EDGE, affordable, not danger governance
  for (const c of putCandidates) {
    if (c.posture !== "ACTIONABLE" && c.posture !== "EDGE") continue;
    if (!c.affordable) continue;
    if (c.governance.status === "danger") continue;

    const decomposition = computeProductionV0ForCSP(c);
    rows.push({
      entryMechanism: "csp",
      symbol: c.symbol,
      expiration: c.expiration,
      dte: c.dte,
      strike: c.strike,
      delta: Math.abs(c.delta),
      premiumYieldAnnualized: c.yieldAnnualized,
      productionV0: decomposition.productionV0,
      decomposition,
      capitalRequired: c.cashRequired,
      cashRemaining: c.cashRemaining,
      executionScore: c.assessment.score,
      posture: c.posture,
      originalPut: c,
      originalBuyWrite: null,
    });
  }

  // Buy-Write candidates — ACTIONABLE + EDGE, affordable, not danger governance
  for (const c of buyWriteCandidates) {
    if (c.posture !== "ACTIONABLE" && c.posture !== "EDGE") continue;
    if (!c.affordable) continue;
    if (c.governance.status === "danger") continue;

    const decomposition = computeProductionV0ForBuyWrite(c);
    rows.push({
      entryMechanism: "buy-write",
      symbol: c.symbol,
      expiration: c.expiration,
      dte: c.dte,
      strike: c.strike,
      delta: c.delta,
      premiumYieldAnnualized: c.premiumYieldAnnualized,
      productionV0: decomposition.productionV0,
      decomposition,
      capitalRequired: c.capitalRequired,
      cashRemaining: c.cashRemaining,
      executionScore: c.assessment.score,
      posture: c.posture,
      originalPut: null,
      originalBuyWrite: c,
    });
  }

  // Sort by Production v0 descending (natural/default order)
  rows.sort((a, b) => b.productionV0 - a.productionV0);

  return rows;
}


// --- Diagnostic Export ---

export interface CrossEntryExportRow {
  rank: number;
  entryMechanism: "csp" | "buy-write";
  symbol: string;
  expiration: string;
  dte: number;
  strike: number;
  delta: number;
  // Decomposition
  premiumDollars: number;
  appreciationIfCalledDollars: number;
  deltaProxy: number;
  deltaWeightedAppreciation: number;
  experimentalCycleProduction: number;
  capitalDeployed: number;
  // Rates
  premiumOnlyMonthlyRate: number;
  productionV0: number;
  appreciationBoostPoints: number;
  // Context
  premiumYieldAnnualized: number;
  executionScore: number;
  posture: string;
  governance: string;
  affordable: boolean;
  cashRemaining: number;
}

export interface CrossEntryExportPayload {
  exportedAt: string;
  experimentLabel: "Production v0";
  formula: "CSP: premium / capital × 30/DTE | BW: (premium + Δ × appreciation) / capital × 30/DTE";
  assumptions: string[];
  policy: {
    targetDelta: number;
    admissibleDeltaRange: { min: number; max: number };
    eligibleDteRange: { min: number; max: number };
    executionActionableFloor: number;
    executionEdgeFloor: number;
  };
  totalCandidates: number;
  cspCount: number;
  buyWriteCount: number;
  bestCSP: CrossEntryExportRow | null;
  bestBuyWrite: CrossEntryExportRow | null;
  rows: CrossEntryExportRow[];
}

/**
 * Build a full diagnostic export of the cross-entry population.
 *
 * Unlike buildCrossEntryRows (which caps at maxRows for display),
 * this returns the COMPLETE population with full decomposition for analysis.
 */
export function buildCrossEntryExport(
  putCandidates: PutCandidate[],
  buyWriteCandidates: BuyWriteCandidate[],
  policy: { targetDelta: number; admissibleDeltaRange: { min: number; max: number }; eligibleDteRange: { min: number; max: number }; executionActionableFloor: number; executionEdgeFloor: number }
): CrossEntryExportPayload {
  const rows: CrossEntryExportRow[] = [];

  // CSP candidates
  for (const c of putCandidates) {
    if (c.posture !== "ACTIONABLE" && c.posture !== "EDGE") continue;
    if (!c.affordable) continue;
    if (c.governance.status === "danger") continue;

    const decomp = computeProductionV0ForCSP(c);
    const premiumOnlyMonthly = decomp.productionV0; // For CSP, they're the same
    rows.push({
      rank: 0,
      entryMechanism: "csp",
      symbol: c.symbol,
      expiration: c.expiration,
      dte: c.dte,
      strike: c.strike,
      delta: Math.abs(c.delta),
      premiumDollars: decomp.premiumDollars,
      appreciationIfCalledDollars: 0,
      deltaProxy: 0,
      deltaWeightedAppreciation: 0,
      experimentalCycleProduction: decomp.experimentalCycleProduction,
      capitalDeployed: decomp.capitalDeployed,
      premiumOnlyMonthlyRate: premiumOnlyMonthly,
      productionV0: decomp.productionV0,
      appreciationBoostPoints: 0,
      premiumYieldAnnualized: c.yieldAnnualized,
      executionScore: c.assessment.score,
      posture: c.posture,
      governance: c.governance.status,
      affordable: c.affordable,
      cashRemaining: c.cashRemaining,
    });
  }

  // Buy-Write candidates
  for (const c of buyWriteCandidates) {
    if (c.posture !== "ACTIONABLE" && c.posture !== "EDGE") continue;
    if (!c.affordable) continue;
    if (c.governance.status === "danger") continue;

    const decomp = computeProductionV0ForBuyWrite(c);
    const premiumOnlyMonthly = decomp.premiumDollars / decomp.capitalDeployed * 30 / decomp.dte * 100;
    rows.push({
      rank: 0,
      entryMechanism: "buy-write",
      symbol: c.symbol,
      expiration: c.expiration,
      dte: c.dte,
      strike: c.strike,
      delta: c.delta,
      premiumDollars: decomp.premiumDollars,
      appreciationIfCalledDollars: decomp.appreciationDollars,
      deltaProxy: decomp.deltaProxy,
      deltaWeightedAppreciation: decomp.conditionalAppreciationContribution,
      experimentalCycleProduction: decomp.experimentalCycleProduction,
      capitalDeployed: decomp.capitalDeployed,
      premiumOnlyMonthlyRate: premiumOnlyMonthly,
      productionV0: decomp.productionV0,
      appreciationBoostPoints: decomp.productionV0 - premiumOnlyMonthly,
      premiumYieldAnnualized: c.premiumYieldAnnualized,
      executionScore: c.assessment.score,
      posture: c.posture,
      governance: c.governance.status,
      affordable: c.affordable,
      cashRemaining: c.cashRemaining,
    });
  }

  // Sort by productionV0 descending and assign ranks
  rows.sort((a, b) => b.productionV0 - a.productionV0);
  rows.forEach((r, i) => { r.rank = i + 1; });

  const cspRows = rows.filter(r => r.entryMechanism === "csp");
  const bwRows = rows.filter(r => r.entryMechanism === "buy-write");

  return {
    exportedAt: new Date().toISOString(),
    experimentLabel: "Production v0",
    formula: "CSP: premium / capital × 30/DTE | BW: (premium + Δ × appreciation) / capital × 30/DTE",
    assumptions: [
      "Delta used as realization proxy, not asserted as assignment probability",
      "Buy-Write appreciation is conditional (only realized if called away)",
      "Buy-Write downside while shares remain owned is NOT modeled",
      "Execution quality is a gate, not a production multiplier",
      "Governance and affordability are gates (filtered before scoring)",
      "This is NOT a prediction of realized return",
    ],
    policy,
    totalCandidates: rows.length,
    cspCount: cspRows.length,
    buyWriteCount: bwRows.length,
    bestCSP: cspRows[0] ?? null,
    bestBuyWrite: bwRows[0] ?? null,
    rows,
  };
}
