/**
 * ReferenceDataView — displays curated reference fixtures captured from reality.
 *
 * Layout: 3-column
 *   Left: Highlighted Call metrics (fixed height)
 *   Center: Accordion of all expirations, scrollable, height-matched to sidebars
 *   Right: Highlighted Put metrics (fixed height)
 *
 * The accordion replaces the expiration dropdown — all expirations are
 * visible as collapsible sections with date headers.
 */

import { useState, useEffect } from "react";
import { useOptionsChain } from "../hooks/useOptionsChain";
import { useTargetDelta } from "../hooks/useTargetDelta";
import { findClosestToDelta } from "../domain/delta";
import { MockMarketDataProvider } from "../providers/mock/MockMarketDataProvider";
import { DeltaInput } from "./DeltaInput";
import { OptionsTable } from "./OptionsTable";
import { MetricsPanel } from "./MetricsPanel";
import type { DeltaTieBreaker } from "../domain/policy";
import type { Expiration, OptionsChain } from "../domain/types";

const provider = new MockMarketDataProvider();

const TIE_BREAKER_OPTIONS: DeltaTieBreaker[] = [
  "PreferOTM",
  "PreferITM",
  "PreferHigherStrike",
  "PreferLowerStrike",
];

interface ChainsByExpiration {
  expiration: Expiration;
  chain: OptionsChain;
}

function formatExpirationHeader(exp: Expiration): string {
  const date = new Date(exp.date + "T00:00:00");
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year} — ${exp.dte} DTE`;
}

export function ReferenceDataView() {
  const { state, selectUnderlying } = useOptionsChain(provider);
  const { policy, setTargetDelta, setTieBreaker } = useTargetDelta();
  const [chains, setChains] = useState<ChainsByExpiration[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [activeDate, setActiveDate] = useState<string>("");

  // Default to XLE on mount
  useEffect(() => {
    if (
      state.underlyings.length > 0 &&
      state.selectedSymbol !== "XLE" &&
      !state.loading
    ) {
      selectUnderlying("XLE");
    }
  }, [state.underlyings, state.selectedSymbol, state.loading, selectUnderlying]);

  // Load all chains for all expirations
  useEffect(() => {
    if (state.expirations.length === 0) return;

    async function loadAll() {
      const results: ChainsByExpiration[] = [];
      for (const exp of state.expirations) {
        const chain = await provider.getOptionsChain(state.selectedSymbol, exp.date);
        results.push({ expiration: exp, chain });
      }
      setChains(results);
      // Expand first expiration by default
      if (results.length > 0) {
        setExpandedDates(new Set([results[0].expiration.date]));
        setActiveDate(results[0].expiration.date);
      }
    }

    loadAll();
  }, [state.expirations, state.selectedSymbol]);

  // Find highlighted contracts for the active (expanded) expiration
  const activeChainData = chains.find((c) => c.expiration.date === activeDate);
  const highlightedCall = activeChainData
    ? findClosestToDelta(activeChainData.chain.calls, policy.targetDelta, policy.tieBreaker)
    : null;
  const highlightedPut = activeChainData
    ? findClosestToDelta(activeChainData.chain.puts, policy.targetDelta, policy.tieBreaker)
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

  return (
    <div className="reference-view">
      <header className="reference-header">
        <div className="reference-title-row">
          <h2>Reference Data</h2>
          <span className="console-badge reference-badge">Fidelity Capture</span>
          <div className="reference-controls-inline">
            <DeltaInput value={policy.targetDelta} onChange={setTargetDelta} />
            <div className="control-group">
              <label className="control-label">
                Tie-Breaker:
                <select
                  value={policy.tieBreaker}
                  onChange={(e) => setTieBreaker(e.target.value as DeltaTieBreaker)}
                  className="control-select"
                >
                  {TIE_BREAKER_OPTIONS.map((tb) => (
                    <option key={tb} value={tb}>{tb}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
        <div className="reference-provenance">
          <dl className="provenance-list">
            <dt>Symbol</dt>
            <dd>XLE — Energy Select Sector SPDR Fund</dd>
            <dt>Source</dt>
            <dd>Fidelity Investments</dd>
            <dt>Quote Time</dt>
            <dd>2026-07-02 4:10 PM ET</dd>
            <dt>Underlying</dt>
            <dd>${activeChainData?.chain.underlying.price.toFixed(2) ?? "—"}</dd>
          </dl>
        </div>
      </header>

      {/* Status */}
      {loading && <p className="reference-status status-loading">Loading reference data...</p>}
      {error && <p className="reference-status status-error">Error: {error}</p>}

      {/* 3-column layout: Call Metrics | Accordion Chain | Put Metrics */}
      {chains.length > 0 && !loading && (
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
                          contracts={chain.calls}
                          underlyingPrice={chain.underlying.price}
                          highlightedStrike={callHighlight}
                          sortDirection="asc"
                          title="Calls"
                        />
                        <OptionsTable
                          contracts={chain.puts}
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
