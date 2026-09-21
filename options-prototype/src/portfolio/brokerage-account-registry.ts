/**
 * BrokerageAccount Registry — persistent catalog of BrokerageAccount identities (Increment 1).
 *
 * This is the GLOBAL registry of stable Wheelwright account identities. It holds identity
 * and provenance metadata only — never account-local financial state (snapshots, balances,
 * intents, capital history). Those are keyed by `brokerageAccountId` in their own stores.
 *
 * Increment 1 keeps this registry INERT: introducing it changes no existing portfolio
 * behavior. Nothing reads the registry to select or load a portfolio yet.
 *
 * Storage is isolated to this module (matching the velvet-rope / universe convention).
 * Demo is NOT a BrokerageAccount and is never written here.
 */

import type { BrokerageAccount } from "./brokerage-account";
import {
  createBrokerageAccount,
  findById,
  normalizeExternalRef,
  resolveByExternalRef,
  type NewBrokerageAccountInput,
  type ResolutionOutcome,
} from "./brokerage-account";

const STORAGE_KEY = "wheelwright:brokerage-accounts";
const SCHEMA_VERSION = 1 as const;

interface PersistedRegistry {
  schemaVersion: typeof SCHEMA_VERSION;
  accounts: BrokerageAccount[];
}

// --- Load / Save (the only place that touches localStorage) ---

export function loadAccounts(): BrokerageAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: PersistedRegistry = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.accounts)) return [];
    return parsed.accounts;
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: BrokerageAccount[]): void {
  try {
    const data: PersistedRegistry = { schemaVersion: SCHEMA_VERSION, accounts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — fail silently (prototype convention).
  }
}

// --- Query ---

export function getAccountById(brokerageAccountId: string): BrokerageAccount | null {
  return findById(loadAccounts(), brokerageAccountId);
}

export function resolveAccountByExternalRef(
  externalAccountRef: string | null | undefined
): ResolutionOutcome {
  return resolveByExternalRef(loadAccounts(), externalAccountRef);
}

// --- Mutation ---

/**
 * Register a new BrokerageAccount identity and persist it.
 *
 * Duplicate/conflict behavior: if the input carries a resolvable external reference that
 * already maps to exactly one active account, that existing account is returned unchanged
 * (idempotent registration — never create a second identity for the same broker account).
 * If the reference is ambiguous (already maps to more than one account), registration
 * refuses rather than guessing. A null/blank reference always creates a fresh identity
 * (anonymous accounts are permitted and never coalesced by absence).
 */
export type RegisterOutcome =
  | { kind: "created"; account: BrokerageAccount }
  | { kind: "existing"; account: BrokerageAccount }
  | { kind: "ambiguous"; matches: BrokerageAccount[] };

export function registerAccount(input: NewBrokerageAccountInput): RegisterOutcome {
  const accounts = loadAccounts();
  const norm = normalizeExternalRef(input.externalAccountRef);

  if (norm != null) {
    const resolution = resolveByExternalRef(accounts, norm);
    if (resolution.kind === "resolved") {
      return { kind: "existing", account: resolution.account };
    }
    if (resolution.kind === "ambiguous") {
      return { kind: "ambiguous", matches: resolution.matches };
    }
  }

  const account = createBrokerageAccount(input);
  saveAccounts([...accounts, account]);
  return { kind: "created", account };
}

/**
 * Update the mutable display data of an account (displayName / status). Identity and broker
 * reference are not changed here. Returns the updated account, or null if not found.
 */
export function updateAccount(
  brokerageAccountId: string,
  patch: Partial<Pick<BrokerageAccount, "displayName" | "status" | "externalAccountRef" | "lastSnapshotId" | "lastRefreshAt">>
): BrokerageAccount | null {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.brokerageAccountId === brokerageAccountId);
  if (idx === -1) return null;
  const next: BrokerageAccount = {
    ...accounts[idx],
    ...patch,
    // externalAccountRef, if provided, is normalized to preserve resolution invariants.
    externalAccountRef:
      patch.externalAccountRef !== undefined
        ? normalizeExternalRef(patch.externalAccountRef)
        : accounts[idx].externalAccountRef,
  };
  const copy = accounts.slice();
  copy[idx] = next;
  saveAccounts(copy);
  return next;
}

// --- Test Support ---

/** Clear the persisted registry. Test-only. */
export function _clearRegistryForTesting(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
