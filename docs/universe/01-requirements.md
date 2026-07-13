# Candidate Universe — Requirements (First Slice)

## Purpose

Establish a Candidate Universe module that holds symbols which *might* be worth evaluating by institutional policy. This is the broadest layer of the institutional funnel — intentionally larger than the admitted registry or the Opportunity Lab scan set.

The first slice seeds the universe with the Yahoo 496-symbol ETF snapshot and makes it browsable.

---

## Scope

### In Scope

- Candidate Universe domain module with types, sources, merge, persistence
- Yahoo 496-symbol CSV converted to bundled TypeScript constant
- Source provenance (`yahoo_top_etfs_2026_07_13`)
- Operator manual-add capability via localStorage
- Deduplication with source-tag merging
- Browsable Universe view/tab in the application
- Symbol search, pagination
- Clear UI labeling that candidates ≠ admitted/recommended

### Out of Scope

- Velvet Rope integration
- Opportunity Lab integration
- Enrichment (FMP, API Ninjas)
- Batch evaluation
- Automated crawling or refresh
- Source lifecycle management
- Morningstar/Yahoo grade ingestion
- Provider requests from the Universe view

---

## Requirements

### CU-1: Domain Types

The module shall define a `CandidateSymbol` type:
```typescript
interface CandidateSymbol {
  symbol: string;
  sources: string[];
  addedAt: string; // ISO date
}
```

### CU-2: Bundled Seed Data

The Yahoo 496-symbol CSV shall be converted into a version-controlled TypeScript constant. The application shall not parse the uploaded CSV dynamically at runtime.

### CU-3: Source Provenance

Each Yahoo-sourced candidate shall carry source tag `"yahoo_top_etfs_2026_07_13"`. The source represents an externally curated snapshot captured July 13, 2026.

### CU-4: Symbol Normalization

All symbols shall be uppercased and trimmed. No duplicate symbol records shall exist in the universe.

### CU-5: Deduplication with Source Merge

When the same symbol appears from multiple sources, the universe shall contain one `CandidateSymbol` with merged `sources[]` arrays. The `addedAt` shall preserve the earliest known date.

### CU-6: Operator Additions

The operator shall be able to add symbols manually. Operator additions persist to localStorage with source tag `"operator_manual"`.

### CU-7: Persistence Strategy

- Bundled Yahoo symbols: immutable seed data (TypeScript constant)
- Operator additions: localStorage
- At load: merge bundled + localStorage, normalize, deduplicate

### CU-8: Universe Query

The module shall expose a function to load the complete candidate universe (bundled + operator additions, deduplicated).

### CU-9: No Provider Calls

Loading or browsing the Candidate Universe shall trigger zero external API requests (no Tradier, FMP, SEC, Yahoo, or Morningstar calls).

### CU-10: Universe View

A browsable page/tab shall display the candidate universe with:
- Total candidate count
- Text search by symbol
- Pagination (appropriate for ~496+ rows)
- Symbol, sources, and added date per row
- Operator manual-add input

### CU-11: Source Transparency

The UI shall clearly label:
- The Yahoo source as "an externally curated snapshot captured July 13, 2026"
- That inclusion does not imply institutional admission or suitability
- That the source is not a complete ETF market universe

### CU-12: Separation from Admission

The Universe view shall not display or imply:
- Admission status
- Suitability indicators
- Options availability
- Recommendation or deployment status

### CU-13: No Downstream Changes

This slice shall not modify: Opportunity Lab scan universe, Velvet Rope inputs, provider request patterns, recommendation behavior, or any existing page behavior.

---

## Acceptance Criteria

1. Candidate Universe module exists with types, sources, merge, persistence
2. Exactly 496 Yahoo candidates present before operator additions
3. Each Yahoo candidate has source `"yahoo_top_etfs_2026_07_13"` and `addedAt: "2026-07-13"`
4. Operator can add a symbol; it merges if duplicate
5. Universe browsable via new tab with search and pagination
6. No provider requests triggered by browsing
7. UI clearly distinguishes candidates from admitted symbols
8. Existing tests pass; new domain/UI tests added
9. Opportunity Lab and Velvet Rope behavior unchanged
