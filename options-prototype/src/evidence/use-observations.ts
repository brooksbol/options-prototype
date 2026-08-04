/**
 * React hook composing Portfolio symbols into Observation Store activation.
 *
 * Responsibilities:
 * - Extracts unique underlying symbols from the current Portfolio
 * - Feeds them to the Observation Store via setSymbols()
 * - Returns the current ObservationState via useSyncExternalStore
 *
 * The Observation Store does not know about Portfolio.
 * This hook is the composition seam between the two domains.
 */

import { useEffect, useMemo } from "react";
import { useSyncExternalStore } from "react";
import { usePortfolio } from "../portfolio/use-portfolio";
import {
  subscribe,
  getObservations,
  setSymbols,
  type ObservationState,
} from "./observation-store";

/**
 * Extract unique underlying symbols from a PortfolioSnapshot.
 * Returns sorted, uppercase, deduplicated array.
 */
function extractUnderlyings(snapshot: { existingPuts: { underlying: string }[]; existingCalls: { underlying: string }[] } | null): string[] {
  if (!snapshot) return [];
  const symbols = new Set<string>();
  for (const put of snapshot.existingPuts) symbols.add(put.underlying.toUpperCase());
  for (const call of snapshot.existingCalls) symbols.add(call.underlying.toUpperCase());
  return [...symbols].sort();
}

/**
 * Hook that activates Evidence observations for the current Portfolio's underlyings.
 *
 * When the Portfolio changes, the observed symbol set updates automatically.
 * When no Portfolio is loaded, observation stops (empty symbol set).
 */
export function useObservations(): ObservationState {
  const { snapshot } = usePortfolio();

  // Memoize symbol extraction to avoid unnecessary setSymbols calls
  const symbols = useMemo(() => extractUnderlyings(snapshot), [snapshot]);

  useEffect(() => {
    setSymbols(symbols);
  }, [symbols]);

  return useSyncExternalStore(subscribe, getObservations);
}
