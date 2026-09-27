/**
 * Governed Recommendation drawer — operator-first consolidation (Principal corrective UX).
 *
 * One right-side drawer owns BOTH inspection and governance authoring. There is no separate
 * governance modal. It is operator-first: the recommendation, a plain-English summary, and
 * (for UNRESOLVED, where authority supports it) the desired call-away question come FIRST;
 * raw governance machinery is demoted under collapsed "Technical details" / "Advanced
 * governance" affordances.
 *
 * Governance writes are stubbed via the governed-decision client module so no backend IO
 * occurs; the test asserts interaction structure, not persistence.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GovernedRecommendationInspector } from "../../src/operator-console/GovernedRecommendationInspector";
import type { ResolvedGovernedRecommendation } from "../../src/governed-decision/resolve";
import type { GovernedContextVersion } from "../../src/governed-decision/governed-context";
import type { DecisionInputBundle } from "../../src/governed-decision/decision-bundle";

vi.mock("../../src/governed-decision/client", () => ({
  writeGovernedContext: vi.fn(async () => ({ ok: true })),
  writeSubjectScopeAssociation: vi.fn(async () => ({ ok: true })),
}));

// UNRESOLVED covered call WITH a scope association already (so call-away is the missing
// bounded fact and the operator question is legitimately askable).
function unresolvedCallAwayMissing(symbol: string): ResolvedGovernedRecommendation {
  return {
    subject: { subjectType: "covered-call", subjectId: `call-${symbol}-43-2026-10-16`, symbol, brokerageAccountId: "acctA" },
    evaluation: {
      recommendation: "UNRESOLVED",
      evaluatorId: "wheel-covered-call",
      evaluatorVersion: "1",
      ruleId: "DOC65-RULE-1-LET-RESOLVE",
      reasons: [{ basis: "context", text: "governed applicability not all established" }],
      unresolvedCauses: ["call-away-stance-not-accepted"],
    },
    bundle: null,
  };
}

// UNRESOLVED with NO scope association (PL-SETUP-01 territory; call-away question is not
// asked because the prerequisite association is missing).
function unresolvedNoAssociation(symbol: string): ResolvedGovernedRecommendation {
  return {
    subject: { subjectType: "share-block", subjectId: `shares-${symbol}`, symbol, brokerageAccountId: "acctA" },
    evaluation: {
      recommendation: "UNRESOLVED",
      evaluatorId: "wheel-share-phase",
      evaluatorVersion: "1",
      ruleId: "DOC65-RULE-2-SELL-CALL",
      reasons: [{ basis: "association", text: "no governed scope association" }],
      unresolvedCauses: ["no-governed-scope-association"],
    },
    bundle: null,
  };
}

function governedContext(symbol: string): GovernedContextVersion {
  return {
    brokerageAccountId: "acctA", governedScopeId: `wheel-${symbol}`, contextVersionId: "ctx-1",
    version: 1, supersedesContextVersionId: null,
    program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted", eligibilityGate: "CLEAR", interventionGate: "CLEAR", noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance", effectiveFrom: "2026-09-26T14:00:00Z", recordedAt: "2026-09-26T14:00:01Z",
  };
}

function affirmativeCoveredCall(symbol: string): ResolvedGovernedRecommendation {
  const ctx = governedContext(symbol);
  const bundle = {
    brokerageAccountId: "acctA",
    subject: { subjectType: "covered-call", subjectId: `call-${symbol}-43-2026-10-16`, symbol, brokerageAccountId: "acctA" },
    governedScopeId: ctx.governedScopeId, contextVersion: ctx, associationEstablished: true,
    consumed: { kind: "covered-call" },
  } as unknown as DecisionInputBundle;
  return {
    subject: bundle.subject,
    evaluation: {
      recommendation: "LET_RESOLVE", evaluatorId: "wheel-covered-call", evaluatorVersion: "1",
      ruleId: "DOC65-RULE-1-LET-RESOLVE",
      reasons: [{ basis: "call-away", text: "call-away accepted and effective" }], unresolvedCauses: [],
    },
    bundle,
  };
}

describe("governed Recommendation drawer (operator-first)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("leads with a plain-English reason for UNRESOLVED before any raw form", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedNoAssociation("COPX")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
      />,
    );
    expect(screen.getByText("What WW needs")).toBeTruthy();
    // Plain-English, not raw cause code, in the primary surface.
    expect(screen.getByText(/has not been told that this COPX position is part of a governed Wheel/i)).toBeTruthy();
    // The raw governance form is not surfaced as the primary workflow.
    expect(screen.queryByText(/Governed scope id/i)).toBeNull();
  });

  it("asks the DESIRED call-away question (not 'acceptable') with a concrete strike", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedCallAwayMissing("URA")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
        callAwayStrike={43}
      />,
    );
    expect(screen.getByText("Do you want URA to be called away at $43?")).toBeTruthy();
    // Explicitly NOT the rejected "acceptable outcome" wording.
    expect(screen.queryByText(/acceptable outcome/i)).toBeNull();
    // Desired-disposition choices.
    expect(screen.getByRole("button", { name: "Yes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "No" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not sure" })).toBeTruthy();
  });

  it("does NOT fabricate a call-away question when the scope association is missing", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedNoAssociation("COPX")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
      />,
    );
    expect(screen.queryByText(/Do you want COPX to be called away/i)).toBeNull();
  });

  it("does not require an opaque scope id as the primary workflow, and opens no second modal", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedCallAwayMissing("URA")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
        callAwayStrike={43}
      />,
    );
    // Raw scope id is not in the primary surface (it is behind the collapsed Advanced details).
    expect(screen.queryByText(/Governed scope id/i)).toBeNull();
    // Exactly one dialog (the drawer). No separate governance modal.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("keeps the bounded raw governance form available under a demoted Advanced affordance", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedCallAwayMissing("URA")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
        callAwayStrike={43}
      />,
    );
    // Reveal the demoted advanced section.
    fireEvent.click(screen.getByText(/Advanced governance/i));
    expect(screen.getByText(/Governed scope id/i)).toBeTruthy();
    // Still one dialog — the form is inline in the drawer, not a separate modal.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("remains inspectable for an affirmative recommendation", () => {
    render(
      <GovernedRecommendationInspector
        resolved={affirmativeCoveredCall("GDXJ")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
        callAwayStrike={43}
      />,
    );
    expect(screen.getByText(/WW recommends letting the GDXJ covered call resolve/i)).toBeTruthy();
    // Governing basis recoverable under technical details.
    fireEvent.click(screen.getByText(/Technical details/i));
    expect(screen.getByText(/wheel-GDXJ/)).toBeTruthy();
  });

  it("offers no governance affordance without an account", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedNoAssociation("COPX")}
        onClose={() => {}}
        brokerageAccountId={null}
        onAuthored={() => {}}
      />,
    );
    expect(screen.queryByText(/Advanced governance/i)).toBeNull();
  });
});
