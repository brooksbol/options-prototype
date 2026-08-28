import { describe, it, expect } from "vitest";
import {
  OpportunityAccumulator,
  type AccumulatorContext,
  type LastSeenMap,
} from "../../src/opportunity-history/accumulator";
import type { WinnerEconomics } from "../../src/opportunity-history/opportunity-fact";
import { emitOpportunityHistory } from "../../src/opportunity-history/emit-client";

const CTX: AccumulatorContext = {
  policyVersion: "routine-csp-v1",
  evidenceGeneration: 16244,
  sessionDate: "2026-08-28",
  sessionPosture: "FULL",
  provider: "tradier",
  environment: "production",
};

const WINNER: WinnerEconomics = {
  delta: 0.30, strike: 100, mid: 1.25, spreadPercent: 8,
  openInterest: 500, volume: 120, yieldAnnualized: 22.5, posture: "ACTIONABLE",
};

const T1 = new Date("2026-08-28T14:00:00Z").getTime();
const T2 = new Date("2026-08-28T14:25:00Z").getTime();

describe("OpportunityAccumulator — cadence dedup", () => {
  it("emits one surface fact for repeated evaluation of unchanged evidence", () => {
    const lastSeen: LastSeenMap = new Map();

    // First run: new evidence
    const a1 = new OpportunityAccumulator(CTX, lastSeen);
    a1.surface({ symbol: "XLE", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "qualified", posture: "ACTIONABLE", winner: WINNER } });
    const b1 = a1.build();
    expect(b1?.surfaceObservations.length).toBe(1);

    // Second run: SAME evidence (same chainRetrievedAt) — should dedup to nothing
    const a2 = new OpportunityAccumulator(CTX, lastSeen);
    a2.surface({ symbol: "XLE", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "qualified", posture: "ACTIONABLE", winner: WINNER } });
    const b2 = a2.build();
    expect(b2).toBeNull(); // nothing new -> no epoch, no write
  });

  it("emits a new surface fact when evidence input advances", () => {
    const lastSeen: LastSeenMap = new Map();

    const a1 = new OpportunityAccumulator(CTX, lastSeen);
    a1.surface({ symbol: "XLE", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "qualified", posture: "ACTIONABLE", winner: WINNER } });
    a1.build();

    // Backend re-acquired -> new chainRetrievedAt -> new fact
    const a2 = new OpportunityAccumulator({ ...CTX, evidenceGeneration: 16245 }, lastSeen);
    a2.surface({ symbol: "XLE", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T2, outcome: { kind: "qualified", posture: "ACTIONABLE", winner: WINNER } });
    const b2 = a2.build();
    expect(b2?.surfaceObservations.length).toBe(1);
    expect(b2?.surfaceObservations[0].chainRetrievedAt).toBe(new Date(T2).toISOString());
  });

  it("acquisition burden accrues per distinct evidence-input observation (NOT per-epoch surface count)", () => {
    // Correction #1: an epoch is an incremental batch. Acquisition burden = count of distinct
    // evidence-input observations over a window; maintained topology = union over a window.
    // A single epoch that happens to touch one expiration does NOT imply the symbol requires
    // only one surface.
    const lastSeen: LastSeenMap = new Map();

    // Epoch 1: only ONE expiration's chain was refreshed this event.
    const e1 = new OpportunityAccumulator(CTX, lastSeen);
    e1.surface({ symbol: "SPY", expiration: "2026-09-04", dte: 7, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "qualified", posture: "EDGE", winner: { ...WINNER, posture: "EDGE" } } });
    const b1 = e1.build();
    expect(b1?.surfaceObservations.length).toBe(1); // incremental — NOT the full topology

    // Epoch 2 (later): a DIFFERENT expiration's chain was refreshed.
    const e2 = new OpportunityAccumulator({ ...CTX, evidenceGeneration: 16245 }, lastSeen);
    e2.surface({ symbol: "SPY", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T2, outcome: { kind: "qualified", posture: "EDGE", winner: { ...WINNER, posture: "EDGE" } } });
    const b2 = e2.build();
    expect(b2?.surfaceObservations.length).toBe(1);

    // Over the WINDOW (both epochs), acquisition burden = 2 distinct evidence-input observations,
    // and maintained topology = union {2026-09-04, 2026-09-18} = 2 surfaces. Neither is derivable
    // from a single epoch alone.
    const windowObservations = [...b1!.surfaceObservations, ...b2!.surfaceObservations];
    expect(windowObservations.length).toBe(2); // acquisition burden over the window
    const topology = new Set(windowObservations.map((o) => o.expiration));
    expect(topology.size).toBe(2); // maintained surface topology from window union
  });

  it("records symbol-scope facts without inventing a surface", () => {
    const lastSeen: LastSeenMap = new Map();
    const a = new OpportunityAccumulator(CTX, lastSeen);
    a.symbol("PENDINGCO", { kind: "pending" });
    a.symbol("NOOPT", { kind: "non_optionable" });
    const batch = a.build();
    expect(batch?.symbolObservations.length).toBe(2);
    expect(batch?.surfaceObservations.length).toBe(0);
    expect(batch?.symbolObservations.map(o => o.symbolState).sort()).toEqual(["NON_OPTIONABLE", "NOT_EVALUATED_PENDING"]);
  });

  it("winner economics preserved through the accumulator for qualifying states", () => {
    const lastSeen: LastSeenMap = new Map();
    const a = new OpportunityAccumulator(CTX, lastSeen);
    a.surface({ symbol: "XLE", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "qualified", posture: "ACTIONABLE", winner: WINNER } });
    a.surface({ symbol: "GLD", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "stale" } });
    const batch = a.build();
    const xle = batch!.surfaceObservations.find(o => o.symbol === "XLE")!;
    const gld = batch!.surfaceObservations.find(o => o.symbol === "GLD")!;
    expect(xle.winner).not.toBeNull();
    expect(xle.winner!.yieldAnnualized).toBe(22.5);
    expect(gld.winner).toBeNull();
    expect(gld.evaluationState).toBe("NOT_EVALUATED_STALE");
  });

  it("symbolsEvaluated counts distinct symbols once", () => {
    const lastSeen: LastSeenMap = new Map();
    const a = new OpportunityAccumulator(CTX, lastSeen);
    a.symbol("XLE", { kind: "has_evaluable_surfaces" });
    a.surface({ symbol: "XLE", expiration: "2026-09-04", dte: 7, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "qualified", posture: "ACTIONABLE", winner: WINNER } });
    a.surface({ symbol: "XLE", expiration: "2026-09-18", dte: 21, strategy: "csp", chainRetrievedAtMs: T1, outcome: { kind: "qualified", posture: "EDGE", winner: { ...WINNER, posture: "EDGE" } } });
    const batch = a.build();
    expect(batch?.epoch.symbolsEvaluated).toBe(1);
  });
});

describe("emitOpportunityHistory — best-effort, never throws", () => {
  it("no-op (returns true) for null batch", async () => {
    const called = { n: 0 };
    const fakeFetch = (async () => { called.n++; return { ok: true } as Response; }) as unknown as typeof fetch;
    const ok = await emitOpportunityHistory(null, fakeFetch);
    expect(ok).toBe(true);
    expect(called.n).toBe(0); // never hit the network
  });

  it("returns false on network failure, does not throw", async () => {
    const fakeFetch = (async () => { throw new Error("network down"); }) as unknown as typeof fetch;
    const batch = { epoch: { epochId: "ep_1", startedAt: "", policyVersion: "v1", evidenceGeneration: 1, sessionDate: "2026-08-28", sessionPosture: "FULL", provider: "tradier", environment: "production", symbolsEvaluated: 1, emitter: "browser" as const }, symbolObservations: [], surfaceObservations: [] };
    const ok = await emitOpportunityHistory(batch, fakeFetch);
    expect(ok).toBe(false);
  });

  it("posts to the endpoint and returns true on 2xx", async () => {
    let url = "";
    const fakeFetch = (async (u: string) => { url = u; return { ok: true } as Response; }) as unknown as typeof fetch;
    const batch = { epoch: { epochId: "ep_1", startedAt: "", policyVersion: "v1", evidenceGeneration: 1, sessionDate: "2026-08-28", sessionPosture: "FULL", provider: "tradier", environment: "production", symbolsEvaluated: 1, emitter: "browser" as const }, symbolObservations: [], surfaceObservations: [] };
    const ok = await emitOpportunityHistory(batch, fakeFetch);
    expect(ok).toBe(true);
    expect(url).toBe("/api/opportunity-history");
  });
});
