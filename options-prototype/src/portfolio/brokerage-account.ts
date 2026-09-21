/**
 * BrokerageAccount — Stable Wheelwright identity for a broker account (Increment 1).
 *
 * RATIFIED INVARIANT (PL-PORT-01, closure SHA 6a99217):
 *   Multi-BrokerageAccount state is keyed by a stable Wheelwright `brokerageAccountId`
 *   and is account-local. It is NOT partitioned by Operator ownership.
 *
 * Four semantic layers are kept strictly distinct:
 *   1. Wheelwright BrokerageAccount identity  → `brokerageAccountId` (this module)
 *   2. External broker account identity/ref   → `externalAccountRef` (evidence, not identity)
 *   3. Future application authorization/access → NOT MODELLED HERE (PL-ARCH-03/07)
 *   4. Financial/legal ownership              → NOT MODELLED HERE
 *
 * This module deliberately introduces NO ownership/authorization fields. `brokerageAccountId`
 * is minted by Wheelwright and never derived from broker data, so a broker renumbering or
 * masking the external reference never changes Wheelwright identity.
 *
 * Account regime is deliberately NOT stored as an independent mutable truth here. The
 * operative regime is always evidence-derived from the account's snapshot/balance evidence
 * (see Increment 2). The registry only carries the reference/metadata of the latest
 * successful refresh, never a second authoritative-looking regime value.
 */

// --- Domain Type ---

export type BrokerageProvider = "fidelity";

export type BrokerageAccountStatus = "active" | "archived";

export interface BrokerageAccount {
  /**
   * Stable Wheelwright identity. Minted by Wheelwright, immutable, never derived from
   * broker data. This is the partition key for all account-local state.
   */
  brokerageAccountId: string;

  /** Broker/provider. Extensible; only Fidelity is currently supported. */
  broker: BrokerageProvider;

  /**
   * External broker account reference (e.g. Fidelity "XXXX-1234"). EVIDENCE, not identity.
   * Used to resolve imported evidence to an existing account; never the primary key.
   * Null when the account was created without a resolvable broker reference.
   */
  externalAccountRef: string | null;

  /** Operator-assigned display label. May be seeded from broker data but the operator owns it. */
  displayName: string;

  /** Soft lifecycle. Evidence is never hard-deleted silently; accounts are archived. */
  status: BrokerageAccountStatus;

  /** ISO timestamp the account identity was created in Wheelwright. */
  createdAt: string;

  /**
   * Reference metadata for the latest successful evidence refresh, when known. This is
   * provenance/convenience only — it does NOT carry authoritative regime or capital state.
   * The operative snapshot/regime is always read from account-local evidence.
   */
  lastSnapshotId: string | null;
  lastRefreshAt: string | null;
}

// --- Identity Minting ---

let accountIdCounter = 0;

/**
 * Mint a new stable Wheelwright brokerageAccountId.
 * Matches the repository id convention (`${prefix}-${Date.now()}-${suffix}`).
 * `now`/`suffix` are injectable for deterministic tests.
 */
export function generateBrokerageAccountId(
  now: number = Date.now(),
  suffix?: string
): string {
  accountIdCounter++;
  const tail = suffix ?? accountIdCounter.toString(36);
  return `ba-${now}-${tail}`;
}

// --- External Reference Normalization ---

/**
 * Normalize an external broker account reference for comparison/resolution.
 * Broker references are compared case-insensitively with surrounding whitespace trimmed.
 * Returns null for absent/blank references (absence is not identity).
 */
export function normalizeExternalRef(ref: string | null | undefined): string | null {
  if (ref == null) return null;
  const trimmed = ref.trim();
  if (trimmed === "") return null;
  return trimmed.toUpperCase();
}

// --- Construction ---

export interface NewBrokerageAccountInput {
  broker: BrokerageProvider;
  externalAccountRef?: string | null;
  displayName?: string | null;
  now?: number;
  /** Deterministic id override for tests. */
  idOverride?: string;
}

/**
 * Construct a new BrokerageAccount identity. Pure — does not persist.
 * A blank/absent externalAccountRef is normalized to null (identity does not depend on it).
 * displayName falls back to the external reference, then to a generic label.
 */
export function createBrokerageAccount(input: NewBrokerageAccountInput): BrokerageAccount {
  const now = input.now ?? Date.now();
  const externalAccountRef = normalizeExternalRef(input.externalAccountRef);
  const displayName =
    (input.displayName?.trim() || null) ??
    null;
  return {
    brokerageAccountId: input.idOverride ?? generateBrokerageAccountId(now),
    broker: input.broker,
    externalAccountRef,
    displayName: displayName ?? externalAccountRef ?? "Unnamed account",
    status: "active",
    createdAt: new Date(now).toISOString(),
    lastSnapshotId: null,
    lastRefreshAt: null,
  };
}

// --- Resolution ---

export type ResolutionOutcome =
  | { kind: "resolved"; account: BrokerageAccount }
  | { kind: "no-match" }
  | { kind: "ambiguous"; matches: BrokerageAccount[] };

/**
 * Resolve an imported external broker reference to an existing BrokerageAccount.
 *
 * - "resolved": exactly one active account matches the normalized reference.
 * - "no-match": no active account matches (caller may create a new account).
 * - "ambiguous": more than one active account matches (must not guess — fail safe).
 *
 * A null/blank incoming reference never resolves; callers must handle missing identity
 * explicitly rather than silently attaching to any account.
 */
export function resolveByExternalRef(
  accounts: BrokerageAccount[],
  externalAccountRef: string | null | undefined
): ResolutionOutcome {
  const norm = normalizeExternalRef(externalAccountRef);
  if (norm == null) return { kind: "no-match" };
  const matches = accounts.filter(
    (a) => a.status === "active" && normalizeExternalRef(a.externalAccountRef) === norm
  );
  if (matches.length === 0) return { kind: "no-match" };
  if (matches.length === 1) return { kind: "resolved", account: matches[0] };
  return { kind: "ambiguous", matches };
}

/** Look up an account by its stable Wheelwright identity. */
export function findById(
  accounts: BrokerageAccount[],
  brokerageAccountId: string
): BrokerageAccount | null {
  return accounts.find((a) => a.brokerageAccountId === brokerageAccountId) ?? null;
}

// --- Test Support ---

/** Reset the id counter. Test-only. */
export function _resetIdCounterForTesting(): void {
  accountIdCounter = 0;
}
