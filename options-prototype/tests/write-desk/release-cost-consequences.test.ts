/**
 * Tests for LVT-INIT-CONSEQUENCE-RELEASE-COST v1 — release/retention consequences.
 *
 * Proves the authorized semantics from
 * docs/design/lvt-init-consequence-release-cost-v1-design.md:
 *  - subjectShares block: 100-share, and 250-free/2-contract -> 200-share block w/ 50 residual
 *  - Sell / Hold / CC compare the SAME subject quantity
 *  - F1 = estimated gross sale value (block x spot), not proceeds / not buying power
 *  - F2 = time-to-contractual-boundary, null for Sell/Hold (not "locked")
 *  - F3 = estimated gross opening premium, not retained compensation
 *  - F4 = no protective floor above zero (never "unbounded")
 *  - F6 = held-through-expiration branches + acknowledged early exits, residual outside block
 *  - F8 = blended/approximate with basis, unavailable without; NEVER exact
 *  - provenance/freshness survives onto the facts
 *  - the module does not select strike/DTE/contracts/alternative set
 */
import { describe, it, expect } from "vitest";
import {
  evaluateReleaseConsequences,
  suppliedAlternativesForCoveredCall,
  type ReleaseContext,
  type SuppliedAlternative,
} from "../../src/write-desk/release-cost-consequences";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const CHAIN_PROV: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: 1_000_000 };
const SPOT_PROV: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: 999_000 };

function ctx(overrides: Partial<ReleaseContext> = {}): ReleaseContext {
  return {
    symbol: "COPX",
    observedSpot: 90.66,
    spotProvenance: SPOT_PROV,
    averageBasisPerShare: 94.93,
    totalFreeShares: 100,
    encumberedShares: 0,
    ...overrides,
  };
}

function ccAlt(subjectShares: number, contracts: number): SuppliedAlternative {
  return {
    kind: "covered-call",
    subjectShares,
    callLeg: {
      strike: 95,
      expiration: "2026-09-18",
      dte: 9,
      midPerShare: 1.3,
      contracts,
      provenance: CHAIN_PROV,
    },
  };
}

describe("subject-share block (4AM quantity finding)", () => {
  it("exactly 100 subject shares: F1 uses 100, not more", () => {
    const facts = evaluateReleaseConsequences(ctx({ totalFreeShares: 100 }), {
      kind: "sell",
      subjectShares: 100,
    });
    expect(facts.subjectShares).toBe(100);
    expect(facts.estimatedGrossSaleValue.value).toBeCloseTo(100 * 90.66, 6);
    expect(facts.resultingHolding.residualOutsideBlock).toHaveLength(0);
  });

  it("250 free shares / 2-contract CC evaluates 200 shares with 50 residual outside the block", () => {
    const c = ctx({ totalFreeShares: 250 });
    const alts = suppliedAlternativesForCoveredCall({
      maxContracts: 2,
      strike: 95,
      expiration: "2026-09-18",
      dte: 9,
      midPerShare: 1.3,
      provenance: CHAIN_PROV,
    });
    // subjectShares is 200 for ALL alternatives on the row
    expect(alts.every((a) => a.subjectShares === 200)).toBe(true);

    for (const alt of alts) {
      const facts = evaluateReleaseConsequences(c, alt);
      expect(facts.subjectShares).toBe(200);
      // residual 50 free shares reported outside the block, never folded in
      expect(facts.resultingHolding.residualOutsideBlock.join(" ")).toContain("50 free shares");
    }
  });

  it("Sell / Hold / CC on one row describe the SAME subject quantity", () => {
    const c = ctx({ totalFreeShares: 250 });
    const alts = suppliedAlternativesForCoveredCall({
      maxContracts: 2, strike: 95, expiration: "2026-09-18", dte: 9, midPerShare: 1.3, provenance: CHAIN_PROV,
    });
    const subjectSets = alts.map((a) => evaluateReleaseConsequences(c, a).subjectShares);
    expect(new Set(subjectSets)).toEqual(new Set([200]));
  });

  it("does not silently evaluate Sell on a non-multiple-of-100 remainder", () => {
    // supplied block is 200; totalFree 250. Sell must use 200, not 250.
    const facts = evaluateReleaseConsequences(ctx({ totalFreeShares: 250 }), {
      kind: "sell",
      subjectShares: 200,
    });
    expect(facts.subjectShares).toBe(200);
    expect(facts.estimatedGrossSaleValue.value).toBeCloseTo(200 * 90.66, 6);
  });
});

describe("F1 — estimated gross sale value", () => {
  it("is block x spot, carries a not-proceeds/not-buying-power disclaimer", () => {
    const facts = evaluateReleaseConsequences(ctx(), { kind: "sell", subjectShares: 100 });
    expect(facts.estimatedGrossSaleValue.value).toBeCloseTo(9066, 6);
    expect(facts.estimatedGrossSaleValue.disclaimer).toBe(
      "estimated-gross-not-proceeds-not-buying-power"
    );
    expect(facts.estimatedGrossSaleValue.provenance).toEqual(SPOT_PROV);
  });

  it("renders unavailable when spot is absent", () => {
    const facts = evaluateReleaseConsequences(ctx({ observedSpot: null }), {
      kind: "sell",
      subjectShares: 100,
    });
    expect(facts.estimatedGrossSaleValue.value).toBeNull();
    expect(facts.estimatedGrossSaleValue.provenance).toEqual({ kind: "unavailable" });
  });
});

describe("F2 — time to contractual boundary (not lockup)", () => {
  it("is the CC DTE for a covered call", () => {
    const facts = evaluateReleaseConsequences(ctx(), ccAlt(100, 1));
    expect(facts.timeToContractualBoundaryDays).toBe(9);
    expect(facts.nextDecisionBoundary).toEqual({ kind: "expiration", expiration: "2026-09-18" });
  });
  it("is null (immediate/open) for Sell and Hold — never a lockup duration", () => {
    expect(
      evaluateReleaseConsequences(ctx(), { kind: "sell", subjectShares: 100 }).timeToContractualBoundaryDays
    ).toBeNull();
    expect(
      evaluateReleaseConsequences(ctx(), { kind: "hold", subjectShares: 100 }).timeToContractualBoundaryDays
    ).toBeNull();
    expect(
      evaluateReleaseConsequences(ctx(), { kind: "hold", subjectShares: 100 }).nextDecisionBoundary.kind
    ).toBe("open");
  });
});

describe("F3 — estimated gross opening premium (not retained compensation)", () => {
  it("is mid x 100 x contracts with the gross-opening disclaimer", () => {
    const facts = evaluateReleaseConsequences(ctx(), ccAlt(200, 2));
    expect(facts.estimatedGrossOpeningPremium.value).toBeCloseTo(1.3 * 100 * 2, 6);
    expect(facts.estimatedGrossOpeningPremium.disclaimer).toBe("gross-opening-only-not-retained-net");
    expect(facts.estimatedGrossOpeningPremium.provenance).toEqual(CHAIN_PROV);
  });
  it("is null for Sell and Hold", () => {
    expect(
      evaluateReleaseConsequences(ctx(), { kind: "sell", subjectShares: 100 }).estimatedGrossOpeningPremium.value
    ).toBeNull();
    expect(
      evaluateReleaseConsequences(ctx(), { kind: "hold", subjectShares: 100 }).estimatedGrossOpeningPremium.value
    ).toBeNull();
  });
});

describe("F4 — downside envelope (never unbounded language)", () => {
  it("has no protective floor above zero for CC/Hold, note avoids 'unlimited/unbounded'", () => {
    for (const alt of [
      ccAlt(100, 1),
      { kind: "hold", subjectShares: 100 } as SuppliedAlternative,
    ]) {
      const facts = evaluateReleaseConsequences(ctx(), alt);
      expect(facts.downsideEnvelope.hasProtectiveFloorAboveZero).toBe(false);
      expect(facts.downsideEnvelope.note.toLowerCase()).not.toContain("unlimited");
      expect(facts.downsideEnvelope.note.toLowerCase()).not.toContain("unbounded");
    }
  });
});

describe("F6 — resulting holding of the evaluated block", () => {
  it("scopes CC assignment/OTM branches to 'if held through expiration' and lists early exits", () => {
    const facts = evaluateReleaseConsequences(ctx(), ccAlt(100, 1));
    expect(facts.resultingHolding.ifHeldThroughExpiration.length).toBe(2);
    for (const branch of facts.resultingHolding.ifHeldThroughExpiration) {
      expect(branch.toLowerCase()).toContain("if held through expiration");
    }
    // early exits acknowledged as simple descriptions (BTC / roll / close-then-sell)
    expect(facts.resultingHolding.earlierExits.length).toBeGreaterThanOrEqual(3);
  });
  it("does not claim a whole-position cash outcome when residual/encumbered shares exist", () => {
    const facts = evaluateReleaseConsequences(
      ctx({ totalFreeShares: 250, encumberedShares: 100 }),
      ccAlt(200, 2)
    );
    const residual = facts.resultingHolding.residualOutsideBlock.join(" ");
    expect(residual).toContain("50 free shares");
    expect(residual).toContain("100 separately-encumbered shares");
    // block outcome is scoped to 200 shares, not the whole 350
    expect(facts.resultingHolding.ifHeldThroughExpiration.join(" ")).toContain("200 shares");
  });
});

describe("F8 — basis-relative release effect (NEVER exact in v1)", () => {
  it("present average basis -> blended-approximate, never exact", () => {
    const facts = evaluateReleaseConsequences(ctx({ averageBasisPerShare: 94.93 }), {
      kind: "sell",
      subjectShares: 100,
    });
    expect(facts.basisRelativeReleaseEffect.precision).toBe("blended-approximate");
    expect(facts.basisRelativeReleaseEffect.value).toBeCloseTo(100 * (90.66 - 94.93), 6);
  });

  it("missing basis -> unavailable", () => {
    const facts = evaluateReleaseConsequences(ctx({ averageBasisPerShare: null }), {
      kind: "sell",
      subjectShares: 100,
    });
    expect(facts.basisRelativeReleaseEffect.precision).toBe("unavailable");
    expect(facts.basisRelativeReleaseEffect.value).toBeNull();
  });

  it("NEVER emits exact regardless of symbol/basis (evidence cannot prove single-lot)", () => {
    const cases: Array<Partial<ReleaseContext>> = [
      { averageBasisPerShare: 94.93, totalFreeShares: 100 }, // could look single-lot
      { averageBasisPerShare: 50, totalFreeShares: 100 },
      { averageBasisPerShare: null },
    ];
    for (const o of cases) {
      const facts = evaluateReleaseConsequences(ctx(o), { kind: "sell", subjectShares: 100 });
      expect(facts.basisRelativeReleaseEffect.precision).not.toBe("exact");
    }
  });

  it("F8 is a RELEASE effect — applies to Sell only; Hold and CC are not-applicable", () => {
    const sell = evaluateReleaseConsequences(ctx(), { kind: "sell", subjectShares: 100 });
    expect(["blended-approximate", "unavailable"]).toContain(sell.basisRelativeReleaseEffect.precision);
    expect(sell.basisRelativeReleaseEffect.precision).not.toBe("not-applicable");

    const hold = evaluateReleaseConsequences(ctx(), { kind: "hold", subjectShares: 100 });
    expect(hold.basisRelativeReleaseEffect.precision).toBe("not-applicable");
    expect(hold.basisRelativeReleaseEffect.value).toBeNull();

    const cc = evaluateReleaseConsequences(ctx(), ccAlt(100, 1));
    expect(cc.basisRelativeReleaseEffect.precision).toBe("not-applicable");
    expect(cc.basisRelativeReleaseEffect.value).toBeNull();
  });

  it("missing/approximate F8 does not suppress F1", () => {
    const facts = evaluateReleaseConsequences(ctx({ averageBasisPerShare: null }), {
      kind: "sell",
      subjectShares: 100,
    });
    expect(facts.basisRelativeReleaseEffect.value).toBeNull();
    expect(facts.estimatedGrossSaleValue.value).toBeCloseTo(9066, 6);
  });
});

describe("provenance / freshness survives onto the facts", () => {
  it("CC premium carries chain provenance; sell value carries spot provenance", () => {
    const facts = evaluateReleaseConsequences(ctx(), ccAlt(100, 1));
    expect(facts.estimatedGrossOpeningPremium.provenance).toEqual(CHAIN_PROV);
    expect(facts.estimatedGrossSaleValue.provenance).toEqual(SPOT_PROV);
  });
});

describe("ownership boundary — evaluates, does not discover", () => {
  it("throws rather than inventing a leg if a CC alternative arrives without one", () => {
    expect(() =>
      evaluateReleaseConsequences(ctx(), { kind: "covered-call", subjectShares: 100 })
    ).toThrow();
  });

  it("suppliedAlternativesForCoveredCall echoes the supplied strike/DTE/contracts, never re-selects", () => {
    const alts = suppliedAlternativesForCoveredCall({
      maxContracts: 3, strike: 42, expiration: "2026-10-16", dte: 30, midPerShare: 0.9, provenance: CHAIN_PROV,
    });
    const cc = alts.find((a) => a.kind === "covered-call")!;
    expect(cc.callLeg!.strike).toBe(42);
    expect(cc.callLeg!.expiration).toBe("2026-10-16");
    expect(cc.callLeg!.contracts).toBe(3);
    expect(cc.subjectShares).toBe(300);
  });
});

describe("encumbered residual survives from context (not defaulted)", () => {
  it("250 free + 100 encumbered + 2-contract CC -> block 200, residual free 50, encumbered 100", () => {
    const c = ctx({ totalFreeShares: 250, encumberedShares: 100 });
    const facts = evaluateReleaseConsequences(c, ccAlt(200, 2));
    expect(facts.subjectShares).toBe(200);
    const residual = facts.resultingHolding.residualOutsideBlock.join(" ");
    expect(residual).toContain("50 free shares");
    expect(residual).toContain("100 separately-encumbered shares");
  });
});

describe("determinism", () => {
  it("same inputs -> same facts", () => {
    const a = evaluateReleaseConsequences(ctx(), ccAlt(200, 2));
    const b = evaluateReleaseConsequences(ctx(), ccAlt(200, 2));
    expect(a).toEqual(b);
  });
});
