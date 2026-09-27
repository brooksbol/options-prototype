/**
 * Governed Recommendation drawer — dense, flat, honest (Principal corrective UX + §7 no
 * decorative controls).
 *
 * Asserts: no accordion/disclosure; no raw governance engineering (no scope-id, no gate
 * controls, no "fails closed"); NEEDS + WHY + POSITION/EVIDENCE + BASIS visible without
 * expansion; the call-away question is shown in operator language BUT with NO clickable
 * answer control (the semantic trace found it cannot persist truthfully — surfaced as an
 * honest boundary, not a decorative button); affirmative recommendation inspectable.
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

describe("governed Recommendation drawer (dense, honest, no decorative controls)", () => {
  it("shows NEEDS and WHY immediately, with no accordion/disclosure and no raw engineering", () => {
    const { container } = render(
      <GovernedRecommendationInspector resolved={unresolvedNoAssociation("COPX")} onClose={() => {}} />,
    );
    expect(screen.getByText("Needs")).toBeTruthy();
    expect(screen.getByText("Wheel program membership")).toBeTruthy();
    expect(screen.getByText("Why unresolved")).toBeTruthy();
    expect(screen.getByText(/will not infer Wheel membership/i)).toBeTruthy();
    // No accordions.
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByText(/Technical details/i)).toBeNull();
    expect(screen.queryByText(/Advanced governance/i)).toBeNull();
    // No raw governance engineering.
    expect(screen.queryByText(/Governed scope id/i)).toBeNull();
    expect(screen.queryByText(/Configuration version/i)).toBeNull();
    expect(screen.queryByText(/fails closed/i)).toBeNull();
    expect(container.querySelector("select")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
  });

  it("renders POSITION / EVIDENCE inspection rows when supplied", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedCallAwayMissing("URA")}
        onClose={() => {}}
        callAwayStrike={43}
        evidenceRows={[
          { label: "Shares owned", value: "100" },
          { label: "Short calls", value: "1" },
          { label: "Strike", value: "$43" },
        ]}
      />,
    );
    expect(screen.getByText("Position / evidence")).toBeTruthy();
    expect(screen.getByText("Shares owned")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
  });

  it("shows the call-away question in operator language but NO clickable answer control (honest boundary)", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedCallAwayMissing("URA")}
        onClose={() => {}}
        callAwayStrike={43}
      />,
    );
    // The operator-language question is shown...
    expect(screen.getByText("Do you want URA to be called away at $43?")).toBeTruthy();
    expect(screen.getByText(/WW cannot record this answer yet/i)).toBeTruthy();
    // ...but there is NO decorative Yes/No/Not sure control that cannot persist.
    expect(screen.queryByRole("button", { name: "Yes" })).toBeNull();
    expect(screen.queryByRole("button", { name: "No" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Not sure" })).toBeNull();
    // Not the rejected "acceptable" wording.
    expect(screen.queryByText(/acceptable/i)).toBeNull();
  });

  it("keeps an affirmative recommendation inspectable (dense basis visible, no accordion)", () => {
    const { container } = render(
      <GovernedRecommendationInspector resolved={affirmativeCoveredCall("GDXJ")} onClose={() => {}} callAwayStrike={43} />,
    );
    expect(screen.getByText("LET RESOLVE")).toBeTruthy();
    expect(screen.getByText(/Let the GDXJ covered call resolve/i)).toBeTruthy();
    expect(screen.getByText("Governance / basis")).toBeTruthy();
    expect(screen.getByText("assignment-centric-wheel")).toBeTruthy();
    expect(container.querySelector("details")).toBeNull();
  });
});
