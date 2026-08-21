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
import { useSpotHistory, type SpotHistoryMap } from "../evidence/use-spot-history";
import { deriveMonitoredPositions, groupByExpiration, type ExpirationRung, type MonitoredPosition } from "../portfolio/position-monitoring";
import { buildPositionDetail, type PositionDetail } from "../portfolio/position-detail";
import type { OptionBasisInput } from "../portfolio/assignment-consequence";
import { deriveCallAssignmentConsequence, derivePutAssignmentConsequence } from "../portfolio/assignment-consequence";
import { lookupDescription } from "../instrument-catalog/catalog";
import { PositionDetailModal } from "./PositionDetailModal";
import "../operator-console/operator-console.css";

export function OperatorConsole() {
  const { source, snapshot, importStatus } = usePortfolio();
  const observations = useObservations();
  const [selectedPosition, setSelectedPosition] = useState<MonitoredPosition | null>(null);

  // Console visualization regime. B is the accepted production design.
  // A and C are retained as development reference but no longer the default.
  const vizRegime = new URLSearchParams(window.location.search).get("viz") || "b";
  // Group by axis (used in regime B)
  const [groupBy, setGroupBy] = useState<"expiration" | "strategy" | "underlying">("expiration");
  // Collapsed groups (by label key) for regime B
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  if (!snapshot) {
    return (
      <div className="oc-shell">
        <div className="oc-empty">
          <p>No portfolio data available.</p>
        </div>
      </div>
    );
  }

  const positions = deriveMonitoredPositions(snapshot, observations);
  const rungs = groupByExpiration(positions);
  const totalCapital = rungs.reduce((sum, r) => sum + r.totalCapital, 0);

  // Spot history for sparklines — real data for Fidelity, synthetic for Demo
  const isDemoSource = source === "demo";
  const underlyings = useMemo(() => [...new Set(positions.map(p => p.underlying))].sort(), [positions]);
  const spotHistory = useSpotHistory(underlyings, !isDemoSource, observations.generation);

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

  return (
    <div className={`oc-shell ${vizRegime !== "c" ? "oc-light" : ""}`}>
      <div className="oc-body">
        <div className="oc-main">
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
                  onClick={() => downloadPositionsCsv(positions, snapshot)}
                >
                  Download CSV
                </button>
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
                        <PositionTable positions={group.positions} onTileClick={setSelectedPosition} totalCapital={group.totalCapital} isDemoSource={isDemoSource} spotHistory={spotHistory} snapshot={snapshot} />
                      )}
                    </div>
                  );
                })
              ) : (
                rungs.map((rung) => (
                  <ExpirationRungRow key={rung.expiration} rung={rung} totalCapital={totalCapital} onTileClick={setSelectedPosition} vizRegime={vizRegime} isDemoSource={isDemoSource} spotHistory={spotHistory} snapshot={snapshot} />
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
        />
      )}
    </div>
  );
}

// --- Expiration Rung ---

function ExpirationRungRow({ rung, totalCapital, onTileClick, vizRegime, isDemoSource, spotHistory, snapshot }: { rung: ExpirationRung; totalCapital: number; onTileClick: (p: MonitoredPosition) => void; vizRegime: string; isDemoSource: boolean; spotHistory: SpotHistoryMap; snapshot: import("../write-desk/types").PortfolioSnapshot }) {
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
        <PositionTable positions={rung.positions} onTileClick={onTileClick} totalCapital={rung.totalCapital} isDemoSource={isDemoSource} spotHistory={spotHistory} snapshot={snapshot} />
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
 * Includes the same columns rendered in the table: Type, Symbol, Strike, Spot, Contracts,
 * Moneyness, Capital, Premium Booked, Bonus If Called Away, If Assigned.
 */
function downloadPositionsCsv(
  positions: MonitoredPosition[],
  snapshot: import("../write-desk/types").PortfolioSnapshot,
) {
  const header = "Type,Symbol,Strike,Expiration,Spot,Contracts,Moneyness,Capital,Premium Booked,Bonus If Called Away,If Assigned";
  const rows = positions.map(position => {
    const type = position.type === "put" ? "PUT" : position.type === "buy-write" ? "BW" : "CALL";
    const spot = position.underlyingPrice != null ? position.underlyingPrice.toFixed(2) : "";
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

    return `${type},${position.underlying},${position.strike},${position.expiration},${spot},${position.quantity},${moneyness},${capital},${premium},${calledAway},"${assigned}"`;
  });

  const csv = [header, ...rows].join("\n");
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

/** Regime B: Column header row */
function PositionTableHeader() {
  return (
    <div className="oc-row-header" role="row" aria-label="Column headers">
      <span className="oc-row-header-cell">Type</span>
      <span className="oc-row-header-cell">Symbol</span>
      <span className="oc-row-header-cell">Strike</span>
      <span className="oc-row-header-cell">Spot</span>
      <span className="oc-row-header-cell oc-row-header-center">Contracts</span>
      <span className="oc-row-header-cell">Moneyness</span>
      <span className="oc-row-header-cell oc-row-header-right">Capital</span>
      <span className="oc-row-header-cell oc-row-header-right">Premium Booked</span>
      <span className="oc-row-header-cell oc-row-header-right">Bonus If Called Away</span>
      <span className="oc-row-header-cell oc-row-header-right">If Assigned</span>
    </div>
  );
}

/** Regime B: Dense fixed-geometry rows — Fidelity-inspired density */
function PositionTable({ positions, onTileClick, totalCapital, isDemoSource, spotHistory, snapshot }: { positions: MonitoredPosition[]; onTileClick: (p: MonitoredPosition) => void; totalCapital: number; isDemoSource: boolean; spotHistory: SpotHistoryMap; snapshot: import("../write-desk/types").PortfolioSnapshot }) {
  return (
    <div className="oc-rung-table">
      {positions.map((position) => {
        const mState = classifyMoneyness(position);
        const mDisplay = formatMoneynessDisplay(position);
        const colorClass = moneynessColor(position.type, mState);
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
          const realSpotSeries = spotHistory.get(position.underlying);
          if (realSpotSeries && realSpotSeries.length >= 3) {
            moneynessPoints = deriveMoneynessHistory(
              realSpotSeries.map(obs => obs.price),
              position.strike,
              position.type,
            );
          }
        }

        // Consequence columns (strategy-specific)
        const premiumCell = derivePremiumBookedCell(position, snapshot);
        const calledAwayCell = deriveCalledAwayCell(position, snapshot);
        const assignedCell = deriveAssignedCell(position, snapshot);

        return (
          <div key={position.id} className={`oc-row oc-row-${position.type}`} onClick={() => onTileClick(position)}>
            <span className="oc-row-badge">{badge}</span>
            <span className="oc-row-symbol">{position.underlying}</span>
            <span className="oc-row-strike">${position.strike}</span>
            <span className="oc-row-spot">{position.underlyingPrice != null ? `$${position.underlyingPrice.toFixed(2)}` : "—"}</span>
            <span className="oc-row-contracts">{position.quantity}</span>
            <span className="oc-row-moneyness-compound">
              <MoneynessCellV4 points={moneynessPoints} type={position.type} currentMoneyness={position.moneyness} mDisplay={mDisplay} colorClass={colorClass} />
            </span>
            <span className="oc-row-capital">{position.encumberedCapital != null ? `$${position.encumberedCapital.toLocaleString()}` : "—"}</span>
            <span className={`oc-row-premium ${premiumCell.className}`} title={premiumCell.title}>{premiumCell.display}</span>
            <span className={`oc-row-called-away ${calledAwayCell.className}`} title={calledAwayCell.title}>{calledAwayCell.display}</span>
            <span className={`oc-row-assigned ${assignedCell.className}`} title={assignedCell.title}>{assignedCell.display}</span>
          </div>
        );
      })}
      <RungTotalsRow positions={positions} snapshot={snapshot} />
    </div>
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

  return (
    <div className="oc-row-totals">
      <span className="oc-row-totals-label">Total</span>
      <span style={{ textAlign: "right" }}>${capitalTotal.toLocaleString()}</span>
      <span className="oc-col-premium" style={{ textAlign: "right" }}>
        {premiumCount > 0 ? `+$${premiumTotal.toLocaleString()}` : "—"}
      </span>
      <span className={calledAwayClass} style={{ textAlign: "right" }} title={isPartial ? `${calledAwaySuppressed} position(s) excluded — basis not proven call-specific` : ""}>
        {calledAwayDisplay}
      </span>
      <span />
    </div>
  );
}

// --- Position Tile ---

import { classifyMoneyness, formatMoneynessDisplay } from "../operator-console/moneyness-presentation";
import { moneynessColor, type MoneynessColorClass } from "../operator-console/moneyness-color";
import { generateDemoSpotHistory, deriveMoneynessHistory, type MoneynessPoint } from "../operator-console/moneyness-history";

/**
 * MoneynessCellV4 — compound cell: compact numeric + 90px semantic sparkline.
 * V4 visual grammar: chart-dominant, segmented trace, moderate regions, strong zero.
 */
function MoneynessCellV4({ points, type, currentMoneyness, mDisplay, colorClass }: {
  points: MoneynessPoint[];
  type: import("../portfolio/position-monitoring").PositionType;
  currentMoneyness: number | null;
  mDisplay: string | null;
  colorClass: MoneynessColorClass;
}) {
  const textColorMap: Record<MoneynessColorClass, string> = {
    favorable: "#15803d",
    ambiguous: "#a16207",
    unfavorable: "#b91c1c",
    neutral: "#374151",
  };
  const textColor = textColorMap[colorClass];

  // No history or no moneyness → just show numeric
  if (points.length < 3 || currentMoneyness == null) {
    return (
      <span className={`oc-tile-mc-${colorClass}`} style={{ fontSize: "10px", fontWeight: 700 }}>
        {mDisplay ?? "—"}
      </span>
    );
  }

  const SPARK_W = 90;
  const SPARK_H = 16;
  const PAD = 1;
  const plotH = SPARK_H - PAD * 2;
  const maxAbs = Math.max(...points.map(p => Math.abs(p.moneyness)), 0.005);
  const zeroY = PAD + plotH / 2;

  const sYScale = (m: number) => PAD + plotH / 2 - (m / maxAbs) * (plotH / 2);
  const sXPos = (i: number) => PAD + (i / (points.length - 1)) * (SPARK_W - PAD * 2);

  // Region colors (intent-aware)
  const regionOpacity = 0.08;
  const itmRegionColor = type === "put"
    ? `rgba(220, 38, 38, ${regionOpacity})`
    : type === "buy-write"
      ? `rgba(22, 163, 74, ${regionOpacity})`
      : `rgba(107, 114, 128, ${regionOpacity * 0.5})`;
  const otmRegionColor = type === "put"
    ? `rgba(22, 163, 74, ${regionOpacity})`
    : type === "buy-write"
      ? `rgba(220, 38, 38, ${regionOpacity})`
      : `rgba(107, 114, 128, ${regionOpacity * 0.5})`;

  // Segmented trace
  const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = sXPos(i);
    const y1 = sYScale(points[i].moneyness);
    const x2 = sXPos(i + 1);
    const y2 = sYScale(points[i + 1].moneyness);
    const midM = (points[i].moneyness + points[i + 1].moneyness) / 2;
    const isAboveZero = midM > 0;
    let color: string;
    if (type === "put") {
      color = isAboveZero ? "#dc2626" : "#16a34a";
    } else if (type === "buy-write") {
      color = isAboveZero ? "#16a34a" : "#dc2626";
    } else {
      color = "#6b7280";
    }
    segments.push({ x1, y1, x2, y2, color });
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
      <span style={{ fontSize: "9px", fontWeight: 700, color: textColor, whiteSpace: "nowrap" }}>
        {mDisplay}
      </span>
      <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} style={{ display: "block", flexShrink: 0 }}>
        <rect x={0} y={0} width={SPARK_W} height={zeroY} fill={itmRegionColor} />
        <rect x={0} y={zeroY} width={SPARK_W} height={SPARK_H - zeroY} fill={otmRegionColor} />
        <line x1={PAD} y1={zeroY} x2={SPARK_W - PAD} y2={zeroY} stroke="#6b7280" strokeWidth="0.8" />
        {segments.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth="1.3" strokeLinecap="round" />
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
  const mState = classifyMoneyness(position);
  const mDisplay = formatMoneynessDisplay(position);
  const colorClass = moneynessColor(position.type, mState);

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

      {/* Moneyness — intent-aware color */}
      {mDisplay && (
        <span className="oc-tile-field oc-tile-field-moneyness">
          <span className="oc-tile-label">Moneyness</span>
          <span className={`oc-tile-value oc-tile-moneyness oc-tile-mc-${colorClass}`}>{mDisplay}</span>
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
  source: import("../write-desk/types").PortfolioSourceType,
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
