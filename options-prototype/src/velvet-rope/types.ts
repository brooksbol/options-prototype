/**
 * Velvet Rope — Domain Types (Thin Slice)
 *
 * Minimum types for single-symbol evaluation against a fixed admission policy.
 * See docs/velvet-rope/00-domain-model.md for the full model.
 */

// --- Admission Outcome ---

export type AdmissionOutcome =
  | "admit"
  | "reject"
  | "insufficient_evidence"
  | "manual_review";

export type EvaluationAttemptStatus =
  | "completed"
  | "evidence_incomplete"
  | "provider_failed";

// --- Evidence Provenance ---

export interface EvidenceProvenance {
  provider: string;
  observedAt: string | null;
  retrievedAt: string;
  source: "network" | "cache";
  cacheAgeSeconds: number | null;
  delayedData: boolean;
}

// --- Expiration Selection ---

export interface ExpirationSelectionResult {
  status: "selected" | "no_usable_expiration";
  selectedDate: string | null;
  selectedDte: number | null;
  availableCount: number;
  searchRange: { min: number; max: number };
}

// --- Contract Evidence ---

export interface ContractEvidence {
  strike: number;
  delta: number;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  spreadPercent: number;
  openInterest: number;
  volume: number;
  iv: number | null;
  annualizedYield: number;
  dte: number;
}

export type ContractSelectionStatus =
  | "selected"
  | "no_contract_in_delta_range"
  | "greeks_unavailable"
  | "expiration_unavailable"
  | "no_valid_quotes";

// --- Option Side Evidence ---

export interface OptionSideEvidence {
  side: "call" | "put";
  selectedContract: ContractEvidence | null;
  selectionStatus: ContractSelectionStatus;
  criteria: CriterionResult[];
}

// --- Criterion Result ---

export type CriterionSeverity = "hard" | "soft" | "observational";

export interface CriterionResult {
  criterion: string;
  status: "pass" | "fail" | "unavailable" | "near_miss";
  measuredValue: number | string | null;
  threshold: number | string;
  severity: CriterionSeverity;
  explanation: string;
}

// --- Policy ---

export interface PolicyCriterion {
  value: number | boolean | null;
  severity: CriterionSeverity;
}

export interface ContractSelectionPolicy {
  targetDelta: number;
  deltaRange: { min: number; max: number };
  putDeltaAbsolute: boolean;
  excludeZeroBid: boolean;
  requireGreeks: boolean;
  tieBreaker: "PreferOTM" | "PreferITM";
}

export interface AdmissionPolicy {
  version: string;
  createdAt: string;
  expirationDteRange: { min: number; max: number };
  contractSelection: ContractSelectionPolicy;
  sideRequirement: "both" | "either" | "puts_only" | "calls_only";
  minOpenInterest: PolicyCriterion;
  minOptionVolume: PolicyCriterion;
  maxBidAskSpreadPercent: PolicyCriterion;
  requireGreeks: PolicyCriterion;
  maxCapitalPerContract: PolicyCriterion;
  minCapitalPerContract: PolicyCriterion;
  minYieldAtTargetDelta: PolicyCriterion;
  nearMissPercent: number;
}

// --- Audit Record ---

export interface AdmissionAuditRecord {
  id: string;
  symbol: string;
  attemptedAt: string;
  attemptStatus: EvaluationAttemptStatus;
  outcome: AdmissionOutcome | null;
  policySnapshot: AdmissionPolicy;
  evidenceProvenance: EvidenceProvenance;
  expirationSelection: ExpirationSelectionResult;
  callEvidence: OptionSideEvidence;
  putEvidence: OptionSideEvidence;
  aggregatedCriteria: CriterionResult[];
  explanation: string;
}

// --- Persisted State (thin slice) ---

export interface VelvetRopeState {
  schemaVersion: 1;
  activePolicy: AdmissionPolicy;
  auditRecords: AdmissionAuditRecord[];
}
