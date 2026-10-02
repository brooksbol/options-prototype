/**
 * Iron Condors — Deployment (Write Desk) surface, peer of the put/call/buy-write
 * candidate boards.
 *
 * A presentation surface over FROZEN derived research evidence (Exit Reliability
 * v0, PR #33) augmented with READ-ONLY live underlying quotes from the evidence
 * appliance.
 *
 * COLUMNS: Symbol | Exit Reliability | Spot | Spread | IV Rank | Chg | Chg %
 *   - Exit Reliability: frozen v0 quote-proxy score (NOT a fill probability).
 *   - Spot / Chg / Chg %: live, derived from the appliance's read-only quotes
 *     endpoint (`price`, `previousClose`). "—" when the appliance does not
 *     maintain that symbol's quote (never fabricated). Chg / Chg % are color-coded.
 *   - Spread (underlying bid/ask, in $) and IV Rank: PLACEHOLDERS ("—"). The
 *     appliance does not currently serve an underlying bid/ask or any IV rank /
 *     percentile; these columns are present and ready, pending backend support.
 *     No backend change is made here.
 *
 * Boundaries (by design): no acquisition (read-only quotes, no observe POST), no
 * recalculation of Exit Reliability, no strikes/deltas/POP, no live rescoring.
 */

import { useMemo, useState } from "react";
import {
  EXIT_RELIABILITY_V0_ROWS,
  EXIT_RELIABILITY_V0_PROVENANCE,
  instrumentTypeFor,
  type InstrumentType,
} from "../write-desk/exit-reliability-v0-data";
import { useIronCondorQuotes, type IronCondorQuoteMap } from "../write-desk/use-iron-condor-quotes";
import { useMultiColumnSort } from "../write-desk/use-multi-column-sort";
import { downloadTableCsv } from "../write-desk/table-csv-export";
import {
  computeTodayGlPerShare,
  computeTodayGlPercent,
  formatTodayGl,
  formatTodayGlPercent,
  todayGlDirection,
} from "../operator-console/today-gl";
import "../write-desk.css";
import "./iron-condors-table.css";

/** The frozen symbol set (stable across renders). */
const SYMBOLS: readonly string[] = EXIT_RELIABILITY_V0_ROWS.map((r) => r.symbol);

const PLACEHOLDER = "—";

/** A fully-derived row: frozen score + live quote-derived fields + placeholders. */
interface IronCondorRow {
  symbol: string;
  /** Instrument classification (ETF | INDEX) from the frozen classification dataset. */
  type: InstrumentType;
  exitReliability: number;
  /** Live last price, or null when the appliance does not maintain this symbol. */
  spot: number | null;
  /** Underlying $ spread — PLACEHOLDER (appliance does not serve underlying bid/ask). */
  spread: number | null;
  /** IV Rank — PLACEHOLDER (appliance does not serve IV rank). */
  ivRank: number | null;
  /** Daily change in $ (spot − prior close), or null when unavailable. */
  chg: number | null;
  /** Daily change in %, or null when unavailable. */
  chgPct: number | null;
}

function buildRows(quotes: IronCondorQuoteMap): IronCondorRow[] {
  return EXIT_RELIABILITY_V0_ROWS.map((r) => {
    const q = quotes.get(r.symbol);
    const inputs = { last: q?.price ?? null, previousClose: q?.previousClose ?? null };
    return {
      symbol: r.symbol,
      type: instrumentTypeFor(r.symbol),
      exitReliability: r.exitReliability,
      spot: q?.price ?? null,
      spread: null, // placeholder — no underlying bid/ask served
      ivRank: null, // placeholder — no IV rank served
      chg: computeTodayGlPerShare(inputs),
      chgPct: computeTodayGlPercent(inputs),
    };
  });
}

interface IronCondorsTableProps {
  /**
   * When provided, the heading becomes a collapse toggle and the body is hidden
   * while `collapsed` is true. The owning surface persists the state.
   */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Enable the read-only live-quote fetch. Pass false in demo mode. Default true. */
  enableQuotes?: boolean;
}

const SORT_LABELS: Record<string, string> = {
  symbol: "Symbol",
  type: "Type",
  exitReliability: "Exit Reliability",
  spot: "Spot",
  spread: "Spread",
  ivRank: "IV Rank",
  chg: "Chg",
  chgPct: "Chg %",
};

const DEFAULT_SORT: { key: string; dir: "asc" | "desc" }[] = [{ key: "exitReliability", dir: "desc" }];

/** Parse a numeric filter input; empty/invalid → null (no bound). */
function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function IronCondorsTable({ collapsed, onToggleCollapse, enableQuotes = true }: IronCondorsTableProps = {}) {
  const [symbolQuery, setSymbolQuery] = useState("");
  // Min/max numeric filters (empty string = unbounded).
  const [erMin, setErMin] = useState("");
  const [erMax, setErMax] = useState("");
  const [spotMin, setSpotMin] = useState("");
  const [spotMax, setSpotMax] = useState("");
  const [ivMin, setIvMin] = useState("");
  const [ivMax, setIvMax] = useState("");

  const collapsible = typeof onToggleCollapse === "function";
  const isCollapsed = collapsible && collapsed === true;

  // Read-only live quotes for the frozen symbol set (no acquisition). Skip the
  // fetch entirely while collapsed or disabled.
  const quotes = useIronCondorQuotes(SYMBOLS, enableQuotes && !isCollapsed);

  const allRows = useMemo(() => buildRows(quotes), [quotes]);

  const filtered = useMemo(() => {
    const q = symbolQuery.trim().toUpperCase();
    const erLo = num(erMin), erHi = num(erMax);
    const spLo = num(spotMin), spHi = num(spotMax);
    const ivLo = num(ivMin), ivHi = num(ivMax);
    const inRange = (v: number | null, lo: number | null, hi: number | null): boolean => {
      // A bound on an unavailable value excludes the row (honest: cannot assert it qualifies).
      if (lo != null) { if (v == null || v < lo) return false; }
      if (hi != null) { if (v == null || v > hi) return false; }
      return true;
    };
    return allRows.filter((r) => {
      if (q !== "" && !r.symbol.includes(q)) return false;
      if (!inRange(r.exitReliability, erLo, erHi)) return false;
      if (!inRange(r.spot, spLo, spHi)) return false;
      if (!inRange(r.ivRank, ivLo, ivHi)) return false;
      return true;
    });
  }, [allRows, symbolQuery, erMin, erMax, spotMin, spotMax, ivMin, ivMax]);

  const { sorted, handleSort, indicator, isDefaultOrder, columns } = useMultiColumnSort(
    filtered,
    DEFAULT_SORT,
    DEFAULT_SORT,
  );

  const onSort = (key: string, e?: React.MouseEvent) => handleSort(key, { shiftKey: e?.shiftKey });

  const p = EXIT_RELIABILITY_V0_PROVENANCE;

  const downloadCsv = () => {
    downloadTableCsv(
      sorted as unknown as Record<string, unknown>[],
      [
        { key: "type", label: "Type" },
        { key: "symbol", label: "Symbol" },
        { key: "exitReliability", label: "Exit Reliability", format: (r) => (r.exitReliability as number).toFixed(1) },
        { key: "spot", label: "Spot", format: (r) => (r.spot == null ? "" : (r.spot as number).toFixed(2)) },
        { key: "spread", label: "Spread", format: (r) => (r.spread == null ? "" : (r.spread as number).toFixed(2)) },
        { key: "ivRank", label: "IV Rank", format: (r) => (r.ivRank == null ? "" : String(r.ivRank)) },
        { key: "chg", label: "Chg", format: (r) => (r.chg == null ? "" : (r.chg as number).toFixed(2)) },
        { key: "chgPct", label: "Chg %", format: (r) => (r.chgPct == null ? "" : (r.chgPct as number).toFixed(2)) },
      ],
      `wheelwright-iron-condors-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const clearFilters = () => {
    setSymbolQuery(""); setErMin(""); setErMax("");
    setSpotMin(""); setSpotMax(""); setIvMin(""); setIvMax("");
  };
  const anyFilter = symbolQuery || erMin || erMax || spotMin || spotMax || ivMin || ivMax;

  return (
    <section className="ic-card" aria-label="Iron Condors">
      <header className="ic-head">
        <h2 className="ic-title">
          {collapsible && (
            <button
              type="button"
              className="wd-collapse-toggle"
              onClick={onToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? "Expand Iron Condors section" : "Collapse Iron Condors section"}
            >
              <span className={`wd-chevron${isCollapsed ? " wd-chevron-collapsed" : ""}`}>▾</span>
            </button>
          )}
          Iron Condors
        </h2>
        <p className="ic-subtitle">
          Exit Reliability v0 — quote-based proxy for how reliably a representative
          four-leg iron-condor-shaped position appears closable near displayed leg
          midpoints. Higher is better; not a fill probability. Spot/Chg are live;
          Spread and IV Rank are not yet served by the appliance.
        </p>
        <div className="ic-meta" title={`Source: ${p.source} · CSV ${p.csvSha256}`}>
          Frozen {p.datasetDate} · {p.evaluatedCount.toLocaleString()} evaluated ETFs
          {" "}· {p.unevaluableCount} unevaluable ({p.unevaluableSymbols.join(", ")})
        </div>
      </header>

      {isCollapsed ? null : (
      <>
      <div className="wd-table-controls ic-controls">
        <label className="wd-control">
          Symbol
          <input
            type="text"
            value={symbolQuery}
            placeholder="e.g. SPY"
            aria-label="Filter symbols"
            onChange={(e) => setSymbolQuery(e.target.value)}
            className="wd-control-text"
            style={{ width: "72px" }}
          />
        </label>
        <label className="wd-control">
          Exit Rel min
          <input type="number" value={erMin} placeholder="—" aria-label="Min exit reliability" onChange={(e) => setErMin(e.target.value)} className="wd-control-spinner" />
        </label>
        <label className="wd-control">
          max
          <input type="number" value={erMax} placeholder="—" aria-label="Max exit reliability" onChange={(e) => setErMax(e.target.value)} className="wd-control-spinner" />
        </label>
        <label className="wd-control">
          Spot min
          <input type="number" value={spotMin} placeholder="—" aria-label="Min spot" onChange={(e) => setSpotMin(e.target.value)} className="wd-control-spinner" />
        </label>
        <label className="wd-control">
          max
          <input type="number" value={spotMax} placeholder="—" aria-label="Max spot" onChange={(e) => setSpotMax(e.target.value)} className="wd-control-spinner" />
        </label>
        <label className="wd-control" title="IV Rank is not yet served by the appliance; this filter has no effect until it is.">
          IV Rank min
          <input type="number" value={ivMin} placeholder="—" aria-label="Min IV rank" onChange={(e) => setIvMin(e.target.value)} className="wd-control-spinner" />
        </label>
        <label className="wd-control">
          max
          <input type="number" value={ivMax} placeholder="—" aria-label="Max IV rank" onChange={(e) => setIvMax(e.target.value)} className="wd-control-spinner" />
        </label>
        {anyFilter && (
          <button type="button" className="wd-sort-reset" onClick={clearFilters} title="Clear all filters">Clear</button>
        )}
        <span className="wd-table-showing">{sorted.length.toLocaleString()}{sorted.length === 1 ? " symbol" : " symbols"}</span>
        <button type="button" className="wd-download-btn" onClick={downloadCsv} title="Download as CSV">⬇ CSV</button>
      </div>

      {!isDefaultOrder && (
        <div className="wd-sort-notice">
          Sorted by: <strong>{columns.map((c) => SORT_LABELS[c.key] ?? c.key).join(" → ")}</strong>
          {" · "}
          <button className="wd-sort-reset" onClick={() => onSort("exitReliability")}>Reset to Exit Reliability</button>
          {columns.length < 3 && <span className="wd-sort-hint"> (shift+click a header for secondary sort)</span>}
        </div>
      )}

      <div className="ic-scroll">
        <table className="ic-table">
          <thead>
            <tr>
              <th scope="col" className="ic-col-type wd-sortable" onClick={(e) => onSort("type", e)}>Type{indicator("type")}</th>
              <th scope="col" className="ic-col-symbol wd-sortable" onClick={(e) => onSort("symbol", e)}>Symbol{indicator("symbol")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("exitReliability", e)}>Exit Reliability{indicator("exitReliability")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("spot", e)}>Spot{indicator("spot")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("spread", e)} title="Underlying bid/ask spread ($) — not yet served by the appliance">Spread{indicator("spread")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("ivRank", e)} title="IV Rank — not yet served by the appliance">IV Rank{indicator("ivRank")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("chg", e)}>Chg{indicator("chg")}</th>
              <th scope="col" className="ic-col-num wd-sortable" onClick={(e) => onSort("chgPct", e)}>Chg %{indicator("chgPct")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const dir = todayGlDirection(r.chg);
              const chgClass = dir === "up" ? "ic-up" : dir === "down" ? "ic-down" : "ic-flat";
              return (
                <tr key={r.symbol}>
                  <td className="ic-col-type">
                    <span className={`ic-type-badge ic-type-${r.type.toLowerCase()}`}>{r.type}</span>
                  </td>
                  <td className="ic-col-symbol">{r.symbol}</td>
                  <td className="ic-col-num">{r.exitReliability.toFixed(1)}</td>
                  <td className="ic-col-num">{r.spot == null ? PLACEHOLDER : `$${r.spot.toFixed(2)}`}</td>
                  <td className="ic-col-num ic-placeholder" title="Not yet served by the appliance">{PLACEHOLDER}</td>
                  <td className="ic-col-num ic-placeholder" title="Not yet served by the appliance">{PLACEHOLDER}</td>
                  <td className={`ic-col-num ${chgClass}`}>{r.chg == null ? PLACEHOLDER : formatTodayGl(r.chg)}</td>
                  <td className={`ic-col-num ${chgClass}`}>{r.chgPct == null ? PLACEHOLDER : formatTodayGlPercent(r.chgPct)}</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td className="ic-empty" colSpan={8}>No symbols match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </section>
  );
}
