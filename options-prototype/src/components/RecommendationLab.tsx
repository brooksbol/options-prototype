/**
 * RecommendationLab — recommendation-first UX experiment.
 *
 * Information hierarchy:
 *   1. Recommendation (what the system suggests)
 *   2. Policy (what the user controls)
 *   3. Evidence (compact view around the recommendation)
 *   4. Diagnostics (provider status, data quality)
 *
 * Key design decisions:
 *   - Separate call and put target deltas (different income strategies)
 *   - Evidence shows only ±5 strikes around recommendation, not full chain
 *   - Full chain inspection available on the Options Chain page
 */

import { useState, useMemo, useCallback } from "react";
import { useOptionsChain } from "../hooks/useOptionsChain";
import { findClosestToDelta } from "../domain/delta";
import {
  midPrice,
  premiumPerContract,
  annualizedYield,
  moneyness,
  assignmentProbability,
} from "../domain/calculations";
import { MockMarketDataProvider } from "../providers/mock/MockMarketDataProvider";
import { TradierProvider } from "../providers/tradier/TradierProvider";
import { isTradierConfigured, requireTradierConfig } from "../config/tradier";
import { UnderlyingSelector } from "./UnderlyingSelector";
import { OptionsTable } from "./OptionsTable";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import type { MarketDataProvider } from "../domain/provider";
import type { DeltaTieBreaker } from "../domain/policy";
import type { OptionContract, Expiration } from "../domain/types";

// --- Provider Registry ---

type ProviderKey = "mock" | "tradier";

const PROVIDER_OPTIONS: { key: ProviderKey; label: string; available: boolean }[] = [
  { key: "mock", label: "Mock", available: true },
  { key: "tradier", label: "Tradier Sandbox", available: isTradierConfigured() },
];

// Singleton provider instances — cache survives navigation between tabs
const providerInstances: Record<string, MarketDataProvider> = {};
function getProvider(key: ProviderKey): MarketDataProvider {
  if (!providerInstances[key]) {
    if (key === "tradier" && isTradierConfigured()) {
      providerInstances[key] = new TradierProvider(requireTradierConfig());
    } else {
      providerInstances[key] = new MockMarketDataProvider();
    }
  }
  return providerInstances[key];
}

const TIE_BREAKER_OPTIONS: DeltaTieBreaker[] = ["PreferOTM", "PreferITM", "PreferHigherStrike", "PreferLowerStrike"];

// --- Evidence: filter to N strikes around a target strike ---

function evidenceWindow(
  contracts: OptionContract[],
  targetStrike: number | null,
  windowSize: number
): OptionContract[] {
  if (!targetStrike || contracts.length === 0) return contracts.slice(0, windowSize * 2);

  const sorted = [...contracts].sort((a, b) => a.strike - b.strike);
  const targetIdx = sorted.findIndex((c) => c.strike === targetStrike);
  if (targetIdx === -1) return sorted.slice(0, windowSize * 2);

  const start = Math.max(0, targetIdx - windowSize);
  const end = Math.min(sorted.length, targetIdx + windowSize + 1);
  return sorted.slice(start, end);
}

// --- Recommendation Card ---

interface RecommendationProps {
  label: string;
  contract: OptionContract | null;
  underlyingPrice: number;
  dte: number;
  targetDelta: number;
  tieBreaker: DeltaTieBreaker;
}

function RecommendationCard({ label, contract, underlyingPrice, dte, targetDelta, tieBreaker }: RecommendationProps) {
  if (!contract) {
    return (
      <div className="rec-card rec-card-empty">
        <h3 className="rec-card-title">{label}</h3>
        <p className="rec-card-empty-msg">No recommendation available</p>
      </div>
    );
  }

  const mid = midPrice(contract.bid, contract.ask);
  const premium = premiumPerContract(mid);
  const collateral = contract.type === "CALL" ? underlyingPrice : contract.strike;
  const yield_ = annualizedYield(mid, collateral, dte);
  const mny = moneyness(contract.strike, underlyingPrice, contract.type);
  const assignProb = assignmentProbability(contract.delta);
  const deltaDiff = Math.abs(Math.abs(contract.delta) - targetDelta);

  const formatStrike = (s: number) => s % 1 === 0 ? `$${s}` : `$${s.toFixed(1)}`;

  return (
    <div className="rec-card">
      <h3 className="rec-card-title">{label}</h3>
      <div className="rec-card-hero">
        <div className="rec-card-contract">{formatStrike(contract.strike)} {contract.type}</div>
        <div className="rec-card-yield">{yield_.toFixed(1)}%<span className="rec-card-yield-label"> ann.</span></div>
      </div>

      <dl className="rec-card-metrics">
        <dt>Delta</dt>
        <dd>{Math.abs(contract.delta).toFixed(3)}</dd>
        <dt>Mid</dt>
        <dd>${mid.toFixed(2)}</dd>
        <dt>Premium</dt>
        <dd>${premium.toFixed(0)}</dd>
        <dt>Moneyness</dt>
        <dd>{mny}</dd>
        <dt>Assignment</dt>
        <dd>{(assignProb * 100).toFixed(0)}%</dd>
        <dt>Collateral</dt>
        <dd>${collateral.toFixed(0)}</dd>
      </dl>

      <div className="rec-card-rationale">
        <h4>Why this contract</h4>
        <dl className="rec-card-rationale-list">
          <dt>Target Δ</dt>
          <dd>{targetDelta.toFixed(2)}</dd>
          <dt>Actual Δ</dt>
          <dd>{Math.abs(contract.delta).toFixed(3)}</dd>
          <dt>Distance</dt>
          <dd>{deltaDiff.toFixed(4)}</dd>
          <dt>Policy</dt>
          <dd>{tieBreaker}</dd>
        </dl>
      </div>
    </div>
  );
}

// --- Main Component ---

export function RecommendationLab() {
  // Load persisted workspace once on mount
  const [workspace] = useState(() => loadWorkspace());

  const [providerKey, setProviderKey] = useState<ProviderKey>(() => {
    const saved = workspace.providerKey as ProviderKey;
    if (saved === "tradier" && !isTradierConfigured()) return "mock";
    return saved ?? (isTradierConfigured() ? "tradier" : "mock");
  });

  const provider = useMemo(() => getProvider(providerKey), [providerKey]);

  const { state, selectUnderlying, selectExpiration } = useOptionsChain(provider, {
    initialSymbol: workspace.selectedSymbol,
    initialExpiration: workspace.selectedExpiration,
  });

  // Separate call and put target deltas — restored from workspace
  const [callTargetDelta, setCallTargetDelta] = useState(workspace.callTargetDelta);
  const [putTargetDelta, setPutTargetDelta] = useState(workspace.putTargetDelta);
  const [tieBreaker, setTieBreaker] = useState<DeltaTieBreaker>(workspace.tieBreaker);
  const [showFullEvidence, setShowFullEvidence] = useState(workspace.showFullEvidence);

  // Persist helpers — update workspace on every change
  const persistProvider = useCallback((key: ProviderKey) => {
    setProviderKey(key);
    updateWorkspace({ providerKey: key });
  }, []);

  const persistCallDelta = useCallback((v: number) => {
    if (v >= 0.01 && v <= 0.99) {
      setCallTargetDelta(v);
      updateWorkspace({ callTargetDelta: v });
    }
  }, []);

  const persistPutDelta = useCallback((v: number) => {
    if (v >= 0.01 && v <= 0.99) {
      setPutTargetDelta(v);
      updateWorkspace({ putTargetDelta: v });
    }
  }, []);

  const persistTieBreaker = useCallback((tb: DeltaTieBreaker) => {
    setTieBreaker(tb);
    updateWorkspace({ tieBreaker: tb });
  }, []);

  const persistShowFull = useCallback((show: boolean) => {
    setShowFullEvidence(show);
    updateWorkspace({ showFullEvidence: show });
  }, []);

  const persistUnderlying = useCallback((symbol: string) => {
    selectUnderlying(symbol);
    updateWorkspace({ selectedSymbol: symbol });
  }, [selectUnderlying]);

  const persistExpiration = useCallback((date: string) => {
    selectExpiration(date);
    updateWorkspace({ selectedExpiration: date });
  }, [selectExpiration]);

  const EVIDENCE_WINDOW = 3; // strikes above and below recommendation

  const { chain, loading, error } = state;

  // Recommendations
  const greeksAvailable = chain?.dataQuality?.greeksAvailable ?? true;
  const highlightedCall = (chain && greeksAvailable)
    ? findClosestToDelta(chain.calls, callTargetDelta, tieBreaker)
    : null;
  const highlightedPut = (chain && greeksAvailable)
    ? findClosestToDelta(chain.puts, putTargetDelta, tieBreaker)
    : null;

  // Evidence windows
  const callEvidence = chain
    ? (showFullEvidence ? chain.calls : evidenceWindow(chain.calls, highlightedCall?.strike ?? null, EVIDENCE_WINDOW))
    : [];
  const putEvidence = chain
    ? (showFullEvidence ? chain.puts : evidenceWindow(chain.puts, highlightedPut?.strike ?? null, EVIDENCE_WINDOW))
    : [];

  return (
    <div className="rec-lab">
      {/* === SECTION 1: RECOMMENDATION === */}
      <section className="rec-section rec-section-recommendation">
        <div className="rec-cards">
          <RecommendationCard
            label="Recommended Covered Call"
            contract={highlightedCall}
            underlyingPrice={chain?.underlying.price ?? 0}
            dte={chain?.expiration.dte ?? 0}
            targetDelta={callTargetDelta}
            tieBreaker={tieBreaker}
          />
          <RecommendationCard
            label="Recommended Cash-Secured Put"
            contract={highlightedPut}
            underlyingPrice={chain?.underlying.price ?? 0}
            dte={chain?.expiration.dte ?? 0}
            targetDelta={putTargetDelta}
            tieBreaker={tieBreaker}
          />
        </div>
      </section>

      {/* === SECTION 2: POLICY === */}
      <section className="rec-section rec-section-policy">
        <h2 className="rec-section-title">Policy</h2>
        <div className="rec-policy-controls">
          <div className="control-group">
            <label className="control-label">
              Provider:
              <select
                value={providerKey}
                onChange={(e) => persistProvider(e.target.value as ProviderKey)}
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

          {state.underlyings.length > 0 && (
            <UnderlyingSelector
              underlyings={state.underlyings}
              selected={state.selectedSymbol}
              onSelect={persistUnderlying}
            />
          )}

          <div className="control-group">
            <label className="control-label">
              Expiration:
              <select
                value={state.selectedExpiration}
                onChange={(e) => persistExpiration(e.target.value)}
                className="control-select"
              >
                {state.expirations.map((exp: Expiration) => {
                  const d = new Date(exp.date + "T00:00:00");
                  const lbl = `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()} (${exp.dte} DTE)`;
                  return <option key={exp.date} value={exp.date}>{lbl}</option>;
                })}
              </select>
            </label>
          </div>

          <div className="control-group">
            <label className="control-label">
              Call Δ:
              <input
                type="number"
                min={0.01}
                max={0.99}
                step={0.01}
                value={callTargetDelta}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) persistCallDelta(v);
                }}
                className="control-input"
              />
            </label>
          </div>

          <div className="control-group">
            <label className="control-label">
              Put Δ:
              <input
                type="number"
                min={0.01}
                max={0.99}
                step={0.01}
                value={putTargetDelta}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) persistPutDelta(v);
                }}
                className="control-input"
              />
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
        </div>
      </section>

      {/* === SECTION 3: EVIDENCE === */}
      <section className="rec-section rec-section-evidence">
        <div className="rec-evidence-header">
          <h2 className="rec-section-title">Nearby Alternatives</h2>
          <button
            className="rec-evidence-toggle"
            onClick={() => persistShowFull(!showFullEvidence)}
          >
            {showFullEvidence ? "Show compact" : "Show full chain"}
          </button>
        </div>
        {loading && <p className="reference-status status-loading">Loading...</p>}
        {error && <p className="reference-status status-error">Error: {error}</p>}
        {!greeksAvailable && (
          <p className="reference-status status-warning">
            Greeks unavailable — recommendations are disabled.
          </p>
        )}
        {chain && !loading && (
          <div className="rec-evidence-tables">
            <OptionsTable
              contracts={callEvidence}
              underlyingPrice={chain.underlying.price}
              highlightedStrike={highlightedCall?.strike ?? null}
              sortDirection="asc"
              title="Calls"
            />
            <OptionsTable
              contracts={putEvidence}
              underlyingPrice={chain.underlying.price}
              highlightedStrike={highlightedPut?.strike ?? null}
              sortDirection="desc"
              title="Puts"
            />
          </div>
        )}
      </section>

      {/* === SECTION 4: DIAGNOSTICS === */}
      <section className="rec-section rec-section-diagnostics">
        <div className="rec-evidence-header">
          <h2 className="rec-section-title">Diagnostics</h2>
          {providerKey === "tradier" && (
            <button
              className="rec-evidence-toggle"
              onClick={() => {
                if (provider instanceof TradierProvider) {
                  provider.refresh(state.selectedSymbol, state.selectedExpiration);
                  selectExpiration(state.selectedExpiration); // re-trigger load
                }
              }}
            >
              Refresh Data
            </button>
          )}
        </div>
        <dl className="rec-diagnostics-list">
          <dt>Provider</dt>
          <dd>{PROVIDER_OPTIONS.find((p) => p.key === providerKey)?.label}</dd>
          <dt>Data</dt>
          <dd>{providerKey === "tradier" ? "15-min delayed (sandbox)" : "Static fixture"}</dd>
          <dt>Source</dt>
          <dd>{chain?.dataQuality?.dataSource === "cache" ? `Cache (${chain.dataQuality.cacheAgeSeconds ?? 0}s old)` : "API (fresh)"}</dd>
          <dt>Underlying</dt>
          <dd>{state.selectedSymbol} — ${chain?.underlying.price.toFixed(2) ?? "—"}</dd>
          <dt>Expirations</dt>
          <dd>{state.expirations.length} available</dd>
          <dt>Greeks</dt>
          <dd className={greeksAvailable ? "" : "quality-degraded"}>
            {greeksAvailable ? "Available" : "Unavailable"}
          </dd>
          {chain?.dataQuality?.limitations && (
            <>
              <dt>Limitations</dt>
              <dd className="quality-degraded">{chain.dataQuality.limitations}</dd>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}
