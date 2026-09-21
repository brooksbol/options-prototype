/**
 * Increment 3 INTEGRATION (UI boundary) — the real upload component routes evidence through
 * the account-aware store path, lands it in the resolved account's per-account slot, and
 * never writes the legacy singleton keys.
 *
 * This exercises the actual production UI entry point (FidelityUploadCompact) that the
 * application header mounts, proving the live path — not just the service modules — is
 * account-aware.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { FidelityUploadCompact } from "../../src/components/FidelityUploadCompact";
import {
  getSnapshot,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import {
  getActiveBrokerageAccountId,
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
} from "../../src/portfolio/account-evidence-store";
import { resetWorkspace } from "../../src/workspace/workspace";

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

const LEGACY_KEYS = [
  "wheelwright:fidelity-csv:option-summary",
  "wheelwright:fidelity-csv:balances",
  "wheelwright:fidelity-csv:activity",
];

beforeEach(() => {
  localStorage.clear();
  _clearRegistryForTesting();
  _clearAccountEvidenceForTesting();
  _resetIdCounterForTesting();
  resetWorkspace();
  _resetForTesting();
});

function csvFile(name: string, text: string): File {
  return new File([text], name, { type: "text/csv" });
}

/** The three upload rows each contain a hidden file input; return them in DOM order. */
function fileInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
}

describe("FidelityUploadCompact drives the account-aware live path", () => {
  it("uploading Balances + Option Summary resolves an account and lands evidence in its slot", async () => {
    const { container } = render(<FidelityUploadCompact onSnapshotChange={() => {}} />);
    const [osInput, balInput] = fileInputs(container);

    // Upload Option Summary then Balances (order-independent; both needed for a snapshot).
    fireEvent.change(osInput, { target: { files: [csvFile("os.csv", PTS_OS)] } });
    fireEvent.change(balInput, { target: { files: [csvFile("bal.csv", PTS_BAL)] } });

    await waitFor(() => {
      expect(loadAccounts()).toHaveLength(1);
    });

    // An account was resolved from the imported evidence and adopted as active.
    const resolved = resolveAccountByExternalRef("Z12-345678");
    expect(resolved.kind).toBe("resolved");
    if (resolved.kind !== "resolved") return;
    const baId = resolved.account.brokerageAccountId;
    expect(getActiveBrokerageAccountId()).toBe(baId);

    // Evidence landed in the per-account slot, NOT the legacy singleton keys.
    await waitFor(() => {
      expect(readAccountCsv(baId, "balances")?.text).toBe(PTS_BAL);
    });
    expect(readAccountCsv(baId, "option-summary")?.text).toBe(PTS_OS);
    for (const k of LEGACY_KEYS) {
      expect(localStorage.getItem(k)).toBeNull();
    }

    // The live snapshot is account-stamped.
    await waitFor(() => {
      const snap = getSnapshot();
      expect(snap?.brokerageAccountId).toBe(baId);
      expect(snap?.accountId).toBe("Z12-345678");
    });
  });
});
