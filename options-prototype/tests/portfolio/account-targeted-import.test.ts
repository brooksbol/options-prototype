/**
 * Account-targeted import (explicit-account workflow) — selection-as-sole-identity-authority.
 *
 * PL-PORT-01 correction (Principal-ratified Option 1): real Fidelity CSV exports do NOT
 * reliably contain a machine-usable account number, so the import path performs NO
 * account-number identity check. The operator's explicit account selection IS the identity
 * decision. A structurally-valid CSV uploaded into the selected account is accepted into
 * that account — regardless of whether the file carries any account reference.
 *
 * These tests lock the corrected rules:
 *  - Any valid CSV (Balances / Option Summary / Activity), in any combination, loads into the
 *    selected target account. No account number required, ever.
 *  - A file that carries no usable account number still loads (no "unidentified-balances").
 *  - Option Summary / Activity alone load immediately (no "pending-identity" waiting).
 *  - "Mismatched" files (what would previously have been a cross-account file) still load into
 *    the selected account — the accepted tradeoff: wrong-file-into-selected-account is not
 *    detected, because selection is trusted.
 *  - Structural guards remain: empty operation → empty; unknown/archived target → unknown-target.
 *  - Account-locality invariant: evidence is written ONLY to the explicitly targeted account.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { importIntoAccount } from "../../src/portfolio/account-import";
import {
  registerAccount,
  getAccountById,
  updateAccount,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import {
  readAccountCsv,
  _clearAccountEvidenceForTesting,
  type StoredCsvBlob,
} from "../../src/portfolio/account-evidence-store";

// A Balances file WITH an in-body hyphenated ref (older/synthetic shape).
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
// A REAL-shape Balances file with NO in-body account number (the case that used to false-refuse).
const NO_ID_BAL = `,Balance,Day change
Total account value,145200.00,
AVAILABLE TO TRADE,,
Available to trade (all settled),7690.00,
`;
const NO_ID_OS = `Option Summary
Symbol,Description,Quantity,Last Price,Current Value,Strategy
SPY,SPDR S&P 500,100,500,50000,Covered Call
`;
const ACTIVITY = `Run Date,Action,Symbol,Description,Quantity,Price,Amount
09/02/2026,SOLD TO OPEN,-SPY260918P500,SPY PUT,-1,5.00,500.00
`;
function blob(text: string, filename: string): StoredCsvBlob { return { text, filename }; }

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _resetIdCounterForTesting();
});

/** Create a fresh manually-added account with no external ref. */
function newAccount(displayName: string): string {
  const r = registerAccount({ broker: "fidelity", displayName });
  if (r.kind !== "created") throw new Error("setup");
  return r.account.brokerageAccountId;
}

describe("selection is the sole identity authority", () => {
  it("Balances WITHOUT any usable account number loads into the selected account", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({ balances: blob(NO_ID_BAL, "bal.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    if (r.kind === "refreshed") expect(r.brokerageAccountId).toBe(pts);
    // Evidence written to the selected account.
    expect(readAccountCsv(pts, "balances")?.text).toBe(NO_ID_BAL);
  });

  it("Option Summary alone (no account number) loads immediately — no pending-identity wait", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({ optionSummary: blob(NO_ID_OS, "os.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    expect(readAccountCsv(pts, "option-summary")?.text).toBe(NO_ID_OS);
  });

  it("Activity alone loads immediately — no pending-identity wait", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({ activity: blob(ACTIVITY, "act.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    expect(readAccountCsv(pts, "activity")?.text).toBe(ACTIVITY);
  });

  it("a full coherent operation (OS + Balances + Activity) loads all three slots", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount(
      { optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv"), activity: blob(ACTIVITY, "act.csv") },
      pts,
    );
    expect(r.kind).toBe("refreshed");
    expect(readAccountCsv(pts, "option-summary")?.text).toBe(PTS_OS);
    expect(readAccountCsv(pts, "balances")?.text).toBe(PTS_BAL);
    expect(readAccountCsv(pts, "activity")?.text).toBe(ACTIVITY);
  });
});

describe("accepted tradeoff — selection is trusted, no cross-file/cross-account detection", () => {
  it("files that would previously 'disagree' still load into the selected account", () => {
    // PTS Option Summary + Roth Balances: no longer inspected for agreement. Both load into
    // whatever account the operator selected.
    const pts = newAccount("PTS");
    const r = importIntoAccount({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(ROTH_BAL, "bal.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    expect(readAccountCsv(pts, "option-summary")?.text).toBe(PTS_OS);
    expect(readAccountCsv(pts, "balances")?.text).toBe(ROTH_BAL);
  });

  it("a file resembling another known account still loads into the SELECTED account (no routing)", () => {
    // Roth exists and (in the old world) 'owned' Z98-765432. Selection now governs: uploading
    // the Roth-shaped Balances while PTS is selected writes it INTO PTS, not Roth.
    const roth = newAccount("Sawdust Roth");
    // Give Roth an established external ref to prove routing does NOT happen anymore.
    updateAccount(roth, { externalAccountRef: "Z98-765432" });

    const pts = newAccount("PTS");
    const r = importIntoAccount({ balances: blob(ROTH_BAL, "roth-shaped.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    if (r.kind === "refreshed") expect(r.brokerageAccountId).toBe(pts);
    // Written to PTS (the selection); Roth is untouched.
    expect(readAccountCsv(pts, "balances")?.filename).toBe("roth-shaped.csv");
    expect(readAccountCsv(roth, "balances")).toBeNull();
  });
});

describe("re-import / refresh into the same selected account", () => {
  it("a second Balances upload replaces the account's Balances slot", () => {
    const pts = newAccount("PTS");
    importIntoAccount({ balances: blob(PTS_BAL, "bal1.csv") }, pts);
    const r = importIntoAccount({ balances: blob(PTS_BAL, "bal2.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    expect(readAccountCsv(pts, "balances")?.filename).toBe("bal2.csv");
  });
});

describe("structural guards (the only refusals)", () => {
  it("an empty operation is refused as empty", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({}, pts);
    expect(r.kind).toBe("empty");
  });

  it("an unknown target account is refused as unknown-target", () => {
    const r = importIntoAccount({ balances: blob(PTS_BAL, "bal.csv") }, "ba-missing");
    expect(r.kind).toBe("unknown-target");
  });

  it("an archived target account is refused as unknown-target", () => {
    const pts = newAccount("PTS");
    updateAccount(pts, { status: "archived" });
    const r = importIntoAccount({ balances: blob(PTS_BAL, "bal.csv") }, pts);
    expect(r.kind).toBe("unknown-target");
  });
});

describe("account-locality invariant", () => {
  it("evidence lands only in the explicitly targeted account", () => {
    const a = newAccount("Account A");
    const b = newAccount("Account B");
    importIntoAccount({ balances: blob(PTS_BAL, "a-bal.csv") }, a);
    // B must be completely untouched.
    expect(readAccountCsv(a, "balances")?.filename).toBe("a-bal.csv");
    expect(readAccountCsv(b, "balances")).toBeNull();
    expect(getAccountById(b)?.externalAccountRef).toBeNull();
  });
});
