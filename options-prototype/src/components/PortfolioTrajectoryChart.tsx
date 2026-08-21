/**
 * Portfolio Trajectory Chart — persistent header instrument.
 *
 * A flat, panoramic visualization showing the current Portfolio Capital fact
 * and its longitudinal shape as one coherent piece of persistent portfolio context.
 *
 * Visual thesis:
 *   - Wide + shallow rectangle (not a card, not a dashboard widget)
 *   - Portfolio Capital line: neutral, confident, ~1.5px, linear between observations
 *   - Subtle area wash beneath the line for visual weight
 *   - No historical dots in resting state — the line carries the history
 *   - Current/rightmost observation: small intentional point
 *   - Time-range control: far right, adjacent to the temporal visualization
 *   - Integrated into the shell chrome, not embedded in it
 *
 * Deferred:
 *   - Appreciation/Erosion line (accounting unresolved; visual territory reserved)
 *   - Mission path / policy envelope
 *   - Hover interaction / historical dot discovery
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

const CHART_HEIGHT = 56;
const MARGIN = { top: 6, right: 8, bottom: 6, left: 8 };

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
      <div className="pt-region">
        <div className="pt-plot-area">
          <div className="pt-empty">
            <span className="pt-empty-label">Trajectory appears after first Fidelity import</span>
          </div>
        </div>
        <TimeRangeControl selected={timeRange} onChange={handleRangeChange} />
      </div>
    );
  }

  return (
    <div className="pt-region">
      <div className="pt-plot-area">
        <ParentSize debounceTime={80}>
          {({ width }) =>
            width > 10 ? (
              <ChartSvg dataPoints={dataPoints} width={width} height={CHART_HEIGHT} />
            ) : null
          }
        </ParentSize>
      </div>
      <TimeRangeControl selected={timeRange} onChange={handleRangeChange} />
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
    const range = max - min;
    const padding = range > 0 ? range * 0.12 : max * 0.02 || 1000;
    return scaleLinear({
      domain: [min - padding, max + padding],
      range: [innerHeight, 0],
    });
  }, [dataPoints, innerHeight]);

  // Single point: just show the current dot centered
  if (dataPoints.length === 1) {
    const cx = MARGIN.left + innerWidth / 2;
    const cy = MARGIN.top + innerHeight / 2;

    return (
      <svg width={width} height={height} className="pt-svg">
        <circle cx={cx} cy={cy} r={3} className="pt-current-dot" />
      </svg>
    );
  }

  // x/y accessors
  const x = (d: PortfolioCapitalObservation) => timeScale(getDate(d)) ?? 0;
  const y = (d: PortfolioCapitalObservation) => valueScale(getValue(d)) ?? 0;

  // Current point position
  const lastPoint = dataPoints[dataPoints.length - 1];
  const lastX = x(lastPoint);
  const lastY = y(lastPoint);

  return (
    <svg width={width} height={height} className="pt-svg">
      <defs>
        <linearGradient id="pt-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--wd-text-primary)" stopOpacity={0.06} />
          <stop offset="100%" stopColor="var(--wd-text-primary)" stopOpacity={0.0} />
        </linearGradient>
      </defs>

      <Group left={MARGIN.left} top={MARGIN.top}>
        {/* Area fill — subtle weight beneath the line */}
        <AreaClosed
          data={dataPoints}
          x={x}
          y={y}
          yScale={valueScale}
          curve={curveLinear}
          fill="url(#pt-fill)"
        />

        {/* Portfolio Capital line — neutral, confident, structural */}
        <LinePath
          data={dataPoints}
          x={x}
          y={y}
          curve={curveLinear}
          className="pt-capital-line"
        />

        {/* Current observation — the only visible dot at rest */}
        <circle cx={lastX} cy={lastY} r={3} className="pt-current-dot" />
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
