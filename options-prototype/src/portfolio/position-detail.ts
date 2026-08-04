/**
 * Position Detail — Enriched model for the position-detail modal.
 *
 * Composes data from multiple sources into a single view-ready structure.
 * Each fact carries provenance so the presentation layer can distinguish
 * what is real vs synthetic.
 *
 * Sources:
 *   observed  — backed by current imported/evidence data
 *   derived   — mechanically calculated from observed facts
 *   demo      — synthetic data supplied for demo experience evaluation
 *   unavailable — genuinely not available in current source/projection
 *
 * Architecture principle:
 *   Absence from the current projection is not evidence of absence
 *   from the source domain. This model designs toward the richer future
 *   experience; demo mode fills gaps with consistent synthetic values
 *   that can later be replaced by real Activity History projections.
 */

import type { MonitoredPosition } from "./position-monitoring";
import type { InventoryPosition, BalanceContext } from "../write-desk/types";

// --- Provenance ---

export type FactProvenance = "observed" | "derived" | "demo" | "unavailable";

export interface ProvenancedFact<T> {
  value: T;
  provenance: FactProvenance;
}

/** Helper: create a provenanced fact */
export function fact<T>(value: T, provenance: FactProvenance): ProvenancedFact<T> {
  return { value, provenance };
}

/** Helper: unavailable fact */
export function unavailable<T>(): ProvenancedFact<T | null> {
  return { value: null, provenance: "unavailable" };
}

// --- Position Economics ---

export interface PositionOpeningEconomics {
  /** Premium received per contract (e.g., $2.63) */
  premiumPerContract: ProvenancedFact<number | null>;
  /** Total gross premium (premium × 100 × quantity) */
  grossPremium: ProvenancedFact<number | null>;
  /** Transaction fees */
  fees: ProvenancedFact<number | null>;
  /** Net premium after fees */
  netPremium: ProvenancedFact<number | null>;
  /** Premium return relative to encumbered capital (annualized or raw) */
  premiumReturnOnCapital: ProvenancedFact<number | null>;
  /** When the position was opened (ISO date) */
  openedAt: ProvenancedFact<string | null>;
}

// --- Assignment Scenario ---

export interface PutAssignmentScenario {
  type: "put";
  /** Shares that would be acquired */
  sharesAcquired: number;
  /** Price per share at assignment */
  assignmentPrice: number;
  /** Total cash consumed */
  grossCashConsumed: number;
  /** Premium received (offsets effective cost) */
  premiumReceived: ProvenancedFact<number | null>;
  /** Effective acquisition basis: strike - premium/share */
  effectiveBasis: ProvenancedFact<number | null>;
  /** Existing inventory for this underlying */
  existingShares: number | null;
  /** Resulting total shares after assignment */
  resultingShares: number | null;
  /** Blended cost basis (existing + new) */
  blendedCostBasis: ProvenancedFact<number | null>;
  /** Resulting free shares (not encumbered by calls) */
  resultingFreeShares: number | null;
  /** Additional covered-call lots created */
  additionalCallLots: number | null;
}

export interface CallAssignmentScenario {
  type: "call";
  /** Shares called away */
  sharesCalledAway: number;
  /** Sale price per share (= strike) */
  salePrice: number;
  /** Gross sale proceeds */
  grossProceeds: number;
  /** Premium received on this call */
  premiumReceived: ProvenancedFact<number | null>;
  /** Cost basis per share of the underlying */
  costBasisPerShare: ProvenancedFact<number | null>;
  /** Appreciation/loss per share at strike: strike - costBasis */
  shareGainLoss: ProvenancedFact<number | null>;
  /** Total economic result: (strike - costBasis) × shares + premium */
  totalEconomicResult: ProvenancedFact<number | null>;
  /** Classification of the call-away outcome */
  callAwayClassification: ProvenancedFact<"appreciation" | "near-basis" | "below-basis" | null>;
  /** Remaining shares after assignment */
  remainingShares: number | null;
  /** Remaining covered-call capacity */
  remainingCallLots: number | null;
  /** Shares still encumbered by other calls */
  sharesStillEncumbered: number | null;
}

export type AssignmentScenario = PutAssignmentScenario | CallAssignmentScenario;

// --- Full Position Detail ---

export interface PositionDetail {
  /** The enriched monitored position (contract state + moneyness) */
  position: MonitoredPosition;

  // --- Market State ---

  /** Dollar distance from strike (absolute, always positive) */
  dollarDistanceFromStrike: ProvenancedFact<number | null>;

  // --- Position Economics ---

  /** Opening economics (premium, fees, net premium) */
  economics: PositionOpeningEconomics;

  // --- If Assigned ---

  /** Assignment scenario — mechanical portfolio consequences */
  assignmentScenario: AssignmentScenario;

  // --- Context ---

  /** Inventory for this underlying (null if no existing position) */
  inventory: InventoryPosition | null;

  /** Account-level balance context */
  balanceContext: BalanceContext | null;

  /** What facts are missing and why */
  missingFacts: string[];
}

// --- Builder ---

/**
 * Build a PositionDetail for the modal.
 *
 * Composes MonitoredPosition + portfolio context + optional demo economics
 * into the full detail model. Demo economics are only supplied for demo-sourced
 * portfolios; real Fidelity positions use only actually-imported data.
 */
export function buildPositionDetail(
  position: MonitoredPosition,
  inventory: InventoryPosition | null,
  balanceContext: BalanceContext | null,
  demoEconomics?: DemoPositionEconomics | null,
): PositionDetail {
  const missingFacts: string[] = [];

  // Dollar distance from strike
  const dollarDistance = position.underlyingPrice != null
    ? fact(Math.abs(position.underlyingPrice - position.strike), "derived")
    : unavailable<number>();

  // Opening economics
  const economics = buildOpeningEconomics(position, demoEconomics, missingFacts);

  // Assignment scenario
  const assignmentScenario = buildAssignmentScenario(position, inventory, economics, demoEconomics);

  return {
    position,
    dollarDistanceFromStrike: dollarDistance,
    economics,
    assignmentScenario,
    inventory,
    balanceContext,
    missingFacts,
  };
}

// --- Demo Economics Input ---

/**
 * Synthetic economics for demo positions.
 * These represent plausible values that would come from Activity History.
 */
export interface DemoPositionEconomics {
  premiumPerContract: number;
  fees: number;
  openedAt: string;
  /** For calls: cost basis per share of the underlying inventory */
  costBasisPerShare?: number;
}

// --- Internal Builders ---

function buildOpeningEconomics(
  position: MonitoredPosition,
  demo: DemoPositionEconomics | null | undefined,
  missingFacts: string[],
): PositionOpeningEconomics {
  if (demo) {
    const gross = demo.premiumPerContract * 100 * position.quantity;
    const net = gross - demo.fees;
    const returnOnCapital = position.encumberedCapital != null && position.encumberedCapital > 0
      ? net / position.encumberedCapital
      : null;

    return {
      premiumPerContract: fact(demo.premiumPerContract, "demo"),
      grossPremium: fact(gross, "demo"),
      fees: fact(demo.fees, "demo"),
      netPremium: fact(net, "demo"),
      premiumReturnOnCapital: fact(returnOnCapital, "demo"),
      openedAt: fact(demo.openedAt, "demo"),
    };
  }

  // Real mode: economics not yet available from current ingestion
  missingFacts.push("Premium received (requires Activity History ingestion)");
  missingFacts.push("Opening transaction date");
  return {
    premiumPerContract: unavailable(),
    grossPremium: unavailable(),
    fees: unavailable(),
    netPremium: unavailable(),
    premiumReturnOnCapital: unavailable(),
    openedAt: unavailable(),
  };
}

function buildAssignmentScenario(
  position: MonitoredPosition,
  inventory: InventoryPosition | null,
  economics: PositionOpeningEconomics,
  demo: DemoPositionEconomics | null | undefined,
): AssignmentScenario {
  const sharesTransacted = position.quantity * 100;

  if (position.type === "put") {
    const grossCash = position.strike * 100 * position.quantity;
    const existingShares = inventory?.sharesOwned ?? null;
    const resultingShares = existingShares != null ? existingShares + sharesTransacted : null;
    const resultingFreeShares = resultingShares != null && inventory
      ? resultingShares - inventory.sharesEncumbered
      : null;
    const additionalCallLots = resultingFreeShares != null
      ? Math.floor(resultingFreeShares / 100) - (inventory?.maxAdditionalContracts ?? 0)
      : null;

    // Effective basis = strike - premium per share
    const premiumPerShare = economics.premiumPerContract.value != null
      ? economics.premiumPerContract.value
      : null;
    const effectiveBasis = premiumPerShare != null
      ? fact(position.strike - premiumPerShare, economics.premiumPerContract.provenance)
      : unavailable<number>();

    // Blended cost basis
    let blendedCostBasis: ProvenancedFact<number | null> = unavailable();
    if (inventory?.economics?.costBasis != null && existingShares != null && resultingShares != null && effectiveBasis.value != null) {
      const existingTotal = inventory.economics.costBasis;
      const newTotal = effectiveBasis.value * sharesTransacted;
      blendedCostBasis = fact((existingTotal + newTotal) / resultingShares, effectiveBasis.provenance);
    }

    return {
      type: "put",
      sharesAcquired: sharesTransacted,
      assignmentPrice: position.strike,
      grossCashConsumed: grossCash,
      premiumReceived: economics.netPremium,
      effectiveBasis,
      existingShares,
      resultingShares,
      blendedCostBasis,
      resultingFreeShares,
      additionalCallLots,
    };
  } else {
    // Call assignment
    const grossProceeds = position.strike * 100 * position.quantity;
    const remainingShares = inventory != null ? inventory.sharesOwned - sharesTransacted : null;
    const sharesStillEncumbered = inventory != null
      ? Math.max(0, inventory.sharesEncumbered - sharesTransacted)
      : null;
    const remainingCallLots = remainingShares != null
      ? Math.floor(Math.max(0, remainingShares - (sharesStillEncumbered ?? 0)) / 100)
      : null;

    // Cost basis per share
    let costBasisPerShare: ProvenancedFact<number | null>;
    if (demo?.costBasisPerShare != null) {
      costBasisPerShare = fact(demo.costBasisPerShare, "demo");
    } else if (inventory?.economics?.averageCostPerShare != null) {
      costBasisPerShare = fact(inventory.economics.averageCostPerShare, "observed");
    } else {
      costBasisPerShare = unavailable();
    }

    // Share gain/loss at strike
    let shareGainLoss: ProvenancedFact<number | null> = unavailable();
    let totalEconomicResult: ProvenancedFact<number | null> = unavailable();
    let callAwayClassification: ProvenancedFact<"appreciation" | "near-basis" | "below-basis" | null> = unavailable();

    if (costBasisPerShare.value != null) {
      const perShareGL = position.strike - costBasisPerShare.value;
      shareGainLoss = fact(perShareGL * sharesTransacted, costBasisPerShare.provenance);

      const premiumValue = economics.netPremium.value ?? 0;
      const total = (perShareGL * sharesTransacted) + premiumValue;
      totalEconomicResult = fact(total, costBasisPerShare.provenance);

      // Classification
      const pctFromBasis = perShareGL / costBasisPerShare.value;
      let classification: "appreciation" | "near-basis" | "below-basis";
      if (pctFromBasis > 0.02) classification = "appreciation";
      else if (pctFromBasis < -0.02) classification = "below-basis";
      else classification = "near-basis";
      callAwayClassification = fact(classification, costBasisPerShare.provenance);
    }

    return {
      type: "call",
      sharesCalledAway: sharesTransacted,
      salePrice: position.strike,
      grossProceeds,
      premiumReceived: economics.netPremium,
      costBasisPerShare,
      shareGainLoss,
      totalEconomicResult,
      callAwayClassification,
      remainingShares,
      remainingCallLots,
      sharesStillEncumbered,
    };
  }
}
