/**
 * Call Table Row — Discriminated Union
 *
 * The Calls table presents two populations:
 *
 * 1. ExecutableCallRow — held, unencumbered shares with a recommended call contract.
 *    Actionable now. Has execution posture, recommendation rank.
 *
 * 2. ContingentCallRow — projected call opportunity conditioned on assignment of an
 *    existing short put. Not executable until shares are owned.
 *
 * Both share enough structure to render in one table, but differ in:
 * - availability semantics (now vs if-assigned)
 * - basis provenance (broker-reported vs put-strike assumption)
 * - assessment (recommendation posture vs PROJECTED label)
 * - drawer behavior (execution brief vs evidence brief)
 */

import type { CallCandidate } from "./scan-orchestrator";
import type { ConditionedCallOpportunity } from "./conditioned-call-surface";

// --- Discriminant ---

export type CallRowAvailability = "available-now" | "if-assigned";

// --- Executable Call Row ---

export interface ExecutableCallRow {
  availability: "available-now";
  /** The full call candidate from recommendCalls() */
  candidate: CallCandidate;
  /** Sortable fields (directly from candidate) */
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
  yieldAnnualized: number;
  posture: string;
  executionScore: number;
}

// --- Contingent Call Row ---

export interface ContingentCallRow {
  availability: "if-assigned";
  /** The call opportunity from PCS assessment */
  opportunity: ConditionedCallOpportunity;
  /** Originating put obligation */
  originatingPut: {
    underlying: string;
    strike: number;
    expiration: string;
    quantity: number;
  };
  /** Conditioned basis (put strike; premium unavailable) */
  conditionedBasis: number;
  /** Basis provenance */
  basisSource: "strike-only";
  /** Shares that would be owned if assigned */
  contingentShares: number;
  /** Sortable fields (from the opportunity) */
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
  /** Yield from conditioned basis (not from underlying price) */
  yieldFromBasis: number | null;
}

// --- Union ---

export type CallTableRow = ExecutableCallRow | ContingentCallRow;

// --- Factory helpers ---

export function executableRowFromCandidate(candidate: CallCandidate): ExecutableCallRow {
  return {
    availability: "available-now",
    candidate,
    symbol: candidate.symbol,
    expiration: candidate.expiration,
    dte: candidate.dte,
    strike: candidate.strike,
    delta: candidate.delta,
    bid: candidate.bid,
    ask: candidate.ask,
    mid: candidate.mid,
    spreadPercent: candidate.spreadPercent,
    openInterest: candidate.openInterest,
    volume: candidate.volume,
    yieldAnnualized: candidate.yieldAnnualized,
    posture: candidate.posture,
    executionScore: candidate.assessment.score,
  };
}

export function contingentRowFromOpportunity(
  opportunity: ConditionedCallOpportunity,
  put: { underlying: string; strike: number; expiration: string; quantity: number }
): ContingentCallRow {
  return {
    availability: "if-assigned",
    opportunity,
    originatingPut: put,
    conditionedBasis: put.strike,
    basisSource: "strike-only",
    contingentShares: Math.abs(put.quantity) * 100,
    symbol: put.underlying,
    expiration: opportunity.expiration,
    dte: opportunity.dte,
    strike: opportunity.strike,
    delta: opportunity.delta,
    bid: opportunity.bid,
    ask: opportunity.ask,
    mid: opportunity.mid,
    spreadPercent: opportunity.spreadPercent,
    openInterest: opportunity.openInterest,
    volume: opportunity.volume,
    yieldFromBasis: opportunity.yieldFromBasis,
  };
}
