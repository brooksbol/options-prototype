/**
 * React hook composing Portfolio symbols into Observation Store activation.
 *
 * Responsibilities:
 * - Extracts unique underlying symbols from the current Portfolio
 * - For Fidelity source: feeds them to the Observation Store via setSymbols() (polls backend)
 * - For Demo source: returns synthetic coherent observations from the demo scenario
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
import { DEMO_SPOT_PRICES } from "../write-desk/demo-snapshot";

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

interface HeldExpiration { symbol: string; expiration: string }

/**
 * Extract the EXACT (symbol, expiration) pairs the operator currently holds
 * (held-expiration acquisition overlay). These drive the backend to keep the
 * held chains refreshed even below the 7-45 DTE eligibility window, so held
 * positions' greeks stay current. Sorted + deduped for a stable POST identity.
 */
function extractHeldExpirations(
  snapshot: { existingPuts: { underlying: string; expiration: string }[]; existingCalls: { underlying: string; expiration: string }[] } | null,
): HeldExpiration[] {
  if (!snapshot) return [];
  const seen = new Set<string>();
  const pairs: HeldExpiration[] = [];
  const add = (underlying: string, expiration: string) => {
    if (!underlying || !expiration) return;
    const sym = underlying.toUpperCase();
    const key = `${sym}|${expiration}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ symbol: sym, expiration });
  };
  for (const put of snapshot.existingPuts) add(put.underlying, put.expiration);
  for (const call of snapshot.existingCalls) add(call.underlying, call.expiration);
  pairs.sort((a, b) => (a.symbol === b.symbol ? a.expiration.localeCompare(b.expiration) : a.symbol.localeCompare(b.symbol)));
  return pairs;
}

/**
 * Build a self-contained ObservationState from the demo scenario's spot prices.
 * This ensures Demo mode never depends on live backend Evidence for pricing,
 * keeping the demo temporally coherent regardless of actual market conditions.
 */
function buildDemoObservations(): ObservationState {
  const observations = new Map<string, { symbol: string; price: number | null; observedAt: string | null; acquisitionStatus: "ready"; lastAttemptAt: string | null; failureCount: number }>();
  const now = new Date().toISOString();

  for (const [symbol, price] of Object.entries(DEMO_SPOT_PRICES)) {
    const sym = symbol.toUpperCase();
    observations.set(sym, {
      symbol: sym,
      price,
      observedAt: now,
      acquisitionStatus: "ready",
      lastAttemptAt: now,
      failureCount: 0,
    });
  }

  return {
    generation: 1,
    generatedAt: now,
    observations,
    polling: false,
    lastPollResult: "200",
  };
}

/** Cached demo observations (stable reference for useSyncExternalStore) */
let cachedDemoObservations: ObservationState | null = null;
function getDemoObservations(): ObservationState {
  if (!cachedDemoObservations) {
    cachedDemoObservations = buildDemoObservations();
  }
  return cachedDemoObservations;
}
/** No-op subscribe for demo mode (static data, never changes) */
function subscribeDemoNoop(_listener: () => void): () => void {
  return () => {};
}

/**
 * Hook that activates Evidence observations for the current Portfolio's underlyings.
 *
 * When the Portfolio changes, the observed symbol set updates automatically.
 * When no Portfolio is loaded, observation stops (empty symbol set).
 */
export function useObservations(): ObservationState {
  const { snapshot, source } = usePortfolio();

  // Demo mode: return self-contained synthetic observations (no backend polling)
  const isDemo = source === "demo";

  // Memoize symbol extraction to avoid unnecessary setSymbols calls
  const symbols = useMemo(() => isDemo ? [] : extractUnderlyings(snapshot), [snapshot, isDemo]);

  // Held (symbol, expiration) pairs — stabilized by content so the observe effect
  // only re-posts when the actual held set changes.
  const heldExpirations = useMemo(() => isDemo ? [] : extractHeldExpirations(snapshot), [snapshot, isDemo]);
  const heldKey = useMemo(() => heldExpirations.map(h => `${h.symbol}|${h.expiration}`).join(","), [heldExpirations]);

  useEffect(() => {
    setSymbols(symbols);
  }, [symbols]);

  // Ensure all portfolio symbols are in the backend's observable population, and
  // declare the exact held expirations so the backend keeps their chains refreshed
  // even below the 7-45 DTE window (held-expiration overlay). The backend doesn't
  // know these are portfolio positions — it just ensures they're acquirable and
  // that held chains stay current. Idempotent per exact (symbols + held) set.
  useEffect(() => {
    if (symbols.length === 0) return;
    ensureObservable(symbols, heldExpirations);
    // heldKey is the content-stable dependency for heldExpirations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, heldKey]);

  // For demo: use static demo observations. For fidelity: use live observation store.
  const liveState = useSyncExternalStore(
    isDemo ? subscribeDemoNoop : subscribe,
    isDemo ? getDemoObservations : getObservations,
  );

  return liveState;
}

/**
 * POST portfolio symbols + held expirations to /api/evidence/observe so the backend
 * can acquire them and keep held chains refreshed. Fire-and-forget — failures are
 * non-fatal (the observation pipeline still works for known symbols via the
 * QuotesController graceful path). `heldExpirations` is additive; older backends
 * ignore it.
 */
let lastObserveKey = "";
function ensureObservable(symbols: string[], heldExpirations: HeldExpiration[] = []): void {
  const heldKey = heldExpirations.map(h => `${h.symbol}|${h.expiration}`).join(",");
  const key = symbols.join(",") + "||" + heldKey;
  if (key === lastObserveKey) return; // Already sent for this exact set (symbols + held)
  lastObserveKey = key;

  fetch("/api/evidence/observe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols, heldExpirations }),
  }).catch(() => {
    // Non-fatal — observation still works for known symbols
  });
}