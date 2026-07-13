/**
 * Velvet Rope — Single-Symbol Evaluation Page (Thin Slice)
 *
 * Evaluates one ETF against the fixed admission policy, records audit,
 * and explains the result with full evidence breakdown.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { TradierProvider } from "../providers/tradier/TradierProvider";
import { MockMarketDataProvider } from "../providers/mock/MockMarketDataProvider";
import { isTradierConfigured, requireTradierConfig } from "../config/tradier";
import { evaluateSymbolAdmission } from "../velvet-rope/evaluate";
import { DEFAULT_ADMISSION_POLICY } from "../velvet-rope/policy";
import { LocalStorageVelvetRopeStore, appendAuditRecord, getAuditHistory } from "../velvet-rope/persistence";
import { synthesizeNarrative } from "../velvet-rope/narrative";
import type { AdmissionAuditRecord, VelvetRopeState, CriterionResult, OptionSideEvidence } from "../velvet-rope/types";
import type { MarketDataProvider } from "../domain/provider";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";

// --- Provider singleton ---

const providerInstances: Record<string, MarketDataProvider> = {};
function getProvider(key: string): MarketDataProvider {
  if (!providerInstances[key]) {
    if (key === "tradier" && isTradierConfigured()) {
      providerInstances[key] = new TradierProvider(requireTradierConfig());
    } else {
      providerInstances[key] = new MockMarketDataProvider();
    }
  }
  return providerInstances[key];
}

// --- Store singleton ---

const store = new LocalStorageVelvetRopeStore();

// --- Component ---

export function VelvetRopePage() {
  const providerKey = isTradierConfigured() ? "tradier" : "mock";
  const provider = useMemo(() => getProvider(providerKey), [providerKey]);

  const [symbol, setSymbol] = useState("XLK");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<VelvetRopeState>(() => store.load());
  const [latestResult, setLatestResult] = useState<AdmissionAuditRecord | null>(null);

  // Consume pending Velvet Rope intent from SEC Explorer
  const pendingConsumed = useRef(false);
  useEffect(() => {
    if (pendingConsumed.current) return;
    const ws = loadWorkspace();
    if (ws.pendingVelvetRopeSymbol) {
      pendingConsumed.current = true;
      const pendingSymbol = ws.pendingVelvetRopeSymbol;
      setSymbol(pendingSymbol);
      // Clear the intent
      updateWorkspace({ pendingVelvetRopeSymbol: null });
      // Auto-evaluate
      (async () => {
        setLoading(true);
        const record = await evaluateSymbolAdmission(pendingSymbol.trim().toUpperCase(), provider, DEFAULT_ADMISSION_POLICY);
        const currentState = store.load();
        const newState = appendAuditRecord(currentState, record);
        setState(newState);
        store.save(newState);
        setLatestResult(record);
        setLoading(false);
      })();
    }
  }, [provider]);

  const auditHistory = useMemo(() => getAuditHistory(state, symbol), [state, symbol]);

  const handleEvaluate = useCallback(async () => {
    setLoading(true);
    const record = await evaluateSymbolAdmission(symbol.trim().toUpperCase(), provider, DEFAULT_ADMISSION_POLICY);
    const newState = appendAuditRecord(state, record);
    setState(newState);
    store.save(newState);
    setLatestResult(record);
    setLoading(false);
  }, [symbol, provider, state]);

  return (
    <div className="vr-page">
      <header className="vr-header">
        <h2>Velvet Rope</h2>
        <span className="console-badge" style={{ background: "#2d3a4e", color: "#7ec8e3" }}>
          {providerKey === "tradier" ? "Tradier Sandbox" : "Mock"} — Single Symbol
        </span>
      </header>

      {/* Policy summary */}
      <div className="vr-policy-summary">
        <h4>Active Policy: {DEFAULT_ADMISSION_POLICY.version}</h4>
        <div className="vr-policy-grid">
          <span>DTE: {DEFAULT_ADMISSION_POLICY.expirationDteRange.min}–{DEFAULT_ADMISSION_POLICY.expirationDteRange.max}</span>
          <span>Target Δ: {DEFAULT_ADMISSION_POLICY.contractSelection.targetDelta}</span>
          <span>Δ Range: {DEFAULT_ADMISSION_POLICY.contractSelection.deltaRange.min}–{DEFAULT_ADMISSION_POLICY.contractSelection.deltaRange.max}</span>
          <span>Sides: {DEFAULT_ADMISSION_POLICY.sideRequirement}</span>
          <span>OI ≥ {DEFAULT_ADMISSION_POLICY.minOpenInterest.value} (hard)</span>
          <span>Spread ≤ {DEFAULT_ADMISSION_POLICY.maxBidAskSpreadPercent.value}% (hard)</span>
          <span>Capital: ${DEFAULT_ADMISSION_POLICY.minCapitalPerContract.value?.toLocaleString()}–${DEFAULT_ADMISSION_POLICY.maxCapitalPerContract.value?.toLocaleString()}</span>
          <span>Yield ≥ {DEFAULT_ADMISSION_POLICY.minYieldAtTargetDelta.value}% (soft)</span>
          <span>Near-miss: {DEFAULT_ADMISSION_POLICY.nearMissPercent}%</span>
        </div>
      </div>

      {/* Evaluation input */}
      <div className="vr-evaluate-bar">
        <label>
          Symbol:
          <input
            type="text"
            className="vr-input"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
          />
        </label>
        <button className="vr-evaluate-btn" onClick={handleEvaluate} disabled={loading || !symbol.trim()}>
          {loading ? "Evaluating..." : "Evaluate"}
        </button>
      </div>

      {/* Latest result */}
      {latestResult && (() => {
        const narrative = synthesizeNarrative(latestResult);
        return (
        <div className="vr-result">
          <div className="vr-result-header">
            <h3>{latestResult.symbol}</h3>
            <OutcomeBadge outcome={latestResult.outcome} attemptStatus={latestResult.attemptStatus} />
            <span className={`vr-confidence vr-confidence-${narrative.confidence}`}>
              {narrative.confidence} confidence
            </span>
          </div>

          {/* Diagnostic Summary (VR-22) */}
          <p className="vr-narrative-summary">{narrative.summary}</p>

          {narrative.primaryReasons.length > 0 && (
            <div className="vr-narrative-reasons">
              <h4>Primary Reasons</h4>
              <ul>
                {narrative.primaryReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {narrative.strengths.length > 0 && (
            <div className="vr-narrative-strengths">
              <h4>What Looked Good</h4>
              <ul>
                {narrative.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {narrative.cautions.length > 0 && (
            <div className="vr-narrative-cautions">
              <h4>Cautions</h4>
              <ul>
                {narrative.cautions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {/* Detailed Evidence (progressive disclosure) */}
          <details className="vr-evidence-details">
            <summary>Evaluation Details</summary>

            {/* Expiration */}
            <div className="vr-section">
              <h4>Expiration Selection</h4>
              <p className="vr-detail">
                {latestResult.expirationSelection.status === "selected"
                  ? `${latestResult.expirationSelection.selectedDate} (${latestResult.expirationSelection.selectedDte} DTE) — ${latestResult.expirationSelection.availableCount} available`
                  : `No usable expiration (${latestResult.expirationSelection.availableCount} available, range ${latestResult.expirationSelection.searchRange.min}–${latestResult.expirationSelection.searchRange.max})`
                }
              </p>
            </div>

          {/* Side evidence */}
          <div className="vr-sides">
            <SidePanel evidence={latestResult.callEvidence} />
            <SidePanel evidence={latestResult.putEvidence} />
          </div>

          {/* Cross-side criteria */}
          {latestResult.aggregatedCriteria.length > 0 && (
            <div className="vr-section">
              <h4>Cross-Side Criteria</h4>
              <CriteriaTable criteria={latestResult.aggregatedCriteria} />
            </div>
          )}

          {/* Provenance */}
          <div className="vr-section vr-provenance">
            <h4>Evidence Provenance</h4>
            <p className="vr-detail">
              Provider: {latestResult.evidenceProvenance.provider} |
              Source: {latestResult.evidenceProvenance.source} |
              {latestResult.evidenceProvenance.cacheAgeSeconds != null && ` Cache age: ${latestResult.evidenceProvenance.cacheAgeSeconds}s |`}
              {latestResult.evidenceProvenance.delayedData && " 15-min delayed |"}
              Retrieved: {new Date(latestResult.evidenceProvenance.retrievedAt).toLocaleTimeString()}
            </p>
          </div>
          </details>
        </div>
        );
      })()}

      {/* Audit history */}
      {auditHistory.length > 0 && (
        <div className="vr-section vr-audit">
          <h4>Audit History — {symbol.toUpperCase()} ({auditHistory.length} {auditHistory.length === 1 ? "record" : "records"})</h4>
          <table className="options-table vr-audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Outcome</th>
                <th>Explanation</th>
                <th>Policy</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {auditHistory.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.attemptedAt).toLocaleString()}</td>
                  <td><span className={`vr-badge vr-badge-${record.attemptStatus}`}>{record.attemptStatus}</span></td>
                  <td>{record.outcome ? <OutcomeBadge outcome={record.outcome} attemptStatus={record.attemptStatus} /> : "—"}</td>
                  <td className="vr-audit-explanation">{record.explanation.slice(0, 80)}{record.explanation.length > 80 ? "..." : ""}</td>
                  <td>{record.policySnapshot.version}</td>
                  <td>{record.evidenceProvenance.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function OutcomeBadge({ outcome, attemptStatus }: { outcome: string | null; attemptStatus: string }) {
  if (attemptStatus === "provider_failed") {
    return <span className="vr-badge vr-badge-failed">provider failed</span>;
  }
  if (!outcome) return <span className="vr-badge">—</span>;
  return <span className={`vr-badge vr-badge-${outcome}`}>{outcome}</span>;
}

function SidePanel({ evidence }: { evidence: OptionSideEvidence }) {
  return (
    <div className="vr-side-panel">
      <h4>{evidence.side === "call" ? "Call Side" : "Put Side"}</h4>
      {evidence.selectionStatus !== "selected" ? (
        <p className="vr-detail vr-unavailable">Contract unavailable: {evidence.selectionStatus.replace(/_/g, " ")}</p>
      ) : evidence.selectedContract && (
        <div>
          <table className="vr-contract-table">
            <tbody>
              <tr><td>Strike</td><td>${evidence.selectedContract.strike}</td></tr>
              <tr><td>Delta</td><td>{evidence.selectedContract.delta.toFixed(3)}</td></tr>
              <tr><td>Bid / Ask</td><td>${evidence.selectedContract.bid.toFixed(2)} / ${evidence.selectedContract.ask.toFixed(2)}</td></tr>
              <tr><td>Mid</td><td>${evidence.selectedContract.mid.toFixed(2)}</td></tr>
              <tr><td>Spread</td><td>{evidence.selectedContract.spreadPercent.toFixed(1)}%</td></tr>
              <tr><td>OI</td><td>{evidence.selectedContract.openInterest.toLocaleString()}</td></tr>
              <tr><td>Volume</td><td>{evidence.selectedContract.volume.toLocaleString()}</td></tr>
              <tr><td>IV</td><td>{evidence.selectedContract.iv != null ? `${(evidence.selectedContract.iv * 100).toFixed(0)}%` : "—"}</td></tr>
              <tr><td>Yield</td><td>{evidence.selectedContract.annualizedYield.toFixed(1)}%</td></tr>
            </tbody>
          </table>
          {evidence.criteria.length > 0 && <CriteriaTable criteria={evidence.criteria} />}
        </div>
      )}
    </div>
  );
}

function CriteriaTable({ criteria }: { criteria: CriterionResult[] }) {
  return (
    <table className="vr-criteria-table">
      <tbody>
        {criteria.map((cr, i) => (
          <tr key={i} className={`vr-criterion-${cr.status}`}>
            <td className="vr-criterion-status">
              {cr.status === "pass" ? "✓" : cr.status === "fail" ? "✗" : cr.status === "near_miss" ? "≈" : "?"}
            </td>
            <td className="vr-criterion-name">{cr.criterion}</td>
            <td className="vr-criterion-value">{cr.measuredValue ?? "—"}</td>
            <td className="vr-criterion-threshold">{cr.severity === "observational" ? "(obs)" : `vs ${cr.threshold}`}</td>
            <td className="vr-criterion-severity">{cr.severity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
