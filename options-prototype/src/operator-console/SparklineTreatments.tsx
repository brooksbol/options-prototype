/**
 * Sparkline Treatment Gallery — 8 materially different visualization approaches.
 *
 * Each treatment is a distinct information-design hypothesis for communicating
 * moneyness history within a dense Console row. They share identical data
 * and approximately the same spatial budget.
 *
 * Treatments:
 *   A: Neutral trace + prominent zero line
 *   B: Trace segmented by contract state (red below zero, green above)
 *   C: Neutral trace over shaded OTM/ITM regions
 *   D: Semantic trace (full line colored by intent-aware position logic) + zero line
 *   E: Filled area from zero line (distance-from-strike emphasis)
 *   F: Endpoint-emphasized (dot at current value, trace faded)
 *   G: Combined cell — numeric moneyness + sparkline in one compound element
 *   H: Gradient trace — intensity increases toward current time (recency emphasis)
 */

import type { MoneynessPoint } from "./moneyness-history";
import type { PositionType } from "../portfolio/position-monitoring";
import { moneynessColor, type MoneynessColorClass } from "./moneyness-color";

// --- Shared geometry ---

const W = 80;
const H = 18;
const PAD = 1;

function yScale(moneyness: number, maxAbs: number): number {
  return PAD + (H - PAD * 2) / 2 - (moneyness / maxAbs) * ((H - PAD * 2) / 2);
}

function xPos(i: number, total: number): number {
  return PAD + (i / (total - 1)) * (W - PAD * 2);
}

function computeMaxAbs(points: MoneynessPoint[]): number {
  return Math.max(...points.map(p => Math.abs(p.moneyness)), 0.005);
}

function buildPath(points: MoneynessPoint[], maxAbs: number): string {
  return points.map((p, i) => `${xPos(i, points.length).toFixed(1)},${yScale(p.moneyness, maxAbs).toFixed(1)}`).join(" ");
}

// --- Shared props ---

interface TreatmentProps {
  points: MoneynessPoint[];
  type: PositionType;
  currentMoneyness: number;
}

// ═══════════════════════════════════════════════════════════════
// Treatment A: Neutral trace + prominent zero line
// Hypothesis: The zero-line alone provides enough reference.
// ═══════════════════════════════════════════════════════════════

export function TreatmentA({ points }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#c0c0c0" strokeWidth="0.5" strokeDasharray="2 1.5" />
      <polyline points={buildPath(points, maxAbs)} fill="none" stroke="#374151" strokeWidth="1.2" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment B: Trace segmented by contract state
// Hypothesis: Color each segment by whether that portion is ITM or OTM.
// Green above zero (ITM), red below (OTM) — relative to the contract.
// ═══════════════════════════════════════════════════════════════

export function TreatmentB({ points, type }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);

  // Build line segments colored by position
  const segments: { path: string; color: string }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = xPos(i, points.length);
    const y1 = yScale(points[i].moneyness, maxAbs);
    const x2 = xPos(i + 1, points.length);
    const y2 = yScale(points[i + 1].moneyness, maxAbs);
    // Use midpoint moneyness to determine segment color
    const midM = (points[i].moneyness + points[i + 1].moneyness) / 2;
    // For the segmented view: ITM (positive moneyness) = favorable region, OTM = unfavorable
    // But respect intent: for puts, ITM means assignment approaching (unfavorable)
    // For calls/BW in this raw view, just use positional: above zero = green, below = red
    const isAboveZero = midM > 0;
    let color: string;
    if (type === "put") {
      color = isAboveZero ? "#dc2626" : "#16a34a"; // put ITM = red (unfavorable), OTM = green
    } else if (type === "buy-write") {
      color = isAboveZero ? "#16a34a" : "#dc2626"; // BW ITM = green (completing), OTM = red
    } else {
      color = "#6b7280"; // call intent unknown → neutral
    }
    segments.push({ path: `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, color });
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#d1d5db" strokeWidth="0.5" />
      {segments.map((seg, i) => (
        <polyline key={i} points={seg.path} fill="none" stroke={seg.color} strokeWidth="1.2" />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment C: Neutral trace over shaded OTM/ITM regions
// Hypothesis: Background shading provides context without coloring the trace.
// ═══════════════════════════════════════════════════════════════

export function TreatmentC({ points, type }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);

  // Determine which region is "favorable" based on position type
  const itmColor = type === "put" ? "rgba(220, 38, 38, 0.06)" : type === "buy-write" ? "rgba(22, 163, 74, 0.08)" : "rgba(107, 114, 128, 0.04)";
  const otmColor = type === "put" ? "rgba(22, 163, 74, 0.06)" : type === "buy-write" ? "rgba(220, 38, 38, 0.06)" : "rgba(107, 114, 128, 0.04)";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* ITM region (above zero) */}
      <rect x={0} y={0} width={W} height={zeroY} fill={itmColor} />
      {/* OTM region (below zero) */}
      <rect x={0} y={zeroY} width={W} height={H - zeroY} fill={otmColor} />
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#9ca3af" strokeWidth="0.5" />
      <polyline points={buildPath(points, maxAbs)} fill="none" stroke="#1f2937" strokeWidth="1.2" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment D: Full semantic trace + zero line
// Hypothesis: Entire trace colored by intent-aware position logic.
// Uses the same moneynessColor function as the numeric value.
// ═══════════════════════════════════════════════════════════════

export function TreatmentD({ points, type, currentMoneyness }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);

  // Determine overall semantic color from current state (same as numeric moneyness)
  const state = currentMoneyness > 0.01 ? "itm" : currentMoneyness < -0.01 ? "otm" : "atm";
  const colorClass = moneynessColor(type, state);
  const colorMap: Record<MoneynessColorClass, string> = {
    favorable: "#15803d",
    ambiguous: "#a16207",
    unfavorable: "#b91c1c",
    neutral: "#374151",
  };
  const traceColor = colorMap[colorClass];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2 1.5" />
      <polyline points={buildPath(points, maxAbs)} fill="none" stroke={traceColor} strokeWidth="1.3" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment E: Filled area from zero line (distance-from-strike)
// Hypothesis: Area fill emphasizes magnitude of distance, not just direction.
// ═══════════════════════════════════════════════════════════════

export function TreatmentE({ points, type }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);

  // Build closed polygon: trace points + baseline at zero
  const traceCoords = points.map((p, i) => `${xPos(i, points.length).toFixed(1)},${yScale(p.moneyness, maxAbs).toFixed(1)}`);
  const lastX = xPos(points.length - 1, points.length);
  const firstX = xPos(0, points.length);
  const areaPath = traceCoords.join(" ") + ` ${lastX.toFixed(1)},${zeroY.toFixed(1)} ${firstX.toFixed(1)},${zeroY.toFixed(1)}`;

  // Color based on position type intent
  const fillColor = type === "put" ? "rgba(22, 163, 74, 0.12)" : type === "buy-write" ? "rgba(37, 99, 235, 0.10)" : "rgba(107, 114, 128, 0.08)";
  const strokeColor = type === "put" ? "#16a34a" : type === "buy-write" ? "#2563eb" : "#6b7280";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#d1d5db" strokeWidth="0.5" />
      <polygon points={areaPath} fill={fillColor} stroke="none" />
      <polyline points={buildPath(points, maxAbs)} fill="none" stroke={strokeColor} strokeWidth="1" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment F: Endpoint-emphasized (current value dot, trace faded)
// Hypothesis: The current state matters most; history provides context at reduced weight.
// ═══════════════════════════════════════════════════════════════

export function TreatmentF({ points, type, currentMoneyness }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);
  const endX = xPos(points.length - 1, points.length);
  const endY = yScale(points[points.length - 1].moneyness, maxAbs);

  // Endpoint color: use intent-aware semantic
  const state = currentMoneyness > 0.01 ? "itm" : currentMoneyness < -0.01 ? "otm" : "atm";
  const colorClass = moneynessColor(type, state);
  const dotColorMap: Record<MoneynessColorClass, string> = {
    favorable: "#15803d",
    ambiguous: "#a16207",
    unfavorable: "#b91c1c",
    neutral: "#374151",
  };

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#e5e7eb" strokeWidth="0.5" />
      <polyline points={buildPath(points, maxAbs)} fill="none" stroke="#9ca3af" strokeWidth="0.8" opacity="0.5" />
      <circle cx={endX} cy={endY} r="2.5" fill={dotColorMap[colorClass]} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment G: Combined cell — numeric moneyness + sparkline
// Hypothesis: Spatial locality matters. Show the number and history together.
// ═══════════════════════════════════════════════════════════════

export function TreatmentG({ points, type, currentMoneyness }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);

  // Format numeric moneyness
  const state = currentMoneyness > 0.01 ? "itm" : currentMoneyness < -0.01 ? "otm" : "atm";
  const label = state === "itm" ? "ITM" : state === "otm" ? "OTM" : "ATM";
  const pct = (currentMoneyness * 100).toFixed(1);
  const sign = currentMoneyness >= 0 ? "+" : "";

  const colorClass = moneynessColor(type, state);
  const textColorMap: Record<MoneynessColorClass, string> = {
    favorable: "#15803d",
    ambiguous: "#a16207",
    unfavorable: "#b91c1c",
    neutral: "#374151",
  };
  const textColor = textColorMap[colorClass];

  const sparkW = 50;
  const sparkPath = points.map((p, i) =>
    `${PAD + (i / (points.length - 1)) * (sparkW - PAD * 2)},${yScale(p.moneyness, maxAbs).toFixed(1)}`
  ).join(" ");
  const sparkZeroY = yScale(0, maxAbs);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, color: textColor, whiteSpace: "nowrap", minWidth: "52px" }}>
        {label} {sign}{pct}%
      </span>
      <svg width={sparkW} height={H} viewBox={`0 0 ${sparkW} ${H}`}>
        <line x1={PAD} y1={sparkZeroY} x2={sparkW - PAD} y2={sparkZeroY} stroke="#d1d5db" strokeWidth="0.5" />
        <polyline points={sparkPath} fill="none" stroke="#374151" strokeWidth="1" />
      </svg>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment H: Gradient trace — recency emphasis
// Hypothesis: Recent history matters more. Fade older observations.
// ═══════════════════════════════════════════════════════════════

let gradientId = 0;

export function TreatmentH({ points }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);
  const zeroY = yScale(0, maxAbs);
  const id = `spark-grad-${++gradientId}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#374151" stopOpacity="0.15" />
          <stop offset="70%" stopColor="#374151" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#374151" stopOpacity="1" />
        </linearGradient>
      </defs>
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2 1.5" />
      <polyline points={buildPath(points, maxAbs)} fill="none" stroke={`url(#${id})`} strokeWidth="1.3" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatment BCG: Hybrid — Segmented color + shaded regions + combined cell
// Hypothesis: Combine locality (G), spatial context (C), and state-colored
// trajectory (B) into one compact instrument that answers four questions:
//   1. Where am I now? (numeric moneyness)
//   2. Where have I been? (trajectory shape)
//   3. Which side of the strike? (shaded regions)
//   4. When did I cross? (color transition in the trace)
// ═══════════════════════════════════════════════════════════════

export function TreatmentBCG({ points, type, currentMoneyness }: TreatmentProps) {
  if (points.length < 3) return <span>—</span>;
  const maxAbs = computeMaxAbs(points);

  // --- Numeric moneyness (from G) ---
  const state = currentMoneyness > 0.01 ? "itm" : currentMoneyness < -0.01 ? "otm" : "atm";
  const label = state === "itm" ? "ITM" : state === "otm" ? "OTM" : "ATM";
  const pct = (currentMoneyness * 100).toFixed(1);
  const sign = currentMoneyness >= 0 ? "+" : "";

  const colorClass = moneynessColor(type, state);
  const textColorMap: Record<MoneynessColorClass, string> = {
    favorable: "#15803d",
    ambiguous: "#a16207",
    unfavorable: "#b91c1c",
    neutral: "#374151",
  };
  const textColor = textColorMap[colorClass];

  // --- Sparkline geometry ---
  const sparkW = 56;
  const sparkH = H;
  const sPad = 1;
  const sPlotH = sparkH - sPad * 2;
  const sZeroY = sPad + sPlotH / 2;

  const sYScale = (m: number) => sPad + sPlotH / 2 - (m / maxAbs) * (sPlotH / 2);
  const sXPos = (i: number) => sPad + (i / (points.length - 1)) * (sparkW - sPad * 2);

  // --- Shaded regions (from C) — intent-aware ---
  const itmRegionColor = type === "put"
    ? "rgba(220, 38, 38, 0.05)"
    : type === "buy-write"
      ? "rgba(22, 163, 74, 0.07)"
      : "rgba(107, 114, 128, 0.03)";
  const otmRegionColor = type === "put"
    ? "rgba(22, 163, 74, 0.05)"
    : type === "buy-write"
      ? "rgba(220, 38, 38, 0.05)"
      : "rgba(107, 114, 128, 0.03)";

  // --- Segmented trace (from B) — colored per contract state ---
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
      <span style={{ fontSize: "10px", fontWeight: 700, color: textColor, whiteSpace: "nowrap", minWidth: "50px" }}>
        {label} {sign}{pct}%
      </span>
      <svg width={sparkW} height={sparkH} viewBox={`0 0 ${sparkW} ${sparkH}`} style={{ display: "block" }}>
        {/* Shaded ITM/OTM regions */}
        <rect x={0} y={0} width={sparkW} height={sZeroY} fill={itmRegionColor} />
        <rect x={0} y={sZeroY} width={sparkW} height={sparkH - sZeroY} fill={otmRegionColor} />
        {/* Zero/strike boundary */}
        <line x1={sPad} y1={sZeroY} x2={sparkW - sPad} y2={sZeroY} stroke="#9ca3af" strokeWidth="0.5" />
        {/* Segmented trace */}
        {segments.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth="1.3" strokeLinecap="round" />
        ))}
      </svg>
    </span>
  );
}


// ═══════════════════════════════════════════════════════════════
// BCG Hierarchy Variants — same composition, different signal weights
// ═══════════════════════════════════════════════════════════════

// --- Shared BCG internals ---

function bcgInternals(points: MoneynessPoint[], type: PositionType, currentMoneyness: number, opts: {
  traceWidth: number;
  regionOpacity: number;
  zeroLineWeight: number;
  zeroLineDash: string;
  zeroLineColor: string;
  numericSize: string;
  numericWeight: number;
  sparkW: number;
}) {
  const maxAbs = computeMaxAbs(points);

  const state = currentMoneyness > 0.01 ? "itm" : currentMoneyness < -0.01 ? "otm" : "atm";
  const label = state === "itm" ? "ITM" : state === "otm" ? "OTM" : "ATM";
  const pct = (currentMoneyness * 100).toFixed(1);
  const sign = currentMoneyness >= 0 ? "+" : "";

  const colorClass = moneynessColor(type, state);
  const textColorMap: Record<MoneynessColorClass, string> = {
    favorable: "#15803d",
    ambiguous: "#a16207",
    unfavorable: "#b91c1c",
    neutral: "#374151",
  };
  const textColor = textColorMap[colorClass];

  const { sparkW, regionOpacity, traceWidth, zeroLineWeight, zeroLineDash, zeroLineColor } = opts;
  const sparkH = H;
  const sPad = 1;
  const sPlotH = sparkH - sPad * 2;
  const sZeroY = sPad + sPlotH / 2;

  const sYScale = (m: number) => sPad + sPlotH / 2 - (m / maxAbs) * (sPlotH / 2);
  const sXPos = (i: number) => sPad + (i / (points.length - 1)) * (sparkW - sPad * 2);

  const ro = regionOpacity;
  const itmRegionColor = type === "put"
    ? `rgba(220, 38, 38, ${ro})`
    : type === "buy-write"
      ? `rgba(22, 163, 74, ${ro})`
      : `rgba(107, 114, 128, ${ro * 0.5})`;
  const otmRegionColor = type === "put"
    ? `rgba(22, 163, 74, ${ro})`
    : type === "buy-write"
      ? `rgba(220, 38, 38, ${ro})`
      : `rgba(107, 114, 128, ${ro * 0.5})`;

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

  return { label, sign, pct, textColor, sparkW, sparkH, sZeroY, itmRegionColor, otmRegionColor, segments, zeroLineWeight, zeroLineDash, zeroLineColor, traceWidth, numericSize: opts.numericSize, numericWeight: opts.numericWeight, sPad };
}

function RenderBCGVariant(props: TreatmentProps & { opts: Parameters<typeof bcgInternals>[3] }) {
  const { points, type, currentMoneyness, opts } = props;
  if (points.length < 3) return <span>—</span>;
  const b = bcgInternals(points, type, currentMoneyness, opts);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
      <span style={{ fontSize: b.numericSize, fontWeight: b.numericWeight, color: b.textColor, whiteSpace: "nowrap", minWidth: "50px" }}>
        {b.label} {b.sign}{b.pct}%
      </span>
      <svg width={b.sparkW} height={b.sparkH} viewBox={`0 0 ${b.sparkW} ${b.sparkH}`} style={{ display: "block" }}>
        <rect x={0} y={0} width={b.sparkW} height={b.sZeroY} fill={b.itmRegionColor} />
        <rect x={0} y={b.sZeroY} width={b.sparkW} height={b.sparkH - b.sZeroY} fill={b.otmRegionColor} />
        <line x1={b.sPad} y1={b.sZeroY} x2={b.sparkW - b.sPad} y2={b.sZeroY} stroke={b.zeroLineColor} strokeWidth={b.zeroLineWeight} strokeDasharray={b.zeroLineDash} />
        {b.segments.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth={b.traceWidth} strokeLinecap="round" />
        ))}
      </svg>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// Variant 1: Stronger regions, bolder zero, trace slightly thinner
// Hypothesis: Let the coordinate system dominate. Trace rides on top as secondary.
// ═══════════════════════════════════════════════════════════════

export function TreatmentBCG1(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{
    traceWidth: 1.1,
    regionOpacity: 0.10,
    zeroLineWeight: 1.0,
    zeroLineDash: "",
    zeroLineColor: "#6b7280",
    numericSize: "10px",
    numericWeight: 700,
    sparkW: 56,
  }} />;
}

// ═══════════════════════════════════════════════════════════════
// Variant 2: Bold trace dominates, subtle regions, fine zero
// Hypothesis: The trajectory is the primary signal. Regions are whisper-level context.
// ═══════════════════════════════════════════════════════════════

export function TreatmentBCG2(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{
    traceWidth: 1.8,
    regionOpacity: 0.04,
    zeroLineWeight: 0.5,
    zeroLineDash: "1.5 1.5",
    zeroLineColor: "#9ca3af",
    numericSize: "10px",
    numericWeight: 700,
    sparkW: 56,
  }} />;
}

// ═══════════════════════════════════════════════════════════════
// Variant 3: Larger numeric, reduced sparkline width
// Hypothesis: The number is the primary instrument. Sparkline is compact supporting evidence.
// ═══════════════════════════════════════════════════════════════

export function TreatmentBCG3(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{
    traceWidth: 1.2,
    regionOpacity: 0.07,
    zeroLineWeight: 0.7,
    zeroLineDash: "",
    zeroLineColor: "#9ca3af",
    numericSize: "11px",
    numericWeight: 800,
    sparkW: 44,
  }} />;
}

// ═══════════════════════════════════════════════════════════════
// Variant 4: Wider sparkline, compact numeric, strong zero + moderate regions
// Hypothesis: Give the trajectory more room to breathe. Number is anchor, chart is the story.
// ═══════════════════════════════════════════════════════════════

export function TreatmentBCG4(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{
    traceWidth: 1.3,
    regionOpacity: 0.08,
    zeroLineWeight: 0.8,
    zeroLineDash: "",
    zeroLineColor: "#6b7280",
    numericSize: "9px",
    numericWeight: 700,
    sparkW: 66,
  }} />;
}


// ═══════════════════════════════════════════════════════════════
// Variant 5 (Final synthesis): V2 trace dominance + original compound-cell locality
// Hypothesis: Bold segmented trace is the primary signal. Whisper regions provide
// coordinate context. Number and chart read as one compound cell — the number
// anchors meaning, the trajectory tells the story. Zero line is structural, not loud.
// ═══════════════════════════════════════════════════════════════

export function TreatmentBCG5(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{
    traceWidth: 1.8,
    regionOpacity: 0.04,
    zeroLineWeight: 0.5,
    zeroLineDash: "1.5 1.5",
    zeroLineColor: "#9ca3af",
    numericSize: "10px",
    numericWeight: 700,
    sparkW: 56,
  }} />;
}


// ═══════════════════════════════════════════════════════════════
// V4 Width Variants — same treatment, different chart widths
// Goal: find the width where trajectory becomes legible at a glance
// before additional width stops buying anything.
// ═══════════════════════════════════════════════════════════════

const V4_BASE = {
  traceWidth: 1.3,
  regionOpacity: 0.08,
  zeroLineWeight: 0.8,
  zeroLineDash: "",
  zeroLineColor: "#6b7280",
  numericSize: "9px",
  numericWeight: 700,
};

export function TreatmentV4W66(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{ ...V4_BASE, sparkW: 66 }} />;
}

export function TreatmentV4W90(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{ ...V4_BASE, sparkW: 90 }} />;
}

export function TreatmentV4W120(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{ ...V4_BASE, sparkW: 120 }} />;
}

export function TreatmentV4W150(props: TreatmentProps) {
  return <RenderBCGVariant {...props} opts={{ ...V4_BASE, sparkW: 150 }} />;
}
