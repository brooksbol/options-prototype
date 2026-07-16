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

  // Refresh Now — nudges the backend to prioritize work. Does NOT run browser acquisition.
  const handleRefresh = useCallback(() => {
    fetch("/api/evidence/refresh", { method: "POST" }).catch(() => {});
  }, []);

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

      {/* ═══ BAND 1: Identity / Status / Session ═══ */}
      <div className="wd-band wd-band-identity">
        <div className="wd-band-left">
          <h1 className="wd-title">Write Desk</h1>
          <div className="wd-source-inline">
            <select
              className="wd-source-select"
              value={source}
              onChange={(e) => handleSourceChange(e.target.value as PortfolioSourceType)}
            >
              <option value="demo">Demo Portfolio</option>
              <option value="fidelity">Fidelity Snapshot</option>
            </select>
            {source === "demo" && <span className="wd-sim-badge">SIMULATED</span>}
          </div>
          {snapshot && snapshot.readiness.status === "READY" && snapshot.deployableCash != null && (
            <span className="wd-deploy-inline">
              <span className="wd-deploy-amount">${snapshot.deployableCash.toLocaleString()}</span>
              <span className="wd-deploy-label">deployable</span>
            </span>
          )}
          {snapshot && snapshot.readiness.status === "READY" && (
            <span className="wd-ready-dot" title="Portfolio ready">●</span>
          )}
          {snapshot && snapshot.readiness.status !== "READY" && (
            <span className="wd-not-ready-dot" title={`Portfolio: ${snapshot.readiness.status}`}>○</span>
          )}
        </div>
        <div className="wd-band-right">
          <span className="wd-session-inline">
            <span className={`wd-session-pip wd-session-${sessionClassification.state.toLowerCase()}`} />
            <span className="wd-session-text">{formatSessionState(sessionClassification.state)}</span>
            <span className="wd-session-date">· {sessionClassification.canonicalSessionDate}</span>
          </span>
          <button className="wd-labs-link" onClick={() => navigateTo("/labs")}>Labs →</button>
        </div>
      </div>

      {/* Fidelity Upload (always shown in fidelity mode — compact when loaded) */}
      {source === "fidelity" && (
        <div className="wd-band wd-band-upload">
          <FidelityUpload
            onSnapshotChange={handleFidelitySnapshotChange}
            onFileChange={handleFidelityFileChange}
          />
        </div>
      )}

      {/* ═══ BAND 2: Portfolio Summary (compact, with disclosure) ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (
        <div className="wd-band wd-band-portfolio">
          <PortfolioSummaryBand snapshot={snapshot} pendingIntents={pendingIntents} onIntentResolve={(id, status) => { updatePendingIntent(id, status); setPendingIntents(loadWorkingIntents()); }} />
        </div>
      )}

      {/* ═══ BAND 3: Policy + Scan ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (
        <div className="wd-band wd-band-controls">
          <button
            className="wd-scan-btn"
            onClick={handleRefresh}
          >
            Refresh
          </button>

          {(scanTimestamp || putCandidates.length > 0) && (
            <PolicyStrip
              policy={policy}
              onChange={(updated) => {
                setPolicy(updated);
                handleReRecommend(updated);
                updateWorkspace({
                  writeDeskTargetDelta: updated.contractSelection.targetDelta,
                  writeDeskTargetDte: updated.contractSelection.targetDte,
                  writeDeskRankingMode: updated.ranking.mode,
                  writeDeskDeltaMin: updated.contractSelection.admissibleDeltaRange.min,
                  writeDeskDeltaMax: updated.contractSelection.admissibleDeltaRange.max,
                });
              }}
            />
          )}

          {evidenceMeta && (() => {
            const sessionPolicy = new MarketSessionPolicy(getTradingCalendar());
            const currentSession = sessionPolicy.classify(new Date());
            const sessionClosed = currentSession.state === "CLOSED_CANONICAL" || currentSession.state === "NON_TRADING_DAY" || currentSession.state === "PREMARKET";
            const indicator = deriveTrustState({
              coverage: evidenceMeta.coverage,
              universe: evidenceMeta.coverage ? (evidenceMeta.coverage.ready + evidenceMeta.coverage.absent + evidenceMeta.coverage.pending + (evidenceMeta.coverage.failed ?? 0)) : 496,
              generatedAt: evidenceMeta.generatedAt,
              serviceAvailable: lastPollResult !== "error",
              sessionClosed,
              isAcquiring: putCoverage ? putCoverage.missing > 0 : evidenceMeta.coverage?.pending > 0,
            });
            const covered = indicator.covered;
            const universeCount = indicator.universe;
            const coveragePct = universeCount > 0 ? (covered / universeCount) * 100 : 0;
            return (
              <>
                <span className={`wd-evidence-indicator wd-evidence-${indicator.color}`} title={`Trust: ${indicator.trustLabel} · Generation: ${evidenceMeta.generation}`}>
                  <span className="wd-evidence-dot">●</span>
                  {" "}{indicator.trustLabel}
                  {" · "}{covered}/{universeCount} covered
                  {" · "}{indicator.freshnessLabel}
                  {indicator.activity === "updating" && " · Updating"}
                  {lastPollResult === "304" && " · ✓"}
                </span>
                <div className="wd-coverage-bar" title={`${covered} of ${universeCount} symbols covered (${coveragePct.toFixed(0)}%)`}>
                  <div
                    className={`wd-coverage-bar-fill wd-coverage-bar-${indicator.color}`}
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
              </>
            );
          })()}
          {!evidenceMeta && scanTimestamp && (
            <span className="wd-scan-meta-inline">
              {new Date(scanTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" · "}{universe.descriptor.totalSymbols} ETFs
            </span>
          )}
        </div>
      )}

      {/* ═══ CANDIDATE BOARD ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (
        <section className="wd-content">
            {/* Put Candidates */}
            {(scanTimestamp || evidenceMeta) && (
              <div className="wd-put-section">
                <h3 className="wd-section-title">
                  Put Candidates — Cash-Secured
                  <label className="wd-affordable-toggle">
                    <input type="checkbox" checked={showAffordableOnly} onChange={(e) => setShowAffordableOnly(e.target.checked)} />
                    <span>Affordable only</span>
                  </label>
                  <label className="wd-show-count">
                    Show
                    <select value={showCount} onChange={(e) => { const v = parseInt(e.target.value); setShowCount(v); updateWorkspace({ writeDeskShowCount: v }); }} className="wd-show-count-select">
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </label>
                </h3>

                {putFunnel && <FunnelInfographic funnel={putFunnel} showCount={showCount} backendResolved={evidenceMeta?.coverage ? (evidenceMeta.coverage.ready + evidenceMeta.coverage.absent) : undefined} />}

                {putCandidates.length > 0 ? (
                  <>
                    {putIsProvisional && (
                      <p className="wd-provisional-note">
                        Showing best from {putCoverage?.covered ?? 0} of {putCoverage?.universeSize ?? 496} evaluated · background acquisition continuing
                      </p>
                    )}
                    {(() => {
                      const filtered = showAffordableOnly ? putCandidates.filter((c) => c.affordable) : putCandidates;
                      const displayed = filtered.slice(0, showCount);
                      return (
                        <>
                          {filtered.length > 0 && (
                            <p className="wd-showing-count">Showing {displayed.length} of {filtered.length} eligible puts</p>
                          )}
                          <PutCandidateTable candidates={displayed} selectedSymbol={selectedCandidate?.symbol ?? null} selectedStrike={selectedCandidate?.strike ?? null} onSelect={(c, pos) => { setSelectedCandidate(c); setTablePosition(pos); }} />
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="wd-no-trade">
                    {putCoverage && putCoverage.missing > 0 ? (
                      <p className="wd-provisional-note">Acquiring evidence — recommendations will appear as symbols are evaluated...</p>
                    ) : (
                      <>
                        <p>
                          {putIsProvisional
                            ? `No actionable or edge put opportunities found in ${putCoverage?.covered ?? 0} of ${putCoverage?.universeSize ?? 0} symbols evaluated so far.`
                            : "No actionable or edge put opportunities available across the full universe."
                          }
                        </p>
                        {snapshot.deployableCash != null && snapshot.deployableCash < 3000 && (
                          <p className="wd-wait-label">
                            Deployable cash (${snapshot.deployableCash.toLocaleString()}) may be insufficient to secure any put in the universe. Minimum collateral is strike × 100.
                          </p>
                        )}
                      </>
                    )}
                    {putWaitCandidates.length > 0 && (
                      <div className="wd-wait-evidence">
                        <span className="wd-wait-label">Strongest WAIT among evaluated symbols:</span>
                        {putWaitCandidates.slice(0, 1).map((c) => (
                          <span key={c.symbol} className="wd-wait-detail">
                            {c.symbol} {c.expiration.slice(5)} ${c.strike} put — WAIT due to {c.spreadPercent.toFixed(0)}% spread, OI {c.openInterest}, vol {c.volume}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Coverage details (always shown after scan) */}
            {putCoverage && (
              <details className="wd-excluded-details">
                <summary>
                  Coverage: {putCoverage.covered} / {putCoverage.universeSize}
                  {putCoverage.missing > 0 && ` · ${putCoverage.missing} uncovered`}
                  {putCoverage.confirmedAbsence > 0 && ` · ${putCoverage.confirmedAbsence} no options`}
                  {putCoverage.refreshedThisPass > 0 && ` · ${putCoverage.refreshedThisPass} refreshed`}
                  {putCoverage.deferredThisPass > 0 && ` · ${putCoverage.deferredThisPass} deferred`}
                </summary>
                <div className="wd-coverage-detail">
                  <span>{putCoverage.fresh} fresh cache</span>
                  <span>{putCoverage.staleUsable} stale usable</span>
                  <span>{putCoverage.refreshedThisPass} network refreshed this pass</span>
                  <span>{putCoverage.deferredThisPass} deferred (over budget)</span>
                </div>
              </details>
            )}

            {/* Call Candidates — deferred during backend acquisition migration */}
            {(scanTimestamp || evidenceMeta) && (
              <div className="wd-call-section">
                <h3 className="wd-section-title">Call Candidates — Covered</h3>
                <p className="wd-deferred-note">
                  Covered-call recommendations deferred during backend acquisition migration.
                  Portfolio call capacity will be evaluated from backend-maintained evidence in a future slice.
                </p>
              </div>
            )}


        </section>
      )}

      {/* Placeholder when no portfolio ready */}
      {(!snapshot || snapshot.readiness.status !== "READY") && source !== "fidelity" && (
        <div className="wd-placeholder">
          <p>Upload required portfolio files to enable the operational write list.</p>
        </div>
      )}
    </div>
  );
}

// --- Portfolio Summary Band (compact, with disclosure for full detail) ---

function PortfolioSummaryBand({ snapshot, pendingIntents, onIntentResolve }: { snapshot: PortfolioSnapshot; pendingIntents: PendingIntent[]; onIntentResolve: (id: string, status: "filled" | "cancelled") => void }) {
  const callCapacity = snapshot.inventory.filter((p) => p.maxAdditionalContracts > 0);
  const noCapacity = snapshot.inventory.filter((p) => p.maxAdditionalContracts === 0);
  const workingIntents = pendingIntents.filter((i) => i.status === "working");

  return (
    <>
      {/* Inline summaries */}
      <div className="wd-portfolio-summary">
        {callCapacity.length > 0 && (
          <span className="wd-psm-item">
            <span className="wd-psm-label">Calls:</span>
            {callCapacity.map((p) => (
              <span key={p.symbol} className="wd-psm-chip wd-psm-chip-call">{p.symbol} · {p.maxAdditionalContracts}</span>
            ))}
          </span>
        )}
        {snapshot.existingPuts.length > 0 && (
          <span className="wd-psm-item">
            <span className="wd-psm-label">Short puts:</span>
            {snapshot.existingPuts.map((p, i) => (
              <span key={i} className="wd-psm-chip wd-psm-chip-put">{p.underlying} ${p.strike} {p.expiration.slice(5)}</span>
            ))}
          </span>
        )}
        {workingIntents.length > 0 && (
          <span className="wd-psm-item">
            <span className="wd-psm-label">Pending:</span>
            {workingIntents.map((i) => (
              <span key={i.id} className="wd-psm-chip wd-psm-chip-working">
                {i.symbol} {i.expiration.slice(5)} ${i.strike} {i.optionType === "put" ? "P" : "C"}
              </span>
            ))}
          </span>
        )}
        {snapshot.existingPuts.length === 0 && callCapacity.length === 0 && workingIntents.length === 0 && (
          <span className="wd-psm-item wd-psm-empty">No existing positions</span>
        )}
      </div>

      {/* Expandable full detail */}
      <details className="wd-portfolio-disclosure">
        <summary className="wd-portfolio-disclosure-summary">Portfolio detail</summary>
        <div className="wd-portfolio-detail-grid">
          {/* Call Capacity */}
          <div className="wd-detail-section">
            <h4 className="wd-detail-heading">Covered Call Capacity</h4>
            {callCapacity.length > 0 ? (
              <table className="wd-inventory-table">
                <thead>
                  <tr><th>Symbol</th><th>Owned</th><th>Encumbered</th><th>Free</th><th>Contracts</th></tr>
                </thead>
                <tbody>
                  {callCapacity.map((p) => (
                    <tr key={p.symbol}>
                      <td>{p.symbol}</td>
                      <td>{p.sharesOwned}</td>
                      <td>{p.sharesEncumbered}</td>
                      <td>{p.sharesFree}</td>
                      <td className="wd-capacity-available">{p.maxAdditionalContracts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="wd-no-capacity">No covered-call capacity.</p>
            )}
            {noCapacity.length > 0 && (
              <details className="wd-no-capacity-details">
                <summary>{noCapacity.length} position{noCapacity.length > 1 ? "s" : ""} without capacity</summary>
                <table className="wd-inventory-table">
                  <thead>
                    <tr><th>Symbol</th><th>Owned</th><th>Encumbered</th><th>Free</th><th>Reason</th></tr>
                  </thead>
                  <tbody>
                    {noCapacity.map((p) => (
                      <tr key={p.symbol} className="wd-row-unavailable">
                        <td>{p.symbol}</td>
                        <td>{p.sharesOwned}</td>
                        <td>{p.sharesEncumbered}</td>
                        <td>{p.sharesFree}</td>
                        <td className="wd-reason">
                          {p.sharesEncumbered >= p.sharesOwned
                            ? "Fully encumbered"
                            : p.sharesFree < 100
                              ? `${p.sharesFree} shares — below 1 lot`
                              : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>

          {/* Put Budget */}
          <div className="wd-detail-section">
            <h4 className="wd-detail-heading">Put Deployment</h4>
            <div className="wd-cash-display">
              <span className="wd-cash-amount">${snapshot.deployableCash?.toLocaleString() ?? "—"}</span>
              <span className="wd-cash-label">Deployable</span>
            </div>
            {snapshot.existingPuts.length > 0 && (
              <div className="wd-existing-puts">
                <span className="wd-existing-label">Short puts ({snapshot.existingPuts.length})</span>
                {snapshot.existingPuts.map((p, i) => (
                  <span key={i} className="wd-existing-put-tag">
                    {p.underlying} ${p.strike} {p.expiration}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Readiness metadata */}
          <div className="wd-detail-section">
            <h4 className="wd-detail-heading">Provenance</h4>
            <div className="wd-prov-meta">
              <span>Source: {snapshot.provenance.sourceLabel}</span>
              {snapshot.snapshotDate && <span>Date: {snapshot.snapshotDate}</span>}
              {snapshot.provenance.accountId && <span>Account: {snapshot.provenance.accountId}</span>}
            </div>
            {snapshot.readiness.warnings.length > 0 && (
              <div className="wd-readiness-warnings">
                {snapshot.readiness.warnings.map((w, i) => <p key={i} className="wd-warning-text">⚠ {w}</p>)}
              </div>
            )}
          </div>

          {/* Pending Intents */}
          {workingIntents.length > 0 && (
            <div className="wd-detail-section">
              <h4 className="wd-detail-heading">Pending Orders</h4>
              <table className="wd-inventory-table">
                <thead>
                  <tr><th>Contract</th><th>Qty</th><th>Limit</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {workingIntents.map((i) => (
                    <tr key={i.id}>
                      <td>{i.symbol} ${i.strike} {i.optionType === "put" ? "P" : "C"} {i.expiration.slice(5)}</td>
                      <td>{i.quantity}</td>
                      <td>{i.limitPrice != null ? `$${i.limitPrice.toFixed(2)}` : "—"}</td>
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
      </details>
    </>
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
    case "REGULAR_OPEN_DELAY": return "Market Open (awaiting delayed data)";
    case "REGULAR_OBSERVATION": return "Regular Session";
    case "DELAY_DRAIN": return "Session Closing (draining delayed data)";
    case "CLOSED_CANONICAL": return "Session Closed";
    case "NON_TRADING_DAY": return "Market Closed";
    default: return state;
  }
}

// --- Policy Strip ---

function PolicyStrip({ policy, onChange }: { policy: RecommendationPolicy; onChange: (p: RecommendationPolicy) => void }) {
  const updateDelta = (val: number) => {
    onChange({ ...policy, contractSelection: { ...policy.contractSelection, targetDelta: val } });
  };

  const updateDteTarget = (val: number) => {
    onChange({ ...policy, contractSelection: { ...policy.contractSelection, targetDte: val } });
  };

  const updateRankingMode = (mode: "execution_first" | "balanced" | "yield_first" | "capital_efficiency") => {
    onChange({ ...policy, ranking: { ...policy.ranking, mode } });
  };

  return (
    <div className="wd-policy-strip">
      <span className="wd-policy-label">Policy</span>
      <span className="wd-policy-version">{policy.version}</span>

      <label className="wd-policy-field">
        Δ
        <select
          value={policy.contractSelection.targetDelta.toFixed(2)}
          onChange={(e) => updateDelta(parseFloat(e.target.value))}
          className="wd-policy-select"
        >
          <option value="0.15">0.15</option>
          <option value="0.20">0.20</option>
          <option value="0.25">0.25</option>
          <option value="0.30">0.30</option>
          <option value="0.35">0.35</option>
          <option value="0.40">0.40</option>
          <option value="0.45">0.45</option>
          <option value="0.50">0.50</option>
        </select>
      </label>

      <label className="wd-policy-field">
        DTE
        <select
          value={policy.contractSelection.targetDte}
          onChange={(e) => updateDteTarget(parseInt(e.target.value))}
          className="wd-policy-select"
        >
          <option value="7">7</option>
          <option value="14">14</option>
          <option value="21">21</option>
          <option value="28">28</option>
          <option value="35">35</option>
          <option value="42">42</option>
          <option value="45">45</option>
        </select>
      </label>

      <label className="wd-policy-field">
        Range
        <span className="wd-policy-value">{policy.contractSelection.eligibleDteRange.min}–{policy.contractSelection.eligibleDteRange.max}</span>
      </label>

      <label className="wd-policy-field">
        Rank
        <select
          value={policy.ranking.mode}
          onChange={(e) => updateRankingMode(e.target.value as "execution_first" | "balanced" | "yield_first" | "capital_efficiency")}
          className="wd-policy-select"
        >
          <option value="execution_first">Execution First</option>
          <option value="balanced">Balanced</option>
          <option value="yield_first">Yield First</option>
          <option value="capital_efficiency">Capital Efficiency</option>
        </select>
      </label>

      <label className="wd-policy-field">
        Δ Min
        <select
          value={policy.contractSelection.admissibleDeltaRange.min.toFixed(2)}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange({ ...policy, contractSelection: { ...policy.contractSelection, admissibleDeltaRange: { ...policy.contractSelection.admissibleDeltaRange, min: val } } });
          }}
          className="wd-policy-select"
        >
          <option value="0.05">0.05</option>
          <option value="0.10">0.10</option>
          <option value="0.15">0.15</option>
          <option value="0.20">0.20</option>
          <option value="0.25">0.25</option>
          <option value="0.30">0.30</option>
          <option value="0.35">0.35</option>
          <option value="0.40">0.40</option>
        </select>
      </label>

      <label className="wd-policy-field">
        Δ Max
        <select
          value={policy.contractSelection.admissibleDeltaRange.max.toFixed(2)}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange({ ...policy, contractSelection: { ...policy.contractSelection, admissibleDeltaRange: { ...policy.contractSelection.admissibleDeltaRange, max: val } } });
          }}
          className="wd-policy-select"
        >
          <option value="0.20">0.20</option>
          <option value="0.25">0.25</option>
          <option value="0.30">0.30</option>
          <option value="0.35">0.35</option>
          <option value="0.40">0.40</option>
          <option value="0.45">0.45</option>
          <option value="0.50">0.50</option>
          <option value="0.60">0.60</option>
          <option value="0.70">0.70</option>
        </select>
      </label>
    </div>
  );
}
