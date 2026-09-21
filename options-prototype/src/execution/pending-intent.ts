/**
 * Pending Intent — Lightweight marker for submitted-but-unfilled orders.
 *
 * PURPOSE: Duplicate-symbol awareness and exposure governance only.
 * NOT USED FOR: Cash computation. Fidelity's "Available to trade (all settled)"
 * is authoritative for deployable cash.
 *
 * Lifecycle:
 *   Recommendation → Write Intent → [Open in Fidelity] → Pending Intent → Filled / Cancelled
 *
 * The operator optionally marks a recommendation as "Submitted / Working"
 * after confirming the order was placed in Fidelity.
 */

// --- Types ---

export type PendingIntentStatus = "working" | "filled" | "cancelled" | "expired";

export interface PendingIntent {
  id: string;
  /**
   * Stable Wheelwright BrokerageAccount identity this intent belongs to (Increment 4).
   * Working-intent identity/dedup is (brokerageAccountId, symbol, lifecycle): the same
   * symbol can have independent intents in different accounts. Null for legacy/demo intents
   * created before account provenance existed (treated as unattributed).
   */
  brokerageAccountId: string | null;
  symbol: string;
  contractSymbol: string;
  expiration: string;
  optionType: "put" | "call";
  strike: number;
  quantity: number;
  limitPrice: number | null;
  status: PendingIntentStatus;
  submittedAt: string;
  updatedAt: string;
}

// --- Builder ---

import type { WriteIntent } from "./write-intent";

let intentIdCounter = 0;

function generateIntentId(): string {
  intentIdCounter++;
  return `pi-${Date.now()}-${intentIdCounter.toString(36)}`;
}

/**
 * Create a Pending Intent from a WriteIntent after the operator confirms submission.
 */
export function createPendingIntent(intent: WriteIntent): PendingIntent {
  const now = new Date().toISOString();
  return {
    id: generateIntentId(),
    brokerageAccountId: intent.brokerageAccountId ?? null,
    symbol: intent.underlyingSymbol,
    contractSymbol: intent.contractSymbol,
    expiration: intent.expiration,
    optionType: intent.optionType,
    strike: intent.strike,
    quantity: intent.quantity,
    limitPrice: intent.limitPrice,
    status: "working",
    submittedAt: now,
    updatedAt: now,
  };
}

/**
 * Transition a pending intent to a terminal state.
 */
export function resolvePendingIntent(intent: PendingIntent, status: "filled" | "cancelled" | "expired"): PendingIntent {
  return {
    ...intent,
    status,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check if a symbol has a working pending intent (for duplicate detection).
 *
 * ACCOUNT-BLIND legacy variant — matches on symbol across ALL accounts. Retained for
 * backward compatibility. Prefer hasWorkingIntentForAccount once an account context is
 * available (the same symbol can have independent intents in different accounts).
 */
export function hasWorkingIntent(symbol: string, intents: PendingIntent[]): boolean {
  return intents.some(
    (i) => i.symbol.toUpperCase() === symbol.toUpperCase() && i.status === "working"
  );
}

/**
 * Get all working intents for a symbol (ACCOUNT-BLIND legacy variant — across all accounts).
 */
export function getWorkingIntentsForSymbol(symbol: string, intents: PendingIntent[]): PendingIntent[] {
  return intents.filter(
    (i) => i.symbol.toUpperCase() === symbol.toUpperCase() && i.status === "working"
  );
}

/**
 * Account-aware duplicate detection (Increment 4). Keyed by (brokerageAccountId, symbol):
 * an intent for SPY in account A does not shadow SPY in account B. When
 * brokerageAccountId is null (unattributed/legacy/demo), matches other null-account intents
 * for the symbol.
 */
export function hasWorkingIntentForAccount(
  brokerageAccountId: string | null,
  symbol: string,
  intents: PendingIntent[]
): boolean {
  return getWorkingIntentsForAccountSymbol(brokerageAccountId, symbol, intents).length > 0;
}

/** Account-aware working intents for (brokerageAccountId, symbol). */
export function getWorkingIntentsForAccountSymbol(
  brokerageAccountId: string | null,
  symbol: string,
  intents: PendingIntent[]
): PendingIntent[] {
  const wantAccount = brokerageAccountId ?? null;
  return intents.filter(
    (i) =>
      (i.brokerageAccountId ?? null) === wantAccount &&
      i.symbol.toUpperCase() === symbol.toUpperCase() &&
      i.status === "working"
  );
}

/** All working intents for a specific account (any symbol). */
export function loadWorkingIntentsForAccount(
  brokerageAccountId: string | null,
  intents: PendingIntent[]
): PendingIntent[] {
  const wantAccount = brokerageAccountId ?? null;
  return intents.filter(
    (i) => (i.brokerageAccountId ?? null) === wantAccount && i.status === "working"
  );
}

// --- Storage (localStorage) ---

const STORAGE_KEY = "wheelwright:pending-intents";

export function loadPendingIntents(): PendingIntent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingIntent[];
  } catch {
    return [];
  }
}

export function loadWorkingIntents(): PendingIntent[] {
  return loadPendingIntents().filter((i) => i.status === "working");
}

export function savePendingIntents(intents: PendingIntent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(intents));
}

export function addPendingIntent(intent: PendingIntent): void {
  const all = loadPendingIntents();
  all.push(intent);
  savePendingIntents(all);
}

export function updatePendingIntent(id: string, status: "filled" | "cancelled" | "expired"): void {
  const all = loadPendingIntents();
  const idx = all.findIndex((i) => i.id === id);
  if (idx !== -1) {
    all[idx] = resolvePendingIntent(all[idx], status);
    savePendingIntents(all);
  }
}

export function purgeResolvedIntents(): number {
  const all = loadPendingIntents();
  const working = all.filter((i) => i.status === "working");
  const removed = all.length - working.length;
  savePendingIntents(working);
  return removed;
}

/**
 * Migrate the legacy flat intents array (which predates account provenance) to be
 * account-attributed (Increment 4). Idempotent and non-destructive:
 *
 *  - Intents that already carry a brokerageAccountId are left untouched.
 *  - Intents with no account are attached to `soleAccountId` ONLY when exactly one account
 *    exists (the unambiguous single-account operator). Provenance is never invented when
 *    zero or multiple accounts exist — those intents remain unattributed (null) and are
 *    treated as legacy/unknown until the operator resolves them.
 *
 * Returns the number of intents newly attributed.
 */
export function migrateLegacyIntents(soleAccountId: string | null): number {
  if (soleAccountId == null) return 0;
  const all = loadPendingIntents();
  let changed = 0;
  const next = all.map((i) => {
    if ((i.brokerageAccountId ?? null) == null) {
      changed++;
      return { ...i, brokerageAccountId: soleAccountId };
    }
    return i;
  });
  if (changed > 0) savePendingIntents(next);
  return changed;
}
