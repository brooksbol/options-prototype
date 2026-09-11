/**
 * use-position-deltas — THIN Operator Console adapter over the shared greek
 * domain. It maps monitored positions to greek-lookup subjects and exposes the
 * two map shapes the Console table consumes. It contains NO greek validity,
 * availability, or formatting logic — those live in the consumer-agnostic
 * `write-desk/option-greeks` and `write-desk/contract-greek-lookup` modules so
 * the future Deployment tables reuse identical semantics without copying Console
 * code.
 *
 * Console-specific presentation choice retained here: the delta column shows the
 * ABSOLUTE delta magnitude (puts report negative delta; magnitude puts puts and
 * calls on one 0–1 scale). Validity of that delta still comes from shared
 * sanitization; only the abs() presentation is local.
 */

import { useState, useEffect } from "react";
import type { MonitoredPosition } from "../portfolio/position-monitoring";
import { lookupContractGreeksWithAge, type GreekLookupSubject, type ContractGreeksResult } from "../write-desk/contract-greek-lookup";
import { absDeltaMagnitude } from "../write-desk/option-greeks";

/** Absolute delta magnitude per position (null = unavailable). */
export type PositionDeltaMap = ReadonlyMap<string, number | null>;

/** Secondary greeks per position (each field null = unavailable). */
export interface PositionGreeks {
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  rho: number | null;
  /**
   * Epoch-ms when the CHAIN these greeks came from was acquired (null if unknown).
   * Distinct from the row's underlying-quote freshness: greeks can be materially
   * older than the latest spot, so the surface presents this so a fresh quote does
   * not masquerade as fresh greeks.
   */
  chainRetrievedAtMs: number | null;
}

export type PositionGreeksMap = ReadonlyMap<string, PositionGreeks>;

const EMPTY_DELTA_MAP: PositionDeltaMap = new Map();
const EMPTY_GREEKS_MAP: PositionGreeksMap = new Map();

/** Map a monitored position to a shared greek-lookup subject. */
function toSubject(pos: MonitoredPosition): GreekLookupSubject {
  return {
    symbol: pos.underlying,
    expiration: pos.expiration,
    strike: pos.strike,
    // buy-write is written against the call side, same as a covered call.
    side: pos.type === "put" ? "put" : "call",
  };
}

/**
 * Resolve sanitized greeks for every position via the shared lookup. Returns a
 * Map keyed by position id. Shared for both hooks so the cache read happens once
 * per lookup call and both maps derive from identical, already-sanitized data.
 */
async function resolveGreeksByPosition(
  positions: MonitoredPosition[],
): Promise<Map<string, ContractGreeksResult>> {
  const result = new Map<string, ContractGreeksResult>();
  for (const pos of positions) {
    result.set(pos.id, await lookupContractGreeksWithAge(toSubject(pos)));
  }
  return result;
}

/**
 * usePositionDeltas — absolute delta magnitude per position, from shared,
 * sanitized greek evidence.
 *
 * @param positions - current monitored positions
 * @param generation - evidence generation (triggers re-lookup when evidence advances)
 */
export function usePositionDeltas(
  positions: MonitoredPosition[],
  generation: number | null,
): PositionDeltaMap {
  const [deltas, setDeltas] = useState<PositionDeltaMap>(EMPTY_DELTA_MAP);
  const positionKey = positions.map(p => p.id).join(",");

  useEffect(() => {
    if (positions.length === 0) {
      setDeltas(EMPTY_DELTA_MAP);
      return;
    }
    let cancelled = false;

    (async () => {
      const greeksByPos = await resolveGreeksByPosition(positions);
      if (cancelled) return;
      const result = new Map<string, number | null>();
      for (const pos of positions) {
        const g = greeksByPos.get(pos.id);
        result.set(pos.id, absDeltaMagnitude(g?.greeks.delta ?? null));
      }
      setDeltas(result);
    })();

    return () => { cancelled = true; };
  }, [positionKey, generation]);

  return deltas;
}

/**
 * usePositionGreeks — secondary greeks (gamma, theta, vega, rho) per position,
 * from shared, sanitized greek evidence. Values are as-reported by the provider
 * (no sign normalization); availability is the shared field-level result.
 *
 * @param positions - current monitored positions
 * @param generation - evidence generation (triggers re-lookup when evidence advances)
 */
export function usePositionGreeks(
  positions: MonitoredPosition[],
  generation: number | null,
): PositionGreeksMap {
  const [greeks, setGreeks] = useState<PositionGreeksMap>(EMPTY_GREEKS_MAP);
  const positionKey = positions.map(p => p.id).join(",");

  useEffect(() => {
    if (positions.length === 0) {
      setGreeks(EMPTY_GREEKS_MAP);
      return;
    }
    let cancelled = false;

    (async () => {
      const greeksByPos = await resolveGreeksByPosition(positions);
      if (cancelled) return;
      const result = new Map<string, PositionGreeks>();
      for (const pos of positions) {
        const r = greeksByPos.get(pos.id);
        result.set(pos.id, {
          gamma: r?.greeks.gamma ?? null,
          theta: r?.greeks.theta ?? null,
          vega: r?.greeks.vega ?? null,
          rho: r?.greeks.rho ?? null,
          chainRetrievedAtMs: r?.chainRetrievedAtMs ?? null,
        });
      }
      setGreeks(result);
    })();

    return () => { cancelled = true; };
  }, [positionKey, generation]);

  return greeks;
}
