/**
 * ExpandedConsequenceRow — Sell / Hold / Covered Call comparison surface
 * (PL-DEPLOY direction A). FE/BE economic-truth boundary tests.
 *
 * This is the presentation adapter between the authoritative consequence
 * evaluator and the horizontal comparison grid. The same boundary discipline
 * that governed the retired drawer section applies here: the adapter must not
 * invent provenance, derive economics, or fill missing economic state.
 *
 * Proves:
 *  A.  F1/block-value spot facts render "quote freshness unknown" — chain
 *      provenance is never laundered into a spot-age claim.
 *  A'. option-derived F3 premium renders chain-acquisition age ("chain acquired …").
 *  B.  a realized sale value appears ONLY for Sell; Hold and CC show "—".
 *  C.  the shared block value is shown once as row context.
 *  D.  three-state downside distinguishes Sell (no continuing share downside)
 *      from Hold/CC (no protective floor).
 *  E.  encumbered/residual shares survive from candidate evidence.
 *  F.  ITM room-to-strike renders semantically, never a malformed "+$-X".
 *  G.  the grid is alternatives-across (Sell/Hold/Covered Call column headers).
 *  H.  renders nothing without covered-call capacity.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ExpandedConsequenceRow } from "../../src/components/ExpandedConsequenceRow";
import type { CallCandidate } from "../../src/write-desk/candidate-types";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const CHAIN_PROV: EvidenceProvenance = {
  kind: "chain-acquired",
  acquiredAtMs: Date.now() - 5 * 60 * 1000, // 5 minutes ago
};

function makeCandidate(overrides: Partial<CallCandidate> = {}): CallCandidate {
  return {
    rank: 1,
    symbol: "COPX",
    expiration: "2026-09-18",
    dte: 9,
    strike: 95,
    delta: 0.3,
    bid: 1.25,
    ask: 1.35,
    mid: 1.3,
    spreadPercent: 7.7,
    openInterest: 500,
    volume: 100,
    freeShares: 200,
    maxContracts: 2,
    encumberedShares: 0,
    premiumPerContract: 130,
    yieldAnnualized: 20,
    assessment: { score: 80, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" } as CallCandidate["assessment"],
    posture: "ACTIONABLE",
    strikeAbovePrice: true,
    underlyingPrice: 90.66,
    economics: { averageCostPerShare: 94.93, costBasis: 18986, marketValue: 18132 },
    basisPerShare: 94.93,
    selectionBasis: "target-delta",
    evidenceProvenance: CHAIN_PROV,
    ...overrides,
  };
}

describe("ExpandedConsequenceRow — comparison surface boundary", () => {
  it("A: spot facts show quote freshness unknown — never laundered from chain provenance", () => {
    const { container } = render(<ExpandedConsequenceRow candidate={makeCandidate()} />);
    expect(container.textContent).toMatch(/quote freshness unknown/i);
    // must NOT claim a spot observation age
    expect(container.textContent).not.toMatch(/quote acquired .* ago/i);
  });

  it("A': option premium is labeled chain-acquisition age", () => {
    const { container } = render(<ExpandedConsequenceRow candidate={makeCandidate()} />);
    expect(container.textContent).toMatch(/chain acquired .* ago/i);
  });

  it("B: a realized sale value appears only for Sell; Hold and CC show a dash", () => {
    render(<ExpandedConsequenceRow candidate={makeCandidate()} />);
    // The "Realized if sold" dimension row: Sell cell has a value, Hold/CC show "—".
    const row = screen.getByText(/Realized if sold/i).closest("tr")!;
    const cells = within(row).getAllByRole("cell");
    // cells[0] is the dimension label; cells[1..3] are Sell / Hold / CC
    expect(cells[1].textContent).toMatch(/\$/); // Sell realized value
    expect(cells[2].textContent).toBe("—"); // Hold
    expect(cells[3].textContent).toBe("—"); // CC
  });

  it("C: shared block value is shown once as row context", () => {
    const { container } = render(<ExpandedConsequenceRow candidate={makeCandidate()} />);
    expect(container.textContent).toMatch(/block value ≈ \$/i);
  });

  it("D: downside distinguishes Sell (no continuing share downside) from Hold/CC (no protective floor)", () => {
    render(<ExpandedConsequenceRow candidate={makeCandidate()} />);
    const row = screen.getByText(/^Downside$/i).closest("tr")!;
    const cells = within(row).getAllByRole("cell");
    expect(cells[1].textContent).toMatch(/no continuing share downside/i); // Sell
    expect(cells[2].textContent).toMatch(/no protective floor/i); // Hold
    expect(cells[3].textContent).toMatch(/no protective floor/i); // CC
  });

  it("E: encumbered/residual shares survive; 250 free + 100 encumbered + 2CC -> block 200 / 50 free / 100 encumbered", () => {
    const { container } = render(
      <ExpandedConsequenceRow candidate={makeCandidate({ freeShares: 250, encumberedShares: 100, maxContracts: 2 })} />
    );
    expect(container.textContent).toMatch(/200 shares under consideration/i);
    expect(container.textContent).toMatch(/50 free shares/i);
    expect(container.textContent).toMatch(/100 separately-encumbered shares/i);
  });

  it("F: ITM room-to-strike renders semantically, never a malformed +$-X", () => {
    const { container } = render(
      <ExpandedConsequenceRow candidate={makeCandidate({ underlyingPrice: 100, strike: 95 })} />
    );
    expect(container.textContent).not.toMatch(/\+\$-/);
    expect(container.textContent).toMatch(/in the money/i);
  });

  it("G: the grid is alternatives-across — Sell / Hold / Covered Call are column headers", () => {
    render(<ExpandedConsequenceRow candidate={makeCandidate()} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toContain("Sell");
    expect(headers).toContain("Hold");
    expect(headers).toContain("Covered Call");
  });

  it("H: renders nothing without covered-call capacity", () => {
    const { container } = render(
      <ExpandedConsequenceRow candidate={makeCandidate({ maxContracts: 0 })} />
    );
    expect(container.textContent).toBe("");
  });
});
