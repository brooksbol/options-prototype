/**
 * Governed Recommendation drawer — ADR-021 predicate-picture rendering.
 *
 * Asserts: the complete predicate picture renders in operator language with distinct
 * statuses (no conflation); no accordion; no raw governance engineering (no scope-id, no
 * gate controls, no "fails closed"); NO enabled control exists in this slice (admissibility
 * gate empty) so a blocker is explained instead; outside-program projection; human account
 * name primary with machine ids demoted; plain-language rule name.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GovernedRecommendationInspector } from "../../src/operator-console/GovernedRecommendationInspector";
import { evaluateCoveredCall, evaluateSharePhase, type GovernedInputsBase } from "../../src/governed-decision/evaluators";
import type { GovernedContextVersion } from "../../src/governed-decision/governed-context";
import type { ResolvedGovernedRecommendation } from "../../src/governed-decision/resolve";

function ctx(overrides: Partial<GovernedContextVersion> = {}): GovernedContextVersion {
  return {
    brokerageAccountId: "ba-179", governedScopeId: "wheel-URA", contextVersionId: "ctx_1", version: 1,
    supersedesContextVersionId: null, program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted", eligibilityGate: "CLEAR", interventionGate: "CLEAR", noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance", effectiveFrom: "2026-09-01T00:00:00Z", recordedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

/** No-membership covered call (URA): AUTHORITY_MISSING membership + NOT_EVALUATED dependents. */
function unresolvedNoMembership(symbol: string): ResolvedGovernedRecommendation {
  const evaluation = evaluateCoveredCall(
    { callIsCurrent: true, coverageEstablished: true, evidenceSufficient: true },
    { context: null, associationEstablished: false },
  );
  return {
    subject: { subjectType: "covered-call", subjectId: `call-${symbol}-43-2026-10-16`, symbol, brokerageAccountId: "ba-179" },
    evaluation, bundle: null,
  };
}

/** Governed covered call: membership SATISFIED but intervention POLICY_UNDEFINED. */
function governedButPolicyUndefined(symbol: string): ResolvedGovernedRecommendation {
  const inputs: GovernedInputsBase = { context: ctx(), associationEstablished: true };
  const evaluation = evaluateCoveredCall(
    { callIsCurrent: true, coverageEstablished: true, evidenceSufficient: true }, inputs);
  return {
    subject: { subjectType: "covered-call", subjectId: `call-${symbol}-43-2026-10-16`, symbol, brokerageAccountId: "ba-179" },
    evaluation,
    bundle: { contextVersion: ctx() } as any,
  };
}

/** Authoritative negative membership (outside program). */
function outsideProgram(symbol: string): ResolvedGovernedRecommendation {
  const evaluation = evaluateSharePhase(
    { freeShares: 100, ownershipAuthority: "positions", evidenceSufficient: true },
    { context: null, associationEstablished: false, membershipNegative: true });
  return {
    subject: { subjectType: "share-block", subjectId: `shares-${symbol}`, symbol, brokerageAccountId: "ba-179" },
    evaluation, bundle: null,
  };
}

describe("governed Recommendation drawer (ADR-021 predicate picture)", () => {
  it("renders the complete predicate checklist with distinct statuses; no accordion; no raw engineering", () => {
    const { container } = render(
      <GovernedRecommendationInspector resolved={unresolvedNoMembership("URA")} onClose={() => {}} />,
    );
    expect(screen.getByText("Governed checklist")).toBeTruthy();
    // Every relevant predicate label is present.
    expect(screen.getByText("Wheel program membership")).toBeTruthy();
    expect(screen.getByText("Call-away pre-acceptance")).toBeTruthy();
    expect(screen.getByText("Intervention condition")).toBeTruthy();
    // Distinct statuses (not conflated): AUTHORITY_MISSING vs NOT_EVALUATED vs POLICY_UNDEFINED.
    expect(screen.getByText("Not established")).toBeTruthy();
    expect(screen.getAllByText(/Not yet evaluated/).length).toBeGreaterThan(0);
    expect(screen.getByText("No governed policy yet")).toBeTruthy();
    // No accordion; no raw governance engineering.
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByText(/Governed scope id/i)).toBeNull();
    expect(screen.queryByText(/fails closed/i)).toBeNull();
    expect(container.querySelector("select")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
  });

  it("shows a not-evaluated dependent with its blocking prerequisite", () => {
    render(<GovernedRecommendationInspector resolved={unresolvedNoMembership("URA")} onClose={() => {}} />);
    expect(screen.getAllByText(/needs wheel-membership/).length).toBeGreaterThan(0);
  });

  it("offers NO enabled control in this slice; explains the blocker instead (ADR-021 §4)", () => {
    const { container } = render(
      <GovernedRecommendationInspector resolved={unresolvedNoMembership("URA")} onClose={() => {}} />,
    );
    expect(screen.getByText("What WW needs")).toBeTruthy();
    expect(screen.getByText(/not yet available in this slice/i)).toBeTruthy();
    // No mutating controls (buttons other than the close ×).
    const buttons = Array.from(container.querySelectorAll("button")).map((b) => b.textContent?.trim());
    expect(buttons.filter((t) => t && t !== "×")).toHaveLength(0);
  });

  it("shows POLICY_UNDEFINED honestly when membership is established (partial resolution)", () => {
    render(<GovernedRecommendationInspector resolved={governedButPolicyUndefined("URA")} onClose={() => {}} />);
    // membership now Established, but intervention policy still blocks affirmative.
    expect(screen.getByText("No governed policy yet")).toBeTruthy();
  });

  it("projects outside-program for authoritative negative membership (not a Recommendation)", () => {
    render(<GovernedRecommendationInspector resolved={outsideProgram("COPX")} onClose={() => {}} />);
    expect(screen.getByText("OUTSIDE PROGRAM")).toBeTruthy();
    expect(screen.getAllByText(/outside the Wheel program/i).length).toBeGreaterThan(0);
  });

  it("presentation cleanup: human account name primary, plain rule name, machine ids demoted", () => {
    render(
      <GovernedRecommendationInspector
        resolved={unresolvedNoMembership("URA")}
        onClose={() => {}}
        accountName="Fidelity XXXX-1234"
        evidenceRows={[{ label: "Short calls", value: "1" }]}
      />,
    );
    expect(screen.getByText("Fidelity XXXX-1234")).toBeTruthy();
    expect(screen.getByText("Existing governed covered call (let resolve)")).toBeTruthy();
    // The raw account id is demoted to a detail row (still present as provenance).
    expect(screen.getByText("ba-179")).toBeTruthy();
    // Position/evidence inspection renders.
    expect(screen.getByText("Short calls")).toBeTruthy();
  });
});
