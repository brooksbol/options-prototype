/**
 * useHoldCloseNotices — row-level BTS indicator hook tests (DECIDE-driven).
 *
 * The row indicator is derived from the GOVERNED DECISION for the position, not
 * from consequence completeness and not from chain admissibility:
 *   - a near-DTE deeply-OTM short (BTC action)      → "actionable" (RED)
 *   - the SAME posture with an inadmissible chain    → STILL "actionable"
 *   - a routine far-DTE non-policy short (NO-ACTION)  → "none"
 *   - §14a lifecycle ambiguity (RECONCILE)            → "actionable" (attention)
 *   - a non-obligation position / absent obligation   → "none"
 *   - a loader failure fails closed                    → "none" (never actionable)
 *
 * Proves the row indicator and the modal consume the SAME resolved result.
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useHoldCloseNotices } from "../../src/operator-console/use-hold-close-notices";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";
import type { PortfolioSnapshot } from "../../src/write-desk/types";
import type { MarketSessionClassification } from "../../src/market-session/session-policy";
import type { EvaluatedPair } from "../../src/write-desk/short-obligation-resolve";
import {
  evaluateShortObligationConsequences,
  classifyQuoteGeometry,
  type ShortObligation,
  type ShortObligationEvidence,
} from "../../src/write-desk/short-obligation-consequences";

const SESSION = { state: "REGULAR_OBSERVATION", authorityPending: false } as unknown as MarketSessionClassification;

/**
 * DBO acceptance posture: 2 DTE, strike $21, spot $25.47 → deeply OTM put.
 * moneyness (put, signed) = (strike - spot)/spot = (21 - 25.47)/25.47 ≈ -0.1755
 * (deeper than the 0.15 negligible-risk threshold).
 */
function dboPosition(id = "put-DBO-21-2026-09-18"): MonitoredPosition {
  return {
    id, type: "put", underlying: "DBO", strike: 21, expiration: "2026-09-18", dte: 2, quantity: 1,
    encumberedCapital: 2100, capitalValuationBasis: "strike", capitalAsOf: "2026-09-16",
    moneyness: (21 - 25.47) / 25.47, underlyingPrice: 25.47, underlyingPreviousClose: null, priceObservedAt: null,
    evidenceGeneration: null, acquisitionStatus: null, lastAttemptAt: null, failureCount: 0, openedDate: null,
  };
}

/** A routine far-DTE, near-the-money short — not a policy candidate. */
function routinePutPosition(id = "put-XLF-42-2026-10-16"): MonitoredPosition {
  return {
    id, type: "put", underlying: "XLF", strike: 42, expiration: "2026-10-16", dte: 21, quantity: 1,
    encumberedCapital: 4200, capitalValuationBasis: "strike", capitalAsOf: "2026-10-01",
    moneyness: (42 - 43.5) / 43.5, underlyingPrice: 43.5, underlyingPreviousClose: null, priceObservedAt: null,
    evidenceGeneration: null, acquisitionStatus: null, lastAttemptAt: null, failureCount: 0, openedDate: null,
  };
}

/**
 * Negative specimen: DBO $26 BUY-WRITE, 2 DTE, near strike. A near-strike
 * short call is a candidate that resolves to a governed HOLD — NOT a red alert.
 * moneyness (call, signed) = (spot - strike)/spot = (25.47 - 26)/25.47 ≈ -0.0208
 */
function dboBuyWritePosition(id = "bw-DBO-26-2026-09-18"): MonitoredPosition {
  return {
    id, type: "buy-write", underlying: "DBO", strike: 26, expiration: "2026-09-18", dte: 2, quantity: 1,
    encumberedCapital: 2600, capitalValuationBasis: "strike", capitalAsOf: "2026-09-16",
    moneyness: (25.47 - 26) / 25.47, underlyingPrice: 25.47, underlyingPreviousClose: null, priceObservedAt: null,
    evidenceGeneration: null, acquisitionStatus: null, lastAttemptAt: null, failureCount: 0, openedDate: null,
  };
}

function snapshotWithDboBuyWrite(): PortfolioSnapshot {
  return {
    existingPuts: [],
    existingCalls: [{ symbol: "DBO", underlying: "DBO", strike: 26, expiration: "2026-09-18", quantity: 1, brokerOptionBasis: null, brokerOptionAverageCost: null }],
    provenance: {}, snapshotDate: "2026-09-16",
  } as unknown as PortfolioSnapshot;
}

function nonObligationPosition(): MonitoredPosition {
  return { ...routinePutPosition("shares-XLF"), type: "shares" as unknown as MonitoredPosition["type"] };
}

function snapshotWithDbo(): PortfolioSnapshot {
  return {
    existingPuts: [{ symbol: "DBO", underlying: "DBO", strike: 21, expiration: "2026-09-18", quantity: 1, brokerOptionBasis: null, brokerOptionAverageCost: null }],
    existingCalls: [], provenance: {}, snapshotDate: "2026-09-16",
  } as unknown as PortfolioSnapshot;
}

function snapshotWithRoutine(): PortfolioSnapshot {
  return {
    existingPuts: [{ symbol: "XLF", underlying: "XLF", strike: 42, expiration: "2026-10-16", quantity: 1, brokerOptionBasis: null, brokerOptionAverageCost: null }],
    existingCalls: [], provenance: {}, snapshotDate: "2026-10-01",
  } as unknown as PortfolioSnapshot;
}

function evidence(overrides: Partial<ShortObligationEvidence> = {}): ShortObligationEvidence {
  return {
    lifecycle: { ambiguous: false }, admissible: true, authorityPending: false, admissibilityDiagnosis: "admissible",
    quote: classifyQuoteGeometry(0.02, 0.06), optionProvenance: { kind: "unavailable" }, observedSpot: 25.47,
    spotProvenance: { kind: "unavailable" }, enrichment: null, openingCredit: null, openingCreditAttribution: "unavailable",
    assignmentIntent: "unknown", ...overrides,
  };
}

function loaderFor(ev: ShortObligationEvidence) {
  return async (obligation: ShortObligation | null): Promise<EvaluatedPair> => {
    const o = obligation!;
    return {
      hold: evaluateShortObligationConsequences(o, "hold", ev),
      close: evaluateShortObligationConsequences(o, "close", ev),
      evidence: ev,
    };
  };
}

const DBO_ID = "put-DBO-21-2026-09-18";
const XLF_ID = "put-XLF-42-2026-10-16";

describe("useHoldCloseNotices — decision-driven row indicator", () => {
  it("DBO near-DTE deeply-OTM put → 'actionable' (RED) with BTC decision", async () => {
    const { result } = renderHook(() =>
      useHoldCloseNotices([dboPosition()], snapshotWithDbo(), SESSION, 1, loaderFor(evidence()))
    );
    await waitFor(() => expect(result.current.notices.get(DBO_ID)).toBe("actionable"));
    expect(result.current.resolved.get(DBO_ID)!.decision.action).toBe("BTC");
  });

  it("closure-independence: SAME DBO posture with inadmissible chain → STILL 'actionable' + STILL BTC", async () => {
    const ev = evidence({ admissible: false, admissibilityDiagnosis: "backend-inadmissible" });
    const { result } = renderHook(() =>
      useHoldCloseNotices([dboPosition()], snapshotWithDbo(), SESSION, 1, loaderFor(ev))
    );
    await waitFor(() => expect(result.current.notices.get(DBO_ID)).toBe("actionable"));
    const decision = result.current.resolved.get(DBO_ID)!.decision;
    expect(decision.action).toBe("BTC");
    // Inadmissibility degraded ONLY the execution caveat.
    expect(decision.executionCaveat).toBeTruthy();
  });

  it("NEGATIVE SPECIMEN: DBO $26 buy-write near strike (2 DTE) resolves to HOLD → 'none' (NO red merely because 2 DTE/evaluated)", async () => {
    const BW_ID = "bw-DBO-26-2026-09-18";
    const { result } = renderHook(() =>
      useHoldCloseNotices([dboBuyWritePosition()], snapshotWithDboBuyWrite(), SESSION, 1, loaderFor(evidence()))
    );
    await waitFor(() => expect(result.current.resolved.get(BW_ID)).toBeDefined());
    // The governed decision is HOLD — a decision, but NOT an operator action.
    expect(result.current.resolved.get(BW_ID)!.decision.action).toBe("HOLD");
    // ...therefore NO red row indicator.
    expect(result.current.notices.get(BW_ID)).toBe("none");
  });

  it("routine far-DTE non-policy short → 'none' (no false red)", async () => {
    const { result } = renderHook(() =>
      useHoldCloseNotices([routinePutPosition()], snapshotWithRoutine(), SESSION, 1, loaderFor(evidence()))
    );
    await waitFor(() => expect(result.current.resolved.get(XLF_ID)).toBeDefined());
    expect(result.current.notices.get(XLF_ID)).toBe("none");
    expect(result.current.resolved.get(XLF_ID)!.decision.action).toBe("NO-ACTION");
  });

  it("§14a lifecycle-ambiguous → 'actionable' (RECONCILE), never invented BTC/HOLD", async () => {
    const ev = evidence({ lifecycle: { ambiguous: true, conflictingEvent: "buy_to_close", eventDate: "2026-09-12", note: "x" } });
    const { result } = renderHook(() =>
      useHoldCloseNotices([dboPosition()], snapshotWithDbo(), SESSION, 1, loaderFor(ev))
    );
    await waitFor(() => expect(result.current.resolved.get(DBO_ID)).toBeDefined());
    expect(result.current.notices.get(DBO_ID)).toBe("actionable");
    expect(result.current.resolved.get(DBO_ID)!.decision.action).toBe("RECONCILE-LIFECYCLE");
  });

  it("non-obligation position → 'none'", async () => {
    const { result } = renderHook(() =>
      useHoldCloseNotices([nonObligationPosition()], snapshotWithRoutine(), SESSION, 1, loaderFor(evidence()))
    );
    await waitFor(() => expect(result.current.notices.get("shares-XLF")).toBe("none"));
  });

  it("obligation absent from the current snapshot → 'none'", async () => {
    const emptySnap = { existingPuts: [], existingCalls: [], provenance: {}, snapshotDate: "2026-09-16" } as unknown as PortfolioSnapshot;
    const { result } = renderHook(() =>
      useHoldCloseNotices([dboPosition()], emptySnap, SESSION, 1, loaderFor(evidence()))
    );
    await waitFor(() => expect(result.current.notices.get(DBO_ID)).toBe("none"));
  });

  it("fails closed: a loader that throws yields 'none' and NO resolved entry, never 'actionable'", async () => {
    const throwing = async (): Promise<EvaluatedPair> => { throw new Error("boom"); };
    const { result } = renderHook(() =>
      useHoldCloseNotices([dboPosition()], snapshotWithDbo(), SESSION, 1, throwing)
    );
    await waitFor(() => expect(result.current.notices.get(DBO_ID)).toBe("none"));
    expect(result.current.resolved.get(DBO_ID)).toBeUndefined();
  });
});

describe("useHoldCloseNotices — single evaluation, two consumers", () => {
  it("evaluates once per position; the row indicator and the modal read the SAME resolved result", async () => {
    const ev = evidence();
    let calls = 0;
    const countingLoader = async (o: ShortObligation | null): Promise<EvaluatedPair> => {
      calls++;
      return {
        hold: evaluateShortObligationConsequences(o!, "hold", ev),
        close: evaluateShortObligationConsequences(o!, "close", ev),
        evidence: ev,
      };
    };
    const { result } = renderHook(() =>
      useHoldCloseNotices([dboPosition()], snapshotWithDbo(), SESSION, 1, countingLoader)
    );
    await waitFor(() => expect(result.current.resolved.get(DBO_ID)).toBeDefined());
    expect(calls).toBe(1);
    const resolved = result.current.resolved.get(DBO_ID)!;
    // The row indicator is exactly the resolved decision's attention.
    expect(result.current.notices.get(DBO_ID)).toBe(resolved.decision.attention ? "actionable" : "none");
  });
});
