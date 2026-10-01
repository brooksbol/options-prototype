# Bounded specimen-selection pilot — Pass 0 evidence sufficiency

**Status:** Exploratory research result (Category E), not a specimen-selection rule or eligibility decision.

**Canonical intake:** `PL-RESEARCH-01`; follows the Principal-adopted [Pass 0 v1 geometry method](pass-zero-v1-class-geometry-method-2026-10-01.md).

**Evidence:** [`data/research/specimen-selection-pilot-2026-10-01/evidence.tar.gz`](../../data/research/specimen-selection-pilot-2026-10-01/evidence.tar.gz), SHA-256 `7fa69cd3dec0a32b5dd4ec3ee9a805c781088a2c7a9019f7cd6d80e387e6bfdc`. Its manifests identify and hash every raw response. The archived scripts show the exact requests. No trade or account endpoint was used.

## Bounded observation

On 2026-10-01, one read-only Tradier production pilot acquired quote, daily history (2026-07-01 through 2026-10-01), all-root expirations, and the 2026-11-20 chain with Greeks for eight predeclared underlyings: `SPY`, `QQQ`, `XSP`, `SPX`, `TSLL`, `BRK/B`, `DRAM`, and `TLT`. A single supplemental `TSLL` chain request targeted 2027-01-15 to inspect the adjusted-looking `TSLL1` class observed in Pass −1. All **33/33 requests returned HTTP 200**, and all 33 raw bodies passed SHA-256 verification. This is a contrast panel, not a universe census or a market-quality sample.

The November expiration was 50 calendar days away. Tradier returned 65 daily history bars for each queried underlying; the latest daily close equaled the observed quote `last` in all eight. That establishes availability on this panel, not adjustment semantics or a general historical-data guarantee. The [Tradier quote](https://docs.tradier.com/reference/brokerage-api-markets-get-quotes), [history](https://docs.tradier.com/reference/brokerage-api-markets-get-history), and [chain](https://docs.tradier.com/reference/brokerage-api-markets-get-options-chains) endpoints supply these distinct evidence surfaces.

## Contrastive identity and geometry findings

| Frozen OCC class | November 20 exact-root puts | Observation |
| --- | ---: | --- |
| `SPY` | 221 | Ordinary ETF class present |
| `QQQ` | 248 | Ordinary ETF class present |
| `XSP` | 309 | Index class present |
| `SPX` | 472 | Index class present |
| `SPXW` | 420 | **Separate root** in the same `SPX` chain and same expiration |
| `SPX9` | 0 observed | Pass −1 class identity remains unresolved; one absent chain root does not resolve it |
| `TSLL` | 25 | Ordinary class present |
| `TSLL1` | 0 observed | Adjusted class present at 2027-01-15 (62 puts), not at this November expiration |
| `BRKB` | 72 | Returned through explicit underlying alias query `BRK/B` |
| `DRAM` | 40 | ETF class present |
| `TLT` | 48 | ETF class present |

Both `SPX` and `SPXW` November contracts reported `expiration_type: standard`; expiration type alone cannot replace exact root identity. The January `TSLL` chain contained both `TSLL` and `TSLL1`, with `contract_size: 100` for both. [OCC Information Memo #57857](https://infomemo.theocc.com/infomemos?number=57857) establishes that the `TSLL1` adjustment included **100 TSLL shares plus $57.94 cash** per contract at its effective date and supplied a class-specific pricing relationship. Current adjusted terms must be checked against applicable OCC authority before an economic comparison; Tradier's `contract_size` does not encode the cash component.

## Deliberately provisional risk-coordinate falsification

To pressure-test one option-price-blind selection family, the pilot used the quoted underlying `last` as reference price `S` and annualized standard deviation of the last 60 available close-to-close log returns as `RV60`. For the 50-day expiration, it selected the nearest available put strikes to log-moneyness coordinates `z = ln(K/S) / (RV60 × sqrt(50/365))` of −0.5 (short) and −1.0 (long). This is a **diagnostic calculation only**. It uses no option spread, volume, open interest, or quote-quality field to select contracts, but it does not establish comparable risk or a ratified tolerance.

| Class | Nearest short `z` | Observed short delta | Nearest long `z` | Observation |
| --- | ---: | ---: | ---: | --- |
| `SPY` | −0.486 | −0.3147 | −1.015 | Fine strike grid |
| `QQQ` | −0.492 | −0.2987 | −1.001 | Fine strike grid |
| `XSP` | −0.499 | −0.3154 | −0.988 | Fine strike grid |
| `SPX` | −0.499 | −0.3230 | −1.004 | Separate from `SPXW` |
| `SPXW` | −0.499 | −0.3170 | −1.004 | Same strikes, different class and Greeks |
| `BRKB` | −0.416 | −0.3103 | −1.026 | Explicit slash alias needed for `S` |
| `DRAM` | −0.477 | −0.2190 | −1.028 | Higher realized volatility |
| `TLT` | −0.602 | −0.3380 | −0.960 | Coarser target match |
| `TSLL` | −0.643 | −0.1704 | −1.043 | Coarser target match; leveraged ETF |

The short deltas range from −0.1704 to −0.3380 even after this realized-volatility scaling. Delta is a diagnostic here, not a probability, eligibility score, or proof that the coordinate is risk-comparable. A nearest-strike algorithm without a declared tolerance would silently accept `TSLL` and `TLT` despite materially larger coordinate misses. A fixed tolerance would instead produce explicit unmatched observations. The choice and justification of that tolerance remain open.

## Evidence-contract finding and next question

The adopted Pass 0 geometry record can preserve the exact class, contracts, expirations, and strike lattice needed to identify candidate contracts. **Geometry alone cannot replay a price- or volatility-scaled Pass 1 selector.** Such a selector additionally needs timestamped underlying reference prices, a declared historical-volatility source and adjustment convention, and applicable class deliverables. These inputs can be captured as a separately versioned Pass 1 reference-evidence bundle paired to a Pass 0 observation; deciding whether to acquire them during the Pass 0 run is an acquisition-design question, not a reason to redefine geometry as eligibility.

No unique specimen-selection rule is frozen by this pilot. Before one can be adopted, a bounded follow-up must compare candidate risk coordinates and expiration-phase schedules, establish class-specific adjustment treatment, predeclare strike error tolerance and unmatched behavior, and test replay using timestamped reference evidence. The full-population Pass 0 crawl remains downstream of that evidence-contract decision.
