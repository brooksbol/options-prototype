/**
 * Opening-Set Observation — lightweight frontend timestamp instrumentation
 * for the Opening-Relevant Evidence Experiment.
 *
 * Records when opening-set symbols first produce admissible recommendations
 * and what fraction of the opening set is hydrated at key checkpoints.
 *
 * This is OBSERVATION ONLY — it does not feed back into acquisition,
 * recommendation, or any decision logic. It exists to produce experiment
 * outcome evidence.
 *
 * Experiment artifact. Not a product concept.
 */

// The frozen experimental fixture (must match data/seeds/opening-set.txt)
const OPENING_SET: ReadonlySet<string> = new Set([
  "SPY", "IWM", "SOXL", "KBWB", "QQQ", "GDX", "QLD", "TQQQ", "GLD", "SLV",
  "VOOG", "DIA", "SMH", "PFF", "XLF", "XLRE", "SVXY", "XME", "XLP", "UCO",
  "VNQ", "USO", "GUSH", "EEM", "BNO", "SPMO", "TECL", "SPYG", "SPYM", "TNA",
  "YCS", "ITA", "XLB", "EWW", "EWG", "USD", "URTY", "DFEN", "FTXL", "IBB",
  "VGT", "VTI", "WEAT", "XLE", "DBO", "SOXX", "VEA", "VT", "XLK", "XOP",
  "ARKK", "ITOT", "CPER", "SCHG", "ECH", "FAS", "QYLD", "VCLT", "VPU", "YANG",
]);

interface OpeningSetObservation {
  timestamp: string;
  openingSetTotal: number;
  openingSetWithRecommendations: number;
  hydrationFraction: number;
  totalRecommendations: number;
  openingSetRecommendations: number;
}

// Session-scoped state (resets on page reload, which is fine for experiment)
let firstAdmissibleAt: string | null = null;
let lastLoggedFraction = 0;
let observationLog: OpeningSetObservation[] = [];

/**
 * Observe the recommendation surface output and log opening-set hydration.
 *
 * Call this after buildCrossEntryRows() produces results.
 * Pass the symbols that appear in the resulting rows.
 *
 * @param recommendedSymbols - Set of symbols that appear in the current recommendation output
 * @param totalRows - Total number of recommendation rows produced
 */
export function observeOpeningSetHydration(
  recommendedSymbols: Set<string>,
  totalRows: number
): void {
  // Count opening-set symbols that produced recommendations
  let openingSetWithRecs = 0;
  for (const symbol of OPENING_SET) {
    if (recommendedSymbols.has(symbol)) {
      openingSetWithRecs++;
    }
  }

  const fraction = OPENING_SET.size > 0 ? openingSetWithRecs / OPENING_SET.size : 0;
  const now = new Date().toISOString();

  // Record first admissible recommendation from opening set
  if (firstAdmissibleAt === null && openingSetWithRecs > 0) {
    firstAdmissibleAt = now;
    console.log(
      `[opening-experiment] First admissible opening-set recommendation at ${now} ` +
      `(${openingSetWithRecs}/${OPENING_SET.size} symbols)`
    );
  }

  // Log at 10% hydration increments
  const fractionTenth = Math.floor(fraction * 10) / 10;
  if (fractionTenth > lastLoggedFraction) {
    lastLoggedFraction = fractionTenth;
    console.log(
      `[opening-experiment] Opening set hydration: ${openingSetWithRecs}/${OPENING_SET.size} ` +
      `(${(fraction * 100).toFixed(0)}%) at ${now} · ${totalRows} total recommendations`
    );
  }

  // Full hydration milestone
  if (fraction >= 1.0 && observationLog.length > 0 &&
      observationLog[observationLog.length - 1].hydrationFraction < 1.0) {
    console.log(
      `[opening-experiment] Opening set FULLY HYDRATED at ${now} · ` +
      `${totalRows} total recommendations`
    );
  }

  // Append to session log (bounded to prevent memory growth)
  if (observationLog.length < 500) {
    observationLog.push({
      timestamp: now,
      openingSetTotal: OPENING_SET.size,
      openingSetWithRecommendations: openingSetWithRecs,
      hydrationFraction: fraction,
      totalRecommendations: totalRows,
      openingSetRecommendations: openingSetWithRecs,
    });
  }
}

/**
 * Get the observation log for diagnostic export.
 */
export function getOpeningSetObservationLog(): {
  firstAdmissibleAt: string | null;
  observations: OpeningSetObservation[];
} {
  return {
    firstAdmissibleAt,
    observations: [...observationLog],
  };
}

/**
 * Get the opening set for external consumers (e.g., diagnostic display).
 */
export function getOpeningSet(): ReadonlySet<string> {
  return OPENING_SET;
}
