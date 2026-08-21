/**
 * Write Desk — Scan Orchestrator (Types Only)
 *
 * This module defines the shared domain types for recommendation candidates
 * and scan configuration. The original provider-calling scan functions
 * (scanPuts, scanCalls, scanUniversePuts) have been retired — all
 * recommendation generation now uses the cache-backed deterministic paths
 * in recommend.ts, recommend-calls.ts, and recommend-buy-writes.ts.
 */

import type { ExecutionAssessment, ActionPosture } from "./execution-assessment";
import { DEFAULT_EXECUTION_POLICY, type ExecutionPolicy } from "./execution-policy";
import type { PositionEconomics } from "./types";

// --- Scan Configuration ---

export interface ScanConfig {
  /** Target delta for contract selection */
  targetDelta: number;
  /** DTE range for expiration selection */
  dteRange: { min: number; max: number };
  /** Delta range filter */
  deltaRange: { min: number; max: number };
  /** Execution policy */
  executionPolicy: ExecutionPolicy;
  /** Maximum candidates to evaluate (rate-limit protection) */
  maxCandidates: number;
}

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  targetDelta: 0.30,
  dteRange: { min: 7, max: 45 },
  deltaRange: { min: 0.15, max: 0.50 },
  executionPolicy: DEFAULT_EXECUTION_POLICY,
  maxCandidates: 20,
};

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

// --- Put Candidate ---

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
  /** Whether the operator has sufficient deployable cash for this contract */
  affordable: boolean;
  /** Governance authorization status — independent of recommendation posture */
  governance: GovernanceAnnotation;
}

// --- Call Candidate ---

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
  /** Whether strike is above current price */
  strikeAbovePrice: boolean;
  underlyingPrice: number;
  /** Position economics from brokerage (null when unavailable, e.g. demo mode) */
  economics: PositionEconomics | null;
}

// --- Call Inventory Result ---

export interface CallInventoryItem {
  symbol: string;
  sharesOwned: number;
  sharesEncumbered: number;
  sharesFree: number;
  maxContracts: number;
  reason: string | null;
  candidates: CallCandidate[];
}

// --- Scan Result ---

export interface ScanResult {
  id: string;
  scannedAt: string;
  portfolioSnapshotId: string;
  config: ScanConfig;
  puts: {
    candidates: PutCandidate[];
    excluded: { symbol: string; reason: string }[];
    totalScanned: number;
  };
  calls: {
    inventory: CallInventoryItem[];
    candidates: CallCandidate[];
    excluded: { symbol: string; reason: string }[];
  };
  marketProvenance: {
    provider: string;
    retrievedAt: string;
    delayedData: boolean;
  };
}
