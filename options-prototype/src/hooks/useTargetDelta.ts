/**
 * useTargetDelta — manages the user's delta policy state.
 *
 * Clamps targetDelta to [0.01, 0.99].
 * Defaults to DEFAULT_DELTA_POLICY.
 * Exposes both targetDelta and tieBreaker for the full DeltaPolicy.
 *
 * Reference: docs/05-design.md (State Management — useTargetDelta)
 * Reference: docs/05a-component-map.md (useTargetDelta)
 */

import { useState, useCallback } from "react";
import {
  DEFAULT_DELTA_POLICY,
  type DeltaPolicy,
  type DeltaTieBreaker,
} from "../domain/policy";

export interface UseTargetDeltaResult {
  policy: DeltaPolicy;
  setTargetDelta: (value: number) => void;
  setTieBreaker: (value: DeltaTieBreaker) => void;
}

function clampDelta(value: number): number {
  return Math.min(0.99, Math.max(0.01, value));
}

export function useTargetDelta(
  defaultPolicy?: Partial<DeltaPolicy>
): UseTargetDeltaResult {
  const initial: DeltaPolicy = {
    ...DEFAULT_DELTA_POLICY,
    ...defaultPolicy,
  };

  const [policy, setPolicy] = useState<DeltaPolicy>(initial);

  const setTargetDelta = useCallback((value: number) => {
    setPolicy((p) => ({ ...p, targetDelta: clampDelta(value) }));
  }, []);

  const setTieBreaker = useCallback((value: DeltaTieBreaker) => {
    setPolicy((p) => ({ ...p, tieBreaker: value }));
  }, []);

  return { policy, setTargetDelta, setTieBreaker };
}
