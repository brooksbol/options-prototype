/**
 * Increment 4 INTEGRATION — the LIVE intent path stamps the active BrokerageAccount.
 *
 * This exercises the exact wiring WriteDesk.onOrderConfirmed uses on the running app:
 *   buildWriteIntent({ candidate, brokerageAccountId: getActiveBrokerageAccountId() })
 *     -> createPendingIntent -> addPendingIntent -> persisted, account-scoped.
 *
 * It proves the behavior on the real consumer boundary (active-account context + persisted
 * intent store), not just the isolated intent module — so an intent confirmed under the
 * selected account is durably attributed to it, and the same symbol under a different
 * selected account is an independent persisted intent.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { buildWriteIntent } from "../../src/execution/write-intent";
import {
  createPendingIntent,
  addPendingIntent,
  loadWorkingIntents,
  loadWorkingIntentsForAccount,
  hasWorkingIntentForAccount,
} from "../../src/execution/pending-intent";
import { getActiveBrokerageAccountId } from "../../src/portfolio/active-account";
import { switchToAccount, importFidelityEvidence, _resetForTesting } from "../../src/portfolio/portfolio-store";
import { resolveAccountByExternalRef, _clearRegistryForTesting } from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import { _clearAccountEvidenceForTesting, type StoredCsvBlob } from "../../src/portfolio/account-evidence-store";
import { resetWorkspace } from "../../src/workspace/workspace";
import type { PutCandidate } from "../../src/write-desk/candidate-types";

const PTS_BAL = `Brokerage
Account Name / Account Number,PTS - Z12-345678
,Balance,Day change
Total account value,113842.91,
AVAILABLE TO TRADE,,
Available without margin impact,4200,
MARGIN STATUS,,
`;
const PTS_OS = `Option Summary Z12-345678
Quote data as of 2026-09-18.
Symbol,Description,Quantity,Last Price,Current Value,Strategy
SPY,SPDR S&P 500,100,500,50000,Covered Call
`;
const ROTH_BAL = `Brokerage
Account Name / Account Number,Sawdust Roth - Z98-765432
Description,Amount,Day Change
Available to trade (all settled),510.28,
Total account value,23736.47,
`;
const ROTH_OS = `Option Summary Z98-765432
Quote data as of 2026-09-18.
Symbol,Description,Quantity,Last Price,Current Value,Strategy
QQQ,Invesco QQQ,100,450,45000,Covered Call
`;

function blob(text: string, filename: string): StoredCsvBlob {
  return { text, filename };
}
function putCandidate(symbol: string, strike: number): PutCandidate {
  return { symbol, expiration: "2026-08-07", strike, bid: 1.75 } as unknown as PutCandidate;
}

/** Replicates WriteDesk.onOrderConfirmed exactly. */
function confirmOrderLikeWriteDesk(candidate: PutCandidate): void {
  const intent = buildWriteIntent({ candidate, brokerageAccountId: getActiveBrokerageAccountId() });
  if (intent) addPendingIntent(createPendingIntent(intent));
}

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _resetIdCounterForTesting();
  resetWorkspace();
  _resetForTesting();
});

describe("live intent path stamps the active account", () => {
  it("an order confirmed under the selected account persists attributed to that account", () => {
    // Import PTS (adopts it active) and import Roth (stays inactive).
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "p-os.csv"), balances: blob(PTS_BAL, "p-bal.csv") });
    importFidelityEvidence({ optionSummary: blob(ROTH_OS, "r-os.csv"), balances: blob(ROTH_BAL, "r-bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");
    const ptsId = pts.brokerageAccountId;
    const roth = resolveAccountByExternalRef("Z98-765432");
    if (roth.kind !== "resolved") throw new Error("setup");
    const rothId = roth.account.brokerageAccountId;

    // Active is PTS → confirm an SPY order.
    expect(getActiveBrokerageAccountId()).toBe(ptsId);
    confirmOrderLikeWriteDesk(putCandidate("SPY", 500));

    // Switch to Roth → confirm a SPY order there too.
    expect(switchToAccount(rothId)).toBe(true);
    confirmOrderLikeWriteDesk(putCandidate("SPY", 500));

    const working = loadWorkingIntents();
    expect(working).toHaveLength(2);

    // Each SPY intent is attributed to the account that was active when confirmed, and the
    // two are independent per account (the Increment 4 stress requirement, live).
    expect(loadWorkingIntentsForAccount(ptsId, working)).toHaveLength(1);
    expect(loadWorkingIntentsForAccount(rothId, working)).toHaveLength(1);
    expect(hasWorkingIntentForAccount(ptsId, "SPY", working)).toBe(true);
    expect(hasWorkingIntentForAccount(rothId, "SPY", working)).toBe(true);
    // The PTS SPY intent is NOT visible under Roth and vice versa.
    expect(loadWorkingIntentsForAccount(ptsId, working)[0].brokerageAccountId).toBe(ptsId);
    expect(loadWorkingIntentsForAccount(rothId, working)[0].brokerageAccountId).toBe(rothId);
  });
});
