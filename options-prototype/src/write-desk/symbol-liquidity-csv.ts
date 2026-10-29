import type { SymbolLiquidityRow, SymbolLiquidityFilter } from "./symbol-liquidity";
import { buildCsv, type CsvColumn } from "./table-csv-export";

/** Single CSV schema for the accepted v1 table and TT1 export. No new liquidity arithmetic. */
export function symbolLiquidityColumns(f: SymbolLiquidityFilter): CsvColumn[] {

    const n = (v: number | null, d = 1) => (v == null ? "" : v.toFixed(d));
    const row = (r: Record<string, unknown>) => r as unknown as SymbolLiquidityRow;
    const widthCols: CsvColumn[] = [
      { key: "quotedWidthCount", label: "QuotedWidthCount", format: (r) => n(row(r).quotedWidthCount, 0) },
      { key: "minQuotedWidth", label: "MinQuotedWidth", format: (r) => n(row(r).minQuotedWidth, 2) },
      { key: "maxQuotedWidth", label: "MaxQuotedWidth", format: (r) => n(row(r).maxQuotedWidth, 2) },
      { key: "quotedPairsTotal", label: "QuotedPairs", format: (r) => n(row(r).quotedPairsTotal, 0) },
      { key: "listedWidthCount", label: "ListedWidthCount", format: (r) => n(row(r).listedWidthCount, 0) },
      { key: "listedPairsTotal", label: "ListedPairs", format: (r) => n(row(r).listedPairsTotal, 0) },
      { key: "widthDetail", label: "WidthQuotedListedPairs", format: (r) => widthDetail(row(r)) },
    ];

    return [
        // Filter settings on every row (no CSV metadata mechanism exists).
        { key: "fMinDte", label: "FilterMinDTE", format: () => String(f.minDte) },
        { key: "fMaxDte", label: "FilterMaxDTE", format: () => String(f.maxDte) },
        { key: "fType", label: "FilterOptionType", format: () => f.optionType },
        { key: "fMinD", label: "FilterMinAbsDelta", format: () => String(f.minAbsDelta) },
        { key: "fMaxD", label: "FilterMaxAbsDelta", format: () => String(f.maxAbsDelta) },
        { key: "fW", label: "WidthDiscovery", format: () => (f.optionType === "calls" ? "not evaluated (calls)" : "all listed lower strikes; short put in |Δ| band") },
        { key: "symbol", label: "Symbol" },
        { key: "spotPrice", label: "Spot", format: (r) => n(r.spotPrice as number | null, 2) },
        { key: "state", label: "Evidence" },
        { key: "medianSpreadPercent", label: "MedianSpread%", format: (r) => n(r.medianSpreadPercent as number | null, 2) },
        { key: "medianAbsSpread", label: "MedianAbsSpreadPerShare", format: (r) => n(r.medianAbsSpread as number | null, 3) },
        { key: "liquidSharePercent", label: "LiquidShare%", format: (r) => n(r.liquidSharePercent as number | null, 1) },
        { key: "measuredContracts", label: "MeasuredContracts" },
        { key: "liquidContracts", label: "LiquidContracts" },
        { key: "zeroOiContracts", label: "ZeroOIContracts" },
        { key: "oiUnavailableContracts", label: "OIUnavailableContracts" },
        { key: "quotedContracts", label: "QuotedContracts" },
        { key: "zeroBidContracts", label: "ZeroBidContracts" },
        { key: "invalidQuoteContracts", label: "ExcludedInvalidQuote" },
        { key: "unbandedContracts", label: "ExcludedNoDelta" },
        { key: "listedExpirations", label: "ListedExpirations" },
        { key: "observedChains", label: "ObservedChains" },
        { key: "unobservedExpirations", label: "ListedNotObserved" },
        { key: "admissibleChains", label: "AdmissibleChains" },
        { key: "notAdmissibleChains", label: "NotAdmissibleChains" },
        { key: "noVerdictChains", label: "NoVerdictChains" },
        { key: "measuredExpirations", label: "MeasuredExpirations" },
        { key: "liquidExpirations", label: "LiquidExpirations" },
        { key: "singleExpiration", label: "SingleExpiration", format: (r) => (r.singleExpiration ? "yes" : "no") },
        ...widthCols,
        { key: "verticalLevel3", label: "ExecutableVerticalEstablished", format: () => "no" },
        { key: "bandOpenInterest", label: "OI", format: (r) => n(r.bandOpenInterest as number | null, 0) },
        { key: "bandVolume", label: "Volume", format: (r) => n(r.bandVolume as number | null, 0) },
        { key: "volumePartial", label: "VolumePartial", format: (r) => (r.bandVolume == null ? "" : r.volumePartial ? "partial" : "complete") },
        { key: "oldestAcquiredAtMs", label: "OldestChainAcquiredAt", format: (r) => (r.oldestAcquiredAtMs == null ? "" : new Date(r.oldestAcquiredAtMs as number).toISOString()) },
        { key: "newestAcquiredAtMs", label: "NewestChainAcquiredAt", format: (r) => (r.newestAcquiredAtMs == null ? "" : new Date(r.newestAcquiredAtMs as number).toISOString()) },
      ];
}
export function symbolLiquidityCsv(rows: SymbolLiquidityRow[], filter: SymbolLiquidityFilter): string {
  return buildCsv(rows as unknown as Record<string, unknown>[], symbolLiquidityColumns(filter));
}

function widthDetail(r: SymbolLiquidityRow): string {
  return r.quotedWidthCount == null ? "" : r.widths.map((w) => `${w.width}:${w.quotedPairs}/${w.listedPairs}`).join(" ");
}
