/**
 * Increment 6 — Workspace semantic decomposition (scope boundaries).
 *
 * The Workspace holds GLOBAL strategy defaults, GLOBAL/operator UI preferences, the
 * application/operator active-account SELECTION, and the GLOBAL mission target. It holds NO
 * account-local state. This proves the ratified scope boundaries on the LIVE path:
 *   - switching the active account changes account-local context (active id + visible
 *     snapshot) but does NOT change UI prefs, strategy defaults, or the mission target;
 *   - switching does NOT create a per-account workspace or duplicate global strategy config;
 *   - importing does not double-record the capital observation (Increment 6 fix).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  loadWorkspace,
  updateWorkspace,
  resetWorkspace,
} from "../../src/workspace/workspace";
import {
  importFidelityEvidence,
  switchToAccount,
  getSnapshot,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import { getActiveBrokerageAccountId } from "../../src/portfolio/active-account";
import { resolveAccountByExternalRef, _clearRegistryForTesting } from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import { _clearAccountEvidenceForTesting, type StoredCsvBlob } from "../../src/portfolio/account-evidence-store";
import { loadHistory, _clearHistoryForTesting } from "../../src/portfolio/portfolio-capital-history";

const WORKSPACE_KEY = "options-prototype:workspace";

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
function blob(text: string, filename: string): StoredCsvBlob { return { text, filename }; }

function importAccount(os: string, bal: string): string {
  const r = importFidelityEvidence({ optionSummary: blob(os, "os.csv"), balances: blob(bal, "bal.csv") });
  if (r.kind !== "refreshed") throw new Error(`expected refreshed, got ${r.kind}`);
  return r.brokerageAccountId;
}

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _clearHistoryForTesting();
  _resetIdCounterForTesting();
  resetWorkspace();
  _resetForTesting();
});

describe("workspace scope boundaries — switching accounts does not disturb global/operator state", () => {
  it("switching accounts changes account-local context but NOT UI prefs, strategy defaults, or mission", () => {
    const pts = importAccount(PTS_OS, PTS_BAL);
    importAccount(ROTH_OS, ROTH_BAL);
    const roth = resolveAccountByExternalRef("Z98-765432");
    if (roth.kind !== "resolved") throw new Error("setup");
    const rothId = roth.account.brokerageAccountId;

    // Operator sets some UI prefs, a strategy default, and a global mission target.
    updateWorkspace({
      writeDeskPutsCollapsed: true,
      writeDeskPutSortKey: "delta",
      writeDeskShowDanger: true,
      writeDeskTargetDelta: 0.25,
      writeDeskDeltaMin: 0.20,
      missionTarget: 3000,
    });
    const before = loadWorkspace();

    // Ensure PTS is active, then switch to Roth (account-local context changes).
    expect(switchToAccount(pts)).toBe(true);
    expect(getSnapshot()?.brokerageAccountId).toBe(pts);
    expect(switchToAccount(rothId)).toBe(true);

    // Account-local context changed.
    expect(getActiveBrokerageAccountId()).toBe(rothId);
    expect(getSnapshot()?.brokerageAccountId).toBe(rothId);

    // GLOBAL / operator state is UNCHANGED by the switch.
    const after = loadWorkspace();
    expect(after.writeDeskPutsCollapsed).toBe(true);
    expect(after.writeDeskPutSortKey).toBe("delta");
    expect(after.writeDeskShowDanger).toBe(true);
    expect(after.writeDeskTargetDelta).toBe(0.25);
    expect(after.writeDeskDeltaMin).toBe(0.20);
    expect(after.missionTarget).toBe(3000);

    // Only the active-account selection field changed between before/after.
    expect(before.activeBrokerageAccountId).toBe(pts);
    expect(after.activeBrokerageAccountId).toBe(rothId);
    // Everything except the selection is identical.
    const { activeBrokerageAccountId: _b, ...beforeRest } = before;
    const { activeBrokerageAccountId: _a, ...afterRest } = after;
    expect(afterRest).toEqual(beforeRest);
  });

  it("does NOT create a per-account workspace key (single global workspace)", () => {
    const pts = importAccount(PTS_OS, PTS_BAL);
    importAccount(ROTH_OS, ROTH_BAL);
    const roth = resolveAccountByExternalRef("Z98-765432");
    if (roth.kind !== "resolved") throw new Error("setup");
    switchToAccount(pts);
    switchToAccount(roth.account.brokerageAccountId);

    // Exactly one workspace key exists; no wheelwright:acct:<id>:...:workspace variants.
    const workspaceKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes("workspace")) workspaceKeys.push(k);
    }
    expect(workspaceKeys).toEqual([WORKSPACE_KEY]);
  });

  it("mission target is global: setting it under one account is visible under another", () => {
    const pts = importAccount(PTS_OS, PTS_BAL);
    importAccount(ROTH_OS, ROTH_BAL);
    const roth = resolveAccountByExternalRef("Z98-765432");
    if (roth.kind !== "resolved") throw new Error("setup");

    switchToAccount(pts);
    updateWorkspace({ missionTarget: 5000 });
    switchToAccount(roth.account.brokerageAccountId);
    // Same global mission target under the other account (no per-account override).
    expect(loadWorkspace().missionTarget).toBe(5000);
  });
});

describe("Increment 6 fix — import records exactly one capital observation per account per day", () => {
  it("importing an account records a single observation (no double-record)", () => {
    const pts = importAccount(PTS_OS, PTS_BAL);
    // Exactly one observation for PTS today (importFidelityEvidence records once; the
    // uploader's onSnapshotChange no longer re-records via setPortfolio).
    expect(loadHistory(pts)).toHaveLength(1);

    // Re-import the same account the same day → still one (calendar-day dedup).
    importFidelityEvidence({ optionSummary: blob(PTS_OS, "os2.csv"), balances: blob(PTS_BAL, "bal2.csv") });
    expect(loadHistory(pts)).toHaveLength(1);
  });
});
