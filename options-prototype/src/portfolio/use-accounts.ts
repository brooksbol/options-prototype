/**
 * React hook exposing the BrokerageAccount list + active account, reactively.
 *
 * Re-reads whenever the portfolio store notifies (import creates/adopts an account, or the
 * operator switches accounts), so the header account picker always reflects the live
 * registry + active selection without the caller touching store internals.
 */

import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot } from "./portfolio-store";
import { loadAccounts } from "./brokerage-account-registry";
import { getActiveBrokerageAccountId } from "./active-account";
import type { BrokerageAccount } from "./brokerage-account";

export interface AccountsView {
  /** Active (non-archived) BrokerageAccounts, in creation order. */
  accounts: BrokerageAccount[];
  /** The currently active account id, or null (demo / none). */
  activeBrokerageAccountId: string | null;
}

// A stable snapshot cache so useSyncExternalStore does not loop (it compares by reference).
let cache: AccountsView | null = null;
let cacheKey = "";

function readAccountsView(): AccountsView {
  const accounts = loadAccounts().filter((a) => a.status === "active");
  const activeId = getActiveBrokerageAccountId();
  // Derive a cheap identity key from the fields the picker renders; only rebuild the object
  // (new reference) when something the UI cares about actually changed.
  const key =
    activeId +
    "|" +
    accounts.map((a) => `${a.brokerageAccountId}:${a.displayName}:${a.externalAccountRef ?? ""}`).join(",");
  if (!cache || key !== cacheKey) {
    cache = { accounts, activeBrokerageAccountId: activeId };
    cacheKey = key;
  }
  return cache;
}

export function useAccounts(): AccountsView {
  // getSnapshot for the store drives re-subscription notifications; we derive our own view.
  useSyncExternalStore(subscribe, getSnapshot);
  return readAccountsView();
}

/** Test-only: reset the memo cache so a fresh registry state is observed. */
export function _resetAccountsViewCacheForTesting(): void {
  cache = null;
  cacheKey = "";
}
