/**
 * Portfolio Trajectory Chart — persistent header instrument.
 *
 * Layout: chart on left, capital context + range selector on right.
 * The right panel contains the capital-state triad, period change,
 * and time-range selector — all arranged to fill the space evenly.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleTime, scaleLinear } from "@visx/scale";
import { LinePath, AreaClosed } from "@visx/shape";
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
import type { ShellCapitalContext } from "../portfolio/shell-capital-context";
import type { TierReadiness } from "../hooks/useOpeningReadiness";
import "./portfolio-trajectory.css";

// --- Constants ---

const CHART_HEIGHT = 64;
const MARGIN = { top: 4, right: 4, bottom: 4, left: 40 };

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

// --- Props ---

interface PortfolioTrajectoryChartProps {
  capitalContext: ShellCapitalContext | null;
  tierReadiness: TierReadiness | null;
  tierError: boolean;
  sessionState: string;
}

// --- Component ---

export function PortfolioTrajectoryChart({ capitalContext, tierReadiness, tierError, sessionState }: PortfolioTrajectoryChartProps) {
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

  // Period change computation
  const periodChange = useMemo(() => {
    if (dataPoints.length < 2) return null;
    const openVal = dataPoints[0].value;
    const closeVal = dataPoints[dataPoints.length - 1].value;
    const change = closeVal - openVal;
    const pct = openVal !== 0 ? (change / openVal) * 100 : 0;
    return { change, pct, isPositive: change >= 0 };
  }, [dataPoints]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    saveTimeRange(range);
  }, []);

  // Moving average data (shared between chart and tooltip)
  const movingAvgDataForTooltip = useMemo(() => {
    if (dataPoints.length < 2) return [];
    const window = getMovingAverageWindow(dataPoints.length);
    return computeMovingAverage(dataPoints, window);
  }, [dataPoints]);

  return (
    <div className="pt-region">
      {/* Left: chart plot */}
      <div className="pt-plot-area">
        {dataPoints.length === 0 ? (
          <div className="pt-empty">
            <span className="pt-empty-label">Trajectory appears after first Fidelity import</span>
          </div>
        ) : (
          <ParentSize debounceTime={80}>
            {({ width }) =>
              width > 10 ? (
                <ChartWithTooltip dataPoints={dataPoints} movingAvgData={movingAvgDataForTooltip} width={width} height={76} />
              ) : null
            }
          </ParentSize>
        )}
      </div>

      {/* Right: capital context + period change + range selector */}
      <div className="pt-context-panel">
        {/* Range selector — immediately right of chart */}
        <div className="pt-range">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              className={`pt-range-btn ${timeRange === value ? "pt-range-active" : ""}`}
              onClick={() => handleRangeChange(value)}
              aria-pressed={timeRange === value}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Capital state triad + Evidence + Session — one row */}
        {capitalContext && (
          <div className="pt-capital-facts">
            {capitalContext.portfolioCapital != null && (
              <div className="pt-fact">
                <span className="pt-fact-label">Portfolio Capital</span>
                <span className="pt-fact-value">${formatCompact(capitalContext.portfolioCapital)}</span>
                {periodChange && (
                  <span className={`pt-fact-change ${periodChange.isPositive ? "pt-positive" : "pt-negative"}`}>
                    {periodChange.isPositive ? "+" : ""}{periodChange.pct.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
            <div className="pt-fact">
              <span className="pt-fact-label">Deployable</span>
              <span className="pt-fact-value">
                {capitalContext.deployableCash != null ? `$${formatCompact(capitalContext.deployableCash)}` : "—"}
              </span>
            </div>
            <div className="pt-fact">
              <span className="pt-fact-label">Encumbered</span>
              <span className="pt-fact-value">${formatCompact(capitalContext.encumberedCapital)}</span>
            </div>
            <div className="pt-fact">
              <span className="pt-fact-label">Evidence</span>
              <span className="pt-fact-value pt-fact-secondary">
                {formatTierStatus(tierReadiness, sessionState)}
              </span>
            </div>
            <div className="pt-fact">
              <span className="pt-fact-label">Session</span>
              <span className="pt-fact-value pt-fact-secondary">
                <span className={`pt-session-pip pt-session-${sessionState.toLowerCase()}`} />
                {formatSessionState(sessionState)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SVG Chart ---

interface ChartSvgProps {
  dataPoints: PortfolioCapitalObservation[];
  movingAvgData: PortfolioCapitalObservation[];
  width: number;
  height: number;
}

function ChartWithTooltip({ dataPoints, movingAvgData, width, height }: ChartSvgProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const padding = range > 0 ? range * 0.08 : max * 0.02 || 1000;
    return scaleLinear({
      domain: [min - padding, max + padding],
      range: [innerHeight, 0],
    });
  }, [dataPoints, innerHeight]);

  const refLines = useMemo(() => {
    const values = dataPoints.map(getValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const step = range < 10_000 ? 1000 : 5000;
    const lower = Math.floor(min / step) * step;
    const upper = Math.ceil(max / step) * step;

    // Opening value (rounded to nearest $1K for display consistency)
    const openVal = Math.round(dataPoints[0].value / 1000) * 1000;

    // Collect rounded grid lines, excluding any too close to the opening value
    const gridLines: number[] = [];
    for (let v = lower; v <= upper; v += step) {
      if (Math.abs(v - openVal) >= step * 0.3) {
        gridLines.push(v);
      }
    }

    // Take at most 2 grid lines (bottom and top of those remaining)
    const picked = gridLines.length <= 2 ? gridLines : [gridLines[0], gridLines[gridLines.length - 1]];

    // Always include the opening value
    const result = [...picked, openVal];
    result.sort((a, b) => a - b);
    return result;
  }, [dataPoints]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || dataPoints.length < 2) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - MARGIN.left;

      let nearest = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < dataPoints.length; i++) {
        const px = timeScale(getDate(dataPoints[i])) ?? 0;
        const dist = Math.abs(px - mouseX);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      setHoverIndex(nearest);
    },
    [dataPoints, timeScale],
  );

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  if (dataPoints.length === 1) {
    const cx = MARGIN.left + innerWidth / 2;
    const cy = MARGIN.top + innerHeight / 2;
    return (
      <div ref={containerRef} style={{ position: "relative", width, height }}>
        <svg width={width} height={height} className="pt-svg">
          <circle cx={cx} cy={cy} r={3} className="pt-current-dot" />
        </svg>
      </div>
    );
  }

  const x = (d: PortfolioCapitalObservation) => timeScale(getDate(d)) ?? 0;
  const y = (d: PortfolioCapitalObservation) => valueScale(getValue(d)) ?? 0;

  const lastPoint = dataPoints[dataPoints.length - 1];
  const lastX = x(lastPoint);
  const lastY = y(lastPoint);

  const openingValue = dataPoints[0].value;
  const openingY = valueScale(openingValue) ?? 0;

  const hoveredPoint = hoverIndex != null ? dataPoints[hoverIndex] : null;
  const hoveredMA = hoverIndex != null ? movingAvgData[hoverIndex] ?? null : null;
  const hoveredX = hoveredPoint ? MARGIN.left + x(hoveredPoint) : 0;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width, height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={width} height={height} className="pt-svg">
        <defs>
          <clipPath id="pt-clip-above">
            <rect x={0} y={0} width={innerWidth} height={openingY} />
          </clipPath>
          <clipPath id="pt-clip-below">
            <rect x={0} y={openingY} width={innerWidth} height={innerHeight - openingY} />
          </clipPath>
        </defs>

        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Reference lines */}
          {refLines.map((value) => {
            const yPos = valueScale(value) ?? 0;
            return (
              <g key={value}>
                <line x1={0} x2={innerWidth} y1={yPos} y2={yPos} className="pt-ref-line" />
                <text x={-6} y={yPos + 3} className="pt-ref-label" textAnchor="end">
                  ${formatCompact(value)}
                </text>
              </g>
            );
          })}

          {/* Opening level */}
          <line x1={0} x2={innerWidth} y1={openingY} y2={openingY} className="pt-opening-line" />

          {/* Green area (above opening) */}
          <AreaClosed
            data={dataPoints}
            x={x}
            y={y}
            yScale={valueScale}
            curve={curveMonotoneX}
            fill="#15803d"
            fillOpacity={0.14}
            clipPath="url(#pt-clip-above)"
          />

          {/* Red area (below opening) */}
          <AreaClosed
            data={dataPoints}
            x={x}
            y={y}
            yScale={valueScale}
            curve={curveMonotoneX}
            fill="#b91c1c"
            fillOpacity={0.14}
            clipPath="url(#pt-clip-below)"
          />

          {/* Main trajectory line */}
          <LinePath data={dataPoints} x={x} y={y} curve={curveMonotoneX} className="pt-capital-line" />

          {/* Moving average */}
          {movingAvgData.length >= 2 && (
            <LinePath
              data={movingAvgData}
              x={x}
              y={(d: PortfolioCapitalObservation) => valueScale(getValue(d)) ?? 0}
              curve={curveMonotoneX}
              className="pt-ma-line"
            />
          )}

          {/* Current point */}
          <circle cx={lastX} cy={lastY} r={3} className="pt-current-dot" />

          {/* Crosshair on hover */}
          {hoveredPoint && (
            <g>
              <line
                x1={x(hoveredPoint)}
                x2={x(hoveredPoint)}
                y1={0}
                y2={innerHeight}
                className="pt-crosshair"
              />
              <circle cx={x(hoveredPoint)} cy={y(hoveredPoint)} r={3} className="pt-crosshair-dot" />
              {hoveredMA && (
                <circle
                  cx={x(hoveredPoint)}
                  cy={valueScale(hoveredMA.value) ?? 0}
                  r={2}
                  className="pt-crosshair-dot-ma"
                />
              )}
            </g>
          )}
        </Group>
      </svg>

      {/* HTML tooltip — positioned outside SVG to avoid clipping */}
      {hoveredPoint && (
        <div
          className="pt-tooltip"
          style={{ left: hoveredX + 8, top: 4 }}
        >
          <span className="pt-tooltip-date">
            {new Date(hoveredPoint.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span className="pt-tooltip-value">${formatCompact(hoveredPoint.value)}</span>
          {hoveredMA && (
            <span className="pt-tooltip-ma">MA ${formatCompact(hoveredMA.value)}</span>
          )}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function formatSessionState(state: string): string {
  switch (state) {
    case "PREMARKET": return "Pre-Market";
    case "REGULAR_OPEN_DELAY": return "Open Delay";
    case "REGULAR_OBSERVATION": return "Regular Session";
    case "DELAY_DRAIN": return "Closing";
    case "CLOSED_CANONICAL": return "Closed";
    case "NON_TRADING_DAY": return "Market Closed";
    default: return state;
  }
}

function formatTierStatus(readiness: TierReadiness | null, sessionState: string): string {
  if (sessionState === "CLOSED_CANONICAL" || sessionState === "NON_TRADING_DAY") {
    return "Sealed";
  }
  if (!readiness) return "—";
  const o = readiness.opening;
  if (!o) return "Ready";
  return `${o.currentCount}/${o.setSize} fresh`;
}

function formatCompact(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function getMovingAverageWindow(pointCount: number): number {
  if (pointCount <= 4) return 2;
  if (pointCount <= 8) return 3;
  if (pointCount <= 15) return 4;
  return 5;
}

function computeMovingAverage(
  data: PortfolioCapitalObservation[],
  window: number,
): PortfolioCapitalObservation[] {
  if (data.length < 2) return [];
  const result: PortfolioCapitalObservation[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    let sum = 0;
    for (let j = start; j <= i; j++) {
      sum += data[j].value;
    }
    result.push({ timestamp: data[i].timestamp, value: sum / (i - start + 1) });
  }
  return result;
}
