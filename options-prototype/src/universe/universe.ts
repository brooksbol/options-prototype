/**
 * Candidate Universe — load, merge, deduplicate, add, query.
 *
 * The Candidate Universe holds symbols that might be worth evaluating.
 * It merges bundled seed data with operator additions, deduplicates by symbol,
 * and preserves source provenance.
 */

import type { CandidateSymbol, CandidateUniverseResult, CandidateUniverseDescriptor } from "./types";
import { YAHOO_TOP_ETFS, YAHOO_SOURCE_ID, YAHOO_CAPTURED_AT, YAHOO_DISPLAY_NAME, YAHOO_DESCRIPTION } from "./sources/yahoo";
import { loadOperatorAdditions, saveOperatorAdditions } from "./persistence";

// --- Normalization ---

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

// --- Merge and Deduplicate ---

/**
 * Merge candidates, deduplicating by symbol.
 * When the same symbol appears from multiple sources:
 * - sources[] = union of all source tags
 * - addedAt = earliest date
 */
export function mergeAndDeduplicate(candidates: CandidateSymbol[]): CandidateSymbol[] {
  const map = new Map<string, CandidateSymbol>();

  for (const candidate of candidates) {
    const symbol = normalizeSymbol(candidate.symbol);
    if (!symbol) continue;

    const existing = map.get(symbol);
    if (existing) {
      // Merge sources (deduplicate)
      const mergedSources = [...new Set([...existing.sources, ...candidate.sources])];
      // Keep earliest addedAt
      const earliestDate = existing.addedAt < candidate.addedAt ? existing.addedAt : candidate.addedAt;
      map.set(symbol, { symbol, sources: mergedSources, addedAt: earliestDate });
    } else {
      map.set(symbol, { symbol, sources: [...candidate.sources], addedAt: candidate.addedAt });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
}

// --- Load Universe ---

/**
 * Load the complete Candidate Universe (bundled + operator additions, deduplicated).
 */
export function loadCandidateUniverse(): CandidateSymbol[] {
  // 1. Create candidates from bundled Yahoo source
  const bundled: CandidateSymbol[] = YAHOO_TOP_ETFS.map((symbol) => ({
    symbol: normalizeSymbol(symbol),
    sources: [YAHOO_SOURCE_ID],
    addedAt: YAHOO_CAPTURED_AT,
  }));

  // 2. Load operator additions from localStorage
  const additions = loadOperatorAdditions();

  // 3. Merge and deduplicate
  return mergeAndDeduplicate([...bundled, ...additions]);
}

/**
 * Load the Candidate Universe with full descriptor metadata.
 * This is the authoritative single entry point for all universe consumers.
 */
export function loadCandidateUniverseWithDescriptor(): CandidateUniverseResult {
  const candidates = loadCandidateUniverse();
  const descriptor: CandidateUniverseDescriptor = {
    id: YAHOO_SOURCE_ID,
    name: YAHOO_DISPLAY_NAME,
    version: YAHOO_CAPTURED_AT,
    totalSymbols: candidates.length,
    source: YAHOO_DESCRIPTION,
  };
  return {
    descriptor,
    candidates,
    symbols: candidates.map((c) => c.symbol),
  };
}

// --- Add Operator Candidate ---

/**
 * Add a symbol manually (operator discovery).
 * If already in the universe, merges source tag.
 * Persists the addition to localStorage.
 */
export function addOperatorCandidate(symbol: string): CandidateSymbol[] {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return loadCandidateUniverse();

  const additions = loadOperatorAdditions();
  const today = new Date().toISOString().split("T")[0];

  // Check if already in operator additions
  const existing = additions.find((a) => a.symbol === normalized);
  if (existing) {
    // Already added by operator — no change needed
    return loadCandidateUniverse();
  }

  // Add new operator candidate
  const newAddition: CandidateSymbol = {
    symbol: normalized,
    sources: ["operator_manual"],
    addedAt: today,
  };

  const updatedAdditions = [...additions, newAddition];
  saveOperatorAdditions(updatedAdditions);

  return loadCandidateUniverse();
}
