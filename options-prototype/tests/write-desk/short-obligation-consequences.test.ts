/**
 * Tests for Existing Short-Obligation HOLD vs CLOSE V1 — pure consequence evaluator.
 *
 * Proves the authorized semantics + testable invariants from
 * docs/design/existing-short-obligation-hold-vs-close-v1-design.md §20, and the
 * load-bearing Codex constraints:
 *  - No verdict/scalar/ranking (§20.1)
 *  - Two supplied alternatives; evaluator does not enumerate (§20.2)
 *  - C1 close debit indicative/midpoint, carries quote geometry (§20.3, §20.16, §16.6)
 *  - Historical (X1-X4) vs forward (C/H) facts; X-facts never suppress forward facts (§20.4, §8)
 *  - Encumbrance = "nominal", never cash/buying power; CC close = shares not cash;
 *    CSP close invents no deployable cash (§20.5, §13)
 *  - Greek/IV guardrails: null ≠ 0; whole-vector all-zero placeholder; midIv ≠ smvVol;
 *    greek age = chain age; optional/degradable (§20.6, §20.12, §12)
 *  - HOLD early-assignment: scheduled boundary only, no early-assignment probability (§20.13, §5)
 *  - Assignment intent external, defaults unknown, never inferred (§20.14, §9)
 *  - Fail closed on inadmissible / pending authority (§20.8, §16.13, ADR-017)
 *  - §14a lifecycle-ambiguity refusal precedes everything (§20.15)
 *  - Determinism (§20.10)
 *  - No fact shown bare; no invented exact precision (§20.11)
 */
import { describe, it, expect } from "vitest";
import {
  evaluateShortObligationConsequences,
  classifyQuoteGeometry,
  isAllFiveZeroVector,
  type ShortObligation,
  type ShortObligationEvidence,
  type QuoteGeometry,
  type GreekIvEnrichment,
} from "../../src/write-desk/short-obligation-consequences";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const CHAIN_PROV: EvidenceProvenance = { kind: "chain-acquired", acquiredAtMs: 1_700_000_000_000 };
const UNAVAIL: EvidenceProvenance = { kind: "unavailable" };

function putObligation(overrides: Partial<ShortObligation> = {}): ShortObligation {
  return { symbol: "XLF", side: "put", strike: 42, expiration: "2026-10-16", contracts: 1, dte: 21, ...overrides };
}
function callObligation(overrides: Partial<ShortObligation> = {}): ShortObligation {
  return { symbol: "XLE", side: "call", strike: 90, expiration: "2026-10-16", contracts: 2, dte: 21, ...overrides };
}

function usableQuote(bid = 1.2, ask = 1.4): QuoteGeometry {
  return classifyQuoteGeometry(bid, ask);
}

function evidence(overrides: Partial<ShortObligationEvidence> = {}): ShortObligationEvidence {
  return {
    lifecycle: { ambiguous: false },
    admissible: true,
    authorityPending: false,
    admissibilityDiagnosis: "admissible",
    quote: usableQuote(),
    optionProvenance: CHAIN_PROV,
    observedSpot: 43.5,
    spotProvenance: UNAVAIL,
    enrichment: null,
    openingCredit: null,
    openingCreditAttribution: "unavailable",
    assignmentIntent: "unknown",
    ...overrides,
  };
}

function enrichment(overrides: Partial<GreekIvEnrichment["greeks"]> = {}, allZero = false): GreekIvEnrichment {
  return {
    greeks: {
      delta: -0.3, gamma: 0.02, theta: -0.05, vega: 0.1, rho: 0.01,
      midIv: 0.28, smvVol: 0.24, greeksUpdatedAt: "2026-10-01 15:59:00",
      ...overrides,
    },
    allFiveZeroPlaceholder: allZero,
    chainAcquiredAtMs: CHAIN_PROV.kind === "chain-acquired" ? CHAIN_PROV.acquiredAtMs : null,
  };
}

describe("evaluateShortObligationConsequences — structure & no verdict", () => {
  it("emits facts (no rank/score/winner/recommended field) for CLOSE and HOLD", () => {
    const close = evaluateShortObligationConsequences(putObligation(), "close", evidence());
    const hold = evaluateShortObligationConsequences(putObligation(), "hold", evidence());
    expect(close.kind).toBe("facts");
    expect(hold.kind).toBe("facts");
    // No verdict fields anywhere.
    const asJson = JSON.stringify({ close, hold });
    expect(asJson).not.toMatch(/"(recommended|winner|score|rank)"/);
    if (close.kind === "facts") expect(close.close).toBeDefined();
    if (hold.kind === "facts") expect(hold.hold).toBeDefined();
  });

  it("evaluates ONE alternative at a time (close result has no hold facts and vice versa)", () => {
    const close = evaluateShortObligationConsequences(putObligation(), "close", evidence());
    const hold = evaluateShortObligationConsequences(putObligation(), "hold", evidence());
    if (close.kind === "facts") { expect(close.close).toBeDefined(); expect(close.hold).toBeUndefined(); }
    if (hold.kind === "facts") { expect(hold.hold).toBeDefined(); expect(hold.close).toBeUndefined(); }
  });

  it("is deterministic: identical inputs → identical output", () => {
    const a = evaluateShortObligationConsequences(putObligation(), "close", evidence());
    const b = evaluateShortObligationConsequences(putObligation(), "close", evidence());
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
});

describe("CLOSE facts — C1 pricing + quote geometry (§11, §16.6, §20.16)", () => {
  it("estimates close debit at midpoint × 100 × contracts and carries quote geometry", () => {
    // Tight quote (bid 1.24 / ask 1.26 → mid 1.25, ~1.6% spread) → "known".
    const r = evaluateShortObligationConsequences(putObligation({ contracts: 3 }), "close", evidence({ quote: usableQuote(1.24, 1.26) }));
    expect(r.kind).toBe("facts");
    if (r.kind && r.kind === "facts" && r.close) {
      // mid = 1.25; 1.25 × 100 × 3 = 375. The MIDPOINT arithmetic is defined, but
      // the economic close-debit is INDICATIVE (approximate), never unqualified
      // `known` — no executable BTC price exists pre-execution (§11, Codex #4).
      expect(r.close.estimatedCloseDebit.value).toBeCloseTo(375, 6);
      expect(r.close.estimatedCloseDebit.precision).toBe("approximate");
      expect(r.close.quoteGeometry.bid).toBe(1.24);
      expect(r.close.quoteGeometry.ask).toBe(1.26);
      expect(r.close.quoteConvention).toBe("midpoint");
      // The estimate is explicitly DISCLAIMED as not executable/fill/guaranteed
      // (it is never positively labeled as such).
      const note = r.close.estimatedCloseDebit.note.toLowerCase();
      expect(note).toContain("indicative");
      expect(note).toMatch(/not an execution price|not.*guaranteed/);
    }
  });

  it("degrades to unavailable on a weak/unusable quote — never a bare confident number (§16.6)", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "close", evidence({ quote: classifyQuoteGeometry(0, 0) }));
    if (r.kind === "facts" && r.close) {
      expect(r.close.estimatedCloseDebit.value).toBeNull();
      expect(r.close.estimatedCloseDebit.precision).toBe("unavailable");
      // geometry still carried so the market shape is visible
      expect(r.close.quoteGeometry.quality).toBe("indistinct-zero");
    }
  });

  it("does NOT invent a wide/weak spread policy: a structurally valid two-sided market is usable (no threshold), but the close debit is indicative (Codex #4/#5)", () => {
    // A percentage-wide but structurally valid market (bid 1.0 / ask 1.9).
    const wideButValid = classifyQuoteGeometry(1.0, 1.9);
    expect(wideButValid.quality).toBe("usable");
    // spread geometry is still carried as descriptive context
    expect(wideButValid.spreadPercent).toBeGreaterThan(0);
    const r = evaluateShortObligationConsequences(putObligation(), "close", evidence({ quote: wideButValid }));
    if (r.kind === "facts" && r.close) {
      // No invented threshold rejects it; the debit is indicative, not `known`.
      expect(r.close.estimatedCloseDebit.value).not.toBeNull();
      expect(r.close.estimatedCloseDebit.precision).toBe("approximate");
    }
  });

  it("the $0.01/$100 adversarial quote: midpoint is defined but the close debit is NOT unqualified known (Codex #4)", () => {
    const dispersed = classifyQuoteGeometry(0.01, 100);
    expect(dispersed.quality).toBe("usable"); // structurally valid two-sided market
    expect(dispersed.spreadPercent).toBeGreaterThan(100); // geometry shows extreme dispersion
    const r = evaluateShortObligationConsequences(putObligation({ contracts: 5 }), "close", evidence({ quote: dispersed }));
    if (r.kind === "facts" && r.close) {
      // mid = 50.005; 50.005 × 100 × 5 = 25,002.50 — computed but INDICATIVE.
      expect(r.close.estimatedCloseDebit.value).toBeCloseTo(25002.5, 4);
      expect(r.close.estimatedCloseDebit.precision).not.toBe("known");
      expect(r.close.estimatedCloseDebit.precision).toBe("approximate");
      // geometry is carried so the dispersion is visible behind the number.
      expect(r.close.quoteGeometry.bid).toBe(0.01);
      expect(r.close.quoteGeometry.ask).toBe(100);
    }
  });
});

describe("Encumbrance semantics (§13, §20.5)", () => {
  it("CSP CLOSE reports nominal encumbrance removed (strike×100×contracts), never cash/buying power", () => {
    const r = evaluateShortObligationConsequences(putObligation({ strike: 42, contracts: 2 }), "close", evidence());
    if (r.kind === "facts" && r.close) {
      expect(r.close.nominalEncumbranceRemoved.nominalDollars).toBe(42 * 100 * 2);
      expect(r.close.nominalEncumbranceRemoved.shares).toBeNull();
      expect(r.close.nominalEncumbranceRemoved.disclaimer).toBe("nominal-encumbrance-not-cash-or-buying-power");
      // The resulting state must NOT positively assert a cash release; it must
      // explicitly defer any cash/buying-power/deployable-capacity change to broker evidence.
      expect(r.close.resultingState.toLowerCase()).not.toMatch(/freed to cash|collateral freed/);
      expect(r.close.resultingState.toLowerCase()).toContain("unknown until");
    }
  });

  it("covered-call CLOSE leaves shares as shares (not cash)", () => {
    const r = evaluateShortObligationConsequences(callObligation({ contracts: 2 }), "close", evidence());
    if (r.kind === "facts" && r.close) {
      expect(r.close.nominalEncumbranceRemoved.shares).toBe(200);
      expect(r.close.nominalEncumbranceRemoved.nominalDollars).toBeNull();
      expect(r.close.resultingState.toLowerCase()).toContain("remain held as shares");
      // Cash is only mentioned to DENY it ("no cash is created"), never to assert a release.
      expect(r.close.resultingState.toLowerCase()).toContain("no cash is created");
    }
  });

  it("HOLD reports the same nominal encumbrance remaining committed", () => {
    const r = evaluateShortObligationConsequences(putObligation({ strike: 42, contracts: 1 }), "hold", evidence());
    if (r.kind === "facts" && r.hold) {
      expect(r.hold.nominalEncumbranceRemains.nominalDollars).toBe(4200);
      expect(r.hold.nominalEncumbranceRemains.disclaimer).toBe("nominal-encumbrance-not-cash-or-buying-power");
    }
  });
});

describe("HOLD facts — early assignment discipline (§5, §20.13)", () => {
  it("names expiration as the SCHEDULED boundary and acknowledges early assignment without predicting it", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "hold", evidence());
    if (r.kind === "facts" && r.hold) {
      expect(r.hold.nextScheduledBoundary.kind).toBe("scheduled-expiration");
      expect(r.hold.exposureDurationDays).toBe(21);
      const branchText = r.hold.resolutionBranches.join(" ").toLowerCase();
      expect(branchText).toContain("early assignment is possible");
      expect(branchText).toContain("not predicted");
      // no fabricated probability
      expect(branchText).not.toMatch(/\d+%|probability/);
    }
  });

  it("assignment intent defaults to unknown and is carried, never inferred from moneyness", () => {
    const deepItm = evidence({ observedSpot: 30 }); // ITM put (strike 42 > spot 30)
    const r = evaluateShortObligationConsequences(putObligation(), "hold", deepItm);
    if (r.kind === "facts" && r.hold) {
      expect(r.hold.moneyness.classification).toBe("ITM");
      expect(r.hold.assignmentIntent).toBe("unknown");
    }
    const supplied = evaluateShortObligationConsequences(putObligation(), "hold", evidence({ assignmentIntent: "assignment-desired" }));
    if (supplied.kind === "facts" && supplied.hold) {
      expect(supplied.hold.assignmentIntent).toBe("assignment-desired");
    }
  });
});

describe("Greek/IV guardrails (§12, §20.6, §20.12)", () => {
  it("forward facts still emit when greek/IV enrichment is entirely absent (optional)", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "close", evidence({ enrichment: null }));
    if (r.kind === "facts" && r.close) {
      expect(r.close.enrichment).toBeNull();
      expect(r.close.estimatedCloseDebit.value).not.toBeNull(); // forward facts intact
    }
  });

  it("preserves midIv and smvVol as DISTINCT values (never collapsed)", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "hold", evidence({ enrichment: enrichment({ midIv: 0.5, smvVol: 0.31 }) }));
    if (r.kind === "facts" && r.hold && r.hold.enrichment) {
      expect(r.hold.enrichment.greeks.midIv).toBe(0.5);
      expect(r.hold.enrichment.greeks.smvVol).toBe(0.31);
      expect(r.hold.enrichment.greeks.midIv).not.toBe(r.hold.enrichment.greeks.smvVol);
    }
  });

  it("whole-vector all-five-zero is a placeholder; a single zero is genuine data (null ≠ 0)", () => {
    expect(isAllFiveZeroVector({ delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, midIv: 0.2, smvVol: 0.2, greeksUpdatedAt: null })).toBe(true);
    // one genuine zero, others nonzero → NOT a placeholder
    expect(isAllFiveZeroVector({ delta: 0, gamma: 0.02, theta: -0.05, vega: 0.1, rho: 0.01, midIv: null, smvVol: null, greeksUpdatedAt: null })).toBe(false);
    // null is not zero
    expect(isAllFiveZeroVector({ delta: null, gamma: 0, theta: 0, vega: 0, rho: 0, midIv: null, smvVol: null, greeksUpdatedAt: null })).toBe(false);
  });

  it("greek age equals the chain acquisition age (no independent provenance)", () => {
    const e = enrichment();
    const r = evaluateShortObligationConsequences(putObligation(), "close", evidence({ enrichment: e }));
    if (r.kind === "facts" && r.close && r.close.enrichment) {
      expect(r.close.enrichment.chainAcquiredAtMs).toBe(CHAIN_PROV.kind === "chain-acquired" ? CHAIN_PROV.acquiredAtMs : null);
    }
  });
});

describe("Historical vs forward (§8, §20.4)", () => {
  it("emits X1/X2/X3 as historical context with the not-realized-PL basis, and forward facts remain intact when they are unavailable", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "close", evidence({ openingCredit: null, openingCreditAttribution: "unavailable" }));
    if (r.kind === "facts" && r.close) {
      // forward CLOSE facts fully present despite missing historical attribution
      expect(r.close.estimatedCloseDebit.value).not.toBeNull();
      // historical unavailable but present + labeled
      expect(r.historical.openingCredit.precision).toBe("unavailable");
      expect(r.historical.estimatedGrossMarkToMarket.basis).toBe("gross-mark-to-market-not-realized-pl");
      expect(r.historical.premiumCapturedPercent.basis).toBe("gross-over-gross");
    }
  });

  it("blended broker basis is NEVER promoted to a known opening credit — X1 is approximate (Codex #4)", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "hold", evidence({ openingCredit: 200, openingCreditAttribution: "blended" }));
    if (r.kind === "facts") {
      expect(r.historical.openingCredit.value).toBe(200);
      expect(r.historical.openingCredit.precision).toBe("approximate");
      expect(r.historical.openingCredit.note.toLowerCase()).toContain("blended");
    }
  });

  it("only authoritative attribution may be known", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "hold", evidence({ openingCredit: 200, openingCreditAttribution: "authoritative" }));
    if (r.kind === "facts") {
      expect(r.historical.openingCredit.precision).toBe("known");
    }
  });

  it("computes X2 gross mark-to-market = openingCredit − currentObligationValue (approximate, not realized P/L)", () => {
    // opening credit 200; mid 1.25 × 100 × 1 = 125 obligation value → X2 = 75
    const r = evaluateShortObligationConsequences(putObligation({ contracts: 1 }), "hold", evidence({ openingCredit: 200, openingCreditAttribution: "blended", quote: usableQuote(1.2, 1.3) }));
    if (r.kind === "facts") {
      expect(r.historical.estimatedGrossMarkToMarket.value).toBeCloseTo(75, 6);
      expect(r.historical.estimatedGrossMarkToMarket.precision).toBe("approximate");
      expect(r.historical.premiumCapturedPercent.value).toBeCloseTo(37.5, 4);
      // X2 is never labeled realized P/L
      expect(r.historical.estimatedGrossMarkToMarket.note.toLowerCase()).toContain("not realized p/l");
    }
  });
});

describe("Fail-closed refusals (ADR-017, §14a, §20.8, §20.15)", () => {
  it("refuses when lifecycle is ambiguous — BEFORE any admissibility/authority check", () => {
    const r = evaluateShortObligationConsequences(
      putObligation(),
      "close",
      evidence({
        lifecycle: { ambiguous: true, conflictingEvent: "buy_to_close", eventDate: "2026-10-05", note: "test" },
        // even with authority also pending + inadmissible, lifecycle wins
        admissible: false,
        authorityPending: true,
      })
    );
    expect(r.kind).toBe("refused");
    if (r.kind === "refused") {
      expect(r.reason).toBe("lifecycle-state-ambiguous");
      expect(r.lifecycle?.conflictingEvent).toBe("buy_to_close");
      expect(r.close).toBeUndefined();
      expect(r.hold).toBeUndefined();
    }
  });

  it("refuses when authority is pending (fail closed, no fabricated state)", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "hold", evidence({ authorityPending: true, admissible: false, admissibilityDiagnosis: "authority-pending" }));
    expect(r.kind).toBe("refused");
    if (r.kind === "refused") expect(r.reason).toBe("authority-pending");
  });

  it("closure/inadmissibility is NOT a subject-level blocker: facts render, close debit degrades per-fact (BTS-CLOSURE-INDEPENDENCE)", () => {
    // Principal-reversed contract: backend-inadmissible / missing-evidence /
    // cache-unusable no longer cause a WHOLESALE refusal. They make the
    // quote-dependent close debit individually `unavailable` (carrying the
    // diagnosis) while independent facts remain available.
    for (const diagnosis of ["backend-inadmissible", "missing-evidence", "cache-unusable"] as const) {
      const r = evaluateShortObligationConsequences(putObligation(), "close", evidence({ admissible: false, admissibilityDiagnosis: diagnosis }));
      expect(r.kind).toBe("facts"); // NOT refused
      if (r.kind === "facts" && r.close) {
        // The quote-dependent close debit is unavailable, carrying the cause.
        expect(r.close.estimatedCloseDebit.value).toBeNull();
        expect(r.close.estimatedCloseDebit.precision).toBe("unavailable");
        // An independent fact (nominal encumbrance removed) still stands.
        expect(r.close.nominalEncumbranceRemoved).toBeDefined();
      }
    }
  });

  it("subject-level blockers (§14a, authority-pending) STILL refuse wholesale", () => {
    const ambiguous = evaluateShortObligationConsequences(putObligation(), "close", evidence({ lifecycle: { ambiguous: true, conflictingEvent: "buy_to_close", eventDate: "2026-10-05", note: "x" } }));
    expect(ambiguous.kind).toBe("refused");
    const pending = evaluateShortObligationConsequences(putObligation(), "close", evidence({ authorityPending: true, admissible: false, admissibilityDiagnosis: "authority-pending" }));
    expect(pending.kind).toBe("refused");
  });
});

describe("Moneyness (§20 C7/H5)", () => {
  it("unavailable when spot is missing", () => {
    const r = evaluateShortObligationConsequences(putObligation(), "close", evidence({ observedSpot: null }));
    if (r.kind === "facts" && r.close) {
      expect(r.close.moneyness.classification).toBeNull();
      expect(r.close.moneyness.precision).toBe("unavailable");
    }
  });

  it("classifies an OTM put (spot above strike)", () => {
    const r = evaluateShortObligationConsequences(putObligation({ strike: 42 }), "close", evidence({ observedSpot: 45 }));
    if (r.kind === "facts" && r.close) {
      expect(r.close.moneyness.classification).toBe("OTM");
    }
  });
});

// The row-indicator is no longer derived from consequence completeness; it is
// derived from the governed DECISION (see short-obligation-decision.test.ts and
// use-hold-close-notices.test.tsx). The old "facts→actionable / refused→refused"
// classifier was removed as the original NOTICE defect.

describe("classifyQuoteGeometry — quality classification (§16.6)", () => {
  it("both absent → unavailable", () => {
    expect(classifyQuoteGeometry(null, null).quality).toBe("unavailable");
  });
  it("both zero → indistinct-zero (cannot tell zero from absent)", () => {
    expect(classifyQuoteGeometry(0, 0).quality).toBe("indistinct-zero");
  });
  it("one side present only → weak", () => {
    expect(classifyQuoteGeometry(1.0, null).quality).toBe("weak");
    expect(classifyQuoteGeometry(0, 1.2).quality).toBe("weak");
  });
  it("crossed market → weak", () => {
    expect(classifyQuoteGeometry(1.5, 1.0).quality).toBe("weak");
  });
  it("tight market → usable", () => {
    expect(classifyQuoteGeometry(1.2, 1.3).quality).toBe("usable");
  });
});
