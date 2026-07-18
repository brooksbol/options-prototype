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
  const [putWideSpreadCandidates, setPutWideSpreadCandidates] = useState<PutCandidate[]>([]);
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
  const [showDanger, setShowDanger] = useState(true);
  const [showWideSpread, setShowWideSpread] = useState(false);
  const [showCount, setShowCount] = useState(() => loadWorkspace().writeDeskShowCount);

  const providerKey = isTradierConfigured() ? "tradier" : "mock";

  // Universe: derived from backend snapshot (canonical), falls back to local file
  const localUniverse = useMemo(() => loadCandidateUniverseWithDescriptor(), []);
  const [backendSymbols, setBackendSymbols] = useState<string[] | null>(null);
  const universeSymbols = backendSymbols ?? localUniverse.symbols;

  // Re-recommend: apply updated policy to existing cache (zero provider calls)
  const handleReRecommend = useCallback(async (updatedPolicy: typeof DEFAULT_RECOMMENDATION_POLICY) => {
    if (!snapshot || !snapshot.deployableCash) return;
    const cache = getDurableCache();
    const sessionState = sessionClassification.state;
    const sessionClosed = sessionState === "CLOSED_CANONICAL" || sessionState === "NON_TRADING_DAY" || sessionState === "PREMARKET" || sessionState === "REGULAR_OPEN_DELAY";
    const recResult = await recommendPuts(
      universeSymbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      updatedPolicy,
      { sessionClosed }
    );
    setPutCandidates(recResult.candidates);
    setPutWaitCandidates(recResult.waitCandidates);
    setPutWideSpreadCandidates(recResult.wideSpreadCandidates);
    setPutIsProvisional(recResult.coverageRequests.length > 0);
    setPutFunnel(recResult.funnel);
  }, [snapshot, universeSymbols, providerKey]);

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

    // Extract universe symbol list from backend snapshot (canonical authority)
    const snapshotSymbols: string[] = (snapshotData.symbols ?? []).map((s: any) => s.symbol);
    if (snapshotSymbols.length > 0) {
      setBackendSymbols(snapshotSymbols);
    }

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
      snapshotSymbols.length > 0 ? snapshotSymbols : universeSymbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      policy,
      { sessionClosed }
    );

    setPutCandidates(recResult.candidates);
    setPutWaitCandidates(recResult.waitCandidates);
    setPutWideSpreadCandidates(recResult.wideSpreadCandidates);
    setPutIsProvisional(recResult.coverage.symbolsMissingChain > 0);
    setPutFunnel(recResult.funnel);

    if (!scanTimestamp) {
      setScanTimestamp(new Date().toISOString());
    }
  }, [snapshot, policy, providerKey, universeSymbols, scanTimestamp, putCandidates.length]);

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

  // Portfolio popover state (only one open at a time)
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const togglePopover = (id: string) => setOpenPopover(prev => prev === id ? null : id);
  useEffect(() => {
    if (!openPopover) return;
    const escHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenPopover(null); };
    const clickHandler = () => setOpenPopover(null);
    document.addEventListener("keydown", escHandler);
    const timer = setTimeout(() => document.addEventListener("click", clickHandler), 0);
    return () => { clearTimeout(timer); document.removeEventListener("keydown", escHandler); document.removeEventListener("click", clickHandler); };
  }, [openPopover]);

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
          <span className="wd-popover-trigger" onClick={(e) => { e.stopPropagation(); togglePopover("portfolio"); }}>
            {source === "demo" ? "Demo Portfolio" : "Fidelity Snapshot"}
            {openPopover === "portfolio" && (
              <div className="wd-popover" onClick={e => e.stopPropagation()}>
                <div className="wd-popover-title">Portfolio</div>
                <select className="wd-source-select" value={source} onChange={(e) => { handleSourceChange(e.target.value as PortfolioSourceType); setOpenPopover(null); }}>
                  <option value="demo">Demo Portfolio</option>
                  <option value="fidelity">Fidelity Snapshot</option>
                </select>
                <div className="wd-popover-row"><span className="wd-popover-label">Source</span><span className="wd-popover-value">{snapshot?.provenance.sourceLabel ?? "—"}</span></div>
                {snapshot?.snapshotDate && <div className="wd-popover-row"><span className="wd-popover-label">Date</span><span className="wd-popover-value">{snapshot.snapshotDate}</span></div>}
              </div>
            )}
          </span>
          {source === "demo" && <span className="wd-sim-badge">SIM</span>}
          {snapshot && snapshot.readiness.status === "READY" && snapshot.deployableCash != null && (
            <span className="wd-popover-trigger" onClick={(e) => { e.stopPropagation(); togglePopover("cash"); }}>
              ${snapshot.deployableCash.toLocaleString()} Deployable
              {openPopover === "cash" && (
                <div className="wd-popover" onClick={e => e.stopPropagation()}>
                  <div className="wd-popover-title">Deployable Cash</div>
                  <div className="wd-popover-row"><span className="wd-popover-label">Available</span><span className="wd-popover-value">${snapshot.deployableCash?.toLocaleString()}</span></div>
                  <div className="wd-popover-row"><span className="wd-popover-label">Reserved by puts</span><span className="wd-popover-value">{snapshot.existingPuts.length > 0 ? `${snapshot.existingPuts.length} positions` : "None"}</span></div>
                  <div className="wd-popover-row"><span className="wd-popover-label">Pending intents</span><span className="wd-popover-value">{pendingIntents.filter(i => i.status === "working").length}</span></div>
                </div>
              )}
            </span>
          )}
          {snapshot && snapshot.readiness.status === "READY" && (
            <span className="wd-popover-trigger" onClick={(e) => { e.stopPropagation(); togglePopover("puts"); }}>
              {snapshot.existingPuts.length} Short Put{snapshot.existingPuts.length !== 1 ? "s" : ""}
              {openPopover === "puts" && (
                <div className="wd-popover" onClick={e => e.stopPropagation()}>
                  <div className="wd-popover-title">Short Puts</div>
                  {snapshot.existingPuts.length > 0 ? snapshot.existingPuts.map((p, i) => (
                    <div key={i} className="wd-popover-item">{p.underlying} ${p.strike} {p.expiration.slice(5)}</div>
                  )) : <div className="wd-popover-empty">No open short puts</div>}
                </div>
              )}
            </span>
          )}
          <span className="wd-popover-trigger" onClick={(e) => { e.stopPropagation(); togglePopover("calls"); }}>
            Calls Deferred
            {openPopover === "calls" && (
              <div className="wd-popover" onClick={e => e.stopPropagation()}>
                <div className="wd-popover-title">Covered-Call Capacity</div>
                <div className="wd-popover-empty">Call recommendations deferred during backend migration.</div>
                {snapshot && snapshot.inventory.filter(p => p.maxAdditionalContracts > 0).map(p => (
                  <div key={p.symbol} className="wd-popover-item">{p.symbol} · {p.sharesFree} free · {p.maxAdditionalContracts} contracts</div>
                ))}
              </div>
            )}
          </span>
          <span className="wd-popover-trigger" onClick={(e) => { e.stopPropagation(); togglePopover("intents"); }}>
            {pendingIntents.filter(i => i.status === "working").length === 0 ? "No Pending Intent" : `${pendingIntents.filter(i => i.status === "working").length} Pending Intent${pendingIntents.filter(i => i.status === "working").length > 1 ? "s" : ""}`}
            {openPopover === "intents" && (
              <div className="wd-popover" onClick={e => e.stopPropagation()}>
                <div className="wd-popover-title">Pending Intents</div>
                {pendingIntents.filter(i => i.status === "working").length > 0 ? pendingIntents.filter(i => i.status === "working").map(i => (
                  <div key={i.id} className="wd-popover-item">{i.symbol} ${i.strike} {i.optionType === "put" ? "P" : "C"} {i.expiration.slice(5)}</div>
                )) : <div className="wd-popover-empty">No pending intents</div>}
              </div>
            )}
          </span>
        </div>
        <div className="wd-band-right">
          <span className="wd-session-inline">
            <span className={`wd-session-pip wd-session-${sessionClassification.state.toLowerCase()}`} />
            <span className="wd-session-text">{formatSessionState(sessionClassification.state)}</span>
          </span>
          <button className="wd-labs-link" onClick={() => navigateTo("/labs")}>Labs →</button>
        </div>
      </div>

      {/* Fidelity Upload (fidelity mode only) */}
      {source === "fidelity" && (
        <div className="wd-band wd-band-upload">
          <FidelityUpload onSnapshotChange={handleFidelitySnapshotChange} onFileChange={handleFidelityFileChange} />
        </div>
      )}

      {/* ═══ CANDIDATE BOARD ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (scanTimestamp || evidenceMeta) && (
        <section className="wd-board">
          {/* Board title + evidence status */}
          <div className="wd-board-header">
            <div className="wd-board-title-row">
              <h2 className="wd-board-title">Cash-Secured Put Candidates</h2>
              {trustIndicator && (
                <span className={`wd-evidence-inline wd-trust-${trustIndicator.color}`}>
                  <span className="wd-trust-dot">●</span>
                  {" "}{trustIndicator.trustLabel}
                  {" · "}{trustIndicator.covered}/{trustIndicator.universe}
                  {" · "}{trustIndicator.freshnessLabel}
                  {trustIndicator.activity === "updating" && " · Updating"}
                </span>
              )}
              {putFunnel && <span className="wd-board-rec-count">{putFunnel.eligible} Recommendations · {putFunnel.outcomes.wait} Wait</span>}
            </div>
            {putFunnel && <FunnelInfographic funnel={putFunnel} backendResolved={evidenceMeta?.coverage ? (evidenceMeta.coverage.ready + evidenceMeta.coverage.absent) : undefined} />}
          </div>

          {/* Unified sticky policy + table controls */}
          <div className="wd-unified-controls">
            <div className="wd-policy-controls">
              <label className="wd-pol">Δ <select value={policy.contractSelection.targetDelta.toFixed(2)} onChange={(e) => { const updated = { ...policy, contractSelection: { ...policy.contractSelection, targetDelta: parseFloat(e.target.value) } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskTargetDelta: parseFloat(e.target.value) }); }} className="wd-pol-select"><option value="0.15">0.15</option><option value="0.20">0.20</option><option value="0.25">0.25</option><option value="0.30">0.30</option><option value="0.35">0.35</option><option value="0.40">0.40</option><option value="0.45">0.45</option><option value="0.50">0.50</option></select></label>
              <label className="wd-pol">Δ Range <select value={`${policy.contractSelection.admissibleDeltaRange.min}-${policy.contractSelection.admissibleDeltaRange.max}`} onChange={(e) => { const [min, max] = e.target.value.split("-").map(Number); const updated = { ...policy, contractSelection: { ...policy.contractSelection, admissibleDeltaRange: { min, max } } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskDeltaMin: min, writeDeskDeltaMax: max }); }} className="wd-pol-select"><option value="0.10-0.50">0.10–0.50</option><option value="0.15-0.50">0.15–0.50</option><option value="0.20-0.45">0.20–0.45</option><option value="0.25-0.40">0.25–0.40</option></select></label>
              <label className="wd-pol">DTE <select value={policy.contractSelection.targetDte} onChange={(e) => { const updated = { ...policy, contractSelection: { ...policy.contractSelection, targetDte: parseInt(e.target.value) } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskTargetDte: parseInt(e.target.value) }); }} className="wd-pol-select"><option value="7">7</option><option value="14">14</option><option value="21">21</option><option value="28">28</option><option value="35">35</option><option value="42">42</option><option value="45">45</option></select></label>
              <span className="wd-pol-static">{policy.contractSelection.eligibleDteRange.min}–{policy.contractSelection.eligibleDteRange.max}</span>
              <label className="wd-pol wd-control-check">
                <input type="checkbox" checked={showDanger} onChange={(e) => setShowDanger(e.target.checked)} />
                Show Danger
              </label>
              <label className="wd-pol wd-control-check">
                <input type="checkbox" checked={showWideSpread} onChange={(e) => setShowWideSpread(e.target.checked)} />
                Show Wide Spread
              </label>
              <label className="wd-pol">Rank <select value={policy.ranking.mode} onChange={(e) => { const updated = { ...policy, ranking: { ...policy.ranking, mode: e.target.value as any } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskRankingMode: e.target.value }); }} className="wd-pol-select"><option value="execution_first">Execution</option><option value="balanced">Balanced</option><option value="yield_first">Yield</option><option value="capital_efficiency">Capital Eff.</option></select></label>
            </div>
            <div className="wd-controls-divider" />
            <div className="wd-table-controls">
              <label className="wd-control wd-control-check">
                <input type="checkbox" checked={showAffordableOnly} onChange={(e) => setShowAffordableOnly(e.target.checked)} />
                Affordable only
              </label>
              <label className="wd-control">
                Show
                <input type="number" min={0} max={universeSymbols.length} value={showCount} onChange={(e) => { const v = Math.max(0, Math.min(universeSymbols.length, parseInt(e.target.value) || 0)); setShowCount(v); updateWorkspace({ writeDeskShowCount: v }); }} className="wd-control-spinner" />
              </label>
              {(() => {
                const allRows = [...putCandidates, ...putWaitCandidates, ...(showWideSpread ? putWideSpreadCandidates : [])];
                let filtered = showAffordableOnly ? allRows.filter(c => c.affordable) : allRows;
                if (!showDanger) filtered = filtered.filter(c => c.governance.status !== "danger");
                const displayed = Math.min(filtered.length, showCount);
                const downloadCsv = () => {
                  const rows = filtered.slice(0, showCount);
                  const header = "Rank,Symbol,Expiration,DTE,Strike,Delta,Bid,Ask,Spread%,OI,Yield%,CashRequired,Remaining,Exec,Posture,Governance";
                  const csvRows = rows.map((c, i) => `${i+1},${c.symbol},${c.expiration},${c.dte},${c.strike},${Math.abs(c.delta).toFixed(2)},${c.bid.toFixed(2)},${c.ask.toFixed(2)},${c.spreadPercent.toFixed(1)},${c.openInterest},${c.yieldAnnualized != null ? c.yieldAnnualized.toFixed(1) : ""},${c.cashRequired},${c.cashRemaining},${c.assessment.score},${c.posture},${c.governance.status}`);
                  const csv = [header, ...csvRows].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `wheelwright-candidates-${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                };
                return (
                  <>
                    <span className="wd-table-showing">Showing {displayed} rows</span>
                    <button className="wd-download-btn" onClick={downloadCsv} title="Download CSV">⬇</button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Candidate table (ACTIONABLE + EDGE + WAIT) */}
          {(putCandidates.length > 0 || putWaitCandidates.length > 0) ? (
            (() => {
              const allRows = [...putCandidates, ...putWaitCandidates, ...(showWideSpread ? putWideSpreadCandidates : [])];
              let filtered = showAffordableOnly ? allRows.filter((c) => c.affordable) : allRows;
              if (!showDanger) filtered = filtered.filter(c => c.governance.status !== "danger");
              const displayed = filtered.slice(0, showCount).map((c, i) => ({ ...c, rank: i + 1 }));
              return <PutCandidateTable candidates={displayed} selectedSymbol={selectedCandidate?.symbol ?? null} selectedStrike={selectedCandidate?.strike ?? null} onSelect={(c, pos) => { setSelectedCandidate(c); setTablePosition(pos); }} />;
            })()
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
            <td className={`wd-symbol${c.governance.status === "danger" ? " wd-symbol-danger" : ""}`}>{c.governance.status === "danger" && <span className="wd-gov-warn">⚠</span>}{c.governance.status === "review" && <span className="wd-gov-review">ⓘ</span>}{c.symbol}</td>
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
