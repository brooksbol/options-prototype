# Engineering Spike: API Ninjas ETF Catalog

## Purpose

Retire the highest-risk integration uncertainty before Velvet Rope implementation: whether API Ninjas is a viable ETF catalog provider for future universe discovery.

## Principle

Data integration risk should be retired before building dependent automation. The Velvet Rope admission pipeline and future Discovery Engine depend on an ETF catalog source. Proving or disproving API Ninjas suitability before building those systems prevents wasted architecture.

---

## Findings

### Authentication

- API key authentication via `X-Api-Key` header: **WORKS**
- Key configured as `VITE_API_NINJAS_KEY` in `.env.local`
- Security note: VITE-prefixed variables are exposed to browser code. Must move server-side before cloud deployment.

### Endpoints Tested

| Endpoint | Purpose | Current Tier Access | Status |
|----------|---------|-------------------|--------|
| `/v1/etf?ticker=XXX` | Single ETF lookup | Free tier | ✓ Works (limited fields) |
| `/v1/etflist?offset=N` | Enumerate all ETFs | Business/Professional/Annual only | ✗ Blocked (HTTP 400) |
| `/v1/etfsearch?filters` | Filtered search | Business/Professional/Annual only | ✗ Blocked (HTTP 400) |

### Response Shape (Free Tier — `/v1/etf`)

```json
{
  "etf_ticker": "SPY",
  "etf_name": "State Street SPDR S&P 500 ETF",
  "isin": "US78462F1030",
  "cusip": "78462F103",
  "country": "US",
  "price": "This data is for premium users only.",
  "expense_ratio": "This data is for premium users only.",
  "aum": "This data is for premium users only.",
  "holdings": "This data is for premium users only.",
  "num_holdings": "This data is for premium users only."
}
```

### Field Availability by Tier

| Field | Free | Premium |
|-------|------|---------|
| etf_ticker | ✓ | ✓ |
| etf_name | ✓ | ✓ |
| isin | ✓ | ✓ |
| cusip | ✓ | ✓ |
| country | ✓ | ✓ |
| price | ✗ (string placeholder) | ✓ (number) |
| expense_ratio | ✗ | ✓ |
| aum | ✗ | ✓ |
| num_holdings | ✗ | ✓ |
| holdings array | ✗ | ✓ |

### Fields NOT Available at Any Tier

- category / sector classification
- issuer / fund family
- leveraged flag
- inverse flag
- ETF vs. ETN distinction
- options availability
- average volume (shares)

### Call Economics

- Response time: ~1 second per call
- No rate-limit headers in responses (quota likely enforced server-side without feedback)
- Free tier quota: unknown (not documented in response)
- Full universe enumeration (`/v1/etflist`): requires Business+ tier; paginated 1000/page; total ETF count unknown
- Search (`/v1/etfsearch`): requires Business+ tier; 50 results/page; filters by AUM, expense ratio, holdings, country

### CORS

- `access-control-allow-origin: *` — browser-based calls work without proxy
- `access-control-allow-headers: *` — all custom headers permitted

### Error Behavior

- Invalid ticker: returns empty object `{}` with HTTP 200
- Subscription-blocked endpoints: return `{"error": "..."}` with HTTP 400
- No rate-limit headers or quota information in any response

---

## Suitability Assessment

### For Universe Discovery (automated crawling)

**CONDITIONALLY VIABLE — requires paid tier.**

- `/v1/etflist` can enumerate the full ETF universe (Business+ subscription required)
- `/v1/etfsearch` can filter by AUM/expense/country (Business+ required)
- Missing: category, leveraged/inverse flags, options availability, volume
- Leveraged/inverse must be inferred from ETF name (heuristic, not authoritative)
- No way to determine if an ETF has listed options — requires separate Tradier verification
- ~1s per call means full enumeration (thousands of ETFs) takes significant time

### For Velvet Rope Admission (validating known symbols)

**MARGINALLY USEFUL on free tier.**

- Can confirm a ticker is a valid ETF and get its name, ISIN, country
- Cannot get AUM, expense ratio, or holdings on free tier
- Cannot batch-query or search/filter on free tier
- Single-ticker lookup only: one API call per symbol

### For the Current Curated Universe (16 symbols)

**MINIMALLY USEFUL.** Tradier already provides price and options data. API Ninjas adds only: ISIN, CUSIP, and official name. Not enough incremental value to justify per-symbol API calls when names are already known.

---

## Recommendation

**Conditionally viable for future Discovery Engine, but not immediately useful for the first Velvet Rope slice.**

| Use case | Viability | Prerequisite |
|----------|-----------|--------------|
| Discovery Engine (broad crawl) | Viable | Business/Professional/Annual subscription (~$20-50/month) |
| Velvet Rope first slice | Not needed | Existing curated list is sufficient; Tradier provides market data |
| Enrichment (AUM, expense) | Viable | Premium subscription for AUM/expense fields |
| Leveraged/inverse detection | Partial | Name inference works but is heuristic |
| Options availability | Not available | Must verify via Tradier separately |

### Next Steps (when Discovery workstream begins)

1. Evaluate subscription cost vs. value for Business/Annual tier
2. Test `/v1/etflist` pagination to determine total ETF universe size
3. Test `/v1/etfsearch` filter quality (does AUM filter reliably?)
4. Cross-reference with Tradier to verify which discovered ETFs have options
5. Consider supplementary providers for category/sector classification

### For Now

- The spike has retired the integration risk: we know the API shape, auth, limitations, and tier requirements
- No subscription upgrade needed for Velvet Rope first slice (it uses Tradier market data against a known registry)
- The `EtfCatalogProvider` interface and Explorer page remain available for future use
- API Ninjas integration cost is quantified: Business tier would enable enumeration and search

---

## Security Notes

- `VITE_API_NINJAS_KEY` is exposed in browser-bundled JavaScript
- Acceptable for local prototype; must move to server-side proxy before any cloud deployment
- Key should not be logged, displayed in UI, or committed to version control
- `.env.local` is already in `.gitignore`

---

## Files Produced

- `src/providers/etf-catalog/types.ts` — domain types (EtfReference, provider interface)
- `src/providers/etf-catalog/ApiNinjasEtfCatalogProvider.ts` — live provider
- `src/providers/etf-catalog/MockEtfCatalogProvider.ts` — mock for testing
- `src/providers/etf-catalog/index.ts` — barrel export
- `src/components/EtfCatalogExplorer.tsx` — engineering page
- `docs/engineering-spikes/api-ninjas-etf-catalog.md` — this document
