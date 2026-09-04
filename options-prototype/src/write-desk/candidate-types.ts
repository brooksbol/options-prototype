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
  premiumPerContract: number;
  yieldAnnualized: number;
  assessment: ExecutionAssessment;
  posture: ActionPosture;
  /** Whether strike is above current price. */
  strikeAbovePrice: boolean;
  underlyingPrice: number;
  /** Position economics from brokerage (null when unavailable, e.g. demo mode). */
  economics: PositionEconomics | null;
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
