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
 */
export function hasWorkingIntent(symbol: string, intents: PendingIntent[]): boolean {
  return intents.some(
    (i) => i.symbol.toUpperCase() === symbol.toUpperCase() && i.status === "working"
  );
}

/**
 * Get all working intents for a symbol.
 */
export function getWorkingIntentsForSymbol(symbol: string, intents: PendingIntent[]): PendingIntent[] {
  return intents.filter(
    (i) => i.symbol.toUpperCase() === symbol.toUpperCase() && i.status === "working"
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
