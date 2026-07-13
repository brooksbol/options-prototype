# Discovery — Design Notes

## Status

Architectural learning phase. Not yet in implementation.

The API Ninjas spike has been completed (`docs/engineering-spikes/api-ninjas-etf-catalog.md`). Discovery implementation remains deferred until the Velvet Rope first slice is proven useful.

---

## Architectural Refinement

### Original Model (superseded)

```
API Provider → Discovery → Velvet Rope
```

### Refined Model

```
Reference Data Sources          (slow — months/years)
        │
        ▼
Canonical ETF Reference Catalog  (aggregated, deduplicated)
        │
        ▼
Discovery                        (occasional — days/weeks)
        │
        ▼
Velvet Rope                      (policy-driven — minutes/hours)
        │
        ▼
Opportunity Lab                  (market-driven — seconds/minutes)
```

### Key Insight

Discovery is a **consumer** of a canonical ETF catalog, not the **owner** of ETF identity.

ETF identity (symbol, name, ISIN, exchange, product type) is reference data that changes slowly and comes from authoritative sources. Discovery's job is to evaluate candidates from that catalog against institutional criteria — not to invent or maintain ETF metadata.

---

## Lifecycle Differences

| Concern | Lifecycle | Changes when... |
|---------|-----------|-----------------|
| Reference Data | Months/years | New ETFs listed, ETFs delisted, corporate actions |
| Discovery | Days/weeks | Crawl schedule, new candidates found, catalog refreshed |
| Velvet Rope | Minutes/hours | Policy changed, evidence refreshed, operator evaluates |
| Opportunity Lab | Seconds/minutes | Market data updates, policy knob adjusted |

These are fundamentally different cadences operating on different data.

---

## Provider Strategy

No single provider covers all needs. The architecture should consume multiple sources:

| Provider | Role | Strengths | Limitations |
|----------|------|-----------|-------------|
| SEC (`company_tickers_exchange.json`) | Canonical security identity | Authoritative, broad, free | No investment metadata, no options info |
| API Ninjas | Programmatic ETF catalog | REST API, searchable, metadata | Requires paid tier for enumeration; no category/leveraged flags |
| Finnhub | Metadata enrichment | Richer data, real-time capable | Needs investigation |
| Financial Modeling Prep (FMP) | Alternative/enrichment | Comprehensive financial data | Needs investigation |
| ETF Database (ETFdb) | Human reference / validation | Complete, well-organized | Not a machine API; benchmark for completeness |
| Issuer sites (iShares, etc.) | Issuer-specific validation | Authoritative for fund family | Not scalable as catalog source |
| Tradier | Options availability verification | Authoritative for options existence | Cannot enumerate ETF universe |

### Provider Roles (Conceptual)

```
SEC                  → "What SEC-reporting securities exist?" (NOT complete for ETFs)
API Ninjas / FMP     → "What ETF metadata can we obtain programmatically?"
Tradier              → "Does this ETF have listed options?"
ETFdb / Yahoo        → "Human validation and completeness benchmark"
Finnhub              → "Additional enrichment (sector, issuer, AUM)"
```

---

## Emerging Bounded Context: Reference Data

Discovery documentation should acknowledge that a "Reference Data" concept may eventually emerge as a distinct bounded context:

- **Reference Data** — canonical ETF identities, slowly-changing metadata, authoritative sources
- **Discovery** — the institutional process of finding and evaluating candidates from the reference catalog
- **Velvet Rope** — admission policy evaluation against current market evidence

However, per project methodology: do not introduce a new bounded context until working software demonstrates the need. For now, Discovery can consume reference data directly without a formal separation.

---

## API Ninjas Spike Findings (Summary)

Completed 2026-07-13. Full results in `docs/engineering-spikes/api-ninjas-etf-catalog.md`.

- Free tier: single-ticker lookup only (name, ISIN, CUSIP, country)
- Premium fields (price, AUM, expense, holdings): require paid subscription
- Universe enumeration and search: require Business+ tier (~$20-50/mo)
- Missing at any tier: category, issuer, leveraged/inverse flags, options availability
- CORS permissive; browser calls work
- ~1s per call; no rate-limit headers returned
- **Verdict:** Conditionally viable for Discovery (paid tier), not needed for Velvet Rope first slice

---

## SEC Exchange-Listed Securities (Implemented 2026-07-13)

The first reference data source is now operational.

- **Source:** `https://www.sec.gov/files/company_tickers_exchange.json`
- **Content:** ~9,300 exchange-listed securities (CIK, name, ticker, exchange)
- **Limitations:** No product type, no ETF classification, no options info
- **Role:** Human-in-the-loop Discovery — operator browses, selects candidates, sends to Velvet Rope
- **Heuristic:** Name-based likely-fund detection (keywords + issuer patterns) — clearly labeled as unverified
- **CORS:** Blocked — Vite dev proxy required
- **Status:** Working. Experiment 003 active.

This validates that the SEC catalog serves as useful reference data for Discovery even without automated classification. The operator's domain knowledge substitutes for what the data doesn't provide.

### Critical Boundary Discovery (Experiment 004, July 2026)

**The SEC dataset is NOT a complete exchange-traded instrument catalog.**

Evidence: XLE, SPY, SCHD (major, highly-liquid ETFs) are systematically absent. Newer crypto ETFs (QETH, BRRR) are present.

The population appears to depend on SEC EDGAR filing structure (CIK-based), not on exchange listing. This means:

- The SEC Explorer is useful for what it **does** contain (companies, newer ETPs)
- It is **not** suitable as the sole reference data source for ETF Discovery
- Multi-provider Reference Data is architecturally necessary, not merely nice-to-have

**Provider assessment updated:**

| Provider | Role | Completeness for ETFs |
|----------|------|----------------------|
| SEC `company_tickers_exchange.json` | Identity + some ETPs | **Incomplete** — many major ETFs missing |
| API Ninjas `/v1/etf` | Single-ticker lookup | Appears complete (SPY, XLE respond) |
| API Ninjas `/v1/etflist` | Full enumeration | Unknown (requires paid tier) |
| FMP `/stable/profile` | Single-symbol rich profile + `isEtf` flag | **Excellent** — SPY, XLE, SCHD, QQQ, TLT, QETH all present |
| FMP `/stable/search-*` | Name/symbol search | Works on current plan |
| FMP `/stable/etf-list` | Full ETF enumeration | Paywalled (402) |
| Tradier | Options verification | Appears complete for optionable securities |
| ETFdb | Human reference | Appears comprehensive |

**Architectural implication:** Discovery must consume multiple catalogs. No single provider is authoritative. The union (or intersection) of providers may be needed depending on use case.

---

## Discovery Behavior Observed (July 2026)

### The Explorer is a research instrument, not a screener

Operator behavior reveals exploration patterns:
- "Show me crypto" / "Show me gold" / "Show me dividend" — question-asking
- Progressive narrowing: 9,304 → 837 → 131 → 2 — funnel behavior
- Evaluation interrupts exploration when it requires navigation

### Portable Institutional Opinion

The `EvaluationNarrative` (created for Velvet Rope VR-22) has proven to be a **portable abstraction** — not a Velvet-Rope-specific concern.

It represents the Interpretation layer's output: a deterministic synthesis of evaluation results into operator-facing language. Any surface that needs to communicate an admission decision can consume it without exposing engineering evidence.

### Emerging separation of concerns

| Surface | Owns |
|---------|------|
| SEC Explorer | Exploration, discovery, question-asking, browsing context |
| Velvet Rope | Interpretation, admission, engineering evidence, full audit |
| EvaluationNarrative | Portable institutional opinion (consumed by both) |

### Next iteration (documented, not yet implemented)

Inline evaluation within the SEC Explorer:
- Evaluate without navigation
- Display outcome + summary inline
- Preserve browsing context
- "Open Full Analysis" as optional deeper action
- Show previously-evaluated outcomes on return

This reuses the existing evaluation pipeline and audit trail — no duplication.

---

## What Discovery Will Eventually Do

When implementation begins, Discovery will:

1. Consume ETF reference catalog (from one or more providers)
2. Filter by basic eligibility (ETF only, not ETN; listed on supported exchange)
3. Verify options availability via Tradier
4. Queue candidates for Velvet Rope evaluation
5. Maintain crawl state (last checked, next check due)
6. Operate on a slow cadence (days/weeks, not real-time)

Discovery does NOT:
- Own ETF identity
- Perform admission decisions (that's Velvet Rope)
- Evaluate option chains (that's Velvet Rope + Opportunity Lab)
- Store market data (that's providers with caches)

---

## Open Questions

1. Is SEC `company_tickers_exchange.json` sufficient as the canonical identity source, or do we need a richer authoritative source?
2. Should "Reference Data" become a formal bounded context, or remain implicit within Discovery?
3. What is the minimum paid-tier subscription that unlocks enough Discovery capability to justify the cost?
4. Can Tradier's symbol search substitute for API Ninjas enumeration?
5. How many ETFs in the total US universe have listed options? (This determines whether Tradier verification is a cheap filter or an expensive one.)
