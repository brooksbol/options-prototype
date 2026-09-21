/**
 * Regression: OperatorConsole must not violate the Rules of Hooks when the active account's
 * snapshot transitions null → present.
 *
 * The Console previously had an early `if (!snapshot) return` positioned BETWEEN hook groups.
 * When an operator adds an empty account (snapshot null) and then it becomes populated
 * (snapshot present), the render switched from the early-return path (fewer hooks) to the
 * full path (more hooks) → React "Rendered fewer hooks than expected" → blank page. This
 * asserts the transition renders cleanly (empty state, then populated) with no crash.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { OperatorConsole } from "../../src/components/OperatorConsole";
import {
  importFidelityEvidence,
  switchToAccount,
  _resetForTesting,
} from "../../src/portfolio/portfolio-store";
import { resolveAccountByExternalRef, _clearRegistryForTesting } from "../../src/portfolio/brokerage-account-registry";
import { _resetIdCounterForTesting } from "../../src/portfolio/brokerage-account";
import { _clearAccountEvidenceForTesting, type StoredCsvBlob } from "../../src/portfolio/account-evidence-store";
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
  // Backend calls are no-ops for this render test.
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), headers: new Headers() })));
});

describe("OperatorConsole null→present snapshot transition (hooks-order regression)", () => {
  it("renders the empty state with no active account, then renders populated after evidence — no hooks crash", async () => {
    // Start with no snapshot (the state after adding an empty account or removing the active
    // one). _resetForTesting leaves currentSnapshot null.
    const { rerender } = render(<OperatorConsole />);
    // Empty state renders (no crash).
    await waitFor(() => expect(screen.getByText(/No portfolio data available/i)).toBeTruthy());

    // Now populate an account and make it active — snapshot transitions null → present.
    await act(async () => {
      importFidelityEvidence({ optionSummary: blob(PTS_OS, "os.csv"), balances: blob(PTS_BAL, "bal.csv") });
      const pts = resolveAccountByExternalRef("Z12-345678");
      if (pts.kind === "resolved") switchToAccount(pts.account.brokerageAccountId);
    });
    rerender(<OperatorConsole />);

    // The populated Console renders without a hooks-order crash (empty state gone).
    await waitFor(() => expect(screen.queryByText(/No portfolio data available/i)).toBeNull());
  });
});
