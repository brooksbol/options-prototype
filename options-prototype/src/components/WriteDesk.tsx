/**
 * Write Desk — Operational Application Shell
 *
 * The first true operator surface in the options prototype.
 * Answers: "What should I write today?"
 *
 * Composes portfolio state, market scanning, contract evaluation,
 * execution assessment, and ranking into one operational workflow.
 */

import { useState, useMemo, useCallback } from "react";
import { navigateTo } from "../router";
import { createDemoSnapshot } from "../write-desk/demo-snapshot";
import { scanCalls, type PutCandidate, type CallCandidate, type CallInventoryItem } from "../write-desk/scan-orchestrator";
import { DEFAULT_SCAN_CONFIG } from "../write-desk/scan-orchestrator";
import { acquireEvidence } from "../write-desk/acquire-evidence";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY, type RecommendationPolicy } from "../write-desk/recommend";
import { type ScanTelemetry } from "../write-desk/universe-scanner";
import { DEFAULT_PLANNER_CONFIG } from "../cache/scan-planner";
import { getDurableCache } from "../cache/durable-cache";
import { createScanAuditRecord, persistScanAudit, type ScanAuditRecord } from "../write-desk/scan-audit";
import { loadCandidateUniverseWithDescriptor } from "../universe/universe";
import { getProvider, isTradierConfigured } from "../providers";
import { MarketSessionPolicy } from "../market-session/session-policy";
import { getTradingCalendar } from "../market-session/trading-calendar";
import { FidelityUpload } from "./FidelityUpload";
import { RecommendationBrief } from "./RecommendationBrief";
import type { TablePositionContext } from "../write-desk/brief-builder";
import { loadWorkingIntents, addPendingIntent, updatePendingIntent, createPendingIntent, type PendingIntent } from "../execution/pending-intent";
import { buildWriteIntent } from "../execution/write-intent";
import type { PortfolioSnapshot, PortfolioSourceType } from "../write-desk/types";
import "../write-desk.css";
import "../recommendation-brief.css";

// --- Component ---

export function WriteDesk() {
  const [source, setSource] = useState<PortfolioSourceType>("demo");
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(() =>
    source === "demo" ? createDemoSnapshot() : null
  );
  const [fidelitySnapshot, setFidelitySnapshot] = useState<PortfolioSnapshot | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ done: number; total: number } | null>(null);
  const [putCandidates, setPutCandidates] = useState<PutCandidate[]>([]);
  const [putWaitCandidates, setPutWaitCandidates] = useState<PutCandidate[]>([]);
  const [putCoverage, setPutCoverage] = useState<{ status: string; universeSize: number; covered: number; fresh: number; staleUsable: number; missing: number; confirmedAbsence: number; refreshedThisPass: number; deferredThisPass: number } | null>(null);
  const [putIsProvisional, setPutIsProvisional] = useState(true);
  const [callCandidates, setCallCandidates] = useState<CallCandidate[]>([]);
  const [callInventory, setCallInventory] = useState<CallInventoryItem[]>([]);
  const [callExcluded, setCallExcluded] = useState<{ symbol: string; reason: string }[]>([]);
  const [scanTimestamp, setScanTimestamp] = useState<string | null>(null);
  const [lastAudit, setLastAudit] = useState<ScanAuditRecord | null>(null);
  const [lastTelemetry, setLastTelemetry] = useState<ScanTelemetry | null>(null);
  const [policy, setPolicy] = useState(DEFAULT_RECOMMENDATION_POLICY);
  const [selectedCandidate, setSelectedCandidate] = useState<PutCandidate | null>(null);
  const [tablePosition, setTablePosition] = useState<TablePositionContext | null>(null);
  const [pendingIntents, setPendingIntents] = useState<PendingIntent[]>(() => loadWorkingIntents());
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);

  const providerKey = isTradierConfigured() ? "tradier" : "mock";
  const provider = useMemo(() => getProvider(providerKey), [providerKey]);

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
    setCallCandidates([]);
    setCallInventory([]);
    setCallExcluded([]);
    setScanTimestamp(null);
    setLastAudit(null);
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
      setCallCandidates([]);
      setCallInventory([]);
      setCallExcluded([]);
      setScanTimestamp(null);
      setLastAudit(null);
    }
  }, [source]);

  // Scan handler — runs acquisition passes in a loop until coverage is complete
  // or a stopping condition is reached (session-blocked, rate-limited, all stalled).
  // One click = full acquisition. The operator should never need to click repeatedly.
  const handleScan = useCallback(async () => {
    if (!snapshot || snapshot.readiness.status !== "READY" || !snapshot.deployableCash) return;
    setScanning(true);
    setScanProgress(null);
    setPutCandidates([]);
    setPutWaitCandidates([]);
    setPutCoverage(null); setPutIsProvisional(true);
    setCallCandidates([]);
    setCallInventory([]);
    setCallExcluded([]);

    try {
      const plannerConfig = { ...DEFAULT_PLANNER_CONFIG, provider: providerKey, environment: "sandbox", prioritySymbols: snapshot.inventory.map((p) => p.symbol) };
      const cache = getDurableCache();
      const sessionState = sessionClassification.state;
      const sessionClosed = sessionState === "CLOSED_CANONICAL" || sessionState === "NON_TRADING_DAY" || sessionState === "PREMARKET" || sessionState === "REGULAR_OPEN_DELAY";

      let passCount = 0;
      const MAX_PASSES = 20; // safety limit (~800 symbols at 40/pass)
      let lastAcqResult: Awaited<ReturnType<typeof acquireEvidence>> | null = null;

      // Acquisition loop: keep running passes until no more work or limit reached
      while (passCount < MAX_PASSES) {
        passCount++;
        setScanProgress({ done: passCount, total: MAX_PASSES });

        const acqResult = await acquireEvidence(
          universe.symbols,
          provider,
          plannerConfig,
          [],
          (_phase, done, _total) => setScanProgress({ done: passCount * 40 + done, total: universe.symbols.length })
        );
        lastAcqResult = acqResult;

        // Stopping conditions
        if (acqResult.status === "NO_WORK_REQUIRED" || acqResult.status === "STALLED") break;
        if (acqResult.status === "SKIPPED_SESSION_CLOSED" || acqResult.status === "SKIPPED_NON_TRADING" || acqResult.status === "SKIPPED_PREMARKET" || acqResult.status === "SKIPPED_OPEN_DELAY") break;
        if (acqResult.status === "FAILED") break;
        if (acqResult.refreshedSymbols.length === 0 && acqResult.deferred.length === 0) break;

        // Update recommendations after each pass so the UI shows progressive results
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
        setPutCoverage({
          status: recResult.coverage.symbolsMissingChain === 0 && recResult.coverageRequests.length === 0 ? "COMPLETE" : "BUILDING",
          universeSize: universe.symbols.length,
          covered: recResult.coverage.symbolsWithEvidence + recResult.coverage.confirmedAbsence,
          fresh: recResult.coverage.symbolsWithEvidence,
          staleUsable: 0,
          missing: recResult.coverage.symbolsMissingChain,
          confirmedAbsence: recResult.coverage.confirmedAbsence,
          refreshedThisPass: acqResult.refreshedSymbols.length,
          deferredThisPass: acqResult.deferred.length,
        });
        setPutIsProvisional(recResult.coverageRequests.length > 0);

        // If coverage is complete, stop
        if (recResult.coverage.symbolsMissingChain === 0 && recResult.coverageRequests.length === 0) break;
      }

      // Final recommendation computation
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
      setPutCoverage({
        status: recResult.coverage.symbolsMissingChain === 0 && recResult.coverageRequests.length === 0 ? "COMPLETE" : "BUILDING",
        universeSize: universe.symbols.length,
        covered: recResult.coverage.symbolsWithEvidence + recResult.coverage.confirmedAbsence,
        fresh: recResult.coverage.symbolsWithEvidence,
        staleUsable: 0,
        missing: recResult.coverage.symbolsMissingChain,
        confirmedAbsence: recResult.coverage.confirmedAbsence,
        refreshedThisPass: lastAcqResult?.refreshedSymbols.length ?? 0,
        deferredThisPass: lastAcqResult?.deferred.length ?? 0,
      });
      setPutIsProvisional(recResult.coverageRequests.length > 0);
      if (lastAcqResult) {
        setLastTelemetry({
          passId: lastAcqResult.telemetry.passId,
          startedAt: lastAcqResult.telemetry.startedAt,
          completedAt: recResult.computedAt,
          universe: { id: providerKey + ":sandbox", version: "yahoo-496-v1", totalSymbols: universe.symbols.length },
          generation: { ...lastAcqResult.telemetry.generation },
          pass: { selectedSymbols: lastAcqResult.refreshedSymbols, completedSymbols: lastAcqResult.refreshedSymbols, deferredSymbols: lastAcqResult.deferred.map((d) => d.symbol), errors: lastAcqResult.errors },
          cache: { l1MemoryHits: 0, l2IndexedDBHits: 0, networkFetches: lastAcqResult.telemetry.provider.marketSensitiveRequestsExecuted + lastAcqResult.telemetry.provider.marketInsensitiveRequestsExecuted, staleHits: 0, indexedDBWrites: lastAcqResult.telemetry.provider.canonicalWritesAccepted },
          provider: { expirationCalls: lastAcqResult.telemetry.provider.marketInsensitiveRequestsExecuted, chainCalls: lastAcqResult.telemetry.provider.marketSensitiveRequestsExecuted, quoteCalls: 0, failures: lastAcqResult.telemetry.provider.failures, rateLimitDeferrals: lastAcqResult.telemetry.provider.requestsBlockedBySession },
        });
      }

      // Call scan (single pass — inventory is small)
      const callResult = await scanCalls(
        snapshot.inventory,
        provider,
        DEFAULT_SCAN_CONFIG,
        (done, total) => setScanProgress({ done, total })
      );
      setCallCandidates(callResult.candidates);
      setCallInventory(callResult.inventory);
      setCallExcluded(callResult.excluded);

      setScanTimestamp(new Date().toISOString());

      // Audit
      const audit = createScanAuditRecord(
        snapshot,
        recResult.candidates,
        [],
        callResult.candidates,
        callResult.inventory,
        callResult.excluded,
        providerKey,
        { version: DEFAULT_RECOMMENDATION_POLICY.version, targetDelta: DEFAULT_RECOMMENDATION_POLICY.contractSelection.targetDelta, dteRange: DEFAULT_RECOMMENDATION_POLICY.contractSelection.eligibleDteRange }
      );
      persistScanAudit(audit);
      setLastAudit(audit);
    } finally {
      setScanning(false);
      setScanProgress(null);
    }
  }, [snapshot, provider, policy]);

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
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning
              ? scanProgress
                ? `${scanProgress.done}/${scanProgress.total}`
                : "…"
              : scanTimestamp ? "Rescan" : "Scan"
            }
          </button>

          {scanTimestamp && (
            <PolicyStrip
              policy={policy}
              onChange={(updated) => { setPolicy(updated); handleReRecommend(updated); }}
            />
          )}

          {scanTimestamp && (
            <span className="wd-scan-meta-inline">
              {new Date(scanTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" · "}{providerKey}{providerKey === "tradier" ? " 15m" : ""}
              {" · "}{universe.descriptor.totalSymbols} ETFs
              {putCoverage && putCoverage.status === "COMPLETE" && " · ✓"}
            </span>
          )}
        </div>
      )}

      {/* ═══ CANDIDATE BOARD ═══ */}
      {snapshot && snapshot.readiness.status === "READY" && (
        <section className="wd-content">
            {/* Put Candidates */}
            {scanTimestamp && (
              <div className="wd-put-section">
                <h3 className="wd-section-title">
                  {putCoverage?.status === "COMPLETE"
                    ? "Top 20 Puts — Cash-Secured"
                    : "Put Candidates — Cash-Secured"
                  }
                  {putCoverage && (
                    <span className={`wd-coverage-badge wd-coverage-${putCoverage.status.toLowerCase()}`}>
                      {putCoverage.status === "COMPLETE"
                        ? `${putCoverage.universeSize} of ${putCoverage.universeSize} covered`
                        : `${putCoverage.covered} / ${putCoverage.universeSize} covered · ${putCoverage.status}`
                      }
                    </span>
                  )}
                  <label className="wd-affordable-toggle">
                    <input type="checkbox" checked={showAffordableOnly} onChange={(e) => setShowAffordableOnly(e.target.checked)} />
                    <span>Affordable only</span>
                  </label>
                </h3>

                {putCandidates.length > 0 ? (
                  <>
                    {putIsProvisional && (
                      <p className="wd-provisional-note">Provisional leaders from {putCoverage?.covered ?? 0} of {putCoverage?.universeSize ?? 0} evaluated.</p>
                    )}
                    <PutCandidateTable candidates={showAffordableOnly ? putCandidates.filter((c) => c.affordable) : putCandidates} selectedSymbol={selectedCandidate?.symbol ?? null} selectedStrike={selectedCandidate?.strike ?? null} onSelect={(c, pos) => { setSelectedCandidate(c); setTablePosition(pos); }} />
                  </>
                ) : (
                  <div className="wd-no-trade">
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

            {/* Call Candidates */}
            {scanTimestamp && (
              <div className="wd-call-section">
                <h3 className="wd-section-title">Call Candidates — Covered</h3>
                {callCandidates.length > 0 ? (
                  <CallCandidateTable candidates={callCandidates} selectedSymbol={selectedCandidate?.symbol ?? null} selectedStrike={selectedCandidate?.strike ?? null} onSelect={(c) => setSelectedCandidate(c as unknown as PutCandidate)} />
                ) : (
                  <CallInventoryPanel inventory={callInventory} />
                )}
              </div>
            )}

            {/* Call Excluded (collapsed) */}
            {callExcluded.length > 0 && (
              <details className="wd-excluded-details">
                <summary>Call Excluded ({callExcluded.length} symbols)</summary>
                <ul className="wd-excluded-list">
                  {callExcluded.map((e, i) => (
                    <li key={i}><span className="wd-excluded-symbol">{e.symbol}</span> — {e.reason}</li>
                  ))}
                </ul>
              </details>
            )}

            {/* Runtime Telemetry (verification panel) */}
            {lastTelemetry && (
              <details className="wd-excluded-details" open>
                <summary>Runtime Telemetry — Pass {lastTelemetry.passId.slice(-8)}</summary>
                <div className="wd-telemetry-grid">
                  <div className="wd-telemetry-section">
                    <strong>Universe</strong>
                    <span>ID: {lastTelemetry.universe.id}</span>
                    <span>Version: {lastTelemetry.universe.version}</span>
                    <span>Total: {lastTelemetry.universe.totalSymbols}</span>
                  </div>
                  <div className="wd-telemetry-section">
                    <strong>Generation</strong>
                    <span>Cursor: {lastTelemetry.generation.cursorBefore} → {lastTelemetry.generation.cursorAfter}</span>
                    <span>Covered: {lastTelemetry.generation.coveredBefore} → {lastTelemetry.generation.coveredAfter}</span>
                    <span>Remaining: {lastTelemetry.generation.remaining}</span>
                    <span>Status: {lastTelemetry.generation.status}</span>
                  </div>
                  <div className="wd-telemetry-section">
                    <strong>Pass</strong>
                    <span>Selected: {lastTelemetry.pass.selectedSymbols.length} symbols</span>
                    <span>Completed: {lastTelemetry.pass.completedSymbols.length}</span>
                    <span>Deferred: {lastTelemetry.pass.deferredSymbols.length}</span>
                    <span>Errors: {lastTelemetry.pass.errors.length}{lastTelemetry.pass.errors.length > 0 ? ` (${lastTelemetry.pass.errors.join(", ")})` : ""}</span>
                  </div>
                  <div className="wd-telemetry-section">
                    <strong>Cache</strong>
                    <span>L1 Memory: {lastTelemetry.cache.l1MemoryHits}</span>
                    <span>L2 IndexedDB: {lastTelemetry.cache.l2IndexedDBHits}</span>
                    <span>Network: {lastTelemetry.cache.networkFetches}</span>
                    <span>Stale reused: {lastTelemetry.cache.staleHits}</span>
                    <span>IDB writes: {lastTelemetry.cache.indexedDBWrites}</span>
                  </div>
                  <div className="wd-telemetry-section">
                    <strong>Provider</strong>
                    <span>Expirations: {lastTelemetry.provider.expirationCalls}</span>
                    <span>Chains: {lastTelemetry.provider.chainCalls}</span>
                    <span>Quotes: {lastTelemetry.provider.quoteCalls}</span>
                    <span>Failures: {lastTelemetry.provider.failures}</span>
                  </div>
                </div>
                <details style={{ marginTop: 6 }}>
                  <summary style={{ fontSize: 9, color: "#666" }}>Selected symbols</summary>
                  <pre className="vr-raw-json" style={{ maxHeight: 120 }}>{lastTelemetry.pass.selectedSymbols.join(", ")}</pre>
                </details>
              </details>
            )}

            {/* Audit Evidence (collapsed) */}
            {lastAudit && (
              <details className="wd-excluded-details">
                <summary>Scan Audit — {lastAudit.scannedAt.split("T")[1]?.slice(0, 8)}</summary>
                <div className="wd-audit-summary">
                  <span>Source: {lastAudit.portfolioSourceType}</span>
                  <span>Provider: {lastAudit.marketProvider}{lastAudit.delayedData ? " (delayed)" : ""}</span>
                  <span>Puts: {lastAudit.putCandidates.length} candidates, {lastAudit.putExcluded.length} excluded</span>
                  <span>Calls: {lastAudit.callCandidates.length} candidates, {lastAudit.callExcluded.length} excluded</span>
                  <span>Actionable: {lastAudit.actionableCount} | Edge: {lastAudit.edgeCount} | Wait: {lastAudit.waitCount}</span>
                  <span>Policy: {lastAudit.scanConfigVersion}</span>
                </div>
                <details className="wd-excluded-details" style={{ marginTop: 8 }}>
                  <summary>Raw Audit JSON</summary>
                  <pre className="vr-raw-json">{JSON.stringify(lastAudit, null, 2)}</pre>
                </details>
              </details>
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
            <td>{c.yieldAnnualized != null ? `${c.yieldAnnualized.toFixed(1)}%` : "—"}</td>
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

function CallCandidateTable({ candidates, selectedSymbol, selectedStrike, onSelect }: { candidates: CallCandidate[]; selectedSymbol: string | null; selectedStrike: number | null; onSelect: (c: CallCandidate) => void }) {
  const { sorted, handleSort, indicator, isRecommendationOrder, sortKey } = useSortableTable(candidates, "rank", "asc");

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
          <th className="wd-sortable" onClick={() => handleSort("freeShares")}>Free Shares{indicator("freeShares")}</th>
          <th className="wd-sortable" onClick={() => handleSort("maxContracts")}>Contracts{indicator("maxContracts")}</th>
          <th className="wd-sortable" onClick={() => handleSort("premiumPerContract")}>Premium{indicator("premiumPerContract")}</th>
          <th className="wd-sortable" onClick={() => handleSort("assessment")}>Exec{indicator("assessment")}</th>
          <th>Posture</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c) => (
          <tr
            key={`${c.symbol}-${c.expiration}-${c.strike}`}
            className={`wd-posture-row wd-posture-${c.posture.toLowerCase()}${c.symbol === selectedSymbol && c.strike === selectedStrike ? " wd-row-selected" : ""}`}
            onClick={() => onSelect(c)}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c); } }}
          >
            <td>{c.rank}</td>
            <td className="wd-symbol">{c.symbol}</td>
            <td>{c.expiration.slice(5)}</td>
            <td>{c.dte}</td>
            <td>${c.strike}{c.strikeAbovePrice ? " ↑" : ""}</td>
            <td>{c.delta.toFixed(2)}</td>
            <td>${c.bid.toFixed(2)}</td>
            <td>${c.ask.toFixed(2)}</td>
            <td className={c.spreadPercent > 15 ? "wd-warn-value" : ""}>{c.spreadPercent.toFixed(0)}%</td>
            <td className={c.openInterest < 50 ? "wd-warn-value" : ""}>{c.openInterest}</td>
            <td>{c.yieldAnnualized != null ? `${c.yieldAnnualized.toFixed(1)}%` : "—"}</td>
            <td>{c.freeShares}</td>
            <td>{c.maxContracts}</td>
            <td>${c.premiumPerContract.toFixed(0)}</td>
            <td>{c.assessment.score}</td>
            <td><span className={`wd-posture-badge wd-posture-${c.posture.toLowerCase()}`}>{c.posture}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}

// --- Call Inventory Panel (no-capacity state) ---

function CallInventoryPanel({ inventory }: { inventory: CallInventoryItem[] }) {
  if (inventory.length === 0) {
    return <p className="wd-no-capacity">No owned positions found in portfolio.</p>;
  }

  const hasCapacity = inventory.some((item) => item.maxContracts > 0 && !item.reason);
  if (hasCapacity) return null; // Candidates will be shown instead

  return (
    <div className="wd-call-inventory">
      <p className="wd-no-capacity">No covered-call capacity currently exists.</p>
      <table className="wd-inventory-table">
        <thead>
          <tr><th>Symbol</th><th>Owned</th><th>Encumbered</th><th>Free</th><th>Status</th></tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.symbol} className="wd-row-unavailable">
              <td>{item.symbol}</td>
              <td>{item.sharesOwned}</td>
              <td>{item.sharesEncumbered}</td>
              <td>{item.sharesFree}</td>
              <td className="wd-reason">{item.reason ?? "Available"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        Δ Range
        <span className="wd-policy-value">{policy.contractSelection.admissibleDeltaRange.min}–{policy.contractSelection.admissibleDeltaRange.max}</span>
      </label>
    </div>
  );
}
