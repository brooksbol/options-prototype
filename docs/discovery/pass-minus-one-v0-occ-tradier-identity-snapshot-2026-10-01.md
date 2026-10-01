# Pass −1 v0 — OCC population and Tradier identity evidence snapshot

**Status:** Principal-adopted, frozen research evidence snapshot (2026-10-01).

**Authority scope:** the dated declared population, evidence capture, and accountable identity states only. This is not a Wheelwright eligibility universe, exclusion policy, permanent optionability assertion, market-quality finding, or Exit Reliability result.

**Canonical intake:** `PL-RESEARCH-01` Universe Discovery.
**Evidence artifact:** [`data/research/pass-minus-one-v0-2026-09-30/artifact-manifest.json`](../../data/research/pass-minus-one-v0-2026-09-30/artifact-manifest.json) and its SHA-256-identified `evidence.tar.gz`.

## Principal decision and frozen boundary

The Principal adopted Pass −1 v0 after reviewing the full crosswalk. The object frozen here is the **dated declared opportunity population and its identity evidence**, with all unresolved identities still present. Later research may transform or annotate this snapshot, but must preserve its two denominators and not rewrite v0 to make later mappings appear certain.

The method begins with the 2026-09-30 OCC listed-options report, retains ordinary `EU` and `IU` class rows, and identifies both the OCC underlying symbol and option-class symbol for each row. Four Cboe reference files retrieved 2026-10-01 provide product/reference metadata and exact-symbol comparison; Cboe absence is not an exclusion. Tradier production option-symbol lookup supplies time-bounded observable provider roots and contract strings. Explicit follow-up probes for two punctuation aliases and empty exact lookups remain separate evidence, not silent normalization.

This v0 capture has **6,072 distinct OCC underlyings** and **6,381 ordinary OCC option-class rows**. Both denominators are permanent parts of v0. Neither can substitute for the other: an underlying can resolve while an OCC option class remains absent from the provider response.

## Closed accounting

| Underlying identity state | Count |
| --- | ---: |
| Exact OCC query returned option roots | 6,025 |
| Explicit slash alias returned option roots (`BRK/B`, `BF/B`) | 2 |
| Exact underlying search hit, but option lookup returned no roots | 12 |
| Empty option lookup and no exact secondary search hit; identity unresolved | 33 |
| **Total** | **6,072** |

| OCC class identity state | Count |
| --- | ---: |
| Exact OCC class root reported from exact underlying query | 6,278 |
| Exact OCC class root reported through an explicit slash alias | 2 |
| Underlying returned options, but OCC class root absent | 52 |
| Exact underlying search hit, but option lookup returned no roots | 13 |
| Underlying identity unresolved after empty option and secondary lookups | 36 |
| **Total** | **6,381** |

Acquisition closed at **6,072/6,072 HTTP 200** exact OCC underlying requests, with **6,072/6,072 raw bodies SHA-256 verified**. The 47 empty exact option lookups received separate exact-symbol search requests: 12 yielded exact underlying identities, two had explicit slash-alias evidence, and 33 remain unresolved. An absent exact search hit is not evidence of provider absence. No `underlying not found` conclusion is asserted.

## Identity distinctions retained

- OCC `SPX`, `SPX9`, and `SPXW` are distinct class rows. Tradier returned `SPX` and `SPXW` under `SPX`; `SPX9` remains class unresolved.
- Tradier returned both `TSLL` and `TSLL1` roots under `TSLL`. The numbered class is observed as its own identity, not collapsed into `TSLL`.
- The OCC spellings `BRKB` and `BFB` returned empty exact option lookups. Explicit Tradier queries `BRK/B` and `BF/B` returned roots `BRKB` and `BFB`; dotted `BRK.B` and `BF.B` queries were empty. Only these observed alias edges are recorded.
- Exact underlying queries returned multiple provider roots for 233 underlyings. Two reported roots were outside that queried underlying's OCC class set: `HON1` under `HONA`, and `DD1` under `Q`. They remain separate observed anomalies.
- Of the 323 OCC class rows with numeric suffixes relative to their underlying, 279 had exact provider-root observations. The rest remain in their respective unresolved states. Numeric form is a cohort label, not an adjusted-class exclusion rule.
- 735 OCC underlyings lack an exact symbol in the four Cboe reference files. Exact OCC spelling queries returned Tradier roots for 690 of them; the other 45 were empty, including the two subsequently resolved slash aliases. Source/date/scope differences remain labeled rather than filtered away.

The 30-root panel from earlier instrumentation is a fixture and carries no representativeness claim in this snapshot.

## Reproduction and integrity

The manifest records SHA-256 hashes for the immutable archive, declared population, full capture manifest, analysis summary, and both row-level analysis files. The archive contains frozen OCC/Cboe source bytes, all raw Tradier option responses, explicit alias and empty-lookup follow-ups, scripts used for capture and accounting, and the detailed report. Raw responses retain provider groupings and contract strings; derived states point back to hashes and body filenames. The analyzed lookup response shape is the shape actually observed in these bodies.

To verify the archive without any provider calls:

```sh
shasum -a 256 data/research/pass-minus-one-v0-2026-09-30/evidence.tar.gz
tar -tzf data/research/pass-minus-one-v0-2026-09-30/evidence.tar.gz | wc -l
```

Compare the digest with `artifact-manifest.json`; the archive contains 6,140 files. Rerunning the methodology would produce a **new dated observation**, not mutate this one. No live recapture is part of verification.

## Subsequent transformations

The next stages may investigate unresolved identities, structural classification, current provider optionability, standardized specimens, market quality, and Exit Reliability. They must state their own rules and retain a trace to this frozen population. Pass −1 v0 itself contains no exclusion decisions for test symbols, numbered classes, OCC-only symbols, or unresolved mappings, and makes no market-quality choice.
