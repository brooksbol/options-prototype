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
import { deriveMonitoredPositions, groupByExpiration, type ExpirationRung, type MonitoredPosition } from "../portfolio/position-monitoring";
import { navigateTo } from "../router";
import "../operator-console/operator-console.css";

export function OperatorConsole() {
  const { source, snapshot, importStatus } = usePortfolio();

  if (!snapshot) {
    return (
      <div className="oc-shell">
        <header className="oc-region-header">
          <h1 className="oc-title">Wheelwright</h1>
          <span className="oc-source">{source === "fidelity" ? "Fidelity — no data loaded" : "Demo"}</span>
          <button className="oc-nav-link" onClick={() => navigateTo("/app/write")}>Recommendations →</button>
        </header>
        <div className="oc-empty">
          <p>No portfolio data available.</p>
        </div>
      </div>
    );
  }

  const positions = deriveMonitoredPositions(snapshot);
  const rungs = groupByExpiration(positions);
  const totalCapital = rungs.reduce((sum, r) => sum + r.totalCapital, 0);

  return (
    <div className="oc-shell">
      {/* Header region — application/operator context */}
      <header className="oc-region-header">
        <h1 className="oc-title">Wheelwright</h1>
        <span className="oc-source">{source === "demo" ? "Demo Portfolio" : "Fidelity Snapshot"}</span>
        <span className="oc-summary">
          {positions.length} positions · ${totalCapital.toLocaleString()} encumbered
        </span>
        <div className="oc-header-reserved">Context region</div>
        <button className="oc-nav-link" onClick={() => navigateTo("/app/write")}>Recommendations →</button>
      </header>

      <div className="oc-body">
        {/* Sidebar region — portfolio-level facts */}
        <aside className="oc-region-sidebar">
          <div className="oc-sidebar-placeholder">Portfolio summary</div>
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
                <ExpirationRungRow key={rung.expiration} rung={rung} totalCapital={totalCapital} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom region — reserved */}
      <footer className="oc-region-footer">
        <div className="oc-footer-placeholder">Status region</div>
      </footer>
    </div>
  );
}

// --- Expiration Rung ---

function ExpirationRungRow({ rung, totalCapital }: { rung: ExpirationRung; totalCapital: number }) {
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
      <TreemapRung positions={rung.positions} />
    </div>
  );
}

// --- Treemap Rung (d3-hierarchy packing) ---

/** Fixed rung content height — preserves current vertical budget. */
const RUNG_CONTENT_HEIGHT = 120;

interface TreemapNode {
  position: MonitoredPosition;
  value: number;
}

function TreemapRung({ positions }: { positions: MonitoredPosition[] }) {
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

  // Build treemap layout when we have a measured width
  const nodes = width > 0 ? computeTreemapLayout(positions, width, RUNG_CONTENT_HEIGHT) : [];

  return (
    <div
      ref={containerRef}
      className="oc-rung-treemap"
      style={{ height: RUNG_CONTENT_HEIGHT, position: "relative" }}
    >
      {nodes.map((node) => (
        <PositionTile key={node.position.id} node={node} />
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
  const containerArea = containerWidth * containerHeight;

  // --- Value compression + minimum enforcement ---
  // Raw capital values can span 36:1 ratios, causing the squarified algorithm
  // to produce slivers for mid-range tiles squeezed between giants.
  // Strategy: compress via sqrt to narrow the ratio while preserving ordering,
  // then clamp to a minimum that guarantees readable geometry.
  //
  // sqrt(109200) / sqrt(3000) ≈ 6:1 vs raw 36:1
  // This preserves perceptual ranking without producing extreme slivers.
  const MIN_TILE_AREA = 2500;

  // Raw values
  const rawValues = positions.map((p) =>
    p.encumberedCapital != null && p.encumberedCapital > 0 ? p.encumberedCapital : 1
  );

  // Compress: sqrt preserves ordering, narrows range
  const compressedValues = rawValues.map((v) => Math.sqrt(v));

  // Compute minimum compressed value to guarantee MIN_TILE_AREA
  const compressedTotal = compressedValues.reduce((s, v) => s + v, 0);
  let minVal = (MIN_TILE_AREA / containerArea) * compressedTotal;
  let clampedValues = compressedValues.map((v) => Math.max(v, minVal));
  let clampedTotal = clampedValues.reduce((s, v) => s + v, 0);
  // Second pass refines
  minVal = (MIN_TILE_AREA / containerArea) * clampedTotal;
  clampedValues = compressedValues.map((v) => Math.max(v, minVal));

  // Build a flat hierarchy: root → children (one per position)
  const children: TreemapNode[] = positions.map((p, i) => ({
    position: p,
    value: clampedValues[i],
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

/**
 * Demo visual state assignment.
 * Deterministic based on position id hash — exercises green/yellow/red
 * at realistic proportions. NOT a domain model concern.
 * Will be replaced by actual Position Monitoring semantics later.
 */
type VisualState = "green" | "yellow" | "red";

function assignDemoVisualState(position: MonitoredPosition): VisualState {
  // Simple deterministic hash from position id
  let hash = 0;
  for (let i = 0; i < position.id.length; i++) {
    hash = ((hash << 5) - hash + position.id.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 10;
  // ~50% green, ~30% yellow, ~20% red
  if (bucket < 5) return "green";
  if (bucket < 8) return "yellow";
  return "red";
}

function PositionTile({ node }: { node: LayoutNode }) {
  const { position, x0, y0, x1, y1 } = node;
  const w = x1 - x0;
  const h = y1 - y0;
  const visualState = assignDemoVisualState(position);

  const style: React.CSSProperties = {
    position: "absolute",
    left: x0,
    top: y0,
    width: w,
    height: h,
    boxSizing: "border-box",
  };

  // Progressive disclosure tiers.
  // Principle: prefer compact reformatting before omission, never clip.
  // Background carries put/call; border carries state; area carries capital magnitude.
  // Text carries identity and numeric detail.
  const tier = getTileTier(w, h);

  return (
    <div
      className={`oc-tile oc-tile-${position.type} oc-tile-state-${visualState} oc-tile-tier-${tier}`}
      style={style}
    >
      {tier === "large" && (
        <>
          <span className="oc-tile-badge">{position.type === "put" ? "P" : "C"}</span>
          <span className="oc-tile-symbol">{position.underlying}</span>
          <span className="oc-tile-strike">${position.strike}</span>
          {position.encumberedCapital != null && (
            <span className="oc-tile-capital">${(position.encumberedCapital / 1000).toFixed(1)}K</span>
          )}
          {position.quantity > 1 && (
            <span className="oc-tile-qty">×{position.quantity}</span>
          )}
        </>
      )}
      {tier === "compact" && (
        <>
          <span className="oc-tile-symbol">{position.underlying}</span>
          <span className="oc-tile-compact-detail">
            ${position.strike}
            {position.encumberedCapital != null && <> · ${(position.encumberedCapital / 1000).toFixed(1)}K</>}
          </span>
        </>
      )}
      {tier === "small" && (
        <span className="oc-tile-symbol">{position.underlying}</span>
      )}
      {tier === "tiny" && (
        <span className="oc-tile-symbol oc-tile-symbol-tiny">{position.underlying}</span>
      )}
      {/* micro: no text — background/border carry all meaning */}
    </div>
  );
}

type TileTier = "large" | "compact" | "small" | "tiny" | "micro";

function getTileTier(w: number, h: number): TileTier {
  // Large: wide enough for full horizontal row
  if (w >= 110 && h >= 32) return "large";
  // Compact: enough height for two stacked lines, moderate width for short text
  if (w >= 38 && h >= 34) return "compact";
  // Small: enough for a single centered symbol
  if (w >= 36 && h >= 20) return "small";
  // Tiny: barely legible symbol
  if (w >= 26 && h >= 14) return "tiny";
  // Micro: too small for text
  return "micro";
}

// --- Helpers ---

function formatExpiration(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
