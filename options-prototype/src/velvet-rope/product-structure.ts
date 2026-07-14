/**
 * ProductStructure — factual structural classification of an instrument.
 *
 * Represents what an instrument IS, not what you're allowed to do with it.
 * Facts, not judgments. Classification, not governance.
 *
 * Inference is name-based (heuristic). When a characteristic cannot be
 * confidently inferred, it defaults to false with low confidence rather
 * than guessing.
 */

// --- Type ---

export interface ProductStructure {
  leveraged: boolean;
  leverageMultiple: number | null;
  inverse: boolean;
  dailyReset: boolean;
  singleStock: boolean;
  commodityBacked: boolean;
  fixedIncome: boolean;
  activelyManaged: boolean;
  inferenceSource: "name_heuristic" | "provider_metadata" | "operator" | "unknown";
  confidence: "high" | "medium" | "low";
}

/** A conventional ETF with no structural complexity flags. */
export const CONVENTIONAL_STRUCTURE: ProductStructure = {
  leveraged: false,
  leverageMultiple: null,
  inverse: false,
  dailyReset: false,
  singleStock: false,
  commodityBacked: false,
  fixedIncome: false,
  activelyManaged: false,
  inferenceSource: "unknown",
  confidence: "low",
};

// --- Inference ---

/**
 * Infer product structure from symbol and name.
 * Uses deterministic pattern matching.
 * Does not make network requests.
 */
export function inferProductStructure(symbol: string, name: string | null): ProductStructure {
  if (!name) {
    return { ...CONVENTIONAL_STRUCTURE };
  }

  const upper = name.toUpperCase();
  const symUpper = symbol.toUpperCase();
  let matchCount = 0;

  // --- Leveraged ---
  let leveraged = false;
  let leverageMultiple: number | null = null;

  if (upper.includes("ULTRAPRO") || upper.includes("3X") || upper.match(/\b3x\b/i)) {
    leveraged = true;
    leverageMultiple = 3;
    matchCount++;
  } else if (upper.includes("ULTRA") && !upper.includes("ULTRAPRO")) {
    leveraged = true;
    leverageMultiple = 2;
    matchCount++;
  } else if (upper.includes("2X") || upper.match(/\b2x\b/i)) {
    leveraged = true;
    leverageMultiple = 2;
    matchCount++;
  }

  // --- Inverse ---
  let inverse = false;
  if (upper.includes("SHORT") || upper.includes("INVERSE") || upper.includes("BEAR")) {
    inverse = true;
    matchCount++;
  }

  // --- Daily Reset ---
  // Known leveraged/inverse issuers typically use daily reset
  let dailyReset = false;
  const dailyResetIssuers = ["PROSHARES", "DIREXION", "MICROSECTORS"];
  if ((leveraged || inverse) && dailyResetIssuers.some((issuer) => upper.includes(issuer))) {
    dailyReset = true;
    matchCount++;
  }
  if (upper.includes("DAILY")) {
    dailyReset = true;
    matchCount++;
  }

  // --- Single Stock ---
  let singleStock = false;
  if (upper.includes("SINGLE STOCK")) {
    singleStock = true;
    matchCount++;
  }
  // Known single-stock ETF ticker patterns (e.g., TSLL, NVDL — typically end in L/S/U)
  // Not reliable enough for heuristic — skip for now

  // --- Commodity Backed ---
  let commodityBacked = false;
  const commodityKeywords = ["GOLD", "SILVER", "COMMODITY", "OIL", "NATURAL GAS", "CRUDE", "PALLADIUM", "PLATINUM"];
  if (commodityKeywords.some((kw) => upper.includes(kw))) {
    commodityBacked = true;
    matchCount++;
  }
  // Common commodity ETF symbols
  const commoditySymbols = ["GLD", "IAU", "SLV", "USO", "UNG", "PPLT", "PALL", "DBC", "GSG", "COMT"];
  if (commoditySymbols.includes(symUpper)) {
    commodityBacked = true;
    matchCount++;
  }

  // --- Fixed Income ---
  let fixedIncome = false;
  const fiKeywords = ["BOND", "TREASURY", "FIXED INCOME", "TIPS", "MUNICIPAL", "CORPORATE BOND", "HIGH YIELD"];
  if (fiKeywords.some((kw) => upper.includes(kw))) {
    fixedIncome = true;
    matchCount++;
  }

  // --- Actively Managed ---
  let activelyManaged = false;
  if (upper.includes("ACTIVE") || upper.includes("ACTIVELY MANAGED")) {
    activelyManaged = true;
    matchCount++;
  }

  // --- Confidence ---
  let confidence: "high" | "medium" | "low";
  if (matchCount >= 3) {
    confidence = "medium"; // strong pattern evidence (never "high" from name alone)
  } else if (matchCount >= 1) {
    confidence = "low";
  } else {
    confidence = "low"; // no patterns matched → conventional assumption
  }

  return {
    leveraged,
    leverageMultiple,
    inverse,
    dailyReset,
    singleStock,
    commodityBacked,
    fixedIncome,
    activelyManaged,
    inferenceSource: matchCount > 0 ? "name_heuristic" : "unknown",
    confidence,
  };
}

/**
 * Returns true if the structure has any flags that indicate
 * structural complexity beyond a conventional equity ETF.
 */
export function hasStructuralComplexity(structure: ProductStructure): boolean {
  return (
    structure.leveraged ||
    structure.inverse ||
    structure.dailyReset ||
    structure.singleStock
  );
}

/**
 * Generate human-readable structural observations.
 */
export function describeStructure(structure: ProductStructure): string[] {
  const observations: string[] = [];

  if (structure.leveraged) {
    const mult = structure.leverageMultiple ? `${structure.leverageMultiple}x` : "";
    observations.push(`Leveraged ETF${mult ? ` (${mult})` : ""} — amplified exposure relative to underlying index`);
  }

  if (structure.inverse) {
    observations.push("Inverse product — designed to move opposite to the underlying index");
  }

  if (structure.dailyReset) {
    observations.push("Daily-reset mechanism — compounding effects may cause significant value drift over holding periods longer than one day");
  }

  if (structure.singleStock) {
    observations.push("Single-stock ETF — concentrated exposure to one company");
  }

  if (structure.commodityBacked) {
    observations.push("Commodity-backed — value tied to physical commodity or futures contracts");
  }

  if (structure.fixedIncome) {
    observations.push("Fixed-income product — interest-rate sensitive, different risk profile from equity ETFs");
  }

  if (structure.activelyManaged) {
    observations.push("Actively managed — holdings may change without notice");
  }

  return observations;
}
