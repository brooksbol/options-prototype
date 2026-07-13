/**
 * Candidate Universe — localStorage persistence for operator additions.
 *
 * Only operator-added symbols are persisted. Bundled seed data is never
 * written to localStorage.
 */

import type { CandidateSymbol } from "./types";

const STORAGE_KEY = "options-prototype:universe-additions";

interface PersistedAdditions {
  schemaVersion: 1;
  additions: CandidateSymbol[];
}

export function loadOperatorAdditions(): CandidateSymbol[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: PersistedAdditions = JSON.parse(raw);
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.additions)) return [];
    return parsed.additions;
  } catch {
    return [];
  }
}

export function saveOperatorAdditions(additions: CandidateSymbol[]): void {
  try {
    const data: PersistedAdditions = { schemaVersion: 1, additions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}
