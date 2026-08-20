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
 * Architecture:
 *   The canonical assignment consequence model (ADR-013 Dimension 3) is
 *   defined in assignment-consequence.ts. This module composes it with
 *   contract measurements and provenance for the modal surface.
 *
 *   The strike-to-market consequence (ADR-014 addition) is computed here
 *   for puts. It answers: "if assigned NOW at the current market price,
 *   what is the immediate capital loss?" This is separate from the basis-
 *   relative consequence (which the existing model provides for calls).
 */

import type { MonitoredPosition } from "./position-monitoring";
import type { InventoryPosition, BalanceContext, CallAcquisitionBasis } from "../write-desk/types";
import {
  type AssignmentConsequence,
  type OptionBasisInput,
  deriveCallAssignmentConsequence,
  derivePutAssignmentConsequence,
} from "./assignment-consequence";

// --- Provenance ---

export type FactProvenance = "observed" | "derived" | "activity-attributed" | "batch-attributed" | "demo" | "unavailable";

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

// --- Strike-to-Market Consequence (Put Specific) ---

export interface StrikeToMarketConsequence {
  /** Capital loss at current market: max(strike - currentPrice, 0) × 100 × qty. Zero when OTM. */
  capitalLoss: ProvenancedFact<number | null>;
  /** The underlying price used for this calculation */
  atPrice: number | null;
  /** Whether the put is currently ITM (strike > currentPrice) */
  isITM: boolean;
}

// --- Full Position Detail ---

export interface PositionDetail {
  /** The enriched monitored position (contract state + moneyness) */
  position: MonitoredPosition;

  // --- Instrument Identity ---

  /** Human-readable instrument description (null if unknown) */
  instrumentDescription: string | null;

  // --- Market State ---

  /** Dollar distance from strike (absolute, always positive) */
  dollarDistanceFromStrike: ProvenancedFact<number | null>;

  // --- Strike-to-Market Consequence (puts only) ---

  /** If assigned at current market, what is the immediate capital loss? (Puts only) */
  strikeToMarketConsequence: StrikeToMarketConsequence | null;

  // --- Assignment Consequence (ADR-013 Dimension 3) ---

  /** Canonical decomposed assignment consequence */
  consequence: AssignmentConsequence;

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
 * Composes MonitoredPosition + portfolio context + option basis into the
 * full detail model. Both real Fidelity and demo positions use the same
 * canonical consequence model — they differ only in provenance.
 */
export function buildPositionDetail(
  position: MonitoredPosition,
  inventory: InventoryPosition | null,
  balanceContext: BalanceContext | null,
  optionBasis: OptionBasisInput,
  instrumentDescription?: string | null,
  acquisitionBasis?: CallAcquisitionBasis | null,
): PositionDetail {
  const missingFacts: string[] = [];

  // Dollar distance from strike
  const dollarDistance = position.underlyingPrice != null
    ? fact(Math.abs(position.underlyingPrice - position.strike), "derived")
    : unavailable<number>();

  // Strike-to-market consequence (puts only)
  let strikeToMarketConsequence: StrikeToMarketConsequence | null = null;
  if (position.type === "put") {
    if (position.underlyingPrice != null) {
      const lossPerShare = Math.max(position.strike - position.underlyingPrice, 0);
      const totalLoss = lossPerShare * 100 * position.quantity;
      const isITM = position.underlyingPrice < position.strike;
      strikeToMarketConsequence = {
        capitalLoss: fact(totalLoss, "derived"),
        atPrice: position.underlyingPrice,
        isITM,
      };
    } else {
      strikeToMarketConsequence = {
        capitalLoss: unavailable(),
        atPrice: null,
        isITM: false,
      };
      missingFacts.push("Current underlying price unavailable — cannot compute assignment capital consequence");
    }
  }

  // Missing facts for provenance transparency
  if (optionBasis.brokerOptionBasis == null) {
    missingFacts.push("Option basis unavailable (broker did not report cost basis for this position)");
  }
  if ((position.type === "call" || position.type === "buy-write") && inventory?.economics?.averageCostPerShare == null) {
    missingFacts.push("Share cost basis unavailable (cannot determine appreciation/erosion)");
  }

  // Assignment consequence (canonical model)
  const consequence = (position.type === "call" || position.type === "buy-write")
    ? deriveCallAssignmentConsequence(position, inventory, optionBasis, acquisitionBasis)
    : derivePutAssignmentConsequence(position, inventory, optionBasis);

  return {
    position,
    instrumentDescription: instrumentDescription ?? null,
    dollarDistanceFromStrike: dollarDistance,
    strikeToMarketConsequence,
    consequence,
    inventory,
    balanceContext,
    missingFacts,
  };
}

// Re-export types used by consumers
export type { AssignmentConsequence, OptionBasisInput, CallAssignmentConsequence, PutAssignmentConsequence } from "./assignment-consequence";
