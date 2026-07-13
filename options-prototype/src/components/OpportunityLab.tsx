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

import { useState, useEffect, useMemo, useCallback } from "react";
import { TradierProvider } from "../providers/tradier/TradierProvider";
import { MockMarketDataProvider } from "../providers/mock/MockMarketDataProvider";
import { isTradierConfigured, requireTradierConfig } from "../config/tradier";
import { evaluateSymbol } from "../opportunity/evaluate";
import { CURATED_UNIVERSE, ETF_DESCRIPTIONS, DEFAULT_OPPORTUNITY_POLICY, type OpportunityRow, type OpportunityPolicy } from "../opportunity/types";
import { explainOpportunity } from "../opportunity/explain";
import { sweepDelta, type PolicyResponsePoint } from "../opportunity/sweep";
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

// --- Scan result cache (survives unmount/remount, not page reload) ---

interface ScanCache {
  targetDelta: number;
  maxDte: number | null;
  rows: OpportunityRow[];
  sparklines: Map<string, PolicyResponsePoint[]>;
  timestamp: number;
}

let lastScanCache: ScanCache | null = null;
const SCAN_CACHE_TTL_MS = 60 * 1000; // 60 seconds — matches provider TTL

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
  | "volume"
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
    case "volume":
      av = a.volume;
      bv = b.volume;
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

// --- Sparkline (tiny inline SVG for table rows) ---

function Sparkline({ points }: { points: PolicyResponsePoint[] }) {
  const W = 60;
  const H = 20;
  const PAD = 2;

  // Use put yield (typically higher / more interesting) with call as fallback
  const yields = points.map((p) => p.putYield ?? p.callYield ?? null);
  const valid = yields.filter((y): y is number => y != null);
  if (valid.length < 2) return <span className="opp-sparkline-empty">—</span>;

  const minY = 0;
  const maxY = Math.max(...valid);
  const range = maxY - minY || 1;

  const xStep = (W - PAD * 2) / (yields.length - 1);

  const pathPoints = yields
    .map((y, i) => {
      if (y == null) return null;
      const x = PAD + i * xStep;
      const yPos = H - PAD - ((y - minY) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${yPos.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <svg className="opp-sparkline" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pathPoints} fill="none" stroke="#bb86fc" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

// --- Sweep Chart (inline SVG) ---

function SweepChart({ points, currentDelta, minYield }: { points: PolicyResponsePoint[]; currentDelta: number; minYield: number }) {
  const W = 400;
  const H = 140;
  const PAD = { top: 10, right: 20, bottom: 24, left: 40 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Compute y range from data
  const allYields = points.flatMap((p) => [p.callYield, p.putYield]).filter((y): y is number => y != null);
  if (allYields.length === 0) return null;

  const maxY = Math.max(...allYields, minYield);
  const minY = 0;
  const yRange = maxY - minY || 1;

  const xScale = (delta: number) => PAD.left + ((delta - 0.10) / 0.40) * plotW;
  const yScale = (y: number) => PAD.top + plotH - ((y - minY) / yRange) * plotH;

  // Build polyline paths
  const callPoints = points
    .filter((p) => p.callYield != null)
    .map((p) => `${xScale(p.targetDelta).toFixed(1)},${yScale(p.callYield!).toFixed(1)}`)
    .join(" ");

  const putPoints = points
    .filter((p) => p.putYield != null)
    .map((p) => `${xScale(p.targetDelta).toFixed(1)},${yScale(p.putYield!).toFixed(1)}`)
    .join(" ");

  // Threshold line
  const threshY = yScale(minYield);

  // Current delta indicator
  const curX = xScale(currentDelta);

  return (
    <svg className="opp-sweep-chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Grid */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#333" strokeWidth="1" />
      <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#333" strokeWidth="1" />

      {/* Threshold line */}
      <line x1={PAD.left} y1={threshY} x2={PAD.left + plotW} y2={threshY} stroke="#f2c94c" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      <text x={PAD.left - 4} y={threshY + 3} textAnchor="end" fill="#f2c94c" fontSize="8" opacity="0.7">{minYield}%</text>

      {/* Current delta indicator */}
      <line x1={curX} y1={PAD.top} x2={curX} y2={PAD.top + plotH} stroke="#7ec8e3" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

      {/* Call yield line */}
      {callPoints && <polyline points={callPoints} fill="none" stroke="#6fcf97" strokeWidth="2" />}

      {/* Put yield line */}
      {putPoints && <polyline points={putPoints} fill="none" stroke="#bb86fc" strokeWidth="2" />}

      {/* Data points */}
      {points.map((p) => (
        <g key={p.targetDelta}>
          {p.callYield != null && <circle cx={xScale(p.targetDelta)} cy={yScale(p.callYield)} r="3" fill="#6fcf97" />}
          {p.putYield != null && <circle cx={xScale(p.targetDelta)} cy={yScale(p.putYield)} r="3" fill="#bb86fc" />}
        </g>
      ))}

      {/* X-axis: just endpoints + axis label */}
      <text x={xScale(0.10)} y={H - 4} textAnchor="middle" fill="#666" fontSize="9">0.10</text>
      <text x={xScale(0.50)} y={H - 4} textAnchor="middle" fill="#666" fontSize="9">0.50</text>
      <text x={PAD.left + plotW / 2} y={H - 4} textAnchor="middle" fill="#555" fontSize="9">Target Δ</text>

      {/* Y-axis labels + axis label */}
      {[0, Math.round(maxY / 2), Math.round(maxY)].map((y) => (
        <text key={y} x={PAD.left - 4} y={yScale(y) + 3} textAnchor="end" fill="#666" fontSize="9">{y}%</text>
      ))}
      <text x={12} y={PAD.top + plotH / 2} textAnchor="middle" fill="#555" fontSize="8" transform={`rotate(-90, 12, ${PAD.top + plotH / 2})`}>Annualized Yield</text>

      {/* Legend */}
      <line x1={W - 80} y1={8} x2={W - 66} y2={8} stroke="#6fcf97" strokeWidth="2" />
      <text x={W - 62} y={11} fill="#6fcf97" fontSize="9">Call</text>
      <line x1={W - 40} y1={8} x2={W - 26} y2={8} stroke="#bb86fc" strokeWidth="2" />
      <text x={W - 22} y={11} fill="#bb86fc" fontSize="9">Put</text>
    </svg>
  );
}

// --- Component ---

export function OpportunityLab({ onSelectSymbol }: OpportunityLabProps) {
  const [ws] = useState(() => loadWorkspace());
  const providerKey = isTradierConfigured() ? "tradier" : "mock";
  const provider = useMemo(() => getProvider(providerKey), [providerKey]);

  // Check if we have a valid cached scan for this delta (survives tab navigation)
  const cachedScan = lastScanCache && lastScanCache.targetDelta === (ws.opportunityTargetDelta ?? DEFAULT_OPPORTUNITY_POLICY.targetDelta) && lastScanCache.maxDte === (ws.opportunityMaxDte ?? DEFAULT_OPPORTUNITY_POLICY.maxDte) && (Date.now() - lastScanCache.timestamp) < SCAN_CACHE_TTL_MS ? lastScanCache : null;

  const [rows, setRows] = useState<OpportunityRow[]>(cachedScan?.rows ?? []);
  const [scanProgress, setScanProgress] = useState(cachedScan ? CURATED_UNIVERSE.length : 0);
  const [scanning, setScanning] = useState(!cachedScan);
  const [cacheStats, setCacheStats] = useState<CacheStats>({ hits: 0, misses: 0, size: 0, apiCalls: 0, rateLimitUsed: null, rateLimitAvailable: null, rateLimitAllowed: null });
  const [scanCacheDelta, setScanCacheDelta] = useState<{ hits: number; misses: number; apiCalls: number }>({ hits: 0, misses: 0, apiCalls: 0 });

  // Target delta — persisted to workspace
  const [targetDelta, setTargetDelta] = useState<number>(ws.opportunityTargetDelta ?? DEFAULT_OPPORTUNITY_POLICY.targetDelta);

  // DTE range — persisted to workspace (null = nearest available)
  const [maxDte, setMaxDte] = useState<number | null>(ws.opportunityMaxDte ?? DEFAULT_OPPORTUNITY_POLICY.maxDte);

  const policy = useMemo<OpportunityPolicy>(() => ({
    ...DEFAULT_OPPORTUNITY_POLICY,
    targetDelta,
    minDte: 3,
    maxDte,
  }), [targetDelta, maxDte]);

  const handleDeltaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseFloat(e.target.value);
    setTargetDelta(val);
    updateWorkspace({ opportunityTargetDelta: val });
  }, []);

  const handleDteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "any" ? null : parseInt(e.target.value, 10);
    setMaxDte(val);
    updateWorkspace({ opportunityMaxDte: val });
  }, []);

  // Sort state — independent for each table
  const [callSortKey, setCallSortKey] = useState<SortKey>("callYield");
  const [callSortDir, setCallSortDir] = useState<SortDir>("desc");
  const [putSortKey, setPutSortKey] = useState<SortKey>("putYield");
  const [putSortDir, setPutSortDir] = useState<SortDir>("desc");

  // Sparkline data — sweep yields for every row (computed after scan from cache)
  const [sparklineMap, setSparklineMap] = useState<Map<string, PolicyResponsePoint[]>>(cachedScan?.sparklines ?? new Map());

  // Expanded rows (for inline evidence panels — multiple allowed for comparison)
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(new Set());
  const [sweepDataMap, setSweepDataMap] = useState<Map<string, PolicyResponsePoint[]>>(new Map());

  const toggleExpand = useCallback((symbol: string) => {
    setExpandedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  }, []);

  // Load policy response curves for all expanded rows
  useEffect(() => {
    if (expandedSymbols.size === 0) {
      setSweepDataMap(new Map());
      return;
    }

    let cancelled = false;

    async function loadSweeps() {
      const newMap = new Map<string, PolicyResponsePoint[]>();
      for (const symbol of expandedSymbols) {
        if (cancelled) return;
        const row = rows.find((r) => r.symbol === symbol);
        if (!row || !row.nearestExpiration || !row.nearestDte) continue;

        const chain = await provider.getOptionsChain(symbol, row.nearestExpiration);
        if (cancelled) return;
        newMap.set(symbol, sweepDelta(chain, row.nearestDte!));
      }
      if (!cancelled) setSweepDataMap(newMap);
    }

    loadSweeps();
    return () => { cancelled = true; };
  }, [expandedSymbols, rows, provider]);

  // Progressive fetch: rows stream in as each symbol is evaluated.
  // Uses a local `cancelled` variable per effect invocation to handle
  // React strict mode double-mount without duplicate rows.
  // Skips entirely if module-level scan cache is valid for this policy.
  useEffect(() => {
    // If cached results are still valid, skip the scan
    if (lastScanCache && lastScanCache.targetDelta === policy.targetDelta && lastScanCache.maxDte === policy.maxDte && (Date.now() - lastScanCache.timestamp) < SCAN_CACHE_TTL_MS) {
      setRows(lastScanCache.rows);
      setSparklineMap(lastScanCache.sparklines);
      setScanProgress(CURATED_UNIVERSE.length);
      setScanning(false);
      return;
    }

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
      const results: OpportunityRow[] = [];
      for (let i = 0; i < CURATED_UNIVERSE.length; i++) {
        if (cancelled) return;
        const symbol = CURATED_UNIVERSE[i];
        const row = await evaluateSymbol(symbol, provider, policy);
        if (cancelled) return;

        results.push(row);
        setRows([...results]);
        setScanProgress(i + 1);

        const current = provider.getCacheStats();
        setCacheStats(current);
        setScanCacheDelta({
          hits: current.hits - baseline.hits,
          misses: current.misses - baseline.misses,
          apiCalls: current.apiCalls - baseline.apiCalls,
        });
      }

      if (!cancelled) {
        setScanning(false);
        // Store in module-level cache (sparklines computed separately)
        lastScanCache = { targetDelta: policy.targetDelta, maxDte: policy.maxDte, rows: results, sparklines: new Map(), timestamp: Date.now() };
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [provider, policy]);

  // Compute sparkline sweeps for all rows once scan completes (all chains cached)
  useEffect(() => {
    if (scanning || rows.length === 0) return;
    // Skip if sparklines already loaded from cache
    if (sparklineMap.size === rows.length) return;

    let cancelled = false;

    async function loadSparklines() {
      const map = new Map<string, PolicyResponsePoint[]>();
      for (const row of rows) {
        if (cancelled) return;
        if (!row.nearestExpiration || !row.nearestDte) continue;
        const chain = await provider.getOptionsChain(row.symbol, row.nearestExpiration);
        if (cancelled) return;
        map.set(row.symbol, sweepDelta(chain, row.nearestDte));
      }
      if (!cancelled) {
        setSparklineMap(map);
        // Update module-level cache with sparklines
        if (lastScanCache) {
          lastScanCache.sparklines = map;
        }
      }
    }

    loadSparklines();
    return () => { cancelled = true; };
  }, [scanning, rows, provider]);

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

  const handleCallSort = useCallback((key: SortKey) => {
    setCallSortKey((prev) => {
      if (prev === key) {
        setCallSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      const defaultDesc = key === "callYield" || key === "putYield" || key === "price" || key === "iv" || key === "volume";
      setCallSortDir(defaultDesc ? "desc" : "asc");
      return key;
    });
  }, []);

  const handlePutSort = useCallback((key: SortKey) => {
    setPutSortKey((prev) => {
      if (prev === key) {
        setPutSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      const defaultDesc = key === "callYield" || key === "putYield" || key === "price" || key === "iv" || key === "volume" || key === "capitalPerContract";
      setPutSortDir(defaultDesc ? "desc" : "asc");
      return key;
    });
  }, []);

  // Apply sort — independent for each table
  const callSorted = useMemo(() => {
    return [...rows].sort((a, b) => compareRows(a, b, callSortKey, callSortDir));
  }, [rows, callSortKey, callSortDir]);

  const putSorted = useMemo(() => {
    return [...rows].sort((a, b) => compareRows(a, b, putSortKey, putSortDir));
  }, [rows, putSortKey, putSortDir]);

  const interestingCount = rows.filter((r) => r.status === "interesting").length;
  const monitorCount = rows.filter((r) => r.status === "monitor").length;
  const dataIssues = rows.filter((r) => r.status === "data_missing").length;

  // Best yields for highlighting
  const bestCallYield = rows.reduce((best, r) => r.callYield != null && r.callYield > best ? r.callYield : best, 0) || null;
  const bestPutYield = rows.reduce((best, r) => r.putYield != null && r.putYield > best ? r.putYield : best, 0) || null;

  function callSortIndicator(key: SortKey): string {
    if (callSortKey !== key) return "";
    return callSortDir === "asc" ? " ▲" : " ▼";
  }

  function putSortIndicator(key: SortKey): string {
    if (putSortKey !== key) return "";
    return putSortDir === "asc" ? " ▲" : " ▼";
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
                | DTE:
                <select
                  className="opp-delta-select"
                  value={maxDte == null ? "any" : String(maxDte)}
                  onChange={handleDteChange}
                  aria-label="Max DTE"
                >
                  <option value="7">&lt; 1 week</option>
                  <option value="14">1–2 weeks</option>
                  <option value="21">2–3 weeks</option>
                  <option value="30">3–4 weeks</option>
                  <option value="45">4–6 weeks</option>
                  <option value="60">6–8 weeks</option>
                  <option value="90">2–3 months</option>
                  <option value="any">Any</option>
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

      <div className="opp-tables-container">
        {/* Covered Calls Table */}
        <div className="opp-side-table">
          <h3 className="opp-side-title">Covered Calls</h3>
          <table className="options-table opp-table">
            <thead>
              <tr>
                <th className="opp-sortable" title="ETF ticker symbol" onClick={() => handleCallSort("symbol")}>Symbol{callSortIndicator("symbol")}</th>
                <th className="opp-sortable" title="Current underlying price" onClick={() => handleCallSort("price")}>Price{callSortIndicator("price")}</th>
                <th title="Strike of the selected call contract">Strike</th>
                <th title="Actual delta of the selected call contract">Δ</th>
                <th title="Mid price of the selected call contract">Mid</th>
                <th className="opp-sortable" title="Annualized yield (premium ÷ underlying price, scaled to 365 days)" onClick={() => handleCallSort("callYield")}>Yield{callSortIndicator("callYield")}</th>
                <th className="opp-sortable" title="Implied volatility" onClick={() => handleCallSort("iv")}>IV{callSortIndicator("iv")}</th>
                <th className="opp-sortable" title="Days to expiration" onClick={() => handleCallSort("nearestDte")}>DTE{callSortIndicator("nearestDte")}</th>
                <th title="Delta sweep sparkline">Sweep</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && scanning && (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "#888", padding: 20 }}>Loading...</td></tr>
              )}
              {callSorted.map((row) => {
                const isBestCall = row.callYield != null && row.callYield === bestCallYield;
                return (
                  <tr
                    key={row.symbol}
                    className={`opp-row opp-row-${row.status}${isBestCall ? " opp-row-best" : ""}${expandedSymbols.has(row.symbol) ? " opp-row-expanded" : ""}`}
                    onClick={() => toggleExpand(row.symbol)}
                  >
                    <td className="opp-symbol">
                      <span className="opp-symbol-label" title={ETF_DESCRIPTIONS[row.symbol] ?? row.symbol} data-tooltip={ETF_DESCRIPTIONS[row.symbol] ?? row.symbol}>
                        {row.symbol}
                      </span>
                    </td>
                    <td>{row.price != null ? `$${row.price.toFixed(2)}` : "—"}</td>
                    <td>{row.callStrike != null ? `$${row.callStrike}` : "—"}</td>
                    <td>{row.callDelta != null ? row.callDelta.toFixed(2) : "—"}</td>
                    <td>{row.callMid != null ? `$${row.callMid.toFixed(2)}` : "—"}</td>
                    <td className={row.callYield && row.callYield >= policy.minYieldThreshold ? "opp-yield-good" : ""}>
                      {row.callYield != null ? `${row.callYield.toFixed(1)}%` : "—"}
                    </td>
                    <td>{row.iv != null ? `${(row.iv * 100).toFixed(0)}%` : "—"}</td>
                    <td>{row.nearestDte != null ? `${row.nearestDte}` : "—"}</td>
                    <td className="opp-sparkline-cell">{sparklineMap.has(row.symbol) ? <Sparkline points={sparklineMap.get(row.symbol)!} /> : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cash-Secured Puts Table */}
        <div className="opp-side-table">
          <h3 className="opp-side-title">Cash-Secured Puts</h3>
          <table className="options-table opp-table">
            <thead>
              <tr>
                <th className="opp-sortable" title="ETF ticker symbol" onClick={() => handlePutSort("symbol")}>Symbol{putSortIndicator("symbol")}</th>
                <th className="opp-sortable" title="Current underlying price" onClick={() => handlePutSort("price")}>Price{putSortIndicator("price")}</th>
                <th title="Strike of the selected put contract">Strike</th>
                <th title="Actual delta of the selected put contract (absolute)">Δ</th>
                <th title="Mid price of the selected put contract">Mid</th>
                <th className="opp-sortable" title="Annualized yield (premium ÷ strike, scaled to 365 days)" onClick={() => handlePutSort("putYield")}>Yield{putSortIndicator("putYield")}</th>
                <th className="opp-sortable" title="Capital required (strike × 100)" onClick={() => handlePutSort("capitalPerContract")}>Capital{putSortIndicator("capitalPerContract")}</th>
                <th className="opp-sortable" title="Days to expiration" onClick={() => handlePutSort("nearestDte")}>DTE{putSortIndicator("nearestDte")}</th>
                <th title="Delta sweep sparkline">Sweep</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && scanning && (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "#888", padding: 20 }}>Loading...</td></tr>
              )}
              {putSorted.map((row) => {
                const isBestPut = row.putYield != null && row.putYield === bestPutYield;
                return (
                  <tr
                    key={row.symbol}
                    className={`opp-row opp-row-${row.status}${isBestPut ? " opp-row-best" : ""}${expandedSymbols.has(row.symbol) ? " opp-row-expanded" : ""}`}
                    onClick={() => toggleExpand(row.symbol)}
                  >
                    <td className="opp-symbol">
                      <span className="opp-symbol-label" title={ETF_DESCRIPTIONS[row.symbol] ?? row.symbol} data-tooltip={ETF_DESCRIPTIONS[row.symbol] ?? row.symbol}>
                        {row.symbol}
                      </span>
                    </td>
                    <td>{row.price != null ? `$${row.price.toFixed(2)}` : "—"}</td>
                    <td>{row.putStrike != null ? `$${row.putStrike}` : "—"}</td>
                    <td>{row.putDelta != null ? row.putDelta.toFixed(2) : "—"}</td>
                    <td>{row.putMid != null ? `$${row.putMid.toFixed(2)}` : "—"}</td>
                    <td className={row.putYield && row.putYield >= policy.minYieldThreshold ? "opp-yield-good" : ""}>
                      {row.putYield != null ? `${row.putYield.toFixed(1)}%` : "—"}
                    </td>
                    <td>{row.capitalPerContract != null ? `$${row.capitalPerContract.toLocaleString()}` : "—"}</td>
                    <td>{row.nearestDte != null ? `${row.nearestDte}` : "—"}</td>
                    <td className="opp-sparkline-cell">{sparklineMap.has(row.symbol) ? <Sparkline points={sparklineMap.get(row.symbol)!} /> : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expansion panels (shown below both tables) */}
      {rows.filter((row) => expandedSymbols.has(row.symbol)).map((row) => {
        const explanation = explainOpportunity(row);
        const sweepData = sweepDataMap.get(row.symbol) ?? null;
        return (
          <div key={row.symbol} className="opp-explain-standalone">
            <div className="opp-explain-panel">
              <div className="opp-explain-close" onClick={() => toggleExpand(row.symbol)}>
                ✕ {row.symbol}
                <button className="opp-drill-btn" style={{ marginLeft: 12 }} onClick={(e) => { e.stopPropagation(); handleDrill(row.symbol); }}>
                  Evaluate →
                </button>
              </div>
              <div className="opp-explain-left">
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
              {sweepData && sweepData.length > 0 && (
                <div className="opp-sweep">
                  <h4>Delta Sweep</h4>
                  <SweepChart points={sweepData} currentDelta={targetDelta} minYield={policy.minYieldThreshold} />
                  <details className="opp-sweep-details">
                    <summary>Details</summary>
                    <table className="opp-sweep-table">
                      <thead>
                        <tr>
                          <th>Target Δ</th>
                          <th>Call Strike</th>
                          <th>Call Δ</th>
                          <th>Call Mid</th>
                          <th>Call Yield</th>
                          <th>Put Strike</th>
                          <th>Put Δ</th>
                          <th>Put Mid</th>
                          <th>Put Yield</th>
                          <th>Capital</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sweepData.map((pt) => (
                          <tr key={pt.targetDelta} className={pt.targetDelta === targetDelta ? "opp-sweep-active" : ""}>
                            <td>{pt.targetDelta.toFixed(2)}</td>
                            <td>{pt.callStrike != null ? `$${pt.callStrike}` : "—"}</td>
                            <td>{pt.callActualDelta != null ? pt.callActualDelta.toFixed(3) : "—"}</td>
                            <td>{pt.callMid != null ? `$${pt.callMid.toFixed(2)}` : "—"}</td>
                            <td className={pt.callYield && pt.callYield >= policy.minYieldThreshold ? "opp-yield-good" : ""}>{pt.callYield != null ? `${pt.callYield.toFixed(1)}%` : "—"}</td>
                            <td>{pt.putStrike != null ? `$${pt.putStrike}` : "—"}</td>
                            <td>{pt.putActualDelta != null ? pt.putActualDelta.toFixed(3) : "—"}</td>
                            <td>{pt.putMid != null ? `$${pt.putMid.toFixed(2)}` : "—"}</td>
                            <td className={pt.putYield && pt.putYield >= policy.minYieldThreshold ? "opp-yield-good" : ""}>{pt.putYield != null ? `${pt.putYield.toFixed(1)}%` : "—"}</td>
                            <td>{pt.capitalPerContract != null ? `$${pt.capitalPerContract.toLocaleString()}` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
