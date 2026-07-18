/**
 * Instrument Catalog — Canonical classification evidence for known instruments.
 *
 * Resolution order:
 *   1. Canonical catalog record (highest confidence)
 *   2. Existing deterministic name heuristic (fallback)
 *   3. Unknown classification (no evidence available)
 *
 * The catalog represents durable instrument knowledge, not time-series observations.
 * Evidence provenance is preserved on every resolved classification.
 *
 * OPEN QUESTION (documented, not resolved):
 *   Can the absence of dangerous name indicators authorize an instrument,
 *   or should it merely leave the structure unverified?
 *   The current heuristic treats "name provided, no patterns matched" as
 *   inferenceSource: "name_heuristic" which passes the governance check.
 *   This policy question is deferred to a future slice.
 */

import catalogData from "./catalog-seed.json";
import type { GovernanceAnnotation, GovernanceStatus } from "../write-desk/scan-orchestrator";

// --- Catalog Types ---

export interface CatalogStructuralAttributes {
  leveraged: boolean;
  leverageMultiple: number;
  exposureDirection: string;
  resetFrequency: string;
  exposureMechanism: string;
}

export interface CatalogEvidence {
  sourceType: string;
  confidence: string;
  verificationStatus: string;
}

export interface CatalogGovernance {
  status: GovernanceStatus;
  policyCode: string;
}

export interface CatalogRecord {
  symbol: string;
  instrumentType: string;
  assetClass: string;
  investmentClassification: string;
  productStructure: string;
  structuralAttributes: CatalogStructuralAttributes;
  governance: CatalogGovernance;
  evidence: CatalogEvidence;
}

// --- Catalog Index ---

const catalogIndex = new Map<string, CatalogRecord>();

for (const instrument of (catalogData as any).instruments) {
  catalogIndex.set(instrument.symbol.toUpperCase(), instrument as CatalogRecord);
}

/**
 * Look up an instrument in the canonical catalog.
 * Returns null if the instrument is not in the catalog (fall through to heuristic).
 */
export function lookupCatalog(symbol: string): CatalogRecord | null {
  return catalogIndex.get(symbol.toUpperCase()) ?? null;
}

/**
 * Resolve governance from a catalog record.
 * Produces a GovernanceAnnotation with full provenance.
 */
export function governanceFromCatalog(record: CatalogRecord): GovernanceAnnotation {
  const { governance, structuralAttributes, evidence, productStructure } = record;
  const status = governance.status.toLowerCase() as GovernanceStatus;

  const reason = status === "authorized"
    ? `Conventional structure confirmed (${productStructure})`
    : status === "danger"
      ? `Structural complexity: ${productStructure} (${governance.policyCode})`
      : `Non-standard structure requires review: ${productStructure} (${governance.policyCode})`;

  return {
    status,
    reason,
    classification: {
      leveraged: structuralAttributes.leveraged,
      inverse: structuralAttributes.exposureDirection === "INVERSE",
      dailyReset: structuralAttributes.resetFrequency === "DAILY",
      confidence: evidence.confidence.toLowerCase(),
      source: evidence.sourceType.toLowerCase(),
    },
    policyCode: governance.policyCode,
  };
}

/**
 * Get the count of instruments in the catalog.
 */
export function catalogSize(): number {
  return catalogIndex.size;
}
