/**
 * Portfolio Trajectory Chart — persistent header instrument.
 *
 * A flat, panoramic visualization showing the current Portfolio Capital fact
 * and its longitudinal shape as one coherent piece of persistent portfolio context.
 *
 * Visual design:
 *   - Wide + shallow rectangle, generous internal breathing room
 *   - Portfolio Capital line: neutral, confident, ~1.5px
 *   - Restrained curve (monotoneX) — feels drawn rather than constructed from sticks
 *   - No area fill (imperceptible at this scale)
 *   - 1–2 faint horizontal reference lines with right-edge values for scale context
 *   - Endpoint annotation (current value) at the rightmost point
 *   - No historical dots at rest — the line carries the history
 *   - Current/rightmost observation: small intentional point
 *   - Range control: horizontal, top-right corner, floating above the plot
 *
 * See: docs/journal/project-journal.md — "Portfolio Capital Trajectory Discovery"
 */

import { useState, useMemo, useCallback } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleTime, scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { Group } from "@visx/group";
import {
  loadHistory,
  filterByRange,
  loadTimeRange,
  saveTimeRange,
  type PortfolioCapitalObservation,
  type TimeRange,
} from "../portfolio/portfolio-capital-history";
import { usePortfolio } from "../portfolio/use-portfolio";
import { derivePortfolioCapital } from "../portfolio/portfolio-capital";
import "./portfolio-trajectory.css";

// --- Constants ---

const CHART_HEIGHT = 56;
const MARGIN = { top: 14, right: 52, bottom: 8, left: 44 };

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

// --- Accessors ---

const getDate = (d: PortfolioCapitalObservation) => new Date(d.timestamp);
const getValue = (d: PortfolioCapitalObservation) => d.value;

// --- Component ---

export function PortfolioTrajectoryChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>(loadTimeRange);
  const { snapshot } = usePortfolio();

  const currentPC = useMemo(() => {
    if (!snapshot) return null;
    const derivation = derivePortfolioCapital(snapshot);
    return derivation?.portfolioCapital ?? null;
  }, [snapshot]);

  const history = useMemo(() => loadHistory(), [snapshot]);
  const filteredHistory = useMemo(
    () => filterByRange(history, timeRange),
    [history, timeRange],
  );

  const dataPoints = useMemo(() => {
    const points: PortfolioCapitalObservation[] = [...filteredHistory];
    if (currentPC != null) {
      const now = new Date().toISOString();
      const lastHistorical = points[points.length - 1];
      if (!lastHistorical || lastHistorical.value !== currentPC) {
        points.push({ timestamp: now, value: currentPC });
      }
    }
    return points;
  }, [filteredHistory, currentPC]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    saveTimeRange(range);
  }, []);

  if (dataPoints.length === 0) {
    return (
      <div className="pt-region">
        <div className="pt-empty">
          <span className="pt-empty-label">Trajectory appears after first Fidelity import</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-region">
      <TimeRangeControl selected={timeRange} onChange={handleRangeChange} />
      <div className="pt-plot-area">
        <ParentSize debounceTime={80}>
          {({ width }) =>
            width > 10 ? (
              <ChartSvg dataPoints={dataPoints} width={width} height={CHART_HEIGHT} />
            ) : null
          }
        </ParentSize>
      </div>
    </div>
  );
}

// --- SVG Chart ---

interface ChartSvgProps {
  dataPoints: PortfolioCapitalObservation[];
  width: number;
  height: number;
}

function ChartSvg({ dataPoints, width, height }: ChartSvgProps) {
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const timeScale = useMemo(
    () =>
      scaleTime({
        domain: [
          Math.min(...dataPoints.map((d) => getDate(d).getTime())),
          Math.max(...dataPoints.map((d) => getDate(d).getTime())),
        ],
        range: [0, innerWidth],
      }),
    [dataPoints, innerWidth],
  );

  const valueScale = useMemo(() => {
    const values = dataPoints.map(getValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    // Generous padding — line floats in the field, doesn't ricochet between edges
    const padding = range > 0 ? range * 0.3 : max * 0.02 || 1000;
    return scaleLinear({
      domain: [min - padding, max + padding],
      range: [innerHeight, 0],
    });
  }, [dataPoints, innerHeight]);

  // Compute 2 reference lines (round to nearest $1K or $5K depending on range)
  const refLines = useMemo(() => {
    const values = dataPoints.map(getValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Choose step: $1K for ranges under $10K, $5K otherwise
    const step = range < 10_000 ? 1000 : 5000;

    const lower = Math.floor(min / step) * step;
    const upper = Math.ceil(max / step) * step;

    // Pick 2 lines that frame the data
    const lines: number[] = [];
    for (let v = lower; v <= upper; v += step) {
      lines.push(v);
    }

    // Keep at most 2: one near bottom, one near top of data range
    if (lines.length <= 2) return lines;
    return [lines[0], lines[lines.length - 1]];
  }, [dataPoints]);

  // Single point
  if (dataPoints.length === 1) {
    const p = dataPoints[0];
    const cx = MARGIN.left + innerWidth / 2;
    const cy = MARGIN.top + innerHeight / 2;

    return (
      <svg width={width} height={height} className="pt-svg">
        <circle cx={cx} cy={cy} r={3} className="pt-current-dot" />
        <text
          x={cx + 8}
          y={cy + 3}
          className="pt-endpoint-label"
        >
          ${formatCompact(p.value)}
        </text>
      </svg>
    );
  }

  const x = (d: PortfolioCapitalObservation) => timeScale(getDate(d)) ?? 0;
  const y = (d: PortfolioCapitalObservation) => valueScale(getValue(d)) ?? 0;

  // Period-specific moving average
  const movingAvgData = useMemo(() => {
    if (dataPoints.length < 3) return [];
    const window = getMovingAverageWindow(dataPoints.length);
    return computeMovingAverage(dataPoints, window);
  }, [dataPoints]);

  const lastPoint = dataPoints[dataPoints.length - 1];
  const lastX = x(lastPoint);
  const lastY = y(lastPoint);

  return (
    <svg width={width} height={height} className="pt-svg">
      <Group left={MARGIN.left} top={MARGIN.top}>
        {/* Faint horizontal reference lines */}
        {refLines.map((value) => {
          const yPos = valueScale(value) ?? 0;
          return (
            <g key={value}>
              <line
                x1={0}
                x2={innerWidth}
                y1={yPos}
                y2={yPos}
                className="pt-ref-line"
              />
              <text
                x={-6}
                y={yPos + 3}
                className="pt-ref-label"
                textAnchor="end"
              >
                ${formatCompact(value)}
              </text>
            </g>
          );
        })}

        {/* Portfolio Capital trajectory */}
        <LinePath
          data={dataPoints}
          x={x}
          y={y}
          curve={curveMonotoneX}
          className="pt-capital-line"
        />

        {/* Moving average — fine smooth dotted line */}
        {movingAvgData.length >= 2 && (
          <LinePath
            data={movingAvgData}
            x={x}
            y={(d: PortfolioCapitalObservation) => valueScale(getValue(d)) ?? 0}
            curve={curveMonotoneX}
            className="pt-ma-line"
          />
        )}

        {/* Current observation endpoint */}
        <circle cx={lastX} cy={lastY} r={3} className="pt-current-dot" />

        {/* Endpoint value annotation */}
        <text
          x={lastX + 7}
          y={lastY + 3}
          className="pt-endpoint-label"
        >
          ${formatCompact(lastPoint.value)}
        </text>
      </Group>
    </svg>
  );
}

// --- Time Range Control ---

interface TimeRangeControlProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

function TimeRangeControl({ selected, onChange }: TimeRangeControlProps) {
  return (
    <div className="pt-range">
      {TIME_RANGES.map(({ value, label }) => (
        <button
          key={value}
          className={`pt-range-btn ${selected === value ? "pt-range-active" : ""}`}
          onClick={() => onChange(value)}
          aria-pressed={selected === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// --- Helpers ---

function formatCompact(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/**
 * Determine moving average window size based on data density.
 * Shorter periods with fewer points get smaller windows.
 */
function getMovingAverageWindow(pointCount: number): number {
  if (pointCount <= 4) return 2;
  if (pointCount <= 8) return 3;
  if (pointCount <= 15) return 4;
  return 5;
}

/**
 * Compute a simple moving average over the observations.
 * Returns observations at the same timestamps but with smoothed values.
 * Points with incomplete windows are excluded (MA starts after window-1 points).
 */
function computeMovingAverage(
  data: PortfolioCapitalObservation[],
  window: number,
): PortfolioCapitalObservation[] {
  if (data.length < window) return [];

  const result: PortfolioCapitalObservation[] = [];
  for (let i = window - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      sum += data[j].value;
    }
    result.push({
      timestamp: data[i].timestamp,
      value: sum / window,
    });
  }
  return result;
}
