/**
 * Ladder governed Recommendation column (Principal UX correction).
 *
 * The governed Recommendation now has its OWN dedicated Ladder column — it is no longer
 * rendered inside the TYPE/badge cell. Clicking the Recommendation cell opens the governed
 * drawer and must NOT trigger the row's position/lifecycle modal (onTileClick). TYPE
 * remains the position-type badge only.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { PositionTable, ExpirationRungRow } from "../../src/components/OperatorConsole";
import type { MonitoredPosition, ExpirationRung } from "../../src/portfolio/position-monitoring";
import type { PortfolioSnapshot } from "../../src/write-desk/types";
import type { ResolvedGovernedRecommendation } from "../../src/governed-decision/resolve";
import type { GovernedRecommendation } from "../../src/governed-decision/types";

function coveredCall(id: string, symbol: string): MonitoredPosition {
  return {
    id, type: "call", underlying: symbol, strike: 30, expiration: "2026-10-16", dte: 20, quantity: 1,
    encumberedCapital: null, capitalValuationBasis: "unavailable", capitalAsOf: null,
    moneyness: -0.05, underlyingPrice: 28.5, underlyingPreviousClose: 28.4, priceObservedAt: null,
    evidenceGeneration: null, acquisitionStatus: null, lastAttemptAt: null, failureCount: 0, openedDate: null,
  };
}

function snap(): PortfolioSnapshot {
  return {
    id: "s1", source: { kind: "fidelity-csv", sourceLabel: "t", createdAt: "2026-09-26T14:00:00Z" } as any,
    brokerageAccountId: "acctA", accountId: "X-1", snapshotDate: "2026-09-26",
    inventory: [], existingCalls: [], existingPuts: [], deployableCash: null, aggregateShortOptionMTM: null,
    balanceContext: null,
    provenance: { sourceLabel: "t", createdAt: "2026-09-26T14:00:00Z", optionSummaryExportTimestamp: "2026-09-26T14:00:00Z" } as any,
    readiness: { optionSummaryLoaded: true, inventoryValid: true, status: "READY", warnings: [] } as any,
  };
}

function gov(id: string, symbol: string, recommendation: GovernedRecommendation): ResolvedGovernedRecommendation {
  return {
    subject: { subjectType: "covered-call", subjectId: id, symbol, brokerageAccountId: "acctA" },
    evaluation: {
      recommendation, evaluatorId: "wheel-covered-call", evaluatorVersion: "2",
      ruleId: "DOC65-RULE-1-LET-RESOLVE", reasons: [], predicateResults: [], programApplicability: "applicable",
      unresolvedCauses: recommendation === "UNRESOLVED" ? ["wheel-membership"] : [],
    },
    bundle: null,
  };
}

const EMPTY = new Map();

function renderTable(recommendation: GovernedRecommendation, onTileClick = vi.fn(), onInspect = vi.fn()) {
  const pos = coveredCall("cc-1", "GDXJ");
  const governed = new Map([["cc-1", gov("cc-1", "GDXJ", recommendation)]]);
  const result = render(
    <PositionTable
      positions={[pos]}
      onTileClick={onTileClick}
      totalCapital={0}
      allPositionsTotalCapital={0}
      maxPositionCapital={0}
      positionDeltas={EMPTY}
      positionGreeks={EMPTY}
      positionQuotes={EMPTY}
      holdCloseNotices={EMPTY}
      governedBySubjectId={governed}
      onInspectGoverned={onInspect}
      isDemoSource={false}
      spotHistory={EMPTY}
      intradayBars={EMPTY}
      snapshot={snap()}
    />,
  );
  return { ...result, onTileClick, onInspect };
}

describe("Ladder governed Recommendation column", () => {
  it("renders a dedicated Recommendation column header", () => {
    renderTable("LET_RESOLVE");
    expect(screen.getByText("Recommendation")).toBeTruthy();
  });

  it("orders columns TYPE | RECOMMENDATION | SYMBOL", () => {
    const { container } = renderTable("UNRESOLVED");
    const headers = Array.from(container.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers[0]).toBe("Type");
    expect(headers[1]).toBe("Recommendation");
    expect(headers[2]).toBe("Symbol");
  });

  it("renders LET RESOLVE as plain text, and NOT inside the TYPE/badge cell", () => {
    const { container } = renderTable("LET_RESOLVE");
    const value = screen.getByText("LET RESOLVE");
    expect(value.className.split(/\s+/)).toContain("grc-tag");
    // The TYPE/badge cell contains only the position badge, not the recommendation.
    const badgeCell = container.querySelector("td.oc-td-badge")!;
    expect(within(badgeCell as HTMLElement).queryByText("LET RESOLVE")).toBeNull();
    expect(within(badgeCell as HTMLElement).getByText("CALL")).toBeTruthy();
    // The recommendation lives in its own governed cell.
    const govCell = container.querySelector("td.oc-td-governed")!;
    expect(within(govCell as HTMLElement).getByText("LET RESOLVE")).toBeTruthy();
  });

  it("renders UNRESOLVED as plain text in the governed column", () => {
    const { container } = renderTable("UNRESOLVED");
    const govCell = container.querySelector("td.oc-td-governed")!;
    expect(within(govCell as HTMLElement).getByText("UNRESOLVED")).toBeTruthy();
  });

  it("clicking the Recommendation cell opens the drawer and does NOT trigger the row modal", () => {
    const { container, onTileClick, onInspect } = renderTable("LET_RESOLVE");
    fireEvent.click(container.querySelector("td.oc-td-governed")!);
    expect(onInspect).toHaveBeenCalledOnce();
    expect(onTileClick).not.toHaveBeenCalled();
  });

  it("clicking an ordinary row cell still triggers the position modal", () => {
    const { container, onTileClick, onInspect } = renderTable("LET_RESOLVE");
    // The symbol cell is ordinary row content — row click should fire.
    fireEvent.click(container.querySelector("td.oc-td-symbol")!);
    expect(onTileClick).toHaveBeenCalledOnce();
    expect(onInspect).not.toHaveBeenCalled();
  });

  it("shows no hold-close red dot inside the governed Recommendation cell", () => {
    const { container } = renderTable("UNRESOLVED");
    const govCell = container.querySelector("td.oc-td-governed")!;
    expect((govCell as HTMLElement).querySelector(".hcb")).toBeNull();
    expect((govCell as HTMLElement).textContent).not.toContain("🔴");
  });
});

/**
 * Real Ladder RUNG-VIEW click-path regression (the view in the Principal's screenshot).
 *
 * Root cause of the reported bug: ExpirationRungRow rendered PositionTable WITHOUT the
 * governed props, so the Recommendation column fell through to the row click -> centered
 * position/lifecycle modal. This exercises the actual ExpirationRungRow DOM/event path.
 */
function rung(positions: MonitoredPosition[]): ExpirationRung {
  return { expiration: "2026-10-16", dte: 20, positions, totalCapital: 0, capitalizedCount: 0 };
}

describe("Ladder rung-view Recommendation click path (regression)", () => {
  it("projects the governed tag and opens the drawer path — NOT the position/lifecycle modal", () => {
    const pos = coveredCall("cc-1", "URA");
    const governed = new Map([["cc-1", gov("cc-1", "URA", "UNRESOLVED")]]);
    const onTileClick = vi.fn();   // this is what opens the centered RECONCILE LIFECYCLE modal
    const onInspect = vi.fn();     // this opens the right-side governed drawer
    const { container } = render(
      <ExpirationRungRow
        rung={rung([pos])}
        totalCapital={0}
        maxPositionCapital={0}
        positionDeltas={EMPTY}
        positionGreeks={EMPTY}
        positionQuotes={EMPTY}
        governedBySubjectId={governed}
        onInspectGoverned={onInspect}
        onTileClick={onTileClick}
        vizRegime="b"
        isDemoSource={false}
        spotHistory={EMPTY}
        snapshot={snap()}
      />,
    );
    // The Recommendation column projects a governed tag in the rung view.
    const govCell = container.querySelector("td.oc-td-governed");
    expect(govCell).toBeTruthy();
    expect(within(govCell as HTMLElement).getByText("UNRESOLVED")).toBeTruthy();
    // Clicking it opens the drawer path and NOT the position/lifecycle modal.
    fireEvent.click(govCell!);
    expect(onInspect).toHaveBeenCalledOnce();
    expect(onTileClick).not.toHaveBeenCalled();
  });
});
