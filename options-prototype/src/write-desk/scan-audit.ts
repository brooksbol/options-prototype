/**
 * Write Desk — Scan Audit Repository
 *
 * Persists scan results for operational evidence.
 * Stores in localStorage for the prototype phase.
 *
 * Each scan produces a complete audit record including:
 * - portfolio source and provenance
 * - market retrieval context
 * - all candidates considered
 * - hard-no exclusions
 * - exact contracts evaluated
 * - execution assessment components
 * - posture and ranking
 */

import type { PutCandidate, CallCandidate, CallInventoryItem } from "./scan-orchestrator";
import type { PortfolioSnapshot } from "./types";

// --- Audit Record ---

export interface ScanAuditRecord {
  id: string;
  scannedAt: string;
  route: string;

  // Portfolio provenance
  portfolioSourceType: string;
  portfolioSnapshotId: string;
  accountId: string | null;
  deployableCash: number | null;
  snapshotDate: string | null;
  portfolioProvenance: Record<string, unknown>;

  // Market context
  marketProvider: string;
  marketRetrievedAt: string;
  delayedData: boolean;

  // Scan config
  scanConfigVersion: string;
  targetDelta: number;
  dteRange: { min: number; max: number };

  // Results — Puts
  putCandidates: PutCandidate[];
  putExcluded: { symbol: string; reason: string }[];
  putTotalScanned: number;

  // Results — Calls
  callCandidates: CallCandidate[];
  callInventory: CallInventoryItem[];
  callExcluded: { symbol: string; reason: string }[];

  // Summary
  totalCandidates: number;
  actionableCount: number;
  edgeCount: number;
  waitCount: number;
}

// --- Storage ---

const STORAGE_KEY = "write-desk:scan-audit";
const MAX_RECORDS = 50;

export function createScanAuditRecord(
  snapshot: PortfolioSnapshot,
  putCandidates: PutCandidate[],
  putExcluded: { symbol: string; reason: string }[],
  callCandidates: CallCandidate[],
  callInventory: CallInventoryItem[],
  callExcluded: { symbol: string; reason: string }[],
  providerKey: string,
  scanConfig: { version: string; targetDelta: number; dteRange: { min: number; max: number } }
): ScanAuditRecord {
  const now = new Date().toISOString();
  const allCandidates = [...putCandidates, ...callCandidates];

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    scannedAt: now,
    route: "/app/write",

    portfolioSourceType: snapshot.source.type,
    portfolioSnapshotId: snapshot.id,
    accountId: snapshot.accountId,
    deployableCash: snapshot.deployableCash,
    snapshotDate: snapshot.snapshotDate,
    portfolioProvenance: snapshot.provenance as unknown as Record<string, unknown>,

    marketProvider: providerKey,
    marketRetrievedAt: now,
    delayedData: providerKey === "tradier",

    scanConfigVersion: scanConfig.version,
    targetDelta: scanConfig.targetDelta,
    dteRange: scanConfig.dteRange,

    putCandidates,
    putExcluded,
    putTotalScanned: putCandidates.length + putExcluded.length,

    callCandidates,
    callInventory,
    callExcluded,

    totalCandidates: allCandidates.length,
    actionableCount: allCandidates.filter((c) => c.posture === "ACTIONABLE").length,
    edgeCount: allCandidates.filter((c) => c.posture === "EDGE").length,
    waitCount: allCandidates.filter((c) => c.posture === "WAIT").length,
  };
}

export function persistScanAudit(record: ScanAuditRecord): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: ScanAuditRecord[] = raw ? JSON.parse(raw) : [];
    existing.unshift(record);
    // Keep only recent records
    const trimmed = existing.slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable or full — fail silently
  }
}

export function loadScanAuditHistory(): ScanAuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
