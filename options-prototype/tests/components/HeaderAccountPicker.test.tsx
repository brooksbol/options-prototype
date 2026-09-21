/**
 * Portfolio dropdown as the account-management surface — real UI boundary.
 *
 * Exercises the operator workflow through the actual HeaderPortfolioStatus + FidelityUpload:
 * Add account → Select → Upload CSVs → Add second → switch (no import) → Rename → Remove
 * (with confirmation). Proves account-local isolation through the rendered UI.
 *
 * PL-PORT-01 correction (selection-as-sole-identity-authority): the upload path performs NO
 * account-number identity check. The operator's explicit account selection IS the identity
 * decision, so a structurally-valid CSV loads into the selected account with no refusals and
 * no cross-account routing. These tests assert evidence lands in the selected account and
 * that no identity-error surface appears.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HeaderPortfolioStatus } from "../../src/components/HeaderPortfolioStatus";
import {
  selectPortfolioSource,
  getSnapshot,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import { getActiveBrokerageAccountId } from "../../src/portfolio/active-account";
import { loadAccounts, _clearRegistryForTesting } from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import { readAccountCsv, _clearAccountEvidenceForTesting } from "../../src/portfolio/account-evidence-store";
import { _clearHistoryForTesting } from "../../src/portfolio/portfolio-capital-history";
import { _resetAccountsViewCacheForTesting } from "../../src/portfolio/use-accounts";
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
// A REAL-shape Balances export with NO in-body account number (the case that used to
// false-refuse). Selection is the identity authority, so this loads into the selected account.
const NO_ID_BAL = `,Balance,Day change
Total account value,145200.00,
AVAILABLE TO TRADE,,
Available to trade (all settled),7690.00,
`;
const NO_ID_OS = `Option Summary
Symbol,Description,Quantity,Last Price,Current Value,Strategy
SPY,SPDR S&P 500,100,500,50000,Covered Call
`;

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _clearHistoryForTesting();
  _resetIdCounterForTesting();
  _resetAccountsViewCacheForTesting();
  resetWorkspace();
  _resetForTesting();
  selectPortfolioSource("fidelity"); // ensure Fidelity mode so the Accounts section shows
});

function openDropdown() {
  fireEvent.click(screen.getByRole("button", { name: /portfolio status and upload/i }));
}

function csvFile(name: string, text: string): File {
  return new File([text], name, { type: "text/csv" });
}

function fileInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
}

/** Add an account by name through the UI. */
function addAccount(name: string) {
  fireEvent.click(screen.getByRole("button", { name: /add account/i }));
  const input = screen.getByLabelText(/new account name/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: name } });
  fireEvent.keyDown(input, { key: "Enter" });
}

/** Upload OS + Balances into the currently-shown upload panel. */
async function uploadCsvs(container: HTMLElement, os: string, bal: string) {
  const [osInput, balInput] = fileInputs(container);
  fireEvent.change(osInput, { target: { files: [csvFile("os.csv", os)] } });
  fireEvent.change(balInput, { target: { files: [csvFile("bal.csv", bal)] } });
}

describe("Portfolio dropdown account management", () => {
  it("Add → Upload loads evidence into the selected account; second Add + switch is import-free; rename; remove", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();

    // ADD PTS (explicit, no CSV yet).
    addAccount("PTS");
    await waitFor(() => expect(loadAccounts()).toHaveLength(1));
    const ptsId = loadAccounts()[0].brokerageAccountId;
    expect(getActiveBrokerageAccountId()).toBe(ptsId);

    // UPLOAD PTS CSVs → evidence loads into PTS and the visible snapshot refreshes.
    await uploadCsvs(container, PTS_OS, PTS_BAL);
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBe(ptsId));
    expect(readAccountCsv(ptsId, "balances")?.text).toBe(PTS_BAL);
    expect(readAccountCsv(ptsId, "option-summary")?.text).toBe(PTS_OS);

    // ADD Sawdust Roth (becomes active on add).
    addAccount("Sawdust Roth");
    await waitFor(() => expect(loadAccounts()).toHaveLength(2));
    const rothId = loadAccounts().find((a) => a.brokerageAccountId !== ptsId)!.brokerageAccountId;
    expect(getActiveBrokerageAccountId()).toBe(rothId);

    // UPLOAD Sawdust CSVs into the (now active) Sawdust account.
    await uploadCsvs(container, ROTH_OS, ROTH_BAL);
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBe(rothId));
    expect(readAccountCsv(rothId, "balances")?.text).toBe(ROTH_BAL);

    // SWITCH back to PTS via the account button — no import — PTS state returns.
    const ptsSwitch = screen.getAllByRole("button", { pressed: false }).find((b) => b.textContent?.includes("PTS"))
      ?? screen.getAllByRole("button", { pressed: true }).find((b) => b.textContent?.includes("PTS"));
    fireEvent.click(ptsSwitch!);
    await waitFor(() => expect(getActiveBrokerageAccountId()).toBe(ptsId));
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBe(ptsId));

    // RENAME PTS → "PTS margin".
    fireEvent.click(screen.getByRole("button", { name: /^Rename PTS/ }));
    const renameInput = screen.getByLabelText(/Rename account/i) as HTMLInputElement;
    fireEvent.change(renameInput, { target: { value: "PTS margin" } });
    fireEvent.keyDown(renameInput, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getAllByRole("button", { pressed: true }).some((b) => b.textContent?.includes("PTS margin"))).toBe(true);
    });

    // REMOVE Sawdust Roth (inactive) with confirmation — PTS (active) untouched.
    fireEvent.click(screen.getByRole("button", { name: /^Remove Sawdust Roth/ }));
    fireEvent.click(screen.getByRole("button", { name: /confirm remove Sawdust Roth/i }));
    await waitFor(() => expect(loadAccounts().filter((a) => a.status === "active")).toHaveLength(1));
    // PTS remains active and intact (removing an INACTIVE account doesn't change selection).
    expect(getActiveBrokerageAccountId()).toBe(ptsId);
    expect(getSnapshot()?.brokerageAccountId).toBe(ptsId);
  });

  it("removing the ACTIVE account enters an explicit no-account-selected state (no auto-fallback)", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();

    // Establish PTS + Sawdust.
    addAccount("PTS");
    await uploadCsvs(container, PTS_OS, PTS_BAL);
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBeTruthy());
    const ptsId = loadAccounts()[0].brokerageAccountId;
    addAccount("Sawdust Roth");
    await waitFor(() => expect(loadAccounts()).toHaveLength(2));
    const rothId = loadAccounts().find((a) => a.brokerageAccountId !== ptsId)!.brokerageAccountId;
    // Sawdust is active (added last).
    expect(getActiveBrokerageAccountId()).toBe(rothId);

    // Remove the ACTIVE account (Sawdust).
    fireEvent.click(screen.getByRole("button", { name: /^Remove Sawdust Roth/ }));
    fireEvent.click(screen.getByRole("button", { name: /confirm remove Sawdust Roth/i }));

    // Sawdust is gone; PTS still exists but is NOT auto-selected. Explicit no-active state.
    await waitFor(() => expect(loadAccounts().filter((a) => a.status === "active")).toHaveLength(1));
    expect(getActiveBrokerageAccountId()).toBeNull();
    // UI shows the explicit "select an account" affordance.
    await waitFor(() => expect(screen.getByText(/select an account/i)).toBeTruthy());

    // Operator explicitly clicks PTS → it loads normally.
    const ptsSwitch = screen.getAllByRole("button", { pressed: false }).find((b) => b.textContent?.includes("PTS"));
    fireEvent.click(ptsSwitch!);
    await waitFor(() => expect(getActiveBrokerageAccountId()).toBe(ptsId));
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBe(ptsId));
  });
});

describe("selection is the sole identity authority (PL-PORT-01)", () => {
  it("a Balances file WITHOUT an in-body account number loads into the selected account — no identity error", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();

    addAccount("PTS");
    await waitFor(() => expect(loadAccounts()).toHaveLength(1));
    const ptsId = loadAccounts()[0].brokerageAccountId;

    // Upload the no-account-number Balances file → it loads into PTS. No refusal surface.
    const [, balInput] = fileInputs(container);
    fireEvent.change(balInput, { target: { files: [csvFile("noid.csv", NO_ID_BAL)] } });

    await waitFor(() => expect(readAccountCsv(ptsId, "balances")?.filename).toBe("noid.csv"));
    // The old identity-error surface must never appear.
    expect(screen.queryByText(/couldn't identify the Fidelity account/i)).toBeNull();
    expect(screen.queryByText(/disagree on the account/i)).toBeNull();
  });

  it("Option Summary alone (no account number) loads immediately — no premature/pending error", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();
    addAccount("PTS");
    await waitFor(() => expect(loadAccounts()).toHaveLength(1));
    const ptsId = loadAccounts()[0].brokerageAccountId;

    const [osInput] = fileInputs(container);
    fireEvent.change(osInput, { target: { files: [csvFile("os.csv", NO_ID_OS)] } });

    await waitFor(() => expect(readAccountCsv(ptsId, "option-summary")?.filename).toBe("os.csv"));
    expect(screen.queryByText(/couldn't identify the Fidelity account/i)).toBeNull();
    expect(screen.queryByText(/waiting for the balances file/i)).toBeNull();
  });

  it("uploading a file that resembles another known account still loads into the SELECTED account (no routing)", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();

    // Establish PTS and Sawdust as two known accounts (evidence loaded into each).
    addAccount("PTS");
    await uploadCsvs(container, PTS_OS, PTS_BAL);
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBeTruthy());
    const ptsId = loadAccounts()[0].brokerageAccountId;

    addAccount("Sawdust Roth");
    await waitFor(() => expect(loadAccounts()).toHaveLength(2));
    const rothId = loadAccounts().find((a) => a.brokerageAccountId !== ptsId)!.brokerageAccountId;
    await uploadCsvs(container, ROTH_OS, ROTH_BAL);
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBe(rothId));

    // Switch back to PTS, then upload the Roth-shaped Balances while PTS is selected.
    const ptsSwitch = screen.getAllByRole("button", { pressed: false }).find((b) => b.textContent?.includes("PTS"));
    fireEvent.click(ptsSwitch!);
    await waitFor(() => expect(getActiveBrokerageAccountId()).toBe(ptsId));

    const [, balInput] = fileInputs(container);
    fireEvent.change(balInput, { target: { files: [csvFile("roth-shaped.csv", ROTH_BAL)] } });

    // Selection governs: the file loads into PTS (the selection). No routing, no notice.
    await waitFor(() => expect(readAccountCsv(ptsId, "balances")?.filename).toBe("roth-shaped.csv"));
    expect(getActiveBrokerageAccountId()).toBe(ptsId);
    expect(screen.queryByText(/remains selected/i)).toBeNull();
  });
});
