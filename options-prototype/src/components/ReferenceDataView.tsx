/**
 * ReferenceDataView — displays options chain data from selectable providers.
 *
 * Layout: 3-column
 *   Left: Highlighted Call metrics (fixed height)
 *   Center: Accordion of all expirations, scrollable, height-matched to sidebars
 *   Right: Highlighted Put metrics (fixed height)
 *
 * Provider selector allows switching between:
 *   - Mock (reference fixtures)
 *   - Tradier Sandbox (live delayed data)
 *   - Massive (future, currently gated)
 *
 * The same UI components, hooks, and domain logic operate regardless of provider.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useOptionsChain } from "../hooks/useOptionsChain";
import { findClosestToDelta } from "../domain/delta";
import { UnderlyingSelector } from "./UnderlyingSelector";
import { OptionsTable } from "./OptionsTable";
import { MetricsPanel } from "./MetricsPanel";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import { getProvider as getSharedProvider, isTradierConfigured } from "../providers";
import type { MarketDataProvider } from "../domain/provider";
import type { DeltaTieBreaker } from "../domain/policy";
import type { Expiration, OptionsChain as OptionsChainType, OptionContract } from "../domain/types";

// --- Provider Registry ---

type ProviderKey = "mock" | "tradier";

interface ProviderOption {
  key: ProviderKey;
  label: string;
  badge: string;
  available: boolean;
}

function getProvider(key: ProviderKey): MarketDataProvider {
  return getSharedProvider(key);
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { key: "mock", label: "Mock", badge: "Reference Fixtures", available: true },
  { key: "tradier", label: "Tradier (via backend)", badge: "Live Delayed", available: isTradierConfigured() },
];

// --- Component ---

const TIE_BREAKER_OPTIONS: DeltaTieBreaker[] = [
  "PreferOTM",
  "PreferITM",
  "PreferHigherStrike",
  "PreferLowerStrike",
];

interface ChainsByExpiration {
  expiration: Expiration;
  chain: OptionsChainType;
}

function formatExpirationHeader(exp: Expiration): string {
  const date = new Date(exp.date + "T00:00:00");
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year} — ${exp.dte} DTE`;
}

/**
 * Filter contracts to N strikes centered around ATM.
 * Returns all if count is 0.
 */
function filterStrikes(
  contracts: OptionContract[],
  underlyingPrice: number,
  count: number
): OptionContract[] {
  if (count === 0 || contracts.length <= count) return contracts;

  // Sort by strike to find ATM center
  const sorted = [...contracts].sort((a, b) => a.strike - b.strike);

  // Find the index closest to the underlying price
  let atmIndex = 0;
  let minDist = Math.abs(sorted[0].strike - underlyingPrice);
  for (let i = 1; i < sorted.length; i++) {
    const dist = Math.abs(sorted[i].strike - underlyingPrice);
    if (dist < minDist) {
      minDist = dist;
      atmIndex = i;
    }
  }

  // Take count strikes centered around ATM
  const half = Math.floor(count / 2);
  let start = Math.max(0, atmIndex - half);
  let end = start + count;
  if (end > sorted.length) {
    end = sorted.length;
    start = Math.max(0, end - count);
  }

  return sorted.slice(start, end);
}

export function ReferenceDataView() {
  const [ws] = useState(() => loadWorkspace());

  const [providerKey, setProviderKey] = useState<ProviderKey>(ws.chainProviderKey as ProviderKey || "mock");
  const provider = useMemo(() => getProvider(providerKey), [providerKey]);

  const activeProviderOption = PROVIDER_OPTIONS.find((p) => p.key === providerKey)!;

  const { state, selectUnderlying } = useOptionsChain(provider, { initialSymbol: ws.chainSymbol });
  const [callDelta, setCallDelta] = useState(ws.chainCallDelta);
  const [putDelta, setPutDelta] = useState(ws.chainPutDelta);
  const [tieBreaker, setTieBreaker] = useState<DeltaTieBreaker>(ws.chainTieBreaker);
  const [chains, setChains] = useState<ChainsByExpiration[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [activeDate, setActiveDate] = useState<string>("");
  const [chainsLoading, setChainsLoading] = useState(false);
  const [strikesCount, setStrikesCount] = useState(ws.chainStrikesCount);
  const [maxDte, setMaxDte] = useState(ws.chainMaxDte);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Persist helpers
  const persistProvider = useCallback((key: ProviderKey) => { setProviderKey(key); updateWorkspace({ chainProviderKey: key }); }, []);
  const persistCallDelta = useCallback((v: number) => { if (v >= 0.01 && v <= 0.99) { setCallDelta(v); updateWorkspace({ chainCallDelta: v }); } }, []);
  const persistPutDelta = useCallback((v: number) => { if (v >= 0.01 && v <= 0.99) { setPutDelta(v); updateWorkspace({ chainPutDelta: v }); } }, []);
  const persistTieBreaker = useCallback((tb: DeltaTieBreaker) => { setTieBreaker(tb); updateWorkspace({ chainTieBreaker: tb }); }, []);
  const persistStrikes = useCallback((n: number) => { setStrikesCount(n); updateWorkspace({ chainStrikesCount: n }); }, []);
  const persistMaxDte = useCallback((n: number) => { setMaxDte(n); updateWorkspace({ chainMaxDte: n }); }, []);
  const persistUnderlying = useCallback((symbol: string) => { selectUnderlying(symbol); updateWorkspace({ chainSymbol: symbol }); }, [selectUnderlying]);

  // Set default underlying once on mount or provider change (not on every symbol update)
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Reset initialization when provider changes
    setHasInitialized(false);
  }, [providerKey]);

  useEffect(() => {
    if (hasInitialized) return;
    if (state.underlyings.length === 0 || state.loading) return;

    const defaultSymbol = providerKey === "mock" ? "XLE" : "SPY";
    if (state.selectedSymbol !== defaultSymbol) {
      selectUnderlying(defaultSymbol);
    }
    setHasInitialized(true);
  }, [state.underlyings, state.selectedSymbol, state.loading, providerKey, selectUnderlying, hasInitialized]);

  // Load chains for available expirations filtered by max DTE
  useEffect(() => {
    if (state.expirations.length === 0 || !state.selectedSymbol) return;

    let cancelled = false;
    const expsToLoad = maxDte === 0
      ? state.expirations
      : state.expirations.filter((exp) => exp.dte <= maxDte);

    async function loadAll() {
      setChainsLoading(true);
      const results: ChainsByExpiration[] = [];
      for (const exp of expsToLoad) {
        if (cancelled) return;
        try {
          const chain = await provider.getOptionsChain(state.selectedSymbol, exp.date);
          results.push({ expiration: exp, chain });
        } catch {
          // Skip failed expirations
        }
      }
      if (cancelled) return;
      setChains(results);
      setChainsLoading(false);
      if (results.length > 0) {
        setExpandedDates(new Set([results[0].expiration.date]));
        setActiveDate(results[0].expiration.date);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [state.expirations, state.selectedSymbol, provider, providerKey, maxDte, refreshTrigger]);

  // Data quality check — consider greeks available if ANY loaded chain has them
  const activeChainData = chains.find((c) => c.expiration.date === activeDate);
  const anyGreeksAvailable = chains.some((c) => c.chain.dataQuality?.greeksAvailable === true);
  const greeksAvailable = anyGreeksAvailable || (activeChainData?.chain.dataQuality?.greeksAvailable ?? true);
  const dataLimitations = !greeksAvailable ? (activeChainData?.chain.dataQuality?.limitations ?? "Greeks unavailable for this expiration.") : undefined;

  // Find highlighted contracts — only meaningful when Greeks are available
  const highlightedCall = (activeChainData && greeksAvailable)
    ? findClosestToDelta(activeChainData.chain.calls, callDelta, tieBreaker)
    : null;
  const highlightedPut = (activeChainData && greeksAvailable)
    ? findClosestToDelta(activeChainData.chain.puts, putDelta, tieBreaker)
    : null;

  function toggleExpiration(date: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
    setActiveDate(date);
  }

  const { loading, error } = state;
  const isLoading = loading || chainsLoading;

  return (
    <div className="reference-view">
      <header className="reference-header">
        <div className="reference-title-row">
          <h2>Options Chain</h2>
          <span className={`console-badge ${providerKey === "mock" ? "reference-badge" : "tradier-badge"}`}>
            {activeProviderOption.badge}
          </span>
          <div className="reference-controls-inline">
            {/* Provider selector */}
            <div className="control-group">
              <label className="control-label">
                Provider:
                <select
                  value={providerKey}
                  onChange={(e) => {
                    setChains([]);
                    persistProvider(e.target.value as ProviderKey);
                  }}
                  className="control-select"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.key} value={p.key} disabled={!p.available}>
                      {p.label}{!p.available ? " (no key)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Underlying selector */}
            {state.underlyings.length > 0 && (
              <UnderlyingSelector
                underlyings={state.underlyings}
                selected={state.selectedSymbol}
                onSelect={persistUnderlying}
              />
            )}

            <div className="control-group">
              <label className="control-label">
                Call Δ:
                <input type="number" min={0.01} max={0.99} step={0.01} value={callDelta}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) persistCallDelta(v); }}
                  className="control-input" />
              </label>
            </div>
            <div className="control-group">
              <label className="control-label">
                Put Δ:
                <input type="number" min={0.01} max={0.99} step={0.01} value={putDelta}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) persistPutDelta(v); }}
                  className="control-input" />
              </label>
            </div>
            <div className="control-group">
              <label className="control-label">
                Tie-Breaker:
                <select
                  value={tieBreaker}
                  onChange={(e) => persistTieBreaker(e.target.value as DeltaTieBreaker)}
                  className="control-select"
                >
                  {TIE_BREAKER_OPTIONS.map((tb) => (
                    <option key={tb} value={tb}>{tb}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="control-group">
              <label className="control-label">
                Strikes:
                <select
                  value={strikesCount}
                  onChange={(e) => persistStrikes(Number(e.target.value))}
                  className="control-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={0}>All</option>
                </select>
              </label>
            </div>
            <div className="control-group">
              <label className="control-label">
                Max DTE:
                <select
                  value={maxDte}
                  onChange={(e) => persistMaxDte(Number(e.target.value))}
                  className="control-select"
                >
                  <option value={7}>7</option>
                  <option value={14}>14</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
                  <option value={90}>90</option>
                  <option value={180}>180</option>
                  <option value={365}>365</option>
                  <option value={0}>Max</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        <div className="reference-provenance">
          <dl className="provenance-list">
            <dt>Symbol</dt>
            <dd>{state.selectedSymbol || "—"}</dd>
            <dt>Provider</dt>
            <dd>{activeProviderOption.label}</dd>
            <dt>Underlying</dt>
            <dd>${activeChainData?.chain.underlying.price.toFixed(2) ?? "—"}</dd>
            <dt>Expirations</dt>
            <dd>{chains.length} loaded</dd>
            {providerKey === "mock" && (
              <>
                <dt>Source</dt>
                <dd>{state.selectedSymbol === "XLE" ? "Fidelity 2026-07-02" : "Synthetic fixture"}</dd>
              </>
            )}
            {providerKey === "tradier" && (
              <>
                <dt>Data</dt>
                <dd>15-min delayed (sandbox)</dd>
                <dt>Source</dt>
                <dd>{activeChainData?.chain.dataQuality?.dataSource === "cache"
                  ? `Cache (${activeChainData.chain.dataQuality.cacheAgeSeconds ?? 0}s old)`
                  : "API (fresh)"}</dd>
                <dt>Greeks</dt>
                <dd className={greeksAvailable ? "" : "quality-degraded"}>
                  {greeksAvailable ? "Available" : "Unavailable — delta recommendations disabled"}
                </dd>
              </>
            )}
          </dl>
          {providerKey === "tradier" && (
            <button
              className="rec-evidence-toggle"
              style={{ marginLeft: 12 }}
              onClick={() => {
                setRefreshTrigger((n) => n + 1);
              }}
            >
              Refresh Data
            </button>
          )}
        </div>
      </header>

      {/* Status */}
      {isLoading && <p className="reference-status status-loading">Loading from {activeProviderOption.label}...</p>}
      {error && <p className="reference-status status-error">Error: {error}</p>}
      {!isLoading && !greeksAvailable && dataLimitations && (
        <p className="reference-status status-warning">
          {dataLimitations} Delta-based contract highlighting is disabled.
        </p>
      )}

      {/* 3-column layout: Call Metrics | Accordion Chain | Put Metrics */}
      {chains.length > 0 && !isLoading && (
        <div className="reference-content">
          <div className="reference-metrics-left">
            <MetricsPanel
              contract={highlightedCall}
              underlyingPrice={activeChainData?.chain.underlying.price ?? 0}
              dte={activeChainData?.expiration.dte ?? 0}
              label="Highlighted Call"
            />
          </div>

          <div className="reference-accordion">
            {chains.map(({ expiration, chain }) => {
              const isExpanded = expandedDates.has(expiration.date);
              const isActive = activeDate === expiration.date;
              const callHighlight = isActive ? highlightedCall?.strike ?? null : null;
              const putHighlight = isActive ? highlightedPut?.strike ?? null : null;

              return (
                <div
                  key={expiration.date}
                  className={`accordion-section ${isActive ? "accordion-active" : ""}`}
                >
                  <button
                    className="accordion-header"
                    onClick={() => toggleExpiration(expiration.date)}
                    aria-expanded={isExpanded}
                  >
                    <span className="accordion-arrow">{isExpanded ? "▼" : "▶"}</span>
                    <span className="accordion-date">{formatExpirationHeader(expiration)}</span>
                    <span className="accordion-count">
                      {chain.calls.length}C / {chain.puts.length}P
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="accordion-body">
                      <div className="accordion-tables">
                        <OptionsTable
                          contracts={filterStrikes(chain.calls, chain.underlying.price, strikesCount)}
                          underlyingPrice={chain.underlying.price}
                          highlightedStrike={callHighlight}
                          sortDirection="asc"
                          title="Calls"
                        />
                        <OptionsTable
                          contracts={filterStrikes(chain.puts, chain.underlying.price, strikesCount)}
                          underlyingPrice={chain.underlying.price}
                          highlightedStrike={putHighlight}
                          sortDirection="desc"
                          title="Puts"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="reference-metrics-right">
            <MetricsPanel
              contract={highlightedPut}
              underlyingPrice={activeChainData?.chain.underlying.price ?? 0}
              dte={activeChainData?.expiration.dte ?? 0}
              label="Highlighted Put"
            />
          </div>
        </div>
      )}
    </div>
  );
}
