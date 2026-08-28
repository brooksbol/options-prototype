/**
 * Opportunity-History — Emission Accumulator
 *
 * Collects ObservationSink calls during a Decision run and assembles an
 * OpportunityHistoryBatch. Enforces the ratified cadence rule at the source:
 *
 *   Persist ONE fact per distinct evidence input per surface/policy.
 *   Repeated evaluation of unchanged evidence is NOT a new fact.
 *
 * Dedup mechanism: a persistent "last-seen" map keyed by surface identity records the
 * chainRetrievedAt of the last emitted observation for that surface. If a new evaluation
 * carries the same chainRetrievedAt (backend has not re-acquired) under the same policy,
 * the accumulator drops it — so 20 browser polls of one chain yield one fact, not 20.
 *
 * Idempotency at the store is a second safety net (INSERT OR IGNORE on deterministic ids);
 * this source-side dedup keeps write volume proportional to actual new evidence.
 *
 * The accumulator is pure/stateless with respect to Decision; it only observes.
 */

import type {
  OpportunityHistoryBatch,
  EvaluationEpoch,
  SymbolObservation,
  SurfaceObservation,
  OpportunityStrategy,
} from "./opportunity-fact";
import type { ObservationSink } from "./observation-sink";
import { mapSurfaceOutcome, mapSymbolOutcome, type SurfaceOutcomeKind, type SymbolOutcomeKind } from "./mapping";
import {
  deriveEpochId,
  deriveSurfaceObservationId,
  deriveSymbolObservationId,
} from "./identity";

export interface AccumulatorContext {
  policyVersion: string;
  evidenceGeneration: number | null;
  sessionDate: string;
  sessionPosture: string;
  provider: string;
  environment: string;
  emitter?: "browser" | "backend";
}

/**
 * A persistent last-seen map: surfaceKey -> last emitted chainRetrievedAt (ISO string).
 * Callers should retain ONE instance across Decision runs (e.g. a ref/module singleton)
 * so unchanged-evidence re-evaluations are suppressed across polls.
 */
export type LastSeenMap = Map<string, string>;

function surfaceKey(strategy: string, symbol: string, expiration: string): string {
  return `${strategy}\u001f${symbol}\u001f${expiration}`;
}

export class OpportunityAccumulator implements ObservationSink {
  private readonly ctx: AccumulatorContext;
  private readonly lastSeen: LastSeenMap;
  private readonly epochId: string;
  private readonly startedAt: string;
  private readonly symbolRows: SymbolObservation[] = [];
  private readonly surfaceRows: SurfaceObservation[] = [];
  private symbolsEvaluated = 0;
  private readonly seenSymbols = new Set<string>();
  private readonly emittedSymbolIds = new Set<string>();

  constructor(ctx: AccumulatorContext, lastSeen: LastSeenMap) {
    this.ctx = ctx;
    this.lastSeen = lastSeen;
    this.startedAt = new Date().toISOString();
    this.epochId = deriveEpochId({
      evidenceGeneration: ctx.evidenceGeneration,
      policyVersion: ctx.policyVersion,
      sessionDate: ctx.sessionDate,
      provider: ctx.provider,
      environment: ctx.environment,
    });
  }

  symbol(symbol: string, outcome: SymbolOutcomeKind): void {
    const observationId = deriveSymbolObservationId({ epochId: this.epochId, symbol });
    // Dedup in-memory: the same symbol may be reported by multiple engines (puts + buy-write)
    // in one shared epoch. Both derive the same symbol-scope state from the same evidence, so
    // the first observation wins and repeats are ignored (store INSERT OR IGNORE is the safety net).
    if (this.emittedSymbolIds.has(observationId)) return;
    this.emittedSymbolIds.add(observationId);

    if (!this.seenSymbols.has(symbol)) {
      this.seenSymbols.add(symbol);
      this.symbolsEvaluated++;
    }
    this.symbolRows.push({
      observationId,
      epochId: this.epochId,
      symbol,
      symbolState: mapSymbolOutcome(outcome),
      observedAt: new Date().toISOString(),
    });
  }

  surface(input: {
    symbol: string;
    expiration: string;
    dte: number;
    strategy: OpportunityStrategy;
    chainRetrievedAtMs: number | null;
    outcome: SurfaceOutcomeKind;
  }): void {
    const chainRetrievedAt =
      input.chainRetrievedAtMs != null ? new Date(input.chainRetrievedAtMs).toISOString() : "";

    // Cadence dedup: drop if we've already emitted this surface at this evidence input.
    const key = surfaceKey(input.strategy, input.symbol, input.expiration);
    if (this.lastSeen.get(key) === chainRetrievedAt && chainRetrievedAt !== "") {
      return; // unchanged evidence — not a new fact
    }
    this.lastSeen.set(key, chainRetrievedAt);

    const { state, winner } = mapSurfaceOutcome(input.outcome);
    const observationId = deriveSurfaceObservationId({
      strategy: input.strategy,
      symbol: input.symbol,
      expiration: input.expiration,
      chainRetrievedAt,
      policyVersion: this.ctx.policyVersion,
    });

    this.surfaceRows.push({
      observationId,
      epochId: this.epochId,
      symbol: input.symbol,
      expiration: input.expiration,
      dte: input.dte,
      strategy: input.strategy,
      evaluationState: state,
      chainRetrievedAt,
      observedAt: new Date().toISOString(),
      winner,
    });
  }

  /**
   * Assemble the batch. Returns null when there is nothing new to persist
   * (no surface observations survived dedup AND no symbol observations) — this
   * is the "no new evidence, no write" rule: repeated evaluation of unchanged
   * evidence produces no epoch.
   */
  build(): OpportunityHistoryBatch | null {
    if (this.surfaceRows.length === 0 && this.symbolRows.length === 0) {
      return null;
    }
    const epoch: EvaluationEpoch = {
      epochId: this.epochId,
      startedAt: this.startedAt,
      policyVersion: this.ctx.policyVersion,
      evidenceGeneration: this.ctx.evidenceGeneration,
      sessionDate: this.ctx.sessionDate,
      sessionPosture: this.ctx.sessionPosture,
      provider: this.ctx.provider,
      environment: this.ctx.environment,
      symbolsEvaluated: this.symbolsEvaluated,
      emitter: this.ctx.emitter ?? "browser",
    };
    return {
      epoch,
      symbolObservations: this.symbolRows,
      surfaceObservations: this.surfaceRows,
    };
  }
}
