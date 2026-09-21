/**
 * Portfolio dropdown as the account-management surface — real UI boundary.
 *
 * Exercises the operator workflow through the actual HeaderPortfolioStatus + FidelityUpload:
 * Add account → Select → Upload CSVs (binds identity) → Add second → switch (no import) →
 * Rename → Remove (with confirmation). Proves account-local isolation and fail-closed
 * upload behavior through the rendered UI, not just domain helpers.
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
import { _clearAccountEvidenceForTesting } from "../../src/portfolio/account-evidence-store";
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
  it("Add → Upload binds identity; second Add + switch is import-free; rename; remove", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();

    // ADD PTS (explicit, no CSV yet).
    addAccount("PTS");
    await waitFor(() => expect(loadAccounts()).toHaveLength(1));
    const ptsId = loadAccounts()[0].brokerageAccountId;
    expect(getActiveBrokerageAccountId()).toBe(ptsId);
    // No external identity yet.
    expect(loadAccounts()[0].externalAccountRef).toBeNull();

    // UPLOAD PTS CSVs → binds Z12-345678 to PTS and refreshes.
    await uploadCsvs(container, PTS_OS, PTS_BAL);
    await waitFor(() => expect(loadAccounts()[0].externalAccountRef).toBe("Z12-345678"));
    await waitFor(() => expect(getSnapshot()?.brokerageAccountId).toBe(ptsId));
    expect(getSnapshot()?.accountId).toBe("Z12-345678");

    // ADD Sawdust Roth (becomes active on add).
    addAccount("Sawdust Roth");
    await waitFor(() => expect(loadAccounts()).toHaveLength(2));
    const rothId = loadAccounts().find((a) => a.brokerageAccountId !== ptsId)!.brokerageAccountId;
    expect(getActiveBrokerageAccountId()).toBe(rothId);

    // UPLOAD Sawdust CSVs into the (now active) Sawdust account.
    await uploadCsvs(container, ROTH_OS, ROTH_BAL);
    await waitFor(() => expect(loadAccounts().find((a) => a.brokerageAccountId === rothId)!.externalAccountRef).toBe("Z98-765432"));
    await waitFor(() => expect(getSnapshot()?.accountId).toBe("Z98-765432"));

    // SWITCH back to PTS via the account button — no import — PTS state returns.
    const ptsSwitch = screen.getAllByRole("button", { pressed: false }).find((b) => b.textContent?.includes("PTS"))
      ?? screen.getAllByRole("button", { pressed: true }).find((b) => b.textContent?.includes("PTS"));
    fireEvent.click(ptsSwitch!);
    await waitFor(() => expect(getActiveBrokerageAccountId()).toBe(ptsId));
    await waitFor(() => expect(getSnapshot()?.accountId).toBe("Z12-345678"));

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
    expect(getSnapshot()?.accountId).toBe("Z12-345678");
  });

  it("removing the ACTIVE account enters an explicit no-account-selected state (no auto-fallback)", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();

    // Establish PTS + Sawdust.
    addAccount("PTS");
    await uploadCsvs(container, PTS_OS, PTS_BAL);
    await waitFor(() => expect(loadAccounts()[0].externalAccountRef).toBe("Z12-345678"));
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
    await waitFor(() => expect(getSnapshot()?.accountId).toBe("Z12-345678"));
  });

  it("off-account import: PTS active + known-Sawdust CSVs → Sawdust refreshes, PTS stays selected (ratified)", async () => {
    const { container } = render(<HeaderPortfolioStatus />);
    openDropdown();

    // Establish PTS (Z12) and Sawdust (Z98) as two known accounts.
    addAccount("PTS");
    await uploadCsvs(container, PTS_OS, PTS_BAL);
    await waitFor(() => expect(loadAccounts()[0].externalAccountRef).toBe("Z12-345678"));
    const ptsId = loadAccounts()[0].brokerageAccountId;

    addAccount("Sawdust Roth");
    await waitFor(() => expect(loadAccounts()).toHaveLength(2));
    const rothId = loadAccounts().find((a) => a.brokerageAccountId !== ptsId)!.brokerageAccountId;
    await uploadCsvs(container, ROTH_OS, ROTH_BAL);
    await waitFor(() => expect(loadAccounts().find((a) => a.brokerageAccountId === rothId)!.externalAccountRef).toBe("Z98-765432"));

    // Switch back to PTS, then upload the KNOWN Sawdust Balances while PTS is selected.
    const ptsSwitch = screen.getAllByRole("button", { pressed: false }).find((b) => b.textContent?.includes("PTS"));
    fireEvent.click(ptsSwitch!);
    await waitFor(() => expect(getActiveBrokerageAccountId()).toBe(ptsId));

    const [, balInput] = fileInputs(container);
    fireEvent.change(balInput, { target: { files: [csvFile("roth-refresh.csv", ROTH_BAL)] } });

    // Ratified: routed to Sawdust; PTS remains selected; visible notice.
    await waitFor(() => {
      expect(screen.getByText(/Sawdust Roth was refreshed\. PTS remains selected\./i)).toBeTruthy();
    });
    expect(getActiveBrokerageAccountId()).toBe(ptsId);
    // Sawdust received the refreshed file; PTS evidence + identity unchanged.
    const { readAccountCsv } = await import("../../src/portfolio/account-evidence-store");
    expect(readAccountCsv(rothId, "balances")?.filename).toBe("roth-refresh.csv");
    expect(loadAccounts().find((a) => a.brokerageAccountId === ptsId)!.externalAccountRef).toBe("Z12-345678");
  });

  it("refuses an unidentified Balances file (does not attach to the selected account)", async () => {
    render(<HeaderPortfolioStatus />);
    openDropdown();

    addAccount("PTS");
    await waitFor(() => expect(loadAccounts()).toHaveLength(1));

    // Upload a Balances file with no usable account number → refused, PTS unbound.
    const NO_ID_BAL = `Brokerage
Account Name / Account Number,Individual - Z39411514
Description,Amount,Day Change
Available to trade (all settled),7690.00,
Total Account Value,145200.00,
`;
    const balInputs = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
    fireEvent.change(balInputs[1], { target: { files: [csvFile("noid.csv", NO_ID_BAL)] } });

    await waitFor(() => {
      expect(screen.getByText(/couldn't identify the Fidelity account/i)).toBeTruthy();
    });
    expect(loadAccounts()[0].externalAccountRef).toBeNull();
  });
});
