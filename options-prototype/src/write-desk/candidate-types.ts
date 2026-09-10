/**
 * Deployment recommendation candidate types.
 *
 * These types describe recommendation and inventory results shared by
 * Deployment, execution, audit, and operator presentation code. They do not
 * own evidence acquisition or scan orchestration.
 */

import type { ExecutionAssessment, ActionPosture } from "./execution-assessment";
import type { PositionEconomics } from "./types";
import type { EvidenceProvenance } from "./evidence-provenance";

export type GovernanceStatus = "authorized" | "danger" | "review" | "unknown";

export interface GovernanceAnnotation {
  status: GovernanceStatus;
  reason: string;
  classification?: {
    leveraged: boolean;
    inverse: boolean;
    dailyReset: boolean;
    confidence: string;
    source: string;
  };
  policyCode?: string;
}

export interface PutCandidate {
  rank: number;
  symbol: string;
  expiration: string;
  dte: number;
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  mid: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  cashRequired: number;
  cashRemaining: number;
  yieldAnnualized: number;
  assessment: ExecutionAssessment;
  posture: ActionPosture;
  /** Whether the operator has sufficient deployable cash for this contract. */
  affordable: boolean;
  /** Governance authorization status — independent of recommendation posture. */
  governance: GovernanceAnnotation;
  /**
   * Chain-acquisition provenance copied from published evidence. Observational
   * only; never an input to rank, posture, or governance.
   */
  evidenceProvenance?: EvidenceProvenance;
}

export interface CallCandidate {
  rank: number;
  symbol: string;
  expiration: string;
  dte: number;
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  mid: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  freeShares: number;
  maxContracts: number;
  /**
   * Authoritative separately-encumbered shares for this position (from
   * InventoryPosition.sharesEncumbered). Carried so consequence presentation can
   * truthfully report residual holdings outside the evaluated block without the
   * frontend inventing or defaulting the value. Not an input to rank/posture.
   */
  encumberedShares: number;
  premiumPerContract: number;
  yieldAnnualized: number;
  assessment: ExecutionAssessment;
  posture: ActionPosture;
  /** Whether strike is above current price. */
  strikeAbovePrice: boolean;
  underlyingPrice: number;
  /** Position economics from brokerage (null when unavailable, e.g. demo mode). */
  economics: PositionEconomics | null;
  /**
   * Flattened broker-reported average cost per share (from economics), for
   * table display/sorting. Null when unavailable (e.g. demo mode). This is the
   * stock/accounting basis, NOT a capital-cycle basis.
   */
  basisPerShare: number | null;
  /**
   * Why this strike was selected for its expiration (exploratory — capital-state optionality):
   * - "target-delta": closest-to-target-delta contract (the ordinary pick).
   * - "basis-positive": lowest admissible strike at or above cost basis, so a
   *   call-away would not sell shares below basis (before premium). Only emitted
   *   when basis is known and differs from the target-delta pick.
   */
  selectionBasis: "target-delta" | "basis-positive";
  /** Chain-acquisition provenance copied from published evidence. */
  evidenceProvenance?: EvidenceProvenance;
}

export interface CallInventoryItem {
  symbol: string;
  sharesOwned: number;
  sharesEncumbered: number;
  sharesFree: number;
  maxContracts: number;
  reason: string | null;
  candidates: CallCandidate[];
}
