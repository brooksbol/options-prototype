/**
 * useOptionsChain — manages application state for underlying selection,
 * expiration selection, and chain data.
 *
 * Coordinates async calls to the MarketDataProvider.
 * Provider is injected as a parameter (testable, swappable).
 *
 * Behavior:
 *   - On mount: loads underlyings, selects first, loads expirations, selects first, loads chain.
 *   - selectUnderlying: updates symbol, reloads expirations and chain.
 *   - selectExpiration: updates expiration, reloads chain.
 *   - loading: true while any async operation is in flight.
 *   - error: set if an async operation fails (null otherwise).
 *
 * Reference: docs/05-design.md (State Management — useOptionsChain)
 * Reference: docs/05a-component-map.md (useOptionsChain)
 */

import { useState, useEffect, useCallback } from "react";
import type { MarketDataProvider } from "../domain/provider";
import type { Underlying, Expiration, OptionsChain } from "../domain/types";

export interface OptionsChainState {
  underlyings: Underlying[];
  selectedSymbol: string;
  expirations: Expiration[];
  selectedExpiration: string; // ISO date string
  chain: OptionsChain | null;
  loading: boolean;
  error: string | null;
}

export interface UseOptionsChainResult {
  state: OptionsChainState;
  selectUnderlying: (symbol: string) => void;
  selectExpiration: (date: string) => void;
}

const INITIAL_STATE: OptionsChainState = {
  underlyings: [],
  selectedSymbol: "",
  expirations: [],
  selectedExpiration: "",
  chain: null,
  loading: true,
  error: null,
};

export function useOptionsChain(
  provider: MarketDataProvider
): UseOptionsChainResult {
  const [state, setState] = useState<OptionsChainState>(INITIAL_STATE);

  // Load underlyings on mount, then cascade to first expiration + chain
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        const underlyings = await provider.getUnderlyings();
        if (cancelled || underlyings.length === 0) {
          setState((s) => ({ ...s, loading: false, underlyings }));
          return;
        }

        const firstSymbol = underlyings[0].symbol;
        const expirations = await provider.getExpirations(firstSymbol);
        if (cancelled) return;

        if (expirations.length === 0) {
          setState({
            underlyings,
            selectedSymbol: firstSymbol,
            expirations: [],
            selectedExpiration: "",
            chain: null,
            loading: false,
            error: null,
          });
          return;
        }

        const firstExpiration = expirations[0].date;
        const chain = await provider.getOptionsChain(firstSymbol, firstExpiration);
        if (cancelled) return;

        setState({
          underlyings,
          selectedSymbol: firstSymbol,
          expirations,
          selectedExpiration: firstExpiration,
          chain,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      }
    }

    initialize();
    return () => { cancelled = true; };
  }, [provider]);

  const selectUnderlying = useCallback(
    (symbol: string) => {
      let cancelled = false;

      async function load() {
        try {
          setState((s) => ({
            ...s,
            selectedSymbol: symbol,
            loading: true,
            error: null,
          }));

          const expirations = await provider.getExpirations(symbol);
          if (cancelled) return;

          if (expirations.length === 0) {
            setState((s) => ({
              ...s,
              expirations: [],
              selectedExpiration: "",
              chain: null,
              loading: false,
            }));
            return;
          }

          const firstExpiration = expirations[0].date;
          const chain = await provider.getOptionsChain(symbol, firstExpiration);
          if (cancelled) return;

          setState((s) => ({
            ...s,
            expirations,
            selectedExpiration: firstExpiration,
            chain,
            loading: false,
          }));
        } catch (err) {
          if (!cancelled) {
            setState((s) => ({
              ...s,
              loading: false,
              error: err instanceof Error ? err.message : "Unknown error",
            }));
          }
        }
      }

      load();
      // Note: cancellation for rapid re-selections would require a ref.
      // Acceptable for Slice 1 with synchronous mock provider.
    },
    [provider]
  );

  const selectExpiration = useCallback(
    (date: string) => {
      let cancelled = false;

      async function load() {
        try {
          setState((s) => ({
            ...s,
            selectedExpiration: date,
            loading: true,
            error: null,
          }));

          const chain = await provider.getOptionsChain(
            state.selectedSymbol,
            date
          );
          if (cancelled) return;

          setState((s) => ({
            ...s,
            chain,
            loading: false,
          }));
        } catch (err) {
          if (!cancelled) {
            setState((s) => ({
              ...s,
              loading: false,
              error: err instanceof Error ? err.message : "Unknown error",
            }));
          }
        }
      }

      load();
    },
    [provider, state.selectedSymbol]
  );

  return { state, selectUnderlying, selectExpiration };
}
