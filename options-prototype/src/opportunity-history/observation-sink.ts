/**
 * Opportunity-History — Observation Sink (emission seam)
 *
 * The recommendation engines accept an OPTIONAL ObservationSink. When absent (the default
 * for every existing caller and test), the engines behave byte-identically — the sink is a
 * pure additive, read-only side channel. When present, the engine reports each per-surface
 * and per-symbol evaluation outcome at the point it already knows it.
 *
 * The sink NEVER influences Decision outcomes, control flow, ranking, or posture. It only
 * observes. This is the B-1 emission point: the browser (current authoritative evaluator)
 * reports Decision observations; a backend endpoint persists them durably.
 */

import type { SurfaceOutcomeKind, SymbolOutcomeKind } from "./mapping";
import type { OpportunityStrategy } from "./opportunity-fact";

export interface ObservationSink {
  /**
   * Report one symbol-scope evaluation outcome (no surface exists).
   * Called once per symbol per evaluation.
   */
  symbol(symbol: string, outcome: SymbolOutcomeKind): void;

  /**
   * Report one surface-scope evaluation outcome (a real (symbol, expiration) surface).
   * Called once per evaluated surface. `chainRetrievedAtMs` is the evidence-input identity
   * (the chain record's backend retrieval timestamp).
   */
  surface(input: {
    symbol: string;
    expiration: string;
    dte: number;
    strategy: OpportunityStrategy;
    chainRetrievedAtMs: number | null;
    outcome: SurfaceOutcomeKind;
  }): void;
}

/**
 * No-op sink — explicit, for callers that want the parameter present but inert.
 * (Passing `undefined` achieves the same; this exists for readability in tests.)
 */
export const NO_OP_SINK: ObservationSink = {
  symbol() {},
  surface() {},
};
