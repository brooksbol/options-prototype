/**
 * market-metrics — per-underlying volatility metrics (tastytrade /market-metrics).
 *
 * INTERIM v1 OBSERVATIONAL evidence for the Deployment surface (CSV + on-screen
 * columns). These values are NEVER inputs to recommendation eligibility, posture,
 * ranking, capital allocation, or execution. The Decision Engine does not read
 * them; they are attached to candidates AFTER recommendation purely for display
 * and export.
 *
 * Measurement-identity discipline (mirrors the backend `MarketMetrics` record):
 *   - `ivRank` is tastytrade's headline rank in the provider's 0..1 scale, carried
 *     VERBATIM. The presentation helpers below convert to 0..100 for display.
 *   - `ivRankSource` is the methodology identifier (e.g. "tos") for the headline.
 *   - `ivRankTos` / `ivRankTw` are the two DISTINCT provider methodologies. They
 *     are never averaged, and one is never substituted for the other.
 *   - `ivPercentile`, `ivIndex` are 0..1 provider measurements.
 *   - `historicalVolatility30`, `ivHv30Difference` are realized-vol context (sparse
 *     across the universe — frequently absent).
 *   - `ivUpdatedAt` is the provider observation time, VERBATIM. Freshness is judged
 *     from this timestamp, never from request success.
 *
 * Absence discipline: every numeric field is `number | null`; absence is `null`,
 * NEVER 0. A provider exact 0 is a legitimate value and is preserved.
 */

export interface MarketMetrics {
  symbol: string;
  ivRank: number | null;
  ivRankSource: string | null;
  ivRankTos: number | null;
  ivRankTw: number | null;
  ivPercentile: number | null;
  ivIndex: number | null;
  historicalVolatility30: number | null;
  ivHv30Difference: number | null;
  ivUpdatedAt: string | null;
}

/** Response shape of GET /api/evidence/market-metrics. */
export interface MarketMetricsResponse {
  status: "ok" | "unavailable";
  metrics: MarketMetrics[];
  missing: string[];
}

/** Coerce a value from the JSON response to `number | null`, preserving exact 0
 * and mapping absence/non-finite to null. */
function toNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function toStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Parse one raw metrics object into a `MarketMetrics` (defensive against shape drift). */
export function parseMarketMetrics(raw: Record<string, unknown>): MarketMetrics {
  return {
    symbol: String(raw.symbol ?? "").toUpperCase(),
    ivRank: toNum(raw.ivRank),
    ivRankSource: toStr(raw.ivRankSource),
    ivRankTos: toNum(raw.ivRankTos),
    ivRankTw: toNum(raw.ivRankTw),
    ivPercentile: toNum(raw.ivPercentile),
    ivIndex: toNum(raw.ivIndex),
    historicalVolatility30: toNum(raw.historicalVolatility30),
    ivHv30Difference: toNum(raw.ivHv30Difference),
    ivUpdatedAt: toStr(raw.ivUpdatedAt),
  };
}

/** Build a symbol → metrics lookup from a response. */
export function indexBySymbol(metrics: MarketMetrics[]): Map<string, MarketMetrics> {
  const map = new Map<string, MarketMetrics>();
  for (const m of metrics) map.set(m.symbol.toUpperCase(), m);
  return map;
}

/**
 * Present a provider 0..1 IV-rank/percentile value on the operator's 0..100 scale.
 * Absence (null) → em dash. A provider exact 0 is a real value and renders "0.0".
 * One decimal place matches the compactness of the surrounding table.
 */
export function presentIvRank(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return (value * 100).toFixed(digits);
}

/** Numeric value for sorting: provider 0..1 scaled to 0..100; null stays null so
 * the sort can order unknowns last. */
export function ivRankSortValue(value: number | null | undefined): number | null {
  return value == null || !Number.isFinite(value) ? null : value * 100;
}

/** CSV cell for a raw 0..1 provider number: emitted VERBATIM (not scaled), exact 0
 * preserved, absence → empty. Keeps the export faithful to the provider. */
export function rawMetricCsvCell(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

/** CSV cell for a provider string (source, timestamp): verbatim, absence → empty. */
export function rawMetricStringCsvCell(value: string | null | undefined): string {
  return typeof value === "string" ? value : "";
}
