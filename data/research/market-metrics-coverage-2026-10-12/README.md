# tastytrade /market-metrics — full-universe coverage probe (2026-10-12)

Bounded, read-only coverage measurement supporting the interim v1 IV Rank feature
(see the 2026-10-12 journal note in `docs/journal/project-journal-5.md`). Research
artifact only — no durable Wheelwright state, no provider/CLI/API/persistence
change is authorized by this directory.

## What was measured

Every symbol in `data/seeds/yahoo-merged-etf-tickers.csv` (1,313) was requested
from tastytrade `/market-metrics` in batched, paced, read-only GETs. For each
symbol the probe recorded presence and the per-field presence of the metrics the
interim feature surfaces. **Missing symbols and missing fields are recorded
separately** — a symbol can be served while a given field is absent.

## Files

- `coverage-summary.json` — aggregate counts (symbols present/missing, per-field
  present counts, IV-rank null-among-present, a sample of missing symbols).
- `coverage-matrix.csv` — per-symbol row: `symbol,present,ivRank,ivRankSource,ivPercentile,hv30,ivUpdatedAt`.
- `probe.py` — the exact probe script (reads credentials from env, prints no secrets).

## Headline result (2026-10-12)

- Symbols present: 1308 / 1313 (99.6%); 5 missing (exotic/foreign: JJETF, DAGXF, OLOXF, BWVTF, IGX).
- IV Rank present: 990 (~75% of universe); 318 present symbols have a null IV Rank.
- IV Percentile: 934 · IV Index: 950 · tos-rank: 988 · tw-rank: 934.
- Historical-vol-30: 183 (~14%) — sparse; `ivHv30Difference` likewise sparse.

Implication: IV Rank is trustworthy for roughly three-quarters of the universe;
the display must (and does) render `—` for the remainder rather than fabricating a
value. The two methodology ranks have different coverage, reinforcing the
no-average / no-substitute rule.

## Reproduce

```bash
# From the repo root, with tastytrade creds in the environment:
TT_CID=... TT_SECRET=... TT_RTOK=... \
  python3 data/research/market-metrics-coverage-2026-10-12/probe.py
```
