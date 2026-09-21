/**
 * Active BrokerageAccount selection context (Increment 3).
 *
 * SELECTION vs IMPORT (Principal resolution):
 *   - Identity determines WHERE evidence belongs (see account-import.ts).
 *   - Selection determines WHICH account the operator is currently operating/viewing.
 *   These are independent. Importing evidence must never change the active selection;
 *   switching the active account must never require an import.
 *
 * The active selection is a DURABLE OPERATOR PREFERENCE (persisted in workspace), NOT
 * account-local state and NOT the account's identity. An account does not "know" it is
 * selected.
 *
 * Demo is a SEPARATE application-context kind — it is NOT a BrokerageAccount and never
 * gets a fabricated brokerageAccountId (Principal resolution).
 */

import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import { getAccountById } from "./brokerage-account-registry";
import type { BrokerageAccount } from "./brokerage-account";

/**
 * The operator's current operating context.
 *  - "demo":    the demo portfolio (not a real account).
 *  - "account": a real BrokerageAccount, identified by brokerageAccountId.
 *  - "none":    no selection resolves (e.g. stale/removed account, nothing imported).
 */
export type ActiveAccountContext =
  | { kind: "demo" }
  | { kind: "account"; brokerageAccountId: string; account: BrokerageAccount }
  | { kind: "none" };

/**
 * Resolve the current active context from durable preference + registry.
 *
 * Precedence: an explicitly selected, still-resolvable account wins. Otherwise, the legacy
 * writeDeskSource === "demo" (or the absence of any selection) yields demo context. A
 * selected account id that no longer resolves (removed/renamed-away) fails safe to "none"
 * rather than silently loading a different account (stale-pointer guard).
 */
export function getActiveAccountContext(): ActiveAccountContext {
  const ws = loadWorkspace();
  const selectedId = ws.activeBrokerageAccountId;

  if (selectedId) {
    const account = getAccountById(selectedId);
    if (account && account.status === "active") {
      return { kind: "account", brokerageAccountId: selectedId, account };
    }
    // Selected id does not resolve to an active account — fail safe, do not guess.
    return { kind: "none" };
  }

  // No account selected. Demo is the default operating context (legacy behavior).
  if (ws.writeDeskSource === "demo" || ws.writeDeskSource == null) {
    return { kind: "demo" };
  }

  // writeDeskSource is "fidelity" but no account is selected yet (e.g. pre-migration or
  // legacy-unknown). Nothing to operate on until an account is selected/resolved.
  return { kind: "none" };
}

/** The active brokerageAccountId, or null when the context is demo/none. */
export function getActiveBrokerageAccountId(): string | null {
  const ctx = getActiveAccountContext();
  return ctx.kind === "account" ? ctx.brokerageAccountId : null;
}

/**
 * Select a real BrokerageAccount as the active operating context. Durable.
 * Does NOT import or mutate any account-local evidence — selection only.
 * Returns false if the id does not resolve to an active account (selection refused).
 */
export function selectAccount(brokerageAccountId: string): boolean {
  const account = getAccountById(brokerageAccountId);
  if (!account || account.status !== "active") return false;
  updateWorkspace({ activeBrokerageAccountId: brokerageAccountId, writeDeskSource: "fidelity" });
  return true;
}

/** Select the demo context. Clears any active account selection. */
export function selectDemo(): void {
  updateWorkspace({ activeBrokerageAccountId: null, writeDeskSource: "demo" });
}

/** Clear the active account selection without choosing demo (context becomes "none"). */
export function clearActiveAccount(): void {
  updateWorkspace({ activeBrokerageAccountId: null, writeDeskSource: "fidelity" });
}
