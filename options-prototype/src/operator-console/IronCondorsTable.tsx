/**
 * Iron Condors — Operator Console region (frozen Exit Reliability v0, PR #33).
 *
 * A deliberately tiny presentation surface over FROZEN derived research evidence:
 * the evaluated ETF universe with its Exit Reliability v0 quote-proxy score.
 *
 * Columns: Symbol | Exit Reliability. Default order: highest Exit Reliability first.
 *
 * Boundaries (by design): no acquisition, no recalculation, no strikes/deltas/POP,
 * no live rescoring. This renders a static, version-controlled dataset. Exit
 * Reliability is a quote-based proxy, NOT a fill probability — the subtitle says so
 * and the UI never calls it a probability.
 */

import { useMemo, useState } from "react";
import {
  EXIT_RELIABILITY_V0_ROWS,
  EXIT_RELIABILITY_V0_PROVENANCE,
} from "./exit-reliability-v0-data";
import "./iron-condors-table.css";

export function IronCondorsTable() {
  // Cheap client-side symbol filter. The frozen rows are already sorted descending
  // by Exit Reliability (ties broken by symbol); filtering preserves that order.
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (q === "") return EXIT_RELIABILITY_V0_ROWS;
    return EXIT_RELIABILITY_V0_ROWS.filter((r) => r.symbol.includes(q));
  }, [query]);

  const p = EXIT_RELIABILITY_V0_PROVENANCE;

  return (
    <section className="ic-card" aria-label="Iron Condors">
      <header className="ic-head">
        <h2 className="ic-title">Iron Condors</h2>
        <p className="ic-subtitle">
          Exit Reliability v0 — quote-based proxy for how reliably a representative
          four-leg iron-condor-shaped position appears closable near displayed leg
          midpoints. Higher is better; not a fill probability.
        </p>
        <div className="ic-meta" title={`Source: ${p.source} · CSV ${p.csvSha256}`}>
          Frozen {p.datasetDate} · {p.evaluatedCount.toLocaleString()} evaluated ETFs
          {" "}· {p.unevaluableCount} unevaluable ({p.unevaluableSymbols.join(", ")})
        </div>
      </header>

      <div className="ic-toolbar">
        <input
          type="search"
          className="ic-search"
          placeholder="Filter symbols…"
          aria-label="Filter symbols"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="ic-count">
          {rows.length.toLocaleString()}
          {rows.length === 1 ? " symbol" : " symbols"}
        </span>
      </div>

      <div className="ic-scroll">
        <table className="ic-table">
          <thead>
            <tr>
              <th scope="col" className="ic-col-symbol">Symbol</th>
              <th scope="col" className="ic-col-score">Exit Reliability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol}>
                <td className="ic-col-symbol">{r.symbol}</td>
                <td className="ic-col-score">{r.exitReliability.toFixed(1)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="ic-empty" colSpan={2}>No symbols match “{query}”.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
