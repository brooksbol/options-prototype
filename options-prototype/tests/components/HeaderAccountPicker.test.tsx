/**
 * Account picker (follow-on) — operator-facing account switch at the real header boundary.
 *
 * Renders the actual HeaderPortfolioStatus, imports two accounts through the live store, and
 * proves: both accounts appear in the picker, the active one is marked, clicking a different
 * account switches the live active account (import-free), and renaming updates the label.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HeaderPortfolioStatus } from "../../src/components/HeaderPortfolioStatus";
import {
  importFidelityEvidence,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import { getActiveBrokerageAccountId } from "../../src/portfolio/active-account";
import { resolveAccountByExternalRef, _clearRegistryForTesting } from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import { _clearAccountEvidenceForTesting, type StoredCsvBlob } from "../../src/portfolio/account-evidence-store";
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
function blob(text: string, filename: string): StoredCsvBlob { return { text, filename }; }

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _clearHistoryForTesting();
  _resetIdCounterForTesting();
  _resetAccountsViewCacheForTesting();
  resetWorkspace();
  _resetForTesting();
});

function openDropdown() {
  fireEvent.click(screen.getByRole("button", { name: /portfolio status and upload/i }));
}

describe("Header account picker", () => {
  it("lists both accounts, marks the active one, and switches on click (no import)", async () => {
    // Import PTS (adopted active) then Sawdust Roth (Case B — stays inactive).
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "p-os.csv"), balances: blob(PTS_BAL, "p-bal.csv"), activity: undefined });
    importFidelityEvidence({ optionSummary: blob(ROTH_OS, "r-os.csv"), balances: blob(ROTH_BAL, "r-bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");
    const ptsId = pts.brokerageAccountId;
    const roth = resolveAccountByExternalRef("Z98-765432");
    if (roth.kind !== "resolved") throw new Error("setup");
    const rothId = roth.account.brokerageAccountId;

    render(<HeaderPortfolioStatus />);
    openDropdown();

    // The account SWITCH buttons carry aria-pressed; select them specifically.
    const switchBtns = screen.getAllByRole("button", { pressed: false }).concat(
      screen.getAllByRole("button", { pressed: true }),
    );
    const ptsBtn = switchBtns.find((b) => b.textContent?.includes("Z12-345678"))!;
    const rothBtn = switchBtns.find((b) => b.textContent?.includes("Z98-765432"))!;
    expect(ptsBtn).toBeTruthy();
    expect(rothBtn).toBeTruthy();

    // PTS is active (aria-pressed).
    expect(ptsBtn.getAttribute("aria-pressed")).toBe("true");
    expect(rothBtn.getAttribute("aria-pressed")).toBe("false");
    expect(getActiveBrokerageAccountId()).toBe(ptsId);

    // Click Sawdust Roth → switches active account, no import.
    fireEvent.click(rothBtn);
    await waitFor(() => expect(getActiveBrokerageAccountId()).toBe(rothId));

    // Picker reflects the new active account.
    await waitFor(() => {
      const rothActive = screen.getAllByRole("button", { pressed: true }).find((b) => b.textContent?.includes("Z98-765432"));
      expect(rothActive).toBeTruthy();
    });
  });

  it("renames an account inline and shows the new label", async () => {
    const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "p-os.csv"), balances: blob(PTS_BAL, "p-bal.csv") });
    if (pts.kind !== "refreshed") throw new Error("setup");

    render(<HeaderPortfolioStatus />);
    openDropdown();

    // The rename affordance is the button whose accessible name starts with "Rename".
    const renameBtn = screen.getByRole("button", { name: /^Rename Z12-345678/ });
    fireEvent.click(renameBtn);

    const input = screen.getByLabelText(/Rename account/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "PTS margin" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      const renamed = screen.getAllByRole("button", { pressed: true }).find((b) => b.textContent?.includes("PTS margin"));
      expect(renamed).toBeTruthy();
    });
  });
});
