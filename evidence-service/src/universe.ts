/**
 * Candidate Universe — symbols the acquisition worker processes.
 *
 * Source: Yahoo Top ETFs (496 symbols, captured July 13, 2026).
 * This is a static copy of the frontend's universe for the transitional slice.
 * Future: shared package or backend-owned universe management.
 */

// For the transitional slice, we load from the frontend source at startup.
// This avoids duplicating the 496-symbol list.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let cachedSymbols: string[] | null = null;

export function loadUniverse(): string[] {
  if (cachedSymbols) return cachedSymbols;

  try {
    // Read from the frontend source file
    const filePath = resolve(process.cwd(), "../options-prototype/src/universe/sources/yahoo.ts");
    const content = readFileSync(filePath, "utf-8");

    // Extract the array from the TypeScript source
    const match = content.match(/export const YAHOO_TOP_ETFS: string\[\] = \[([\s\S]*?)\];/);
    if (!match) {
      console.warn("[universe] Could not parse Yahoo universe from frontend source. Using fallback.");
      return getFallbackUniverse();
    }

    const symbols = match[1]
      .split(",")
      .map((s) => s.trim().replace(/"/g, "").replace(/'/g, ""))
      .filter((s) => s.length > 0 && s.length < 10);

    // Validate: canonical universe is 496 symbols. Log a warning if count differs.
    if (symbols.length !== 496) {
      console.warn(`[universe] Expected 496 symbols, parsed ${symbols.length}. Check yahoo.ts for changes.`);
    }

    // Deduplicate (defensive — would indicate source error)
    const unique = [...new Set(symbols)];
    if (unique.length !== symbols.length) {
      console.warn(`[universe] Detected ${symbols.length - unique.length} duplicate symbols. Using deduplicated set of ${unique.length}.`);
    }

    cachedSymbols = unique;
    console.log(`[universe] Loaded ${unique.length} symbols from Yahoo 496`);
    return unique;
  } catch {
    console.warn("[universe] Could not read frontend universe file. Using fallback.");
    return getFallbackUniverse();
  }
}

function getFallbackUniverse(): string[] {
  // Small fallback for testing when frontend source isn't available
  cachedSymbols = ["XLE", "XLF", "XLK", "XLU", "XLP", "QQQ", "SPY", "IWM", "DIA", "GLD"];
  return cachedSymbols;
}
