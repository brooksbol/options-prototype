/**
 * Operator Console — Wheelwright Home Surface (ADR-012)
 *
 * Primary monitoring and orientation surface.
 * Renders encumbered capital distributed over time via expiration-native DTE ladder.
 *
 * Contract State only (ADR-013 dimension 1).
 * No Decision Pressure, Economic Consequence, or situation interpretation.
 */

import { useState, useCallback, useMemo } from "react";
import { usePortfolio } from "../portfolio/use-portfolio";
import { useObservations } from "../evidence/use-observations";
import { useEvidenceSnapshot } from "../hooks/useEvidenceSnapshot";
import { useSessionClassification } from "../hooks/useSessionClassification";
import { ingestChainsFromSnapshot } from "../evidence/chain-cache-ingestion";
import { formatGreek } from "../write-desk/option-greeks";
import { useSpotHistory, type SpotHistoryMap } from "../evidence/use-spot-history";
import { useIntradayBars, type IntradayBarsMap } from "../evidence/use-intraday-bars";

/** Stable empty intraday-bars map for non-default regimes (a/c) that don't fetch bars. */
const EMPTY_INTRADAY_BARS: IntradayBarsMap = new Map();
import { usePositionDeltas, usePositionGreeks, usePositionQuotes, type PositionDeltaMap, type PositionGreeksMap, type PositionQuoteMap } from "../operator-console/use-position-deltas";
import { useHoldCloseNotices, type HoldCloseNotice } from "../operator-console/use-hold-close-notices";
import { HoldCloseBell } from "../operator-console/HoldCloseBell";

/** Row-notice map type used by PositionTable/ExpirationRungRow props. */
type HoldCloseNoticeMap = ReadonlyMap<string, HoldCloseNotice>;
import { deriveMonitoredPositions, groupByExpiration, type ExpirationRung, type MonitoredPosition } from "../portfolio/position-monitoring";
import { buildPositionDetail, type PositionDetail } from "../portfolio/position-detail";
import type { OptionBasisInput } from "../portfolio/assignment-consequence";
import { deriveCallAssignmentConsequence, derivePutAssignmentConsequence } from "../portfolio/assignment-consequence";
import { lookupDescription } from "../instrument-catalog/catalog";
import { PositionDetailModal } from "./PositionDetailModal";
import { ForceAcquisitionButton } from "../operator-console/ForceAcquisitionButton";
import { UnencumberedInventory, buildUnencumberedCsvRows, UNENCUMBERED_CSV_HEADER } from "../operator-console/UnencumberedInventory";
import "../operator-console/operator-console.css";

// Greeks are considered stale when their source chain is older than this. Aligned
// with the Decision chain-freshness window (~30 min during open sessions): beyond
// it, the greeks no longer reflect current market state. This governs greek-cell
// staleness annotation ONLY — it is a presentation honesty signal (greek age is
// the chain's age, not the spot's), not a backend validity rule.
const GREEK_STALE_MS = 30 * 60 * 1000;

// --- Sort Types ---

type SortColumn =
  | "symbol" | "strike" | "expiration" | "dte" | "spot" | "contracts"
  | "moneyness" | "capital" | "capitalPct" | "shareBasis" | "premiumBooked"
  | "effectiveExit" | "calledAway" | "assigned" | "mktVsBasis" | "opened" | "dataAge";

/**
 * Sort positions by the given column. Operates on a shallow copy.
 * Null/unavailable values sort to the end regardless of direction.
 */
function sortPositions(
  positions: MonitoredPosition[],
  column: SortColumn,
  direction: "asc" | "desc",
): MonitoredPosition[] {
  const sorted = [...positions];
  const dir = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    const av = getSortValue(a, column);
    const bv = getSortValue(b, column);

    // Nulls always sort to end
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * dir;
    }
    return ((av as number) - (bv as number)) * dir;
  });

  return sorted;
}

function getSortValue(p: MonitoredPosition, column: SortColumn): string | number | null {
  switch (column) {
    case "symbol": return p.underlying;
    case "strike": return p.strike;
    case "expiration": return p.expiration;
    case "dte": return p.dte;
    case "spot": return p.underlyingPrice;
    case "contracts": return p.quantity;
    case "moneyness": return p.moneyness;
    case "capital": return p.encumberedCapital;
    case "capitalPct": return p.encumberedCapital; // sort by absolute capital (pct is proportional)
    case "opened": return p.openedDate;
    case "dataAge": return p.priceObservedAt ? Date.parse(p.priceObservedAt) : null;
    default: return null; // Derived columns (premiumBooked, etc.) handled via position fields
  }
}

export function OperatorConsole() {
  const { source, snapshot } = usePortfolio();
  const observations = useObservations();
  // Backend-authoritative session classification (ADR-017). Consumed by the
  // HOLD-vs-CLOSE consequence section's admissibility gate; never re-derived here.
  const sessionClassification = useSessionClassification();
  const [selectedPosition, setSelectedPosition] = useState<MonitoredPosition | null>(null);

  // Own the chain-evidence read cycle (do not depend on Write Desk having been
  // visited). The Console previously read chain records from IndexedDB that were
  // populated ONLY by the Write Desk poll; a Console-only session therefore saw
  // stale or missing chains (e.g. greeks blank, or delta from an older
  // generation). Poll the snapshot here and ingest chains ourselves, then bump a
  // local generation so the delta/greeks read hooks re-read what we just wrote.
  //
  // Chain records are a single shared IndexedDB store; ingestion is idempotent
  // per (symbol, expiration) key, so overlapping with the Write Desk poll (only
  // one surface is mounted at a time via the router) is safe.
  const [chainGeneration, setChainGeneration] = useState(0);
  const isDemo = source === "demo";
  const onChainSnapshot = useCallback(async (snapshotData: any) => {
    const merged = await ingestChainsFromSnapshot(snapshotData);
    if (merged > 0) setChainGeneration(g => g + 1);
  }, []);
  useEvidenceSnapshot(!isDemo, onChainSnapshot);

  // Console visualization regime. B is the accepted production design.
  // A and C are retained as development reference but no longer the default.
  const vizRegime = new URLSearchParams(window.location.search).get("viz") || "b";
  // Group by axis (used in regime B)
  const [groupBy, setGroupBy] = useState<"expiration" | "strategy" | "underlying">("expiration");
  // Collapsed groups (by label key) for regime B
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Column sort state — applies within groups, not across them
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      // Same column: toggle direction, or clear on third click
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        // Clear sort — restore default DTE order
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn, sortDirection]);

  // NOTE: do NOT early-return here on a null snapshot. Hooks below (useMemo,
  // useSpotHistory, useIntradayBars, usePositionDeltas/Greeks/Quotes, useHoldCloseNotices)
  // must run unconditionally on every render — an early return between hook groups changes
  // the hook count when the active account's snapshot transitions null↔present and crashes
  // React ("Rendered fewer hooks than expected"). The empty state is rendered after all
  // hooks (see below). Derivations are null-safe.
  const positions = snapshot ? deriveMonitoredPositions(snapshot, observations) : [];
  const rungs = groupByExpiration(positions);
  const totalCapital = rungs.reduce((sum, r) => sum + r.totalCapital, 0);
  const maxPositionCapital = Math.max(...positions.map(p => p.encumberedCapital ?? 0), 1);

  // Spot history for sparklines — real data for Fidelity, synthetic for Demo.
  //
  // `positions` is a NEW array every render (deriveMonitoredPositions), so memoizing
  // `underlyings` on `[positions]` still produced a new array reference every render,
  // which made useSpotHistory's effect re-run (and cancel its in-flight fetch) on every
  // render — a key contributor to sparklines vanishing on Console remount. Stabilize the
  // symbol set by its CONTENT: derive a joined key and only produce a new array when the
  // actual set of underlyings changes. (Same unstable-identity class as usePositionDeltas.)
  const isDemoSource = source === "demo";
  // Include owned-share symbols (inventory) alongside option-position underlyings so
  // the Unencumbered Shares region's live columns (Spot, Today's G/L, Capital,
  // Freshness) populate for purely free holdings, and so those symbols are covered
  // by spot-history fetch and the operator's "Refresh evidence now" (which is passed
  // this same `underlyings` set). PL-EVID-01: monitored capital is observable
  // independent of the recommendation universe.
  const underlyingsKey = [...new Set([
    ...positions.map(p => p.underlying),
    ...(snapshot?.inventory ?? []).map(inv => inv.symbol.toUpperCase()),
  ])].sort().join(",");
  const underlyings = useMemo(
    () => (underlyingsKey === "" ? [] : underlyingsKey.split(",")),
    [underlyingsKey],
  );
  const spotHistory = useSpotHistory(underlyings, !isDemoSource, observations.generation);
  // High-resolution intraday bars (timesales) for the moneyness SPARKLINE only.
  // The strike is fixed, so a dense spot series → a dense moneyness curve. Numeric
  // cells (moneyness value, Today's G/L) stay on observed spot evidence; this feeds
  // the sparkline shape exclusively. Appliance-sourced via /api/evidence/timesales.
  const intradayBars = useIntradayBars(underlyings, !isDemoSource, observations.generation);
  // Re-read chain-derived values when EITHER the quote-observation generation or
  // our own chain-ingestion generation advances. The chain generation is what
  // reflects freshly ingested greeks/delta from this surface's own poll.
  const chainReadGeneration = (observations.generation ?? 0) + chainGeneration;
  const positionDeltas = usePositionDeltas(positions, chainReadGeneration);
  const positionGreeks = usePositionGreeks(positions, chainReadGeneration);
  // Option contract bid/ask per position — same cached-chain source as greeks.
  const positionQuotes = usePositionQuotes(positions, chainReadGeneration);
  // Row-level BTS / HOLD-CLOSE evaluation, computed ONCE per position and owned
  // here (single evaluation, two consumers). The row indicator reflects the
  // governed decision (`notices`); the opened modal LEADS with the SAME resolved
  // decision and renders its pair — they cannot disagree.
  const { resolved: holdCloseResolved, notices: holdCloseNotices } = useHoldCloseNotices(positions, snapshot, sessionClassification, chainReadGeneration);

  // Alternative groupings for regime B
  const groups: { label: string; sublabel?: string; positions: MonitoredPosition[]; totalCapital: number }[] = (() => {
    if (vizRegime !== "b" || groupBy === "expiration") {
      return rungs.map(r => ({
        label: formatExpiration(r.expiration),
        sublabel: `${r.dte} DTE`,
        positions: r.positions,
        totalCapital: r.totalCapital,
      }));
    }
    if (groupBy === "strategy") {
      const stratOrder: MonitoredPosition["type"][] = ["put", "call", "buy-write"];
      const stratLabels: Record<string, string> = { put: "Cash-Secured Puts", call: "Covered Calls", "buy-write": "Buy-Writes" };
      return stratOrder
        .map(t => {
          const p = positions.filter(pos => pos.type === t);
          const cap = p.reduce((s, pos) => s + (pos.encumberedCapital ?? 0), 0);
          return { label: stratLabels[t], positions: p, totalCapital: cap };
        })
        .filter(g => g.positions.length > 0);
    }
    // groupBy === "underlying"
    const bySymbol = new Map<string, MonitoredPosition[]>();
    for (const p of positions) {
      const existing = bySymbol.get(p.underlying);
      if (existing) existing.push(p); else bySymbol.set(p.underlying, [p]);
    }
    return [...bySymbol.entries()]
      .map(([sym, ps]) => ({
        label: sym,
        positions: ps,
        totalCapital: ps.reduce((s, p) => s + (p.encumberedCapital ?? 0), 0),
      }))
      .sort((a, b) => b.totalCapital - a.totalCapital);
  })();

  // Note: consequence hints are no longer rendered on tiles (ADR-013 dimension independence).
  // Economic Consequence remains available in the position-detail modal.

  // Empty state — rendered AFTER all hooks have run (no early return above), so the hook
  // count is stable whether or not an account snapshot is present.
  if (!snapshot) {
    return (
      <div className="oc-shell">
        <div className="oc-empty">
          <p>No portfolio data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`oc-shell ${vizRegime !== "c" ? "oc-light" : ""}`}>
      <div className="oc-body">
        <div className="oc-main">
          {/* Current portfolio state / available inventory — ABOVE and SEPARATE
              from the temporal DTE ladder (PL-ELIG V1). Shares are never inserted
              into the ladder. */}
          <UnencumberedInventory snapshot={snapshot} observations={observations.observations} />
          {/* Position Monitoring — ladder with regime-specific tile rendering */}
          <div className="oc-region-ladder">
            {vizRegime === "b" && (
              <div className="oc-group-by-bar">
                <span className="oc-group-by-label">Group by</span>
                <select
                  className="oc-group-by-select"
                  value={groupBy}
                  onChange={(e) => { setGroupBy(e.target.value as "expiration" | "strategy" | "underlying"); setCollapsedGroups(new Set()); }}
                >
                  <option value="expiration">Expiration</option>
                  <option value="strategy">Strategy</option>
                  <option value="underlying">Underlying</option>
                </select>
                <span className="oc-group-by-divider" />
                <button
                  className="oc-group-by-action"
                  onClick={() => setCollapsedGroups(new Set())}
                  disabled={collapsedGroups.size === 0}
                >
                  Expand all
                </button>
                <button
                  className="oc-group-by-action"
                  onClick={() => setCollapsedGroups(new Set(groups.map(g => `${groupBy}-${g.label}`)))}
                  disabled={collapsedGroups.size === groups.length}
                >
                  Collapse all
                </button>
                <span className="oc-group-by-divider" />
                <button
                  className="oc-group-by-action"
                  onClick={() => downloadPositionsCsv(positions, snapshot, positionDeltas, positionGreeks, positionQuotes, spotHistory, isDemoSource, observations.observations)}
                >
                  Download CSV
                </button>
                <span className="oc-group-by-divider" />
                <ForceAcquisitionButton symbols={underlyings} />
              </div>
            )}
            <div className="oc-ladder-scroll">
              <div className={`oc-ladder ${vizRegime === "b" ? "oc-ladder-dense" : ""}`}>
                {vizRegime === "b" && <PositionTableHeader />}
                {vizRegime === "b" ? (
                groups.map((group, i) => {
                  const groupKey = `${groupBy}-${group.label}`;
                  const isCollapsed = collapsedGroups.has(groupKey);
                  const toggleCollapse = () => {
                    setCollapsedGroups(prev => {
                      const next = new Set(prev);
                      if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey);
                      return next;
                    });
                  };
                  return (
                    <div key={i} className={`oc-rung ${isCollapsed ? "oc-rung-collapsed" : ""}`}>
                      <div
                        className="oc-rung-label oc-rung-label-collapsible"
                        onClick={toggleCollapse}
                        role="button"
                        aria-expanded={!isCollapsed}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCollapse(); } }}
                      >
                        <span className={`oc-rung-chevron ${isCollapsed ? "oc-rung-chevron-collapsed" : ""}`} aria-hidden="true">▾</span>
                        <span className="oc-rung-date">{group.label}</span>
                        {group.sublabel && <span className="oc-rung-dte">{group.sublabel}</span>}
                        {!group.sublabel && <span className="oc-rung-capital">${group.totalCapital.toLocaleString()}</span>}
                        <span className="oc-rung-count">{group.positions.length} position{group.positions.length !== 1 ? "s" : ""}</span>
                      </div>
                      {!isCollapsed && (
                        <PositionTable positions={group.positions} onTileClick={setSelectedPosition} totalCapital={group.totalCapital} allPositionsTotalCapital={totalCapital} maxPositionCapital={maxPositionCapital} positionDeltas={positionDeltas} positionGreeks={positionGreeks} positionQuotes={positionQuotes} holdCloseNotices={holdCloseNotices} isDemoSource={isDemoSource} spotHistory={spotHistory} intradayBars={intradayBars} snapshot={snapshot} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                      )}
                    </div>
                  );
                })
              ) : (
                rungs.map((rung) => (
                  <ExpirationRungRow key={rung.expiration} rung={rung} totalCapital={totalCapital} maxPositionCapital={maxPositionCapital} positionDeltas={positionDeltas} positionGreeks={positionGreeks} positionQuotes={positionQuotes} holdCloseNotices={holdCloseNotices} onTileClick={setSelectedPosition} vizRegime={vizRegime} isDemoSource={isDemoSource} spotHistory={spotHistory} snapshot={snapshot} />
                ))
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regime indicator (dev only) */}
      <footer className="oc-region-footer">
        <div className="oc-footer-placeholder">
          Regime {vizRegime.toUpperCase()} · {positions.length} positions · {rungs.length} rungs
        </div>
      </footer>

      {/* Position Detail Modal */}
      {selectedPosition && snapshot && (
        <PositionDetailModal
          detail={buildDetailForPosition(selectedPosition, snapshot, source)}
          onClose={() => setSelectedPosition(null)}
          resolved={holdCloseResolved.get(selectedPosition.id) ?? null}
        />
      )}
    </div>
  );
}

// --- Expiration Rung ---

function ExpirationRungRow({ rung, totalCapital, maxPositionCapital, positionDeltas, positionGreeks, positionQuotes, holdCloseNotices, onTileClick, vizRegime, isDemoSource, spotHistory, snapshot }: { rung: ExpirationRung; totalCapital: number; maxPositionCapital: number; positionDeltas: PositionDeltaMap; positionGreeks: PositionGreeksMap; positionQuotes: PositionQuoteMap; holdCloseNotices?: HoldCloseNoticeMap; onTileClick: (p: MonitoredPosition) => void; vizRegime: string; isDemoSource: boolean; spotHistory: SpotHistoryMap; snapshot: import("../write-desk/types").PortfolioSnapshot }) {
  const rungPercent = totalCapital > 0 ? Math.round((rung.totalCapital / totalCapital) * 100) : 0;

  return (
    <div className="oc-rung">
      <div className="oc-rung-label">
        <span className="oc-rung-date">{formatExpiration(rung.expiration)}</span>
        <span className="oc-rung-dte">{rung.dte} DTE</span>
        <span className="oc-rung-capital">${rung.totalCapital.toLocaleString()}</span>
        <span className="oc-rung-percent">{rungPercent}%</span>
        <span className="oc-rung-count">{rung.positions.length} position{rung.positions.length !== 1 ? "s" : ""}</span>
      </div>
      {vizRegime === "b" ? (
        <PositionTable positions={rung.positions} onTileClick={onTileClick} totalCapital={rung.totalCapital} allPositionsTotalCapital={totalCapital} maxPositionCapital={maxPositionCapital} positionDeltas={positionDeltas} positionGreeks={positionGreeks} positionQuotes={positionQuotes} holdCloseNotices={holdCloseNotices} isDemoSource={isDemoSource} spotHistory={spotHistory} intradayBars={EMPTY_INTRADAY_BARS} snapshot={snapshot} />
      ) : (
        <PositionGrid positions={rung.positions} onTileClick={onTileClick} vizRegime={vizRegime} totalCapital={rung.totalCapital} />
      )}
    </div>
  );
}

// --- Treemap Rung (d3-hierarchy packing) ---

function PositionGrid({ positions, onTileClick, vizRegime, totalCapital }: { positions: MonitoredPosition[]; onTileClick: (p: MonitoredPosition) => void; vizRegime: string; totalCapital: number }) {
  return (
    <div className="oc-rung-grid">
      {positions.map((position) => {
        // Regime A: proportional width based on capital (with a floor)
        const style: React.CSSProperties | undefined = vizRegime === "a" && totalCapital > 0 && position.encumberedCapital
          ? { flex: `${Math.max(1, Math.sqrt(position.encumberedCapital / totalCapital) * 10)} 1 155px` }
          : undefined;
        return (
          <PositionTile key={position.id} position={position} onClick={() => onTileClick(position)} style={style} />
        );
      })}
    </div>
  );
}

// --- CSV Download ---

/**
 * Export the current position ladder as CSV.
 * Includes the same columns rendered in the table: Type, Symbol, Strike, Spot, Today's G/L,
 * Contracts, Moneyness, Capital, Premium Booked, Bonus If Called Away, If Assigned.
 */
/**
 * CSV-safe greek formatting: keeps values numeric-parseable while never emitting a
 * real nonzero value as a false "0.0000". Unavailable (null) → empty cell. A value
 * that would round to zero at `digits` is widened (up to 8 decimals) until it is
 * representable as nonzero; if still sub-1e-8 it is shown in exponential form.
 * (This is the CSV counterpart to formatGreek's "<0.0001" threshold display.)
 */
function csvGreek(value: number | null, digits: number): string {
  if (value == null || value === 0) return "";
  for (let d = digits; d <= 8; d++) {
    const s = value.toFixed(d);
    if (Number(s) !== 0) return s;
  }
  return value.toExponential(2);
}

function downloadPositionsCsv(
  positions: MonitoredPosition[],
  snapshot: import("../write-desk/types").PortfolioSnapshot,
  positionDeltas: PositionDeltaMap,
  positionGreeks: PositionGreeksMap,
  positionQuotes: PositionQuoteMap,
  _spotHistory: SpotHistoryMap,
  _isDemoSource: boolean,
  observations: ReadonlyMap<string, import("../evidence/observation-store").QuoteObservation>,
) {
  const header = "Type,Symbol,Bid,Ask,Strike,Expiration,Spot,Today's G/L,Contracts,Moneyness,Capital,Delta,Gamma,Theta,Vega,Rho,Greek Age,Premium Booked,Bonus If Called Away,If Assigned,Opened,Quote Freshness";
  const rows = positions.map(position => {
    const type = position.type === "put" ? "PUT" : position.type === "buy-write" ? "BW" : "CALL";
    // Option contract bid/ask (same cached-chain source as the table). Unavailable
    // → empty cell; a provider exact 0 is preserved as 0.00 (real zero bid).
    const quote = positionQuotes.get(position.id);
    const bidStr = quote?.bid != null ? quote.bid.toFixed(2) : "";
    const askStr = quote?.ask != null ? quote.ask.toFixed(2) : "";
    const spot = position.underlyingPrice != null ? position.underlyingPrice.toFixed(2) : "";
    // Today's G/L = broker-parity daily move of the UNDERLYING vs its prior close
    // (BUG-020): (last − previousClose). Same canonical derivation and prior-close
    // source as the on-screen ladder row and the Unencumbered Shares column.
    const ladderGlInputs = { last: position.underlyingPrice ?? null, previousClose: position.underlyingPreviousClose ?? null };
    const todayGl = formatTodayGlCombined(computeTodayGlPerShare(ladderGlInputs), computeTodayGlPercent(ladderGlInputs));
    const moneyness = position.moneyness != null ? (position.moneyness * 100).toFixed(1) + "%" : "";
    const capital = position.encumberedCapital != null ? position.encumberedCapital.toString() : "";

    // Premium
    let premium = "";
    if (position.type === "call" || position.type === "buy-write") {
      const match = snapshot.existingCalls.find(c => c.underlying.toUpperCase() === position.underlying.toUpperCase() && c.strike === position.strike && c.expiration === position.expiration);
      if (match?.brokerOptionBasis != null) premium = Math.abs(match.brokerOptionBasis).toFixed(2);
    } else {
      const match = snapshot.existingPuts.find(p => p.underlying.toUpperCase() === position.underlying.toUpperCase() && p.strike === position.strike && p.expiration === position.expiration);
      if (match?.brokerOptionBasis != null) premium = Math.abs(match.brokerOptionBasis).toFixed(2);
    }

    // Called Away
    let calledAway = "";
    if (position.type === "call" || position.type === "buy-write") {
      const cell = deriveCalledAwayCell(position, snapshot);
      if (cell.className !== "oc-col-empty" && cell.className !== "oc-col-ambiguous") {
        calledAway = cell.display.replace(/[+−$,ᵇ ]/g, "").trim();
        if (cell.display.startsWith("−")) calledAway = "-" + calledAway;
      }
    }

    // Assigned
    let assigned = "";
    if (position.type === "put") {
      const cell = deriveAssignedCell(position, snapshot);
      assigned = cell.display;
    }

    // Greeks — from cached chain evidence (same source as the table columns).
    // CSV keeps values numeric-parseable but must never emit a real value as a
    // false "0.0000": csvGreek widens precision until the value is representable
    // (unavailable → empty cell). Delta uses the same rule at 2 decimals.
    const delta = positionDeltas.get(position.id);
    const g = positionGreeks.get(position.id);
    const deltaStr = csvGreek(delta ?? null, 2);
    const gammaStr = csvGreek(g?.gamma ?? null, 4);
    const thetaStr = csvGreek(g?.theta ?? null, 4);
    const vegaStr = csvGreek(g?.vega ?? null, 4);
    const rhoStr = csvGreek(g?.rho ?? null, 4);

    // Greek Age — AUTHORITATIVE acquisition age of the CHAIN the greeks came from
    // (from publisher-established provenance, not cache/TTL timing; distinct from
    // the quote-freshness column below). Empty when provenance is unavailable.
    let greekAge = "";
    if (g?.chainAcquiredAtMs != null) {
      greekAge = formatDataAge(Math.max(0, Date.now() - g.chainAcquiredAtMs));
    }

    // Quote Freshness — age of the underlying PRICE observation (NOT the greeks).
    let dataAge = "";
    if (position.priceObservedAt) {
      const observedMs = Date.parse(position.priceObservedAt);
      if (!Number.isNaN(observedMs)) dataAge = formatDataAge(Math.max(0, Date.now() - observedMs));
    }

    return `${type},${position.underlying},${bidStr},${askStr},${position.strike},${position.expiration},${spot},"${todayGl}",${position.quantity},${moneyness},${capital},${deltaStr},${gammaStr},${thetaStr},${vegaStr},${rhoStr},${greekAge},${premium},${calledAway},"${assigned}",${position.openedDate ?? ""},${dataAge}`;
  });

  // Unencumbered Shares section — appended as a labeled block so the two datasets
  // stay in one file without corrupting the positions block. Values come from the
  // same derivation as the rendered region (single source of truth). Fields are
  // CSV-quoted because combined G/L and capital cells can contain commas
  // (e.g. "$13,770", "+$5,406 (+13.66%)").
  const q = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const invRows = buildUnencumberedCsvRows(snapshot, observations);
  const invLines: string[] = ["", "Unencumbered Shares", UNENCUMBERED_CSV_HEADER.join(",")];
  for (const r of invRows) {
    invLines.push([
      q(r.symbol), q(r.lastPrice), q(r.todayGlDollar), q(r.todayGlPct),
      q(r.totalGlDollar), q(r.totalGlPct), q(r.currentValue), r.quantity,
      r.freeLots, q(r.averageCostBasis), q(r.freshness),
    ].join(","));
  }

  const csv = [header, ...rows, ...invLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wheelwright-positions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Consequence Columns ---

interface CellResult {
  display: string;
  className: string;
  title: string;
}

const EMPTY_CELL: CellResult = { display: "—", className: "oc-col-empty", title: "" };

/**
 * Derive the PREMIUM BOOKED column for any position.
 * Uses broker option basis (same evidence as popup and Production accounting).
 * This is past/booked economic output — not a forecast, not contingent.
 */
function derivePremiumBookedCell(
  position: MonitoredPosition,
  snapshot: import("../write-desk/types").PortfolioSnapshot,
): CellResult {
  let brokerBasis: number | null = null;

  if (position.type === "call" || position.type === "buy-write") {
    const match = snapshot.existingCalls.find(
      c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
        && c.strike === position.strike
        && c.expiration === position.expiration
    );
    brokerBasis = match?.brokerOptionBasis ?? null;
  } else {
    const match = snapshot.existingPuts.find(
      p => p.underlying.toUpperCase() === position.underlying.toUpperCase()
        && p.strike === position.strike
        && p.expiration === position.expiration
    );
    brokerBasis = match?.brokerOptionBasis ?? null;
  }

  if (brokerBasis == null) {
    return { display: "—", className: "oc-col-empty", title: "Premium basis not available" };
  }

  // brokerBasis is negative (credit received) — display as positive premium booked
  const premium = Math.abs(brokerBasis);
  return {
    display: `+$${premium.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    className: "oc-col-premium",
    title: `Premium booked: $${premium.toFixed(2)} (broker-reported option basis)`,
  };
}

/**
 * Derive the IF CALLED AWAY column for calls/buy-writes.
 * Uses Activity-attributed basis with strict provenance rendering.
 */
function deriveCalledAwayCell(
  position: MonitoredPosition,
  snapshot: import("../write-desk/types").PortfolioSnapshot,
): CellResult {
  if (position.type === "put") return EMPTY_CELL;

  const inventory = snapshot.inventory.find(
    inv => inv.symbol.toUpperCase() === position.underlying.toUpperCase()
  ) ?? null;

  const matchingCall = snapshot.existingCalls.find(
    c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
      && c.strike === position.strike
      && c.expiration === position.expiration
  );

  const optionBasis: OptionBasisInput = {
    brokerOptionBasis: matchingCall?.brokerOptionBasis ?? null,
    brokerOptionAverageCost: matchingCall?.brokerOptionAverageCost ?? null,
  };

  const consequence = deriveCallAssignmentConsequence(position, inventory, optionBasis, matchingCall?.acquisitionBasis);

  const provenance = consequence.brokerShareBasis.provenance;
  const totalValue = consequence.totalAppreciationOrErosion.value;

  if (provenance === "activity-attributed" && totalValue != null) {
    const isPositive = totalValue >= 0;
    return {
      display: isPositive ? `+$${totalValue.toLocaleString()}` : `−$${Math.abs(totalValue).toLocaleString()}`,
      className: isPositive ? "oc-col-positive" : "oc-col-negative",
      title: `If called away: ${isPositive ? "appreciation" : "erosion"} of $${Math.abs(totalValue).toLocaleString()} (basis $${consequence.brokerShareBasis.value?.toFixed(2)}/sh, Activity-attributed)`,
    };
  }

  if (provenance === "batch-attributed" && totalValue != null) {
    const isPositive = totalValue >= 0;
    return {
      display: isPositive ? `+$${totalValue.toLocaleString()} ᵇ` : `−$${Math.abs(totalValue).toLocaleString()} ᵇ`,
      className: isPositive ? "oc-col-positive oc-col-batch" : "oc-col-negative oc-col-batch",
      title: `If called away: ${isPositive ? "appreciation" : "erosion"} of $${Math.abs(totalValue).toLocaleString()} (batch basis $${consequence.brokerShareBasis.value?.toFixed(2)}/sh — individual fill-to-call pairing not proven)`,
    };
  }

  if (provenance === "observed") {
    return {
      display: "—",
      className: "oc-col-ambiguous",
      title: `Basis is symbol-level blended average ($${consequence.brokerShareBasis.value?.toFixed(2)}/sh) — not proven call-specific`,
    };
  }

  return { display: "—", className: "oc-col-empty", title: "Share cost basis unavailable" };
}

/**
 * Derive the IF ASSIGNED column for puts.
 * Shows acquisition result: shares + effective basis per share.
 * Reuses canonical derivePutAssignmentConsequence for effective basis.
 */
function deriveAssignedCell(
  position: MonitoredPosition,
  snapshot: import("../write-desk/types").PortfolioSnapshot,
): CellResult {
  if (position.type !== "put") return EMPTY_CELL;

  const shares = position.quantity * 100;

  // Resolve option basis from snapshot for effective basis calculation
  const matchingPut = snapshot.existingPuts.find(
    p => p.underlying.toUpperCase() === position.underlying.toUpperCase()
      && p.strike === position.strike
      && p.expiration === position.expiration
  );

  const optionBasis: OptionBasisInput = {
    brokerOptionBasis: matchingPut?.brokerOptionBasis ?? null,
    brokerOptionAverageCost: matchingPut?.brokerOptionAverageCost ?? null,
  };

  const inventory = snapshot.inventory.find(
    inv => inv.symbol.toUpperCase() === position.underlying.toUpperCase()
  ) ?? null;

  const consequence = derivePutAssignmentConsequence(position, inventory, optionBasis);

  // Prefer effective basis (strike - premium/share) when available
  if (consequence.analyticalEffectiveBasis.value != null) {
    const basis = consequence.analyticalEffectiveBasis.value;
    return {
      display: `${shares} @ $${basis.toFixed(2)}`,
      className: "oc-col-assigned",
      title: `If assigned: acquire ${shares} shares at effective basis $${basis.toFixed(2)}/share (strike $${position.strike} − premium $${(position.strike - basis).toFixed(2)}/share)`,
    };
  }

  // Fallback: show shares at strike (no premium evidence for effective basis)
  return {
    display: `${shares} @ $${position.strike.toFixed(2)}`,
    className: "oc-col-assigned",
    title: `If assigned: acquire ${shares} shares at $${position.strike}/share (premium basis unavailable for effective cost)`,
  };
}

/**
 * Derive SHARE BASIS column for calls/BW.
 * Shows the per-share cost basis for the underlying shares backing this call.
 * Uses Activity-attributed basis when available, falls back to symbol-level average.
 * Puts show "—" (no owned-share basis relevant).
 */
function deriveShareBasisCell(
  position: MonitoredPosition,
  snapshot: import("../write-desk/types").PortfolioSnapshot,
): CellResult {
  if (position.type === "put") return EMPTY_CELL;

  const matchingCall = snapshot.existingCalls.find(
    c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
      && c.strike === position.strike
      && c.expiration === position.expiration
  );

  // Prefer Activity-attributed basis
  if (matchingCall?.acquisitionBasis) {
    const basis = matchingCall.acquisitionBasis.pricePerShare;
    const conf = matchingCall.acquisitionBasis.confidence;
    return {
      display: `$${basis.toFixed(2)}`,
      className: conf === "unique" ? "oc-col-basis" : "oc-col-basis oc-col-batch",
      title: `Share basis: $${basis.toFixed(2)}/sh (${conf === "unique" ? "Activity-attributed" : "batch-attributed"})`,
    };
  }

  // Fall back to symbol-level average
  const inventory = snapshot.inventory.find(
    inv => inv.symbol.toUpperCase() === position.underlying.toUpperCase()
  );
  if (inventory?.economics?.averageCostPerShare != null) {
    return {
      display: `$${inventory.economics.averageCostPerShare.toFixed(2)}`,
      className: "oc-col-basis oc-col-observed",
      title: `Share basis: $${inventory.economics.averageCostPerShare.toFixed(2)}/sh (symbol-level blended average)`,
    };
  }

  return { display: "—", className: "oc-col-empty", title: "Share basis unavailable" };
}

/**
 * Derive EFFECTIVE EXIT column for calls/BW.
 * Effective exit = strike + premium/share. The all-in sale price if called away.
 * Puts show "—".
 */
function deriveEffectiveExitCell(
  position: MonitoredPosition,
  snapshot: import("../write-desk/types").PortfolioSnapshot,
): CellResult {
  if (position.type === "put") return EMPTY_CELL;

  const matchingCall = snapshot.existingCalls.find(
    c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
      && c.strike === position.strike
      && c.expiration === position.expiration
  );

  const optionBasis: OptionBasisInput = {
    brokerOptionBasis: matchingCall?.brokerOptionBasis ?? null,
    brokerOptionAverageCost: matchingCall?.brokerOptionAverageCost ?? null,
  };

  // Premium per share from broker option average cost
  if (optionBasis.brokerOptionAverageCost != null) {
    const premiumPerShare = Math.abs(optionBasis.brokerOptionAverageCost);
    const effectiveExit = position.strike + premiumPerShare;
    return {
      display: `$${effectiveExit.toFixed(2)}`,
      className: "oc-col-eff-exit",
      title: `Effective exit: $${effectiveExit.toFixed(2)}/sh (strike $${position.strike} + premium $${premiumPerShare.toFixed(2)}/sh)`,
    };
  }

  return { display: "—", className: "oc-col-empty", title: "Premium per share unavailable for effective exit" };
}

/**
 * Derive MKT VS EFF BASIS column for puts.
 * Shows currentPrice − effectiveBasis (strike − premium/sh).
 * Positive = market above effective acquisition cost (favorable assignment).
 * Negative = market below effective acquisition cost.
 * Calls/BW show "—".
 */
function deriveMktVsEffBasisCell(
  position: MonitoredPosition,
  snapshot: import("../write-desk/types").PortfolioSnapshot,
): CellResult {
  if (position.type !== "put") return EMPTY_CELL;
  if (position.underlyingPrice == null) return { display: "—", className: "oc-col-empty", title: "No market price for comparison" };

  const matchingPut = snapshot.existingPuts.find(
    p => p.underlying.toUpperCase() === position.underlying.toUpperCase()
      && p.strike === position.strike
      && p.expiration === position.expiration
  );

  const optionBasis: OptionBasisInput = {
    brokerOptionBasis: matchingPut?.brokerOptionBasis ?? null,
    brokerOptionAverageCost: matchingPut?.brokerOptionAverageCost ?? null,
  };

  // Compute effective basis = strike - premium/share
  if (optionBasis.brokerOptionAverageCost != null) {
    const premiumPerShare = Math.abs(optionBasis.brokerOptionAverageCost);
    const effectiveBasis = position.strike - premiumPerShare;
    const diff = position.underlyingPrice - effectiveBasis;
    const isPositive = diff >= 0;
    return {
      display: `${isPositive ? "+" : "−"}$${Math.abs(diff).toFixed(2)}`,
      className: isPositive ? "oc-col-positive" : "oc-col-negative",
      title: `Market ($${position.underlyingPrice.toFixed(2)}) vs effective basis ($${effectiveBasis.toFixed(2)}): ${isPositive ? "above" : "below"} by $${Math.abs(diff).toFixed(2)}`,
    };
  }

  return { display: "—", className: "oc-col-empty", title: "Premium unavailable for effective basis comparison" };
}

/** Regime B: Column header row — now rendered as <thead> inside PositionTable */
function PositionTableHeader() {
  return null; // Header is rendered inside PositionTable <thead>
}

/** Regime B: Dense fixed-geometry rows using native <table> for proper column alignment */
function PositionTable({ positions, onTileClick, allPositionsTotalCapital, maxPositionCapital, positionDeltas, positionGreeks, positionQuotes, holdCloseNotices, isDemoSource, spotHistory, intradayBars, snapshot, sortColumn, sortDirection, onSort }: { positions: MonitoredPosition[]; onTileClick: (p: MonitoredPosition) => void; totalCapital: number; allPositionsTotalCapital: number; maxPositionCapital: number; positionDeltas: PositionDeltaMap; positionGreeks: PositionGreeksMap; positionQuotes: PositionQuoteMap; holdCloseNotices?: HoldCloseNoticeMap; isDemoSource: boolean; spotHistory: SpotHistoryMap; intradayBars: IntradayBarsMap; snapshot: import("../write-desk/types").PortfolioSnapshot; sortColumn?: SortColumn | null; sortDirection?: "asc" | "desc"; onSort?: (column: SortColumn) => void }) {

  // Apply within-group sorting
  const sortedPositions = sortColumn
    ? sortPositions(positions, sortColumn, sortDirection ?? "asc")
    : positions;

  const renderSortHeader = (label: string, column: SortColumn, className?: string) => {
    const isActive = sortColumn === column;
    const arrow = isActive ? (sortDirection === "asc" ? " ↑" : " ↓") : "";
    return (
      <th
        className={`${className ?? ""} oc-th-sortable ${isActive ? "oc-th-sorted" : ""}`}
        onClick={() => onSort?.(column)}
        title={`Sort by ${label}`}
      >
        {label}{arrow}
      </th>
    );
  };

  return (
    <table className="oc-position-table">
      <thead>
        <tr>
          <th>Type</th>
          {renderSortHeader("Symbol", "symbol")}
          <th className="oc-th-right">Bid</th>
          <th className="oc-th-right">Ask</th>
          {renderSortHeader("Strike", "strike", "oc-th-right")}
          {renderSortHeader("Spot", "spot", "oc-th-right")}
          <th className="oc-th-right">Today's G/L</th>
          {renderSortHeader("Moneyness", "moneyness")}
          {renderSortHeader("Expiration", "expiration")}
          {renderSortHeader("DTE", "dte", "oc-th-right")}
          <th className="oc-th-right">Delta</th>
          <th className="oc-th-right">Gamma</th>
          <th className="oc-th-right">Theta</th>
          <th className="oc-th-right">Vega</th>
          <th className="oc-th-right">Rho</th>
          <th className="oc-th-right">Greek Age</th>
          {renderSortHeader("Contracts", "contracts", "oc-th-center")}
          {renderSortHeader("Capital", "capital", "oc-th-right")}
          <th className="oc-th-right">Capital %</th>
          <th className="oc-th-right">Share Basis</th>
          <th className="oc-th-right">Premium Booked</th>
          <th className="oc-th-right">Effective Exit</th>
          <th className="oc-th-right">If Called Away</th>
          <th className="oc-th-right">If Assigned</th>
          <th className="oc-th-right">Market vs Basis</th>
          {renderSortHeader("Opened", "opened")}
          {renderSortHeader("Quote Freshness", "dataAge", "oc-th-right")}
        </tr>
      </thead>
      <tbody>
        {sortedPositions.map((position) => {
          const mDisplay = formatMoneynessDisplay(position);
          // BUG-024: graded moneyness background — intensity by distance from ATM,
          // hue polarity by side/type (put: OTM green / ITM red; call & BW: mirror).
          // The graded background carries the color signal; the numeric text uses a
          // fixed high-contrast neutral so it stays legible over any tint/intensity.
          const moneynessBg = moneynessGradedColor(position.type, position.moneyness);
          const badge = position.type === "put" ? "PUT" : position.type === "buy-write" ? "BW" : "CALL";

          // Moneyness history: Demo uses synthetic, Fidelity uses real persisted spot observations
          let moneynessPoints: import("../operator-console/moneyness-history").MoneynessPoint[] = [];
          if (isDemoSource && position.underlyingPrice != null) {
            moneynessPoints = deriveMoneynessHistory(
              generateDemoSpotHistory(position.underlying, position.underlyingPrice),
              position.strike,
              position.type,
            );
          } else if (!isDemoSource) {
            // Prefer HIGH-RESOLUTION intraday timesales bars (a full session of 5-min
            // bars from one appliance call) for the sparkline SHAPE. The strike is
            // fixed, so a dense spot series → a dense moneyness curve. Bars carry
            // {close, time}; feed close as spot and time for time-proportional x.
            const bars = intradayBars.get(position.underlying);
            if (bars && bars.length >= 3) {
              moneynessPoints = deriveMoneynessHistory(
                bars.map(b => b.close),
                position.strike,
                position.type,
                bars.map(b => b.time),
              );
            } else {
              // Fallback: sparse observed spot_history (before timesales arrives, or
              // when unavailable). Reason in genuine observation MOMENTS, not raw
              // rows — multi-expiration acquisition writes one identical spot row per
              // eligible expiration per cycle; dedup collapses those to one moment.
              const realSpotSeries = spotHistory.get(position.underlying);
              const moments = realSpotSeries ? deduplicateObservations(realSpotSeries) : [];
              if (moments.length >= 3) {
                moneynessPoints = deriveMoneynessHistory(
                  moments.map(obs => obs.price),
                  position.strike,
                  position.type,
                  moments.map(obs => obs.observedAt),
                );
              }
            }
          }

          // Today's G/L: the underlying's per-share dollar move over the latest
          // session day present in the spot series (market context, not a position
          // mark-to-market P/L; null → "—", never fabricated). Demo uses synthetic
          // spot history; real sources use the deduplicated observation moments.
          // Today's G/L = broker-parity daily move of the UNDERLYING vs its prior
          // close (BUG-020): (last − previousClose). Same canonical derivation as
          // the Unencumbered Shares column; prior close carried on the position
          // (Demo supplies a synthetic coherent prior close via the observation set).
          const todayGlInputs = { last: position.underlyingPrice ?? null, previousClose: position.underlyingPreviousClose ?? null };
          const todayGl = computeTodayGlPerShare(todayGlInputs);
          const todayGlPct = computeTodayGlPercent(todayGlInputs);
          const todayGlDir = todayGlDirection(todayGl);

          // Consequence columns (strategy-specific)
          const premiumCell = derivePremiumBookedCell(position, snapshot);
          const calledAwayCell = deriveCalledAwayCell(position, snapshot);
          const assignedCell = deriveAssignedCell(position, snapshot);

          // New expansion columns
          const capitalPct = allPositionsTotalCapital > 0 && position.encumberedCapital != null
            ? Math.round((position.encumberedCapital / allPositionsTotalCapital) * 100)
            : null;

          const shareBasisCell = deriveShareBasisCell(position, snapshot);
          const effectiveExitCell = deriveEffectiveExitCell(position, snapshot);
          const mktVsBasisCell = deriveMktVsEffBasisCell(position, snapshot);
          const dataAgeCell = deriveDataAgeCell(position);

          return (
            <tr key={position.id} className={`oc-trow oc-trow-${position.type}`} onClick={() => onTileClick(position)}>
              <td className="oc-td-badge">
                <span className={`oc-badge oc-badge-${position.type}`}>{badge}</span>
                <HoldCloseBell notice={holdCloseNotices?.get(position.id) ?? "none"} />
              </td>
              <td className="oc-td-symbol">{position.underlying}</td>
              <td className="oc-td-right oc-td-bid">{formatQuotePrice(positionQuotes.get(position.id)?.bid ?? null)}</td>
              <td className="oc-td-right oc-td-ask">{formatQuotePrice(positionQuotes.get(position.id)?.ask ?? null)}</td>
              <td className="oc-td-right">${position.strike}</td>
              <td className="oc-td-right">{position.underlyingPrice != null ? `$${position.underlyingPrice.toFixed(2)}` : "—"}</td>
              <td className={`oc-td-right oc-td-gl oc-td-gl-${todayGlDir}`}>{formatTodayGlCombined(todayGl, todayGlPct)}</td>
              <td className="oc-td-moneyness" style={moneynessBg ? { background: moneynessBg } : undefined}>
                <MoneynessCellV4 points={moneynessPoints} type={position.type} currentMoneyness={position.moneyness} mDisplay={mDisplay} />
              </td>
              <td className="oc-td-exp">{formatExpiration(position.expiration)}</td>
              <td className="oc-td-right">{position.dte}d</td>
              {(() => {
                const delta = positionDeltas.get(position.id) ?? null;
                if (delta == null) {
                  return <td className="oc-td-right oc-td-delta">—</td>;
                }
                // Position-contextual color intensity, graded by distance from 0.50 (the
                // shared amber center). Delta is an observable local sensitivity; the color
                // is an operator cognitive aid, not a claim that Delta is good/bad.
                // BW: high delta = leaning toward call-away (green), low delta = not progressing (red)
                // CSP: low |delta| = low assignment pressure (green), high |delta| = assignment pressure (red)
                // CALL/CC (BUG-024): contract-side MIRROR of CSP around 0.50 — low delta = red,
                //   high delta = green, amber center. Identical bands/intensity to CSP, poles swapped.
                //   Previously neutral (uncolored), which left CALL out of the visual grammar.
                //
                // Gradient zones (continuous, no hard boundaries):
                //   ~0.20–0.35: one pole
                //   ~0.35–0.45: transitioning
                //   ~0.45–0.55: amber / neutral zone
                //   ~0.55–0.70: transitioning to other pole
                //   ~0.70–1.00: strong other pole
                let intensity = 0;
                let hue: "green" | "red" | "amber" | "neutral" = "neutral";
                if (position.type === "put") {
                  // CSP: low delta = green (safe), high delta = red (assignment pressure)
                  // Center of amber zone at ~0.45
                  if (delta <= 0.35) {
                    // Strong green zone
                    const t = 1 - (delta - 0.10) / 0.25; // 0.10→1.0, 0.35→0.0
                    intensity = 0.22 + Math.max(0, t) * t * 0.53;
                    hue = "green";
                  } else if (delta <= 0.55) {
                    // Amber transition zone
                    intensity = 0.22;
                    hue = "amber";
                  } else {
                    // Red zone — increasing assignment pressure
                    const t = Math.min(1, (delta - 0.55) / 0.35); // 0.55→0.0, 0.90→1.0
                    intensity = 0.22 + t * t * 0.53;
                    hue = "red";
                  }
                } else if (position.type === "buy-write") {
                  // BW: high delta = green (leaning toward call-away), low delta = red (not progressing)
                  // Center of amber zone at ~0.50
                  if (delta >= 0.55) {
                    // Green zone — progressing toward designed exit
                    const t = Math.min(1, (delta - 0.55) / 0.35); // 0.55→0.0, 0.90→1.0
                    intensity = 0.22 + t * t * 0.53;
                    hue = "green";
                  } else if (delta >= 0.40) {
                    // Amber transition zone
                    intensity = 0.22;
                    hue = "amber";
                  } else {
                    // Red zone — not progressing toward call-away
                    const t = 1 - delta / 0.40; // 0.0→1.0, 0.40→0.0
                    intensity = 0.22 + Math.max(0, t) * t * 0.53;
                    hue = "red";
                  }
                } else if (position.type === "call") {
                  // CALL/CC: contract-side MIRROR of CSP around the 0.50 amber center.
                  // Identical bands/thresholds/intensity to CSP; green/red poles swapped.
                  if (delta <= 0.35) {
                    // Low delta → red pole (mirror of CSP's green)
                    const t = 1 - (delta - 0.10) / 0.25; // 0.10→1.0, 0.35→0.0
                    intensity = 0.22 + Math.max(0, t) * t * 0.53;
                    hue = "red";
                  } else if (delta <= 0.55) {
                    // Amber transition zone — identical to CSP
                    intensity = 0.22;
                    hue = "amber";
                  } else {
                    // High delta → green pole (mirror of CSP's red)
                    const t = Math.min(1, (delta - 0.55) / 0.35); // 0.55→0.0, 0.90→1.0
                    intensity = 0.22 + t * t * 0.53;
                    hue = "green";
                  }
                }
                const bg = hue === "green"
                  ? `rgba(22, 163, 74, ${intensity})`
                  : hue === "red"
                    ? `rgba(220, 38, 38, ${intensity})`
                    : hue === "amber"
                      ? `rgba(202, 138, 4, ${intensity})`
                      : undefined;
                return (
                  <td className="oc-td-right oc-td-delta" style={bg ? { background: bg } : undefined}>
                    {formatGreek(delta, 2)}
                  </td>
                );
              })()}
              {(() => {
                const g = positionGreeks.get(position.id);
                // Greek freshness is the CHAIN's acquisition age — NOT the row's
                // underlying-quote freshness. A chain can be materially older than the
                // latest spot (e.g. a held near-expiry expiration acquired days ago), so
                // we annotate the greek cells with their own age and mark them stale when
                // the chain is older than the Decision chain window, so a fresh quote can
                // never make stale greeks look current.
                const chainMs = g?.chainAcquiredAtMs ?? null;
                const chainAgeMs = chainMs != null ? Math.max(0, Date.now() - chainMs) : null;
                const stale = chainAgeMs != null && chainAgeMs > GREEK_STALE_MS;
                const ageStr = chainAgeMs != null ? formatDataAge(chainAgeMs) : null;
                const cls = `oc-td-right oc-td-greek${stale ? " oc-td-greek-stale" : ""}`;
                const title = ageStr
                  ? `Greeks from chain acquired ${ageStr} ago${stale ? " — STALE (older than the chain freshness window; not the same as the spot's freshness)" : ""}`
                  : "Greek chain age unknown";
                const ageCls = `oc-td-right oc-td-greek-age${stale ? " oc-td-greek-stale" : ""}`;
                return (
                  <>
                    <td className={cls} title={title}>{formatGreek(g?.gamma ?? null)}</td>
                    <td className={cls} title={title}>{formatGreek(g?.theta ?? null)}</td>
                    <td className={cls} title={title}>{formatGreek(g?.vega ?? null)}</td>
                    <td className={cls} title={title}>{formatGreek(g?.rho ?? null)}</td>
                    <td className={ageCls} title={title}>{ageStr ?? "—"}</td>
                  </>
                );
              })()}
              <td className="oc-td-center">{position.quantity}</td>
              <td className="oc-td-right">{position.encumberedCapital != null ? `$${position.encumberedCapital.toLocaleString()}` : "—"}</td>
              <td
                className="oc-td-right oc-td-capital-pct"
                style={capitalPct != null && position.encumberedCapital != null ? {
                  background: `linear-gradient(to right, rgba(100, 116, 139, 0.18) ${Math.round((position.encumberedCapital / maxPositionCapital) * 100)}%, transparent ${Math.round((position.encumberedCapital / maxPositionCapital) * 100)}%)`,
                } : undefined}
              >{capitalPct != null ? `${capitalPct}%` : "—"}</td>
              <td className={`oc-td-right ${shareBasisCell.className}`} title={shareBasisCell.title}>{shareBasisCell.display}</td>
              <td className={`oc-td-right ${premiumCell.className}`} title={premiumCell.title}>{premiumCell.display}</td>
              <td className={`oc-td-right ${effectiveExitCell.className}`} title={effectiveExitCell.title}>{effectiveExitCell.display}</td>
              <td className={`oc-td-right ${calledAwayCell.className}`} title={calledAwayCell.title}>{calledAwayCell.display}</td>
              <td className={`oc-td-right ${assignedCell.className}`} title={assignedCell.title}>{assignedCell.display}</td>
              <td className={`oc-td-right ${mktVsBasisCell.className}`} title={mktVsBasisCell.title}>{mktVsBasisCell.display}</td>
              <td className="oc-td-opened">{position.openedDate ? formatOpenedDate(position.openedDate) : "—"}</td>
              <td className={`oc-td-right ${dataAgeCell.className}`} title={dataAgeCell.title}>{dataAgeCell.display}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <RungTotalsRow positions={positions} snapshot={snapshot} />
      </tfoot>
    </table>
  );
}

/**
 * Per-rung totals row — sums Capital, Premium Booked, and If Called Away.
 *
 * Epistemic rule for If Called Away total:
 * - Only sums rows with "activity-attributed" or "batch-attributed" provenance
 * - If any call/BW row in the group has "observed" (blended) or "unavailable" basis,
 *   the total is marked as partial (some rows excluded from the sum)
 * - Put assignment is not included (heterogeneous acquisition outcomes, not additive dollars)
 */
function RungTotalsRow({ positions, snapshot }: { positions: MonitoredPosition[]; snapshot: import("../write-desk/types").PortfolioSnapshot }) {
  if (positions.length === 0) return null;

  // Capital total
  const capitalTotal = positions.reduce((sum, p) => sum + (p.encumberedCapital ?? 0), 0);

  // Premium Booked total
  let premiumTotal = 0;
  let premiumCount = 0;
  for (const position of positions) {
    let brokerBasis: number | null = null;
    if (position.type === "call" || position.type === "buy-write") {
      const match = snapshot.existingCalls.find(
        c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
          && c.strike === position.strike && c.expiration === position.expiration
      );
      brokerBasis = match?.brokerOptionBasis ?? null;
    } else {
      const match = snapshot.existingPuts.find(
        p => p.underlying.toUpperCase() === position.underlying.toUpperCase()
          && p.strike === position.strike && p.expiration === position.expiration
      );
      brokerBasis = match?.brokerOptionBasis ?? null;
    }
    if (brokerBasis != null) {
      premiumTotal += Math.abs(brokerBasis);
      premiumCount++;
    }
  }

  // If Called Away total — epistemic-aware
  const callBwPositions = positions.filter(p => p.type === "call" || p.type === "buy-write");
  let calledAwayTotal = 0;
  let calledAwayKnown = 0;
  let calledAwaySuppressed = 0;

  for (const position of callBwPositions) {
    const inventory = snapshot.inventory.find(
      inv => inv.symbol.toUpperCase() === position.underlying.toUpperCase()
    ) ?? null;
    const matchingCall = snapshot.existingCalls.find(
      c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
        && c.strike === position.strike && c.expiration === position.expiration
    );
    const optionBasis: OptionBasisInput = {
      brokerOptionBasis: matchingCall?.brokerOptionBasis ?? null,
      brokerOptionAverageCost: matchingCall?.brokerOptionAverageCost ?? null,
    };
    const consequence = deriveCallAssignmentConsequence(position, inventory, optionBasis, matchingCall?.acquisitionBasis);
    const provenance = consequence.brokerShareBasis.provenance;
    const value = consequence.totalAppreciationOrErosion.value;

    if ((provenance === "activity-attributed" || provenance === "batch-attributed") && value != null) {
      calledAwayTotal += value;
      calledAwayKnown++;
    } else if (provenance === "observed" || provenance === "unavailable") {
      calledAwaySuppressed++;
    }
  }

  const isPartial = calledAwaySuppressed > 0;
  const hasCalledAway = calledAwayKnown > 0;

  // Format called-away total
  let calledAwayDisplay = "—";
  let calledAwayClass = "oc-col-empty";
  if (hasCalledAway) {
    const isPositive = calledAwayTotal >= 0;
    calledAwayDisplay = isPositive
      ? `+$${calledAwayTotal.toLocaleString()}`
      : `−$${Math.abs(calledAwayTotal).toLocaleString()}`;
    if (isPartial) {
      calledAwayDisplay += " *";
      calledAwayClass = "oc-col-partial";
    } else {
      calledAwayClass = isPositive ? "oc-col-positive" : "oc-col-negative";
    }
  }

  // Column layout (must track PositionTableHeader exactly, 27 columns):
  //  1 Type · 2 Symbol · 3 Bid · 4 Ask · 5 Strike · 6 Spot · 7 Today's G/L ·
  //  8 Moneyness · 9 Expiration · 10 DTE · 11 Delta · 12 Gamma · 13 Theta ·
  // 14 Vega · 15 Rho · 16 Greek Age · 17 Contracts · 18 Capital · 19 Capital % ·
  // 20 Share Basis · 21 Premium Booked · 22 Effective Exit · 23 If Called Away ·
  // 24 If Assigned · 25 Market vs Basis · 26 Opened · 27 Quote Freshness
  // The label spans cols 1–17; each summed value sits under its own header.
  return (
    <tr className="oc-trow-totals">
      <td colSpan={17} className="oc-td-totals-label">Total</td>
      {/* 18 Capital */}
      <td className="oc-td-right">${capitalTotal.toLocaleString()}</td>
      {/* 19 Capital % */}
      <td />
      {/* 20 Share Basis */}
      <td />
      {/* 21 Premium Booked */}
      <td className={`oc-td-right oc-col-premium`}>
        {premiumCount > 0 ? `+$${premiumTotal.toLocaleString()}` : "—"}
      </td>
      {/* 22 Effective Exit */}
      <td />
      {/* 23 If Called Away */}
      <td className={`oc-td-right ${calledAwayClass}`} title={isPartial ? `${calledAwaySuppressed} position(s) excluded — basis not proven call-specific` : ""}>
        {calledAwayDisplay}
      </td>
      {/* 24 If Assigned */}
      <td />
      {/* 25 Market vs Basis */}
      <td />
      {/* 26 Opened */}
      <td />
      {/* 27 Quote Freshness */}
      <td />
    </tr>
  );
}

// --- Position Tile ---

import { formatMoneynessDisplay } from "../operator-console/moneyness-presentation";
import { moneynessGradedColor } from "../operator-console/moneyness-color";
import { generateDemoSpotHistory, deriveMoneynessHistory, type MoneynessPoint } from "../operator-console/moneyness-history";
import { deduplicateObservations } from "../kreature/observation-derivation";
import { computeTodayGlPerShare, computeTodayGlPercent, formatTodayGlCombined, todayGlDirection } from "../operator-console/today-gl";
import { buildSparklineScale } from "../operator-console/sparkline-scale";

/**
 * MoneynessCellV4 — compound cell: compact numeric + semantic sparkline.
 * V4 visual grammar: chart-dominant, segmented trace, moderate regions, strong zero.
 * Perceptual amplification (Aug 2026): larger geometry, stronger fills, endpoint marker.
 */
function MoneynessCellV4({ points, type, currentMoneyness, mDisplay }: {
  points: MoneynessPoint[];
  type: import("../portfolio/position-monitoring").PositionType;
  currentMoneyness: number | null;
  mDisplay: string | null;
}) {
  // BUG-024: the graded cell background carries the color signal (intensity by distance
  // from ATM). The numeric text uses a fixed high-contrast neutral so it stays legible
  // over any tint — faint amber through strong green/red — at any intensity.
  const textColor = "#1f2937";

  // No moneyness at all → just dash
  if (currentMoneyness == null) {
    return (
      <span style={{ fontSize: "10px", fontWeight: 700, color: textColor }}>
        {mDisplay ?? "—"}
      </span>
    );
  }

  // Insufficient history (1-2 observations) → show numeric + restrained "accumulating" indicator
  if (points.length < 3) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, color: textColor, whiteSpace: "nowrap" }}>
          {mDisplay}
        </span>
        <svg width={160} height={24} viewBox="0 0 160 24" style={{ display: "block", flexShrink: 0, opacity: 0.5 }}>
          {/* Strike boundary */}
          <line x1={1} y1={12} x2={159} y2={12} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3" />
          {/* Dot(s) representing the few observations we have */}
          {points.map((p, i) => {
            const px = points.length === 1 ? 80 : 1 + (i / (points.length - 1)) * 158;
            const py = 12 - (p.moneyness / 0.05) * 8;
            const clampedY = Math.max(3, Math.min(21, py));
            return <circle key={i} cx={px} cy={clampedY} r={2.5} fill="#9ca3af" />;
          })}
        </svg>
      </span>
    );
  }

  const SPARK_W = 160;
  const SPARK_H = 18;
  const PAD = 1;

  // Topology-preserving auto-fit: scale Y by the LOCAL RANGE of the moneyness window,
  // not its absolute level. This guarantees the temporal shape is identical across
  // strikes on the same underlying history (e.g. two BNO strikes must both show the
  // same V), instead of far-OTM/ITM levels collapsing the trace to a flat line.
  // Strike relationship stays conveyed by the numeric value, cell color, region shading,
  // and the strike (zero) line when it falls within the fitted window.
  const scale = buildSparklineScale(points.map(p => p.moneyness), PAD, SPARK_H - PAD);
  const sYScale = (m: number) => scale.yScale(m);
  // Time-proportional x: session start (09:30 ET, t=0) at the LEFT, later points to
  // the right. Any incomplete-session gap therefore falls on the RIGHT (the future
  // that hasn't happened yet) — time reads left→right.
  const sXPos = (i: number) => PAD + points[i].t * (SPARK_W - PAD * 2);

  // Segmented trace
  const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = sXPos(i);
    const y1 = sYScale(points[i].moneyness);
    const x2 = sXPos(i + 1);
    const y2 = sYScale(points[i + 1].moneyness);
    const midM = (points[i].moneyness + points[i + 1].moneyness) / 2;
    const isAboveZero = midM > 0;
    // BUG-024: trace polarity by side/type. PUT: ITM red / OTM green. CALL & BW
    // (call-side): mirror — ITM green / OTM red. CALL previously rendered gray
    // (neutral), suppressing its strike-relative trajectory; it now mirrors the put
    // side like BW. Hue only here; the graded cell background carries intensity.
    let color: string;
    if (type === "put") {
      color = isAboveZero ? "#dc2626" : "#16a34a";
    } else {
      // call-side (call, buy-write): ITM green, OTM red
      color = isAboveZero ? "#16a34a" : "#dc2626";
    }
    segments.push({ x1, y1, x2, y2, color });
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: "3px", width: "100%" }}>
      <span style={{ fontSize: "9px", fontWeight: 700, color: textColor, whiteSpace: "nowrap" }}>
        {mDisplay}
      </span>
      <svg width="100%" height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" style={{ display: "block", flexShrink: 0, flex: 1 }}>
        {/* Trajectory trace — thin, like the Markets sparkline. (Strike/zero line
            removed per operator: moneyness value + cell color already convey the
            strike relationship.) */}
        {segments.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth="1.5" strokeLinecap="round" />
        ))}
      </svg>
    </span>
  );
}

/**
 * Position Tile — fixed-height, predictable geometry.
 *
 * Every position gets the same vertical space and a comfortable minimum width.
 * No four-mode degradation system. Content is consistent and readable.
 * Capital is shown as a labeled value — geometry no longer controls readability.
 */
function PositionTile({ position, onClick, style }: { position: MonitoredPosition; onClick: () => void; style?: React.CSSProperties }) {
  const mDisplay = formatMoneynessDisplay(position);
  // BUG-024: graded moneyness background (intensity by distance from ATM, mirrored
  // polarity by side/type) + fixed high-contrast text, consistent with the ladder cell.
  const moneynessBg = moneynessGradedColor(position.type, position.moneyness);

  const badge = position.type === "put" ? "PUT" : position.type === "buy-write" ? "BW" : "CALL";
  const qtyLabel = position.quantity > 1 ? ` ×${position.quantity}` : "";

  return (
    <div
      className={`oc-tile oc-tile-${position.type}`}
      onClick={onClick}
      style={style}
    >
      {/* Identity: badge + symbol + quantity */}
      <span className="oc-tile-identity">
        <span className="oc-tile-badge">{badge}</span>
        <span className="oc-tile-symbol">{position.underlying}{qtyLabel}</span>
      </span>

      {/* Strike */}
      <span className="oc-tile-field">
        <span className="oc-tile-label">Strike</span>
        <span className="oc-tile-value">${position.strike}</span>
      </span>

      {/* Spot */}
      {position.underlyingPrice != null && (
        <span className="oc-tile-field">
          <span className="oc-tile-label">Spot</span>
          <span className="oc-tile-value">${position.underlyingPrice.toFixed(2)}</span>
        </span>
      )}

      {/* Moneyness — graded strike-relative color (BUG-024) */}
      {mDisplay && (
        <span className="oc-tile-field oc-tile-field-moneyness">
          <span className="oc-tile-label">Moneyness</span>
          <span
            className="oc-tile-value oc-tile-moneyness"
            style={{ color: "#1f2937", ...(moneynessBg ? { background: moneynessBg, borderRadius: "3px", padding: "0 3px" } : {}) }}
          >{mDisplay}</span>
        </span>
      )}

      {/* Capital */}
      {position.encumberedCapital != null && (
        <span className="oc-tile-field">
          <span className="oc-tile-label">Capital</span>
          <span className="oc-tile-value">${(position.encumberedCapital / 1000).toFixed(1)}K</span>
        </span>
      )}
    </div>
  );
}

// --- Helpers ---

function buildDetailForPosition(
  position: MonitoredPosition,
  snapshot: import("../write-desk/types").PortfolioSnapshot,
  _source: import("../write-desk/types").PortfolioSourceType,
): PositionDetail {
  const inventory = snapshot.inventory.find(
    inv => inv.symbol.toUpperCase() === position.underlying.toUpperCase()
  ) ?? null;

  // Resolve option basis from the matching position in the snapshot
  let optionBasis: OptionBasisInput = { brokerOptionBasis: null, brokerOptionAverageCost: null };

  if (position.type === "call" || position.type === "buy-write") {
    const match = snapshot.existingCalls.find(
      c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
        && c.strike === position.strike
        && c.expiration === position.expiration
    );
    if (match) {
      optionBasis = { brokerOptionBasis: match.brokerOptionBasis, brokerOptionAverageCost: match.brokerOptionAverageCost };
    }
    // Resolve instrument description from description library
    const instrumentDescription = lookupDescription(position.underlying);
    return buildPositionDetail(position, inventory, snapshot.balanceContext, optionBasis, instrumentDescription, match?.acquisitionBasis);
  } else {
    const match = snapshot.existingPuts.find(
      p => p.underlying.toUpperCase() === position.underlying.toUpperCase()
        && p.strike === position.strike
        && p.expiration === position.expiration
    );
    if (match) {
      optionBasis = { brokerOptionBasis: match.brokerOptionBasis, brokerOptionAverageCost: match.brokerOptionAverageCost };
    }
  }

  // Resolve instrument description from description library
  const instrumentDescription = lookupDescription(position.underlying);

  return buildPositionDetail(position, inventory, snapshot.balanceContext, optionBasis, instrumentDescription);
}

function formatExpiration(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatOpenedDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format an option contract bid/ask price for the ladder. Unavailable (null) →
 * em dash — a missing quote is never shown as $0.00. A provider-supplied exact 0
 * IS shown as $0.00 (a zero bid is real market state: no live buyer), matching the
 * lookup's zero-preserving semantics.
 */
function formatQuotePrice(value: number | null): string {
  if (value == null) return "—";
  return `$${value.toFixed(2)}`;
}

/**
 * Format an evidence age (milliseconds since the underlying price was observed)
 * as a compact relative string. Freshness is derived here at query time —
 * never persisted (persist facts; derive trust).
 */
function formatDataAge(ageMs: number): string {
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  return `${days}d`;
}

/**
 * Derive the DATA AGE column — how recently this position's underlying price
 * evidence was observed. Uses priceObservedAt from the Evidence observation.
 * Tone escalates with staleness as a presentation-only hint; it does not
 * classify sealed-vs-stale (that is session-aware backend semantics).
 */
function deriveDataAgeCell(position: MonitoredPosition): CellResult {
  if (!position.priceObservedAt) {
    return { display: "—", className: "oc-col-empty", title: "No price observation recorded for this symbol" };
  }

  const observedMs = Date.parse(position.priceObservedAt);
  if (Number.isNaN(observedMs)) {
    return { display: "—", className: "oc-col-empty", title: "Observation timestamp unparseable" };
  }

  const ageMs = Math.max(0, Date.now() - observedMs);
  const minutes = ageMs / 60000;

  // Presentation-only freshness tone. Reuses existing positive/ambiguous/negative
  // classes so it inherits console color grammar.
  let className = "oc-col-positive";
  if (minutes >= 120) {
    className = "oc-col-negative";
  } else if (minutes >= 30) {
    className = "oc-col-ambiguous";
  }

  const observedLocal = new Date(observedMs).toLocaleString();
  return {
    display: formatDataAge(ageMs),
    className,
    title: `Underlying price observed ${observedLocal} (${formatDataAge(ageMs)} ago)`,
  };
}
