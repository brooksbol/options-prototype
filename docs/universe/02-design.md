# Candidate Universe — Design (First Slice)

## Module Structure

```
src/
  universe/
    types.ts              — CandidateSymbol type
    sources/
      yahoo.ts            — YAHOO_TOP_ETFS constant (496 symbols)
    universe.ts           — load, merge, deduplicate, add, query
    persistence.ts        — localStorage for operator additions
```

## Bundled Data Format

The Yahoo CSV is converted to a TypeScript constant (array of uppercase symbol strings). Rationale: zero-cost import, version-controlled, no async parsing at runtime, consistent with how `CURATED_UNIVERSE` and `SUPPORTED_UNDERLYINGS` are modeled elsewhere in the codebase.

```typescript
// src/universe/sources/yahoo.ts
export const YAHOO_TOP_ETFS: string[] = ["IEO", "GSG", "VDE", "XLE", ...];
export const YAHOO_SOURCE_ID = "yahoo_top_etfs_2026_07_13";
export const YAHOO_CAPTURED_AT = "2026-07-13";
```

The original CSV is retained as `src/universe/sources/yahoo-top-etfs-496-symbols.csv` for provenance.

## Universe Load Logic

```typescript
function loadCandidateUniverse(): CandidateSymbol[] {
  // 1. Create candidates from bundled Yahoo source
  const bundled = YAHOO_TOP_ETFS.map(symbol => ({
    symbol: symbol.toUpperCase().trim(),
    sources: [YAHOO_SOURCE_ID],
    addedAt: YAHOO_CAPTURED_AT,
  }));

  // 2. Load operator additions from localStorage
  const additions = loadOperatorAdditions(); // CandidateSymbol[]

  // 3. Merge and deduplicate
  return mergeAndDeduplicate([...bundled, ...additions]);
}
```

## Deduplication Rules

When merging candidates with the same symbol:
- `symbol`: the shared symbol (uppercase)
- `sources`: union of all source tags (deduplicated)
- `addedAt`: the earliest date among merged records

## localStorage Schema

Key: `options-prototype:universe-additions`

```typescript
interface PersistedAdditions {
  schemaVersion: 1;
  additions: CandidateSymbol[];
}
```

Only operator additions are persisted. The bundled source is never written to localStorage.

## Universe View

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ CANDIDATE UNIVERSE                    496 candidates     │
│                                                          │
│ ┌─ Source Context ─────────────────────────────────────┐│
│ │ Yahoo Top ETFs: externally curated snapshot           ││
│ │ captured July 13, 2026. Not a complete ETF universe. ││
│ │ Inclusion does not imply admission or suitability.   ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ [Search: ________] [Add Symbol: ______] [Add]           │
│                                                          │
│ Symbol | Sources              | Added                    │
│ IEO    | yahoo_top_etfs...   | 2026-07-13              │
│ GSG    | yahoo_top_etfs...   | 2026-07-13              │
│ XLE    | yahoo..., operator  | 2026-07-13              │
│ ...                                                      │
│                                                          │
│ Page 1 of 10  [‹] [›]                                   │
└─────────────────────────────────────────────────────────┘
```

### Pagination
50 rows per page (consistent with SEC Explorer).

### Search
Case-insensitive substring match on symbol.

### Add Symbol
Input field + button. Normalizes to uppercase, adds with source `"operator_manual"` and current date. If duplicate, merges source tag.

## Integration Points

- New tab "Universe" in App.tsx navigation
- No consumption by Opportunity Lab or Velvet Rope (this slice)
- No provider calls from this module

## Testing Strategy

Unit tests in `tests/universe/`:
- `universe.test.ts` — load, merge, dedup, add, normalize, persistence

Focus: domain logic correctness, not UI rendering.
