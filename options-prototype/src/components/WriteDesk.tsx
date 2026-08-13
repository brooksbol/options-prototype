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
import { useDrawerSelection } from "../hooks/useDrawerSelection";
import { useSessionClassification } from "../hooks/useSessionClassification";
import { usePortfolio } from "../portfolio/use-portfolio";
import { type PutCandidate, type CallCandidate } from "../write-desk/scan-orchestrator";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY, type RecommendationPolicy } from "../write-desk/recommend";
import { recommendCalls } from "../write-desk/recommend-calls";
import { recommendBuyWrites, type BuyWriteCandidate } from "../write-desk/recommend-buy-writes";
import { deriveCallEmptyState, candidateExistsInResults } from "../write-desk/call-empty-state";
import { computeContingentCalls } from "../write-desk/contingent-calls";
import { executableRowFromCandidate, type CallTableRow, type ContingentCallRow } from "../write-desk/call-table-row";
import type { RecommendationFunnel } from "../write-desk/recommend";
import { getDurableCache } from "../cache/durable-cache";
import { deriveTrustState } from "../write-desk/trust-state";
import { loadCandidateUniverseWithDescriptor } from "../universe/universe";
import { isTradierConfigured } from "../providers";
import { MarketSessionPolicy } from "../market-session/session-policy";
import { getTradingCalendar } from "../market-session/trading-calendar";
import { RecommendationBrief } from "./RecommendationBrief";
import { CallBrief } from "./CallBrief";
import { BuyWriteBrief } from "./BuyWriteBrief";
import { ContingentCallBrief } from "./ContingentCallBrief";
import { FunnelInfographic } from "./FunnelInfographic";
import { CrossEntryStrip } from "./CrossEntryStrip";
import type { TablePositionContext } from "../write-desk/brief-builder";
import { loadWorkingIntents, addPendingIntent, updatePendingIntent, createPendingIntent, type PendingIntent } from "../execution/pending-intent";
import { buildWriteIntent } from "../execution/write-intent";
import type { PortfolioSnapshot } from "../write-desk/types";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import { useSectionOrder } from "../hooks/useSectionOrder";
import "../write-desk.css";
import "../recommendation-brief.css";

// --- Component ---

export function WriteDesk() {
  // Portfolio state from application-scoped Portfolio Store (ADR-011)
  const { source, snapshot } = usePortfolio();
  const [putCandidates, setPutCandidates] = useState<PutCandidate[]>([]);
  const [putWaitCandidates, setPutWaitCandidates] = useState<PutCandidate[]>([]);
  const [putWideSpreadCandidates, setPutWideSpreadCandidates] = useState<PutCandidate[]>([]);
  const [putCoverage, setPutCoverage] = useState<{ status: string; universeSize: number; covered: number; fresh: number; staleUsable: number; missing: number; confirmedAbsence: number; refreshedThisPass: number; deferredThisPass: number } | null>(null);
  const [putIsProvisional, setPutIsProvisional] = useState(true);
  const [putFunnel, setPutFunnel] = useState<RecommendationFunnel | null>(null);
  const [putHydration, setPutHydration] = useState<{ admissible: number; inadmissible: number; total: number } | null>(null);
  // Call candidates — driven by inventory + backend evidence
  const [callCandidates, setCallCandidates] = useState<CallCandidate[]>([]);
  const [callWaitCandidates, setCallWaitCandidates] = useState<CallCandidate[]>([]);
  const [contingentCallRows, setContingentCallRows] = useState<ContingentCallRow[]>([]);
  // Buy-write candidates — universe-based, cash-constrained
  const [buyWriteCandidates, setBuyWriteCandidates] = useState<BuyWriteCandidate[]>([]);
  const [buyWriteWaitCandidates, setBuyWriteWaitCandidates] = useState<BuyWriteCandidate[]>([]);
  const [buyWriteWideSpreadCandidates, setBuyWriteWideSpreadCandidates] = useState<BuyWriteCandidate[]>([]);
  const [buyWriteOutcomes, setBuyWriteOutcomes] = useState<import("../write-desk/recommend-buy-writes").BuyWriteOutcomes | null>(null);
  const [buyWritesCollapsed, setBuyWritesCollapsed] = useState(() => loadWorkspace().writeDeskBuyWritesCollapsed);
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
  const {
    selectedCandidate,
    tablePosition,
    selectedCallCandidate,
    selectedBuyWriteCandidate,
    selectDrawerCandidate,
    clearAll: clearDrawerSelection,
    clearCandidateIf,
    clearCallCandidateIf,
    clearBuyWriteCandidateIf,
    closeCandidate,
    closeCallCandidate,
    closeBuyWriteCandidate,
  } = useDrawerSelection<PutCandidate, CallTableRow, BuyWriteCandidate, TablePositionContext>();
  const [pendingIntents, setPendingIntents] = useState<PendingIntent[]>(() => loadWorkingIntents());
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [showWideSpread, setShowWideSpread] = useState(false);
  const [showCount, setShowCount] = useState(() => loadWorkspace().writeDeskShowCount);
  const [putsCollapsed, setPutsCollapsed] = useState(() => loadWorkspace().writeDeskPutsCollapsed);
  const [callsCollapsed, setCallsCollapsed] = useState(() => loadWorkspace().writeDeskCallsCollapsed);
  const [crossEntryCollapsed, setCrossEntryCollapsed] = useState(() => loadWorkspace().writeDeskCrossEntryCollapsed);

  // Section ordering (drag/reorder)
  const defaultSectionOrder = ["cross-entry", "puts", "calls", "buy-writes"];
  const savedOrder = loadWorkspace().writeDeskSectionOrder;
  // Ensure all known sections are present (handles migration from older saved orders)
  const initialOrder = (() => {
    if (!savedOrder || savedOrder.length === 0) return defaultSectionOrder;
    const missing = defaultSectionOrder.filter(id => !savedOrder.includes(id));
    return [...savedOrder, ...missing];
  })();
  const { order: sectionOrder, dragHandlers: sectionDragHandlers, dropTargetHandlers: sectionDropTargetHandlers, dragOverIndex } = useSectionOrder(
    initialOrder,
    (newOrder) => updateWorkspace({ writeDeskSectionOrder: newOrder }),
  );

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
    const reRecSessionPolicy = new MarketSessionPolicy(getTradingCalendar());
    const reRecAdmissibilityMs = reRecSessionPolicy.getAdmissibilityBoundary(new Date());
    const recResult = await recommendPuts(
      universeSymbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      updatedPolicy,
      { sessionClosed, admissibilityBoundaryMs: reRecAdmissibilityMs }
    );
    setPutCandidates(recResult.candidates);
    setPutWaitCandidates(recResult.waitCandidates);
    setPutWideSpreadCandidates(recResult.wideSpreadCandidates);
    setPutIsProvisional(recResult.coverageRequests.length > 0);
    setPutFunnel(recResult.funnel);
    setPutHydration(recResult.evidenceHydration);

    // Selection validity: clear put selection if absent from new results
    clearCandidateIf((prev) => {
      const allPuts = [...recResult.candidates, ...recResult.waitCandidates, ...recResult.wideSpreadCandidates];
      return !candidateExistsInResults(prev, allPuts);
    });

    // Also re-recommend calls with updated policy
    if (snapshot && snapshot.inventory.some(p => p.maxAdditionalContracts > 0)) {
      const callResult = await recommendCalls(
        snapshot.inventory,
        cache,
        { provider: providerKey, environment: "sandbox" },
        updatedPolicy,
        { sessionClosed, admissibilityBoundaryMs: reRecAdmissibilityMs }
      );
      setCallCandidates(callResult.candidates);
      setCallWaitCandidates(callResult.waitCandidates);

      // Selection validity: clear call selection if absent from new results
      clearCallCandidateIf((prev) => {
        if (prev.availability !== "available-now") return false;
        const allCalls = [...callResult.candidates, ...callResult.waitCandidates];
        return !candidateExistsInResults(prev, allCalls);
      });
    } else {
      setCallCandidates([]);
      setCallWaitCandidates([]);
      closeCallCandidate();
    }

    // Compute contingent calls from existing short puts
    if (snapshot && snapshot.existingPuts.length > 0) {
      const contingentResult = await computeContingentCalls(
        snapshot.existingPuts,
        cache,
        { provider: providerKey, environment: "sandbox" },
        { contractSelection: updatedPolicy.contractSelection, executionAssessment: updatedPolicy.executionAssessment },
        { sessionInfo: { acceptingCanonicalEvidence: sessionClassification.acceptingCanonicalEvidence, priorSessionOperationallyValid: sessionClassification.priorSessionOperationallyValid } }
      );
      setContingentCallRows(contingentResult.rows);
    } else {
      setContingentCallRows([]);
    }

    // Recommend buy-writes (same universe as puts, reads call side of cache)
    const bwResult = await recommendBuyWrites(
      universeSymbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      updatedPolicy,
      { sessionClosed, admissibilityBoundaryMs: reRecAdmissibilityMs }
    );
    setBuyWriteCandidates(bwResult.candidates);
    setBuyWriteWaitCandidates(bwResult.waitCandidates);
    setBuyWriteWideSpreadCandidates(bwResult.wideSpreadCandidates);
    setBuyWriteOutcomes(bwResult.outcomes);

    // Selection validity: clear buy-write selection if absent from new results
    clearBuyWriteCandidateIf((prev) => {
      const allBW = [...bwResult.candidates, ...bwResult.waitCandidates];
      return !allBW.some(c => c.symbol === prev.symbol && c.strike === prev.strike && c.expiration === prev.expiration);
    });
  }, [snapshot, universeSymbols, providerKey]);

  // Market session classification (wall-clock-driven, reclassifies every 30s)
  const sessionClassification = useSessionClassification();

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
      // Parse the backend's authoritative retrieval timestamp for this symbol's evidence.
      // This preserves actual provider-acquisition age rather than resetting to frontend merge time.
      const backendRetrievedAtMs = sym.retrievedAt ? new Date(sym.retrievedAt).getTime() : undefined;

      if (sym.status === "ready" && sym.chain) {
        const { buildCacheKey } = await import("../cache/durable-cache");
        const chainKey = buildCacheKey(providerKey, "sandbox", "chain", sym.symbol, sym.chain.expiration);
        const chainRecord = cache.createRecord(chainKey, "chain", providerKey, "sandbox", sym.symbol, sym.chain.expiration, sym.chain, backendRetrievedAtMs);
        await cache.put(chainRecord);

        // Evidence coherence: remove stale chain records for other expirations.
        // The backend serves one authoritative chain per symbol (the primaryExpiration).
        // Any residual chains for other expirations are from prior sessions and must not
        // participate in current recommendations alongside the fresh primary chain.
        const allSymRecords = await cache.getBySymbol(sym.symbol);
        for (const oldRecord of allSymRecords) {
          if (oldRecord.dataType === "chain" && oldRecord.expiration !== sym.chain.expiration) {
            await cache.delete(oldRecord.key);
          }
        }

        merged++;
      }
      if (sym.expirations && sym.expirations.length > 0) {
        const { buildCacheKey } = await import("../cache/durable-cache");
        const expKey = buildCacheKey(providerKey, "sandbox", "expirations", sym.symbol);
        const expRecord = cache.createRecord(expKey, "expirations", providerKey, "sandbox", sym.symbol, null, sym.expirations, backendRetrievedAtMs);
        await cache.put(expRecord);
      }
      if (sym.status === "absent") {
        const { buildCacheKey } = await import("../cache/durable-cache");
        const absKey = buildCacheKey(providerKey, "sandbox", "absence", sym.symbol);
        const absRecord = cache.createRecord(absKey, "absence", providerKey, "sandbox", sym.symbol, null, { reason: "no expirations" }, backendRetrievedAtMs);
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
    const admissibilityBoundaryMs = sessionPolicy.getAdmissibilityBoundary(new Date());

    const recResult = await recommendPuts(
      snapshotSymbols.length > 0 ? snapshotSymbols : universeSymbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      policy,
      { sessionClosed, admissibilityBoundaryMs }
    );

    setPutCandidates(recResult.candidates);
    setPutWaitCandidates(recResult.waitCandidates);
    setPutWideSpreadCandidates(recResult.wideSpreadCandidates);
    setPutIsProvisional(recResult.coverage.symbolsMissingChain > 0);
    setPutFunnel(recResult.funnel);
    setPutHydration(recResult.evidenceHydration);

    // Selection validity: clear put selection if it no longer exists in results
    clearCandidateIf((prev) => {
      const allPuts = [...recResult.candidates, ...recResult.waitCandidates, ...recResult.wideSpreadCandidates];
      return !candidateExistsInResults(prev, allPuts);
    });

    // Recommend calls for held inventory (same cache, same policy)
    if (snapshot.inventory.some(p => p.maxAdditionalContracts > 0)) {
      const callResult = await recommendCalls(
        snapshot.inventory,
        cache,
        { provider: providerKey, environment: "sandbox" },
        policy,
        { sessionClosed, admissibilityBoundaryMs }
      );
      setCallCandidates(callResult.candidates);
      setCallWaitCandidates(callResult.waitCandidates);

      // Selection validity: clear call selection if it no longer exists in results
      clearCallCandidateIf((prev) => {
        if (prev.availability !== "available-now") return false;
        const allCalls = [...callResult.candidates, ...callResult.waitCandidates];
        return !candidateExistsInResults(prev, allCalls);
      });
    } else {
      // No eligible inventory — clear any stale call state
      setCallCandidates([]);
      setCallWaitCandidates([]);
      closeCallCandidate();
    }

    // Compute contingent calls from existing short puts
    if (snapshot.existingPuts.length > 0) {
      const contingentResult = await computeContingentCalls(
        snapshot.existingPuts,
        cache,
        { provider: providerKey, environment: "sandbox" },
        { contractSelection: policy.contractSelection, executionAssessment: policy.executionAssessment },
        { sessionInfo: { acceptingCanonicalEvidence: sessionClassification.acceptingCanonicalEvidence, priorSessionOperationallyValid: sessionClassification.priorSessionOperationallyValid } }
      );
      setContingentCallRows(contingentResult.rows);
    } else {
      setContingentCallRows([]);
    }

    // Recommend buy-writes (same universe as puts, reads call side of cache)
    const bwResult2 = await recommendBuyWrites(
      snapshotSymbols.length > 0 ? snapshotSymbols : universeSymbols,
      snapshot.deployableCash,
      cache,
      { provider: providerKey, environment: "sandbox" },
      policy,
      { sessionClosed, admissibilityBoundaryMs }
    );
    setBuyWriteCandidates(bwResult2.candidates);
    setBuyWriteWaitCandidates(bwResult2.waitCandidates);
    setBuyWriteWideSpreadCandidates(bwResult2.wideSpreadCandidates);
    setBuyWriteOutcomes(bwResult2.outcomes);

    // Selection validity: clear buy-write selection if candidate identity changed or disappeared
    clearBuyWriteCandidateIf((prev) => {
      const allBW = [...bwResult2.candidates, ...bwResult2.waitCandidates, ...bwResult2.wideSpreadCandidates];
      return !allBW.some(c => c.symbol === prev.symbol && c.expiration === prev.expiration && c.strike === prev.strike);
    });

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
      evidenceHydration: putHydration,
    });
  }, [evidenceMeta, lastPollResult, putCoverage, putHydration]);

  // Portfolio popover state removed — portfolio info now lives in global header

  return (
    <div className="write-desk">
      {/* Recommendation Brief Drawer — always present, shows selected candidate or empty state */}
      {selectedCandidate && snapshot ? (
        <RecommendationBrief
          candidate={selectedCandidate}
          policy={policy}
          portfolio={snapshot}
          sessionClassification={sessionClassification}
          cacheEnvironment={{ provider: providerKey, environment: "sandbox" }}
          tablePosition={tablePosition}
          pendingIntents={pendingIntents}
          onClose={closeCandidate}
          onOrderConfirmed={(c) => {
            const intent = buildWriteIntent({ candidate: c });
            if (intent) {
              const pending = createPendingIntent(intent);
              addPendingIntent(pending);
              setPendingIntents(loadWorkingIntents());
            }
          }}
        />
      ) : selectedCallCandidate && selectedCallCandidate.availability === "available-now" ? (
        <CallBrief
          candidate={selectedCallCandidate.candidate}
          policy={policy}
          sessionClassification={sessionClassification}
          cacheEnvironment={{ provider: providerKey, environment: "sandbox" }}
          onClose={closeCallCandidate}
        />
      ) : selectedCallCandidate && selectedCallCandidate.availability === "if-assigned" ? (
        <ContingentCallBrief
          row={selectedCallCandidate}
          sessionClassification={sessionClassification}
          cacheEnvironment={{ provider: providerKey, environment: "sandbox" }}
          onClose={closeCallCandidate}
        />
      ) : selectedBuyWriteCandidate ? (
        <BuyWriteBrief
          candidate={selectedBuyWriteCandidate}
          policy={policy}
          sessionClassification={sessionClassification}
          cacheEnvironment={{ provider: providerKey, environment: "sandbox" }}
          onClose={closeBuyWriteCandidate}
        />
      ) : (
        <div className="rb-drawer rb-drawer-empty">
          <div className="rb-drawer-empty-content">
            <span className="rb-drawer-empty-hint">Select a candidate to inspect</span>
          </div>
        </div>
      )}

      {/* ═══ DEPLOYMENT TABLE SECTIONS (drag-reorderable) ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (scanTimestamp || evidenceMeta) && (
        <div className="wd-sections-container">
          {sectionOrder.map((sectionId) => (
            <div
              key={sectionId}
              className={`wd-section-wrapper${dragOverIndex === sectionOrder.indexOf(sectionId) ? " wd-section-drop-target" : ""}`}
              {...sectionDropTargetHandlers(sectionId)}
            >
              <span className="wd-section-drag-handle" title="Drag to reorder section" {...sectionDragHandlers(sectionId)}>⋮⋮</span>

              {sectionId === "cross-entry" && (putCandidates.length > 0 || buyWriteCandidates.length > 0) && (
        <section className="wd-board wd-cross-entry-board">
          <div className="wd-board-header">
            <div className="wd-board-title-row">
              <h2 className="wd-board-title">
                <button
                  className="wd-collapse-toggle"
                  onClick={() => { setCrossEntryCollapsed(!crossEntryCollapsed); updateWorkspace({ writeDeskCrossEntryCollapsed: !crossEntryCollapsed }); }}
                  aria-expanded={!crossEntryCollapsed}
                  aria-label={crossEntryCollapsed ? "Expand cross-entry section" : "Collapse cross-entry section"}
                >
                  <span className={`wd-chevron${crossEntryCollapsed ? " wd-chevron-collapsed" : ""}`}>▾</span>
                </button>
                Cash Deployment — Prod v0
              </h2>
              <span className="wd-board-rec-count">Experimental</span>
            </div>
          </div>
          <div style={{ display: crossEntryCollapsed ? 'none' : undefined }}>
            <CrossEntryStrip
              putCandidates={putCandidates}
              buyWriteCandidates={buyWriteCandidates}
              policy={policy}
              maxRows={10}
              onSelectPut={(c) => { selectDrawerCandidate("put", { put: c }); }}
              onSelectBuyWrite={(c) => { selectDrawerCandidate("buywrite", { buyWrite: c }); }}
            />
          </div>
        </section>
              )}

              {sectionId === "puts" && (
        <section className="wd-board">
          {/* Board title + evidence status */}
          <div className="wd-board-header">
            <div className="wd-board-title-row">
              <h2 className="wd-board-title">
                <button
                  className="wd-collapse-toggle"
                  onClick={() => { setPutsCollapsed(!putsCollapsed); updateWorkspace({ writeDeskPutsCollapsed: !putsCollapsed }); }}
                  aria-expanded={!putsCollapsed}
                  aria-label={putsCollapsed ? "Expand puts section" : "Collapse puts section"}
                >
                  <span className={`wd-chevron${putsCollapsed ? " wd-chevron-collapsed" : ""}`}>▾</span>
                </button>
                Cash-Secured Put Candidates
              </h2>
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

          <div style={{ display: putsCollapsed ? 'none' : undefined }}>
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
                  const csvRows = rows.map((c, i) => `${i+1},${c.symbol},${c.expiration},${c.dte},${c.strike},${Math.abs(c.delta).toFixed(2)},${c.bid.toFixed(2)},${c.ask.toFixed(2)},${c.spreadPercent.toFixed(1)},${c.openInterest},${c.yieldAnnualized.toFixed(1)},${c.cashRequired},${c.cashRemaining},${c.assessment.score},${c.posture},${c.governance.status}`);
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
              return <PutCandidateTable candidates={displayed} selectedSymbol={selectedCandidate?.symbol ?? null} selectedStrike={selectedCandidate?.strike ?? null} onSelect={(c, pos) => { selectDrawerCandidate("put", { put: c, putPos: pos }); }} />;
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
          </div>
        </section>
              )}

              {sectionId === "calls" && (
        <section className="wd-board wd-call-board">
          <div className="wd-board-header">
            <div className="wd-board-title-row">
              <h2 className="wd-board-title">
                <button
                  className="wd-collapse-toggle"
                  onClick={() => { setCallsCollapsed(!callsCollapsed); updateWorkspace({ writeDeskCallsCollapsed: !callsCollapsed }); }}
                  aria-expanded={!callsCollapsed}
                  aria-label={callsCollapsed ? "Expand calls section" : "Collapse calls section"}
                >
                  <span className={`wd-chevron${callsCollapsed ? " wd-chevron-collapsed" : ""}`}>▾</span>
                </button>
                Covered-Call Candidates
              </h2>
              {(callCandidates.length + callWaitCandidates.length > 0 || contingentCallRows.length > 0) && (
                <span className="wd-board-rec-count">
                  {callCandidates.length + callWaitCandidates.length > 0 && `${callCandidates.length + callWaitCandidates.length} available now`}
                  {callCandidates.length + callWaitCandidates.length > 0 && contingentCallRows.length > 0 && " · "}
                  {contingentCallRows.length > 0 && `${contingentCallRows.length} if assigned`}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: callsCollapsed ? 'none' : undefined }}>
            {(callCandidates.length > 0 || callWaitCandidates.length > 0 || contingentCallRows.length > 0) ? (
              <>
                {/* Available now — executable calls */}
                {(callCandidates.length > 0 || callWaitCandidates.length > 0) && (
                  <>
                    <div className="wd-call-group-label">Available now</div>
                    <CallCandidateTable
                      candidates={[...callCandidates, ...callWaitCandidates]}
                      selectedRow={selectedCallCandidate}
                      onSelect={(row) => { selectDrawerCandidate("call", { call: row }); }}
                    />
                  </>
                )}
                {/* If assigned — contingent calls */}
                {contingentCallRows.length > 0 && (
                  <>
                    <div className="wd-call-group-label wd-call-group-contingent">If assigned</div>
                    <ContingentCallTable
                      rows={contingentCallRows}
                      selectedRow={selectedCallCandidate}
                      onSelect={(row) => { selectDrawerCandidate("call", { call: row }); }}
                    />
                  </>
                )}
              </>
            ) : (
              <div className="wd-no-trade">
                <p>{deriveCallEmptyStateMsg(snapshot, scanTimestamp, evidenceMeta)}</p>
              </div>
            )}
          </div>
        </section>
              )}

              {sectionId === "buy-writes" && (
        <section className="wd-board wd-buy-write-board">
          <div className="wd-board-header">
            <div className="wd-board-title-row">
              <h2 className="wd-board-title">
                <button
                  className="wd-collapse-toggle"
                  onClick={() => { setBuyWritesCollapsed(!buyWritesCollapsed); updateWorkspace({ writeDeskBuyWritesCollapsed: !buyWritesCollapsed }); }}
                  aria-expanded={!buyWritesCollapsed}
                  aria-label={buyWritesCollapsed ? "Expand buy-writes section" : "Collapse buy-writes section"}
                >
                  <span className={`wd-chevron${buyWritesCollapsed ? " wd-chevron-collapsed" : ""}`}>▾</span>
                </button>
                Buy-Write Candidates
              </h2>
              {trustIndicator && (
                <span className={`wd-evidence-inline wd-trust-${trustIndicator.color}`}>
                  <span className="wd-trust-dot">●</span>
                  {" "}{trustIndicator.trustLabel}
                  {" · "}{trustIndicator.covered}/{trustIndicator.universe}
                  {" · "}{trustIndicator.freshnessLabel}
                  {trustIndicator.activity === "updating" && " · Updating"}
                </span>
              )}
              {(buyWriteCandidates.length + buyWriteWaitCandidates.length > 0) && (
                <span className="wd-board-rec-count">
                  {buyWriteCandidates.length + buyWriteWaitCandidates.length} Recommendations
                </span>
              )}
            </div>
            <BuyWriteDistributionBar outcomes={buyWriteOutcomes} universeSize={universeSymbols.length} />
            <div style={{ display: "flex", gap: "12px", padding: "6px 12px 8px", flexWrap: "nowrap", overflow: "hidden", alignItems: "flex-end" }}>
              <BuyWriteDeltaDistribution candidates={[...buyWriteCandidates, ...buyWriteWaitCandidates]} />
              <BuyWriteDescriptiveHistograms candidates={[...buyWriteCandidates, ...buyWriteWaitCandidates]} />
            </div>
          </div>

          <div style={{ display: buyWritesCollapsed ? 'none' : undefined }}>
            {(buyWriteCandidates.length > 0 || buyWriteWaitCandidates.length > 0 || buyWriteWideSpreadCandidates.length > 0) ? (
              <>
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
                    <label className="wd-pol">Rank <select value={policy.ranking.mode} onChange={(e) => { const updated = { ...policy, ranking: { ...policy.ranking, mode: e.target.value as any } }; setPolicy(updated); handleReRecommend(updated); updateWorkspace({ writeDeskRankingMode: e.target.value }); }} className="wd-pol-select"><option value="yield_first">Yield</option><option value="capital_efficiency">If Called</option><option value="execution_first">Execution</option></select></label>
                  </div>
                  <div className="wd-controls-divider" />
                  <div className="wd-table-controls">
                    <label className="wd-control wd-control-check">
                      <input type="checkbox" checked={showAffordableOnly} onChange={(e) => setShowAffordableOnly(e.target.checked)} />
                      Affordable only
                    </label>
                    <label className="wd-control">
                      Show
                      <input type="number" min={0} max={200} value={showCount} onChange={(e) => { const v = Math.max(0, Math.min(200, parseInt(e.target.value) || 0)); setShowCount(v); updateWorkspace({ writeDeskShowCount: v }); }} className="wd-control-spinner" />
                    </label>
                    {(() => {
                      const allBW = [...buyWriteCandidates, ...buyWriteWaitCandidates, ...(showWideSpread ? buyWriteWideSpreadCandidates : [])];
                      let filtered = showAffordableOnly ? allBW.filter(c => c.affordable) : allBW;
                      if (!showDanger) filtered = filtered.filter(c => c.governance.status !== "danger");
                      const displayed = Math.min(filtered.length, showCount);
                      return <span className="wd-table-showing">Showing {displayed} of {allBW.length}</span>;
                    })()}
                  </div>
                </div>
                <BuyWriteCandidateTable
                  candidates={[...buyWriteCandidates, ...buyWriteWaitCandidates, ...(showWideSpread ? buyWriteWideSpreadCandidates : [])]}
                  selectedCandidate={selectedBuyWriteCandidate}
                  showAffordableOnly={showAffordableOnly}
                  showDanger={showDanger}
                  showCount={showCount}
                  onSelect={(c) => { selectDrawerCandidate("buywrite", { buyWrite: c }); }}
                />
              </>
            ) : (
              <div className="wd-no-trade">
                <p>No actionable buy-write opportunities available. Requires cached call chain data and sufficient deployable cash.</p>
              </div>
            )}
          </div>
        </section>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Placeholder when no portfolio ready */}
      {(!snapshot || snapshot.readiness.status !== "READY") && source !== "fidelity" && (
        <div className="wd-placeholder">
          <p>Select a portfolio source to begin.</p>
        </div>
      )}

      {/* Waiting for evidence — snapshot ready but backend hasn't responded yet */}
      {snapshot && snapshot.readiness.status === "READY" && !scanTimestamp && !evidenceMeta && (
        <div className="wd-no-trade">
          <p className="wd-acquiring-note">Portfolio loaded — connecting to evidence service for option chain data...</p>
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
            <td>{`${c.yieldAnnualized.toFixed(1)}%`}</td>
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

// --- Call Candidate Table ---

function CallCandidateTable({ candidates, selectedRow, onSelect }: { candidates: CallCandidate[]; selectedRow: CallTableRow | null; onSelect: (row: CallTableRow) => void }) {
  const { sorted, handleSort, indicator } = useSortableTable(candidates, "rank", "asc");
  const selectedSymbol = selectedRow?.availability === "available-now" ? selectedRow.symbol : null;
  const selectedStrike = selectedRow?.availability === "available-now" ? selectedRow.strike : null;

  return (
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
          <th>Shares</th>
          <th>Cts</th>
          <th className="wd-sortable" onClick={() => handleSort("assessment")}>Exec{indicator("assessment")}</th>
          <th>Posture</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c) => (
          <tr
            key={`${c.symbol}-${c.expiration}-${c.strike}`}
            className={`wd-posture-row wd-posture-${c.posture.toLowerCase()}${c.symbol === selectedSymbol && c.strike === selectedStrike ? " wd-row-selected" : ""}`}
            onClick={() => onSelect(executableRowFromCandidate(c))}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(executableRowFromCandidate(c)); } }}
          >
            <td>{c.rank}</td>
            <td className="wd-symbol">{c.symbol}</td>
            <td>{c.expiration.slice(5)}</td>
            <td>{c.dte}</td>
            <td>${c.strike}</td>
            <td>{c.delta.toFixed(2)}</td>
            <td>${c.bid.toFixed(2)}</td>
            <td>${c.ask.toFixed(2)}</td>
            <td className={c.spreadPercent > 15 ? "wd-warn-value" : ""}>{c.spreadPercent.toFixed(0)}%</td>
            <td className={c.openInterest < 50 ? "wd-warn-value" : ""}>{c.openInterest}</td>
            <td>{`${c.yieldAnnualized.toFixed(1)}%`}</td>
            <td>{c.freeShares}</td>
            <td>{c.maxContracts}</td>
            <td>{c.assessment.score}</td>
            <td><span className={`wd-posture-badge wd-posture-${c.posture.toLowerCase()}`}>{c.posture}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --- Buy-Write Delta Distribution ---

function BuyWriteDeltaDistribution({ candidates }: {
  candidates: import("../write-desk/recommend-buy-writes").BuyWriteCandidate[];
}) {
  if (candidates.length === 0) return <span style={{ fontSize: "11px", color: "#999" }}>δ dist: awaiting candidates</span>;

  const buckets = [
    { label: "<.20", min: 0, max: 0.20 },
    { label: ".20–.30", min: 0.20, max: 0.30 },
    { label: ".30–.40", min: 0.30, max: 0.40 },
    { label: ".40–.50", min: 0.40, max: 0.50 },
    { label: ".50–.60", min: 0.50, max: 0.60 },
    { label: ">.60", min: 0.60, max: 1.01 },
  ];

  const counts = buckets.map(b => candidates.filter(c => c.delta >= b.min && c.delta < b.max).length);
  const maxCount = Math.max(...counts, 1);
  const total = candidates.length;
  const deltas = candidates.map(c => c.delta);
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const median = [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length / 2)];

  return (
    <div className="wd-delta-distribution" style={{ fontSize: "11px", color: "#bbb", display: "flex", alignItems: "flex-end", gap: "3px" }}>
      <span style={{ marginRight: "3px", whiteSpace: "nowrap", alignSelf: "center", color: "#999", fontWeight: 600, fontSize: "9px" }}>δ</span>
      {buckets.map((b, i) => {
        const height = Math.max(3, (counts[i] / maxCount) * 18);
        const pct = total > 0 ? Math.round(counts[i] / total * 100) : 0;
        return (
          <span
            key={b.label}
            title={`${b.label}: ${counts[i]} candidates (${pct}%)`}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1px",
            }}
          >
            <span style={{
              display: "block",
              width: "20px",
              height: `${height}px`,
              backgroundColor: counts[i] > 0 ? "#4a9eff" : "rgba(74, 158, 255, 0.15)",
              borderRadius: "2px",
            }} />
            <span style={{ fontSize: "7px", color: "#999" }}>{b.label}</span>
          </span>
        );
      })}
      <span style={{ marginLeft: "4px", whiteSpace: "nowrap", alignSelf: "center", fontSize: "8px", color: "#999" }}>
        μ{mean.toFixed(2)} · m{median.toFixed(2)}
      </span>
    </div>
  );
}

// --- Buy-Write Descriptive Histograms (DTE, Capital, Bid, Yield) ---

function BuyWriteDescriptiveHistograms({ candidates }: {
  candidates: import("../write-desk/recommend-buy-writes").BuyWriteCandidate[];
}) {
  if (candidates.length === 0) return null;

  return (
    <>
      <MiniHistogram
        label="DTE"
        values={candidates.map(c => c.dte)}
        buckets={[
          { label: "≤7", min: 0, max: 8 },
          { label: "8–14", min: 8, max: 15 },
          { label: "15–21", min: 15, max: 22 },
          { label: "22–35", min: 22, max: 36 },
          { label: "36–45", min: 36, max: 46 },
          { label: ">45", min: 46, max: 9999 },
        ]}
        color="#4CB7A5"
        unit="d"
      />
      <MiniHistogram
        label="Capital"
        values={candidates.map(c => c.capitalRequired)}
        buckets={[
          { label: "<2k", min: 0, max: 2000 },
          { label: "2–5k", min: 2000, max: 5000 },
          { label: "5–10k", min: 5000, max: 10000 },
          { label: "10–20k", min: 10000, max: 20000 },
          { label: "20–50k", min: 20000, max: 50000 },
          { label: ">50k", min: 50000, max: Infinity },
        ]}
        color="#D6A83B"
        unit="$"
        formatStat={(v) => `$${(v / 1000).toFixed(1)}k`}
      />
      <MiniHistogram
        label="Bid"
        values={candidates.map(c => c.bid)}
        buckets={[
          { label: "<.50", min: 0, max: 0.50 },
          { label: ".50–1", min: 0.50, max: 1.00 },
          { label: "1–2", min: 1.00, max: 2.00 },
          { label: "2–4", min: 2.00, max: 4.00 },
          { label: "4–8", min: 4.00, max: 8.00 },
          { label: ">8", min: 8.00, max: Infinity },
        ]}
        color="#9A78D1"
        unit="$"
        formatStat={(v) => `$${v.toFixed(2)}`}
      />
      <MiniHistogram
        label="Yield"
        values={candidates.map(c => c.premiumYieldAnnualized)}
        buckets={[
          { label: "<10", min: 0, max: 10 },
          { label: "10–20", min: 10, max: 20 },
          { label: "20–35", min: 20, max: 35 },
          { label: "35–50", min: 35, max: 50 },
          { label: "50–75", min: 50, max: 75 },
          { label: "75–100", min: 75, max: 100 },
          { label: ">100", min: 100, max: Infinity },
        ]}
        color="#42C77A"
        unit="%"
        formatStat={(v) => `${v.toFixed(0)}%`}
      />
    </>
  );
}

// --- Mini Histogram (reusable inline bar chart) ---

function MiniHistogram({ label, values, buckets, color, unit, formatStat }: {
  label: string;
  values: number[];
  buckets: { label: string; min: number; max: number }[];
  color: string;
  unit?: string;
  formatStat?: (v: number) => string;
}) {
  if (values.length === 0) return null;

  const counts = buckets.map(b => values.filter(v => v >= b.min && v < b.max).length);
  const maxCount = Math.max(...counts, 1);
  const total = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / total;
  const median = sorted[Math.floor(total / 2)];
  const fmt = formatStat ?? ((v: number) => `${v.toFixed(1)}${unit ?? ""}`);

  return (
    <div style={{ fontSize: "11px", color: "#bbb", display: "flex", alignItems: "flex-end", gap: "1px" }}>
      <span style={{ marginRight: "3px", whiteSpace: "nowrap", alignSelf: "center", color: "#999", fontWeight: 600, fontSize: "9px" }}>
        {label}
      </span>
      {buckets.map((b, i) => {
        const height = Math.max(3, (counts[i] / maxCount) * 18);
        const pct = total > 0 ? Math.round(counts[i] / total * 100) : 0;
        return (
          <span
            key={b.label}
            title={`${b.label}: ${counts[i]} (${pct}%)`}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1px",
            }}
          >
            <span style={{
              display: "block",
              width: "20px",
              height: `${height}px`,
              backgroundColor: counts[i] > 0 ? color : `${color}33`,
              borderRadius: "2px",
            }} />
            <span style={{ fontSize: "7px", color: "#999" }}>{b.label}</span>
          </span>
        );
      })}
      <span style={{ marginLeft: "4px", whiteSpace: "nowrap", alignSelf: "center", fontSize: "8px", color: "#999" }}>
        μ{fmt(mean)}
      </span>
    </div>
  );
}

// --- Buy-Write Distribution Bar ---

function BuyWriteDistributionBar({ outcomes, universeSize }: {
  outcomes: import("../write-desk/recommend-buy-writes").BuyWriteOutcomes | null;
  universeSize: number;
}) {
  if (!outcomes || universeSize === 0) return null;

  const segments = [
    { label: "Actionable", count: outcomes.actionable, color: "#42C77A" },
    { label: "EDGE", count: outcomes.edge, color: "#4EA1FF" },
    { label: "Wait", count: outcomes.wait, color: "#D6A83B" },
    { label: "Zero Bid", count: outcomes.hardNoZeroBid, color: "#E45C5C" },
    { label: "Zero OI", count: outcomes.hardNoZeroOI, color: "#B8922E" },
    { label: "Wide Spread", count: outcomes.hardNoWideSpread, color: "#CC5599" },
    { label: "No Delta Match", count: outcomes.noDeltaMatch, color: "#9A78D1" },
    { label: "No DTE Match", count: outcomes.noDteMatch, color: "#4CB7A5" },
    { label: "No Options", count: outcomes.nonOptionable, color: "#8993A4" },
    { label: "Incomplete", count: outcomes.incomplete, color: "#8993A4" },
  ];

  return (
    <div className="wd-dist">
      <div className="wd-dist-row">
        <div className="wd-dist-bar">
          {segments.map(seg => {
            if (seg.count <= 0) return null;
            return (
              <div
                key={seg.label}
                className="wd-dist-seg"
                style={{ width: `${(seg.count / universeSize) * 100}%`, backgroundColor: seg.color }}
                title={`${seg.count} ${seg.label}`}
              />
            );
          })}
        </div>
        <span className="wd-dist-total">{universeSize} ETFs</span>
      </div>
      <div className="wd-dist-key">
        {segments.map(seg => {
          if (seg.count <= 0) return null;
          return (
            <span key={seg.label} className="wd-dist-item">
              <span className="wd-dist-dot" style={{ backgroundColor: seg.color }} />
              <span className="wd-dist-count" style={{ color: seg.color }}>{seg.count}</span>
              <span className="wd-dist-label">{seg.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// --- Buy-Write Candidate Table ---

function BuyWriteCandidateTable({ candidates, selectedCandidate, showAffordableOnly, showDanger, showCount, onSelect }: {
  candidates: BuyWriteCandidate[];
  selectedCandidate: BuyWriteCandidate | null;
  showAffordableOnly: boolean;
  showDanger: boolean;
  showCount: number;
  onSelect: (c: BuyWriteCandidate) => void;
}) {
  let filtered = showAffordableOnly ? candidates.filter(c => c.affordable) : candidates;
  if (!showDanger) filtered = filtered.filter(c => c.governance.status !== "danger");
  const displayed = filtered.slice(0, showCount);

  const { sorted, handleSort, indicator, isRecommendationOrder, sortKey } = useSortableTable(displayed, "rank", "asc");

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
    underlyingPrice: "Price",
    capitalRequired: "Capital",
    cashRemaining: "Remaining",
    premiumYieldAnnualized: "Yield",
    totalReturnIfCalledPercent: "If Called",
    appreciationPerShare: "Apprec",
    assessment: "Exec",
  };

  return (
    <>
      {!isRecommendationOrder && (
        <div className="wd-sort-notice">
          Viewing sorted by: <strong>{sortLabels[sortKey] ?? sortKey}</strong>
          {" · "}
          <button className="wd-sort-reset" onClick={() => handleSort("rank")}>Show recommendation order</button>
        </div>
      )}
      <table className="wd-candidate-table">
        <thead>
          <tr>
            <th className="wd-sortable" onClick={() => handleSort("rank")}>#{indicator("rank")}</th>
            <th className="wd-sortable" onClick={() => handleSort("symbol")}>Symbol{indicator("symbol")}</th>
            <th className="wd-sortable" onClick={() => handleSort("underlyingPrice")}>Price{indicator("underlyingPrice")}</th>
            <th className="wd-sortable" onClick={() => handleSort("expiration")}>Exp{indicator("expiration")}</th>
            <th className="wd-sortable" onClick={() => handleSort("dte")}>DTE{indicator("dte")}</th>
            <th className="wd-sortable" onClick={() => handleSort("strike")}>Strike{indicator("strike")}</th>
            <th className="wd-sortable" onClick={() => handleSort("delta")}>Δ{indicator("delta")}</th>
            <th className="wd-sortable" onClick={() => handleSort("bid")}>Bid{indicator("bid")}</th>
            <th className="wd-sortable" onClick={() => handleSort("ask")}>Ask{indicator("ask")}</th>
            <th className="wd-sortable" onClick={() => handleSort("spreadPercent")}>Spread{indicator("spreadPercent")}</th>
            <th className="wd-sortable" onClick={() => handleSort("openInterest")}>OI{indicator("openInterest")}</th>
            <th className="wd-sortable" onClick={() => handleSort("premiumYieldAnnualized")}>Yield{indicator("premiumYieldAnnualized")}</th>
            <th className="wd-sortable" onClick={() => handleSort("appreciationPerShare")}>Apprec{indicator("appreciationPerShare")}</th>
            <th className="wd-sortable" onClick={() => handleSort("totalReturnIfCalledPercent")}>If Called{indicator("totalReturnIfCalledPercent")}</th>
            <th className="wd-sortable" onClick={() => handleSort("capitalRequired")}>Capital{indicator("capitalRequired")}</th>
            <th className="wd-sortable" onClick={() => handleSort("cashRemaining")}>Remaining{indicator("cashRemaining")}</th>
            <th className="wd-sortable" onClick={() => handleSort("assessment")}>Exec{indicator("assessment")}</th>
            <th>Posture</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr
              key={`${c.symbol}-${c.expiration}-${c.strike}`}
              className={`wd-posture-row wd-posture-${c.posture.toLowerCase()}${selectedCandidate && c.symbol === selectedCandidate.symbol && c.strike === selectedCandidate.strike && c.expiration === selectedCandidate.expiration ? " wd-row-selected" : ""}`}
              onClick={() => onSelect(c)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c); } }}
            >
              <td>{c.rank}</td>
              <td className={`wd-symbol${c.governance.status === "danger" ? " wd-symbol-danger" : ""}`}>
                {c.governance.status === "danger" && <span className="wd-gov-warn">⚠</span>}
                {c.governance.status === "review" && <span className="wd-gov-review">ⓘ</span>}
                {c.symbol}
              </td>
              <td>${c.underlyingPrice.toFixed(2)}</td>
              <td>{c.expiration.slice(5)}</td>
              <td>{c.dte}</td>
              <td className={!c.strikeAbovePrice ? "wd-warn-value" : ""}>${c.strike}</td>
              <td>{c.delta.toFixed(2)}</td>
              <td>${c.bid.toFixed(2)}</td>
              <td>${c.ask.toFixed(2)}</td>
              <td className={c.spreadPercent > 15 ? "wd-warn-value" : ""}>{c.spreadPercent.toFixed(0)}%</td>
              <td className={c.openInterest < 50 ? "wd-warn-value" : ""}>{c.openInterest}</td>
              <td>{c.premiumYieldAnnualized.toFixed(1)}%</td>
              <td className={c.appreciationPerShare < 0 ? "wd-negative-value" : ""}>
                {c.appreciationPerShare >= 0 ? `+$${c.appreciationPerShare.toFixed(2)}` : `-$${Math.abs(c.appreciationPerShare).toFixed(2)}`}
              </td>
              <td className={c.totalReturnIfCalledPercent < 0 ? "wd-negative-value" : ""}>
                {c.totalReturnIfCalledPercent.toFixed(1)}%
              </td>
              <td>{!c.affordable && <span className="wd-unaffordable-mark">$</span>}${c.capitalRequired.toLocaleString()}</td>
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

// --- Contingent Call Table ---

function ContingentCallTable({ rows, selectedRow, onSelect }: { rows: ContingentCallRow[]; selectedRow: CallTableRow | null; onSelect: (row: CallTableRow) => void }) {
  const selectedKey = selectedRow?.availability === "if-assigned"
    ? `${selectedRow.symbol}-${selectedRow.expiration}-${selectedRow.strike}-${selectedRow.originatingPut.expiration}`
    : null;

  return (
    <table className="wd-candidate-table wd-contingent-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Call Exp</th>
          <th>DTE</th>
          <th>Strike</th>
          <th>Δ</th>
          <th>Bid</th>
          <th>Ask</th>
          <th>Spread</th>
          <th>OI</th>
          <th>Yield (basis)</th>
          <th>Basis</th>
          <th>Source Put</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const key = `${r.symbol}-${r.expiration}-${r.strike}-${r.originatingPut.expiration}`;
          return (
            <tr
              key={key}
              className={`wd-posture-row wd-posture-projected${key === selectedKey ? " wd-row-selected" : ""}`}
              onClick={() => onSelect(r)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r); } }}
            >
              <td className="wd-symbol">{r.symbol}</td>
              <td>{r.expiration.slice(5)}</td>
              <td>{r.dte}</td>
              <td>${r.strike}</td>
              <td>{r.delta.toFixed(2)}</td>
              <td>${r.bid.toFixed(2)}</td>
              <td>${r.ask.toFixed(2)}</td>
              <td className={r.spreadPercent > 15 ? "wd-warn-value" : ""}>{r.spreadPercent.toFixed(0)}%</td>
              <td className={r.openInterest < 50 ? "wd-warn-value" : ""}>{r.openInterest}</td>
              <td>{r.yieldFromBasis != null ? `${r.yieldFromBasis.toFixed(1)}%` : "—"}</td>
              <td>${r.conditionedBasis.toFixed(0)}</td>
              <td className="wd-contingent-source">${r.originatingPut.strike} {r.originatingPut.expiration.slice(5)}</td>
              <td><span className="wd-posture-badge wd-posture-projected">PROJECTED</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// --- Call Empty State Diagnosis ---

/**
 * Derive an evidence-based explanation for why no covered-call candidates are shown.
 * Delegates to the extracted, testable call-empty-state module.
 */
function deriveCallEmptyStateMsg(
  snapshot: PortfolioSnapshot,
  scanTimestamp: string | null,
  evidenceMeta: { generation: number; generatedAt: string; coverage: any } | null
): string {
  return deriveCallEmptyState({
    inventory: snapshot.inventory,
    hasScanCompleted: !!scanTimestamp,
    hasEvidenceMeta: !!evidenceMeta,
  });
}

// --- Session State Formatting ---

// --- (Session state formatting now in AppShell) ---
