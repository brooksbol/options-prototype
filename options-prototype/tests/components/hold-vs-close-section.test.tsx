/**
 * HoldVsCloseSection — PRESENTATIONAL tests (Existing Short-Obligation V1).
 *
 * The section no longer evaluates: it renders a SUPPLIED current EvaluatedPair
 * (single evaluation, two consumers — Codex). These tests build a pair via the
 * pure evaluator and pass it as the `pair` prop. Evaluation/invalidation/§14a
 * behavior is covered by the evaluator, adapter, guard, and hook suites.
 *
 * Proves:
 *  - Side-by-side HOLD and CLOSE columns render from the supplied pair.
 *  - A lifecycle-ambiguous refusal renders a prominent refusal banner and NO facts.
 *  - Degraded/unavailable facts are visually distinguishable (hvc-unavailable class).
 *  - The close estimate always shows its quote geometry (bid/ask), never bare.
 *  - Greeks render midIv/smvVol distinctly + rho + raw greeksUpdatedAt; all-zero
 *    greek vector suppresses only the greeks (IV survives).
 *  - Distinct refusal-reason labels (Codex #7).
 *  - Historical facts render as approximate context (Codex #4).
 *  - null pair renders nothing (renderPending=false) or a pending placeholder (true).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HoldVsCloseSection } from "../../src/components/HoldVsCloseSection";
import {
  evaluateShortObligationConsequences,
  classifyQuoteGeometry,
  type ShortObligation,
  type ShortObligationEvidence,
  type GreekIvEnrichment,
} from "../../src/write-desk/short-obligation-consequences";
import type { EvaluatedPair } from "../../src/write-desk/short-obligation-resolve";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const CHAIN_PROV: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: Date.now() - 5 * 60 * 1000 };

const PUT: ShortObligation = { symbol: "XLF", side: "put", strike: 42, expiration: "2026-10-16", contracts: 1, dte: 21 };

function enrichment(overrides: Partial<GreekIvEnrichment["greeks"]> = {}, allZero = false): GreekIvEnrichment {
  return {
    greeks: { delta: -0.3, gamma: 0.02, theta: -0.05, vega: 0.1, rho: 0.01, midIv: 0.42, smvVol: 0.31, greeksUpdatedAt: "2026-10-01 15:59:00", ...overrides },
    allFiveZeroPlaceholder: allZero,
    chainAcquiredAtMs: CHAIN_PROV.kind === "chain-acquired" ? CHAIN_PROV.acquiredAtMs : null,
  };
}

function evidence(overrides: Partial<ShortObligationEvidence> = {}): ShortObligationEvidence {
  return {
    lifecycle: { ambiguous: false },
    admissible: true,
    authorityPending: false,
    admissibilityDiagnosis: "admissible",
    quote: classifyQuoteGeometry(1.2, 1.4),
    optionProvenance: CHAIN_PROV,
    observedSpot: 43.5,
    spotProvenance: { kind: "unavailable" },
    enrichment: enrichment(),
    openingCredit: 200,
    openingCreditAttribution: "blended",
    assignmentIntent: "unknown",
    ...overrides,
  };
}

/** Build a current EvaluatedPair (the single evaluation the section renders). */
function pairFor(ev: ShortObligationEvidence, obligation: ShortObligation = PUT): EvaluatedPair {
  return {
    hold: evaluateShortObligationConsequences(obligation, "hold", ev),
    close: evaluateShortObligationConsequences(obligation, "close", ev),
    evidence: ev,
  };
}

describe("HoldVsCloseSection — normal facts", () => {
  it("renders HOLD and CLOSE side by side from the supplied pair, no verdict/winner", () => {
    render(<HoldVsCloseSection pair={pairFor(evidence())} />);
    expect(screen.getByText("HOLD")).toBeTruthy();
    expect(screen.getByText("CLOSE")).toBeTruthy();
    expect(screen.getByText(/not a recommendation/i)).toBeTruthy();
    expect(screen.queryByText(/recommended|winner|better choice/i)).toBeNull();
  });

  it("shows the close estimate WITH its quote geometry (bid/ask), never bare", () => {
    render(<HoldVsCloseSection pair={pairFor(evidence())} />);
    expect(screen.getByText(/bid \$1\.20 \/ ask \$1\.40/)).toBeTruthy();
  });

  it("renders midIv and smvVol distinctly", () => {
    render(<HoldVsCloseSection pair={pairFor(evidence())} />);
    expect(screen.getAllByText("Mid IV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SMV").length).toBeGreaterThan(0);
  });
});

describe("HoldVsCloseSection — greek/IV independence (Codex #6)", () => {
  it("shows IV even when the greek vector is the all-zero placeholder, and renders rho + raw greeksUpdatedAt", () => {
    const ev = evidence({ enrichment: enrichment({ delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, midIv: 0.55, smvVol: 0.4 }, true) });
    render(<HoldVsCloseSection pair={pairFor(ev)} />);
    expect(screen.getAllByText(/all-zero greek vector/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mid IV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SMV").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2026-10-01 15:59:00/).length).toBeGreaterThan(0);
  });

  it("renders rho and a genuine individual zero greek as 0 (not unavailable)", () => {
    const ev = evidence({ enrichment: enrichment({ gamma: 0 }) });
    render(<HoldVsCloseSection pair={pairFor(ev)} />);
    expect(screen.getAllByText("ρ").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});

describe("HoldVsCloseSection — subject-level refusal vs per-fact degradation", () => {
  it("lifecycle ambiguity (§14a) is a SUBJECT-LEVEL blocker: refusal banner, no fact columns", () => {
    const ev = evidence({ lifecycle: { ambiguous: true, conflictingEvent: "buy_to_close", eventDate: "2026-10-05", note: "conflict" } });
    render(<HoldVsCloseSection pair={pairFor(ev)} />);
    expect(screen.getAllByText(/lifecycle state ambiguous/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/comparison refused/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Est\. close debit/i)).toBeNull();
  });

  it("backend-inadmissible does NOT refuse: facts render, close debit degrades to unavailable (BTS-CLOSURE-INDEPENDENCE)", () => {
    const ev = evidence({ admissible: false, admissibilityDiagnosis: "backend-inadmissible" });
    const { container } = render(<HoldVsCloseSection pair={pairFor(ev)} />);
    // Fact columns still render — closure never triggers wholesale refusal.
    expect(screen.getByText("HOLD")).toBeTruthy();
    expect(screen.getByText("CLOSE")).toBeTruthy();
    expect(screen.queryByText(/comparison refused/i)).toBeNull();
    // The quote-dependent close estimate is individually unavailable.
    expect(container.querySelectorAll(".hvc-unavailable").length).toBeGreaterThan(0);
    // A non-price fact standing on independent evidence survives (encumbrance).
    expect(screen.getAllByText(/encumbrance/i).length).toBeGreaterThan(0);
  });

  it("missing-evidence likewise degrades per-fact, not wholesale", () => {
    const ev = evidence({ admissible: false, admissibilityDiagnosis: "missing-evidence" });
    render(<HoldVsCloseSection pair={pairFor(ev)} />);
    expect(screen.getByText("HOLD")).toBeTruthy();
    expect(screen.queryByText(/comparison refused/i)).toBeNull();
  });

  it("cache-unusable likewise degrades per-fact, not wholesale", () => {
    const ev = evidence({ admissible: false, admissibilityDiagnosis: "cache-unusable" });
    render(<HoldVsCloseSection pair={pairFor(ev)} />);
    expect(screen.getByText("CLOSE")).toBeTruthy();
    expect(screen.queryByText(/comparison refused/i)).toBeNull();
  });

  it("authority-pending is a SUBJECT-LEVEL blocker: refusal, no fact columns (fail closed)", () => {
    const ev = evidence({ authorityPending: true });
    render(<HoldVsCloseSection pair={pairFor(ev)} />);
    expect(screen.getAllByText(/comparison refused/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Est\. close debit/i)).toBeNull();
  });
});

describe("HoldVsCloseSection — degraded distinguishability (§20.19)", () => {
  it("marks an unavailable close estimate with the distinct unavailable class", () => {
    const { container } = render(<HoldVsCloseSection pair={pairFor(evidence({ quote: classifyQuoteGeometry(0, 0) }))} />);
    expect(container.querySelectorAll(".hvc-unavailable").length).toBeGreaterThan(0);
  });
});

describe("HoldVsCloseSection — evidence precision (Codex #4)", () => {
  it("blended opening credit renders as approximate historical context, never known", () => {
    render(<HoldVsCloseSection pair={pairFor(evidence({ openingCredit: 200, openingCreditAttribution: "blended" }))} />);
    screen.getByText(/historical context/i).click();
    expect(screen.getAllByText(/\(approx\)/i).length).toBeGreaterThan(0);
  });
});

describe("HoldVsCloseSection — null pair (pending vs absent)", () => {
  it("renders nothing when pair is null and renderPending is false", () => {
    const { container } = render(<HoldVsCloseSection pair={null} />);
    expect(container.querySelector(".hvc-section")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("renders a pending placeholder when pair is null and renderPending is true", () => {
    render(<HoldVsCloseSection pair={null} renderPending />);
    expect(screen.getByText(/assembling evidence/i)).toBeTruthy();
    // No fact columns while pending.
    expect(screen.queryByText(/Est\. close debit/i)).toBeNull();
  });
});
