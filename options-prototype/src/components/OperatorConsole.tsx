/**
 * Operator Console — Wheelwright Home Surface (ADR-012)
 *
 * Primary monitoring and orientation surface.
 * Renders encumbered capital distributed over time via expiration-native DTE ladder.
 *
 * Contract State only (ADR-013 dimension 1).
 * No Decision Pressure, Economic Consequence, or situation interpretation.
 */

import { useRef, useState, useLayoutEffect, useCallback } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { usePortfolio } from "../portfolio/use-portfolio";
import { useObservations } from "../evidence/use-observations";
import { deriveMonitoredPositions, groupByExpiration, type ExpirationRung, type MonitoredPosition } from "../portfolio/position-monitoring";
import { deriveCapacitySummary, type CapacitySummary } from "../portfolio/capacity-summary";
import { deriveNearestConsequenceSummary, type NearestConsequenceSummary } from "../portfolio/consequence-summary";
import { buildPositionDetail, type PositionDetail } from "../portfolio/position-detail";
import type { OptionBasisInput } from "../portfolio/assignment-consequence";
import { PositionDetailModal } from "./PositionDetailModal";
import "../operator-console/operator-console.css";

export function OperatorConsole() {
  const { source, snapshot, importStatus } = usePortfolio();
  const observations = useObservations();
  const [selectedPosition, setSelectedPosition] = useState<MonitoredPosition | null>(null);

  if (!snapshot) {
    return (
      <div className="oc-shell">
        <div className="oc-context-bar">
          <span className="oc-source">{source === "fidelity" ? "Fidelity — no data loaded" : "Demo"}</span>
        </div>
        <div className="oc-empty">
          <p>No portfolio data available.</p>
        </div>
      </div>
    );
  }

  const positions = deriveMonitoredPositions(snapshot, observations);
  const rungs = groupByExpiration(positions);
  const totalCapital = rungs.reduce((sum, r) => sum + r.totalCapital, 0);
  const capacity = deriveCapacitySummary(positions, rungs, snapshot);
  const consequenceSummary = deriveNearestConsequenceSummary(rungs, snapshot);

  return (
    <div className="oc-shell">
      {/* Surface context bar — portfolio source and summary */}
      <div className="oc-context-bar">
        <span className="oc-source">{source === "demo" ? "Demo Portfolio" : "Fidelity Snapshot"}</span>
        <span className="oc-summary">
          {positions.length} positions · ${totalCapital.toLocaleString()} encumbered
        </span>
      </div>

      <div className="oc-body">
        {/* Sidebar region — portfolio capacity facts */}
        <aside className="oc-region-sidebar">
          <CapacitySidebar capacity={capacity} />
          {consequenceSummary && <ConsequenceSidebar summary={consequenceSummary} />}
        </aside>

        <div className="oc-main">
          {/* Upper region — reserved for mission/NAV */}
          <div className="oc-region-upper">
            <div className="oc-upper-placeholder">Mission / NAV region</div>
          </div>

          {/* Position Monitoring — actual ladder */}
          <div className="oc-region-ladder">
            <div className="oc-ladder">
              {rungs.map((rung) => (
                <ExpirationRungRow key={rung.expiration} rung={rung} totalCapital={totalCapital} onTileClick={setSelectedPosition} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom region — reserved */}
      <footer className="oc-region-footer">
        <div className="oc-footer-placeholder">Status region</div>
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

// --- Capacity Sidebar ---

/** Maximum symbols shown inline before "+N more" truncation */
const MAX_CALL_CAPACITY_SYMBOLS = 3;

function CapacitySidebar({ capacity }: { capacity: CapacitySummary }) {
  const [callLotsExpanded, setCallLotsExpanded] = useState(false);

  return (
    <div className="oc-capacity">
      {/* Put Obligations */}
      <div className="oc-cap-section">
        <span className="oc-cap-label">Put Obligations</span>
        <span className="oc-cap-value">${capacity.putObligations.toLocaleString()}</span>
        <span className="oc-cap-basis">
          {capacity.putPositionCount} position{capacity.putPositionCount !== 1 ? "s" : ""} · strike-based
        </span>
      </div>

      {/* Deployable Cash */}
      <div className="oc-cap-section">
        <span className="oc-cap-label">Deployable Cash</span>
        {capacity.deployableCash != null ? (
          <>
            <span className="oc-cap-value">${capacity.deployableCash.toLocaleString()}</span>
            <span className="oc-cap-basis">residual put-writing headroom</span>
          </>
        ) : (
          <span className="oc-cap-unavailable">No balances imported</span>
        )}
      </div>

      {/* Covered Equity */}
      <div className="oc-cap-section">
        <span className="oc-cap-label">Covered Equity</span>
        {capacity.callPositionCount > 0 ? (
          <>
            <span className="oc-cap-value">${capacity.coveredEquity.toLocaleString()}</span>
            <span className="oc-cap-basis">
              {capacity.callPositionCount} position{capacity.callPositionCount !== 1 ? "s" : ""} · at import
            </span>
          </>
        ) : (
          <span className="oc-cap-unavailable">No covered calls</span>
        )}
        {capacity.callsWithoutValuation > 0 && (
          <span className="oc-cap-warning">
            {capacity.callsWithoutValuation} call{capacity.callsWithoutValuation !== 1 ? "s" : ""} without valuation
          </span>
        )}
      </div>

      {/* Nearest Rung */}
      {capacity.nearestRung && (
        <div className="oc-cap-section oc-cap-section-bordered">
          <span className="oc-cap-label">
            Nearest Rung · {formatExpiration(capacity.nearestRung.expiration)} · {capacity.nearestRung.dte} DTE
          </span>
          {capacity.nearestRung.putExposure > 0 && (
            <span className="oc-cap-detail">Puts: ${capacity.nearestRung.putExposure.toLocaleString()}</span>
          )}
          {capacity.nearestRung.callExposure > 0 && (
            <span className="oc-cap-detail">Calls: ${capacity.nearestRung.callExposure.toLocaleString()}</span>
          )}
          <span className="oc-cap-basis">
            {capacity.nearestRung.positionCount} position{capacity.nearestRung.positionCount !== 1 ? "s" : ""} resolving
          </span>
        </div>
      )}

      {/* Call-Writing Capacity */}
      <div className="oc-cap-section oc-cap-section-bordered">
        <span className="oc-cap-label">Free Call Lots</span>
        {capacity.callCapacity.length > 0 ? (
          <>
            <span className="oc-cap-value">{capacity.totalFreeLots} lot{capacity.totalFreeLots !== 1 ? "s" : ""}</span>
            <div className="oc-cap-symbols">
              {(callLotsExpanded ? capacity.callCapacity : capacity.callCapacity.slice(0, MAX_CALL_CAPACITY_SYMBOLS)).map(entry => (
                <span key={entry.symbol} className="oc-cap-symbol-entry">
                  {entry.symbol} · {entry.additionalLots} lot{entry.additionalLots !== 1 ? "s" : ""}
                </span>
              ))}
              {capacity.callCapacity.length > MAX_CALL_CAPACITY_SYMBOLS && (
                <button
                  className="oc-cap-more"
                  onClick={() => setCallLotsExpanded(!callLotsExpanded)}
                  aria-expanded={callLotsExpanded}
                >
                  {callLotsExpanded
                    ? "Show less"
                    : `+${capacity.callCapacity.length - MAX_CALL_CAPACITY_SYMBOLS} more`}
                </button>
              )}
            </div>
          </>
        ) : (
          <span className="oc-cap-unavailable">No free capacity</span>
        )}
      </div>

      {/* Provenance */}
      {capacity.snapshotDate && (
        <div className="oc-cap-provenance">
          as of {formatExpiration(capacity.snapshotDate)}
        </div>
      )}
    </div>
  );
}

// --- Consequence Sidebar ---

function ConsequenceSidebar({ summary }: { summary: NearestConsequenceSummary }) {
  return (
    <div className="oc-consequence">
      <div className="oc-cq-header">
        <span className="oc-cap-label">Nearest Consequence</span>
        <span className="oc-cq-rung">{formatExpiration(summary.expiration)} · {summary.dte} DTE</span>
      </div>

      {/* Calls */}
      {summary.calls && (
        <div className="oc-cq-group">
          <span className="oc-cq-group-label">Calls</span>
          {summary.calls.totalAppreciation > 0 && (
            <div className="oc-cq-line">
              <span className="oc-cq-fact-label">Appreciation</span>
              <span className="oc-cq-value oc-cq-positive">+${summary.calls.totalAppreciation.toLocaleString()}</span>
            </div>
          )}
          {summary.calls.totalErosion > 0 && (
            <div className="oc-cq-line">
              <span className="oc-cq-fact-label">Erosion</span>
              <span className="oc-cq-value oc-cq-negative">-${summary.calls.totalErosion.toLocaleString()}</span>
            </div>
          )}
          {summary.calls.totalPremium > 0 && (
            <div className="oc-cq-line">
              <span className="oc-cq-fact-label">Premium</span>
              <span className="oc-cq-value oc-cq-premium">+${summary.calls.totalPremium.toLocaleString()}</span>
            </div>
          )}
          {summary.calls.indeterminateCount > 0 && (
            <span className="oc-cq-indeterminate">{summary.calls.indeterminateCount} without basis</span>
          )}
        </div>
      )}

      {/* Puts */}
      {summary.puts && (
        <div className="oc-cq-group">
          <span className="oc-cq-group-label">Puts</span>
          <div className="oc-cq-line">
            <span className="oc-cq-fact-label">Cash → equity</span>
            <span className="oc-cq-value">${summary.puts.totalCashToEquity.toLocaleString()}</span>
          </div>
          {summary.puts.totalPremium > 0 && (
            <div className="oc-cq-line">
              <span className="oc-cq-fact-label">Premium</span>
              <span className="oc-cq-value oc-cq-premium">+${summary.puts.totalPremium.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Expiration Rung ---

function ExpirationRungRow({ rung, totalCapital, onTileClick }: { rung: ExpirationRung; totalCapital: number; onTileClick: (p: MonitoredPosition) => void }) {
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
      <TreemapRung positions={rung.positions} onTileClick={onTileClick} />
    </div>
  );
}

// --- Treemap Rung (d3-hierarchy packing) ---

/**
 * Minimum tile height for readable content (badge + symbol + detail line + padding).
 * Minimum tile width estimate — used to compute how many rows are needed.
 * A higher MIN_TILE_WIDTH means fewer tiles per row → more rows → taller rung.
 */
const MIN_TILE_HEIGHT = 90;
const MIN_TILE_WIDTH = 200;

/**
 * Compute rung height from position count and container width.
 * Ensures every tile gets at least MIN_TILE_HEIGHT pixels by
 * estimating how many rows the treemap will produce.
 */
function computeRungHeight(positionCount: number, containerWidth: number): number {
  if (positionCount === 0 || containerWidth === 0) return 60;
  const tilesPerRow = Math.max(1, Math.floor(containerWidth / MIN_TILE_WIDTH));
  const rows = Math.ceil(positionCount / tilesPerRow);
  return Math.max(80, rows * MIN_TILE_HEIGHT);
}

interface TreemapNode {
  position: MonitoredPosition;
  value: number;
}

function TreemapRung({ positions, onTileClick }: { positions: MonitoredPosition[]; onTileClick: (p: MonitoredPosition) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const measure = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      if (w !== width) setWidth(w);
    }
  }, [width]);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const rungHeight = computeRungHeight(positions.length, width);
  const nodes = width > 0 ? computeTreemapLayout(positions, width, rungHeight) : [];

  return (
    <div
      ref={containerRef}
      className="oc-rung-treemap"
      style={{ height: rungHeight, position: "relative" }}
    >
      {nodes.map((node) => (
        <PositionTile key={node.position.id} node={node} onClick={() => onTileClick(node.position)} />
      ))}
    </div>
  );
}

interface LayoutNode {
  position: MonitoredPosition;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function computeTreemapLayout(
  positions: MonitoredPosition[],
  containerWidth: number,
  containerHeight: number
): LayoutNode[] {
  // --- Value compression ---
  // Raw capital values can span 36:1 ratios, causing the squarified algorithm
  // to produce slivers for mid-range tiles squeezed between giants.
  // sqrt compression narrows this to ~6:1 while preserving ordering.
  // No minimum area enforcement needed — container is sized for content.

  // Raw values
  const rawValues = positions.map((p) =>
    p.encumberedCapital != null && p.encumberedCapital > 0 ? p.encumberedCapital : 1
  );

  // Compress: sqrt preserves ordering, narrows range
  const compressedValues = rawValues.map((v) => Math.sqrt(v));

  // Build a flat hierarchy: root → children (one per position)
  const children: TreemapNode[] = positions.map((p, i) => ({
    position: p,
    value: compressedValues[i],
  }));

  const root = hierarchy<{ children: TreemapNode[] } | TreemapNode>({ children })
    .sum((d) => ("value" in d ? d.value : 0));

  const layout = treemap<{ children: TreemapNode[] } | TreemapNode>()
    .size([containerWidth, containerHeight])
    .tile(treemapSquarify)
    .padding(2)
    .round(true);

  layout(root);

  return (root.leaves() as unknown as Array<{ data: TreemapNode; x0: number; y0: number; x1: number; y1: number }>).map(
    (leaf) => ({
      position: leaf.data.position,
      x0: leaf.x0,
      y0: leaf.y0,
      x1: leaf.x1,
      y1: leaf.y1,
    })
  );
}

// --- Position Tile ---

import { classifyMoneyness, formatMoneynessDisplay } from "../operator-console/moneyness-presentation";

function PositionTile({ node, onClick }: { node: LayoutNode; onClick: () => void }) {
  const { position, x0, y0, x1, y1 } = node;
  const w = x1 - x0;
  const h = y1 - y0;
  const mState = classifyMoneyness(position);
  const mDisplay = formatMoneynessDisplay(position);

  const style: React.CSSProperties = {
    position: "absolute",
    left: x0,
    top: y0,
    width: w,
    height: h,
    boxSizing: "border-box",
  };

  // All tiles use vertical stacked layout — one data point per line.
  // Font size scales with tile area to use available space proportionally.
  const area = w * h;
  const fontSize = area > 40000 ? 14 : area > 20000 ? 12 : area > 8000 ? 10 : 9;

  return (
    <div
      className={`oc-tile oc-tile-${position.type} oc-tile-state-${mState}`}
      style={{ ...style, fontSize, cursor: "pointer" }}
      onClick={onClick}
    >
      <span className="oc-tile-badge">{position.type === "put" ? "PUT" : "CALL"}</span>
      <span className="oc-tile-symbol">{position.underlying}</span>
      <span className="oc-tile-strike">${position.strike}</span>
      {position.encumberedCapital != null && (
        <span className="oc-tile-capital">${(position.encumberedCapital / 1000).toFixed(1)}K</span>
      )}
      {mDisplay && <span className="oc-tile-moneyness">{mDisplay}</span>}
      {position.quantity > 1 && (
        <span className="oc-tile-qty">×{position.quantity}</span>
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

  if (position.type === "call") {
    const match = snapshot.existingCalls.find(
      c => c.underlying.toUpperCase() === position.underlying.toUpperCase()
        && c.strike === position.strike
        && c.expiration === position.expiration
    );
    if (match) {
      optionBasis = { brokerOptionBasis: match.brokerOptionBasis, brokerOptionAverageCost: match.brokerOptionAverageCost };
    }
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

  return buildPositionDetail(position, inventory, snapshot.balanceContext, optionBasis);
}

function formatExpiration(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
