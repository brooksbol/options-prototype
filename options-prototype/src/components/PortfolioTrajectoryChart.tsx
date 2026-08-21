/**
 * Portfolio Trajectory Chart — persistent header visualization.
 *
 * Renders observed Portfolio Capital history as a compact area chart
 * in the application shell header using visx primitives.
 *
 * Design principles:
 *   - Shows only truthful observed data (no interpolation, no inference)
 *   - Single observation renders as a point, not a manufactured line
 *   - Multiple observations render as connected segments with area fill
 *   - Line segments connect observations directly (linear, not smoothed)
 *     because smooth curves would imply knowledge between discrete observations
 *   - Y-axis auto-scales to data range with padding
 *   - Time-range control: All Time (default), 1Y, 6M, 3M, 1M — sticky
 *   - Reserve visual territory for future A/E line (not populated)
 *
 * Uses visx for: scales, path generation, area fill, responsive sizing.
 * Wheelwright owns: data semantics, time-range behavior, observation provenance.
 *
 * See: docs/journal/project-journal.md — "Portfolio Capital Trajectory Discovery"
 */

import { useState, useMemo, useCallback } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleTime, scaleLinear } from "@visx/scale";
import { LinePath, AreaClosed } from "@visx/shape";
import { curveLinear } from "@visx/curve";
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

const CHART_HEIGHT = 32;
const MARGIN = { top: 4, right: 2, bottom: 2, left: 2 };
const POINT_RADIUS = 2.5;

const TIME_RANGES: { value: TimeRange; label: string }[] = [
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

  // Current live Portfolio Capital (rightmost point = shell headline)
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

  // Build data points: filtered history + current live value as rightmost
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

  // No data — empty state
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
      <div className="pt-chart-container">
        <ParentSize debounceTime={100}>
          {({ width }) => (
            <ChartSvg dataPoints={dataPoints} width={width} height={CHART_HEIGHT} />
          )}
        </ParentSize>
      </div>
    </div>
  );
}

// --- SVG Chart (visx) ---

interface ChartSvgProps {
  dataPoints: PortfolioCapitalObservation[];
  width: number;
  height: number;
}

function ChartSvg({ dataPoints, width, height }: ChartSvgProps) {
  if (width < 10) return null;

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // Scales
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
    const padding = (max - min) * 0.1 || max * 0.02 || 1000;
    return scaleLinear({
      domain: [min - padding, max + padding],
      range: [innerHeight, 0],
    });
  }, [dataPoints, innerHeight]);

  // Single point: render as a dot
  if (dataPoints.length === 1) {
    const p = dataPoints[0];
    const cx = MARGIN.left + (innerWidth / 2);
    const cy = MARGIN.top + (innerHeight / 2);

    return (
      <svg width={width} height={height} aria-label={`Portfolio Capital: $${formatValue(p.value)}`}>
        <circle cx={cx} cy={cy} r={POINT_RADIUS} className="pt-point pt-point-current" />
      </svg>
    );
  }

  // x/y accessors for visx shapes
  const x = (d: PortfolioCapitalObservation) => timeScale(getDate(d)) ?? 0;
  const y = (d: PortfolioCapitalObservation) => valueScale(getValue(d)) ?? 0;

  const lastPoint = dataPoints[dataPoints.length - 1];

  return (
    <svg
      width={width}
      height={height}
      aria-label={`Portfolio Capital trajectory: ${dataPoints.length} observations, current $${formatValue(lastPoint.value)}`}
    >
      <defs>
        <linearGradient id="pt-area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--wd-text-secondary)" stopOpacity={0.08} />
          <stop offset="100%" stopColor="var(--wd-text-secondary)" stopOpacity={0.01} />
        </linearGradient>
      </defs>

      <Group left={MARGIN.left} top={MARGIN.top}>
        {/* Area fill underneath the line */}
        <AreaClosed
          data={dataPoints}
          x={x}
          y={y}
          yScale={valueScale}
          curve={curveLinear}
          fill="url(#pt-area-gradient)"
        />

        {/* Line connecting observations */}
        <LinePath
          data={dataPoints}
          x={x}
          y={y}
          curve={curveLinear}
          className="pt-line"
        />

        {/* Observation dots */}
        {dataPoints.map((p, i) => {
          const isCurrent = i === dataPoints.length - 1;
          return (
            <circle
              key={p.timestamp}
              cx={x(p)}
              cy={y(p)}
              r={isCurrent ? POINT_RADIUS : 1.5}
              className={`pt-point ${isCurrent ? "pt-point-current" : ""}`}
            />
          );
        })}
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
