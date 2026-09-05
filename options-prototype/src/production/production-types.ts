/**
 * TypeScript interfaces matching the backend ProductionResponse DTO.
 *
 * These are the authoritative shapes returned by POST /api/production/assess.
 * No production-accounting logic lives here — only type definitions.
 */

export interface ProductionAssessmentResponse {
  period: string;
  periodDescription: string;
  reconciliationStatus: "FULLY_RECONCILED" | "PRODUCTION_UNCERTAIN" | "SOURCE_INCOMPLETE";
  reconciliationIssues: ReconciliationIssue[];
  knownCashProduction: number;
  unresolvedPotentialProduction: number;
  realizedCapitalErosion: number;
  /** Net realized economic contribution of the options strategy engine */
  netStrategyResult: number;
  productionBreakdown: Record<string, number>;
  erosionEvents: ErosionEvent[];
  transactionSummary: TransactionSummary;
  transactions: AssessedTransaction[];
  dispositionResults?: DispositionResult[];
}

export interface ReconciliationIssue {
  type: string;
  description: string;
  potentialImpact: number | null;
}

export interface ErosionEvent {
  date: string;
  symbol: string;
  amount: number;
  description: string;
}

export interface TransactionSummary {
  included: number;
  excluded: number;
  uncertain: number;
  notApplicable: number;
}

export interface AssessedTransaction {
  id: string;
  date: string;
  action: string;
  symbol: string;
  amount: number;
  role: "INCLUDED" | "EXCLUDED" | "UNCERTAIN" | "NOT_APPLICABLE";
  components: EconomicComponent[];
}

export interface EconomicComponent {
  type: string;
  source: string | null;
  amount: number;
  confidence: string;
  derivation: string;
}

/**
 * Backend-authoritative interpreted economics for one realized disposition.
 * The frontend RENDERS this; it must not reconstruct realized disposition economics.
 * `attributableAcquisitionCash` is proportional net acquisition cash — NOT a tax-lot basis.
 */
export interface DispositionResult {
  /**
   * Disposition fingerprint — deterministic trace/dedup value (backend NormalizedTransaction
   * content fingerprint). NOT guaranteed unique, NOT evidence-row/broker/durable identity.
   */
  dispositionFingerprint: string;
  /**
   * Backend-established authoritative association target: the current OCC contract/activity
   * grouping key. Null when the association is unresolved. NOT durable lifecycle/episode identity.
   */
  contractActivityKey: string | null;
  symbol: string;
  date: string;
  /**
   * Raw Fidelity action text of the disposition (sale) event. Present so the called-away sale can
   * be rendered as a constituent event FROM the authoritative backend association — the frontend
   * must not independently re-correlate a raw sale row to a CALL episode (ADR-016).
   */
  dispositionAction: string | null;
  kind: string;
  quantity: number | null;
  salePricePerShare: number | null;
  netSaleProceeds: number | null;
  attributableAcquisitionCash: number | null;
  realizedAppreciation: number | null;
  realizedErosion: number | null;
  /** "RESOLVED" | "PARTIAL" | "UNRESOLVED" */
  state: string;
  provenance: string;
}
