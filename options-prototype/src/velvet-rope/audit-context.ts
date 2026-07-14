/**
 * Velvet Rope — Audit Context for Opportunity Lab Integration
 *
 * Derives informational audit context for Opportunity Lab rows by looking up
 * prior Velvet Rope evaluations. Does NOT filter, rank, or claim current judgment.
 *
 * Key semantic rule: a prior evaluation conclusion is never presented as
 * a judgment on the current Opportunity Lab contract unless contract identity matches.
 */

import type { AdmissionAuditRecord, AdmissionOutcome } from "./types";
import type { VelvetRopeState } from "./types";

// --- Contract Identity ---

export interface ContractIdentity {
  symbol: string;
  side: "call" | "put";
  expiration: string;
  strike: number;
}

/**
 * Compare two contract identities for exact match.
 * Based on stable fields only (symbol, side, expiration, strike).
 */
export function contractsMatch(a: ContractIdentity, b: ContractIdentity): boolean {
  return (
    a.symbol === b.symbol &&
    a.side === b.side &&
    a.expiration === b.expiration &&
    a.strike === b.strike
  );
}

// --- Audit Context States ---

export type AuditContextMatch =
  | "exact_match"           // Prior audit evaluated the same contract
  | "exact_match_stale"    // Same contract but evaluation is old
  | "same_symbol"          // Same symbol, different contract
  | "not_evaluated";       // No prior audit exists

export interface AuditContext {
  match: AuditContextMatch;
  /** The prior audit record (null if not_evaluated) */
  record: AdmissionAuditRecord | null;
  /** Prior outcome (null if not_evaluated or provider_failed) */
  priorOutcome: AdmissionOutcome | null;
  /** When the prior evaluation occurred */
  evaluatedAt: string | null;
  /** Policy version used for the prior evaluation */
  policyVersion: string | null;
  /** What contract the prior evaluation examined (call side) */
  priorCallStrike: number | null;
  priorCallExpiration: string | null;
  /** What contract the prior evaluation examined (put side) */
  priorPutStrike: number | null;
  priorPutExpiration: string | null;
}

// --- Staleness ---

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

function isStale(evaluatedAt: string): boolean {
  const age = Date.now() - new Date(evaluatedAt).getTime();
  return age > STALE_THRESHOLD_MS;
}

// --- Derivation ---

/**
 * Derive audit context for an Opportunity Lab row.
 *
 * Looks up the latest successful Velvet Rope evaluation for the symbol
 * and determines the match type relative to the current opportunity contract.
 *
 * Does NOT trigger any API calls. Reads only from the provided state.
 */
export function deriveAuditContext(
  symbol: string,
  currentCallIdentity: ContractIdentity | null,
  currentPutIdentity: ContractIdentity | null,
  vrState: VelvetRopeState
): AuditContext {
  // Find latest successful evaluation for this symbol
  const records = vrState.auditRecords
    .filter((r) => r.symbol === symbol && r.attemptStatus !== "provider_failed")
    .sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt));

  const latestRecord = records[0] ?? null;

  if (!latestRecord) {
    return {
      match: "not_evaluated",
      record: null,
      priorOutcome: null,
      evaluatedAt: null,
      policyVersion: null,
      priorCallStrike: null,
      priorCallExpiration: null,
      priorPutStrike: null,
      priorPutExpiration: null,
    };
  }

  // Extract prior contract identities from the audit record
  const priorCallStrike = latestRecord.callEvidence.selectedContract?.strike ?? null;
  const priorCallExpiration = latestRecord.expirationSelection.selectedDate;
  const priorPutStrike = latestRecord.putEvidence.selectedContract?.strike ?? null;
  const priorPutExpiration = latestRecord.expirationSelection.selectedDate;

  // Build prior identities for comparison
  const priorCallIdentity: ContractIdentity | null = (priorCallStrike != null && priorCallExpiration != null)
    ? { symbol, side: "call", expiration: priorCallExpiration, strike: priorCallStrike }
    : null;

  const priorPutIdentity: ContractIdentity | null = (priorPutStrike != null && priorPutExpiration != null)
    ? { symbol, side: "put", expiration: priorPutExpiration, strike: priorPutStrike }
    : null;

  // Determine match quality
  const callMatches = currentCallIdentity && priorCallIdentity
    ? contractsMatch(currentCallIdentity, priorCallIdentity)
    : false;
  const putMatches = currentPutIdentity && priorPutIdentity
    ? contractsMatch(currentPutIdentity, priorPutIdentity)
    : false;

  // At least one side must match for "exact_match"
  const hasExactMatch = callMatches || putMatches;

  let match: AuditContextMatch;
  if (hasExactMatch) {
    match = isStale(latestRecord.attemptedAt) ? "exact_match_stale" : "exact_match";
  } else {
    match = "same_symbol";
  }

  return {
    match,
    record: latestRecord,
    priorOutcome: latestRecord.outcome,
    evaluatedAt: latestRecord.attemptedAt,
    policyVersion: latestRecord.policySnapshot.version,
    priorCallStrike,
    priorCallExpiration,
    priorPutStrike,
    priorPutExpiration,
  };
}
