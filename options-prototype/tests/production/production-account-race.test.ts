/**
 * Increment 8 — account-switch race guard for Production assessment.
 *
 * The sharpest multi-account correctness requirement: an assessment started under account A
 * must NEVER become account B's visible Production state if the operator switches accounts
 * before the async request completes. useProductionAssessment tags the request with the
 * expected account and discards the result when the active account has changed (or a newer
 * request superseded it).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProductionAssessment } from "../../src/production/use-production-assessment";
import { switchToAccount, importFidelityEvidence, _resetForTesting } from "../../src/portfolio/portfolio-store";
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
  resetWorkspace();
  _resetForTesting();
  vi.restoreAllMocks();
});

function setupTwoAccounts(): { ptsId: string; rothId: string } {
  const pts = importFidelityEvidence({ optionSummary: blob(PTS_OS, "p-os.csv"), balances: blob(PTS_BAL, "p-bal.csv") });
  importFidelityEvidence({ optionSummary: blob(ROTH_OS, "r-os.csv"), balances: blob(ROTH_BAL, "r-bal.csv") });
  if (pts.kind !== "refreshed") throw new Error("setup");
  const roth = resolveAccountByExternalRef("Z98-765432");
  if (roth.kind !== "resolved") throw new Error("setup");
  return { ptsId: pts.brokerageAccountId, rothId: roth.account.brokerageAccountId };
}

describe("Production assessment account-switch race guard", () => {
  it("DISCARDS a result whose account is no longer active when the request completes", async () => {
    const { ptsId, rothId } = setupTwoAccounts();
    switchToAccount(ptsId);

    // A fetch that resolves only when we release it (simulates an in-flight PTS assessment).
    let release!: (v: unknown) => void;
    const gate = new Promise((r) => { release = r; });
    const fetchMock = vi.fn(async () => {
      await gate;
      return { ok: true, status: 200, json: async () => ({ period: "2026-09", periodDescription: "Sep", netStrategyResult: 111, reconciliationIssues: [], reconciliationStatus: "OK" }) } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useProductionAssessment());

    // Start an assessment FOR the PTS account.
    act(() => {
      void result.current.assess(new File(["x"], "a.csv"), "2026-09", { expectedAccountId: ptsId });
    });
    expect(result.current.state.status).toBe("uploading");

    // Operator switches to Roth BEFORE the PTS assessment completes.
    act(() => { switchToAccount(rothId); });

    // Now the in-flight PTS assessment completes.
    await act(async () => { release(null); await Promise.resolve(); });

    // The stale PTS result must NOT become the visible state (which would be Roth's now).
    await waitFor(() => {
      expect(result.current.state.status).not.toBe("result");
    });
    expect(result.current.state.status).toBe("uploading");
  });

  it("APPLIES a result when the account is still active at completion", async () => {
    const { ptsId } = setupTwoAccounts();
    switchToAccount(ptsId);

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ period: "2026-09", periodDescription: "Sep", netStrategyResult: 222, reconciliationIssues: [], reconciliationStatus: "OK" }),
    } as unknown as Response)));

    const { result } = renderHook(() => useProductionAssessment());
    await act(async () => {
      await result.current.assess(new File(["x"], "a.csv"), "2026-09", { expectedAccountId: ptsId });
    });

    expect(result.current.state.status).toBe("result");
    if (result.current.state.status === "result") {
      expect(result.current.state.data.netStrategyResult).toBe(222);
    }
  });

  it("a superseded (older) request never overwrites a newer one", async () => {
    const { ptsId } = setupTwoAccounts();
    switchToAccount(ptsId);

    // Two sequential resolvable fetches; first is slow, second fast.
    let releaseFirst!: (v: unknown) => void;
    const firstGate = new Promise((r) => { releaseFirst = r; });
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      callCount += 1;
      const n = callCount;
      if (n === 1) await firstGate;
      return { ok: true, status: 200, json: async () => ({ period: "2026-09", periodDescription: "Sep", netStrategyResult: n === 1 ? 1 : 2, reconciliationIssues: [], reconciliationStatus: "OK" }) } as unknown as Response;
    }));

    const { result } = renderHook(() => useProductionAssessment());

    // Start request #1 (slow), then request #2 (fast) — both for the active account.
    act(() => { void result.current.assess(new File(["x"], "a.csv"), "2026-09", { expectedAccountId: ptsId }); });
    await act(async () => { await result.current.assess(new File(["x"], "b.csv"), "2026-09", { expectedAccountId: ptsId }); });
    // #2 landed.
    expect(result.current.state.status).toBe("result");
    if (result.current.state.status === "result") expect(result.current.state.data.netStrategyResult).toBe(2);

    // Now release the stale #1 — it must NOT overwrite #2.
    await act(async () => { releaseFirst(null); await Promise.resolve(); });
    if (result.current.state.status === "result") expect(result.current.state.data.netStrategyResult).toBe(2);
  });
});
