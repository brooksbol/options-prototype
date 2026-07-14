/**
 * Velvet Rope — Single-Symbol Evaluation Page (Thin Slice)
 *
 * Evaluates one ETF against the fixed admission policy, records audit,
 * and explains the result with full evidence breakdown.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { evaluateSymbolAdmission } from "../velvet-rope/evaluate";
import { DEFAULT_ADMISSION_POLICY } from "../velvet-rope/policy";
import { LocalStorageVelvetRopeStore, appendAuditRecord, getAuditHistory } from "../velvet-rope/persistence";
import { synthesizeNarrative } from "../velvet-rope/narrative";
import { categorizeCriteria } from "../velvet-rope/risk-categories";
import type { AdmissionAuditRecord, VelvetRopeState, CriterionResult, OptionSideEvidence } from "../velvet-rope/types";
import { getProvider, isTradierConfigured } from "../providers";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";

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
        const riskCategories = categorizeCriteria(
          latestResult.callEvidence,
          latestResult.putEvidence,
          latestResult.aggregatedCriteria,
          latestResult.productStructure
        );
        const failingCategories = riskCategories.filter((c) => c.items.some((i) => i.criterion.status === "fail" || i.criterion.status === "near_miss"));
        const passingCategories = riskCategories.filter((c) => c.items.every((i) => i.criterion.status === "pass" || i.criterion.severity === "observational"));

        return (
        <div className="vr-result">
          {/* 1. Recommendation / Outcome */}
          <div className="vr-result-header">
            <h3>{latestResult.symbol}</h3>
            <OutcomeBadge outcome={latestResult.outcome} attemptStatus={latestResult.attemptStatus} />
            {latestResult.winningExpiration && (
              <span className="vr-winning-exp">
                {latestResult.winningExpiration.date} ({latestResult.winningExpiration.dte} DTE)
              </span>
            )}
            <span className={`vr-confidence vr-confidence-${narrative.confidence}`}>
              {narrative.confidence} confidence
            </span>
          </div>

          {/* 2. Executive Summary — use multi-expiration explanation */}
          <p className="vr-narrative-summary">{latestResult.explanation}</p>

          {/* 3. Positive Findings */}
          {narrative.strengths.length > 0 && (
            <div className="vr-positive-findings">
              {narrative.strengths.map((s, i) => {
                const isAsymmetric = s.includes("insufficient") || s.includes("required");
                return <span key={i} className={isAsymmetric ? "vr-caution-item" : "vr-positive-item"}>{isAsymmetric ? "⚠ " : "✓ "}{s}</span>;
              })}
              {!failingCategories.length && passingCategories.some((c) => c.category === "product_structure_risk") ? null : (
                latestResult.productStructure.inferenceSource === "unknown" || !latestResult.productStructure.leveraged
                  ? <span className="vr-positive-item">✓ Conventional product structure</span>
                  : null
              )}
            </div>
          )}

          {/* 4. Institutional Findings (failing categories as individual cards) */}
          {failingCategories.length > 0 && (
            <div className="vr-findings">
              {failingCategories.map((cat) => (
                <div key={cat.category} className="vr-findings-group">
                  <h4 className="vr-findings-category">{cat.categoryLabel}</h4>
                  {cat.items
                    .filter((i) => i.criterion.status !== "pass" && i.criterion.severity !== "observational")
                    .map((item, idx) => (
                      <div key={idx} className="vr-finding-card">
                        <div className="vr-finding-header">
                          <span className="vr-finding-name">{humanFindingName(item.criterion.criterion, item.criterion)}</span>
                          <span className={`vr-finding-disposition vr-finding-${item.criterion.status}`}>
                            {item.criterion.status === "fail" ? (item.criterion.severity === "hard" ? "Reject" : "Review") : "Near miss"}
                          </span>
                        </div>
                        <div className="vr-finding-body">
                          <div className="vr-finding-row">
                            <span className="vr-finding-label">Observed</span>
                            <span className="vr-finding-value">{formatMeasuredValue(item.criterion)}</span>
                          </div>
                          <div className="vr-finding-row">
                            <span className="vr-finding-label">Meaning</span>
                            <span className="vr-finding-meaning">{item.consequence.split(".")[0]}.</span>
                          </div>
                          <div className="vr-finding-row">
                            <span className="vr-finding-label">Policy</span>
                            <span className="vr-finding-value">{formatThreshold(item.criterion)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}

          {/* 5. Supporting Evidence (collapsed) */}
          <details className="vr-evidence-details">
            <summary>
              {latestResult.winningExpiration
                ? `Selected Admission Evidence — ${latestResult.expirationSelection.selectedDate} (${latestResult.expirationSelection.selectedDte} DTE)`
                : `Best Available Evidence — ${latestResult.expirationSelection.selectedDate} (${latestResult.expirationSelection.selectedDte} DTE)`
              }
            </summary>
            {!latestResult.winningExpiration && (
              <p className="vr-evidence-note">Strongest failed pair shown for diagnosis; no expiration satisfied all hard admission criteria.</p>
            )}
            {(latestResult.callEvidence.selectedContract || latestResult.putEvidence.selectedContract) && (
              <div className="vr-selection-sides" style={{ marginTop: 8 }}>
                <SelectionEvidencePanel
                  side="CALL"
                  evidence={latestResult.callEvidence}
                  expDate={latestResult.expirationSelection.selectedDate}
                  dte={latestResult.expirationSelection.selectedDte}
                  targetDelta={latestResult.policySnapshot.contractSelection.targetDelta}
                />
                <SelectionEvidencePanel
                  side="PUT"
                  evidence={latestResult.putEvidence}
                  expDate={latestResult.expirationSelection.selectedDate}
                  dte={latestResult.expirationSelection.selectedDte}
                  targetDelta={latestResult.policySnapshot.contractSelection.targetDelta}
                />
              </div>
            )}
          </details>

          {/* 5b. Expiration Evidence — all evaluated expirations */}
          {latestResult.expirationEvaluations && latestResult.expirationEvaluations.length > 1 && (
            <details className="vr-evidence-details">
              <summary>Expiration Evidence ({latestResult.expirationEvaluations.length} evaluated)</summary>
              <table className="options-table vr-exp-table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>Expiration</th>
                    <th>DTE</th>
                    <th>Outcome</th>
                    <th>Call OI</th>
                    <th>Call Spread</th>
                    <th>Put OI</th>
                    <th>Put Spread</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {latestResult.expirationEvaluations.map((ev) => (
                    <tr key={ev.date} className={ev.outcome === "pass" ? "vr-exp-pass" : ev.outcome === "fail" ? "vr-exp-fail" : ""}>
                      <td>{ev.date}{latestResult.winningExpiration?.date === ev.date ? " ★" : ""}</td>
                      <td>{ev.dte}</td>
                      <td>
                        <span className={`vr-badge vr-badge-${ev.outcome === "pass" ? "completed" : ev.outcome === "fail" ? "provider_failed" : "evidence_incomplete"}`}>
                          {ev.outcome}
                        </span>
                      </td>
                      <td>{ev.callEvidence.selectedContract?.openInterest ?? "—"}</td>
                      <td>{ev.callEvidence.selectedContract ? `${ev.callEvidence.selectedContract.spreadPercent.toFixed(0)}%` : "—"}</td>
                      <td>{ev.putEvidence.selectedContract?.openInterest ?? "—"}</td>
                      <td>{ev.putEvidence.selectedContract ? `${ev.putEvidence.selectedContract.spreadPercent.toFixed(0)}%` : "—"}</td>
                      <td className="vr-audit-explanation">{ev.explanation.slice(ev.explanation.indexOf(":") + 2, 80)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}

          {/* 6. Diagnostics (collapsed) */}
          <details className="vr-evidence-details">
            <summary>Diagnostics</summary>
            <div className="vr-section">
              <p className="vr-detail">
                Expiration: {latestResult.expirationSelection.status === "selected"
                  ? `${latestResult.expirationSelection.selectedDate} (${latestResult.expirationSelection.selectedDte} DTE)`
                  : "None available"}
                {" | "}Provider: {latestResult.evidenceProvenance.provider}
                {" | "}Source: {latestResult.evidenceProvenance.source}
                {latestResult.evidenceProvenance.cacheAgeSeconds != null && ` | Cache: ${latestResult.evidenceProvenance.cacheAgeSeconds}s`}
                {latestResult.evidenceProvenance.delayedData && " | 15-min delayed"}
              </p>
            </div>
            <div className="vr-sides">
              <SidePanel evidence={latestResult.callEvidence} />
              <SidePanel evidence={latestResult.putEvidence} />
            </div>
            {latestResult.aggregatedCriteria.length > 0 && (
              <div className="vr-section">
                <h4>Cross-Side Criteria</h4>
                <CriteriaTable criteria={latestResult.aggregatedCriteria} />
              </div>
            )}
          </details>

          {/* 7. Raw JSON (collapsed) */}
          <details className="vr-evidence-details">
            <summary>Raw Evaluation JSON</summary>
            <pre className="vr-raw-json">{JSON.stringify(latestResult, null, 2)}</pre>
          </details>
        </div>
        );
      })()}

      {/* Audit history (collapsed) */}
      {auditHistory.length > 0 && (
        <details className="vr-evidence-details">
          <summary>Audit History — {symbol.toUpperCase()} ({auditHistory.length} {auditHistory.length === 1 ? "record" : "records"})</summary>
          <table className="options-table vr-audit-table" style={{ marginTop: 8 }}>
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
        </details>
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

// --- Selection Evidence Panel ---

function SelectionEvidencePanel({ side, evidence, expDate, dte, targetDelta }: {
  side: "CALL" | "PUT";
  evidence: OptionSideEvidence;
  expDate: string | null;
  dte: number | null;
  targetDelta: number;
}) {
  if (evidence.selectionStatus !== "selected" || !evidence.selectedContract) {
    return (
      <div className="vr-selection-side">
        <h5>{side}</h5>
        <p className="vr-detail vr-unavailable">
          Not selected: {evidence.selectionStatus.replace(/_/g, " ")}
        </p>
      </div>
    );
  }

  const c = evidence.selectedContract;

  // Build a map of criterion → status for highlighting
  const criterionStatus = new Map<string, "pass" | "fail" | "near_miss" | "unavailable" | "observed_below">();
  for (const cr of evidence.criteria) {
    criterionStatus.set(cr.criterion, cr.status);
  }

  function rowClass(criterion: string): string {
    const status = criterionStatus.get(criterion);
    if (status === "fail") return "vr-sel-fail";
    if (status === "near_miss") return "vr-sel-warn";
    return "";
  }

  return (
    <div className="vr-selection-side">
      <h5>{side}</h5>
      <table className="vr-selection-table">
        <tbody>
          <tr><td>Expiration</td><td>{expDate ?? "—"} ({dte ?? "?"} DTE)</td></tr>
          <tr><td>Strike</td><td>${c.strike}</td></tr>
          <tr><td>Delta</td><td>{c.delta.toFixed(3)} (target {targetDelta})</td></tr>
          <tr><td>Bid / Ask</td><td>${c.bid.toFixed(2)} / ${c.ask.toFixed(2)}</td></tr>
          <tr><td>Mid</td><td>${c.mid.toFixed(2)}</td></tr>
          <tr className={rowClass("maxBidAskSpreadPercent")}><td>Spread</td><td>{c.spreadPercent.toFixed(1)}%</td></tr>
          <tr className={rowClass("minOpenInterest")}><td>Open Interest</td><td>{c.openInterest.toLocaleString()}</td></tr>
          <tr><td>Volume</td><td>{c.volume.toLocaleString()}</td></tr>
          {c.iv != null && <tr><td>IV</td><td>{(c.iv * 100).toFixed(0)}%</td></tr>}
          <tr className={rowClass("minYieldAtTargetDelta")}><td>Yield</td><td>{c.annualizedYield.toFixed(1)}%</td></tr>
        </tbody>
      </table>
    </div>
  );
}


// --- Risk Category Section ---

// --- Finding Helpers ---

function humanFindingName(criterion: string, _cr: CriterionResult): string {
  switch (criterion) {
    case "maxBidAskSpreadPercent": return "Wide Bid/Ask Spread";
    case "minOpenInterest": return "Low Open Interest";
    case "minOptionVolume": return "Low Volume";
    case "maxCapitalPerContract": return "Capital Exceeds Limit";
    case "minCapitalPerContract": return "Capital Below Minimum";
    case "minYieldAtTargetDelta": return "Yield Below Target";
    case "structuralCaution": return "Structural Complexity";
    case "requireGreeks": return "Greeks Unavailable";
    default: return criterion;
  }
}

function formatMeasuredValue(cr: CriterionResult): string {
  if (cr.measuredValue == null) return "—";
  switch (cr.criterion) {
    case "maxBidAskSpreadPercent": return `${Number(cr.measuredValue).toFixed(1)}%`;
    case "minOpenInterest": return `${cr.measuredValue} contracts`;
    case "maxCapitalPerContract":
    case "minCapitalPerContract": return `$${Number(cr.measuredValue).toLocaleString()}`;
    case "minYieldAtTargetDelta": return `${Number(cr.measuredValue).toFixed(1)}%`;
    case "structuralCaution": return String(cr.measuredValue);
    default: return String(cr.measuredValue);
  }
}

function formatThreshold(cr: CriterionResult): string {
  switch (cr.criterion) {
    case "maxBidAskSpreadPercent": return `Maximum allowed: ${cr.threshold}%`;
    case "minOpenInterest": return `Minimum required: ${cr.threshold}`;
    case "maxCapitalPerContract": return `Maximum: $${Number(cr.threshold).toLocaleString()}`;
    case "minCapitalPerContract": return `Minimum: $${Number(cr.threshold).toLocaleString()}`;
    case "minYieldAtTargetDelta": return `Minimum target: ${cr.threshold}%`;
    case "structuralCaution": return "Conventional structure expected";
    default: return `Threshold: ${cr.threshold}`;
  }
}
