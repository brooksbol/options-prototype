/**
 * Increment 3 INTEGRATION — Cases A–E on the LIVE application path.
 *
 * These tests drive the actual portfolio-store public API that the running application uses
 * (importFidelityEvidence, switchToAccount, switchToDemo, getSnapshot, hydrate-via-rehydrate).
 * They prove the behavioral stopping condition on the real consumer boundary, not just in
 * the isolated service modules:
 *   - switching accounts requires no import;
 *   - importing evidence never implicitly changes the active account.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  importFidelityEvidence,
  switchToAccount,
  switchToDemo,
  getSnapshot,
  getSource,
  _resetForTesting,
  _rehydrateForTesting,
} from "../../src/portfolio/portfolio-store";
import {
  getActiveBrokerageAccountId,
  getActiveAccountContext,
  selectAccount,
} from "../../src/portfolio/active-account";
import {
  loadAccounts,
  resolveAccountByExternalRef,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import {
  readAccountCsv,
  _clearAccountEvidenceForTesting,
  type StoredCsvBlob,
} from "../../src/portfolio/account-evidence-store";
import { resetWorkspace } from "../../src/workspace/workspace";

// --- Fixtures: two accounts, resolvable hyphenated refs, distinct regimes/cash ---

const PTS_BAL = `Brokerage
Account Name / Account Number,PTS - Z12-345678
,Balance,Day change
Total account value,113842.91,2244.36
AVAILABLE TO TRADE,,
Available without margin impact,4200,-51.25
MARGIN STATUS,,
House surplus,7393.18,
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
Available to withdraw,510.28,
Total account value,23736.47,67.64
`;

const ROTH_OS = `Option Summary Z98-765432
Quote data as of 2026-09-18.
Symbol,Description,Quantity,Last Price,Current Value,Strategy
QQQ,Invesco QQQ,100,450,45000,Covered Call
`;

const NO_ID_BAL = `Brokerage
Account Name / Account Number,Individual - Z39411514
Description,Amount,Day Change
Available to trade (all settled),7690.00,
Total Account Value,145200.00,
`;

function blob(text: string, filename: string): StoredCsvBlob {
  return { text, filename };
}

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _resetIdCounterForTesting();
  resetWorkspace();
  _resetForTesting();
});

/** Import PTS (creating + adopting it as active on first run). Returns its id. */
function importPts() {
  const r = importFidelityEvidence({ optionSummary: blob(PTS_OS, "pts-os.csv"), balances: blob(PTS_BAL, "pts-bal.csv") });
  if (r.kind !== "refreshed") throw new Error(`expected refreshed, got ${r.kind}`);
  return r.brokerageAccountId;
}

describe("live path — first import adopts the account and publishes its snapshot", () => {
  it("importing the first account makes it active and visible via getSnapshot", () => {
    const pts = importPts();
    expect(getActiveBrokerageAccountId()).toBe(pts);
    expect(getSource()).toBe("fidelity");
    const snap = getSnapshot();
    expect(snap?.brokerageAccountId).toBe(pts);
    expect(snap?.accountId).toBe("Z12-345678");
    expect(snap?.deployableCash).toBe(4200);
  });
});

describe("Case A (live) — active X, import X → refresh X, active stays X", () => {
  it("re-importing the active account refreshes its visible snapshot", () => {
    const pts = importPts();
    // Re-import PTS with the same identity (a refresh).
    const r = importFidelityEvidence({ optionSummary: blob(PTS_OS, "pts-os-2.csv"), balances: blob(PTS_BAL, "pts-bal-2.csv") });
    expect(r.kind).toBe("refreshed");
    if (r.kind === "refreshed") expect(r.differsFromActive).toBe(false);
    expect(getActiveBrokerageAccountId()).toBe(pts);
    expect(getSnapshot()?.brokerageAccountId).toBe(pts);
    expect(loadAccounts()).toHaveLength(1); // no second identity
  });
});

describe("Case B (live) — active X, import Y → refresh Y, active STAYS X, visible snapshot unchanged", () => {
  it("importing a different account does not switch or overwrite the visible account", () => {
    const pts = importPts();
    const visibleBefore = getSnapshot();
    expect(visibleBefore?.brokerageAccountId).toBe(pts);

    // Import Sawdust Roth while PTS is active.
    const r = importFidelityEvidence({ optionSummary: blob(ROTH_OS, "roth-os.csv"), balances: blob(ROTH_BAL, "roth-bal.csv") });
    expect(r.kind).toBe("refreshed");
    if (r.kind !== "refreshed") return;
    expect(r.differsFromActive).toBe(true);

    // CRITICAL: active + visible snapshot are still PTS.
    expect(getActiveBrokerageAccountId()).toBe(pts);
    expect(getSnapshot()?.brokerageAccountId).toBe(pts);
    expect(getSnapshot()?.accountId).toBe("Z12-345678");

    // Roth evidence was written to Roth's slot; PTS evidence untouched.
    const roth = resolveAccountByExternalRef("Z98-765432");
    expect(roth.kind).toBe("resolved");
    if (roth.kind === "resolved") {
      expect(readAccountCsv(roth.account.brokerageAccountId, "balances")?.text).toBe(ROTH_BAL);
      expect(readAccountCsv(pts, "balances")?.text).toBe(PTS_BAL);
    }
  });
});

describe("Case C (live) — import with no identity → needs-assignment, not attached to active", () => {
  it("does not attach unidentified evidence to the active account", () => {
    const pts = importPts();
    const r = importFidelityEvidence({ balances: blob(NO_ID_BAL, "noid-bal.csv") });
    expect(r.kind).toBe("needs-assignment");
    // Active + visible unchanged; PTS balances still the PTS export.
    expect(getActiveBrokerageAccountId()).toBe(pts);
    expect(readAccountCsv(pts, "balances")?.text).toBe(PTS_BAL);
  });
});

describe("Case D (live) — files disagree on identity → conflict, nothing written", () => {
  it("refuses the merge when OS and Balances carry different refs", () => {
    const pts = importPts();
    const r = importFidelityEvidence({ optionSummary: blob(PTS_OS, "pts-os.csv"), balances: blob(ROTH_BAL, "roth-bal.csv") });
    expect(r.kind).toBe("conflict");
    // Active unchanged; no Roth account created by the conflicting import.
    expect(getActiveBrokerageAccountId()).toBe(pts);
    expect(resolveAccountByExternalRef("Z98-765432").kind).toBe("no-match");
  });
});

describe("Case E (live) — switch X→Y with no import → visible snapshot becomes Y", () => {
  it("switchToAccount reloads the target account's snapshot with no import", () => {
    // Seed both accounts via imports.
    const pts = importPts();
    importFidelityEvidence({ optionSummary: blob(ROTH_OS, "roth-os.csv"), balances: blob(ROTH_BAL, "roth-bal.csv") });
    const roth = resolveAccountByExternalRef("Z98-765432");
    expect(roth.kind).toBe("resolved");
    if (roth.kind !== "resolved") return;
    const rothId = roth.account.brokerageAccountId;

    // Currently PTS is visible.
    expect(getSnapshot()?.brokerageAccountId).toBe(pts);
    expect(getSnapshot()?.deployableCash).toBe(4200);

    // Switch to Roth — NO import.
    expect(switchToAccount(rothId)).toBe(true);
    expect(getActiveBrokerageAccountId()).toBe(rothId);
    // The LIVE visible snapshot (what consumers read via getSnapshot/usePortfolio) is Roth.
    expect(getSnapshot()?.brokerageAccountId).toBe(rothId);
    expect(getSnapshot()?.accountId).toBe("Z98-765432");
    expect(getSnapshot()?.deployableCash).toBe(510.28); // legacy 'all settled'

    // Switch back to PTS — still no import.
    expect(switchToAccount(pts)).toBe(true);
    expect(getSnapshot()?.brokerageAccountId).toBe(pts);
    expect(getSnapshot()?.deployableCash).toBe(4200);
  });
});

describe("live hydration — legacy singleton migrates and is adopted on startup", () => {
  it("legacy fidelity-csv keys migrate to an account and become the visible snapshot after rehydrate", () => {
    // Simulate a pre-multi-account operator: legacy singleton keys + fidelity source.
    localStorage.setItem("wheelwright:fidelity-csv:option-summary", JSON.stringify(blob(PTS_OS, "pts-os.csv")));
    localStorage.setItem("wheelwright:fidelity-csv:balances", JSON.stringify(blob(PTS_BAL, "pts-bal.csv")));
    resetWorkspace();
    // Mark fidelity source (as the legacy app would have).
    localStorage.setItem("options-prototype:workspace", JSON.stringify({ writeDeskSource: "fidelity" }));

    _rehydrateForTesting();

    // Migration created and adopted the account; visible snapshot is account-stamped.
    const accounts = loadAccounts();
    expect(accounts).toHaveLength(1);
    expect(getActiveBrokerageAccountId()).toBe(accounts[0].brokerageAccountId);
    const snap = getSnapshot();
    expect(snap?.brokerageAccountId).toBe(accounts[0].brokerageAccountId);
    expect(snap?.accountId).toBe("Z12-345678");
  });
});

describe("switchToDemo — demo is a separate live context, not a BrokerageAccount", () => {
  it("switching to demo publishes the demo snapshot and clears the active account", () => {
    importPts();
    switchToDemo();
    expect(getSource()).toBe("demo");
    expect(getActiveAccountContext().kind).toBe("demo");
    expect(getActiveBrokerageAccountId()).toBeNull();
    expect(getSnapshot()?.source.type).toBe("demo");
    // Demo never became a registry account.
    expect(loadAccounts().every((a) => a.displayName.toLowerCase() !== "demo")).toBe(true);
  });
});
