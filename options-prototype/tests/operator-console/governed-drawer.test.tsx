/**
 * Governed Recommendation drawer — dense, flat, operator-first (Principal corrective UX).
 *
 * Asserts: no accordion/disclosure; no raw governance engineering on the operator surface
 * (no scope-id requirement, no gate controls, no "fails closed"); the unresolved reason and
 * NEEDS are immediately visible without expansion; the desired call-away question uses the
 * required wording; and an affirmative recommendation is inspectable. Read-only drawer — no
 * client IO.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GovernedRecommendationInspector } from "../../src/operator-console/GovernedRecommendationInspector";
import type { ResolvedGovernedRecommendation } from "../../src/governed-decision/resolve";
import type { GovernedContextVersion } from "../../src/governed-decision/governed-context";
import type { DecisionInputBundle } from "../../src/governed-decision/decision-bundle";

function unresolvedNoAssociation(symbol: string): ResolvedGovernedRecommendation {
  return {
    subject: { subjectType: "share-block", subjectId: `shares-${symbol}`, symbol, brokerageAccountId: "acctA" },
    evaluation: {
      recommendation: "UNRESOLVED", evaluatorId: "wheel-share-phase", evaluatorVersion: "1",
      ruleId: "DOC65-RULE-2-SELL-CALL",
      reasons: [{ basis: "association", text: "no governed scope association" }],
      unresolvedCauses: ["no-governed-scope-association"],
    },
    bundle: null,
  };
}

function unresolvedCallAwayMissing(symbol: string): ResolvedGovernedRecommendation {
  return {
    subject: { subjectType: "covered-call", subjectId: `call-${symbol}-43-2026-10-16`, symbol, brokerageAccountId: "acctA" },
    evaluation: {
      recommendation: "UNRESOLVED", evaluatorId: "wheel-covered-call", evaluatorVersion: "1",
      ruleId: "DOC65-RULE-1-LET-RESOLVE",
      reasons: [{ basis: "context", text: "applicability not established" }],
      unresolvedCauses: ["call-away-stance-not-accepted"],
    },
    bundle: null,
  };
}

function affirmativeCoveredCall(symbol: string): ResolvedGovernedRecommendation {
  const ctx: GovernedContextVersion = {
    brokerageAccountId: "acctA", governedScopeId: `wheel-${symbol}`, contextVersionId: "ctx-1",
    version: 1, supersedesContextVersionId: null,
    program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted", eligibilityGate: "CLEAR", interventionGate: "CLEAR", noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance", effectiveFrom: "2026-09-26T14:00:00Z", recordedAt: "2026-09-26T14:00:01Z",
  };
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

describe("governed Recommendation drawer (dense, operator-first)", () => {
  it("shows the unresolved reason and NEEDS immediately, with no accordion/disclosure", () => {
    const { container } = render(
      <GovernedRecommendationInspector resolved={unresolvedNoAssociation("COPX")} onClose={() => {}} />,
    );
    // Reason visible without expansion.
    expect(screen.getByText("Why unresolved")).toBeTruthy();
    expect(screen.getByText(/will not infer Wheel membership/i)).toBeTruthy();
    // NEEDS visible without expansion.
    expect(screen.getByText("Needs")).toBeTruthy();
    expect(screen.getByText("Wheel program membership")).toBeTruthy();
    // No accordion/disclosure controls.
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByText(/Technical details/i)).toBeNull();
    expect(screen.queryByText(/Advanced governance/i)).toBeNull();
  });

  it("exposes NO raw governance engineering on the operator surface", () => {
    const { container } = render(
      <GovernedRecommendationInspector resolved={unresolvedNoAssociation("COPX")} onClose={() => {}} />,
    );
    expect(screen.queryByText(/Governed scope id/i)).toBeNull();
    expect(screen.queryByText(/Configuration version/i)).toBeNull();
    expect(screen.queryByText(/fails closed/i)).toBeNull();
    expect(screen.queryByText(/Record governance/i)).toBeNull();
    // No gate select controls.
    expect(container.querySelector("select")).toBeNull();
    // No free-text scope-id input.
    expect(container.querySelector("input")).toBeNull();
  });

  it("asks the DESIRED call-away question with a concrete strike (not 'acceptable')", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedCallAwayMissing("URA")}
        onClose={() => {}}
        callAwayStrike={43}
      />,
    );
    expect(screen.getByText("Do you want URA to be called away at $43?")).toBeTruthy();
    expect(screen.queryByText(/acceptable/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Yes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "No" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not sure" })).toBeTruthy();
  });

  it("does not fabricate a call-away question when the scope association is missing", () => {
    render(<GovernedRecommendationInspector resolved={unresolvedNoAssociation("COPX")} onClose={() => {}} />);
    expect(screen.queryByText(/Do you want COPX to be called away/i)).toBeNull();
  });

  it("keeps an affirmative recommendation inspectable (dense basis visible)", () => {
    render(
      <GovernedRecommendationInspector resolved={affirmativeCoveredCall("GDXJ")} onClose={() => {}} callAwayStrike={43} />,
    );
    expect(screen.getByText("LET RESOLVE")).toBeTruthy();
    expect(screen.getByText(/Let the GDXJ covered call resolve/i)).toBeTruthy();
    // Basis is visible without expansion.
    expect(screen.getByText("Basis")).toBeTruthy();
    expect(screen.getByText("assignment-centric-wheel")).toBeTruthy();
  });
});
