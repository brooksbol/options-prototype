/**
 * MassiveChainView — spike-quality feature page displaying a real options chain
 * from the Massive (Polygon.io) API.
 *
 * This is a bounded exploration component. It validates:
 *   - Real API call from browser
 *   - JSON → canonical domain type mapping
 *   - Existing OptionsTable/MetricsPanel with real data
 *   - Delta matching + policy with real deltas
 *
 * Not production-grade. Acceptable for spike validation.
 */

import { useState, useEffect } from "react";
import { fetchAndMapChain } from "../providers/massive/massiveClient";
import { findClosestToDelta } from "../domain/delta";
import { DEFAULT_DELTA_POLICY, type DeltaTieBreaker } from "../domain/policy";
import type { OptionsChain } from "../domain/types";
import { OptionsTable } from "./OptionsTable";
import { MetricsPanel } from "./MetricsPanel";
import { DeltaInput } from "./DeltaInput";

const TIE_BREAKER_OPTIONS: DeltaTieBreaker[] = [
  "PreferOTM",
  "PreferITM",
  "PreferHigherStrike",
  "PreferLowerStrike",
];

interface FetchState {
  loading: boolean;
  error: string | null;
  chain: OptionsChain | null;
  rawCount: number;
  mappedCount: number;
}

export function MassiveChainView() {
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: true,
    error: null,
    chain: null,
    rawCount: 0,
    mappedCount: 0,
  });
  const [targetDelta, setTargetDelta] = useState(DEFAULT_DELTA_POLICY.targetDelta);
  const [tieBreaker, setTieBreaker] = useState<DeltaTieBreaker>(DEFAULT_DELTA_POLICY.tieBreaker);
  const [expirationInput, setExpirationInput] = useState("");

  // Fetch on mount and when expiration changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setFetchState((s) => ({ ...s, loading: true, error: null }));

      try {
        const result = await fetchAndMapChain(
          "SPY",
          expirationInput || undefined
        );
        if (cancelled) return;

        setFetchState({
          loading: false,
          error: null,
          chain: result.chain,
          rawCount: result.rawCount,
          mappedCount: result.mappedCount,
        });
      } catch (err) {
        if (cancelled) return;
        setFetchState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [expirationInput]);

  const { loading, error, chain, rawCount, mappedCount } = fetchState;

  // Delta matching
  const highlightedCall = chain
    ? findClosestToDelta(chain.calls, targetDelta, tieBreaker)
    : null;
  const highlightedPut = chain
    ? findClosestToDelta(chain.puts, targetDelta, tieBreaker)
    : null;

  return (
    <div className="massive-chain-view">
      <header className="massive-header">
        <h2>Massive API — Live Options Chain</h2>
        <span className="console-badge">Provider Spike</span>
      </header>

      <div className="massive-controls">
        <div className="control-group">
          <label className="control-label">
            Underlying:
            <span className="underlying-fixed">SPY</span>
          </label>
        </div>

        <div className="control-group">
          <label className="control-label">
            Expiration (YYYY-MM-DD):
            <input
              type="text"
              placeholder="leave empty for all"
              value={expirationInput}
              onChange={(e) => setExpirationInput(e.target.value)}
              className="control-input"
              style={{ width: "140px" }}
            />
          </label>
        </div>

        <DeltaInput value={targetDelta} onChange={setTargetDelta} />

        <div className="control-group">
          <label className="control-label">
            Tie-Breaker:
            <select
              value={tieBreaker}
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

      {/* Status bar */}
      <div className="massive-status">
        {loading && <span className="status-loading">Loading from Massive API...</span>}
        {error && <span className="status-error">Error: {error}</span>}
        {chain && !loading && (
          <span className="status-ok">
            Fetched {rawCount} contracts from API | Mapped {mappedCount} to domain types |
            {" "}{chain.calls.length} calls, {chain.puts.length} puts |
            {" "}Underlying: ${chain.underlying.price.toFixed(2)} |
            {" "}DTE: {chain.expiration.dte}
          </span>
        )}
      </div>

      {/* Chain display */}
      {chain && !loading && (
        <div className="massive-content">
          <div className="massive-tables">
            <OptionsTable
              contracts={chain.calls}
              underlyingPrice={chain.underlying.price}
              highlightedStrike={highlightedCall?.strike ?? null}
              sortDirection="asc"
              title="Calls"
            />
            <OptionsTable
              contracts={chain.puts}
              underlyingPrice={chain.underlying.price}
              highlightedStrike={highlightedPut?.strike ?? null}
              sortDirection="desc"
              title="Puts"
            />
          </div>

          <div className="massive-metrics">
            <MetricsPanel
              contract={highlightedCall}
              underlyingPrice={chain.underlying.price}
              dte={chain.expiration.dte}
              label="Highlighted Call"
            />
            <MetricsPanel
              contract={highlightedPut}
              underlyingPrice={chain.underlying.price}
              dte={chain.expiration.dte}
              label="Highlighted Put"
            />
          </div>
        </div>
      )}
    </div>
  );
}
