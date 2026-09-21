/**
 * Import resolution: attach imported Fidelity evidence to the account it BELONGS to,
 * independent of which account is currently selected (Increment 3).
 *
 * Cases (Principal resolutions):
 *   A. Active account X, import X's files      → refresh X. Active stays X.
 *   B. Active account X, import Y's files       → refresh Y. Active STAYS X. Report that Y
 *                                                 was refreshed while X remains selected.
 *                                                 Do NOT ask to reassign correctly-identified
 *                                                 evidence just because another account is active.
 *   C. Import evidence with no resolvable identity → do NOT attach to the active account.
 *                                                 Require safe resolution/assignment.
 *   D. Imported files disagree on account identity → refuse the merge / surface conflict.
 *                                                 Never guess.
 *
 * This function NEVER changes the active selection. Selection is a separate concern
 * (active-account.ts). Activity has no identity of its own and inherits the operation's
 * resolved account (it is an overlay), matching prior behavior.
 */

import {
  externalRefFromBalancesBlob,
  writeAccountCsv,
  type StoredCsvBlob,
} from "./account-evidence-store";
import { registerAccount, resolveAccountByExternalRef, getAccountById } from "./brokerage-account-registry";
import { normalizeExternalRef } from "./brokerage-account";
import { preprocessCsv } from "../csv/preprocess";
import { detectDelimiter, parseCsv } from "../csv/reader";
import { classifyDocument } from "../csv/registry";
import "../csv/fidelity";

/** The files presented in a single import operation. Any subset may be present. */
export interface ImportOperation {
  optionSummary?: StoredCsvBlob | null;
  balances?: StoredCsvBlob | null;
  activity?: StoredCsvBlob | null;
}

export type ImportResolution =
  | {
      kind: "refreshed";
      brokerageAccountId: string;
      externalAccountRef: string;
      createdAccount: boolean;
      /** True when the refreshed account differs from the currently active one (Case B). */
      differsFromActive: boolean;
    }
  | { kind: "needs-assignment"; reason: "missing-identity" }
  | { kind: "conflict"; refs: string[] }
  | { kind: "empty" };

/**
 * Extract a normalized external account reference from an Option Summary blob, when the
 * export preamble carries one. Best-effort; returns null when absent/unparseable.
 */
export function externalRefFromOptionSummaryBlob(blob: StoredCsvBlob | null | undefined): string | null {
  if (!blob) return null;
  try {
    const { csvContent, preambleLines } = preprocessCsv(blob.text);
    const doc = parseCsv(csvContent, detectDelimiter(csvContent));
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_option_summary") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    // Option Summary metadata may carry an accountNumber extracted from its preamble, but
    // the OS parser's token capture can be partial (it stops at a hyphen). To avoid FALSE
    // Case-D conflicts against the authoritative hyphenated Balances reference, only treat
    // the OS ref as a corroborating signal when it independently matches the full
    // "XXXX-1234" account-number format. A partial token is discarded (null), not trusted.
    const acct = (parsed.metadata as { accountNumber?: string }).accountNumber;
    if (acct == null) return null;
    const full = acct.match(/([A-Z0-9]{3,4}-[A-Z0-9]{3,6})/);
    return full ? normalizeExternalRef(full[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Resolve an import operation to the account its evidence belongs to and refresh that
 * account's per-account evidence slots. Does not change the active selection.
 *
 * @param activeBrokerageAccountId  The currently selected account id (for Case B reporting).
 */
export function resolveImport(
  op: ImportOperation,
  activeBrokerageAccountId: string | null
): ImportResolution {
  const hasAny = !!(op.optionSummary || op.balances || op.activity);
  if (!hasAny) return { kind: "empty" };

  // Gather authoritative-ish identity signals from each file that can carry one.
  // Balances is the authoritative source; Option Summary is corroborating.
  const balRef = externalRefFromBalancesBlob(op.balances ?? null);
  const osRef = externalRefFromOptionSummaryBlob(op.optionSummary ?? null);

  const presentRefs = [balRef, osRef].filter((r): r is string => r != null);
  const distinctRefs = Array.from(new Set(presentRefs));

  // Case D: files present disagree on identity → refuse the merge.
  if (distinctRefs.length > 1) {
    return { kind: "conflict", refs: distinctRefs };
  }

  // Case C: no resolvable identity from any identity-bearing file → require assignment.
  // (Activity alone can never establish identity; it inherits, so it is not counted here.)
  const resolvedRef = distinctRefs[0] ?? null;
  if (resolvedRef == null) {
    return { kind: "needs-assignment", reason: "missing-identity" };
  }

  // Resolve or create the account for this reference. Never guess on ambiguity.
  const existing = resolveAccountByExternalRef(resolvedRef);
  if (existing.kind === "ambiguous") {
    return { kind: "conflict", refs: [resolvedRef] };
  }

  let brokerageAccountId: string;
  let createdAccount = false;
  if (existing.kind === "resolved") {
    brokerageAccountId = existing.account.brokerageAccountId;
  } else {
    const reg = registerAccount({ broker: "fidelity", externalAccountRef: resolvedRef });
    if (reg.kind === "ambiguous") {
      return { kind: "conflict", refs: [resolvedRef] };
    }
    brokerageAccountId = reg.account.brokerageAccountId;
    createdAccount = reg.kind === "created";
  }

  // Refresh the resolved account's evidence slots (Case A/B: attach where it BELONGS).
  if (op.optionSummary) writeAccountCsv(brokerageAccountId, "option-summary", op.optionSummary);
  if (op.balances) writeAccountCsv(brokerageAccountId, "balances", op.balances);
  if (op.activity) writeAccountCsv(brokerageAccountId, "activity", op.activity);

  return {
    kind: "refreshed",
    brokerageAccountId,
    externalAccountRef: resolvedRef,
    createdAccount,
    differsFromActive: activeBrokerageAccountId != null && activeBrokerageAccountId !== brokerageAccountId,
  };
}

/**
 * Account-TARGETED import (explicit-account workflow).
 *
 * SELECTION IS THE SOLE IDENTITY AUTHORITY (Principal ratified decision — Option 1).
 *
 * The operator has explicitly selected or created the account they intend to refresh, then
 * uploads CSVs. Their explicit target IS the identity decision. This path performs NO
 * account-number identity check of any kind:
 *
 *  - No CSV/filename account-number extraction.
 *  - No identity-based refusals (no unidentified-balances, no pending-identity, no
 *    cross-file files-disagree, no belongs-to-other / routed-elsewhere).
 *
 * The ONLY gate is structural validity — "is this a valid Balances / Option Summary /
 * Activity CSV?" — which the upstream upload surface already enforces before calling here
 * (a non-CSV or wrong-shape file never reaches this function as a populated slot).
 *
 * Rationale: real Fidelity CSV exports do NOT reliably contain an account number. It is not
 * in the CSV body, and filenames are untrustworthy. Gating on a file-derived account number
 * produced FALSE refusals that blocked valid uploads. The Principal accepted the explicit
 * tradeoff: with selection as sole authority, uploading the wrong account's file into the
 * selected account WILL load it (no detection). That is acceptable.
 *
 * A structurally-valid CSV uploaded into the explicitly selected account is accepted into
 * that account. No account number required, ever.
 */
export type TargetedImportResult =
  | { kind: "refreshed"; brokerageAccountId: string }
  | { kind: "empty" }
  | { kind: "unknown-target" };

export function importIntoAccount(
  op: ImportOperation,
  targetBrokerageAccountId: string
): TargetedImportResult {
  const hasAny = !!(op.optionSummary || op.balances || op.activity);
  if (!hasAny) return { kind: "empty" };

  const target = getAccountById(targetBrokerageAccountId);
  if (!target || target.status !== "active") return { kind: "unknown-target" };

  // Selection is the sole identity authority: write the operator-directed, structurally-valid
  // evidence straight into the selected account's slots. No account-number extraction, no
  // identity refusals, no cross-account routing.
  if (op.optionSummary) writeAccountCsv(targetBrokerageAccountId, "option-summary", op.optionSummary);
  if (op.balances) writeAccountCsv(targetBrokerageAccountId, "balances", op.balances);
  if (op.activity) writeAccountCsv(targetBrokerageAccountId, "activity", op.activity);

  return { kind: "refreshed", brokerageAccountId: targetBrokerageAccountId };
}
