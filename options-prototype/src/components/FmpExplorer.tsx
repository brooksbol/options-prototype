/**
 * FMP ETF Reference Data — Engineering Spike Page.
 *
 * Provider diagnostics instrument for characterizing FMP viability.
 * Displays: configuration status, search results, profile lookups,
 * field coverage, and raw payload inspection.
 */

import { useState, useMemo, useCallback } from "react";
import { FmpEtfReferenceDataProvider } from "../providers/fmp-catalog";
import type { FmpSearchResult, FmpEtfCatalogEntry } from "../providers/fmp-catalog";

// --- Provider ---

const provider = new FmpEtfReferenceDataProvider();

// --- Coverage test symbols ---

const COVERAGE_SYMBOLS = ["SPY", "XLE", "SCHD", "QQQ", "TLT", "QETH", "QSOL"];

// --- Component ---

export function FmpExplorer() {
  const configured = provider.isConfigured();

  const [queryType, setQueryType] = useState<"search-name" | "search-symbol" | "profile" | "coverage">("profile");
  const [queryText, setQueryText] = useState("XLE");
  const [result, setResult] = useState<FmpSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Coverage test results
  const [coverageResults, setCoverageResults] = useState<{ symbol: string; found: boolean; isEtf: boolean | null; name: string | null }[]>([]);

  const handleExecute = useCallback(async () => {
    setLoading(true);
    setExpandedRow(null);

    if (queryType === "coverage") {
      const results: typeof coverageResults = [];
      for (const sym of COVERAGE_SYMBOLS) {
        const res = await provider.getProfile(sym);
        if (res.success && res.items.length > 0) {
          const item = res.items[0];
          results.push({ symbol: sym, found: true, isEtf: item.isEtf, name: item.name });
        } else {
          results.push({ symbol: sym, found: false, isEtf: null, name: null });
        }
      }
      setCoverageResults(results);
      setResult(null);
    } else {
      let res: FmpSearchResult;
      switch (queryType) {
        case "search-name":
          res = await provider.searchByName(queryText.trim());
          break;
        case "search-symbol":
          res = await provider.searchBySymbol(queryText.trim());
          break;
        case "profile":
          res = await provider.getProfile(queryText.trim().toUpperCase());
          break;
      }
      setResult(res);
      setCoverageResults([]);
    }

    setLoading(false);
  }, [queryType, queryText]);

  // Field coverage for profile results
  const fieldCoverage = useMemo(() => {
    if (!result?.items.length) return null;
    const fields = ["name", "exchange", "country", "currency", "isEtf", "isFund", "isActivelyTrading", "industry", "sector", "marketCap", "price", "beta", "isin", "cusip", "cik", "ipoDate", "description"] as const;
    const populated: Record<string, number> = {};
    const missing: Record<string, number> = {};
    for (const f of fields) {
      populated[f] = result.items.filter((i) => i[f] != null).length;
      missing[f] = result.items.filter((i) => i[f] == null).length;
    }
    return { total: result.items.length, populated, missing };
  }, [result]);

  return (
    <div className="etf-explorer">
      <header className="etf-explorer-header">
        <h2>FMP ETF Reference Data</h2>
        <span className="console-badge" style={{ background: configured ? "#2d4a3e" : "#4a2d2d", color: configured ? "#6fcf97" : "#eb5757" }}>
          {configured ? "Configured" : "Not Configured"}
        </span>
        <span className="sec-meta">Engineering Spike — Provider Diagnostics</span>
      </header>

      {/* Query builder */}
      <div className="etf-explorer-query">
        <div className="etf-query-type">
          <label><input type="radio" name="fmp-qtype" value="profile" checked={queryType === "profile"} onChange={() => setQueryType("profile")} /> Profile (single symbol)</label>
          <label><input type="radio" name="fmp-qtype" value="search-name" checked={queryType === "search-name"} onChange={() => setQueryType("search-name")} /> Search by Name</label>
          <label><input type="radio" name="fmp-qtype" value="search-symbol" checked={queryType === "search-symbol"} onChange={() => setQueryType("search-symbol")} /> Search by Symbol</label>
          <label><input type="radio" name="fmp-qtype" value="coverage" checked={queryType === "coverage"} onChange={() => setQueryType("coverage")} /> Coverage Test</label>
        </div>
        <div className="etf-query-params">
          {queryType !== "coverage" && (
            <label>
              Query: <input type="text" className="etf-input" style={{ width: 160 }} value={queryText} onChange={(e) => setQueryText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleExecute()} />
            </label>
          )}
          <button className="etf-execute-btn" onClick={handleExecute} disabled={loading || !configured}>
            {loading ? "Loading..." : queryType === "coverage" ? "Run Coverage Test" : "Execute"}
          </button>
        </div>
      </div>

      {/* Coverage test results */}
      {coverageResults.length > 0 && (
        <div className="etf-explorer-results">
          <div className="etf-result-status">
            <span className="etf-status-ok">Coverage Test Complete</span>
            <span className="etf-result-meta">{coverageResults.filter((r) => r.found).length}/{COVERAGE_SYMBOLS.length} found</span>
          </div>
          <table className="options-table etf-results-table">
            <thead>
              <tr><th>Symbol</th><th>Found</th><th>isEtf</th><th>Name</th></tr>
            </thead>
            <tbody>
              {coverageResults.map((r) => (
                <tr key={r.symbol}>
                  <td className="etf-symbol">{r.symbol}</td>
                  <td>{r.found ? <span style={{ color: "#6fcf97" }}>✓</span> : <span style={{ color: "#eb5757" }}>✗</span>}</td>
                  <td>{r.isEtf === true ? "✓ ETF" : r.isEtf === false ? "— Not ETF" : "—"}</td>
                  <td>{r.name ?? <span className="etf-null">not found</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Query results */}
      {result && (
        <div className="etf-explorer-results">
          <div className="etf-result-status">
            <span className={result.success ? "etf-status-ok" : "etf-status-error"}>
              {result.success ? "✓ Success" : "✗ Failed"}
            </span>
            <span className="etf-result-meta">
              {result.count} results | {result.durationMs}ms | HTTP {result.httpStatus ?? "—"} | Endpoint: {result.endpoint}
            </span>
            {result.error && <span className="etf-error">{result.error}</span>}
          </div>

          {/* Field coverage */}
          {fieldCoverage && (
            <div className="etf-field-coverage">
              <h4>Field Coverage ({fieldCoverage.total} items)</h4>
              <div className="etf-coverage-grid">
                {Object.entries(fieldCoverage.populated).map(([field, count]) => (
                  <div key={field} className="etf-coverage-item">
                    <span className="etf-coverage-field">{field}</span>
                    <span className={count === fieldCoverage.total ? "etf-coverage-full" : count === 0 ? "etf-coverage-none" : "etf-coverage-partial"}>
                      {count}/{fieldCoverage.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results table */}
          {result.items.length > 0 && (
            <table className="options-table etf-results-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Exchange</th>
                  <th>ETF?</th>
                  <th>Price</th>
                  <th>Mkt Cap</th>
                  <th>Industry</th>
                  <th>Country</th>
                  <th>Raw</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((entry) => (
                  <FmpRow key={entry.symbol} entry={entry} isExpanded={expandedRow === entry.symbol} onToggle={() => setExpandedRow(expandedRow === entry.symbol ? null : entry.symbol)} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// --- Row ---

function FmpRow({ entry, isExpanded, onToggle }: { entry: FmpEtfCatalogEntry; isExpanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="etf-result-row" onClick={onToggle}>
        <td className="etf-symbol">{entry.symbol}</td>
        <td>{entry.name ?? <span className="etf-null">—</span>}</td>
        <td>{entry.exchange ?? <span className="etf-null">—</span>}</td>
        <td>{entry.isEtf === true ? "✓" : entry.isEtf === false ? "—" : <span className="etf-null">?</span>}</td>
        <td>{entry.price != null ? `$${entry.price.toFixed(2)}` : <span className="etf-null">—</span>}</td>
        <td>{entry.marketCap != null ? `$${(entry.marketCap / 1e9).toFixed(1)}B` : <span className="etf-null">—</span>}</td>
        <td>{entry.industry ?? <span className="etf-null">—</span>}</td>
        <td>{entry.country ?? <span className="etf-null">—</span>}</td>
        <td><button className="etf-raw-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>{isExpanded ? "▼" : "▶"}</button></td>
      </tr>
      {isExpanded && (
        <tr className="etf-raw-row">
          <td colSpan={9}>
            <pre className="etf-raw-json">{JSON.stringify(entry.raw, null, 2)}</pre>
          </td>
        </tr>
      )}
    </>
  );
}
