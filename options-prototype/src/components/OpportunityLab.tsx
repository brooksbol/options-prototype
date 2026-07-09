/**
 * Opportunity Lab — radar instrument.
 *
 * Answers: "Where should I look next?"
 * Shows curated ETF universe with opportunity evidence.
 * Clicking a symbol drills into the Recommendation Lab.
 *
 * Progressive rendering: rows appear as each symbol is evaluated,
 * so the user sees results immediately rather than waiting for all 15.
 */

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { TradierProvider } from "../providers/tradier/TradierProvider";
import { MockMarketDataProvider } from "../providers/mock/MockMarketDataProvider";
import { isTradierConfigured, requireTradierConfig } from "../config/tradier";
import { evaluateSymbol } from "../opportunity/evaluate";
import { CURATED_UNIVERSE, ETF_DESCRIPTIONS, DEFAULT_OPPORTUNITY_POLICY, type OpportunityRow, type OpportunityPolicy } from "../opportunity/types";
import { explainOpportunity } from "../opportunity/explain";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import type { MarketDataProvider, CacheStats } from "../domain/provider";

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

// --- Sort types ---

type SortKey =
  | "symbol"
  | "price"
  | "capitalPerContract"
  | "nearestDte"
  | "callYield"
  | "putYield"
  | "callDelta"
  | "putDelta"
  | "iv"
  | "status";

type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  interesting: 0,
  monitor: 1,
  ineligible: 2,
  data_missing: 3,
};

function compareRows(a: OpportunityRow, b: OpportunityRow, key: SortKey, dir: SortDir): number {
  let av: number | string | null;
  let bv: number | string | null;

  switch (key) {
    case "symbol":
      av = a.symbol;
      bv = b.symbol;
      break;
    case "price":
      av = a.price;
      bv = b.price;
      break;
    case "capitalPerContract":
      av = a.capitalPerContract;
      bv = b.capitalPerContract;
      break;
    case "nearestDte":
      av = a.nearestDte;
      bv = b.nearestDte;
      break;
    case "callYield":
      av = a.callYield;
      bv = b.callYield;
      break;
    case "putYield":
      av = a.putYield;
      bv = b.putYield;
      break;
    case "callDelta":
      av = a.callDelta;
      bv = b.callDelta;
      break;
    case "putDelta":
      av = a.putDelta;
      bv = b.putDelta;
      break;
    case "iv":
      av = a.iv;
      bv = b.iv;
      break;
    case "status":
      av = STATUS_ORDER[a.status] ?? 9;
      bv = STATUS_ORDER[b.status] ?? 9;
      break;
    default:
      return 0;
  }

  // Nulls sort last regardless of direction
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;

  let cmp: number;
  if (typeof av === "string" && typeof bv === "string") {
    cmp = av.localeCompare(bv);
  } else {
    cmp = (av as number) - (bv as number);
  }

  return dir === "asc" ? cmp : -cmp;
}

// --- Props for drill-through ---

interface OpportunityLabProps {
  onSelectSymbol?: (symbol: string) => void;
}

// --- Component ---

export function OpportunityLab({ onSelectSymbol }: OpportunityLabProps) {
  const [ws] = useState(() => loadWorkspace());
  const providerKey = isTradierConfigured() ? "tradier" : "mock";
  const provider = useMemo(() => getProvider(providerKey), [providerKey]);

  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [cacheStats, setCacheStats] = useState<CacheStats>({ hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null });
  const [scanCacheDelta, setScanCacheDelta] = useState<{ hits: number; misses: number; apiCalls: number }>({ hits: 0, misses: 0, apiCalls: 0 });

  // Target delta — persisted to workspace
  const [targetDelta, setTargetDelta] = useState<number>(ws.opportunityTargetDelta ?? DEFAULT_OPPORTUNITY_POLICY.targetDelta);

  const policy = useMemo<OpportunityPolicy>(() => ({
    ...DEFAULT_OPPORTUNITY_POLICY,
    targetDelta,
  }), [targetDelta]);

  const handleDeltaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseFloat(e.target.value);
    setTargetDelta(val);
    updateWorkspace({ opportunityTargetDelta: val });
  }, []);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Expanded row (for inline evidence panel)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const toggleExpand = useCallback((symbol: string) => {
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol));
  }, []);

  // Progressive fetch: rows stream in as each symbol is evaluated.
  // Uses a local `cancelled` variable per effect invocation to handle
  // React strict mode double-mount without duplicate rows.
  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setScanProgress(0);
    setScanning(true);

    async function loadAll() {
      // Snapshot cache stats at scan start to compute per-scan delta
      const baseline = provider.getCacheStats();

      // Pre-warm quote cache with a single batch API call
      await provider.getQuotes(CURATED_UNIVERSE);
      if (cancelled) return;

      // Evaluate each symbol sequentially, streaming results
      for (let i = 0; i < CURATED_UNIVERSE.length; i++) {
        if (cancelled) return;
        const symbol = CURATED_UNIVERSE[i];
        const row = await evaluateSymbol(symbol, provider, policy);
        if (cancelled) return;

        setRows((prev) => [...prev, row]);
        setScanProgress(i + 1);

        const current = provider.getCacheStats();
        setCacheStats(current);
        setScanCacheDelta({
          hits: current.hits - baseline.hits,
          misses: current.misses - baseline.misses,
          apiCalls: current.apiCalls - baseline.apiCalls,
        });
      }

      if (!cancelled) setScanning(false);
    }

    loadAll();
    return () => { cancelled = true; };
  }, [provider, policy]);

  const handleDrill = useCallback((symbol: string) => {
    // Sync opportunity policy into recommendation lab workspace fields
    // so drill-through is consistent: same delta, nearest expiration
    updateWorkspace({
      selectedSymbol: symbol,
      activeTab: "recommendation",
      callTargetDelta: targetDelta,
      putTargetDelta: targetDelta,
      selectedExpiration: "", // let Recommendation Lab pick first available (nearest)
    });
    if (onSelectSymbol) onSelectSymbol(symbol);
  }, [onSelectSymbol, targetDelta]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      const defaultDesc = key === "callYield" || key === "putYield" || key === "price" || key === "iv";
      setSortDir(defaultDesc ? "desc" : "asc");
      return key;
    });
  }, []);

  // Apply sort
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [rows, sortKey, sortDir]);

  const interestingCount = rows.filter((r) => r.status === "interesting").length;
  const monitorCount = rows.filter((r) => r.status === "monitor").length;
  const dataIssues = rows.filter((r) => r.status === "data_missing").length;

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="opp-lab">
      <header className="opp-header">
        <h2>Opportunity Lab</h2>
        <span className="console-badge" style={{ background: "#2d4a3e", color: "#6fcf97" }}>
          {providerKey === "tradier" ? "Live Delayed" : "Mock Data"}
        </span>
        <div className="opp-summary">
          {scanning ? (
            <span className="opp-loading">Scanning {scanProgress}/{CURATED_UNIVERSE.length} symbols...</span>
          ) : (
            <>
              <span className="opp-stat opp-stat-interesting">{interestingCount} interesting</span>
              <span className="opp-stat">{monitorCount} monitor</span>
              {dataIssues > 0 && <span className="opp-stat opp-stat-missing">{dataIssues} data missing</span>}
              <span className="opp-stat-policy">
                Target Δ:
                <select
                  className="opp-delta-select"
                  value={targetDelta.toFixed(2)}
                  onChange={handleDeltaChange}
                  aria-label="Target Delta"
                >
                  <option value="0.10">0.10</option>
                  <option value="0.15">0.15</option>
                  <option value="0.20">0.20</option>
                  <option value="0.25">0.25</option>
                  <option value="0.30">0.30</option>
                  <option value="0.35">0.35</option>
                  <option value="0.40">0.40</option>
                  <option value="0.45">0.45</option>
                  <option value="0.50">0.50</option>
                </select>
                | Min yield: {policy.minYieldThreshold}%
              </span>
              <span className="opp-cache-stats">
                Scan: {scanCacheDelta.hits} hits / {scanCacheDelta.misses} misses | {scanCacheDelta.apiCalls} API calls
              </span>
              {cacheStats.rateLimitUsed != null && (
                <span className="opp-ratelimit">
                  Rate: {cacheStats.rateLimitUsed}/{cacheStats.rateLimitAllowed ?? "?"}
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="opp-table-wrap">
        <table className="options-table opp-table">
          <thead>
            <tr>
              <th className="opp-sortable" title="ETF ticker symbol" onClick={() => handleSort("symbol")}>Symbol{sortIndicator("symbol")}</th>
              <th className="opp-sortable" title="Current underlying price (15-min delayed)" onClick={() => handleSort("price")}>Price{sortIndicator("price")}</th>
              <th className="opp-sortable" title="Capital required for one cash-secured put contract (nearest ATM strike × 100)" onClick={() => handleSort("capitalPerContract")}>Capital/Contract{sortIndicator("capitalPerContract")}</th>
              <th className="opp-sortable" title="Days to expiration for the nearest usable expiration (DTE ≥ 3)" onClick={() => handleSort("nearestDte")}>Nearest Exp{sortIndicator("nearestDte")}</th>
              <th className="opp-sortable" title="Annualized yield at target delta for covered calls (premium ÷ underlying price, scaled to 365 days)" onClick={() => handleSort("callYield")}>Call Yield{sortIndicator("callYield")}</th>
              <th className="opp-sortable" title="Annualized yield at target delta for cash-secured puts (premium ÷ strike, scaled to 365 days)" onClick={() => handleSort("putYield")}>Put Yield{sortIndicator("putYield")}</th>
              <th className="opp-sortable" title="Delta of the call contract closest to the target delta" onClick={() => handleSort("callDelta")}>Call Δ{sortIndicator("callDelta")}</th>
              <th className="opp-sortable" title="Delta of the put contract closest to the target delta (shown as absolute value)" onClick={() => handleSort("putDelta")}>Put Δ{sortIndicator("putDelta")}</th>
              <th className="opp-sortable" title="Implied volatility at the target-delta contracts (mid IV, average of call and put)" onClick={() => handleSort("iv")}>IV{sortIndicator("iv")}</th>
              <th className="opp-sortable" title="Opportunity status: interesting (yield ≥ threshold), monitor (below threshold), ineligible (capital limit exceeded), data missing (no greeks or options)" onClick={() => handleSort("status")}>Status{sortIndicator("status")}</th>
              <th title="Plain-English reason for the status">Reason</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && scanning && (
              <tr><td colSpan={12} style={{ textAlign: "center", color: "#888", padding: 20 }}>Loading...</td></tr>
            )}
            {sorted.map((row) => {
              const isExpanded = expandedSymbol === row.symbol;
              const explanation = isExpanded ? explainOpportunity(row) : null;

              return (
                <Fragment key={row.symbol}>
                  <tr className={`opp-row opp-row-${row.status}${isExpanded ? " opp-row-expanded" : ""}`} onClick={() => toggleExpand(row.symbol)}>
                    <td className="opp-symbol">
                      <span
                        className="opp-symbol-label"
                        title={ETF_DESCRIPTIONS[row.symbol] ?? row.symbol}
                        data-tooltip={ETF_DESCRIPTIONS[row.symbol] ?? row.symbol}
                      >
                        {row.symbol}
                      </span>
                    </td>
                    <td>{row.price != null ? `$${row.price.toFixed(2)}` : "—"}</td>
                    <td>{row.capitalPerContract != null ? `$${row.capitalPerContract.toLocaleString()}` : "—"}</td>
                    <td>{row.nearestDte != null ? `${row.nearestDte} DTE` : "—"}</td>
                    <td className={row.callYield && row.callYield >= policy.minYieldThreshold ? "opp-yield-good" : ""}>
                      {row.callYield != null ? `${row.callYield.toFixed(1)}%` : "—"}
                    </td>
                    <td className={row.putYield && row.putYield >= policy.minYieldThreshold ? "opp-yield-good" : ""}>
                      {row.putYield != null ? `${row.putYield.toFixed(1)}%` : "—"}
                    </td>
                    <td>{row.callDelta != null ? row.callDelta.toFixed(2) : "—"}</td>
                    <td>{row.putDelta != null ? row.putDelta.toFixed(2) : "—"}</td>
                    <td>{row.iv != null ? `${(row.iv * 100).toFixed(0)}%` : "—"}</td>
                    <td><span className={`opp-status opp-status-${row.status}`}>{row.status}</span></td>
                    <td className="opp-reason">{row.statusReason}</td>
                    <td>
                      {row.optionsAvailable && (
                        <button className="opp-drill-btn" onClick={(e) => { e.stopPropagation(); handleDrill(row.symbol); }}>
                          Evaluate →
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && explanation && (
                    <tr className="opp-explain-row">
                      <td colSpan={12}>
                        <div className="opp-explain-panel">
                          <div className="opp-explain-narrative">
                            {explanation.narrative.map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                          <div className="opp-explain-details">
                            {explanation.call && (
                              <div className="opp-explain-side">
                                <h4>Covered Call</h4>
                                <table className="opp-explain-table">
                                  <tbody>
                                    <tr><td>Mid</td><td>${explanation.call.mid?.toFixed(2)}</td></tr>
                                    <tr><td>Premium/contract</td><td>${explanation.call.premiumPerContract.toFixed(0)}</td></tr>
                                    <tr><td>Collateral (price)</td><td>${explanation.call.collateral.toFixed(2)}</td></tr>
                                    <tr><td>Raw yield</td><td>{(explanation.call.rawYield * 100).toFixed(2)}%</td></tr>
                                    <tr><td>DTE</td><td>{explanation.dte}</td></tr>
                                    <tr><td>Annualization (×)</td><td>{explanation.call.annualizationMultiplier.toFixed(1)}</td></tr>
                                    <tr><td>Annualized yield</td><td>{explanation.call.annualizedYield.toFixed(1)}%</td></tr>
                                    <tr><td>Delta</td><td>{explanation.call.delta?.toFixed(3) ?? "—"}</td></tr>
                                    {explanation.call.iv != null && <tr><td>IV</td><td>{(explanation.call.iv * 100).toFixed(0)}%</td></tr>}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {explanation.put && (
                              <div className="opp-explain-side">
                                <h4>Cash-Secured Put</h4>
                                <table className="opp-explain-table">
                                  <tbody>
                                    <tr><td>Strike</td><td>${explanation.put.strike?.toFixed(2)}</td></tr>
                                    <tr><td>Mid</td><td>${explanation.put.mid?.toFixed(2)}</td></tr>
                                    <tr><td>Premium/contract</td><td>${explanation.put.premiumPerContract.toFixed(0)}</td></tr>
                                    <tr><td>Collateral (strike)</td><td>${explanation.put.collateral.toFixed(2)}</td></tr>
                                    <tr><td>Raw yield</td><td>{(explanation.put.rawYield * 100).toFixed(2)}%</td></tr>
                                    <tr><td>DTE</td><td>{explanation.dte}</td></tr>
                                    <tr><td>Annualization (×)</td><td>{explanation.put.annualizationMultiplier.toFixed(1)}</td></tr>
                                    <tr><td>Annualized yield</td><td>{explanation.put.annualizedYield.toFixed(1)}%</td></tr>
                                    <tr><td>Delta</td><td>{explanation.put.delta?.toFixed(3) ?? "—"}</td></tr>
                                    {explanation.put.iv != null && <tr><td>IV</td><td>{(explanation.put.iv * 100).toFixed(0)}%</td></tr>}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                          <div className="opp-explain-context">
                            <p className="opp-explain-annualization">{explanation.annualizationNote}</p>
                            <p className="opp-explain-iv">{explanation.ivNote}</p>
                            {explanation.capitalPerContract != null && (
                              <p className="opp-explain-capital">
                                Capital per contract: ${explanation.capitalPerContract.toLocaleString()}
                                {explanation.capitalSource === "put_strike"
                                  ? " (nearest put strike × 100)"
                                  : " (underlying price × 100)"}
                                . This is the minimum capital unit required to participate in this opportunity.
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
