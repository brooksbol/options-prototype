/**
 * Governed Recommendation drawer consolidation (Principal UX).
 *
 * One drawer owns BOTH inspection and governance establishment/update. There is no
 * separate governance modal and no launch bridge. The drawer is inspection-first: it
 * explains the recommendation (or why UNRESOLVED) and offers the governance act inline.
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

function unresolvedShareBlock(symbol: string): ResolvedGovernedRecommendation {
  return {
    subject: { subjectType: "share-block", subjectId: `shares-${symbol}`, symbol, brokerageAccountId: "acctA" },
    evaluation: {
      recommendation: "UNRESOLVED",
      evaluatorId: "wheel-share-phase",
      evaluatorVersion: "1",
      ruleId: "DOC65-RULE-2-SELL-CALL",
      reasons: [{ basis: "association", text: "no governed scope is associated with this subject" }],
      unresolvedCauses: ["no-governed-scope-association"],
    },
    bundle: null,
  };
}

function governedContext(symbol: string): GovernedContextVersion {
  return {
    brokerageAccountId: "acctA",
    governedScopeId: `wheel-${symbol}`,
    contextVersionId: "ctx-1",
    version: 1,
    supersedesContextVersionId: null,
    program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted",
    eligibilityGate: "CLEAR",
    interventionGate: "CLEAR",
    noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance",
    effectiveFrom: "2026-09-26T14:00:00Z",
    recordedAt: "2026-09-26T14:00:01Z",
  };
}

function affirmativeCoveredCall(symbol: string): ResolvedGovernedRecommendation {
  const ctx = governedContext(symbol);
  const bundle: DecisionInputBundle = {
    brokerageAccountId: "acctA",
    subject: { subjectType: "covered-call", subjectId: `cc-${symbol}`, symbol, brokerageAccountId: "acctA" },
    governedScopeId: ctx.governedScopeId,
    contextVersion: ctx,
    associationEstablished: true,
    consumed: { kind: "covered-call" } as any,
  } as any;
  return {
    subject: bundle.subject,
    evaluation: {
      recommendation: "LET_RESOLVE",
      evaluatorId: "wheel-covered-call",
      evaluatorVersion: "1",
      ruleId: "DOC65-RULE-1-LET-RESOLVE",
      reasons: [{ basis: "call-away", text: "call-away was accepted and remains effective" }],
      unresolvedCauses: [],
    },
    bundle,
  };
}

describe("governed Recommendation drawer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("explains WHY UNRESOLVED before showing any form", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedShareBlock("COPX")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
      />,
    );
    expect(screen.getByText("Why unresolved")).toBeTruthy();
    expect(screen.getByText("no-governed-scope-association")).toBeTruthy();
    // Inspection-first: the form is not shown until the operator asks for it.
    expect(screen.queryByText(/Governed scope id/i)).toBeNull();
  });

  it("offers governance authoring INSIDE the same drawer (no separate modal)", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedShareBlock("COPX")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
      />,
    );
    // A single establish affordance; clicking reveals the form in the same panel.
    fireEvent.click(screen.getByText(/Establish governance/i));
    expect(screen.getByText(/Governed scope id/i)).toBeTruthy();
    // Exactly one dialog element exists (the drawer) — no second modal opened.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("frames the act as an amendment when governance already exists, and remains inspectable", () => {
    render(
      <GovernedRecommendationInspector
        resolved={affirmativeCoveredCall("GDXJ")}
        onClose={() => {}}
        brokerageAccountId="acctA"
        onAuthored={() => {}}
      />,
    );
    // Inspection content for an affirmative recommendation.
    expect(screen.getByText("Why this recommendation")).toBeTruthy();
    expect(screen.getByText(/wheel-GDXJ/)).toBeTruthy();
    // Amend framing (governance present).
    fireEvent.click(screen.getByText(/Amend governance/i));
    expect(screen.getByText(/Record new version/i)).toBeTruthy();
  });

  it("does not offer the governance act when there is no account", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedShareBlock("COPX")}
        onClose={() => {}}
        brokerageAccountId={null}
        onAuthored={() => {}}
      />,
    );
    expect(screen.queryByText(/Establish governance/i)).toBeNull();
  });
});
