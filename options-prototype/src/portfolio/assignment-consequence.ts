/**
 * Assignment Consequence — Canonical Decomposition (ADR-013 Dimension 3)
 *
 * Derives the mechanical and economic consequences of assignment for a
 * monitored option position. Produces a decomposed model preserving
 * independent economic components rather than collapsing to a single P/L.
 *
 * Design invariants:
 * - brokerOptionBasis is preserved as the observed fact (negative = credit)
 * - premiumCredit is derived from brokerOptionBasis (positive = credit amount)
 * - Call appreciation/erosion excludes the option credit (separate components)
 * - Put acquisition principal remains strike × shares (not premium-adjusted)
 * - Analytical effective basis/exit become unavailable when inputs are missing
 * - No composite economic measure replaces the decomposed components
 * - No classification, no judgment, no situation interpretation
 *
 * Pure function. No React, no side effects.
 */

import type { MonitoredPosition } from "./position-monitoring";
import type { InventoryPosition } from "../write-desk/types";
import { type ProvenancedFact, type FactProvenance, fact, unavailable } from "./position-detail";

// --- Types ---

export interface OptionBasisInput {
  /** Broker-reported option cost basis (negative = credit). From Fidelity Option Summary. */
  brokerOptionBasis: number | null;
  /** Broker-reported average cost per contract (negative = credit/share). */
  brokerOptionAverageCost: number | null;
}

export interface CallAssignmentConsequence {
  type: "call";

  // --- Principal movement ---
  /** Shares removed from inventory */
  sharesRemoved: number;
  /** Cash received at strike price */
  cashProceeds: number;
  /** Sale price per share (= strike) */
  salePricePerShare: number;

  // --- Capital appreciation/erosion (strike vs. broker share basis) ---
  /** Broker-reported cost basis per share for the underlying */
  brokerShareBasis: ProvenancedFact<number | null>;
  /** Appreciation (positive) or erosion (negative) per share: strike - basis */
  appreciationPerShare: ProvenancedFact<number | null>;
  /** Total appreciation or erosion: (strike - basis) × shares */
  totalAppreciationOrErosion: ProvenancedFact<number | null>;

  // --- Option premium component (shown separately) ---
  /** Raw broker-reported option basis (negative = credit). Observed fact. */
  brokerOptionBasis: ProvenancedFact<number | null>;
  /** Premium credit: Math.abs(brokerOptionBasis). Derived economic interpretation. */
  premiumCredit: ProvenancedFact<number | null>;
  /** Premium credit per share: Math.abs(brokerOptionAverageCost). Derived. */
  premiumCreditPerShare: ProvenancedFact<number | null>;

  // --- Analytical derivation (secondary, labeled) ---
  /** Effective exit price: strike + credit/share. Wheelwright analytical measure. */
  effectiveExitPrice: ProvenancedFact<number | null>;

  // --- State transformation ---
  /** Shares that leave the portfolio (= sharesRemoved) */
  sharesLeavingInventory: number;
  /** Call encumbrance resolved: these shares no longer back a short call */
  callEncumbranceResolved: number;
  /** Existing shares before assignment (null if no inventory) */
  existingShares: number | null;
  /** Resulting shares after removal */
  resultingShares: number | null;
}

export interface PutAssignmentConsequence {
  type: "put";

  // --- Principal movement ---
  /** Cash consumed to acquire shares */
  cashConsumed: number;
  /** Shares acquired */
  sharesAcquired: number;
  /** Acquisition price per share (= strike) */
  acquisitionPricePerShare: number;

  // --- Option premium component (shown separately) ---
  /** Raw broker-reported option basis (negative = credit). Observed fact. */
  brokerOptionBasis: ProvenancedFact<number | null>;
  /** Premium credit: Math.abs(brokerOptionBasis). Derived economic interpretation. */
  premiumCredit: ProvenancedFact<number | null>;
  /** Premium credit per share: Math.abs(brokerOptionAverageCost). Derived. */
  premiumCreditPerShare: ProvenancedFact<number | null>;

  // --- Analytical derivation (secondary, labeled) ---
  /** Analytical effective basis: strike - credit/share. Wheelwright analytical measure. */
  analyticalEffectiveBasis: ProvenancedFact<number | null>;

  // --- Market vs effective basis reconciliation ---
  /**
   * Current market price minus analytical effective basis.
   * Positive = market is above effective basis (assignment acquires below market).
   * Negative = market is below effective basis (assignment acquires above market).
   * Reconciles strike-relative capital loss with premium-adjusted position quality.
   * Wheelwright analytical measure — does not alter or replace capital loss or premium.
   */
  marketVsEffectiveBasis: ProvenancedFact<number | null>;

  // --- State transformation ---
  /** Put obligation resolved: cash no longer reserved for this put */
  putObligationResolved: number;
  /** Shares entering inventory */
  sharesCreated: number;
  /** Existing shares of this underlying before assignment */
  existingSharesOfUnderlying: number | null;
  /** Resulting total shares after assignment */
  resultingTotalShares: number | null;
}

export type AssignmentConsequence = CallAssignmentConsequence | PutAssignmentConsequence;

// --- Derivation ---

/**
 * Derive the canonical assignment consequence for a call position.
 *
 * Consumes:
 * - MonitoredPosition (strike, quantity, underlying)
 * - InventoryPosition (broker share basis)
 * - OptionBasisInput (broker-reported option cost basis)
 *
 * Produces a decomposed consequence preserving all components independently.
 */
export function deriveCallAssignmentConsequence(
  position: MonitoredPosition,
  inventory: InventoryPosition | null,
  optionBasis: OptionBasisInput,
): CallAssignmentConsequence {
  const sharesRemoved = position.quantity * 100;
  const cashProceeds = position.strike * sharesRemoved;

  // --- Broker share basis → appreciation/erosion ---
  let brokerShareBasis: ProvenancedFact<number | null>;
  let appreciationPerShare: ProvenancedFact<number | null>;
  let totalAppreciationOrErosion: ProvenancedFact<number | null>;

  if (inventory?.economics?.averageCostPerShare != null) {
    const basis = inventory.economics.averageCostPerShare;
    brokerShareBasis = fact(basis, "observed");
    const perShare = position.strike - basis;
    appreciationPerShare = fact(perShare, "derived");
    totalAppreciationOrErosion = fact(perShare * sharesRemoved, "derived");
  } else {
    brokerShareBasis = unavailable();
    appreciationPerShare = unavailable();
    totalAppreciationOrErosion = unavailable();
  }

  // --- Option premium component ---
  const optionBasisFacts = deriveOptionPremiumComponent(optionBasis);

  // --- Analytical effective exit ---
  let effectiveExitPrice: ProvenancedFact<number | null>;
  if (optionBasisFacts.premiumCreditPerShare.value != null) {
    effectiveExitPrice = fact(position.strike + optionBasisFacts.premiumCreditPerShare.value, "derived");
  } else {
    effectiveExitPrice = unavailable();
  }

  // --- State transformation ---
  const existingShares = inventory?.sharesOwned ?? null;
  const resultingShares = existingShares != null ? existingShares - sharesRemoved : null;

  return {
    type: "call",
    sharesRemoved,
    cashProceeds,
    salePricePerShare: position.strike,
    brokerShareBasis,
    appreciationPerShare,
    totalAppreciationOrErosion,
    ...optionBasisFacts,
    effectiveExitPrice,
    sharesLeavingInventory: sharesRemoved,
    callEncumbranceResolved: sharesRemoved,
    existingShares,
    resultingShares,
  };
}

/**
 * Derive the canonical assignment consequence for a put position.
 *
 * Consumes:
 * - MonitoredPosition (strike, quantity, underlying)
 * - InventoryPosition (existing shares, if any)
 * - OptionBasisInput (broker-reported option cost basis)
 *
 * Produces a decomposed consequence preserving all components independently.
 */
export function derivePutAssignmentConsequence(
  position: MonitoredPosition,
  inventory: InventoryPosition | null,
  optionBasis: OptionBasisInput,
): PutAssignmentConsequence {
  const sharesAcquired = position.quantity * 100;
  const cashConsumed = position.strike * sharesAcquired;

  // --- Option premium component ---
  const optionBasisFacts = deriveOptionPremiumComponent(optionBasis);

  // --- Analytical effective basis ---
  let analyticalEffectiveBasis: ProvenancedFact<number | null>;
  if (optionBasisFacts.premiumCreditPerShare.value != null) {
    analyticalEffectiveBasis = fact(position.strike - optionBasisFacts.premiumCreditPerShare.value, "derived");
  } else {
    analyticalEffectiveBasis = unavailable();
  }

  // --- Market vs effective basis reconciliation ---
  // Compares current underlying price to premium-adjusted acquisition cost.
  // Requires both underlying price and analytical effective basis to be available.
  // Does not alter or replace capital loss or premium — reconciles them.
  let marketVsEffectiveBasis: ProvenancedFact<number | null>;
  if (position.underlyingPrice != null && analyticalEffectiveBasis.value != null) {
    marketVsEffectiveBasis = fact(position.underlyingPrice - analyticalEffectiveBasis.value, "derived");
  } else {
    marketVsEffectiveBasis = unavailable();
  }

  // --- State transformation ---
  const existingSharesOfUnderlying = inventory?.sharesOwned ?? null;
  const resultingTotalShares = existingSharesOfUnderlying != null
    ? existingSharesOfUnderlying + sharesAcquired
    : sharesAcquired;

  return {
    type: "put",
    cashConsumed,
    sharesAcquired,
    acquisitionPricePerShare: position.strike,
    ...optionBasisFacts,
    analyticalEffectiveBasis,
    marketVsEffectiveBasis,
    putObligationResolved: cashConsumed,
    sharesCreated: sharesAcquired,
    existingSharesOfUnderlying,
    resultingTotalShares,
  };
}

// --- Internal helpers ---

interface OptionPremiumComponent {
  brokerOptionBasis: ProvenancedFact<number | null>;
  premiumCredit: ProvenancedFact<number | null>;
  premiumCreditPerShare: ProvenancedFact<number | null>;
}

/**
 * Derive the option premium component from broker-reported basis.
 *
 * The broker reports option basis as a negative number (credit received).
 * premiumCredit is the derived positive interpretation.
 *
 * Epistemic boundary:
 * - brokerOptionBasis: provenance "observed" (Fidelity's reported value, preserved as-is)
 * - premiumCredit: provenance "derived" (semantic interpretation: abs(basis))
 * - premiumCreditPerShare: provenance "derived" (semantic interpretation: abs(averageCost))
 */
function deriveOptionPremiumComponent(optionBasis: OptionBasisInput): OptionPremiumComponent {
  if (optionBasis.brokerOptionBasis == null) {
    return {
      brokerOptionBasis: unavailable(),
      premiumCredit: unavailable(),
      premiumCreditPerShare: unavailable(),
    };
  }

  const rawBasis = optionBasis.brokerOptionBasis;
  const rawAvgCost = optionBasis.brokerOptionAverageCost;

  return {
    brokerOptionBasis: fact(rawBasis, "observed"),
    premiumCredit: fact(Math.abs(rawBasis), "derived"),
    premiumCreditPerShare: rawAvgCost != null
      ? fact(Math.abs(rawAvgCost), "derived")
      : unavailable(),
  };
}
