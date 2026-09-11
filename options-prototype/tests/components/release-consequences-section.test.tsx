/**
 * ReleaseConsequencesSection — FE/BE economic-truth boundary tests
 * (LVT-INIT-CONSEQUENCE-RELEASE-COST v1).
 *
 * The v1 conformance defects lived in THIS adapter (between evaluated facts and
 * presentation), not in the pure evaluator. These tests exercise the boundary
 * directly, per the ratified lesson: economically-meaningful UI adapters need
 * their own tests.
 *
 * Proves:
 *  A. F1 does not inherit chain provenance as spot provenance; renders
 *     "quote freshness unknown".
 *  A'. option-derived F3 renders chain-acquisition provenance accurately
 *      ("chain acquired … ago"), not "obs".
 *  B. F8 (basis-relative RELEASE effect) appears with a value only for Sell;
 *     Hold and CC show "n/a (no release)".
 *  C. separately-encumbered shares survive from candidate evidence into the
 *     residual presentation; the adapter does not hardcode 0.
 *  D. 250 free + 100 encumbered + 2-contract CC -> block 200 / residual free 50 /
 *     encumbered 100.
 *  E. ITM room-to-strike renders without a malformed "+$-X.XX".
 *  F. no adapter-invented economic values (spot-age claim absent).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReleaseConsequencesSection } from "../../src/components/ReleaseConsequencesSection";
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

describe("ReleaseConsequencesSection — FE/BE boundary", () => {
  it("A: F1 shows quote freshness unknown — does NOT launder chain provenance into spot age", () => {
    render(<ReleaseConsequencesSection candidate={makeCandidate()} />);
    // F1 sale value present, but its freshness is the honest unknown
    expect(screen.getAllByText(/quote freshness unknown/i).length).toBeGreaterThan(0);
    // and it must NOT claim a spot observation age
    expect(screen.queryByText(/obs .* ago/i)).toBeNull();
  });

  it("A': F3 option premium is labeled chain-acquisition age, not 'obs'", () => {
    render(<ReleaseConsequencesSection candidate={makeCandidate()} />);
    expect(screen.getAllByText(/chain acquired .* ago/i).length).toBeGreaterThan(0);
  });

  it("B: F8 release effect has a value only for Sell; Hold and CC show n/a", () => {
    render(<ReleaseConsequencesSection candidate={makeCandidate()} />);
    // exactly one alternative (Sell) shows an approximate release effect
    const approx = screen.getAllByText(/\(approx\)/i);
    expect(approx.length).toBe(1);
    // Hold and CC show not-applicable
    expect(screen.getAllByText(/n\/a \(no release\)/i).length).toBe(2);
  });

  it("C+D: encumbered shares survive; 250 free + 100 encumbered + 2CC -> 200 block / 50 free / 100 encumbered", () => {
    render(
      <ReleaseConsequencesSection
        candidate={makeCandidate({ freeShares: 250, encumberedShares: 100, maxContracts: 2 })}
      />
    );
    // evaluated block = 200
    expect(screen.getByText(/evaluated block: 200 shares/i)).toBeTruthy();
    // residual line names both 50 free and 100 encumbered
    const residual = screen.getByText(/Outside this block/i).textContent ?? "";
    expect(residual).toMatch(/50 free shares/i);
    expect(residual).toMatch(/100 separately-encumbered shares/i);
  });

  it("C: adapter does not hardcode encumbered=0 — residual reflects the supplied value", () => {
    const { container } = render(
      <ReleaseConsequencesSection candidate={makeCandidate({ freeShares: 200, encumberedShares: 300, maxContracts: 2 })} />
    );
    expect(container.textContent).toMatch(/300 separately-encumbered shares/i);
  });

  it("E: ITM room-to-strike renders semantically, never a malformed +$-X", () => {
    // spot 100 above strike 95 -> ITM; room = 95 - 100 = -5
    const { container } = render(
      <ReleaseConsequencesSection candidate={makeCandidate({ underlyingPrice: 100, strike: 95 })} />
    );
    expect(container.textContent).not.toMatch(/\+\$-/);
    expect(container.textContent).toMatch(/in the money/i);
  });

  it("F: OTM room-to-strike shows headroom", () => {
    const { container } = render(
      <ReleaseConsequencesSection candidate={makeCandidate({ underlyingPrice: 90, strike: 95 })} />
    );
    expect(container.textContent).toMatch(/headroom/i);
  });

  it("renders nothing when there is no covered-call capacity", () => {
    const { container } = render(
      <ReleaseConsequencesSection candidate={makeCandidate({ maxContracts: 0 })} />
    );
    expect(container.textContent).toBe("");
  });
});
