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

  // BUG-027: Activity (and Positions) slot status must reconstruct from persisted account
  // evidence on remount, not only from ephemeral in-session component state.
  it("BUG-027: persisted Activity survives remount — Activity slot shows loaded, not empty", async () => {
    const acct = "acct-remount";
    // Seed a resolved account with persisted evidence (as a prior upload would have).
    const { registerAccount: reg } = await import("../../src/portfolio/brokerage-account-registry");
    reg({ broker: "fidelity", externalAccountRef: "Z12-345678" });
    const resolved = resolveAccountByExternalRef("Z12-345678");
    if (resolved.kind !== "resolved") throw new Error("setup");
    const baId = resolved.account.brokerageAccountId;
    const { writeAccountCsv } = await import("../../src/portfolio/account-evidence-store");
    writeAccountCsv(baId, "option-summary", { text: PTS_OS, filename: "os.csv" });
    writeAccountCsv(baId, "balances", { text: PTS_BAL, filename: "bal.csv" });
    writeAccountCsv(baId, "activity", { text: ACTIVITY_CSV, filename: "activity.csv" });
    const { switchToAccount } = await import("../../src/portfolio/portfolio-store");
    switchToAccount(baId);
    void acct;

    // Mount the panel fresh (simulates reopening the dropdown / remount).
    const { container } = render(<FidelityUploadCompact onSnapshotChange={() => {}} targetBrokerageAccountId={baId} />);

    // The Activity row must show the loaded checkmark + filename, NOT the empty "—" state.
    await waitFor(() => {
      expect(container.textContent).toContain("activity.csv");
    });
    // No slot should still be showing the empty dash for Activity: assert the loaded filename
    // is present (empty state renders "—" with no filename).
    const rows = Array.from(container.querySelectorAll(".as-upload-row-wrap"));
    const activityRow = rows.find((r) => r.textContent?.includes("Activity"));
    expect(activityRow?.textContent).toContain("activity.csv");
    expect(activityRow?.querySelector(".as-upload-ok")).not.toBeNull();
  });

  it("BUG-027: no persisted Activity → Activity slot remains empty/upload state", async () => {
    const { registerAccount: reg } = await import("../../src/portfolio/brokerage-account-registry");
    reg({ broker: "fidelity", externalAccountRef: "Z12-345678" });
    const resolved = resolveAccountByExternalRef("Z12-345678");
    if (resolved.kind !== "resolved") throw new Error("setup");
    const baId = resolved.account.brokerageAccountId;
    const { writeAccountCsv } = await import("../../src/portfolio/account-evidence-store");
    writeAccountCsv(baId, "option-summary", { text: PTS_OS, filename: "os.csv" });
    writeAccountCsv(baId, "balances", { text: PTS_BAL, filename: "bal.csv" });
    // No activity written.
    const { switchToAccount } = await import("../../src/portfolio/portfolio-store");
    switchToAccount(baId);

    const { container } = render(<FidelityUploadCompact onSnapshotChange={() => {}} targetBrokerageAccountId={baId} />);
    const rows = Array.from(container.querySelectorAll(".as-upload-row-wrap"));
    const activityRow = rows.find((r) => r.textContent?.includes("Activity"));
    // Empty state: dash present, no loaded checkmark.
    expect(activityRow?.querySelector(".as-upload-empty")).not.toBeNull();
    expect(activityRow?.querySelector(".as-upload-ok")).toBeNull();
  });
});

const ACTIVITY_CSV = `Run Date,Action,Symbol,Description,Quantity,Price,Amount,Cash Balance,Settlement Date
09/02/2026,YOU SOLD OPENING TRANSACTION CALL (SPY) SEP 18 26 $500 (100 SHS) (Cash),-SPY260918C500,SPY CALL,-1,5.00,500.00,1000,09/03/2026
`;
