/**
 * Resolution fact-building + lifecycle transition semantics (C7, C11, C12).
 *
 * These test the pure resolve.ts layer against synthetic snapshots: coverage facts never
 * infer ownership from geometry (ADR-020); a covered call resolves LET_RESOLVE only with
 * governance; after expiration the successor share block requires its OWN association; after
 * assignment the disposed shares create no share subject.
 */

import { describe, it, expect } from "vitest";
import type { PortfolioSnapshot, InventoryPosition, OpenShortCall } from "../../src/write-desk/types";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";
import type { GovernedContextVersion } from "../../src/governed-decision/governed-context";
import {
  resolveCoveredCallRecommendation,
  resolveSharePhaseRecommendation,
} from "../../src/governed-decision/resolve";

function inv(
  symbol: string,
  owned: number,
  encumbered: number,
  authority: InventoryPosition["ownershipAuthority"] | "absent" = "positions",
): InventoryPosition {
  const free = Math.max(0, owned - encumbered);
  const base: InventoryPosition = {
    symbol, sharesOwned: owned, sharesEncumbered: encumbered, sharesFree: free,
    maxAdditionalContracts: Math.floor(free / 100), economics: null,
  };
  if (authority !== "absent") base.ownershipAuthority = authority;
  return base;
}

function shortCall(symbol: string, strike: number, expiration: string, qty: number): OpenShortCall {
  return { symbol, underlying: symbol, strike, expiration, quantity: qty, brokerOptionBasis: null, brokerOptionAverageCost: null };
}

function snap(inventory: InventoryPosition[], calls: OpenShortCall[]): PortfolioSnapshot {
  return {
    id: "s1",
    source: { kind: "fidelity-csv", sourceLabel: "test", createdAt: "2026-09-05T14:00:00Z" } as any,
    brokerageAccountId: "acctA",
    accountId: "X-1",
    snapshotDate: "2026-09-05",
    inventory,
    existingCalls: calls,
    existingPuts: [],
    deployableCash: null,
    aggregateShortOptionMTM: null,
    balanceContext: null,
    provenance: { sourceLabel: "test", createdAt: "2026-09-05T14:00:00Z", optionSummaryExportTimestamp: "2026-09-05T14:00:00Z" } as any,
    readiness: {} as any,
  };
}

function callPos(symbol: string, strike: number, expiration: string): MonitoredPosition {
  return {
    id: `call-${symbol}-${strike}-${expiration}`,
    type: "call", underlying: symbol, strike, expiration,
    quantity: 1, dte: 10, encumberedCapital: null, capitalAsOf: null,
    moneyness: -0.05, underlyingPrice: strike * 0.95,
  } as MonitoredPosition;
}

function ctx(overrides: Partial<GovernedContextVersion> = {}): GovernedContextVersion {
  return {
    brokerageAccountId: "acctA", governedScopeId: "scope1", contextVersionId: "ctx_1", version: 1,
    supersedesContextVersionId: null, program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted", eligibilityGate: "CLEAR", interventionGate: "CLEAR", noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance", effectiveFrom: "2026-09-01T00:00:00Z", recordedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

const now = "2026-09-05T14:00:00Z";

function statusOf(results: { key: string; status: string }[], key: string): string | undefined {
  return results.find((p) => p.key === key)?.status;
}

describe("covered-call resolution", () => {
  it("membership + coverage established; UNRESOLVED because intervention policy is undefined (ADR-021 §8)", () => {
    const s = snap([inv("GDXJ", 100, 100)], [shortCall("GDXJ", 30, "2026-10-17", 1)]);
    const r = resolveCoveredCallRecommendation(callPos("GDXJ", 30, "2026-10-17"), s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
    expect(statusOf(r.evaluation.predicateResults, "coverage")).toBe("SATISFIED");
    expect(statusOf(r.evaluation.predicateResults, "wheel-membership")).toBe("SATISFIED");
    expect(statusOf(r.evaluation.predicateResults, "intervention-policy")).toBe("POLICY_UNDEFINED");
    // ADR-021 §10: a Decision (bundle) is always built, including this governed UNRESOLVED.
    expect(r.bundle).not.toBeNull();
  });

  it("membership absent (mechanically identical): AUTHORITY_MISSING membership, no-context bundle still built", () => {
    const s = snap([inv("GDXJ", 100, 100)], [shortCall("GDXJ", 30, "2026-10-17", 1)]);
    const r = resolveCoveredCallRecommendation(callPos("GDXJ", 30, "2026-10-17"), s, "acctA",
      { context: null, associationEstablished: false }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
    expect(statusOf(r.evaluation.predicateResults, "wheel-membership")).toBe("AUTHORITY_MISSING");
    // ADR-021 §10: no-context UNRESOLVED is a legitimate durable Decision.
    expect(r.bundle).not.toBeNull();
    expect(r.bundle!.contextVersion).toBeNull();
  });

  it("ownership authority absent -> coverage EVIDENCE_INSUFFICIENT (never inferred from call geometry)", () => {
    const s = snap([inv("GDXJ", 100, 100, "absent")], [shortCall("GDXJ", 30, "2026-10-17", 1)]);
    const r = resolveCoveredCallRecommendation(callPos("GDXJ", 30, "2026-10-17"), s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
    expect(statusOf(r.evaluation.predicateResults, "coverage")).toBe("EVIDENCE_INSUFFICIENT");
  });
});

describe("share-phase resolution (C7)", () => {
  it("governed free 100-lot: free-lot + membership SATISFIED; UNRESOLVED because eligibility/no-write undefined", () => {
    const s = snap([inv("GDXJ", 100, 0)], []);
    const r = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
    expect(statusOf(r.evaluation.predicateResults, "free-lot")).toBe("SATISFIED");
    expect(statusOf(r.evaluation.predicateResults, "wheel-membership")).toBe("SATISFIED");
    expect(statusOf(r.evaluation.predicateResults, "eligibility-policy")).toBe("POLICY_UNDEFINED");
    // C7: the phase result never carries a contract; SELL CALL != WHICH CALL?
    expect(JSON.stringify(r.evaluation)).not.toMatch(/contract-selected/i);
  });
});

describe("lifecycle transitions (C11 expiration / C12 assignment)", () => {
  it("C11: after expiration the retained free shares are a NEW subject requiring their own association", () => {
    const s = snap([inv("GDXJ", 100, 0)], []);
    // Without an explicit share-block association, membership is AUTHORITY_MISSING (no copy
    // from the historical call's governance merely because the symbol matches).
    const unresolved = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: null, associationEstablished: false }, now);
    expect(unresolved.evaluation.recommendation).toBe("UNRESOLVED");
    expect(statusOf(unresolved.evaluation.predicateResults, "wheel-membership")).toBe("AUTHORITY_MISSING");
    // With its own explicit association, membership becomes SATISFIED (but policy still blocks).
    const governed = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(statusOf(governed.evaluation.predicateResults, "wheel-membership")).toBe("SATISFIED");
  });

  it("C12: after assignment the disposed shares have no free lot (free-lot NOT_SATISFIED)", () => {
    const s = snap([], []);
    const r = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
    expect(statusOf(r.evaluation.predicateResults, "free-lot")).toBe("NOT_SATISFIED");
  });
});
