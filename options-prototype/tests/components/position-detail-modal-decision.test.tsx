/**
 * PositionDetailModal — OPERATOR ANSWER LEADS (DBO acceptance).
 *
 * The DBO Sep 18 $21 short PUT acceptance specimen:
 *   1. The modal's FIRST prominent content is the governed action "BTC THIS PUT"
 *      — NOT "If assigned now" and NOT a two-column HOLD/CLOSE wall.
 *   2. With the close price unavailable/inadmissible, the modal STILL leads with
 *      "BTC THIS PUT"; the missing close price appears only as a secondary
 *      execution caveat (degraded execution detail).
 *   3. Assignment consequence + HOLD/CLOSE detail move BELOW into subordinate,
 *      collapsed disclosure.
 *   4. A governed HOLD case leads with "HOLD", not a comparison.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PositionDetailModal } from "../../src/components/PositionDetailModal";
import { buildPositionDetail } from "../../src/portfolio/position-detail";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";
import type { ResolvedShortObligation, EvaluatedPair } from "../../src/write-desk/short-obligation-resolve";
import {
  evaluateShortObligationConsequences,
  classifyQuoteGeometry,
  type ShortObligation,
  type ShortObligationEvidence,
} from "../../src/write-desk/short-obligation-consequences";
import {
  decideShortObligationLifecycle,
  type LifecycleDecisionInputs,
} from "../../src/write-desk/short-obligation-decision";
import { classifyBtcReviewCandidate } from "../../src/write-desk/btc-review-candidate";

// DBO acceptance posture: 2 DTE, strike $21, spot $25.47 → deeply OTM put.
const SPOT = 25.47;
const STRIKE = 21;
const MONEYNESS = (STRIKE - SPOT) / SPOT; // ≈ -0.1755

function dboPosition(): MonitoredPosition {
  return {
    id: "put-DBO-21-2026-09-18", type: "put", underlying: "DBO", strike: STRIKE, expiration: "2026-09-18",
    dte: 2, quantity: 1, encumberedCapital: 2100, capitalValuationBasis: "strike", capitalAsOf: "2026-09-16",
    moneyness: MONEYNESS, underlyingPrice: SPOT, underlyingPreviousClose: null, priceObservedAt: null,
    evidenceGeneration: null, acquisitionStatus: null, lastAttemptAt: null, failureCount: 0, openedDate: null,
  };
}

function dboDetail() {
  return buildPositionDetail(
    dboPosition(), null, null,
    { brokerOptionBasis: null, brokerOptionAverageCost: null } as never,
  );
}

const DBO_OBLIGATION: ShortObligation = { symbol: "DBO", side: "put", strike: STRIKE, expiration: "2026-09-18", contracts: 1, dte: 2 };

function evidence(overrides: Partial<ShortObligationEvidence> = {}): ShortObligationEvidence {
  return {
    lifecycle: { ambiguous: false }, admissible: true, authorityPending: false, admissibilityDiagnosis: "admissible",
    quote: classifyQuoteGeometry(0.02, 0.06), optionProvenance: { kind: "unavailable" }, observedSpot: SPOT,
    spotProvenance: { kind: "unavailable" }, enrichment: null, openingCredit: null, openingCreditAttribution: "unavailable",
    assignmentIntent: "unknown", ...overrides,
  };
}

function resolvedFor(ev: ShortObligationEvidence, overrides: Partial<LifecycleDecisionInputs> = {}): ResolvedShortObligation {
  const pair: EvaluatedPair = {
    hold: evaluateShortObligationConsequences(DBO_OBLIGATION, "hold", ev),
    close: evaluateShortObligationConsequences(DBO_OBLIGATION, "close", ev),
    evidence: ev,
  };
  const closePriceSupported = ev.admissible && ev.quote.quality === "usable";
  const candidate = classifyBtcReviewCandidate({ side: "put", dte: 2, moneyness: MONEYNESS }, false);
  const decision = decideShortObligationLifecycle({
    side: "put", dte: 2, moneyness: MONEYNESS, candidate, closePriceSupported, ...overrides,
  });
  return { candidate, decision, pair };
}

describe("PositionDetailModal — operator answer leads (DBO)", () => {
  it("leads with 'BTC THIS PUT' as the first prominent content", () => {
    const { container } = render(
      <PositionDetailModal detail={dboDetail()} onClose={() => {}} resolved={resolvedFor(evidence())} />
    );
    const decision = container.querySelector(".pdm-decision");
    expect(decision).not.toBeNull();
    expect(decision!.querySelector(".pdm-decision-action")!.textContent).toBe("BTC THIS PUT");
    // The red attention dot is present.
    expect(decision!.querySelector(".pdm-decision-dot")).not.toBeNull();

    // The decision headline appears BEFORE the assignment "If assigned now" text
    // in DOM order (which now lives inside a collapsed disclosure below).
    const body = container.querySelector(".pdm-modal")!;
    const decisionIdx = body.innerHTML.indexOf("BTC THIS PUT");
    const assignedIdx = body.innerHTML.indexOf("If assigned now");
    expect(decisionIdx).toBeGreaterThanOrEqual(0);
    if (assignedIdx >= 0) expect(decisionIdx).toBeLessThan(assignedIdx);
  });

  it("does NOT lead with the assignment consequence: 'If assigned now' is inside a subordinate <details>", () => {
    const { container } = render(
      <PositionDetailModal detail={dboDetail()} onClose={() => {}} resolved={resolvedFor(evidence())} />
    );
    // Every 'If assigned now' occurrence is within a collapsed disclosure section.
    const detailsBlocks = Array.from(container.querySelectorAll("details.pdm-disclosure"));
    const assignmentDetails = detailsBlocks.find(d => /assignment consequence/i.test(d.querySelector("summary")?.textContent ?? ""));
    expect(assignmentDetails).toBeTruthy();
    expect(assignmentDetails!.textContent).toMatch(/if assigned now/i);
  });

  it("HOLD/CLOSE consequence detail is a subordinate disclosure, not a leading fact wall", () => {
    const { container } = render(
      <PositionDetailModal detail={dboDetail()} onClose={() => {}} resolved={resolvedFor(evidence())} />
    );
    const detailsBlocks = Array.from(container.querySelectorAll("details.pdm-disclosure"));
    const hvc = detailsBlocks.find(d => /hold vs close/i.test(d.querySelector("summary")?.textContent ?? ""));
    expect(hvc).toBeTruthy();
  });

  it("close price unavailable/inadmissible → STILL leads with 'BTC THIS PUT' + a secondary execution caveat", () => {
    const ev = evidence({ admissible: false, admissibilityDiagnosis: "backend-inadmissible" });
    const { container } = render(
      <PositionDetailModal detail={dboDetail()} onClose={() => {}} resolved={resolvedFor(ev)} />
    );
    const decision = container.querySelector(".pdm-decision")!;
    expect(decision.querySelector(".pdm-decision-action")!.textContent).toBe("BTC THIS PUT");
    // The missing close price is a secondary execution caveat — NOT a suppression.
    const caveat = decision.querySelector(".pdm-decision-caveat");
    expect(caveat).not.toBeNull();
    expect(caveat!.textContent).toMatch(/unavailable/i);
  });

  it("governed HOLD posture leads with 'HOLD', not a comparison", () => {
    // Force an ITM posture via the decision inputs override.
    const resolved = resolvedFor(evidence(), { moneyness: 0.04 });
    const { container } = render(
      <PositionDetailModal detail={dboDetail()} onClose={() => {}} resolved={resolved} />
    );
    const action = container.querySelector(".pdm-decision-action")!;
    expect(action.textContent).toBe("HOLD");
    expect(action.textContent).not.toMatch(/vs|comparison/i);
    // A routine HOLD carries NO red attention dot even in the opened modal.
    expect(container.querySelector(".pdm-decision-dot")).toBeNull();
  });
});
