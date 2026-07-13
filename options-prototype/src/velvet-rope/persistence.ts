/**
 * Velvet Rope — Persistence (storage-agnostic interface + localStorage implementation)
 *
 * Domain and evaluation code must not call localStorage directly.
 * This module is the only place that knows about the storage mechanism.
 */

import type { VelvetRopeState, AdmissionAuditRecord } from "./types";
import { DEFAULT_ADMISSION_POLICY } from "./policy";

// --- Storage Interface ---

export interface VelvetRopeStore {
  load(): VelvetRopeState;
  save(state: VelvetRopeState): void;
}

// --- Default State ---

function createDefaultState(): VelvetRopeState {
  return {
    schemaVersion: 1,
    activePolicy: DEFAULT_ADMISSION_POLICY,
    auditRecords: [],
  };
}

// --- localStorage Implementation ---

const STORAGE_KEY = "options-prototype:velvet-rope";

export class LocalStorageVelvetRopeStore implements VelvetRopeStore {
  load(): VelvetRopeState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      // Merge with defaults for schema evolution
      return {
        ...createDefaultState(),
        ...parsed,
      };
    } catch {
      return createDefaultState();
    }
  }

  save(state: VelvetRopeState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be full — fail silently in prototype
    }
  }
}

// --- Audit Operations ---

/**
 * Append an audit record to state. Never overwrites or caps.
 */
export function appendAuditRecord(
  state: VelvetRopeState,
  record: AdmissionAuditRecord
): VelvetRopeState {
  return {
    ...state,
    auditRecords: [...state.auditRecords, record],
  };
}

/**
 * Get the latest successful evaluation for a symbol.
 * "Successful" means attemptStatus === "completed" or "evidence_incomplete".
 * Provider failures are NOT considered successful evaluations.
 */
export function getLatestSuccessfulEvaluation(
  state: VelvetRopeState,
  symbol: string
): AdmissionAuditRecord | null {
  const records = state.auditRecords
    .filter((r) => r.symbol === symbol && r.attemptStatus !== "provider_failed")
    .sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt));
  return records[0] ?? null;
}

/**
 * Get the latest attempt (any status) for a symbol.
 */
export function getLatestAttempt(
  state: VelvetRopeState,
  symbol: string
): AdmissionAuditRecord | null {
  const records = state.auditRecords
    .filter((r) => r.symbol === symbol)
    .sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt));
  return records[0] ?? null;
}

/**
 * Get all audit records for a symbol (newest first).
 */
export function getAuditHistory(
  state: VelvetRopeState,
  symbol: string
): AdmissionAuditRecord[] {
  return state.auditRecords
    .filter((r) => r.symbol === symbol)
    .sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt));
}
