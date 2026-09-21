/**
 * Increment 3 — Separate active-account selection from import.
 *
 * Establishes the required semantics explicitly:
 *   Case A: active X, import X   → refresh X, active stays X.
 *   Case B: active X, import Y   → refresh Y, active STAYS X (reported as differs).
 *   Case C: import no-identity   → needs-assignment; not attached to active account.
 *   Case D: files disagree       → conflict; never guessed.
 *   Case E: switch X→Y no import → loads Y's existing state immediately.
 * Plus: import never changes active selection; demo is a separate context kind.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getActiveAccountContext,
  getActiveBrokerageAccountId,
  selectAccount,
  selectDemo,
  clearActiveAccount,
} from "../../src/portfolio/active-account";
import { resolveImport } from "../../src/portfolio/account-import";
import { buildSnapshotForAccount } from "../../src/portfolio/account-snapshot";
import {
  registerAccount,
  loadAccounts,
  _clearRegistryForTesting,
} from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import {
  writeAccountCsv,
  readAccountCsv,
  _clearAccountEvidenceForTesting,
  type StoredCsvBlob,
} from "../../src/portfolio/account-evidence-store";

// --- Fixtures: two accounts with resolvable hyphenated refs, distinct regimes ---

const PTS_BAL = `Brokerage
Account Name / Account Number,PTS - Z12-345678
,Balance,Day change
Total account value,113842.91,2244.36
AVAILABLE TO TRADE,,
Available without margin impact,4200,-51.25
MARGIN STATUS,,
House surplus,7393.18,
`;

const ROTH_BAL = `Brokerage
Account Name / Account Number,Sawdust Roth - Z98-765432
Description,Amount,Day Change
Available to trade (all settled),510.28,
Available to withdraw,510.28,
Total account value,23736.47,67.64
`;

// A minimal Option Summary with a full hyphenated account number in the preamble.
const PTS_OS = `Option Summary Z12-345678
Quote data as of 2026-09-18.
Symbol,Description,Quantity,Last Price,Current Value,Strategy
SPY,SPDR S&P 500,100,500,50000,Covered Call
`;

// Option Summary with NO account identity in preamble.
const NO_ID_OS = `Option Summary
Symbol,Description,Quantity,Last Price,Current Value,Strategy
SPY,SPDR S&P 500,100,500,50000,Covered Call
`;

// A balances export with no resolvable account number.
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
});

/** Helper: register an account by ref and return its id. */
function makeAccount(ref: string): string {
  const r = registerAccount({ broker: "fidelity", externalAccountRef: ref });
  if (r.kind !== "created" && r.kind !== "existing") throw new Error("setup");
  return r.account.brokerageAccountId;
}

describe("active-account selection is durable and demo is separate", () => {
  it("defaults to demo context when nothing is selected", () => {
    expect(getActiveAccountContext().kind).toBe("demo");
    expect(getActiveBrokerageAccountId()).toBeNull();
  });

  it("selectAccount sets a durable real-account context; selectDemo returns to demo", () => {
    const pts = makeAccount("Z12-345678");
    expect(selectAccount(pts)).toBe(true);
    const ctx = getActiveAccountContext();
    expect(ctx.kind).toBe("account");
    if (ctx.kind === "account") expect(ctx.brokerageAccountId).toBe(pts);
    expect(getActiveBrokerageAccountId()).toBe(pts);

    selectDemo();
    expect(getActiveAccountContext().kind).toBe("demo");
    expect(getActiveBrokerageAccountId()).toBeNull();
  });

  it("demo is never a BrokerageAccount (selecting demo registers nothing)", () => {
    selectDemo();
    expect(loadAccounts()).toHaveLength(0);
  });

  it("refuses to select an unknown/archived account (stale-pointer fail-safe)", () => {
    expect(selectAccount("ba-missing")).toBe(false);
    expect(getActiveAccountContext().kind).toBe("demo"); // unchanged

    // Selected id that later fails to resolve → context is 'none', not another account.
    const pts = makeAccount("Z12-345678");
    selectAccount(pts);
    _clearRegistryForTesting(); // simulate the account disappearing
    expect(getActiveAccountContext().kind).toBe("none");
  });
});

describe("Case A — active X, import X's files → refresh X, active stays X", () => {
  it("refreshes the active account and does not change selection", () => {
    const pts = makeAccount("Z12-345678");
    selectAccount(pts);

    const result = resolveImport(
      { optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") },
      getActiveBrokerageAccountId()
    );

    expect(result.kind).toBe("refreshed");
    if (result.kind !== "refreshed") return;
    expect(result.brokerageAccountId).toBe(pts);
    expect(result.differsFromActive).toBe(false);
    // Active selection unchanged.
    expect(getActiveBrokerageAccountId()).toBe(pts);
    // Evidence written to PTS slot.
    expect(readAccountCsv(pts, "balances")?.text).toBe(PTS_BAL);
  });
});

describe("Case B — active X, import Y's files → refresh Y, active STAYS X", () => {
  it("refreshes the other account, reports the difference, and never switches", () => {
    const pts = makeAccount("Z12-345678");
    const roth = makeAccount("Z98-765432");
    selectAccount(pts);

    const result = resolveImport(
      { balances: blob(ROTH_BAL, "roth.csv") },
      getActiveBrokerageAccountId()
    );

    expect(result.kind).toBe("refreshed");
    if (result.kind !== "refreshed") return;
    expect(result.brokerageAccountId).toBe(roth);
    expect(result.differsFromActive).toBe(true);
    // CRITICAL: active account remains PTS — import did not change selection.
    expect(getActiveBrokerageAccountId()).toBe(pts);
    // Roth evidence refreshed; PTS evidence untouched.
    expect(readAccountCsv(roth, "balances")?.text).toBe(ROTH_BAL);
    expect(readAccountCsv(pts, "balances")).toBeNull();
  });
});

describe("Case C — import with no resolvable identity → needs-assignment", () => {
  it("does not attach to the active account and requires assignment", () => {
    const pts = makeAccount("Z12-345678");
    selectAccount(pts);

    const result = resolveImport(
      { optionSummary: blob(NO_ID_OS, "os.csv"), balances: blob(NO_ID_BAL, "bal.csv") },
      getActiveBrokerageAccountId()
    );

    expect(result.kind).toBe("needs-assignment");
    if (result.kind === "needs-assignment") expect(result.reason).toBe("missing-identity");
    // Not silently attached to PTS.
    expect(readAccountCsv(pts, "balances")).toBeNull();
    // Active selection unchanged.
    expect(getActiveBrokerageAccountId()).toBe(pts);
  });
});

describe("Case D — imported files disagree on identity → conflict, never guessed", () => {
  it("refuses the merge when Balances and Option Summary carry different refs", () => {
    // PTS Option Summary (Z12-345678) with Sawdust Roth Balances (Z98-765432).
    const result = resolveImport(
      { optionSummary: blob(PTS_OS, "os.csv"), balances: blob(ROTH_BAL, "roth.csv") },
      null
    );
    expect(result.kind).toBe("conflict");
    if (result.kind === "conflict") {
      expect(result.refs).toContain("Z12-345678");
      expect(result.refs).toContain("Z98-765432");
    }
    // No account evidence written, no account created for either side beyond nothing.
    expect(loadAccounts()).toHaveLength(0);
  });
});

describe("Case E — switch X→Y with no import → loads Y's existing state immediately", () => {
  it("switching reloads the target account's snapshot without any import", () => {
    // Pre-seed both accounts' evidence (as if previously imported).
    const pts = makeAccount("Z12-345678");
    const roth = makeAccount("Z98-765432");
    writeAccountCsv(pts, "option-summary", blob(PTS_OS, "pts-os.csv"));
    writeAccountCsv(pts, "balances", blob(PTS_BAL, "pts-bal.csv"));
    writeAccountCsv(roth, "option-summary", blob(PTS_OS, "roth-os.csv"));
    writeAccountCsv(roth, "balances", blob(ROTH_BAL, "roth-bal.csv"));

    // Start on PTS.
    selectAccount(pts);
    const ptsSnap = buildSnapshotForAccount(getActiveBrokerageAccountId()!);
    expect(ptsSnap?.brokerageAccountId).toBe(pts);
    expect(ptsSnap?.accountId).toBe("Z12-345678");

    // Switch to Roth — NO import call.
    expect(selectAccount(roth)).toBe(true);
    const rothSnap = buildSnapshotForAccount(getActiveBrokerageAccountId()!);
    expect(rothSnap?.brokerageAccountId).toBe(roth);
    expect(rothSnap?.accountId).toBe("Z98-765432");
    // Distinct deployable cash proves account-local state changed coherently.
    expect(rothSnap?.deployableCash).toBe(510.28); // legacy 'all settled'
    expect(ptsSnap?.deployableCash).toBe(4200); // margin 'available without margin impact'
  });
});

describe("import never changes active account (invariant across cases)", () => {
  it("clearActiveAccount + a Case-B import leaves selection unchanged as 'none'", () => {
    makeAccount("Z12-345678");
    clearActiveAccount();
    expect(getActiveAccountContext().kind).toBe("none");
    resolveImport({ balances: blob(ROTH_BAL, "roth.csv") }, getActiveBrokerageAccountId());
    // Still no active account — import did not select one.
    expect(getActiveAccountContext().kind).toBe("none");
  });
});
