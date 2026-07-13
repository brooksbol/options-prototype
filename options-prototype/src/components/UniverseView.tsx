/**
 * Candidate Universe — Browsable View.
 *
 * Displays the candidate universe for observability.
 * Does NOT trigger any external API requests.
 * Does NOT imply admission, suitability, or recommendation.
 */

import { useState, useMemo, useCallback } from "react";
import { loadCandidateUniverse, addOperatorCandidate } from "../universe/universe";
import { YAHOO_DISPLAY_NAME, YAHOO_DESCRIPTION } from "../universe/sources/yahoo";
import type { CandidateSymbol } from "../universe/types";

// --- Constants ---

const PAGE_SIZE = 50;

// --- Component ---

export function UniverseView() {
  const [universe, setUniverse] = useState<CandidateSymbol[]>(() => loadCandidateUniverse());
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [addInput, setAddInput] = useState("");

  // Filtered
  const filtered = useMemo(() => {
    if (!searchText.trim()) return universe;
    const query = searchText.trim().toUpperCase();
    return universe.filter((c) => c.symbol.includes(query));
  }, [universe, searchText]);

  // Paginated
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on search change
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPage(0);
  }, []);

  // Add operator symbol
  const handleAdd = useCallback(() => {
    const symbol = addInput.trim().toUpperCase();
    if (!symbol) return;
    const updated = addOperatorCandidate(symbol);
    setUniverse(updated);
    setAddInput("");
  }, [addInput]);

  return (
    <div className="universe-view">
      <header className="universe-header">
        <h2>Candidate Universe</h2>
        <span className="universe-count">{universe.length} candidates</span>
      </header>

      {/* Source context */}
      <div className="universe-source-context">
        <p className="universe-source-label">{YAHOO_DISPLAY_NAME}</p>
        <p className="universe-source-desc">{YAHOO_DESCRIPTION}</p>
        <p className="universe-disclaimer">
          Candidate Universe contains symbols that may be evaluated by institutional policy.
          Inclusion here does not imply admission, suitability, optionability, or deployability.
        </p>
      </div>

      {/* Controls */}
      <div className="universe-controls">
        <input
          type="text"
          className="universe-search"
          placeholder="Search by symbol..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <div className="universe-add">
          <input
            type="text"
            className="universe-add-input"
            placeholder="Add symbol"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button className="universe-add-btn" onClick={handleAdd} disabled={!addInput.trim()}>
            Add
          </button>
        </div>
        <span className="universe-filter-count">{filtered.length} shown</span>
      </div>

      {/* Table */}
      <table className="options-table universe-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Sources</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((candidate) => (
            <tr key={candidate.symbol} className="universe-row">
              <td className="universe-symbol">{candidate.symbol}</td>
              <td className="universe-sources">
                {candidate.sources.map((s) => (
                  <span key={s} className="universe-source-tag">{formatSource(s)}</span>
                ))}
              </td>
              <td className="universe-date">{candidate.addedAt}</td>
            </tr>
          ))}
          {pageItems.length === 0 && (
            <tr><td colSpan={3} className="universe-empty">No candidates match the search.</td></tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="universe-pagination">
          <button onClick={() => setPage(0)} disabled={page === 0}>«</button>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
          <span className="universe-page-info">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>›</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function formatSource(source: string): string {
  if (source === "yahoo_top_etfs_2026_07_13") return "Yahoo";
  if (source === "operator_manual") return "Manual";
  return source;
}
