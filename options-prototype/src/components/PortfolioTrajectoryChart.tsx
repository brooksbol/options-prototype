/**
 * Portfolio Trajectory Chart — persistent header visualization.
 *
 * Renders observed Portfolio Capital history as an SVG line/point chart
 * in the application shell header. Supports operator-adjustable time range
 * with sticky localStorage persistence.
 *
 * Design principles:
 *   - Shows only truthful observed data (no interpolation, no inference)
 *   - Single observation renders as a point, not a manufactured line
 *   - Multiple observations render as connected line segments
 *   - Observations are marked with dots to distinguish them from interpolation
 *   - Y-axis auto-scales to data range with padding
 *   - Time-range control: All Time (default), 1Y, 6M, 3M, 1M — sticky
 *   - Reserve visual territory for future A/E line (not populated)
 *
 * See: docs/journal/project-journal.md — "Portfolio Capital Trajectory Discovery"
 */

import { useState, useMemo, useCallback } from "react";
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

const CHART_HEIGHT = 32;
const CHART_PADDING_TOP = 4;
const CHART_PADDING_BOTTOM = 2;
const CHART_PADDING_LEFT = 0;
const CHART_PADDING_RIGHT = 0;
const POINT_RADIUS = 2;
const CURRENT_POINT_RADIUS = 2.5;

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

// --- Component ---

export function PortfolioTrajectoryChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>(loadTimeRange);
  const { snapshot } = usePortfolio();

  // Current live Portfolio Capital (the rightmost point must equal the shell headline)
  const currentPC = useMemo(() => {
    if (!snapshot) return null;
    const derivation = derivePortfolioCapital(snapshot);
    return derivation?.portfolioCapital ?? null;
  }, [snapshot]);

  // Load and filter history
  const history = useMemo(() => loadHistory(), [snapshot]);
  const filteredHistory = useMemo(
    () => filterByRange(history, timeRange),
    [history, timeRange],
  );

  // Build the data points for rendering: filtered history + current live value
  const dataPoints = useMemo(() => {
    const points: PortfolioCapitalObservation[] = [...filteredHistory];

    // Ensure the current live value appears as the rightmost point
    // (it may already be in history if the same CSV is loaded, but if the
    // operator hasn't re-imported, the current derivation is the freshest)
    if (currentPC != null) {
      const now = new Date().toISOString();
      const lastHistorical = points[points.length - 1];
      // Only append if there isn't already a very recent observation
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

  // No data at all — show empty state
  if (dataPoints.length === 0) {
    return (
      <div className="pt-chart-region">
        <TimeRangeControl selected={timeRange} onChange={handleRangeChange} />
        <div className="pt-empty">
          <span className="pt-empty-label">Portfolio Capital trajectory will appear after first Fidelity import</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-chart-region">
      <TimeRangeControl selected={timeRange} onChange={handleRangeChange} />
      <ChartSvg dataPoints={dataPoints} />
    </div>
  );
}

// --- SVG Chart ---

interface ChartSvgProps {
  dataPoints: PortfolioCapitalObservation[];
}

function ChartSvg({ dataPoints }: ChartSvgProps) {
  // We need a container width — use 100% via viewBox + preserveAspectRatio
  const viewBoxWidth = 400;
  const plotWidth = viewBoxWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  // Compute scales
  const { xScale, yScale, yMin, yMax } = useMemo(() => {
    const values = dataPoints.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // Add 5% padding to y range (or fixed minimum range if all values are equal)
    const range = maxVal - minVal;
    const padding = range > 0 ? range * 0.05 : maxVal * 0.02 || 1000;
    const yMin = minVal - padding;
    const yMax = maxVal + padding;

    // Time scale
    const timestamps = dataPoints.map((p) => new Date(p.timestamp).getTime());
    const tMin = Math.min(...timestamps);
    const tMax = Math.max(...timestamps);
    const tRange = tMax - tMin;

    const xScale = (timestamp: string): number => {
      if (tRange === 0) return CHART_PADDING_LEFT + plotWidth / 2;
      const t = new Date(timestamp).getTime();
      return CHART_PADDING_LEFT + ((t - tMin) / tRange) * plotWidth;
    };

    const yScale = (value: number): number => {
      if (yMax === yMin) return CHART_PADDING_TOP + plotHeight / 2;
      // SVG y is inverted (0 = top)
      return CHART_PADDING_TOP + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;
    };

    return { xScale, yScale, yMin, yMax };
  }, [dataPoints, plotWidth, plotHeight]);

  // Single point: render as a dot
  if (dataPoints.length === 1) {
    const p = dataPoints[0];
    const cx = xScale(p.timestamp);
    const cy = yScale(p.value);

    return (
      <svg
        className="pt-chart-svg"
        viewBox={`0 0 ${viewBoxWidth} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        aria-label={`Portfolio Capital: $${formatValue(p.value)}`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={CURRENT_POINT_RADIUS}
          className="pt-point pt-point-current"
        />
      </svg>
    );
  }

  // Multiple points: line + dots
  const pathD = dataPoints
    .map((p, i) => {
      const x = xScale(p.timestamp);
      const y = yScale(p.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const lastPoint = dataPoints[dataPoints.length - 1];

  return (
    <svg
      className="pt-chart-svg"
      viewBox={`0 0 ${viewBoxWidth} ${CHART_HEIGHT}`}
      preserveAspectRatio="none"
      aria-label={`Portfolio Capital trajectory: ${dataPoints.length} observations, current $${formatValue(lastPoint.value)}`}
    >
      {/* Line connecting observations */}
      <path d={pathD} className="pt-line" />

      {/* Observation dots */}
      {dataPoints.map((p, i) => {
        const cx = xScale(p.timestamp);
        const cy = yScale(p.value);
        const isCurrent = i === dataPoints.length - 1;
        return (
          <circle
            key={p.timestamp}
            cx={cx}
            cy={cy}
            r={isCurrent ? CURRENT_POINT_RADIUS : POINT_RADIUS}
            className={`pt-point ${isCurrent ? "pt-point-current" : ""}`}
          />
        );
      })}
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
    <div className="pt-range-control">
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

function formatValue(value: number): string {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
