/**
 * ETF Catalog Explorer — engineering spike page.
 *
 * Proves API Ninjas integration viability by allowing the operator to:
 * - Check provider configuration
 * - Execute lookup, list, and search queries
 * - View normalized results with field coverage diagnostics
 * - Inspect raw provider payloads
 * - Observe request timing and rate-limit info
 */

import { useState, useMemo, useCallback } from "react";
import { ApiNinjasEtfCatalogProvider, MockEtfCatalogProvider } from "../providers/etf-catalog";
import type { EtfCatalogProvider, EtfCatalogQuery, EtfCatalogResult, EtfReference } from "../providers/etf-catalog";

// --- Provider instances ---

const apiNinjasProvider = new ApiNinjasEtfCatalogProvider();
const mockProvider = new MockEtfCatalogProvider();

// --- Component ---

export function EtfCatalogExplorer() {
  const [providerKey, setProviderKey] = useState<"api_ninjas" | "mock">(
    apiNinjasProvider.isConfigured() ? "api_ninjas" : "mock"
  );
  const provider: EtfCatalogProvider = useMemo(
    () => (providerKey === "api_ninjas" ? apiNinjasProvider : mockProvider),
    [providerKey]
  );

  // Query state
  const [queryType, setQueryType] = useState<"lookup" | "list" | "search">("lookup");
  const [ticker, setTicker] = useState("SPY");
  const [listOffset, setListOffset] = useState(0);
  const [searchMinAum, setSearchMinAum] = useState("10000000000");
  const [searchCountry, setSearchCountry] = useState("US");
  const [searchOffset, setSearchOffset] = useState(0);

  // Result state
  const [result, setResult] = useState<EtfCatalogResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleExecute = useCallback(async () => {
    let query: EtfCatalogQuery;

    switch (queryType) {
      case "lookup":
        query = { type: "lookup", ticker: ticker.trim() };
        break;
      case "list":
        query = { type: "list", offset: listOffset };
        break;
      case "search":
        query = {
          type: "search",
          minAum: searchMinAum ? parseInt(searchMinAum, 10) : undefined,
          country: searchCountry || undefined,
          offset: searchOffset,
        };
        break;
    }

    setLoading(true);
    setExpandedRow(null);
    const res = await provider.search(query);
    setResult(res);
    setLoading(false);
  }, [provider, queryType, ticker, listOffset, searchMinAum, searchCountry, searchOffset]);

  const configured = provider.isConfigured();

  return (
    <div className="etf-explorer">
      <header className="etf-explorer-header">
        <h2>ETF Catalog Explorer</h2>
        <span className="console-badge" style={{ background: configured ? "#2d4a3e" : "#4a2d2d", color: configured ? "#6fcf97" : "#eb5757" }}>
          {providerKey === "api_ninjas" ? "API Ninjas" : "Mock"} — {configured ? "Configured" : "Not Configured"}
        </span>
        <select
          className="opp-delta-select"
          value={providerKey}
          onChange={(e) => setProviderKey(e.target.value as "api_ninjas" | "mock")}
        >
          <option value="api_ninjas">API Ninjas</option>
          <option value="mock">Mock</option>
        </select>
      </header>

      {/* Query builder */}
      <div className="etf-explorer-query">
        <div className="etf-query-type">
          <label>
            <input type="radio" name="qtype" value="lookup" checked={queryType === "lookup"} onChange={() => setQueryType("lookup")} />
            Lookup (single ticker)
          </label>
          <label>
            <input type="radio" name="qtype" value="list" checked={queryType === "list"} onChange={() => setQueryType("list")} />
            List (enumerate all)
          </label>
          <label>
            <input type="radio" name="qtype" value="search" checked={queryType === "search"} onChange={() => setQueryType("search")} />
            Search (filters)
          </label>
        </div>

        <div className="etf-query-params">
          {queryType === "lookup" && (
            <label>
              Ticker: <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} className="etf-input" />
            </label>
          )}
          {queryType === "list" && (
            <label>
              Offset: <input type="number" value={listOffset} onChange={(e) => setListOffset(parseInt(e.target.value) || 0)} className="etf-input" style={{ width: 80 }} />
            </label>
          )}
          {queryType === "search" && (
            <>
              <label>
                Min AUM: <input type="text" value={searchMinAum} onChange={(e) => setSearchMinAum(e.target.value)} className="etf-input" style={{ width: 140 }} />
              </label>
              <label>
                Country: <input type="text" value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} className="etf-input" style={{ width: 50 }} />
              </label>
              <label>
                Offset: <input type="number" value={searchOffset} onChange={(e) => setSearchOffset(parseInt(e.target.value) || 0)} className="etf-input" style={{ width: 80 }} />
              </label>
            </>
          )}
          <button className="etf-execute-btn" onClick={handleExecute} disabled={loading || !configured}>
            {loading ? "Loading..." : "Execute"}
          </button>
        </div>
      </div>

      {/* Result summary */}
      {result && (
        <div className="etf-explorer-results">
          {/* Status bar */}
          <div className="etf-result-status">
            <span className={result.success ? "etf-status-ok" : "etf-status-error"}>
              {result.success ? "✓ Success" : "✗ Failed"}
            </span>
            <span className="etf-result-meta">
              {result.count} results | {result.durationMs}ms | HTTP {result.httpStatus ?? "—"}
              {result.hasMore && " | More available"}
            </span>
            {result.rateLimitInfo && (
              <span className="etf-ratelimit">
                Rate: {result.rateLimitInfo.remaining ?? "?"}/{result.rateLimitInfo.limit ?? "?"} remaining
              </span>
            )}
            {result.error && <span className="etf-error">{result.error}</span>}
          </div>

          {/* Field coverage */}
          {result.count > 0 && (
            <div className="etf-field-coverage">
              <h4>Field Coverage ({result.fieldCoverage.total} items)</h4>
              <div className="etf-coverage-grid">
                {Object.entries(result.fieldCoverage.populated).map(([field, count]) => (
                  <div key={field} className="etf-coverage-item">
                    <span className="etf-coverage-field">{field}</span>
                    <span className={count === result.fieldCoverage.total ? "etf-coverage-full" : count === 0 ? "etf-coverage-none" : "etf-coverage-partial"}>
                      {count}/{result.fieldCoverage.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results table */}
          {result.items.length > 0 && (
            <div className="etf-results-table-wrap">
              <table className="options-table etf-results-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>AUM</th>
                    <th>Expense</th>
                    <th>Holdings</th>
                    <th>Country</th>
                    <th>Lev</th>
                    <th>Inv</th>
                    <th>Raw</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((etf) => (
                    <EtfResultRow
                      key={etf.symbol}
                      etf={etf}
                      isExpanded={expandedRow === etf.symbol}
                      onToggle={() => setExpandedRow(expandedRow === etf.symbol ? null : etf.symbol)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Row component ---

function EtfResultRow({ etf, isExpanded, onToggle }: { etf: EtfReference; isExpanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="etf-result-row" onClick={onToggle}>
        <td className="etf-symbol">{etf.symbol}</td>
        <td>{etf.name ?? <span className="etf-null">—</span>}</td>
        <td>{etf.price != null ? `$${etf.price.toFixed(2)}` : <span className="etf-null">—</span>}</td>
        <td>{etf.aum != null ? `$${(etf.aum / 1e9).toFixed(1)}B` : <span className="etf-null">—</span>}</td>
        <td>{etf.expenseRatio != null ? `${etf.expenseRatio.toFixed(2)}%` : <span className="etf-null">—</span>}</td>
        <td>{etf.numHoldings ?? <span className="etf-null">—</span>}</td>
        <td>{etf.country ?? <span className="etf-null">—</span>}</td>
        <td>{etf.leveraged === true ? "⚠" : etf.leveraged === false ? "—" : <span className="etf-null">?</span>}</td>
        <td>{etf.inverse === true ? "⚠" : etf.inverse === false ? "—" : <span className="etf-null">?</span>}</td>
        <td><button className="etf-raw-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>{isExpanded ? "▼" : "▶"}</button></td>
      </tr>
      {isExpanded && (
        <tr className="etf-raw-row">
          <td colSpan={10}>
            <pre className="etf-raw-json">{JSON.stringify(etf.raw, null, 2)}</pre>
          </td>
        </tr>
      )}
    </>
  );
}
