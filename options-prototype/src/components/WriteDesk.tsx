/**
 * Write Desk — Operational Application Shell
 *
 * The first true operator surface in the options prototype.
 * Answers: "What should I write today?"
 *
 * Composes portfolio state, market scanning, contract evaluation,
 * execution assessment, and ranking into one operational workflow.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { navigateTo } from "../router";
import { createDemoSnapshot } from "../write-desk/demo-snapshot";
import { type PutCandidate } from "../write-desk/scan-orchestrator";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY, type RecommendationPolicy } from "../write-desk/recommend";
import type { RecommendationFunnel } from "../write-desk/recommend";
import { getDurableCache } from "../cache/durable-cache";
import { deriveTrustState } from "../write-desk/trust-state";
import { loadCandidateUniverseWithDescriptor } from "../universe/universe";
import { isTradierConfigured } from "../providers";
import { MarketSessionPolicy } from "../market-session/session-policy";
import { getTradingCalendar } from "../market-session/trading-calendar";
import { FidelityUpload } from "./FidelityUpload";
import { RecommendationBrief } from "./RecommendationBrief";
import { FunnelInfographic } from "./FunnelInfographic";
import type { TablePositionContext } from "../write-desk/brief-builder";
import { loadWorkingIntents, addPendingIntent, updatePendingIntent, createPendingIntent, type PendingIntent } from "../execution/pending-intent";
import { buildWriteIntent } from "../execution/write-intent";
import type { PortfolioSnapshot, PortfolioSourceType } from "../write-desk/types";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import "../write-desk.css";
import "../recommendation-brief.css";

// --- Component ---

export function WriteDesk() {
  const [source, setSource] = useState<PortfolioSourceType>("demo");
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(() =>
    source === "demo" ? createDemoSnapshot() : null
  );
  const [putCandidates, setPutCandidates] = useState<PutCandidate[]>([]);
  const [fidelitySnapshot, setFidelitySnapshot] = useState<PortfolioSnapshot | null>(null);
  const [putWaitCandidates, setPutWaitCandidates] = useState<PutCandidate[]>([]);
  const [putCoverage, setPutCoverage] = useState<{ status: string; universeSize: number; covered: number; fresh: number; staleUsable: number; missing: number; confirmedAbsence: number; refreshedThisPass: number; deferredThisPass: number } | null>(null);
  const [putIsProvisional, setPutIsProvisional] = useState(true);
  const [putFunnel, setPutFunnel] = useState<RecommendationFunnel | null>(null);
  // Call candidates deferred — backend-driven call recommendations not yet built
  const [scanTimestamp, setScanTimestamp] = useState<string | null>(null);
  const [policy, setPolicy] = useState(() => {
    const ws = loadWorkspace();
    return {
      ...DEFAULT_RECOMMENDATION_POLICY,
      contractSelection: {
        ...DEFAULT_RECOMMENDATION_POLICY.contractSelection,
        targetDelta: ws.writeDeskTargetDelta,
        targetDte: ws.writeDeskTargetDte,
        admissibleDeltaRange: { min: ws.writeDeskDeltaMin, max: ws.writeDeskDeltaMax },
      },
      ranking: {
        ...DEFAULT_RECOMMENDATION_POLICY.ranking,
        mode: ws.writeDeskRankingMode as typeof DEFAULT_RECOMMENDATION_POLICY.ranking.mode,
      },
    };
  });
  const [selectedCandidate, setSelectedCandidate] = useState<PutCandidate | null>(null);
  const [tablePosition, setTablePosition] = useState<TablePositionContext | null>(null);
  const [pendingIntents, setPendingIntents] = useState<PendingIntent[]>(() => loadWorkingIntents());
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);
  const [showCount, setShowCount] = useState(() => loadWorkspace().writeDeskShowCount);

  const providerKey = isTradierConfigured() ? "tradier" : "mock";

  // Load the shared candidate universe (Yahoo 496 + operator additions)
  const universe = useMemo(() => loadCandidateUniverseWithDescriptor(), []);

  // Re-recommend: apply updated policy to existing cache (zero provider calls)
  const handleReRecommend = useCallback(async (updatedPolicy: typeof DEFAULT_RECOMMENDATION_POLICY) => {
    if (!snapshot || !snapshot.deployableCash) return;
    const cache = getDurableCache();
    const sessionState = sessionClassification.state;
    const sessionClosed = sessionState === "CLOSED_CANONICAL" || sessionState === "NON_TRADING_DAY" || sessionState === "PREMARKET" || sessionState === "REGULAR_OPEN_DELAY";
    const recResult = await recommendPuts(
      universe.symbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      updatedPolicy,
      { sessionClosed }
    );
    setPutCandidates(recResult.candidates);
    setPutWaitCandidates(recResult.waitCandidates);
    setPutIsProvisional(recResult.coverageRequests.length > 0);
    setPutFunnel(recResult.funnel);
  }, [snapshot, universe, providerKey]);

  // Market session classification (updates on render, not reactive to clock)
  const sessionClassification = useMemo(() => {
    const policy = new MarketSessionPolicy(getTradingCalendar());
    return policy.classify(new Date());
  }, [scanTimestamp]); // re-classify when scan happens (captures current time)

  // When source changes, reset or load snapshot and clear results
  const handleSourceChange = (newSource: PortfolioSourceType) => {
    setSource(newSource);
    if (newSource === "demo") {
      setSnapshot(createDemoSnapshot());
    } else {
      // Restore preserved Fidelity snapshot if available
      setSnapshot(fidelitySnapshot);
    }
    // Invalidate prior results on source change
    setPutCandidates([]);
    setPutWaitCandidates([]);
    setPutCoverage(null); setPutIsProvisional(true);
    setScanTimestamp(null);
  };

  // Fidelity upload callbacks
  const handleFidelitySnapshotChange = useCallback((newSnapshot: PortfolioSnapshot | null) => {
    setFidelitySnapshot(newSnapshot);
    if (source === "fidelity") {
      setSnapshot(newSnapshot);
    }
  }, [source]);

  const handleFidelityFileChange = useCallback(() => {
    // Invalidate prior Fidelity scan results when files change
    if (source === "fidelity") {
      setPutCandidates([]);
      setPutWaitCandidates([]);
      setPutCoverage(null); setPutIsProvisional(true);
      setScanTimestamp(null);
    }
  }, [source]);

  // --- Backend-owned acquisition: the browser observes, does not initiate ---
  //
  // EVIDENCE CONTEXTS (transitional architecture):
  //
  // 1. Backend Current Observation
  //    Source: snapshotData.coverage, backend generation, process-lifetime EvidenceStore
  //    Meaning: what the backend has resolved THIS process lifetime
  //    Used for: evidence-state indicator, coverage bar, backend trust
  //
  // 2. Frontend Recommendation Projection
  //    Source: IndexedDB cache (DurableMarketCache), TTL/session-based freshness
  //    Meaning: all evidence the recommendation engine can use (may include prior-session records)
  //    Used for: funnel counts, candidate population, opportunity count
  //
  // These are NOT necessarily the same population. During bootstrap, the backend may show
  // 13/496 resolved while IndexedDB retains prior-session evidence making recommendations
  // appear more complete. This is acceptable transitionally because:
  //   - TTL freshness bounds how old evidence can be (chains: 30min stale max during active session)
  //   - sessionClosed=true intentionally accepts all cached evidence (sealed evidence is valid)
  //   - The funnel counts are internally consistent (one recommendPuts() invocation)
  //
  // Resolution: Phase 2 (frontend trust from backend metadata) will unify these contexts.
  //
  // The backend continuously acquires evidence. The frontend polls for updates
  // and runs Wheelwright locally when new evidence arrives.

  // Evidence snapshot polling — merges backend evidence into IndexedDB, reruns Wheelwright
  const handleNewEvidence = useCallback(async (snapshotData: any) => {
    if (!snapshot || !snapshot.deployableCash) return;
    const cache = getDurableCache();

    let merged = 0;
    for (const sym of snapshotData.symbols ?? []) {
      if (sym.status === "ready" && sym.chain) {
        const { buildCacheKey } = await import("../cache/durable-cache");
        const chainKey = buildCacheKey(providerKey, "sandbox", "chain", sym.symbol, sym.chain.expiration);
        const chainRecord = cache.createRecord(chainKey, "chain", providerKey, "sandbox", sym.symbol, sym.chain.expiration, sym.chain);
        await cache.put(chainRecord);
        merged++;
      }
      if (sym.expirations && sym.expirations.length > 0) {
        const { buildCacheKey } = await import("../cache/durable-cache");
        const expKey = buildCacheKey(providerKey, "sandbox", "expirations", sym.symbol);
        const expRecord = cache.createRecord(expKey, "expirations", providerKey, "sandbox", sym.symbol, null, sym.expirations);
        await cache.put(expRecord);
      }
      if (sym.status === "absent") {
        const { buildCacheKey } = await import("../cache/durable-cache");
        const absKey = buildCacheKey(providerKey, "sandbox", "absence", sym.symbol);
        const absRecord = cache.createRecord(absKey, "absence", providerKey, "sandbox", sym.symbol, null, { reason: "no expirations" });
        await cache.put(absRecord);
      }
    }

    // Update coverage from snapshot metadata
    const coverage = snapshotData.coverage;
    if (coverage) {
      setPutCoverage({
        status: coverage.pending === 0 && coverage.failed === 0 ? "COMPLETE" : "BUILDING",
        universeSize: snapshotData.universe ?? 496,
        covered: (coverage.ready ?? 0) + (coverage.absent ?? 0),
        fresh: coverage.ready ?? 0,
        staleUsable: 0,
        missing: coverage.pending ?? 0,
        confirmedAbsence: coverage.absent ?? 0,
        refreshedThisPass: merged,
        deferredThisPass: 0,
      });
    }

    if (merged === 0 && putCandidates.length > 0) return; // No new chains and we already have results

    // Recompute recommendations from updated cache
    const sessionPolicy = new MarketSessionPolicy(getTradingCalendar());
    const currentSession = sessionPolicy.classify(new Date());
    const sessionClosed = currentSession.state === "CLOSED_CANONICAL" || currentSession.state === "NON_TRADING_DAY" || currentSession.state === "PREMARKET" || currentSession.state === "REGULAR_OPEN_DELAY";

    const recResult = await recommendPuts(
      universe.symbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      policy,
      { sessionClosed }
    );

    setPutCandidates(recResult.candidates);
    setPutWaitCandidates(recResult.waitCandidates);
    setPutIsProvisional(recResult.coverage.symbolsMissingChain > 0);
    setPutFunnel(recResult.funnel);

    if (!scanTimestamp) {
      setScanTimestamp(new Date().toISOString());
    }
  }, [snapshot, policy, providerKey, universe, scanTimestamp, putCandidates.length]);

  // Poll the backend snapshot every 30s with conditional HTTP (ETag/304)
  const etagRef = useRef<string | null>(null);
  const pollingRef = useRef(false);
  const [evidenceMeta, setEvidenceMeta] = useState<{ generation: number; generatedAt: string; coverage: any } | null>(null);
  const [lastPollResult, setLastPollResult] = useState<"200" | "304" | "error" | null>(null);

  const pollSnapshot = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const headers: Record<string, string> = {};
      if (etagRef.current) headers["If-None-Match"] = etagRef.current;
      const res = await fetch("/api/evidence/snapshot", { headers });
      if (res.status === 304) {
        setLastPollResult("304");
        return;
      }
      if (res.ok) {
        const etag = res.headers.get("etag");
        if (etag) etagRef.current = etag;
        const data = await res.json();
        setEvidenceMeta({ generation: data.generation, generatedAt: data.generatedAt, coverage: data.coverage });
        setLastPollResult("200");
        handleNewEvidence(data);
      } else {
        setLastPollResult("error");
      }
    } catch {
      setLastPollResult("error");
    } finally {
      pollingRef.current = false;
    }
  }, [handleNewEvidence]);

  // Start polling when portfolio is ready
  useEffect(() => {
    if (!snapshot || snapshot.readiness.status !== "READY") return;
    pollSnapshot(); // Initial fetch
    const interval = setInterval(pollSnapshot, 30_000);
    return () => clearInterval(interval);
  }, [snapshot?.readiness.status, pollSnapshot]);

  // Derive trust indicator for operating context
  const trustIndicator = useMemo(() => {
    if (!evidenceMeta) return null;
    const sessionPolicy = new MarketSessionPolicy(getTradingCalendar());
    const currentSession = sessionPolicy.classify(new Date());
    const sessionClosed = currentSession.state === "CLOSED_CANONICAL" || currentSession.state === "NON_TRADING_DAY" || currentSession.state === "PREMARKET";
    return deriveTrustState({
      coverage: evidenceMeta.coverage,
      universe: evidenceMeta.coverage ? (evidenceMeta.coverage.ready + evidenceMeta.coverage.absent + evidenceMeta.coverage.pending + (evidenceMeta.coverage.failed ?? 0)) : 496,
      generatedAt: evidenceMeta.generatedAt,
      serviceAvailable: lastPollResult !== "error",
      sessionClosed,
      isAcquiring: putCoverage ? putCoverage.missing > 0 : evidenceMeta.coverage?.pending > 0,
    });
  }, [evidenceMeta, lastPollResult, putCoverage]);

  return (
    <div className={`write-desk${selectedCandidate ? " wd-with-drawer" : ""}`}>
      {/* Recommendation Brief Drawer */}
      {selectedCandidate && snapshot && (
        <RecommendationBrief
          candidate={selectedCandidate}
          policy={policy}
          portfolio={snapshot}
          sessionClassification={sessionClassification}
          cacheEnvironment={{ provider: providerKey, environment: "sandbox" }}
          tablePosition={tablePosition}
          pendingIntents={pendingIntents}
          onClose={() => setSelectedCandidate(null)}
          onOrderConfirmed={(c) => {
            const intent = buildWriteIntent({ candidate: c });
            if (intent) {
              const pending = createPendingIntent(intent);
              addPendingIntent(pending);
              setPendingIntents(loadWorkingIntents());
            }
          }}
        />
      )}

      {/* ═══ BAND 1: Identity · Portfolio · Session ═══ */}
      <div className="wd-band wd-band-identity">
        <div className="wd-band-left">
          <h1 className="wd-title">Wheelwright</h1>
          <select className="wd-source-select" value={source} onChange={(e) => handleSourceChange(e.target.value as PortfolioSourceType)}>
            <option value="demo">Demo Portfolio</option>
            <option value="fidelity">Fidelity Snapshot</option>
          </select>
          {source === "demo" && <span className="wd-sim-badge">SIM</span>}
          {snapshot && snapshot.readiness.status === "READY" && snapshot.deployableCash != null && (
            <span className="wd-deploy-inline">${snapshot.deployableCash.toLocaleString()} <span className="wd-deploy-label">deployable</span></span>
          )}
          {snapshot && snapshot.readiness.status === "READY" && snapshot.existingPuts.length > 0 && (
            <span className="wd-position-chip">{snapshot.existingPuts.length} short put{snapshot.existingPuts.length > 1 ? "s" : ""}</span>
          )}
          <span className="wd-calls-deferred">Calls deferred</span>
        </div>
        <div className="wd-band-right">
          {trustIndicator && (
            <span className={`wd-trust wd-trust-${trustIndicator.color}`} title={`Generation: ${evidenceMeta?.generation}`}>
              <span className="wd-trust-dot">●</span>
              {trustIndicator.trustLabel}
              {" · "}{trustIndicator.covered}/{trustIndicator.universe}
              {" · "}{trustIndicator.freshnessLabel}
              {trustIndicator.activity === "updating" && " · Updating"}
            </span>
          )}
          <span className="wd-session-inline">
            <span className={`wd-session-pip wd-session-${sessionClassification.state.toLowerCase()}`} />
            <span className="wd-session-text">{formatSessionState(sessionClassification.state)}</span>
          </span>
          <button className="wd-labs-link" onClick={() => navigateTo("/labs")}>Labs →</button>
        </div>
      </div>

      {/* ═══ STICKY EDITABLE POLICY BAR ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (
        <div className="wd-policy-bar wd-sticky-policy">
          <span className="wd-policy-profile">Routine CSP</span>
          <label className="wd-pol">Δ <select value={policy.contractSelection.targetDelta.toFixed(2)} onChange={(e) => { const updated = { ...policy, contractSelection: { ...policy.contractSelection, targetDelta: parseFloat(e.target.value) } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskTargetDelta: parseFloat(e.target.value) }); }} className="wd-pol-select"><option value="0.15">0.15</option><option value="0.20">0.20</option><option value="0.25">0.25</option><option value="0.30">0.30</option><option value="0.35">0.35</option><option value="0.40">0.40</option><option value="0.45">0.45</option><option value="0.50">0.50</option></select></label>
          <label className="wd-pol">Δ Range <select value={`${policy.contractSelection.admissibleDeltaRange.min}-${policy.contractSelection.admissibleDeltaRange.max}`} onChange={(e) => { const [min, max] = e.target.value.split("-").map(Number); const updated = { ...policy, contractSelection: { ...policy.contractSelection, admissibleDeltaRange: { min, max } } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskDeltaMin: min, writeDeskDeltaMax: max }); }} className="wd-pol-select"><option value="0.10-0.50">0.10–0.50</option><option value="0.15-0.50">0.15–0.50</option><option value="0.20-0.45">0.20–0.45</option><option value="0.25-0.40">0.25–0.40</option></select></label>
          <label className="wd-pol">DTE <select value={policy.contractSelection.targetDte} onChange={(e) => { const updated = { ...policy, contractSelection: { ...policy.contractSelection, targetDte: parseInt(e.target.value) } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskTargetDte: parseInt(e.target.value) }); }} className="wd-pol-select"><option value="7">7</option><option value="14">14</option><option value="21">21</option><option value="28">28</option><option value="35">35</option><option value="42">42</option><option value="45">45</option></select></label>
          <span className="wd-pol-static">DTE {policy.contractSelection.eligibleDteRange.min}–{policy.contractSelection.eligibleDteRange.max}</span>
          <span className="wd-pol-static">Spread ≤{policy.executionAssessment.hardExcludeSpreadPercent}%</span>
          <span className="wd-pol-static">OI &gt;0</span>
          <span className="wd-pol-static">Actionable ≥{policy.executionAssessment.actionableFloor}</span>
          <span className="wd-pol-static">Edge ≥{policy.executionAssessment.edgeFloor}</span>
          <label className="wd-pol">Rank <select value={policy.ranking.mode} onChange={(e) => { const updated = { ...policy, ranking: { ...policy.ranking, mode: e.target.value as any } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskRankingMode: e.target.value }); }} className="wd-pol-select"><option value="execution_first">Execution</option><option value="balanced">Balanced</option><option value="yield_first">Yield</option><option value="capital_efficiency">Capital Eff.</option></select></label>
        </div>
      )}

      {/* Fidelity Upload (fidelity mode only) */}
      {source === "fidelity" && (
        <div className="wd-band wd-band-upload">
          <FidelityUpload onSnapshotChange={handleFidelitySnapshotChange} onFileChange={handleFidelityFileChange} />
        </div>
      )}

      {/* ═══ CANDIDATE BOARD ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (scanTimestamp || evidenceMeta) && (
        <section className="wd-board">
          {/* Board header */}
          <div className="wd-board-header">
            <div className="wd-board-title-row">
              <h2 className="wd-board-title">Cash-Secured Put Candidates</h2>
              {putFunnel && <span className="wd-board-rec-count">{putFunnel.eligible} Recommendations</span>}
            </div>
            {putFunnel && <FunnelInfographic funnel={putFunnel} backendResolved={evidenceMeta?.coverage ? (evidenceMeta.coverage.ready + evidenceMeta.coverage.absent) : undefined} />}
            <div className="wd-table-controls">
              <label className="wd-control wd-control-check">
                <input type="checkbox" checked={showAffordableOnly} onChange={(e) => setShowAffordableOnly(e.target.checked)} />
                Affordable only
              </label>
              <label className="wd-control">
                Show
                <select value={showCount} onChange={(e) => { const v = parseInt(e.target.value); setShowCount(v); updateWorkspace({ writeDeskShowCount: v }); }} className="wd-control-select">
                  <option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>
                </select>
              </label>
              {putCandidates.length > 0 && (() => {
                const filtered = showAffordableOnly ? putCandidates.filter(c => c.affordable) : putCandidates;
                const displayed = Math.min(filtered.length, showCount);
                return <span className="wd-table-showing">Showing {displayed} of {filtered.length}</span>;
              })()}
            </div>
          </div>

          {/* Candidate table */}
          {putCandidates.length > 0 ? (
            <>
              {(() => {
                const filtered = showAffordableOnly ? putCandidates.filter((c) => c.affordable) : putCandidates;
                const displayed = filtered.slice(0, showCount);
                return <PutCandidateTable candidates={displayed} selectedSymbol={selectedCandidate?.symbol ?? null} selectedStrike={selectedCandidate?.strike ?? null} onSelect={(c, pos) => { setSelectedCandidate(c); setTablePosition(pos); }} />;
              })()}
            </>
          ) : (
            <div className="wd-no-trade">
              {putCoverage && putCoverage.missing > 0 ? (
                <p className="wd-acquiring-note">Acquiring evidence — recommendations will appear as symbols are evaluated</p>
              ) : (
                <p>No actionable or edge put opportunities available across the evaluated universe.</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Placeholder when no portfolio ready */}
      {(!snapshot || snapshot.readiness.status !== "READY") && source !== "fidelity" && (
        <div className="wd-placeholder">
          <p>Select a portfolio source to begin.</p>
        </div>
      )}
    </div>
  );
}

// --- Portfolio Detail (disclosure content) ---

function PortfolioDetail({ snapshot, pendingIntents, onIntentResolve }: { snapshot: PortfolioSnapshot; pendingIntents: PendingIntent[]; onIntentResolve: (id: string, status: "filled" | "cancelled") => void }) {
  const callCapacity = snapshot.inventory.filter((p) => p.maxAdditionalContracts > 0);
  const noCapacity = snapshot.inventory.filter((p) => p.maxAdditionalContracts === 0);
  const workingIntents = pendingIntents.filter((i) => i.status === "working");

  return (
    <div className="wd-portfolio-detail-grid">
      <div className="wd-detail-section">
        <h4 className="wd-detail-heading">Call Capacity</h4>
        {callCapacity.length > 0 ? (
          <table className="wd-inventory-table">
            <thead><tr><th>Symbol</th><th>Free</th><th>Contracts</th></tr></thead>
            <tbody>
              {callCapacity.map((p) => (
                <tr key={p.symbol}><td>{p.symbol}</td><td>{p.sharesFree}</td><td className="wd-capacity-available">{p.maxAdditionalContracts}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="wd-no-capacity">No call capacity (deferred).</p>
        )}
        {noCapacity.length > 0 && (
          <details className="wd-no-capacity-details">
            <summary>{noCapacity.length} without capacity</summary>
            <table className="wd-inventory-table">
              <thead><tr><th>Symbol</th><th>Owned</th><th>Free</th><th>Reason</th></tr></thead>
              <tbody>
                {noCapacity.map((p) => (
                  <tr key={p.symbol} className="wd-row-unavailable">
                    <td>{p.symbol}</td><td>{p.sharesOwned}</td><td>{p.sharesFree}</td>
                    <td className="wd-reason">{p.sharesEncumbered >= p.sharesOwned ? "Encumbered" : p.sharesFree < 100 ? "Below lot" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
      <div className="wd-detail-section">
        <h4 className="wd-detail-heading">Put Deployment</h4>
        <div className="wd-cash-display">
          <span className="wd-cash-amount">${snapshot.deployableCash?.toLocaleString() ?? "—"}</span>
          <span className="wd-cash-label">Deployable</span>
        </div>
        {snapshot.existingPuts.length > 0 && (
          <div className="wd-existing-puts">
            {snapshot.existingPuts.map((p, i) => (
              <span key={i} className="wd-existing-put-tag">{p.underlying} ${p.strike} {p.expiration.slice(5)}</span>
            ))}
          </div>
        )}
      </div>
      <div className="wd-detail-section">
        <h4 className="wd-detail-heading">Provenance</h4>
        <div className="wd-prov-meta">
          <span>Source: {snapshot.provenance.sourceLabel}</span>
          {snapshot.snapshotDate && <span>Date: {snapshot.snapshotDate}</span>}
        </div>
      </div>
      {workingIntents.length > 0 && (
        <div className="wd-detail-section">
          <h4 className="wd-detail-heading">Pending Orders</h4>
          <table className="wd-inventory-table">
            <thead><tr><th>Contract</th><th>Qty</th><th>Actions</th></tr></thead>
            <tbody>
              {workingIntents.map((i) => (
                <tr key={i.id}>
                  <td>{i.symbol} ${i.strike} {i.optionType === "put" ? "P" : "C"} {i.expiration.slice(5)}</td>
                  <td>{i.quantity}</td>
                  <td className="wd-order-actions">
                    <button className="wd-order-btn wd-order-fill" onClick={() => onIntentResolve(i.id, "filled")}>Filled</button>
                    <button className="wd-order-btn wd-order-cancel" onClick={() => onIntentResolve(i.id, "cancelled")}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Fidelity Upload Panel ---

// --- Sortable Table Hook ---

type SortDir = "asc" | "desc";

function useSortableTable<T>(items: T[], defaultKey: string = "rank", defaultDir: SortDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const handleSort = useCallback((key: string) => {
    if (key === sortKey) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      // Rank defaults to ascending (1,2,3...); everything else defaults to descending
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }, [sortKey]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;
      if (sortKey === "assessment") {
        aVal = (a as Record<string, { score?: number }>).assessment?.score;
        bVal = (b as Record<string, { score?: number }>).assessment?.score;
      } else {
        aVal = (a as Record<string, unknown>)[sortKey];
        bVal = (b as Record<string, unknown>)[sortKey];
      }
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const indicator = (key: string) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  /** Whether the table is currently showing recommendation order */
  const isRecommendationOrder = sortKey === "rank" && sortDir === "asc";

  return { sorted, handleSort, indicator, isRecommendationOrder, sortKey };
}

// --- Put Candidate Table ---

function PutCandidateTable({ candidates, selectedSymbol, selectedStrike, onSelect }: { candidates: PutCandidate[]; selectedSymbol: string | null; selectedStrike: number | null; onSelect: (c: PutCandidate, pos: TablePositionContext) => void }) {
  const { sorted, handleSort, indicator, isRecommendationOrder, sortKey } = useSortableTable(candidates, "rank", "asc");

  const sortLabels: Record<string, string> = {
    rank: "Recommendation",
    symbol: "Symbol",
    expiration: "Expiration",
    dte: "DTE",
    strike: "Strike",
    delta: "Delta",
    bid: "Bid",
    ask: "Ask",
    spreadPercent: "Spread",
    openInterest: "OI",
    yieldAnnualized: "Yield",
    cashRequired: "Cash Required",
    cashRemaining: "Cash Remaining",
    assessment: "Exec",
  };

  return (
    <>
      {!isRecommendationOrder && (
        <div className="wd-sort-notice">
          Viewing sorted by: <strong>{sortKey === "assessment" ? "Exec" : sortKey}</strong>
          {" · "}
          <button className="wd-sort-reset" onClick={() => handleSort("rank")}>Show recommendation order</button>
        </div>
      )}
      <table className="wd-candidate-table">
      <thead>
        <tr>
          <th className="wd-sortable" onClick={() => handleSort("rank")}>#{ indicator("rank")}</th>
          <th className="wd-sortable" onClick={() => handleSort("symbol")}>Symbol{indicator("symbol")}</th>
          <th className="wd-sortable" onClick={() => handleSort("expiration")}>Exp{indicator("expiration")}</th>
          <th className="wd-sortable" onClick={() => handleSort("dte")}>DTE{indicator("dte")}</th>
          <th className="wd-sortable" onClick={() => handleSort("strike")}>Strike{indicator("strike")}</th>
          <th className="wd-sortable" onClick={() => handleSort("delta")}>Δ{indicator("delta")}</th>
          <th className="wd-sortable" onClick={() => handleSort("bid")}>Bid{indicator("bid")}</th>
          <th className="wd-sortable" onClick={() => handleSort("ask")}>Ask{indicator("ask")}</th>
          <th className="wd-sortable" onClick={() => handleSort("spreadPercent")}>Spread{indicator("spreadPercent")}</th>
          <th className="wd-sortable" onClick={() => handleSort("openInterest")}>OI{indicator("openInterest")}</th>
          <th className="wd-sortable" onClick={() => handleSort("yieldAnnualized")}>Yield{indicator("yieldAnnualized")}</th>
          <th className="wd-sortable" onClick={() => handleSort("cashRequired")}>Cash Req{indicator("cashRequired")}</th>
          <th className="wd-sortable" onClick={() => handleSort("cashRemaining")}>Remaining{indicator("cashRemaining")}</th>
          <th className="wd-sortable" onClick={() => handleSort("assessment")}>Exec{indicator("assessment")}</th>
          <th>Posture</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c, idx) => (
          <tr
            key={`${c.symbol}-${c.expiration}-${c.strike}`}
            className={`wd-posture-row wd-posture-${c.posture.toLowerCase()}${c.symbol === selectedSymbol && c.strike === selectedStrike ? " wd-row-selected" : ""}`}
            onClick={() => onSelect(c, { tablePosition: idx + 1, sortedBy: sortKey, sortLabel: sortLabels[sortKey] ?? sortKey })}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c, { tablePosition: idx + 1, sortedBy: sortKey, sortLabel: sortLabels[sortKey] ?? sortKey }); } }}
          >
            <td>{c.rank}</td>
            <td className="wd-symbol">{c.symbol}</td>
            <td>{c.expiration.slice(5)}</td>
            <td>{c.dte}</td>
            <td>${c.strike}</td>
            <td>{Math.abs(c.delta).toFixed(2)}</td>
            <td>${c.bid.toFixed(2)}</td>
            <td>${c.ask.toFixed(2)}</td>
            <td className={c.spreadPercent > 15 ? "wd-warn-value" : ""}>{c.spreadPercent.toFixed(0)}%</td>
            <td className={c.openInterest < 50 ? "wd-warn-value" : ""}>{c.openInterest}</td>
            <td>{c.yieldAnnualized != null ? `${c.yieldAnnualized.toFixed(1)}%` : <span className="wd-yield-suppressed" title={`Yield suppressed — spread ${c.spreadPercent.toFixed(0)}% exceeds 30% reliability threshold`}>—</span>}</td>
            <td>{!c.affordable && <span className="wd-unaffordable-mark">$</span>}${c.cashRequired.toLocaleString()}</td>
            <td className={c.cashRemaining < 0 ? "wd-negative-value" : ""}>${c.cashRemaining.toLocaleString()}</td>
            <td>{c.assessment.score}</td>
            <td><span className={`wd-posture-badge wd-posture-${c.posture.toLowerCase()}`}>{c.posture}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}

// --- Session State Formatting ---

function formatSessionState(state: string): string {
  switch (state) {
    case "PREMARKET": return "Pre-Market";
    case "REGULAR_OPEN_DELAY": return "Open Delay";
    case "REGULAR_OBSERVATION": return "Regular Session";
    case "DELAY_DRAIN": return "Closing";
    case "CLOSED_CANONICAL": return "Closed";
    case "NON_TRADING_DAY": return "Market Closed";
    default: return state;
  }
}
