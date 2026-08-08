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
  productionBreakdown: Record<string, number>;
  erosionEvents: ErosionEvent[];
  transactionSummary: TransactionSummary;
  transactions: AssessedTransaction[];
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
