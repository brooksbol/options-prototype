/**
 * Row-level governed-recommendation projection (drawer-consolidation UX).
 *
 * Proves the governed Recommendation is projected directly onto the existing Unencumbered
 * Shares rows (SELL CALL | UNRESOLVED) as PLAIN TEXT in a clickable cell (no pill/tag/badge,
 * no hyperlink styling, no status dot), that clicking the cell opens the drawer, and that
 * NO standalone "Governed Recommendations" region exists. Backend IO is not exercised — the
 * resolved map is injected, matching how the Console owns and passes it.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnencumberedInventory } from "../../src/operator-console/UnencumberedInventory";
import type { PortfolioSnapshot, InventoryPosition } from "../../src/write-desk/types";
import type { ResolvedGovernedRecommendation } from "../../src/governed-decision/resolve";
import type { GovernedRecommendation } from "../../src/governed-decision/types";

function inv(symbol: string, owned: number): InventoryPosition {
  return {
    symbol, sharesOwned: owned, sharesEncumbered: 0, sharesFree: owned,
    maxAdditionalContracts: Math.floor(owned / 100), economics: null, ownershipAuthority: "positions",
  };
}

function snap(inventory: InventoryPosition[]): PortfolioSnapshot {
  return {
    id: "s1",
    source: { kind: "fidelity-csv", sourceLabel: "test", createdAt: "2026-09-26T14:00:00Z" } as any,
    brokerageAccountId: "acctA",
    accountId: "X-1",
    snapshotDate: "2026-09-26",
    inventory,
    existingCalls: [],
    existingPuts: [],
    deployableCash: null,
    aggregateShortOptionMTM: null,
    balanceContext: null,
    provenance: { sourceLabel: "test", createdAt: "2026-09-26T14:00:00Z", optionSummaryExportTimestamp: "2026-09-26T14:00:00Z" } as any,
    readiness: { optionSummaryLoaded: true, inventoryValid: true, status: "READY", warnings: [] } as any,
  };
}

function resolved(symbol: string, recommendation: GovernedRecommendation): ResolvedGovernedRecommendation {
  return {
    subject: { subjectType: "share-block", subjectId: `shares-${symbol}`, symbol, brokerageAccountId: "acctA" },
    evaluation: {
      recommendation, evaluatorId: "wheel-share-phase", evaluatorVersion: "2",
      ruleId: "DOC65-RULE-2-SELL-CALL", reasons: [], predicateResults: [], programApplicability: "applicable",
      unresolvedCauses: recommendation === "UNRESOLVED" ? ["wheel-membership"] : [],
    },
    bundle: null,
  };
}

const noObs = new Map();

describe("row-level governed projection into Unencumbered Shares", () => {
  it("projects SELL CALL onto a governed share-block row", () => {
    const s = snap([inv("GDXJ", 100)]);
    const gov = new Map([["shares-GDXJ", resolved("GDXJ", "SELL_CALL")]]);
    render(<UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={() => {}} />);
    expect(screen.getByText("SELL CALL")).toBeTruthy();
  });

  it("projects UNRESOLVED (fail-closed) when governance is absent", () => {
    const s = snap([inv("COPX", 100)]);
    const gov = new Map([["shares-COPX", resolved("COPX", "UNRESOLVED")]]);
    render(<UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={() => {}} />);
    expect(screen.getByText("UNRESOLVED")).toBeTruthy();
  });

  it("clicking the Recommendation cell invokes inspection with the correct subject", () => {
    const s = snap([inv("URA", 200)]);
    const gov = new Map([["shares-URA", resolved("URA", "SELL_CALL")]]);
    const onInspect = vi.fn();
    render(<UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={onInspect} />);
    fireEvent.click(screen.getByText("SELL CALL"));
    expect(onInspect).toHaveBeenCalledOnce();
    expect(onInspect.mock.calls[0][0].subject.subjectId).toBe("shares-URA");
  });

  it("does NOT render the Recommendation column when governance projection is unavailable", () => {
    const s = snap([inv("GDXJ", 100)]);
    render(<UnencumberedInventory snapshot={s} observations={noObs} />);
    expect(screen.queryByText("Recommendation")).toBeNull();
  });

  it("renders the Recommendation column header when governance projection is available", () => {
    const s = snap([inv("GDXJ", 100)]);
    const gov = new Map([["shares-GDXJ", resolved("GDXJ", "SELL_CALL")]]);
    render(<UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={() => {}} />);
    expect(screen.getByText("Recommendation")).toBeTruthy();
    // No pre-rename "By-the-book" label anywhere.
    expect(screen.queryByText("By-the-book")).toBeNull();
  });

  it("orders the Recommendation column before Symbol (RECOMMENDATION | SYMBOL)", () => {
    const s = snap([inv("GDXJ", 100)]);
    const gov = new Map([["shares-GDXJ", resolved("GDXJ", "SELL_CALL")]]);
    const { container } = render(
      <UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={() => {}} />,
    );
    const headers = Array.from(container.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers[0]).toBe("Recommendation");
    expect(headers[1]).toBe("Symbol");
  });

  it("renders the Recommendation value as a compact TAG (grc-tag) — like CALL/BW, not a hyperlink/plain text, no dot", () => {
    const s = snap([inv("GDXJ", 100)]);
    const gov = new Map([["shares-GDXJ", resolved("GDXJ", "SELL_CALL")]]);
    const { container } = render(
      <UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={() => {}} />,
    );
    const value = screen.getByText("SELL CALL");
    const classes = value.className.split(/\s+/);
    // Compact tag idiom; not the old pill/link classes.
    expect(classes).toContain("grc-tag");
    expect(classes).toContain("grc-tag-sell-call");
    expect(classes).not.toContain("grt-link");
    // A tag span, not an anchor/button element (no hyperlink treatment).
    expect(value.tagName.toLowerCase()).toBe("span");
    // No status dot / bell in the recommendation projection.
    expect(container.querySelector(".hcb")).toBeNull();
    expect(value.textContent).not.toContain("🔴");
  });

  it("clicking the cell does not require hyperlink/button semantics (cell is the target)", () => {
    const s = snap([inv("GDXJ", 100)]);
    const gov = new Map([["shares-GDXJ", resolved("GDXJ", "SELL_CALL")]]);
    const onInspect = vi.fn();
    const { container } = render(
      <UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={onInspect} />,
    );
    const cell = container.querySelector("td.oc-inv-td-governed");
    expect(cell).toBeTruthy();
    fireEvent.click(cell!);
    expect(onInspect).toHaveBeenCalledOnce();
  });

  it("has no standalone 'Governed Recommendations' region", () => {
    const s = snap([inv("GDXJ", 100)]);
    const gov = new Map([["shares-GDXJ", resolved("GDXJ", "SELL_CALL")]]);
    render(<UnencumberedInventory snapshot={s} observations={noObs} governedBySubjectId={gov} onInspectGoverned={() => {}} />);
    // The rejected duplicate region had a distinct "Governed recommendations" title.
    expect(screen.queryByText(/^Governed recommendations$/i)).toBeNull();
  });
});
