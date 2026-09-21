/**
 * Increment 7 — Account-safe Production state.
 *
 * Production assessment is fed the ACTIVE account's own Activity CSV (POST
 * /api/production/assess). The backend ProductionAssessor is account-agnostic, so
 * account-safety is established by WHICH activity is sent. This proves the store sources
 * the active account's activity (never a global/legacy blob, never another account's), so
 * Production for PTS can never consume Sawdust's realized activity and vice versa.
 *
 * The account-dependent Production derivations (deriveMonitoredPositions /
 * deriveCurrentMonthProduction / deriveProductionOutlook) are already parameterized by the
 * active account's snapshot + assessment; the residual gap was the activity-CSV source,
 * which these tests cover at the live store boundary.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  importFidelityEvidence,
  switchToAccount,
  getActiveAccountActivityText,
  getActivityFilename,
  getActivityRows,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import { getActiveBrokerageAccountId } from "../../src/portfolio/active-account";
import { resolveAccountByExternalRef, _clearRegistryForTesting } from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import { _clearAccountEvidenceForTesting, type StoredCsvBlob } from "../../src/portfolio/account-evidence-store";
import { _clearHistoryForTesting } from "../../src/portfolio/portfolio-capital-history";
import { resetWorkspace } from "../../src/workspace/workspace";

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

// Distinct Activity CSVs per account (fidelity_activity classification: has "Run Date",
// "Action", "Symbol"; distinguished from Positions by lacking "Account Number").
const PTS_ACTIVITY = `Run Date,Action,Symbol,Description,Quantity,Price,Amount
09/02/2026,SOLD TO OPEN,-SPY260918P500,SPY PUT,-1,5.00,500.00
`;
const ROTH_ACTIVITY = `Run Date,Action,Symbol,Description,Quantity,Price,Amount
09/03/2026,SOLD TO OPEN,-QQQ260918C450,QQQ CALL,-1,3.00,300.00
`;

const LEGACY_ACTIVITY_KEY = "wheelwright:fidelity-csv:activity";

function blob(text: string, filename: string): StoredCsvBlob { return { text, filename }; }

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _clearHistoryForTesting();
  _resetIdCounterForTesting();
  resetWorkspace();
  _resetForTesting();
});

describe("Production activity source is account-scoped (Increment 7)", () => {
  it("getActiveAccountActivityText / getActivityFilename return the ACTIVE account's activity", () => {
    // Import PTS with its own Activity (adopts PTS active).
    const pts = importFidelityEvidence({
      optionSummary: blob(PTS_OS, "pts-os.csv"),
      balances: blob(PTS_BAL, "pts-bal.csv"),
      activity: blob(PTS_ACTIVITY, "pts-activity.csv"),
    });
    if (pts.kind !== "refreshed") throw new Error("setup");
    const ptsId = pts.brokerageAccountId;

    // Import Sawdust Roth with its own Activity (Case B — does not change active).
    importFidelityEvidence({
      optionSummary: blob(ROTH_OS, "roth-os.csv"),
      balances: blob(ROTH_BAL, "roth-bal.csv"),
      activity: blob(ROTH_ACTIVITY, "roth-activity.csv"),
    });
    const roth = resolveAccountByExternalRef("Z98-765432");
    if (roth.kind !== "resolved") throw new Error("setup");
    const rothId = roth.account.brokerageAccountId;

    // Active is PTS → Production activity source is PTS's activity, not Roth's, not legacy.
    expect(getActiveBrokerageAccountId()).toBe(ptsId);
    expect(getActiveAccountActivityText()).toBe(PTS_ACTIVITY);
    expect(getActivityFilename()).toBe("pts-activity.csv");
    expect(getActiveAccountActivityText()).not.toContain("QQQ");

    // Switch to Roth → Production activity source becomes Roth's activity.
    expect(switchToAccount(rothId)).toBe(true);
    expect(getActiveAccountActivityText()).toBe(ROTH_ACTIVITY);
    expect(getActivityFilename()).toBe("roth-activity.csv");
    expect(getActiveAccountActivityText()).not.toContain("SPY");

    // getActivityRows (used by the episode ledger) also reflects the active account.
    const rows = getActivityRows();
    expect(rows && rows.length).toBeGreaterThanOrEqual(1);
  });

  it("does not leak a legacy global activity blob into a real account's Production source", () => {
    // A stale legacy global activity blob exists (pre-multi-account).
    localStorage.setItem(LEGACY_ACTIVITY_KEY, JSON.stringify(blob("Run Date,Action,Symbol\n01/01/2026,X,STALE", "legacy.csv")));

    // Import a real account WITHOUT activity.
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");

    // Active account has no activity → source is null (NOT the stale legacy blob).
    expect(getActiveBrokerageAccountId()).toBe(pts.brokerageAccountId);
    expect(getActiveAccountActivityText()).toBeNull();
    expect(getActivityFilename()).toBeNull();
  });
});
