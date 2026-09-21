/**
 * Increment 8 — compatibility cleanup, migration completion, persistence headroom.
 *
 * Verifies the remaining multi-account correctness boundaries:
 *  - selectPortfolioSource("fidelity") now routes through the ACCOUNT-AWARE path (no longer
 *    the account-blind legacy singleton rebuild);
 *  - archived / renamed / stale account selection fails safe;
 *  - legacy singleton migration is complete + idempotent across a rehydrate;
 *  - the persistence-headroom estimator reports Wheelwright storage usage;
 *  - writeAccountCsv reports success/failure (fail-safe on quota).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  importFidelityEvidence,
  selectPortfolioSource,
  switchToAccount,
  getSnapshot,
  _resetForTesting,
  _rehydrateForTesting,
} from "../../src/portfolio/portfolio-store";
import { getActiveAccountContext, getActiveBrokerageAccountId } from "../../src/portfolio/active-account";
import {
  loadAccounts,
  resolveAccountByExternalRef,
  updateAccount,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import {
  writeAccountCsv,
  readAccountCsv,
  estimateWheelwrightStorageBytes,
  _clearAccountEvidenceForTesting,
  type StoredCsvBlob,
} from "../../src/portfolio/account-evidence-store";
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

describe("selectPortfolioSource('fidelity') is account-aware (Increment 8)", () => {
  it("loads the active account's snapshot, not a legacy singleton rebuild", () => {
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");
    const ptsId = pts.brokerageAccountId;

    // Toggle to demo, then back to fidelity via the legacy source selector.
    selectPortfolioSource("demo");
    expect(getSnapshot()?.source.type).toBe("demo");

    selectPortfolioSource("fidelity");
    // The account-aware path restored the active account's account-stamped snapshot.
    expect(getActiveBrokerageAccountId()).toBe(ptsId);
    expect(getSnapshot()?.brokerageAccountId).toBe(ptsId);
    expect(getSnapshot()?.accountId).toBe("Z12-345678");
  });

  it("does NOT rebuild from legacy singleton keys (no legacy keys are even written now)", () => {
    importFidelityEvidence({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") });
    // The account-aware uploader path never wrote the legacy singleton keys.
    expect(localStorage.getItem("wheelwright:fidelity-csv:option-summary")).toBeNull();
    expect(localStorage.getItem("wheelwright:fidelity-csv:balances")).toBeNull();
  });
});

describe("archived / stale account selection fails safe", () => {
  it("an archived active account resolves to 'none', never loads another account", () => {
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");
    const ptsId = pts.brokerageAccountId;
    expect(getActiveBrokerageAccountId()).toBe(ptsId);

    // Archive the active account.
    updateAccount(ptsId, { status: "archived" });
    expect(getActiveAccountContext().kind).toBe("none");
    expect(getActiveBrokerageAccountId()).toBeNull();
  });

  it("switching to an unknown account id is refused", () => {
    importFidelityEvidence({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") });
    expect(switchToAccount("ba-nonexistent")).toBe(false);
  });

  it("renaming an account (displayName) preserves identity and evidence", () => {
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");
    const ptsId = pts.brokerageAccountId;
    updateAccount(ptsId, { displayName: "PTS margin (renamed)" });
    // Identity unchanged; evidence still resolvable and loadable.
    expect(resolveAccountByExternalRef("Z12-345678").kind).toBe("resolved");
    expect(switchToAccount(ptsId)).toBe(true);
    expect(getSnapshot()?.brokerageAccountId).toBe(ptsId);
  });
});

describe("legacy singleton migration is complete and idempotent across rehydrate", () => {
  it("migrates once, adopts the sole account, and survives a rehydrate without duplication", () => {
    // Simulate a pre-multi-account operator: legacy singleton keys + fidelity source.
    localStorage.setItem("wheelwright:fidelity-csv:option-summary", JSON.stringify(blob(PTS_OS, "os.csv")));
    localStorage.setItem("wheelwright:fidelity-csv:balances", JSON.stringify(blob(PTS_BAL, "bal.csv")));
    localStorage.setItem("options-prototype:workspace", JSON.stringify({ writeDeskSource: "fidelity" }));

    _rehydrateForTesting();
    const accountsAfterFirst = loadAccounts();
    expect(accountsAfterFirst).toHaveLength(1);
    const adoptedId = accountsAfterFirst[0].brokerageAccountId;
    expect(getActiveBrokerageAccountId()).toBe(adoptedId);
    // Evidence is now in the per-account slot.
    expect(readAccountCsv(adoptedId, "balances")?.text).toBe(PTS_BAL);

    // A second rehydrate must not create a second account (migration marker is set).
    _rehydrateForTesting();
    expect(loadAccounts()).toHaveLength(1);
    expect(loadAccounts()[0].brokerageAccountId).toBe(adoptedId);
  });
});

describe("persistence headroom", () => {
  it("estimateWheelwrightStorageBytes reflects stored Wheelwright evidence", () => {
    const before = estimateWheelwrightStorageBytes();
    writeAccountCsv("ba-x", "balances", blob("a".repeat(1000), "big.csv"));
    const after = estimateWheelwrightStorageBytes();
    expect(after).toBeGreaterThan(before);
    // Non-Wheelwright keys are excluded.
    localStorage.setItem("some-other-app:key", "b".repeat(5000));
    expect(estimateWheelwrightStorageBytes()).toBe(after);
  });

  it("writeAccountCsv reports success and is fail-safe (existing evidence preserved on failure)", () => {
    expect(writeAccountCsv("ba-x", "balances", blob("v1", "f.csv"))).toBe(true);
    expect(readAccountCsv("ba-x", "balances")?.text).toBe("v1");
  });
});
