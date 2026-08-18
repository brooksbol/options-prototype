/**
 * Production Outlook — V1 Planning-Grade Estimate
 *
 * Composes recognized production (from backend ProductionAssessor) with
 * Economic Consequence amounts from positions whose Resolution Outlook
 * is directionally assessable.
 *
 * Architecture:
 *   Recognized Production + (Resolution Outlook → Economic Consequence) = Production Outlook
 *
 * Design:
 *   docs/27-resolution-outlook-v1.md
 *
 * ADR-014 invariants preserved:
 *   - Premium recognized at receipt is never re-counted at expiration
 *   - "Likely expires OTM" for a put produces NO additional production
 *   - "Likely assigned" for a call/buy-write includes only appreciation, not premium
 *   - Resolving capital is context, not production
 *   - No assumed redeployment, no extrapolation, no fabricated income
 *
 * Pure function. No React, no side effects.
 */

/**
 * Rounding increment for base estimate display.
 * Provisional presentation parameter — may be adjusted based on
 * live operator experience. $500 chosen as starting value;
 * $1,000 may prove more appropriate for Bridge Income planning.
 */
export const DISPLAY_ROUNDING_INCREMENT = 500;

import type { MonitoredPosition } from "../portfolio/position-monitoring";
import type { PortfolioSnapshot, InventoryPosition } from "../write-desk/types";
import type { ProductionAssessmentResponse } from "../production/production-types";
import type { ResolutionOutlook, ResolutionCategory } from "./resolution-outlook";
import {
  type OptionBasisInput,
  type CallAssignmentConsequence,
  deriveCallAssignmentConsequence,
} from "../portfolio/assignment-consequence";

// --- Types ---

export interface PositionContribution {
  /** Position identifier */
  positionId: string;
  /** Underlying symbol */
  underlying: string;
  /** Position type */
  type: "put" | "call" | "buy-write";
  /** Resolution classification */
  category: ResolutionCategory;
  /** Dollar amount this position contributes to the outlook (may be 0) */
  amount: number;
  /** Whether this amount could be computed */
  computable: boolean;
  /** Human-readable explanation */
  explanation: string;
}

export interface ProductionOutlook {
  /** Calendar month being assessed */
  month: string;
  /** Human-readable month label */
  monthLabel: string;

  // --- Factual floor ---

  /** Known production from backend assessment (factual, cannot decrease) */
  recognizedProduction: number;

  // --- Likely additional ---

  /** Sum of likely additional production from directionally classified positions */
  likelyAdditional: number;
  /** Per-position breakdown of likely contributions */
  likelyContributions: PositionContribution[];

  // --- Base estimate ---

  /** Recognized + likely additional, rounded per Epistemic Precision */
  baseEstimate: number;
  /** Base estimate rounded to nearest $500 for display */
  baseEstimateRounded: number;

  // --- Uncertain range ---

  /** Number of positions classified as uncertain */
  uncertainCount: number;
  /** Maximum additional production if all uncertain positions were assigned */
  uncertainUpside: number;
  /** Per-position breakdown of uncertain contributions */
  uncertainContributions: PositionContribution[];

  // --- Context ---

  /** Positions expiring beyond month-end (not classified, shown as context) */
  beyondMonthCount: number;
  /** Positions with missing evidence (subset of uncertain) */
  missingEvidenceCount: number;

  // --- Provenance ---

  /** When this outlook was computed */
  computedAt: string;
  /** Evidence date from the production assessment */
  productionEvidenceThrough: string | null;
  /** Portfolio snapshot date */
  snapshotDate: string | null;
}

// --- Derivation ---

/**
 * Derive the Production Outlook from recognized production + Resolution Outlook
 * classifications + Economic Consequence.
 *
 * Key semantic:
 *   - Puts: assignment changes capital form (cash → shares), NOT additional production.
 *     Premium was already recognized. "Likely assigned" put contributes $0 additional.
 *   - Calls/Buy-writes: assignment produces appreciation (strike − basis × shares).
 *     This IS additional production if positive.
 *   - "Likely expires OTM": no additional production regardless of position type.
 */
export function deriveProductionOutlook(
  assessment: ProductionAssessmentResponse | null,
  outlooks: ResolutionOutlook[],
  positions: MonitoredPosition[],
  snapshot: PortfolioSnapshot | null,
  today: Date = new Date(),
): ProductionOutlook {
  const computedAt = today.toISOString();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthLabel = today.toLocaleString("en-US", { month: "long", year: "numeric" });

  // Recognized production from backend
  const recognizedProduction = assessment?.knownCashProduction ?? 0;
  const productionEvidenceThrough = assessment?.period ?? null;
  const snapshotDate = snapshot?.snapshotDate ?? null;

  // Build lookup maps
  const positionById = new Map<string, MonitoredPosition>();
  for (const pos of positions) {
    positionById.set(pos.id, pos);
  }

  const inventoryBySymbol = new Map<string, InventoryPosition>();
  if (snapshot) {
    for (const inv of snapshot.inventory) {
      inventoryBySymbol.set(inv.symbol.toUpperCase(), inv);
    }
  }

  // Classify contributions
  const likelyContributions: PositionContribution[] = [];
  const uncertainContributions: PositionContribution[] = [];
  let likelyAdditional = 0;
  let uncertainUpside = 0;
  let uncertainCount = 0;
  let beyondMonthCount = 0;
  let missingEvidenceCount = 0;

  for (const outlook of outlooks) {
    const position = positionById.get(outlook.positionId);
    if (!position) continue;

    if (!outlook.expiresThisMonth) {
      beyondMonthCount++;
      continue;
    }

    if (outlook.evidence.moneyness == null) {
      missingEvidenceCount++;
    }

    // Compute the additional production this position would generate if assigned
    const additionalIfAssigned = computeAdditionalProduction(position, snapshot, inventoryBySymbol);

    if (outlook.category === "likely-assigned") {
      likelyContributions.push({
        positionId: outlook.positionId,
        underlying: position.underlying,
        type: position.type,
        category: outlook.category,
        amount: additionalIfAssigned.amount,
        computable: additionalIfAssigned.computable,
        explanation: additionalIfAssigned.explanation,
      });
      likelyAdditional += additionalIfAssigned.amount;
    } else if (outlook.category === "uncertain") {
      uncertainCount++;
      uncertainContributions.push({
        positionId: outlook.positionId,
        underlying: position.underlying,
        type: position.type,
        category: outlook.category,
        amount: additionalIfAssigned.amount,
        computable: additionalIfAssigned.computable,
        explanation: additionalIfAssigned.explanation,
      });
      uncertainUpside += additionalIfAssigned.amount;
    }
    // "likely-expires-otm" contributes nothing — premium already recognized
  }

  // Base estimate
  const baseEstimate = recognizedProduction + likelyAdditional;
  const baseEstimateRounded = roundToNearest(baseEstimate, DISPLAY_ROUNDING_INCREMENT);

  return {
    month: monthStr,
    monthLabel,
    recognizedProduction,
    likelyAdditional,
    likelyContributions,
    baseEstimate,
    baseEstimateRounded,
    uncertainCount,
    uncertainUpside,
    uncertainContributions,
    beyondMonthCount,
    missingEvidenceCount,
    computedAt,
    productionEvidenceThrough,
    snapshotDate,
  };
}

// --- Internal ---

interface AdditionalProductionResult {
  amount: number;
  computable: boolean;
  explanation: string;
}

/**
 * Compute the additional production a position would generate if assigned.
 *
 * Semantic:
 *   - Puts: $0 — assignment changes form, premium already recognized.
 *   - Calls/Buy-writes: appreciation (strike − basis × shares) if positive.
 *     Erosion (negative appreciation) is also included as negative contribution
 *     because assignment would REDUCE net production via capital erosion.
 */
function computeAdditionalProduction(
  position: MonitoredPosition,
  snapshot: PortfolioSnapshot | null,
  inventoryBySymbol: Map<string, InventoryPosition>,
): AdditionalProductionResult {
  // Puts produce no additional production — form change only
  if (position.type === "put") {
    return {
      amount: 0,
      computable: true,
      explanation: "Put assignment changes capital form (cash → shares); premium already recognized",
    };
  }

  // Calls / Buy-writes: appreciation = (strike - basis) × shares
  if (!snapshot) {
    return {
      amount: 0,
      computable: false,
      explanation: "No portfolio snapshot available for basis lookup",
    };
  }

  const inventory = inventoryBySymbol.get(position.underlying.toUpperCase()) ?? null;
  const optionBasis = resolveOptionBasis(position, snapshot);
  const consequence = deriveCallAssignmentConsequence(position, inventory, optionBasis);

  if (consequence.totalAppreciationOrErosion.value == null) {
    return {
      amount: 0,
      computable: false,
      explanation: `Cannot compute appreciation — share basis unavailable for ${position.underlying}`,
    };
  }

  const appreciation = consequence.totalAppreciationOrErosion.value;
  if (appreciation > 0) {
    return {
      amount: appreciation,
      computable: true,
      explanation: `Appreciation if called: $${appreciation.toFixed(0)} (${position.quantity} × 100 shares × $${consequence.appreciationPerShare.value?.toFixed(2)}/share)`,
    };
  } else {
    // Erosion — assignment would realize a capital loss
    return {
      amount: appreciation, // negative
      computable: true,
      explanation: `Erosion if called: -$${Math.abs(appreciation).toFixed(0)} (strike $${position.strike} below basis)`,
    };
  }
}

/**
 * Resolve option basis input for a position from the snapshot.
 * (Same logic as consequence-summary.ts — shared pattern)
 */
function resolveOptionBasis(position: MonitoredPosition, snapshot: PortfolioSnapshot): OptionBasisInput {
  if (position.type === "call" || position.type === "buy-write") {
    const match = snapshot.existingCalls.find(
      c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
        && c.strike === position.strike
        && c.expiration === position.expiration
    );
    return {
      brokerOptionBasis: match?.brokerOptionBasis ?? null,
      brokerOptionAverageCost: match?.brokerOptionAverageCost ?? null,
    };
  } else {
    const match = snapshot.existingPuts.find(
      p => p.underlying.toUpperCase() === position.underlying.toUpperCase()
        && p.strike === position.strike
        && p.expiration === position.expiration
    );
    return {
      brokerOptionBasis: match?.brokerOptionBasis ?? null,
      brokerOptionAverageCost: match?.brokerOptionAverageCost ?? null,
    };
  }
}

/**
 * Round a number to the nearest increment.
 * Used for Epistemic Precision: display precision commensurate with evidence.
 */
function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}
