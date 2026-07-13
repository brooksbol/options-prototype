# Engineering Spike: FMP ETF Reference Data

## Purpose

Determine whether Financial Modeling Prep (FMP) is a viable ETF Reference Data provider by characterizing its endpoints, coverage, field richness, and subscription boundaries.

## Principle

Data integration risk should be retired before building dependent automation. The Velvet Rope and future Discovery Engine need a programmatic ETF catalog source. Previous spikes established that SEC is incomplete for ETFs and API Ninjas requires a paid tier for enumeration. FMP is the next candidate.

---

## Findings

### Authentication

- API key via `VITE_FMP_API_KEY` in `.env.local`: **WORKS**
- Key passed as `apikey` query parameter
- Security: VITE-prefixed key is exposed in browser code. Must move server-side before cloud deployment.

### Endpoints Tested

| Endpoint | Purpose | Status | Plan Required |
|----------|---------|--------|---------------|
| `/stable/profile?symbol=X` | Single-symbol full profile | ✓ Works | Current (free/starter) |
| `/stable/search-name?query=X` | Name search | ✓ Works | Current |
| `/stable/search-symbol?query=X` | Symbol prefix search | ✓ Works | Current |
| `/stable/etf-list` | Full ETF enumeration | ✗ 402 Paywalled | Higher tier |
| `/stable/available-exchanges` | Exchange list | ✗ 402 Paywalled | Higher tier |
| `/stable/etf-holdings?symbol=X` | ETF holdings | ✗ 404 | Unknown (wrong path or paywalled) |
| `/stable/etf-sector-weightings?symbol=X` | Sector allocation | ✗ 404 | Unknown |
| `/stable/etf-country-weightings?symbol=X` | Country allocation | ✗ 404 | Unknown |
| `/stable/etf-expense-ratio?symbol=X` | Expense ratio | ✗ 404 | Unknown |
| `/api/v3/*` (legacy) | All legacy endpoints | ✗ 403 | Deprecated (pre-Aug 2025 only) |
| Batch profile (comma-separated) | Multi-symbol | ✗ Empty | Not supported on current plan |

### Coverage Test

| Symbol | Found | isEtf | Name |
|--------|-------|-------|------|
| SPY | ✓ | true | State Street SPDR S&P 500 ETF |
| XLE | ✓ | true | State Street Energy Select Sector SPDR ETF |
| SCHD | ✓ | true | Schwab U.S. Dividend Equity ETF |
| QQQ | ✓ | true | Invesco QQQ Trust, Series 1 |
| TLT | ✓ | true | iShares 20+ Year Treasury Bond ETF |
| QETH | ✓ | true | Invesco Galaxy Ethereum ETF |
| QSOL | ✗ | — | Not found |

**6 of 7 found.** QSOL not in FMP database (possibly too new or not tracked).

**Key finding: All major ETFs that the SEC catalog missed (SPY, XLE, SCHD) are present in FMP when queried explicitly.** FMP provides a provider-supplied `isEtf` boolean. However, this does not make them discoverable — you must already know the symbol to ask.

### Profile Fields Available (per-symbol)

All fields from `/stable/profile`:

| Field | Present | Type | Example |
|-------|---------|------|---------|
| symbol | ✓ | string | "XLE" |
| companyName | ✓ | string | "State Street Energy Select Sector SPDR ETF" |
| price | ✓ | number | 54.86 |
| marketCap | ✓ | number | 26500000000 |
| beta | ✓ | number | 1.0 |
| exchange | ✓ | string | "AMEX" |
| exchangeFullName | ✓ | string | "New York Stock Exchange Arca" |
| industry | ✓ | string | "Asset Management" |
| sector | ✓ | string | "Financial Services" |
| country | ✓ | string | "US" |
| currency | ✓ | string | "USD" |
| isEtf | ✓ | boolean | true |
| isFund | ✓ | boolean | false |
| isActivelyTrading | ✓ | boolean | true |
| isAdr | ✓ | boolean | false |
| isin | ✓ | string | "US81369Y5069" |
| cusip | ✓ | string | "81369Y506" |
| cik | ✓ | string | "0000884394" |
| ipoDate | ✓ | string | "1998-12-22" |
| description | ✓ | string | (full fund description) |
| lastDividend | ✓ | number | 7.525 |
| range | ✓ | string | "618.05-760.4" |
| volume | ✓ | number | 22651586 |
| averageVolume | ✓ | number | 53460908 |

**Missing from FMP profile (compared to what we'd ideally want):**
- Expense ratio (not in profile; ETF-specific endpoint 404s)
- AUM (marketCap available but not AUM specifically)
- Fund category/investment objective
- Leveraged/inverse flag (must infer from name or industry)
- Holdings list

### Call Economics

- Response time: ~300ms per call
- No rate-limit headers observed
- No batch/multi-symbol support on current plan
- Single-symbol only: 1 API call per ETF lookup

### CORS

Not tested from browser directly. Likely works (FMP is designed for developer access) but should verify if needed.

---

## Provider Comparison Matrix

| Capability | SEC | API Ninjas (Free) | FMP (Current) |
|-----------|-----|-------------------|---------------|
| Full ETF enumeration | ✗ (incomplete) | ✗ (paywalled) | ✗ (paywalled) |
| Single-symbol lookup | N/A | ✓ (basic) | ✓ (rich) |
| Name/symbol search | N/A | N/A | ✓ |
| SPY present | ✗ | ✓ | ✓ |
| XLE present | ✗ | ✓ | ✓ |
| SCHD present | ✗ | ✓ | ✓ |
| `isEtf` classification | ✗ | ✗ | **✓** |
| Exchange | ✓ | ✓ | ✓ |
| Price | ✗ | ✗ (paywalled) | ✓ |
| Market Cap | ✗ | ✗ (paywalled) | ✓ |
| Industry/Sector | ✗ | ✗ | ✓ |
| ISIN/CUSIP | ✗ | ✓ | ✓ |
| Description | ✗ | ✗ | ✓ |
| Expense ratio | ✗ | ✗ (paywalled) | ✗ (404) |
| Leveraged/inverse flag | ✗ | ✗ (infer from name) | ✗ (infer from name) |

---

## Suitability Assessment

### For Velvet Rope (validating known symbols)

**VIABLE.** The profile endpoint provides rich data for any known ticker including the critical `isEtf` boolean, price, market cap, industry/sector, exchange, and identifiers. This is significantly richer than both SEC and API Ninjas free tier.

### For Discovery (finding unknown ETFs)

**CONDITIONALLY VIABLE.** Name/symbol search works, enabling human-guided exploration. But automated full-universe enumeration (`/stable/etf-list`) requires a paid tier upgrade.

### For Reference Data enrichment

**STRONG for known symbols.** Profile provides industry, sector, description, identifiers (ISIN, CUSIP, CIK), price, market cap, and provider-supplied `isEtf` classification. This enriches any symbol you already know to ask about. It does not make undiscovered symbols appear — that still requires an enumerable catalog source or search.

---

## Recommendation

**VIABLE — strongest single-symbol provider tested so far.**

| Use case | Viability |
|----------|-----------|
| Confirm ETF classification for known symbols | ✓ Excellent |
| Enrich curated universe with metadata | ✓ Excellent |
| Human-guided discovery via search | ✓ Good |
| Automated full-universe enumeration | ✗ Requires paid upgrade |
| Expense ratio / AUM / holdings | ✗ Not available on current plan |

### Immediate value (no subscription change needed)

- Validate any symbol from SEC Explorer as ETF before sending to Velvet Rope
- Enrich Velvet Rope audit records with industry/sector/description
- Support human Discovery workflow with name and symbol search

### Future value (with subscription upgrade)

- `/stable/etf-list` would enable complete ETF universe enumeration
- ETF-specific endpoints may provide expense ratio, holdings, sector weightings

---

## Licensing Research (Preliminary)

- Current plan appears to be "Starter" or "Free" tier
- Developer API access for personal/prototype use appears permitted
- Commercial redistribution rights: **unresolved** — would need to verify terms for cloud/multi-user deployment
- Raw data display in a local prototype: appears acceptable under developer terms
- Hosting for other users: **requires verification** of commercial license terms

---

## Security Notes

- `VITE_FMP_API_KEY` exposed in browser-bundled JavaScript
- Acceptable for local prototype; must move to server-side proxy before cloud deployment
- Key not logged or displayed in UI
- `.env.local` in `.gitignore`

---

## Files Produced

- `src/providers/fmp-catalog/types.ts` — domain types
- `src/providers/fmp-catalog/FmpEtfReferenceDataProvider.ts` — live provider
- `src/providers/fmp-catalog/index.ts` — barrel export
- `src/components/FmpExplorer.tsx` — engineering diagnostics page
- `tests/fmp-catalog/fmpProvider.test.ts` — 13 tests
- `docs/engineering-spikes/fmp-etf-reference-data.md` — this document
