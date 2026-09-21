/**
 * Account-scoped Fidelity evidence persistence + legacy singleton migration (Increment 2).
 *
 * Promotes Fidelity CSV evidence persistence from the single-slot legacy keys to
 * per-account keys keyed by the stable Wheelwright `brokerageAccountId`:
 *
 *   legacy (singleton):  wheelwright:fidelity-csv:option-summary | balances | activity
 *   per-account:         wheelwright:acct:<baId>:fidelity-csv:option-summary | balances | activity
 *
 * Each blob keeps the existing `{ text, filename }` shape (backward compatible content).
 *
 * MIGRATION DISCIPLINE (Principal resolutions):
 *   - Idempotent: running migration repeatedly produces the same result and re-keys once.
 *   - Non-destructive: legacy blobs are NOT deleted here (Increment 8 owns final cleanup);
 *     migration only copies evidence into a resolved per-account slot.
 *   - Unambiguous Fidelity identity (external account ref from Balances) auto-creates or
 *     resolves a BrokerageAccount and attaches the evidence to it.
 *   - Ambiguous or missing identity is NEVER invented: the legacy evidence is recorded as
 *     legacy/unknown-account and left for explicit operator resolution. No account-local
 *     state silently lands in another account.
 *
 * This module owns its localStorage keys; nothing else reads/writes them directly.
 */

import type { ParsedBalances } from "../csv/fidelity/balancesParser";
import { preprocessCsv } from "../csv/preprocess";
import { detectDelimiter, parseCsv } from "../csv/reader";
import { classifyDocument } from "../csv/registry";
import "../csv/fidelity"; // ensure Fidelity parsers are registered
import {
  registerAccount,
  loadAccounts,
} from "./brokerage-account-registry";
import { normalizeExternalRef, resolveByExternalRef } from "./brokerage-account";

// --- Legacy singleton keys (Increment 0 baseline) ---

const LEGACY_KEY_OS = "wheelwright:fidelity-csv:option-summary";
const LEGACY_KEY_BAL = "wheelwright:fidelity-csv:balances";
const LEGACY_KEY_ACTIVITY = "wheelwright:fidelity-csv:activity";

// --- Migration marker + legacy-unknown record ---

const MIGRATION_MARKER_KEY = "wheelwright:acct-migration:v1";
const LEGACY_UNKNOWN_KEY = "wheelwright:acct:legacy-unknown:fidelity-csv";

export type CsvDocKind = "option-summary" | "balances" | "activity";

export interface StoredCsvBlob {
  text: string;
  filename: string;
}

// --- Per-account key derivation ---

function accountKey(brokerageAccountId: string, kind: CsvDocKind): string {
  return `wheelwright:acct:${brokerageAccountId}:fidelity-csv:${kind}`;
}

// --- Per-account read/write ---

export function readAccountCsv(brokerageAccountId: string, kind: CsvDocKind): StoredCsvBlob | null {
  return readBlob(accountKey(brokerageAccountId, kind));
}

export function writeAccountCsv(
  brokerageAccountId: string,
  kind: CsvDocKind,
  blob: StoredCsvBlob
): void {
  writeBlob(accountKey(brokerageAccountId, kind), blob);
}

function readBlob(key: string): StoredCsvBlob | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.text === "string" && typeof parsed?.filename === "string") {
      return { text: parsed.text, filename: parsed.filename };
    }
    return null;
  } catch {
    return null;
  }
}

function writeBlob(key: string, blob: StoredCsvBlob): void {
  try {
    localStorage.setItem(key, JSON.stringify(blob));
  } catch {
    // localStorage full/unavailable — fail silently (prototype convention).
  }
}

// --- Identity resolution from a Balances blob ---

/**
 * Parse a Balances CSV blob and return its external broker account reference (normalized),
 * or null when the blob is missing/unparseable or carries no identity. Never throws.
 */
export function externalRefFromBalancesBlob(blob: StoredCsvBlob | null): string | null {
  if (!blob) return null;
  try {
    const { csvContent, preambleLines } = preprocessCsv(blob.text);
    const delimiter = detectDelimiter(csvContent);
    const doc = parseCsv(csvContent, delimiter);
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_balances") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    if (parsed.payload.type !== "balances" || !parsed.payload.rows[0]) return null;
    const balances = parsed.payload.rows[0] as unknown as ParsedBalances;
    return normalizeExternalRef(balances.accountNumber ?? null);
  } catch {
    return null;
  }
}

// --- Legacy migration ---

export type MigrationResult =
  | { kind: "already-migrated" }
  | { kind: "no-legacy-evidence" }
  | { kind: "migrated"; brokerageAccountId: string; externalAccountRef: string }
  | { kind: "legacy-unknown"; reason: "missing-identity" | "ambiguous-identity" };

interface LegacyUnknownRecord {
  reason: "missing-identity" | "ambiguous-identity";
  recordedAt: string;
}

function isMigrated(): boolean {
  try {
    return localStorage.getItem(MIGRATION_MARKER_KEY) != null;
  } catch {
    return false;
  }
}

function markMigrated(payload: MigrationResult): void {
  try {
    localStorage.setItem(MIGRATION_MARKER_KEY, JSON.stringify({ ...payload, migratedAt: new Date().toISOString() }));
  } catch {
    // ignore
  }
}

function recordLegacyUnknown(reason: LegacyUnknownRecord["reason"]): void {
  try {
    const os = readBlob(LEGACY_KEY_OS);
    const bal = readBlob(LEGACY_KEY_BAL);
    const act = readBlob(LEGACY_KEY_ACTIVITY);
    localStorage.setItem(
      LEGACY_UNKNOWN_KEY,
      JSON.stringify({
        reason,
        recordedAt: new Date().toISOString(),
        optionSummary: os,
        balances: bal,
        activity: act,
      })
    );
  } catch {
    // ignore
  }
}

/** Read the recorded legacy-unknown state, if any (for operator resolution UX later). */
export function readLegacyUnknown(): LegacyUnknownRecord | null {
  try {
    const raw = localStorage.getItem(LEGACY_UNKNOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.reason === "missing-identity" || parsed?.reason === "ambiguous-identity") {
      return { reason: parsed.reason, recordedAt: parsed.recordedAt };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Migrate legacy single-slot Fidelity evidence to an account-keyed slot.
 *
 * Idempotent (guarded by a migration marker) and non-destructive (legacy keys are left
 * in place; Increment 8 owns their eventual removal once safety is established).
 *
 * Resolution:
 *   - No legacy Balances/OptionSummary evidence at all → no-op ("no-legacy-evidence").
 *   - Unambiguous external ref present → resolve/register a BrokerageAccount and copy the
 *     legacy blobs into its per-account slots.
 *   - Missing external ref → "legacy-unknown" (missing-identity); evidence preserved for
 *     explicit operator assignment. Provenance is NOT invented.
 *   - Ambiguous external ref (already maps to >1 account) → "legacy-unknown"
 *     (ambiguous-identity); never guesses.
 */
export function migrateLegacySingletonEvidence(): MigrationResult {
  if (isMigrated()) return { kind: "already-migrated" };

  const os = readBlob(LEGACY_KEY_OS);
  const bal = readBlob(LEGACY_KEY_BAL);
  const act = readBlob(LEGACY_KEY_ACTIVITY);

  // Nothing meaningful to migrate. Do not write a marker — a future legacy import could
  // still arrive under the old keys before Increment 3 switches the store over.
  if (!os && !bal) {
    return { kind: "no-legacy-evidence" };
  }

  const externalRef = externalRefFromBalancesBlob(bal);

  if (externalRef == null) {
    recordLegacyUnknown("missing-identity");
    const result: MigrationResult = { kind: "legacy-unknown", reason: "missing-identity" };
    markMigrated(result);
    return result;
  }

  // Guard against a pre-existing ambiguous registry state (defensive; never guess).
  const resolution = resolveByExternalRef(loadAccounts(), externalRef);
  if (resolution.kind === "ambiguous") {
    recordLegacyUnknown("ambiguous-identity");
    const result: MigrationResult = { kind: "legacy-unknown", reason: "ambiguous-identity" };
    markMigrated(result);
    return result;
  }

  const reg = registerAccount({ broker: "fidelity", externalAccountRef: externalRef });
  if (reg.kind === "ambiguous") {
    recordLegacyUnknown("ambiguous-identity");
    const result: MigrationResult = { kind: "legacy-unknown", reason: "ambiguous-identity" };
    markMigrated(result);
    return result;
  }

  const brokerageAccountId = reg.account.brokerageAccountId;

  // Copy legacy blobs into the per-account slots (idempotent overwrite with identical data).
  if (os) writeAccountCsv(brokerageAccountId, "option-summary", os);
  if (bal) writeAccountCsv(brokerageAccountId, "balances", bal);
  if (act) writeAccountCsv(brokerageAccountId, "activity", act);

  const result: MigrationResult = { kind: "migrated", brokerageAccountId, externalAccountRef: externalRef };
  markMigrated(result);
  return result;
}

// --- Test Support ---

export function _clearAccountEvidenceForTesting(): void {
  try {
    localStorage.removeItem(MIGRATION_MARKER_KEY);
    localStorage.removeItem(LEGACY_UNKNOWN_KEY);
    // Remove any per-account fidelity-csv slots.
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("wheelwright:acct:")) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
