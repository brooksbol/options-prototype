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
import { registerAccount, resolveAccountByExternalRef, getAccountById, updateAccount } from "./brokerage-account-registry";
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
 * Account-TARGETED import (explicit-account workflow, follow-on).
 *
 * The operator has explicitly selected/created the account they intend to refresh, then
 * uploads CSVs. Identity still governs SAFETY, but the operator's explicit target is honored:
 *
 *  - Files disagree on identity            → conflict (fail closed, nothing written).
 *  - A ref is present and already belongs to a DIFFERENT account → conflict "belongs-to-other"
 *    (never reassign another account's evidence to the target).
 *  - A ref is present and the target has NO ref yet → BIND it to the target (deferred identity
 *    binding for a manually-created account), then refresh.
 *  - A ref is present and matches the target's existing ref → refresh.
 *
 * FAIL-CLOSED ON UNIDENTIFIED AUTHORITATIVE EVIDENCE (Principal correction): selecting an
 * account expresses INTENT; it does NOT prove an unidentified Balances file belongs to it (a
 * wrong file picked from Finder is exactly the mistake to catch). Therefore:
 *  - Balances with NO usable account identity → refuse ("unidentified-balances"); the target
 *    is not bound and not overwritten.
 *  - Option Summary / Activity that carry no independent identity MAY be written to the target
 *    ONLY within a coherent operation whose Balances established (or matched) the identity, OR
 *    when the target already has an established ref. They never independently define identity.
 *
 * Never invents an external reference; never guesses across accounts.
 */
export type TargetedImportResult =
  | { kind: "refreshed"; brokerageAccountId: string; boundExternalRef: string | null }
  | {
      /**
       * The uploaded evidence cleanly identifies a DIFFERENT already-known account, so it was
       * routed there and refreshed. The selected/target account was NOT changed and remains
       * the active view. (Identity determines where evidence goes; selection is not an
       * identity override, but neither does it prohibit correctly routing identifiable
       * evidence — ratified off-account behavior.)
       */
      kind: "routed-elsewhere";
      routedToBrokerageAccountId: string;
      externalAccountRef: string;
    }
  | { kind: "conflict"; reason: "files-disagree"; refs: string[] }
  | { kind: "unidentified-balances" }
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

  const balRef = externalRefFromBalancesBlob(op.balances ?? null);
  const osRef = externalRefFromOptionSummaryBlob(op.optionSummary ?? null);
  const distinctRefs = Array.from(new Set([balRef, osRef].filter((r): r is string => r != null)));

  // Cross-file disagreement → refuse the merge (fail closed).
  if (distinctRefs.length > 1) {
    return { kind: "conflict", reason: "files-disagree", refs: distinctRefs };
  }

  const incomingRef = distinctRefs[0] ?? null;
  const targetRef = normalizeExternalRef(target.externalAccountRef);
  let boundExternalRef: string | null = null;

  // Balances is economically authoritative. If a Balances file is present but carries NO
  // usable account identity, refuse — do NOT attach it merely because this account is
  // selected. (An Activity-only or OS-only import has no Balances and skips this guard.)
  if (op.balances && balRef == null) {
    return { kind: "unidentified-balances" };
  }

  if (incomingRef != null) {
    // If the evidence cleanly identifies a DIFFERENT already-known account, route it there
    // (refresh that account) and leave the selected/target account untouched. This preserves
    // the ratified rule: identity determines where evidence goes. It is NOT a refusal — the
    // file is unambiguous, just for another account.
    const owner = resolveAccountByExternalRef(incomingRef);
    if (owner.kind === "resolved" && owner.account.brokerageAccountId !== targetBrokerageAccountId) {
      const other = owner.account.brokerageAccountId;
      if (op.optionSummary) writeAccountCsv(other, "option-summary", op.optionSummary);
      if (op.balances) writeAccountCsv(other, "balances", op.balances);
      if (op.activity) writeAccountCsv(other, "activity", op.activity);
      return { kind: "routed-elsewhere", routedToBrokerageAccountId: other, externalAccountRef: incomingRef };
    }
    if (owner.kind === "ambiguous") {
      // The incoming ref maps to more than one account — genuinely ambiguous; fail closed
      // (do not guess which account, do not write).
      return { kind: "conflict", reason: "files-disagree", refs: [incomingRef] };
    }
    if (targetRef != null && targetRef !== incomingRef) {
      // The selected account already has a different identity and the incoming ref is not
      // owned by any account: it does not belong here. Fail closed rather than rebinding.
      return { kind: "unidentified-balances" };
    }
    if (targetRef == null) {
      // Unowned incoming ref + target has no identity yet → safe to bind to this account.
      updateAccount(targetBrokerageAccountId, { externalAccountRef: incomingRef });
      boundExternalRef = incomingRef;
    }
    // else targetRef === incomingRef → plain refresh, no binding needed.
  } else if (targetRef == null) {
    // No identity from any file AND the target has no established identity. The only files
    // here are OS and/or Activity (a no-identity Balances already returned above). These
    // cannot establish identity on their own, so there is nothing authoritative to attach
    // them to yet. Refuse rather than parking economically-relevant evidence on an
    // unidentified account.
    if (op.optionSummary) {
      // OS alone into an unidentified account: treat like unidentified authoritative evidence.
      return { kind: "unidentified-balances" };
    }
    // Activity-only into an unidentified account: nothing to inherit identity from.
    return { kind: "unidentified-balances" };
  }
  // else: no incoming ref but the target already has an established ref → OS/Activity inherit
  // that identity (operator-directed, safe).

  // Write the operator-directed evidence into the target account's slots.
  if (op.optionSummary) writeAccountCsv(targetBrokerageAccountId, "option-summary", op.optionSummary);
  if (op.balances) writeAccountCsv(targetBrokerageAccountId, "balances", op.balances);
  if (op.activity) writeAccountCsv(targetBrokerageAccountId, "activity", op.activity);

  return { kind: "refreshed", brokerageAccountId: targetBrokerageAccountId, boundExternalRef };
}
