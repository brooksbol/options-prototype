/**
 * MarketsGlance — a "Markets" header card fed ONLY by the evidence appliance.
 *
 * Shows real index values (S&P 500 / Nasdaq 100) with the provider's own daily
 * change % + a real intraday sparkline. All data comes from the backend
 * GET /api/markets endpoint, which fetches through the active provider authority
 * (SPX/NDX quote + timesales) — the browser makes NO provider calls. The daily
 * change is the provider's broker-computed figure vs prior close (not reconstructed
 * from our samples), and the sparkline is real intraday bars.
 *
 * Honest emptiness: fields render "—" and the sparkline a flat baseline when the
 * provider has no data (e.g. off-hours) — never fabricated.
 */

import { useEffect, useState } from "react";
import { todayGlDirection } from "./today-gl";
import { PriceSparkline } from "./PriceSparkline";
import "./markets-glance.css";

interface IndexRow {
  symbol: string;
  label: string;
  last: number | null;
  change: number | null;
  changePercent: number | null;
  prevClose: number | null;
  observedAt: string | null;
  intraday: number[];
}

interface MarketsPayload {
  generatedAt: string;
  indices: IndexRow[];
}

const POLL_MS = 60_000;

function fmtSignedPct(v: number | null): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}${Math.abs(v).toFixed(2)}%`;
}

function fmtSignedMoney(v: number | null): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtValue(v: number | null): string {
  return v != null ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
}

export function MarketsGlance() {
  const [data, setData] = useState<MarketsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/markets");
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as MarketsPayload;
        if (!cancelled) setData(json);
      } catch {
        // Network error — keep the last good payload rather than clearing.
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const indices = data?.indices ?? [];
  if (indices.length === 0) return null;

  return (
    <div className="mg-card" aria-label="Markets">
      <div className="mg-title">Markets</div>
      <div className="mg-row">
        {indices.map((idx) => {
          const dir = todayGlDirection(idx.change);
          return (
            <div key={idx.symbol} className="mg-item">
              <div className="mg-label">{idx.label}</div>
              <div className="mg-price">{fmtValue(idx.last)}</div>
              <div className={`mg-change mg-${dir}`}>
                {idx.change != null ? `${fmtSignedMoney(idx.change)} (${fmtSignedPct(idx.changePercent)})` : "—"}
              </div>
              <PriceSparkline prices={idx.intraday} direction={dir} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
