/**
 * PriceSparkline — a plain per-symbol price trajectory sparkline.
 *
 * Reuses the strike-agnostic scaling core (buildSparklineScale) and the observation
 * deduplication used elsewhere, but carries NO moneyness/strike/position semantics —
 * it simply plots a price series and colors it by overall up/down direction. Intended
 * for lightweight market-context chips (e.g. the header Markets glance).
 *
 * Evidence-only: the caller passes a price series that came from the evidence
 * appliance. Renders a quiet flat baseline (not a fabricated shape) when there are
 * fewer than two points.
 */

import { buildSparklineScale } from "./sparkline-scale";

interface PriceSparklineProps {
  /** Ordered price series (e.g. intraday bar prices). */
  prices: number[] | undefined | null;
  /** Overall direction for stroke color (from today-gl's todayGlDirection). */
  direction: "up" | "down" | "flat";
  width?: number;
  height?: number;
}

const COLOR: Record<PriceSparklineProps["direction"], string> = {
  up: "#16a34a",
  down: "#dc2626",
  flat: "#6b7280",
};

export function PriceSparkline({ prices: input, direction, width = 96, height = 28 }: PriceSparklineProps) {
  const prices = input ?? [];
  const PAD = 1;

  if (prices.length < 2) {
    // Not enough evidence to draw a trajectory — a quiet flat baseline, no fabrication.
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <line x1={PAD} y1={height / 2} x2={width - PAD} y2={height / 2} stroke="#d7dae0" strokeWidth="1" />
      </svg>
    );
  }

  const scale = buildSparklineScale(prices, PAD, height - PAD);
  const xPos = (i: number) => PAD + (i / (prices.length - 1)) * (width - PAD * 2);
  const d = prices.map((price, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(2)},${scale.yScale(price).toFixed(2)}`).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={d} fill="none" stroke={COLOR[direction]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
