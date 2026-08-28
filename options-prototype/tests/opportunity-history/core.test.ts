import { describe, it, expect } from "vitest";
import {
  mapSurfaceOutcome,
  mapSymbolOutcome,
  requiresWinner,
  isEvaluatedState,
  isNotEvaluatedState,
  type SurfaceOutcomeKind,
  type SymbolOutcomeKind,
} from "../../src/opportunity-history/mapping";
import type {
  SurfaceEvaluationState,
  SymbolEvaluationState,
  WinnerEconomics,
} from "../../src/opportunity-history/opportunity-fact";
import {
  deriveEpochId,
  deriveSurfaceObservationId,
  deriveSymbolObservationId,
} from "../../src/opportunity-history/identity";

const WINNER: WinnerEconomics = {
  delta: 0.30,
  strike: 100,
  mid: 1.25,
  spreadPercent: 8,
  openInterest: 500,
  volume: 120,
  yieldAnnualized: 22.5,
  posture: "ACTIONABLE",
};

const ALL_SURFACE_STATES: SurfaceEvaluationState[] = [
  "QUALIFIED_ACTIONABLE",
  "QUALIFIED_EDGE",
  "EVALUATED_WAIT",
  "EVALUATED_NO_DELTA_MATCH",
  "EVALUATED_HARD_NO_ZERO_BID",
  "EVALUATED_HARD_NO_ZERO_OI",
  "EVALUATED_WIDE_SPREAD",
  "EVALUATED_STRATEGY_UNFIT",
  "NOT_EVALUATED_STALE",
  "NOT_EVALUATED_NO_CHAIN",
];

const ALL_SURFACE_OUTCOMES: SurfaceOutcomeKind[] = [
  { kind: "qualified", posture: "ACTIONABLE", winner: WINNER },
  { kind: "qualified", posture: "EDGE", winner: { ...WINNER, posture: "EDGE" } },
  { kind: "qualified", posture: "WAIT", winner: { ...WINNER, posture: "WAIT" } },
  { kind: "wide_spread", winner: { ...WINNER, posture: "WAIT" } },
  { kind: "no_delta_match" },
  { kind: "hard_no_zero_bid" },
  { kind: "hard_no_zero_oi" },
  { kind: "strategy_unfit" },
  { kind: "stale" },
  { kind: "no_chain" },
];

const ALL_SYMBOL_OUTCOMES: SymbolOutcomeKind[] = [
  { kind: "has_evaluable_surfaces" },
  { kind: "pending" },
  { kind: "no_dte" },
  { kind: "non_optionable" },
];

describe("opportunity-history mapping — surface totality & partition", () => {
  it("maps every surface outcome to a valid state (totality)", () => {
    for (const outcome of ALL_SURFACE_OUTCOMES) {
      const { state } = mapSurfaceOutcome(outcome);
      expect(ALL_SURFACE_STATES).toContain(state);
    }
  });

  it("every surface state is either EVALUATED or NOT_EVALUATED, never both, never neither", () => {
    for (const state of ALL_SURFACE_STATES) {
      const ev = isEvaluatedState(state);
      const nev = isNotEvaluatedState(state);
      expect(ev !== nev).toBe(true); // exactly one is true
    }
  });

  it("winner economics present iff state is qualifying/wait/wide-spread", () => {
    for (const outcome of ALL_SURFACE_OUTCOMES) {
      const { state, winner } = mapSurfaceOutcome(outcome);
      if (requiresWinner(state)) {
        expect(winner).not.toBeNull();
      } else {
        expect(winner).toBeNull();
      }
    }
  });

  it("qualified postures map to the correct states", () => {
    expect(mapSurfaceOutcome({ kind: "qualified", posture: "ACTIONABLE", winner: WINNER }).state).toBe("QUALIFIED_ACTIONABLE");
    expect(mapSurfaceOutcome({ kind: "qualified", posture: "EDGE", winner: WINNER }).state).toBe("QUALIFIED_EDGE");
    expect(mapSurfaceOutcome({ kind: "qualified", posture: "WAIT", winner: WINNER }).state).toBe("EVALUATED_WAIT");
  });

  it("the DTE-22 case (stale) is a NOT_EVALUATED fact, not an absence", () => {
    const { state, winner } = mapSurfaceOutcome({ kind: "stale" });
    expect(state).toBe("NOT_EVALUATED_STALE");
    expect(isNotEvaluatedState(state)).toBe(true);
    expect(winner).toBeNull();
  });
});

describe("opportunity-history mapping — symbol totality", () => {
  it("maps every symbol outcome to a valid state", () => {
    const valid: SymbolEvaluationState[] = [
      "HAS_EVALUABLE_SURFACES",
      "NOT_EVALUATED_PENDING",
      "NOT_EVALUATED_NO_DTE",
      "NON_OPTIONABLE",
    ];
    for (const outcome of ALL_SYMBOL_OUTCOMES) {
      expect(valid).toContain(mapSymbolOutcome(outcome));
    }
  });
});

describe("opportunity-history identity — idempotency & dedup", () => {
  const base = {
    strategy: "csp",
    symbol: "XLE",
    expiration: "2026-09-18",
    chainRetrievedAt: "2026-08-28T14:00:00Z",
    policyVersion: "routine-csp-v1-provisional",
  };

  it("same evidence input -> same surface observation id (dedups repeated evaluation)", () => {
    const a = deriveSurfaceObservationId(base);
    const b = deriveSurfaceObservationId({ ...base });
    expect(a).toBe(b);
  });

  it("advancing chainRetrievedAt -> new surface observation id (new evidence = new fact)", () => {
    const a = deriveSurfaceObservationId(base);
    const b = deriveSurfaceObservationId({ ...base, chainRetrievedAt: "2026-08-28T14:25:00Z" });
    expect(a).not.toBe(b);
  });

  it("policy change -> new surface observation id", () => {
    const a = deriveSurfaceObservationId(base);
    const b = deriveSurfaceObservationId({ ...base, policyVersion: "routine-csp-v2" });
    expect(a).not.toBe(b);
  });

  it("different strategy on same surface -> distinct ids", () => {
    const put = deriveSurfaceObservationId(base);
    const bw = deriveSurfaceObservationId({ ...base, strategy: "buy_write" });
    expect(put).not.toBe(bw);
  });

  it("epoch id is deterministic on (generation, policy, session) and independent of wall-clock", () => {
    const g = { evidenceGeneration: 16244, policyVersion: "v1", sessionDate: "2026-08-28", provider: "tradier", environment: "production" };
    expect(deriveEpochId(g)).toBe(deriveEpochId({ ...g }));
  });

  it("new evidence generation -> new epoch id", () => {
    const g = { evidenceGeneration: 16244, policyVersion: "v1", sessionDate: "2026-08-28", provider: "tradier", environment: "production" };
    expect(deriveEpochId(g)).not.toBe(deriveEpochId({ ...g, evidenceGeneration: 16245 }));
  });

  it("policy change -> new epoch id (even with unchanged evidence generation)", () => {
    const g = { evidenceGeneration: 16244, policyVersion: "v1", sessionDate: "2026-08-28", provider: "tradier", environment: "production" };
    expect(deriveEpochId(g)).not.toBe(deriveEpochId({ ...g, policyVersion: "v2" }));
  });

  it("symbol observation id is stable within an epoch", () => {
    const a = deriveSymbolObservationId({ epochId: "ep_abc", symbol: "XLE" });
    const b = deriveSymbolObservationId({ epochId: "ep_abc", symbol: "XLE" });
    expect(a).toBe(b);
    expect(deriveSymbolObservationId({ epochId: "ep_def", symbol: "XLE" })).not.toBe(a);
  });
});
