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

describe("covered-call resolution", () => {
  it("LET_RESOLVE when covered (Positions authority) + governed", () => {
    const s = snap([inv("GDXJ", 100, 100)], [shortCall("GDXJ", 30, "2026-10-17", 1)]);
    const r = resolveCoveredCallRecommendation(callPos("GDXJ", 30, "2026-10-17"), s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("LET_RESOLVE");
    expect(r.bundle).not.toBeNull();
  });

  it("UNRESOLVED when governance absent (mechanically identical)", () => {
    const s = snap([inv("GDXJ", 100, 100)], [shortCall("GDXJ", 30, "2026-10-17", 1)]);
    const r = resolveCoveredCallRecommendation(callPos("GDXJ", 30, "2026-10-17"), s, "acctA",
      { context: null, associationEstablished: false }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
    expect(r.bundle).toBeNull();
  });

  it("UNRESOLVED when ownership authority absent (never inferred from call geometry)", () => {
    const s = snap([inv("GDXJ", 100, 100, "absent")], [shortCall("GDXJ", 30, "2026-10-17", 1)]);
    const r = resolveCoveredCallRecommendation(callPos("GDXJ", 30, "2026-10-17"), s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
  });
});

describe("share-phase resolution (C7)", () => {
  it("SELL_CALL when a governed free 100-lot exists; contract selection stays separate", () => {
    const s = snap([inv("GDXJ", 100, 0)], []);
    const r = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("SELL_CALL");
    // C7: the phase result never carries a contract; SELL CALL != WHICH CALL?
    expect(JSON.stringify(r.evaluation)).not.toMatch(/strike|contract-selected/i);
  });
});

describe("lifecycle transitions (C11 expiration / C12 assignment)", () => {
  it("C11: after expiration the retained free shares are a NEW subject requiring their own association", () => {
    // Post-expiration snapshot: call gone, 100 free shares retained.
    const s = snap([inv("GDXJ", 100, 0)], []);
    // Without an explicit share-block association, the successor is UNRESOLVED (no copy from
    // the historical call's governance merely because the symbol matches).
    const unresolved = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: null, associationEstablished: false }, now);
    expect(unresolved.evaluation.recommendation).toBe("UNRESOLVED");
    // With its own explicit association it can become SELL_CALL.
    const governed = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(governed.evaluation.recommendation).toBe("SELL_CALL");
  });

  it("C12: after assignment the disposed shares create no share subject (no free shares)", () => {
    // Post-assignment snapshot: shares called away -> no inventory row / zero free shares.
    const s = snap([], []);
    // The Console derives share-block subjects only from inventory with >=100 free shares;
    // with none, no share subject exists to evaluate. A direct evaluation still fails closed.
    const r = resolveSharePhaseRecommendation("GDXJ", s, "acctA",
      { context: ctx(), associationEstablished: true }, now);
    expect(r.evaluation.recommendation).toBe("UNRESOLVED");
    expect(r.evaluation.unresolvedCauses).toContain("insufficient-free-shares-for-one-lot");
  });
});
