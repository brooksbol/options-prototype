/**
 * Account-targeted import (explicit-account workflow) — corrected fail-closed semantics.
 *
 * Selection expresses INTENT; evidence establishes IDENTITY. Selecting PTS does not prove an
 * unidentified Balances file belongs to PTS. These tests lock the Principal-corrected rules:
 *  - Balances with usable identity into a fresh account → binds the external ref + refreshes.
 *  - Balances with NO usable identity → refuse (unidentified-balances); target untouched.
 *  - Balances identifying an account already bound to ANOTHER account → refuse; no rebind.
 *  - Existing bound account: Balances must match; mismatch refuses; match refreshes.
 *  - Cross-file disagreement → conflict (files-disagree).
 *  - Activity inherits identity within a coherent op; OS/Activity alone into an unidentified
 *    account cannot establish identity.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { importIntoAccount } from "../../src/portfolio/account-import";
import {
  registerAccount,
  getAccountById,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import {
  readAccountCsv,
  _clearAccountEvidenceForTesting,
  type StoredCsvBlob,
} from "../../src/portfolio/account-evidence-store";

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
// A Balances file with NO usable (hyphenated) account number.
const NO_ID_BAL = `Brokerage
Account Name / Account Number,Individual - Z39411514
Description,Amount,Day Change
Available to trade (all settled),7690.00,
Total Account Value,145200.00,
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

describe("fresh manually-created account — deferred identity binding", () => {
  it("Balances with usable identity binds the external ref and refreshes", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    if (r.kind === "refreshed") expect(r.boundExternalRef).toBe("Z12-345678");
    // External ref bound to the account; evidence written.
    expect(getAccountById(pts)?.externalAccountRef).toBe("Z12-345678");
    expect(readAccountCsv(pts, "balances")?.text).toBe(PTS_BAL);
  });

  it("Balances with NO usable identity is REFUSED — account untouched", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({ balances: blob(NO_ID_BAL, "bal.csv") }, pts);
    expect(r.kind).toBe("unidentified-balances");
    // No binding, no evidence written.
    expect(getAccountById(pts)?.externalAccountRef).toBeNull();
    expect(readAccountCsv(pts, "balances")).toBeNull();
  });

  it("Balances identifying an account already bound to ANOTHER account is REFUSED", () => {
    // Roth already owns Z98-765432.
    const roth = newAccount("Sawdust Roth");
    importIntoAccount({ balances: blob(ROTH_BAL, "roth.csv") }, roth);
    expect(getAccountById(roth)?.externalAccountRef).toBe("Z98-765432");

    // Attempt to import the Roth Balances into a freshly created PTS.
    const pts = newAccount("PTS");
    const r = importIntoAccount({ balances: blob(ROTH_BAL, "roth.csv") }, pts);
    expect(r.kind).toBe("conflict");
    if (r.kind === "conflict") expect(r.reason).toBe("belongs-to-other");
    // Neither account mutated: PTS still unbound, Roth evidence intact.
    expect(getAccountById(pts)?.externalAccountRef).toBeNull();
    expect(readAccountCsv(pts, "balances")).toBeNull();
    expect(readAccountCsv(roth, "balances")?.text).toBe(ROTH_BAL);
  });

  it("OS-only WITH a usable account number binds identity and refreshes", () => {
    // A full hyphenated ref in the OS preamble IS usable identity.
    const pts = newAccount("PTS");
    const r = importIntoAccount({ optionSummary: blob(PTS_OS, "os.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    if (r.kind === "refreshed") expect(r.boundExternalRef).toBe("Z12-345678");
    expect(readAccountCsv(pts, "option-summary")?.text).toBe(PTS_OS);
  });

  it("OS-only WITHOUT a usable account number into an unidentified account is refused", () => {
    const NO_ID_OS = `Option Summary
Symbol,Description,Quantity,Last Price,Current Value,Strategy
SPY,SPDR S&P 500,100,500,50000,Covered Call
`;
    const pts = newAccount("PTS");
    const r = importIntoAccount({ optionSummary: blob(NO_ID_OS, "os.csv") }, pts);
    expect(r.kind).toBe("unidentified-balances");
    expect(readAccountCsv(pts, "option-summary")).toBeNull();
  });

  it("Activity-only into an unidentified account cannot inherit identity → refused", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({ activity: blob(ACTIVITY, "act.csv") }, pts);
    expect(r.kind).toBe("unidentified-balances");
    expect(readAccountCsv(pts, "activity")).toBeNull();
  });

  it("Activity inherits identity within a coherent op once Balances establishes it", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount(
      { balances: blob(PTS_BAL, "bal.csv"), activity: blob(ACTIVITY, "act.csv") },
      pts,
    );
    expect(r.kind).toBe("refreshed");
    expect(getAccountById(pts)?.externalAccountRef).toBe("Z12-345678");
    // Both the identifying Balances and the inheriting Activity were written.
    expect(readAccountCsv(pts, "balances")?.text).toBe(PTS_BAL);
    expect(readAccountCsv(pts, "activity")?.text).toBe(ACTIVITY);
  });
});

describe("account with an established external ref", () => {
  it("matching Balances refreshes", () => {
    const pts = newAccount("PTS");
    importIntoAccount({ balances: blob(PTS_BAL, "bal1.csv") }, pts); // binds Z12-345678
    const r = importIntoAccount({ balances: blob(PTS_BAL, "bal2.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    expect(readAccountCsv(pts, "balances")?.filename).toBe("bal2.csv");
  });

  it("mismatching Balances (belongs to another account) is REFUSED — evidence + ref preserved", () => {
    const pts = newAccount("PTS");
    importIntoAccount({ balances: blob(PTS_BAL, "bal.csv") }, pts); // binds Z12-345678
    const r = importIntoAccount({ balances: blob(ROTH_BAL, "roth.csv") }, pts);
    expect(r.kind).toBe("conflict");
    if (r.kind === "conflict") expect(r.reason).toBe("belongs-to-other");
    // PTS identity + evidence unchanged.
    expect(getAccountById(pts)?.externalAccountRef).toBe("Z12-345678");
    expect(readAccountCsv(pts, "balances")?.text).toBe(PTS_BAL);
  });

  it("OS/Activity alone into an ESTABLISHED account inherit its identity and refresh", () => {
    const pts = newAccount("PTS");
    importIntoAccount({ balances: blob(PTS_BAL, "bal.csv") }, pts); // bound
    const r = importIntoAccount({ activity: blob(ACTIVITY, "act.csv") }, pts);
    expect(r.kind).toBe("refreshed");
    expect(readAccountCsv(pts, "activity")?.text).toBe(ACTIVITY);
  });
});

describe("cross-file disagreement", () => {
  it("PTS Option Summary + Roth Balances → files-disagree conflict, nothing written", () => {
    const pts = newAccount("PTS");
    const r = importIntoAccount({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(ROTH_BAL, "bal.csv") }, pts);
    expect(r.kind).toBe("conflict");
    if (r.kind === "conflict") expect(r.reason).toBe("files-disagree");
    expect(readAccountCsv(pts, "balances")).toBeNull();
  });
});

describe("unknown target", () => {
  it("refuses when the target account does not exist", () => {
    const r = importIntoAccount({ balances: blob(PTS_BAL, "bal.csv") }, "ba-missing");
    expect(r.kind).toBe("unknown-target");
  });
});
