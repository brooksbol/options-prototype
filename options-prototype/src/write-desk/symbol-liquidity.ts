/**
 * Observed Symbol Options Liquidity — v1 display-only experiment (PL-EVID-OBS).
 *
 * Question: can Wheelwright use its existing market evidence to distinguish
 * broadly liquid options markets from markets offering only isolated pockets
 * of liquidity? Extended (Oct 29, 2026) with operator filters so the same
 * observations can be narrowed to a strategy-relevant population (e.g. the
 * TT1 38–45 DTE short put spread screen).
 *
 * SCOPE: one row per symbol, computed from the published evidence snapshot
 * (the same `symbols[]` the Deployment page already ingests). No acquisition,
 * no backend change, no influence on posture, ranking, Production v0 or any
 * recommendation. Measures are provisional and observational; there is NO
 * composite liquidity score and no trade selection.
 *
 * ONE CALCULATION PATH: the table and its CSV both consume the rows built here
 * for the active filter; neither re-derives any measure.
 *
 * DENOMINATORS ARE EXPLICIT. Distinct states:
 *   - listed expirations in DTE range (backend `expirations[]`)
 *   - observed chains                 (published `chains[]` for those expirations)
 *   - admissible chains               (backend `admissibility.admissible === true`)
 *   - not-admissible / no-verdict     (excluded, never assumed current)
 *   - contracts of the selected type(s) from admissible chains:
 *       · unbanded        delta missing/zero → cannot be placed in the band; excluded, reported
 *       · in band (|Δ| within the selected band):
 *           · quoted       bid > 0, ask ≥ bid, finite     → graded, spread measured
 *           · zero-bid     bid ≤ 0, ask finite            → measured, NOT liquid, no spread
 *           · invalid      non-finite or ask < bid        → excluded, reported
 *
 * Freshness: the backend admissibility verdict is authoritative. No frontend
 * freshness threshold exists here.
 */

import { gradeLiquidity } from "./liquidity-grade";
import { provenanceFromPublished } from "./evidence-provenance";

/** Provisional constants — independent of recommendation policy by design. */
export const SYMBOL_LIQUIDITY_POLICY = {
  version: "v0-provisional",
  /** Observed coverage: the appliance's acquisition window. Filters cannot exceed it. */
  coverageMinDte: 7,
  coverageMaxDte: 45,
  /** Contracts graded at or better than this tier count as "liquid" (v1 grade, thresholds unchanged). */
  liquidMaxTier: 2,
  /**
   * Display rule only — SAMPLE SUFFICIENCY: fewer measured contracts than this is a
   * "thin sample". Not a liquidity judgment (Principal-approved provisional rule,
   * Oct 27, 2026; unchanged under filtering — raw counts stay visible).
   */
  thinSampleMinContracts: 20,
} as const;

export type OptionTypeFilter = "all" | "puts" | "calls";

/** Operator filter over observed evidence. */
export interface SymbolLiquidityFilter {
  minDte: number;
  maxDte: number;
  optionType: OptionTypeFilter;
  /** Absolute delta (puts carry negative signed delta; |Δ| is compared). */
  minAbsDelta: number;
  maxAbsDelta: number;
}

export const DEFAULT_SYMBOL_LIQUIDITY_FILTER: SymbolLiquidityFilter = {
  minDte: SYMBOL_LIQUIDITY_POLICY.coverageMinDte,
  maxDte: SYMBOL_LIQUIDITY_POLICY.coverageMaxDte,
  optionType: "all",
  minAbsDelta: 0.15,
  maxAbsDelta: 0.5,
};

/** Returns human-readable reasons the filter is invalid, or [] when valid. */
export function validateSymbolLiquidityFilter(f: SymbolLiquidityFilter): string[] {
  const errors: string[] = [];
  const P = SYMBOL_LIQUIDITY_POLICY;
  if (!Number.isInteger(f.minDte) || !Number.isInteger(f.maxDte)) errors.push("DTE must be whole calendar days.");
  else {
    if (f.minDte > f.maxDte) errors.push("Min DTE is greater than max DTE.");
    if (f.minDte < P.coverageMinDte || f.maxDte > P.coverageMaxDte) {
      errors.push(`DTE must stay within observed coverage (${P.coverageMinDte}–${P.coverageMaxDte}); chains outside it are not acquired.`);
    }
  }
  if (!Number.isFinite(f.minAbsDelta) || !Number.isFinite(f.maxAbsDelta)) errors.push("|Δ| bounds must be numbers.");
  else {
    if (f.minAbsDelta < 0 || f.maxAbsDelta > 1) errors.push("|Δ| must be between 0 and 1.");
    if (f.minAbsDelta > f.maxAbsDelta) errors.push("Min |Δ| is greater than max |Δ|.");
  }
  return errors;
}

/** Exactly one evidence state per symbol. Only "measured" / "thin-sample" carry liquidity measures. */
export type SymbolEvidenceState =
  | "measured"
  | "thin-sample"
  | "insufficient-quotes"
  | "no-in-band"
  | "not-current"
  | "no-chains"
  | "no-window-expirations"
  | "unresolved";

export const SYMBOL_EVIDENCE_STATE_LABEL: Record<SymbolEvidenceState, string> = {
  measured: "Measured",
  "thin-sample": "Thin sample",
  "insufficient-quotes": "Insufficient quote evidence",
  "no-in-band": "No matching contracts",
  "not-current": "Not current evidence",
  "no-chains": "Listed, not observed",
  "no-window-expirations": "No listed expiration in DTE range",
  unresolved: "Not yet resolved",
};

/**
 * Per-width short-put vertical availability (Levels 1–2 only; Level 3 not established).
 * Widths are DISCOVERED, not chosen: every listed lower-strike put in the same admissible
 * chain pairs with every in-band short put, whatever the strike difference.
 */
export interface WidthAvailability {
  /** Strike difference in dollars (short strike − long strike), cent precision. */
  width: number;
  /** Level 1: short put in band, long put at (short − width) listed in the same observed chain. */
  listedPairs: number;
  /** Level 2: both legs have a valid two-sided quote (bid > 0, ask ≥ bid). */
  quotedPairs: number;
  /** Measured expirations with ≥1 quoted pair at this width. */
  quotedExpirations: number;
}

export interface SymbolLiquidityRow {
  symbol: string;
  state: SymbolEvidenceState;
  /** Listed expirations inside the DTE range (backend authority). */
  listedExpirations: number;
  /** Published chains for those expirations. */
  observedChains: number;
  /** Listed expirations in range with no published chain. */
  unobservedExpirations: number;
  admissibleChains: number;
  notAdmissibleChains: number;
  noVerdictChains: number;
  /** Admissible chains that contributed ≥1 measured contract. */
  measuredExpirations: number;
  /** Measured expirations with ≥1 liquid (L1–L2) contract. */
  liquidExpirations: number;
  /** Breadth (independent of sample sufficiency): exactly one measured expiration. */
  singleExpiration: boolean;
  /** Measured contracts = quoted + zero-bid (the liquid-share denominator). */
  measuredContracts: number;
  quotedContracts: number;
  zeroBidContracts: number;
  invalidQuoteContracts: number;
  unbandedContracts: number;
  liquidContracts: number;
  /** Measured contracts whose open interest is unavailable (missing/invalid) — never coerced to 0. */
  oiUnavailableContracts: number;
  /** Measured contracts with provider-reported open interest of exactly 0. */
  zeroOiContracts: number;
  /**
   * liquidContracts / gradedContracts × 100, where gradedContracts = measured
   * contracts with observed OI (zero-bid included). Contracts with unavailable
   * OI cannot be graded and are excluded from the denominator, not counted illiquid.
   */
  liquidSharePercent: number | null;
  /** Median relative spread % over QUOTED contracts only. */
  medianSpreadPercent: number | null;
  /** Median absolute quote spread, ask − bid, PER SHARE, over QUOTED contracts only. */
  medianAbsSpread: number | null;
  bandOpenInterest: number | null;
  bandVolume: number | null;
  volumePartial: boolean;
  /** Every discovered short-put vertical width with ≥1 listed pair, ascending (empty when calls-only). */
  widths: WidthAvailability[];
  /** Σ listed pairs across all discovered widths. Null when widths are not evaluated (calls-only / no current evidence). */
  listedPairsTotal: number | null;
  /** Σ both-legs-quoted pairs across all discovered widths (sort key). Null when not evaluated. */
  quotedPairsTotal: number | null;
  /** Distinct widths with ≥1 listed pair. Null when not evaluated. */
  listedWidthCount: number | null;
  /** Distinct widths with ≥1 quoted pair (sort key). Null when not evaluated. */
  quotedWidthCount: number | null;
  /** Narrowest / widest width with ≥1 quoted pair. Null when none quoted or not evaluated. */
  minQuotedWidth: number | null;
  maxQuotedWidth: number | null;
  spotPrice: number | null;
  oldestAcquiredAtMs: number | null;
  newestAcquiredAtMs: number | null;
}

// --- Snapshot input shape (subset of evidence-snapshot-v1) ---

interface SnapshotContract {
  strike?: number | null;
  delta?: number | null;
  bid?: number | null;
  ask?: number | null;
  openInterest?: number | null;
  volume?: number | null;
}

interface SnapshotChain {
  expiration?: string;
  admissibility?: { admissible?: boolean } | null;
  chainAcquisitionProvenance?: unknown;
  data?: { expiration?: string; underlying?: { price?: number | null } | null; puts?: SnapshotContract[]; calls?: SnapshotContract[] } | null;
}

export interface SnapshotSymbol {
  symbol: string;
  status?: string;
  expirations?: Array<{ date: string; dte: number }> | null;
  chains?: SnapshotChain[] | null;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Two-sided valid quote (the Level-2 and "quoted" criterion). */
function isTwoSidedQuote(c: SnapshotContract): boolean {
  return isFiniteNumber(c.bid) && isFiniteNumber(c.ask) && c.bid > 0 && c.ask >= c.bid;
}

/** Strike key at cent precision (strikes are dollar-and-cent values). */
const strikeKey = (k: number) => Math.round(k * 100);

/**
 * Level 1–2 vertical discovery for one admissible chain's puts, keyed by width in
 * cents. Every in-band short put pairs with every listed put at a lower strike in
 * the same chain. The delta band applies to the prospective SHORT put only; the
 * long put may sit at any delta. A quoted pair needs a valid two-sided quote on
 * BOTH legs. Duplicate strikes collapse to one contract (last wins).
 */
function chainWidthDiscovery(puts: SnapshotContract[], f: SymbolLiquidityFilter): Map<number, { listed: number; quoted: number }> {
  const byStrike = new Map<number, SnapshotContract>();
  for (const p of puts) if (isFiniteNumber(p.strike) && p.strike > 0) byStrike.set(strikeKey(p.strike), p);
  const strikes = [...byStrike.keys()].sort((a, b) => a - b);
  const out = new Map<number, { listed: number; quoted: number }>();
  for (let i = 0; i < strikes.length; i++) {
    const short = byStrike.get(strikes[i])!;
    const d = short.delta;
    if (!isFiniteNumber(d) || d === 0) continue;
    const absD = Math.abs(d);
    if (absD < f.minAbsDelta || absD > f.maxAbsDelta) continue;
    const shortQuoted = isTwoSidedQuote(short);
    for (let j = 0; j < i; j++) {
      const widthCents = strikes[i] - strikes[j];
      const acc = out.get(widthCents) ?? { listed: 0, quoted: 0 };
      acc.listed++;
      if (shortQuoted && isTwoSidedQuote(byStrike.get(strikes[j])!)) acc.quoted++;
      out.set(widthCents, acc);
    }
  }
  return out;
}

/**
 * Build one row for a single snapshot symbol under the given filter. Returns
 * null for symbols the table does not represent: confirmed absent (no listed options).
 * Callers must pass a valid filter (see validateSymbolLiquidityFilter).
 */
export function buildSymbolLiquidityRow(
  sym: SnapshotSymbol,
  filter: SymbolLiquidityFilter = DEFAULT_SYMBOL_LIQUIDITY_FILTER,
  policy = SYMBOL_LIQUIDITY_POLICY,
): SymbolLiquidityRow | null {
  if (sym.status === "absent") return null;
  // Short-put verticals are discovered whenever puts are in scope.
  const evaluateWidths = filter.optionType !== "calls";

  const empty = (state: SymbolEvidenceState, listedExpirations = 0): SymbolLiquidityRow => ({
    symbol: sym.symbol, state, listedExpirations,
    observedChains: 0, unobservedExpirations: listedExpirations,
    admissibleChains: 0, notAdmissibleChains: 0, noVerdictChains: 0,
    measuredExpirations: 0, liquidExpirations: 0, singleExpiration: false,
    measuredContracts: 0, quotedContracts: 0, zeroBidContracts: 0, invalidQuoteContracts: 0, unbandedContracts: 0,
    liquidContracts: 0, oiUnavailableContracts: 0, zeroOiContracts: 0, liquidSharePercent: null, medianSpreadPercent: null, medianAbsSpread: null,
    bandOpenInterest: null, bandVolume: null, volumePartial: false,
    widths: [], listedPairsTotal: null, quotedPairsTotal: null, listedWidthCount: null, quotedWidthCount: null,
    minQuotedWidth: null, maxQuotedWidth: null, spotPrice: null,
    oldestAcquiredAtMs: null, newestAcquiredAtMs: null,
  });

  if (sym.status !== "ready") return empty("unresolved");

  // DTE-range membership is decided by the backend's listed expirations + dte.
  const windowDates = new Set(
    (sym.expirations ?? [])
      .filter((e) => e && typeof e.date === "string" && isFiniteNumber(e.dte) && e.dte >= filter.minDte && e.dte <= filter.maxDte)
      .map((e) => e.date),
  );
  if (windowDates.size === 0) return empty("no-window-expirations");

  const row = empty("measured", windowDates.size);
  const observedDates = new Set<string>();
  const spreads: number[] = [];
  const absSpreads: number[] = [];
  /** Discovered widths across admissible chains, keyed by width in cents. */
  const widthTotals = new Map<number, { listedPairs: number; quotedPairs: number; quotedExpirations: number }>();
  let spotAtMs = -Infinity;
  let oi = 0;
  let vol = 0;

  for (const chain of sym.chains ?? []) {
    const exp = chain.expiration ?? chain.data?.expiration;
    if (!exp || !windowDates.has(exp) || observedDates.has(exp)) continue;
    observedDates.add(exp);
    row.observedChains++;

    const verdict = chain.admissibility?.admissible;
    if (verdict === false) { row.notAdmissibleChains++; continue; }
    if (verdict !== true) { row.noVerdictChains++; continue; }
    row.admissibleChains++;

    // Publisher-established provenance only (ADR-015); never reconstructed.
    const prov = provenanceFromPublished(chain.chainAcquisitionProvenance);
    const chainSpot = chain.data?.underlying?.price;
    if (isFiniteNumber(chainSpot) && chainSpot > 0) {
      const t = prov.kind === "chain-acquired" ? prov.acquiredAtMs : -Infinity;
      if (row.spotPrice == null || t > spotAtMs) { row.spotPrice = chainSpot; spotAtMs = t; }
    }
    if (prov.kind === "chain-acquired") {
      const t = prov.acquiredAtMs;
      row.oldestAcquiredAtMs = row.oldestAcquiredAtMs == null ? t : Math.min(row.oldestAcquiredAtMs, t);
      row.newestAcquiredAtMs = row.newestAcquiredAtMs == null ? t : Math.max(row.newestAcquiredAtMs, t);
    }

    const puts = chain.data?.puts ?? [];
    const calls = chain.data?.calls ?? [];
    const contracts = filter.optionType === "puts" ? puts : filter.optionType === "calls" ? calls : [...puts, ...calls];

    let chainMeasured = 0;
    let chainLiquid = 0;
    for (const c of contracts) {
      const d = c.delta;
      if (!isFiniteNumber(d) || d === 0) { row.unbandedContracts++; continue; }
      const absD = Math.abs(d);
      if (absD < filter.minAbsDelta || absD > filter.maxAbsDelta) continue;

      const bid = c.bid;
      const ask = c.ask;
      if (!isFiniteNumber(bid) || !isFiniteNumber(ask) || ask < 0) { row.invalidQuoteContracts++; continue; }

      // Open interest: observed (incl. a reported 0) vs unavailable. Never coerce unavailable to 0.
      const oiObserved = isFiniteNumber(c.openInterest) && c.openInterest >= 0;
      const contractOi = oiObserved ? (c.openInterest as number) : null;
      const contractVol = isFiniteNumber(c.volume) && c.volume >= 0 ? c.volume : 0;

      if (bid <= 0) {
        row.zeroBidContracts++; // measured, not liquid, contributes no spread
      } else {
        if (ask < bid) { row.invalidQuoteContracts++; continue; }
        const mid = (bid + ask) / 2;
        const spreadPercent = ((ask - bid) / mid) * 100;
        row.quotedContracts++;
        spreads.push(spreadPercent);
        absSpreads.push(ask - bid);
        // Unavailable OI → no grade (null): measured, but not graded and not counted illiquid.
        const grade = contractOi == null ? null : gradeLiquidity({ spreadPercent, openInterest: contractOi });
        if (grade && grade.tier <= policy.liquidMaxTier) { row.liquidContracts++; chainLiquid++; }
      }
      chainMeasured++;
      if (contractOi == null) row.oiUnavailableContracts++;
      else { oi += contractOi; if (contractOi === 0) row.zeroOiContracts++; }
      vol += contractVol;
    }
    if (chainMeasured > 0) row.measuredExpirations++;
    if (chainLiquid > 0) row.liquidExpirations++;

    if (evaluateWidths) {
      for (const [cents, wa] of chainWidthDiscovery(puts, filter)) {
        const t = widthTotals.get(cents) ?? { listedPairs: 0, quotedPairs: 0, quotedExpirations: 0 };
        t.listedPairs += wa.listed;
        t.quotedPairs += wa.quoted;
        if (wa.quoted > 0) t.quotedExpirations++;
        widthTotals.set(cents, t);
      }
    }
  }

  row.unobservedExpirations = windowDates.size - observedDates.size;
  row.measuredContracts = row.quotedContracts + row.zeroBidContracts;

  if (row.admissibleChains === 0) {
    return { ...row, state: row.observedChains > 0 ? "not-current" : "no-chains" };
  }
  if (evaluateWidths) {
    row.widths = [...widthTotals.entries()]
      .sort(([a], [b]) => a - b)
      .map(([cents, t]) => ({ width: cents / 100, ...t }));
    const quoted = row.widths.filter((w) => w.quotedPairs > 0);
    row.listedPairsTotal = row.widths.reduce((s, w) => s + w.listedPairs, 0);
    row.quotedPairsTotal = quoted.reduce((s, w) => s + w.quotedPairs, 0);
    row.listedWidthCount = row.widths.length;
    row.quotedWidthCount = quoted.length;
    row.minQuotedWidth = quoted.length > 0 ? quoted[0].width : null;
    row.maxQuotedWidth = quoted.length > 0 ? quoted[quoted.length - 1].width : null;
  }
  if (row.measuredContracts === 0) {
    // Matching contracts existed but none had usable quotes / deltas → insufficient evidence,
    // distinct from "no contracts of the selected type in the band".
    const state: SymbolEvidenceState = row.invalidQuoteContracts > 0 || row.unbandedContracts > 0 ? "insufficient-quotes" : "no-in-band";
    return { ...row, state };
  }

  const graded = row.measuredContracts - row.oiUnavailableContracts;
  row.liquidSharePercent = graded > 0 ? (row.liquidContracts / graded) * 100 : null;
  row.medianSpreadPercent = median(spreads);
  row.medianAbsSpread = median(absSpreads);
  // OI sum covers contracts with observed OI only; null when none had observed OI.
  row.bandOpenInterest = graded > 0 ? oi : null;
  row.bandVolume = vol;
  row.volumePartial = row.admissibleChains < row.listedExpirations;
  row.singleExpiration = row.measuredExpirations === 1;
  row.state = row.measuredContracts < policy.thinSampleMinContracts ? "thin-sample" : "measured";
  return row;
}

export interface SymbolLiquiditySummary {
  rows: SymbolLiquidityRow[];
  /** Symbols confirmed to have no listed options (not represented as rows). */
  absentSymbols: number;
  /** The filter the rows were computed under. */
  filter: SymbolLiquidityFilter;
}

/** Build all rows from a published evidence snapshot's `symbols[]` under a valid filter. Pure. */
export function buildSymbolLiquidity(
  symbols: SnapshotSymbol[] | null | undefined,
  filter: SymbolLiquidityFilter = DEFAULT_SYMBOL_LIQUIDITY_FILTER,
  policy = SYMBOL_LIQUIDITY_POLICY,
): SymbolLiquiditySummary {
  const rows: SymbolLiquidityRow[] = [];
  let absentSymbols = 0;
  for (const s of symbols ?? []) {
    if (!s || typeof s.symbol !== "string") continue;
    const row = buildSymbolLiquidityRow(s, filter, policy);
    if (row) rows.push(row);
    else absentSymbols++;
  }
  return { rows, absentSymbols, filter };
}
