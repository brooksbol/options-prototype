/**
 * SEC Securities Explorer — human-in-the-loop Discovery page.
 *
 * Loads the SEC exchange-listed universe, allows searching/sorting/filtering,
 * and provides a button to send a selected symbol to Velvet Rope for evaluation.
 *
 * IMPORTANT: This dataset does NOT identify product type.
 * It is a general securities catalog, not an ETF master list.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { SecExchangeSecurityProvider } from "../providers/sec-catalog";
import type { SecSecurityReference, SecurityCatalogResult } from "../providers/sec-catalog";
import { isLikelyFund, likelyFundReason } from "../providers/sec-catalog/likelyFundHeuristic";
import { updateWorkspace } from "../workspace/workspace";

// --- Provider singleton ---

const provider = new SecExchangeSecurityProvider();

// --- Sort ---

type SortKey = "ticker" | "name" | "exchange" | "cik";
type SortDir = "asc" | "desc";

// --- Constants ---

const PAGE_SIZE = 50;
const EXCHANGES = ["All", "NYSE", "Nasdaq", "CBOE", "OTC"];

// --- Props ---

interface SecExplorerProps {
  onNavigateToVelvetRope?: () => void;
}

// --- Component ---

export function SecExplorer({ onNavigateToVelvetRope }: SecExplorerProps) {
  const [result, setResult] = useState<SecurityCatalogResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Search / filter
  const [searchText, setSearchText] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("All");
  const [likelyFundOnly, setLikelyFundOnly] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(0);

  // Load on mount
  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    const res = await provider.loadSecurities();
    setResult(res);
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    provider.clearCache();
    loadCatalog();
  }, [loadCatalog]);

  // Filtered + searched items
  const filtered = useMemo(() => {
    if (!result?.items) return [];

    let items = result.items;

    // Exchange filter
    if (exchangeFilter !== "All") {
      items = items.filter((s) => s.exchange === exchangeFilter);
    }

    // Likely fund filter
    if (likelyFundOnly) {
      items = items.filter((s) => isLikelyFund(s.name));
    }

    // Text search
    if (searchText.trim()) {
      const query = searchText.trim().toUpperCase();
      items = items.filter((s) =>
        s.ticker.toUpperCase().includes(query) ||
        s.name.toUpperCase().includes(query) ||
        (s.exchange?.toUpperCase().includes(query) ?? false) ||
        String(s.cik).includes(query)
      );
    }

    return items;
  }, [result, searchText, exchangeFilter, likelyFundOnly]);

  // Sorted
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number;
      let bv: string | number;

      switch (sortKey) {
        case "ticker": av = a.ticker; bv = b.ticker; break;
        case "name": av = a.name; bv = b.name; break;
        case "exchange": av = a.exchange ?? ""; bv = b.exchange ?? ""; break;
        case "cik": av = a.cik; bv = b.cik; break;
      }

      let cmp: number;
      if (typeof av === "string" && typeof bv === "string") {
        cmp = av.localeCompare(bv);
      } else {
        cmp = (av as number) - (bv as number);
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginated
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [searchText, exchangeFilter, likelyFundOnly, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const handleSendToVelvetRope = useCallback((symbol: string) => {
    updateWorkspace({ pendingVelvetRopeSymbol: symbol, activeTab: "velvetrope" });
    if (onNavigateToVelvetRope) onNavigateToVelvetRope();
  }, [onNavigateToVelvetRope]);

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="sec-explorer">
      <header className="sec-header">
        <h2>SEC Securities Explorer</h2>
        <span className="console-badge" style={{ background: "#2d3a4e", color: "#7ec8e3" }}>
          Human-in-the-Loop Discovery
        </span>
      </header>

      {/* Status bar */}
      <div className="sec-status">
        {loading && <span className="sec-loading">Loading SEC catalog...</span>}
        {result && !loading && (
          <>
            <span className={result.success ? "sec-status-ok" : "sec-status-error"}>
              {result.success ? `✓ ${result.totalCount.toLocaleString()} securities` : `✗ ${result.error}`}
            </span>
            <span className="sec-meta">
              {result.durationMs}ms | Fetched: {new Date(result.fetchedAt).toLocaleTimeString()}
            </span>
            <button className="sec-refresh-btn" onClick={handleRefresh}>Refresh</button>
          </>
        )}
      </div>

      {/* Search and filters */}
      {result?.success && (
        <div className="sec-controls">
          <input
            type="text"
            className="sec-search"
            placeholder="Search ticker, name, exchange, CIK..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            className="sec-exchange-filter"
            value={exchangeFilter}
            onChange={(e) => setExchangeFilter(e.target.value)}
          >
            {EXCHANGES.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
          <label className="sec-fund-filter">
            <input
              type="checkbox"
              checked={likelyFundOnly}
              onChange={(e) => setLikelyFundOnly(e.target.checked)}
            />
            Likely fund/ETF
            <span className="sec-heuristic-note">(heuristic only — not verified)</span>
          </label>
          <span className="sec-result-count">{sorted.length.toLocaleString()} results</span>
        </div>
      )}

      {/* Results table */}
      {result?.success && pageItems.length > 0 && (
        <>
          <table className="options-table sec-table">
            <thead>
              <tr>
                <th className="opp-sortable" onClick={() => handleSort("ticker")}>Ticker{sortIndicator("ticker")}</th>
                <th className="opp-sortable" onClick={() => handleSort("name")}>Name{sortIndicator("name")}</th>
                <th className="opp-sortable" onClick={() => handleSort("exchange")}>Exchange{sortIndicator("exchange")}</th>
                <th className="opp-sortable" onClick={() => handleSort("cik")}>CIK{sortIndicator("cik")}</th>
                <th>Fund?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((sec) => (
                <SecRow key={`${sec.cik}-${sec.ticker}`} sec={sec} onSend={handleSendToVelvetRope} />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="sec-pagination">
            <button onClick={() => setPage(0)} disabled={page === 0}>«</button>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
            <span className="sec-page-info">
              Page {page + 1} of {totalPages} ({sorted.length.toLocaleString()} results)
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
          </div>
        </>
      )}

      {result?.success && sorted.length === 0 && !loading && (
        <p className="sec-empty">No securities match the current filters.</p>
      )}
    </div>
  );
}

// --- Row component ---

function SecRow({ sec, onSend }: { sec: SecSecurityReference; onSend: (symbol: string) => void }) {
  const fundReason = likelyFundReason(sec.name);

  return (
    <tr className={`sec-row ${fundReason ? "sec-row-fund" : ""}`}>
      <td className="sec-ticker">{sec.ticker}</td>
      <td className="sec-name">{sec.name}</td>
      <td>{sec.exchange ?? "—"}</td>
      <td className="sec-cik">{sec.cik}</td>
      <td className="sec-fund-col">
        {fundReason ? <span className="sec-fund-badge" title={fundReason}>likely</span> : ""}
      </td>
      <td>
        <button className="sec-evaluate-btn" onClick={() => onSend(sec.ticker)}>
          Evaluate →
        </button>
      </td>
    </tr>
  );
}
